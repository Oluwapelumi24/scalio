import { Global, Module } from '@nestjs/common';
import { PushService } from './push.service';

// Global like MailModule/PaystackModule — BookingService and the reminders
// cron both need PushService without importing each other's modules.
@Global()
@Module({
  providers: [PushService],
  exports: [PushService],
})
export class PushModule {}
