import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AiProvider } from './ai-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAiProvider } from './openai.provider';

/**
 * Selects the active AI provider from the `AI_PROVIDER` env var
 * (`gemini` by default).
 */
@Injectable()
export class ProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly gemini: GeminiProvider,
    private readonly openai: OpenAiProvider,
  ) {}

  getProvider(): AiProvider {
    const selected = this.config.get<string>('AI_PROVIDER')?.trim().toLowerCase();
    return selected === 'openai' ? this.openai : this.gemini;
  }
}
