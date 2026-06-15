/**
 * useCoachInsight — tính lời khuyên AI Coach từ lịch sử thật (local, miễn phí) và
 * trả về { kind, text, reason }. Dùng chung cho thẻ Coach ở cột phải (desktop) lẫn
 * thẻ Coach gọn trên màn Tập trung điện thoại — để chỉ có MỘT nguồn logic.
 *
 * Bộ nhớ chống-lặp (recentKinds) lưu THEO THIẾT BỊ qua localStorage, không đồng bộ
 * qua Supabase để tránh đua ghi giữa các máy; chỉ ghi 1 lần mỗi ngày.
 */
import { useEffect, useState } from 'react';
import useGameStore from '../store/gameStore';
import { generateCoachInsight } from '../engine/gameMath';
import {
  getVietnamHour, getVietnamDayOfWeek, localWeekMondayStr, localPrevWeekMondayStr,
  vietnamDayNumber, localDateStr, localDateStrDaysAgo,
} from '../engine/time';

const COACH_RECENT_KEY = 'dc-coach-recent';

function readCoachRecentKinds() {
  try {
    const v = JSON.parse(localStorage.getItem(COACH_RECENT_KEY) || 'null');
    return Array.isArray(v?.kinds) ? v.kinds : [];
  } catch { return []; }
}

function recordCoachKind(kind, today) {
  try {
    const cur = JSON.parse(localStorage.getItem(COACH_RECENT_KEY) || 'null');
    if (cur && cur.day === today) return;            // hôm nay đã ghi rồi
    const prev = Array.isArray(cur?.kinds) ? cur.kinds : [];
    const kinds = [kind, ...prev.filter((k) => k !== kind)].slice(0, 4);
    localStorage.setItem(COACH_RECENT_KEY, JSON.stringify({ day: today, kinds }));
  } catch { /* bỏ qua nếu localStorage không dùng được */ }
}

export default function useCoachInsight({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
} = {}) {
  const history = useGameStore((s) => s.history);
  const streak = useGameStore((s) => s.streak);
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const [recentKinds] = useState(readCoachRecentKinds);

  const useMinutes = dailyGoalType === 'minutes';
  const goalValue = useMinutes ? dailyGoalMinutes : dailyGoalSessions;
  const currentStreak = streak?.currentStreak ?? 0;
  const entryDate = (e) => new Date(e?.timestamp ?? 0);
  const today = vietnamDayNumber();
  const activeCategoryIds = new Set((sessionCategories ?? []).map((c) => c.id));

  const coach = generateCoachInsight(history ?? [], {
    nowHour: getVietnamHour(),
    getEntryHour: (e) => getVietnamHour(entryDate(e)),
    getEntryWeekday: (e) => getVietnamDayOfWeek(entryDate(e)),
    getEntryWeekKey: (e) => localWeekMondayStr(entryDate(e)),
    nowWeekKey: localWeekMondayStr(),
    prevWeekKey: localPrevWeekMondayStr(),
    currentStreak,
    // Nhịp hôm nay + hiệu chỉnh mục tiêu ngày
    dailyGoalMetric: useMinutes ? 'minutes' : 'sessions',
    dailyGoal: goalValue,
    sessionsToday: sessionsCompletedToday,
    minutesToday: focusMinutesToday,
    // Loại việc bị bỏ bê (theo số-ngày VN) — chỉ xét loại còn tồn tại
    getEntryDayKey: (e) => localDateStr(entryDate(e)),
    todayKey: localDateStr(),
    minDayKey: localDateStrDaysAgo(28),
    getEntryDayNumber: (e) => vietnamDayNumber(entryDate(e)),
    nowDayNumber: today,
    activeCategoryIds,
    // Chống lặp theo thiết bị + xoay vòng theo NGÀY
    recentKinds,
    rotationSeed: today,
  });

  // Ghi lại loại lời khuyên đã hiện hôm nay để mai đỡ lặp (1 lần/ngày, theo máy).
  useEffect(() => {
    if (coach?.kind) recordCoachKind(coach.kind, today);
  }, [coach?.kind, today]);

  return coach;
}
