import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { FinanceModule } from '../finance/finance.module';
import { PaystackWebhookController } from './paystack-webhook.controller';

@Module({
  imports: [BookingModule, FinanceModule],
  controllers: [PaystackWebhookController],
})
export class PaymentsModule {}
