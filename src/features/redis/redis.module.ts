import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisController } from './redis.controller';
import { RedisRpcController } from './redis.rpc.controller';

@Global()
@Module({
  controllers: [RedisController, RedisRpcController],
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
