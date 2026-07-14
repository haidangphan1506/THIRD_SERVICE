import { Inject, Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, asc, eq, gte, inArray, lt } from 'drizzle-orm';
import { classes, sessions } from 'src/database/schema';
import { resolveSessionPeriod, type SessionPeriod } from '../utils/date-range';

/** Read-only queries about concrete (dated) class sessions. */
@Injectable()
export class SessionContextService {
  constructor(
    @Inject('DRIZZLE')
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  /**
   * Concrete class sessions within a date window. `period` (when given) is
   * resolved server-side (VN time) and takes priority over `fromIso`/`toIso` —
   * this is how "hôm nay/tuần này/..." questions get an exact, deterministic
   * range instead of relying on the model's own date arithmetic.
   */
  async getUpcomingSessions(
    classIds: string[],
    args: { fromIso?: string; toIso?: string; period?: SessionPeriod } = {},
  ) {
    if (classIds.length === 0) return { count: 0, sessions: [] };

    let from: Date;
    let to: Date;
    if (args.period) {
      ({ from, to } = resolveSessionPeriod(args.period));
    } else {
      from = args.fromIso ? new Date(args.fromIso) : new Date();
      to = args.toIso ? new Date(args.toIso) : new Date(from.getTime() + 7 * 24 * 60 * 60 * 1000);
    }

    const rows = await this.db
      .select({
        id: sessions.id,
        className: classes.name,
        title: sessions.title,
        sessionNumber: sessions.sessionNumber,
        startAt: sessions.startAt,
        endAt: sessions.endAt,
        status: sessions.status,
        location: sessions.location,
      })
      .from(sessions)
      .innerJoin(classes, eq(classes.id, sessions.classId))
      .where(
        and(
          inArray(sessions.classId, classIds),
          gte(sessions.startAt, from),
          lt(sessions.startAt, to),
        ),
      )
      .orderBy(asc(sessions.startAt))
      .limit(50);

    return { count: rows.length, sessions: rows };
  }
}
