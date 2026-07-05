import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseRepository } from './exercise.repository';
import { SessionRepository } from '../session/session.repository';
import { LessonService } from '../lesson/lesson.service';
import { UserService } from '../user/user.service';
import type { CreateExerciseDto } from '@packages/entities/exercise';
import { checkUuidValid } from '@packages/helpers';

@Injectable()
export class ExerciseService {
  constructor(
    private readonly repo: ExerciseRepository,
    private readonly userService: UserService,
    private readonly lessonService: LessonService,
    private readonly sessionRepo: SessionRepository,
  ) {}

  async create(dto: CreateExerciseDto) {
    if (!dto.tutorId || !checkUuidValid({ data: dto.tutorId })) {
      throw new BadRequestException('tutorId must be uuid ...');
    }
    if (!dto.studentId || !checkUuidValid({ data: dto.studentId })) {
      throw new BadRequestException('studentId must be uuid ...');
    }
    if (dto.lessonId && !checkUuidValid({ data: dto.lessonId })) {
      throw new BadRequestException('lessonId must be uuid ...');
    }
    if (dto.sessionId && !checkUuidValid({ data: dto.sessionId })) {
      throw new BadRequestException('sessionId must be uuid ...');
    }

    const tutor = await this.userService.getUserByField({ field: 'id', value: dto.tutorId });
    if (Array.isArray(tutor) && tutor.length === 0) {
      throw new BadRequestException('Tutor not found ...');
    }

    const student = await this.userService.getUserByField({ field: 'id', value: dto.studentId });
    if (Array.isArray(student) && student.length === 0) {
      throw new BadRequestException('Student not found ...');
    }

    if (dto.lessonId) {
      const lesson = await this.lessonService.getLessonByIdService({ id: dto.lessonId });
      if (!lesson) throw new BadRequestException('Lesson not found ...');
    }

    if (dto.sessionId) {
      const session = await this.sessionRepo.findById(dto.sessionId);
      if (!session) throw new BadRequestException('Session not found ...');
    }

    return this.repo.create(dto);
  }

  async findAll(query: { page: number; limit: number; sessionId?: string; studentId?: string }) {
    return this.repo.findAll(query);
  }

  async findById(id: string) {
    const ex = await this.repo.findById(id);
    if (!ex) throw new NotFoundException('Exercise not found');
    return ex;
  }

  async update(id: string, dto: Partial<CreateExerciseDto>) {
    const ex = await this.repo.findById(id);
    if (!ex) throw new NotFoundException('Exercise not found');
    const updated = await this.repo.update(id, dto);
    if (!updated) throw new NotFoundException('Exercise not found');
    return updated;
  }

  async delete(id: string) {
    const ex = await this.repo.findById(id);
    if (!ex) throw new NotFoundException('Exercise not found');
    await this.repo.delete(id);
    return { id };
  }
}
