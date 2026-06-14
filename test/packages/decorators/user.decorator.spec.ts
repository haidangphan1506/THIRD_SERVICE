import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory as factory } from '@packages/decorators';

describe('CurrentUser decorator', () => {
  const mockUser = {
    userId: '1',
    email: 'test@example.com',
    role: 'admin',
  };

  const mockContext = {
    switchToHttp: jest.fn(() => ({
      getRequest: () => ({
        user: mockUser,
      }),
    })),
  } as unknown as ExecutionContext;

  it('should return entire user when data is undefined', () => {
    const result = factory(undefined, mockContext);

    expect(result).toEqual(mockUser);
  });

  it('should return specific property when data is provided', () => {
    const result = factory('email', mockContext);

    expect(result).toBe('test@example.com');
  });

  it('should return undefined when user does not exist', () => {
    const context = {
      switchToHttp: jest.fn(() => ({
        getRequest: () => ({}),
      })),
    } as unknown as ExecutionContext;

    const result = factory('email', context);

    expect(result).toBeUndefined();
  });
});
