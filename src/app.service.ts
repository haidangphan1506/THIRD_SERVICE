import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { RabbitMQConsumer } from './features/rabbitmq/rabbitmq.consumer';
import { RedisService } from './features/redis/redis.service';

const HEALTH_CHECK_ROUTING_KEY = 'health.check';
const HEALTH_CHECK_QUEUE = 'third-service.health-check';

const LOGIN_SESSION_ROUTING_KEY = 'auth.login.session';
const LOGIN_SESSION_QUEUE = 'third-service.auth-login-session';
const loginSessionRedisKey = (userId: string) => `auth:login-session:${userId}`;

export interface HealthCheckPayload {
  publishedAt: string;
}

export interface LoginSessionPayload {
  userId: string;
  email: string;
  role: string;
  accessToken: string;
  ttlSeconds: number;
  loggedInAt: string;
}

@Injectable()
export class AppService implements OnModuleInit {
  private readonly logger = new Logger(AppService.name);
  private lastHealthCheck: (HealthCheckPayload & { receivedAt: string }) | null = null;

  constructor(
    private readonly rabbitMQConsumer: RabbitMQConsumer,
    private readonly redisService: RedisService,
  ) {}

  async onModuleInit() {
    await this.rabbitMQConsumer.subscribe<HealthCheckPayload>(
      HEALTH_CHECK_ROUTING_KEY,
      HEALTH_CHECK_QUEUE,
      (payload) => {
        this.lastHealthCheck = { ...payload, receivedAt: new Date().toISOString() };
        this.logger.log(`Health-check message received: ${JSON.stringify(payload)}`);
      },
    );

    await this.rabbitMQConsumer.subscribe<LoginSessionPayload>(
      LOGIN_SESSION_ROUTING_KEY,
      LOGIN_SESSION_QUEUE,
      async (payload) => {
        await this.redisService.set(
          loginSessionRedisKey(payload.userId),
          JSON.stringify(payload),
          payload.ttlSeconds,
        );
        this.logger.log(`Cached login session in Redis for user=${payload.userId}`);
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
