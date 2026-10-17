import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Put, Query, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { ListConversationsDto, ReplyDto, SetAiPausedDto, UpdateInboxSettingsDto } from './dto/inbox.dto';
import { InboxService } from './inbox.service';

/** Front desk answers chats; owners and managers decide what the AI does. */
@Controller('vendor-admin/inbox')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'front_desk')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get('conversations')
  list(@CurrentStaff() me: VendorPrincipal, @Query() q: ListConversationsDto) {
    return this.inbox.list(me.vendorId, q.filter ?? 'all');
  }

  @Get('conversations/:id')
  get(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.inbox.get(me.vendorId, id);
  }

  @Post('conversations/:id/messages')
  @HttpCode(HttpStatus.OK)
  reply(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ReplyDto) {
    return this.inbox.reply(me.vendorId, me.staffId, id, dto.text);
  }

  @Post('conversations/:id/suggest')
  @HttpCode(HttpStatus.OK)
  suggest(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.inbox.suggest(me.vendorId, id);
  }

  @Put('conversations/:id/ai')
  setAiPaused(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() dto: SetAiPausedDto) {
    return this.inbox.setAiPaused(me.vendorId, id, dto.paused);
  }

  @Get('settings')
  settings(@CurrentStaff() me: VendorPrincipal) {
    return this.inbox.settings(me.vendorId);
  }

  @Put('settings')
  @Roles('owner', 'manager')
  updateSettings(@CurrentStaff() me: VendorPrincipal, @Body() dto: UpdateInboxSettingsDto) {
    return this.inbox.updateSettings(me.vendorId, me.staffId, dto);
  }

  @Post('faq/draft')
  @Roles('owner', 'manager')
  @HttpCode(HttpStatus.OK)
  draftFaq(@CurrentStaff() me: VendorPrincipal) {
    return this.inbox.draftFaq(me.vendorId);
  }
}
