import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import type { ChatRequestDto, ChatResponseDto } from '@packages/entities/ai-chat';

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);
  private readonly ai: GoogleGenAI;

  constructor(private readonly config: ConfigService) {
    this.ai = new GoogleGenAI({
      apiKey: this.config.get<string>('GEMINI_API_KEY'),
    });
  }

  async chat(dto: ChatRequestDto): Promise<ChatResponseDto> {
    const systemPrompt = `
Bạn là trợ lý AI của ứng dụng Gia Sư Pro — một nền tảng quản lý gia sư và học tập.
Bạn hỗ trợ giáo viên, học sinh và phụ huynh trong các công việc liên quan đến giáo dục.

Hướng dẫn:
- Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu.
- Giọng điệu chuyên nghiệp, thân thiện.
- Nếu được hỏi về dữ liệu cụ thể, hãy hướng dẫn người dùng vào trang tương ứng trong ứng dụng.
- Nếu không biết câu trả lời, hãy thành thật và đề nghị giúp đỡ việc khác.
`.trim();

    const history = (dto.history ?? []).map((m) => ({
      role: m.role === 'assistant' ? ('model' as const) : ('user' as const),
      parts: [{ text: m.content }],
    }));

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [...history, { role: 'user' as const, parts: [{ text: dto.message }] }],
        config: {
          systemInstruction: systemPrompt,
          maxOutputTokens: 1024,
          temperature: 0.7,
        },
      });

      const reply = response.text ?? 'Xin lỗi, tôi không thể trả lời ngay lúc này.';
      return { reply };
    } catch (error) {
      this.logger.error('Gemini API error', error);
      throw error;
    }
  }
}
