import { BadRequestException, Inject, Injectable, Logger, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import type { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { DB, type Database } from '../db/db.module';
import {
  conversations, inboxSettings, leads, messages, socialConnections, vendors,
  type AiReplyMode, type FaqEntry, type HandoffReason, type InboxChannel,
} from '../db/schema';
import { MailService } from '../mail/mail.service';
import { MetaConfig } from '../social/meta-config';
import { MetaApiError } from '../social/meta-graph';
import { SocialConnectionsService } from '../social/social-connections.service';
import { AiRepliesService } from './ai-replies.service';
import { HANDOFF_LABELS, detectHandoff } from './handoff';
import { canSend, replyWindow } from './reply-window';
import type { TranscriptLine } from './reply-writer';
import { previewOf, type InboundChatMessage } from './webhook-parse';

type ConversationRow = typeof conversations.$inferSelect;

/** Wait this long after a customer's message before the AI answers, so a burst of messages gets one reply. */
export const AI_DEBOUNCE_MS = 8_000;
const TRANSCRIPT_LENGTH = 20;

/** Messenger chats belong to the Facebook Page connection. */
const connectionFor = (channel: InboxChannel): 'facebook' | 'instagram' | null =>
  channel === 'messenger' ? 'facebook' : channel === 'instagram' ? 'instagram' : null;

const leadSourceFor = (channel: InboxChannel) => (channel === 'messenger' ? 'facebook' : channel);
const CHANNEL_LABEL: Record<InboxChannel, string> = { instagram: 'Instagram', messenger: 'Messenger', whatsapp: 'WhatsApp' };
const placeholderName = (channel: InboxChannel) => `${CHANNEL_LABEL[channel]} customer`;

export interface IngestResult {
  conversationId: string;
  vendorId: string;
  isNewConversation: boolean;
}

@Injectable()
export class InboxService {
  private readonly logger = new Logger(InboxService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly meta: MetaConfig,
    private readonly connections: SocialConnectionsService,
    private readonly ai: AiRepliesService,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private assertEnabled() {
    if (!this.meta.adsEnabled) throw new ServiceUnavailableException('The inbox isn’t switched on in Scalio yet.');
  }

  // ── From webhooks ─────────────────────────────────────────────────────────

  /**
   * Stores one chat message, creating the conversation (and its lead) the
   * first time a customer writes. Safe to repeat: Meta's message id is unique.
   * Null when no business has that Page / Instagram account connected.
   */
  async ingest(m: InboundChatMessage, now = new Date()): Promise<IngestResult | null> {
    const platform = connectionFor(m.channel)!;
    const [conn] = await this.db
      .select({ vendorId: socialConnections.vendorId })
      .from(socialConnections)
      .where(and(eq(socialConnections.platform, platform), eq(socialConnections.externalId, m.businessId)))
      .limit(1);
    if (!conn) {
      this.logger.debug(`No business connected for ${m.channel} ${m.businessId}; message ${m.mid} skipped`);
      return null;
    }
    const vendorId = conn.vendorId;
    const [settings] = await this.db.select({ aiModes: inboxSettings.aiModes }).from(inboxSettings).where(eq(inboxSettings.vendorId, vendorId));
    const mode: AiReplyMode = settings?.aiModes[m.channel] ?? 'off';

    return this.db.transaction(async (tx) => {
      const [dupe] = await tx.select({ id: messages.id }).from(messages).where(eq(messages.externalId, m.mid));
      if (dupe) return null;

      // Find or create the conversation.
      const key = and(eq(conversations.vendorId, vendorId), eq(conversations.channel, m.channel), eq(conversations.customerExternalId, m.customerId));
      let [conv] = await tx.select().from(conversations).where(key);
      let isNew = false;
      if (!conv) {
        [conv] = await tx.insert(conversations).values({
          vendorId, channel: m.channel, businessExternalId: m.businessId, customerExternalId: m.customerId,
          adReferral: m.referral, lastMessageAt: m.sentAt,
        }).onConflictDoNothing().returning();
        isNew = !!conv;
        if (!conv) [conv] = await tx.select().from(conversations).where(key); // created by a parallel worker
      }

      const inserted = await tx.insert(messages).values({
        conversationId: conv.id, vendorId, direction: m.fromBusiness ? 'out' : 'in', sentBy: m.fromBusiness ? 'vendor' : 'customer',
        externalId: m.mid, text: m.text, attachments: m.attachments, status: m.fromBusiness ? 'sent' : 'received', sentAt: m.sentAt,
      }).onConflictDoNothing().returning({ id: messages.id });
      if (inserted.length === 0) return null;

      // Each new chat from a customer is a lead (or refreshes the one it already has).
      let leadId = conv.leadId;
      if (!m.fromBusiness) leadId = await this.upsertLead(tx, conv, m, now);

      const newer = m.sentAt.getTime() >= conv.lastMessageAt.getTime();
      const set: PgUpdateSetSource<typeof conversations> = { leadId, updatedAt: now };
      if (newer || isNew) Object.assign(set, { lastMessageAt: m.sentAt, lastMessagePreview: previewOf(m) });
      if (!conv.adReferral && m.referral) set.adReferral = m.referral;
      if (m.fromBusiness) {
        // The business answered from Meta's own apps: this turn is handled.
        Object.assign(set, { aiDueAt: null, aiSuggestion: null });
      } else {
        const last = conv.lastCustomerMessageAt;
        if (!last || m.sentAt > last) set.lastCustomerMessageAt = m.sentAt;
        set.unreadCount = sql`${conversations.unreadCount} + 1`;
        set.aiSuggestion = null;
        if (mode !== 'off' && !conv.aiPaused) set.aiDueAt = new Date(now.getTime() + AI_DEBOUNCE_MS);
      }
      await tx.update(conversations).set(set).where(eq(conversations.id, conv.id));
      return { conversationId: conv.id, vendorId, isNewConversation: isNew };
    });
  }

  private async upsertLead(tx: Parameters<Parameters<Database['transaction']>[0]>[0], conv: ConversationRow, m: InboundChatMessage, now: Date): Promise<string> {
    const adNote = m.referral ? ` from the ad${m.referral.adTitle ? ` “${m.referral.adTitle}”` : ''}` : '';
    if (conv.leadId) {
      const [lead] = await tx.update(leads).set({ updatedAt: now }).where(eq(leads.id, conv.leadId)).returning({ id: leads.id });
      if (lead) return lead.id;
    }
    const [lead] = await tx.insert(leads).values({
      vendorId: conv.vendorId,
      name: conv.customerName ?? placeholderName(m.channel),
      source: leadSourceFor(m.channel),
      note: `Started a chat on ${CHANNEL_LABEL[m.channel]}${adNote}.`,
    }).returning({ id: leads.id });
    return lead.id;
  }

  /** Fills in the customer's name from Meta (best effort) — on the chat and on its lead if that still has the placeholder. */
  async fetchCustomerName(conversationId: string) {
    const [conv] = await this.db.select().from(conversations).where(eq(conversations.id, conversationId));
    if (!conv || conv.customerName || conv.channel === 'whatsapp' || !this.meta.graph) return;
    const creds = await this.connections.credentials(conv.vendorId, connectionFor(conv.channel)!);
    if (!creds) return;
    try {
      const name = await this.meta.graph.chatUserName(conv.channel, conv.customerExternalId, creds.token);
      if (!name) return;
      await this.db.update(conversations).set({ customerName: name, updatedAt: new Date() }).where(eq(conversations.id, conv.id));
      if (conv.leadId) {
        await this.db.update(leads).set({ name, updatedAt: new Date() })
          .where(and(eq(leads.id, conv.leadId), eq(leads.name, placeholderName(conv.channel))));
      }
    } catch (err) {
      this.logger.debug(`Couldn't fetch customer name for ${conv.id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ── AI step ───────────────────────────────────────────────────────────────

  /** Atomically takes chats whose AI reply is due, so two servers never answer the same one. */
  async claimDueAi(now: Date, limit = 5): Promise<ConversationRow[]> {
    const due = this.db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(isNotNull(conversations.aiDueAt), sql`${conversations.aiDueAt} <= ${now}`))
      .orderBy(conversations.aiDueAt)
      .limit(limit)
      .for('update', { skipLocked: true });
    return this.db.update(conversations).set({ aiDueAt: null }).where(inArray(conversations.id, due)).returning();
  }

  /** Answers (or suggests, or hands off) for one chat. Never sends outside the 24h window. */
  async runAi(conv: ConversationRow, now = new Date()) {
    if (conv.aiPaused || !this.ai.available) return;
    if (!canSend(conv.channel, 'ai', conv.lastCustomerMessageAt, now).ok) return;
    const mode = await this.modeFor(conv.vendorId, conv.channel);
    if (mode === 'off') return;

    const recent = await this.recentMessages(conv.id, TRANSCRIPT_LENGTH);
    const last = recent[recent.length - 1];
    if (!last || last.sentBy !== 'customer') return; // already answered

    // Rule-based hand-off first: complaints and refunds never reach the model.
    const unanswered = recent.slice(recent.findLastIndex((r) => r.sentBy !== 'customer') + 1);
    const ruled = detectHandoff(unanswered.map((r) => r.text).join('\n'));
    if (ruled) return this.handOff(conv, ruled);

    const decision = await this.ai.reply(conv.vendorId, {
      channel: conv.channel,
      customerName: conv.customerName,
      adTitle: conv.adReferral?.adTitle ?? null,
      transcript: recent.map(toTranscriptLine),
    });
    if (!decision) return;
    if (decision.action === 'handoff') return this.handOff(conv, decision.reason);

    // Things may have moved on during the AI call: a newer message, the vendor stepping in, or AI switched off.
    const [fresh] = await this.db.select().from(conversations).where(eq(conversations.id, conv.id));
    const [newest] = await this.recentMessages(conv.id, 1);
    if (!fresh || fresh.aiPaused || newest?.id !== last.id || fresh.aiDueAt) return;
    const freshMode = await this.modeFor(conv.vendorId, conv.channel);
    if (freshMode === 'suggest') {
      await this.db.update(conversations).set({ aiSuggestion: decision.text, updatedAt: new Date() }).where(eq(conversations.id, conv.id));
    } else if (freshMode === 'reply') {
      await this.sendOut(fresh, decision.text, 'ai', null, new Date());
    }
  }

  /** Stops the AI for this chat and tells the vendor. */
  async handOff(conv: ConversationRow, reason: HandoffReason) {
    const now = new Date();
    await this.db.update(conversations)
      .set({ aiPaused: true, handoffReason: reason, handoffAt: now, aiSuggestion: null, aiDueAt: null, updatedAt: now })
      .where(eq(conversations.id, conv.id));
    const [vendor] = await this.db.select({ email: vendors.ownerEmail, name: vendors.businessName }).from(vendors).where(eq(vendors.id, conv.vendorId));
    if (!vendor?.email) return;
    const web = (this.config.get<string>('VENDOR_WEB_URL') ?? 'http://localhost:3001').replace(/\/$/, '');
    await this.mail
      .sendInboxHandoffEmail(vendor.email, vendor.name, conv.customerName ?? placeholderName(conv.channel), CHANNEL_LABEL[conv.channel], HANDOFF_LABELS[reason], `${web}/dashboard/inbox?c=${conv.id}`)
      .catch((err: unknown) => this.logger.warn(`Hand-off email failed for ${conv.id}: ${err instanceof Error ? err.message : String(err)}`));
  }

  // ── Sending ───────────────────────────────────────────────────────────────

  /** Sends through Meta and records it. Enforces the 24h window (AI) and the 7-day human-agent window (vendor). */
  async sendOut(conv: ConversationRow, text: string, sender: 'ai' | 'vendor', staffId: string | null, now = new Date()) {
    const decision = canSend(conv.channel, sender, conv.lastCustomerMessageAt, now);
    if (!decision.ok) throw new BadRequestException(decision.reason);
    if (conv.channel === 'whatsapp') {
      // Waits on D4 (Tech Provider vs BSP): there's no WhatsApp sender yet.
      throw new ServiceUnavailableException('Replying on WhatsApp from Scalio is coming soon. Reply from the WhatsApp Business app for now.');
    }
    const graph = this.meta.graph;
    const platform = connectionFor(conv.channel)!;
    const creds = await this.connections.credentials(conv.vendorId, platform);
    if (!graph || !creds) throw new BadRequestException(`Reconnect your ${platform === 'facebook' ? 'Facebook Page' : 'Instagram account'} to reply from Scalio.`);
    if (creds.externalId !== conv.businessExternalId) {
      throw new BadRequestException('This chat belongs to an account that’s no longer connected to Scalio.');
    }

    let messageId: string;
    try {
      ({ messageId } = await graph.sendMessage(creds.token, conv.customerExternalId, text, decision.humanAgentTag));
    } catch (err) {
      if (err instanceof MetaApiError) {
        this.logger.warn(`Send failed for ${conv.id}: ${err.code ?? '-'}/${err.subcode ?? '-'} ${err.message}`);
        if (err.needsReconnect) await this.connections.markNeedsReconnect(conv.vendorId, platform, err.message);
        throw new BadRequestException(err.needsReconnect ? 'Facebook stopped Scalio’s access. Reconnect your account, then try again.' : `Meta didn’t deliver it: ${err.message}`);
      }
      throw err;
    }

    const values = {
      conversationId: conv.id, vendorId: conv.vendorId, direction: 'out' as const, sentBy: sender, externalId: messageId, text,
      status: 'sent' as const, humanAgentTag: decision.humanAgentTag, staffId, sentAt: now,
    };
    // Meta echoes our own message back as a webhook; whichever lands first, the row says who really sent it.
    await this.db.insert(messages).values(values)
      .onConflictDoUpdate({ target: messages.externalId, set: { sentBy: sender, staffId, humanAgentTag: decision.humanAgentTag } });
    await this.db.update(conversations).set({
      lastMessageAt: now, lastMessagePreview: previewOf({ text, attachments: [] }), aiSuggestion: null, unreadCount: 0, updatedAt: now,
      // A person replying deals with whatever needed them.
      ...(sender === 'vendor' ? { handoffReason: null, handoffAt: null } : {}),
    }).where(eq(conversations.id, conv.id));
  }

  // ── Vendor-facing ─────────────────────────────────────────────────────────

  async list(vendorId: string, filter: 'all' | 'needs_you' = 'all', now = new Date()) {
    this.assertEnabled();
    const where = [eq(conversations.vendorId, vendorId)];
    if (filter === 'needs_you') where.push(isNotNull(conversations.handoffReason));
    const [rows, modes] = await Promise.all([
      this.db.select().from(conversations).where(and(...where)).orderBy(desc(conversations.lastMessageAt)).limit(200),
      this.modes(vendorId),
    ]);
    return rows.map((c) => this.view(c, modes, now));
  }

  async get(vendorId: string, id: string, now = new Date()) {
    this.assertEnabled();
    const conv = await this.own(vendorId, id);
    const [rows, modes] = await Promise.all([this.recentMessages(id, 200), this.modes(vendorId)]);
    if (conv.unreadCount) await this.db.update(conversations).set({ unreadCount: 0 }).where(eq(conversations.id, id));
    return {
      ...this.view({ ...conv, unreadCount: 0 }, modes, now),
      aiSuggestion: conv.aiSuggestion,
      messages: rows.map((r) => ({
        id: r.id, direction: r.direction, sentBy: r.sentBy, text: r.text, attachments: r.attachments, status: r.status,
        humanAgentTag: r.humanAgentTag, sentAt: r.sentAt,
      })),
    };
  }

  async reply(vendorId: string, staffId: string, id: string, text: string) {
    this.assertEnabled();
    const body = text.trim();
    if (!body) throw new BadRequestException('Write a message first.');
    await this.sendOut(await this.own(vendorId, id), body, 'vendor', staffId);
    return this.get(vendorId, id);
  }

  /** "Suggest" on demand: an AI draft for the vendor to edit and send. Never sent by itself. */
  async suggest(vendorId: string, id: string) {
    this.assertEnabled();
    const conv = await this.own(vendorId, id);
    const recent = await this.recentMessages(id, TRANSCRIPT_LENGTH);
    if (!recent.some((r) => r.sentBy === 'customer')) throw new BadRequestException('There’s nothing from the customer to answer yet.');
    const unanswered = recent.slice(recent.findLastIndex((r) => r.sentBy !== 'customer') + 1);
    const ruled = detectHandoff(unanswered.map((r) => r.text).join('\n'));
    if (ruled) return { suggestion: null, handoff: { reason: ruled, label: HANDOFF_LABELS[ruled] } };
    const decision = await this.ai.reply(vendorId, {
      channel: conv.channel, customerName: conv.customerName, adTitle: conv.adReferral?.adTitle ?? null, transcript: recent.map(toTranscriptLine),
    });
    if (!decision) throw new BadRequestException('You’ve used today’s AI allowance for the inbox. Try again tomorrow.');
    if (decision.action === 'handoff') return { suggestion: null, handoff: { reason: decision.reason, label: HANDOFF_LABELS[decision.reason] } };
    await this.db.update(conversations).set({ aiSuggestion: decision.text, updatedAt: new Date() }).where(eq(conversations.id, id));
    return { suggestion: decision.text, handoff: null };
  }

  /** Pause the AI for one chat, or hand it back to the AI (which also clears "Needs you"). */
  async setAiPaused(vendorId: string, id: string, paused: boolean) {
    this.assertEnabled();
    await this.own(vendorId, id);
    await this.db.update(conversations)
      .set(paused ? { aiPaused: true, aiDueAt: null, updatedAt: new Date() } : { aiPaused: false, handoffReason: null, handoffAt: null, updatedAt: new Date() })
      .where(eq(conversations.id, id));
    return this.get(vendorId, id);
  }

  async settings(vendorId: string) {
    this.assertEnabled();
    const [[row], conns] = await Promise.all([
      this.db.select().from(inboxSettings).where(eq(inboxSettings.vendorId, vendorId)),
      this.db.select({ platform: socialConnections.platform, status: socialConnections.status, displayName: socialConnections.displayName })
        .from(socialConnections).where(eq(socialConnections.vendorId, vendorId)),
    ]);
    const conn = (p: 'facebook' | 'instagram' | 'whatsapp') => conns.find((c) => c.platform === p) ?? null;
    const channel = (ch: InboxChannel, p: 'facebook' | 'instagram' | 'whatsapp') => {
      const c = conn(p);
      return {
        channel: ch, connected: c?.status === 'active', accountName: c?.displayName ?? null,
        // WhatsApp sending waits on D4; it shows as "coming soon".
        comingSoon: ch === 'whatsapp', mode: (row?.aiModes[ch] ?? 'off') as AiReplyMode,
      };
    };
    return {
      aiAvailable: this.ai.available,
      channels: [channel('instagram', 'instagram'), channel('messenger', 'facebook'), channel('whatsapp', 'whatsapp')],
      faq: row?.faq ?? [],
    };
  }

  async updateSettings(vendorId: string, staffId: string, patch: { aiModes?: Partial<Record<InboxChannel, AiReplyMode>>; faq?: FaqEntry[] }) {
    this.assertEnabled();
    const [current] = await this.db.select().from(inboxSettings).where(eq(inboxSettings.vendorId, vendorId));
    const aiModes = { ...(current?.aiModes ?? {}), ...(patch.aiModes ?? {}) };
    if (aiModes.whatsapp && aiModes.whatsapp !== 'off') throw new BadRequestException('AI replies on WhatsApp are coming soon.');
    const faq = patch.faq
      ? patch.faq.map((f) => ({ question: f.question.trim(), answer: f.answer.trim() })).filter((f) => f.question || f.answer)
      : current?.faq ?? [];
    const values = { aiModes, faq, updatedById: staffId, updatedAt: new Date() };
    await this.db.insert(inboxSettings).values({ vendorId, ...values }).onConflictDoUpdate({ target: inboxSettings.vendorId, set: values });
    return this.settings(vendorId);
  }

  async draftFaq(vendorId: string) {
    this.assertEnabled();
    return { faq: await this.ai.draftFaq(vendorId) };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private async own(vendorId: string, id: string): Promise<ConversationRow> {
    const [conv] = await this.db.select().from(conversations).where(and(eq(conversations.id, id), eq(conversations.vendorId, vendorId)));
    if (!conv) throw new NotFoundException('Chat not found');
    return conv;
  }

  /** The last `n` messages, oldest first. */
  private async recentMessages(conversationId: string, n: number) {
    const rows = await this.db.select().from(messages).where(eq(messages.conversationId, conversationId)).orderBy(desc(messages.sentAt), desc(messages.createdAt)).limit(n);
    return rows.reverse();
  }

  private async modes(vendorId: string) {
    const [row] = await this.db.select({ aiModes: inboxSettings.aiModes }).from(inboxSettings).where(eq(inboxSettings.vendorId, vendorId));
    return row?.aiModes ?? {};
  }

  private async modeFor(vendorId: string, channel: InboxChannel): Promise<AiReplyMode> {
    return (await this.modes(vendorId))[channel] ?? 'off';
  }

  private view(c: ConversationRow, modes: Partial<Record<InboxChannel, AiReplyMode>>, now: Date) {
    return {
      id: c.id, channel: c.channel, customerName: c.customerName ?? placeholderName(c.channel), preview: c.lastMessagePreview,
      lastMessageAt: c.lastMessageAt, unreadCount: c.unreadCount, window: replyWindow(c.channel, c.lastCustomerMessageAt, now),
      aiMode: modes[c.channel] ?? 'off', aiPaused: c.aiPaused, leadId: c.leadId, adTitle: c.adReferral?.adTitle ?? (c.adReferral ? 'an ad' : null),
      handoff: c.handoffReason ? { reason: c.handoffReason, label: HANDOFF_LABELS[c.handoffReason], at: c.handoffAt } : null,
    };
  }
}

function toTranscriptLine(r: { sentBy: string; text: string; attachments: { type: string }[] }): TranscriptLine {
  const text = r.text || (r.attachments.length ? `[sent ${r.attachments[0].type === 'image' ? 'a photo' : `an ${r.attachments[0].type}`}]` : '');
  return { from: r.sentBy === 'customer' ? 'customer' : 'business', text };
}
