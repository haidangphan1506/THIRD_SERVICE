import { z } from 'zod';

export const curriculumStatusEnum = z.enum(['COMPLETED', 'UPCOMING']);
export const assignmentStatusEnum = z.enum(['COMPLETED', 'OVERDUE', 'IN_PROGRESS']);

export const createCurriculumSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  lesson: z.coerce.number().int().min(1, 'Lesson number is required'),
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required')
    .max(255, 'Name too long'),
  lecture: z.string().optional(),
  assignment: z.string().optional(),
  status: curriculumStatusEnum.default('UPCOMING').optional(),
  note: z.string().optional(),
  order: z.coerce.number().int().default(0).optional(),
});

export const updateCurriculumSchema = createCurriculumSchema.partial().omit({ classId: true });

export const getCurriculumsQuerySchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  status: curriculumStatusEnum.optional(),
});

export const createAssignmentSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  curriculumId: z.string().uuid().optional().nullable(),
  lesson: z.coerce.number().int().min(1, 'Lesson number is required'),
  name: z
    .string({ message: 'Name is required' })
    .min(1, 'Name is required')
    .max(255, 'Name too long'),
  description: z.string().optional(),
  requirement: z.string().optional(),
  status: assignmentStatusEnum.default('IN_PROGRESS').optional(),
  score: z.coerce.number().min(0).max(10).optional().nullable(),
  comment: z.string().optional(),
  isHidden: z.boolean().default(false).optional(),
});

export const updateAssignmentSchema = createAssignmentSchema
  .partial()
  .omit({ classId: true, lesson: true });

export const getAssignmentsQuerySchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  lesson: z.coerce.number().int().optional(),
  status: assignmentStatusEnum.optional(),
});
