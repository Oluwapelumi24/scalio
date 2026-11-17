import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { CurrentStaff } from '../vendor-auth/current-staff.decorator';
import { Roles } from '../vendor-auth/roles.decorator';
import { RolesGuard } from '../vendor-auth/roles.guard';
import { VendorAuthGuard } from '../vendor-auth/vendor-auth.guard';
import type { VendorPrincipal } from '../vendor-auth/vendor-jwt.strategy';
import { UpdateVendorProfileDto } from './dto/update-profile.dto';
import { VendorProfileService } from './profile.service';

@Controller('vendor-admin/profile')
@UseGuards(VendorAuthGuard, RolesGuard)
@Roles('owner', 'manager', 'practitioner', 'front_desk')
export class VendorProfileController {
  constructor(private readonly profiles: VendorProfileService) {}

  @Get()
  get(@CurrentStaff() staff: VendorPrincipal) {
    return this.profiles.get(staff.vendorId);
  }

  @Patch()
  @Roles('owner', 'manager')
  update(@CurrentStaff() staff: VendorPrincipal, @Body() dto: UpdateVendorProfileDto) {
    return this.profiles.update(staff.vendorId, dto);
  }
}
