import { Inject, Injectable } from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../database/database.module';
import { CreateSessionDto, CreateSessionsDto, UpdateSessionDto } from '@packages/entities/session';
import { sessions } from 'src/database/schema';

@Injectable()
export class SessionRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async create({ data }: { data: CreateSessionDto }) {
    const [session] = await this.db
      .insert(sessions)
      .values({
        classId: data.classId,
        lessonId: data.lessonId,
        tutorId: data.tutorId,
        title: data.title,
        description: data.description,
        sessionNumber: data.sessionNumber,
        theoryUrls: data.theoryUrls,
        exerciseUrls: data.exerciseUrls,
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location,
        status: data.status,
        note: data.note,
        actualStartAt: data.actualStartAt,
        actualEndAt: data.actualEndAt,
      })
      .returning();
    return session;
  }

  async createMany({ classId, items }: { classId: string; items: CreateSessionsDto['sessions'] }) {
    const rows = await this.db
      .insert(sessions)
      .values(
        items.map((item) => ({
          classId,
          lessonId: item.lessonId,
          tutorId: item.tutorId,
          title: item.title,
          description: item.description,
          sessionNumber: item.sessionNumber,
          theoryUrls: item.theoryUrls,
          exerciseUrls: item.exerciseUrls,
          startAt: item.startAt,
          endAt: item.endAt,
          location: item.location,
          status: item.status,
          note: item.note,
          actualStartAt: item.actualStartAt,
          actualEndAt: item.actualEndAt,
        })),
      )
      .returning();
    return rows;
  }

  async getByClass({ classId }: { classId: string }) {
    return this.db
      .select()
      .from(sessions)
      .where(eq(sessions.classId, classId))
      .orderBy(asc(sessions.sessionNumber), asc(sessions.startAt));
  }

  async getById({ id }: { id: string }) {
    const [session] = await this.db.select().from(sessions).where(eq(sessions.id, id)).limit(1);
    return session;
  }

  async update({ id, data }: { id: string; data: UpdateSessionDto }) {
    const [session] = await this.db
      .update(sessions)
      .set({
        lessonId: data.lessonId,
        tutorId: data.tutorId,
        title: data.title,
        description: data.description,
        sessionNumber: data.sessionNumber,
        theoryUrls: data.theoryUrls,
        exerciseUrls: data.exerciseUrls,
        startAt: data.startAt,
        endAt: data.endAt,
        location: data.location,
        status: data.status,
        note: data.note,
        actualStartAt: data.actualStartAt,
        actualEndAt: data.actualEndAt,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, id))
      .returning();
    return session;
  }

  async del({ id }: { id: string }) {
    const [session] = await this.db.delete(sessions).where(eq(sessions.id, id)).returning();
    return !!session;
  }
}
