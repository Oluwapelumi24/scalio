import { Inject, Injectable } from '@nestjs/common';
import { eq, sql } from 'drizzle-orm';
import { DB, type Database } from '../db/db.module';
import { businessPreferences } from '../db/schema';
import type { HomePreferences } from './home';
import type { UpdatePreferencesDto } from './dto/update-preferences.dto';

const DEFAULTS: HomePreferences = {
  interests: [],
  pinnedModules: [],
  hiddenModules: [],
  moduleUsage: {},
  interestsCompletedAt: null,
};

const unique = (values: string[]) => [...new Set(values)];

@Injectable()
export class PreferencesService {
  constructor(@Inject(DB) private readonly db: Database) {}

  /** A business with no saved row simply gets the defaults — nothing is written on read. */
  async get(vendorId: string): Promise<HomePreferences> {
    const [row] = await this.db
      .select()
      .from(businessPreferences)
      .where(eq(businessPreferences.vendorId, vendorId));
    if (!row) return { ...DEFAULTS };
    return {
      interests: row.interests,
      pinnedModules: row.pinnedModules,
      hiddenModules: row.hiddenModules,
      moduleUsage: row.moduleUsage,
      interestsCompletedAt: row.interestsCompletedAt,
    };
  }

  async update(vendorId: string, dto: UpdatePreferencesDto): Promise<HomePreferences> {
    const current = await this.get(vendorId);
    let pinned = unique(dto.pinnedModules ?? current.pinnedModules);
    let hidden = unique(dto.hiddenModules ?? current.hiddenModules);
    // A module can't be pinned and hidden at once. Pinning something hidden un-hides
    // it; otherwise (including a request that sends both lists) hiding wins.
    if (dto.pinnedModules && !dto.hiddenModules) hidden = hidden.filter((id) => !pinned.includes(id));
    else pinned = pinned.filter((id) => !hidden.includes(id));

    const next = {
      interests: unique(dto.interests ?? current.interests),
      pinnedModules: pinned,
      hiddenModules: hidden,
      interestsCompletedAt: dto.completeInterests
        ? (current.interestsCompletedAt ?? new Date())
        : current.interestsCompletedAt,
      updatedAt: new Date(),
    };

    await this.db
      .insert(businessPreferences)
      .values({ vendorId, ...next })
      .onConflictDoUpdate({ target: businessPreferences.vendorId, set: next });

    return { ...next, moduleUsage: current.moduleUsage };
  }

  /** Clears pins, hides and learned usage. Interests are kept — they're the owner's answers. */
  async resetHome(vendorId: string): Promise<HomePreferences> {
    const reset = { pinnedModules: [], hiddenModules: [], moduleUsage: {}, updatedAt: new Date() };
    await this.db
      .insert(businessPreferences)
      .values({ vendorId, ...reset })
      .onConflictDoUpdate({ target: businessPreferences.vendorId, set: reset });
    return this.get(vendorId);
  }

  /** Atomic increment so concurrent taps from mobile and web never lose a count. */
  async recordUsage(vendorId: string, moduleId: string, now = new Date()): Promise<void> {
    const entry = { count: 1, lastUsedAt: now.toISOString() };
    await this.db
      .insert(businessPreferences)
      .values({ vendorId, moduleUsage: { [moduleId]: entry } })
      .onConflictDoUpdate({
        target: businessPreferences.vendorId,
        set: {
          moduleUsage: sql`${businessPreferences.moduleUsage} || jsonb_build_object(
            ${moduleId}::text,
            jsonb_build_object(
              'count', coalesce((${businessPreferences.moduleUsage} -> ${moduleId}::text ->> 'count')::int, 0) + 1,
              'lastUsedAt', ${entry.lastUsedAt}::text
            )
          )`,
        },
      });
  }
}
