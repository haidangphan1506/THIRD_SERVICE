import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from '@packages/decorators';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

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

  @Public()
  @Get('/rmq')
  @ApiOperation({
    summary: 'Health check RABBITMQ',
    description: 'Reports the last health-check message received over RabbitMQ',
  })
  @SwaggerResponse({
    status: 200,
    description: 'Last received RabbitMQ health-check message',
    schema: {
      type: 'object',
      properties: {
        received: { type: 'boolean', example: true },
        lastHealthCheck: {
          type: 'object',
          nullable: true,
          properties: {
            publishedAt: { type: 'string', example: '2024-01-01T00:00:00.000Z' },
            receivedAt: { type: 'string', example: '2024-01-01T00:00:00.100Z' },
          },
        },
      },
    },
  })
  getRabbitMqRes() {
    return this.appService.getRabbitMqStatus();
  }
}
