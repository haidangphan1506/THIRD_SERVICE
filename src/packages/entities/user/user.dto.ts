import type { z } from 'zod';
import { createUserSchema, dataFieldSchema, getUsersQuerySchema } from './user.schema';

// ?params: export type from schemas
export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
export type UserDataFieldDto = z.infer<typeof dataFieldSchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;

// ?params: init type not init from schemas
export type User = {
  id: string;
  userCode: string | null;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  avatar: string | null;
  phone: string | null;
  isActive: boolean | null;
  role: 'ADMIN' | 'TUTOR' | 'PARENT' | 'STUDENT' | null;
  createdAt: Date;
  updatedAt: Date;
};

export type UserListResponseDto = {
  message: string;
  query: GetUsersQueryDto;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: User[];
};

export type CreateUserResponseDto = {
  message: string;
  data: {
    email: string;
    fullName: string;
    password: string;
  };
};
