import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InitiateBookingPaymentDto } from './dto/initiate-booking-payment.dto';
import { ListBookingsQueryDto } from './dto/list-bookings-query.dto';

@Controller('bookings')
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  @Get()
  list(@Query() query: ListBookingsQueryDto) {
    return this.bookingService.listForUser(query.userId);
  }

  @Post()
  create(@Body() dto: CreateBookingDto) {
    return this.bookingService.createPendingBooking({
      vendorId: dto.vendorId,
      userId: dto.userId,
      staffId: dto.staffId ?? null,
      serviceIds: dto.serviceIds,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes,
    });
  }

  @Post(':id/payment')
  initiatePayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiateBookingPaymentDto,
  ) {
    return this.bookingService.initiateBookingPayment(id, dto.paymentMode, dto.amountDueKobo);
  }

  @Post(':id/cancel')
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.bookingService.cancelByCustomer(id, reason);
  }

  @Post(':id/complete')
  complete(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.markCompleted(id);
  }

  @Post(':id/no-show')
  noShow(@Param('id', ParseUUIDPipe) id: string) {
    return this.bookingService.markNoShow(id);
  }
}
