import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import type {
  CreateNotificationDto,
  GetNotificationsQueryDto,
} from '@packages/entities/notification';
import { NotificationRepository } from './notification.repository';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  constructor(private readonly repo: NotificationRepository) {}

  async create(dto: CreateNotificationDto) {
    return this.repo.create(dto);
  }

  async findAll(query: GetNotificationsQueryDto) {
    return this.repo.findAll(query);
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
