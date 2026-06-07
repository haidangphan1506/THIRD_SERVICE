import { ConfigService } from '@nestjs/config';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '@packages/guards';

describe('Jwt Auth Guard ... ', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verify: jest.Mock };
  let configService: { get: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  const createContext = (headers: Record<string, string> = {}): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ headers }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    jwtService = { verify: jest.fn() };
    configService = { get: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };
    guard = new JwtAuthGuard(
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
      reflector as unknown as Reflector,
    );
  });

  test('1. should be request pass jwt guard when isPublic true ...', () => {
    reflector.getAllAndOverride.mockReturnValue(true);
    const result = guard.canActivate(createContext());
    expect(result).toBe(true);
  });
});
