import { Body, Controller, Delete, Get, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Categories')
@ApiBearerAuth('access-token')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create category', description: 'Create a new transaction category' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['userId', 'name', 'type'],
      properties: {
        userId: {
          type: 'string',
          format: 'uuid',
          description: 'Owner user ID',
          example: '550e8400-e29b-41d4-a716-446655440000',
        },
        name: { type: 'string', minLength: 1, maxLength: 25, example: 'Groceries' },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'], example: 'EXPENSE' },
        parent_id: {
          type: 'string',
          format: 'uuid',
          nullable: true,
          description: 'Parent category ID',
        },
        icon: { type: 'string', format: 'url', description: 'Category icon URL' },
        color: {
          type: 'string',
          pattern: '^#([0-9A-Fa-f]{3}){1,2}$',
          default: '#FFFFFF',
          example: '#FF5733',
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Category created' })
  createCategory(
    @Body(new ZodValidationPipe<CreateCategoryDto>(createCategorySchema))
    createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoryService.createCategoryService(createCategoryDto);
  }

  @Get()
  @ApiOperation({ summary: 'List categories', description: 'Get a paginated list of categories' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'pageSize', required: false, type: Number, description: 'Alias for limit' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name' })
  @SwaggerResponse({ status: 200, description: 'Categories fetched' })
  getCategories(
    @Query(new ZodValidationPipe<GetCategoriesQueryDto>(getCategoriesQuerySchema))
    query: GetCategoriesQueryDto,
  ) {
    return this.categoryService.getCategoriesService(query);
  }

  @Get('/:id')
  @ApiOperation({ summary: 'Get category by ID', description: 'Get a single category by its ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Category ID' })
  @SwaggerResponse({ status: 200, description: 'Category fetched' })
  @SwaggerResponse({ status: 404, description: 'Category not found' })
  async getCategory(@Param('id') id: string) {
    return this.categoryService.getCategoryService({ field: 'id', value: id });
  }

  @Put('/:id')
  @ApiOperation({ summary: 'Update category', description: 'Update a category by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Category ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 25 },
        type: { type: 'string', enum: ['INCOME', 'EXPENSE'] },
        parent_id: { type: 'string', format: 'uuid', nullable: true },
        icon: { type: 'string', format: 'url' },
        color: { type: 'string', pattern: '^#([0-9A-Fa-f]{3}){1,2}$' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Category updated' })
  @SwaggerResponse({ status: 404, description: 'Category not found' })
  async updateCategory(
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateCategoryDto>(updateCategorySchema))
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.updateCategoryService({ id, updateCategoryDto });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category', description: 'Delete a category by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Category ID' })
  @SwaggerResponse({ status: 200, description: 'Category deleted' })
  @SwaggerResponse({ status: 404, description: 'Category not found' })
  async deleteCategory(@Param('id') id: string) {
    return this.categoryService.deleteCategoryService({ id });
  }
}
