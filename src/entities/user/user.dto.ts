import type { z } from 'zod';
import { createUserSchema, getUsersQuerySchema } from './user.schema';

export type GetUsersQueryDto = z.infer<typeof getUsersQuerySchema>;
export type CreateUserDto = z.infer<typeof createUserSchema>;

export type UserListResponseDto = {
  message: string;
  query: GetUsersQueryDto;
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  data: unknown[];
};

export type CreateUserResponseDto = {
  message: string;
  data: {
    email: string;
    fullName: string;
    password: string;
  };
};
