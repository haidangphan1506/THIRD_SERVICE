import { z } from 'zod';

/** Validation schema for `POST /ai-chat/chat` bodies. History is server-owned (DB-backed). */
export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000, 'Message too long'),
});

export type ChatRequestDto = z.infer<typeof chatRequestSchema>;

/** Validation schema for `GET /ai-chat/history` query params. */
export const getHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type GetHistoryQueryDto = z.infer<typeof getHistoryQuerySchema>;
