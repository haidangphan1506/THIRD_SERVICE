import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenBodyDto,
  RegisterDto,
  ResetPasswordDto,
} from '@packages/entities';
import { compareData } from '@packages/helpers';
import { AuthService } from 'src/features/auth/auth.service';
import { EmailService } from 'src/features/email/email.service';
import { RedisService } from 'src/features/redis/redis.service';
import { UserService } from 'src/features/user/user.service';

jest.mock('@packages/helpers', () => {
  const actual = jest.requireActual<typeof import('@packages/helpers')>('@packages/helpers');
  return {
    ...actual,
    compareData: jest.fn(),
  };
});

const compareDataMock = jest.mocked(compareData);

describe('AuthService ...', () => {
  // TODO : init contructors
  let service: AuthService;
  let userService: {
    getUserByField: jest.Mock;
    createUserService: jest.Mock;
    updateUserPasswordService: jest.Mock;
  };
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let emailService: { sendForgotPasswordMail: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  const createdUser = {
    id: 'f3c5d8ec-82e8-482b-abc8-03f50ab66364',
    email: 'dang04223@gmail.com',
    username: 'dang04223',
    password: '$2a$12$YCoINL4rC3f92lZMwdZXx.mKYDmwbrr.XvdYOM7bWCE9CP.l0cHFy',
    firstName: 'Phan Đăng',
    lastName: 'Hải',
  };

  // Todo : before/after test ...
  beforeEach(() => {
    compareDataMock.mockReset();
    userService = {
      getUserByField: jest.fn(),
      createUserService: jest.fn(),
      updateUserPasswordService: jest.fn(),
    };

    redis = { set: jest.fn(), get: jest.fn(), del: jest.fn() };
    emailService = { sendForgotPasswordMail: jest.fn() };
    jwtService = { signAsync: jest.fn(), verifyAsync: jest.fn() };
    const configService = { get: jest.fn().mockReturnValue(undefined) };

    service = new AuthService(
      userService as unknown as UserService,
      redis as unknown as RedisService,
      emailService as unknown as EmailService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  describe('register service ...', () => {
    test('1. should be register user success ...', async () => {
      const registerDto: RegisterDto = {
        email: 'dang04223@gmail.com',
        username: 'dang04223',
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      };

      userService.getUserByField.mockReturnValue([]);
      userService.createUserService.mockReturnValue(createdUser);
      const result = await service.registerService(registerDto);

      expect(result).toEqual(createdUser);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: registerDto.email,
      });

      expect(userService.getUserByField).toHaveBeenNthCalledWith(2, {
        field: 'username',
        value: registerDto.username,
      });

      expect(userService.createUserService).toHaveBeenCalledWith({
        email: registerDto.email,
        username: registerDto.username,
        password: registerDto.password,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
      });
    });

    test('2. should be throw error when email is exist ...', async () => {
      const registerDto: RegisterDto = {
        email: 'dang04223@gmail.com',
        username: 'dang04223',
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      };
      userService.getUserByField.mockReturnValue([createdUser]);
      const result = service.registerService(registerDto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Email already exists ...');
      expect(userService.getUserByField).toHaveBeenCalledTimes(1);
    });
    test('3. should be throw error when username is exists ...', async () => {
      const registerDto: RegisterDto = {
        email: 'dang0423@gmail.com',
        username: 'dang04223',
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      };

      userService.getUserByField.mockReturnValueOnce([]).mockReturnValueOnce([createdUser]);
      const result = service.registerService(registerDto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Username already exists ...');

      expect(userService.getUserByField).toHaveBeenCalledTimes(2);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: registerDto.email,
      });
      expect(userService.getUserByField).toHaveBeenNthCalledWith(2, {
        field: 'username',
        value: registerDto.username,
      });
    });

    test('4. should be trim username when username has space in last/first value ...', async () => {
      userService.getUserByField.mockReturnValue([]);
      userService.createUserService.mockReturnValue(createdUser);

      const registerDto: RegisterDto = {
        email: 'dang0423@gmail.com',
        username: '    dang04223     ',
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      };
      const result = await service.registerService(registerDto);

      expect(result).toEqual(createdUser);
      expect(userService.getUserByField).toHaveBeenCalledTimes(2);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: 'dang0423@gmail.com',
      });

      expect(userService.getUserByField).toHaveBeenNthCalledWith(2, {
        field: 'username',
        value: 'dang04223',
      });
      expect(userService.createUserService).toHaveBeenCalledWith({
        email: 'dang0423@gmail.com',
        username: 'dang04223',
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      });
    });

    test('4. should be trim username when username is undefined ...', async () => {
      userService.getUserByField.mockReturnValue([]);
      userService.createUserService.mockReturnValue(createdUser);

      const registerDto: RegisterDto = {
        email: 'dang0423@gmail.com',
        username: undefined,
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      };
      const result = await service.registerService(registerDto);

      expect(result).toEqual(createdUser);
      expect(userService.getUserByField).toHaveBeenCalledTimes(1);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: 'dang0423@gmail.com',
      });
      expect(userService.createUserService).toHaveBeenCalledWith({
        email: 'dang0423@gmail.com',
        username: undefined,
        password: 'Haidangphan123@',
        firstName: 'Phan Đăng',
        lastName: 'Hải',
      });
    });
  });

  describe('loginService ...', () => {
    test('1. should be throw error when user not exist ...', async () => {
      userService.getUserByField.mockReturnValue([]);
      const loginPayload: LoginDto = {
        email: 'dang0423@gmail.com',
        password: 'Phandanghai123@',
      };
      const result = service.loginService(loginPayload);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('User not found ...');

      expect(userService.getUserByField).toHaveBeenCalledTimes(1);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: 'dang0423@gmail.com',
      });
    });

    test('2. should be throw error when password not matched ...', async () => {
      userService.getUserByField.mockReturnValue([createdUser]);
      compareDataMock.mockResolvedValue(false);
      const loginPayload: LoginDto = {
        email: 'dang04223@gmail.com',
        password: 'Phandanghai123@',
      };
      const result = service.loginService(loginPayload);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Invalid password ...');

      expect(compareDataMock).toHaveBeenCalledWith(loginPayload.password, createdUser.password);
    });

    test('3. should be login success and return tokens ...', async () => {
      const loginUser = {
        id: 'f3c5d8ec-82e8-482b-abc8-03f50ab66364',
        email: 'dang04223@gmail.com',
        password: '$2a$12$hashedPasswordValue',
        role: 'STUDENT',
      };
      userService.getUserByField.mockReturnValue([loginUser]);
      compareDataMock.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      redis.set.mockResolvedValue(undefined);

      const loginPayload: LoginDto = {
        email: 'dang04223@gmail.com',
        password: 'Phandanghai123@',
      };
      const result = await service.loginService(loginPayload);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: loginUser.id, email: loginUser.email },
      });

      expect(userService.getUserByField).toHaveBeenCalledTimes(1);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: loginPayload.email,
      });
      expect(compareDataMock).toHaveBeenCalledWith(loginPayload.password, loginUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalledWith(
        `access_token_:${loginUser.id}`,
        'refresh-token',
        604800,
      );
    });

    test('3. should be login success, set default role USER and return tokens ...', async () => {
      const loginUser = {
        id: 'f3c5d8ec-82e8-482b-abc8-03f50ab66364',
        email: 'dang04223@gmail.com',
        password: '$2a$12$hashedPasswordValue',
        role: null,
      };
      userService.getUserByField.mockReturnValue([loginUser]);
      compareDataMock.mockResolvedValue(true);
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');
      redis.set.mockResolvedValue(undefined);

      const loginPayload: LoginDto = {
        email: 'dang04223@gmail.com',
        password: 'Phandanghai123@',
      };
      const result = await service.loginService(loginPayload);

      expect(result).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: loginUser.id, email: loginUser.email },
      });

      expect(userService.getUserByField).toHaveBeenCalledTimes(1);
      expect(userService.getUserByField).toHaveBeenNthCalledWith(1, {
        field: 'email',
        value: loginPayload.email,
      });

      expect(compareDataMock).toHaveBeenCalledWith(loginPayload.password, loginUser.password);
      const signOptionsMatcher: Record<string, unknown> = {
        secret: expect.any(String),
        expiresIn: expect.any(Number),
      };
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        {
          sub: loginUser.id,
          email: loginUser.email,
          typ: 'access',
          role: 'STUDENT',
        },
        expect.objectContaining(signOptionsMatcher),
      );
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalledWith(
        `access_token_:${loginUser.id}`,
        'refresh-token',
        604800,
      );
    });
  });

  describe('forgotPasswordService ...', () => {
    test('1. should be throw error when user not exist ...', async () => {
      userService.getUserByField.mockReturnValue([]);
      const dto: ForgotPasswordDto = { email: 'dang04223@gmail.com' };
      const result = service.forgotPasswordService(dto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('User not found ...');
      expect(redis.set).not.toHaveBeenCalled();
      expect(emailService.sendForgotPasswordMail).not.toHaveBeenCalled();
    });

    test('2. should store reset token, send mail and return ok ...', async () => {
      userService.getUserByField.mockReturnValue([createdUser]);
      redis.set.mockResolvedValue(undefined);
      emailService.sendForgotPasswordMail.mockResolvedValue(undefined);

      const dto: ForgotPasswordDto = { email: 'dang04223@gmail.com' };
      const result = await service.forgotPasswordService(dto);

      expect(result).toEqual({ ok: true });

      // reset token được sinh ngẫu nhiên -> lấy lại từ lời gọi redis.set để đối chiếu
      const [redisKey, redisValue, redisTtl] = redis.set.mock.calls[0] as [string, string, number];
      expect(redisKey).toMatch(/^password_reset_/);
      expect(redisValue).toBe(createdUser.id);
      expect(redisTtl).toBe(3600);

      const resetToken = redisKey.replace('password_reset_', '');
      expect(emailService.sendForgotPasswordMail).toHaveBeenCalledWith({
        to: createdUser.email,
        resetToken,
        displayName: 'Phan Đăng Hải',
      });
    });

    test('3. should fall back to email as displayName when name is empty ...', async () => {
      userService.getUserByField.mockReturnValue([{ ...createdUser, firstName: '', lastName: '' }]);
      redis.set.mockResolvedValue(undefined);
      emailService.sendForgotPasswordMail.mockResolvedValue(undefined);

      const dto: ForgotPasswordDto = { email: 'dang04223@gmail.com' };
      const result = await service.forgotPasswordService(dto);

      expect(result).toEqual({ ok: true });
      expect(emailService.sendForgotPasswordMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: createdUser.email,
          displayName: createdUser.email,
        }),
      );
    });
  });

  describe('resetPasswordService ...', () => {
    test('1. should be throw error when reset token is invalid ...', async () => {
      redis.get.mockResolvedValue(null);
      const dto: ResetPasswordDto = {
        jti: 'missing-token',
        password: 'Haidangphan123@',
        confirmPassword: 'Haidangphan123@',
      };
      const result = service.resetPasswordService(dto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Invalid reset password token ...');
      expect(userService.getUserByField).not.toHaveBeenCalled();
    });

    test('2. should be throw error when user not exist ...', async () => {
      redis.get.mockResolvedValue(createdUser.id);
      userService.getUserByField.mockReturnValue([]);
      const dto: ResetPasswordDto = {
        jti: 'valid-token',
        password: 'Haidangphan123@',
        confirmPassword: 'Haidangphan123@',
      };
      const result = service.resetPasswordService(dto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('User not found ...');
    });

    test('3. should be throw error when user is not active ...', async () => {
      redis.get.mockResolvedValue(createdUser.id);
      userService.getUserByField.mockReturnValue([{ ...createdUser, isActive: false }]);
      const dto: ResetPasswordDto = {
        jti: 'valid-token',
        password: 'Haidangphan123@',
        confirmPassword: 'Haidangphan123@',
      };
      const result = service.resetPasswordService(dto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('User is not active ...');
    });

    test('4. should be throw error when update password failed ...', async () => {
      redis.get.mockResolvedValue(createdUser.id);
      userService.getUserByField.mockReturnValue([{ ...createdUser, isActive: true }]);
      userService.updateUserPasswordService.mockResolvedValue(null);
      const dto: ResetPasswordDto = {
        jti: 'valid-token',
        password: 'Haidangphan123@',
        confirmPassword: 'Haidangphan123@',
      };
      const result = service.resetPasswordService(dto);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Failed to reset password ...');
      expect(redis.del).not.toHaveBeenCalled();
    });

    test('5. should reset password, delete token and return ok ...', async () => {
      redis.get.mockResolvedValue(createdUser.id);
      userService.getUserByField.mockReturnValue([{ ...createdUser, isActive: true }]);
      userService.updateUserPasswordService.mockResolvedValue({ ...createdUser });
      redis.del.mockResolvedValue(undefined);

      const dto: ResetPasswordDto = {
        jti: 'valid-token',
        password: 'Haidangphan123@',
        confirmPassword: 'Haidangphan123@',
      };
      const result = await service.resetPasswordService(dto);

      expect(result).toEqual({ ok: true });
      expect(userService.updateUserPasswordService).toHaveBeenCalledWith({
        id: createdUser.id,
        password: dto.password,
      });
      expect(redis.del).toHaveBeenCalledWith(`password_reset_${dto.jti}`);
    });
  });

  describe('updateUserPasswordService ...', () => {
    test('1. should be throw error when user not exist ...', async () => {
      userService.getUserByField.mockReturnValue([]);
      const result = service.updateUserPasswordService({
        userId: createdUser.id,
        password: 'Haidangphan123@',
      });

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('User not found ...');
      expect(userService.updateUserPasswordService).not.toHaveBeenCalled();
    });

    test('2. should be throw error when update password failed ...', async () => {
      userService.getUserByField.mockReturnValue([createdUser]);
      userService.updateUserPasswordService.mockResolvedValue(null);
      const result = service.updateUserPasswordService({
        userId: createdUser.id,
        password: 'Haidangphan123@',
      });

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Failed to update password ...');
    });

    test('3. should update password and return updated user ...', async () => {
      const updatedUser = { ...createdUser };
      userService.getUserByField.mockReturnValue([createdUser]);
      userService.updateUserPasswordService.mockResolvedValue(updatedUser);

      const result = await service.updateUserPasswordService({
        userId: createdUser.id,
        password: 'Haidangphan123@',
      });

      expect(result).toEqual(updatedUser);
      expect(userService.getUserByField).toHaveBeenCalledWith({
        field: 'id',
        value: createdUser.id,
      });
      expect(userService.updateUserPasswordService).toHaveBeenCalledWith({
        id: createdUser.id,
        password: 'Haidangphan123@',
      });
    });
  });

  describe('refreshTokens ...', () => {
    test('1. should be throw error when refresh token is invalid ...', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const dto: RefreshTokenBodyDto = { refreshToken: 'bad-token' };
      const result = service.refreshTokens(dto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow('Invalid or expired refresh token');
      expect(userService.getUserByField).not.toHaveBeenCalled();
    });

    test('2. should be throw error when token payload type is not refresh ...', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: createdUser.id,
        email: createdUser.email,
        typ: 'access',
      });
      const dto: RefreshTokenBodyDto = { refreshToken: 'access-typed-token' };
      const result = service.refreshTokens(dto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow('Invalid token type');
    });

    test('3. should be throw error when user no longer exists ...', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: createdUser.id,
        email: createdUser.email,
        typ: 'refresh',
      });
      userService.getUserByField.mockReturnValue([]);
      const dto: RefreshTokenBodyDto = { refreshToken: 'valid-refresh-token' };
      const result = service.refreshTokens(dto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow('User no longer exists');
    });

    test('4. should rotate and return new tokens ...', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: createdUser.id,
        email: createdUser.email,
        typ: 'refresh',
      });
      userService.getUserByField.mockReturnValue([{ ...createdUser, role: 'STUDENT' }]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const dto: RefreshTokenBodyDto = { refreshToken: 'valid-refresh-token' };
      const result = await service.refreshTokens(dto);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: { id: createdUser.id, email: createdUser.email },
      });
      expect(userService.getUserByField).toHaveBeenCalledWith({
        field: 'id',
        value: createdUser.id,
      });
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });

    test('5. should be throw error when value from token verify is not oject ...', async () => {
      jwtService.verifyAsync.mockResolvedValue(123);
      userService.getUserByField.mockReturnValue([{ ...createdUser, role: 'STUDENT' }]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const dto: RefreshTokenBodyDto = { refreshToken: 'valid-refresh-token' };
      const result = service.refreshTokens(dto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow('Invalid token payload');
    });

    test('6. should be throw error when sub in value from token verify is not string ...', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: createdUser.id,
        email: null,
        typ: 'refresh',
      });
      userService.getUserByField.mockReturnValue([{ ...createdUser, role: 'STUDENT' }]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const dto: RefreshTokenBodyDto = { refreshToken: 'valid-refresh-token' };
      const result = service.refreshTokens(dto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow('Invalid token payload');
    });

    test('7. should be throw error when email in value from token verify is not string ...', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: undefined,
        email: createdUser.email,
        typ: 'refresh',
      });
      userService.getUserByField.mockReturnValue([{ ...createdUser, role: 'STUDENT' }]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const dto: RefreshTokenBodyDto = { refreshToken: 'valid-refresh-token' };
      const result = service.refreshTokens(dto);

      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(result).rejects.toThrow('Invalid token payload');
    });

    test('8. should default role to USER when user has no role ...', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: createdUser.id,
        email: createdUser.email,
        typ: 'refresh',
      });
      userService.getUserByField.mockReturnValue([{ ...createdUser, role: null }]);
      jwtService.signAsync
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const dto: RefreshTokenBodyDto = { refreshToken: 'valid-refresh-token' };
      const result = await service.refreshTokens(dto);

      expect(result.accessToken).toBe('new-access-token');
      expect(jwtService.signAsync).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ role: 'STUDENT' }),
        expect.anything(),
      );
    });
  });

  describe('logoutService ...', () => {
    test('1. should be throw error when user id is invalid ...', async () => {
      const result = service.logoutService({ id: 'not-a-uuid' });

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Invalid user ID ...');
      expect(redis.set).not.toHaveBeenCalled();
    });

    test('1b. should be throw error when user id is missing ...', async () => {
      const result = service.logoutService({});

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('Invalid user ID ...');
      expect(redis.get).not.toHaveBeenCalled();
      expect(redis.set).not.toHaveBeenCalled();
    });

    test('2. should be throw error when user already logged out ...', async () => {
      redis.get.mockResolvedValue(createdUser.id);
      const result = service.logoutService({ id: createdUser.id });

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow('User already logged out ...');
      expect(redis.set).not.toHaveBeenCalled();
    });

    test('3. should blacklist token and return ok ...', async () => {
      redis.get.mockResolvedValue(null);
      redis.set.mockResolvedValue(undefined);

      const result = await service.logoutService({ id: createdUser.id });

      expect(result).toEqual({ ok: true });
      expect(redis.set).toHaveBeenCalledWith(
        `black_list_token_${createdUser.id}`,
        createdUser.id,
        604800,
      );
    });
  });
});
