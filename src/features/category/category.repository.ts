import { Inject, Injectable } from '@nestjs/common';
import { UpdateCategoryDto, type CreateCategoryDto } from '@packages/entities/category';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { categories } from '../../database/schema';
import { count, eq } from 'drizzle-orm';
import { buildListWhereClause } from '@packages/helpers';

@Injectable()
export class CategoryRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async createCategory(createCategoryDto: CreateCategoryDto) {
    const { name, type, parent_id, icon, color } = createCategoryDto;

    const [category] = await this.db
      .insert(categories)
      .values({
        name,
        type,
        parentId: parent_id ?? null,
        icon,
        color,
      })
      .returning();

    return category;
  }

  async getCategories({
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

    const [totalRow] = await this.db.select({ total: count() }).from(categories).where(whereClause);
    const total = Number(totalRow?.total ?? 0);
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const offset = (pageNumber - 1) * limitNumber;

    const categoryRows = await this.db
      .select()
      .from(categories)
      .where(whereClause)
      .limit(limitNumber)
      .offset(offset);
    return {
      data: categoryRows,
      pagination: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async getCategory({ field, value }: { field: string; value: string }) {
    const category = await this.db
      .select()
      .from(categories)
      .where(eq(categories[field as keyof typeof categories] as any, value));
    return category || null;
  }

  async updateCategory({
    id,
    updateCategoryDto,
  }: {
    id: string;
    updateCategoryDto: UpdateCategoryDto;
  }) {
    const category = await this.db
      .update(categories)
      .set(updateCategoryDto)
      .where(eq(categories.id, id))
      .returning();
    return category || null;
  }

  async deleteCategory({ id }: { id: string }) {
    const category = await this.db.delete(categories).where(eq(categories.id, id)).returning();
    return category.length > 0 ? true : false;
  }
}
