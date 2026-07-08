import { Injectable } from '@nestjs/common';
import type { AiUserContext } from '../interfaces/ai-context.interface';
import type { Intent } from '../intent/intent.enum';
import { buildSystemPrompt } from './system.prompt';
import { INTENT_HINTS } from './prompt.template';

/** Builds the final system instruction for a chat turn. */
@Injectable()
export class PromptService {
  buildSystemPrompt(ctx: AiUserContext, intent?: Intent): string {
    const base = buildSystemPrompt(ctx.role, new Date().toISOString());
    const hint = intent ? INTENT_HINTS[intent] : '';
    return hint ? `${base}\n\n${hint}` : base;
  }
}
