/**
 * useCoachIntel — wire bộ máy Focus Intelligence (coachIntel.js) với store + giờ VN.
 * Trả { profile, predictions, report }. Memo theo lịch sử + ngày để khỏi tính lại
 * mỗi render. Song song useCoachInsight, KHÔNG đụng logic Briefing cũ.
 */
import { useMemo } from 'react';
import useGameStore from '../store/gameStore';
import { buildCoachIntel } from '../engine/coachIntel';
import {
  getVietnamHour, getVietnamDayOfWeek, localWeekMondayStr, localPrevWeekMondayStr,
  vietnamDayNumber, localDateStr, localDateStrDaysAgo,
} from '../engine/time';

export default function useCoachIntel({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
} = {}) {
  const history = useGameStore((s) => s.history);
  const streak = useGameStore((s) => s.streak);
  const sessionCategories = useGameStore((s) => s.sessionCategories);

  const dayNum = vietnamDayNumber();
  return useMemo(() => {
    const entryDate = (e) => new Date(e?.timestamp ?? 0);
    const useMinutes = dailyGoalType === 'minutes';
    const cats = sessionCategories ?? [];
    return buildCoachIntel(history ?? [], {
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
      nowDayNumber: dayNum,
      todayWeekday: getVietnamDayOfWeek(),
      hasSessionToday: sessionsCompletedToday > 0,
      activeCategoryIds: new Set(cats.map((c) => c.id)),
      categoryLabelOf: (id) => cats.find((c) => c.id === id)?.label ?? null,
      dailyGoalMetric: useMinutes ? 'minutes' : 'sessions',
      dailyGoal: useMinutes ? dailyGoalMinutes : dailyGoalSessions,
      sessionsToday: sessionsCompletedToday,
      minutesToday: focusMinutesToday,
      currentStreak: streak?.currentStreak ?? 0,
    });
  }, [history, streak, sessionCategories, dayNum, sessionsCompletedToday, focusMinutesToday, dailyGoalType, dailyGoalSessions, dailyGoalMinutes]);
}
