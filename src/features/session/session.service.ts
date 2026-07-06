import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { chapters, lessons } from '../../database/schema';
import { ClassRepository } from '../class/class.repository';
import { SessionRepository } from './session.repository';
import type { CreateSessionDto, GetSessionsQueryDto, UpdateSessionDto } from '@packages/entities/session';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class SessionService {
  constructor(
    private readonly repo: SessionRepository,
    private readonly classRepo: ClassRepository,
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  private assertUuid(value: string, field: string) {
    if (!value || !checkUuidValid({ data: value })) {
      throw new BadRequestException(`${field} must be uuid ...`);
    }
  }

  private async assertClassOwner(classId: string, tutorId: string) {
    const cls = await this.classRepo.findById(classId);
    if (!cls || cls.tutorId !== tutorId) {
      throw new NotFoundException('Class not found');
    }
    return cls;
  }

  async create(dto: CreateSessionDto, tutorId: string) {
    this.assertUuid(tutorId, 'tutorId');
    this.assertUuid(dto.classId, 'classId');
    await this.assertClassOwner(dto.classId, tutorId);
    return this.repo.create(dto);
  }

  async findAll(tutorId: string, query: GetSessionsQueryDto) {
    this.assertUuid(tutorId, 'tutorId');
    if (query.classId) {
      this.assertUuid(query.classId, 'classId');
      await this.assertClassOwner(query.classId, tutorId);
    }
    return this.repo.findAll({ query });
  }

  async findById(id: string, tutorId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(tutorId, 'tutorId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    const cls = await this.assertClassOwner(session.classId, tutorId);

    let lesson: { id: string; title: string; chapterTitle: string | null } | null = null;
    if (session.lessonId) {
      const [row] = await this.db
        .select({
          id: lessons.id,
          title: lessons.title,
          chapterTitle: chapters.title,
        })
        .from(lessons)
        .leftJoin(chapters, eq(lessons.chapterId, chapters.id))
        .where(eq(lessons.id, session.lessonId))
        .limit(1);
      if (row) {
        lesson = { id: row.id, title: row.title, chapterTitle: row.chapterTitle ?? null };
      }
    }

    return {
      ...session,
      class: {
        id: cls.id,
        name: cls.name,
        code: cls.code,
        subject: cls.subject,
        curriculumId: cls.curriculumId,
      },
      lesson,
    };
  }

  /** Sessions across all classes the current student is enrolled in. */
  async findAllForStudent(studentId: string, query: GetSessionsQueryDto) {
    this.assertUuid(studentId, 'studentId');
    if (query.classId) this.assertUuid(query.classId, 'classId');
    const classIds = await this.repo.getEnrolledClassIds(studentId);
    if (classIds.length === 0) {
      return {
        data: [],
        pagination: { total: 0, page: query.page, limit: query.limit, totalPages: 0 },
      };
    }
    return this.repo.findAllForStudent({ classIds, query });
  }

  /** Session detail for an enrolled student (membership-checked, not owner-checked). */
  async findByIdForStudent(id: string, studentId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(studentId, 'studentId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');

    const enrolled = await this.repo.isStudentEnrolled(studentId, session.classId);
    if (!enrolled) throw new NotFoundException('Session not found');

    const cls = await this.classRepo.findById(session.classId);
    if (!cls) throw new NotFoundException('Session not found');

    const lesson = await this.loadLesson(session.lessonId);

    return {
      ...session,
      class: {
        id: cls.id,
        name: cls.name,
        code: cls.code,
        subject: cls.subject,
        curriculumId: cls.curriculumId,
        tutorId: cls.tutorId,
      },
      lesson,
    };
  }

  private async loadLesson(lessonId: string | null) {
    if (!lessonId) return null;
    const [row] = await this.db
      .select({ id: lessons.id, title: lessons.title, chapterTitle: chapters.title })
      .from(lessons)
      .leftJoin(chapters, eq(lessons.chapterId, chapters.id))
      .where(eq(lessons.id, lessonId))
      .limit(1);
    return row ? { id: row.id, title: row.title, chapterTitle: row.chapterTitle ?? null } : null;
  }

  async update(id: string, dto: UpdateSessionDto, tutorId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(tutorId, 'tutorId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.assertClassOwner(session.classId, tutorId);
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException('Session not found');
    return updated;
  }

  async delete(id: string, tutorId: string) {
    this.assertUuid(id, 'id');
    this.assertUuid(tutorId, 'tutorId');
    const session = await this.repo.findById(id);
    if (!session) throw new NotFoundException('Session not found');
    await this.assertClassOwner(session.classId, tutorId);
    await this.repo.delete(id);
    return { id };
  }
}
