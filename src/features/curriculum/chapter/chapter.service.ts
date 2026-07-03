import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ChapterRepository } from './chapter.repository';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from 'src/data/constants';
import { checkUuidValid } from '@packages/helpers';
import { CreateChapterDto, UpdateChapterDto } from '@packages/entities';

@Injectable()
export class ChapterService {
  private readonly logger = new Logger(ChapterService.name);

  constructor(
    private readonly chapterRepository: ChapterRepository,
    private readonly userService: UserService,
  ) {}

  private async assertUserExists(userId: string) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new NotFoundException(ERROR_MESSAGES.USER_ID_NOT_FOUND);
    }
    const userData = await this.userService.getUserByField({
      field: 'id',
      value: userId,
    });
    if (!userData || (Array.isArray(userData) && userData.length === 0)) {
      throw new NotFoundException(ERROR_MESSAGES.USER_NOT_FOUND);
    }
  }

  async createChapterService({ userId, createChapterDto }: { userId: string; createChapterDto: CreateChapterDto }) {
    await this.assertUserExists(userId);
    return await this.chapterRepository.create(userId, createChapterDto);
  }

  async getAllChaptersService({ userId }: { userId: string }) {
    await this.assertUserExists(userId);
    return await this.chapterRepository.findAll({ userId });
  }

  async getChapterByIdService(id: string) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }
    return await this.chapterRepository.findById(id);
  }

  async updateChapterService(id: string, updateData: UpdateChapterDto) {
    await this.assertUserExists('dummy-user-id');
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }
    return await this.chapterRepository.update(id, updateData);
  }

  async deleteChapterService(id: string) {
    await this.assertUserExists('dummy-user-id');
    if (!id || !checkUuidValid({ data: id })) {
      throw new NotFoundException(ERROR_MESSAGES.CHAPTER_NOT_FOUND);
    }
    return await this.chapterRepository.delete(id);
  }
}
