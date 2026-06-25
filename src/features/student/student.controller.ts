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
import {
  createStudentSchema,
  type CreateStudentDto,
  getStudentsQuerySchema,
  type GetStudentsQueryDto,
  updateStudentSchema,
  type UpdateStudentDto,
} from '@packages/entities/student';
import { StudentService } from './student.service';

@ApiTags('Students')
@ApiBearerAuth('access-token')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create student',
    description: 'Create a new student. Optionally pass classId to auto-enroll.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['password', 'firstName', 'lastName'],
      properties: {
        email: { type: 'string', format: 'email', example: 'student@example.com', description: 'Auto-generated if not provided' },
        password: { type: 'string', minLength: 8, maxLength: 14, example: 'Pass1234!' },
        firstName: { type: 'string', maxLength: 255, example: 'Nguyen' },
        lastName: { type: 'string', maxLength: 255, example: 'Van A' },
        userCode: { type: 'string', maxLength: 50, example: 'HS001' },
        phone: { type: 'string', example: '0912345678' },
        avatar: { type: 'string', format: 'url', nullable: true },
        parentId: { type: 'string', format: 'uuid', nullable: true, description: 'Parent user ID' },
        classId: { type: 'string', format: 'uuid', description: 'Enroll in class immediately' },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Student created' })
  async create(
    @Body(new ZodValidationPipe(createStudentSchema))
    dto: CreateStudentDto & { classId?: string },
  ) {
    return this.studentService.create(dto);
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List students', description: 'Get paginated list of students' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by name/code' })
  @ApiQuery({
    name: 'classId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filter by class',
  })
  @SwaggerResponse({ status: 200, description: 'Students fetched' })
  async findAll(
    @Query(new ZodValidationPipe<GetStudentsQueryDto>(getStudentsQuerySchema))
    query: GetStudentsQueryDto,
  ) {
    return this.studentService.findAll(query);
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Get student detail',
    description: 'Get student detail with classes, scores, recent sessions',
  })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Student detail' })
  @SwaggerResponse({ status: 404, description: 'Student not found' })
  async findById(@Param('id') id: string) {
    return this.studentService.findById(id);
  }

  @Put(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Update student' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', maxLength: 255 },
        lastName: { type: 'string', maxLength: 255 },
        phone: { type: 'string' },
        avatar: { type: 'string', format: 'url', nullable: true },
        parentId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @SwaggerResponse({ status: 200, description: 'Student updated' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateStudentSchema))
    dto: UpdateStudentDto,
  ) {
    return this.studentService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete student' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Student deleted' })
  async delete(@Param('id') id: string) {
    return this.studentService.delete(id);
  }
}
