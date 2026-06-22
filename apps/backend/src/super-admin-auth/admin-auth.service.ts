import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { eq, type InferSelectModel } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { admins } from '../db/schema';
import { MailService } from '../mail/mail.service';
import { AdminInviteService } from './admin-invite.service';
import { AdminPasswordResetService } from './admin-password-reset.service';

const PASSWORD_HASH_ROUNDS = 10;

export interface AdminSession {
  accessToken: string;
  admin: { id: string; name: string; email: string };
}

@Injectable()
export class AdminAuthService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly invites: AdminInviteService,
    private readonly passwordReset: AdminPasswordResetService,
    private readonly mail: MailService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueInvite(email: string): Promise<void> {
    const [row] = await this.db.select().from(admins).where(eq(admins.email, email));
    if (!row) return;

    const token = await this.invites.issueToken(row.id);
    const acceptUrl = `${this.adminWebUrl()}/accept-invite?token=${token}`;
    await this.mail.sendAdminInviteEmail(email, acceptUrl);
  }

  async acceptInvite(token: string, password: string): Promise<AdminSession> {
    const adminId = await this.invites.consumeToken(token);
    if (!adminId) throw new UnauthorizedException('This invite link is invalid or has expired.');

    const passwordHash = await hash(password, PASSWORD_HASH_ROUNDS);
    const [updated] = await this.db
      .update(admins)
      .set({ passwordHash, lastLoginAt: new Date() })
      .where(eq(admins.id, adminId))
      .returning();

    if (!updated) throw new UnauthorizedException('This invite link is invalid or has expired.');
    return this.issueSession(updated);
  }

  async login(email: string, password: string): Promise<AdminSession> {
    const [row] = await this.db.select().from(admins).where(eq(admins.email, email));
    if (!row?.passwordHash || !(await compare(password, row.passwordHash))) {
      throw new UnauthorizedException('Incorrect email or password.');
    }
    await this.db.update(admins).set({ lastLoginAt: new Date() }).where(eq(admins.id, row.id));
    return this.issueSession(row);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const [row] = await this.db.select({ id: admins.id }).from(admins).where(eq(admins.email, email));
    if (!row) return;
    const code = await this.passwordReset.issueCode(email, row.id);
    await this.mail.sendPasswordResetEmail(email, code).catch(() => {});
  }

  async resetPassword(email: string, code: string, newPassword: string): Promise<AdminSession> {
    const adminId = await this.passwordReset.consumeCode(email, code);
    if (!adminId) throw new UnauthorizedException('Invalid or expired reset code.');

    const passwordHash = await hash(newPassword, PASSWORD_HASH_ROUNDS);
    const [updated] = await this.db
      .update(admins)
      .set({ passwordHash, lastLoginAt: new Date() })
      .where(eq(admins.id, adminId))
      .returning();

    if (!updated) throw new UnauthorizedException('Invalid or expired reset code.');
    return this.issueSession(updated);
  }

  async findActiveAdminById(adminId: string): Promise<InferSelectModel<typeof admins> | null> {
    const [row] = await this.db.select().from(admins).where(eq(admins.id, adminId));
    return row?.passwordHash ? row : null;
  }

  private issueSession(row: InferSelectModel<typeof admins>): AdminSession {
    const accessToken = this.jwt.sign({ sub: row.id });
    return { accessToken, admin: { id: row.id, name: row.name, email: row.email! } };
  }

  private adminWebUrl(): string {
    return this.config.get<string>('ADMIN_WEB_URL') ?? 'http://localhost:3002';
  }
}
