import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/sign-up.dto';
import { RegisterPushTokenDto } from './dto/register-push-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  signUp(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto.name, dto.email);
  }

  /** Stores the Expo push token the mobile app obtained after the user granted notification permission. */
  @Post('push-token')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registerPushToken(@Body() dto: RegisterPushTokenDto) {
    await this.authService.registerPushToken(dto.userId, dto.token);
  }
}
