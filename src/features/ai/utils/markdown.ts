/**
 * Strip common Markdown decorations to a plain-text approximation.
 * Handy when a channel (SMS, plain notifications) can't render Markdown.
 */
export function stripMarkdown(md: string): string {
  return (md ?? '')
    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1') // inline / fenced code
    .replace(/\*\*([^*]+)\*\*/g, '$1') // bold
    .replace(/\*([^*]+)\*/g, '$1') // italic
    .replace(/^#{1,6}\s+/gm, '') // headings
    .replace(/^\s*[-*+]\s+/gm, '• ') // bullets
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
    .trim();
}

/** Collapse excess blank lines produced by model output. */
export function normalizeWhitespace(text: string): string {
  return (text ?? '').replace(/\n{3,}/g, '\n\n').trim();
}
