import { BadRequestException } from '@nestjs/common';
import * as z from 'zod/v4';
import { adDestinationValues, adObjectiveValues, adPaymentRouteValues } from '../db/schema';
import type { CampaignDraft } from './campaign-rules';

// Request bodies for the campaign builder. Zod (not class-validator) because the
// targeting and creative are nested objects stored as JSON.

const location = z.object({
  key: z.string().min(1).max(40),
  type: z.enum(['city', 'region', 'country']),
  name: z.string().min(1).max(120),
  radiusKm: z.number().int().min(1).max(80).optional(),
});

const positions = z.array(z.string().regex(/^[a-z_]{2,40}$/)).max(10);

export const targetingSchema = z.object({
  locations: z.array(location).max(25),
  ageMin: z.number().int().min(18).max(65),
  ageMax: z.number().int().min(18).max(65),
  genders: z.enum(['all', 'male', 'female']),
  interests: z.array(z.object({ id: z.string().regex(/^\d+$/), name: z.string().min(1).max(120) })).max(25),
  placements: z.union([z.literal('automatic'), z.object({ facebook: positions, instagram: positions, messenger: positions })]),
});

const creative = z.object({
  mediaId: z.uuid(),
  primaryText: z.string().max(2000),
  headline: z.string().max(255),
  description: z.string().max(255).nullable(),
  link: z.string().max(1000).nullable(),
  welcomeMessage: z.string().max(500).nullable(),
  iceBreakers: z.array(z.string().min(1).max(80)).max(4),
});

const extras = z.object({
  pixelId: z.string().regex(/^\d+$/).optional(),
  appId: z.string().regex(/^\d+$/).optional(),
  appStoreUrl: z.string().max(500).optional(),
});

export const campaignSchema = z.object({
  name: z.string().min(1).max(120),
  mode: z.enum(['simple', 'advanced']),
  objective: z.enum(adObjectiveValues),
  destination: z.enum(adDestinationValues),
  route: z.enum(adPaymentRouteValues),
  dailyBudgetKobo: z.number().int().positive(),
  startAt: z.iso.datetime({ offset: true }),
  endAt: z.iso.datetime({ offset: true }),
  targeting: targetingSchema,
  creative,
  extras: extras.default({}),
});

export const reachSchema = z.object({ objective: z.enum(adObjectiveValues), destination: z.enum(adDestinationValues), targeting: targetingSchema });

export const quoteSchema = z.object({
  dailyBudgetKobo: z.number().int().positive().max(1_000_000_000),
  days: z.number().int().min(1).max(90),
  route: z.enum(adPaymentRouteValues),
});

export const copySchema = z.object({
  objective: z.enum(adObjectiveValues),
  destination: z.enum(adDestinationValues),
  brief: z.string().max(600).nullable().default(null),
});

export const checkoutSchema = z.object({ from: z.enum(['web', 'mobile']).default('web') });
export const extendSchema = z.object({ days: z.number().int().min(1).max(90), from: z.enum(['web', 'mobile']).default('web') });

/** Parses a body or answers 400 with the first problem in plain words. */
export function parseBody<S extends z.ZodType>(schema: S, body: unknown): z.infer<S> {
  const r = schema.safeParse(body);
  if (!r.success) {
    const issue = r.error.issues[0];
    throw new BadRequestException(`${issue.path.join('.') || 'body'}: ${issue.message}`);
  }
  return r.data;
}

export function toDraft(b: z.infer<typeof campaignSchema>): CampaignDraft {
  return { ...b, startAt: new Date(b.startAt), endAt: new Date(b.endAt) };
}
