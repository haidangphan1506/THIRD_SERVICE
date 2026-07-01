import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
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
  removeLessonFileSchema,
} from '@packages/entities';
import { CurriculumService } from './curriculum.service';
import type { MulterFile } from '../uploads/upload.interface';

@ApiTags('Curriculum')
@ApiBearerAuth('access-token')
@Controller('curriculum')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // ── Grades ──

  @Get('grades')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get all grades', description: 'Returns 12 grades (Lớp 1 → Lớp 12)' })
  @SwaggerResponse({ status: 200, description: 'Grades fetched' })
  async getGrades() {
    return this.curriculumService.getGrades();
  }

  // ── By Grade ──

  @Get('by-grade/:gradeId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get curriculums by grade' })
  @ApiParam({ name: 'gradeId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Curriculums fetched by grade' })
  async getChaptersByGrade(@Param('gradeId') gradeId: string, @CurrentUser() _user: Record<string, string>) {
    return this.curriculumService.getChaptersByGrade(gradeId);
  }

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
      required: ['title', 'gradeId'],
      properties: {
        title: { type: 'string', example: 'Chương 1 : Giải tích cơ bản' },
        description: { type: 'string', example: '' },
        gradeId: { type: 'string', format: 'uuid', example: 'uuid-of-grade' },
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

  @Get('lessons/by-curriculum/:curriculumId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get lessons by curriculum', description: 'Get all lessons in a curriculum' })
  @ApiParam({ name: 'curriculumId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lessons fetched' })
  async getLessonsByCurriculum(@Param('curriculumId') curriculumId: string, @CurrentUser() _user: Record<string, string>) {
    return this.curriculumService.getLessonsByCurriculum(curriculumId);
  }

  @Get('lessons/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get lesson detail' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lesson detail fetched' })
  async getLessonDetail(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.getLessonDetail(id, user.id);
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

  // ── Lesson File Uploads ──

  @Post('lessons/:id/theory')
  @UseInterceptors(FilesInterceptor('files', 20))
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Upload theory files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['files'], properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @SwaggerResponse({ status: 201, description: 'Theory files uploaded' })
  async uploadTheoryFiles(
    @Param('id') id: string,
    @UploadedFiles() files: MulterFile[],
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.uploadTheoryFiles(id, files, user.id);
  }

  @Post('lessons/:id/exercises')
  @UseInterceptors(FilesInterceptor('files', 20))
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Upload exercise files' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['files'], properties: { files: { type: 'array', items: { type: 'string', format: 'binary' } } } } })
  @SwaggerResponse({ status: 201, description: 'Exercise files uploaded' })
  async uploadExerciseFiles(
    @Param('id') id: string,
    @UploadedFiles() files: MulterFile[],
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.uploadExerciseFiles(id, files, user.id);
  }

  @Delete('lessons/:id/theory')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Remove theory file URL' })
  @SwaggerResponse({ status: 200, description: 'Theory file URL removed' })
  async removeTheoryFile(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: Record<string, string>,
  ) {
    const { url } = removeLessonFileSchema.parse(body);
    return this.curriculumService.removeTheoryFile(id, { url }, user.id);
  }

  @Delete('lessons/:id/exercises')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Remove exercise file URL' })
  @SwaggerResponse({ status: 200, description: 'Exercise file URL removed' })
  async removeExerciseFile(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: Record<string, string>,
  ) {
    const { url } = removeLessonFileSchema.parse(body);
    return this.curriculumService.removeExerciseFile(id, { url }, user.id);
  }
}
