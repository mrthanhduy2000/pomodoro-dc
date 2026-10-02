/**
 * timer.js — the v2 timer as a pure reducer over an APPEND-ONLY event log.
 *
 * Why an event log instead of v1's whole-state compare-and-swap (ADR-101):
 * - Two devices can never overwrite each other: merging two logs is a set union by event `id`.
 * - A session started on the phone is visible on the Mac, because "what is running" is derived.
 * - A tab frozen by iOS still produces the right answer: completion is a pure function of
 *   (startedAt, target, paused time), so the session ends at its THEORETICAL end time, not at
 *   the moment some device woke up and noticed.
 *
 * Every function here is pure. Time is always passed in (`now`, `event.at`), never read.
 *
 * Event shape: { id: string, at: number (epoch ms), kind: string, data: object }
 * Ordering: by `at`, ties broken by `id` — so the result never depends on insertion order.
 */

export const MIN_COUNTED_MS = 10 * 60 * 1000; // an early finish counts only after 10 focused minutes
export const DEFAULT_PREFS = Object.freeze({ focusMin: 25, breakMin: 5, dailyGoal: 4 });

export const DEFAULT_CATEGORIES = Object.freeze([
  { id: 'cat_hoc_dh', label: 'Học Đại Học', color: '#f59e0b', icon: '🎓' },
  { id: 'cat_tu_hoc', label: 'Tự Học', color: '#6366f1', icon: '📚' },
  { id: 'cat_lam_viec', label: 'Làm Việc', color: '#22c55e', icon: '💼' },
  { id: 'cat_doc_sach', label: 'Đọc Sách', color: '#06b6d4', icon: '📖' },
  { id: 'cat_khac', label: 'Khác', color: '#94a3b8', icon: '✨' },
]);

