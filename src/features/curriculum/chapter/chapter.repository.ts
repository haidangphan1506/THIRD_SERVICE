import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from 'src/database/database.module';
import { drizzle } from 'drizzle-orm/postgres-js';
import { v4 as uuidv4 } from 'uuid';
import { CreateChapterDto, UpdateChapterDto } from '@packages/entities';
import { chapters } from 'src/database/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class ChapterRepository {
  constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

  async create(userId: string, data: CreateChapterDto) {
    const { title, description, order } = data;
    const [chapter] = await this.db
      .insert(chapters)
      .values({
        id: uuidv4(),
        userId,
        title,
        description: description ?? null,
        order: order ?? 0,
      })
      .returning();
    return chapter;
  }

  async findAll({ userId }: { userId: string }) {
    return await this.db.select().from(chapters).where(eq(chapters.userId, userId));
  }

  async findById(id: string) {
    const [chapter] = await this.db.select().from(chapters).where(eq(chapters.id, id));
    return chapter ?? null;
  }

  async update(id: string, data: UpdateChapterDto) {
    const [chapter] = await this.db
      .update(chapters)
      .set(data)
      .where(eq(chapters.id, id))
      .returning();
    return chapter ?? null;
  }

  async delete(id: string) {
    const [chapter] = await this.db.delete(chapters).where(eq(chapters.id, id)).returning();
    return !!chapter;
  }
}
