import { Module } from '@nestjs/common';
import { anthropicClientProvider } from '../common/anthropic';
import { PersonalisationModule } from '../personalisation/personalisation.module';
import { SocialModule } from '../social/social.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { AiRepliesService } from './ai-replies.service';
import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';
import { InboxWorker } from './inbox-worker.service';

/** Ads Manager Phase 2: unified inbox and AI replies. Everything is off unless ADS_MANAGER_ENABLED=true. */
@Module({
  imports: [VendorAuthModule, SocialModule, PersonalisationModule],
  controllers: [InboxController],
  providers: [anthropicClientProvider, AiRepliesService, InboxService, InboxWorker],
})
export class InboxModule {}
