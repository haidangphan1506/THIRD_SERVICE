import { Test, TestingModule } from '@nestjs/testing';
import {
  type ForgotPasswordDto,
  type ForgotPasswordResponseDto,
  type LoginDto,
  type LoginResponseDto,
  type RefreshTokenBodyDto,
  type RegisterDto,
  type RegisterResponseDto,
  type ResetPasswordDto,
  type ResetPasswordResponseDto,
} from '@packages/entities';
import { AuthController } from 'src/features/auth/auth.controller';
import { AuthService } from 'src/features/auth/auth.service';

describe('Auth Controller ...', () => {
  let authController: AuthController;

  const authServiceMock = {
    registerService: jest.fn(),
    loginService: jest.fn(),
    forgotPasswordService: jest.fn(),
    resetPasswordService: jest.fn(),
    updateUserPasswordService: jest.fn(),
    refreshTokens: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const authModule: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authServiceMock,
        },
      ],
    }).compile();

    authController = authModule.get(AuthController);
  });

  test('0. controller should be defined ...', () => {
    expect(authController).toBeDefined();
  });

  // ─── register ────────────────────────────────────────────────────────────────

  describe('1. register ... ', () => {
    const registerDto: RegisterDto = {
      email: 'dang04223@gmail.com',
      password: 'Haidangphan123@',
      username: 'dang04223',
      firstName: 'Phan Đăng',
      lastName: 'Hải',
    };

    test('1.1. should call registerService and return data when success', async () => {
      const registerResponse: RegisterResponseDto = {
        user: {
          id: '36837a9f-f7f2-41a0-b6f5-9d88fe938066',
          email: 'dang04223@gmail.com',
          username: 'dang04223',
          firstName: 'Phan Đăng',
          lastName: 'Hải',
        },
      };
      authServiceMock.registerService.mockResolvedValue(registerResponse);

      const result = await authController.register(registerDto);

      expect(authServiceMock.registerService).toHaveBeenCalledWith(registerDto);
      expect(authServiceMock.registerService).toHaveBeenCalledTimes(1);
      expect(result).toEqual(registerResponse);
    });

    test('1.2. should throw error when service throws', async () => {
      authServiceMock.registerService.mockRejectedValue(new Error('Username already exists ...'));

      await expect(authController.register(registerDto)).rejects.toThrow(
        'Username already exists ...',
      );
    });
  });

  // ─── login ───────────────────────────────────────────────────────────────────

  describe('2. login ...', () => {
    const loginDto: LoginDto = {
      email: 'dang04223@gmail.com',
      password: 'Haidangphan123@',
    };

    test('2.1. should call loginService and return tokens when success', async () => {
      const loginResponse: LoginResponseDto = {
        accessToken: 'access-token-xyz',
        refreshToken: 'refresh-token-xyz',
        user: {
          id: '36837a9f-f7f2-41a0-b6f5-9d88fe938066',
          email: 'dang04223@gmail.com',
        },
      };
      authServiceMock.loginService.mockResolvedValue(loginResponse);

      const result = await authController.login(loginDto);

      expect(authServiceMock.loginService).toHaveBeenCalledWith(loginDto);
      expect(authServiceMock.loginService).toHaveBeenCalledTimes(1);
      expect(result).toEqual(loginResponse);
    });

    test('2.2. should throw error when credentials are invalid', async () => {
      authServiceMock.loginService.mockRejectedValue(new Error('Invalid credentials'));

      await expect(authController.login(loginDto)).rejects.toThrow('Invalid credentials');
    });
  });

  // ─── refresh ─────────────────────────────────────────────────────────────────

  describe('3. refresh ...', () => {
    const refreshBody: RefreshTokenBodyDto = {
      refreshToken: 'refresh-token-xyz',
    };

    test('3.1. should call refreshTokens and return new tokens when success', async () => {
      const refreshResponse: LoginResponseDto = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
        user: {
          id: '36837a9f-f7f2-41a0-b6f5-9d88fe938066',
          email: 'dang04223@gmail.com',
        },
      };
      authServiceMock.refreshTokens.mockResolvedValue(refreshResponse);

      const result = await authController.refresh(refreshBody);

      expect(authServiceMock.refreshTokens).toHaveBeenCalledWith(refreshBody);
      expect(authServiceMock.refreshTokens).toHaveBeenCalledTimes(1);
      expect(result).toEqual(refreshResponse);
    });

    test('3.2. should throw error when refresh token is invalid', async () => {
      authServiceMock.refreshTokens.mockRejectedValue(new Error('Invalid refresh token'));

      await expect(authController.refresh(refreshBody)).rejects.toThrow('Invalid refresh token');
    });
  });

  // ─── forgot-password ─────────────────────────────────────────────────────────

  describe('4. forgotPassword ...', () => {
    const forgotPasswordDto: ForgotPasswordDto = {
      email: 'dang04223@gmail.com',
    };

    test('4.1. should call forgotPasswordService and return ok when success', async () => {
      const forgotPasswordResponse: ForgotPasswordResponseDto = { ok: true };
      authServiceMock.forgotPasswordService.mockResolvedValue(forgotPasswordResponse);

      const result = await authController.forgotPassword(forgotPasswordDto);

      expect(authServiceMock.forgotPasswordService).toHaveBeenCalledWith(forgotPasswordDto);
      expect(authServiceMock.forgotPasswordService).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true });
    });

    test('4.2. should throw error when email is not found', async () => {
      authServiceMock.forgotPasswordService.mockRejectedValue(new Error('Email not found'));

      await expect(authController.forgotPassword(forgotPasswordDto)).rejects.toThrow(
        'Email not found',
      );
    });
  });

  // ─── reset-password ───────────────────────────────────────────────────────────

  describe('5. resetPassword ...', () => {
    const resetPasswordDto: ResetPasswordDto = {
      jti: '36837a9f-f7f2-41a0-b6f5-9d88fe938066',
      password: 'NewPass123@',
      confirmPassword: 'NewPass123@',
    };

    test('5.1. should call resetPasswordService and return ok when success', async () => {
      const resetPasswordResponse: ResetPasswordResponseDto = { ok: true };
      authServiceMock.resetPasswordService.mockResolvedValue(resetPasswordResponse);

      const result = await authController.resetPassword(resetPasswordDto);

      expect(authServiceMock.resetPasswordService).toHaveBeenCalledWith(resetPasswordDto);
      expect(authServiceMock.resetPasswordService).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ ok: true });
    });

    test('5.2. should throw error when reset token is invalid', async () => {
      authServiceMock.resetPasswordService.mockRejectedValue(new Error('Invalid reset token'));

      await expect(authController.resetPassword(resetPasswordDto)).rejects.toThrow(
        'Invalid reset token',
      );
    });
  });
});
