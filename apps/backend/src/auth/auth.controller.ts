import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SignUpDto } from './dto/sign-up.dto';
import { RequestOtpDto } from './dto/request-otp.dto';

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
}
