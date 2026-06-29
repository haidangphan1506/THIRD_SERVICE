import { z } from 'zod';

export const curriculumStatusEnum = z.enum(['COMPLETED', 'UPCOMING']);

export const createCurriculumSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title is required')
    .max(255, 'Title too long'),
  description: z.string().optional(),
});

export const updateCurriculumSchema = createCurriculumSchema.partial();

export const getCurriculumsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
});

const urlSchema = z.string().url('Invalid URL');

export const createLessonSchema = z.object({
  title: z
    .string({ message: 'Title is required' })
    .min(1, 'Title is required')
    .max(255, 'Title too long'),
  description: z.string().optional(),
  theoryUrls: z.array(urlSchema).optional(),
  exerciseUrls: z.array(urlSchema).optional(),
  order: z.coerce.number().int().default(0).optional(),
});

export const updateLessonSchema = createLessonSchema.partial();

export const getLessonsQuerySchema = z.object({
  curriculumId: z.string().uuid('Invalid curriculum ID'),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const assignmentStatusEnum = z.enum(['COMPLETED', 'OVERDUE', 'IN_PROGRESS']);

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
