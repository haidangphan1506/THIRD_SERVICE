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

// ?validate
export const AuthValidate = {
  EMAIL: {
    REQUIRED: "メールアドレスを入力してください",
    INVALID_FORMAT: "有効なメールアドレスを入力してください",
  },
  PASSWORD: {
    REQUIRED: "パスワードを入力してください",
    FULL_WIDTH_CHARACTER: "半角文字で入力してください",
    JP_CHARACTER: "パスワードに特殊文字は使用できません",
    ASCII_SPECIAL_CHAR_REGEX: "パスワードに特殊文字は使用できません",
    INVALID_LENGTH: "パスワードは6〜14文字で入力してください",
  },
} as const;

// ?regexes
const JP_SPECIAL_CHAR_REGEX = /[\u3040-\u309F\u30A0-\u30FF\uFF66-\uFF9D\u4E00-\u9FFF\u{1F300}-\u{1FAD6}\u{1F600}-\u{1F64F}]/u;
const FULL_WIDTH_CHAR_REGEX = /[\uFF01-\uFF60\uFFE0-\uFFE6]/;
const ASCII_SPECIAL_CHAR_REGEX = /^[a-zA-Z0-9]*$/;

// ?schema
export const loginSchema = z.object({
  email: z
    .string()
    .min(1, AuthValidate.EMAIL.REQUIRED)
    .email(AuthValidate.EMAIL.INVALID_FORMAT),
  password: z
    .string()
    .min(1, AuthValidate.PASSWORD.REQUIRED)
    .refine((value) => !FULL_WIDTH_CHAR_REGEX.test(value), {
      message: AuthValidate.PASSWORD.FULL_WIDTH_CHARACTER,
    })
    .refine((value) => !JP_SPECIAL_CHAR_REGEX.test(value), {
      message: AuthValidate.PASSWORD.JP_CHARACTER,
    })
    .refine((value) => ASCII_SPECIAL_CHAR_REGEX.test(value), {
      message: AuthValidate.PASSWORD.ASCII_SPECIAL_CHAR_REGEX,
    })
    .min(6, AuthValidate.PASSWORD.INVALID_LENGTH)
    .max(14, AuthValidate.PASSWORD.INVALID_LENGTH),
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
