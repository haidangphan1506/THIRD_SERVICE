import { Global, Module } from '@nestjs/common';

import { RabbitMQConsumer } from './rabbitmq.consumer';
import { RabbitMQProducer } from './rabbitmq.producer';
import { RabbitMQService } from './rabbitmq.service';

@Global()
@Module({
  providers: [RabbitMQService, RabbitMQProducer, RabbitMQConsumer],
  exports: [RabbitMQService, RabbitMQProducer, RabbitMQConsumer],
})
export class RabbitMQModule {}
