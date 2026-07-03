import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { CreateLessonDto, UpdateLessonDto } from '@packages/entities';
import { lessons, chapters, assignments } from 'src/database/schema';
import { eq, and, not, ilike, count } from 'drizzle-orm';

@Injectable()
export class LessonRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async create(userId: string, data: CreateLessonDto) {
    const { title, description, order } = data;
    const [lesson] = await this.db
      .insert(lessons)
      .values({
        id: uuidv4(),
        userId,
        title,
        description: description ?? null,
        order: order ?? 0,
      })
      .returning();
    return lesson;
  }

  async findAll({ userId }: { userId: string }) {
    return await this.db.select().from(lessons).where(eq(lessons.userId, userId));
  }

  async findById(id: string) {
    const [lesson] = await this.db.select().from(lessons).where(eq(lessons.id, id));
    return lesson ?? null;
  }

  async update(id: string, data: UpdateLessonDto) {
    const [lesson] = await this.db
      .update(lessons)
      .set(data)
      .where(eq(lessons.id, id))
      .returning();
    return lesson ?? null;
  }

  async delete(id: string) {
    const [lesson] = await this.db.delete(lessons).where(eq(lessons.id, id)).returning();
    return !!lesson;
  }

  async findByUser(userId: string) {
    return await this.db.select().from(lessons).where(eq(lessons.userId, userId));
  }

  async findByCurriculumId(curriculumId: string) {
    return await this.db.select().from(lessons).where(eq(lessons.curriculumId as any, curriculumId));
  }

  async findByChapterId(chapterId: string) {
    return await this.db.select().from(lessons).where(eq(lessons.chapterId as any, chapterId));
  }

  async findChapterById(id: string) {
    const [chapter] = await this.db.select().from(chapters).where(eq(chapters.id, id));
    return chapter ?? null;
  }

  async findExerciseByLessonId(lessonId: string) {
    return await this.db.select().from(assignments).where(eq(assignments.lesson as any, lessonId));
  }

  async hasRelatedData(lessonId: string) {
    const theoryCount = await this.db
      .select({ count: count() })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .then(rows => Number(rows[0]?.count || 0));
    
    const exerciseCount = await this.db
      .select({ count: count() })
      .from(assignments)
      .where(eq(assignments.lesson as any, lessonId))
      .then(rows => Number(rows[0]?.count || 0));
    
    return theoryCount > 0 || exerciseCount > 0;
  }

  async createWithLessonDependency(userId: string, data: CreateLessonDto) {
    const { title, description, order, curriculumId, chapterId } = data;
    const [lesson] = await this.db
      .insert(lessons)
      .values({
        id: uuidv4(),
        userId,
        title,
        description: description ?? null,
        order: order ?? 0,
        curriculumId: curriculumId as any ?? null,
        chapterId: chapterId as any ?? null,
      })
      .returning();
    return lesson;
  }
}
