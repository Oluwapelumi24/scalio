import { Module } from '@nestjs/common';
import { BookingRemindersService } from './booking-reminders.service';

@Module({
  providers: [BookingRemindersService],
})
export class NotificationsModule {}
