import { ArgumentsHost, BadRequestException, HttpException } from '@nestjs/common';
import { HttpExceptionFilter } from '@packages/filters';
import { StatusCodes } from 'http-status-codes';

describe('Http Exception Filter ...', () => {
  let filter: HttpExceptionFilter;
  const json = jest.fn();
  const status = jest.fn(() => ({
    json,
  }));

  const mockResponse = {
    status,
  };

  const mockRequest = {
    url: '/api/test',
  };

  const mockHost = {
    switchToHttp: jest.fn(() => ({
      getRequest: () => mockRequest,
      getResponse: () => mockResponse,
    })),
  } as unknown as ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    jest.clearAllMocks();
  });

  test('1. should be throw error when catch error ...', () => {
    const exception = new BadRequestException('Invalid request');
    filter.catch(exception, mockHost);

    expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'Invalid request',
        path: '/api/test',
      }),
    );
  });

  it('should handle array validation messages', () => {
    const exception = new BadRequestException({
      message: ['email is required', 'password is required'],
      errors: [],
    });

    filter.catch(exception, mockHost);

    expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'email is required, password is required',
        errors: [],
      }),
    );
  });

  it('should handle object message', () => {
    const exception = new BadRequestException({
      message: 'Custom error',
      errors: ['field error'],
    });

    filter.catch(exception, mockHost);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Custom error',
        errors: ['field error'],
      }),
    );
  });

  it('should fallback to internal server error message', () => {
    const exception = {
      getStatus: jest.fn().mockReturnValue(StatusCodes.INTERNAL_SERVER_ERROR),
      getResponse: jest.fn().mockReturnValue({}),
      stack: 'stack trace',
    };

    filter.catch(exception as unknown as HttpException, mockHost);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
      }),
    );
  });

  it('should include trace and timestamp', () => {
    const exception = new BadRequestException('Test');

    filter.catch(exception, mockHost);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        trace: expect.stringContaining('') as string,
        timestamp: expect.stringContaining('') as string,
      }),
    );
  });

  test('should be return message when typeof exception response is string ...', () => {
    const exception = new HttpException('String error message', StatusCodes.BAD_REQUEST);
    filter.catch(exception, mockHost);

    expect(status).toHaveBeenCalledWith(StatusCodes.BAD_REQUEST);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: StatusCodes.BAD_REQUEST,
        message: 'String error message',
        path: '/api/test',
      }),
    );
  });

  test('should be return message when missing statusCode ...', () => {
    const exception = new Error('String error message');
    filter.catch(exception as unknown as HttpException, mockHost);

    expect(status).toHaveBeenCalledWith(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        message: 'String error message',
        path: '/api/test',
      }),
    );
  });

  it('should fallback to default message when exception.message is empty', () => {
    const exception = { getStatus: undefined, getResponse: undefined, message: '', stack: '' };
    filter.catch(exception as unknown as HttpException, mockHost);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Internal server error',
      }),
    );
  });
});
