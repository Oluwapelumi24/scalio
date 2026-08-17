import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserAuthGuard } from './user-auth.guard';
import { UserJwtStrategy } from './user-jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('USER_JWT_SECRET') ?? 'dev-user-jwt-secret',
        // Long-lived — customers shouldn't have to re-authenticate every few
        // days on a device they own, same reasoning as the vendor session.
        signOptions: { expiresIn: '30d' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserJwtStrategy, UserAuthGuard],
  exports: [AuthService, UserAuthGuard],
})
export class AuthModule {}
