import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { KafkaContext, RmqContext } from '@nestjs/microservices';
import { Observable } from 'rxjs';
import { randomUUID } from 'node:crypto';
import {
  CORRELATION_ID_HEADER,
  PARENT_TRACE_ID_HEADER,
  runWithRequestContext,
  SERVICE_NAME_HEADER,
} from '@packages/context/request-context';

const SERVICE_NAME = 'third-service';

function readHeader(headers: Record<string, unknown> | undefined, key: string): string | undefined {
  const value = headers?.[key];
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return typeof value === 'string' ? value : undefined;
}

/**
 * Extracts `{pattern, headers}` from either transport this service runs — `KafkaContext` keeps
 * headers directly on the message (`getMessage().headers`), `RmqContext`'s underlying amqplib
 * message keeps them nested under `.properties.headers` instead. Falls back to RMQ's shape when
 * the Kafka-style read comes up empty, since `context.switchToRpc().getContext()` doesn't
 * identify which transport it came from without checking its own shape.
 */
function readRpcMetadata(context: ExecutionContext): {
  pattern: string;
  headers: Record<string, unknown> | undefined;
} {
  const rpcContext = context.switchToRpc().getContext<KafkaContext | RmqContext>();
  if (typeof (rpcContext as KafkaContext)?.getTopic === 'function') {
    const kafkaContext = rpcContext as KafkaContext;
    const message = kafkaContext.getMessage() as { headers?: Record<string, unknown> } | undefined;
    if (message?.headers) {
      return { pattern: kafkaContext.getTopic(), headers: message.headers };
    }
  }
  const rmqContext = rpcContext as RmqContext;
  const rmqMessage = rmqContext?.getMessage?.() as
    { properties?: { headers?: Record<string, unknown> } } | undefined;
  return {
    pattern: rmqContext?.getPattern?.() ?? context.getHandler().name,
    headers: rmqMessage?.properties?.headers,
  };
}

/**
 * Registered as a *microservice-scoped* global interceptor in `main.ts`
 * (`kafkaMicroservice.useGlobalInterceptors(...)` / `rmqMicroservice.useGlobalInterceptors(...)`)
 * — every `@MessagePattern`/`@EventPattern` handler on either transport runs inside the
 * `RequestContext` this opens. Reads the caller's `correlationId` (kept unchanged for the whole
 * distributed flow) and `traceId` (becomes this hop's `parentTraceId`) off the message headers
 * `KafkaProducer.send()`/`.emit()` attach on the sending side (see `[[kafka-rpc-plumbing]]`
 * memory), mints a fresh `traceId` for this hop, and logs entry/exit the same way
 * `LoggerInterceptor` does for HTTP requests on the gateway.
 */
@Injectable()
export class TraceContextInterceptor implements NestInterceptor {
  private readonly logger = new Logger(TraceContextInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'rpc') {
      return next.handle();
    }

    const { pattern, headers } = readRpcMetadata(context);

    const correlationId = readHeader(headers, CORRELATION_ID_HEADER) ?? randomUUID();
    const parentTraceId = readHeader(headers, PARENT_TRACE_ID_HEADER);
    const callerService = readHeader(headers, SERVICE_NAME_HEADER);
    const traceId = randomUUID();

    const startTime = Date.now();
    const trace = `correlationId=${correlationId} traceId=${traceId} from=${callerService ?? 'unknown'}`;
    this.logger.log(`[RPC] ${pattern} <- ${trace}`);

    return new Observable((subscriber) => {
      runWithRequestContext(
        { correlationId, traceId, parentTraceId, serviceName: SERVICE_NAME },
        () => {
          next.handle().subscribe({
            next: (value) => subscriber.next(value),
            error: (err: unknown) => {
              this.logger.error(`[RPC ERROR] ${pattern} ${trace} - ${(err as Error)?.message}`);
              subscriber.error(err);
            },
            complete: () => {
              this.logger.log(`[RPC] ${pattern} -> ${trace} - ${Date.now() - startTime}ms`);
              subscriber.complete();
            },
          });
        },
      );
    });
  }
}
