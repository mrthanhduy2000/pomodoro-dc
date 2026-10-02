/**
 * stats.js — retention numbers derived from the reduced session map. Pure.
 *
 * Days are Vietnam calendar days (UTC+7, no daylight saving), so a session at 23:50 in Hanoi
 * belongs to that evening no matter which device's clock zone reported it.
 */

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function dayKey(ms) {
  return new Date(ms + VN_OFFSET_MS).toISOString().slice(0, 10);
}

/** Day number (days since epoch) of a Vietnam calendar day — integer arithmetic on days. */
export function dayIndex(ms) {
  return Math.floor((ms + VN_OFFSET_MS) / DAY_MS);
}

export function completedSessions(state) {
  return [...state.sessions.values()]
    .filter((s) => s.status === 'completed')
    .sort((a, b) => a.endedAt - b.endedAt);
}

/** Map dayIndex → { count, minutes } of completed sessions. */
export function sessionsByDay(state) {
  const byDay = new Map();
  for (const s of completedSessions(state)) {
    const k = dayIndex(s.endedAt);
    const cur = byDay.get(k) ?? { count: 0, minutes: 0 };
    cur.count += 1;
    cur.minutes += s.minutes;
    byDay.set(k, cur);
  }
  return byDay;
}

export function todaySummary(state, now) {
  return sessionsByDay(state).get(dayIndex(now)) ?? { count: 0, minutes: 0 };
}

/** The last `n` days ending today, oldest first. */
export function lastDays(state, now, n = 7) {
  const byDay = sessionsByDay(state);
  const today = dayIndex(now);
  const out = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const idx = today - i;
    const v = byDay.get(idx) ?? { count: 0, minutes: 0 };
    out.push({ dayIndex: idx, key: dayKey(idx * DAY_MS), ...v });
  }
  return out;
}

/**
 * Consecutive days with ≥1 completed session, ending today — or ending yesterday, because a day
 * that has not finished yet must not break the streak before the user has had a chance.
 */
export function currentStreak(state, now) {
  const byDay = sessionsByDay(state);
  let day = dayIndex(now);
  if (!byDay.has(day)) day -= 1;
  let n = 0;
  while (byDay.has(day)) {
    n += 1;
    day -= 1;
  }
  return n;
}

/**
 * The four numbers the rewrite is judged by (plan, stage 1 / gate 2), over the last `weeks` weeks:
 * active days per week, sessions per active day, longest gap in days, and current streak.
 */
export function retention(state, now, weeks = 4) {
  const byDay = sessionsByDay(state);
  const today = dayIndex(now);
  const from = today - weeks * 7 + 1;
  let activeDays = 0;
  let sessions = 0;
  for (let d = from; d <= today; d += 1) {
    const v = byDay.get(d);
    if (v) {
      activeDays += 1;
      sessions += v.count;
    }
  }
  const days = [...byDay.keys()].sort((a, b) => a - b);
  let longestGap = 0;
  for (let i = 1; i < days.length; i += 1) longestGap = Math.max(longestGap, days[i] - days[i - 1] - 1);
  if (days.length) longestGap = Math.max(longestGap, today - days[days.length - 1]);
  return {
    weeks,
    activeDaysPerWeek: activeDays / weeks,
    sessionsPerActiveDay: activeDays ? sessions / activeDays : 0,
    longestGapDays: longestGap,
    streak: currentStreak(state, now),
    daysSinceLast: days.length ? today - days[days.length - 1] : null,
  };
}
