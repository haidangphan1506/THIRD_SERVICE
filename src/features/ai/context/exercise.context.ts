import { Inject, Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, desc, eq, inArray, sql, type SQL } from 'drizzle-orm';
import { assignments, classes, studentScores, users } from 'src/database/schema';

/** Read-only queries about assignments and recorded scores. */
@Injectable()
export class ExerciseContextService {
  constructor(
    @Inject('DRIZZLE')
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  /** Assignments for the user's classes, optionally filtered by status. */
  async getMyAssignments(classIds: string[], status?: string) {
    if (classIds.length === 0) return { count: 0, assignments: [] };

    const conditions: SQL[] = [
      inArray(assignments.classId, classIds),
      eq(assignments.isHidden, false),
    ];
    if (status) {
      conditions.push(eq(assignments.status, status.toUpperCase() as never));
    }

    const rows = await this.db
      .select({
        id: assignments.id,
        className: classes.name,
        name: assignments.name,
        lesson: assignments.lesson,
        status: assignments.status,
        score: assignments.score,
        comment: assignments.comment,
      })
      .from(assignments)
      .innerJoin(classes, eq(classes.id, assignments.classId))
      .where(and(...conditions))
      .orderBy(desc(assignments.createdAt))
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
