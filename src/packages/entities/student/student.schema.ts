import { z } from 'zod';

export const createStudentSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  password: z
    .string({ message: 'Password must be string ...' })
    .min(8, 'Password must be at least 8 characters ...')
    .max(14, 'Password must be at most 14 characters ...'),
  studentName: z
    .string({ message: 'Student name must be required ...' })
    .min(1, { message: 'Student name must be 1 character ...' })
    .max(255, { message: 'Student name must not over 255 character ...' }),
  parentName: z
    .string({ message: 'Parent name must be required ...' })
    .min(1, { message: 'Parent name must be 1 character ...' })
    .max(255, { message: 'Parent name must not over 255 character ...' })
    .optional(),
  userCode: z.string().min(1, 'Code is required').max(50, 'Code too long').optional(),
  studentPhone: z.string().max(20).optional(),
  parentPhone: z.string().max(20).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const updateStudentSchema = z.object({
  firstName: z.string().min(1).max(255).optional(),
  lastName: z.string().min(1).max(255).optional(),
  phone: z.string().max(20).optional(),
  avatar: z.string().url().optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export const getStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  classId: z.string().uuid().optional(),
});
