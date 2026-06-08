import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SignUpDto } from './dto/sign-up.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
  ) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.name, dto.email);
  }

  /** Sends a one-time verification code to the given email (PRD §4.1 step 7). */
  @Post('otp/request')
  @HttpCode(HttpStatus.NO_CONTENT)
  async requestOtp(@Body() dto: RequestOtpDto) {
    await this.otpService.requestCode(dto.email);
  }

  /** Stores the Expo push token the mobile app obtained after the user granted notification permission. */
  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerPushToken(@Body() dto: RegisterPushTokenDto) {
    await this.authService.registerPushToken(dto.userId, dto.token);
  }
}
