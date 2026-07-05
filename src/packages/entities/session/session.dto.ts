import { z } from 'zod';
import {
  createScheduleSchema,
  createSessionSchema,
  getSessionsQuerySchema,
  updateSessionSchema,
} from './session.schema';

export type CreateScheduleDto = z.infer<typeof createScheduleSchema>;
export type UpdateScheduleDto = Partial<z.infer<typeof createScheduleSchema>>;
export type CreateSessionDto = z.infer<typeof createSessionSchema>;
export type UpdateSessionDto = z.infer<typeof updateSessionSchema>;
export type GetSessionsQueryDto = z.infer<typeof getSessionsQuerySchema>;

export type SessionDetailDto = {
  id: string;
  classId: string;
  lessonId: string | null;
  tutorId: string | null;
  title: string | null;
  description: string | null;
  sessionNumber: number;
  theoryUrls: { name: string; url: string; key: string }[];
  exerciseUrls: { name: string; url: string; key: string }[];
  startAt: string;
  endAt: string;
  location: string | null;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED' | 'POSTPONED';
  note: string | null;
  actualStartAt: string | null;
  actualEndAt: string | null;
  createdAt: string;
  updatedAt: string;
};
