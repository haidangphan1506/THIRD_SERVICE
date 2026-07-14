import { Body, Controller, Delete, Get, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';
import type { JwtUserRole } from '@packages/helpers';
import {
  chatRequestSchema,
  getHistoryQuerySchema,
  type ChatRequestDto,
  type GetHistoryQueryDto,
} from './dto/ai-chat.dto';
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

  @Get('history')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get the current user’s AI chat history' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @SwaggerResponse({ status: 200, description: 'Chat history' })
  async getHistory(
    @Query(new ZodValidationPipe<GetHistoryQueryDto>(getHistoryQuerySchema))
    query: GetHistoryQueryDto,
    @CurrentUser() user: { id: string; role: JwtUserRole },
  ) {
    const messages = await this.aiService.getHistory(user.id, query.limit);
    return { messages };
  }

  @Delete('history')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Clear the current user’s AI chat history' })
  @SwaggerResponse({ status: 200, description: 'History cleared' })
  async clearHistory(@CurrentUser() user: { id: string; role: JwtUserRole }) {
    await this.aiService.clearHistory(user.id);
    return { cleared: true };
  }
}
