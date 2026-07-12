import { z } from 'zod';

export const createStudentSchema = z.object({
  email: z.string().email('Invalid email').optional(),
  studentName: z
    .string({ message: 'Student name must be required ...' })
    .min(1, { message: 'Student name must be 1 character ...' })
    .max(255, { message: 'Student name must not over 255 character ...' }),
  userCode: z.string().min(1, 'Code is required').max(50, 'Code too long').optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  studentPhone: z.string().max(20).optional(),
  school: z.string().max(255).optional(),
  parentName: z
    .string({ message: 'Parent name must be required ...' })
    .min(1, { message: 'Parent name must be 1 character ...' })
    .max(255, { message: 'Parent name must not over 255 character ...' })
    .optional(),
  parentRelationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).optional(),
  parentPhone: z.string().max(20).optional(),
  parentEmail: z.string().email('Invalid parent email').optional(),
});

export const updateStudentSchema = z.object({
  studentName: z.string().min(1).max(255).optional(),
  studentPhone: z.string().max(20).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  birthday: z.coerce.date().optional(),
  school: z.string().max(255).optional(),
  className: z.string().max(255).optional(),
  parentName: z.string().min(1).max(255).optional(),
  parentPhone: z.string().max(20).optional(),
  parentEmail: z.string().email('Invalid parent email').optional(),
  parentRelationship: z.enum(['FATHER', 'MOTHER', 'GUARDIAN']).optional(),
  avatar: z.string().url().optional().nullable(),
});

export const getStudentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  classId: z.string().uuid().optional(),
});
