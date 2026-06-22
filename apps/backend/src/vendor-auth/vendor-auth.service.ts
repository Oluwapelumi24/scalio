import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { staff, vendors } from '../db/schema';
import { MailService } from '../mail/mail.service';
import { VendorInviteService } from './vendor-invite.service';
import { VendorPasswordResetService } from './vendor-password-reset.service';

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
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly invites: VendorInviteService,
    private readonly passwordReset: VendorPasswordResetService,
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
      .where(eq(staff.email, email));

    if (!row) return;

    const code = await this.passwordReset.issueCode(email, row.id);
    await this.mail.sendPasswordResetEmail(email, code).catch(() => {/* swallow — same pattern as push notifications */});
  }

  /** Validates the reset code and sets a new password, returning a fresh session. */
  async resetPassword(email: string, code: string, newPassword: string): Promise<VendorSession> {
    const staffId = await this.passwordReset.consumeCode(email, code);
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

  async login(email: string, password: string): Promise<VendorSession> {
    const [row] = await this.db
      .select()
      .from(staff)
      .where(eq(staff.email, email));
    if (!row?.passwordHash || !(await compare(password, row.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password.');
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

  private vendorWebUrl(): string {
    return this.config.get<string>('VENDOR_WEB_URL') ?? 'http://localhost:3001';
  }
}
