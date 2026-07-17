import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ERROR_MESSAGES } from 'src/data/constants';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type {
  ForgotPasswordDto,
  ForgotPasswordResponseDto,
  LoginByUserCodeDto,
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
import { RedisService } from 'src/features/redis/redis.service';
import { checkUuidValid, type JwtUserRole } from '@packages/helpers';
import { CurrentUser } from '@packages/decorators';
import type { FacebookProfile, GoogleProfile } from '@packages/strategy';

function parseRefreshTokenPayload(value: unknown): JwtRefreshPayload {
  if (typeof value !== 'object' || value === null) {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN_PAYLOAD);
  }
  const record = value as Record<string, unknown>;
  if (record.typ !== 'refresh') {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN_TYPE);
  }
  if (typeof record.sub !== 'string' || typeof record.email !== 'string') {
    throw new UnauthorizedException(ERROR_MESSAGES.INVALID_TOKEN_PAYLOAD);
  }
  return { sub: record.sub, email: record.email, typ: 'refresh' };
}

@Injectable()
export class AuthService {
  private readonly jwtTokensConfig: JwtTokensConfig;
  private readonly ACCESS_TOKEN_REDIS_PREFIX = 'access_token_';
  private readonly PASSWORD_RESET_REDIS_PREFIX = 'password_reset_';
  private readonly BLACK_LIST_TOKEN_REDIS_PREFIX = 'black_list_token_';
  constructor(
    private readonly userService: UserService,
    private readonly redis: RedisService,
    private readonly emailService: EmailService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.jwtTokensConfig = getJwtTokensConfig(configService);
  }

  //todo: register tutor ...
  async registerService(registerDto: RegisterDto): Promise<RegisterResponseDto> {
    const { email, username, password, firstName, lastName } = registerDto;

    const checkUserWithEmail = await this.userService.getUserByField({
      field: 'email',
      value: email,
    });
    if (Array.isArray(checkUserWithEmail) && checkUserWithEmail.length > 0) {
      throw new BadRequestException(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const checkUserWithUsername =
      username &&
      (await this.userService.getUserByField({
        field: 'username',
        value: username?.trim(),
      }));
    if (Array.isArray(checkUserWithUsername) && checkUserWithUsername.length > 0) {
      throw new BadRequestException(ERROR_MESSAGES.USERNAME_EXISTS);
    }

    await this.userService.createUserService({
      email,
      username: username?.trim() || undefined,
      password,
      firstName,
      lastName,
      role: 'TUTOR',
    });

    const createdRows = await this.userService.getUserByField({ field: 'email', value: email });
    const createdUser = createdRows[0];
    if (!createdUser) {
      throw new BadRequestException(ERROR_MESSAGES.FAILED_TO_CREATE_USER);
    }

    return {
      user: {
        id: createdUser.id,
        email: createdUser.email,
        username: createdUser.username,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
      },
    };
  }

  // TODO:  login by email + password ...
  async loginService(loginDto: LoginDto): Promise<LoginResponseDto> {
    const [user] = await this.userService.getUserByField({
      field: 'email',
      value: loginDto.email,
    });

    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const isPasswordOk = await compareData(loginDto.password, user.password);
    if (!isPasswordOk) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    const payload = { sub: user.id, email: user.email, role: user.role as JwtUserRole };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, payload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, { sub: user.id, email: user.email }, this.jwtTokensConfig),
    ]);

