import { z } from 'zod';
import {
  createCurriculumSchema,
  createAssignmentSchema,
  getCurriculumsQuerySchema,
  getAssignmentsQuerySchema,
} from './curriculum.schema';

export type CreateCurriculumDto = z.infer<typeof createCurriculumSchema>;
export type UpdateCurriculumDto = Partial<z.infer<typeof createCurriculumSchema>>;
export type GetCurriculumsQueryDto = z.infer<typeof getCurriculumsQuerySchema>;

export type CreateAssignmentDto = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentDto = Partial<z.infer<typeof createAssignmentSchema>>;
export type GetAssignmentsQueryDto = z.infer<typeof getAssignmentsQuerySchema>;
