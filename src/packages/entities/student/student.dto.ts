import { z } from 'zod';
import { createStudentSchema, updateStudentSchema, getStudentsQuerySchema } from './student.schema';

export type CreateStudentDto = z.infer<typeof createStudentSchema>;
export type UpdateStudentDto = z.infer<typeof updateStudentSchema>;
export type GetStudentsQueryDto = z.infer<typeof getStudentsQuerySchema>;

export type StudentResponseDto = {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  userCode: string | null;
  phone: string | null;
  avatar: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  school: string | null;
  parentId: string | null;
  parentName: string | null;
  parentPhone: string | null;
  parentEmail: string | null;
  parentRelationship: string | null;
  role: string | null;
  isActive: boolean | null;
  classCount: number;
  score: string | null;
  createdAt: string;
  updatedAt: string;
};
