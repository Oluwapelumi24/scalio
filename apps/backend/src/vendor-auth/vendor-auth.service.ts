import { ConflictException, Inject, Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq, like, sql, type InferSelectModel } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { staff, vendors } from '../db/schema';
import { MailService } from '../mail/mail.service';
import { VendorHandoffService } from './vendor-handoff.service';
import { VendorInviteService } from './vendor-invite.service';
import { VendorPasswordResetService } from './vendor-password-reset.service';
import { VendorSignupCodeService } from './vendor-signup-code.service';

const PASSWORD_HASH_ROUNDS = 10;

export interface VendorSession {
  accessToken: string;
  staff: {
    id: string;
    vendorId: string;
    name: string;
    email: string | null;
    role: InferSelectModel<typeof staff>['role'];
  };
}

@Injectable()
export class VendorAuthService {
  private readonly logger = new Logger(VendorAuthService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly invites: VendorInviteService,
    private readonly passwordReset: VendorPasswordResetService,
    private readonly signupCodes: VendorSignupCodeService,
    private readonly handoff: VendorHandoffService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Sends a one-time setup link to a platform-provisioned staff record that
   * hasn't activated yet. Always resolves quietly — an unknown email or an
   * already-active account looks identical to the caller, so this can't be
   * used to enumerate staff or hijack a live login.
   */
  async issueInvite(email: string): Promise<void> {
    const [row] = await this.db
      .select({
        staffId: staff.id,
        passwordHash: staff.passwordHash,
        businessName: vendors.businessName,
      })
      .from(staff)
      .innerJoin(vendors, eq(staff.vendorId, vendors.id))
      .where(eq(staff.email, email));

    if (!row || row.passwordHash) {
      return;
    }

    const token = await this.invites.issueToken(row.staffId);
    const acceptUrl = `${this.vendorWebUrl()}/accept-invite?token=${token}`;
    await this.mail.sendVendorInviteEmail(email, row.businessName, acceptUrl);
  }

  /** Claims an invite token, sets the account's password, and signs the staff member in. */
  async acceptInvite(token: string, password: string): Promise<VendorSession> {
    const staffId = await this.invites.consumeToken(token);
    if (!staffId) {
      throw new UnauthorizedException(
        'This invite link is invalid or has expired.',
      );
    }

    const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);
    const [updated] = await this.db
      .update(staff)
      .set({ passwordHash, lastLoginAt: new Date() })
      .where(eq(staff.id, staffId))
      .returning();
    if (!updated) {
      throw new UnauthorizedException(
        'This invite link is invalid or has expired.',
      );
    }

    return this.issueSession(updated);
  }

  /**
   * Quietly sends a 6-digit reset code to the email if it belongs to an
   * active staff account. Always resolves — never reveals whether the email
   * is known (same enumeration-protection principle as issueInvite).
   */
  async requestPasswordReset(email: string): Promise<void> {
    const [row] = await this.db
      .select({ id: staff.id })
      .from(staff)
      .where(sql`lower(${staff.email}) = ${email.trim().toLowerCase()}`);

    if (!row) return;

    const normalised = email.trim().toLowerCase();
    const code = await this.passwordReset.issueCode(normalised, row.id);
    // Cap exceeded — still 204, no email, no enumeration signal.
    if (!code) return;
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Password reset code for ${normalised} is ${code}`);
    }
    // Never fail the request (that would reveal the account exists), but say why the email didn't go.
    await this.mail.sendPasswordResetEmail(email, code).catch((err: unknown) => {
      this.logger.warn(`Password reset email to ${email} failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  /** Validates the reset code and sets a new password, returning a fresh session. */
  async resetPassword(email: string, code: string, newPassword: string): Promise<VendorSession> {
    let staffId: string | null;
    const normalised = email.trim().toLowerCase();
    if (this.passwordReset.isDevCode(code)) {
      const [row] = await this.db.select({ id: staff.id }).from(staff).where(sql`lower(${staff.email}) = ${normalised}`);
      staffId = row?.id ?? null;
    } else {
      staffId = await this.passwordReset.consumeCode(normalised, code);
    }
    if (!staffId) {
      throw new UnauthorizedException('Invalid or expired reset code.');
    }

    const passwordHash = await hash(newPassword, PASSWORD_HASH_ROUNDS);
    const [updated] = await this.db
      .update(staff)
      .set({ passwordHash, lastLoginAt: new Date() })
      .where(eq(staff.id, staffId))
      .returning();

    if (!updated) {
      throw new UnauthorizedException('Invalid or expired reset code.');
    }

    return this.issueSession(updated);
  }

  requestSignupCode(email: string): Promise<void> {
    return this.signupCodes.send(email);
  }

  confirmSignupCode(email: string, code: string): Promise<string> {
    return this.signupCodes.verify(email, code);
  }

  async register(
    ownerName: string,
    businessName: string,
    email: string,
    password: string,
    proof: string,
    registrationNumber?: string,
    category?: string,
    address?: string,
    phone?: string,
  ): Promise<VendorSession> {
    const normalised = email.trim().toLowerCase();
    const [existing] = await this.db.select({ id: staff.id }).from(staff).where(sql`lower(${staff.email}) = ${normalised}`);
    if (existing) throw new ConflictException('An account with this email already exists.');
    await this.signupCodes.consumeProof(normalised, proof);
    email = normalised;

    const baseSlug = businessName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const slug = await this.findUniqueSlug(baseSlug);
    const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);

    const [vendor] = await this.db
      .insert(vendors)
      .values({
        slug,
        businessName,
        category: category ?? 'Other',
        ownerName,
        ownerEmail: email,
        approvalStatus: 'pending_review',
        registrationNumber: registrationNumber ?? null,
        address: address?.trim() || null,
      })
      .returning();

    const [owner] = await this.db
      .insert(staff)
      .values({ vendorId: vendor.id, name: ownerName, email, role: 'owner', passwordHash, phone: phone?.trim() || null })
      .returning();

    return this.issueSession(owner);
  }

