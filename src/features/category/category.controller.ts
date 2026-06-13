import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  type CreateCategoryDto,
  createCategorySchema,
  type GetCategoriesQueryDto,
  getCategoriesQuerySchema,
  type UpdateCategoryDto,
  updateCategorySchema,
} from '@packages/entities/category';
import { ZodValidationPipe } from '@packages/pipes';
import { CategoryService } from './category.service';

@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  createCategory(
    @Body(new ZodValidationPipe<CreateCategoryDto>(createCategorySchema))
    createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategoryService(createCategoryDto);
  }

  @Get()
  getCategories(
    @Query(new ZodValidationPipe<GetCategoriesQueryDto>(getCategoriesQuerySchema))
    query: GetCategoriesQueryDto,
  ) {
    return this.categoryService.getCategoriesService(query);
  }

  @Get('/:id')
  async getCategory(@Param('id') id: string) {
    return this.categoryService.getCategoryService({ field: 'id', value: id });
  }

  @Put('/:id')
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateCategoryDto>(updateCategorySchema))
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategoryService({ id, updateCategoryDto });
  }

  @Delete(':id')
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategoryService({ id });
  }
}
