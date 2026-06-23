/**
 * useAnalystContext — trả về một hàm dựng "bản tóm tắt số liệu GIÀU" (chuỗi) từ trạng
 * thái store, để gửi cho AI Qwen trên máy (AI phân tích tổng thể + Hỏi Coach). Nạp tầng phân
 * tích sâu (buildAnalystContext) + todayWeekday + hasSessionToday cho dự đoán giữ-chuỗi.
 * Hàm trả về được gọi LÚC GỬI (sự kiện), không phải lúc render → dùng helper giờ VN an toàn.
 */
import { useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { buildAnalystContext } from '../engine/coachContext';
import {
  getVietnamHour, getVietnamDayOfWeek, localWeekMondayStr, localPrevWeekMondayStr,
  vietnamDayNumber, localDateStr, localDateStrDaysAgo,
} from '../engine/time';

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
    // 4 key tuần GẦN→XA (tuần hiện tại trước) cho xu hướng dài hạn. Date ở hook (gọi
    // lúc gửi) là an toàn — engine getMultiWeekTrend vẫn thuần.
    const weekKeysDesc = [0, 1, 2, 3].map((i) => localWeekMondayStr(new Date(Date.now() - (i * 7 * 86400000))));
    return buildAnalystContext(history ?? [], {
      nowHour: getVietnamHour(),
      getEntryHour: (e) => getVietnamHour(entryDate(e)),
      getEntryWeekday: (e) => getVietnamDayOfWeek(entryDate(e)),
      getEntryWeekKey: (e) => localWeekMondayStr(entryDate(e)),
      nowWeekKey: localWeekMondayStr(),
      prevWeekKey: localPrevWeekMondayStr(),
      weekKeysDesc,
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
