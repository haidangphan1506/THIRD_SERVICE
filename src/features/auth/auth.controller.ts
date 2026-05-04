import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { StatusCodes } from 'http-status-codes';
import {
  forgotPasswordSchema,
  loginSchema,
  refreshTokenBodySchema,
  type ForgotPasswordDto,
  type ForgotPasswordResponseDto,
  type LoginDto,
  type LoginResponseDto,
  type RefreshTokenBodyDto,
} from '@packages/entities/auth';
import { ApiResponse } from '@packages/decorators';
import { ZodValidationPipe } from '@packages/pipes';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Login successful' })
  async login(
    @Body(new ZodValidationPipe<LoginDto>(loginSchema))
    loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    return this.authService.loginService(loginDto);
  }

  @Post('refresh')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Token refreshed' })
  refresh(
    @Body(new ZodValidationPipe<RefreshTokenBodyDto>(refreshTokenBodySchema))
    body: RefreshTokenBodyDto,
  ): unknown {
    return this.authService.refreshTokens(body);
  }

  @Post('forgot-password')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Forgot password successful' })
  forgotPassword(
    @Body(new ZodValidationPipe<ForgotPasswordDto>(forgotPasswordSchema))
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    return this.authService.forgotPasswordService(forgotPasswordDto);
  } 

  @Post('logout')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Logout successful' })
  logout(): Record<string, never> {
    return this.authService.logout();
  }
}
