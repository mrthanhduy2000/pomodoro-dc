/**
 * useTimerApp.js — the one seam between React and the pure engine. Screens get derived state and
 * intent functions; they never build events themselves.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  advance,
  canFinishEarly,
  cmdCancel,
  cmdEndBreak,
  cmdFinishEarly,
  cmdPause,
  cmdResume,
  cmdSkipBreak,
  cmdStartBreak,
  cmdStartFocus,
  dueEvents,
  justFinished,
  reduce,
  timeline,
} from '../engine/timer.js';
import { buildCity, cmdCancelPlan, cmdPlan } from '../engine/city.js';
import { newEventId, useLogStore } from '../store/logStore.js';
import { breakJobKey, cancelPush, focusJobKey, schedulePush } from '../lib/push.js';
import { chime } from './sound.js';

/** The city as of `t`, read straight from the store (for commands, which must not use a stale render). */
function cityAt(t) {
  const evs = useLogStore.getState().events;
  return buildCity(evs, reduce(evs, t), t);
}

function useNow(fast) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), fast ? 250 : 15_000);
    const wake = () => setNow(Date.now());
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('focus', wake);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('focus', wake);
    };
  }, [fast]);
  return now;
}

export function useTimerApp() {
  const events = useLogStore((s) => s.events);
  const append = useLogStore((s) => s.append);
  // The log is re-read only when it changes; each tick only lets time pass (`advance`), which
  // returns the same object until something actually ends — 1.7 ms → 0.005 ms a tick at 3 years.
  const written = useMemo(() => reduce(events), [events]);
  const now = useNow(Boolean(written.active));
  const state = useMemo(() => advance(written, now), [written, now]);
  const tl = timeline(written, now);

  // The city only needs minute precision; a finished session reaches it through the log itself.
  const cityNow = Math.floor(now / 60_000) * 60_000;
  const city = useMemo(() => buildCity(events, advance(written, cityNow), cityNow), [events, written, cityNow]);

  // Facts that became true while nobody pressed anything (target reached): written with their
  // theoretical time and a deterministic id, so every device agrees.
  useEffect(() => {
    const due = dueEvents(written, now);
    if (due.length) append(due);
  }, [written, now, append]);

  // "Just finished" is derived from the log (engine `justFinished`); this effect only rings.
  const justDone = justFinished(state, now);
  const lastSid = state.lastCompletedSid;
  const last = lastSid ? state.sessions.get(lastSid) : null;
  const chimed = useRef(written.lastCompletedSid);
  useEffect(() => {
    if (!lastSid || lastSid === chimed.current) return;
    chimed.current = lastSid;
    if (last && now - last.endedAt < 2 * 60_000) chime();
  }, [lastSid, last, now]);

  const act = useCallback((event) => {
    if (!event) return null;
    append([event]);
    return event;
  }, [append]);

  const startFocus = useCallback(({ targetMin, categoryId, goal }) => {
    const t = Date.now();
    const sid = newEventId('s').slice(2);
    const st = reduce(useLogStore.getState().events, t);
    const e = act(cmdStartFocus(st, t, { sid, targetMin, categoryId, goal }));
    if (e) {
      schedulePush('v2-focus-complete', focusJobKey(sid), t + targetMin * 60_000, targetMin);
    }
  }, [act]);

  const pause = useCallback(() => {
    const t = Date.now();
    const st = reduce(useLogStore.getState().events, t);
    if (act(cmdPause(st, t, newEventId('pause')))) cancelPush(focusJobKey(st.active.sid));
  }, [act]);

  const resume = useCallback(() => {
    const t = Date.now();
    const st = reduce(useLogStore.getState().events, t);
    const a = st.active;
    if (act(cmdResume(st, t, newEventId('resume')))) {
      const remaining = a.targetMs - (a.pausedAt - a.startedAt - a.pausedTotal);
      schedulePush('v2-focus-complete', focusJobKey(a.sid), t + remaining, Math.round(a.targetMs / 60_000));
    }
  }, [act]);

  const finishEarly = useCallback(() => {
    const t = Date.now();
    const st = reduce(useLogStore.getState().events, t);
    if (act(cmdFinishEarly(st, t))) cancelPush(focusJobKey(st.active.sid));
  }, [act]);

  const cancel = useCallback(() => {
    const t = Date.now();
    const st = reduce(useLogStore.getState().events, t);
    if (act(cmdCancel(st, t))) cancelPush(focusJobKey(st.active.sid));
  }, [act]);

  const startBreak = useCallback((targetMin) => {
    const t = Date.now();
    const st = reduce(useLogStore.getState().events, t);
    const sid = newEventId('b').slice(2);
    if (act(cmdStartBreak(st, t, { sid, targetMin, after: st.lastCompletedSid }))) {
      schedulePush('v2-break-over', breakJobKey(sid), t + targetMin * 60_000, targetMin);
    }
  }, [act]);

  const endBreak = useCallback(() => {
    const t = Date.now();
    const st = reduce(useLogStore.getState().events, t);
    if (act(cmdEndBreak(st, t))) cancelPush(breakJobKey(st.active.sid));
  }, [act]);

  const planBuilding = useCallback((blueprintKey, plot) => {
    const t = Date.now();
    return act(cmdPlan(cityAt(t), t, { planId: newEventId('p').slice(2), blueprintKey, plot }));
  }, [act]);

  const cancelPlan = useCallback((planId) => {
    const t = Date.now();
    return act(cmdCancelPlan(cityAt(t), t, planId));
  }, [act]);

  const setPrefs = useCallback((patch) => {
    act({ id: newEventId('prefs'), at: Date.now(), kind: 'prefs.set', data: patch });
  }, [act]);

  /** Add or edit a category (always the full record: an upsert without `hidden` un-hides). */
  const upsertCategory = useCallback((cat) => {
    const id = cat.id ?? `cat_${newEventId('c').slice(2, 14)}`;
    const label = String(cat.label ?? '').trim().slice(0, 40);
    if (!label) return null;
    return act({
      id: newEventId('cat'),
      at: Date.now(),
      kind: 'category.upsert',
      data: { id, label, color: cat.color ?? '#94a3b8', icon: cat.icon ?? '', hidden: Boolean(cat.hidden) },
    });
  }, [act]);

  return {
    now,
    cityNow,
    state,
    city,
    planBuilding,
    cancelPlan,
    timeline: tl,
    justDone,
    skipBreak: () => act(cmdSkipBreak(reduce(useLogStore.getState().events, Date.now()), Date.now())),
    canFinishEarly: canFinishEarly(written, now),
    startFocus,
    pause,
    resume,
    finishEarly,
    cancel,
    startBreak,
    endBreak,
    setPrefs,
    upsertCategory,
  };
}
