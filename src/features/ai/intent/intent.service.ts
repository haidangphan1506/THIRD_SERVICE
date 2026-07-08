import { Injectable } from '@nestjs/common';
import { Intent } from './intent.enum';
import type { IntentResult } from './intent.type';

/** Keyword buckets used for lightweight, dependency-free intent detection. */
const KEYWORDS: Record<Exclude<Intent, Intent.GENERAL>, string[]> = {
  [Intent.CLASSES]: ['lớp', 'lớp học', 'môn', 'class'],
  [Intent.CURRICULUM]: ['chương trình', 'giáo trình', 'curriculum'],
  [Intent.SCHEDULE]: ['lịch', 'thời khóa biểu', 'thứ', 'schedule'],
  [Intent.SESSIONS]: ['buổi học', 'buổi', 'hôm nay', 'ngày mai', 'session', 'tuần', 'tháng'],
  [Intent.TUITION]: ['học phí', 'đóng tiền', 'nợ', 'thanh toán', 'tuition'],
  [Intent.ASSIGNMENTS]: ['bài tập', 'deadline', 'assignment', 'nộp bài'],
  [Intent.SCORES]: ['điểm', 'kết quả', 'nhận xét', 'score', 'grade'],
};

/**
 * Very small heuristic intent classifier. The model itself decides which tools
 * to call, so this is advisory only — used to enrich the prompt/telemetry.
 */
@Injectable()
export class IntentService {
  detectIntent(message: string): IntentResult {
    const text = (message ?? '').toLowerCase();

    let best: Intent = Intent.GENERAL;
    let bestHits = 0;

    for (const [intent, words] of Object.entries(KEYWORDS)) {
      const hits = words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
      if (hits > bestHits) {
        bestHits = hits;
        best = intent as Intent;
      }
    }

    const confidence = bestHits === 0 ? 0 : Math.min(1, bestHits / 2);
    return { intent: best, confidence };
  }
}
