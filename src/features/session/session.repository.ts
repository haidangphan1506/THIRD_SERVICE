import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, gte, lte, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { schedules, sessions } from '../../database/schema';
import type {
  CreateScheduleDto,
  CreateSessionDto,
  GetSessionsQueryDto,
} from '@packages/entities/session';

@Injectable()
export class SessionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  // ── Schedules ──

  async createSchedule(data: CreateScheduleDto) {
    const [sched] = await this.db.insert(schedules).values(data).returning();
    return sched;
  }

  async getSchedulesByClass(classId: string) {
    return this.db.select().from(schedules).where(eq(schedules.classId, classId));
  }

  async getScheduleById(id: string) {
    const [sched] = await this.db.select().from(schedules).where(eq(schedules.id, id));
    return sched ?? null;
  }

  async updateSchedule(id: string, data: Record<string, unknown>) {
    const [sched] = await this.db
      .update(schedules)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(schedules.id, id))
      .returning();
    return sched ?? null;
  }

  async deleteSchedule(id: string) {
    const [sched] = await this.db.delete(schedules).where(eq(schedules.id, id)).returning();
    return !!sched;
  }

  // ── Sessions ──

  async createSession(data: CreateSessionDto) {
    const [session] = await this.db
      .insert(sessions)
      .values({
        classId: data.classId,
        title: data.title ?? null,
        date: data.date,
        startTime: data.startTime,
        endTime: data.endTime,
        format: data.format ?? 'ONLINE',
        location: data.location ?? null,
        status: data.status ?? 'UPCOMING',
        note: data.note ?? null,
      })
      .returning();
    return session;
  }

  async createSessionsBulk(data: CreateSessionDto[]) {
    if (data.length === 0) return [];
    return this.db
      .insert(sessions)
      .values(data)
      .returning();
  }

  async findAll(query: GetSessionsQueryDto) {
    const { page, limit, classId, status, from, to } = query;
    const conditions: SQL[] = [];

    if (classId) conditions.push(eq(sessions.classId, classId));
    if (status) conditions.push(eq(sessions.status, status));
    if (from) conditions.push(gte(sessions.date, from));
    if (to) conditions.push(lte(sessions.date, to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db.select({ total: count() }).from(sessions).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(sessions)
      .where(where)
      .orderBy(desc(sessions.date))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => ({
        ...r,
        date: r.date instanceof Date ? r.date.toISOString() : String(r.date),
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, id));
    return session ?? null;
  }

  async updateSession(id: string, data: Record<string, unknown>) {
    const [session] = await this.db
      .update(sessions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(sessions.id, id))
      .returning();
    return session ?? null;
  }

  async deleteSession(id: string) {
    const [session] = await this.db.delete(sessions).where(eq(sessions.id, id)).returning();
    return !!session;
  }

  async checkConflicts(classId: string, date: Date, startTime: string, endTime: string) {
    const conflicting = await this.db
      .select()
      .from(sessions)
      .where(and(eq(sessions.classId, classId), eq(sessions.date, date)));
    return conflicting.filter((s) => {
      return s.startTime < endTime && startTime < s.endTime;
    });
  }
}
