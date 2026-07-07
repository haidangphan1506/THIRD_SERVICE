import { Inject, Injectable } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, asc, count, desc, eq, inArray, type SQL } from 'drizzle-orm';
import { chapters, classes, curriculums, lessons, tuitions } from 'src/database/schema';

/** Read-only queries about classes, curriculums and tuition. */
@Injectable()
export class ClassContextService {
  constructor(
    @Inject('DRIZZLE')
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  /** Classes the user teaches or is enrolled in. */
  async getMyClasses(classIds: string[]) {
    if (classIds.length === 0) return { count: 0, classes: [] };

    const rows = await this.db
      .select({
        id: classes.id,
        name: classes.name,
        code: classes.code,
        subject: classes.subject,
        status: classes.status,
        format: classes.format,
        tuition: classes.tuition,
        startTime: classes.startTime,
        endTime: classes.endTime,
        location: classes.location,
      })
      .from(classes)
      .where(inArray(classes.id, classIds))
      .orderBy(asc(classes.name));

    return { count: rows.length, classes: rows };
  }

  /** Curriculums (chương trình học / giáo trình) the user owns, with chapter & lesson counts. */
  async getMyCurriculums(userId: string) {
    const rows = await this.db
      .select({
        id: curriculums.id,
        subject: curriculums.subject,
        code: curriculums.code,
        grade: curriculums.grade,
        courseTime: curriculums.courseTime,
        description: curriculums.description,
        createdAt: curriculums.createdAt,
      })
      .from(curriculums)
      .where(eq(curriculums.userId, userId))
      .orderBy(desc(curriculums.createdAt));

    const enriched = await Promise.all(
      rows.map(async (c) => {
        const [ch] = await this.db
          .select({ n: count() })
          .from(chapters)
          .where(eq(chapters.curriculumId, c.id));
        const [ls] = await this.db
          .select({ n: count() })
          .from(lessons)
          .where(eq(lessons.curriculumId, c.id));
        return { ...c, chapterCount: Number(ch?.n ?? 0), lessonCount: Number(ls?.n ?? 0) };
      }),
    );

    return { count: enriched.length, curriculums: enriched };
  }

  /** Tuition records with a per-status summary. */
  async getMyTuitions(params: {
    classIds: string[];
    studentIds: string[];
    byClass: boolean;
    status?: string;
  }) {
    const conditions: SQL[] = [];

    if (params.byClass) {
      if (params.classIds.length === 0) return { summary: {}, tuitions: [] };
      conditions.push(inArray(tuitions.classId, params.classIds));
    } else {
      if (params.studentIds.length === 0) return { summary: {}, tuitions: [] };
      conditions.push(inArray(tuitions.studentId, params.studentIds));
    }

    if (params.status) {
      conditions.push(eq(tuitions.status, params.status.toUpperCase() as never));
    }

    const rows = await this.db
      .select({
        id: tuitions.id,
        className: classes.name,
        amount: tuitions.amount,
        status: tuitions.status,
        dueDate: tuitions.dueDate,
        paidDate: tuitions.paidDate,
        note: tuitions.note,
      })
      .from(tuitions)
      .innerJoin(classes, eq(classes.id, tuitions.classId))
      .where(and(...conditions))
      .orderBy(desc(tuitions.dueDate))
      .limit(100);

    const summary: Record<string, { count: number; totalAmount: number }> = {};
    for (const r of rows) {
      const key = r.status ?? 'UNKNOWN';
      summary[key] ??= { count: 0, totalAmount: 0 };
      summary[key].count += 1;
      summary[key].totalAmount += Number(r.amount ?? 0);
    }

    return { summary, tuitions: rows };
  }
}
