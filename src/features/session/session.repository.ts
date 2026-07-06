import { Inject, Injectable } from '@nestjs/common';
import { and, asc, count, desc, eq, gte, inArray, lte, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classStudents, classes, sessions } from '../../database/schema';
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

    const [totalRow] = await this.db.select({ total: count() }).from(sessions).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select({
        session: sessions,
        className: classes.name,
        classCode: classes.code,
        classSubject: classes.subject,
      })
      .from(sessions)
      .innerJoin(classes, eq(sessions.classId, classes.id))
      .where(where)
      .orderBy(asc(sessions.sessionNumber))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => ({
        ...this.serialize(r.session),
        class: {
          id: r.session.classId,
          name: r.className,
          code: r.classCode,
          subject: r.classSubject,
        },
      })),
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

  /** Class IDs the student is enrolled in. */
  async getEnrolledClassIds(studentId: string): Promise<string[]> {
    const rows = await this.db
      .select({ classId: classStudents.classId })
      .from(classStudents)
      .where(eq(classStudents.studentId, studentId));
    return rows.map((r) => r.classId);
  }

  async isStudentEnrolled(studentId: string, classId: string): Promise<boolean> {
    const [row] = await this.db
      .select({ id: classStudents.id })
      .from(classStudents)
      .where(and(eq(classStudents.studentId, studentId), eq(classStudents.classId, classId)))
      .limit(1);
    return !!row;
  }

  /**
   * Sessions across every class a student is enrolled in, each enriched with a
   * compact `class` object for display. Newest first.
   */
  async findAllForStudent({ classIds, query }: { classIds: string[]; query: GetSessionsQueryDto }) {
    const { page, limit, classId, status, from, to } = query;
    const conditions: SQL[] = [inArray(sessions.classId, classIds)];

    if (classId) conditions.push(eq(sessions.classId, classId));
    if (status) conditions.push(eq(sessions.status, status));
    if (from) conditions.push(gte(sessions.startAt, from));
    if (to) conditions.push(lte(sessions.startAt, to));

    const where = and(...conditions);
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db.select({ total: count() }).from(sessions).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select({
        session: sessions,
        className: classes.name,
        classCode: classes.code,
        classSubject: classes.subject,
      })
      .from(sessions)
      .innerJoin(classes, eq(sessions.classId, classes.id))
      .where(where)
      .orderBy(desc(sessions.startAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => ({
        ...this.serialize(r.session),
        class: {
          id: r.session.classId,
          name: r.className,
          code: r.classCode,
          subject: r.classSubject,
        },
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
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
