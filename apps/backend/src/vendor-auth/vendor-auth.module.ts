import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { VendorAuthController } from './vendor-auth.controller';
import { VendorAuthGuard } from './vendor-auth.guard';
import { VendorAuthService } from './vendor-auth.service';
import { VendorInviteService } from './vendor-invite.service';
import { VendorJwtStrategy } from './vendor-jwt.strategy';
import { VendorPasswordResetService } from './vendor-password-reset.service';
import { RolesGuard } from './roles.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:
          config.get<string>('VENDOR_JWT_SECRET') ?? 'dev-vendor-jwt-secret',
        // Admin sessions outlive customer OTP-gated ones — a vendor staying
        // signed in across a workday (and beyond) matters more than minimizing
        // the replay window for a token that only unlocks their own dashboard.
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [VendorAuthController],
  providers: [
    VendorAuthService,
    VendorInviteService,
    VendorPasswordResetService,
    VendorJwtStrategy,
    VendorAuthGuard,
    RolesGuard,
  ],
  exports: [VendorAuthService, VendorAuthGuard, RolesGuard],
})
export class VendorAuthModule {}
