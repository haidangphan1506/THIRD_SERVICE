import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DEFAULT_LANGUAGE, type SupportedLanguage } from '@packages/guards/language.guard';

/**
 * Resolves the request language set by {@link LanguageGuard} from the
 * `Accept-Language` header. Falls back to {@link DEFAULT_LANGUAGE} when the
 * guard did not run (e.g. on routes reached before it).
 */
export function languageFactory(_data: unknown, ctx: ExecutionContext): SupportedLanguage {
  const request = ctx.switchToHttp().getRequest<{ language?: SupportedLanguage }>();
  return request.language ?? DEFAULT_LANGUAGE;
}

export const Language = createParamDecorator(languageFactory);
