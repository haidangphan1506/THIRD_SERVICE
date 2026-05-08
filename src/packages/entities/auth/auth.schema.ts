import { z } from 'zod';

export const emailFieldSchema = z
  .string({ message: 'Email is required' })
  .email({ message: 'Invalid email address' });

export const registerSchema = z.object({
  email: emailFieldSchema,
  username: z.string({ message: 'Username is required' }).optional(),
  password: z
    .string({ message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must be less than 100 characters long' }),
  firstName: z
    .string({ message: 'First name is required' })
    .min(1, { message: 'First name is required' })
    .max(100, { message: 'First name must be less than 100 characters long' }),
  lastName: z
    .string({ message: 'Last name is required' })
    .min(1, { message: 'Last name is required' })
    .max(100, { message: 'Last name must be less than 100 characters long' }),
});

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: z
    .string({ message: 'Password is required' })
    .min(6, { message: 'Password must be at least 6 characters long' })
    .max(100, { message: 'Password must be less than 100 characters long' }),
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z
    .string({ message: 'Refresh token is required' })
    .min(1, { message: 'Refresh token is required' }),
});

export const forgotPasswordSchema = z.object({
  email: emailFieldSchema,
});

const resetPasswordBodySchema = z
  .object({
    jti: z
      .string({ message: 'Reset password token is required' })
      .uuid({ message: 'Invalid reset password token' }),
    password: z
      .string({ message: 'Password is required' })
      .min(6, { message: 'Password must be at least 6 characters long' })
      .max(100, { message: 'Password must be less than 100 characters long' })
      .superRefine((password, ctx) => {
        if (!/[a-z]/.test(password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must include at least one lowercase letter (a-z)',
            path: ['password'],
          });
        }
        if (!/[A-Z]/.test(password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must include at least one uppercase letter (A-Z)',
            path: ['password'],
          });
        }
        if (!/\d/.test(password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Password must include at least one digit (0-9)',
            path: ['password'],
          });
        }
        if (!/[^A-Za-z0-9]/.test(password)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'Password must include at least one special character (any symbol that is not a letter or digit)',
            path: ['password'],
          });
        }
      }),
    confirmPassword: z
      .string({ message: 'Confirm password is required' })
      .min(6, { message: 'Confirm password must be at least 6 characters long' })
      .max(100, { message: 'Confirm password must be less than 100 characters long' }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Confirm password must be the same as password',
        path: ['confirmPassword'],
      });
    }
  });

/** Accept either `password` or `newPassword` (same meaning). */
export const resetPasswordSchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    if (o.newPassword != null && o.password == null) {
      return { ...o, password: o.newPassword };
    }
  }
  return val;
}, resetPasswordBodySchema);
