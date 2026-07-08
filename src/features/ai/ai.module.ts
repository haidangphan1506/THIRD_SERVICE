import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
// Providers
import { OpenRouterProvider } from './providers/openrouter.provider';
import { OpenAiProvider } from './providers/openai.provider';
import { ProviderFactory } from './providers/provider.factory';
// Prompt
import { PromptService } from './prompt/prompt.service';
// Intent
import { IntentService } from './intent/intent.service';
// Context
import { ContextService } from './context/context.service';
import { ClassContextService } from './context/class.context';
import { ScheduleContextService } from './context/schedule.context';
import { SessionContextService } from './context/session.context';
import { ExerciseContextService } from './context/exercise.context';
// RAG
import { RagService } from './rag/rag.service';
import { EmbeddingService } from './rag/embedding.service';
import { VectorSearchService } from './rag/vector-search.service';
// Chat history
import { ChatHistoryService } from './chat/chat-history.service';
import { ChatRepository } from './chat/chat.repository';

@Module({
  controllers: [AiController],
  providers: [
    AiService,
    // Providers
    OpenRouterProvider,
    OpenAiProvider,
    ProviderFactory,
    // Prompt & intent
    PromptService,
    IntentService,
    // Context
    ContextService,
    ClassContextService,
    ScheduleContextService,
    SessionContextService,
    ExerciseContextService,
    // RAG
    RagService,
    EmbeddingService,
    VectorSearchService,
    // Chat history
    ChatHistoryService,
    ChatRepository,
  ],
})
export class AiModule {}
