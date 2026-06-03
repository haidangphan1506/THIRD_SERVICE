import { ExecutionContext, Logger } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggerInterceptor } from '@packages/interceptor';

describe('LoggerInterceptor ...', () => {
  let interceptor: LoggerInterceptor;

  const mockContext = {
    switchToHttp: jest.fn(),
  } as unknown as ExecutionContext;

  const mockNext = {
    handle: jest.fn(),
  };

  beforeEach(() => {
    interceptor = new LoggerInterceptor();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('1. should be log interceptor defined ...', () => {
    expect(interceptor).toBeDefined();
  });

  test('2. should be log report success ...', (done) => {
    (mockContext.switchToHttp as jest.Mock).mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ method: 'GET', url: '/test' }),
      getResponse: jest.fn().mockReturnValue({ statusCode: 200 }),
    });
    mockNext.handle.mockReturnValue(of({ data: 'success' }));

    const logSpy = jest.spyOn(Logger.prototype, 'log');

    interceptor.intercept(mockContext, mockNext).subscribe({
      complete: () => {
        expect(logSpy).toHaveBeenCalledWith('[Response] GET /test - 200');
        done();
      },
    });
  });

  test('3. should be log report when error ...', (done) => {
    const errorSpy = jest.spyOn(Logger.prototype, 'error');
    (mockContext.switchToHttp as jest.Mock).mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ method: 'GET', url: '/test' }),
      getResponse: jest.fn().mockReturnValue({ statusCode: 404 }),
    });
    mockNext.handle.mockReturnValue(throwError(() => new Error('failed')));

    interceptor.intercept(mockContext, mockNext).subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledWith('[Error] GET /test - failed');
        done();
      },
    });
  });
});
