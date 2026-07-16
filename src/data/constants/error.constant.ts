import { ERROR_TRANSLATIONS, toCodeMap } from '../i18n';

/**
 * Stable error codes. Each value equals its key (e.g. `CLASS_NOT_FOUND`), which is
 * what services throw. `HttpExceptionFilter` localizes the code into the request
 * language via `ERROR_TRANSLATIONS`. To add a message, add it to `error.i18n.ts`.
 */
export const ERROR_MESSAGES = toCodeMap(ERROR_TRANSLATIONS);
