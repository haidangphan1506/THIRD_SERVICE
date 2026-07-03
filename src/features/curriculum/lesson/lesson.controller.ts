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

import { CreateLessonDto, UpdateLessonDto } from '@packages/entities';
import { LessonService } from './lesson.service';

@ApiTags('Lesson')
@ApiBearerAuth('access-token')
@Controller('lessons')
export class LessonController {
  private readonly logger = new Logger(LessonController.name);
  constructor(private readonly lessonService: LessonService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create lesson', description: 'Create a new lesson' })
  @ApiBody({ schema: { required: ['title'], properties: { title: { type: 'string', example: 'Introduction' }, description: { type: 'string', example: '' }, order: { type: 'number', example: 1 } } } })
  @SwaggerResponse({ status: StatusCodes.CREATED, description: 'Lesson created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Lesson created successfully' })
  async createLessonController(
    @Body() createLessonDto: CreateLessonDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return await this.lessonService.createLessonService({ userId: user.id, createLessonDto });
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get all lessons', description: 'Retrieve all lessons' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'All lessons retrieved successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'All lessons retrieved successfully' })
  async getAllLessonsController(@CurrentUser() user: Record<string, string>) {
    return await this.lessonService.getAllLessonsService({ userId: user.id });
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get lesson by id', description: 'Get a specific lesson by its ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Lesson retrieved successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Lesson retrieved successfully' })
  async getLessonByIdController(@Param('id') id: string) {
    return await this.lessonService.getLessonByIdService(id);
  }

  @Patch(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update lesson', description: 'Update lesson information' })
  @ApiParam({ name: 'id', description: 'Lesson ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Lesson updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Lesson updated successfully' })
  async updateLessonController(@Param('id') id: string, @Body() updateData: UpdateLessonDto) {
    return await this.lessonService.updateLessonService(id, updateData);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete lesson', description: 'Delete lesson by ID' })
  @ApiParam({ name: 'id', description: 'Lesson ID', type: 'string' })
  @SwaggerResponse({ status: StatusCodes.OK, description: 'Lesson deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Lesson deleted successfully' })
  async deleteLessonController(@Param('id') id: string) {
    return await this.lessonService.deleteLessonService(id);
  }
}
