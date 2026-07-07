import { Injectable } from '@nestjs/common';
import type { AiMessage } from '../interfaces/ai-message.interface';

interface StoredTurn extends AiMessage {
  userId: string;
  createdAt: Date;
}

/**
 * Placeholder chat persistence. Backed by an in-memory store for now; swap for a
 * Drizzle-backed table (e.g. `ai_chat_messages`) when durable history is needed.
 * Kept as a repository so the storage swap doesn't touch `ChatHistoryService`.
 */
@Injectable()
export class ChatRepository {
  private readonly store = new Map<string, StoredTurn[]>();

  append(userId: string, message: AiMessage): Promise<void> {
    const turns = this.store.get(userId) ?? [];
    turns.push({ ...message, userId, createdAt: new Date() });
    this.store.set(userId, turns);
    return Promise.resolve();
  }

  findRecent(userId: string, limit = 20): Promise<AiMessage[]> {
    const turns = this.store.get(userId) ?? [];
    return Promise.resolve(turns.slice(-limit).map(({ role, content }) => ({ role, content })));
  }

  clear(userId: string): Promise<void> {
    this.store.delete(userId);
    return Promise.resolve();
  }
}
