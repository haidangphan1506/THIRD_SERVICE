import type { AiMessage } from '../interfaces/ai-message.interface';

/** A tool the model may call. `parametersJsonSchema` is plain JSON Schema. */
export interface AiToolDeclaration {
  name: string;
  description: string;
  parametersJsonSchema: Record<string, unknown>;
}

/** Runs a tool the model asked for and returns a JSON-serialisable result. */
export type AiToolExecutor = (name: string, args: Record<string, unknown>) => Promise<unknown>;

export interface AiGenerateParams {
  systemInstruction: string;
  messages: AiMessage[];
  tools?: AiToolDeclaration[];
  executeTool?: AiToolExecutor;
}

/** Provider-agnostic contract implemented by OpenRouter/OpenAI/etc. */
export interface AiProvider {
  readonly name: string;
  generate(params: AiGenerateParams): Promise<string>;
}
