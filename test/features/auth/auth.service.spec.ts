import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '@packages/entities';
import { AuthService } from 'src/features/auth/auth.service';
import { EmailService } from 'src/features/email/email.service';
import { RedisService } from 'src/features/redis/redis.service';
import { UserService } from 'src/features/user/user.service';

describe('AuthService ...', () => {
  // TODO : init contructors
  let service: AuthService;
  let userService: {
    getUserByField: jest.Mock;
    createUserService: jest.Mock;
  };
  let redis: { set: jest.Mock; get: jest.Mock; del: jest.Mock };
  let emailService: { sendForgotPasswordMail: jest.Mock };
  let jwtService: { signAsync: jest.Mock; verifyAsync: jest.Mock };

  // TODO : init dto and response
  const registerDto: RegisterDto = {
    email: 'dang04223@gmail.com',
    username: 'dang04223',
    password: 'Haidangphan123@',
    firstName: 'Phan Đăng',
    lastName: 'Hải',
  };
  const createdUser = {
    id: 'f3c5d8ec-82e8-482b-abc8-03f50ab66364',
    email: registerDto.email,
    username: registerDto.username,
    firstName: registerDto.firstName,
    lastName: registerDto.lastName,
  };

  // Todo : before/after test ...
  beforeEach(() => {
    userService = {
      getUserByField: jest.fn(),
      createUserService: jest.fn(),
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

    test('2. should be throw error when email is exist ...', () => {});
  });
});
