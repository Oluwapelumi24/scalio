import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { services } from '../db/schema';
import type { CreateServiceDto } from './dto/create-service.dto';
import type { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class VendorServicesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list(vendorId: string) {
    return this.db
      .select()
      .from(services)
      .where(eq(services.vendorId, vendorId));
  }

  create(vendorId: string, dto: CreateServiceDto) {
    return this.db
      .insert(services)
      .values({
        vendorId,
        serviceType: dto.serviceType ?? 'service',
        name: dto.name,
        durationMinutes: dto.durationMinutes ?? 0,
        priceKobo: dto.priceKobo ?? 0,
        paymentMode: dto.paymentMode,
        depositPercent: dto.depositPercent,
      })
      .returning()
      .then(([created]) => created);
  }

  async update(vendorId: string, serviceId: string, dto: UpdateServiceDto) {
    const [updated] = await this.db
      .update(services)
      .set(dto)
      .where(and(eq(services.id, serviceId), eq(services.vendorId, vendorId)))
      .returning();
    if (!updated) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }
    return updated;
  }

  async remove(vendorId: string, serviceId: string) {
    const [deleted] = await this.db
      .delete(services)
      .where(and(eq(services.id, serviceId), eq(services.vendorId, vendorId)))
      .returning({ id: services.id });
    if (!deleted) {
      throw new NotFoundException(`Service ${serviceId} not found`);
    }
  }
}
