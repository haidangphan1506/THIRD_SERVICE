import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes, classStudents, sessions } from '../../database/schema';
import type { CreateClassDto, GetClassesQueryDto } from '@packages/entities/class';

@Injectable()
export class ClassRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: CreateClassDto & { tutorId: string }) {
    const [cls] = await this.db
      .insert(classes)
      .values({
        name: data.name,
        code: data.code,
        subject: data.subject,
        tuition: data.tuition != null ? String(data.tuition) : '0',
        description: data.description ?? null,
        status: data.status ?? 'OPEN',
        tutorId: data.tutorId,
      })
      .returning();
    return cls;
  }

  async findAll({ tutorId, query }: { tutorId: string; query: GetClassesQueryDto }) {
    const { page, limit, search, status, subject } = query;
    const conditions: SQL[] = [eq(classes.tutorId, tutorId)];

    if (search?.trim()) {
      const pattern = `%${search.trim()}%`;
      const searchCond = or(
        ilike(classes.name, pattern),
        ilike(classes.code, pattern),
        ilike(classes.subject, pattern),
      );
      if (searchCond) conditions.push(searchCond);
    }
    if (status) conditions.push(eq(classes.status, status));
    if (subject) conditions.push(eq(classes.subject, subject));

    const where = and(...conditions);
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db.select({ total: count() }).from(classes).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(classes)
      .where(where)
      .orderBy(desc(classes.createdAt))
      .limit(limit)
      .offset(offset);

    const classIds = rows.map((r) => r.id);

    let studentCountMap = new Map<string, number>();
    let sessionCountMap = new Map<string, number>();

    if (classIds.length > 0) {
      const [studentCounts, sessionCounts] = await Promise.all([
        this.db
          .select({ classId: classStudents.classId, n: count() })
          .from(classStudents)
          .where(inArray(classStudents.classId, classIds))
          .groupBy(classStudents.classId),
        this.db
          .select({ classId: sessions.classId, n: count() })
          .from(sessions)
          .where(inArray(sessions.classId, classIds))
          .groupBy(sessions.classId),
      ]);
      studentCountMap = new Map(
        studentCounts.map((r: { classId: string; n: number }) => [r.classId, Number(r.n)]),
      );
      sessionCountMap = new Map(
        sessionCounts.map((r: { classId: string; n: number }) => [r.classId, Number(r.n)]),
      );
    }

    const data = rows.map((r) => ({
      id: r.id,
      name: r.name,
      code: r.code,
      subject: r.subject,
      tuition: r.tuition != null ? String(r.tuition) : '0',
      description: r.description,
      status: r.status,
      tutorId: r.tutorId,
      studentCount: studentCountMap.get(r.id) ?? 0,
      sessionCount: sessionCountMap.get(r.id) ?? 0,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    }));

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, id));
    return cls ?? null;
  }

  async update(id: string, data: Record<string, unknown>) {
    const [cls] = await this.db
      .update(classes)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(classes.id, id))
      .returning();
    return cls ?? null;
  }

  async delete(id: string) {
    const [cls] = await this.db.delete(classes).where(eq(classes.id, id)).returning();
    return !!cls;
  }

  async getStudentCount(classId: string): Promise<number> {
    const [row] = await this.db
      .select({ n: count() })
      .from(classStudents)
      .where(eq(classStudents.classId, classId));
    return Number(row?.n ?? 0);
  }

  async getSessionCount(classId: string): Promise<{ total: number; upcoming: number }> {
    const [totalRow] = await this.db
      .select({ n: count() })
      .from(sessions)
      .where(eq(sessions.classId, classId));
    const [upcomingRow] = await this.db
      .select({ n: count() })
      .from(sessions)
      .where(and(eq(sessions.classId, classId), eq(sessions.status, 'UPCOMING')));
    return {
      total: Number(totalRow?.n ?? 0),
      upcoming: Number(upcomingRow?.n ?? 0),
    };
  }

  async findByCode(code: string) {
    const [cls] = await this.db.select().from(classes).where(eq(classes.code, code));
    return cls ?? null;
  }
}
