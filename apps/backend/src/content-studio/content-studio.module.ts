import Anthropic from '@anthropic-ai/sdk';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PersonalisationModule } from '../personalisation/personalisation.module';
import { VendorAuthModule } from '../vendor-auth/vendor-auth.module';
import { ANTHROPIC_CLIENT, CaptionService } from './caption.service';
import { ContentStudioController } from './content-studio.controller';
import { ContentStudioService } from './content-studio.service';

@Module({
  imports: [VendorAuthModule, PersonalisationModule],
  controllers: [ContentStudioController],
  providers: [
    {
      provide: ANTHROPIC_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Anthropic | null => {
        const apiKey = config.get<string>('ANTHROPIC_API_KEY');
        return apiKey ? new Anthropic({ apiKey }) : null;
      },
    },
    CaptionService,
    ContentStudioService,
  ],
})
export class ContentStudioModule {}
