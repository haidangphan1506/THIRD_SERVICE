import { Inject, Injectable } from '@nestjs/common';
import { and, eq, count, inArray } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { CreateClassDto, GetClassesQueryDto } from '@packages/entities/class';
import { classes, classStudents } from 'src/database/schema';
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

  async getClasses({ userId, query }: { userId: string; query: GetClassesQueryDto }) {
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

    const conditions = [searchWhere, eq(classes.tutorId, userId)];
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

  //todo : get detail class by id ...
  async getClass({ id }: { id: string }) {
    const [classData] = await this.db.select().from(classes).where(eq(classes.id, id)).limit(1);
    return classData ?? [];
  }

  async delClass({ id }: { id: string }) {
    const [classData] = await this.db.delete(classes).where(eq(classes.id, id)).returning();
    return !!classData;
  }
}
