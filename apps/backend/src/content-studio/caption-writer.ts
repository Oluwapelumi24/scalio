import * as z from 'zod/v4';
import type { ContentPlatform } from '../db/schema';
import { platformSpec } from './platforms';

// Prompt and output shape for AI captions. Kept free of Nest and the SDK so it
// can be unit-tested without calling Claude.

export const CAPTION_TONES = [
  { id: 'friendly', label: 'Friendly', guide: 'warm, upbeat and conversational' },
  { id: 'professional', label: 'Professional', guide: 'polished, clear and confident' },
  { id: 'playful', label: 'Playful', guide: 'fun and lively, with light humour' },
  { id: 'premium', label: 'Premium', guide: 'calm, refined and understated' },
  { id: 'pidgin', label: 'A little Pidgin', guide: 'warm Nigerian English with a light touch of Pidgin that any Nigerian customer would understand' },
] as const;

export type CaptionToneId = (typeof CAPTION_TONES)[number]['id'];
export const CAPTION_TONE_IDS: readonly string[] = CAPTION_TONES.map((t) => t.id);

export const CaptionDraftSchema = z.object({
  caption: z.string(),
  hashtags: z.array(z.string()),
  callToAction: z.string(),
});
export type CaptionDraft = z.infer<typeof CaptionDraftSchema>;

export interface CaptionContext {
  businessName: string;
  category: string;
  description: string | null;
  address: string | null;
  services: { name: string; priceKobo: number }[];
  bookingLink: string;
  brief: string;
  tone: CaptionToneId;
  platforms: ContentPlatform[];
  hasImage: boolean;
}

export const CAPTION_SYSTEM_PROMPT = `You write social media posts for small businesses in Nigeria — salons, barbers, spas, nail and lash studios, makeup artists and similar. The business owner will review and edit what you write before anything is posted.

Write one post from the photo and the owner's notes. Often there is only a photo: then look closely at what it shows — the style, the work, the colours, the setting — and write about that, the way the business would describe its own work.
- caption: the post itself, 1–4 short paragraphs, in the tone asked for. No hashtags in the caption. Emojis are fine in moderation.
- hashtags: 5–12 relevant hashtags without the "#" — a mix of what the post shows, the type of business, and the city or area when it's known.
- callToAction: one short line telling people what to do next, usually to book through the booking link.

Only state facts you were given. Never invent prices, discounts, offers, opening hours, awards, results or customer reviews; if the owner mentions a price or offer, use it exactly as written. Make no health or medical claims. If the photo shows people, describe the work, not the person's body or appearance beyond the service shown.`;

const naira = (kobo: number) => `₦${(kobo / 100).toLocaleString('en-NG', { maximumFractionDigits: 0 })}`;

/** The text half of the user message; the photo, when there is one, goes before it. */
export function buildCaptionPrompt(ctx: CaptionContext): string {
  const tone = CAPTION_TONES.find((t) => t.id === ctx.tone) ?? CAPTION_TONES[0];
  const lines = [
    `Business: ${ctx.businessName} (${ctx.category})`,
    ctx.description ? `About the business: ${ctx.description}` : null,
    ctx.address ? `Location: ${ctx.address}` : null,
    ctx.services.length
      ? `Services and prices:\n${ctx.services.map((s) => `- ${s.name}: ${naira(s.priceKobo)}`).join('\n')}`
      : null,
    `Booking link: ${ctx.bookingLink}`,
    `Posting to: ${ctx.platforms.length ? ctx.platforms.map((p) => platformSpec(p).name).join(', ') : 'Instagram'}`,
    `Tone: ${tone.guide}`,
    ctx.hasImage ? 'The photo attached is the one that will be posted.' : 'There is no photo; write a text post.',
    '',
    ctx.brief
      ? `What the owner says about this post:\n${ctx.brief}`
      : 'The owner added no notes: write the post from what the photo shows.',
  ];
  return lines.filter((l) => l !== null).join('\n');
}
