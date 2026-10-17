import { BadRequestException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Database } from '../db/db.module';
import type { MailService } from '../mail/mail.service';
import type { MetaConfig } from '../social/meta-config';
import type { SocialConnectionsService } from '../social/social-connections.service';
import type { AiRepliesService } from './ai-replies.service';
import { InboxService } from './inbox.service';

// The 24h rule is checked before any database, AI or Meta call, so these fakes
// fail the test if the service gets that far.
const untouchable = <T>(name: string) =>
  new Proxy({}, { get: (_t, prop) => { if (prop === 'then') return undefined; throw new Error(`${name}.${String(prop)} was used`); } }) as T;

const now = new Date('2026-10-17T12:00:00Z');
const conv = (hoursSinceCustomer: number | null) => ({
  id: 'c1', vendorId: 'v1', channel: 'instagram' as const, businessExternalId: 'ig1', customerExternalId: 'u1', customerName: null, leadId: null,
  adReferral: null, lastMessageAt: now, lastMessagePreview: 'hi', unreadCount: 1, aiDueAt: null, aiSuggestion: null, aiPaused: false,
  handoffReason: null, handoffAt: null, createdAt: now, updatedAt: now,
  lastCustomerMessageAt: hoursSinceCustomer === null ? null : new Date(now.getTime() - hoursSinceCustomer * 3_600_000),
});

function service() {
  const ai = { get available() { return true; }, reply: () => { throw new Error('ai.reply was used'); } } as unknown as AiRepliesService;
  return new InboxService(
    untouchable<Database>('db'),
    { adsEnabled: true, get graph() { throw new Error('graph was used'); } } as unknown as MetaConfig,
    untouchable<SocialConnectionsService>('connections'),
    ai,
    untouchable<MailService>('mail'),
    untouchable<ConfigService>('config'),
  );
}

describe('InboxService — 24-hour window', () => {
  it('runAi does nothing once 24 hours have passed', async () => {
    await expect(service().runAi(conv(24.5), now)).resolves.toBeUndefined();
    await expect(service().runAi(conv(24 * 5), now)).resolves.toBeUndefined();
  });

  it('runAi does nothing before the customer has written', async () => {
    await expect(service().runAi(conv(null), now)).resolves.toBeUndefined();
  });

  it('sendOut refuses an AI message outside the window before calling Meta', async () => {
    await expect(service().sendOut(conv(25), 'Hello!', 'ai', null, now)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sendOut refuses a person’s message after 7 days', async () => {
    await expect(service().sendOut(conv(24 * 8), 'Hello!', 'vendor', 's1', now)).rejects.toThrow(/7 days/);
  });

  it('sendOut refuses WhatsApp until D4 picks a provider', async () => {
    await expect(service().sendOut({ ...conv(1), channel: 'whatsapp' }, 'Hello!', 'vendor', 's1', now)).rejects.toThrow(/coming soon/);
  });
});
