import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { IsString, Matches } from 'class-validator';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { AdsService } from './ads.service';

export class ChooseAdAccountDto {
  @IsString() @Matches(/^act_\d+$/, { message: 'adAccountId must look like act_123…' })
  adAccountId!: string;
}

/** Ads are money decisions: owners and managers set them up; front desk can look. */
@Controller('vendor-admin/ads')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager')
export class AdsController {
  constructor(private readonly ads: AdsService) {}

  @Get('setup')
  @Roles('owner', 'manager', 'front_desk')
  setup(@CurrentStaff() me: VendorPrincipal) {
    return this.ads.setup(me.vendorId);
  }

  @Get('ad-accounts')
  listAdAccounts(@CurrentStaff() me: VendorPrincipal) {
    return this.ads.listAdAccounts(me.vendorId);
  }

  @Put('ad-account')
  chooseAdAccount(@CurrentStaff() me: VendorPrincipal, @Body() dto: ChooseAdAccountDto) {
    return this.ads.chooseAdAccount(me.vendorId, me.staffId, dto.adAccountId);
  }

  @Post('ad-account/refresh')
  @HttpCode(HttpStatus.OK)
  refreshAdAccount(@CurrentStaff() me: VendorPrincipal) {
    return this.ads.refreshAdAccount(me.vendorId);
  }
}
