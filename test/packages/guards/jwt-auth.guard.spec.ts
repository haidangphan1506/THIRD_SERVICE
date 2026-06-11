import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@packages/guards';

describe('Jwt Auth Guard ...', () => {
  const ACCESS_TOKEN =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyMzQ1Njc4OTAiLCJlbWFpbCI6ImRhbmcwNDIyM0BnbWFpbCIsInR5cCI6ImFjY2VzcyIsInJvbGUiOiJBRE1JTiJ9.Ye3Qb89YwM0Da0QKu39GmMGSDYV05EGVCSz76L4lJ8k';
  let guard: JwtAuthGuard;
  let jwtService: { verify: jest.Mock };
  let configService: { get: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  const createContext = (headers: Record<string, string> = {}): ExecutionContext => {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ headers }),
      }),
    } as unknown as ExecutionContext;
  };

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    configService = { get: jest.fn() };
    reflector = {
      getAllAndOverride: jest.fn(),
    };
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      reflector as unknown as Reflector,
    );
  });
  describe('test case follow isPublic ...', () => {
    test('1. should be pass jwt auth guard when is Public = true ...', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const result = guard.canActivate(createContext());

      expect(result).toBe(true);
    });

    test('2. should throw UnauthorizedException when isPublic = false and no token in header ...', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      expect(() => guard.canActivate(createContext())).toThrow(UnauthorizedException);
      expect(jwtService.verify).not.toHaveBeenCalled();
    });
  });

  describe('test case follow verify token from header ....', () => {
    test('3. should verify token via jwtService and attach user to request ...', () => {
      const request: { headers: Record<string, string>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockReturnValue({
        sub: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: 'ADMIN',
      });

      const result = guard.canActivate(context);

      expect(request.user as unknown).toEqual({
        id: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: 'ADMIN',
      });
      expect(result).toEqual(true);
    });

    test('4. should throw UnauthorizedException if access token has typ !== "access" ...', () => {
      const request: { headers: Record<string, string>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockReturnValue({
        sub: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'refresh',
        role: 'ADMIN',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('5. should throw UnauthorizedException if user data not enough ...', () => {
      const request: { headers: Record<string, string>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockReturnValue({
        sub: '1234567890',
        email: null,
        typ: 'access',
        role: 'ADMIN',
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('6. should be throw UnaythorizedException when token not start Bearer ...', () => {
      const request: { headers: Record<string, string>; user?: Record<string, string> } = {
        headers: {
          authorization: `${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('6. should be throw UnaythorizedException when token is undefined/null ...', () => {
      const request: { headers: Record<string, unknown>; user?: Record<string, string> } = {
        headers: {
          authorization: null,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('6. should be revert role user when type not match JWT_ROLE ...', () => {
      const request: { headers: Record<string, unknown>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockReturnValue({
        sub: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: '123',
      });
      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual({
        id: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: 'USER',
      });
    });

    test('7. should be throw UnauthorizedException when decoded token not object ...', () => {
      const request: { headers: Record<string, unknown>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockReturnValue(123);
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('8. should be throw UnauthorizedException when verify token failed ...', () => {
      const request: { headers: Record<string, unknown>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockImplementation(() => {
        throw new Error('failed');
      });
      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('9. should throw UnauthorizedException when role is not a string ...', () => {
      const request: { headers: Record<string, unknown>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue('secret_key');
      jwtService.verify.mockReturnValue({
        sub: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: 123,
      });

      expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
      expect(request.user).toBeUndefined();
    });

    test('10. should fall back to default secret when JWT_ACCESS_SECRET is not set ...', () => {
      const request: { headers: Record<string, unknown>; user?: Record<string, string> } = {
        headers: {
          authorization: `Bearer ${ACCESS_TOKEN}`,
        },
      };
      reflector.getAllAndOverride.mockReturnValue(false);
      const context = {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(request),
        }),
      } as unknown as ExecutionContext;

      configService.get.mockReturnValue(undefined);
      jwtService.verify.mockReturnValue({
        sub: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: 'ADMIN',
      });

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith(ACCESS_TOKEN, {
        secret: 'dev-insecure-jwt-secret',
      });
      expect(request.user).toEqual({
        id: '1234567890',
        email: 'dang04223@gmail.com',
        typ: 'access',
        role: 'ADMIN',
      });
    });
  });
});
