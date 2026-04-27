import { z } from 'zod';

export const getUsersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

export const dataFieldSchema = z.object({
  field: z.string({ message: 'Field must be string ...' }).nonempty(),
  value: z.string({ message: 'Value must be string ...' }).nonempty(),
});

export const createUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().trim().min(2).max(100),
  lastName: z.string().trim().min(2).max(100),
  password: z.string().min(6).max(100),
});
