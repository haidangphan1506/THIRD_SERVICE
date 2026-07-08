import type { Intent } from '../intent/intent.enum';

/** Result of a chat turn returned by `AiService`. */
export interface AiResponse {
  reply: string;
  /** Detected intent of the user's message (best-effort). */
  intent?: Intent;
}
