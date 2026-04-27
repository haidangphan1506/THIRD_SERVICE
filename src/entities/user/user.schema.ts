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

export const createUserSchema = z.object({
  email: z.email(),
  fullName: z.string().trim().min(2).max(100),
  password: z.string().min(6).max(100),
});
