import { Intent } from '../intent/intent.enum';

/** Optional hint appended to the system prompt based on the detected intent. */
export const INTENT_HINTS: Record<Intent, string> = {
  [Intent.GENERAL]: '',
  [Intent.CLASSES]: 'Gợi ý: dùng công cụ getMyClasses.',
  [Intent.CURRICULUM]: 'Gợi ý: dùng công cụ getMyCurriculums.',
  [Intent.SCHEDULE]: 'Gợi ý: dùng công cụ getMySchedule.',
  [Intent.SESSIONS]:
    'Gợi ý: dùng công cụ getUpcomingSessions với tham số period phù hợp (today/tomorrow/this_week/next_week). Khi hỏi "bao nhiêu buổi", trả lời bằng đúng giá trị "count" mà công cụ trả về.',
  [Intent.TUITION]:
    'Gợi ý: dùng công cụ getMyTuitions. Nếu hỏi tổng/số lượng theo trạng thái, đọc thẳng từ "summary", không tự cộng lại từ danh sách.',
  [Intent.ASSIGNMENTS]:
    'Gợi ý: dùng công cụ getMyAssignments với tham số status phù hợp (SUBMITTED/GRADED/RESUBMIT) nếu câu hỏi nêu rõ trạng thái. Khi hỏi "bao nhiêu bài", trả lời bằng đúng giá trị "count".',
  [Intent.SCORES]:
    'Gợi ý: dùng công cụ getMyScores. Khi hỏi điểm trung bình, đọc thẳng giá trị "average", không tự tính lại.',
};
