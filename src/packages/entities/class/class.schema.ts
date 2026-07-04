import { z } from 'zod';

export const classStatusEnum = z.enum(['OPEN', 'CLOSED', 'UPCOMING']);
export const sessionFormatEnum = z.enum(['ONLINE', 'OFFLINE']);

export const createClassSchema = z.object({
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required')
    .max(255, 'Name too long'),
  code: z.string().min(1).max(50).optional(),
  subject: z
    .string({ message: 'Subject is required' })
    .min(1, 'Subject is required')
    .max(255, 'Subject too long'),
  tuition: z.coerce.number().min(0).default(0).optional(),
  description: z.string().optional(),
  status: classStatusEnum.default('OPEN').optional(),
  format: sessionFormatEnum.default('ONLINE').optional(),
  location: z.string().optional(),
  curriculumId: z.string().uuid('Invalid curriculum ID').optional().nullable(),
  tutorId: z.string({ message: 'Tutor ID is required' }).uuid('Invalid tutor ID'),
  studentIds: z.array(z.string().uuid('Invalid student ID')).optional(),
});

export const updateClassSchema = createClassSchema.partial().omit({ tutorId: true });

export const getClassesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  status: classStatusEnum.optional(),
  subject: z.string().optional(),
});
