import { Inject, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import { DRIZZLE } from '../../../database/database.module';
import { aiMessages } from '../../../database/schema';
import type { AiMessage, AiRole } from '../interfaces/ai-message.interface';

const toDbRole = (role: AiRole): 'USER' | 'ASSISTANT' => (role === 'user' ? 'USER' : 'ASSISTANT');
const toAiRole = (role: 'USER' | 'ASSISTANT'): AiRole => (role === 'USER' ? 'user' : 'assistant');

/** Drizzle-backed chat history, scoped per user. */
@Injectable()
export class ChatRepository {
  constructor(
    @Inject(DRIZZLE)
    private readonly db: ReturnType<typeof drizzle>,
  ) {}

  async append(userId: string, message: AiMessage): Promise<void> {
    await this.db.insert(aiMessages).values({
      userId,
      role: toDbRole(message.role),
      content: message.content,
    });
  }

  async findRecent(userId: string, limit = 20): Promise<AiMessage[]> {
    const rows = await this.db
      .select({ role: aiMessages.role, content: aiMessages.content })
      .from(aiMessages)
      .where(eq(aiMessages.userId, userId))
      .orderBy(desc(aiMessages.createdAt))
      .limit(limit);

    return rows.reverse().map((row) => ({ role: toAiRole(row.role), content: row.content }));
  }

  async clear(userId: string): Promise<void> {
    await this.db.delete(aiMessages).where(eq(aiMessages.userId, userId));
  }
}