    await this.redis.set(`${this.ACCESS_TOKEN_REDIS_PREFIX}:${user.id}`, refreshToken, 604800);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, userCode: user.userCode, username: user.username },
    };
  }

  // TODO: login with userCode + password ...
  async loginByUserCodeService(dto: LoginByUserCodeDto): Promise<LoginResponseDto> {
    const rows = await this.userService.getUserByField({
      field: 'userCode',
      value: dto.userCode,
    });

    const user = rows.find((u) => u.role === dto.role);
    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
    const isPasswordOk = await compareData(dto.password, user.password);
    if (!isPasswordOk) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_PASSWORD);
    }

    const payload = { sub: user.id, email: user.email, role: user.role as JwtUserRole };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, payload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, { sub: user.id, email: user.email }, this.jwtTokensConfig),
    ]);

    await this.redis.set(`${this.ACCESS_TOKEN_REDIS_PREFIX}:${user.id}`, refreshToken, 604800);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, userCode: user.userCode, username: user.username },
    };
  }

  // TODO: login with google account ...
  async facebookLoginService(profile: FacebookProfile): Promise<LoginResponseDto> {
    const rows = await this.userService.getUserByField({ field: 'email', value: profile.email });
    let user = rows[0];
    if (!user) {
      await this.userService.createUserService({
        email: profile.email,
        password: randomUUID(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: 'STUDENT',
      });
      const createdRows = await this.userService.getUserByField({ field: 'email', value: profile.email });
      user = createdRows[0];
      if (!user) throw new BadRequestException(ERROR_MESSAGES.FAILED_TO_CREATE_USER);
    }

    const payload = { sub: user.id, email: user.email, role: user.role as JwtUserRole };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, payload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, { sub: user.id, email: user.email }, this.jwtTokensConfig),
    ]);
    await this.redis.set(`${this.ACCESS_TOKEN_REDIS_PREFIX}:${user.id}`, refreshToken, 604800);

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, userCode: user.userCode, username: user.username } };
  }

  async googleLoginService(profile: GoogleProfile): Promise<LoginResponseDto> {
    const rows = await this.userService.getUserByField({
      field: 'email',
      value: profile.email,
    });

    let user = rows[0];
    if (!user) {
      await this.userService.createUserService({
        email: profile.email,
        password: randomUUID(),
        firstName: profile.firstName,
        lastName: profile.lastName,
        role: 'STUDENT',
      });
      const createdRows = await this.userService.getUserByField({
        field: 'email',
        value: profile.email,
      });
      user = createdRows[0];
      if (!user) {
        throw new BadRequestException(ERROR_MESSAGES.FAILED_TO_CREATE_USER);
      }
    }

    const payload = { sub: user.id, email: user.email, role: user.role as JwtUserRole };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, payload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, { sub: user.id, email: user.email }, this.jwtTokensConfig),
    ]);

    await this.redis.set(`${this.ACCESS_TOKEN_REDIS_PREFIX}:${user.id}`, refreshToken, 604800);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, userCode: user.userCode, username: user.username },
    };
  }

  async forgotPasswordService(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<ForgotPasswordResponseDto> {
    const [user] = await this.userService.getUserByField({
      field: 'email',
      value: forgotPasswordDto.email,
    });
    if (!user) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const resetToken = randomUUID();
    await this.redis.set(`${this.PASSWORD_RESET_REDIS_PREFIX}${resetToken}`, user.id, 300);
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
    if (!userId) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_RESET_PASSWORD_TOKEN);
    }

    const user: User[] = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!Array.isArray(user) || user.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (user[0].isActive === false) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_ACTIVE);
    }

    const updatedUser = await this.userService.updateUserPasswordService({
      id: userId,
      password,
    });
    if (!updatedUser) {
      throw new BadRequestException(ERROR_MESSAGES.FAILED_TO_RESET_PASSWORD);
    }
    await this.redis.del(`${this.PASSWORD_RESET_REDIS_PREFIX}${jti}`);
    return { ok: true };
  }

  async updateUserPasswordService({ userId, password }: { userId: string; password: string }) {
    const user = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!Array.isArray(user) || user.length === 0) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const updatedUser = await this.userService.updateUserPasswordService({
      id: userId,
      password,
    });
    if (!updatedUser) {
      throw new BadRequestException(ERROR_MESSAGES.FAILED_TO_UPDATE_PASSWORD);
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
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_OR_EXPIRED_REFRESH_TOKEN);
    }

    const payload = parseRefreshTokenPayload(verified);

    const rows = await this.userService.getUserByField({
      field: 'id',
      value: payload.sub,
    });

    if (!Array.isArray(rows) || rows.length === 0) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_NO_LONGER_EXISTS);
    }

    const user = rows[0];
    const accessPayload = { sub: user.id, email: user.email, role: user.role as JwtUserRole };
    const refreshPayload = { sub: user.id, email: user.email };
    const [accessToken, refreshToken] = await Promise.all([
      signAccessToken(this.jwtService, accessPayload, this.jwtTokensConfig),
      signRefreshToken(this.jwtService, refreshPayload, this.jwtTokensConfig),
    ]);

    return {
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, userCode: user.userCode, username: user.username },
    };
  }

  // TODO: logout user ...
  async logoutService(@CurrentUser() user: Record<string, string>) {
    if (!user.id || !checkUuidValid({ data: user.id })) {
      throw new BadRequestException(ERROR_MESSAGES.INVALID_USER_ID);
    }
    const blackListToken = await this.redis.get(`${this.BLACK_LIST_TOKEN_REDIS_PREFIX}${user.id}`);
    if (blackListToken) {
      throw new BadRequestException(ERROR_MESSAGES.USER_ALREADY_LOGGED_OUT);
    }
    await this.redis.set(`${this.BLACK_LIST_TOKEN_REDIS_PREFIX}${user.id}`, user.id, 604800);
    return { ok: true };
  }
}
