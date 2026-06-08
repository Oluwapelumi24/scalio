import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { VendorBookingsController } from './bookings.controller';
import { VendorCustomersController } from './customers.controller';
import { VendorCustomersService } from './customers.service';
import { VendorScheduleController } from './schedule.controller';
import { VendorScheduleService } from './schedule.service';
import { VendorServicesController } from './services.controller';
import { VendorServicesService } from './services.service';
import { VendorStaffController } from './staff.controller';
import { VendorStaffService } from './staff.service';

@Module({
  imports: [VendorAuthModule, BookingModule],
  controllers: [
    VendorServicesController,
    VendorStaffController,
    VendorScheduleController,
    VendorBookingsController,
    VendorCustomersController,
  ],
  providers: [
    VendorServicesService,
    VendorStaffService,
    VendorScheduleService,
    VendorCustomersService,
  ],
})
export class VendorAdminModule {}
