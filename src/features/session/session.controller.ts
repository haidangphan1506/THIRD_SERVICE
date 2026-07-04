import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiQuery,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';
import {
  createSessionSchema,
  updateSessionSchema,
  getSessionsQuerySchema,
  type CreateSessionDto,
  type UpdateSessionDto,
  type GetSessionsQueryDto,
} from '@packages/entities/session';
import { SessionService } from './session.service';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create session', description: 'Create a new class session' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['classId', 'sessionNumber', 'startAt', 'endAt'],
      properties: {
        classId: { type: 'string', format: 'uuid' },
        lessonId: { type: 'string', format: 'uuid', nullable: true },
        tutorId: { type: 'string', format: 'uuid', nullable: true, description: 'Substitute tutor' },
        title: { type: 'string', maxLength: 255 },
        description: { type: 'string' },
        sessionNumber: { type: 'integer', minimum: 1, example: 1 },
        theoryUrls: {
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' }, url: { type: 'string' }, key: { type: 'string' } } },
        },
        exerciseUrls: {
          type: 'array',
          items: { type: 'object', properties: { name: { type: 'string' }, url: { type: 'string' }, key: { type: 'string' } } },
        },
        startAt: { type: 'string', format: 'date-time', example: '2026-07-10T08:00:00.000Z' },
        endAt: { type: 'string', format: 'date-time', example: '2026-07-10T10:00:00.000Z' },
        location: { type: 'string' },
        status: { type: 'string', enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'], default: 'SCHEDULED' },
        note: { type: 'string' },
        actualStartAt: { type: 'string', format: 'date-time', nullable: true },
        actualEndAt: { type: 'string', format: 'date-time', nullable: true },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Session created' })
  async create(
    @Body(new ZodValidationPipe<CreateSessionDto>(createSessionSchema))
    dto: CreateSessionDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.create(dto, user.id);
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List sessions', description: 'Get paginated sessions for a class' })
  @ApiQuery({ name: 'classId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'status', required: false, enum: ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED', 'POSTPONED'] })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'ISO date string' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'ISO date string' })
  @SwaggerResponse({ status: 200, description: 'Sessions fetched' })
  async findAll(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetSessionsQueryDto>(getSessionsQuerySchema))
    query: GetSessionsQueryDto,
  ) {
    return this.sessionService.findAll(user.id, query);
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get session detail' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Session detail' })
  @SwaggerResponse({ status: 404, description: 'Session not found' })
  async findById(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return this.sessionService.findById(id, user.id);
  }

  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update session' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Session updated' })
  @SwaggerResponse({ status: 404, description: 'Session not found' })
  async update(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateSessionDto>(updateSessionSchema))
    dto: UpdateSessionDto,
  ) {
    return this.sessionService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete session' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Session deleted' })
  @SwaggerResponse({ status: 404, description: 'Session not found' })
  async delete(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return this.sessionService.delete(id, user.id);
  }
}
