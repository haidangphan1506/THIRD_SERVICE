import { z } from 'zod';

export const CategoryTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export const createCategorySchema = z.object({
  userId: z
    .string()
    .min(1, { message: 'UserId must be string ...' })
    .uuid({ message: 'UserId must be uuid ...' }),
  name: z
    .string({ message: 'Name must be a string' })
    .min(1, 'Name is required')
    .max(25, 'Name too long'),
  type: CategoryTypeEnum,
  parent_id: z
    .string({ message: 'parent_id must be a string' })
    .uuid({ message: 'parent_id must be a valid UUID' })
    .optional()
    .nullable(),
  icon: z.string().url({ message: 'Icon must be url ...' }).optional(),
  color: z
    .string()
    .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, 'Invalid hex color')
    .default('#FFFFFF')
    .optional(),
});

export const getCategoriesQuerySchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const o = val as Record<string, unknown>;
      if (o.pageSize != null && o.limit == null) {
        return { ...o, limit: o.pageSize };
      }
    }
    return val;
  },
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
  }),
);
