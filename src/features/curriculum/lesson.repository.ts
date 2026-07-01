import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { CreateLessonDto, UpdateLessonDto } from '@packages/entities';
import { lessons } from 'src/database/schema';
import { eq, inArray } from 'drizzle-orm';

@Injectable()
export class LessonRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async create(curriculumId: string, data: CreateLessonDto) {
    const { title, description, theoryUrls, exerciseUrls, order } = data;
    const [lesson] = await this.db
      .insert(lessons)
      .values({
        id: uuidv4(),
        curriculumId,
        title,
        description: description ?? null,
        theoryUrls: theoryUrls ?? [],
        exerciseUrls: exerciseUrls ?? [],
        order: order ?? 0,
      })
      .returning();
    return lesson;
  }

  async findByCurriculumId(curriculumId: string) {
    return await this.db.select().from(lessons).where(eq(lessons.curriculumId, curriculumId));
  }

  async findByCurriculumIds(curriculumIds: string[]) {
    if (curriculumIds.length === 0) return [];
    return await this.db.select().from(lessons).where(inArray(lessons.curriculumId, curriculumIds));
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

  async addTheoryUrls(id: string, files: { name: string; url: string; key: string }[]) {
    const lesson = await this.findById(id);
    if (!lesson) return null;
    const merged = [...(lesson.theoryUrls ?? []), ...files];
    return this.update(id, { theoryUrls: merged });
  }

  async addExerciseUrls(id: string, files: { name: string; url: string; key: string }[]) {
    const lesson = await this.findById(id);
    if (!lesson) return null;
    const merged = [...(lesson.exerciseUrls ?? []), ...files];
    return this.update(id, { exerciseUrls: merged });
  }

  async removeTheoryUrl(id: string, url: string) {
    const lesson = await this.findById(id);
    if (!lesson) return null;
    const filtered = (lesson.theoryUrls ?? []).filter((f) => f.url !== url);
    return this.update(id, { theoryUrls: filtered });
  }

  async removeExerciseUrl(id: string, url: string) {
    const lesson = await this.findById(id);
    if (!lesson) return null;
    const filtered = (lesson.exerciseUrls ?? []).filter((f) => f.url !== url);
    return this.update(id, { exerciseUrls: filtered });
  }
}
