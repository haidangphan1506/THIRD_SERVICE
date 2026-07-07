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
import { CurrentUser } from '@packages/decorators';
import type { JwtUserRole } from '@packages/helpers';
import { chatRequestSchema, type ChatRequestDto } from './dto/ai-chat.dto';
import { AiService } from './ai.service';

@ApiTags('AI Chat')
@ApiBearerAuth('access-token')
@Controller('ai-chat')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Send a message to the AI assistant' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['message'],
      properties: {
        message: { type: 'string', example: 'Tôi có bao nhiêu chương trình học?' },
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
    @CurrentUser() user: { id: string; role: JwtUserRole },
  ) {
    return this.aiService.chat(dto, { userId: user.id, role: user.role });
  }
}
