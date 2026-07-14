import type { AiMessage } from '../interfaces/ai-message.interface';

/** Payload returned to the client (wrapped by the global `ResponseInterceptor`). */
export interface AiResponseDto {
  reply: string;
}

/** Payload returned by `GET /ai-chat/history`. */
export interface AiHistoryResponseDto {
  messages: AiMessage[];
}