export function compareEvents(a, b) {
  if (a.at !== b.at) return a.at - b.at;
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/** Deterministic ids for events that more than one device may emit for the same fact. */
export const completeId = (sid) => `focus.complete:${sid}`;
export const cancelId = (sid) => `focus.cancel:${sid}`;
export const breakEndId = (sid) => `break.end:${sid}`;

function emptyState() {
  return {
    active: null,
    sessions: new Map(),
    breaksTaken: 0,
    categories: new Map(DEFAULT_CATEGORIES.map((c) => [c.id, { ...c, at: -1 }])),
    prefs: { ...DEFAULT_PREFS },
    prefsAt: {},
    lastCompletedSid: null,
    lastFocusStartAt: null,
    breakHandledFor: new Set(), // focus sids whose "take a break?" question is answered
  };
}

/** Focused (unpaused) milliseconds of an active focus at time `t`. */
export function focusedMs(active, t) {
  const pausedNow = active.pausedAt != null ? t - active.pausedAt : 0;
  return Math.max(0, t - active.startedAt - active.pausedTotal - pausedNow);
}

/** When this running timer reaches its target, or null while paused. */
export function theoreticalEnd(active) {
  if (!active || active.pausedAt != null) return null;
  return active.startedAt + active.pausedTotal + active.targetMs;
}

function finalizeFocus(state, at, status) {
  const a = state.active;
  const focused = focusedMs(a, at);
  let finalStatus = status;
  if (status === 'completed' && focused < Math.min(MIN_COUNTED_MS, a.targetMs) - 1) {
    finalStatus = 'cancelled';
  }
  state.sessions.set(a.sid, {
    sid: a.sid,
    startedAt: a.startedAt,
    endedAt: at,
    targetMin: Math.round(a.targetMs / 60000),
    minutes: Math.round(focused / 60000),
    focusedMs: focused,
    status: finalStatus,
    early: finalStatus === 'completed' && focused < a.targetMs - 1000,
    categoryId: a.categoryId,
    goal: a.goal,
    legacy: false,
  });
  if (finalStatus === 'completed') state.lastCompletedSid = a.sid;
  state.active = null;
}

/** Let time pass up to `t`: a running timer whose target has elapsed ends at its theoretical end. */
function settle(state, t) {
  const a = state.active;
  if (!a) return;
  const end = theoreticalEnd(a);
  if (end == null || end > t) return;
  if (a.mode === 'focus') finalizeFocus(state, end, 'completed');
  else {
    state.breaksTaken += 1;
    state.active = null;
  }
}

function apply(state, e) {
  const d = e.data ?? {};
  switch (e.kind) {
    case 'focus.start': {
      if (state.active?.mode === 'focus') finalizeFocus(state, e.at, 'superseded');
      if (state.sessions.has(d.sid)) return;
      state.lastFocusStartAt = e.at;
      state.active = {
        mode: 'focus',
        sid: d.sid,
        startedAt: e.at,
        targetMs: Math.max(1, Number(d.targetMin) || DEFAULT_PREFS.focusMin) * 60000,
        pausedTotal: 0,
        pausedAt: null,
        categoryId: d.categoryId ?? null,
        goal: typeof d.goal === 'string' ? d.goal : '',
      };
      return;
    }
    case 'focus.pause': {
      const a = state.active;
      if (a?.mode === 'focus' && a.sid === d.sid && a.pausedAt == null) a.pausedAt = e.at;
      return;
    }
    case 'focus.resume': {
      const a = state.active;
      if (a?.mode === 'focus' && a.sid === d.sid && a.pausedAt != null) {
        a.pausedTotal += e.at - a.pausedAt;
        a.pausedAt = null;
      }
      return;
    }
    case 'focus.complete':
    case 'focus.cancel': {
      const a = state.active;
      if (a?.mode === 'focus' && a.sid === d.sid) {
        finalizeFocus(state, e.at, e.kind === 'focus.complete' ? 'completed' : 'cancelled');
      }
      return;
    }
    case 'break.start': {
      if (state.active?.mode === 'focus') return; // a break never interrupts a focus
      if (d.after) state.breakHandledFor.add(d.after);
      state.active = {
        mode: 'break',
        sid: d.sid,
        startedAt: e.at,
        targetMs: Math.max(1, Number(d.targetMin) || DEFAULT_PREFS.breakMin) * 60000,
        pausedTotal: 0,
        pausedAt: null,
        after: d.after ?? null,
      };
      return;
    }
    case 'break.end': {
      if (state.active?.mode === 'break' && state.active.sid === d.sid) {
        state.breaksTaken += 1;
        state.active = null;
      }
      return;
    }
    case 'break.skip': {
      if (d.after) state.breakHandledFor.add(d.after);
      return;
    }
    case 'legacy.session': {
      if (state.sessions.has(d.sid)) return;
      state.sessions.set(d.sid, {
        sid: d.sid,
        startedAt: d.startedAt ?? e.at,
        endedAt: e.at,
        targetMin: d.targetMin ?? d.minutes ?? 0,
        minutes: d.minutes ?? 0,
        focusedMs: (d.minutes ?? 0) * 60000,
        status: d.status === 'completed' ? 'completed' : 'cancelled',
        early: false,
        categoryId: d.categoryId ?? null,
        goal: d.goal ?? '',
        legacy: true,
      });
      return;
    }
    case 'category.upsert': {
      const prev = state.categories.get(d.id);
      if (!d.id || (prev && prev.at > e.at)) return;
      state.categories.set(d.id, {
        id: d.id,
        label: String(d.label ?? prev?.label ?? d.id),
        color: d.color ?? prev?.color ?? '#94a3b8',
        icon: d.icon ?? prev?.icon ?? '',
        hidden: Boolean(d.hidden),
        at: e.at,
      });
      return;
    }
    case 'prefs.set': {
      for (const key of Object.keys(DEFAULT_PREFS)) {
        if (d[key] == null) continue;
        const value = Number(d[key]);
        if (!Number.isFinite(value) || value <= 0) continue;
        if ((state.prefsAt[key] ?? -Infinity) > e.at) continue;
        state.prefs[key] = value;
        state.prefsAt[key] = e.at;
      }
      return;
    }
    default:
      // Unknown kinds (from a newer app version) are ignored, never fatal.
  }
}

/**
 * Reduce the log to the state at time `now`. Without `now`, the result is the log as written —
 * a running timer whose target has passed is still `active`, which is what `dueEvents` needs.
 * Events dated after `now` (clock skew from another device) are still applied: they happened,
 * our clock is just behind.
 */
export function reduce(events, now = null) {
  const state = emptyState();
  const sorted = [...events].filter(isEvent).sort(compareEvents);
  for (const e of sorted) {
    settle(state, e.at);
    apply(state, e);
  }
  if (now != null) settle(state, now);
  return state;
}

export function isEvent(e) {
  return Boolean(e) && typeof e.id === 'string' && Number.isFinite(e.at) && typeof e.kind === 'string';
}

/** What the screen shows for the active timer at `now`. */
export function timeline(state, now) {
  const a = state.active;
  if (!a) return null;
  const elapsed = focusedMs(a, now);
  return {
    mode: a.mode,
    sid: a.sid,
    paused: a.pausedAt != null,
    elapsedMs: elapsed,
    remainingMs: Math.max(0, a.targetMs - elapsed),
    progress: Math.min(1, elapsed / a.targetMs),
    endsAt: theoreticalEnd(a),
  };
}

/**
 * Facts that have become true by `now` but are not yet in the log. Their ids are deterministic,
 * so if two devices both emit them the log keeps one.
 * Pass `reduce(log)` WITHOUT `now`, or the elapsed timer is already settled and invisible here.
 */
export function dueEvents(stateBeforeNow, now) {
  const a = stateBeforeNow.active;
  const end = theoreticalEnd(a);
  if (end == null || end > now) return [];
  if (a.mode === 'focus') {
    return [{ id: completeId(a.sid), at: end, kind: 'focus.complete', data: { sid: a.sid, auto: true } }];
  }
  return [{ id: breakEndId(a.sid), at: end, kind: 'break.end', data: { sid: a.sid, auto: true } }];
}

/**
 * The "you just finished" moment, derived from the log so it survives a reload and agrees across
 * devices: the last completed session, still recent, nothing running, its break question not yet
 * answered, and no newer focus started since.
 */
export const DONE_PANEL_MS = 30 * 60 * 1000;

export function justFinished(state, now) {
  const sid = state.lastCompletedSid;
  const s = sid ? state.sessions.get(sid) : null;
  if (!s || state.active || state.breakHandledFor.has(sid)) return null;
  if (state.lastFocusStartAt != null && state.lastFocusStartAt > s.endedAt) return null;
  return now - s.endedAt < DONE_PANEL_MS ? s : null;
}

/* ---------- commands: (state, now, …) → event | null (null = not allowed now) ---------- */

export function cmdStartFocus(state, now, { sid, targetMin, categoryId = null, goal = '' }) {
  if (state.active?.mode === 'focus') return null;
  return { id: `focus.start:${sid}`, at: now, kind: 'focus.start', data: { sid, targetMin, categoryId, goal } };
}

export function cmdPause(state, now, id) {
  const a = state.active;
  if (a?.mode !== 'focus' || a.pausedAt != null) return null;
  return { id, at: now, kind: 'focus.pause', data: { sid: a.sid } };
}

export function cmdResume(state, now, id) {
  const a = state.active;
  if (a?.mode !== 'focus' || a.pausedAt == null) return null;
  return { id, at: now, kind: 'focus.resume', data: { sid: a.sid } };
}

export function canFinishEarly(state, now) {
  const a = state.active;
  return a?.mode === 'focus' && focusedMs(a, now) >= Math.min(MIN_COUNTED_MS, a.targetMs);
}

export function cmdFinishEarly(state, now) {
  if (!canFinishEarly(state, now)) return null;
  const sid = state.active.sid;
  return { id: completeId(sid), at: now, kind: 'focus.complete', data: { sid, early: true } };
}

export function cmdCancel(state, now) {
  const a = state.active;
  if (a?.mode !== 'focus') return null;
  return { id: cancelId(a.sid), at: now, kind: 'focus.cancel', data: { sid: a.sid } };
}

export function cmdStartBreak(state, now, { sid, targetMin, after = null }) {
  if (state.active) return null;
  return { id: `break.start:${sid}`, at: now, kind: 'break.start', data: { sid, targetMin, after } };
}

export function cmdSkipBreak(state, now) {
  const done = justFinished(state, now);
  if (!done) return null;
  return { id: `break.skip:${done.sid}`, at: now, kind: 'break.skip', data: { after: done.sid } };
}

export function cmdEndBreak(state, now) {
  const a = state.active;
  if (a?.mode !== 'break') return null;
  return { id: breakEndId(a.sid), at: now, kind: 'break.end', data: { sid: a.sid, skipped: true } };
}
