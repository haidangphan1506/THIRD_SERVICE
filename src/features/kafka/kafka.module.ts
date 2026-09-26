import { Global, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { logLevel } from 'kafkajs';
import { KAFKA_PRODUCER } from './kafka.constants';
import { KafkaProducer } from './kafka.producer';
import { KafkaConsumer } from './kafka.consumer';

function buildKafkaClientConfig() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const clientConfig: any = {
    clientId: process.env.KAFKA_CLIENT_ID ?? 'third-prod-client',
    brokers: (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(','),
    connectionTimeout: parseInt(process.env.KAFKA_CONNECTION_TIMEOUT ?? '15000'),
    requestTimeout: parseInt(process.env.KAFKA_REQUEST_TIMEOUT ?? '30000'),
    retries: {
      initialRetryTime: 100,
      maxRetryTime: 8000,
      multiplier: 2,
      randomizationFactor: 0.2,
      factor: 0.2,
    },
    ssl: process.env.KAFKA_SSL === 'true',
    logLevel: logLevel.WARN,
  };

  if (process.env.KAFKA_SASL_ENABLED === 'true') {
    clientConfig.sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM ?? 'plain',
      username: process.env.KAFKA_SASL_USERNAME ?? '',
      password: process.env.KAFKA_SASL_PASSWORD ?? '',
    };
  }

  return clientConfig;
}

@Global()
@Module({
  imports: [
    ClientsModule.register([
      {
        name: KAFKA_PRODUCER,
        transport: Transport.KAFKA,
        options: {
          client: buildKafkaClientConfig(),
          consumer: {
            groupId: process.env.KAFKA_GROUP_ID ?? 'third-service',
            sessionTimeout: parseInt(process.env.KAFKA_SESSION_TIMEOUT ?? '30000'),
            rebalanceTimeout: parseInt(process.env.KAFKA_REBALANCE_TIMEOUT ?? '60000'),
            heartbeatInterval: parseInt(process.env.KAFKA_HEARTBEAT_INTERVAL ?? '3000'),
          },
        },
      },
    ]),
  ],
  providers: [KafkaProducer, KafkaConsumer],
  exports: [KafkaProducer, KafkaConsumer],
})
export class KafkaModule {}
