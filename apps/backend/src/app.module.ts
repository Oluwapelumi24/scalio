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
  providers: [AppService],
})
export class AppModule {}
