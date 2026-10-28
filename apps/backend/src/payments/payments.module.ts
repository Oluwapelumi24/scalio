import { Module } from '@nestjs/common';
import { AdsModule } from '../ads/ads.module';
import { BookingModule } from '../booking/booking.module';
import { FinanceModule } from '../finance/finance.module';
import { PaystackWebhookController } from './paystack-webhook.controller';

@Module({
  imports: [BookingModule, FinanceModule, AdsModule],
  controllers: [PaystackWebhookController],
})
export class PaymentsModule {}
