import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentStaff } from './current-staff.decorator';
import { AcceptVendorInviteDto } from './dto/accept-vendor-invite.dto';
import { ForgotVendorPasswordDto } from './dto/forgot-vendor-password.dto';
import { RequestVendorInviteDto } from './dto/request-vendor-invite.dto';
import { ResetVendorPasswordDto } from './dto/reset-vendor-password.dto';
import { VendorLoginDto } from './dto/vendor-login.dto';
import { VendorAuthGuard } from './vendor-auth.guard';
import { VendorAuthService } from './vendor-auth.service';
import type { VendorPrincipal } from './vendor-jwt.strategy';

@Controller('vendor-auth')
export class VendorAuthController {
  constructor(private readonly vendorAuth: VendorAuthService) {}

  /** Sends a setup link to a platform-provisioned staff account. Always 204s — never reveals whether the email is known. */
  @Post('invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestInvite(@Body() dto: RequestVendorInviteDto) {
    await this.vendorAuth.issueInvite(dto.email);
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptVendorInviteDto) {
    return this.vendorAuth.acceptInvite(dto.token, dto.password);
  }

  @Post('login')
  login(@Body() dto: VendorLoginDto) {
    return this.vendorAuth.login(dto.email, dto.password);
  }

  /** Always 204 — never reveals whether the email is known. */
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotVendorPasswordDto) {
    await this.vendorAuth.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetVendorPasswordDto) {
    return this.vendorAuth.resetPassword(dto.email, dto.code, dto.password);
  }

  @Get('me')
  @UseGuards(VendorAuthGuard)
  me(@CurrentStaff() staff: VendorPrincipal) {
    return staff;
  }
}
