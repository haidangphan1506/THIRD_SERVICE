import { ExecutionContext, HttpException } from '@nestjs/common';
import { throwError } from 'rxjs';
import { ErrorInterceptor } from '@packages/interceptor';

describe('Error interceptor ...', () => {
  let interceptor: ErrorInterceptor;

  const mockContext = {
    switchToHttp: jest.fn(),
  } as unknown as ExecutionContext;

  const mockNext = {
    handle: jest.fn(),
  };

  beforeEach(() => {
    interceptor = new ErrorInterceptor();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('1. should be throw error when eror instance HttpException ...', (done) => {
    const httpException = new HttpException('Bad Request', 400);
    mockNext.handle.mockReturnValue(throwError(() => httpException));

    interceptor.intercept(mockContext, mockNext).subscribe({
      error: (err: unknown) => {
        expect(err).toBeInstanceOf(HttpException);
        expect(err).toBe(httpException);
        done();
      },
    });
  });

  test('1. should be throw error when eror not instance HttpException ...', (done) => {
    const httpException = new Error('Bad Request');
    mockNext.handle.mockReturnValue(throwError(() => httpException));

    interceptor.intercept(mockContext, mockNext).subscribe({
      error: (err: unknown) => {
        expect(err).toBeInstanceOf(Error);
        expect(err).toBe(err);
        done();
      },
    });
  });
});
