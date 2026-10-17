import { Module } from '@nestjs/common';
import { SocialModule } from '../social/social.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [VendorAuthModule, SocialModule],
  controllers: [AdsController],
  providers: [AdsService],
})
export class AdsModule {}
