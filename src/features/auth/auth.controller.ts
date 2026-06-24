import { Body, Controller, Get, HttpCode, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { StatusCodes } from 'http-status-codes';
import type { Request, Response } from 'express';
import {
  forgotPasswordSchema,
  loginSchema,
  loginByUserCodeSchema,
  refreshTokenBodySchema,
  type RegisterDto,
  RegisterResponseDto,
  registerSchema,
  type ForgotPasswordDto,
  type ForgotPasswordResponseDto,
  type LoginByUserCodeDto,
  type LoginDto,
  type LoginResponseDto,
  type RefreshTokenBodyDto,
  resetPasswordSchema,
  type ResetPasswordDto,
  ResetPasswordResponseDto,
} from '@packages/entities/auth';
import { ApiResponse, Public } from '@packages/decorators';
import { ZodValidationPipe } from '@packages/pipes';
import type { GoogleProfile } from '@packages/strategy';
import { AuthService } from './auth.service';

type RequestWithGoogleProfile = Request & { user: GoogleProfile };

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}
  @Post('register')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Login successful' })
  async register(
    @Body(new ZodValidationPipe<RegisterDto>(registerSchema))
    registerDto: RegisterDto,
  ): Promise<RegisterResponseDto> {
    return this.authService.registerService(registerDto);
  }

  @Public()
  @Post('login')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Login successful' })
  async login(
    @Body(new ZodValidationPipe<LoginDto>(loginSchema))
    loginDto: LoginDto,
  ): Promise<LoginResponseDto> {
    return this.authService.loginService(loginDto);
  }

  @Public()
  @Post('login/user-code')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Login successful' })
  async loginByUserCode(
    @Body(new ZodValidationPipe<LoginByUserCodeDto>(loginByUserCodeSchema))
    dto: LoginByUserCodeDto,
  ): Promise<LoginResponseDto> {
    return this.authService.loginByUserCodeService(dto);
  }

  @Public()
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

  @Post('/reset-password')
  @HttpCode(StatusCodes.OK)
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Reset password successful' })
  resetPassword(
    @Body(new ZodValidationPipe<ResetPasswordDto>(resetPasswordSchema))
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    console.log(resetPasswordDto);
    return this.authService.resetPasswordService(resetPasswordDto);
  }

  @Public()
  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(): void {
    // Guard redirects to Google's consent screen; no body to return.
  }

  @Public()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(
    @Req() req: RequestWithGoogleProfile,
    @Res() res: Response,
  ): Promise<void> {
    const { accessToken, refreshToken } = await this.authService.googleLoginService(req.user);

    const redirectBase =
      this.configService.get<string>('GOOGLE_OAUTH_REDIRECT_URL') ??
      'http://localhost:3000/oauth/callback';
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('accessToken', accessToken);
    redirectUrl.searchParams.set('refreshToken', refreshToken);

    res.redirect(redirectUrl.toString());
  }
}
