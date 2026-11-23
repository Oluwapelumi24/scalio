import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { BookingPreviewService } from '../vendor/booking-preview.service';
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
  constructor(
    private readonly profiles: VendorProfileService,
    private readonly bookingPreview: BookingPreviewService,
  ) {}

  @Get()
  get(@CurrentStaff() staff: VendorPrincipal) {
    return this.profiles.get(staff.vendorId);
  }

  /** Mint a short-lived token so staff can open /book/:slug before approval. */
  @Post('preview')
  async preview(@CurrentStaff() staff: VendorPrincipal) {
    const profile = await this.profiles.get(staff.vendorId);
    const token = await this.bookingPreview.issue(profile.slug);
    return { slug: profile.slug, token, approvalStatus: profile.approvalStatus };
  }

  @Patch()
  @Roles('owner', 'manager')
  update(@CurrentStaff() staff: VendorPrincipal, @Body() dto: UpdateVendorProfileDto) {
    return this.profiles.update(staff.vendorId, dto);
  }
}
