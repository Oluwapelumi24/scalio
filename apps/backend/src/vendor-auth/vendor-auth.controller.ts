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
import { RegisterVendorDto } from './dto/register-vendor.dto';
import { ExchangeHandoffDto } from './dto/handoff.dto';
import { SignupCodeDto, VerifySignupCodeDto } from './dto/signup-code.dto';
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

  /** Sends a 6-digit code so the person can prove the email before a business is created. */
  @Post('signup-code')
  async sendSignupCode(@Body() dto: SignupCodeDto) {
    await this.vendorAuth.requestSignupCode(dto.email);
    return { ok: true };
  }

  @Post('signup-code/verify')
  async verifySignupCode(@Body() dto: VerifySignupCodeDto) {
    const proof = await this.vendorAuth.confirmSignupCode(dto.email, dto.code);
    return { proof };
  }

  @Post('register')
  register(@Body() dto: RegisterVendorDto) {
    return this.vendorAuth.register(
      dto.ownerName,
      dto.businessName,
      dto.email,
      dto.password,
      dto.proof,
      dto.registrationNumber,
      dto.category,
      dto.address,
      dto.phone,
    );
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

  /** Mint a short-lived code that opens the dashboard on another origin. */
  @Post('handoff')
  @UseGuards(VendorAuthGuard)
  createHandoff(@CurrentStaff() staff: VendorPrincipal) {
    return this.vendorAuth.createHandoff(staff.staffId);
  }

  @Post('handoff/exchange')
  exchangeHandoff(@Body() dto: ExchangeHandoffDto) {
    return this.vendorAuth.exchangeHandoff(dto.code);
  }

  /** Whether customers can see this listing yet. New businesses stay in review. */
  @Get('listing')
  @UseGuards(VendorAuthGuard)
  listing(@CurrentStaff() staff: VendorPrincipal) {
    return this.vendorAuth.listing(staff.vendorId);
  }
}
