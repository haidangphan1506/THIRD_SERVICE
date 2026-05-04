import { z } from 'zod';

export const emailFieldSchema = z.string({ message: 'Email is required' }).email({ message: 'Invalid email address' });

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: z
    .string({ message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must be less than 100 characters long' }),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z.string({ message: 'Refresh token is required' }).min(1, { message: 'Refresh token is required' }),
});


export const forgotPasswordSchema = z.object({
  email: emailFieldSchema,
});