import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    // handle status code
    const status = exception.getStatus?.() || HttpStatus.INTERNAL_SERVER_ERROR;

    // handle response from exception
    const exceptionResponse = exception.getResponse?.() ?? null;

    let message = 'Internal server error';

    if (exceptionResponse === null) {
      message = exception.message || message;
    } else if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const res = exceptionResponse as unknown;

      // handle validation error (array of strings)
      if (Array.isArray((res as { message: string[] }).message)) {
        message = (res as { message: string[] }).message.join(', ');
      } else {
        message = (res as { message: string }).message || message;
      }
    }

    const errors = (exceptionResponse as { errors: unknown[] } | null)?.errors;

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      path: request.url,
      ...(status >= 500 && process.env.NODE_ENV !== 'production' && { trace: exception.stack }),
      timestamp: new Date().toISOString(),
    });
  }
}
