import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { customers } from '../db/schema';
import type { UpdateCustomerNotesDto } from './dto/update-customer-notes.dto';

@Injectable()
export class VendorCustomersService {
  constructor(@Inject(DB) private readonly db: Database) {}

  list(vendorId: string) {
    return this.db
      .select()
      .from(customers)
      .where(eq(customers.vendorId, vendorId))
      .orderBy(desc(customers.lastVisitAt));
  }

  async getById(vendorId: string, customerId: string) {
    const [customer] = await this.db
      .select()
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.vendorId, vendorId)),
      );
    if (!customer) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    return customer;
  }

  async updateNotes(
    vendorId: string,
    customerId: string,
    dto: UpdateCustomerNotesDto,
  ) {
    const [updated] = await this.db
      .update(customers)
      .set({ notes: dto.notes, updatedAt: new Date() })
      .where(
        and(eq(customers.id, customerId), eq(customers.vendorId, vendorId)),
      )
      .returning();
    if (!updated) {
      throw new NotFoundException(`Customer ${customerId} not found`);
    }
    return updated;
  }
}
