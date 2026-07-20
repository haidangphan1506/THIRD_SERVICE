import { Inject, Injectable } from '@nestjs/common';
import type { GetStudentsQueryDto } from '@packages/entities/student';
import { buildListWhereClause } from '@packages/helpers';
import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from 'src/database/database.module';
import { classStudents, users } from 'src/database/schema';

@Injectable()
export class StudentRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async createStudent(data: {
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
  }) {
    const [student] = await this.db
      .insert(users)
      .values({ ...data, role: 'STUDENT' })
      .returning();
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
    gender: 'MALE' | 'FEMALE' | 'OTHER' | null;
    tutorId: string | null;
  }) {
    const [parent] = await this.db
      .insert(users)
      .values({ ...data, role: 'PARENT' })
      .returning();
    return parent;
  }

  async findById({ id }: { id: string }) {
    const [row] = await this.db
      .select()
      .from(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .limit(1);
    if (!row) return null;

    const [parent] = row.parentId
      ? await this.db.select().from(users).where(eq(users.id, row.parentId))
      : [];

    return { ...row, parent: parent ?? null };
  }

  async update({ id, data }: { id: string; data: Partial<typeof users.$inferInsert> }) {
    const [student] = await this.db
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .returning();
    return student ?? null;
  }

  async updateParent({ id, data }: { id: string; data: Partial<typeof users.$inferInsert> }) {
    const [parent] = await this.db
      .update(users)
      .set(data)
      .where(and(eq(users.id, id), eq(users.role, 'PARENT')))
      .returning();
    return parent ?? null;
  }

  async delete({ id }: { id: string }) {
    const [student] = await this.db
      .delete(users)
      .where(and(eq(users.id, id), eq(users.role, 'STUDENT')))
      .returning();
    return !!student;
  }

  // todo : get and filter student ...
  async getAllStudents({ query }: { query: GetStudentsQueryDto }) {
    const { page, limit, search, classId, tutorId } = query;
    const offset = (page - 1) * limit;

    const searchWhere = buildListWhereClause({
      search,
      searchableColumns: {
        userCode: { column: users.userCode },
        firstName: { column: users.firstName },
        lastName: { column: users.lastName },
      },
      filters: { role: 'STUDENT', tutorId },
      filterColumns: {
        role: { column: users.role },
        tutorId: { column: users.tutorId },
      },
    });

    const where = classId
      ? and(
          searchWhere,
          inArray(
            users.id,
            this.db
              .select({ id: classStudents.studentId })
              .from(classStudents)
              .where(eq(classStudents.classId, classId)),
          ),
        )
      : searchWhere;

    const [totalRow] = await this.db.select({ total: count() }).from(users).where(where);
    const total = Number(totalRow?.total ?? 0);

    const students = await this.db
      .select()
      .from(users)
      .where(where)
      .orderBy(desc(users.createdAt))
      .limit(limit)
      .offset(offset);

    return {
      students,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  // todo: get detail user by data field (userCode, id , username, name,...)
  async getStudentByField({ field, value }: { field: string; value: string }) {
    const fieldMap = {
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      userCode: users.userCode,
      username: users.username,
    } as const;

    const [result] = await this.db
      .select()
      .from(users)
      .where(eq(fieldMap[field], value ?? ''));

    return result;
  }
}
