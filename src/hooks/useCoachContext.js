/**
 * useCoachContext — trả về một hàm dựng "bản tóm tắt số liệu" (chuỗi) từ trạng thái
 * hiện tại của store, để gửi cho AI Coach hỏi–đáp. Hàm được gọi LÚC GỬI (sự kiện),
 * không phải lúc render, nên dùng helper giờ VN trong đó là an toàn.
 */
import { useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { buildCoachContext, buildAnalystContext } from '../engine/coachContext';
import {
  getVietnamHour, getVietnamDayOfWeek, localWeekMondayStr, localPrevWeekMondayStr,
  vietnamDayNumber, localDateStr, localDateStrDaysAgo,
} from '../engine/time';

export default function useCoachContext({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
} = {}) {
  const history = useGameStore((s) => s.history);
  const streak = useGameStore((s) => s.streak);
  const sessionCategories = useGameStore((s) => s.sessionCategories);

  return useCallback(() => {
    const entryDate = (e) => new Date(e?.timestamp ?? 0);
    const useMinutes = dailyGoalType === 'minutes';
    const goalValue = useMinutes ? dailyGoalMinutes : dailyGoalSessions;
    const cats = sessionCategories ?? [];
    return buildCoachContext(history ?? [], {
      nowHour: getVietnamHour(),
      getEntryHour: (e) => getVietnamHour(entryDate(e)),
      getEntryWeekday: (e) => getVietnamDayOfWeek(entryDate(e)),
      getEntryWeekKey: (e) => localWeekMondayStr(entryDate(e)),
      nowWeekKey: localWeekMondayStr(),
      prevWeekKey: localPrevWeekMondayStr(),
      getEntryDayKey: (e) => localDateStr(entryDate(e)),
      todayKey: localDateStr(),
      minDayKey: localDateStrDaysAgo(28),
      getEntryDayNumber: (e) => vietnamDayNumber(entryDate(e)),
      nowDayNumber: vietnamDayNumber(),
      dailyGoalMetric: useMinutes ? 'minutes' : 'sessions',
      dailyGoal: goalValue,
      sessionsToday: sessionsCompletedToday,
      minutesToday: focusMinutesToday,
      currentStreak: streak?.currentStreak ?? 0,
      activeCategoryIds: new Set(cats.map((c) => c.id)),
      categoryLabelOf: (id) => cats.find((c) => c.id === id)?.label ?? null,
    });
  }, [history, streak, sessionCategories, sessionsCompletedToday, focusMinutesToday, dailyGoalType, dailyGoalSessions, dailyGoalMinutes]);
}

/**
 * useAnalystContext — như useCoachContext nhưng dựng bản tóm tắt GIÀU HƠN cho "Coach
 * offline" (LLM trên máy) ở phong cách phân tích chuyên sâu: nạp thêm tầng phân tích
 * sâu (buildAnalystContext) + todayWeekday + hasSessionToday cho dự đoán giữ-chuỗi.
 * Thẻ "Hỏi Claude" vẫn dùng useCoachContext (bản gọn) — KHÔNG đổi.
 */
export function useAnalystContext({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
} = {}) {
  const history = useGameStore((s) => s.history);
  const streak = useGameStore((s) => s.streak);
  const sessionCategories = useGameStore((s) => s.sessionCategories);

  return useCallback(() => {
    const entryDate = (e) => new Date(e?.timestamp ?? 0);
    const useMinutes = dailyGoalType === 'minutes';
    const goalValue = useMinutes ? dailyGoalMinutes : dailyGoalSessions;
    const cats = sessionCategories ?? [];
    return buildAnalystContext(history ?? [], {
      nowHour: getVietnamHour(),
      getEntryHour: (e) => getVietnamHour(entryDate(e)),
      getEntryWeekday: (e) => getVietnamDayOfWeek(entryDate(e)),
      getEntryWeekKey: (e) => localWeekMondayStr(entryDate(e)),
      nowWeekKey: localWeekMondayStr(),
      prevWeekKey: localPrevWeekMondayStr(),
      getEntryDayKey: (e) => localDateStr(entryDate(e)),
      todayKey: localDateStr(),
      minDayKey: localDateStrDaysAgo(28),
      getEntryDayNumber: (e) => vietnamDayNumber(entryDate(e)),
      nowDayNumber: vietnamDayNumber(),
      todayWeekday: getVietnamDayOfWeek(),
      hasSessionToday: sessionsCompletedToday > 0,
      dailyGoalMetric: useMinutes ? 'minutes' : 'sessions',
      dailyGoal: goalValue,
      sessionsToday: sessionsCompletedToday,
      minutesToday: focusMinutesToday,
      currentStreak: streak?.currentStreak ?? 0,
      activeCategoryIds: new Set(cats.map((c) => c.id)),
      categoryLabelOf: (id) => cats.find((c) => c.id === id)?.label ?? null,
    });
  }, [history, streak, sessionCategories, sessionsCompletedToday, focusMinutesToday, dailyGoalType, dailyGoalSessions, dailyGoalMinutes]);
}
