import { z } from 'zod';
import {
  createSessionSchema,
  createSessionsSchema,
  getSessionsSchema,
  updateSessionSchema,
} from './session.schema';

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type CreateSessionsDto = z.infer<typeof createSessionsSchema>;
export type GetSessionsQueryDto = z.infer<typeof getSessionsSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
