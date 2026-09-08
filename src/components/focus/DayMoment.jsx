/**
 * DayMoment.jsx — the LONG rhythms on screen: a day (and a week) that opens and closes (ADR-081).
 *
 * The words and the rules are `engine/dayArc.js`; this file only decides WHEN one is due, shows it
 * for a few seconds, and remembers that it has been shown. Same law as ADR-080: it happens and it is
 * gone — a banner that fades after seven seconds, tappable to dismiss sooner, `pointer-events` off
 * everywhere else, and NOTHING left behind. The static budget stays at zero.
 *
 * ⚠️ NEVER WHILE A TIMER RUNS. `quiet` is true for a focus session, a break, and while the reward
 * chain is on screen — the round-39 promise (the Focus screen IS the timer) outranks every long
 * rhythm; the moment simply waits for the clock to stop.
 *
 * ⚠️ THE STAMPS ARE PER DEVICE, ON PURPOSE. They live in `localStorage` next to the other
 * "already seen" keys (`dc-stage-seen-v1`, `dc-nav-seen-v1`), not in the synced save. A greeting is
 * a thing this screen showed, not a fact about the game — putting it in the save would mean a write
 * on every app open, contending with the compare-and-swap that protects real data (OPERATIONS.md).
 * The cost is that a second device may greet the same morning again; the benefit is that no morning
 * greeting can ever lose a session's worth of data.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import useGameStore from '../../store/gameStore';
import useSettingsStore from '../../store/settingsStore';
import { describeDayOpen, pickArcMoment } from '../../engine/dayArc';
import useJourney from '../../hooks/useJourney';
import { readPreviewArc } from '../../dev/previewStage';
import { getDailyGoalProgress, getHistoryEntryTimestampMs, isCancelledHistoryEntry } from '../../engine/gameMath';
import { getVietnamHour, localDateStr, localWeekMondayStr } from '../../engine/time';
import { describeProject } from '../../engine/buildChoices';
import { pushNow } from '../../lib/syncService';
import { useEnterMotion, useRewardMotion } from '../../lib/motionPresets';
import RewardBurst from '../shared/RewardBurst';

const STAMP_KEY = 'dc-day-arc-v1';
/** Long enough to read two short lines without looking up from what you were doing. */
const VISIBLE_MS = 7000;
/** A breath after the app appears, so the greeting reads as a greeting and not as a flash. */
const APPEAR_DELAY_MS = 750;

