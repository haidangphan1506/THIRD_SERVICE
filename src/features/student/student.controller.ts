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
  createStudentSchema,
  type CreateStudentDto,
  getStudentsQuerySchema,
  type GetStudentsQueryDto,
  updateStudentSchema,
  type UpdateStudentDto,
} from '@packages/entities/student';
import type { JwtGuardUser } from '../../packages/guards/jwt-auth.guard';
import { StudentService } from './student.service';

@ApiTags('Students')
@ApiBearerAuth('access-token')
@Controller('students')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('get-student-code')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Generate student code for new student ...',
    description: 'Generate student code ...',
  })
  @SwaggerResponse({ status: 201, description: 'Student created' })
  async generateStudentCodeController() {
    return await this.studentService.generateStudentCodeService();
  }
  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({
    summary: 'Create student',
    description:
      'Create a new student. If parentName provided, a PARENT user is auto-created and linked. Creator (tutor/admin) is recorded on the student record.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['password', 'studentName'],
      properties: {
        email: {
          type: 'string',
          format: 'email',
          example: 'student@example.com',
          description: 'Auto-generated if not provided',
        },
        password: { type: 'string', minLength: 8, maxLength: 14, example: 'Pass1234!' },
        studentName: { type: 'string', maxLength: 255, example: 'Nguyen Van A' },
        parentName: { type: 'string', maxLength: 255, example: 'Tran Thi B' },
        userCode: { type: 'string', maxLength: 50, example: 'HS001' },
        studentPhone: { type: 'string', example: '0912345678' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' },
        birthday: {
          type: 'string',
          format: 'date-time',
          example: '2008-05-20T00:00:00.000Z',
          description: 'Student date of birth (ISO 8601)',
        },
        school: { type: 'string', maxLength: 255, example: 'THPT Quang Trung' },
        className: {
          type: 'string',
          maxLength: 255,
          example: 'Toan 12A1',
          description: "Enroll immediately if it matches one of the tutor's class names",
        },
        parentPhone: { type: 'string', example: '0987654321' },
        parentEmail: { type: 'string', format: 'email', example: 'phuhuynh@gmail.com' },
        parentRelationship: {
          type: 'string',
          enum: ['FATHER', 'MOTHER', 'GUARDIAN'],
          example: 'FATHER',
        },
        avatar: { type: 'string', format: 'url', nullable: true },
        classId: {
          type: 'string',
          format: 'uuid',
          description: 'Enroll in class immediately',
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Student created' })
  async create(
    @Body(new ZodValidationPipe(createStudentSchema))
    dto: CreateStudentDto & { classId?: string },
    @CurrentUser() currentUser: JwtGuardUser,
  ) {
    return this.studentService.create(dto, currentUser);
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
        studentName: { type: 'string', maxLength: 255, example: 'Nguyen Van A' },
        studentPhone: { type: 'string', example: '0912345678' },
        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'], example: 'MALE' },
        birthday: {
          type: 'string',
          format: 'date-time',
          example: '2008-05-20T00:00:00.000Z',
        },
        school: { type: 'string', maxLength: 255, example: 'THPT Quang Trung' },
        className: {
          type: 'string',
          maxLength: 255,
          example: 'Toan 12A1',
          description: "Enroll if it matches one of the tutor's class names",
        },
        parentName: { type: 'string', maxLength: 255, example: 'Tran Thi B' },
        parentPhone: { type: 'string', example: '0987654321' },
        parentEmail: { type: 'string', format: 'email', example: 'phuhuynh@gmail.com' },
        parentRelationship: {
          type: 'string',
          enum: ['FATHER', 'MOTHER', 'GUARDIAN'],
          example: 'FATHER',
        },
        avatar: { type: 'string', format: 'url', nullable: true },
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
