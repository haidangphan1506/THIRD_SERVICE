import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UseGuards } from '@nestjs/common';
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
import { CurrentUser, Roles } from '@packages/decorators';
import { RolesGuard } from '@packages/guards';
import {
  type CreateCurriculumDto,
  createCurriculumSchema,
  type UpdateCurriculumDto,
  updateCurriculumSchema,
  type CreateLessonDto,
  createLessonSchema,
  type UpdateLessonDto,
  updateLessonSchema,
} from '@packages/entities';
import { CurriculumService } from './curriculum.service';

@ApiTags('Curriculum')
@ApiBearerAuth('access-token')
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // ── Chapter ──

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

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create chapter' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', example: 'Chương 1 : Giải tích cơ bản' },
        description: { type: 'string', example: '' },
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

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete chapter' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Chapter deleted' })
  async deleteChapter(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.deleteChapter(id, user.id);
  }

  // ── Lesson ──

  @Get(':classId/lessons')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get lessons' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lessons fetched' })
  async getLessons(@Param('classId') classId: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.getLessonsByClass(classId, user.id);
  }

  @Post(':classId/lessons')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create lesson' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 201, description: 'Lesson created' })
  async createLesson(
    @Param('classId') classId: string,
    @Body(new ZodValidationPipe<CreateLessonDto>(createLessonSchema))
    dto: CreateLessonDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.createLesson({ ...dto, classId }, user.id);
  }

  @Put('lessons/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update lesson' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lesson updated' })
  async updateLesson(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateLessonSchema))
    dto: UpdateLessonDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.updateLesson(id, dto, user.id);
  }

  @Delete('lessons/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete lesson' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lesson deleted' })
  async deleteLesson(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.deleteLesson(id, user.id);
  }
}
