import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { CurriculumRepository } from './curriculum.repository';
import { type CreateLessonDto, type UpdateLessonDto } from '@packages/entities';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from 'src/data/constants';
import { UUID_V4_REGEX } from './curriculum.service';

@Injectable()
export class LessonService {
  private logger = new Logger(LessonService.name);

  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly curriculumRepository: CurriculumRepository,
    private readonly userService: UserService,
  ) {}

  private async assertUserExists(userId: string) {
    if (!userId || !UUID_V4_REGEX.test(userId)) {
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

  async createLessonService({
    userId,
    curriculumId,
    createLessonDto,
  }: {
    userId: string;
    curriculumId: string;
    createLessonDto: CreateLessonDto;
  }) {
    await this.assertUserExists(userId);

    if (!curriculumId || !UUID_V4_REGEX.test(curriculumId)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    const curriculum = await this.curriculumRepository.findById(curriculumId);
    if (!curriculum) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    return await this.lessonRepository.create(curriculumId, createLessonDto);
  }

  async getLessonsService({ curriculumId }: { curriculumId: string }) {
    if (!curriculumId || !UUID_V4_REGEX.test(curriculumId)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    const curriculum = await this.curriculumRepository.findById(curriculumId);
    if (!curriculum) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    return await this.lessonRepository.findByCurriculumId(curriculumId);
  }

  async updateLessonService({
    userId,
    id,
    updateLessonDto,
  }: {
    userId: string;
    id: string;
    updateLessonDto: UpdateLessonDto;
  }) {
    await this.assertUserExists(userId);

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    return await this.lessonRepository.update(id, updateLessonDto);
  }

  async deleteLessonService({ userId, id }: { userId: string; id: string }) {
    await this.assertUserExists(userId);

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    return await this.lessonRepository.delete(id);
  }
}
