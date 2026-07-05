import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  GetCategoriesQueryDto,
  UpdateCategoryDto,
  type CreateCategoryDto,
} from '@packages/entities/category';
import { CategoryRepository } from './category.repository';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(private readonly category: CategoryRepository) {}

  async createCategoryService(createCategoryDto: CreateCategoryDto) {
    const duplicate = await this.category.getCategory({
      field: 'name',
      value: createCategoryDto.name,
    });
    if (duplicate && duplicate.length > 0) {
      const conflict = (duplicate as Array<{ type: string; parentId: string | null }>).find(
        (c) =>
          c.type === createCategoryDto.type &&
          (c.parentId ?? null) === (createCategoryDto.parent_id ?? null),
      );
      if (conflict) {
        throw new BadRequestException(`Category already exists...`);
      }
    }

    const created = await this.category.createCategory(createCategoryDto);
    return created;
  }

  async getCategoriesService(query: GetCategoriesQueryDto) {
    return this.category.getCategories(query);
  }

  async getCategoryService({ field, value }: { field: string; value: string }) {
    const result = await this.category.getCategory({ field, value });
    const category = Array.isArray(result) ? result[0] : result;
    return category ?? null;
  }

  async updateCategoryService({
    id,
    updateCategoryDto,
  }: {
    id: string;
    updateCategoryDto: UpdateCategoryDto;
  }) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    this.logger.log('Updating category...');

    const existing = await this.category.getCategory({ field: 'id', value: id });
    const found = Array.isArray(existing) ? existing[0] : existing;
    if (!found) {
      throw new NotFoundException(`Category ${id} not found.`);
    }

    const category = await this.category.updateCategory({ id, updateCategoryDto });
    return Array.isArray(category) ? category[0] : category;
  }

  async deleteCategoryService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) throw new BadRequestException('id must be uuid ...');
    this.logger.log('Deleting category...');
    const existing = await this.category.getCategory({ field: 'id', value: id });
    const found = Array.isArray(existing) ? existing[0] : existing;
    if (!found) {
      throw new NotFoundException(`Category ${id} not found.`);
    }
    return this.category.deleteCategory({ id });
  }
}
