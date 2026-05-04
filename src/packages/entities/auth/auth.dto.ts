import type { z } from 'zod';
import { forgotPasswordSchema, loginSchema, refreshTokenBodySchema } from './auth.schema';

export type LoginDto = z.infer<typeof loginSchema>;
export type RefreshTokenBodyDto = z.infer<typeof refreshTokenBodySchema>;
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export type LoginResponseDto = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
  };
};

export type ForgotPasswordResponseDto = {
  ok: true;
};
