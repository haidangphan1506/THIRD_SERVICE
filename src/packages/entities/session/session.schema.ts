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
export const sessionStatusEnum = z.enum(['UPCOMING', 'COMPLETED', 'CANCELLED']);

export const createScheduleSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  format: sessionFormatEnum.default('ONLINE'),
  location: z.string().optional(),
});

export const updateScheduleSchema = createScheduleSchema.partial().omit({ classId: true });

export const createSessionSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  title: z.string().max(255).optional(),
  date: z.coerce.date({ message: 'Date is required' }),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  format: sessionFormatEnum.default('ONLINE'),
  location: z.string().optional(),
  status: sessionStatusEnum.default('UPCOMING').optional(),
  note: z.string().optional(),
});

export const updateSessionSchema = createSessionSchema.partial().omit({ classId: true });

export const getSessionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  classId: z.string().uuid().optional(),
  status: sessionStatusEnum.optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

// Schema for generating multiple sessions at once
export const generateSessionsSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  format: sessionFormatEnum.default('ONLINE'),
  location: z.string().optional(),
  range: z.enum(['this_week', '4_weeks', '3_months', 'custom']),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});
