import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@packages/entities';
import { assignments } from 'src/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ExerciseRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async create(userId: string, data: CreateAssignmentDto) {
    const [exercise] = await this.db
      .insert(assignments)
      .values({
        id: uuidv4(),
        name: data.name,
        description: data.description ?? null,
        requirement: data.requirement ?? null,
        status: data.status ?? 'IN_PROGRESS',
        score: data.score?.toString() ?? null,
        comment: data.comment ?? null,
        isHidden: data.isHidden ?? false,
        classId: data.classId,
        lesson: data.lesson,
        curriculumId: data.curriculumId ?? null,
        userId,
      })
      .returning();
    return exercise;
  }

  async createWithLessonDependency(data: CreateAssignmentDto) {
    const [exercise] = await this.db
      .insert(assignments)
      .values({
        id: uuidv4(),
        name: data.name,
        description: data.description ?? null,
        requirement: data.requirement ?? null,
        status: data.status ?? 'IN_PROGRESS',
        score: data.score?.toString() ?? null,
        comment: data.comment ?? null,
        isHidden: data.isHidden ?? false,
        classId: data.classId,
        lesson: data.lesson,
        curriculumId: data.curriculumId ?? null,
      })
      .returning();
    return exercise;
  }

  async findAll({ userId }: { userId: string }) {
    return await this.db.select().from(assignments).where(eq(assignments.userId, userId));
  }

  async findById(id: string) {
    const [exercise] = await this.db.select().from(assignments).where(eq(assignments.id, id));
    return exercise ?? null;
  }

  async update(id: string, data: UpdateAssignmentDto) {
    const [exercise] = await this.db
      .update(assignments)
      .set(data)
      .where(eq(assignments.id, id))
      .returning();
    return exercise ?? null;
  }

  async delete(id: string) {
    const [exercise] = await this.db.delete(assignments).where(eq(assignments.id, id)).returning();
    return !!exercise;
  }
}
