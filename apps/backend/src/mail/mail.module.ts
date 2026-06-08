import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { MailService, RESEND } from './mail.service';

@Global()
@Module({
  providers: [
    {
      provide: RESEND,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Resend =>
        new Resend(config.get<string>('RESEND_API_KEY')),
    },
    MailService,
  ],
  exports: [MailService],
})
export class MailModule {}
