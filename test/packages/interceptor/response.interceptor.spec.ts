import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { of } from "rxjs";
import { ResponseInterceptor } from "../../../src/packages/interceptor/response.interceptor";

describe('Response Interceptor ...', () => {
  const mockReflect = {
    getAllAndOverride: jest.fn(),
  } as unknown as Reflector;

  const interceptor = new ResponseInterceptor(mockReflect);

  const mockRequest = {
    method: 'POST',
    url: '/users',
  };

  const mockResponse: { statusCode: number | null } = {
    statusCode: 201,
  };

  const mockContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue(mockRequest),
      getResponse: jest.fn().mockReturnValue(mockResponse),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as unknown as ExecutionContext;

  const mockNext = {
    handle: jest.fn(),
  };

  test('1. should get message from response ...', (done) => {
    (mockReflect.getAllAndOverride as jest.Mock).mockReturnValue({ message: 'Create user successfully ...' });
    mockNext.handle.mockReturnValue(
      of({
        id: 1,
      })
    );

    interceptor
      .intercept(mockContext, mockNext)
      .subscribe(result => {
        expect(result).toMatchObject({
          statusCode: 201,
          message: 'Create user successfully ...',
          method: 'POST',
          path: '/users',
          data: {
            id: 1,
          },
        });

        expect(result.timestamp).toBeInstanceOf(Date);
        done();
      });
  });

  test("2. should return default message when reflector returns undefined ...", (done) => {
    (mockReflect.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    mockNext.handle.mockReturnValue(of({ id: 1 }));
    interceptor
      .intercept(mockContext, mockNext)
      .subscribe(result => {
        expect(result).toMatchObject({
          statusCode: 201,
          message: 'Success',
          method: 'POST',
          path: '/users',
          data: { id: 1 },
        });
        expect(result.timestamp).toBeInstanceOf(Date);
        done();
      });
  });

  test("3. should return default message when reflector returns object with undefined message ...", (done) => {
    (mockReflect.getAllAndOverride as jest.Mock).mockReturnValue({ message: undefined });
    mockNext.handle.mockReturnValue(of({ id: 1 }));
    interceptor
      .intercept(mockContext, mockNext)
      .subscribe(result => {
        expect(result).toMatchObject({
          statusCode: 201,
          message: 'Success',
          method: 'POST',
          path: '/users',
          data: { id: 1 },
        });
        expect(result.timestamp).toBeInstanceOf(Date);
        done();
      });
  });

  test("4. should return status code from response ...", (done) => {
    (mockReflect.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    mockResponse.statusCode = 205;
    mockNext.handle.mockReturnValue(of({ id: 1 }));
    interceptor
      .intercept(mockContext, mockNext)
      .subscribe(result => {
        expect(result).toMatchObject({
          statusCode: 205,
          message: 'Success',
          method: 'POST',
          path: '/users',
          data: { id: 1 },
        });
        expect(result.timestamp).toBeInstanceOf(Date);
        done();
      });
  });

  test("5. should return default status code 200 when response statusCode is null ...", (done) => {
    (mockReflect.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    mockResponse.statusCode = null;
    mockNext.handle.mockReturnValue(of({ id: 1 }));
    interceptor
      .intercept(mockContext, mockNext)
      .subscribe(result => {
        expect(result).toMatchObject({
          statusCode: 200,
          message: 'Success',
          method: 'POST',
          path: '/users',
          data: { id: 1 },
        });
        expect(result.timestamp).toBeInstanceOf(Date);
        done();
      });
  });

  test("6. should be return all data from response to return to client ...", () => {
    (mockReflect.getAllAndOverride as jest.Mock).mockReturnValue(undefined);
    mockResponse.statusCode= 205
    mockRequest.method = "GET"
    mockNext.handle.mockReturnValue(of({ id: 1 }));
    interceptor
      .intercept(mockContext, mockNext)
      .subscribe(result => {
        expect(result).toMatchObject({
          statusCode: 205,
          message: 'Success',
          method: 'GET',
          path: '/users',
          data: { id: 1 },
        });
        expect(result.timestamp).toBeInstanceOf(Date);
      });
  })
});
