import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailService, RESEND } from './mail.service';

/** Non-empty stand-in so a missing key does not crash the whole API at boot. */
const UNCONFIGURED_KEY = 're_unconfigured';

@Global()
@Module({
  providers: [
    {
      provide: RESEND,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Resend => {
        const key = config.get<string>('RESEND_API_KEY')?.trim();
        if (!key) {
          Logger.warn('RESEND_API_KEY is not set. The API will start, but email will not send.', 'MailModule');
          return new Resend(UNCONFIGURED_KEY);
        }
        return new Resend(key);
      },
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
