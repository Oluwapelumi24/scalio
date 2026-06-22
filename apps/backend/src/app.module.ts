import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DbModule } from './db/db.module';
import { RedisModule } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { PaystackModule } from './payments/paystack.module';
import { PaymentsModule } from './payments/payments.module';
import { PushModule } from './notifications/push.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { VendorModule } from './vendor/vendor.module';
import { VendorAdminModule } from './vendor-admin/vendor-admin.module';
import { SuperAdminAuthModule } from './super-admin-auth/super-admin-auth.module';
import { SuperAdminModule } from './super-admin/super-admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    DbModule,
    RedisModule,
    MailModule,
    PaystackModule,
    PushModule,
    AuthModule,
    VendorAuthModule,
    VendorModule,
    VendorAdminModule,
    BookingModule,
    SuperAdminAuthModule,
    SuperAdminModule,
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
