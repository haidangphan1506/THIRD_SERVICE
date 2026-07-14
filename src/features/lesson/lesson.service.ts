import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { LessonRepository } from './lesson.repository';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import {
  type CreateLessonBodyDto,
  type UpdateLessonDto,
  type GetLessonsQueryDto,
} from '@packages/entities';
import { checkUuidValid } from '@packages/helpers';
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
      throw new BadRequestException('curriculumId must be a valid UUID');
    }
    if (chapterId && !checkUuidValid({ data: chapterId })) {
      throw new BadRequestException('chapterId must be a valid UUID');
    }
    return await this.lessonRepository.create({ curriculumId, chapterId, data });
  }

  async getAllLessonsService({ query }: { query: GetLessonsQueryDto }) {
    const { curriculumId, chapterId, page, limit } = query;
    if (!curriculumId || !checkUuidValid({ data: curriculumId })) {
      throw new BadRequestException('curriculumId must be a valid UUID');
    }
    if (chapterId && !checkUuidValid({ data: chapterId })) {
      throw new BadRequestException('chapterId must be a valid UUID');
    }
    return await this.lessonRepository.findAll({ curriculumId, chapterId, page, limit });
  }

  async getLessonByIdService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid lesson id');
    }
    return await this.lessonRepository.findById(id);
  }

  async updateLessonService({ id, data }: { id: string; data: UpdateLessonDto }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid lesson id');
    }
    const existing = await this.lessonRepository.findById(id);
    if (!existing) throw new NotFoundException('Lesson not found');
    return await this.lessonRepository.update(id, data);
  }

  async deleteLessonService({ id }: { id: string }) {
    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid lesson id');
    }
    const existing = await this.lessonRepository.findById(id);
    if (!existing) throw new NotFoundException('Lesson not found');
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
      throw new BadRequestException('userId must be uuid ....');
    }

    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid lesson id');
    }

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!user || (Array.isArray(user) && user.length <= 0)) {
      throw new BadRequestException('User not  found ...');
    }

    const lession = await this.getLessonByIdService({ id });

    if (!lession) {
      throw new BadRequestException('Lesson not found ...');
    }

    const theory = await this.upload.upload(data, 'uploads/theory');

    if (!theory) {
      throw new BadRequestException('Upload theory failed ...');
    }

    const lessionUpdated = await this.updateLessonService({
      id,
      data: {
        theoryUrls: [
          ...(lession.theoryUrls ?? []),
          { name: data.originalname, url: theory.url, key: theory.key },
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
      throw new BadRequestException('userId must be uuid ....');
    }

    if (!id || !checkUuidValid({ data: id })) {
      throw new BadRequestException('Invalid lesson id');
    }

    const user = await this.user.getUserByField({
      field: 'id',
      value: userId,
    });

    if (!user || (Array.isArray(user) && user.length <= 0)) {
      throw new BadRequestException('User not  found ...');
    }

    const lession = await this.getLessonByIdService({ id });

    if (!lession) {
      throw new BadRequestException('Lesson not found ...');
    }

    const exercise = await this.upload.upload(data, 'uploads/exercises');

    if (!exercise) {
      throw new BadRequestException('Upload exercises failed ...');
    }

    const lessionUpdated = await this.updateLessonService({
      id,
      data: {
        exerciseUrls: [
          ...(lession.exerciseUrls ?? []),
          { name: data.originalname, url: exercise.url, key: exercise.key },
        ],
      },
    });

    return lessionUpdated;
  }
}
