import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
  } from '@nestjs/common';
  import { Request, Response } from 'express';
  
  @Catch(HttpException)
  export class HttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost) {
      const ctx = host.switchToHttp();
  
      const request = ctx.getRequest<Request>();
      const response = ctx.getResponse<Response>();
  
      // status code
      const status =
        exception.getStatus?.() ||
        HttpStatus.INTERNAL_SERVER_ERROR;
  
      // response từ exception
      const exceptionResponse = exception.getResponse();
  
      let message = 'Internal server error';
  
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as unknown;
  
        // handle validation error (array)
        if (Array.isArray((res as { message: string[] }).message)) {
          message = (res as { message: string[] }).message.join(', ');
        } else {
          message = (res as { message: string }).message || message;
        }
      }
  
      response.status(status).json({
        success: false,
        statusCode: status,
        message,
        path: request.url,
        trace: exception.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }