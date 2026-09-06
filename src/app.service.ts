import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQConsumer } from './features/rabbitmq/rabbitmq.consumer';

const HEALTH_CHECK_ROUTING_KEY = 'health.check';
const HEALTH_CHECK_QUEUE = 'third-service.health-check';

export interface HealthCheckPayload {
  publishedAt: string;
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private lastHealthCheck: (HealthCheckPayload & { receivedAt: string }) | null = null;

  constructor(private readonly rabbitMQConsumer: RabbitMQConsumer) {}

  async onModuleInit() {
    await this.rabbitMQConsumer.subscribe<HealthCheckPayload>(
      HEALTH_CHECK_ROUTING_KEY,
      HEALTH_CHECK_QUEUE,
      (payload) => {
        this.lastHealthCheck = { ...payload, receivedAt: new Date().toISOString() };
        this.logger.log(`Health-check message received: ${JSON.stringify(payload)}`);
      },
    );
  }

  getHello(): string {
    return 'Hello World!';
  }

  getRabbitMqStatus(): {
    received: boolean;
    lastHealthCheck: (HealthCheckPayload & { receivedAt: string }) | null;
  } {
    return { received: this.lastHealthCheck !== null, lastHealthCheck: this.lastHealthCheck };
  }
}
