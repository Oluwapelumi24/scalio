import { Body, Controller, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import { CurrentUser } from '../auth/current-user.decorator';
import { UserAuthGuard } from '../auth/user-auth.guard';
import type { users } from '../db/schema';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { InitiateBookingPaymentDto } from './dto/initiate-booking-payment.dto';

@Controller('bookings')
@UseGuards(UserAuthGuard)
export class BookingController {
  constructor(private readonly bookingService: BookingService) {}

  /** The signed-in customer's bookings. The caller cannot ask for someone else's. */
  @Get()
  list(@CurrentUser() user: InferSelectModel<typeof users>) {
    return this.bookingService.listForUser(user.id);
  }

  @Post()
  create(@CurrentUser() user: InferSelectModel<typeof users>, @Body() dto: CreateBookingDto) {
    return this.bookingService.createPendingBooking({
      vendorId: dto.vendorId,
      userId: user.id,
      staffId: dto.staffId ?? null,
      serviceIds: dto.serviceIds,
      scheduledAt: new Date(dto.scheduledAt),
      durationMinutes: dto.durationMinutes,
    });
  }

  @Post(':id/payment')
  async initiatePayment(
    @CurrentUser() user: InferSelectModel<typeof users>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiateBookingPaymentDto,
  ) {
    await this.bookingService.assertOwnedByUser(id, user.id);
    return this.bookingService.initiateBookingPayment(id, dto.paymentMode, dto.amountDueKobo);
  }

  @Post(':id/cancel')
  async cancel(
    @CurrentUser() user: InferSelectModel<typeof users>,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    await this.bookingService.assertOwnedByUser(id, user.id);
    return this.bookingService.cancelByCustomer(id, reason);
  }
}
