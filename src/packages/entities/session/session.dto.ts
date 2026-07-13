import { z } from 'zod';
import { createSessionSchema, createSessionsSchema, updateSessionSchema } from './session.schema';

export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type CreateSessionsDto = z.infer<typeof createSessionsSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
