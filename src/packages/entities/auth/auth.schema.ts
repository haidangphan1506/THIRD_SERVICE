import { z } from 'zod';

export const AUTH_MESSAGES = {
  // email
  EMAIL_REQUIRED: 'Email is required',
  EMAIL_INVALID: 'Invalid email address',
  // username
  USERNAME_REQUIRED: 'Username is required',
  // password
  PASSWORD_REQUIRED: 'Password is required',
  PASSWORD_MIN: 'Password must be at least 6 characters long',
  PASSWORD_MAX: 'Password must be less than 25 characters long',
  PASSWORD_LOWERCASE: 'Password must include at least one lowercase letter (a-z)',
  PASSWORD_UPPERCASE: 'Password must include at least one uppercase letter (A-Z)',
  PASSWORD_DIGIT: 'Password must include at least one digit (0-9)',
  PASSWORD_SPECIAL:
    'Password must include at least one special character (any symbol that is not a letter or digit)',
  // firstName
  FIRST_NAME_REQUIRED: 'First name is required',
  FIRST_NAME_MAX: 'First name must be less than 25 characters long',
  // lastName
  LAST_NAME_REQUIRED: 'Last name is required',
  LAST_NAME_MAX: 'Last name must be less than 25 characters long',
  // refreshToken
  REFRESH_TOKEN_REQUIRED: 'Refresh token is required',
  // resetPassword
  RESET_TOKEN_REQUIRED: 'Reset password token is required',
  RESET_TOKEN_INVALID: 'Invalid reset password token',
  CONFIRM_PASSWORD_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MIN: 'Confirm password must be at least 6 characters long',
  CONFIRM_PASSWORD_MAX: 'Confirm password must be less than 25 characters long',
  CONFIRM_PASSWORD_MISMATCH: 'Confirm password must be the same as password',
} as const;

export const emailFieldSchema = z
  .string({ message: AUTH_MESSAGES.EMAIL_REQUIRED })
  .email({ message: AUTH_MESSAGES.EMAIL_INVALID });

export const passwordFieldSchema = z
  .string({ message: AUTH_MESSAGES.PASSWORD_REQUIRED })
  .min(6, { message: AUTH_MESSAGES.PASSWORD_MIN })
  .max(25, { message: AUTH_MESSAGES.PASSWORD_MAX })
  .superRefine((password, ctx) => {
    if (!/[a-z]/.test(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: AUTH_MESSAGES.PASSWORD_LOWERCASE });
    }
    if (!/[A-Z]/.test(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: AUTH_MESSAGES.PASSWORD_UPPERCASE });
    }
    if (!/\d/.test(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: AUTH_MESSAGES.PASSWORD_DIGIT });
    }
    if (!/[^A-Za-z0-9]/.test(password)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: AUTH_MESSAGES.PASSWORD_SPECIAL });
    }
  });

export const registerSchema = z.object({
  email: emailFieldSchema,
  username: z.string({ message: AUTH_MESSAGES.USERNAME_REQUIRED }).optional(),
  password: passwordFieldSchema,
  firstName: z
    .string({ message: AUTH_MESSAGES.FIRST_NAME_REQUIRED })
    .min(1, { message: AUTH_MESSAGES.FIRST_NAME_REQUIRED })
    .max(25, { message: AUTH_MESSAGES.FIRST_NAME_MAX }),
  lastName: z
    .string({ message: AUTH_MESSAGES.LAST_NAME_REQUIRED })
    .min(1, { message: AUTH_MESSAGES.LAST_NAME_REQUIRED })
    .max(25, { message: AUTH_MESSAGES.LAST_NAME_MAX }),
});

export const loginSchema = z.object({
  email: emailFieldSchema,
  password: passwordFieldSchema,
});

export const refreshTokenBodySchema = z.object({
  refreshToken: z
    .string({ message: AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED })
    .min(1, { message: AUTH_MESSAGES.REFRESH_TOKEN_REQUIRED }),
});

export const forgotPasswordSchema = z.object({
  email: emailFieldSchema,
});

const resetPasswordBodySchema = z
  .object({
    jti: z
      .string({ message: AUTH_MESSAGES.RESET_TOKEN_REQUIRED })
      .uuid({ message: AUTH_MESSAGES.RESET_TOKEN_INVALID }),
    password: passwordFieldSchema,
    confirmPassword: z
      .string({ message: AUTH_MESSAGES.CONFIRM_PASSWORD_REQUIRED })
      .min(6, { message: AUTH_MESSAGES.CONFIRM_PASSWORD_MIN })
      .max(25, { message: AUTH_MESSAGES.CONFIRM_PASSWORD_MAX }),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: AUTH_MESSAGES.CONFIRM_PASSWORD_MISMATCH,
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
