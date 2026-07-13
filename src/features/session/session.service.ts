import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateSessionDto, CreateSessionsDto, UpdateSessionDto } from '@packages/entities/session';
import { checkUuidValid } from '@packages/helpers';
import { SessionRepository } from './session.repository';
import { ClassService } from '../class/class.service';
import { LessonService } from '../lesson/lesson.service';
import { UserService } from '../user/user.service';

@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);
  constructor(
    private readonly repo: SessionRepository,
    private readonly classService: ClassService,
    private readonly lessonService: LessonService,
    private readonly userService: UserService,
  ) {}

  // todo : validate optional lesson/tutor FKs before insert, defaulting tutor to the acting user ...
  private async resolveSessionRefs({
    userId,
    lessonId,
    tutorId,
  }: {
    userId: string;
    lessonId?: string | null;
    tutorId?: string | null;
  }): Promise<{ lessonId: string | null; tutorId: string }> {
    if (lessonId) {
      const lesson = await this.lessonService.getLessonByIdService({ id: lessonId });
      if (!lesson) throw new NotFoundException('Lesson not found ...');
    }

    // the acting tutor owns the class, so default the session tutor to them; if an explicit
    // tutorId is supplied, it must reference a real user.
    if (tutorId && tutorId !== userId) {
      const tutor = await this.userService.getUserByField({ field: 'id', value: tutorId });
      if (!tutor || tutor.length === 0) throw new NotFoundException('Tutor not found ...');
    }

    return { lessonId: lessonId ?? null, tutorId: tutorId ?? userId };
  }

  // todo : ensure the acting user owns the target class ...
  private async assertClassOwner({ userId, classId }: { userId: string; classId: string }) {
    if (!classId || !checkUuidValid({ data: classId }))
      throw new BadRequestException('Class Id must be uuid ...');

    const classData = await this.classService.getClassService({ userId, id: classId });
    if (!classData || (Array.isArray(classData) && classData.length === 0))
      throw new NotFoundException('Class not found ...');
    if (classData.tutorId !== userId) throw new NotFoundException('Class not found ...');

    return classData;
  }

  private async loadOwnedSession({ userId, id }: { userId: string; id: string }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');
    if (!id || !checkUuidValid({ data: id }))
      throw new BadRequestException('Session Id must be uuid ...');

    const session = await this.repo.getById({ id });
    if (!session) throw new NotFoundException('Session not found ...');

    await this.assertClassOwner({ userId, classId: session.classId });
    return session;
  }

  async createSessionService({ userId, data }: { userId: string; data: CreateSessionDto }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    await this.assertClassOwner({ userId, classId: data.classId });
    const refs = await this.resolveSessionRefs({
      userId,
      lessonId: data.lessonId,
      tutorId: data.tutorId,
    });
    return this.repo.create({ data: { ...data, ...refs } });
  }

  async createSessionsService({ userId, data }: { userId: string; data: CreateSessionsDto }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    await this.assertClassOwner({ userId, classId: data.classId });
    const items = await Promise.all(
      data.sessions.map(async (session) => ({
        ...session,
        ...(await this.resolveSessionRefs({
          userId,
          lessonId: session.lessonId,
          tutorId: session.tutorId,
        })),
      })),
    );
    return this.repo.createMany({ classId: data.classId, items });
  }

  async getSessionsByClassService({ userId, classId }: { userId: string; classId: string }) {
    if (!userId || !checkUuidValid({ data: userId }))
      throw new BadRequestException('User Id must be uuid ...');

    await this.assertClassOwner({ userId, classId });
    return this.repo.getByClass({ classId });
  }

  async getSessionService({ userId, id }: { userId: string; id: string }) {
    return this.loadOwnedSession({ userId, id });
  }

  async updateSessionService({
    userId,
    id,
    data,
  }: {
    userId: string;
    id: string;
    data: UpdateSessionDto;
  }) {
    await this.loadOwnedSession({ userId, id });
    return this.repo.update({ id, data });
  }

  async delSessionService({ userId, id }: { userId: string; id: string }) {
    await this.loadOwnedSession({ userId, id });

    const deleted = await this.repo.del({ id });
    if (!deleted) throw new NotFoundException('Session not found ...');

    return { id };
  }
}
