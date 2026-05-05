import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis, type RedisOptions } from 'ioredis';

/** Tùy chọn chung: lazyConnect + offline queue cho phép lệnh đầu chờ kết nối (tránh "Stream isn't writeable"). */
const connectionOptions = {
  lazyConnect: true,
  connectTimeout: 10_000,
  /** true (mặc định ioredis): lệnh chờ socket ready; false + lazyConnect dễ lỗi trước khi connect xong */
  enableOfflineQueue: true,
  /** Giảm MaxRetriesPerRequestError khi đang reconnect so với mặc định 3 */
  maxRetriesPerRequest: null,
} as const satisfies Pick<
  RedisOptions,
  'lazyConnect' | 'connectTimeout' | 'enableOfflineQueue' | 'maxRetriesPerRequest'
>;

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly endpointLabel: string;
  readonly client: Redis;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL')?.trim();

    if (url && url.length > 0) {
      this.endpointLabel = 'REDIS_URL';
      this.client = new Redis(url, { ...connectionOptions });
    } else {
      const host = this.configService.get<string>('REDIS_HOST')?.trim() || 'localhost';
      const port = Number(this.configService.get<string>('REDIS_PORT')?.trim() || '6380');
      const password = this.configService.get<string>('REDIS_PASSWORD')?.trim();
      this.endpointLabel = `${host}:${Number.isFinite(port) ? port : 6380}`;
      const opts: RedisOptions = {
        ...connectionOptions,
        host,
        port: Number.isFinite(port) ? port : 6380,
        password: password && password.length > 0 ? password : undefined,
      };
      this.client = new Redis(opts);
    }

    this.client.on('error', (err: Error) => {
      this.logger.warn(
        `Redis (${this.endpointLabel}): ${err.message} — kiểm tra Redis đang chạy và REDIS_HOST/REDIS_PORT/REDIS_URL (compose mặc định map cổng host 6380).`,
      );
    });
  }

  async get(key: string): Promise<string | null> {
    return await this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await this.client.set(key, value, 'EX', ttlSeconds);
      return;
    }
    await this.client.set(key, value);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) {
      return 0;
    }
    return await this.client.del(...keys);
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}
