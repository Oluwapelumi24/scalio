import { PreferencesService } from './preferences.service';

function makeDb(existing: Record<string, unknown> | null) {
  const onConflictDoUpdate = jest.fn(() => Promise.resolve());
  const values = jest.fn(() => ({ onConflictDoUpdate }));
  return {
    select: jest.fn(() => ({
      from: jest.fn(() => ({ where: jest.fn(() => Promise.resolve(existing ? [existing] : [])) })),
    })),
    insert: jest.fn(() => ({ values })),
    values,
    onConflictDoUpdate,
  };
}

const row = {
  vendorId: 'vendor-1',
  interests: ['manage_bookings'],
  pinnedModules: ['team'],
  hiddenModules: ['new_customers'],
  moduleUsage: { team: { count: 2, lastUsedAt: '2026-10-01T00:00:00Z' } },
  interestsCompletedAt: null,
  updatedAt: new Date(),
};

describe('PreferencesService', () => {
  it('returns defaults without writing when the business has no saved preferences', async () => {
    const db = makeDb(null);
    const prefs = await new PreferencesService(db as any).get('vendor-1');
    expect(prefs).toEqual({ interests: [], pinnedModules: [], hiddenModules: [], moduleUsage: {}, interestsCompletedAt: null });
    expect(db.insert).not.toHaveBeenCalled();
  });

  it('replaces interests, de-duplicated, and keeps the rest', async () => {
    const db = makeDb(row);
    const prefs = await new PreferencesService(db as any).update('vendor-1', {
      interests: ['track_sales', 'track_sales', 'run_ads'],
    });
    expect(prefs.interests).toEqual(['track_sales', 'run_ads']);
    expect(prefs.pinnedModules).toEqual(['team']);
    expect(prefs.moduleUsage).toEqual(row.moduleUsage);
  });

  it('un-hides a module when it is pinned', async () => {
    const db = makeDb(row);
    const prefs = await new PreferencesService(db as any).update('vendor-1', {
      pinnedModules: ['team', 'new_customers'],
    });
    expect(prefs.pinnedModules).toEqual(['team', 'new_customers']);
    expect(prefs.hiddenModules).toEqual([]);
  });

  it('un-pins a module when it is hidden', async () => {
    const db = makeDb(row);
    const prefs = await new PreferencesService(db as any).update('vendor-1', {
      hiddenModules: ['new_customers', 'team'],
    });
    expect(prefs.pinnedModules).toEqual([]);
    expect(prefs.hiddenModules).toEqual(['new_customers', 'team']);
  });

  it('stamps interestsCompletedAt once and never moves it', async () => {
    const db = makeDb(row);
    const first = await new PreferencesService(db as any).update('vendor-1', { completeInterests: true });
    expect(first.interestsCompletedAt).toBeInstanceOf(Date);

    const done = new Date('2026-09-01T00:00:00Z');
    const again = await new PreferencesService(makeDb({ ...row, interestsCompletedAt: done }) as any).update(
      'vendor-1',
      { completeInterests: true },
    );
    expect(again.interestsCompletedAt).toBe(done);
  });
});
