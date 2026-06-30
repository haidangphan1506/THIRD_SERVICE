import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { CurriculumRepository } from './curriculum.repository';
import { LessonRepository } from './lesson.repository';
import {
  type CreateCurriculumDto,
  type GetCurriculumsQueryDto,
  type UpdateCurriculumDto,
  type CreateLessonDto,
  type UpdateLessonDto,
} from '@packages/entities';
import { DRIZZLE } from '../../database/database.module';
import { classes, curriculums } from '../../database/schema';
import { ERROR_MESSAGES } from 'src/data/constants';
import { UserService } from '../user/user.service';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CurriculumService {
  private logger = new Logger(CurriculumService.name);

  constructor(
    private readonly curriculumRepository: CurriculumRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly userService: UserService,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  private async verifyClassOwner(classId: string, tutorId: string) {
    const [cls] = await this.db.select().from(classes).where(eq(classes.id, classId));
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return cls;
  }

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

  // ── Chapter ──

  async createChapter(dto: CreateCurriculumDto, tutorId: string) {
    return this.curriculumRepository.create(tutorId, dto);
  }

  async getChaptersByClass(classId: string, tutorId: string) {
    await this.verifyClassOwner(classId, tutorId);
    const items = await this.curriculumRepository.findAll({
      filters: { userId: tutorId },
      filterColumns: { userId: { column: curriculums.userId } },
    });
    return items;
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

  async updateChapter(id: string, dto: UpdateCurriculumDto, _tutorId: string) {
    const curr = await this.curriculumRepository.findById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    return this.curriculumRepository.update(id, dto);
  }

  async deleteChapter(id: string, _tutorId: string) {
    const curr = await this.curriculumRepository.findById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    await this.curriculumRepository.delete(id);
    return { id };
  }

  // ── Lesson ──

  async getLessonsByClass(classId: string, tutorId: string) {
    return this.getChaptersByClass(classId, tutorId);
  }

  async createLesson(
    dto: CreateLessonDto & { classId: string },
    tutorId: string,
  ) {
    await this.verifyClassOwner(dto.classId, tutorId);
    const curriculumsList = await this.curriculumRepository.findAll({
      filters: { userId: tutorId },
      filterColumns: { userId: { column: curriculums.userId } },
    });
    if (curriculumsList.curriculums.length === 0) {
      throw new NotFoundException('No curriculum found for this class');
    }
    const curriculumId = curriculumsList.curriculums[0].id;
    return this.lessonRepository.create(curriculumId, dto);
  }

  async updateLesson(id: string, dto: UpdateLessonDto, _tutorId: string) {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return this.lessonRepository.update(id, dto);
  }

  async deleteLesson(id: string, _tutorId: string) {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    await this.lessonRepository.delete(id);
    return { id };
  }
}
