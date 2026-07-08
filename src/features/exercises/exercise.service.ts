import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExerciseRepository } from './exercise.repository';
import { SessionRepository } from '../session/session.repository';
import { LessonService } from '../lesson/lesson.service';
import { UserService } from '../user/user.service';
import type {
  CreateExerciseDto,
  GradeExerciseDto,
  SubmitExerciseDto,
} from '@packages/entities/exercise';
import { checkUuidValid } from '@packages/helpers';
import { NotificationService } from '../notification/notification.service';

type AuthUser = { id: string; role?: string };

@Injectable()
export class ExerciseService {
  constructor(
    private readonly repo: ExerciseRepository,
    private readonly userService: UserService,
    private readonly lessonService: LessonService,
    private readonly sessionRepo: SessionRepository,
    private readonly notificationService: NotificationService,
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

    const result = await this.repo.create(dto);
    void this.notificationService.createInternal({
      type: 'STUDENT',
      senderId: dto.tutorId,
      userId: dto.studentId,
      title: 'Bài tập mới',
      content: 'Gia sư đã giao bài tập mới cho bạn.',
      actionType: 'VIEW',
      actionLabel: 'Xem bài tập',
    });
    return result;
  }

  async findAll(query: {
    page: number;
    limit: number;
    sessionId?: string;
    studentId?: string;
    classId?: string;
    tutorId?: string;
  }) {
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

  /** Student (re)submits their work. Only the owning student may submit. */
  async submit(id: string, dto: SubmitExerciseDto, user: AuthUser) {
    const ex = await this.repo.findById(id);
    if (!ex) throw new NotFoundException('Exercise not found');
    if (ex.studentId !== user.id) {
      throw new ForbiddenException('Bạn không thể nộp bài cho học sinh khác');
    }
    const updated = await this.repo.submit(id, dto.exerciseUrls);
    if (!updated) throw new NotFoundException('Exercise not found');
    void this.notificationService.createInternal({
      type: 'STUDENT',
      senderId: user.id,
      userId: ex.tutorId,
      title: 'Học sinh đã nộp bài',
      content: 'Học sinh đã nộp bài tập, vui lòng kiểm tra và chấm điểm.',
      actionType: 'VIEW',
      actionLabel: 'Xem bài nộp',
    });
    return updated;
  }

  /** Tutor grades a submission. Only a TUTOR/ADMIN (the assigned tutor) may grade. */
  async grade(id: string, dto: GradeExerciseDto, user: AuthUser) {
    const ex = await this.repo.findById(id);
    if (!ex) throw new NotFoundException('Exercise not found');
    const isPrivileged = user.role === 'TUTOR' || user.role === 'ADMIN';
    if (!isPrivileged || (user.role === 'TUTOR' && ex.tutorId !== user.id)) {
      throw new ForbiddenException('Chỉ gia sư phụ trách mới được chấm điểm');
    }
    const graded = await this.repo.grade(id, dto);
    if (!graded) throw new NotFoundException('Exercise not found');
    void this.notificationService.createInternal({
      type: 'STUDENT',
      senderId: user.id,
      userId: ex.studentId,
      title: 'Bài tập đã được chấm điểm',
      content: `Bài tập của bạn đã được chấm. Điểm: ${dto.score ?? 'chưa có điểm'}.`,
      actionType: 'VIEW',
      actionLabel: 'Xem kết quả',
    });
    return graded;
  }

  async delete(id: string) {
    const ex = await this.repo.findById(id);
    if (!ex) throw new NotFoundException('Exercise not found');
    await this.repo.delete(id);
    return { id };
  }
}
