import { z } from 'zod';
import {
  createCurriculumSchema,
  createLessonSchema,
  createAssignmentSchema,
  getCurriculumsQuerySchema,
  getLessonsQuerySchema,
  getAssignmentsQuerySchema,
  removeLessonFileSchema,
} from './curriculum.schema';

export type CreateCurriculumDto = z.infer<typeof createCurriculumSchema>;
export type UpdateCurriculumDto = Partial<z.infer<typeof createCurriculumSchema>>;
export type GetCurriculumsQueryDto = z.infer<typeof getCurriculumsQuerySchema>;

export type CreateLessonDto = z.infer<typeof createLessonSchema>;
export type UpdateLessonDto = Partial<z.infer<typeof createLessonSchema>>;
export type GetLessonsQueryDto = z.infer<typeof getLessonsQuerySchema>;

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = Partial<z.infer<typeof createAssignmentSchema>>;
export type GetAssignmentsQueryDto = z.infer<typeof getAssignmentsQuerySchema>;

export type RemoveLessonFileDto = z.infer<typeof removeLessonFileSchema>;
