/**
 * useCoachQA — nối "Hỏi Coach" offline với store + giờ VN. Dựng bundle (buildCoachIntel
 * 1 lần) + index router (memo), trả hàm ask(text) trả lời ĐỒNG BỘ (0ms, offline).
 */
import { useMemo, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import { buildCoachBundle, answerQuestion } from '../engine/qa/coachQA';
import { buildIntentIndex } from '../engine/qa/intentRouter';
import { analyzeNoteThemes } from '../engine/semantic/semantic';
import {
  getVietnamHour, getVietnamDayOfWeek, localWeekMondayStr, localPrevWeekMondayStr,
  vietnamDayNumber, localDateStr, localDateStrDaysAgo,
} from '../engine/time';

export default function useCoachQA({
  sessionsCompletedToday = 0,
  focusMinutesToday = 0,
  dailyGoalType = 'sessions',
  dailyGoalSessions = 5,
  dailyGoalMinutes = 125,
} = {}) {
  const history = useGameStore((s) => s.history);
  const streak = useGameStore((s) => s.streak);
  const sessionCategories = useGameStore((s) => s.sessionCategories);

  const index = useMemo(() => buildIntentIndex(), []);
  const dayNum = vietnamDayNumber();

  const bundle = useMemo(() => {
    const entryDate = (e) => new Date(e?.timestamp ?? 0);
    const useMinutes = dailyGoalType === 'minutes';
    const cats = sessionCategories ?? [];
    const opts = {
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
    };
    const store = {
      streak: { currentStreak: streak?.currentStreak ?? 0, longestStreak: streak?.longestStreak ?? 0 },
      dailyGoalMetric: opts.dailyGoalMetric, dailyGoal: opts.dailyGoal,
      sessionsToday: sessionsCompletedToday, minutesToday: focusMinutesToday,
    };
    return buildCoachBundle(history ?? [], opts, store, analyzeNoteThemes(history ?? []));
  }, [history, streak, sessionCategories, dayNum, sessionsCompletedToday, focusMinutesToday, dailyGoalType, dailyGoalSessions, dailyGoalMinutes]);

  return useCallback((text) => answerQuestion(text, bundle, index), [bundle, index]);
}
