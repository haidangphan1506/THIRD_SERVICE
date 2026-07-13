import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateExerciseDto,
  GradeExerciseDto,
  SubmitExerciseDto,
  getExerciseDto,
} from '@packages/entities/exercise';
import { checkUuidValid } from '@packages/helpers';
import { ExerciseRepository } from './exercise.repository';
import { UserService } from '../user/user.service';
import { SessionService } from '../session/session.service';
import { LessonService } from '../lesson/lesson.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class ExerciseService {
  private readonly logger = new Logger(ExerciseService.name);
  constructor(
    private readonly repo: ExerciseRepository,
    private readonly userService: UserService,
    private readonly sessionService: SessionService,
    private readonly lessonService: LessonService,
    private readonly notificationService: NotificationService,
  ) {}

  private assertUuid(value: string | null | undefined, label: string) {
    if (!value || !checkUuidValid({ data: value })) {
      throw new BadRequestException(`${label} must be a valid UUID`);
    }
  }

  private async assertUserExists(id: string, label: string) {
    const user = await this.userService.getUserByField({ field: 'id', value: id });
    if (!user || (Array.isArray(user) && user.length === 0)) {
      throw new NotFoundException(`${label} not found ...`);
    }
  }

  // validate the optional cross-entity FKs (session/lesson) before touching the DB
  private async resolveRefs({
    userId,
    sessionId,
    lessonId,
  }: {
    userId: string;
    sessionId?: string | null;
    lessonId?: string | null;
  }) {
    if (sessionId) {
      this.assertUuid(sessionId, 'sessionId');
      // access-checked read: throws NotFound when the user cannot reach the session
      await this.sessionService.getSessionService({ userId, id: sessionId });
    }
    if (lessonId) {
      this.assertUuid(lessonId, 'lessonId');
      const lesson = await this.lessonService.getLessonByIdService({ id: lessonId });
      if (!lesson) throw new NotFoundException('Lesson not found ...');
    }
  }

  async createExerciseService({ userId, data }: { userId: string; data: CreateExerciseDto }) {
    this.assertUuid(userId, 'User Id');

    // the acting user must be a party to the submission (the student who nop bai, or their tutor)
    if (data.studentId !== userId && data.tutorId !== userId) {
      throw new ForbiddenException('You cannot submit this exercise ...');
    }

    await this.assertUserExists(data.tutorId, 'Tutor');
    await this.assertUserExists(data.studentId, 'Student');
    await this.resolveRefs({ userId, sessionId: data.sessionId, lessonId: data.lessonId });

    // one submission per (student, session) — resubmits go through the submit endpoint
    if (data.sessionId) {
      const existing = await this.repo.findByStudentSession({
        studentId: data.studentId,
        sessionId: data.sessionId,
      });
      if (existing) {
        throw new ConflictException('Exercise already submitted for this session ...');
      }
    }

    const created = await this.repo.create({ data: { ...data, status: 'SUBMITTED' } });
    // notify the tutor that a student has submitted work
    void this.notificationService.createInternal({
      type: 'STUDENT',
      senderId: userId,
      userId: data.tutorId,
      studentId: data.studentId,
      title: 'Học sinh nộp bài tập',
      content: 'Một học sinh vừa nộp bài tập. Vào chấm bài ngay.',
      actionType: 'VIEW',
      actionLabel: 'Xem bài nộp',
    });
    return created;
  }

  async getExercisesService({ userId, query }: { userId: string; query: getExerciseDto }) {
    this.assertUuid(userId, 'User Id');
    return this.repo.findAll({ userId, query });
  }

  async getExerciseService({ userId, id }: { userId: string; id: string }) {
    this.assertUuid(userId, 'User Id');
    this.assertUuid(id, 'Exercise Id');

    const found = await this.repo.findById({ id });
    if (!found) throw new NotFoundException('Exercise not found ...');
    if (found.studentId !== userId && found.tutorId !== userId) {
      throw new NotFoundException('Exercise not found ...');
    }
    return found;
  }

  // student re-submits their own work (only while it has not been graded)
  async submitExerciseService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: SubmitExerciseDto;
  }) {
    this.assertUuid(userId, 'User Id');
    this.assertUuid(id, 'Exercise Id');

    const found = await this.repo.findById({ id });
    if (!found) throw new NotFoundException('Exercise not found ...');
    if (found.studentId !== userId) {
      throw new ForbiddenException('You can only re-submit your own exercise ...');
    }
    if (found.status === 'GRADED') {
      throw new BadRequestException('Exercise already graded — cannot re-submit ...');
    }

    const updated = await this.repo.update({
      id,
      data: { exerciseUrls: data.exerciseUrls, status: 'SUBMITTED' },
    });
    // notify the tutor that the student re-submitted their work
    void this.notificationService.createInternal({
      type: 'STUDENT',
      senderId: userId,
      userId: found.tutorId,
      studentId: found.studentId,
      title: 'Học sinh nộp lại bài tập',
      content: 'Một học sinh vừa nộp lại bài tập. Vào chấm bài ngay.',
      actionType: 'VIEW',
      actionLabel: 'Xem bài nộp',
    });
    return updated;
  }

  // tutor grades the submission
  async gradeExerciseService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: GradeExerciseDto;
  }) {
    this.assertUuid(userId, 'User Id');
    this.assertUuid(id, 'Exercise Id');

    const found = await this.repo.findById({ id });
    if (!found) throw new NotFoundException('Exercise not found ...');
    if (found.tutorId !== userId) {
      throw new ForbiddenException('Only the assigned tutor can grade this exercise ...');
    }

    const graded = await this.repo.update({
      id,
      data: {
        score: String(data.score),
        comment: data.comment ?? null,
        status: 'GRADED',
        gradedAt: new Date(),
      },
    });
    // notify the student that their exercise has been graded
    void this.notificationService.createInternal({
      type: 'TUTOR',
      senderId: userId,
      userId: found.studentId,
      studentId: found.studentId,
      title: 'Bài tập đã được chấm',
      content: `Bài tập của bạn đã được chấm điểm: ${data.score}/10${
        data.comment ? ` — ${data.comment}` : ''
      }`,
      actionType: 'VIEW',
      actionLabel: 'Xem kết quả',
      redirectUrl: '/grades',
    });
    return graded;
  }
}