  async listing(vendorId: string) {
    const [row] = await this.db
      .select({
        businessName: vendors.businessName,
        category: vendors.category,
        approvalStatus: vendors.approvalStatus,
        reviewNote: vendors.reviewNote,
      })
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!row) throw new NotFoundException('Business not found.');
    return row;
  }

  async login(email: string, password: string): Promise<VendorSession> {
    const [row] = await this.db
      .select()
      .from(staff)
      .where(sql`lower(${staff.email}) = ${email.trim().toLowerCase()}`);
    if (!row?.passwordHash || !(await compare(password, row.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password.');
    }

    await this.db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, row.id));
    return this.issueSession(row);
  }

  /** One-time code so the marketing site can open the dashboard without putting the JWT in the URL. */
  async createHandoff(staffId: string): Promise<{ code: string }> {
    const code = await this.handoff.issue(staffId);
    return { code };
  }

  async exchangeHandoff(code: string): Promise<VendorSession> {
    const staffId = await this.handoff.consume(code);
    const row = await this.findActiveStaffById(staffId);
    if (!row) {
      throw new UnauthorizedException('This link has expired. Sign in again.');
    }
    await this.db
      .update(staff)
      .set({ lastLoginAt: new Date() })
      .where(eq(staff.id, row.id));
    return this.issueSession(row);
  }

  /** Used by the JWT strategy to re-resolve the principal on every request — a deactivated account stops authenticating immediately. */
  async findActiveStaffById(
    staffId: string,
  ): Promise<InferSelectModel<typeof staff> | null> {
    const [row] = await this.db
      .select()
      .from(staff)
      .where(eq(staff.id, staffId));
    return row?.passwordHash ? row : null;
  }

  private issueSession(row: InferSelectModel<typeof staff>): VendorSession {
    const accessToken = this.jwt.sign({
      sub: row.id,
      vendorId: row.vendorId,
      role: row.role,
    });
    return {
      accessToken,
      staff: {
        id: row.id,
        vendorId: row.vendorId,
        name: row.name,
        email: row.email,
        role: row.role,
      },
    };
  }

  private async findUniqueSlug(baseSlug: string): Promise<string> {
    const rows = await this.db
      .select({ slug: vendors.slug })
      .from(vendors)
      .where(like(vendors.slug, `${baseSlug}%`));
    const taken = new Set(rows.map(r => r.slug));
    if (!taken.has(baseSlug)) return baseSlug;
    let i = 2;
    while (taken.has(`${baseSlug}-${i}`)) i++;
    return `${baseSlug}-${i}`;
  }

  private vendorWebUrl(): string {
    return this.config.get<string>('VENDOR_WEB_URL') ?? 'http://localhost:3001';
  }
}
