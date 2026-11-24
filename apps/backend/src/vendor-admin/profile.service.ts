import { LISTING, move, type ListingStatus } from '@veno/shared-types';
import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { contentMedia, vendors } from '../db/schema';
import type { UpdateVendorProfileDto } from './dto/update-profile.dto';

function listingMediaUrl(mediaId: string): string {
  const base = process.env.PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) {
    if (process.env.NODE_ENV === 'production') {
      throw new BadRequestException('PUBLIC_API_URL is not configured.');
    }
    return `http://localhost:3000/public/listing-media/${mediaId}`;
  }
  return `${base}/public/listing-media/${mediaId}`;
}

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
        logoUrl: vendors.logoUrl,
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
    let logoUrl: string | null | undefined;
    if (dto.clearLogo) logoUrl = null;
    if (dto.logoMediaId) {
      const [media] = await this.db
        .select({ id: contentMedia.id })
        .from(contentMedia)
        .where(and(eq(contentMedia.id, dto.logoMediaId), eq(contentMedia.vendorId, vendorId)));
      if (!media) throw new BadRequestException('That photo was not found. Upload it again.');
      logoUrl = listingMediaUrl(media.id);
    }

    const [current] = await this.db
      .select({ approvalStatus: vendors.approvalStatus })
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!current) throw new NotFoundException('Business not found');

    // A sent-back listing re-enters the queue. A pending or live page keeps its status.
    const revised = move(LISTING, current.approvalStatus as ListingStatus, 'OWNER_REVISED');
    const requeue = revised
      ? {
          approvalStatus: revised,
          reviewNote: null,
          reviewedAt: null,
          reviewedById: null,
        }
      : {};

    const [updated] = await this.db
      .update(vendors)
      .set({
        category: dto.category,
        address: dto.address.trim(),
        // Only clear description when the client sends the field; omit keeps existing.
        ...(dto.description !== undefined ? { description: dto.description.trim() || null } : {}),
        ...(logoUrl !== undefined ? { logoUrl } : {}),
        ...requeue,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId))
      .returning({
        businessName: vendors.businessName,
        category: vendors.category,
        address: vendors.address,
        description: vendors.description,
        logoUrl: vendors.logoUrl,
        approvalStatus: vendors.approvalStatus,
        reviewNote: vendors.reviewNote,
        slug: vendors.slug,
      });
    if (!updated) throw new NotFoundException('Business not found');
    return updated;
  }
}
