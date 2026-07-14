import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiGenerateParams, AiToolDeclaration } from './ai-provider.interface';
import type { AiProvider } from './ai-provider.interface';

/** Safety cap on tool-call rounds to avoid an infinite model↔tool loop. */
const MAX_TOOL_ROUNDS = 5;
const DEFAULT_MODEL = 'x-ai/grok-4-fast';
const BASE_URL = 'https://openrouter.ai/api/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
}

interface ToolCall {
  id: string;
  type: 'function';
  function: { name: string; arguments: string };
}

interface ChatCompletionResponse {
  choices: {
    message: {
      content: string | null;
      tool_calls?: ToolCall[];
    };
  }[];
}

const toOpenAiTool = (tool: AiToolDeclaration) => ({
  type: 'function' as const,
  function: {
    name: tool.name,
    description: tool.description,
    parameters: tool.parametersJsonSchema,
  },
});

/**
 * OpenRouter provider with function-calling support, using OpenRouter's
 * OpenAI-compatible chat completions endpoint. The model may request one or
 * more tool calls per round; we execute them via `executeTool` and feed the
 * results back until it produces a final natural-language answer.
 */
@Injectable()
export class OpenRouterProvider implements AiProvider {
  readonly name = 'openrouter';
  private readonly logger = new Logger(OpenRouterProvider.name);
  private readonly apiKey?: string;
  private readonly model: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('OPENROUTER_API_KEY')?.trim();
    this.model = this.config.get<string>('OPENROUTER_MODEL')?.trim() || DEFAULT_MODEL;
  }

  async generate({
    systemInstruction,
    messages,
    tools,
    executeTool,
  }: AiGenerateParams): Promise<string> {
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemInstruction },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const openAiTools = tools?.length ? tools.map(toOpenAiTool) : undefined;

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.chatCompletion(chatMessages, openAiTools);
      const message = response.choices[0]?.message;
      const calls = message?.tool_calls ?? [];

      if (calls.length === 0 || !executeTool) {
        return message?.content ?? 'Xin lỗi, tôi không thể trả lời ngay lúc này.';
      }

      chatMessages.push({
        role: 'assistant',
        content: message?.content ?? null,
        tool_calls: calls,
      });

      const toolResults = await Promise.all(
        calls.map(async (call) => {
          const name = call.function.name;
          let result: unknown;
          try {
            const args = JSON.parse(call.function.arguments || '{}') as Record<string, unknown>;
            result = await executeTool(name, args);
          } catch (err) {
            this.logger.error(`Tool "${name}" failed`, err as Error);
            result = { error: 'Không thể truy vấn dữ liệu cho công cụ này.' };
          }
          return {
            role: 'tool' as const,
            tool_call_id: call.id,
            content: JSON.stringify(result),
          };
        }),
      );

      chatMessages.push(...toolResults);
    }

    this.logger.warn(`Reached MAX_TOOL_ROUNDS (${MAX_TOOL_ROUNDS}) without a final answer`);
    return 'Xin lỗi, tôi cần thêm thời gian để xử lý yêu cầu này.';
  }

  private async chatCompletion(
    messages: ChatMessage[],
    tools?: ReturnType<typeof toOpenAiTool>[],
  ): Promise<ChatCompletionResponse> {
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        tools,
        max_tokens: 1024,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenRouter API error (${res.status}): ${body}`);
    }

    return res.json() as Promise<ChatCompletionResponse>;
  }
}
