import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { UpdateCategoryDto, type CreateCategoryDto } from '@packages/entities/category';
import { CategoryRepository } from './category.repository';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(private readonly category: CategoryRepository) {}

  async createCategoryService(createCategoryDto: CreateCategoryDto) {
    this.logger.log('Creating category...');
    const isCategoryExists = await this.category.getCategory({
      field: 'name',
      value: createCategoryDto.name,
    });
    
    if (Array.isArray(isCategoryExists) && isCategoryExists.length > 0) {
      throw new BadRequestException('Category already exists ...');
    }
    const category = await this.category.createCategory(createCategoryDto);
    return category || null;
  }

  async getCategoriesService({
    search,
    searchableColumns,
    filters,
    filterColumns,
  }: {
    search?: string;
    searchableColumns?: Record<string, any>;
    filters?: Record<string, any>;
    filterColumns?: Record<string, any>;
  }) {
    this.logger.log('Getting categories...');
    return this.category.getCategories({ search, searchableColumns, filters, filterColumns });
  }

  async getCategoryService({ field, value }: { field: string; value: string }) {
    this.logger.log('Getting category...');
    const category = await this.category.getCategory({ field, value });

    return category || null;
  }

  async updateCategoryService({
    id,
    updateCategoryDto,
  }: {
    id: string;
    updateCategoryDto: UpdateCategoryDto;
  }) {
    this.logger.log('Updating category...');

    const isCategoryExists = await this.category.getCategory({
      field: 'id',
      value: id,
    });
    if (isCategoryExists) {
      throw new BadRequestException('Category already exists ...');
    }
    const category = await this.category.updateCategory({ id, updateCategoryDto });
    return category || null;
  }

  async deleteCategoryService({ id }: { id: string }) {
    this.logger.log('Deleting category...');
    const isCategoryExists = await this.category.getCategory({ field: 'id', value: id });
    if (!isCategoryExists) {
      throw new BadRequestException('Category not found ...');
    }
    const isCategoryDeleted = await this.category.deleteCategory({ id });
    return isCategoryDeleted ? true : false;
  }
}
