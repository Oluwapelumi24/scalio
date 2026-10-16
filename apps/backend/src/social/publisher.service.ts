import { BadRequestException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { checkPost } from '../content-studio/platforms';
import { signedMediaUrl } from '../content-studio/media-url';
import { DB, type Database } from '../db/db.module';
import { contentMedia, contentPosts, contentPublications } from '../db/schema';
import { MetaConfig } from './meta-config';
import { MAX_FAILED_ATTEMPTS, RETRY_DELAYS_MS, CONTAINER_POLL_MS, publishStep } from './publish-step';
import { SocialConnectionsService } from './social-connections.service';

type Platform = 'facebook' | 'instagram';
type PublicationRow = typeof contentPublications.$inferSelect;

/** A publish that started but never reported back is left alone, not repeated: it may already be live. */
const STUCK_AFTER_MS = 10 * 60_000;
const BATCH = 10;

@Injectable()
export class PublisherService {
  private readonly logger = new Logger(PublisherService.name);
  private running = false;

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly meta: MetaConfig,
    private readonly connections: SocialConnectionsService,
  ) {}

  listForPost(postId: string) {
    return this.db
      .select({
        id: contentPublications.id, platform: contentPublications.platform, status: contentPublications.status, runAt: contentPublications.runAt,
        attempts: contentPublications.attempts, permalink: contentPublications.permalink, error: contentPublications.error, publishedAt: contentPublications.publishedAt,
      })
      .from(contentPublications)
      .where(eq(contentPublications.postId, postId));
  }

  /**
   * Queues the post for the chosen platforms, now or at `at`. Checks everything
   * the vendor can fix up front, so most failures show before anything is sent.
   */
  async request(vendorId: string, staffId: string, postId: string, platforms: Platform[], at: Date | null, now = new Date()) {
    const reason = this.meta.unavailableReason;
    if (reason) throw new BadRequestException(reason);
    if (platforms.length === 0) throw new BadRequestException('Choose where to publish.');
    if (at && at.getTime() < now.getTime() - 60_000) throw new BadRequestException('Pick a time in the future.');

    const [post] = await this.db.select().from(contentPosts).where(and(eq(contentPosts.id, postId), eq(contentPosts.vendorId, vendorId)));
    if (!post) throw new NotFoundException('Post not found');
    const media = post.mediaId ? (await this.db.select({ mimeType: contentMedia.mimeType }).from(contentMedia).where(eq(contentMedia.id, post.mediaId)))[0] : undefined;

    const existing = await this.db.select().from(contentPublications).where(eq(contentPublications.postId, postId));
    for (const p of platforms) {
      if (!(await this.connections.credentials(vendorId, p))) {
        throw new BadRequestException(`Connect your ${p === 'facebook' ? 'Facebook Page' : 'Instagram account'} first.`);
      }
      const check = checkPost({ caption: post.caption, hashtags: post.hashtags, callToAction: post.callToAction, hasMedia: !!post.mediaId }, p);
      if (check.problems.length) throw new BadRequestException(check.problems.join(' '));
      if (p === 'instagram' && media && media.mimeType !== 'image/jpeg') {
        throw new BadRequestException('Instagram only takes JPEG photos from Scalio. Choose the photo again, or take a new one.');
      }
      const prev = existing.find((e) => e.platform === p);
      if (prev?.status === 'published') throw new BadRequestException(`This post is already on ${p === 'facebook' ? 'Facebook' : 'Instagram'}.`);
      if (prev?.status === 'publishing') throw new BadRequestException(`This post is being published to ${p === 'facebook' ? 'Facebook' : 'Instagram'} right now.`);
    }

    const runAt = at ?? now;
    await this.db.transaction(async (tx) => {
      for (const p of platforms) {
        await tx
          .insert(contentPublications)
          .values({ postId, vendorId, platform: p, runAt, requestedById: staffId })
          .onConflictDoUpdate({
            target: [contentPublications.postId, contentPublications.platform],
            set: { status: 'queued', runAt, attempts: 0, error: null, containerId: null, containerCreatedAt: null, requestedById: staffId, updatedAt: now },
          });
      }
      // A scheduled publish puts the post on the calendar.
      if (at && post.status !== 'posted') {
        await tx.update(contentPosts).set({ status: 'planned', plannedFor: at, platforms: [...new Set([...post.platforms, ...platforms])], updatedAt: now }).where(eq(contentPosts.id, postId));
      }
    });
    if (!at) void this.tick(); // don't make "Publish now" wait for the next minute
    return this.listForPost(postId);
  }

  async cancel(vendorId: string, publicationId: string) {
    const [row] = await this.db
      .update(contentPublications)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(contentPublications.id, publicationId), eq(contentPublications.vendorId, vendorId), eq(contentPublications.status, 'queued')))
      .returning({ id: contentPublications.id });
    if (!row) throw new BadRequestException('Only posts waiting to go out can be cancelled.');
  }

  /** Cancels everything still waiting for a post — used when it's taken off the calendar. */
  async cancelQueuedForPost(postId: string) {
    await this.db
      .update(contentPublications)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(eq(contentPublications.postId, postId), eq(contentPublications.status, 'queued')));
  }

  async retry(vendorId: string, staffId: string, publicationId: string) {
    const [row] = await this.db
      .select()
      .from(contentPublications)
      .where(and(eq(contentPublications.id, publicationId), eq(contentPublications.vendorId, vendorId)));
    if (!row) throw new NotFoundException('Not found');
    if (row.status !== 'failed' && row.status !== 'cancelled') throw new BadRequestException('Only failed or cancelled posts can be tried again.');
    return this.request(vendorId, staffId, row.postId, [row.platform], null);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async tick(now = new Date()) {
    if (this.running || !this.meta.graph || !this.meta.publicApiUrl) return;
    this.running = true;
    try {
      await this.releaseStuck(now);
      const claimed = await this.claimDue(now);
      for (const row of claimed) await this.process(row, now).catch((err) => this.logger.error(`Publish ${row.id} crashed`, err instanceof Error ? err.stack : String(err)));
    } finally {
      this.running = false;
    }
  }

  /** Atomically takes due publications so two servers never send the same one. */
  private async claimDue(now: Date): Promise<PublicationRow[]> {
    const due = this.db
      .select({ id: contentPublications.id })
      .from(contentPublications)
      .where(and(eq(contentPublications.status, 'queued'), sql`${contentPublications.runAt} <= ${now}`))
      .orderBy(contentPublications.runAt)
      .limit(BATCH)
      .for('update', { skipLocked: true });
    return this.db
      .update(contentPublications)
      .set({ status: 'publishing', updatedAt: now })
      .where(inArray(contentPublications.id, due))
      .returning();
  }

  private async releaseStuck(now: Date) {
    await this.db
      .update(contentPublications)
      .set({
        status: 'failed', updatedAt: now,
        error: "We couldn't confirm whether this went out. Check your account before trying again, so it isn't posted twice.",
      })
      .where(and(eq(contentPublications.status, 'publishing'), sql`${contentPublications.updatedAt} < ${new Date(now.getTime() - STUCK_AFTER_MS)}`));
  }

  private async process(row: PublicationRow, now: Date) {
    const set = (values: Partial<typeof contentPublications.$inferInsert>) =>
      this.db.update(contentPublications).set({ ...values, updatedAt: new Date() }).where(eq(contentPublications.id, row.id));

    const [post] = await this.db.select().from(contentPosts).where(eq(contentPosts.id, row.postId));
    const account = await this.connections.credentials(row.vendorId, row.platform);
    if (!post || !account) {
      await set({ status: 'failed', error: account ? 'The post was deleted.' : 'Your account is no longer connected. Reconnect it, then try again.' });
      return;
    }
    // The post may have been edited since it was scheduled: check it again as it is now.
    const check = checkPost({ caption: post.caption, hashtags: post.hashtags, callToAction: post.callToAction, hasMedia: !!post.mediaId }, row.platform);
    if (check.problems.length) {
      await set({ status: 'failed', error: check.problems.join(' ') });
      return;
    }
    const media = post.mediaId
      ? (await this.db.select({ mimeType: contentMedia.mimeType }).from(contentMedia).where(eq(contentMedia.id, post.mediaId)))[0]
      : undefined;

    const result = await publishStep(this.meta.graph!, {
      platform: row.platform,
      text: check.text,
      imageUrl: post.mediaId ? signedMediaUrl(this.meta.publicApiUrl!, post.mediaId, now.getTime()) : null,
      imageMimeType: media?.mimeType ?? null,
      account,
      containerId: row.containerId,
      containerCreatedAt: row.containerCreatedAt,
    }, now);

    switch (result.kind) {
      case 'published':
        await set({ status: 'published', externalId: result.externalId, permalink: result.permalink, publishedAt: now, error: null, containerId: null });
        await this.markPostPosted(row.postId, row.platform, now);
        return;
      case 'waiting':
        await set({ status: 'queued', containerId: result.containerId, containerCreatedAt: result.containerCreatedAt, runAt: new Date(now.getTime() + CONTAINER_POLL_MS) });
        return;
      case 'retry': {
        const attempts = row.attempts + 1;
        const container = result.resetContainer
          ? { containerId: null, containerCreatedAt: null }
          : result.containerId ? { containerId: result.containerId, containerCreatedAt: result.containerCreatedAt ?? now } : {};
        if (attempts >= MAX_FAILED_ATTEMPTS) {
          await set({ status: 'failed', attempts, error: `Meta didn't accept the post after ${attempts} tries: ${result.error}`, ...container });
        } else {
          await set({ status: 'queued', attempts, error: result.error, runAt: new Date(now.getTime() + RETRY_DELAYS_MS[attempts - 1]), ...container });
        }
        return;
      }
      case 'failed':
        await set({ status: 'failed', attempts: row.attempts + 1, error: result.error });
        if (result.reconnect) await this.connections.markNeedsReconnect(row.vendorId, row.platform, result.error);
    }
  }

  /** Adds the platform to the post's history; the post counts as posted once nothing else is still going out. */
  private async markPostPosted(postId: string, platform: Platform, now: Date) {
    const [pending] = await this.db
      .select({ n: sql<number>`count(*)`.mapWith(Number) })
      .from(contentPublications)
      .where(and(eq(contentPublications.postId, postId), inArray(contentPublications.status, ['queued', 'publishing'])));
    await this.db
      .update(contentPosts)
      .set({
        postedPlatforms: sql`(select array_agg(distinct p) from unnest(${contentPosts.postedPlatforms} || array[${platform}]::text[]) as p)`,
        postedAt: sql`coalesce(${contentPosts.postedAt}, ${now})`,
        ...(pending?.n ? {} : { status: 'posted' as const }),
        updatedAt: now,
      })
      .where(eq(contentPosts.id, postId));
  }
}
