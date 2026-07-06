import { ConflictException, Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { and, count, desc, eq, ilike, inArray, or, type SQL } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classStudents, users } from '../../database/schema';
import type { GetStudentsQueryDto } from '@packages/entities/student';

function handleDbError(err: unknown): never {
  const e = err as Record<string, unknown>;
  // Drizzle wraps postgres-js errors; the real pg error with `code`/`detail` is in `cause`
  const pg = (e['cause'] ?? e) as Record<string, unknown>;

  if (pg['code'] === '23505') {
    const detail = typeof pg['detail'] === 'string' ? pg['detail'] : 'Duplicate entry';
    throw new ConflictException(detail);
  }
  if (pg['code'] === '23503') {
    const detail = typeof pg['detail'] === 'string' ? pg['detail'] : 'Referenced record not found';
    throw new ConflictException(detail);
  }
  const message = typeof pg['message'] === 'string' ? pg['message'] : 'Database error';
  throw new InternalServerErrorException(message);
}

@Injectable()
export class StudentRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create(data: {
    id: string;
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    userCode: string | null;
    phone: string | null;
    avatar: string | null;
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    dateOfBirth: Date | null;
    school: string | null;
    parentId: string | null;
    tutorId: string | null;
  }): Promise<typeof users.$inferSelect> {
    const [student] = await this.db
      .insert(users)
      .values({ ...data, role: 'STUDENT' })
      .returning()
      .catch(handleDbError);
    return student;
  }

  async createParent(data: {
    id: string;
    email: string;
    password: string;
    username: string;
    firstName: string;
    lastName: string;
    userCode: string | null;
    phone: string | null;
    relationship: string | null;
    tutorId: string | null;
  }): Promise<typeof users.$inferSelect> {
    const [parent] = await this.db
      .insert(users)
      .values({ ...data, role: 'PARENT' })
      .returning()
      .catch(handleDbError);
    return parent;
  }

  async findAll(query: GetStudentsQueryDto & { classIdFilter?: string }) {
    const { page, limit, search, classId: queryClassId, classIdFilter } = query;
    const effectiveClassId = classIdFilter || queryClassId;
    const offset = (page - 1) * limit;

    const conditions: SQL[] = [eq(users.role, 'STUDENT')];

    if (search?.trim()) {
      const pattern = `%${search.trim()}%`;
      const searchCond = or(
        ilike(users.firstName, pattern),
        ilike(users.lastName, pattern),
        ilike(users.email, pattern),
        ilike(users.userCode, pattern),
        ilike(users.phone, pattern),
      );
      if (searchCond) conditions.push(searchCond);
    }

    const where = and(...conditions);

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(users)
      .where(where);
    const total = Number(totalRow?.total ?? 0);

    const rows = await this.db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    const studentIds = rows.map((r) => r.id);
    const classMap = new Map<string, number>();

    const parentIds = rows.map((r) => r.parentId).filter(Boolean) as string[];
    const parentMap = new Map<
      string,
      {
        firstName: string;
        lastName: string;
        phone: string | null;
        email: string;
        relationship: string | null;
      }
    >();
    if (parentIds.length > 0) {
      const parentRows = await this.db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          phone: users.phone,
          email: users.email,
          relationship: users.relationship,
        })
        .from(users)
        .where(inArray(users.id, parentIds));
      for (const p of parentRows) {
        parentMap.set(p.id, {
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          email: p.email,
          relationship: p.relationship,
        });
      }
    }

    if (studentIds.length > 0) {
      if (effectiveClassId) {
        const csRows = await this.db
          .select()
          .from(classStudents)
          .where(
            and(
              eq(classStudents.classId, effectiveClassId),
              inArray(classStudents.studentId, studentIds),
            ),
          );
        const enrolledIds = new Set(csRows.map((r) => r.studentId));
        for (const r of csRows) classMap.set(r.studentId, 1);

        const filtered = rows.filter((r) => enrolledIds.has(r.id));
        return {
          data: filtered.map((r) => this.mapRow(r, classMap, parentMap)),
          pagination: { total: filtered.length, page, limit, totalPages: Math.ceil(filtered.length / limit) },
        };
      }

      const csAgg = await this.db
        .select({ studentId: classStudents.studentId, n: count() })
        .from(classStudents)
        .where(inArray(classStudents.studentId, studentIds))
        .groupBy(classStudents.studentId);
      for (const r of csAgg) classMap.set(r.studentId, Number(r.n));
    }

    return {
      data: rows.map((r) => this.mapRow(r, classMap, parentMap)),
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  private mapRow(
    r: typeof users.$inferSelect,
    classMap: Map<string, number>,
    parentMap: Map<
      string,
      {
        firstName: string;
        lastName: string;
        phone: string | null;
        email: string;
        relationship: string | null;
      }
    >,
  ) {
    const parent = r.parentId ? parentMap.get(r.parentId) : undefined;
    return {
      id: r.id,
      email: r.email,
      username: r.username,
      firstName: r.firstName,
      lastName: r.lastName,
      userCode: r.userCode,
      phone: r.phone,
      avatar: r.avatar,
      gender: r.gender,
      dateOfBirth: r.dateOfBirth instanceof Date ? r.dateOfBirth.toISOString() : r.dateOfBirth,
      school: r.school,
      role: r.role,
      isActive: r.isActive,
      parentId: r.parentId,
      parentName: parent ? `${parent.firstName} ${parent.lastName}`.trim() : null,
      parentPhone: parent?.phone ?? null,
      parentEmail: parent?.email ?? null,
      parentRelationship: parent?.relationship ?? null,
      classCount: classMap.get(r.id) ?? 0,
      createdAt: r.createdAt instanceof Date ? r.createdAt.toISOString() : String(r.createdAt),
      updatedAt: r.updatedAt instanceof Date ? r.updatedAt.toISOString() : String(r.updatedAt),
    };
  }

  async findById(id: string) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .limit(1);
    return row ?? null;
  }

  async findByCode(code: string) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(eq(users.userCode, code))
      .limit(1);
    return row ?? null;
  }

  async update(id: string, data: Partial<typeof users.$inferInsert>) {
    const [student] = await this.db
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .returning()
      .catch(handleDbError);
    return student ?? null;
  }

  async updateParent(id: string, data: Partial<typeof users.$inferInsert>) {
    const [parent] = await this.db
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.role, 'PARENT')))
      .returning()
      .catch(handleDbError);
    return parent ?? null;
  }

  async delete(id: string) {
    const [student] = await this.db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .returning();
    return !!student;
  }
}
