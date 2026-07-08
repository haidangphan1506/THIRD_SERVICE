import { Inject, Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, asc, eq, inArray, type SQL } from 'drizzle-orm';
import { classes, schedules } from 'src/database/schema';

/** Read-only queries about the recurring weekly timetable. */
@Injectable()
export class ScheduleContextService {
  constructor(
    @Inject('DRIZZLE')
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  /** Recurring weekly timetable for the user's classes, optionally filtered by weekday. */
  async getMySchedule(classIds: string[], dayOfWeek?: string) {
    if (classIds.length === 0) return { count: 0, schedule: [] };

    const conditions: SQL[] = [inArray(schedules.classId, classIds)];
    if (dayOfWeek) {
      conditions.push(eq(schedules.dayOfWeek, dayOfWeek.toUpperCase() as never));
    }

    const rows = await this.db
      .select({
        classId: schedules.classId,
        className: classes.name,
        subject: classes.subject,
        dayOfWeek: schedules.dayOfWeek,
        startTime: schedules.startTime,
        endTime: schedules.endTime,
        format: schedules.format,
        location: schedules.location,
      })
      .from(schedules)
      .innerJoin(classes, eq(classes.id, schedules.classId))
      .where(and(...conditions))
      .orderBy(asc(schedules.dayOfWeek), asc(schedules.startTime));

    return { count: rows.length, schedule: rows };
  }
}
