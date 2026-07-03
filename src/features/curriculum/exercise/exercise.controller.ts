import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ApiResponse, CurrentUser } from '@packages/decorators';
import { StatusCodes } from 'http-status-codes';

import { CreateAssignmentDto, UpdateAssignmentDto } from '@packages/entities';
import { ExerciseService } from './exercise.service';

@ApiTags('Exercise')
@ApiBearerAuth('access-token')
@Controller('exercises')
export class ExerciseController {
  private readonly logger = new Logger(ExerciseController.name);
  constructor(private readonly exerciseService: ExerciseService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create exercise', description: 'Create a new exercise' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Problem 1' },
        description: { type: 'string', example: '' },
        score: { type: 'number', example: 10 },
        isHidden: { type: 'boolean', example: false },
      },
    },
  })
  @SwaggerResponse({ status: StatusCodes.CREATED, description: 'Exercise created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Exercise created successfully' })
  async createExerciseController(
    @Body() createExerciseDto: CreateAssignmentDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return await this.exerciseService.createExerciseService({ userId: user.id, createExerciseDto });
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get all exercises', description: 'Retrieve all exercises' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'All exercises retrieved successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'All exercises retrieved successfully' })
  async getAllExercisesController(@CurrentUser() user: Record<string, string>) {
    return await this.exerciseService.getAllExercisesService({ userId: user.id });
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get exercise by id', description: 'Get a specific exercise by its ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Exercise retrieved successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Exercise retrieved successfully' })
  async getExerciseByIdController(@Param('id') id: string) {
    return await this.exerciseService.getExerciseByIdService(id);
  }

  @Patch(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update exercise', description: 'Update exercise information' })
  @ApiParam({ name: 'id', description: 'Exercise ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Exercise updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Exercise updated successfully' })
  async updateExerciseController(@Param('id') id: string, @Body() updateData: UpdateAssignmentDto) {
    return await this.exerciseService.updateExerciseService(id, updateData);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete exercise', description: 'Delete exercise by ID' })
  @ApiParam({ name: 'id', description: 'Exercise ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Exercise deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Exercise deleted successfully' })
  async deleteExerciseController(@Param('id') id: string) {
    return await this.exerciseService.deleteExerciseService(id);
  }
}
