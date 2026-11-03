import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { VendorNotificationsService } from './vendor-notifications.service';

@Controller('vendor-admin/notifications')
@UseGuards(VendorAuthGuard)
export class VendorNotificationsController {
  constructor(private readonly notifications: VendorNotificationsService) {}

  @Get()
  list(@CurrentStaff() me: VendorPrincipal, @Query('limit') limit?: string) {
    return this.notifications.list(me, limit ? Number(limit) || 50 : 50);
  }

  @Get('unread-count')
  unreadCount(@CurrentStaff() me: VendorPrincipal) {
    return this.notifications.unreadCount(me);
  }

  @Post('read')
  markAllRead(@CurrentStaff() me: VendorPrincipal) {
    return this.notifications.markAllRead(me);
  }
}
