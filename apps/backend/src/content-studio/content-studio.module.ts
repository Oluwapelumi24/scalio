import { Module } from '@nestjs/common';
import { anthropicClientProvider } from '../common/anthropic';
import { PersonalisationModule } from '../personalisation/personalisation.module';
import { SocialModule } from '../social/social.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { CaptionService } from './caption.service';
import { ContentStudioController, PublicMediaController } from './content-studio.controller';
import { ContentStudioService } from './content-studio.service';

@Module({
  imports: [VendorAuthModule, PersonalisationModule, SocialModule],
  controllers: [ContentStudioController, PublicMediaController],
  providers: [
    anthropicClientProvider,
    CaptionService,
    ContentStudioService,
  ],
})
export class ContentStudioModule {}
