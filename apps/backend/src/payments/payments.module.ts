import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { PaystackWebhookController } from './paystack-webhook.controller';

@Module({
  imports: [BookingModule],
  controllers: [PaystackWebhookController],
})
export class PaymentsModule {}
