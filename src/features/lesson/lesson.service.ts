import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ERROR_MESSAGES } from 'src/data/constants';
import { LessonRepository } from './lesson.repository';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  type CreateLessonBodyDto,
  type UpdateLessonDto,
  type GetLessonsQueryDto,
  type RemoveLessonFileDto,
} from '@packages/entities';
import { checkUuidValid, decodeMulterFilename } from '@packages/helpers';
import { UserService } from '../user/user.service';
import { UploadService } from '../uploads/upload.service';
import { MulterFile } from '../uploads/upload.interface';

@Injectable()
export class LessonService {
  constructor(
    private readonly lessonRepository: LessonRepository,
    private readonly user: UserService,
    private readonly upload: UploadService,
    @Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async createLessonService({
    curriculumId,
    chapterId,
    data,
  }: {
    curriculumId: string;
    chapterId?: string | null;
    data: CreateLessonBodyDto;
  }) {
    if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
      throw new BadRequestException(ERROR_MESSAGES.CURRICULUM_ID_MUST_BE_UUID);
    }
    if (chapterId && !checkUuidValid({ data: chapterId })) {
      throw new BadRequestException(ERROR_MESSAGES.CHAPTER_ID_MUST_BE_UUID);
    }
    return await this.lessonRepository.create({ curriculumId, chapterId, data });
  }

  async getAllLessonsService({ query }: { query: GetLessonsQueryDto }) {
    const { curriculumId, chapterId, page, limit } = query;
    if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
      throw new BadRequestException(ERROR_MESSAGES.CURRICULUM_ID_MUST_BE_UUID);
    }
    if (chapterId && !checkUuidValid({ data: chapterId })) {
      throw new BadRequestException(ERROR_MESSAGES.CHAPTER_ID_MUST_BE_UUID);
    }
    return await this.lessonRepository.findAll({ curriculumId, chapterId, page, limit });
  }

  async getLessonByIdService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }
    return await this.lessonRepository.findById(id);
  }

  async updateLessonService({ id, data }: { id: string; data: UpdateLessonDto }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }
    const existing = await this.lessonRepository.findById(id);
    if (!existing) throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    return await this.lessonRepository.update(id, data);
  }

  async deleteLessonService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }
    const existing = await this.lessonRepository.findById(id);
    if (!existing) throw new NotFoundException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    return await this.lessonRepository.delete(id);
  }

  async addTheoryToLessonService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: MulterFile;
  }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException(ERROR_MESSAGES.USER_ID_MUST_BE_UUID);
    }

    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!user || (Array.isArray(user) && user.length <= 0)) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const lession = await this.getLessonByIdService({ id });

    if (!lession) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }

    const theory = await this.upload.upload(data, 'uploads/theory');

    if (!theory) {
      throw new BadRequestException(ERROR_MESSAGES.UPLOAD_THEORY_FAILED);
    }

    const lessionUpdated = await this.updateLessonService({
      id,
      data: {
        theoryUrls: [
          ...(lession.theoryUrls ?? []),
          { name: decodeMulterFilename(data.originalname), url: theory.url, key: theory.key },
        ],
      },
    });

    return lessionUpdated;
  }

  async addExercisesToLessonService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: MulterFile;
  }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException(ERROR_MESSAGES.USER_ID_MUST_BE_UUID);
    }

    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!user || (Array.isArray(user) && user.length <= 0)) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const lession = await this.getLessonByIdService({ id });

    if (!lession) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }

    const exercise = await this.upload.upload(data, 'uploads/exercises');

    if (!exercise) {
      throw new BadRequestException(ERROR_MESSAGES.UPLOAD_EXERCISES_FAILED);
    }

    const lessionUpdated = await this.updateLessonService({
      id,
      data: {
        exerciseUrls: [
          ...(lession.exerciseUrls ?? []),
          { name: decodeMulterFilename(data.originalname), url: exercise.url, key: exercise.key },
        ],
      },
    });

    return lessionUpdated;
  }

  async removeTheoryFromLessonService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: RemoveLessonFileDto;
  }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException(ERROR_MESSAGES.USER_ID_MUST_BE_UUID);
    }

    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!user || (Array.isArray(user) && user.length <= 0)) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const lession = await this.getLessonByIdService({ id });

    if (!lession) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }

    const target = (lession.theoryUrls ?? []).find(
      (file) => (data.url && file.url === data.url) || (data.key && file.key === data.key),
    );

    if (!target) {
      throw new NotFoundException(ERROR_MESSAGES.FILE_NOT_FOUND);
    }

    await this.upload.delete(target.key);

    return await this.updateLessonService({
      id,
      data: {
        theoryUrls: (lession.theoryUrls ?? []).filter((file) => file.key !== target.key),
      },
    });
  }

  async removeExerciseFromLessonService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: RemoveLessonFileDto;
  }) {
    if (!userId || !checkUuidValid({ data: userId })) {
      throw new BadRequestException(ERROR_MESSAGES.USER_ID_MUST_BE_UUID);
    }

    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_ID_INVALID);
    }

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!user || (Array.isArray(user) && user.length <= 0)) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const lession = await this.getLessonByIdService({ id });

    if (!lession) {
      throw new BadRequestException(ERROR_MESSAGES.LESSON_NOT_FOUND);
    }

    const target = (lession.exerciseUrls ?? []).find(
      (file) => (data.url && file.url === data.url) || (data.key && file.key === data.key),
    );

    if (!target) {
      throw new NotFoundException(ERROR_MESSAGES.FILE_NOT_FOUND);
    }

    await this.upload.delete(target.key);

    return await this.updateLessonService({
      id,
      data: {
        exerciseUrls: (lession.exerciseUrls ?? []).filter((file) => file.key !== target.key),
      },
    });
  }
}
