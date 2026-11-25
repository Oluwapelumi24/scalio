import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { hours, minutes, ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import type Redis from 'ioredis';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { emailTracker, skipUnlessApplied } from './common/throttling/apply-throttlers';
import { VenoThrottlerGuard } from './common/throttling/veno-throttler.guard';
import { HealthService } from './health/health.service';
import { DbModule } from './db/db.module';
import { RedisModule, REDIS } from './redis/redis.module';
import { MailModule } from './mail/mail.module';
import { PaystackModule } from './payments/paystack.module';
import { PaymentsModule } from './payments/payments.module';
import { PushModule } from './notifications/push.module';
import { VendorNotificationsModule } from './vendor-notifications/vendor-notifications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BookingModule } from './booking/booking.module';
import { AuthModule } from './auth/auth.module';
import { VendorAuthModule } from './vendor-auth/vendor-auth.module';
import { VendorModule } from './vendor/vendor.module';
import { VendorAdminModule } from './vendor-admin/vendor-admin.module';
import { SuperAdminAuthModule } from './super-admin-auth/super-admin-auth.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { WaitlistModule } from './waitlist/waitlist.module';
import { PersonalisationModule } from './personalisation/personalisation.module';
import { StaffScheduleModule } from './staff-schedule/staff-schedule.module';
import { FinanceModule } from './finance/finance.module';
import { ContentStudioModule } from './content-studio/content-studio.module';
import { LeadsModule } from './leads/leads.module';
import { FeedbackModule } from './feedback/feedback.module';
import { ReportingModule } from './reporting/reporting.module';
import { AdsModule } from './ads/ads.module';
import { InboxModule } from './inbox/inbox.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [RedisModule],
      inject: [REDIS],
      useFactory: (redis: Redis) => ({
        throttlers: [
          { name: 'default', ttl: minutes(1), limit: 300 },
          {
            name: 'authLoginIp',
            ttl: minutes(1),
            limit: 10,
            skipIf: skipUnlessApplied('authLoginIp'),
          },
          {
            name: 'authLoginEmail',
            ttl: minutes(1),
            limit: 5,
            skipIf: skipUnlessApplied('authLoginEmail'),
            getTracker: emailTracker,
          },
          {
            name: 'authEmailHour',
            ttl: hours(1),
            limit: 5,
            skipIf: skipUnlessApplied('authEmailHour'),
            getTracker: emailTracker,
          },
          {
            name: 'authIpHour',
            ttl: hours(1),
            limit: 20,
            skipIf: skipUnlessApplied('authIpHour'),
          },
          {
            name: 'authStrictIp',
            ttl: minutes(1),
            limit: 10,
            skipIf: skipUnlessApplied('authStrictIp'),
          },
        ],
        storage: new ThrottlerStorageRedisService(redis),
      }),
    }),
    DbModule,
    RedisModule,
    MailModule,
    PaystackModule,
    PushModule,
    VendorNotificationsModule,
    AuthModule,
    VendorAuthModule,
    VendorModule,
    VendorAdminModule,
    BookingModule,
    SuperAdminAuthModule,
    SuperAdminModule,
    PaymentsModule,
    NotificationsModule,
    WaitlistModule,
    PersonalisationModule,
    StaffScheduleModule,
    FinanceModule,
    ContentStudioModule,
    LeadsModule,
    FeedbackModule,
    ReportingModule,
    AdsModule,
    InboxModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    HealthService,
    { provide: APP_GUARD, useClass: VenoThrottlerGuard },
  ],
})
export class AppModule {}
