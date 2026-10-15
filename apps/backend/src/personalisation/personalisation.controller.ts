import { Body, Controller, Get, HttpCode, HttpStatus, Post, Put, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { INTEREST_GROUPS } from './catalog';
import { RecordUsageDto } from './dto/record-usage.dto';
import { UpdatePreferencesDto } from './dto/update-preferences.dto';
import { buildHome } from './home';
import { HomeDataService } from './home-data.service';
import { PreferencesService } from './preferences.service';

// Interests and home layout belong to the business: every role reads them, only
// owners and managers change them.
@Controller('vendor-admin')
@UseGuards(VendorAuthGuard, RolesGuard)
export class PersonalisationController {
  constructor(
    private readonly preferences: PreferencesService,
    private readonly homeData: HomeDataService,
  ) {}

  @Get('personalisation/interests')
  listInterests() {
    return INTEREST_GROUPS;
  }

  @Get('preferences')
  getPreferences(@CurrentStaff() staff: VendorPrincipal) {
    return this.preferences.get(staff.vendorId);
  }

  @Put('preferences')
  @Roles('owner', 'manager')
  updatePreferences(@CurrentStaff() staff: VendorPrincipal, @Body() dto: UpdatePreferencesDto) {
    return this.preferences.update(staff.vendorId, dto);
  }

  @Post('preferences/reset-home')
  @Roles('owner', 'manager')
  resetHome(@CurrentStaff() staff: VendorPrincipal) {
    return this.preferences.resetHome(staff.vendorId);
  }

  @Get('home')
  async getHome(@CurrentStaff() staff: VendorPrincipal) {
    const now = new Date();
    const practitionerId = staff.role === 'practitioner' ? staff.staffId : undefined;
    const [snapshot, prefs] = await Promise.all([
      this.homeData.load(staff.vendorId, now, staff.staffId, practitionerId),
      this.preferences.get(staff.vendorId),
    ]);
    return buildHome(snapshot, prefs, staff.role, now);
  }

  @Post('home/usage')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recordUsage(@CurrentStaff() staff: VendorPrincipal, @Body() dto: RecordUsageDto) {
    await this.preferences.recordUsage(staff.vendorId, dto.moduleId);
  }
}
