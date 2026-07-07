import { Injectable } from '@nestjs/common';
import type { AiProvider } from './ai-provider.interface';

/**
 * Placeholder for an OpenAI-backed provider. Not yet wired — the `openai`
 * dependency and API key are intentionally not added. Kept so the factory can
 * switch providers via config once implemented.
 */
@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly name = 'openai';

  generate(): Promise<string> {
    throw new Error('OpenAI provider chưa được triển khai.');
  }
}
