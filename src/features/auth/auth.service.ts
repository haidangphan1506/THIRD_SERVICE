import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenBodyDto,
} from '@packages/entities/auth';
import {
  compareData,
  signAccessToken,
  signRefreshToken,
  type JwtPayload,
  type JwtTokensConfig,
} from '@packages/helpers';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { getJwtTokensConfig } from '@packages/configs/jwt-sign.config';
import type { User } from '@packages/entities';
import { randomUUID } from 'node:crypto';

@Injectable()
export class AuthService {
  private readonly jwtTokensConfig: JwtTokensConfig;

  constructor(
    private readonly userService: UserService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtTokensConfig = getJwtTokensConfig(configService);
  }

  async loginService(loginDto: LoginDto): Promise<LoginResponseDto> {
    const rows = (await this.userService.getUserByField({
      field: 'email',
      value: loginDto.email,
    })) as User[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const user = rows[0];
    const isPasswordOk = await compareData(loginDto.password, user.password);
    if (!isPasswordOk) {
      throw new BadRequestException('Invalid password ...');
    }

    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, payload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, payload, this.jwtTokensConfig),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async forgotPasswordService(forgotPasswordDto: ForgotPasswordDto): Promise<ForgotPasswordResponseDto> {
    const rows = (await this.userService.getUserByField({
      field: 'email',
      value: forgotPasswordDto.email,
    })) as User[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const user = rows[0];
    const resetToken = randomUUID();
    await this.emailService.savePasswordResetToken(resetToken, user.id);
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    await this.emailService.sendForgotPasswordMail({
      to: user.email,
      resetToken,
      displayName,
    });

    return { ok: true };
  }

  async refreshTokens(dto: RefreshTokenBodyDto): Promise<LoginResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(dto.refreshToken, {
        secret: this.jwtTokensConfig.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.typ !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const rows = (await this.userService.getUserByField({
      field: 'id',
      value: payload.sub,
    })) as User[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new UnauthorizedException('User no longer exists');
    }

    const user = rows[0];
    const next = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, next, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, next, this.jwtTokensConfig),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  logout(): Record<string, never> {
    return {};
  }
}
