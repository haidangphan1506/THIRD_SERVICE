import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CreateCategoryDto, GetCategoriesQueryDto } from '@packages/entities/category';
import { CategoryRepository } from 'src/features/category/category.repository';
import { CategoryService } from 'src/features/category/category.service';

describe('Category Services ...', () => {
  let category: {
    getCategory: jest.Mock;
    getCategories: jest.Mock;
    createCategory: jest.Mock;
    updateCategory: jest.Mock;
    deleteCategory: jest.Mock;
  };
  let service: CategoryService;

  beforeEach(() => {
    jest.clearAllMocks();

    category = {
      getCategory: jest.fn(),
      getCategories: jest.fn(),
      createCategory: jest.fn(),
      updateCategory: jest.fn(),
      deleteCategory: jest.fn(),
    };

    service = new CategoryService(category as unknown as CategoryRepository);
  });

  describe('create category ...', () => {
    test('1. should throw bad request when category name already exists with same type and parent', async () => {
      category.getCategory.mockResolvedValue([
        {
          id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
          name: 'Foods',
          type: 'EXPENSE',
          parentId: null,
        },
      ]);

      const dto = {
        userId: 'b6690d3a-b10f-4f26-a6de-c3d82dee1ca1',
        name: 'Foods',
        type: 'EXPENSE',
        parent_id: null,
      } as CreateCategoryDto;

      await expect(service.createCategoryService(dto)).rejects.toThrow(BadRequestException);
      await expect(service.createCategoryService(dto)).rejects.toThrow(
        'Category already exists...',
      );

      expect(category.getCategory).toHaveBeenCalledWith({ field: 'name', value: 'Foods' });
      expect(category.createCategory).not.toHaveBeenCalled();
    });

    test('2. should be return new category when created successfully ...', async () => {
      category.getCategory.mockResolvedValue([]);
      const newCategory = {
        id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
        name: 'Foods',
        type: 'EXPENSE',
        parentId: null,
      };
      category.createCategory.mockResolvedValue(newCategory);
      const dto = {
        userId: 'b6690d3a-b10f-4f26-a6de-c3d82dee1ca1',
        name: 'Foods',
        type: 'EXPENSE',
        parent_id: null,
      } as CreateCategoryDto;
      const result = await service.createCategoryService(dto);

      expect(result).toEqual(newCategory);
      expect(category.getCategory).toHaveBeenCalledTimes(1);
      expect(category.createCategory).toHaveBeenCalledWith(dto);
      expect(category.createCategory).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoriesService ...', () => {
    test('1. should be return all categories matched ...', async () => {
      const query: GetCategoriesQueryDto = {
        page: 1,
        limit: 10,
        search: 'foods',
      };

      const categories = [
        {
          id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
          name: 'Foods',
          type: 'EXPENSE',
          parentId: null,
        },
      ];
      category.getCategories.mockResolvedValue(categories);

      const result = await service.getCategoriesService(query);

      expect(result).toEqual(categories);
      expect(category.getCategories).toHaveBeenCalledWith(query);
      expect(category.getCategories).toHaveBeenCalledTimes(1);
    });
  });

  describe('getCategoryService ...', () => {
    test('1. should be return only category/first category in database ...', async () => {
      category.getCategory.mockReturnValue([
        {
          id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
          name: 'Foods',
          type: 'EXPENSE',
          parentId: null,
        },
      ]);

      const dto = {
        field: 'name',
        value: 'foods',
      };

      const result = await service.getCategoryService(dto);

      expect(result).toEqual({
        id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
        name: 'Foods',
        type: 'EXPENSE',
        parentId: null,
      });

      expect(category.getCategory).toHaveBeenCalledTimes(1);
      expect(category.getCategory).toHaveBeenCalledWith(dto);
    });

    test('2. should return the result as-is when repository returns a non-array', async () => {
      const found = {
        id: 'fb6690d3-b10f-4f26-a6de-c3d82dee1caf',
        name: 'Foods',
      };
      category.getCategory.mockResolvedValue(found);

      const result = await service.getCategoryService({ field: 'id', value: found.id });

      expect(result).toEqual(found);
    });

    test('3. should return null when no category matches', async () => {
      category.getCategory.mockResolvedValue([]);

      const result = await service.getCategoryService({ field: 'name', value: 'unknown' });

      expect(result).toBeNull();
    });
  });

  describe('updateCategoryService ...', () => {
    test('1. should throw NotFoundException when category does not exist', async () => {
      category.getCategory.mockResolvedValue([]);

      await expect(
        service.updateCategoryService({ id: 'not-exist', updateCategoryDto: { name: 'New' } }),
      ).rejects.toThrow(NotFoundException);

      expect(category.getCategory).toHaveBeenCalledWith({ field: 'id', value: 'not-exist' });
      expect(category.updateCategory).not.toHaveBeenCalled();
    });

    test('2. should update and return the category when it exists', async () => {
      const existing = { id: '1', name: 'Old' };
      category.getCategory.mockResolvedValue([existing]);

      const updated = { id: '1', name: 'New' };
      category.updateCategory.mockResolvedValue([updated]);

      const result = await service.updateCategoryService({
        id: '1',
        updateCategoryDto: { name: 'New' },
      });

      expect(result).toEqual(updated);
      expect(category.updateCategory).toHaveBeenCalledWith({
        id: '1',
        updateCategoryDto: { name: 'New' },
      });
    });

    test('3. should handle non-array existing/updated results from repository', async () => {
      category.getCategory.mockResolvedValue({ id: '1', name: 'Old' });

      const updated = { id: '1', name: 'New' };
      category.updateCategory.mockResolvedValue(updated);

      const result = await service.updateCategoryService({
        id: '1',
        updateCategoryDto: { name: 'New' },
      });

      expect(result).toEqual(updated);
    });
  });

  describe('deleteCategoryService ...', () => {
    test('1. should throw NotFoundException when category does not exist', async () => {
      category.getCategory.mockResolvedValue([]);

      await expect(service.deleteCategoryService({ id: 'not-exist' })).rejects.toThrow(
        NotFoundException,
      );

      expect(category.getCategory).toHaveBeenCalledWith({ field: 'id', value: 'not-exist' });
      expect(category.deleteCategory).not.toHaveBeenCalled();
    });

    test('2. should delete the category when it exists', async () => {
      category.getCategory.mockResolvedValue([{ id: '1' }]);
      category.deleteCategory.mockResolvedValue(true);

      const result = await service.deleteCategoryService({ id: '1' });

      expect(result).toBe(true);
      expect(category.deleteCategory).toHaveBeenCalledWith({ id: '1' });
    });

    test('3. should handle non-array existing result from repository', async () => {
      category.getCategory.mockResolvedValue({ id: '1' });
      category.deleteCategory.mockResolvedValue(true);

      const result = await service.deleteCategoryService({ id: '1' });

      expect(result).toBe(true);
    });
  });
});
