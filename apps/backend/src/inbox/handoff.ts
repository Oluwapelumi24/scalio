import type { HandoffReason } from '../db/schema';

// Hand-off rules: when the AI must stop and pass the chat to the vendor.
// Two layers, so a model mistake can't slip past:
// 1. Before Claude is called, plain keyword rules catch complaints, refunds and
//    requests for a person. These never reach the model.
// 2. After Claude answers, its reply is checked: the model can itself hand off
//    (e.g. it doesn't know the answer), and any price it quotes must be one of
//    the vendor's own prices.

const RULES: { reason: HandoffReason; patterns: RegExp[] }[] = [
  {
    reason: 'refund',
    patterns: [
      /\brefund/i,
      /\bmoney back\b/i,
      /\b(return|give|send|want)\s+(me\s+)?(back\s+)?my\s+money\b/i,
      /\breimburs/i,
      /\bcharge\s?back\b/i,
    ],
  },
  {
    reason: 'complaint',
    patterns: [
      /\bcomplain/i,
      /\bdisappoint/i,
      /\b(terrible|horrible|awful|worst|rubbish|nonsense)\b/i,
      /\b(not|never)\s+(happy|satisfied|pleased)\b/i,
      /\bunhappy\b/i,
      /\b(scam|scammer|fraud|cheat(ed|ing)?)\b/i,
      /\brude\b/i,
      /\b(ruined|damaged|burnt|burned|spoilt|spoiled)\b/i,
      /\b(allergic|reaction|rash|infection|bleeding|swollen)\b/i,
      /\breport (you|this)\b/i,
    ],
  },
  {
    reason: 'human_requested',
    patterns: [
      /\b(human|real person|actual person)\b/i,
      /\b(speak|talk|chat)\s+(to|with)\s+(a |an |the |your )?(owner|manager|someone|somebody|person|staff|boss|madam|oga)\b/i,
      /\bare you a (bot|robot|machine)\b/i,
      /\b(is this|am i talking to) (a )?(bot|robot|ai)\b/i,
    ],
  },
];

/** A hand-off reason when the customer's message must go to the vendor, or null. */
export function detectHandoff(text: string): HandoffReason | null {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(text))) return rule.reason;
  }
  return null;
}

// "₦15,000", "N15000", "NGN 15,000", "15,000 naira", "₦15k", "15k naira".
const AMOUNT = /(?:₦|\bNGN\s?|\bN(?=\d))\s?(\d[\d,]*(?:\.\d+)?)\s*(k\b)?|\b(\d[\d,]*(?:\.\d+)?)\s*(k)?\s*naira\b/gi;

/** Naira amounts mentioned in some text, in kobo. */
export function amountsInKobo(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(AMOUNT)) {
    const digits = (m[1] ?? m[3] ?? '').replace(/,/g, '');
    const thousands = !!(m[2] ?? m[4]);
    const naira = Number(digits) * (thousands ? 1000 : 1);
    if (Number.isFinite(naira) && naira > 0) out.push(Math.round(naira * 100));
  }
  return out;
}

export interface ReplyFacts {
  /** Prices the AI may quote, in kobo: the services' prices and any amount written in the FAQ. */
  allowedAmountsKobo: number[];
}

export interface ModelDraft {
  handoff: boolean;
  handoffReason: HandoffReason | null;
  reply: string;
}

export type ReplyDecision = { action: 'send'; text: string } | { action: 'handoff'; reason: HandoffReason };

/** What to do with Claude's draft: send it, or hand off. */
export function decideReply(draft: ModelDraft, facts: ReplyFacts): ReplyDecision {
  if (draft.handoff) return { action: 'handoff', reason: draft.handoffReason ?? 'unknown' };
  const text = draft.reply.trim();
  if (!text) return { action: 'handoff', reason: 'unknown' };
  // A price the vendor never wrote down is a made-up price.
  const allowed = new Set(facts.allowedAmountsKobo);
  if (amountsInKobo(text).some((k) => !allowed.has(k))) return { action: 'handoff', reason: 'unknown' };
  return { action: 'send', text };
}

/** Plain words for the vendor. */
export const HANDOFF_LABELS: Record<HandoffReason, string> = {
  complaint: 'The customer seems unhappy',
  refund: 'The customer is asking about a refund',
  unknown: 'The AI didn’t know the answer',
  human_requested: 'The customer asked for a person',
};
