import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { RedisService } from './features/redis/redis.service';

@ApiTags('Health')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);
  constructor(
    private readonly appService: AppService,
    private readonly redisService: RedisService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health check', description: 'Returns a simple health check response' })
  @SwaggerResponse({
    status: 200,
    description: 'Server is running',
    schema: { type: 'string', example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @MessagePattern('health.redis')
  async checkRedisHealth(@Payload() payload?: { fetchData?: boolean }): Promise<unknown> {
    this.logger.log('[HEALTH] Checking Redis connection and cache data');
    try {
      const shouldFetchData = payload?.fetchData ?? false;

      // Test Redis connection
      const pong = await this.redisService.client.ping();

      // Get Redis info (memory, keys count, etc.)
      const info = await this.redisService.client.info('memory');
      const dbsize = await this.redisService.client.dbsize();

      // Get all keys for sample
      let sampleKeys: string[] = [];
      if (shouldFetchData) {
        const allKeys = await this.redisService.client.keys('*');
        sampleKeys = allKeys.slice(0, 10); // Get first 10 keys
      }

      const stats = {
        status: 'healthy',
        cache: 'Redis',
        connection: 'connected',
        timestamp: new Date().toISOString(),
        message: 'Redis connection is healthy',
        ping: pong,
        stats: {
          totalKeys: dbsize,
          info: info.split('\r\n').slice(0, 5).join(', '), // Sample of info
        },
      };

      if (shouldFetchData && sampleKeys.length > 0) {
        // Get values for sample keys
        const keyValues: Record<string, unknown> = {};
        for (const key of sampleKeys) {
          try {
            const value = await this.redisService.client.get(key);
            keyValues[key] = value;
          } catch {
            keyValues[key] = null;
          }
        }
        stats['sampleKeys'] = keyValues;
      }

      this.logger.log('[HEALTH] Redis connection OK, cache data retrieved');
      return stats;
    } catch (error) {
      this.logger.error(`[HEALTH] Redis connection failed: ${error}`);
      return {
        status: 'unhealthy',
        cache: 'Redis',
        connection: 'failed',
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : 'Redis connection failed',
      };
    }
  }
}
