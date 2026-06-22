import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { vendors } from '../db/schema';
import type { CreateVendorDto } from './dto/create-vendor.dto';
import type { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class SuperAdminVendorsService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list() {
    return this.db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  create(dto: CreateVendorDto) {
    return this.db
      .insert(vendors)
      .values({
        slug: dto.slug,
        businessName: dto.businessName,
        category: dto.category,
        logoUrl: dto.logoUrl,
        themeColor: dto.themeColor,
        address: dto.address,
        averageDaysBetweenVisits: dto.averageDaysBetweenVisits,
        featured: dto.featured ?? false,
      })
      .returning()
      .then(([v]) => v);
  }

  async getById(vendorId: string) {
    const [row] = await this.db.select().from(vendors).where(eq(vendors.id, vendorId));
    if (!row) throw new NotFoundException(`Vendor ${vendorId} not found`);
    return row;
  }

  async update(vendorId: string, dto: UpdateVendorDto) {
    const [updated] = await this.db
      .update(vendors)
      .set({ ...dto, updatedAt: new Date() })
      .where(eq(vendors.id, vendorId))
      .returning();
    if (!updated) throw new NotFoundException(`Vendor ${vendorId} not found`);
    return updated;
  }

  async delete(vendorId: string) {
    const [deleted] = await this.db
      .delete(vendors)
      .where(eq(vendors.id, vendorId))
      .returning({ id: vendors.id });
    if (!deleted) throw new NotFoundException(`Vendor ${vendorId} not found`);
  }
}
