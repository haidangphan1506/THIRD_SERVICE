import { drizzle } from 'drizzle-orm/postgres-js';
import { CategoryRepository } from 'src/features/category/category.repository';

describe('CategoryRepository', () => {
  let db: {
    insert: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
  let repository: CategoryRepository;

  beforeEach(() => {
    jest.clearAllMocks();

    db = {
      insert: jest.fn(),
      select: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    repository = new CategoryRepository(db as unknown as ReturnType<typeof drizzle>);
  });

  describe('createCategory', () => {
    it('should insert a category and return it', async () => {
      const category = { id: '1', name: 'Food', type: 'EXPENSE' };
      db.insert.mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([category]),
        }),
      });

      const result = await repository.createCategory({
        userId: 'user-1',
        name: 'Food',
        type: 'EXPENSE',
      });

      expect(db.insert).toHaveBeenCalled();
      expect(result).toEqual(category);
    });
  });

  describe('getCategories', () => {
    it('should return paginated categories', async () => {
      const categoryRows = [{ id: '1', name: 'Food', type: 'EXPENSE' }];

      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ total: 1 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue(categoryRows),
              }),
            }),
          }),
        });

      const result = await repository.getCategories({ page: 1, limit: 10 });

      expect(db.select).toHaveBeenCalledTimes(2);
      expect(result).toEqual({
        data: categoryRows,
        pagination: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    it('should default to page 1 and limit 10 when not provided', async () => {
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([{ total: 0 }]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });

      const result = await repository.getCategories({});

      expect(result.pagination).toEqual({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      });
    });

    it('should default total to 0 when count query returns no row', async () => {
      db.select
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([]),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                offset: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        });

      const result = await repository.getCategories({ page: 1, limit: 10 });

      expect(result.pagination.total).toBe(0);
    });
  });

  describe('getCategory', () => {
    it('should return matching categories by field/value', async () => {
      const category = { id: '1', name: 'Food' };
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([category]),
        }),
      });

      const result = await repository.getCategory({ field: 'id', value: '1' });

      expect(db.select).toHaveBeenCalled();
      expect(result).toEqual([category]);
    });

    it('should return empty array when no category matches', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.getCategory({ field: 'id', value: 'not-exist' });

      expect(result).toEqual([]);
    });

    it('should return null when query result is falsy', async () => {
      db.select.mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(null),
        }),
      });

      const result = await repository.getCategory({ field: 'id', value: '1' });

      expect(result).toBeNull();
    });
  });

  describe('updateCategory', () => {
    it('should update a category and return it', async () => {
      const category = [{ id: '1', name: 'Updated' }];
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(category),
          }),
        }),
      });

      const result = await repository.updateCategory({
        id: '1',
        updateCategoryDto: { name: 'Updated' },
      });

      expect(db.update).toHaveBeenCalled();
      expect(result).toEqual(category);
    });

    it('should return null when returning() yields a falsy result', async () => {
      db.update.mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue(null),
          }),
        }),
      });

      const result = await repository.updateCategory({
        id: '1',
        updateCategoryDto: { name: 'Updated' },
      });

      expect(result).toBeNull();
    });
  });

  describe('deleteCategory', () => {
    it('should return true when category is deleted', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: '1' }]),
        }),
      });

      const result = await repository.deleteCategory({ id: '1' });

      expect(result).toBe(true);
    });

    it('should return false when no category is deleted', async () => {
      db.delete.mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([]),
        }),
      });

      const result = await repository.deleteCategory({ id: '1' });

      expect(result).toBe(false);
    });
  });
});
