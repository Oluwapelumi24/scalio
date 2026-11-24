import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { vendors } from '../db/schema';
import { LISTING, move, type ListingStatus } from '@veno/shared-types';
import { MailService } from '../mail/mail.service';
import type { CreateVendorDto } from './dto/create-vendor.dto';
import type { UpdateVendorDto } from './dto/update-vendor.dto';

@Injectable()
export class SuperAdminVendorsService {
  private readonly logger = new Logger(SuperAdminVendorsService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    @Optional() private readonly mail?: MailService,
    @Optional() private readonly config?: ConfigService,
  ) {}

  list() {
    return this.db.select().from(vendors).orderBy(desc(vendors.createdAt));
  }

  listPending() {
    return this.db
      .select()
      .from(vendors)
      .where(eq(vendors.approvalStatus, 'pending_review'))
      .orderBy(desc(vendors.createdAt));
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
        description: dto.description,
        ownerName: dto.ownerName,
        ownerEmail: dto.ownerEmail,
        address: dto.address,
        averageDaysBetweenVisits: dto.averageDaysBetweenVisits,
        featured: dto.featured ?? false,
        approvalStatus: 'pending_review',
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

  async approve(vendorId: string, adminId: string) {
    const current = await this.getById(vendorId);
    const next = move(LISTING, current.approvalStatus as ListingStatus, 'APPROVE');
    if (!next) {
      throw new ConflictException(
        `Only pending or rejected listings can be approved (currently ${current.approvalStatus}).`,
      );
    }
    const [updated] = await this.db
      .update(vendors)
      .set({
        approvalStatus: next,
        reviewNote: null,
        reviewedAt: new Date(),
        reviewedById: adminId,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId))
      .returning();
    if (!updated) throw new NotFoundException(`Vendor ${vendorId} not found`);
    await this.notifyOwner(updated, 'approved');
    return updated;
  }

  async reject(vendorId: string, adminId: string, note?: string) {
    const current = await this.getById(vendorId);
    const next = move(LISTING, current.approvalStatus as ListingStatus, 'REJECT');
    if (!next) {
      throw new ConflictException(
        `Only pending or live listings can be rejected (currently ${current.approvalStatus}).`,
      );
    }
    const [updated] = await this.db
      .update(vendors)
      .set({
        approvalStatus: next,
        reviewNote: note ?? null,
        reviewedAt: new Date(),
        reviewedById: adminId,
        updatedAt: new Date(),
      })
      .where(eq(vendors.id, vendorId))
      .returning();
    if (!updated) throw new NotFoundException(`Vendor ${vendorId} not found`);
    await this.notifyOwner(updated, 'rejected');
    return updated;
  }

  async delete(vendorId: string) {
    const [deleted] = await this.db
      .delete(vendors)
      .where(eq(vendors.id, vendorId))
      .returning({ id: vendors.id });
    if (!deleted) throw new NotFoundException(`Vendor ${vendorId} not found`);
  }

  private dashboardUrl(): string {
    return (this.config?.get<string>('VENDOR_WEB_URL') ?? 'http://localhost:3001').replace(
      /\/$/,
      '',
    );
  }

  private async notifyOwner(
    vendor: typeof vendors.$inferSelect,
    decision: 'approved' | 'rejected',
  ): Promise<void> {
    const to = vendor.ownerEmail?.trim();
    if (!to || !this.mail) return;
    try {
      await this.mail.sendVendorListingDecisionEmail(
        to,
        vendor.businessName,
        decision,
        `${this.dashboardUrl()}/dashboard`,
        vendor.reviewNote,
      );
    } catch (err) {
      this.logger.warn(
        `Listing ${decision} email failed for ${vendor.id}: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}
