import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  CreateNotificationDto,
  GetNotificationsQueryDto,
} from '@packages/entities/notification';
import { NotificationRepository } from './notification.repository';
import { UserService } from '../user/user.service';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(
    private readonly repo: NotificationRepository,
    private readonly userService: UserService,
  ) {}

  async createNotificationService(dto: CreateNotificationDto) {
    const existUser =
      dto.userId &&
      (await this.userService.getUserByField({
        field: 'id',
        value: dto.userId,
      }));

    console.log('userId:', dto.senderId);

    if (!dto.senderId || (dto.senderId && !checkUuidValid({ data: dto.senderId }))) {
      throw new BadRequestException('UserId not valid ...');
    }

    this.logger.log('exist user : ', existUser);

    if (Array.isArray(existUser) && existUser.length === 0) {
      throw new BadRequestException('User not found ...');
    }

    if (dto.classId && !checkUuidValid({ data: dto.classId })) {
      throw new BadRequestException('classId not valid ...');
    }

    if (dto.studentId && !checkUuidValid({ data: dto.studentId })) {
      throw new BadRequestException('studentId not valid ...');
    }
    return this.repo.create(dto);
  }

  async findAll(userId: string, query: GetNotificationsQueryDto) {
    return this.repo.findAll(userId, query);
  }

  async findById(id: string) {
    const note = await this.repo.findById(id);
    if (!note) throw new NotFoundException('Notification not found');
    return note;
  }

  async markAsRead(id: string) {
    const note = await this.repo.findById(id);
    if (!note) throw new NotFoundException('Notification not found');
    return this.repo.markAsRead(id);
  }

  async markAllAsRead(userId: string) {
    return this.repo.markAllAsRead(userId);
  }

  async delete(id: string) {
    const note = await this.repo.findById(id);
    if (!note) throw new NotFoundException('Notification not found');
    await this.repo.delete(id);
    return { id };
  }
}
