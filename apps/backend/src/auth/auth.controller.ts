import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import type { InferSelectModel } from 'drizzle-orm';
import {
  AuthEmailThrottle,
  AuthStrictIpThrottle,
  LoginThrottle,
} from '../common/throttling/apply-throttlers';
import type { users } from '../db/schema';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { SetPhoneDto } from './dto/set-phone.dto';
import { SignInDto } from './dto/sign-in.dto';
import { SignUpDto } from './dto/sign-up.dto';
import { UserAuthGuard } from './user-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.name, dto.email, dto.password, dto.phone);
  }

  @Post('signin')
  @LoginThrottle()
  signIn(@Body() dto: SignInDto) {
    return this.authService.signIn(dto.email, dto.password);
  }

  /** Always 204 — never reveals whether the email is known. */
  @Post('forgot-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AuthEmailThrottle()
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    await this.authService.requestPasswordReset(dto.email);
  }

  @Post('reset-password')
  @AuthStrictIpThrottle()
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.code, dto.password);
  }

  /** Lets the app validate a stored session token on launch and re-fetch the current user. */
  @Get('me')
  @UseGuards(UserAuthGuard)
  me(@CurrentUser() user: InferSelectModel<typeof users>) {
    return { id: user.id, name: user.name, email: user.email, phone: user.phone };
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(UserAuthGuard)
  async deleteMe(@CurrentUser() user: InferSelectModel<typeof users>, @Body() dto: DeleteAccountDto) {
    await this.authService.deleteAccount(user.id, dto.password);
  }

  @Post('phone')
  @UseGuards(UserAuthGuard)
  setPhone(@CurrentUser() user: InferSelectModel<typeof users>, @Body() dto: SetPhoneDto) {
    return this.authService.setPhone(user.id, dto.phone);
  }

  /** Stores the Expo push token the mobile app obtained after the user granted notification permission. */
  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerPushToken(@Body() dto: RegisterPushTokenDto) {
    await this.authService.registerPushToken(dto.userId, dto.token);
  }
}
