import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query } from '@nestjs/common';
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
  createClassSchema,
  type CreateClassDto,
  getClassesQuerySchema,
  type GetClassesQueryDto,
  updateClassSchema,
  type UpdateClassDto,
} from '@packages/entities/class';
import { ClassService } from './class.service';

@ApiTags('Classes')
@ApiBearerAuth('access-token')
@Controller('classes')
export class ClassController {
  constructor(private readonly classService: ClassService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create class',
    description: 'Create a new class (Stage 1: class info)',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name', 'subject', 'tutorId'],
      properties: {
        name: { type: 'string', maxLength: 255, example: 'Toan 12 - Co Ban' },
        code: { type: 'string', maxLength: 50, example: 'T12CB', description: 'Auto-generated if omitted' },
        subject: { type: 'string', maxLength: 255, example: 'Toan' },
        tuition: { type: 'number', minimum: 0, default: 0, example: 1500000 },
        description: { type: 'string', example: 'Lop toan 12 co ban, hoc 2 buoi/tuan' },
        status: { type: 'string', enum: ['OPEN', 'CLOSED', 'UPCOMING'], default: 'OPEN' },
        tutorId: { type: 'string', format: 'uuid', description: 'Tutor (user) ID' },
        studentIds: { type: 'array', items: { type: 'string', format: 'uuid' }, description: 'Optional list of student IDs to enroll' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Class created' })
  async create(
    @Body(new ZodValidationPipe<CreateClassDto>(createClassSchema))
    dto: CreateClassDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.classService.create(dto, user.id);
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'List classes',
    description: 'Get paginated classes for the current tutor',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search by name/code/subject',
  })
  @ApiQuery({ name: 'status', required: false, enum: ['OPEN', 'CLOSED', 'UPCOMING'] })
  @ApiQuery({ name: 'subject', required: false, type: String })
  @SwaggerResponse({ status: 200, description: 'Classes fetched' })
  async findAll(
    @CurrentUser() user: Record<string, string>,
    @Query(new ZodValidationPipe<GetClassesQueryDto>(getClassesQuerySchema))
    query: GetClassesQueryDto,
  ) {
    return this.classService.findAll(user.id, query);
  }

  @Get('generate-code')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Generate class code', description: 'Generate a unique class code' })
  @SwaggerResponse({ status: 200, description: 'Generated code' })
  async generateCode() {
    return this.classService.generateCode();
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Get class detail',
    description: 'Get class detail with student count and session counts',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Class detail' })
  @SwaggerResponse({ status: 404, description: 'Class not found' })
  async findById(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return this.classService.findById(id, user.id);
  }

  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update class', description: 'Update class information' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', maxLength: 255, example: 'Toan 12 - Nang Cao' },
        code: { type: 'string', maxLength: 50, example: 'T12NC' },
        subject: { type: 'string', example: 'Toan' },
        tuition: { type: 'number', minimum: 0 },
        description: { type: 'string' },
        status: { type: 'string', enum: ['OPEN', 'CLOSED', 'UPCOMING'] },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Class updated' })
  async update(
    @CurrentUser() user: Record<string, string>,
    @Param('id') id: string,
    @Body(new ZodValidationPipe<UpdateClassDto>(updateClassSchema))
    dto: UpdateClassDto,
  ) {
    return this.classService.update(id, dto, user.id);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete class', description: 'Delete a class by ID' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Class deleted' })
  async delete(@CurrentUser() user: Record<string, string>, @Param('id') id: string) {
    return this.classService.delete(id, user.id);
  }

  @Post(':classId/students/:studentId')
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Add student to class',
    description: 'Add an existing student to a class (Stage 2)',
  })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @ApiParam({ name: 'studentId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 201, description: 'Student added to class' })
  async addStudent(
    @CurrentUser() user: Record<string, string>,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classService.addStudent(classId, studentId, user.id);
  }

  @Delete(':classId/students/:studentId')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Remove student from class' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @ApiParam({ name: 'studentId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Student removed from class' })
  async removeStudent(
    @CurrentUser() user: Record<string, string>,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classService.removeStudent(classId, studentId, user.id);
  }

  @Get(':classId/students')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List students in class' })
  @ApiParam({ name: 'classId', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Students list' })
  async getStudents(
    @CurrentUser() user: Record<string, string>,
    @Param('classId') classId: string,
  ) {
    return this.classService.getStudents(classId, user.id);
  }
}
