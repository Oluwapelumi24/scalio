import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import { BookingsSummaryService } from './bookings-summary.service';
import type { BookingStatus } from '../booking/booking-state-machine';
import { bookingStatusValues } from '../db/schema';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { CreateVendorBookingDto } from './dto/create-vendor-booking.dto';

function parseDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function parseStatus(status?: string): BookingStatus | undefined {
  return status && (bookingStatusValues as readonly string[]).includes(status)
    ? (status as BookingStatus)
    : undefined;
}

@Controller('vendor-admin/bookings')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'practitioner', 'front_desk')
export class VendorBookingsController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly summary: BookingsSummaryService,
  ) {}

  /** Today's bookings and sales, shown at the top of the Bookings screen. */
  @Get('summary')
  today(@CurrentStaff() staff: VendorPrincipal) {
    return this.summary.today(staff.vendorId, {
      staffId: staff.role === 'practitioner' ? staff.staffId : undefined,
      includeSales: staff.role === 'owner' || staff.role === 'manager',
    });
  }

  @Get()
  list(
    @CurrentStaff() staff: VendorPrincipal,
    @Query('status') status?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const staffIdFilter = staff.role === 'practitioner' ? staff.staffId : undefined;
    return this.bookingService.listForVendor(staff.vendorId, parseStatus(status), staffIdFilter, {
      from: parseDate(from),
      to: parseDate(to),
    });
  }

  /** Books a client in from the app: a walk-in, a phone call, a DM. Practitioners can only book themselves. */
  @Post()
  create(@CurrentStaff() staff: VendorPrincipal, @Body() dto: CreateVendorBookingDto) {
    return this.bookingService.createByVendor({
      vendorId: staff.vendorId,
      customerId: dto.customerId,
      newCustomer: dto.customerId
        ? undefined
        : { name: dto.customerName ?? '', phone: dto.customerPhone, email: dto.customerEmail },
      staffId: staff.role === 'practitioner' ? staff.staffId : (dto.staffId ?? null),
      serviceIds: dto.serviceIds,
      scheduledAt: new Date(dto.scheduledAt),
    });
  }

  @Post(':id/cancel')
  cancel(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingService.cancelByVendor(id, staff.vendorId, reason);
  }

  @Post(':id/complete')
  complete(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingService.markCompleted(id, staff.vendorId);
  }

  @Post(':id/no-show')
  noShow(
    @CurrentStaff() staff: VendorPrincipal,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.bookingService.markNoShow(id, staff.vendorId);
  }
}
