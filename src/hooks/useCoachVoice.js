/**
 * useCoachVoice — "giọng nói" của AI Coach: lấy SỐ LIỆU THẬT của hôm nay rồi để
 * engine luật (engine/coachVoice.js) sinh một câu ngắn đúng tính cách
 * (strict | zen | buddy). Đây là phần "có hồn" bổ sung cho thẻ AI Coach, chạy
 * song song với useCoachInsight (phần phân tích số liệu), KHÔNG thay nó.
 *
 * - GIỌNG CỐ ĐỊNH: thẻ động viên chỉ dùng MỘT giọng duy nhất (zen) — bỏ bộ chọn
 *   strict/zen/buddy theo yêu cầu của Đàm (2026-06-21). Đổi giọng = sửa hằng
 *   FIXED_COACH_PERSONALITY bên dưới.
 * - Bộ nhớ chống lặp giữ ở mức module, reset khi tải lại trang. Không localStorage.
 * - Chỉ sinh câu mới khi ngữ cảnh đổi (số phiên, đạt mục tiêu, buổi trong ngày,
 *   chuỗi...) để câu không nhảy loạn mỗi lần render.
 */
import { useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { getVietnamHour } from '../engine/time';
import { generateCoachMessage, createCoachMemory } from '../engine/coachVoice';

// Một giọng duy nhất cho thẻ động viên (calm). Muốn đổi → 'strict' | 'zen' | 'buddy'.
const FIXED_COACH_PERSONALITY = 'zen';

// Bộ nhớ chống lặp theo từng tính cách (sống suốt phiên dùng app).
const VOICE_MEMORY = {
  strict: createCoachMemory(),
  zen: createCoachMemory(),
  buddy: createCoachMemory(),
};

function hourToTimeOfDay(h) {
  if (h >= 5 && h < 11) return 'morning';
  if (h >= 11 && h < 13) return 'noon';
  if (h >= 13 && h < 17) return 'afternoon';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

export default function useCoachVoice({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  goalMet = false,
} = {}) {
  const streak = useGameStore((s) => s.streak);
  const personality = FIXED_COACH_PERSONALITY;
  const currentStreak = streak?.currentStreak ?? 0;

  const timeOfDay = hourToTimeOfDay(getVietnamHour());

  // Suy ra "sự kiện" cho thẻ luôn hiện trên màn Tập trung:
  // đã đạt mục tiêu ngày -> ghi nhận (acknowledge); còn lại -> khích lệ.
  const event = (sessionsCompletedToday > 0 && goalMet) ? 'session_end' : 'session_start';

  // Khoá ngữ cảnh: chỉ sinh câu mới khi một trong các yếu tố này đổi.
  const minuteBucket = Math.round(focusMinutesToday / 30);
  const sig = `${personality}|${event}|${sessionsCompletedToday}|${goalMet ? 1 : 0}|${timeOfDay}|${currentStreak}|${minuteBucket}`;

  return useMemo(() => {
    const context = {
      phase: 'focus',
      event,
      sessions_today: sessionsCompletedToday,
      interruptions: 0,
      time_of_day: timeOfDay,
      streak_days: currentStreak,
      total_focus_minutes: focusMinutesToday,
    };
    const out = generateCoachMessage(context, personality, VOICE_MEMORY[personality] || VOICE_MEMORY.zen);
    return { ...out, personality };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
}
