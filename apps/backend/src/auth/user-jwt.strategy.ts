import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

export interface UserJwtPayload {
  sub: string;
}

@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(
    config: ConfigService,
    private readonly auth: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('USER_JWT_SECRET') ?? 'dev-user-jwt-secret',
    });
  }

  /** Re-resolves the user on every request so a deleted account loses access immediately, not just at token expiry. */
  async validate(payload: UserJwtPayload) {
    const user = await this.auth.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Your session is no longer valid — please sign in again.');
    }
    return user;
  }
}
