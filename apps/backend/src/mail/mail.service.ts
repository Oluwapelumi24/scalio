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

  async sendAdminInviteEmail(to: string, acceptUrl: string): Promise<void> {
    await this.resend.emails.send({
      from: this.config.get<string>('MAIL_FROM') ?? 'Scalio <onboarding@resend.dev>',
      to,
      subject: "You've been invited to the Scalio admin portal",
      text: `You've been added as an operations manager on Scalio. Set your password to activate your account: ${acceptUrl}\n\nThis link expires in 7 days.`,
    });
  }

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    // Resend reports failures in the result rather than throwing.
    const { error } = await this.resend.emails.send({
      from:
        this.config.get<string>('MAIL_FROM') ??
        'Scalio <onboarding@resend.dev>',
      to,
      subject: 'Reset your Scalio Vendor password',
      text: `Your password reset code is: ${code}\n\nEnter this code in the app to set a new password. It expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email.`,
    });
    if (error) throw new Error(`${error.name}: ${error.message}`);
  }

  /** Asks a customer to rate a visit. Throws if Resend rejects it, so the caller can log why. */
  async sendFeedbackRequestEmail(to: string, customerName: string, businessName: string, link: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.config.get<string>('MAIL_FROM') ?? 'Scalio <onboarding@resend.dev>',
      to,
      subject: `How was your visit to ${businessName}?`,
      text: `Hi ${customerName},\n\nThanks for visiting ${businessName}. How did it go? It takes 10 seconds:\n\n${link}\n\nYour feedback goes to ${businessName} so they can keep doing what you liked and fix what you didn't.`,
    });
    if (error) throw new Error(`${error.name}: ${error.message}`);
  }
}
