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
import type { BookingStatus } from '../booking/booking-state-machine';
import { bookingStatusValues } from '../db/schema';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';

function parseStatus(status?: string): BookingStatus | undefined {
  return status && (bookingStatusValues as readonly string[]).includes(status)
    ? (status as BookingStatus)
    : undefined;
}

@Controller('vendor-admin/bookings')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'practitioner', 'front_desk')
export class VendorBookingsController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  list(
    @CurrentStaff() staff: VendorPrincipal,
    @Query('status') status?: string,
  ) {
    const staffIdFilter = staff.role === 'practitioner' ? staff.staffId : undefined;
    return this.bookingService.listForVendor(staff.vendorId, parseStatus(status), staffIdFilter);
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
