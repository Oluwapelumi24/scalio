import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { SlotLockService } from './slot-lock.service';

@Module({
  imports: [forwardRef(() => AuthModule)],
  controllers: [BookingController],
  providers: [BookingService, SlotLockService],
  exports: [BookingService],
})
export class BookingModule {}
