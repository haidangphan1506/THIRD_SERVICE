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

export const createScheduleSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  dayOfWeek: dayOfWeekEnum,
  startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  format: sessionFormatEnum.default('ONLINE'),
  location: z.string().optional(),
});

export const createSchedulesSchema = z.object({
  classId: z.string().uuid('Invalid class ID'),
  schedules: z
    .array(
      z.object({
        dayOfWeek: dayOfWeekEnum,
        startTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
        endTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
        format: sessionFormatEnum.default('ONLINE'),
        location: z.string().optional(),
      }),
    )
    .min(1, 'At least 1 schedule is required')
    .max(7, 'At most 7 schedules allowed'),
});

export const updateScheduleSchema = createScheduleSchema.partial().omit({ classId: true });
