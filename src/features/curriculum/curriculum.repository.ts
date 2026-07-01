import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { CreateCurriculumDto, UpdateCurriculumDto } from '@packages/entities';
import { curriculums } from 'src/database/schema';
import { buildListWhereClause } from '@packages/helpers';
import { count, eq } from 'drizzle-orm';

@Injectable()
export class CurriculumRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async create(userId: string, data: CreateCurriculumDto) {
    const { title, description, gradeId } = data;
    const [curriculum] = await this.db
      .insert(curriculums)
      .values({ id: uuidv4(), userId, gradeId: gradeId ?? null, title, description: description ?? null })
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

    const [totalRow] = await this.db.select({ total: count() }).from(curriculums).where(whereClause);
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

  async update(id: string, data: UpdateCurriculumDto) {
    const [curriculum] = await this.db
      .update(curriculums)
      .set(data)
      .where(eq(curriculums.id, id))
      .returning();
    return curriculum ?? null;
  }

  async delete(id: string) {
    const [curriculum] = await this.db.delete(curriculums).where(eq(curriculums.id, id)).returning();
    return !!curriculum;
  }
}
