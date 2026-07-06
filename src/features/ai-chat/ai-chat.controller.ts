import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { chatRequestSchema, type ChatRequestDto } from '@packages/entities/ai-chat';
import { AiChatService } from './ai-chat.service';

@ApiTags('AI Chat')
@ApiBearerAuth('access-token')
@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  @Post('chat')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Send a message to AI assistant' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'Tôi có lịch học hôm nay không?' },
        history: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: { type: 'string', enum: ['user', 'assistant'] },
              content: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'AI response' })
  async chat(
    @Body(new ZodValidationPipe<ChatRequestDto>(chatRequestSchema))
    dto: ChatRequestDto,
  ) {
    return this.aiChatService.chat(dto);
  }
}
