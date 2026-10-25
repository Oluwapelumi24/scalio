import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { campaignSchema, checkoutSchema, copySchema, extendSchema, parseBody, quoteSchema, reachSchema, toDraft } from './ad-campaigns.dto';
import { AdCampaignsService } from './ad-campaigns.service';
import { AdCopyService } from './ad-copy.service';

/** The campaign builder. Creating and paying for ads is for owners and managers; front desk can look. */
@Controller('vendor-admin/ads')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class AdCampaignsController {
  constructor(
    private readonly campaigns: AdCampaignsService,
    private readonly copy: AdCopyService,
  ) {}

  @Get('builder')
  builder(@CurrentStaff() me: VendorPrincipal) {
    return this.campaigns.defaults(me.vendorId).then((d) => ({ ...d, aiAvailable: this.copy.available }));
  }

  @Get('targeting/interests')
  interests(@CurrentStaff() me: VendorPrincipal, @Query('q') q = '') {
    return q.trim().length < 2 ? [] : this.campaigns.searchInterests(me.vendorId, q.trim().slice(0, 60));
  }

  @Get('targeting/interest-suggestions')
  suggestions(@CurrentStaff() me: VendorPrincipal, @Query('names') names = '') {
    return this.campaigns.suggestInterests(me.vendorId, names.split('|').map((n) => n.trim()).filter(Boolean).slice(0, 10));
  }

  @Get('targeting/locations')
  locations(@CurrentStaff() me: VendorPrincipal, @Query('q') q = '') {
    return q.trim().length < 2 ? [] : this.campaigns.searchLocations(me.vendorId, q.trim().slice(0, 60));
  }

  @Post('targeting/reach')
  @HttpCode(HttpStatus.OK)
  reach(@CurrentStaff() me: VendorPrincipal, @Body() body: unknown) {
    return this.campaigns.reach(me.vendorId, parseBody(reachSchema, body)).then((estimate) => ({ estimate }));
  }

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@CurrentStaff() me: VendorPrincipal, @Body() body: unknown) {
    const b = parseBody(quoteSchema, body);
    return this.campaigns.quote(me.vendorId, b.dailyBudgetKobo, b.days, b.route);
  }

  @Post('copy')
  @HttpCode(HttpStatus.OK)
  draftCopy(@CurrentStaff() me: VendorPrincipal, @Body() body: unknown) {
    return this.copy.draft(me.vendorId, parseBody(copySchema, body));
  }

  @Get('campaigns')
  @Roles('owner', 'manager', 'front_desk')
  list(@CurrentStaff() me: VendorPrincipal) {
    return this.campaigns.list(me.vendorId);
  }

  @Get('campaigns/:id')
  @Roles('owner', 'manager', 'front_desk')
  get(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.get(me.vendorId, id);
  }

  @Post('campaigns')
  create(@CurrentStaff() me: VendorPrincipal, @Body() body: unknown) {
    return this.campaigns.create(me.vendorId, me.staffId, toDraft(parseBody(campaignSchema, body)));
  }

  @Post('campaigns/:id/checkout')
  @HttpCode(HttpStatus.OK)
  checkout(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    return this.campaigns.checkout(me.vendorId, me.staffId, id, parseBody(checkoutSchema, body ?? {}).from);
  }

  @Post('campaigns/:id/extend')
  @HttpCode(HttpStatus.OK)
  extend(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string, @Body() body: unknown) {
    const b = parseBody(extendSchema, body);
    return this.campaigns.checkout(me.vendorId, me.staffId, id, b.from, b.days);
  }

  @Post('campaigns/:id/retry')
  @HttpCode(HttpStatus.OK)
  retry(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.retryLaunch(me.vendorId, id);
  }

  @Post('campaigns/:id/cancel')
  @HttpCode(HttpStatus.OK)
  cancel(@CurrentStaff() me: VendorPrincipal, @Param('id', ParseUUIDPipe) id: string) {
    return this.campaigns.cancel(me.vendorId, id);
  }
}
