export type SessionPeriod = 'today' | 'tomorrow' | 'this_week' | 'next_week';

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Midnight (VN time, UTC+7) of `now + dayOffset` days, as a real UTC instant. */
function vnMidnight(now: Date, dayOffset: number): Date {
  const shifted = new Date(now.getTime() + VN_OFFSET_MS);
  const utcMidnight = Date.UTC(
    shifted.getUTCFullYear(),
    shifted.getUTCMonth(),
    shifted.getUTCDate() + dayOffset,
  );
  return new Date(utcMidnight - VN_OFFSET_MS);
}

/** Day offset (from `now`) to the Monday of `now`'s week, VN time. */
function mondayOffset(now: Date): number {
  const shifted = new Date(now.getTime() + VN_OFFSET_MS);
  const day = shifted.getUTCDay(); // 0 = Sun ... 6 = Sat
  return day === 0 ? -6 : 1 - day;
}

/**
 * Resolves a semantic period ("today", "this_week", ...) to a half-open
 * `[from, to)` date range, computed server-side in VN time (UTC+7, no DST) so
 * the model never has to do date arithmetic itself.
 */
export function resolveSessionPeriod(
  period: SessionPeriod,
  now = new Date(),
): { from: Date; to: Date } {
  switch (period) {
    case 'today':
      return { from: vnMidnight(now, 0), to: vnMidnight(now, 1) };
    case 'tomorrow':
      return { from: vnMidnight(now, 1), to: vnMidnight(now, 2) };
    case 'this_week': {
      const offset = mondayOffset(now);
      return { from: vnMidnight(now, offset), to: vnMidnight(now, offset + 7) };
    }
    case 'next_week': {
      const offset = mondayOffset(now) + 7;
      return { from: vnMidnight(now, offset), to: vnMidnight(now, offset + 7) };
    }
  }
}
