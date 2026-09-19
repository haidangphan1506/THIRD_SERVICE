import { Controller } from '@nestjs/common';
import { EventPattern, MessagePattern, Payload } from '@nestjs/microservices';
import { RedisService } from './redis.service';

/**
 * Message-pattern mirror of `RedisController` — reached by the gateway's/`user`'s Kafka
 * `KafkaProducer` (RMQ `third_queue` too, if a caller still uses that transport). Delegates to
 * the same, unmodified `RedisService` the HTTP controller uses; no business logic lives here.
 */
@Controller()
export class RedisRpcController {
  constructor(private readonly redisService: RedisService) {}

  @MessagePattern('redis.get')
  get(@Payload() payload: { key: string }) {
    return this.redisService.get(payload.key);
  }

  @MessagePattern('redis.set')
  set(@Payload() payload: { key: string; value: string; ttlSeconds?: number }) {
    return this.redisService.set(payload.key, payload.value, payload.ttlSeconds);
  }

  @EventPattern('redis.del')
  del(@Payload() payload: { keys: string[] }) {
    return this.redisService.del(...payload.keys);
  }
}