import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
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
  createScheduleSchema,
  generateSessionsSchema,
  getSessionsQuerySchema,
  updateScheduleSchema,
  updateSessionSchema,
  type CreateScheduleDto,
  type GenerateSessionsDto,
  type GetSessionsQueryDto,
  type UpdateScheduleDto,
  type UpdateSessionDto,
} from '@packages/entities/session';
import { SessionService } from './session.service';

@ApiTags('Sessions')
@ApiBearerAuth('access-token')
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  // ── Schedules ──

  @Post('schedules')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create schedule',
    description: 'Create a recurring weekly schedule for a class (Stage 3)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['classId', 'dayOfWeek', 'startTime', 'endTime'],
      properties: {
        classId: { type: 'string', format: 'uuid' },
        dayOfWeek: {
          type: 'string',
          enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
          example: 'MONDAY',
        },
        startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '18:00' },
        endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '19:30' },
        format: { type: 'string', enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
        location: { type: 'string', description: 'Google Meet link or physical address' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Schedule created' })
  async createSchedule(
    @Body(new ZodValidationPipe<CreateScheduleDto>(createScheduleSchema))
    dto: CreateScheduleDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.createSchedule(dto, user.id);
  }

  @Get('schedules/:classId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get class schedules' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Schedules fetched' })
  async getSchedules(
    @Param('classId') classId: string,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.getSchedulesByClass(classId, user.id);
  }

  @Put('schedules/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update schedule' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        dayOfWeek: {
          type: 'string',
          enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        },
        startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
        endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
        format: { type: 'string', enum: ['ONLINE', 'OFFLINE'] },
        location: { type: 'string' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Schedule updated' })
  async updateSchedule(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema))
    dto: UpdateScheduleDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.updateSchedule(id, dto, user.id);
  }

  @Delete('schedules/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete schedule' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Schedule deleted' })
  async deleteSchedule(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.sessionService.deleteSchedule(id, user.id);
  }

  // ── Session Generation ──

  @Post('generate')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Generate sessions',
    description: 'Generate multiple sessions at once (buổi mới)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['classId', 'dayOfWeek', 'startTime', 'endTime', 'range'],
      properties: {
        classId: { type: 'string', format: 'uuid' },
        dayOfWeek: {
          type: 'string',
          enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
        },
        startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '18:00' },
        endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '19:30' },
        format: { type: 'string', enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
        location: { type: 'string' },
        range: {
          type: 'string',
          enum: ['this_week', '4_weeks', '3_months', 'custom'],
          example: '4_weeks',
        },
        startDate: { type: 'string', format: 'date', description: 'Required if range=custom' },
        endDate: { type: 'string', format: 'date', description: 'Required if range=custom' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Sessions generated' })
  async generateSessions(
    @Body(new ZodValidationPipe<GenerateSessionsDto>(generateSessionsSchema))
    dto: GenerateSessionsDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.generateSessions(dto, user.id);
  }

  // ── Sessions ──

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List sessions', description: 'Get paginated sessions list' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'classId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'status', required: false, enum: ['UPCOMING', 'COMPLETED', 'CANCELLED'] })
  @ApiQuery({ name: 'from', required: false, type: String, format: 'date' })
  @ApiQuery({ name: 'to', required: false, type: String, format: 'date' })
  @SwaggerResponse({ status: 200, description: 'Sessions fetched' })
  async findAll(
    @Query(new ZodValidationPipe<GetSessionsQueryDto>(getSessionsQuerySchema))
    query: GetSessionsQueryDto,
  ) {
    return this.sessionService.findAll(query);
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get session detail' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Session detail' })
  async findById(@Param('id') id: string) {
    return this.sessionService.findById(id);
  }

  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update session' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        date: { type: 'string', format: 'date-time' },
        startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
        endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
        format: { type: 'string', enum: ['ONLINE', 'OFFLINE'] },
        location: { type: 'string' },
        status: { type: 'string', enum: ['UPCOMING', 'COMPLETED', 'CANCELLED'] },
        note: { type: 'string' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Session updated' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateSessionSchema))
    dto: UpdateSessionDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.update(id, dto, user.id);
  }

  @Patch(':id/status')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update session status' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: { type: 'string', enum: ['UPCOMING', 'COMPLETED', 'CANCELLED'] },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Status updated' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.sessionService.updateStatus(id, status, user.id);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete session' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Session deleted' })
  async delete(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.sessionService.delete(id, user.id);
  }
}
