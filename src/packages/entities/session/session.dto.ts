import { z } from 'zod';
import {
  createScheduleSchema,
  createSessionSchema,
  generateSessionsSchema,
  getSessionsQuerySchema,
} from './session.schema';

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDto = Partial<z.infer<typeof createScheduleSchema>>;
export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = Partial<z.infer<typeof createSessionSchema>>;
export type GetSessionsQueryDto = z.infer<typeof getSessionsQuerySchema>;
export type GenerateSessionsDto = z.infer<typeof generateSessionsSchema>;
