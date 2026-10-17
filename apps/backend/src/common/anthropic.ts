import Anthropic from '@anthropic-ai/sdk';
import type { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/** Null when ANTHROPIC_API_KEY isn't set — AI features are then switched off, not broken. */
export const ANTHROPIC_CLIENT = Symbol('ANTHROPIC_CLIENT');

/** The Claude client, for modules that use AI (captions, inbox replies). Backend only. */
export const anthropicClientProvider: Provider = {
  provide: ANTHROPIC_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Anthropic | null => {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    return apiKey ? new Anthropic({ apiKey }) : null;
  },
};
