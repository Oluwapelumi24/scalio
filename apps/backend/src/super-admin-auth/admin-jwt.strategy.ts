import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AdminAuthService } from './admin-auth.service';

export interface AdminJwtPayload {
  sub: string;
}

export interface AdminPrincipal {
  adminId: string;
  name: string;
  email: string;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(
    config: ConfigService,
    private readonly adminAuth: AdminAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('ADMIN_JWT_SECRET') ?? 'dev-admin-jwt-secret',
    });
  }

  async validate(payload: AdminJwtPayload): Promise<AdminPrincipal> {
    const row = await this.adminAuth.findActiveAdminById(payload.sub);
    if (!row) throw new UnauthorizedException('Your session is no longer valid — please sign in again.');
    return { adminId: row.id, name: row.name, email: row.email! };
  }
}
