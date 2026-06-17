import { Test, TestingModule } from '@nestjs/testing';
import type { CreateCategoryDto, UpdateCategoryDto } from '@packages/entities/category';
import { CategoryController } from 'src/features/category/category.controller';
import { CategoryService } from 'src/features/category/category.service';

describe('Category Controller ...', () => {
  let controller: CategoryController;

  const categoryServiceMock = {
    createCategoryService: jest.fn(),
    getCategoriesService: jest.fn(),
    getCategoryService: jest.fn(),
    updateCategoryService: jest.fn(),
    deleteCategoryService: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const categoryModule: TestingModule = await Test.createTestingModule({
      controllers: [CategoryController],
      providers: [
        {
          provide: CategoryService,
          useValue: categoryServiceMock,
        },
      ],
    }).compile();

    controller = categoryModule.get(CategoryController);
  });

  test('0. should be controllers can defined ...', () => {
    expect(controller).toBeDefined();
  });

  describe('createCategory ...', () => {
    test('1. should be return new category when success ...', async () => {
      const dto = {
        userId: 'b6690d3a-b10f-4f26-a6de-c3d82dee1ca1',
        name: 'Foods',
        type: 'EXPENSE',
        parent_id: null,
      } as CreateCategoryDto;

      const newCategory = {
        id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
        name: 'Foods',
        type: 'EXPENSE',
        parentId: null,
      };
      categoryServiceMock.createCategoryService.mockResolvedValue(newCategory);

      const result = await controller.createCategory(dto);

      expect(result).toEqual(newCategory);
      expect(categoryServiceMock.createCategoryService).toHaveBeenCalledWith(dto);
    });

    test('1.2. should throw error when service throws', async () => {
      const dto = {
        userId: 'b6690d3a-b10f-4f26-a6de-c3d82dee1ca1',
        name: 'Foods',
        type: 'EXPENSE',
        parent_id: null,
      } as CreateCategoryDto;

      categoryServiceMock.createCategoryService.mockRejectedValue(
        new Error('Category already exists...'),
      );

      await expect(controller.createCategory(dto)).rejects.toThrow('Category already exists...');
    });
  });

  describe('getCategories ...', () => {
    test('1. should be return categories when success ...', async () => {
      const dto = {
        page: 1,
        limit: 10,
        search: '',
      };

      const categoryResponse = [
        {
          id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
          name: 'Foods',
          type: 'EXPENSE',
          parentId: null,
        },
      ];

      categoryServiceMock.getCategoriesService.mockResolvedValue(categoryResponse);
      const result = await controller.getCategories(dto);

      expect(result).toEqual(categoryResponse);
      expect(categoryServiceMock.getCategoriesService).toHaveBeenCalledTimes(1);
      expect(categoryServiceMock.getCategoriesService).toHaveBeenCalledWith(dto);
    });

    test('1.2. should throw error when service throws', async () => {
      const dto = {
        page: 1,
        limit: 10,
        search: '',
      };
      categoryServiceMock.getCategoriesService.mockRejectedValue(
        new Error('Username already exists ...'),
      );

      await expect(controller.getCategories(dto)).rejects.toThrow('Username already exists ...');
    });
  });

  describe('getCategory ...', () => {
    test('1. should be return a category when found ...', async () => {
      const category = {
        id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
        name: 'Foods',
        type: 'EXPENSE',
        parentId: null,
      };
      categoryServiceMock.getCategoryService.mockResolvedValue(category);

      const result = await controller.getCategory(category.id);

      expect(result).toEqual(category);
      expect(categoryServiceMock.getCategoryService).toHaveBeenCalledWith({
        field: 'id',
        value: category.id,
      });
    });

    test('1.2. should throw error when service throws', async () => {
      categoryServiceMock.getCategoryService.mockRejectedValue(new Error('Category not found.'));

      await expect(controller.getCategory('not-exist')).rejects.toThrow('Category not found.');
    });
  });

  describe('updateCategory ...', () => {
    test('1. should be return updated category when success ...', async () => {
      const id = 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf';
      const updateCategoryDto = { name: 'New name' } as UpdateCategoryDto;

      const updatedCategory = { id, name: 'New name' };
      categoryServiceMock.updateCategoryService.mockResolvedValue(updatedCategory);

      const result = await controller.updateCategory(id, updateCategoryDto);

      expect(result).toEqual(updatedCategory);
      expect(categoryServiceMock.updateCategoryService).toHaveBeenCalledWith({
        id,
        updateCategoryDto,
      });
    });

    test('1.2. should throw error when service throws', async () => {
      categoryServiceMock.updateCategoryService.mockRejectedValue(
        new Error('Category not-exist not found.'),
      );

      await expect(
        controller.updateCategory('not-exist', { name: 'New name' }),
      ).rejects.toThrow('Category not-exist not found.');
    });
  });

  describe('deleteCategory ...', () => {
    test('1. should be return true when category deleted successfully ...', async () => {
      const id = 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf';
      categoryServiceMock.deleteCategoryService.mockResolvedValue(true);

      const result = await controller.deleteCategory(id);

      expect(result).toBe(true);
      expect(categoryServiceMock.deleteCategoryService).toHaveBeenCalledWith({ id });
    });

    test('1.2. should throw error when service throws', async () => {
      categoryServiceMock.deleteCategoryService.mockRejectedValue(
        new Error('Category not-exist not found.'),
      );

      await expect(controller.deleteCategory('not-exist')).rejects.toThrow(
        'Category not-exist not found.',
      );
    });
  });
});
