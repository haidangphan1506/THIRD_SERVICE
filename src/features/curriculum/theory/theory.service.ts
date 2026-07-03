import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { TheoryRepository } from './theory.repository';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from 'src/data/constants';
import { checkUuidValid } from '@packages/helpers';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@packages/entities';

@Injectable()
export class TheoryService {
  private readonly logger = new Logger(TheoryService.name);

  constructor(
    private readonly theoryRepository: TheoryRepository,
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

  async getTheoryByLessonIdService(lessonId: string) {
    if (!lessonId || !checkUuidValid({ data: lessonId })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    return await this.theoryRepository.findByLessonId(lessonId);
  }

  async addTheoryUrlService(lessonId: string, theoryUrl: { url: string; name: string; key: string }) {
    await this.assertUserExists('dummy-user-id');
    if (!lessonId || !checkUuidValid({ data: lessonId })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    return await this.theoryRepository.addUrl(lessonId, theoryUrl);
  }

  async updateTheoryUrlService(lessonId: string, urlId: string, updateData: Partial<{ name: string; key: string }>) {
    await this.assertUserExists('dummy-user-id');
    if (!lessonId || !checkUuidValid({ data: lessonId })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    return await this.theoryRepository.updateUrl(lessonId, urlId, updateData);
  }

  async deleteTheoryUrlService(lessonId: string, urlId: string) {
    await this.assertUserExists('dummy-user-id');
    if (!lessonId || !checkUuidValid({ data: lessonId })) {
      throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }
    return await this.theoryRepository.deleteUrl(lessonId, urlId);
  }
}
