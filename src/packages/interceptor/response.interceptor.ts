import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request, Response } from 'express';
import { map, Observable } from 'rxjs';
import { API_RESPONSE_KEY } from '../decorators';
import { type ApiResponseInterface, type ApiResponseOptions } from '../interfaces';

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiResponseInterface<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<ApiResponseInterface<T>> {
    const http = context.switchToHttp();
    const response = http.getResponse<Response>();
    const request = http.getRequest<Request>();
    const message =
      this.reflector.getAllAndOverride<ApiResponseOptions>(API_RESPONSE_KEY, [
        context.getHandler(),
        context.getClass(),
      ])?.message ?? 'Success';

    return next.handle().pipe(
      map((data): ApiResponseInterface<T> => {
        return {
          statusCode: response.statusCode,
          message,
          data,
          timestamp: new Date(),
          method: request.method,
          path: request.url,
        };
      }),
    );
  }
}
