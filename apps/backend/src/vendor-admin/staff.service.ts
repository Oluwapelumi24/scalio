import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { staff } from '../db/schema';
import { VendorAuthService } from '../vendor-auth/vendor-auth.service';
import type { CreateStaffDto } from './dto/create-staff.dto';
import type { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class VendorStaffService {
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
    const [created] = await this.db
      .insert(staff)
      .values({
        vendorId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        role: dto.role,
      })
      .returning();

    if (created.email) {
      await this.vendorAuth.issueInvite(created.email);
    }

    return created;
  }

  async update(vendorId: string, staffId: string, dto: UpdateStaffDto) {
    const [updated] = await this.db
      .update(staff)
      .set({
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
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
}
