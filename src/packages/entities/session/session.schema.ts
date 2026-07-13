import { z } from 'zod';

export const classSessionStatusEnum = z.enum([
  'SCHEDULED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED',
]);

const sessionResourceSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  url: z.string().url('Invalid URL'),
  key: z.string().min(1, 'Key is required'),
});

export const createSessionSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  lessonId: z.string().uuid('Invalid lesson ID').optional().nullable(),
  tutorId: z.string().uuid('Invalid tutor ID').optional().nullable(),
  title: z.string().max(255, 'Title too long').optional(),
  description: z.string().optional(),
  sessionNumber: z.coerce.number().int().min(1, 'Session number must be >= 1'),
  theoryUrls: z.array(sessionResourceSchema).default([]),
  exerciseUrls: z.array(sessionResourceSchema).default([]),
  startAt: z.coerce.date({ message: 'Start time must be a valid date' }),
  endAt: z.coerce.date({ message: 'End time must be a valid date' }),
  location: z.string().optional(),
  status: classSessionStatusEnum.default('SCHEDULED').optional(),
  note: z.string().optional(),
  actualStartAt: z.coerce.date().optional().nullable(),
  actualEndAt: z.coerce.date().optional().nullable(),
});

export const createSessionsSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  sessions: z
    .array(createSessionSchema.omit({ classId: true }))
    .min(1, 'At least 1 session is required')
    .max(50, 'At most 50 sessions allowed'),
});

export const getSessionsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  status: classSessionStatusEnum.optional(),
  classId: z.string().uuid('Invalid class ID').optional(),
});

/**
 * Update schema defined explicitly (not `.partial()` on the create schema): with
 * `.partial()`, Zod would still fill absent fields with their defaults
 * (theoryUrls/exerciseUrls -> [], status -> 'SCHEDULED'), which the repository then
 * writes, silently wiping existing materials/status on a partial update.
 */
export const updateSessionSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID').optional().nullable(),
  tutorId: z.string().uuid('Invalid tutor ID').optional().nullable(),
  title: z.string().max(255, 'Title too long').optional(),
  description: z.string().optional(),
  sessionNumber: z.coerce.number().int().min(1, 'Session number must be >= 1').optional(),
  theoryUrls: z.array(sessionResourceSchema).optional(),
  exerciseUrls: z.array(sessionResourceSchema).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  location: z.string().optional(),
  status: classSessionStatusEnum.optional(),
  note: z.string().optional(),
  actualStartAt: z.coerce.date().optional().nullable(),
  actualEndAt: z.coerce.date().optional().nullable(),
});
