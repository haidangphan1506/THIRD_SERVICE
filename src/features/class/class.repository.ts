import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, count, inArray } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { CreateClassDto, GetClassesQueryDto } from '@packages/entities/class';
import { chapters, classes, classStudents, lessons, users } from 'src/database/schema';
import { buildListWhereClause } from '@packages/helpers';

@Injectable()
export class ClassRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async getClassByField({ field, value }: { field: string; value: string }) {
    const fieldMaps = {
      id: classes.id,
      name: classes.name,
      code: classes.code,
    } as const;

    const [result] = await this.db
      .select()
      .from(classes)
      .where(eq(fieldMaps[field], value ?? ''));
    return result;
  }

  async create({ data }: { data: CreateClassDto }) {
    const [classData] = await this.db
      .insert(classes)
      .values({
        name: data.name,
        code: data.code,
        subject: data.subject,
        tuition: data.tuition?.toString(),
        description: data.description,
        status: data.status,
        format: data.format,
        startTime: data.startTime,
        endTime: data.endTime,
        location: data.location,
        curriculumId: data.curriculumId,
        tutorId: data.tutorId,
      })
      .returning();
    return classData;
  }

  async getClasses({
    userId,
    role,
    query,
  }: {
    userId: string;
    role?: string;
    query: GetClassesQueryDto;
  }) {
    const { page = 1, limit = 10, search, status, subject, studentsId } = query;

    const searchWhere = buildListWhereClause({
      search,
      searchableColumns: {
        name: { column: classes.name },
        code: { column: classes.code },
        subject: { column: classes.subject },
      },
      filters: { status, subject },
      filterColumns: {
        status: { column: classes.status },
        subject: { column: classes.subject },
      },
    });

    // scope by role: a STUDENT only sees classes they're enrolled in, a PARENT only sees
    // classes one of their children is enrolled in, everyone else (TUTOR/ADMIN) sees the
    // classes they own (tutorId).
    let scopeWhere;
    if (role === 'STUDENT') {
      const enrolledClassIds = this.db
        .select({ classId: classStudents.classId })
        .from(classStudents)
        .where(eq(classStudents.studentId, userId));
      scopeWhere = inArray(classes.id, enrolledClassIds);
    } else if (role === 'PARENT') {
      const childClassIds = this.db
        .select({ classId: classStudents.classId })
        .from(classStudents)
        .innerJoin(users, eq(users.id, classStudents.studentId))
        .where(eq(users.parentId, userId));
      scopeWhere = inArray(classes.id, childClassIds);
    } else {
      scopeWhere = eq(classes.tutorId, userId);
    }

    const conditions = [searchWhere, scopeWhere];
    if (studentsId) {
      const studentClassIds = this.db
        .select({ classId: classStudents.classId })
        .from(classStudents)
        .where(eq(classStudents.studentId, studentsId));
      conditions.push(inArray(classes.id, studentClassIds));
    }
    const whereClause = and(...conditions.filter((c) => c !== undefined));

    const [totalRow] = await this.db.select({ total: count() }).from(classes).where(whereClause);
    const total = Number(totalRow?.total ?? 0);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const classesRow = await this.db
      .select()
      .from(classes)
      .where(whereClause)
      .limit(limitNumber)
      .offset(offset);
    return {
      classes: classesRow,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  // enroll one or many students into a class; duplicates (already enrolled) are skipped
  // via the (class_id, student_id) unique index and simply not returned.
  async addStudents({ classId, studentIds }: { classId: string; studentIds: string[] }) {
    if (studentIds.length === 0) return [];
    const rows = await this.db
      .insert(classStudents)
      .values(studentIds.map((studentId) => ({ classId, studentId })))
      .onConflictDoNothing()
      .returning();
    return rows;
  }

  //todo : get detail class by id (with enrolled students) ...
  async getClass({ id }: { id: string }) {
    const [classData] = await this.db.select().from(classes).where(eq(classes.id, id)).limit(1);
    if (!classData) return null;

    const students = await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        avatar: users.avatar,
        userCode: users.userCode,
        gender: users.gender,
        school: users.school,
        enrolledAt: classStudents.createdAt,
      })
      .from(classStudents)
      .innerJoin(users, eq(users.id, classStudents.studentId))
      .where(eq(classStudents.classId, id))
      .orderBy(classStudents.createdAt);

    return { ...classData, students };
  }

  async delClass({ id }: { id: string }) {
    const [classData] = await this.db.delete(classes).where(eq(classes.id, id)).returning();
    return !!classData;
  }

  // list every lesson of a curriculum, joined with its chapter title, ordered for display.
  // Each lesson carries its theoryUrls / exerciseUrls — the service derives the two material lists.
  async getMaterials({ curriculumId }: { curriculumId: string }) {
    return await this.db
      .select({
        id: lessons.id,
        title: lessons.title,
        description: lessons.description,
        order: lessons.order,
        chapterId: lessons.chapterId,
        chapterTitle: chapters.title,
        theoryUrls: lessons.theoryUrls,
        exerciseUrls: lessons.exerciseUrls,
        createdAt: lessons.createdAt,
      })
      .from(lessons)
      .leftJoin(chapters, eq(chapters.id, lessons.chapterId))
      .where(eq(lessons.curriculumId, curriculumId))
      .orderBy(asc(lessons.order), asc(lessons.createdAt));
  }

  async getAllStudent({ id }: { id: string }) {
    const parents = alias(users, 'parents');
    return await this.db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatar: users.avatar,
        phone: users.phone,
        role: users.role,
        userCode: users.userCode,
        parent: {
          id: parents.id,
          firstName: parents.firstName,
          lastName: parents.lastName,
          email: parents.email,
          avatar: parents.avatar,
          phone: parents.phone,
          relationship: parents.relationship,
        },
      })
      .from(classStudents)
      .innerJoin(users, eq(users.id, classStudents.studentId))
      .leftJoin(parents, eq(parents.id, users.parentId))
      .where(eq(classStudents.classId, id));
  }
}
