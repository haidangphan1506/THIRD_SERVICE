import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { type CreateCurriculumDto, UpdateCurriculumDto } from '@packages/entities';
import { chapters, curriculums, lessons } from 'src/database/schema';
import { buildListWhereClause } from '@packages/helpers';
import { asc, count, eq } from 'drizzle-orm';

@Injectable()
export class CurriculumRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async findByCode(code: string) {
    const [curriculum] = await this.db.select().from(curriculums).where(eq(curriculums.code, code));
    return curriculum ?? null;
  }

  async create({ userId, data }: { userId: string; data: CreateCurriculumDto }) {
    const { subject, code, grade, description, courseTime } = data;
    const [curriculum] = await this.db
      .insert(curriculums)
      .values({
        id: uuidv4(),
        userId,
        code,
        grade: String(grade),
        subject,
        gradesId: null,
        courseTime,
        description: description ?? null,
      })
      .returning();
    return curriculum;
  }

  async findAll({
    page = 1,
    limit = 10,
    search,
    searchableColumns,
    filters,
    filterColumns,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    searchableColumns?: Record<string, any>;
    filters?: Record<string, any>;
    filterColumns?: Record<string, any>;
  }) {
    const whereClause = buildListWhereClause({
      search,
      searchableColumns,
      filters,
      filterColumns,
    });

    const [totalRow] = await this.db
      .select({ total: count() })
      .from(curriculums)
      .where(whereClause);
    const total = Number(totalRow?.total ?? 0);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const rows = await this.db
      .select()
      .from(curriculums)
      .where(whereClause)
      .limit(limitNumber)
      .offset(offset);

    return {
      curriculums: rows,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findById(id: string) {
    const [curriculum] = await this.db.select().from(curriculums).where(eq(curriculums.id, id));
    return curriculum ?? null;
  }

  async findByIdWithDetails(id: string) {
    const [curriculum] = await this.db.select().from(curriculums).where(eq(curriculums.id, id));
    if (!curriculum) return null;

    const [chapterRows, lessonRows] = await Promise.all([
      this.db
        .select()
        .from(chapters)
        .where(eq(chapters.curriculumId, id))
        .orderBy(asc(chapters.order)),
      this.db
        .select()
        .from(lessons)
        .where(eq(lessons.curriculumId, id))
        .orderBy(asc(lessons.order)),
    ]);

    const chaptersWithLessons = chapterRows.map((chapter) => ({
      ...chapter,
      lessons: lessonRows.filter((l) => l.chapterId === chapter.id),
    }));

    return {
      ...curriculum,
      chapters: chaptersWithLessons,
      lessons: lessonRows.filter((l) => !l.chapterId),
    };
  }

  async update(id: string, data: UpdateCurriculumDto) {
    const updateData: Record<string, any> = { ...data };
    if (data.grade !== undefined) {
      updateData.grade = String(data.grade);
    }
    const [curriculum] = await this.db
      .update(curriculums)
      .set(updateData)
      .where(eq(curriculums.id, id))
      .returning();
    return curriculum ?? null;
  }

  async delete(id: string) {
    const [curriculum] = await this.db
      .delete(curriculums)
      .where(eq(curriculums.id, id))
      .returning();
    return !!curriculum;
  }
}
