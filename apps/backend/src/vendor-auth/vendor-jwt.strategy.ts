import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { VendorAuthService } from './vendor-auth.service';

export interface VendorJwtPayload {
  sub: string;
  vendorId: string;
  role: string;
}

export interface VendorPrincipal {
  staffId: string;
  vendorId: string;
  name: string;
  email: string | null;
  role: string;
}

@Injectable()
export class VendorJwtStrategy extends PassportStrategy(
  Strategy,
  'vendor-jwt',
) {
  constructor(
    config: ConfigService,
    private readonly vendorAuth: VendorAuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        config.get<string>('VENDOR_JWT_SECRET') ?? 'dev-vendor-jwt-secret',
    });
  }

  /** Re-resolves the staff record on every request so a deactivated account loses access immediately, not just at token expiry. */
  async validate(payload: VendorJwtPayload): Promise<VendorPrincipal> {
    const row = await this.vendorAuth.findActiveStaffById(payload.sub);
    if (!row) {
      throw new UnauthorizedException(
        'Your session is no longer valid — please sign in again.',
      );
    }

    return {
      staffId: row.id,
      vendorId: row.vendorId,
      name: row.name,
      email: row.email,
      role: row.role,
    };
  }
}
