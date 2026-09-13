import { Controller, UseFilters } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RpcExceptionFilter } from '@packages/filters';
import { RedisService } from './redis.service';

/**
 * Message-pattern mirror of `RedisController` — reached only by the gateway's `THIRD_SERVICE`
 * `ClientProxy` over RabbitMQ (RMQ transport, `third_queue`). Delegates to the same, unmodified
 * `RedisService` the HTTP controller uses; no business logic lives here.
 */
@UseFilters(RpcExceptionFilter)
@Controller()
export class RedisRpcController {
  constructor(private readonly redisService: RedisService) {}

  @MessagePattern('redis.get')
  get(@Payload() payload: { key: string }) {
    return this.redisService.get(payload.key);
  }
}