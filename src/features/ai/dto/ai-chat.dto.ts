import { z } from 'zod';

/** Validation schema for `POST /ai-chat/chat` bodies. */
export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
  history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;
