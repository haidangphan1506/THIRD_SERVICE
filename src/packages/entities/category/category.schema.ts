import { z } from 'zod';

export const CategoryTypeEnum = z.enum(['INCOME', 'EXPENSE']);

export const createCategorySchema = z.object({
    id: z.string({ message: "Id must be a string" }).uuid({ message: "Id must be a valid UUID" }),

    name: z
      .string({ message: "Name must be a string" })
      .min(1, "Name is required")
      .max(100, "Name too long"),

    type: CategoryTypeEnum,
  
    parent_id: z
      .string({ message: "parent_id must be a string" })
      .uuid({ message: "parent_id must be a valid UUID" })
      .optional()
      .nullable(),
  
    icon: z
      .string()
      .max(50)
      .optional(),
  
    color: z
      .string()
      .regex(/^#([0-9A-Fa-f]{3}){1,2}$/, "Invalid hex color")
      .default("#FFFFFF")
      .optional()
  }).refine(
    (data) => data.parent_id === undefined || (data.parent_id !== undefined && data.id !== undefined && data.parent_id !== data.id),
    {
      message: "Category cannot be its own parent",
      path: ["parent_id"]
    }
  )
  
  ;

