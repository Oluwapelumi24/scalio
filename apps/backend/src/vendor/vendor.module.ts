import { Module } from '@nestjs/common';
import { BookingPreviewService } from './booking-preview.service';
import { VendorController } from './vendor.controller';
import { VendorService } from './vendor.service';

@Module({
  controllers: [VendorController],
  providers: [VendorService, BookingPreviewService],
  exports: [VendorService, BookingPreviewService],
})
export class VendorModule {}
