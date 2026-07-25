/**
 * multer/busboy decode the multipart `filename` header as latin1, so any
 * UTF-8 originalname (e.g. Vietnamese diacritics) comes out mojibake'd
 * (e.g. "Bài giảng.pdf" -> "BÃ i giáº£ng.pdf"). Re-interpreting the latin1
 * bytes as UTF-8 recovers the real filename; pure-ASCII names pass through
 * unchanged since ASCII bytes are identical in both encodings.
 */
export function decodeMulterFilename(originalname: string): string {
  return Buffer.from(originalname, 'latin1').toString('utf8');
}
