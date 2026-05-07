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
  
      // handle status code
      const status =
        exception.getStatus?.() ||
        HttpStatus.INTERNAL_SERVER_ERROR;
  
      // handle response from exception
      const exceptionResponse = exception.getResponse();
  
      let message = 'Internal server error';
  
      if (typeof exceptionResponse === 'string') {
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

      //handle error from response
      console.log("error from response: ", exceptionResponse);
      const errors = exceptionResponse as { errors: unknown[] };
  
      response.status(status).json({
        success: false,
        statusCode: status,
        message,
        errors : errors.errors,
        path: request.url,
        trace: exception.stack,
        timestamp: new Date().toISOString(),
      });
    }
  }