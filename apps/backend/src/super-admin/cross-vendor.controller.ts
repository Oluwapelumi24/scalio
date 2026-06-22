import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BookingService } from '../booking/booking.service';
import type { BookingStatus } from '../booking/booking-state-machine';
import { bookingStatusValues } from '../db/schema';
import { AdminAuthGuard } from '../super-admin-auth/admin-auth.guard';
import { VendorCustomersService } from '../vendor-admin/customers.service';
import { CreateBlackoutDateDto } from '../vendor-admin/dto/create-blackout-date.dto';
import { CreateServiceDto } from '../vendor-admin/dto/create-service.dto';
import { CreateStaffDto } from '../vendor-admin/dto/create-staff.dto';
import { SetBusinessHoursDto } from '../vendor-admin/dto/set-business-hours.dto';
import { UpdateCustomerNotesDto } from '../vendor-admin/dto/update-customer-notes.dto';
import { UpdateServiceDto } from '../vendor-admin/dto/update-service.dto';
import { UpdateStaffDto } from '../vendor-admin/dto/update-staff.dto';
import { VendorScheduleService } from '../vendor-admin/schedule.service';
import { VendorServicesService } from '../vendor-admin/services.service';
import { VendorStaffService } from '../vendor-admin/staff.service';

function parseStatus(s?: string): BookingStatus | undefined {
  return s && (bookingStatusValues as readonly string[]).includes(s) ? (s as BookingStatus) : undefined;
}

@Controller('super-admin/vendors/:vendorId')
@UseGuards(AdminAuthGuard)
export class SuperAdminCrossVendorController {
  constructor(
    private readonly servicesService: VendorServicesService,
    private readonly staffService: VendorStaffService,
    private readonly scheduleService: VendorScheduleService,
    private readonly customersService: VendorCustomersService,
    private readonly bookingService: BookingService,
  ) {}

  // ─── Services ───────────────────────────────────────────────────────────────

  @Get('services')
  listServices(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return this.servicesService.list(vendorId);
  }

  @Post('services')
  createService(@Param('vendorId', ParseUUIDPipe) vendorId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(vendorId, dto);
  }

  @Patch('services/:serviceId')
  updateService(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(vendorId, serviceId, dto);
  }

  @Delete('services/:serviceId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteService(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ) {
    await this.servicesService.remove(vendorId, serviceId);
  }

  // ─── Staff ──────────────────────────────────────────────────────────────────

  @Get('staff')
  listStaff(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return this.staffService.list(vendorId);
  }

  @Post('staff')
  createStaff(@Param('vendorId', ParseUUIDPipe) vendorId: string, @Body() dto: CreateStaffDto) {
    return this.staffService.create(vendorId, dto);
  }

  @Patch('staff/:staffId')
  updateStaff(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
    @Body() dto: UpdateStaffDto,
  ) {
    return this.staffService.update(vendorId, staffId, dto);
  }

  @Delete('staff/:staffId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteStaff(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('staffId', ParseUUIDPipe) staffId: string,
  ) {
    await this.staffService.remove(vendorId, staffId);
  }

  // ─── Schedule ───────────────────────────────────────────────────────────────

  @Get('schedule/hours')
  getHours(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return this.scheduleService.getBusinessHours(vendorId);
  }

  @Put('schedule/hours')
  setHours(@Param('vendorId', ParseUUIDPipe) vendorId: string, @Body() dto: SetBusinessHoursDto) {
    return this.scheduleService.setBusinessHours(vendorId, dto);
  }

  @Get('schedule/blackout-dates')
  getBlackoutDates(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return this.scheduleService.getBlackoutDates(vendorId);
  }

  @Post('schedule/blackout-dates')
  addBlackoutDate(@Param('vendorId', ParseUUIDPipe) vendorId: string, @Body() dto: CreateBlackoutDateDto) {
    return this.scheduleService.addBlackoutDate(vendorId, dto);
  }

  @Delete('schedule/blackout-dates/:blackoutId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeBlackoutDate(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('blackoutId', ParseUUIDPipe) blackoutId: string,
  ) {
    await this.scheduleService.removeBlackoutDate(vendorId, blackoutId);
  }

  // ─── Bookings ───────────────────────────────────────────────────────────────

  @Get('bookings')
  listBookings(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Query('status') status?: string,
  ) {
    return this.bookingService.listForVendor(vendorId, parseStatus(status));
  }

  @Post('bookings/:bookingId/cancel')
  cancelBooking(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingService.cancelByVendor(bookingId, vendorId, reason);
  }

  @Post('bookings/:bookingId/complete')
  completeBooking(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingService.markCompleted(bookingId, vendorId);
  }

  @Post('bookings/:bookingId/no-show')
  noShowBooking(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
  ) {
    return this.bookingService.markNoShow(bookingId, vendorId);
  }

  // ─── Customers ──────────────────────────────────────────────────────────────

  @Get('customers')
  listCustomers(@Param('vendorId', ParseUUIDPipe) vendorId: string) {
    return this.customersService.list(vendorId);
  }

  @Get('customers/:customerId')
  getCustomer(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
  ) {
    return this.customersService.getById(vendorId, customerId);
  }

  @Patch('customers/:customerId/notes')
  updateCustomerNotes(
    @Param('vendorId', ParseUUIDPipe) vendorId: string,
    @Param('customerId', ParseUUIDPipe) customerId: string,
    @Body() dto: UpdateCustomerNotesDto,
  ) {
    return this.customersService.updateNotes(vendorId, customerId, dto);
  }
}
