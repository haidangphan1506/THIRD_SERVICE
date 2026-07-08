import { Intent } from '../intent/intent.enum';

/** Optional hint appended to the system prompt based on the detected intent. */
export const INTENT_HINTS: Record<Intent, string> = {
  [Intent.GENERAL]: '',
  [Intent.CLASSES]: 'Gợi ý: dùng công cụ getMyClasses.',
  [Intent.CURRICULUM]: 'Gợi ý: dùng công cụ getMyCurriculums.',
  [Intent.SCHEDULE]: 'Gợi ý: dùng công cụ getMySchedule.',
  [Intent.SESSIONS]: 'Gợi ý: dùng công cụ getUpcomingSessions.',
  [Intent.TUITION]: 'Gợi ý: dùng công cụ getMyTuitions.',
  [Intent.ASSIGNMENTS]: 'Gợi ý: dùng công cụ getMyAssignments.',
  [Intent.SCORES]: 'Gợi ý: dùng công cụ getMyScores.',
};
