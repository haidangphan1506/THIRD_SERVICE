import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
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
  createNotificationSchema,
  type CreateNotificationDto,
  getNotificationsQuerySchema,
  type GetNotificationsQueryDto,
} from '@packages/entities/notification';
import { NotificationService } from './notification.service';

@ApiTags('Notifications')
@ApiBearerAuth('access-token')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(StatusCodes.CREATED)
  @ApiOperation({ summary: 'Create notification' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['type', 'title'],
      properties: {
        type: {
          type: 'string',
          enum: ['SYSTEM', 'TUITION', 'STUDENT', 'TUTOR'],
          example: 'SYSTEM',
        },
        subtype: {
          type: 'string',
          example: 'NEW_FEATURE',
          description: 'e.g., NEW_FEATURE, MAINTENANCE, PAID, OVERDUE',
        },
        title: { type: 'string', maxLength: 255, example: 'Cap nhat tinh nang moi' },
        content: { type: 'string', example: 'Da them chuc nang quan ly bai tap' },
        userId: { type: 'string', format: 'uuid', nullable: true },
        classId: { type: 'string', format: 'uuid', nullable: true },
        studentId: { type: 'string', format: 'uuid', nullable: true },
      },
    },
  })
  @SwaggerResponse({ status: 201, description: 'Notification created' })
  async create(
    @Body(new ZodValidationPipe<CreateNotificationDto>(createNotificationSchema))
    dto: CreateNotificationDto,
  ) {
    return this.notificationService.create(dto);
  }

  @Get()
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'List notifications' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'type', required: false, enum: ['SYSTEM', 'TUITION', 'STUDENT', 'TUTOR'] })
  @ApiQuery({ name: 'userId', required: false, type: String, format: 'uuid' })
  @ApiQuery({ name: 'isRead', required: false, type: Boolean })
  @SwaggerResponse({ status: 200, description: 'Notifications fetched' })
  async findAll(
    @Query(new ZodValidationPipe<GetNotificationsQueryDto>(getNotificationsQuerySchema))
    query: GetNotificationsQueryDto,
  ) {
    return this.notificationService.findAll(query);
  }

  @Get(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Get notification detail' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Notification detail' })
  async findById(@Param('id') id: string) {
    return this.notificationService.findById(id);
  }

  @Patch(':id/read')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Marked as read' })
  async markAsRead(@Param('id') id: string) {
    return this.notificationService.markAsRead(id);
  }

  @Patch('read-all')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({
    summary: 'Mark all as read',
    description: 'Mark all notifications as read for the current user',
  })
  @SwaggerResponse({ status: 200, description: 'All marked as read' })
  async markAllAsRead(@CurrentUser() user: Record<string, string>) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(StatusCodes.OK)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiParam({ name: 'id', type: String, format: 'uuid' })
  @SwaggerResponse({ status: 200, description: 'Notification deleted' })
  async delete(@Param('id') id: string) {
    return this.notificationService.delete(id);
  }
}
