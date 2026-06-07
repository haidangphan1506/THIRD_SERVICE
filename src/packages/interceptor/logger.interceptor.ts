import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, tap, finalize } from 'rxjs';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    const { method, url } = request;

    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          this.logger.log(`[Response] ${method} ${url} - ${response.statusCode}`);
        },
        error: (err) => {
          this.logger.error(`[Error] ${method} ${url} - ${(err as Error).message}`);
        },
      }),

      finalize(() => {
        const duration = Date.now() - startTime;
        this.logger.log(`[Timing] ${method} ${url} - ${duration}ms`);
      }),
    );
  }
}
