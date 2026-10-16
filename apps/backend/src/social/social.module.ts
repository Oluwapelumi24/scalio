import { Module } from '@nestjs/common';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { MetaConfig } from './meta-config';
import { PublisherService } from './publisher.service';
import { MetaCallbackController, SocialController } from './social.controller';
import { SocialConnectionsService } from './social-connections.service';

@Module({
  imports: [VendorAuthModule],
  controllers: [SocialController, MetaCallbackController],
  providers: [MetaConfig, SocialConnectionsService, PublisherService],
  exports: [MetaConfig, SocialConnectionsService, PublisherService],
})
export class SocialModule {}
