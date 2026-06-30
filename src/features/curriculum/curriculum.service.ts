import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CurriculumRepository } from './curriculum.repository';
import { LessonRepository } from './lesson.repository';
import { type CreateCurriculumDto, type GetCurriculumsQueryDto, type UpdateCurriculumDto } from '@packages/entities';
import { UserService } from '../user/user.service';
import { ERROR_MESSAGES } from 'src/data/constants';
import { curriculums } from 'src/database/schema';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CurriculumService {
  private logger = new Logger(CurriculumService.name);

  constructor(
    private readonly curriculumRepository: CurriculumRepository,
    private readonly lessonRepository: LessonRepository,
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

  async createCurriculumService({
    userId,
    createCurriculumDto,
  }: {
    userId: string;
    createCurriculumDto: CreateCurriculumDto;
  }) {
    await this.assertUserExists(userId);
    return await this.curriculumRepository.create(userId, createCurriculumDto);
  }

  async getCurriculumByIdService({ id }: { id: string }) {
    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    const curriculum = await this.curriculumRepository.findById(id);
    if (!curriculum) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }
    return curriculum;
  }

  async getAllCurriculumService({ query }: { query: GetCurriculumsQueryDto }) {
    const result = await this.curriculumRepository.findAll({
      ...query,
      searchableColumns: { title: curriculums.title },
    });

    if (result.curriculums.length === 0) return result;

    const curriculumIds = result.curriculums.map((c) => c.id);
    const allLessons = await this.lessonRepository.findByCurriculumIds(curriculumIds);
    const lessonsByCurriculumId = new Map<string, typeof allLessons>();
    for (const lesson of allLessons) {
      const existing = lessonsByCurriculumId.get(lesson.curriculumId) ?? [];
      existing.push(lesson);
      lessonsByCurriculumId.set(lesson.curriculumId, existing);
    }

    return {
      ...result,
      curriculums: result.curriculums.map((c) => ({
        ...c,
        lessons: lessonsByCurriculumId.get(c.id) ?? [],
      })),
    };
  }

  async updateCurriculumService({
    userId,
    id,
    updateCurriculumDto,
  }: {
    userId: string;
    id: string;
    updateCurriculumDto: UpdateCurriculumDto;
  }) {
    await this.assertUserExists(userId);

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    const curriculum = await this.curriculumRepository.findById(id);
    if (!curriculum) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    return await this.curriculumRepository.update(id, updateCurriculumDto);
  }

  async deleteCurriculumService({ userId, id }: { userId: string; id: string }) {
    await this.assertUserExists(userId);

    if (!id || !UUID_V4_REGEX.test(id)) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    const curriculum = await this.curriculumRepository.findById(id);
    if (!curriculum) {
      throw new NotFoundException(ERROR_MESSAGES.CURRICULUM_NOT_FOUND);
    }

    return await this.curriculumRepository.delete(id);
  }
}
