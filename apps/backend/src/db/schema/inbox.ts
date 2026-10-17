import { boolean, index, integer, jsonb, pgTable, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';
import { leads } from './growth';
import { staff, vendors } from './vendors';

// Ads Manager Phase 2: one inbox for Instagram, Messenger and WhatsApp chats,
// filled from Meta webhooks (meta_webhook_events), with AI replies.

export const inboxChannelValues = ['instagram', 'messenger', 'whatsapp'] as const;
export type InboxChannel = (typeof inboxChannelValues)[number];

/** off = vendor replies alone; suggest = AI drafts, vendor sends; reply = AI sends inside the 24h window. */
export const aiReplyModeValues = ['off', 'suggest', 'reply'] as const;
export type AiReplyMode = (typeof aiReplyModeValues)[number];

/** Why the AI stopped and handed a chat to the vendor. */
export const handoffReasonValues = ['complaint', 'refund', 'unknown', 'human_requested'] as const;
export type HandoffReason = (typeof handoffReasonValues)[number];

export interface AdReferral {
  adId: string | null;
  adTitle: string | null;
  source: string | null;
}

/** One customer's chat with the business on one channel. */
export const conversations = pgTable(
  'conversations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    channel: text('channel', { enum: inboxChannelValues }).notNull(),
    /** The business side: Page id (Messenger), Instagram account id, or WhatsApp phone number id. */
    businessExternalId: text('business_external_id').notNull(),
    /** The customer: Page-scoped id (PSID), Instagram-scoped id (IGSID) or WhatsApp number. */
    customerExternalId: text('customer_external_id').notNull(),
    customerName: text('customer_name'),
    leadId: uuid('lead_id').references(() => leads.id, { onDelete: 'set null' }),
    /** Set when the chat started from a click-to-chat ad. */
    adReferral: jsonb('ad_referral').$type<AdReferral>(),
    lastMessageAt: timestamp('last_message_at', { withTimezone: true }).notNull(),
    lastMessagePreview: text('last_message_preview'),
    /** Meta allows replies only within 24h of this (7 days for a human, via the HUMAN_AGENT tag). */
    lastCustomerMessageAt: timestamp('last_customer_message_at', { withTimezone: true }),
    unreadCount: integer('unread_count').notNull().default(0),
    /** When the AI should answer (a few seconds after the last message, so a burst gets one reply). */
    aiDueAt: timestamp('ai_due_at', { withTimezone: true }),
    /** "Suggest" mode: the AI's draft, shown in the composer until the vendor sends or the customer writes again. */
    aiSuggestion: text('ai_suggestion'),
    /** The AI stays out of this chat until the vendor turns it back on. */
    aiPaused: boolean('ai_paused').notNull().default(false),
    handoffReason: text('handoff_reason', { enum: handoffReasonValues }),
    handoffAt: timestamp('handoff_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    unique('conversations_vendor_channel_customer_unique').on(t.vendorId, t.channel, t.customerExternalId),
    index('conversations_vendor_last_idx').on(t.vendorId, t.lastMessageAt),
    index('conversations_ai_due_idx').on(t.aiDueAt),
  ],
);

export const messageDirectionValues = ['in', 'out'] as const;
/** customer = from the customer; vendor = typed by the business (in Scalio or Meta's own apps); ai = sent by the AI. */
export const messageSenderValues = ['customer', 'vendor', 'ai'] as const;
export const messageStatusValues = ['received', 'sent', 'failed'] as const;

export interface MessageAttachment {
  type: string;
  url: string | null;
}

export const messages = pgTable(
  'messages',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id').notNull().references(() => vendors.id, { onDelete: 'cascade' }),
    direction: text('direction', { enum: messageDirectionValues }).notNull(),
    sentBy: text('sent_by', { enum: messageSenderValues }).notNull(),
    /** Meta's message id (mid). Unique, so a webhook delivered twice is stored once. */
    externalId: text('external_id').unique(),
    text: text('text').notNull().default(''),
    attachments: jsonb('attachments').$type<MessageAttachment[]>().notNull().default([]),
    status: text('status', { enum: messageStatusValues }).notNull(),
    error: text('error'),
    /** Sent outside the 24h window with Meta's HUMAN_AGENT tag. */
    humanAgentTag: boolean('human_agent_tag').notNull().default(false),
    staffId: uuid('staff_id').references(() => staff.id, { onDelete: 'set null' }),
    /** When it was sent, by Meta's clock for incoming messages. */
    sentAt: timestamp('sent_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('messages_conversation_sent_idx').on(t.conversationId, t.sentAt)],
);

export interface FaqEntry {
  question: string;
  answer: string;
}

/** Per-business inbox settings: AI mode per channel and the FAQ the AI may answer from. */
export const inboxSettings = pgTable('inbox_settings', {
  vendorId: uuid('vendor_id').primaryKey().references(() => vendors.id, { onDelete: 'cascade' }),
  aiModes: jsonb('ai_modes').$type<Partial<Record<InboxChannel, AiReplyMode>>>().notNull().default({}),
  faq: jsonb('faq').$type<FaqEntry[]>().notNull().default([]),
  updatedById: uuid('updated_by_id').references(() => staff.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});
