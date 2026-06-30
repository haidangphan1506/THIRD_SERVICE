import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { classes } from '../../database/schema';
import type {
  CreateAssignmentDto,
  CreateCurriculumDto,
  UpdateAssignmentDto,
  UpdateCurriculumDto,
} from '@packages/entities/curriculum';
import { CurriculumRepository } from './curriculum.repository';

@Injectable()
export class CurriculumService {
  private readonly logger = new Logger(CurriculumService.name);
  constructor(
    private readonly repo: CurriculumRepository,
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

  // ── Chapter ──

  // TODO : Create a new chapter
  async createChapter(dto: CreateCurriculumDto, tutorId: string) {
    await this.verifyClassOwner(dto.classId, tutorId);
    return this.repo.createCurriculum(dto);
  }

  // TODO : Get chapters by class
  async getChaptersByClass(classId: string, tutorId: string) {
    await this.verifyClassOwner(classId, tutorId);
    const items = await this.repo.getCurriculumsByClass(classId);

    const grouped: Record<number, typeof items> = {};
    for (const item of items) {
      if (!grouped[item.lesson]) grouped[item.lesson] = [];
      grouped[item.lesson].push(item);
    }
    return {
      classId,
      data: grouped,
    };
  }

  // TODO : Update chapter
  async updateChapter(id: string, dto: UpdateCurriculumDto, tutorId: string) {
    const curr = await this.repo.getCurriculumById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    await this.verifyClassOwner(curr.classId, tutorId);
    return this.repo.updateCurriculum(id, dto);
  }

  // TODO : Delete chapter
  async deleteChapter(id: string, tutorId: string) {
    const curr = await this.repo.getCurriculumById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    await this.verifyClassOwner(curr.classId, tutorId);
    await this.repo.deleteCurriculum(id);
    return { id };
  }

  // ── Lesson ──

  // TODO : Get lessons by class
  async getLessonsByClass(classId: string, tutorId: string) {
    return this.getChaptersByClass(classId, tutorId);
  }

  // TODO : Create a new lesson
  async createLesson(dto: CreateCurriculumDto, tutorId: string) {
    await this.verifyClassOwner(dto.classId, tutorId);
    return this.repo.createCurriculum(dto);
  }

  // TODO : Update lesson
  async updateLesson(id: string, dto: UpdateCurriculumDto, tutorId: string) {
    const curr = await this.repo.getCurriculumById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    await this.verifyClassOwner(curr.classId, tutorId);
    return this.repo.updateCurriculum(id, dto);
  }

  // TODO : Delete lesson
  async deleteLesson(id: string, tutorId: string) {
    const curr = await this.repo.getCurriculumById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    await this.verifyClassOwner(curr.classId, tutorId);
    await this.repo.deleteCurriculum(id);
    return { id };
  }

  // TODO : Add new row under same lesson
  async addRow(id: string, tutorId: string) {
    const curr = await this.repo.getCurriculumById(id);
    if (!curr) throw new NotFoundException('Curriculum not found');
    await this.verifyClassOwner(curr.classId, tutorId);

    return this.repo.createCurriculum({
      classId: curr.classId,
      lesson: curr.lesson,
      name: '',
      lecture: '',
      assignment: '',
      status: 'UPCOMING',
      order: (curr.order ?? 0) + 1,
    });
  }

  // ── Lecture Material ──

  // ── Assignment ──

  // TODO : Create assignment
  async createAssignment(dto: CreateAssignmentDto, tutorId: string) {
    await this.verifyClassOwner(dto.classId, tutorId);
    return this.repo.createAssignment(dto);
  }

  // TODO : Get assignments by class
  async getAssignmentsByClass(classId: string, lesson?: number, tutorId?: string) {
    if (tutorId) await this.verifyClassOwner(classId, tutorId);
    return this.repo.getAssignmentsByClass(classId, lesson);
  }

  // TODO : Update assignment
  async updateAssignment(id: string, dto: UpdateAssignmentDto, tutorId: string) {
    const asgn = await this.repo.getAssignmentById(id);
    if (!asgn) throw new NotFoundException('Assignment not found');
    await this.verifyClassOwner(asgn.classId, tutorId);
    return this.repo.updateAssignment(id, dto);
  }

  // TODO : Delete assignment
  async deleteAssignment(id: string, tutorId: string) {
    const asgn = await this.repo.getAssignmentById(id);
    if (!asgn) throw new NotFoundException('Assignment not found');
    await this.verifyClassOwner(asgn.classId, tutorId);
    await this.repo.deleteAssignment(id);
    return { id };
  }

  // TODO : Toggle assignment visibility (hide/show for students)
  async toggleHidden(id: string, tutorId: string) {
    const asgn = await this.repo.getAssignmentById(id);
    if (!asgn) throw new NotFoundException('Assignment not found');
    await this.verifyClassOwner(asgn.classId, tutorId);
    return this.repo.toggleHidden(id);
  }
}
