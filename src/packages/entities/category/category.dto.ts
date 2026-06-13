import z from 'zod';
import { createCategorySchema, getCategoriesQuerySchema } from './category.schema';

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
export type GetCategoriesQueryDto = z.infer<typeof getCategoriesQuerySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryDto = Partial<z.infer<typeof createCategorySchema>>;
