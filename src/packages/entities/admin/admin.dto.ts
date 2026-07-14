import { z } from 'zod';
import {
  createManagedUserSchema,
  updateManagedUserSchema,
  listManagedUsersQuerySchema,
} from './admin.schema';

export type CreateManagedUserDto = z.infer<typeof createManagedUserSchema>;
export type UpdateManagedUserDto = z.infer<typeof updateManagedUserSchema>;
export type ListManagedUsersQueryDto = z.infer<typeof listManagedUsersQuerySchema>;
