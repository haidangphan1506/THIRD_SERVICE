import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';
import {
  createExerciseSchema,
  getExerciseQuerySchema,
  type CreateExerciseDto,
  type getExerciseDto,
} from '@packages/entities/exercise';
import { ExerciseService } from './exercise.service';

@ApiTags('Exercises')
@ApiBearerAuth('access-token')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create exercise', description: 'Submit an exercise for a session' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['tutorId', 'sessionId', 'lessonId', 'studentId'],
      properties: {
        tutorId: { type: 'string', format: 'uuid' },
        sessionId: { type: 'string', format: 'uuid' },
        lessonId: { type: 'string', format: 'uuid' },
        studentId: { type: 'string', format: 'uuid' },
        issueUrls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              key: { type: 'string' },
            },
          },
        },
        exerciseUrls: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              url: { type: 'string' },
              key: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Exercise created' })
  async create(
    @Body(new ZodValidationPipe<CreateExerciseDto>(createExerciseSchema))
    dto: CreateExerciseDto,
  ) {
    return this.exerciseService.create(dto);
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List exercises' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sessionId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'studentId', required: false, type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Exercises fetched' })
  async findAll(
    @Query(new ZodValidationPipe<getExerciseDto>(getExerciseQuerySchema))
    query: getExerciseDto,
    @Query('sessionId') sessionId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.exerciseService.findAll({ ...query, sessionId, studentId });
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get exercise by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Exercise detail' })
  @SwaggerResponse({ status: 404, description: 'Exercise not found' })
  async findById(@Param('id') id: string) {
    return this.exerciseService.findById(id);
  }

  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update exercise' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Exercise updated' })
  @SwaggerResponse({ status: 404, description: 'Exercise not found' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe<CreateExerciseDto>(createExerciseSchema))
    dto: CreateExerciseDto,
    @CurrentUser() _user: Record<string, string>,
  ) {
    return this.exerciseService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete exercise' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Exercise deleted' })
  @SwaggerResponse({ status: 404, description: 'Exercise not found' })
  async delete(@Param('id') id: string) {
    return this.exerciseService.delete(id);
  }
}
