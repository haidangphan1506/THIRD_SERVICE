import { createCategorySchema, getCategoriesQuerySchema } from '@packages/entities/category';

const validBase = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Food',
  type: 'EXPENSE' as const,
};

describe('createCategorySchema', () => {
  test('valid input should pass and apply default color', () => {
    const result = createCategorySchema.safeParse(validBase);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.color).toBe('#FFFFFF');
    }
  });

  describe('userId', () => {
    test.each([
      {
        label: 'missing (undefined)',
        input: { name: validBase.name, type: validBase.type },
        expectedMessage: 'Invalid input: expected string, received undefined',
      },
      {
        label: 'number',
        input: { ...validBase, userId: 12345 },
        expectedMessage: 'Invalid input: expected string, received number',
      },
      {
        label: 'null',
        input: { ...validBase, userId: null },
        expectedMessage: 'Invalid input: expected string, received null',
      },
      {
        label: 'empty string',
        input: { ...validBase, userId: '' },
        expectedMessage: 'UserId must be string ...',
      },
      {
        label: 'non-UUID string',
        input: { ...validBase, userId: 'not-a-uuid' },
        expectedMessage: 'UserId must be uuid ...',
      },
      {
        label: 'boolean',
        input: { ...validBase, userId: true },
        expectedMessage: 'Invalid input: expected string, received boolean',
      },
    ])('$label should fail — "$expectedMessage"', ({ input, expectedMessage }) => {
      const result = createCategorySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'userId');
        expect(issue?.message).toBe(expectedMessage);
      }
    });
  });

  describe('name', () => {
    test.each([
      {
        label: 'missing (undefined)',
        input: { type: validBase.type, userId: validBase.userId },
        expectedMessage: 'Name must be a string',
      },
      {
        label: 'number',
        input: { ...validBase, name: 1234 },
        expectedMessage: 'Name must be a string',
      },
      {
        label: 'null',
        input: { ...validBase, name: null },
        expectedMessage: 'Name must be a string',
      },
      {
        label: 'empty string',
        input: { ...validBase, name: '' },
        expectedMessage: 'Name is required',
      },
      {
        label: 'boolean',
        input: { ...validBase, name: true },
        expectedMessage: 'Name must be a string',
      },
      {
        label: 'exceeds max length',
        input: { ...validBase, name: 'a'.repeat(101) },
        expectedMessage: 'Name too long',
      },
    ])('$label should fail — "$expectedMessage"', ({ input, expectedMessage }) => {
      const result = createCategorySchema.safeParse(input);
      expect(result.success).toBe(false);
      if (!result.success) {
        const issue = result.error.issues.find((i) => i.path[0] === 'name');
        expect(issue?.message).toBe(expectedMessage);
      }
    });
  });
});

describe('getCategoriesQuerySchema', () => {
  describe('preprocess — pageSize → limit alias', () => {
    test('converts pageSize to limit when limit is absent', () => {
      const result = getCategoriesQuerySchema.safeParse({ pageSize: 20 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(20);
      }
    });

    test('keeps limit when both pageSize and limit are present', () => {
      const result = getCategoriesQuerySchema.safeParse({ pageSize: 20, limit: 5 });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.limit).toBe(5);
      }
    });

    test('null is passed through preprocess then rejected by z.object', () => {
      const result = getCategoriesQuerySchema.safeParse(null);
      expect(result.success).toBe(false);
    });

    test('array is passed through preprocess then rejected by z.object', () => {
      const result = getCategoriesQuerySchema.safeParse([]);
      expect(result.success).toBe(false);
    });

    test('uses defaults when called with empty object', () => {
      const result = getCategoriesQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });
  });
});
