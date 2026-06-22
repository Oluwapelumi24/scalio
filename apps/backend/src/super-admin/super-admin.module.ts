import { Module } from '@nestjs/common';
import { BookingModule } from '../booking/booking.module';
import { SuperAdminAuthModule } from '../super-admin-auth/super-admin-auth.module';
import { VendorAdminModule } from '../vendor-admin/vendor-admin.module';
import { SuperAdminCrossVendorController } from './cross-vendor.controller';
import { SuperAdminGlobalViewController } from './global-views.controller';
import { SuperAdminMetricsController } from './metrics.controller';
import { SuperAdminMetricsService } from './metrics.service';
import { SuperAdminVendorsController } from './vendors.controller';
import { SuperAdminVendorsService } from './vendors.service';

@Module({
  imports: [SuperAdminAuthModule, VendorAdminModule, BookingModule],
  controllers: [
    SuperAdminVendorsController,
    SuperAdminCrossVendorController,
    SuperAdminGlobalViewController,
    SuperAdminMetricsController,
  ],
  providers: [SuperAdminVendorsService, SuperAdminMetricsService],
})
export class SuperAdminModule {}
