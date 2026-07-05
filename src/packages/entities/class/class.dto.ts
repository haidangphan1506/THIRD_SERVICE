import { z } from 'zod';
import { createClassSchema, getClassesQuerySchema } from './class.schema';

export type CreateClassDto = z.infer<typeof createClassSchema>;
export type UpdateClassDto = Partial<z.infer<typeof createClassSchema>>;
export type GetClassesQueryDto = z.infer<typeof getClassesQuerySchema>;

export type ClassDetailDto = {
  id: string;
  name: string;
  code: string;
  subject: string;
  tuition: string;
  description: string | null;
  status: 'OPEN' | 'CLOSED' | 'UPCOMING';
  format: 'ONLINE' | 'OFFLINE';
  startTime: string;
  endTime: string;
  location: string | null;
  curriculumId: string | null;
  tutorId: string;
  studentCount: number;
  sessionCount: number;
  upcomingSessionCount: number;
  createdAt: string;
  updatedAt: string;
};
