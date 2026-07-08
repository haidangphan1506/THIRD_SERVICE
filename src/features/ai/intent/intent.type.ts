import type { Intent } from './intent.enum';

/** Best-effort classification of a user message. */
export interface IntentResult {
  intent: Intent;
  /** Rough confidence in [0, 1] based on keyword matches. */
  confidence: number;
}
