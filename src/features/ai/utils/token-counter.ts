import type { AiMessage } from '../interfaces/ai-message.interface';

/**
 * Rough token estimate (~4 chars/token). Good enough for budgeting/truncation
 * decisions without pulling in a full tokenizer dependency.
 */
export function estimateTokens(text: string): number {
  return Math.ceil((text?.length ?? 0) / 4);
}

/** Sum of estimated tokens across a list of messages. */
export function estimateMessagesTokens(messages: AiMessage[]): number {
  return messages.reduce((sum, m) => sum + estimateTokens(m.content), 0);
}
