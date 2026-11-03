import { Global, Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { VendorNotificationsController } from './vendor-notifications.controller';
import { VendorNotificationsService } from './vendor-notifications.service';

// Global like PushModule: bookings, payments, feedback and the inbox all write
// to the feed without importing each other's modules.
@Global()
@Module({
  imports: [VendorAuthModule],
  controllers: [VendorNotificationsController],
  providers: [VendorNotificationsService],
  exports: [VendorNotificationsService],
})
export class VendorNotificationsModule {}
