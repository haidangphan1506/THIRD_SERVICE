import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { exercise } from '../../database/schema';
import type {
  CreateExerciseDto,
  ExerciseDetailDto,
  GradeExerciseDto,
} from '@packages/entities/exercise';

@Injectable()
export class ExerciseRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: CreateExerciseDto): Promise<ExerciseDetailDto> {
    const [row] = await this.db
      .insert(exercise)
      .values({
        lessonId: data.lessonId ?? null,
        sessionId: data.sessionId ?? null,
        tutorId: data.tutorId,
        studentId: data.studentId,
        issueUrls: data.issueUrls ?? [],
        exerciseUrls: data.exerciseUrls ?? [],
        status: data.status ?? 'SUBMITTED',
      })
      .returning();
    return this.serialize(row);
  }

  async findAll(query: {
    page: number;
    limit: number;
    sessionId?: string;
    studentId?: string;
  }) {
    const { page, limit, sessionId, studentId } = query;
    const conditions: SQL[] = [];
    if (sessionId) conditions.push(eq(exercise.sessionId, sessionId));
    if (studentId) conditions.push(eq(exercise.studentId, studentId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db.select({ total: count() }).from(exercise).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(exercise)
      .where(where)
      .orderBy(desc(exercise.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => this.serialize(r)),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string): Promise<ExerciseDetailDto | null> {
    const [row] = await this.db.select().from(exercise).where(eq(exercise.id, id));
    return row ? this.serialize(row) : null;
  }

  async update(id: string, data: Partial<CreateExerciseDto>): Promise<ExerciseDetailDto | null> {
    const values: Record<string, unknown> = { updatedAt: new Date() };
    if (data.lessonId !== undefined) values.lessonId = data.lessonId;
    if (data.sessionId !== undefined) values.sessionId = data.sessionId;
    if (data.tutorId !== undefined) values.tutorId = data.tutorId;
    if (data.studentId !== undefined) values.studentId = data.studentId;
    if (data.issueUrls !== undefined) values.issueUrls = data.issueUrls;
    if (data.exerciseUrls !== undefined) values.exerciseUrls = data.exerciseUrls;
    if (data.status !== undefined) values.status = data.status;

    const [row] = await this.db
      .update(exercise)
      .set(values)
      .where(eq(exercise.id, id))
      .returning();
    return row ? this.serialize(row) : null;
  }

  /** Student (re)submits their work — resets grading and marks it SUBMITTED. */
  async submit(
    id: string,
    exerciseUrls: { name: string; url: string; key: string }[],
  ): Promise<ExerciseDetailDto | null> {
    const [row] = await this.db
      .update(exercise)
      .set({ exerciseUrls, status: 'SUBMITTED', score: null, comment: null, gradedAt: null, updatedAt: new Date() })
      .where(eq(exercise.id, id))
      .returning();
    return row ? this.serialize(row) : null;
  }

  /** Tutor grades a submission — sets score/comment and marks it GRADED. */
  async grade(id: string, data: GradeExerciseDto): Promise<ExerciseDetailDto | null> {
    const [row] = await this.db
      .update(exercise)
      .set({
        score: data.score.toString(),
        comment: data.comment ?? null,
        status: 'GRADED',
        gradedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(exercise.id, id))
      .returning();
    return row ? this.serialize(row) : null;
  }

  async delete(id: string): Promise<boolean> {
    const [row] = await this.db.delete(exercise).where(eq(exercise.id, id)).returning();
    return !!row;
  }

  private serialize(r: typeof exercise.$inferSelect): ExerciseDetailDto {
    const toIso = (d: Date | null | undefined) =>
      d instanceof Date ? d.toISOString() : d ? String(d) : null;
    return {
      id: r.id,
      lessonId: r.lessonId ?? null,
      sessionId: r.sessionId ?? null,
      tutorId: r.tutorId,
      studentId: r.studentId,
      issueUrls: (r.issueUrls as { name: string; url: string; key: string }[]) ?? [],
      exerciseUrls: (r.exerciseUrls as { name: string; url: string; key: string }[]) ?? [],
      status: r.status,
      score: r.score !== null && r.score !== undefined ? Number(r.score) : null,
      comment: r.comment ?? null,
      gradedAt: toIso(r.gradedAt),
      createdAt: toIso(r.createdAt)!,
      updatedAt: toIso(r.updatedAt)!,
    };
  }
}
