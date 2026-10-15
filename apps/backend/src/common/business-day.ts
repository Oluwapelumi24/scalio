/** Minutes `timeZone` is ahead of UTC at `at` (e.g. +60 for Africa/Lagos). */
function zoneOffsetMinutes(at: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    })
      .formatToParts(at)
      .map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second);
  return Math.round((asUtc - Math.floor(at.getTime() / 1000) * 1000) / 60_000);
}

/**
 * Start and end (exclusive) of the business's calendar day containing `now`, as
 * UTC instants. "Today" must follow the business's timezone, not the server's.
 */
export function businessDayBounds(now: Date, timeZone: string): { start: Date; end: Date } {
  const offset = zoneOffsetMinutes(now, timeZone);
  const local = new Date(now.getTime() + offset * 60_000);
  const localMidnightAsUtc = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  const start = new Date(localMidnightAsUtc - zoneOffsetMinutes(new Date(localMidnightAsUtc), timeZone) * 60_000);
  const nextMidnightAsUtc = localMidnightAsUtc + 86_400_000;
  const end = new Date(nextMidnightAsUtc - zoneOffsetMinutes(new Date(nextMidnightAsUtc), timeZone) * 60_000);
  return { start, end };
}
