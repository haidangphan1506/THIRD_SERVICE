import { z } from 'zod';

export const dayOfWeekEnum = z.enum([
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]);
export const sessionFormatEnum = z.enum(['ONLINE', 'OFFLINE']);
export const sessionStatusEnum = z.enum([
  'SCHEDULED',
  'ONGOING',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED',
]);

export const createScheduleSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  format: sessionFormatEnum.default('ONLINE'),
  location: z.string().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial().omit({ classId: true });

const fileUrlSchema = z.object({
  name: z.string(),
  url: z.string(),
  key: z.string(),
});

export const createSessionSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  lessonId: z.string().uuid('Invalid lesson ID').optional().nullable(),
  tutorId: z.string().uuid('Invalid tutor ID').optional().nullable(),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  sessionNumber: z.coerce.number().int().min(1, 'Session number must be at least 1'),
  theoryUrls: z.array(fileUrlSchema).optional().default([]),
  exerciseUrls: z.array(fileUrlSchema).optional().default([]),
  startAt: z.coerce.date({ message: 'Start time is required' }),
  endAt: z.coerce.date({ message: 'End time is required' }),
  location: z.string().optional(),
  status: sessionStatusEnum.default('SCHEDULED').optional(),
  note: z.string().optional(),
  actualStartAt: z.coerce.date().optional().nullable(),
  actualEndAt: z.coerce.date().optional().nullable(),
});

/**
 * Update schema. Defined explicitly WITHOUT defaults: with `.partial()` on the
 * create schema, Zod would fill absent fields with their defaults (theoryUrls/
 * exerciseUrls → [], status → 'SCHEDULED'), which the repository then writes —
 * silently wiping existing materials/status on a partial update.
 */
export const updateSessionSchema = z.object({
  lessonId: z.string().uuid('Invalid lesson ID').optional().nullable(),
  tutorId: z.string().uuid('Invalid tutor ID').optional().nullable(),
  title: z.string().max(255).optional(),
  description: z.string().optional(),
  sessionNumber: z.coerce.number().int().min(1).optional(),
  theoryUrls: z.array(fileUrlSchema).optional(),
  exerciseUrls: z.array(fileUrlSchema).optional(),
  startAt: z.coerce.date().optional(),
  endAt: z.coerce.date().optional(),
  location: z.string().optional(),
  status: sessionStatusEnum.optional(),
  note: z.string().optional(),
  actualStartAt: z.coerce.date().optional().nullable(),
  actualEndAt: z.coerce.date().optional().nullable(),
});

export const getSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  classId: z.string().uuid().optional(),
  status: sessionStatusEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
