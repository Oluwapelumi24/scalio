import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { PaystackModule } from './payments/paystack.module';
import { PaymentsModule } from './payments/payments.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { VendorModule } from './vendor/vendor.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    RedisModule,
    MailModule,
    PaystackModule,
    AuthModule,
    VendorModule,
    BookingModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
