import type { z } from 'zod';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenBodySchema,
  registerSchema,
  resetPasswordSchema,
} from './auth.schema';

export type RegisterDto = z.infer<typeof registerSchema>;
export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenBodyDto = z.infer<typeof refreshTokenBodySchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;
export type LoginResponseDto = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
};

export type RegisterResponseDto = {
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
};

export type ForgotPasswordResponseDto = {
  ok: true;
};

export type ResetPasswordResponseDto = {
  ok: true;
};
