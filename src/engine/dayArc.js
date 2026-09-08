/**
 * dayArc.js — the LONG rhythms: a day that opens and closes, a week that opens and closes (ADR-081).
 *
 * Đàm, round 41: *"Mở app buổi sáng — hôm nay trông y hệt hôm qua … Kết thúc một ngày — không có gì
 * cả. Ngày trôi qua âm thầm."* Rounds 39–40 gave the app four short rhythms (before a session, during
 * it, its ending, the break). The long ones were empty: nothing marked a new day, and no day was ever
 * closed, so no day ever felt finished.
 *
 * This module is only the WORDS and the RULES. Where they appear, and for how long, is
 * `components/focus/DayMoment.jsx`; the "already seen" stamps live in localStorage there. Same law as
 * ADR-080: a moment happens and is gone, and the static budget stays at zero.
 *
 * ⚠️ A SMALL DAY MUST CLOSE KINDLY. Đàm: *"nếu app làm tôi thấy tệ khi làm ít thì tôi sẽ tránh mở nó,
 * và đó là cách một app năng suất tự giết mình."* So there is no "you failed" branch anywhere in this
 * file: a day with one session closes with what it built, a day with none is never mentioned at all,
 * and a return after an absence is greeted, never scolded.
 *
 * Pure: no store, no `Date`, no DOM.
 */

function n(value, fallback = 0) {
  const v = Number(value);
  return Number.isFinite(v) ? v : fallback;
}

/** "3 phiên" / "1 phiên"; minutes only when they add something the session count does not. */
function sessionsPhrase(sessions, minutes) {
  const s = Math.max(0, Math.round(n(sessions)));
  const m = Math.max(0, Math.round(n(minutes)));
  if (s === 0) return null;
  if (m >= 60) {
    const hours = Math.floor(m / 60);
    const rest = m % 60;
    return `${s} phiên · ${hours} giờ${rest >= 10 ? ` ${rest} phút` : ''}`;
  }
  return m > 0 ? `${s} phiên · ${m} phút` : `${s} phiên`;
}

/**
 * The first open of a calendar day.
 * `nightGift` = the project the night crew pushed one brick on (ADR-081 surprise), or null.
 */
export function describeDayOpen({
  yesterdaySessions = 0, yesterdayMinutes = 0, streakDays = 0, nightGiftLabel = null,
} = {}) {
  if (nightGiftLabel) {
    return {
      id: 'day-open',
      title: 'Đêm qua có người xây giúp',
      line: `${nightGiftLabel} nhích thêm một viên gạch.`,
      tone: 'gift',
    };
  }
  const yesterday = sessionsPhrase(yesterdaySessions, yesterdayMinutes);
  const streak = Math.max(0, Math.round(n(streakDays)));
  if (yesterday) {
    return {
      id: 'day-open',
      title: 'Ngày mới',
      line: streak >= 2 ? `Hôm qua ${yesterday} · chuỗi ${streak} ngày.` : `Hôm qua ${yesterday}.`,
      tone: 'open',
    };
  }
  // No session yesterday: an invitation, never a reproach.
  return { id: 'day-open', title: 'Ngày mới', line: 'Thành phố đang chờ viên gạch đầu tiên.', tone: 'open' };
}

/**
 * The close of a day. Only ever called with at least one session done — a day with none is left
 * alone. `goalMet` decides the tone, but both tones are good news.
 */
export function describeDayClose({ sessions = 0, minutes = 0, goalMet = false } = {}) {
  const done = sessionsPhrase(sessions, minutes) ?? '';
  if (goalMet) return { id: 'day-close', title: 'Xong mục tiêu hôm nay', line: `${done}.`, tone: 'met' };
  return { id: 'day-close', title: 'Ngày hôm nay khép lại', line: `${done}.`, tone: 'some' };
}

/** The first open of a new week. */
export function describeWeekOpen({ lastWeekSessions = 0, lastWeekMinutes = 0 } = {}) {
  const last = sessionsPhrase(lastWeekSessions, lastWeekMinutes);
  return {
    id: 'week-open',
    title: 'Tuần mới',
    line: last ? `Tuần trước ${last}.` : 'Trang giấy trắng — bắt đầu từ phiên đầu tiên.',
    tone: 'open',
  };
}

/** The close of a week, Sunday evening. Only with at least one session in the week. */
export function describeWeekClose({ sessions = 0, minutes = 0 } = {}) {
  return { id: 'week-close', title: 'Tuần này khép lại', line: `${sessionsPhrase(sessions, minutes) ?? ''}.`, tone: 'met' };
}

/** The hour after which a day is considered ready to close if the goal was not reached. */
export const DAY_CLOSE_HOUR = 21;
/** Sunday, and this hour, is when a week closes. */
export const WEEK_CLOSE_HOUR = 18;

/**
 * WHICH long moment is due right now, if any — and what to stamp so it does not come back.
 *
 * `seen` is the stamp record: `{ dayOpen, dayClose, weekOpen, weekClose }`, each holding the day or
 * week key it last fired for. Priority: a close outranks an open (a close is the reward for what
 * just happened), and the week outranks the day (it is rarer).
 *
 * @returns {{ moment: object, stamps: Record<string,string> } | null}
 */
export function pickArcMoment({
  dayKey = '', weekKey = '', hour = 12, weekday = 1, seen = {},
  yesterday = {}, today = {}, lastWeek = {}, thisWeek = {},
  goalMet = false, streakDays = 0, nightGiftLabel = null,
} = {}) {
  const todaySessions = Math.max(0, Math.round(n(today.sessions)));
  const weekSessions = Math.max(0, Math.round(n(thisWeek.sessions)));

  // 1 · The day is done — either the goal fell, or the evening came with work behind it.
  if (seen.dayClose !== dayKey && todaySessions >= 1 && (goalMet || hour >= DAY_CLOSE_HOUR)) {
    return {
      moment: describeDayClose({ sessions: todaySessions, minutes: today.minutes, goalMet }),
      stamps: { dayClose: dayKey },
    };
  }
  // 2 · Sunday evening, with a week behind it.
  if (seen.weekClose !== weekKey && weekday === 0 && hour >= WEEK_CLOSE_HOUR && weekSessions >= 1) {
    return {
      moment: describeWeekClose({ sessions: weekSessions, minutes: thisWeek.minutes }),
      stamps: { weekClose: weekKey },
    };
  }
  // 3 · A new week opens — it also opens the day, so the two never stack.
  if (seen.weekOpen !== weekKey) {
    return {
      moment: describeWeekOpen({ lastWeekSessions: lastWeek.sessions, lastWeekMinutes: lastWeek.minutes }),
      stamps: { weekOpen: weekKey, dayOpen: dayKey },
    };
  }
  // 4 · A new day opens.
  if (seen.dayOpen !== dayKey) {
    return {
      moment: describeDayOpen({
        yesterdaySessions: yesterday.sessions, yesterdayMinutes: yesterday.minutes, streakDays, nightGiftLabel,
      }),
      stamps: { dayOpen: dayKey },
    };
  }
  return null;
}
