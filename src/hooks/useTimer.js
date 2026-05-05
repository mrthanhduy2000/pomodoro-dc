import { useState, useEffect, useRef, useCallback } from 'react';
import useGameStore from '../store/gameStore';
import useSettingsStore from '../store/settingsStore';
import soundEngine from '../engine/soundEngine';
import { getBreakPlan } from '../engine/breaks';
import { BREAK_EXTENSION_MINUTES } from '../engine/constants';
import { updateTimerLive, clearTimerLive } from '../lib/timerLiveService';
import { pushNow } from '../lib/syncService';
import { cancelFocusCompletePush, scheduleFocusCompletePush, FOCUS_COMPLETE_PUSH_JOB_KEY } from '../lib/pushService';

export const TIMER_STATES = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  PAUSED: 'PAUSED',
  FINISHED: 'FINISHED',
  CANCELLED: 'CANCELLED',
};

export const TIMER_MODES = {
  POMODORO: 'pomodoro',
  STOPWATCH: 'stopwatch',
};

const MILESTONE_PCTS = [25, 50, 75];
const EXTENSION_READY_SECONDS = 5 * 60;

function getInitialDisplaySeconds(mode, focusMinutes) {
  return mode === TIMER_MODES.STOPWATCH ? 0 : focusMinutes * 60;
}

