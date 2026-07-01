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
import { classes, curriculums, grades } from '../../database/schema';
import { ERROR_MESSAGES } from 'src/data/constants';
import { UserService } from '../user/user.service';
import { UploadService } from '../uploads/upload.service';
import type { MulterFile } from '../uploads/upload.interface';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable()
export class CurriculumService {
  private logger = new Logger(CurriculumService.name);

  constructor(
    private readonly curriculumRepository: CurriculumRepository,
    private readonly lessonRepository: LessonRepository,
    private readonly userService: UserService,
    private readonly uploadService: UploadService,
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

  async getLessonsByCurriculum(curriculumId: string) {
    const curriculum = await this.curriculumRepository.findById(curriculumId);
    if (!curriculum) throw new NotFoundException('Curriculum not found');
    return this.lessonRepository.findByCurriculumId(curriculumId);
  }

  async createLesson(
    dto: CreateLessonDto & { classId: string },
    tutorId: string,
  ) {
    let curriculumId = dto.curriculumId;

    if (!curriculumId) {
      await this.verifyClassOwner(dto.classId, tutorId);
      const curriculumsList = await this.curriculumRepository.findAll({
        filters: { userId: tutorId },
        filterColumns: { userId: { column: curriculums.userId } },
      });
      if (curriculumsList.curriculums.length === 0) {
        throw new NotFoundException('No curriculum found for this class');
      }
      curriculumId = curriculumsList.curriculums[0].id;
    } else {
      const curriculum = await this.curriculumRepository.findById(curriculumId);
      if (!curriculum || curriculum.userId !== tutorId) {
        throw new NotFoundException('Curriculum not found');
      }
    }

    return this.lessonRepository.create(curriculumId, dto);
  }

  async getLessonDetail(id: string, _tutorId: string) {
    const lesson = await this.lessonRepository.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    const curriculum = await this.curriculumRepository.findById(lesson.curriculumId);
    return { ...lesson, curriculumTitle: curriculum?.title ?? null };
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

  // ── Lesson File Uploads ──

  async uploadTheoryFiles(lessonId: string, files: MulterFile[], _tutorId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    const results = await Promise.all(
      files.map((f) => this.uploadService.upload(f, 'curriculum/theory')),
    );
    const fileMeta = results.map((r, i) => ({
      name: files[i].originalname,
      url: r.url,
      key: r.key,
    }));
    await this.lessonRepository.addTheoryUrls(lessonId, fileMeta);
    return { files: fileMeta };
  }

  async uploadExerciseFiles(lessonId: string, files: MulterFile[], _tutorId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    const results = await Promise.all(
      files.map((f) => this.uploadService.upload(f, 'curriculum/exercise')),
    );
    const fileMeta = results.map((r, i) => ({
      name: files[i].originalname,
      url: r.url,
      key: r.key,
    }));
    await this.lessonRepository.addExerciseUrls(lessonId, fileMeta);
    return { files: fileMeta };
  }

  async removeTheoryFile(lessonId: string, dto: { url?: string; key?: string }, _tutorId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    const targetUrl = dto.url;
    if (!targetUrl) throw new NotFoundException('File URL is required');
    await this.lessonRepository.removeTheoryUrl(lessonId, targetUrl);
    return { url: targetUrl };
  }

  async removeExerciseFile(lessonId: string, dto: { url?: string; key?: string }, _tutorId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundException('Lesson not found');
    const targetUrl = dto.url;
    if (!targetUrl) throw new NotFoundException('File URL is required');
    await this.lessonRepository.removeExerciseUrl(lessonId, targetUrl);
    return { url: targetUrl };
  }

  async getChaptersByGrade(gradeId: string) {
    return this.curriculumRepository.findAll({
      filters: { gradeId },
      filterColumns: { gradeId: { column: curriculums.gradeId } },
    });
  }

  // ── Grades ──

  async getGrades() {
    return this.db.select().from(grades).orderBy(grades.level);
  }
}
