import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthGuard } from './admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';
import { AdminInviteService } from './admin-invite.service';
import { AdminJwtStrategy } from './admin-jwt.strategy';
import { AdminPasswordResetService } from './admin-password-reset.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('ADMIN_JWT_SECRET') ?? 'dev-admin-jwt-secret',
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminInviteService,
    AdminPasswordResetService,
    AdminJwtStrategy,
    AdminAuthGuard,
  ],
  exports: [AdminAuthService, AdminAuthGuard],
})
export class SuperAdminAuthModule {}
