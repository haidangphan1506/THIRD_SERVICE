import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, eq, gte, lte, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { sessions } from '../../database/schema';
import type { CreateSessionDto, GetSessionsQueryDto } from '@packages/entities/session';

@Injectable()
export class SessionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: CreateSessionDto) {
    const [session] = await this.db
      .insert(sessions)
      .values({
        classId: data.classId,
        lessonId: data.lessonId ?? null,
        tutorId: data.tutorId ?? null,
        title: data.title ?? null,
        description: data.description ?? null,
        sessionNumber: data.sessionNumber,
        theoryUrls: data.theoryUrls ?? [],
        exerciseUrls: data.exerciseUrls ?? [],
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location ?? null,
        status: data.status ?? 'SCHEDULED',
        note: data.note ?? null,
        actualStartAt: data.actualStartAt ?? null,
        actualEndAt: data.actualEndAt ?? null,
      })
      .returning();
    return session;
  }

  async findAll({ query }: { query: GetSessionsQueryDto }) {
    const { page, limit, classId, status, from, to } = query;
    const conditions: SQL[] = [];

    if (classId) conditions.push(eq(sessions.classId, classId));
    if (status) conditions.push(eq(sessions.status, status));
    if (from) conditions.push(gte(sessions.startAt, from));
    if (to) conditions.push(lte(sessions.startAt, to));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(sessions)
      .where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(sessions)
      .where(where)
      .orderBy(asc(sessions.sessionNumber))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => this.serialize(r)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, id));
    return session ? this.serialize(session) : null;
  }

  async update(id: string, data: Partial<Omit<CreateSessionDto, 'classId'>>) {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (data.lessonId !== undefined) values.lessonId = data.lessonId;
    if (data.tutorId !== undefined) values.tutorId = data.tutorId;
    if (data.title !== undefined) values.title = data.title;
    if (data.description !== undefined) values.description = data.description;
    if (data.sessionNumber !== undefined) values.sessionNumber = data.sessionNumber;
    if (data.theoryUrls !== undefined) values.theoryUrls = data.theoryUrls;
    if (data.exerciseUrls !== undefined) values.exerciseUrls = data.exerciseUrls;
    if (data.startAt !== undefined) values.startAt = data.startAt;
    if (data.endAt !== undefined) values.endAt = data.endAt;
    if (data.location !== undefined) values.location = data.location;
    if (data.status !== undefined) values.status = data.status;
    if (data.note !== undefined) values.note = data.note;
    if (data.actualStartAt !== undefined) values.actualStartAt = data.actualStartAt;
    if (data.actualEndAt !== undefined) values.actualEndAt = data.actualEndAt;

    const [session] = await this.db
      .update(sessions)
      .set(values)
      .where(eq(sessions.id, id))
      .returning();
    return session ? this.serialize(session) : null;
  }

  async delete(id: string) {
    const [session] = await this.db.delete(sessions).where(eq(sessions.id, id)).returning();
    return !!session;
  }

  private serialize(s: typeof sessions.$inferSelect) {
    const toIso = (d: Date | null | undefined) =>
      d instanceof Date ? d.toISOString() : d ? String(d) : null;
    return {
      id: s.id,
      classId: s.classId,
      lessonId: s.lessonId ?? null,
      tutorId: s.tutorId ?? null,
      title: s.title ?? null,
      description: s.description ?? null,
      sessionNumber: s.sessionNumber,
      theoryUrls: (s.theoryUrls as { name: string; url: string; key: string }[]) ?? [],
      exerciseUrls: (s.exerciseUrls as { name: string; url: string; key: string }[]) ?? [],
      startAt: toIso(s.startAt)!,
      endAt: toIso(s.endAt)!,
      location: s.location ?? null,
      status: s.status,
      note: s.note ?? null,
      actualStartAt: toIso(s.actualStartAt),
      actualEndAt: toIso(s.actualEndAt),
      createdAt: toIso(s.createdAt)!,
      updatedAt: toIso(s.updatedAt)!,
    };
  }
}
