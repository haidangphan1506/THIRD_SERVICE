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
  createCurriculumSchema,
  updateCurriculumSchema,
  type CreateCurriculumDto,
  type UpdateCurriculumDto,
} from '@packages/entities/curriculum';
import { CurriculumService } from './curriculum.service';

@ApiTags('Curriculum')
@ApiBearerAuth('access-token')
@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // ── Chapter ──

  // TODO : Get chapters by class
  @Get(':classId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Get curriculum',
    description: 'Get lesson plan for a class, grouped by lesson number',
  })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Chapters fetched' })
  async getChapters(
    @Param('classId') classId: string,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.getChaptersByClass(classId, user.id);
  }

  // TODO : Create a new chapter
  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create chapter' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['classId', 'lesson', 'name'],
      properties: {
        classId: { type: 'string', format: 'uuid' },
        lesson: { type: 'number', example: 1, description: 'Lesson number' },
        name: { type: 'string', maxLength: 255, example: 'Bai 1: Ham so' },
        lecture: { type: 'string', description: 'Lecture content/link' },
        assignment: { type: 'string', description: 'Assignment content/link' },
        status: { type: 'string', enum: ['COMPLETED', 'UPCOMING'], default: 'UPCOMING' },
        note: { type: 'string' },
        order: { type: 'number', default: 0 },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Chapter created' })
  async createChapter(
    @Body(new ZodValidationPipe<CreateCurriculumDto>(createCurriculumSchema))
    dto: CreateCurriculumDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.createChapter(dto, user.id);
  }

  // TODO : Update chapter
  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update chapter' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Chapter updated' })
  async updateChapter(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCurriculumSchema))
    dto: UpdateCurriculumDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.updateChapter(id, dto, user.id);
  }

  // TODO : Delete chapter
  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete chapter' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Chapter deleted' })
  async deleteChapter(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.deleteChapter(id, user.id);
  }

  // ── Lesson ──

  // TODO : Get lessons by class
  @Get(':classId/lessons')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get lessons' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lessons fetched' })
  async getLessons(
    @Param('classId') classId: string,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.getLessonsByClass(classId, user.id);
  }

  // TODO : Create a new lesson
  @Post(':classId/lessons')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create lesson' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 201, description: 'Lesson created' })
  async createLesson(
    @Param('classId') classId: string,
    @Body(new ZodValidationPipe<CreateCurriculumDto>(createCurriculumSchema))
    dto: CreateCurriculumDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.createLesson({ ...dto, classId }, user.id);
  }

  // TODO : Update lesson
  @Put('lessons/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update lesson' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lesson updated' })
  async updateLesson(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCurriculumSchema))
    dto: UpdateCurriculumDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.updateLesson(id, dto, user.id);
  }

  // TODO : Delete lesson
  @Delete('lessons/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lesson deleted' })
  async deleteLesson(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.deleteLesson(id, user.id);
  }
}
