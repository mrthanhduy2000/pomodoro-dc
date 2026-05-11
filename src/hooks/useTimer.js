import { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import soundEngine from '../engine/soundEngine';
import { getBreakPlan } from '../engine/breaks';
import { BREAK_EXTENSION_MINUTES } from '../engine/constants';
import {
  TIMER_END_REASONS,
  TIMER_MODES,
  getContinuedPomodoroConfirmUntilSeconds,
  getCreditedFocusMinutes,
  getNextContinuedPomodoroConfirmUntilSeconds,
  getWorkedMinutesForBreak,
  resolveContinueAfterPomodoro,
  shouldContinuePomodoroAsStopwatch,
  shouldHoldContinuedPomodoroForConfirmation,
} from '../engine/timerSession';
import { updateTimerLive, clearTimerLive } from '../lib/timerLiveService';
import { pushNow } from '../lib/syncService';
import {
  cancelScheduledTimerPushes,
  cancelFocusCompletePush,
  cancelPomodoroContinuePush,
  scheduleFocusCompletePush,
  schedulePomodoroContinuePush,
} from '../lib/pushService';

export const TIMER_STATES = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
};

export { TIMER_END_REASONS, TIMER_MODES };

const MILESTONE_PCTS = [25, 50, 75];
const EXTENSION_READY_SECONDS = 5 * 60;

function getInitialDisplaySeconds(mode, focusMinutes) {
  return mode === TIMER_MODES.STOPWATCH ? 0 : focusMinutes * 60;
}

