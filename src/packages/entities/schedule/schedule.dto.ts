import { z } from 'zod';
import { createScheduleSchema, createSchedulesSchema } from './schedule.schema';

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type CreateSchedulesDto = z.infer<typeof createSchedulesSchema>;
export type UpdateScheduleDto = Partial<z.infer<typeof createScheduleSchema>>;
