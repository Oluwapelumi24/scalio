import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export const RESEND = Symbol('RESEND');

@Injectable()
export class MailService {
  constructor(
    @Inject(RESEND) private readonly resend: Resend,
    private readonly config: ConfigService,
  ) {}

  async sendOtpEmail(to: string, code: string): Promise<void> {
    await this.resend.emails.send({
      from:
        this.config.get<string>('MAIL_FROM') ??
        'Scalio <onboarding@resend.dev>',
      to,
      subject: `${code} is your Scalio verification code`,
      text: `Your Scalio verification code is ${code}. It expires in 10 minutes.`,
    });
  }

  async sendVendorInviteEmail(to: string, businessName: string, acceptUrl: string): Promise<void> {
    await this.resend.emails.send({
      from:
        this.config.get<string>('MAIL_FROM') ??
        'Scalio <onboarding@resend.dev>',
      to,
      subject: `You've been invited to manage ${businessName} on Scalio`,
      text: `You've been added as a team member for ${businessName} on Scalio. Set your password to finish setting up your account: ${acceptUrl}\n\nThis link expires in 7 days.`,
    });
  }
}
