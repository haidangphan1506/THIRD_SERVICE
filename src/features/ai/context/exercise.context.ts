import { Inject, Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { classes, exercise, studentScores, users } from 'src/database/schema';
import type { JwtUserRole } from '@packages/helpers';

/** Read-only queries about assignments/exercises and recorded scores. */
@Injectable()
export class ExerciseContextService {
  constructor(
    @Inject('DRIZZLE')
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  /** Assignments relevant to the caller (own for TUTOR/STUDENT, children's for PARENT, all for ADMIN). */
  async getMyAssignments(params: {
    userId: string;
    role: JwtUserRole;
    studentIds: string[];
    status?: string;
  }) {
    const conditions: SQL[] = [];
    if (params.role === 'TUTOR') {
      conditions.push(eq(exercise.tutorId, params.userId));
    } else if (params.role === 'STUDENT' || params.role === 'PARENT') {
      if (params.studentIds.length === 0) return { count: 0, assignments: [] };
      conditions.push(inArray(exercise.studentId, params.studentIds));
    }
    if (params.status) {
      conditions.push(eq(exercise.status, params.status as 'SUBMITTED' | 'GRADED' | 'RESUBMIT'));
    }

    const rows = await this.db
      .select({
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        status: exercise.status,
        score: exercise.score,
        comment: exercise.comment,
        gradedAt: exercise.gradedAt,
        createdAt: exercise.createdAt,
      })
      .from(exercise)
      .innerJoin(users, eq(users.id, exercise.studentId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(exercise.createdAt))
      .limit(100);

    return { count: rows.length, assignments: rows };
  }

  /** Recorded scores/feedback for the relevant student(s), with an average. */
  async getMyScores(params: { classIds: string[]; studentIds: string[]; byClass: boolean }) {
    const conditions: SQL[] = [];
    if (params.byClass) {
      if (params.classIds.length === 0) return { count: 0, average: null, scores: [] };
      conditions.push(inArray(studentScores.classId, params.classIds));
    } else {
      if (params.studentIds.length === 0) return { count: 0, average: null, scores: [] };
      conditions.push(inArray(studentScores.studentId, params.studentIds));
    }

    const rows = await this.db
      .select({
        className: classes.name,
        studentName: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
        score: studentScores.score,
        comment: studentScores.comment,
        createdAt: studentScores.createdAt,
      })
      .from(studentScores)
      .innerJoin(classes, eq(classes.id, studentScores.classId))
      .innerJoin(users, eq(users.id, studentScores.studentId))
      .where(and(...conditions))
      .orderBy(desc(studentScores.createdAt))
      .limit(100);

    const numeric = rows.map((r) => Number(r.score)).filter((n) => !Number.isNaN(n));
    const average = numeric.length
      ? Math.round((numeric.reduce((a, b) => a + b, 0) / numeric.length) * 100) / 100
      : null;

    return { count: rows.length, average, scores: rows };
  }
}
