import { SUCCESS_TRANSLATIONS, toCodeMap } from '../i18n';

/**
 * Stable success codes. Each value equals its key (e.g. `CLASS_CREATED`). Set one on
 * a handler via `@ApiResponse({ message: SUCCESS_MESSAGES.CLASS_CREATED })`;
 * `ResponseInterceptor` localizes it via `SUCCESS_TRANSLATIONS`. To add a message,
 * add it to `success.i18n.ts`.
 */
export const SUCCESS_MESSAGES = toCodeMap(SUCCESS_TRANSLATIONS);
