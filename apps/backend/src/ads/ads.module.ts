import { Module } from '@nestjs/common';
import { anthropicClientProvider } from '../common/anthropic';
import { PersonalisationModule } from '../personalisation/personalisation.module';
import { SocialModule } from '../social/social.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { AdCampaignsController } from './ad-campaigns.controller';
import { AdCampaignsService } from './ad-campaigns.service';
import { AdCopyService } from './ad-copy.service';
import { AdsConfig } from './ads-config';
import { AdsController } from './ads.controller';
import { AdsService } from './ads.service';

@Module({
  imports: [VendorAuthModule, SocialModule, PersonalisationModule],
  controllers: [AdsController, AdCampaignsController],
  providers: [anthropicClientProvider, AdsConfig, AdsService, AdCampaignsService, AdCopyService],
  exports: [AdCampaignsService],
})
export class AdsModule {}
