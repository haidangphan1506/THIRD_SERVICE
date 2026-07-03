import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';
import {
  createSchedulesSchema,
  updateScheduleSchema,
  type CreateSchedulesDto,
  type UpdateScheduleDto,
} from '@packages/entities/schedule';
import { ScheduleService } from './schedule.service';

@ApiTags('Schedules')
@ApiBearerAuth('access-token')
@Controller('schedules')
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create schedules', description: 'Create weekly schedules for a class (e.g. 2 buổi/tuần)' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['classId', 'schedules'],
      properties: {
        classId: { type: 'string', format: 'uuid' },
        schedules: {
          type: 'array',
          minItems: 1,
          maxItems: 7,
          items: {
            type: 'object',
            required: ['dayOfWeek', 'startTime', 'endTime'],
            properties: {
              dayOfWeek: { type: 'string', enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'], example: 'MONDAY' },
              startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '18:00' },
              endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$', example: '19:30' },
              format: { type: 'string', enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
              location: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Schedules created' })
  async createBulk(
    @Body(new ZodValidationPipe<CreateSchedulesDto>(createSchedulesSchema))
    dto: CreateSchedulesDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.scheduleService.createBulk(dto, user.id);
  }

  @Put(':classId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Replace schedules', description: 'Replace all schedules for a class' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'array',
      minItems: 1,
      maxItems: 7,
      items: {
        type: 'object',
        required: ['dayOfWeek', 'startTime', 'endTime'],
        properties: {
          dayOfWeek: { type: 'string', enum: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'] },
          startTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          endTime: { type: 'string', pattern: '^\\d{2}:\\d{2}$' },
          format: { type: 'string', enum: ['ONLINE', 'OFFLINE'], default: 'ONLINE' },
          location: { type: 'string' },
        },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Schedules replaced' })
  async replaceByClass(
    @Param('classId') classId: string,
    @Body(new ZodValidationPipe(createSchedulesSchema.shape.schedules))
    schedules: CreateSchedulesDto['schedules'],
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.scheduleService.replaceByClass(
      classId,
      schedules.map((s) => ({ ...s, classId })),
      user.id,
    );
  }

  @Get(':classId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get class schedules' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Schedules fetched' })
  async findByClass(
    @Param('classId') classId: string,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.scheduleService.findByClass(classId, user.id);
  }

  @Put('item/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update a schedule' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Schedule updated' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateScheduleSchema))
    dto: UpdateScheduleDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.scheduleService.update(id, dto, user.id);
  }

  @Delete('item/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete a schedule' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Schedule deleted' })
  async delete(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.scheduleService.delete(id, user.id);
  }
}
