import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, asc, desc, eq, gte, lte, or, sql, type SQL } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { contentMedia, contentPosts, services, vendors, type ContentPlatform } from '../db/schema';
import { HomeDataService } from '../personalisation/home-data.service';
import { CAPTION_TONES, type CaptionToneId } from './caption-writer';
import { CaptionService, type CaptionImage } from './caption.service';
import type { GenerateCaptionDto, ListPostsDto, SavePostDto, UploadMediaDto } from './dto/content.dto';
import { PLATFORMS, checkPost, cleanHashtags } from './platforms';

type PostRow = typeof contentPosts.$inferSelect;

/** Image type from the first bytes of base64 data, or null if it isn't one we accept. */
export function sniffImageType(base64: string): 'image/jpeg' | 'image/png' | 'image/webp' | null {
  if (base64.startsWith('/9j/')) return 'image/jpeg';
  if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
  if (base64.startsWith('UklGR') && Buffer.from(base64.slice(0, 16), 'base64').subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

@Injectable()
export class ContentStudioService {
  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly captions: CaptionService,
    private readonly homeData: HomeDataService,
  ) {}

  async studio(vendorId: string) {
    return {
      ai: {
        available: this.captions.available,
        dailyLimit: this.captions.dailyLimit,
        usedToday: this.captions.available ? await this.captions.usedToday(vendorId) : 0,
      },
      tones: CAPTION_TONES.map(({ id, label }) => ({ id, label })),
      platforms: PLATFORMS,
    };
  }

  // ── Media ──────────────────────────────────────────────────────────────────

  async uploadMedia(vendorId: string, actorStaffId: string, dto: UploadMediaDto) {
    const data = dto.dataBase64.replace(/^data:[^;]+;base64,/, '');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) throw new BadRequestException("That file isn't a valid image.");
    // Trust the file's own bytes over the declared type: phone pickers can report one
    // format and hand back another, and Claude rejects a mismatched media type.
    const mimeType = sniffImageType(data);
    if (!mimeType) throw new BadRequestException('Use a JPEG, PNG or WebP image.');
    const byteSize = Math.floor((data.length * 3) / 4) - (data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0);
    const [row] = await this.db
      .insert(contentMedia)
      .values({ vendorId, mimeType, dataBase64: data, byteSize, createdById: actorStaffId })
      .returning({ id: contentMedia.id, mimeType: contentMedia.mimeType, byteSize: contentMedia.byteSize });
    return row;
  }

  async media(vendorId: string, id: string) {
    const [row] = await this.db
      .select({ mimeType: contentMedia.mimeType, dataBase64: contentMedia.dataBase64 })
      .from(contentMedia)
      .where(and(eq(contentMedia.id, id), eq(contentMedia.vendorId, vendorId)));
    if (!row) throw new NotFoundException('Photo not found');
    return row;
  }

  // ── AI captions ────────────────────────────────────────────────────────────

  async generate(vendorId: string, dto: GenerateCaptionDto) {
    const [vendor] = await this.db
      .select({ businessName: vendors.businessName, category: vendors.category, description: vendors.description, address: vendors.address, slug: vendors.slug })
      .from(vendors)
      .where(eq(vendors.id, vendorId));
    if (!vendor) throw new NotFoundException('Business not found');

    const [serviceRows, image] = await Promise.all([
      this.db
        .select({ name: services.name, priceKobo: services.priceKobo })
        .from(services)
        .where(eq(services.vendorId, vendorId))
        .orderBy(asc(services.name))
        .limit(15),
      dto.mediaId ? this.media(vendorId, dto.mediaId) : Promise.resolve(null),
    ]);

    return this.captions.write(
      vendorId,
      {
        businessName: vendor.businessName,
        category: vendor.category,
        description: vendor.description,
        address: vendor.address,
        services: serviceRows,
        bookingLink: this.homeData.bookingLinkFor(vendor.slug),
        brief: dto.brief.trim(),
        tone: dto.tone as CaptionToneId,
        platforms: dto.platforms as ContentPlatform[],
        hasImage: !!image,
      },
      image as CaptionImage | null,
    );
  }

  // ── Posts ──────────────────────────────────────────────────────────────────

  private present(row: PostRow) {
    const post = { caption: row.caption, hashtags: row.hashtags, callToAction: row.callToAction, hasMedia: !!row.mediaId };
    return {
      ...row,
      checks: row.platforms.map((p) => checkPost(post, p)),
    };
  }

  async list(vendorId: string, q: ListPostsDto) {
    const where: SQL[] = [eq(contentPosts.vendorId, vendorId)];
    if (q.status) where.push(eq(contentPosts.status, q.status as PostRow['status']));
    if (q.from && q.to) {
      const from = new Date(q.from);
      const to = new Date(q.to);
      where.push(
        or(
          and(gte(contentPosts.plannedFor, from), lte(contentPosts.plannedFor, to)),
          and(gte(contentPosts.postedAt, from), lte(contentPosts.postedAt, to)),
        )!,
      );
    }
    const rows = await this.db
      .select()
      .from(contentPosts)
      .where(and(...where))
      .orderBy(
        // Planned posts soonest first; everything else newest first.
        q.status === 'planned' ? asc(contentPosts.plannedFor) : desc(sql`coalesce(${contentPosts.postedAt}, ${contentPosts.updatedAt})`),
      )
      .limit(200);
    return rows.map((r) => this.present(r));
  }

  private async own(vendorId: string, id: string): Promise<PostRow> {
    const [row] = await this.db.select().from(contentPosts).where(and(eq(contentPosts.id, id), eq(contentPosts.vendorId, vendorId)));
    if (!row) throw new NotFoundException('Post not found');
    return row;
  }

  async get(vendorId: string, id: string) {
    return this.present(await this.own(vendorId, id));
  }

  private async assertMedia(vendorId: string, mediaId: string | null | undefined) {
    if (!mediaId) return;
    const [m] = await this.db.select({ id: contentMedia.id }).from(contentMedia).where(and(eq(contentMedia.id, mediaId), eq(contentMedia.vendorId, vendorId)));
    if (!m) throw new NotFoundException('Photo not found');
  }

  private fields(dto: SavePostDto): Partial<typeof contentPosts.$inferInsert> {
    const out: Partial<typeof contentPosts.$inferInsert> = {};
    if (dto.mediaId !== undefined) out.mediaId = dto.mediaId;
    if (dto.brief !== undefined) out.brief = dto.brief?.trim() || null;
    if (dto.tone !== undefined) out.tone = dto.tone;
    if (dto.caption !== undefined) out.caption = dto.caption;
    if (dto.hashtags !== undefined) out.hashtags = cleanHashtags(dto.hashtags);
    if (dto.callToAction !== undefined) out.callToAction = dto.callToAction?.trim() || null;
    if (dto.platforms !== undefined) out.platforms = [...new Set(dto.platforms)] as ContentPlatform[];
    return out;
  }

  async create(vendorId: string, actorStaffId: string, dto: SavePostDto) {
    await this.assertMedia(vendorId, dto.mediaId);
    const [row] = await this.db
      .insert(contentPosts)
      .values({ vendorId, createdById: actorStaffId, ...this.fields(dto), aiGenerated: dto.aiGenerated ?? false })
      .returning();
    return this.present(row);
  }

  async update(vendorId: string, id: string, dto: SavePostDto) {
    const current = await this.own(vendorId, id);
    await this.assertMedia(vendorId, dto.mediaId);
    const [row] = await this.db
      .update(contentPosts)
      .set({ ...this.fields(dto), aiGenerated: current.aiGenerated || !!dto.aiGenerated, updatedAt: new Date() })
      .where(and(eq(contentPosts.id, id), eq(contentPosts.vendorId, vendorId)))
      .returning();
    return this.present(row);
  }

  /** Puts the post on the content calendar. Posted posts stay in history and can't be re-planned. */
  async plan(vendorId: string, id: string, plannedFor: string) {
    const current = await this.own(vendorId, id);
    if (current.status === 'posted') throw new BadRequestException('This post has already gone out.');
    if (!current.caption.trim()) throw new BadRequestException('Add a caption before planning the post.');
    const [row] = await this.db
      .update(contentPosts)
      .set({ status: 'planned', plannedFor: new Date(plannedFor), updatedAt: new Date() })
      .where(eq(contentPosts.id, id))
      .returning();
    return this.present(row);
  }

  async unplan(vendorId: string, id: string) {
    const current = await this.own(vendorId, id);
    if (current.status !== 'planned') return this.present(current);
    const [row] = await this.db
      .update(contentPosts)
      .set({ status: 'draft', plannedFor: null, updatedAt: new Date() })
      .where(eq(contentPosts.id, id))
      .returning();
    return this.present(row);
  }

  /** The vendor posted it themselves from each platform's app. */
  async markPosted(vendorId: string, id: string, platforms: string[]) {
    const current = await this.own(vendorId, id);
    if (!current.caption.trim()) throw new BadRequestException('Add a caption first.');
    if (platforms.length === 0) throw new BadRequestException('Choose where you posted it.');
    const now = new Date();
    const [row] = await this.db
      .update(contentPosts)
      .set({ status: 'posted', postedAt: current.postedAt ?? now, postedPlatforms: [...new Set(platforms)] as ContentPlatform[], updatedAt: now })
      .where(eq(contentPosts.id, id))
      .returning();
    return this.present(row);
  }

  async remove(vendorId: string, id: string) {
    const current = await this.own(vendorId, id);
    await this.db.delete(contentPosts).where(eq(contentPosts.id, current.id));
    if (current.mediaId) {
      // The photo belongs to this post alone unless another post reuses it.
      const [{ n }] = await this.db.select({ n: sql<number>`count(*)`.mapWith(Number) }).from(contentPosts).where(eq(contentPosts.mediaId, current.mediaId));
      if (n === 0) await this.db.delete(contentMedia).where(eq(contentMedia.id, current.mediaId));
    }
  }
}
