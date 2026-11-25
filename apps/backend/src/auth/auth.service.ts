import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  forwardRef,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { and, eq, gt, inArray, or, sql, type InferSelectModel } from 'drizzle-orm';
import { BookingService } from '../booking/booking.service';
import { DB, type Database } from '../db/db.module';
import {
  ACTIVE_BOOKING_STATUSES,
  bookings,
  conversations,
  customers,
  leads,
  users,
} from '../db/schema';
import { MailService } from '../mail/mail.service';
import { UserPasswordResetService } from './user-password-reset.service';

const DELETED_CUSTOMER_NAME = 'Deleted customer';

const PASSWORD_HASH_ROUNDS = 10;

/** Keeps 0803… and +234… and drops spaces. Returns null when it is not a usable number. */
export function normalizePhone(raw: string): string | null {
  const compact = raw.trim().replace(/[\s()-]/g, '');
  if (!/^\+?[0-9]{10,15}$/.test(compact)) return null;
  return compact;
}

export interface UserSession {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly passwordReset: UserPasswordResetService,
    private readonly mail: MailService,
    @Inject(forwardRef(() => BookingService)) private readonly bookings: BookingService,
  ) {}

  async signUp(name: string, email: string, password: string, phone?: string): Promise<UserSession> {
    const [existing] = await this.db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing) {
      throw new ConflictException('An account with this email already exists.');
    }

    const normalized = phone ? normalizePhone(phone) : null;
    if (phone && !normalized) {
      throw new BadRequestException('Enter a mobile number the business can call, like 0803 000 0000.');
    }

    const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);
    const [created] = await this.db
      .insert(users)
      .values({ name, email, passwordHash, phone: normalized })
      .returning();
    return this.issueSession(created);
  }

  async setPhone(userId: string, phone: string) {
    const normalized = normalizePhone(phone);
    if (!normalized) {
      throw new BadRequestException('Enter a mobile number the business can call, like 0803 000 0000.');
    }
    const [updated] = await this.db
      .update(users)
      .set({ phone: normalized })
      .where(eq(users.id, userId))
      .returning({ id: users.id, phone: users.phone });
    if (!updated) throw new NotFoundException(`User ${userId} not found`);
    return updated;
  }

  async signIn(email: string, password: string): Promise<UserSession> {
    const [row] = await this.db.select().from(users).where(eq(users.email, email));
    if (
      !row ||
      row.deletedAt ||
      !row.passwordHash ||
      !(await compare(password, row.passwordHash))
    ) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    return this.issueSession(row);
  }

  /** Used by the JWT strategy to re-resolve the principal on every request. */
  async findById(userId: string): Promise<InferSelectModel<typeof users> | null> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId));
    return row ?? null;
  }

  /** Stores the Expo push token the mobile app obtained after the user granted notification permission. */
  async registerPushToken(userId: string, token: string): Promise<void> {
    const [updated] = await this.db
      .update(users)
      .set({ expoPushToken: token })
      .where(eq(users.id, userId))
      .returning({ id: users.id });
    if (!updated) {
      throw new NotFoundException(`User ${userId} not found`);
    }
  }

  /** Always resolves — never reveals whether the email is known. */
  async requestPasswordReset(email: string): Promise<void> {
    const normalised = email.trim().toLowerCase();
    const [row] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(sql`lower(${users.email}) = ${normalised}`);
    if (!row) return;

    const code = await this.passwordReset.issueCode(normalised, row.id);
    if (!code) return;
    if (process.env.NODE_ENV !== 'production') {
      this.logger.log(`Password reset code for ${normalised} is ${code}`);
    }
    await this.mail.sendPasswordResetEmail(email, code).catch((err: unknown) => {
      this.logger.warn(`Password reset email to ${email} failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<UserSession> {
    const normalised = email.trim().toLowerCase();
    const userId = await this.passwordReset.consumeCode(normalised, code);
    if (!userId) throw new UnauthorizedException('Invalid or expired reset code.');

    const passwordHash = await hash(newPassword, PASSWORD_HASH_ROUNDS);
    const [updated] = await this.db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
      .returning();
    if (!updated) throw new UnauthorizedException('Invalid or expired reset code.');
    return this.issueSession(updated);
  }

  /**
   * Requires the current password. Cancels upcoming bookings, anonymises the
   * user and every linked vendor CRM / lead / inbox name copy, then emails
   * confirmation. Historical bookings and ledger amounts are kept for vendors.
   */
  async deleteAccount(userId: string, password: string): Promise<void> {
    const [row] = await this.db.select().from(users).where(eq(users.id, userId));
    if (
      !row ||
      row.deletedAt ||
      !row.passwordHash ||
      !(await compare(password, row.passwordHash))
    ) {
      throw new UnauthorizedException('Incorrect password.');
    }

    const capturedEmail = row.email;
    const capturedName = row.name;

    const future = await this.db
      .select({ id: bookings.id })
      .from(bookings)
      .innerJoin(customers, eq(bookings.customerId, customers.id))
      .where(
        and(
          eq(customers.userId, userId),
          inArray(bookings.status, [...ACTIVE_BOOKING_STATUSES]),
          gt(bookings.scheduledAt, new Date()),
        ),
      );

    for (const booking of future) {
      await this.bookings.cancelByCustomer(booking.id, 'Account deleted');
    }

    await this.db.transaction(async (tx) => {
      const linked = await tx
        .select({ id: customers.id })
        .from(customers)
        .where(eq(customers.userId, userId));
      const customerIds = linked.map((c) => c.id);

      await tx
        .update(customers)
        .set({
          name: DELETED_CUSTOMER_NAME,
          phone: null,
          email: null,
          notes: null,
          userId: null,
        })
        .where(eq(customers.userId, userId));

      // Leads copy name/phone/email; wipe when linked to this user's CRM rows
      // or when they already store the same email.
      const leadMatch =
        customerIds.length > 0
          ? or(
              inArray(leads.customerId, customerIds),
              sql`lower(${leads.email}) = ${capturedEmail.trim().toLowerCase()}`,
            )
          : sql`lower(${leads.email}) = ${capturedEmail.trim().toLowerCase()}`;

      const matchedLeads = await tx.select({ id: leads.id }).from(leads).where(leadMatch);
      if (matchedLeads.length > 0) {
        const leadIds = matchedLeads.map((l) => l.id);
        await tx
          .update(leads)
          .set({
            name: DELETED_CUSTOMER_NAME,
            phone: null,
            email: null,
            note: null,
            updatedAt: new Date(),
          })
          .where(inArray(leads.id, leadIds));
        // Inbox conversations may show a Meta/WhatsApp display name; clear when
        // tied to a lead we just scrubbed.
        await tx
          .update(conversations)
          .set({ customerName: DELETED_CUSTOMER_NAME, updatedAt: new Date() })
          .where(inArray(conversations.leadId, leadIds));
      }

      await tx
        .update(users)
        .set({
          name: 'Deleted user',
          email: `deleted+${userId}@tombstone.invalid`,
          phone: null,
          passwordHash: null,
          expoPushToken: null,
          deletedAt: new Date(),
        })
        .where(eq(users.id, userId));
    });

    await this.mail.sendAccountDeletedEmail(capturedEmail, capturedName).catch((err: unknown) => {
      this.logger.warn(
        `Account-deleted email to ${capturedEmail} failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    });
  }

  private issueSession(row: InferSelectModel<typeof users>): UserSession {
    const accessToken = this.jwt.sign({ sub: row.id });
    return {
      accessToken,
      user: { id: row.id, name: row.name, email: row.email },
    };
  }
}
