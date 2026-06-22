import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import { AdminAuthGuard } from './admin-auth.guard';
import { CurrentAdmin } from './current-admin.decorator';
import { AcceptAdminInviteDto } from './dto/accept-admin-invite.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { ForgotAdminPasswordDto } from './dto/forgot-admin-password.dto';
import { RequestAdminInviteDto } from './dto/request-admin-invite.dto';
import { ResetAdminPasswordDto } from './dto/reset-admin-password.dto';
import type { AdminPrincipal } from './admin-jwt.strategy';

@Controller('admin-auth')
export class AdminAuthController {
  constructor(private readonly adminAuth: AdminAuthService) {}

  @Post('invite')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestInvite(@Body() dto: RequestAdminInviteDto) {
    await this.adminAuth.issueInvite(dto.email);
  }

  @Post('accept-invite')
  acceptInvite(@Body() dto: AcceptAdminInviteDto) {
    return this.adminAuth.acceptInvite(dto.token, dto.password);
  }

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.adminAuth.login(dto.email, dto.password);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async forgotPassword(@Body() dto: ForgotAdminPasswordDto) {
    await this.adminAuth.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetAdminPasswordDto) {
    return this.adminAuth.resetPassword(dto.email, dto.code, dto.password);
  }

  @Get('me')
  @UseGuards(AdminAuthGuard)
  me(@CurrentAdmin() admin: AdminPrincipal) {
    return admin;
  }
}
