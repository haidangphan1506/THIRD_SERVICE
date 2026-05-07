import z from "zod";
import { createCategorySchema } from "./category.schema";

export type CreateCategoryDto = z.infer<typeof createCategorySchema>;

export const updateCategorySchema = createCategorySchema.partial();

export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;