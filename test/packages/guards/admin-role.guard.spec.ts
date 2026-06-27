import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { AdminRoleGuard } from '@packages/guards';

describe('Admin Role Guard ...', () => {
  let guard: AdminRoleGuard;

  const createContext = (user?: unknown): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
        getResponse: jest.fn(),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new AdminRoleGuard();
  });

  test('1. should allow access when user has ADMIN role', () => {
    const context = createContext({
      id: '1',
      email: 'dang04223@gmail.com',
      typ: 'access',
      role: 'ADMIN',
    });

    expect(guard.canActivate(context)).toBe(true);
  });

  test('2. should throw ForbiddenException for non-admin role', () => {
    const context = createContext({
      id: '1',
      email: 'dang04223@gmail.com',
      typ: 'access',
      role: 'STUDENT',
    });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  test('3. should throw ForbiddenException when user is missing', () => {
    const context = createContext(undefined);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
