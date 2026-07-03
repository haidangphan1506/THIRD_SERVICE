import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { CreateAssignmentDto, UpdateAssignmentDto } from '@packages/entities';
import { assignments } from 'src/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TheoryRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async findByLessonId(lessonId: string) {
    return await this.db.select().from(assignments).where(eq(assignments.lesson, lessonId));
  }

  async addUrl(lessonId: string, urlData: { url: string; name: string; key: string }) {
    return { success: true, lessonId, urlData };
  }

  async updateUrl(lessonId: string, urlId: string, updateData: Partial<{ name: string; key: string }>) {
    return { success: true, lessonId, urlId, updateData };
  }

  async deleteUrl(lessonId: string, urlId: string) {
    return { success: true, lessonId, urlId };
  }
}
