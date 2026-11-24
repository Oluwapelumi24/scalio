import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { staff } from '../db/schema';
import { VendorAuthService } from '../vendor-auth/vendor-auth.service';
import type { CreateStaffDto } from './dto/create-staff.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';

const EMAIL_TAKEN = 'This email already has a Veno login. Use a different email, or leave it blank if they only need to be on the calendar.';

@Injectable()
export class VendorStaffService {
  private readonly logger = new Logger(VendorStaffService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly vendorAuth: VendorAuthService,
  ) {}

  list(vendorId: string) {
    return this.db
      .select({
        id: staff.id,
        vendorId: staff.vendorId,
        name: staff.name,
        phone: staff.phone,
        email: staff.email,
        role: staff.role,
        hasActivatedAccount: sql<boolean>`${staff.passwordHash} is not null`,
        lastLoginAt: staff.lastLoginAt,
        createdAt: staff.createdAt,
      })
      .from(staff)
      .where(eq(staff.vendorId, vendorId));
  }

  /** Creates the staff record and, when an email is given, sends them an invite to activate dashboard access. */
  async create(vendorId: string, dto: CreateStaffDto) {
    const email = dto.email?.trim().toLowerCase() || null;
    const phone = dto.phone?.trim() || null;
    if (email) await this.assertEmailAvailable(email);

    let created: typeof staff.$inferSelect;
    try {
      [created] = await this.db
        .insert(staff)
        .values({
          vendorId,
          name: dto.name.trim(),
          phone,
          email,
          role: dto.role,
        })
        .returning();
    } catch (err) {
      if (isUniqueViolation(err)) throw new ConflictException(EMAIL_TAKEN);
      throw err;
    }

    // The person is already saved. A mail or Redis failure must not look like the add failed.
    let inviteSent = false;
    if (created.email) {
      try {
        await this.vendorAuth.issueInvite(created.email);
        inviteSent = true;
      } catch (err) {
        this.logger.error(
          `Staff ${created.id} was added but the invite email failed`,
          err instanceof Error ? err.stack : String(err),
        );
      }
    }

    return { ...created, inviteSent };
  }

  async update(vendorId: string, staffId: string, dto: UpdateStaffDto) {
    const email = dto.email === undefined ? undefined : dto.email.trim().toLowerCase();
    if (email) await this.assertEmailAvailable(email, staffId);

    const [updated] = await this.db
      .update(staff)
      .set({
        name: dto.name?.trim(),
        phone: dto.phone?.trim(),
        email,
        role: dto.role,
      })
      .where(and(eq(staff.id, staffId), eq(staff.vendorId, vendorId)))
      .returning();
    if (!updated) {
      throw new NotFoundException(`Staff member ${staffId} not found`);
    }
    return updated;
  }

  async remove(vendorId: string, staffId: string) {
    const [deleted] = await this.db
      .delete(staff)
      .where(and(eq(staff.id, staffId), eq(staff.vendorId, vendorId)))
      .returning({ id: staff.id });
    if (!deleted) {
      throw new NotFoundException(`Staff member ${staffId} not found`);
    }
  }

  private async assertEmailAvailable(email: string, exceptStaffId?: string) {
    const [taken] = await this.db
      .select({ id: staff.id })
      .from(staff)
      .where(sql`lower(${staff.email}) = ${email}`);
    if (taken && taken.id !== exceptStaffId) throw new ConflictException(EMAIL_TAKEN);
  }
}

function isUniqueViolation(err: unknown): boolean {
  const seen = new Set<unknown>();
  let current: unknown = err;
  while (current && typeof current === 'object' && !seen.has(current)) {
    seen.add(current);
    const row = current as { code?: string; cause?: unknown };
    if (row.code === '23505') return true;
    current = row.cause;
  }
  return false;
}
