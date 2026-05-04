import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginDto,
  LoginResponseDto,
  RefreshTokenBodyDto,
  RegisterDto,
  RegisterResponseDto,
  ResetPasswordDto,
  ResetPasswordResponseDto,
} from '@packages/entities/auth';
import {
  compareData,
  signAccessToken,
  signRefreshToken,
  type JwtRefreshPayload,
  type JwtTokensConfig,
} from '@packages/helpers';
import { EmailService } from '../email/email.service';
import { UserService } from '../user/user.service';
import { getJwtTokensConfig } from '@packages/configs/jwt-sign.config';
import type { User } from '@packages/entities/user';
import { randomUUID } from 'node:crypto';
import { RedisService } from 'src/redis/redis.service';

function parseRefreshTokenPayload(value: unknown): JwtRefreshPayload {
  if (typeof value !== 'object' || value === null) {
    throw new UnauthorizedException('Invalid token payload');
  }
  const record = value as Record<string, unknown>;
  if (record.typ !== 'refresh') {
    throw new UnauthorizedException('Invalid token type');
  }
  if (typeof record.sub !== 'string' || typeof record.email !== 'string') {
    throw new UnauthorizedException('Invalid token payload');
  }
  return { sub: record.sub, email: record.email, typ: 'refresh' };
}

@Injectable()
export class AuthService {
  private readonly jwtTokensConfig: JwtTokensConfig;
  private readonly ACCESS_TOKEN_REDIS_PREFIX = 'access_token_';
  private readonly PASSWORD_RESET_REDIS_PREFIX = 'password_reset_';
  constructor(
    private readonly userService: UserService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtTokensConfig = getJwtTokensConfig(configService);
  }

  async registerService(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, username, password, firstName, lastName } = registerDto;

    const checkUserWithEmail = await this.userService.getUserByField({
      field: 'email',
      value: email,
    });
    if (Array.isArray(checkUserWithEmail) && checkUserWithEmail.length > 0) {
      throw new BadRequestException('Email already exists ...');
    }

    const checkUserWithUsername =
      username &&
      (await this.userService.getUserByField({
        field: 'username',
        value: username,
      }));
    if (Array.isArray(checkUserWithUsername) && checkUserWithUsername.length > 0) {
      throw new BadRequestException('Username already exists ...');
    }

    const user = await this.userService.createUserService({
      email,
      username: username?.trim() || undefined,
      password,
      firstName,
      lastName,
    });

    return user as RegisterResponseDto;
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
    const isPasswordOk = (await compareData(loginDto.password, user.password)) as boolean;
    if (!isPasswordOk) {
      throw new BadRequestException('Invalid password ...');
    }

    const payload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, payload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, payload, this.jwtTokensConfig),
    ]);

    await this.redis.set(
      `${this.ACCESS_TOKEN_REDIS_PREFIX}:${user.id}`,
      refreshToken as string,
      604800,
    );

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email },
    };
  }

  async forgotPasswordService(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const rows = (await this.userService.getUserByField({
      field: 'email',
      value: forgotPasswordDto.email,
    })) as User[];

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const user = rows[0];
    const resetToken = randomUUID();
    await this.redis.set(`${this.PASSWORD_RESET_REDIS_PREFIX}${resetToken}`, user.id, 3600);
    const displayName = `${user.firstName} ${user.lastName}`.trim() || user.email;
    await this.emailService.sendForgotPasswordMail({
      to: user.email,
      resetToken,
      displayName,
    });

    return { ok: true };
  }

  async resetPasswordService(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<ResetPasswordResponseDto> {
    const { jti, password } = resetPasswordDto;
    const userId = await this.redis.get(`${this.PASSWORD_RESET_REDIS_PREFIX}${jti}`);
    console.log(userId);
    if (!userId) {
      throw new BadRequestException('Invalid reset password token ...');
    }
    const updatedUser = await this.userService.updateUserPasswordService({
      id: userId,
      password,
    });
    if (!updatedUser) {
      throw new BadRequestException('Failed to reset password ...');
    }
    await this.redis.del(`${this.PASSWORD_RESET_REDIS_PREFIX}${jti}`);
    return { ok: true };
  }

  async updateUserPasswordService({ userId, password }: { userId: string; password: string }) {
    const user = (await this.userService.getUserByField({
      field: 'id',
      value: userId,
    })) as User[];

    if (!Array.isArray(user) || user.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    const updatedUser = await this.userService.updateUserPasswordService({
      id: userId,
      password,
    });
    if (!updatedUser) {
      throw new BadRequestException('Failed to update password ...');
    }
    return updatedUser;
  }

  async refreshTokens(dto: RefreshTokenBodyDto): Promise<LoginResponseDto> {
    let verified: unknown;
    try {
      verified = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.jwtTokensConfig.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const payload = parseRefreshTokenPayload(verified);

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

  logout() {}
}
