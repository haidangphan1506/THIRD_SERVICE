export type AiRole = 'user' | 'assistant';

/** One turn in a conversation, provider-agnostic. */
export interface AiMessage {
  role: AiRole;
  content: string;
}
