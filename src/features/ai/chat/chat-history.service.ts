import { Injectable } from '@nestjs/common';
import type { AiMessage } from '../interfaces/ai-message.interface';
import { ChatRepository } from './chat.repository';

/**
 * Records conversation turns and exposes recent history. Delegates storage to
 * `ChatRepository` (in-memory today, DB-backed later).
 */
@Injectable()
export class ChatHistoryService {
  constructor(private readonly repo: ChatRepository) {}

  async record(userId: string, message: AiMessage): Promise<void> {
    await this.repo.append(userId, message);
  }

  async getRecent(userId: string, limit = 20): Promise<AiMessage[]> {
    return this.repo.findRecent(userId, limit);
  }

  async clear(userId: string): Promise<void> {
    await this.repo.clear(userId);
  }
}
