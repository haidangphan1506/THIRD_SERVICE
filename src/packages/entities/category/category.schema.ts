import { z } from 'zod';

export const CategoryTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export const createCategorySchema = z.object({
  name: z.string({ message: 'Name must be a string' }).min(1, 'Name is required').max(100, 'Name too long'),
  type: CategoryTypeEnum,
  parent_id: z
    .string({ message: 'parent_id must be a string' })
    .uuid({ message: 'parent_id must be a valid UUID' })
    .optional()
    .nullable(),
  icon: z.string().max(50).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid hex color')
    .default('#FFFFFF')
    .optional(),
});

