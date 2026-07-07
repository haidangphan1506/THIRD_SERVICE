import { Injectable, Logger } from '@nestjs/common';
import type { ChatRequestDto } from './dto/ai-chat.dto';
import type { AiResponseDto } from './dto/ai-response.dto';
import type { AiUserContext } from './interfaces/ai-context.interface';
import type { AiMessage } from './interfaces/ai-message.interface';
import { ProviderFactory } from './providers/provider.factory';
import { ContextService } from './context/context.service';
import { PromptService } from './prompt/prompt.service';
import { IntentService } from './intent/intent.service';
import { RagService } from './rag/rag.service';
import { ChatHistoryService } from './chat/chat-history.service';

/**
 * Orchestrates a chat turn: detect intent → build system prompt → select provider
 * → generate (with data tools + optional RAG) → persist history → return reply.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly context: ContextService,
    private readonly prompt: PromptService,
    private readonly intent: IntentService,
    private readonly rag: RagService,
    private readonly history: ChatHistoryService,
  ) {}

  async chat(dto: ChatRequestDto, user: AiUserContext): Promise<AiResponseDto> {
    const { intent } = this.intent.detectIntent(dto.message);

    let systemInstruction = this.prompt.buildSystemPrompt(user, intent);

    // RAG is disabled today (returns []), but wired so enabling it needs no changes here.
    const snippets = await this.rag.retrieve(dto.message);
    if (snippets.length > 0) {
      systemInstruction += `\n\nNgữ cảnh tham khảo:\n${snippets.join('\n')}`;
    }

    const messages: AiMessage[] = [...(dto.history ?? []), { role: 'user', content: dto.message }];

    const provider = this.providerFactory.getProvider();

    try {
      const reply = await provider.generate({
        systemInstruction,
        messages,
        tools: this.context.getToolDeclarations(),
        executeTool: (name, args) => this.context.executeTool(name, args, user),
      });

      // Best-effort history persistence — never fail the request over it.
      void this.persist(user.userId, dto.message, reply);

      return { reply };
    } catch (error) {
      this.logger.error(`AI provider "${provider.name}" error`, error as Error);
      throw error;
    }
  }

  private async persist(userId: string, message: string, reply: string): Promise<void> {
    try {
      await this.history.record(userId, { role: 'user', content: message });
      await this.history.record(userId, { role: 'assistant', content: reply });
    } catch (err) {
      this.logger.warn(`Failed to persist chat history: ${(err as Error).message}`);
    }
  }
}
