import { createExerciseSchema, getExerciseQuerySchema } from './exercise.schema';
import z from 'zod';

export type CreateExerciseDto = z.infer<typeof createExerciseSchema>;
export type getExerciseDto = z.infer<typeof getExerciseQuerySchema>;

export type ExerciseDetailDto = {
  id: string;
  lessonId: string | null;
  sessionId: string | null;
  tutorId: string;
  studentId: string;
  issueUrls: { name: string; url: string; key: string }[];
  exerciseUrls: { name: string; url: string; key: string }[];
  createdAt: string;
  updatedAt: string;
};
