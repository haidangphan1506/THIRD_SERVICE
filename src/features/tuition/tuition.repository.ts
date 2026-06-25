import { Inject, Injectable } from '@nestjs/common';
import { and, count, desc, eq, type SQL, sum } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { tuitions } from '../../database/schema';
import type { CreateTuitionDto, GetTuitionsQueryDto } from '@packages/entities/tuition';

@Injectable()
export class TuitionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: CreateTuitionDto) {
    const [tuition] = await this.db
      .insert(tuitions)
      .values({
        classId: data.classId,
        studentId: data.studentId,
        amount: String(data.amount),
        dueDate: data.dueDate ?? null,
        paidDate: data.paidDate ?? null,
        status: data.status ?? 'UNPAID',
        note: data.note ?? null,
      })
      .returning();
    return tuition;
  }

  async findAll(query: GetTuitionsQueryDto) {
    const { page, limit, classId, studentId, status } = query;
    const conditions: SQL[] = [];

    if (classId) conditions.push(eq(tuitions.classId, classId));
    if (studentId) conditions.push(eq(tuitions.studentId, studentId));
    if (status) conditions.push(eq(tuitions.status, status));

    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const [totalRow] = await this.db.select({ total: count() }).from(tuitions).where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(tuitions)
      .where(where)
      .orderBy(desc(tuitions.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      data: rows.map((r) => ({
        ...r,
        amount: r.amount != null ? String(r.amount) : '0',
      })),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const [tuition] = await this.db.select().from(tuitions).where(eq(tuitions.id, id));
    return tuition ?? null;
  }

  async update(id: string, data: Record<string, unknown>) {
    const [tuition] = await this.db
      .update(tuitions)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(tuitions.id, id))
      .returning();
    return tuition ?? null;
  }

  async delete(id: string) {
    const [tuition] = await this.db.delete(tuitions).where(eq(tuitions.id, id)).returning();
    return !!tuition;
  }

  async getSummary(classId?: string) {
    const conditions: SQL[] = [];
    if (classId) conditions.push(eq(tuitions.classId, classId));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [paidRow] = await this.db
      .select({ total: sum(tuitions.amount) })
      .from(tuitions)
      .where(and(where, eq(tuitions.status, 'PAID')));
    const [unpaidRow] = await this.db
      .select({ total: sum(tuitions.amount) })
      .from(tuitions)
      .where(and(where, eq(tuitions.status, 'UNPAID')));
    const [overdueRow] = await this.db
      .select({ total: sum(tuitions.amount) })
      .from(tuitions)
      .where(and(where, eq(tuitions.status, 'OVERDUE')));

    return {
      totalPaid: Number(paidRow?.total ?? 0),
      totalUnpaid: Number(unpaidRow?.total ?? 0),
      totalOverdue: Number(overdueRow?.total ?? 0),
      totalRevenue: Number(paidRow?.total ?? 0),
    };
  }
}
