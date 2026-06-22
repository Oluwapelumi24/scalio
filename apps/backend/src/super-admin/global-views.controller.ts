import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Inject, Param, ParseUUIDPipe, Post, Query, UseGuards,
} from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { and, count, desc, eq, gte, lte, sum } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { admins, bookings, customers, vendors } from '../db/schema';
import type { BookingStatus } from '../booking/booking-state-machine';
import { bookingStatusValues } from '../db/schema';
import { AdminAuthGuard } from '../super-admin-auth/admin-auth.guard';
import { AdminAuthService } from '../super-admin-auth/admin-auth.service';

class InviteAdminDto {
  @IsString() @MinLength(1) name!: string;
  @IsEmail() email!: string;
}

function parseStatus(s?: string): BookingStatus | undefined {
  return s && (bookingStatusValues as readonly string[]).includes(s) ? (s as BookingStatus) : undefined;
}

type WhereClause = Parameters<typeof and>[0];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildWhere(conditions: (WhereClause | undefined)[]): any {
  const valid = conditions.filter((c): c is WhereClause => c !== undefined);
  if (valid.length === 0) return undefined;
  if (valid.length === 1) return valid[0];
  return and(...valid);
}

@Controller('super-admin')
@UseGuards(AdminAuthGuard)
export class SuperAdminGlobalViewController {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly adminAuth: AdminAuthService,
  ) {}

  // ─── Bookings ───────────────────────────────────────────────────────────────

  @Get('bookings')
  listAllBookings(
    @Query('vendorId') vendorId?: string,
    @Query('status') status?: string,
  ) {
    const parsed = parseStatus(status);
    return this.db
      .select({
        id: bookings.id,
        status: bookings.status,
        scheduledAt: bookings.scheduledAt,
        paymentMode: bookings.paymentMode,
        amountDueKobo: bookings.amountDueKobo,
        amountPaidKobo: bookings.amountPaidKobo,
        paystackReference: bookings.paystackReference,
        createdAt: bookings.createdAt,
        vendorId: vendors.id,
        vendorName: vendors.businessName,
      })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .where(buildWhere([
        vendorId ? eq(bookings.vendorId, vendorId) : undefined,
        parsed ? eq(bookings.status, parsed) : undefined,
      ]))
      .orderBy(desc(bookings.scheduledAt));
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  @Get('customers')
  listAllCustomers(@Query('vendorId') vendorId?: string) {
    return this.db
      .select({
        id: customers.id,
        name: customers.name,
        email: customers.email,
        phone: customers.phone,
        visitCount: customers.visitCount,
        lifetimeValueKobo: customers.lifetimeValueKobo,
        lastVisitAt: customers.lastVisitAt,
        vendorId: vendors.id,
        vendorName: vendors.businessName,
      })
      .from(customers)
      .innerJoin(vendors, eq(customers.vendorId, vendors.id))
      .where(vendorId ? eq(customers.vendorId, vendorId) : undefined)
      .orderBy(desc(customers.lastVisitAt));
  }

  // ─── Payments ───────────────────────────────────────────────────────────────

  @Get('payments')
  listPayments(
    @Query('vendorId') vendorId?: string,
    @Query('mode') mode?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const validModes = ['pay_on_arrival', 'deposit', 'full_prepayment'];
    return this.db
      .select({
        id: bookings.id,
        status: bookings.status,
        paymentMode: bookings.paymentMode,
        amountDueKobo: bookings.amountDueKobo,
        amountPaidKobo: bookings.amountPaidKobo,
        paystackReference: bookings.paystackReference,
        scheduledAt: bookings.scheduledAt,
        createdAt: bookings.createdAt,
        vendorId: vendors.id,
        vendorName: vendors.businessName,
        customerName: customers.name,
        customerEmail: customers.email,
      })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .leftJoin(customers, eq(bookings.customerId, customers.id))
      .where(buildWhere([
        vendorId ? eq(bookings.vendorId, vendorId) : undefined,
        mode && validModes.includes(mode) ? eq(bookings.paymentMode, mode as any) : undefined,
        from ? gte(bookings.createdAt, new Date(from)) : undefined,
        to ? lte(bookings.createdAt, new Date(to)) : undefined,
      ]))
      .orderBy(desc(bookings.createdAt));
  }

  // ─── Reports ────────────────────────────────────────────────────────────────

  @Get('reports/revenue')
  async revenueReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('vendorId') vendorId?: string,
  ) {
    const baseConditions: (WhereClause | undefined)[] = [
      eq(bookings.status, 'completed'),
      vendorId ? eq(bookings.vendorId, vendorId) : undefined,
      from ? gte(bookings.createdAt, new Date(from)) : undefined,
      to ? lte(bookings.createdAt, new Date(to)) : undefined,
    ];

    const [summary] = await this.db
      .select({ totalKobo: sum(bookings.amountPaidKobo), totalBookings: count() })
      .from(bookings)
      .where(buildWhere(baseConditions));

    const byVendor = await this.db
      .select({
        vendorId: vendors.id,
        businessName: vendors.businessName,
        revenueKobo: sum(bookings.amountPaidKobo),
        bookingCount: count(),
      })
      .from(bookings)
      .innerJoin(vendors, eq(bookings.vendorId, vendors.id))
      .where(buildWhere(baseConditions))
      .groupBy(vendors.id, vendors.businessName)
      .orderBy(desc(sum(bookings.amountPaidKobo)));

    const allConditions: (WhereClause | undefined)[] = [
      vendorId ? eq(bookings.vendorId, vendorId) : undefined,
      from ? gte(bookings.createdAt, new Date(from)) : undefined,
      to ? lte(bookings.createdAt, new Date(to)) : undefined,
    ];

    const statusBreakdown = await this.db
      .select({ status: bookings.status, total: count() })
      .from(bookings)
      .where(buildWhere(allConditions))
      .groupBy(bookings.status);

    return {
      totalRevenueKobo: Number(summary?.totalKobo ?? 0),
      totalBookings: summary?.totalBookings ?? 0,
      byVendor,
      statusBreakdown: Object.fromEntries(statusBreakdown.map((r) => [r.status, r.total])),
    };
  }

  // ─── Team (admin accounts) ───────────────────────────────────────────────

  @Post('team')
  async inviteAdmin(@Body() dto: InviteAdminDto) {
    const [existing] = await this.db.select({ id: admins.id }).from(admins).where(eq(admins.email, dto.email));
    if (existing) {
      await this.adminAuth.issueInvite(dto.email);
      return { message: 'Invite re-sent.' };
    }
    await this.db.insert(admins).values({ name: dto.name, email: dto.email });
    await this.adminAuth.issueInvite(dto.email);
    return { message: 'Admin created and invite sent.' };
  }

  @Get('team')
  async listAdmins() {
    const rows = await this.db
      .select({
        id: admins.id,
        name: admins.name,
        email: admins.email,
        passwordHash: admins.passwordHash,
        lastLoginAt: admins.lastLoginAt,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .orderBy(desc(admins.createdAt));

    return rows.map(({ passwordHash, ...r }) => ({ ...r, active: passwordHash !== null }));
  }

  @Delete('team/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeAdmin(@Param('id', ParseUUIDPipe) id: string) {
    await this.db.delete(admins).where(eq(admins.id, id));
  }
}
