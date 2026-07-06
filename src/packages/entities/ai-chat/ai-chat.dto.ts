import { z } from 'zod';
import { chatRequestSchema } from './ai-chat.schema';

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;

export interface ChatResponseDto {
  reply: string;
}
