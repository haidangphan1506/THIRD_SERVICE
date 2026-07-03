import { z } from 'zod';

const userDetailIncludeValues = ['wallets', 'transactions', 'categories'] as const;

/** Query `GET /users/detail-user` — ví dụ `?include=wallets,transactions&transactionLimit=30` */
export const getUserDetailQuerySchema = z.preprocess(
  (val) => {
    if (!val || typeof val !== 'object' || Array.isArray(val)) {
      return val;
    }
    const o = val as Record<string, unknown>;
    const rawInc = o.include;
    const parts = Array.isArray(rawInc)
      ? rawInc.map(String)
      : typeof rawInc === 'string'
        ? rawInc.split(',')
        : [];
    const allowedSet = new Set<string>(userDetailIncludeValues);
    const include = parts
      .map((s) => s.trim().toLowerCase())
      .filter((s): s is (typeof userDetailIncludeValues)[number] => allowedSet.has(s));
    return {
      ...o,
      include,
    };
  },
  z.object({
    include: z.array(z.enum(userDetailIncludeValues)).default([]),
    transactionLimit: z.coerce.number().int().min(1).max(200).default(50),
  }),
);

export const getUsersQuerySchema = z.preprocess(
  (val) => {
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const o = val as Record<string, unknown>;
      if (o.pageSize != null && o.limit == null) {
        return { ...o, limit: o.pageSize };
      }
    }
    return val;
  },
  z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
    search: z.string().trim().min(1).optional(),
    role: z.enum(['ADMIN', 'TUTOR', 'PARENT', 'STUDENT']).optional(),
    isActive: z
      .enum(['true', 'false'])
      .transform((value) => value === 'true')
      .optional(),
  }),
);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ message: 'Current password is required' }).min(1),
    newPassword: z
      .string({ message: 'New password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(14, { message: 'Password must be at most 14 characters' }),
  })
  .superRefine((data, ctx) => {
    const { newPassword } = data;
    if (newPassword.length < 8 || newPassword.length > 14) return;

    if (!/[a-z]/.test(newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one lowercase letter (a-z)',
        path: ['newPassword'],
      });
    }
    if (!/[A-Z]/.test(newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one uppercase letter (A-Z)',
        path: ['newPassword'],
      });
    }
    if (!/\d/.test(newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one digit (0-9)',
        path: ['newPassword'],
      });
    }
    if (!/[^A-Za-z0-9]/.test(newPassword)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Password must include at least one special character',
        path: ['newPassword'],
      });
    }
  });

export const dataFieldSchema = z.object({
  field: z.string({ message: 'Field must be string ...' }).nonempty(),
  value: z.string({ message: 'Value must be string ...' }).nonempty(),
});

export const updateUserGradesSchema = z.object({
  gradesId: z
    .array(z.string({ message: 'Grade ID must be a string' }).uuid({ message: 'Invalid grade ID' }))
    .min(1, { message: 'At least one grade is required' }),
});

export const updateGradeSchema = z.object({
  name: z
    .string({ message: 'Grade name is required' })
    .trim()
    .min(1, { message: 'Grade name must be at least 1 character' })
    .max(50, { message: 'Grade name must be at most 50 characters' }),
  level: z.coerce
    .number({ message: 'Level is required' })
    .int({ message: 'Level must be an integer' })
    .min(1, { message: 'Level must be at least 1' })
    .max(12, { message: 'Level must be at most 12' }),
});

export const createUserSchema = z
  .object({
    email: z
      .string({ message: 'Email is required' })
      .min(1, { message: 'Email is required' })
      .email({ message: 'Invalid email address' }),
    username: z
      .string()
      .trim()
      .min(1, { message: 'Username must be at least 1 character' })
      .max(100, { message: 'Username must be at most 100 characters' })
      .optional(),
    firstName: z
      .string({ message: 'First name is required' })
      .trim()
      .min(2, { message: 'First name must be at least 2 characters' })
      .max(100, { message: 'First name must be at most 100 characters' }),
    lastName: z
      .string({ message: 'Last name is required' })
      .trim()
      .min(2, { message: 'First name must be at least 2 characters' })
      .max(100, { message: 'First name must be at most 100 characters' }),
    password: z
      .string({ message: 'Password is required' })
      .min(8, { message: 'Password must be at least 8 characters' })
      .max(14, { message: 'Password must be at most 14 characters' }),
    role: z.enum(['ADMIN', 'TUTOR', 'PARENT', 'STUDENT']).optional().default('STUDENT'),
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
