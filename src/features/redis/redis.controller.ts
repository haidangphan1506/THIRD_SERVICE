import { Controller, Get, Query } from '@nestjs/common';
import { RedisService } from './redis.service';

@Controller('redis')
export class RedisController {
    constructor(private readonly redisService: RedisService) {}

    @Get('')
    async get(@Query('key') key: string): Promise<string | null> {
        return this.redisService.get(key);
    }
}
