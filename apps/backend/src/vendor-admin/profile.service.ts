import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { vendors } from '../db/schema';
import type { UpdateVendorProfileDto } from './dto/update-profile.dto';

@Injectable()
export class VendorProfileService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async get(vendorId: string) {
    const [vendor] = await this.db
      .select({
        businessName: vendors.businessName,
        category: vendors.category,
        address: vendors.address,
        description: vendors.description,
        approvalStatus: vendors.approvalStatus,
        reviewNote: vendors.reviewNote,
        slug: vendors.slug,
      })
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');
    return vendor;
  }

  async update(vendorId: string, dto: UpdateVendorProfileDto) {
    const [updated] = await this.db
      .update(vendors)
      .set({
        category: dto.category,
        address: dto.address.trim(),
        description: dto.description?.trim() || null,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId))
      .returning({
        businessName: vendors.businessName,
        category: vendors.category,
        address: vendors.address,
        description: vendors.description,
        approvalStatus: vendors.approvalStatus,
        reviewNote: vendors.reviewNote,
        slug: vendors.slug,
      });
    if (!updated) throw new NotFoundException('Business not found');
    return updated;
  }
}