export function useTimer({ focusMinutes, mode = TIMER_MODES.POMODORO }) {
  const totalSeconds = focusMinutes * 60;

  const completeFocusSession = useGameStore((s) => s.completeFocusSession);
  const cancelFocusSession = useGameStore((s) => s.cancelFocusSession);
  const strictMode = useGameStore((s) => s.timerConfig.strictMode);
  const eraCrisis = useGameStore((s) => s.eraCrisis);
  const startBreak = useGameStore((s) => s.startBreak);
  const prepareFocusSessionStart = useGameStore((s) => s.prepareFocusSessionStart);
  const sessionsCompleted = useGameStore((s) => s.progress.sessionsCompleted);
  const longBreakCycleStart = useGameStore((s) => s.progress.longBreakCycleStart ?? 0);
  const persistTimerSession = useGameStore((s) => s.persistTimerSession);
  const clearTimerSession = useGameStore((s) => s.clearTimerSession);
  const timerSession = useGameStore((s) => s.timerSession);
  const unlockedSkills = useGameStore((s) => s.player.unlockedSkills);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const pendingNote = useGameStore((s) => s.pendingNote);
  const setPendingNote = useGameStore((s) => s.setPendingNote);
  const setPendingBreakNote = useGameStore((s) => s.setPendingBreakNote);
  const pendingSessionGoal = useGameStore((s) => s.pendingSessionGoal);
  const setPendingSessionGoal = useGameStore((s) => s.setPendingSessionGoal);
  const pendingNextSessionNote = useGameStore((s) => s.pendingNextSessionNote);
  const setPendingNextSessionNote = useGameStore((s) => s.setPendingNextSessionNote);
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const disableBreak = useSettingsStore((s) => s.disableBreak);
  const autoStartBreak = useSettingsStore((s) => s.autoStartBreak);
  const continueTimingAfterPomodoro = useSettingsStore((s) => s.continueTimingAfterPomodoro);
  const shortBreakDuration = useSettingsStore((s) => s.shortBreakDuration);
  const longBreakDuration = useSettingsStore((s) => s.longBreakDuration);
  const longBreakAfterN = useSettingsStore((s) => s.longBreakAfterN);

  const [displaySeconds, setDisplaySeconds] = useState(() => getInitialDisplaySeconds(mode, focusMinutes));
  const [activeMode, setActiveMode] = useState(mode);
  const [timerState, setTimerState] = useState(TIMER_STATES.IDLE);
  const [milestone, setMilestone] = useState(null);
  const [lastCompletedSessionId, setLastCompletedSessionId] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);
  const [continuedPomodoroConfirmationPending, setContinuedPomodoroConfirmationPending] = useState(false);

  const modeRef = useRef(mode);
  const timerStateRef = useRef(TIMER_STATES.IDLE);
  const secondsRef = useRef(getInitialDisplaySeconds(mode, focusMinutes));
  const totalSecondsRef = useRef(totalSeconds);
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);
  const sessionStartedAtRef = useRef(null);
  const pausedAtRef = useRef(null);
  const pausedTotalMsRef = useRef(0);
  const pauseSegmentsRef = useRef([]);
  const sessionCategoryIdRef = useRef(null);
  const sessionCategorySnapshotRef = useRef(null);
  const sessionNoteRef = useRef('');
  const sessionGoalRef = useRef('');
  const sessionNextNoteRef = useRef('');
  const milestoneRef = useRef(new Set());
  const handleFinishRef = useRef(null);
  const pendingBreakTimeoutRef = useRef(null);
  const extensionReadyArmedRef = useRef(totalSeconds > EXTENSION_READY_SECONDS);
  const continueTimingAfterPomodoroSettingRef = useRef(continueTimingAfterPomodoro);
  const sessionContinueAfterPomodoroRef = useRef(mode === TIMER_MODES.POMODORO && continueTimingAfterPomodoro);
  const continuedPomodoroConfirmUntilSecondsRef = useRef(null);
  const continuedPomodoroConfirmationPendingRef = useRef(false);
  const timerEndReasonRef = useRef(null);

  const setContinuedPomodoroConfirmationPendingState = useCallback((pending) => {
    continuedPomodoroConfirmationPendingRef.current = pending;
    setContinuedPomodoroConfirmationPending(pending);
  }, []);

  const resetSessionTimeline = useCallback(() => {
    sessionStartedAtRef.current = null;
    setSessionStartedAt(null);
    pausedAtRef.current = null;
    pausedTotalMsRef.current = 0;
    pauseSegmentsRef.current = [];
    sessionCategoryIdRef.current = null;
    sessionCategorySnapshotRef.current = null;
    sessionNoteRef.current = '';
    sessionGoalRef.current = '';
    sessionNextNoteRef.current = '';
    sessionContinueAfterPomodoroRef.current = modeRef.current === TIMER_MODES.POMODORO
      && continueTimingAfterPomodoroSettingRef.current;
    continuedPomodoroConfirmUntilSecondsRef.current = null;
    setContinuedPomodoroConfirmationPendingState(false);
  }, [setContinuedPomodoroConfirmationPendingState]);

  const syncFocusCompletePush = useCallback((
    endsAtMs,
    scheduledMinutes = totalSecondsRef.current / 60,
    currentMode = modeRef.current,
  ) => {
    if (currentMode !== TIMER_MODES.POMODORO) return;
    if (sessionContinueAfterPomodoroRef.current) {
      void cancelFocusCompletePush('continued-session');
      void schedulePomodoroContinuePush({
        endsAtMs,
        focusMinutes: Math.max(1, Math.round(scheduledMinutes)),
      });
      return;
    }

    void cancelPomodoroContinuePush('normal-session');
    void scheduleFocusCompletePush({
      endsAtMs,
      focusMinutes: Math.max(1, Math.round(scheduledMinutes)),
    });
  }, []);

  const clearFocusCompletePush = useCallback((reason = 'cancelled') => {
    return cancelScheduledTimerPushes(reason);
  }, []);

  const getElapsedSeconds = useCallback((clockStartMs, nowMs = Date.now()) => {
    if (!clockStartMs) return 0;
    return Math.max(0, Math.floor((nowMs - clockStartMs) / 1000));
  }, []);

  const computeDisplayFromElapsed = useCallback((elapsedSeconds, currentMode = modeRef.current) => {
    if (currentMode === TIMER_MODES.STOPWATCH) return elapsedSeconds;
    return Math.max(0, totalSecondsRef.current - elapsedSeconds);
  }, []);

  const getAuthoritativeDisplaySeconds = useCallback((
    currentMode = modeRef.current,
    nowMs = Date.now(),
  ) => {
    if (!startTimeRef.current) {
      return Math.max(0, secondsRef.current);
    }

    const effectiveNowMs = pausedAtRef.current ?? nowMs;
    const elapsedSeconds = getElapsedSeconds(startTimeRef.current, effectiveNowMs);
    return computeDisplayFromElapsed(elapsedSeconds, currentMode);
  }, [computeDisplayFromElapsed, getElapsedSeconds]);

  const computeProgressPct = useCallback((secondsValue, currentMode = modeRef.current) => {
    if (totalSecondsRef.current <= 0) return 0;

    if (currentMode === TIMER_MODES.STOPWATCH) {
      return Math.min((secondsValue / totalSecondsRef.current) * 100, 100);
    }

    return Math.max(0, Math.min(((totalSecondsRef.current - secondsValue) / totalSecondsRef.current) * 100, 100));
  }, []);

  const persistCurrentTimerSession = useCallback((overrides = {}) => {
    const startedAt = overrides.startedAt ?? sessionStartedAtRef.current;
    const clockStartedAt = overrides.countdownStartedAt ?? startTimeRef.current ?? startedAt;
    // Prefer explicit override; otherwise take the larger of the local ref vs the store value.
    // The store may have been updated by a cloud sync (e.g. +1 min from another device) before
    // the ref is updated by the totalSeconds effect, so using Math.max avoids reverting it.
    const storeTotal = useGameStore.getState().timerSession.totalSeconds ?? 0;
    const totalSecondsValue = overrides.totalSeconds ?? Math.max(totalSecondsRef.current ?? 0, storeTotal);

    if (!startedAt || !clockStartedAt || !totalSecondsValue) return;

    persistTimerSession({
      mode: overrides.mode ?? modeRef.current,
      startedAt,
      countdownStartedAt: clockStartedAt,
      pausedAt: overrides.pausedAt ?? pausedAtRef.current,
      pausedTotalMs: overrides.pausedTotalMs ?? pausedTotalMsRef.current,
      pauseSegments: [...(overrides.pauseSegments ?? pauseSegmentsRef.current)],
      categoryId: overrides.categoryId ?? sessionCategoryIdRef.current,
      categorySnapshot: overrides.categorySnapshot ?? sessionCategorySnapshotRef.current,
      note: overrides.note ?? sessionNoteRef.current,
      goal: overrides.goal ?? sessionGoalRef.current,
      nextNote: overrides.nextNote ?? sessionNextNoteRef.current,
      totalSeconds: totalSecondsValue,
      continueAfterPomodoro: overrides.continueAfterPomodoro ?? sessionContinueAfterPomodoroRef.current,
      continuedPomodoroConfirmedUntilSeconds: overrides.continuedPomodoroConfirmedUntilSeconds
        ?? continuedPomodoroConfirmUntilSecondsRef.current,
    });
  }, [persistTimerSession]);

  const buildCompletedSessionTiming = useCallback((finishedAtMs) => {
    const startedAtMs = sessionStartedAtRef.current ?? finishedAtMs;

    return {
      startedAt: new Date(startedAtMs).toISOString(),
      finishedAt: new Date(finishedAtMs).toISOString(),
      pausedTotalMs: Math.max(0, pausedTotalMsRef.current),
      wallClockDurationMs: Math.max(0, finishedAtMs - startedAtMs),
      pauseSegments: pauseSegmentsRef.current.map((segment) => ({
        startedAt: new Date(segment.startedAt).toISOString(),
        endedAt: new Date(segment.endedAt).toISOString(),
        durationMs: Math.max(0, segment.durationMs ?? (segment.endedAt - segment.startedAt)),
      })),
    };
  }, []);

  useEffect(() => {
    continueTimingAfterPomodoroSettingRef.current = continueTimingAfterPomodoro;
  }, [continueTimingAfterPomodoro]);

  useEffect(() => {
    if (timerStateRef.current !== TIMER_STATES.IDLE) return;
    modeRef.current = mode;
    setActiveMode(mode);
  }, [mode]);

  const isContinuingAfterPomodoro = activeMode === TIMER_MODES.STOPWATCH
    && sessionContinueAfterPomodoroRef.current
    && totalSecondsRef.current > 0;
  const visibleDisplaySeconds = isContinuingAfterPomodoro
    ? Math.max(0, displaySeconds - totalSecondsRef.current)
    : displaySeconds;

  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      document.title = `${formatTime(visibleDisplaySeconds)} ⏱ DC Pomodoro`;
    } else if (timerState === TIMER_STATES.PAUSED) {
      document.title = `${formatTime(visibleDisplaySeconds)} ⏸ DC Pomodoro`;
    } else {
      document.title = 'DC Pomodoro';
    }

    return () => {
      document.title = 'DC Pomodoro';
    };
  }, [timerState, visibleDisplaySeconds]);

  useEffect(() => {
    if (timerState !== TIMER_STATES.IDLE) return;

    const nextSeconds = getInitialDisplaySeconds(mode, focusMinutes);
    totalSecondsRef.current = totalSeconds;
    secondsRef.current = nextSeconds;
    setDisplaySeconds(nextSeconds);
    setActiveMode(mode);
  }, [focusMinutes, mode, timerState, totalSeconds]);

  useEffect(() => () => {
    clearInterval(intervalRef.current);
    clearTimeout(pendingBreakTimeoutRef.current);
  }, []);

  useEffect(() => {
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return;

    const liveNote = pendingNote ?? '';
    if (sessionNoteRef.current === liveNote) return;
    sessionNoteRef.current = liveNote;
    persistCurrentTimerSession({ note: liveNote });
  }, [pendingNote, persistCurrentTimerSession, timerState]);

  useEffect(() => {
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return;

    const liveGoal = pendingSessionGoal ?? '';
    if (sessionGoalRef.current === liveGoal) return;
    sessionGoalRef.current = liveGoal;
    persistCurrentTimerSession({ goal: liveGoal });
  }, [pendingSessionGoal, persistCurrentTimerSession, timerState]);

  useEffect(() => {
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return;

    const liveNextNote = pendingNextSessionNote ?? '';
    if (sessionNextNoteRef.current === liveNextNote) return;
    sessionNextNoteRef.current = liveNextNote;
    persistCurrentTimerSession({ nextNote: liveNextNote });
  }, [pendingNextSessionNote, persistCurrentTimerSession, timerState]);

  const continuePomodoroAsStopwatch = useCallback((transitionedAtMs = Date.now()) => {
    if (modeRef.current !== TIMER_MODES.POMODORO) return false;
    if (!startTimeRef.current) return false;

    const elapsedSeconds = getElapsedSeconds(startTimeRef.current, transitionedAtMs);
    modeRef.current = TIMER_MODES.STOPWATCH;
    setActiveMode(TIMER_MODES.STOPWATCH);
    secondsRef.current = elapsedSeconds;
    extensionReadyArmedRef.current = false;
    const confirmUntilSeconds = getContinuedPomodoroConfirmUntilSeconds(
      { continuedPomodoroConfirmedUntilSeconds: continuedPomodoroConfirmUntilSecondsRef.current },
      totalSecondsRef.current,
    );
    continuedPomodoroConfirmUntilSecondsRef.current = confirmUntilSeconds;
    setContinuedPomodoroConfirmationPendingState(false);
    setDisplaySeconds(elapsedSeconds);

    persistCurrentTimerSession({
      mode: TIMER_MODES.STOPWATCH,
      countdownStartedAt: startTimeRef.current,
      totalSeconds: totalSecondsRef.current,
      continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
      continuedPomodoroConfirmedUntilSeconds: confirmUntilSeconds,
    });
    updateTimerLive({
      isRunning: true,
      mode: TIMER_MODES.STOPWATCH,
      startedAt: new Date(startTimeRef.current).toISOString(),
      totalSeconds: totalSecondsRef.current,
      pausedSecondsRemaining: null,
    });
    void pushNow();
    return true;
  }, [getElapsedSeconds, persistCurrentTimerSession, setContinuedPomodoroConfirmationPendingState]);

  const holdContinuedPomodoroForConfirmation = useCallback((confirmUntilSeconds) => {
    const safeConfirmUntilSeconds = Math.max(0, Math.floor(confirmUntilSeconds));
    const startedAt = startTimeRef.current ?? Date.now();
    const pausedAt = startedAt + (safeConfirmUntilSeconds * 1000);

    clearInterval(intervalRef.current);
    secondsRef.current = safeConfirmUntilSeconds;
    pausedAtRef.current = pausedAt;
    setDisplaySeconds(safeConfirmUntilSeconds);
    setContinuedPomodoroConfirmationPendingState(true);
    persistCurrentTimerSession({
      mode: TIMER_MODES.STOPWATCH,
      pausedAt,
      totalSeconds: totalSecondsRef.current,
      continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
      continuedPomodoroConfirmedUntilSeconds: safeConfirmUntilSeconds,
    });
    updateTimerLive({
      isRunning: false,
      mode: TIMER_MODES.STOPWATCH,
      startedAt: null,
      totalSeconds: totalSecondsRef.current,
      pausedSecondsRemaining: safeConfirmUntilSeconds,
    });
    clearFocusCompletePush('continued-pomodoro-confirmation');
    setTimerState(TIMER_STATES.PAUSED);
    void pushNow();
  }, [
    clearFocusCompletePush,
    persistCurrentTimerSession,
    setContinuedPomodoroConfirmationPendingState,
  ]);

  const tickClock = useCallback(() => {
    const elapsedSeconds = getElapsedSeconds(startTimeRef.current);
    const nextDisplaySeconds = computeDisplayFromElapsed(elapsedSeconds);

    if (
      shouldHoldContinuedPomodoroForConfirmation({
        mode: modeRef.current,
        continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
        displaySeconds: nextDisplaySeconds,
        confirmUntilSeconds: continuedPomodoroConfirmUntilSecondsRef.current,
      })
    ) {
      holdContinuedPomodoroForConfirmation(continuedPomodoroConfirmUntilSecondsRef.current);
      return;
    }

    secondsRef.current = nextDisplaySeconds;
    setDisplaySeconds(nextDisplaySeconds);

    if (modeRef.current === TIMER_MODES.POMODORO) {
      if (nextDisplaySeconds > EXTENSION_READY_SECONDS) {
        extensionReadyArmedRef.current = true;
      } else if (nextDisplaySeconds > 0 && extensionReadyArmedRef.current) {
        soundEngine.playExtensionReady();
        extensionReadyArmedRef.current = false;
      }
    }

    if (modeRef.current === TIMER_MODES.POMODORO && nextDisplaySeconds <= 10 && nextDisplaySeconds > 0) {
      soundEngine.playUrgentTick();
    }

    if (totalSecondsRef.current > 0) {
      const nextProgressPct = computeProgressPct(nextDisplaySeconds);
      for (const step of MILESTONE_PCTS) {
        if (nextProgressPct >= step && !milestoneRef.current.has(step)) {
          milestoneRef.current.add(step);
          setMilestone(step);
          break;
        }
      }
    }

    if (
      modeRef.current === TIMER_MODES.POMODORO
      && nextDisplaySeconds === 30
    ) {
      void fetch('/api/push/dispatch', { method: 'GET' }).catch(() => {});
    }

    if (modeRef.current === TIMER_MODES.POMODORO && nextDisplaySeconds <= 0) {
      if (
        shouldContinuePomodoroAsStopwatch({
          mode: modeRef.current,
          continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
          displaySeconds: nextDisplaySeconds,
        })
        && continuePomodoroAsStopwatch()
      ) {
        return;
      }
      handleFinishRef.current?.();
    }
  }, [
    computeDisplayFromElapsed,
    computeProgressPct,
    continuePomodoroAsStopwatch,
    getElapsedSeconds,
    holdContinuedPomodoroForConfirmation,
  ]);

  const runInterval = useCallback(() => {
    clearInterval(intervalRef.current);
    if (!startTimeRef.current) {
      intervalRef.current = window.setInterval(tickClock, 1000);
      return;
    }
    // Align the first tick to the next exact second boundary of startTimeRef
    // so all devices fire in sync regardless of when they start/restore.
    const msInto = (Date.now() - startTimeRef.current) % 1000;
    const msUntilNext = msInto === 0 ? 0 : 1000 - msInto;
    intervalRef.current = window.setTimeout(() => {
      tickClock();
      intervalRef.current = window.setInterval(tickClock, 1000);
    }, msUntilNext);
  }, [tickClock]);

  const commitCompletedSession = useCallback((
    creditedMinutes,
    categoryId,
    note,
    sessionTiming,
    sessionSnapshot,
  ) => {
    const sessionResult = completeFocusSession(
      creditedMinutes,
      categoryId,
      note,
      sessionTiming,
      sessionSnapshot,
    );

    // Chỉ xoá phiên đang persist sau khi store đã xử lý completion xong.
    clearTimerSession();
    setPendingBreakNote('');
    return sessionResult;
  }, [clearTimerSession, completeFocusSession, setPendingBreakNote]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!startTimeRef.current || pausedAtRef.current) return;

      tickClock();
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [tickClock]);

  const finish = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return;

    const capturedClockStart = startTimeRef.current;
    if (!capturedClockStart) return;

    const finishedAtMs = pausedAtRef.current ?? Date.now();
    const authoritativeDisplaySeconds = getAuthoritativeDisplaySeconds(modeRef.current, finishedAtMs);
    if (modeRef.current === TIMER_MODES.POMODORO && authoritativeDisplaySeconds > 0) {
      secondsRef.current = authoritativeDisplaySeconds;
      setDisplaySeconds(authoritativeDisplaySeconds);
      return;
    }

    const sessionTiming = buildCompletedSessionTiming(finishedAtMs);
    const lockedCategoryId = sessionCategoryIdRef.current ?? null;
    const lockedNote = sessionNoteRef.current ?? '';
    const lockedGoal = sessionGoalRef.current ?? '';
    const lockedNextNote = sessionNextNoteRef.current ?? '';
    const sessionSnapshot = {
      categorySnapshot: sessionCategorySnapshotRef.current ?? null,
      goal: lockedGoal,
      nextNote: lockedNextNote,
    };

    timerEndReasonRef.current = TIMER_END_REASONS.COMPLETED;
    if (modeRef.current === TIMER_MODES.STOPWATCH) {
      void cancelPomodoroContinuePush('finished-stopwatch');
    }
    startTimeRef.current = null;
    pausedAtRef.current = null;
    clearInterval(intervalRef.current);
    soundEngine.playTimerFinish();

    const elapsedMs = Math.max(0, finishedAtMs - capturedClockStart);
    const creditedMinutes = getCreditedFocusMinutes({
      mode: modeRef.current,
      elapsedMs,
      targetSeconds: totalSecondsRef.current,
    });

    const breakPlan = getBreakPlan({
      mode: modeRef.current,
      workedMinutes: getWorkedMinutesForBreak({
        mode: modeRef.current,
        elapsedMs,
        creditedMinutes,
      }),
      sessionsCompleted,
      longBreakCycleStart,
      shortBreakDuration,
      longBreakDuration,
      longBreakAfterN,
      extraBreakMinutes: unlockedSkills.hit_tho_sau ? BREAK_EXTENSION_MINUTES : 0,
      justCompletedSession: true,
    });

    const sessionResult = commitCompletedSession(
      creditedMinutes,
      lockedCategoryId,
      lockedNote,
      sessionTiming,
      sessionSnapshot,
    );
    const completedSessionId = sessionResult?.sessionId ?? null;
    const sessionWasRecorded = completedSessionId != null;
    setLastCompletedSessionId(completedSessionId);
    resetSessionTimeline();
    if (!sessionWasRecorded) {
      clearTimerLive({
        mode: modeRef.current,
        endedReason: TIMER_END_REASONS.COMPLETED,
      });
      void pushNow();
      setTimerState(TIMER_STATES.IDLE);
      return;
    }

    const shouldAutoStartBreak = !disableBreak && autoStartBreak;
    setTimerState(TIMER_STATES.FINISHED);
    if (shouldAutoStartBreak) {
      clearTimeout(pendingBreakTimeoutRef.current);
      // ** Not a bug / won't fix: this delayed auto-start is tracked in a ref
      // and cleared by reset()/cancel(), so it does not corrupt timer state.
      pendingBreakTimeoutRef.current = window.setTimeout(() => {
        setTimerState(TIMER_STATES.IDLE);
        startBreak({
          ...breakPlan,
          sourceSessionId: completedSessionId ?? null,
        });
      }, 500);
    }
  }, [
    autoStartBreak,
    buildCompletedSessionTiming,
    commitCompletedSession,
    disableBreak,
    getAuthoritativeDisplaySeconds,
    longBreakAfterN,
    longBreakCycleStart,
    longBreakDuration,
    resetSessionTimeline,
    sessionsCompleted,
    shortBreakDuration,
    startBreak,
    timerState,
    unlockedSkills.hit_tho_sau,
  ]);

  useEffect(() => {
    handleFinishRef.current = finish;
  }, [finish]);

  useEffect(() => {
    if (!window.electronAPI) return;

    if (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED) {
      window.electronAPI.updateTray({ state: timerState, timeLeft: formatTime(visibleDisplaySeconds) });
      return;
    }

    window.electronAPI.updateTray({ state: timerState, timeLeft: '' });
  }, [timerState, visibleDisplaySeconds]);

  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      updateTimerLive({
        isRunning: true,
        mode: modeRef.current,
        startedAt: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
        totalSeconds: totalSecondsRef.current,
        pausedSecondsRemaining: null,
      });
      void pushNow();
    } else if (timerState === TIMER_STATES.PAUSED) {
      updateTimerLive({
        isRunning: false,
        mode: modeRef.current,
        startedAt: null,
        totalSeconds: totalSecondsRef.current,
        pausedSecondsRemaining: secondsRef.current,
      });
      void pushNow();
    } else if (timerState !== TIMER_STATES.IDLE) {
      // FINISHED hoặc CANCELLED — session vừa kết thúc, cần clear
      const endedReason = timerEndReasonRef.current
        ?? (timerState === TIMER_STATES.CANCELLED ? TIMER_END_REASONS.CANCELLED : TIMER_END_REASONS.COMPLETED);
      const clearLive = () => clearTimerLive({
        mode: modeRef.current,
        endedReason,
      });

      if (endedReason === TIMER_END_REASONS.COMPLETED) {
        clearLive();
      } else {
        void clearFocusCompletePush(endedReason).finally(clearLive);
      }

      timerEndReasonRef.current = null;
      void pushNow();
    }
    // IDLE: không làm gì — tránh clearTimerLive() gây Electron notification giả
  }, [clearFocusCompletePush, timerState]);

  // Phản ứng với pause/resume từ thiết bị khác qua cloud sync
  useEffect(() => {
    if (!timerSession.isRunning) return;
    // Thiết bị khác pause: pausedAt xuất hiện nhưng mình vẫn đang RUNNING
    if (timerSession.pausedAt && timerStateRef.current === TIMER_STATES.RUNNING) {
      clearInterval(intervalRef.current);
      pausedAtRef.current = timerSession.pausedAt;
      const syncedMode = timerSession.mode === TIMER_MODES.STOPWATCH
        ? TIMER_MODES.STOPWATCH
        : modeRef.current;
      const syncedContinueAfterPomodoro = resolveContinueAfterPomodoro(
        timerSession,
        sessionContinueAfterPomodoroRef.current,
      );
      const syncedConfirmUntilSeconds = syncedMode === TIMER_MODES.STOPWATCH && syncedContinueAfterPomodoro
        ? getContinuedPomodoroConfirmUntilSeconds(timerSession, timerSession.totalSeconds ?? totalSecondsRef.current)
        : null;
      const syncedDisplaySeconds = computeDisplayFromElapsed(
        getElapsedSeconds(timerSession.countdownStartedAt ?? startTimeRef.current, timerSession.pausedAt),
        syncedMode,
      );
      const pendingContinuedConfirmation = shouldHoldContinuedPomodoroForConfirmation({
        mode: syncedMode,
        continueAfterPomodoro: syncedContinueAfterPomodoro,
        displaySeconds: syncedDisplaySeconds,
        confirmUntilSeconds: syncedConfirmUntilSeconds,
      });

      continuedPomodoroConfirmUntilSecondsRef.current = syncedConfirmUntilSeconds;
      setContinuedPomodoroConfirmationPendingState(pendingContinuedConfirmation);
      if (pendingContinuedConfirmation) {
        secondsRef.current = syncedConfirmUntilSeconds;
        setDisplaySeconds(syncedConfirmUntilSeconds);
      }
      setTimerState(TIMER_STATES.PAUSED);
      return;
    }
    // Thiết bị khác resume: pausedAt biến mất nhưng mình vẫn đang PAUSED
    if (!timerSession.pausedAt && timerStateRef.current === TIMER_STATES.PAUSED) {
      startTimeRef.current = timerSession.countdownStartedAt ?? startTimeRef.current;
      pausedAtRef.current = null;
      if (timerSession.mode === TIMER_MODES.STOPWATCH) {
        continuedPomodoroConfirmUntilSecondsRef.current = timerSession.continuedPomodoroConfirmedUntilSeconds ?? null;
      }
      setContinuedPomodoroConfirmationPendingState(false);
      setTimerState(TIMER_STATES.RUNNING);
      runInterval();
    }
  }, [
    computeDisplayFromElapsed,
    getElapsedSeconds,
    runInterval,
    setContinuedPomodoroConfirmationPendingState,
    timerSession,
  ]);

  useEffect(() => {
    if (!timerSession.isRunning || !timerSession.mode) return;
    if (timerStateRef.current !== TIMER_STATES.RUNNING && timerStateRef.current !== TIMER_STATES.PAUSED) return;

    const syncedMode = timerSession.mode === TIMER_MODES.STOPWATCH
      ? TIMER_MODES.STOPWATCH
      : TIMER_MODES.POMODORO;
    if (syncedMode === modeRef.current) return;

    modeRef.current = syncedMode;
    setActiveMode(syncedMode);
    const syncedContinueAfterPomodoro = resolveContinueAfterPomodoro(
      timerSession,
      sessionContinueAfterPomodoroRef.current,
    );
    sessionContinueAfterPomodoroRef.current = syncedMode === TIMER_MODES.STOPWATCH
      ? Boolean(syncedContinueAfterPomodoro)
      : syncedContinueAfterPomodoro;
    continuedPomodoroConfirmUntilSecondsRef.current = syncedMode === TIMER_MODES.STOPWATCH && syncedContinueAfterPomodoro
      ? getContinuedPomodoroConfirmUntilSeconds(timerSession, timerSession.totalSeconds ?? totalSecondsRef.current)
      : null;

    const effectiveNowMs = pausedAtRef.current ?? Date.now();
    const elapsedSeconds = getElapsedSeconds(startTimeRef.current, effectiveNowMs);
    const syncedDisplaySeconds = computeDisplayFromElapsed(elapsedSeconds, syncedMode);
    secondsRef.current = syncedDisplaySeconds;
    extensionReadyArmedRef.current = syncedMode === TIMER_MODES.POMODORO
      && syncedDisplaySeconds > EXTENSION_READY_SECONDS;
    setDisplaySeconds(syncedDisplaySeconds);

    if (syncedMode === TIMER_MODES.STOPWATCH) {
      void cancelFocusCompletePush('stopwatch-sync');
    }
  }, [
    computeDisplayFromElapsed,
    getElapsedSeconds,
    timerSession,
  ]);

  // Thiết bị khác bấm +1 phút: totalSeconds tăng nhưng startedAt không đổi
  useEffect(() => {
    if (!timerSession.isRunning || !timerSession.totalSeconds) return;
    if (timerStateRef.current !== TIMER_STATES.RUNNING && timerStateRef.current !== TIMER_STATES.PAUSED) return;
    if (timerSession.totalSeconds === totalSecondsRef.current) return;

    const diff = timerSession.totalSeconds - totalSecondsRef.current;
    totalSecondsRef.current = timerSession.totalSeconds;
    if (modeRef.current === TIMER_MODES.STOPWATCH) return;
    secondsRef.current = Math.max(0, secondsRef.current + diff);
    setDisplaySeconds(secondsRef.current);
  }, [timerSession.totalSeconds, timerSession.isRunning]);

  useEffect(() => {
    const {
      isRunning,
      mode: savedMode,
      startedAt,
      countdownStartedAt,
      pausedAt,
      pausedTotalMs,
      pauseSegments,
      categoryId,
      categorySnapshot,
      note,
      goal,
      nextNote,
      totalSeconds: savedTotalSeconds,
      continueAfterPomodoro,
      continuedPomodoroConfirmedUntilSeconds,
    } = timerSession;

    if (!isRunning || !startedAt || !savedTotalSeconds) return;

    const runtimeMode = savedMode === TIMER_MODES.STOPWATCH
      ? TIMER_MODES.STOPWATCH
      : TIMER_MODES.POMODORO;
    const savedContinueAfterPomodoro = resolveContinueAfterPomodoro(
      { continueAfterPomodoro },
      continueTimingAfterPomodoroSettingRef.current,
    );
    const effectiveClockStart = countdownStartedAt ?? startedAt;
    const effectivePauseSegments = Array.isArray(pauseSegments) ? pauseSegments : [];
    const elapsedSeconds = getElapsedSeconds(effectiveClockStart, pausedAt ?? Date.now());
    const rawRestoredDisplaySeconds = runtimeMode === TIMER_MODES.STOPWATCH
      ? elapsedSeconds
      : Math.max(0, savedTotalSeconds - elapsedSeconds);
    const restoredConfirmUntilSeconds = runtimeMode === TIMER_MODES.STOPWATCH && savedContinueAfterPomodoro
      ? getContinuedPomodoroConfirmUntilSeconds(
          { continuedPomodoroConfirmedUntilSeconds },
          savedTotalSeconds,
        )
      : null;
    const shouldHoldForContinuedConfirmation = shouldHoldContinuedPomodoroForConfirmation({
      mode: runtimeMode,
      continueAfterPomodoro: savedContinueAfterPomodoro,
      displaySeconds: rawRestoredDisplaySeconds,
      confirmUntilSeconds: restoredConfirmUntilSeconds,
    });
    const restoredDisplaySeconds = shouldHoldForContinuedConfirmation
      ? restoredConfirmUntilSeconds
      : rawRestoredDisplaySeconds;
    const restoredPausedAt = shouldHoldForContinuedConfirmation
      ? effectiveClockStart + (restoredConfirmUntilSeconds * 1000)
      : (pausedAt ?? null);
    const shouldRestorePaused = Boolean(restoredPausedAt);

    sessionStartedAtRef.current = startedAt;
    setSessionStartedAt(startedAt);
    startTimeRef.current = effectiveClockStart;
    pausedAtRef.current = pausedAt ?? null;
    pausedTotalMsRef.current = Number.isFinite(pausedTotalMs) ? pausedTotalMs : 0;
    pauseSegmentsRef.current = effectivePauseSegments;
    sessionCategoryIdRef.current = categoryId ?? null;
    sessionCategorySnapshotRef.current = categorySnapshot ?? null;
    sessionNoteRef.current = note ?? '';
    sessionGoalRef.current = goal ?? '';
    sessionNextNoteRef.current = nextNote ?? '';
    sessionContinueAfterPomodoroRef.current = runtimeMode === TIMER_MODES.POMODORO
      ? savedContinueAfterPomodoro
      : Boolean(savedContinueAfterPomodoro);
    continuedPomodoroConfirmUntilSecondsRef.current = restoredConfirmUntilSeconds;
    setContinuedPomodoroConfirmationPendingState(shouldHoldForContinuedConfirmation);
    setPendingNote(note ?? '');
    setPendingSessionGoal(goal ?? '');
    setPendingNextSessionNote(nextNote ?? '');

    modeRef.current = runtimeMode;
    setActiveMode(runtimeMode);
    totalSecondsRef.current = savedTotalSeconds;
    pausedAtRef.current = restoredPausedAt;
    secondsRef.current = restoredDisplaySeconds;
    extensionReadyArmedRef.current = runtimeMode === TIMER_MODES.POMODORO
      && restoredDisplaySeconds > EXTENSION_READY_SECONDS;
    setDisplaySeconds(restoredDisplaySeconds);

    const restoredProgressPct = runtimeMode === TIMER_MODES.STOPWATCH
      ? Math.min((elapsedSeconds / savedTotalSeconds) * 100, 100)
      : Math.max(0, Math.min(((savedTotalSeconds - restoredDisplaySeconds) / savedTotalSeconds) * 100, 100));
    MILESTONE_PCTS.forEach((step) => {
      if (restoredProgressPct >= step) milestoneRef.current.add(step);
    });

    if (runtimeMode === TIMER_MODES.STOPWATCH) {
      void cancelFocusCompletePush('stopwatch');
      if (shouldHoldForContinuedConfirmation) {
        persistCurrentTimerSession({
          mode: TIMER_MODES.STOPWATCH,
          startedAt,
          countdownStartedAt: effectiveClockStart,
          pausedAt: restoredPausedAt,
          pausedTotalMs: pausedTotalMsRef.current,
          pauseSegments: pauseSegmentsRef.current,
          categoryId: sessionCategoryIdRef.current,
          categorySnapshot: sessionCategorySnapshotRef.current,
          note: sessionNoteRef.current,
          goal: sessionGoalRef.current,
          nextNote: sessionNextNoteRef.current,
          totalSeconds: savedTotalSeconds,
          continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
          continuedPomodoroConfirmedUntilSeconds: restoredConfirmUntilSeconds,
        });
        updateTimerLive({
          isRunning: false,
          mode: TIMER_MODES.STOPWATCH,
          startedAt: null,
          totalSeconds: savedTotalSeconds,
          pausedSecondsRemaining: restoredDisplaySeconds,
        });
        void pushNow();
      }
      setTimerState(shouldRestorePaused ? TIMER_STATES.PAUSED : TIMER_STATES.RUNNING);
      if (!shouldRestorePaused) runInterval();
      return;
    }

    if (
      shouldContinuePomodoroAsStopwatch({
        mode: runtimeMode,
        continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
        displaySeconds: restoredDisplaySeconds,
        isPaused: shouldRestorePaused,
      })
    ) {
      const stopwatchDisplaySeconds = getElapsedSeconds(effectiveClockStart);
      const confirmUntilSeconds = getContinuedPomodoroConfirmUntilSeconds(
        { continuedPomodoroConfirmedUntilSeconds },
        savedTotalSeconds,
      );
      const shouldHoldStopwatchForConfirmation = shouldHoldContinuedPomodoroForConfirmation({
        mode: TIMER_MODES.STOPWATCH,
        continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
        displaySeconds: stopwatchDisplaySeconds,
        confirmUntilSeconds,
      });
      const nextStopwatchDisplaySeconds = shouldHoldStopwatchForConfirmation
        ? confirmUntilSeconds
        : stopwatchDisplaySeconds;
      const nextPausedAt = shouldHoldStopwatchForConfirmation
        ? effectiveClockStart + (confirmUntilSeconds * 1000)
        : null;
      modeRef.current = TIMER_MODES.STOPWATCH;
      setActiveMode(TIMER_MODES.STOPWATCH);
      secondsRef.current = nextStopwatchDisplaySeconds;
      pausedAtRef.current = nextPausedAt;
      extensionReadyArmedRef.current = false;
      continuedPomodoroConfirmUntilSecondsRef.current = confirmUntilSeconds;
      setContinuedPomodoroConfirmationPendingState(shouldHoldStopwatchForConfirmation);
      setDisplaySeconds(nextStopwatchDisplaySeconds);
      void cancelFocusCompletePush('continued-stopwatch-restore');
      persistCurrentTimerSession({
        mode: TIMER_MODES.STOPWATCH,
        startedAt,
        countdownStartedAt: effectiveClockStart,
        pausedAt: nextPausedAt,
        pausedTotalMs: pausedTotalMsRef.current,
        pauseSegments: pauseSegmentsRef.current,
        categoryId: sessionCategoryIdRef.current,
        categorySnapshot: sessionCategorySnapshotRef.current,
        note: sessionNoteRef.current,
        goal: sessionGoalRef.current,
        nextNote: sessionNextNoteRef.current,
        totalSeconds: savedTotalSeconds,
        continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
        continuedPomodoroConfirmedUntilSeconds: confirmUntilSeconds,
      });
      updateTimerLive({
        isRunning: !shouldHoldStopwatchForConfirmation,
        mode: TIMER_MODES.STOPWATCH,
        startedAt: shouldHoldStopwatchForConfirmation ? null : new Date(effectiveClockStart).toISOString(),
        totalSeconds: savedTotalSeconds,
        pausedSecondsRemaining: shouldHoldStopwatchForConfirmation ? nextStopwatchDisplaySeconds : null,
      });
      setTimerState(shouldHoldStopwatchForConfirmation ? TIMER_STATES.PAUSED : TIMER_STATES.RUNNING);
      if (!shouldHoldStopwatchForConfirmation) runInterval();
      void pushNow();
      return;
    }

    if (restoredDisplaySeconds > 0 || shouldRestorePaused) {
      if (shouldRestorePaused) {
        clearFocusCompletePush('paused');
      } else {
        syncFocusCompletePush(
          effectiveClockStart + (savedTotalSeconds * 1000),
          savedTotalSeconds / 60,
        );
      }
      setTimerState(shouldRestorePaused ? TIMER_STATES.PAUSED : TIMER_STATES.RUNNING);
      if (!shouldRestorePaused) runInterval();
      return;
    }

    startTimeRef.current = null;
    const creditedMinutes = Math.round(savedTotalSeconds / 60);
    const finishedAtMs = effectiveClockStart + (savedTotalSeconds * 1000);
    syncFocusCompletePush(finishedAtMs, creditedMinutes);
    const sessionTiming = {
      startedAt: new Date(startedAt).toISOString(),
      finishedAt: new Date(finishedAtMs).toISOString(),
      pausedTotalMs: pausedTotalMsRef.current,
      wallClockDurationMs: Math.max(0, finishedAtMs - startedAt),
      pauseSegments: pauseSegmentsRef.current.map((segment) => ({
        startedAt: new Date(segment.startedAt).toISOString(),
        endedAt: new Date(segment.endedAt).toISOString(),
        durationMs: Math.max(0, segment.durationMs ?? (segment.endedAt - segment.startedAt)),
      })),
    };

    const sessionResult = commitCompletedSession(
      creditedMinutes,
      sessionCategoryIdRef.current ?? null,
      sessionNoteRef.current ?? '',
      sessionTiming,
      {
        categorySnapshot: sessionCategorySnapshotRef.current ?? null,
        goal: sessionGoalRef.current ?? '',
        nextNote: sessionNextNoteRef.current ?? '',
      },
    );
    const completedSessionId = sessionResult?.sessionId ?? null;
    const sessionWasRecorded = completedSessionId != null;
    setLastCompletedSessionId(completedSessionId);
    if (!sessionWasRecorded) {
      setTimerState(TIMER_STATES.IDLE);
      resetSessionTimeline();
      return;
    }

    const shouldAutoStartBreak = !disableBreak && autoStartBreak;
    setTimerState(TIMER_STATES.FINISHED);
    resetSessionTimeline();

    const breakPlan = getBreakPlan({
      mode: runtimeMode,
      workedMinutes: creditedMinutes,
      sessionsCompleted,
      longBreakCycleStart,
      shortBreakDuration,
      longBreakDuration,
      longBreakAfterN,
      extraBreakMinutes: unlockedSkills.hit_tho_sau ? BREAK_EXTENSION_MINUTES : 0,
      justCompletedSession: true,
    });

    if (shouldAutoStartBreak) {
      clearTimeout(pendingBreakTimeoutRef.current);
      // ** Not a bug / won't fix: this delayed auto-start is tracked in a ref
      // and cleared by reset()/cancel(), so it does not corrupt timer state.
      pendingBreakTimeoutRef.current = window.setTimeout(() => {
        setTimerState(TIMER_STATES.IDLE);
        startBreak({
          ...breakPlan,
          sourceSessionId: completedSessionId ?? null,
        });
      }, 500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerSession.startedAt]);

  const start = useCallback(() => {
    if (timerState !== TIMER_STATES.IDLE) return;
    if (eraCrisis.active && eraCrisis.choiceMade !== 'challenge') return;

    const now = Date.now();
    prepareFocusSessionStart({ startedAt: now, mode });
    const categorySnapshot = pendingCategoryId
      ? (sessionCategories.find((category) => category.id === pendingCategoryId) ?? null)
      : null;
    const initialSeconds = getInitialDisplaySeconds(mode, focusMinutes);
    const continueAfterPomodoro = mode === TIMER_MODES.POMODORO
      && continueTimingAfterPomodoroSettingRef.current;

    totalSecondsRef.current = focusMinutes * 60;
    secondsRef.current = initialSeconds;
    modeRef.current = mode;
    sessionContinueAfterPomodoroRef.current = continueAfterPomodoro;
    continuedPomodoroConfirmUntilSecondsRef.current = null;
    setContinuedPomodoroConfirmationPendingState(false);
    timerEndReasonRef.current = null;
    setActiveMode(mode);
    startTimeRef.current = now;
    sessionStartedAtRef.current = now;
    setSessionStartedAt(now);
    pausedAtRef.current = null;
    pausedTotalMsRef.current = 0;
    pauseSegmentsRef.current = [];
    sessionCategoryIdRef.current = pendingCategoryId ?? null;
    sessionCategorySnapshotRef.current = categorySnapshot;
    sessionNoteRef.current = pendingNote ?? '';
    sessionGoalRef.current = pendingSessionGoal ?? '';
    sessionNextNoteRef.current = pendingNextSessionNote ?? '';
    milestoneRef.current = new Set();
    extensionReadyArmedRef.current = mode === TIMER_MODES.POMODORO
      && initialSeconds > EXTENSION_READY_SECONDS;
    setLastCompletedSessionId(null);
    setMilestone(null);
    setDisplaySeconds(initialSeconds);

    persistCurrentTimerSession({
      mode,
      startedAt: now,
      countdownStartedAt: now,
      pausedAt: null,
      pausedTotalMs: 0,
      pauseSegments: [],
      categoryId: pendingCategoryId ?? null,
      categorySnapshot,
      note: pendingNote ?? '',
      goal: pendingSessionGoal ?? '',
      nextNote: pendingNextSessionNote ?? '',
      totalSeconds: focusMinutes * 60,
      continueAfterPomodoro,
      continuedPomodoroConfirmedUntilSeconds: null,
    });

    syncFocusCompletePush(now + (focusMinutes * 60 * 1000), focusMinutes, mode);
    setTimerState(TIMER_STATES.RUNNING);
    soundEngine.playSessionStart();
    runInterval();
  }, [
    focusMinutes,
    mode,
    eraCrisis.active,
    eraCrisis.choiceMade,
    pendingCategoryId,
    pendingNextSessionNote,
    pendingNote,
    pendingSessionGoal,
    prepareFocusSessionStart,
    persistCurrentTimerSession,
    runInterval,
    sessionCategories,
    setContinuedPomodoroConfirmationPendingState,
    syncFocusCompletePush,
    timerState,
  ]);

  const cancel = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return;

    const cancelledAtMs = Date.now();
    const authoritativeDisplaySeconds = getAuthoritativeDisplaySeconds(modeRef.current, cancelledAtMs);
    const elapsedSeconds = modeRef.current === TIMER_MODES.STOPWATCH
      ? authoritativeDisplaySeconds
      : Math.max(0, totalSecondsRef.current - authoritativeDisplaySeconds);
    const elapsedMinutes = Math.max(0, Math.floor(elapsedSeconds / 60));
    const baseSessionTiming = buildCompletedSessionTiming(cancelledAtMs);
    const openPauseDurationMs = pausedAtRef.current
      ? Math.max(0, cancelledAtMs - pausedAtRef.current)
      : 0;
    const sessionTiming = openPauseDurationMs > 0
      ? {
          ...baseSessionTiming,
          pausedTotalMs: baseSessionTiming.pausedTotalMs + openPauseDurationMs,
          pauseSegments: [
            ...baseSessionTiming.pauseSegments,
            {
              startedAt: new Date(pausedAtRef.current).toISOString(),
              endedAt: new Date(cancelledAtMs).toISOString(),
              durationMs: openPauseDurationMs,
            },
          ],
        }
      : baseSessionTiming;
    const lockedCategoryId = sessionCategoryIdRef.current ?? null;
    const lockedCategorySnapshot = sessionCategorySnapshotRef.current ?? null;
    const lockedNote = sessionNoteRef.current ?? '';
    const lockedGoal = sessionGoalRef.current ?? '';
    const lockedNextNote = sessionNextNoteRef.current ?? '';
    const progressRatio = totalSecondsRef.current > 0
      ? Math.max(0, Math.min(1, computeProgressPct(authoritativeDisplaySeconds) / 100))
      : 0;

    clearInterval(intervalRef.current);
    startTimeRef.current = null;
    timerEndReasonRef.current = TIMER_END_REASONS.CANCELLED;
    setLastCompletedSessionId(null);
    clearTimeout(pendingBreakTimeoutRef.current);
    clearFocusCompletePush('cancelled');
    setTimerState(TIMER_STATES.CANCELLED);

    cancelFocusSession(progressRatio, {
      applyDisaster: strictMode,
      recordSession: true,
      mode: modeRef.current,
      elapsedSeconds,
      elapsedMinutes,
      targetMinutes: Math.max(0, Math.round(totalSecondsRef.current / 60)),
      sessionTiming,
      sessionSnapshot: {
        categorySnapshot: lockedCategorySnapshot,
        goal: lockedGoal,
        nextNote: lockedNextNote,
      },
      categoryId: lockedCategoryId,
      categorySnapshot: lockedCategorySnapshot,
      note: lockedNote,
      goal: lockedGoal,
      nextNote: lockedNextNote,
    });
    resetSessionTimeline();
    clearTimerSession();
  }, [
    buildCompletedSessionTiming,
    cancelFocusSession,
    clearFocusCompletePush,
    clearTimerSession,
    computeProgressPct,
    getAuthoritativeDisplaySeconds,
    resetSessionTimeline,
    strictMode,
    timerState,
  ]);

  const pause = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING) return;

    clearInterval(intervalRef.current);
    pausedAtRef.current = Date.now();
    persistCurrentTimerSession({ pausedAt: pausedAtRef.current });
    clearFocusCompletePush('paused');
    setTimerState(TIMER_STATES.PAUSED);
  }, [clearFocusCompletePush, persistCurrentTimerSession, timerState]);

  const resume = useCallback(() => {
    if (timerState !== TIMER_STATES.PAUSED) return;

    const resumedAt = Date.now();
    const pauseStartedAt = pausedAtRef.current ?? resumedAt;
    const pausedDuration = resumedAt - pauseStartedAt;
    let nextConfirmUntilSeconds = continuedPomodoroConfirmUntilSecondsRef.current;

    if (continuedPomodoroConfirmationPendingRef.current && modeRef.current === TIMER_MODES.STOPWATCH) {
      nextConfirmUntilSeconds = getNextContinuedPomodoroConfirmUntilSeconds(
        continuedPomodoroConfirmUntilSecondsRef.current,
        totalSecondsRef.current,
      );
      continuedPomodoroConfirmUntilSecondsRef.current = nextConfirmUntilSeconds;
    }

    startTimeRef.current = (startTimeRef.current ?? resumedAt) + pausedDuration;
    pausedTotalMsRef.current += pausedDuration;
    pauseSegmentsRef.current = [
      ...pauseSegmentsRef.current,
      {
        startedAt: pauseStartedAt,
        endedAt: resumedAt,
        durationMs: pausedDuration,
      },
    ];
    pausedAtRef.current = null;
    setContinuedPomodoroConfirmationPendingState(false);

    persistCurrentTimerSession({
      pausedAt: null,
      pausedTotalMs: pausedTotalMsRef.current,
      pauseSegments: pauseSegmentsRef.current,
      countdownStartedAt: startTimeRef.current,
      continueAfterPomodoro: sessionContinueAfterPomodoroRef.current,
      continuedPomodoroConfirmedUntilSeconds: nextConfirmUntilSeconds,
    });

    syncFocusCompletePush(
      (startTimeRef.current ?? resumedAt) + (totalSecondsRef.current * 1000),
      totalSecondsRef.current / 60,
    );
    setTimerState(TIMER_STATES.RUNNING);
    runInterval();
  }, [
    persistCurrentTimerSession,
    runInterval,
    setContinuedPomodoroConfirmationPendingState,
    syncFocusCompletePush,
    timerState,
  ]);

  const extendCurrentSession = useCallback((extraSeconds = 60) => {
    if (modeRef.current !== TIMER_MODES.POMODORO) return false;
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return false;

    const safeExtraSeconds = Math.max(1, Math.floor(extraSeconds));
    totalSecondsRef.current += safeExtraSeconds;
    secondsRef.current += safeExtraSeconds;
    extensionReadyArmedRef.current = secondsRef.current > EXTENSION_READY_SECONDS;
    setDisplaySeconds(secondsRef.current);
    persistCurrentTimerSession({ totalSeconds: totalSecondsRef.current });
    if (timerState === TIMER_STATES.RUNNING) {
      updateTimerLive({
        isRunning: true,
        mode: modeRef.current,
        startedAt: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
        totalSeconds: totalSecondsRef.current,
        pausedSecondsRemaining: null,
      });
      syncFocusCompletePush(
        (startTimeRef.current ?? Date.now()) + (totalSecondsRef.current * 1000),
        totalSecondsRef.current / 60,
      );
    } else {
      updateTimerLive({
        isRunning: false,
        mode: modeRef.current,
        startedAt: null,
        totalSeconds: totalSecondsRef.current,
        pausedSecondsRemaining: secondsRef.current,
      });
      clearFocusCompletePush('paused');
    }
    void pushNow();
    return true;
  }, [clearFocusCompletePush, persistCurrentTimerSession, syncFocusCompletePush, timerState]);

  const reset = useCallback(() => {
    clearInterval(intervalRef.current);
    clearTimeout(pendingBreakTimeoutRef.current);

    const initialSeconds = getInitialDisplaySeconds(mode, focusMinutes);
    totalSecondsRef.current = focusMinutes * 60;
    secondsRef.current = initialSeconds;
    startTimeRef.current = null;
    resetSessionTimeline();
    milestoneRef.current = new Set();
    extensionReadyArmedRef.current = mode === TIMER_MODES.POMODORO
      && initialSeconds > EXTENSION_READY_SECONDS;
    setLastCompletedSessionId(null);
    setDisplaySeconds(initialSeconds);
    setActiveMode(mode);
    setTimerState(TIMER_STATES.IDLE);
    setMilestone(null);
    clearTimerSession();
    if (timerState !== TIMER_STATES.FINISHED) {
      clearFocusCompletePush('reset');
    }
  }, [clearFocusCompletePush, clearTimerSession, focusMinutes, mode, resetSessionTimeline, timerState]);

  const currentTotalSeconds = totalSecondsRef.current;
  const progressPct = computeProgressPct(displaySeconds);
  const elapsedSeconds = activeMode === TIMER_MODES.STOPWATCH
    ? displaySeconds
    : Math.max(0, currentTotalSeconds - displaySeconds);

  return {
    activeMode,
    displaySeconds,
    visibleDisplaySeconds,
    elapsedSeconds,
    totalSeconds: currentTotalSeconds,
    timerState,
    progressPct,
    milestone,
    isContinuingAfterPomodoro,
    continuedPomodoroConfirmationPending,
    start,
    pause,
    resume,
    cancel,
    reset,
    finish,
    extendCurrentSession,
    lastCompletedSessionId,
    sessionStartedAt,
  };
}

export function formatTime(seconds) {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
  const minutes = Math.floor(safeSeconds / 60).toString().padStart(2, '0');
  const remainder = (safeSeconds % 60).toString().padStart(2, '0');

  return `${minutes}:${remainder}`;
}
