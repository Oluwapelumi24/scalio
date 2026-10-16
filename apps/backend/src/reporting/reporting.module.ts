import { Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [VendorAuthModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportingModule {}
