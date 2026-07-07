import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, type Content } from '@google/genai';
import type { AiGenerateParams, AiProvider } from './ai-provider.interface';

/** Safety cap on tool-call rounds to avoid an infinite model↔tool loop. */
const MAX_TOOL_ROUNDS = 5;
const MODEL = 'gemini-2.5-flash';

/**
 * Google Gemini provider with function-calling support. The model may request
 * one or more tool calls per round; we execute them via `executeTool` and feed
 * the results back until it produces a final natural-language answer.
 */
@Injectable()
export class GeminiProvider implements AiProvider {
  readonly name = 'gemini';
  private readonly logger = new Logger(GeminiProvider.name);
  private readonly ai: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY')?.trim(),
    });
  }

  async generate({
    systemInstruction,
    messages,
    tools,
    executeTool,
  }: AiGenerateParams): Promise<string> {
    const contents: Content[] = messages.map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    const config = {
      systemInstruction,
      maxOutputTokens: 1024,
      temperature: 0.3,
      tools: tools?.length ? [{ functionDeclarations: tools }] : undefined,
    };

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await this.ai.models.generateContent({ model: MODEL, contents, config });

      const calls = response.functionCalls ?? [];
      if (calls.length === 0 || !executeTool) {
        return response.text ?? 'Xin lỗi, tôi không thể trả lời ngay lúc này.';
      }

      // Record the model's tool-call turn, then run each call and feed results back.
      contents.push({ role: 'model', parts: calls.map((c) => ({ functionCall: c })) });

      const resultParts = await Promise.all(
        calls.map(async (call) => {
          const name = call.name ?? '';
          let result: unknown;
          try {
            result = await executeTool(name, call.args ?? {});
          } catch (err) {
            this.logger.error(`Tool "${name}" failed`, err as Error);
            result = { error: 'Không thể truy vấn dữ liệu cho công cụ này.' };
          }
          return { functionResponse: { name, response: result as Record<string, unknown> } };
        }),
      );

      contents.push({ role: 'user', parts: resultParts });
    }

    this.logger.warn(`Reached MAX_TOOL_ROUNDS (${MAX_TOOL_ROUNDS}) without a final answer`);
    return 'Xin lỗi, tôi cần thêm thời gian để xử lý yêu cầu này.';
  }
}