function readStamps() {
  try {
    const raw = window.localStorage.getItem(STAMP_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch { return {}; }
}

function writeStamps(next) {
  try { window.localStorage.setItem(STAMP_KEY, JSON.stringify(next)); } catch { /* private mode */ }
}

/** Sessions and minutes of the entries whose day (or week) key matches. `keyOf` picks which. */
function sumBy(history, keyOf, wanted) {
  let sessions = 0;
  let minutes = 0;
  for (const entry of Array.isArray(history) ? history : []) {
    if (isCancelledHistoryEntry(entry)) continue;
    const ts = getHistoryEntryTimestampMs(entry);
    if (!Number.isFinite(ts) || keyOf(ts) !== wanted) continue;
    sessions += 1;
    minutes += Math.max(0, Number(entry.minutes) || 0);
  }
  return { sessions, minutes };
}

export default function DayMoment({ quiet = false }) {
  const history = useGameStore((s) => s.history);
  const dailyTracking = useGameStore((s) => s.dailyTracking);
  const streakDays = useGameStore((s) => s.streak?.currentStreak ?? 0);
  const rollNightBuilder = useGameStore((s) => s.rollNightBuilder);
  const dailyGoalType = useSettingsStore((s) => s.dailyGoalType);
  const dailyGoalSessions = useSettingsStore((s) => s.dailyGoalSessions);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const { journey } = useJourney();
  const journeyLine = journey.line;

  const [moment, setMoment] = useState(null);
  const dismissRef = useRef(null);
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();

  const dismiss = useCallback(() => {
    window.clearTimeout(dismissRef.current);
    setMoment(null);
  }, []);

  useEffect(() => {
    if (quiet || moment) return undefined;
    /*
      ⚠️ ON A DELAY, AND THAT IS NOT A WORKAROUND. Deciding and showing inside the effect body would
      set state synchronously during an effect (React Compiler flags it, and it does cascade a
      render); it would also drop the greeting on screen in the same frame the app appears, which
      reads as a flash rather than a welcome. Three quarters of a second later it feels like the app
      turned round and said hello.
    */
    const openTimer = window.setTimeout(() => {
      // ADR-081: `?dc-preview=arc-…` dựng thẳng một banner để chụp — bốn khoảnh khắc này phụ thuộc
      // vào ngày/tuần nên không cú bấm nào tới được. Không đóng dấu, không gieo quà.
      const forced = readPreviewArc(typeof window === 'undefined' ? '' : window.location.search);
      if (forced) { setMoment(forced); return; }
      const now = Date.now();
      const dayKey = localDateStr(now);
      const weekKey = localWeekMondayStr(now);
      const seen = readStamps();
      const goal = getDailyGoalProgress({
        dailyTracking, history, todayKey: dayKey, dailyGoalType, dailyGoalSessions, dailyGoalMinutes,
      });
      const dayOf = (ts) => localDateStr(ts);
      const weekOf = (ts) => localWeekMondayStr(ts);
      const picked = pickArcMoment({
        dayKey,
        weekKey,
        hour: getVietnamHour(now),
        weekday: new Date(now).getDay(),
        seen,
        yesterday: sumBy(history, dayOf, localDateStr(now - 86_400_000)),
        today: sumBy(history, dayOf, dayKey),
        lastWeek: sumBy(history, weekOf, localWeekMondayStr(now - 7 * 86_400_000)),
        thisWeek: sumBy(history, weekOf, weekKey),
        goalMet: Boolean(goal.hasGoal && goal.goalMet),
        streakDays,
        // ADR-082: a CLOSE names the destination; `pickArcMoment` drops it on every other moment.
        journeyLine,
      });
      if (!picked) return;

      // ADR-081 surprise #3 — THE NIGHT CREW. Only ever on the moment that opens a day, so the three
      // surprises of the game land at three different beats (open · mid-session · ending).
      let shown = picked.moment;
      if (picked.moment.id === 'day-open') {
        const giftId = rollNightBuilder?.();
        if (giftId) {
          shown = describeDayOpen({ nightGiftLabel: describeProject(giftId)?.label ?? null });
          void pushNow();
        }
      }
      writeStamps({ ...seen, ...picked.stamps });
      setMoment(shown);
      dismissRef.current = window.setTimeout(() => setMoment(null), VISIBLE_MS);
    }, APPEAR_DELAY_MS);
    return () => window.clearTimeout(openTimer);
  }, [
    quiet, moment, history, dailyTracking, streakDays, rollNightBuilder,
    dailyGoalType, dailyGoalSessions, dailyGoalMinutes, journeyLine,
  ]);

  useEffect(() => () => window.clearTimeout(dismissRef.current), []);

  return (
    <AnimatePresence>
      {moment && !quiet && (
        <motion.div
          key={moment.id}
          {...enterMotion}
          className="pointer-events-none fixed inset-x-0 z-40 flex justify-center px-4"
          /*
            ⚠️ BELOW THE TOP RAIL, NOT OVER IT. The first photograph of this banner had the
            notification bell sitting on top of the title — the rail paints after it and owns that
            strip. 96px clears the rail at 390px and at 1280px; the banner then covers the postcard
            for seven seconds, which is what a moment is allowed to do.
          */
          style={{ top: 'calc(env(safe-area-inset-top) + 96px)' }}
        >
          <motion.button
            type="button"
            {...rewardMotion}
            onClick={dismiss}
            aria-label={`${moment.title}. ${moment.line} Chạm để đóng.`}
            className="pointer-events-auto relative w-full max-w-[420px] overflow-visible px-5 py-3.5 text-left"
            style={{
              borderRadius: 'var(--skin-radius-card, 18px)',
              background: 'var(--card-bg-solid)',
              border: '1px solid var(--line)',
              boxShadow: 'var(--skin-card-shadow)',
            }}
          >
            {(moment.tone === 'met' || moment.tone === 'gift') && (
              <RewardBurst size="building" className="absolute inset-0" />
            )}
            <span className="mono relative block text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--muted)' }}>
              {moment.tone === 'gift' ? '🌙' : moment.tone === 'met' ? '✓' : '·'}
            </span>
            <span className="relative mt-1 block text-[16px] font-semibold leading-snug" style={{ color: 'var(--ink)' }}>
              {moment.title}
            </span>
            <span className="relative mt-0.5 block text-[13px] leading-snug" style={{ color: 'var(--muted)' }}>
              {moment.line}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
