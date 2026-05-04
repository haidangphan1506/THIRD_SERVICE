import { z } from 'zod';

export const getUsersQuerySchema = z.preprocess((val) => {
  if (val && typeof val === 'object' && !Array.isArray(val)) {
    const o = val as Record<string, unknown>;
    if (o.pageSize != null && o.limit == null) {
      return { ...o, limit: o.pageSize };
    }
  }
  return val;
}, z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().min(1).optional(),
  role: z.enum(['USER', 'ADMIN', 'MODERATOR']).optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
}));

export const dataFieldSchema = z.object({
  field: z.string({ message: 'Field must be string ...' }).nonempty(),
  value: z.string({ message: 'Value must be string ...' }).nonempty(),
});

export const createUserSchema = z
  .object({
    email: z.string({ message: 'Email is required' }).min(1, { message: 'Email is required' }).email({ message: 'Invalid email address' }),
    firstName: z
      .string({ message: 'First name is required' })
      .trim()
      .min(2, { message: 'First name must be at least 2 characters' })
      .max(100, { message: 'First name must be at most 100 characters' }),
    lastName: z
      .string({ message: 'Last name is required' })
      .trim()
      .min(2, { message: 'Last name must be at least 2 characters' })
      .max(100, { message: 'Last name must be at most 100 characters' }),
    password: z
      .string({ message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(14, { message: 'Password must be at most 14 characters' }),
  })
  .superRefine((data, ctx) => {
    const { password } = data;
    // Avoid stacking complexity issues when length rules already failed (Zod still runs this refine).
    if (password.length < 8 || password.length > 100) {
      return;
    }

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
  });
