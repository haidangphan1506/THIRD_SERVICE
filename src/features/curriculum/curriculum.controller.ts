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
  createCurriculumSchema,
  createAssignmentSchema,
  updateCurriculumSchema,
  updateAssignmentSchema,
  type CreateCurriculumDto,
  type CreateAssignmentDto,
  type UpdateCurriculumDto,
  type UpdateAssignmentDto,
} from '@packages/entities/curriculum';
import { CurriculumService } from './curriculum.service';

@ApiTags('Curriculum')
@ApiBearerAuth('access-token')
@Controller('curriculums')
export class CurriculumController {
  constructor(private readonly curriculumService: CurriculumService) {}

  // ── Curriculum ──

  @Get(':classId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Get curriculum',
    description: 'Get lesson plan for a class, grouped by lesson number',
  })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Curriculum fetched' })
  async getCurriculums(
    @Param('classId') classId: string,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.getCurriculumsByClass(classId, user.id);
  }

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create curriculum entry' })
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
  @SwaggerResponse({ status: 201, description: 'Curriculum created' })
  async createCurriculum(
    @Body(new ZodValidationPipe<CreateCurriculumDto>(createCurriculumSchema))
    dto: CreateCurriculumDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.createCurriculum(dto, user.id);
  }

  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update curriculum entry' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Curriculum updated' })
  async updateCurriculum(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCurriculumSchema))
    dto: UpdateCurriculumDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.updateCurriculum(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete curriculum entry' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Curriculum deleted' })
  async deleteCurriculum(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.deleteCurriculum(id, user.id);
  }

  @Post(':id/row')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Add row under lesson',
    description: 'Add a new row under the same lesson number',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Curriculum entry ID to copy lesson from',
  })
  @SwaggerResponse({ status: 201, description: 'Row added' })
  async addRow(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.addRow(id, user.id);
  }

  // ── Assignments ──

  @Get(':classId/assignments')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get assignments', description: 'Get assignments for a class' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @ApiQuery({ name: 'lesson', required: false, type: Number, description: 'Filter by lesson' })
  @SwaggerResponse({ status: 200, description: 'Assignments fetched' })
  async getAssignments(
    @Param('classId') classId: string,
    @Query('lesson') lesson?: string,
    @CurrentUser() user?: Record<string, string>,
  ) {
    return this.curriculumService.getAssignmentsByClass(
      classId,
      lesson ? Number(lesson) : undefined,
      user?.id,
    );
  }

  @Post('assignments')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create assignment' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['classId', 'lesson', 'name'],
      properties: {
        classId: { type: 'string', format: 'uuid' },
        curriculumId: { type: 'string', format: 'uuid', nullable: true },
        lesson: { type: 'number', example: 1 },
        name: { type: 'string', maxLength: 255, example: 'Bai tap ve nha so 1' },
        description: { type: 'string' },
        requirement: { type: 'string' },
        status: {
          type: 'string',
          enum: ['COMPLETED', 'OVERDUE', 'IN_PROGRESS'],
          default: 'IN_PROGRESS',
        },
        score: { type: 'number', minimum: 0, maximum: 10, nullable: true },
        comment: { type: 'string' },
        isHidden: { type: 'boolean', default: false },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Assignment created' })
  async createAssignment(
    @Body(new ZodValidationPipe<CreateAssignmentDto>(createAssignmentSchema))
    dto: CreateAssignmentDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.createAssignment(dto, user.id);
  }

  @Put('assignments/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update assignment' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Assignment updated' })
  async updateAssignment(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAssignmentSchema))
    dto: UpdateAssignmentDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.curriculumService.updateAssignment(id, dto, user.id);
  }

  @Delete('assignments/:id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete assignment' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Assignment deleted' })
  async deleteAssignment(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.deleteAssignment(id, user.id);
  }

  @Patch('assignments/:id/toggle-hidden')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Toggle assignment visibility',
    description: 'Hide/show an assignment from students',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Visibility toggled' })
  async toggleHidden(@Param('id') id: string, @CurrentUser() user: Record<string, string>) {
    return this.curriculumService.toggleHidden(id, user.id);
  }
}
