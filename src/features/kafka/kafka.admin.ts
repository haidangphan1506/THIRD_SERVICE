import { Logger } from '@nestjs/common';
import { Kafka } from 'kafkajs';

const logger = new Logger('KafkaAdmin');

/**
 * Explicitly creates any of `topics` that don't already exist, via the Kafka Admin API.
 * Relying on the broker's own `auto.create.topics.enable` is racy for our request-reply flow:
 * a consumer `subscribe()` to a not-yet-existing topic can send a metadata request that comes
 * back `UNKNOWN_TOPIC_OR_PARTITION` before the broker's async auto-create finishes, and that
 * error has crashed the process outright instead of being swallowed by kafkajs's retry. Call
 * this once, before `NestFactory.create()`/`ClientKafka.connect()`/`ServerKafka` binds any
 * listener, so every topic this service produces to, consumes from, or replies on already
 * exists by the time anything tries to use it.
 */
export async function ensureKafkaTopics(topics: string[]): Promise<void> {
  const uniqueTopics = [...new Set(topics)];
  if (uniqueTopics.length === 0) {
    return;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const kafkaConfig: any = {
    clientId: `${process.env.KAFKA_CLIENT_ID ?? 'third-prod-client'}-admin`,
    brokers: (process.env.KAFKA_BROKERS ?? 'kafka:9092').split(','),
    ssl: process.env.KAFKA_SSL === 'true',
  };

  if (process.env.KAFKA_SASL_ENABLED === 'true') {
    kafkaConfig.sasl = {
      mechanism: process.env.KAFKA_SASL_MECHANISM ?? 'plain',
      username: process.env.KAFKA_SASL_USERNAME ?? '',
      password: process.env.KAFKA_SASL_PASSWORD ?? '',
    };
  }

  const kafka = new Kafka(kafkaConfig);
  const admin = kafka.admin();
  await admin.connect();
  try {
    const existing = new Set(await admin.listTopics());
    const missing = uniqueTopics.filter((topic) => !existing.has(topic));
    if (missing.length === 0) {
      return;
    }
    logger.log(`Creating missing Kafka topics: ${missing.join(', ')}`);
    await admin.createTopics({
      topics: missing.map((topic) => ({ topic, numPartitions: 3, replicationFactor: 1 })),
      waitForLeaders: true,
    });
  } finally {
    await admin.disconnect();
  }
}