export function useTimer({ focusMinutes, mode = TIMER_MODES.POMODORO }) {
  const totalSeconds = focusMinutes * 60;

  const completeFocusSession = useGameStore((s) => s.completeFocusSession);
  const cancelFocusSession = useGameStore((s) => s.cancelFocusSession);
  const stakingActive = useGameStore((s) => s.staking.active);
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
  const shortBreakDuration = useSettingsStore((s) => s.shortBreakDuration);
  const longBreakDuration = useSettingsStore((s) => s.longBreakDuration);
  const longBreakAfterN = useSettingsStore((s) => s.longBreakAfterN);

  const [displaySeconds, setDisplaySeconds] = useState(() => getInitialDisplaySeconds(mode, focusMinutes));
  const [timerState, setTimerState] = useState(TIMER_STATES.IDLE);
  const [milestone, setMilestone] = useState(null);
  const [lastCompletedSessionId, setLastCompletedSessionId] = useState(null);
  const [sessionStartedAt, setSessionStartedAt] = useState(null);

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
  }, []);

  const syncFocusCompletePush = useCallback((
    endsAtMs,
    scheduledMinutes = totalSecondsRef.current / 60,
    currentMode = modeRef.current,
  ) => {
    if (currentMode !== TIMER_MODES.POMODORO) return;

    void scheduleFocusCompletePush({
      endsAtMs,
      focusMinutes: Math.max(1, Math.round(scheduledMinutes)),
    });
  }, []);

  const clearFocusCompletePush = useCallback((reason = 'cancelled') => {
    void cancelFocusCompletePush(reason);
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
    const totalSecondsValue = overrides.totalSeconds ?? totalSecondsRef.current;

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
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      document.title = `${formatTime(displaySeconds)} ⏱ DC Pomodoro`;
    } else if (timerState === TIMER_STATES.PAUSED) {
      document.title = `${formatTime(displaySeconds)} ⏸ DC Pomodoro`;
    } else {
      document.title = 'DC Pomodoro';
    }

    return () => {
      document.title = 'DC Pomodoro';
    };
  }, [displaySeconds, timerState]);

  useEffect(() => {
    if (timerState !== TIMER_STATES.IDLE) return;

    const nextSeconds = getInitialDisplaySeconds(mode, focusMinutes);
    totalSecondsRef.current = totalSeconds;
    secondsRef.current = nextSeconds;
    setDisplaySeconds(nextSeconds);
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

  const tickClock = useCallback(() => {
    const elapsedSeconds = getElapsedSeconds(startTimeRef.current);
    const nextDisplaySeconds = computeDisplayFromElapsed(elapsedSeconds);

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

    if (modeRef.current === TIMER_MODES.POMODORO && nextDisplaySeconds === 30) {
      void fetch('/api/push/notify-now', { method: 'GET' }).catch(() => {});
    }

    if (modeRef.current === TIMER_MODES.POMODORO && nextDisplaySeconds <= 0) {
      handleFinishRef.current?.();
    }
  }, [computeDisplayFromElapsed, computeProgressPct, getElapsedSeconds]);

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

    startTimeRef.current = null;
    pausedAtRef.current = null;
    clearInterval(intervalRef.current);
    soundEngine.playTimerFinish();

    const elapsedMs = Math.max(0, finishedAtMs - capturedClockStart);
    const elapsedMinutes = Math.max(1, Math.round(elapsedMs / 60_000));
    const sessionTargetMinutes = Math.max(1, Math.round(totalSecondsRef.current / 60));
    const creditedMinutes = modeRef.current === TIMER_MODES.STOPWATCH
      ? elapsedMinutes
      : Math.min(sessionTargetMinutes, elapsedMinutes);

    const breakPlan = getBreakPlan({
      mode: modeRef.current,
      workedMinutes: modeRef.current === TIMER_MODES.STOPWATCH
        ? (elapsedMs / 60_000)
        : creditedMinutes,
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
      window.electronAPI.updateTray({ state: timerState, timeLeft: formatTime(displaySeconds) });
      return;
    }

    window.electronAPI.updateTray({ state: timerState, timeLeft: '' });
  }, [displaySeconds, timerState]);

  useEffect(() => {
    timerStateRef.current = timerState;
  }, [timerState]);

  useEffect(() => {
    if (timerState === TIMER_STATES.RUNNING) {
      updateTimerLive({
        isRunning: true,
        startedAt: startTimeRef.current ? new Date(startTimeRef.current).toISOString() : null,
        totalSeconds: totalSecondsRef.current,
        pausedSecondsRemaining: null,
      });
      void pushNow();
    } else if (timerState === TIMER_STATES.PAUSED) {
      updateTimerLive({
        isRunning: false,
        startedAt: null,
        totalSeconds: 0,
        pausedSecondsRemaining: secondsRef.current,
      });
      void pushNow();
    } else {
      clearTimerLive();
      void pushNow();
    }
  }, [timerState]);

  // Phản ứng với pause/resume từ thiết bị khác qua cloud sync
  useEffect(() => {
    if (!timerSession.isRunning) return;
    // Thiết bị khác pause: pausedAt xuất hiện nhưng mình vẫn đang RUNNING
    if (timerSession.pausedAt && timerStateRef.current === TIMER_STATES.RUNNING) {
      clearInterval(intervalRef.current);
      pausedAtRef.current = timerSession.pausedAt;
      setTimerState(TIMER_STATES.PAUSED);
      return;
    }
    // Thiết bị khác resume: pausedAt biến mất nhưng mình vẫn đang PAUSED
    if (!timerSession.pausedAt && timerStateRef.current === TIMER_STATES.PAUSED) {
      startTimeRef.current = timerSession.countdownStartedAt ?? startTimeRef.current;
      pausedAtRef.current = null;
      setTimerState(TIMER_STATES.RUNNING);
      runInterval();
    }
  }, [runInterval, timerSession.pausedAt, timerSession.countdownStartedAt, timerSession.isRunning]);

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
    } = timerSession;

    if (!isRunning || !startedAt || !savedTotalSeconds) return;

    const runtimeMode = savedMode ?? TIMER_MODES.POMODORO;
    const effectiveClockStart = countdownStartedAt ?? startedAt;
    const effectivePauseSegments = Array.isArray(pauseSegments) ? pauseSegments : [];
    const elapsedSeconds = getElapsedSeconds(effectiveClockStart, pausedAt ?? Date.now());
    const restoredDisplaySeconds = runtimeMode === TIMER_MODES.STOPWATCH
      ? elapsedSeconds
      : Math.max(0, savedTotalSeconds - elapsedSeconds);
    const shouldRestorePaused = Boolean(pausedAt);

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
    setPendingNote(note ?? '');
    setPendingSessionGoal(goal ?? '');
    setPendingNextSessionNote(nextNote ?? '');

    totalSecondsRef.current = savedTotalSeconds;
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
      clearFocusCompletePush('stopwatch');
      setTimerState(shouldRestorePaused ? TIMER_STATES.PAUSED : TIMER_STATES.RUNNING);
      if (!shouldRestorePaused) runInterval();
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
  }, []);

  const start = useCallback(() => {
    if (timerState !== TIMER_STATES.IDLE) return;
    if (eraCrisis.active && eraCrisis.choiceMade !== 'challenge') return;

    const now = Date.now();
    prepareFocusSessionStart({ startedAt: now, mode });
    const categorySnapshot = pendingCategoryId
      ? (sessionCategories.find((category) => category.id === pendingCategoryId) ?? null)
      : null;
    const initialSeconds = getInitialDisplaySeconds(mode, focusMinutes);

    totalSecondsRef.current = focusMinutes * 60;
    secondsRef.current = initialSeconds;
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
    syncFocusCompletePush,
    timerState,
  ]);

  const cancel = useCallback(() => {
    if (timerState !== TIMER_STATES.RUNNING && timerState !== TIMER_STATES.PAUSED) return;

    const progressRatio = totalSecondsRef.current > 0
      ? Math.max(0, Math.min(1, computeProgressPct(secondsRef.current) / 100))
      : 0;

    clearInterval(intervalRef.current);
    startTimeRef.current = null;
    resetSessionTimeline();
    setLastCompletedSessionId(null);
    setTimerState(TIMER_STATES.CANCELLED);
    clearTimeout(pendingBreakTimeoutRef.current);
    clearFocusCompletePush('cancelled');

    if (strictMode || stakingActive) {
      cancelFocusSession(progressRatio, { applyDisaster: strictMode });
    }
    clearTimerSession();
  }, [cancelFocusSession, clearFocusCompletePush, clearTimerSession, computeProgressPct, resetSessionTimeline, stakingActive, strictMode, timerState]);

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

    persistCurrentTimerSession({
      pausedAt: null,
      pausedTotalMs: pausedTotalMsRef.current,
      pauseSegments: pauseSegmentsRef.current,
      countdownStartedAt: startTimeRef.current,
    });

    syncFocusCompletePush(
      (startTimeRef.current ?? resumedAt) + (totalSecondsRef.current * 1000),
      totalSecondsRef.current / 60,
    );
    setTimerState(TIMER_STATES.RUNNING);
    runInterval();
  }, [persistCurrentTimerSession, runInterval, syncFocusCompletePush, timerState]);

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
      syncFocusCompletePush(
        (startTimeRef.current ?? Date.now()) + (totalSecondsRef.current * 1000),
        totalSecondsRef.current / 60,
      );
    } else {
      clearFocusCompletePush('paused');
    }
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
    setTimerState(TIMER_STATES.IDLE);
    setMilestone(null);
    clearTimerSession();
    if (timerState !== TIMER_STATES.FINISHED) {
      clearFocusCompletePush('reset');
    }
  }, [clearFocusCompletePush, clearTimerSession, focusMinutes, mode, resetSessionTimeline, timerState]);

  const currentTotalSeconds = totalSecondsRef.current;
  const progressPct = computeProgressPct(displaySeconds);
  const elapsedSeconds = mode === TIMER_MODES.STOPWATCH
    ? displaySeconds
    : Math.max(0, currentTotalSeconds - displaySeconds);

  return {
    displaySeconds,
    elapsedSeconds,
    totalSeconds: currentTotalSeconds,
    timerState,
    progressPct,
    milestone,
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
