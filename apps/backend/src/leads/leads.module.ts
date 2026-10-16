import { Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

@Module({
  imports: [VendorAuthModule],
  controllers: [LeadsController],
  providers: [LeadsService],
})
export class LeadsModule {}
