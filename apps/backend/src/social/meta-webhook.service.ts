import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB, type Database } from '../db/db.module';
import { metaWebhookEvents } from '../db/schema';

/** Keeps every verified Meta webhook delivery. Phase 2 (the inbox) reads and processes them. */
@Injectable()
export class MetaWebhookService {
  private readonly logger = new Logger(MetaWebhookService.name);

  constructor(@Inject(DB) private readonly db: Database) {}

  async store(body: unknown): Promise<void> {
    const object = typeof body === 'object' && body !== null && typeof (body as { object?: unknown }).object === 'string'
      ? (body as { object: string }).object
      : 'unknown';
    await this.db.insert(metaWebhookEvents).values({ object, payload: body ?? {} });
    this.logger.debug(`Meta webhook stored (${object})`);
  }
}
