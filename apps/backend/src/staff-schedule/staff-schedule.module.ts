import { Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { AttendanceService } from './attendance.service';
import { PerformanceService } from './performance.service';
import { AttendanceController, PerformanceController, StaffScheduleController } from './staff-schedule.controller';
import { StaffScheduleService } from './staff-schedule.service';

@Module({
  imports: [VendorAuthModule],
  controllers: [StaffScheduleController, AttendanceController, PerformanceController],
  providers: [StaffScheduleService, AttendanceService, PerformanceService],
  exports: [StaffScheduleService, AttendanceService],
})
export class StaffScheduleModule {}
