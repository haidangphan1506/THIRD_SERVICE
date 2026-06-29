import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse as SwaggerResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { CurriculumService } from './curriculum.service';
import { LessonService } from './lesson.service';
import {
  type CreateCurriculumDto,
  createCurriculumSchema,
  type UpdateCurriculumDto,
  updateCurriculumSchema,
  type GetCurriculumsQueryDto,
  getCurriculumsQuerySchema,
  type CreateLessonDto,
  createLessonSchema,
  type UpdateLessonDto,
  updateLessonSchema,
} from '@packages/entities';
import { ZodValidationPipe } from '@packages/pipes';
import { ApiResponse, CurrentUser, Roles } from '@packages/decorators';
import { RolesGuard } from '@packages/guards';

@ApiTags('Curriculum')
@ApiBearerAuth('access-token')
@Controller('curriculum')
export class CurriculumController {
  constructor(
    private readonly curriculumService: CurriculumService,
    private readonly lessonService: LessonService,
  ) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create new curriculum',
    description: 'Create new curriculum successfully',
  })
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
  @SwaggerResponse({ status: 201, description: 'Curriculum created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Curriculum created successfully' })
  async createCurriculumController(
    @CurrentUser() user: Record<string, string>,
    @Body(new ZodValidationPipe<CreateCurriculumDto>(createCurriculumSchema))
    createCurriculumDto: CreateCurriculumDto,
  ) {
    return await this.curriculumService.createCurriculumService({
      userId: user.id,
      createCurriculumDto,
    });
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List curriculums', description: 'Get a paginated list of curriculums' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by title' })
  @SwaggerResponse({ status: 200, description: 'Curriculums fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Curriculums fetched successfully' })
  async getCurriculumsController(
    @Query(new ZodValidationPipe<GetCurriculumsQueryDto>(getCurriculumsQuerySchema))
    query: GetCurriculumsQueryDto,
  ) {
    return await this.curriculumService.getAllCurriculumService({ query });
  }

  @Get('/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get curriculum by ID', description: 'Get a curriculum with its lessons' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Curriculum ID' })
  @SwaggerResponse({ status: 200, description: 'Curriculum fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Curriculum fetched successfully' })
  async getCurriculumByIdController(@Param('id') id: string) {
    const curriculum = await this.curriculumService.getCurriculumByIdService({ id });
    const lessons = await this.lessonService.getLessonsService({ curriculumId: id });
    return { ...curriculum, lessons };
  }

  @Put('/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Update curriculum', description: 'Update a curriculum by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Curriculum ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Chương 1 : Giải tích cơ bản' },
        description: { type: 'string', example: '' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Curriculum updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Curriculum updated successfully' })
  async updateCurriculumController(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateCurriculumDto>(updateCurriculumSchema))
    updateCurriculumDto: UpdateCurriculumDto,
  ) {
    return await this.curriculumService.updateCurriculumService({
      userId: user.id,
      id,
      updateCurriculumDto,
    });
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete curriculum', description: 'Delete a curriculum by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Curriculum ID' })
  @SwaggerResponse({ status: 200, description: 'Curriculum deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Curriculum deleted successfully' })
  async deleteCurriculumController(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
  ) {
    return await this.curriculumService.deleteCurriculumService({ userId: user.id, id });
  }

  // ── Lessons ──────────────────────────────────────────────────────────

  @Post('/:curriculumId/lesson')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create lesson', description: 'Create a lesson in a curriculum' })
  @ApiParam({ name: 'curriculumId', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title'],
      properties: {
        title: { type: 'string', example: 'Đạo hàm và ứng dụng' },
        description: { type: 'string', example: '' },
        theoryUrls: { type: 'array', items: { type: 'string', format: 'uri' }, example: ['https://example.com/theory.pdf'] },
        exerciseUrls: { type: 'array', items: { type: 'string', format: 'uri' }, example: ['https://example.com/exercise.pdf'] },
        order: { type: 'number', example: 1 },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Lesson created successfully' })
  async createLessonController(
    @CurrentUser() user: Record<string, string>,
    @Param('curriculumId') curriculumId: string,
    @Body(new ZodValidationPipe<CreateLessonDto>(createLessonSchema))
    createLessonDto: CreateLessonDto,
  ) {
    return await this.lessonService.createLessonService({
      userId: user.id,
      curriculumId,
      createLessonDto,
    });
  }

  @Get('/:curriculumId/lesson')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List lessons', description: 'Get all lessons in a curriculum' })
  @ApiParam({ name: 'curriculumId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Lessons fetched successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Lessons fetched successfully' })
  async getLessonsController(@Param('curriculumId') curriculumId: string) {
    return await this.lessonService.getLessonsService({ curriculumId });
  }

  @Put('/lesson/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Update lesson', description: 'Update a lesson by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Lesson ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        description: { type: 'string' },
        theoryUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
        exerciseUrls: { type: 'array', items: { type: 'string', format: 'uri' } },
        order: { type: 'number' },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Lesson updated successfully' })
  @ApiResponse({ statusCode: StatusCodes.CREATED, message: 'Lesson updated successfully' })
  async updateLessonController(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateLessonDto>(updateLessonSchema))
    updateLessonDto: UpdateLessonDto,
  ) {
    return await this.lessonService.updateLessonService({ userId: user.id, id, updateLessonDto });
  }

  @Delete('/lesson/:id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TUTOR')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete lesson', description: 'Delete a lesson by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid', description: 'Lesson ID' })
  @SwaggerResponse({ status: 200, description: 'Lesson deleted successfully' })
  @ApiResponse({ statusCode: StatusCodes.OK, message: 'Lesson deleted successfully' })
  async deleteLessonController(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
  ) {
    return await this.lessonService.deleteLessonService({ userId: user.id, id });
  }
}
