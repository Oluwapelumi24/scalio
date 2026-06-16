import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { SlotLockService } from './slot-lock.service';

@Module({
  controllers: [BookingController],
  providers: [BookingService, SlotLockService],
  exports: [BookingService],
})
export class BookingModule {}
