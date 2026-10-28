import type { AdReferral, MessageAttachment } from '../db/schema';

// Turns a stored Meta webhook body into the chat messages it carries. Pure, so
// the shapes Meta sends can be unit-tested without a database.
//
// Messenger (`object: "page"`) and Instagram (`object: "instagram"`) share the
// Messenger Platform format: entry[].messaging[] with sender, recipient,
// timestamp and a message or postback. Instagram can also arrive as
// entry[].changes[] with field "messages" and the same object as its value.
// Reads, deliveries, reactions and typing events are ignored.

export type MetaChatChannel = 'messenger' | 'instagram';

export interface InboundChatMessage {
  channel: MetaChatChannel;
  /** Page id (Messenger) or Instagram account id: which business it's for. */
  businessId: string;
  /** PSID (Messenger) or IGSID (Instagram): the customer. */
  customerId: string;
  /** Meta's message id. */
  mid: string;
  text: string;
  attachments: MessageAttachment[];
  sentAt: Date;
  /**
   * An echo is a message the business itself sent — from Scalio, or from Meta's
   * own apps (Business Suite, Instagram). Stored as the vendor's, never answered.
   */
  fromBusiness: boolean;
  /** Present when the chat was opened from a click-to-chat ad. */
  referral: AdReferral | null;
}

type Obj = Record<string, unknown>;

const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const str = (v: unknown): string | null => (typeof v === 'string' && v.length > 0 ? v : typeof v === 'number' ? String(v) : null);
const arr = (v: unknown): unknown[] => (Array.isArray(v) ? v : []);

function parseReferral(v: unknown): AdReferral | null {
  if (!isObj(v)) return null;
  const ads = isObj(v.ads_context_data) ? v.ads_context_data : {};
  const adId = str(v.ad_id);
  const source = str(v.source);
  if (!adId && source !== 'ADS') return null; // m.me links and other referrals aren't ads
  return { adId, adTitle: str(ads.ad_title), source };
}

function parseAttachments(v: unknown): MessageAttachment[] {
  return arr(v)
    .filter(isObj)
    .map((a) => ({ type: str(a.type) ?? 'file', url: isObj(a.payload) ? str(a.payload.url) : null }));
}

/** One entry of `messaging` (or the `value` of a "messages" change). */
export function parseMessagingEvent(channel: MetaChatChannel, ev: unknown): InboundChatMessage | null {
  if (!isObj(ev)) return null;
  const sender = isObj(ev.sender) ? str(ev.sender.id) : null;
  const recipient = isObj(ev.recipient) ? str(ev.recipient.id) : null;
  if (!sender || !recipient) return null;
  const ts = typeof ev.timestamp === 'number' ? ev.timestamp : Number(ev.timestamp);
  // Meta sends milliseconds; guard against seconds just in case.
  const sentAt = new Date(Number.isFinite(ts) && ts > 0 ? (ts < 1e12 ? ts * 1000 : ts) : Date.now());

  let mid: string | null = null;
  let text = '';
  let attachments: MessageAttachment[] = [];
  let fromBusiness = false;
  let referral = parseReferral(ev.referral);

  if (isObj(ev.message)) {
    const m = ev.message;
    if (m.is_deleted === true || m.is_unsupported === true) return null;
    mid = str(m.mid);
    text = str(m.text) ?? '';
    attachments = parseAttachments(m.attachments);
    fromBusiness = m.is_echo === true;
    referral = parseReferral(m.referral) ?? referral;
  } else if (isObj(ev.postback)) {
    // A tap on a button or ice-breaker: the button's title is what the customer "said".
    mid = str(ev.postback.mid);
    text = str(ev.postback.title) ?? '';
    referral = parseReferral(ev.postback.referral) ?? referral;
  } else {
    return null; // read, delivery, reaction, standalone referral, …
  }
  if (!mid || (!text && attachments.length === 0)) return null;

  return {
    channel,
    businessId: fromBusiness ? sender : recipient,
    customerId: fromBusiness ? recipient : sender,
    mid,
    text,
    attachments,
    sentAt,
    fromBusiness,
    referral,
  };
}

/** Every chat message in one webhook body, oldest first. Unknown objects (WhatsApp until D4, feeds) give none. */
export function parseWebhook(object: string, payload: unknown): InboundChatMessage[] {
  const channel: MetaChatChannel | null = object === 'page' ? 'messenger' : object === 'instagram' ? 'instagram' : null;
  if (!channel || !isObj(payload)) return [];
  const out: InboundChatMessage[] = [];
  for (const entry of arr(payload.entry)) {
    if (!isObj(entry)) continue;
    for (const ev of arr(entry.messaging)) {
      const m = parseMessagingEvent(channel, ev);
      if (m) out.push(m);
    }
    for (const change of arr(entry.changes)) {
      if (!isObj(change) || change.field !== 'messages') continue;
      const m = parseMessagingEvent(channel, change.value);
      if (m) out.push(m);
    }
  }
  return out.sort((a, b) => a.sentAt.getTime() - b.sentAt.getTime());
}

/** Short text for the chat list. */
export function previewOf(m: { text: string; attachments: MessageAttachment[] }): string {
  if (m.text) return m.text.length > 120 ? `${m.text.slice(0, 117)}…` : m.text;
  const type = m.attachments[0]?.type ?? 'file';
  return type === 'image' ? '📷 Photo' : type === 'video' ? '🎥 Video' : type === 'audio' ? '🎤 Voice note' : '📎 Attachment';
}
