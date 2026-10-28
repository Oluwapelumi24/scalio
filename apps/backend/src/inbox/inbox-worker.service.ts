import { Inject, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { and, asc, eq, inArray, isNull } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { metaWebhookEvents } from '../db/schema';
import { MetaConfig } from '../social/meta-config';
import { InboxService } from './inbox.service';
import { parseWebhook } from './webhook-parse';

const BATCH = 25;
/** An event that keeps failing is set aside (processed, with its error kept) after this many tries. */
export const MAX_EVENT_ATTEMPTS = 5;

/**
 * Turns stored Meta webhooks into inbox chats, then runs the AI on chats whose
 * reply is due. Polls every few seconds: the webhook endpoint only stores and
 * returns, so Meta always gets its 200 quickly and nothing is lost on a crash.
 */
@Injectable()
export class InboxWorker {
  private readonly logger = new Logger(InboxWorker.name);
  private running = false;

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly meta: MetaConfig,
    private readonly inbox: InboxService,
  ) {}

  @Interval(4_000)
  async tick() {
    if (this.running || !this.meta.adsEnabled) return;
    this.running = true;
    try {
      await this.processWebhooks();
      await this.processDueAi();
    } catch (err) {
      this.logger.error('Inbox tick failed', err instanceof Error ? err.stack : String(err));
    } finally {
      this.running = false;
    }
  }

  /**
   * Processes unprocessed Messenger and Instagram events, oldest first, locking
   * the batch so two servers never split it. WhatsApp events stay unprocessed
   * until D4 decides how WhatsApp connects. Page events with no chat in them
   * (feed, lead forms) are marked processed but kept in the table for later phases.
   */
  async processWebhooks(now = new Date()): Promise<number> {
    return this.db.transaction(async (tx) => {
      const events = await tx
        .select()
        .from(metaWebhookEvents)
        .where(and(isNull(metaWebhookEvents.processedAt), inArray(metaWebhookEvents.object, ['page', 'instagram'])))
        .orderBy(asc(metaWebhookEvents.receivedAt))
        .limit(BATCH)
        .for('update', { skipLocked: true });
      for (const ev of events) {
        try {
          const newChats: string[] = [];
          for (const m of parseWebhook(ev.object, ev.payload)) {
            const r = await this.inbox.ingest(m, now);
            if (r?.isNewConversation) newChats.push(r.conversationId);
          }
          await tx.update(metaWebhookEvents).set({ processedAt: now, lastError: null }).where(eq(metaWebhookEvents.id, ev.id));
          for (const id of newChats) void this.inbox.fetchCustomerName(id);
        } catch (err) {
          const attempts = ev.attempts + 1;
          const message = err instanceof Error ? err.message : String(err);
          this.logger.warn(`Webhook event ${ev.id} failed (try ${attempts}): ${message}`);
          await tx.update(metaWebhookEvents)
            .set({ attempts, lastError: message, ...(attempts >= MAX_EVENT_ATTEMPTS ? { processedAt: now } : {}) })
            .where(eq(metaWebhookEvents.id, ev.id));
        }
      }
      return events.length;
    });
  }

  async processDueAi(now = new Date()) {
    const due = await this.inbox.claimDueAi(now);
    for (const conv of due) {
      await this.inbox.runAi(conv, now).catch((err: unknown) =>
        this.logger.warn(`AI reply for chat ${conv.id} failed: ${err instanceof Error ? err.message : String(err)}`));
    }
  }
}
