import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse as SwaggerResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { StatusCodes } from 'http-status-codes';
import { ZodValidationPipe } from '@packages/pipes';
import { CurrentUser } from '@packages/decorators';
import { createClassSchema, type CreateClassDto } from '@packages/entities/class';
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
      required: ['name', 'subject', 'tutorId', 'startTime', 'endTime'],
      properties: {
        name: { type: 'string', maxLength: 255, example: 'Toan 12 - Co Ban' },
        code: {
          type: 'string',
          maxLength: 50,
          example: 'T12CB',
          description: 'Auto-generated if omitted',
        },
        subject: { type: 'string', maxLength: 255, example: 'Toan' },
        tuition: { type: 'number', minimum: 0, default: 0, example: 1500000 },
        description: { type: 'string', example: 'Lop toan 12 co ban, hoc 2 buoi/tuan' },
        status: { type: 'string', enum: ['OPEN', 'CLOSED', 'UPCOMING'], default: 'OPEN' },
        format: {
          type: 'string',
          enum: ['ONLINE', 'OFFLINE'],
          default: 'ONLINE',
          description: 'Hinh thuc hoc',
        },
        location: {
          type: 'string',
          example: 'https://meet.google.com/abc-defg-hij',
          description: 'Link hoc (ONLINE) hoac dia chi hoc (OFFLINE)',
        },
        startTime: {
          type: 'date',
          example: '2026-07-01T00:00:00.000Z',
          description: 'Thời gian bắt đầu  khóa học',
        },
        endTime: {
          type: 'date',
          example: '2026-10-01T00:00:00.000Z',
          description: 'Thời gian kết thúc khóa học',
        },
        curriculumId: { type: 'string', format: 'uuid', description: 'Optional curriculum ID' },
        tutorId: { type: 'string', format: 'uuid', description: 'Tutor (user) ID' },
        studentIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Optional list of student IDs to enroll',
        },
        parentsIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          description: 'Optional list of parent IDs linked to the class',
        },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Class created' })
  create(
    @Body(new ZodValidationPipe<CreateClassDto>(createClassSchema))
    dto: CreateClassDto,
    @CurrentUser() user: Record<string, string>,
  ) {
    return this.classService.createClassService({ data: dto, userId: user.id });
  }
}
