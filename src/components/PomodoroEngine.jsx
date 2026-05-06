import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import useGameStore from '../store/gameStore';
import { pushNow } from '../lib/syncService';
import useSettingsStore from '../store/settingsStore';
import { useTimer, formatTime, TIMER_MODES, TIMER_STATES } from '../hooks/useTimer';
import { getComboDecayMs, getMultiplierTier } from '../engine/gameMath';
import { FLOWTIME_BREAK_RULES, QUICK_FOCUS_PRESETS, getBreakPlan } from '../engine/breaks';
import {
  DEFAULT_DEEP_FOCUS_THRESHOLD,
  WARMUP_REDUCED_THRESHOLD,
  BREAK_EXTENSION_MINUTES,
  COMBO_BONUS_PER_STACK,
  COMBO_MAX_STACKS,
  OVERCLOCK_MIN_SESSION_MIN,
  VUNG_DONG_CHAY_MIN_MIN,
  DISASTER_MIN_PENALTY_RATE,
  DISASTER_MAX_PENALTY_RATE,
  Y_CHI_THEP_RETENTION,
  BAT_KHUAT_DISASTER_XP_PENALTY,
  RELIC_EVOLUTION,
  BUILDING_EFFECTS,
  getBuildingLevelMultiplier,
} from '../engine/constants';
import StakePanel from './StakePanel';

const NOTE_WORD_LIMIT = 3000;
const SESSION_GOAL_MIN_CHARS = 10;
const SESSION_EXTENSION_SECONDS = 60;
const SESSION_EXTENSION_WINDOW_SECONDS = 5 * 60;
const RING_RADIUS = 128;
const RING_STROKE = 4;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const SVG_SIZE = (RING_RADIUS + RING_STROKE) * 2 + 4;

const RING_COLORS = {
  [TIMER_STATES.IDLE]: 'var(--ink)',
  [TIMER_STATES.RUNNING]: 'var(--accent)',
  [TIMER_STATES.FINISHED]: 'var(--good)',
  [TIMER_STATES.CANCELLED]: 'var(--accent2)',
};
const Motion = motion;

function countWords(text = '') {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

function trimToWordLimit(text, maxWords) {
  const tokens = text.match(/\S+\s*/g);
  if (!tokens || tokens.length <= maxWords) return text;
  return tokens.slice(0, maxWords).join('').trimEnd();
}

function formatPreviewPercent(value) {
  if (!Number.isFinite(value)) return '0';
  if (value === 0) return '0';
  if (value < 1) return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
  return value.toFixed(1).replace(/\.0$/, '');
}

function clampFocusMinutes(value) {
  return Math.min(180, Math.max(1, value));
}

function parseFocusMinutesInput(value) {
  const digits = String(value ?? '').replace(/\D+/g, '').slice(0, 3);
  if (!digits) return null;

  const parsed = Number.parseInt(digits, 10);
  if (!Number.isFinite(parsed)) return null;
  return clampFocusMinutes(parsed);
}

function isEditableShortcutTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.isContentEditable) return true;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"], [role="textbox"]'));
}

function isSpaceKeyEvent(event) {
  return event.code === 'Space' || event.key === ' ' || event.keyCode === 32;
}

function getCompletedSessionWorkedMinutes(session) {
  if (!session) return null;

  if (Number.isFinite(session.wallClockDurationMs)) {
    const effectiveMs = Math.max(0, session.wallClockDurationMs - (session.pausedTotalMs ?? 0));
    return effectiveMs / 60_000;
  }

  return Number.isFinite(session.minutes) ? session.minutes : null;
}

function useMinWidth(minWidth) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(`(min-width: ${minWidth}px)`).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const media = window.matchMedia(`(min-width: ${minWidth}px)`);
    const update = (event) => setMatches(event.matches);

    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, [minWidth]);

  return matches;
}

export default function PomodoroEngine({
  fullScreenMode = false,
  immersiveMode = false,
  onEnterFullScreen,
  onExitFullScreen,
}) {
  const isDesktopViewport = useMinWidth(1024);
  const timerConfig = useGameStore((s) => s.timerConfig);
  const setTimerConfig = useGameStore((s) => s.setTimerConfig);
  const unlockedSkills = useGameStore((s) => s.player.unlockedSkills);
  const forgiveness = useGameStore((s) => s.forgiveness);
  const eraCrisis = useGameStore((s) => s.eraCrisis);
  const openCrisis = useGameStore((s) => s.openEraCrisisModal);
  const relics = useGameStore((s) => s.relics);
  const relicEvolutions = useGameStore((s) => s.relicEvolutions ?? {});
  const buildings = useGameStore((s) => s.buildings);
  const buildingLevels = useGameStore((s) => s.buildingLevels ?? {});
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const pendingCategoryId = useGameStore((s) => s.pendingCategoryId);
  const setPendingCategory = useGameStore((s) => s.setPendingCategory);
  const pendingNote = useGameStore((s) => s.pendingNote);
  const setPendingNote = useGameStore((s) => s.setPendingNote);
  const pendingSessionGoal = useGameStore((s) => s.pendingSessionGoal);
  const setPendingSessionGoal = useGameStore((s) => s.setPendingSessionGoal);
  const pendingNextSessionNote = useGameStore((s) => s.pendingNextSessionNote);
  const addCategory = useGameStore((s) => s.addCategory);
  const deleteCategory = useGameStore((s) => s.deleteCategory);
  const reviewCompletedSession = useGameStore((s) => s.reviewCompletedSession);
  const combo = useGameStore((s) => s.combo);
  const sessionsCompleted = useGameStore((s) => s.progress.sessionsCompleted);
  const longBreakCycleStart = useGameStore((s) => s.progress.longBreakCycleStart ?? 0);
  const longBreakGraceDeadlineAt = useGameStore((s) => s.progress.longBreakGraceDeadlineAt ?? null);
  const longBreakPreviewSession = useGameStore((s) => Boolean(s.progress.longBreakPreviewSession));
  const resetLongBreakCycle = useGameStore((s) => s.resetLongBreakCycle);
  const syncLongBreakCycle = useGameStore((s) => s.syncLongBreakCycle);
  const startBreak = useGameStore((s) => s.startBreak);
  const endBreak = useGameStore((s) => s.endBreak);
  const handleEndBreak = useCallback(() => { endBreak(); void pushNow(); }, [endBreak]);
  const isOnBreak = useGameStore((s) => s.ui.isOnBreak);
  const breakSecsLeft = useGameStore((s) => s.ui.breakSecondsLeft);
  const breakTotalSeconds = useGameStore((s) => s.ui.breakTotalSeconds);
  const breakIsLong = useGameStore((s) => s.ui.breakIsLong);

  const autoStartNext = useSettingsStore((s) => s.autoStartNext);
  const disableBreak = useSettingsStore((s) => s.disableBreak);
  const autoStartBreak = useSettingsStore((s) => s.autoStartBreak);
  const shortBreakDuration = useSettingsStore((s) => s.shortBreakDuration);
  const longBreakDuration = useSettingsStore((s) => s.longBreakDuration);
  const longBreakAfterN = useSettingsStore((s) => s.longBreakAfterN);
  const setBreakProfile = useSettingsStore((s) => s.setBreakProfile);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const paperCardStyle = lightTheme
    ? {
        background: 'rgba(255, 255, 255, 0.86)',
        border: '1px solid rgba(217, 214, 204, 0.95)',
        boxShadow: '0 14px 34px rgba(31, 30, 29, 0.05)',
      }
    : undefined;
  const paperInsetStyle = lightTheme
    ? {
        background: 'rgba(244, 242, 236, 0.82)',
        border: '1px solid rgba(217, 214, 204, 0.88)',
        boxShadow: 'none',
      }
    : undefined;
  const paperInputStyle = lightTheme
    ? {
        background: 'rgba(250, 249, 246, 0.98)',
        border: '1px solid rgba(217, 214, 204, 0.88)',
        color: '#1f1e1d',
        boxShadow: 'none',
      }
    : undefined;
  const paperGoalInsetStyle = lightTheme
    ? {
        background: 'rgba(255, 248, 243, 0.98)',
        border: '1px solid rgba(201, 100, 66, 0.18)',
        boxShadow: 'none',
      }
    : undefined;
  const timerMode = timerConfig.mode ?? TIMER_MODES.POMODORO;
  const strictMode = timerConfig.strictMode;
  const isStopwatchMode = timerMode === TIMER_MODES.STOPWATCH;

  const {
    displaySeconds,
    elapsedSeconds,
    totalSeconds,
    progressPct,
    timerState,
    milestone,
    start,
    pause,
    resume,
    cancel,
    reset,
    finish,
    extendCurrentSession,
    lastCompletedSessionId,
  } = useTimer({
    focusMinutes: timerConfig.focusMinutes,
    mode: timerMode,
  });

  const completedSessionReview = useGameStore((s) => (
    lastCompletedSessionId
      ? (s.history.find((entry) => entry.id === lastCompletedSessionId) ?? null)
      : null
  ));

  const [showCatManager, setShowCatManager] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [focusMinutesDraft, setFocusMinutesDraft] = useState(() => (
    String(clampFocusMinutes(timerConfig.focusMinutes ?? 25))
  ));
  const [isEditingFocusMinutes, setIsEditingFocusMinutes] = useState(false);
  useEffect(() => {
    if (!milestone) return;
    const activateId = window.setTimeout(() => setActiveMilestone(milestone), 0);
    const timeoutId = window.setTimeout(() => setActiveMilestone(null), 2200);
    return () => {
      window.clearTimeout(activateId);
      window.clearTimeout(timeoutId);
    };
  }, [milestone]);

  useEffect(() => {
    if (!isOnBreak) return;
    document.title = `${formatTime(breakSecsLeft)} · DC Pomodoro`;
    return () => {
      document.title = 'DC Pomodoro';
    };
  }, [breakSecsLeft, isOnBreak]);

  useEffect(() => {
    syncLongBreakCycle();
  }, [syncLongBreakCycle]);

  useEffect(() => {
    if (!Number.isFinite(longBreakGraceDeadlineAt)) return undefined;
    const delay = Math.max(0, longBreakGraceDeadlineAt - Date.now()) + 50;
    const timeoutId = window.setTimeout(() => {
      syncLongBreakCycle(Date.now());
    }, delay);
    return () => window.clearTimeout(timeoutId);
  }, [longBreakGraceDeadlineAt, syncLongBreakCycle]);

  const handleStartSession = useCallback(() => {
    if (eraCrisis.active && eraCrisis.choiceMade !== 'challenge') {
      openCrisis();
      return false;
    }
    if (isOnBreak || timerState !== TIMER_STATES.IDLE) return false;
    if (pendingSessionGoal.trim().length < SESSION_GOAL_MIN_CHARS) return false;
    start();
    return true;
  }, [eraCrisis.active, eraCrisis.choiceMade, isOnBreak, openCrisis, pendingSessionGoal, start, timerState]);

  useEffect(() => {
    if (isOnBreak || timerState !== TIMER_STATES.IDLE) return undefined;

    const handleKeyDown = (event) => {
      if (event.defaultPrevented || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
      if (!isSpaceKeyEvent(event)) return;
      if (isEditableShortcutTarget(event.target)) return;

      event.preventDefault();
      handleStartSession();
    };

    const handleKeyUp = (event) => {
      if (!isSpaceKeyEvent(event)) return;
      if (isEditableShortcutTarget(event.target)) return;
      event.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('keyup', handleKeyUp, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('keyup', handleKeyUp, true);
    };
  }, [handleStartSession, isOnBreak, timerState]);

  const prevIsOnBreakRef = React.useRef(isOnBreak);
  useEffect(() => {
    const justEndedBreak = prevIsOnBreakRef.current && !isOnBreak;
    let autoStartTimeoutId = null;

    if (justEndedBreak && autoStartNext && timerState === TIMER_STATES.IDLE) {
      // Preserve any goal drafted during the break so auto-start can reuse it.
      autoStartTimeoutId = window.setTimeout(() => handleStartSession(), 800);
    }
    prevIsOnBreakRef.current = isOnBreak;

    return () => {
      if (autoStartTimeoutId !== null) {
        window.clearTimeout(autoStartTimeoutId);
      }
    };
  }, [autoStartNext, handleStartSession, isOnBreak, timerState]);

  const comboDecayMs = useMemo(
    () => getComboDecayMs(unlockedSkills, relics, relicEvolutions),
    [unlockedSkills, relics, relicEvolutions],
  );
  const [comboActive, setComboActive] = useState(false);
  useEffect(() => {
    if (!combo.lastSessionTs) {
      const resetId = window.setTimeout(() => setComboActive(false), 0);
      return () => window.clearTimeout(resetId);
    }

    const syncId = window.setTimeout(() => {
      setComboActive((Date.now() - combo.lastSessionTs) < comboDecayMs);
    }, 0);

    const expiresInMs = (combo.lastSessionTs + comboDecayMs) - Date.now();
    if (expiresInMs <= 0) {
      return () => window.clearTimeout(syncId);
    }

    const timeoutId = window.setTimeout(() => setComboActive(false), expiresInMs + 100);
    return () => {
      window.clearTimeout(syncId);
      window.clearTimeout(timeoutId);
    };
  }, [combo.lastSessionTs, combo.count, comboDecayMs]);

  // V2: khoi_dong_nhanh / lam_nong_nhanh đã loại bỏ — không còn warmup, dùng default 26' threshold
  const warmupUnlocked = false;
  const deepFocusThreshold = DEFAULT_DEEP_FOCUS_THRESHOLD;
  const currentSessionTargetMinutes = Math.max(1, Math.round(totalSeconds / 60));
  const rewardReferenceMinutes = isStopwatchMode
    ? Math.max(timerConfig.focusMinutes, Math.max(1, Math.floor(elapsedSeconds / 60)))
    : ((timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED || timerState === TIMER_STATES.FINISHED)
      ? currentSessionTargetMinutes
      : timerConfig.focusMinutes);

  const rawTier = getMultiplierTier(rewardReferenceMinutes, warmupUnlocked);
  const tier = useMemo(() => {
    if (!unlockedSkills.vung_dong_chay || rewardReferenceMinutes < VUNG_DONG_CHAY_MIN_MIN) {
      return rawTier;
    }

    // Mirror gameMath: Vùng Dòng Chảy promotes the preview by one tier.
    if (rawTier.multiplier < 1.3) {
      return {
        ...rawTier,
        multiplier: 1.3,
        tierLabel: 'Tập Trung Sâu ×1.3',
      };
    }

    if (rawTier.multiplier < 2.0) {
      return {
        ...rawTier,
        multiplier: 2.0,
        chestGuaranteed: true,
        tierLabel: 'Phiên Chuyên Sâu ×2.0',
      };
    }

    return rawTier;
  }, [rawTier, rewardReferenceMinutes, unlockedSkills.vung_dong_chay]);

  const isIdle = timerState === TIMER_STATES.IDLE;
  const isActive = timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED;
  const isBreakMode = isOnBreak;
  const isCrisisBlockingStart = eraCrisis.active && eraCrisis.choiceMade !== 'challenge';
  const canExtendActivePomodoro = !isBreakMode
    && !isStopwatchMode
    && (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED)
    && displaySeconds > 0
    && displaySeconds <= SESSION_EXTENSION_WINDOW_SECONDS;
  const noteWordCount = countWords(pendingNote);
  const sessionGoalText = pendingSessionGoal.trim();
  const sessionGoalCharCount = sessionGoalText.length;
  const isSessionGoalValid = sessionGoalCharCount >= SESSION_GOAL_MIN_CHARS;
  const sessionGoalRemainingChars = Math.max(SESSION_GOAL_MIN_CHARS - sessionGoalCharCount, 0);
  const sessionGoalProgressPct = Math.min((sessionGoalCharCount / SESSION_GOAL_MIN_CHARS) * 100, 100);
  const sessionPrepStatusLabel = sessionGoalCharCount === 0
    ? 'Thiếu mục tiêu'
    : isSessionGoalValid
      ? 'Sẵn sàng bắt đầu'
      : `Thiếu ${sessionGoalRemainingChars} ký tự`;
  const showSessionReview = Boolean(lastCompletedSessionId && completedSessionReview && !isActive);
  const completedGoalAchieved = completedSessionReview?.goalAchieved ?? null;
  const reviewGoalText = completedSessionReview?.goal?.trim() || sessionGoalText;
  const comboCount = comboActive ? combo.count : 0;
  const comboStacks = Math.max(0, Math.min(comboCount - 1, COMBO_MAX_STACKS));
  const comboBonusPercent = Math.round(comboStacks * COMBO_BONUS_PER_STACK * 100);
  const completedSessionWorkedMinutes = getCompletedSessionWorkedMinutes(completedSessionReview);
  const immersiveRootMaxWidth = immersiveMode
    ? isIdle && !isBreakMode
      ? 900
      : 1240
    : 560;
  const isDesktopFullScreen = fullScreenMode && isDesktopViewport;
  const isDesktopFocusStage = immersiveMode && isDesktopViewport && !fullScreenMode;
  const immersiveTimerScale = immersiveMode
    ? fullScreenMode
      ? isBreakMode
        ? 1.3
        : isActive
          ? 1.56
          : timerState === TIMER_STATES.FINISHED
            ? 1.42
            : 1.46
      : isBreakMode
        ? 1.24
        : isActive
          ? 1.34
          : timerState === TIMER_STATES.FINISHED
            ? 1.22
            : 1.16
    : 1;
  const fullScreenDesktopBoost = isDesktopFullScreen
    ? isBreakMode
      ? 1.4
      : isActive
        ? 1.5
        : timerState === TIMER_STATES.FINISHED
          ? 1.42
          : 1.38
    : isDesktopFocusStage
      ? isBreakMode
        ? 1.12
        : 1.18
      : 1;
  const timerCircleBoost = isDesktopFullScreen
    ? isBreakMode
      ? 1.2
      : 1.28
    : isDesktopFocusStage
      ? isBreakMode
        ? 1.14
        : 1.22
      : 1;
  const shouldDockFullScreenActions = isDesktopFullScreen && !showSessionReview;
  const fullScreenTimerScaleDown = shouldDockFullScreenActions ? 0.86 : 1;
  const fullScreenTimerCanvasDown = shouldDockFullScreenActions ? 0.92 : 1;
  const timerVisualScale = immersiveMode
    ? immersiveTimerScale * fullScreenDesktopBoost * fullScreenTimerScaleDown
    : 1;
  const timerCanvasSize = Math.ceil(SVG_SIZE * timerCircleBoost * fullScreenTimerCanvasDown);
  const timerFootprintScale = immersiveMode
    ? timerVisualScale * timerCircleBoost * fullScreenTimerCanvasDown
    : 1;
  const timerFootprintSize = Math.ceil(SVG_SIZE * timerFootprintScale);
  const timerFootprintHeight = timerFootprintSize + (immersiveMode
    ? shouldDockFullScreenActions
      ? 40
      : isDesktopFullScreen
        ? 176
        : isDesktopFocusStage
          ? 92
          : 40
    : 0);
  const fullScreenDesktopStageLift = shouldDockFullScreenActions
    ? 0
    : isDesktopFullScreen
      ? -44
      : 0;
  const prioritizeSetupCard = !fullScreenMode && immersiveMode && isIdle && !isBreakMode;
  const useImmersiveHeroLayout = fullScreenMode || (immersiveMode && !prioritizeSetupCard);
  const useMinimalFocusStage = fullScreenMode;
  const showComboBadge = !useMinimalFocusStage && !isBreakMode && comboCount >= 2;
  const showMultiplierBadge = !useMinimalFocusStage && !isBreakMode;
  const timerValueLayoutClass = useImmersiveHeroLayout
    ? fullScreenMode
      ? isDesktopFullScreen
        ? 'block w-[82%] text-center text-[4.8rem] leading-[0.81] tracking-[-0.065em] md:text-[5.6rem] xl:text-[6.4rem] 2xl:text-[7.05rem]'
        : 'block w-[84%] text-center text-[4.55rem] leading-[0.8] tracking-[-0.068em] sm:text-[4.9rem] md:text-[5.2rem] xl:text-[5.55rem]'
      : 'block max-w-[82%] text-center text-[3.95rem] leading-[0.86] tracking-[-0.06em] md:text-[4.65rem] xl:text-[5.2rem]'
    : 'text-6xl tracking-widest';
  const timerValueFontClass = lightTheme ? 'serif font-medium' : 'font-mono font-bold';
  const timerValueToneClass = isBreakMode
    ? breakIsLong
      ? 'text-blue-300'
      : 'text-sky-300'
    : !lightTheme && timerState === TIMER_STATES.RUNNING && !isStopwatchMode && displaySeconds <= 10
      ? 'text-red-400'
      : lightTheme
        ? 'text-[var(--ink)]'
        : 'text-white';
  const immersiveGlow = isBreakMode
    ? breakIsLong
      ? (lightTheme
        ? 'radial-gradient(circle, rgba(201,100,66,0.08) 0%, rgba(201,100,66,0.03) 38%, rgba(201,100,66,0) 72%)'
        : 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, rgba(96,165,250,0.06) 36%, rgba(96,165,250,0) 70%)')
      : (lightTheme
        ? 'radial-gradient(circle, rgba(201,100,66,0.07) 0%, rgba(201,100,66,0.025) 38%, rgba(201,100,66,0) 72%)'
        : 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.05) 36%, rgba(56,189,248,0) 70%)')
    : isActive
      ? (lightTheme
        ? 'radial-gradient(circle, rgba(201,100,66,0.10) 0%, rgba(201,100,66,0.035) 38%, rgba(201,100,66,0) 72%)'
        : 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, rgba(34,197,94,0.06) 36%, rgba(34,197,94,0) 70%)')
      : (lightTheme
        ? 'radial-gradient(circle, rgba(31,30,29,0.045) 0%, rgba(31,30,29,0.015) 42%, rgba(31,30,29,0) 72%)'
        : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(99,102,241,0.03) 36%, rgba(99,102,241,0) 70%)');
  const manualBreakWorkedMinutes = isStopwatchMode
    ? (completedSessionWorkedMinutes ?? (elapsedSeconds / 60))
    : (completedSessionReview?.minutes ?? currentSessionTargetMinutes);

  const manualBreakPlan = getBreakPlan({
    mode: timerMode,
    workedMinutes: manualBreakWorkedMinutes,
    sessionsCompleted,
    longBreakCycleStart,
    shortBreakDuration,
    longBreakDuration,
    longBreakAfterN,
    extraBreakMinutes: unlockedSkills.hit_tho_sau ? BREAK_EXTENSION_MINUTES : 0,
  });

  const disasterReductionPreview = useMemo(() => (
    relics.reduce((acc, relic) => {
      const stage = relicEvolutions[relic.id] ?? 0;
      const evoDef = RELIC_EVOLUTION[relic.id];
      const buff = evoDef?.stages[stage]?.buff ?? relic.buff ?? {};
      return acc + (buff.disasterReduction ?? 0);
    }, 0)
  ), [relicEvolutions, relics]);

  const cancelPenaltyWonderMultiplier = useMemo(
    () => buildings.reduce((multiplier, bpId) => {
      const wonderEffect = BUILDING_EFFECTS[bpId]?.wonderEffect;
      if (wonderEffect === 'building_hp_boost') return multiplier * 0.85;
      if (wonderEffect === 'disaster_hp_50off') return multiplier * 0.5;
      return multiplier;
    }, 1),
    [buildings],
  );

  const cancelPenaltyStabilityMultiplier = useMemo(() => {
    const totalReduction = buildings.reduce((sum, bpId) => {
      const effect = BUILDING_EFFECTS[bpId];
      if (effect?.type !== 'defense') return sum;
      return sum + (effect.cancelLossReductionPct ?? 0) * getBuildingLevelMultiplier(buildingLevels[bpId] ?? 1);
    }, 0);
    return 1 - Math.min(totalReduction, 0.6);
  }, [buildingLevels, buildings]);

  const cancelPenaltyPreview = useMemo(() => {
    const progressRatio = Math.max(0, Math.min(1, progressPct / 100));

    if (unlockedSkills.su_tha_thu && forgiveness.chargesRemaining > 0) {
      return {
        waived: true,
        progressPct: progressRatio * 100,
        minPct: 0,
        maxPct: 0,
      };
    }

    // V2: bat_khuat / y_chi_thep đã loại bỏ → không còn skill giảm penalty.
    // Sự Tha Thứ vẫn còn, đã handle trên (waived branch).
    const skillPenaltyMultiplier = 1;

    const adjustedMin = Math.max(DISASTER_MIN_PENALTY_RATE, DISASTER_MIN_PENALTY_RATE - disasterReductionPreview);
    const adjustedMax = Math.max(DISASTER_MIN_PENALTY_RATE, DISASTER_MAX_PENALTY_RATE - disasterReductionPreview);

    return {
      waived: false,
      progressPct: progressRatio * 100,
      minPct: adjustedMin * skillPenaltyMultiplier * progressRatio * 100 * cancelPenaltyWonderMultiplier * cancelPenaltyStabilityMultiplier,
      maxPct: adjustedMax * skillPenaltyMultiplier * progressRatio * 100 * cancelPenaltyWonderMultiplier * cancelPenaltyStabilityMultiplier,
    };
  }, [
    cancelPenaltyStabilityMultiplier,
    cancelPenaltyWonderMultiplier,
    disasterReductionPreview,
    forgiveness.chargesRemaining,
    progressPct,
    unlockedSkills.su_tha_thu,
  ]);

  const handleCancelClick = useCallback(() => {
    if (!strictMode) {
      cancel();
      window.setTimeout(reset, 300);
      return;
    }
    setShowCancelConfirm(true);
  }, [cancel, reset, strictMode]);

  const handleConfirmCancel = useCallback(() => {
    setShowCancelConfirm(false);
    cancel();
    window.setTimeout(reset, 300);
  }, [cancel, reset]);

  const handleSessionReview = useCallback((goalAchieved) => {
    if (!lastCompletedSessionId) return;
    reviewCompletedSession(lastCompletedSessionId, {
      goal: completedSessionReview?.goal ?? pendingSessionGoal,
      nextNote: pendingNextSessionNote,
      goalAchieved,
    });
    setPendingSessionGoal('');
  }, [
    completedSessionReview,
    lastCompletedSessionId,
    pendingNextSessionNote,
    pendingSessionGoal,
    reviewCompletedSession,
    setPendingSessionGoal,
  ]);

  const switchMode = useCallback((nextMode) => {
    if (isActive || isBreakMode || nextMode === timerMode) return;
    setTimerConfig({ mode: nextMode });
  }, [isActive, isBreakMode, setTimerConfig, timerMode]);
  const applyQuickPreset = useCallback((preset) => {
    setTimerConfig({
      focusMinutes: preset.focusMinutes,
      breakMinutes: preset.shortBreakDuration,
    });
    setBreakProfile({
      shortBreakDuration: preset.shortBreakDuration,
      longBreakDuration: preset.longBreakDuration,
      longBreakAfterN: preset.longBreakAfterN,
    });
  }, [setBreakProfile, setTimerConfig]);
  const applyFocusMinutes = useCallback((value) => {
    const parsed = parseFocusMinutesInput(value);
    if (parsed === null) return;
    setTimerConfig({ focusMinutes: parsed });
  }, [setTimerConfig]);
  const commitFocusMinutesDraft = useCallback(() => {
    const parsed = parseFocusMinutesInput(focusMinutesDraft);
    const fallbackValue = clampFocusMinutes(timerConfig.focusMinutes ?? 25);

    if (parsed === null) {
      setFocusMinutesDraft(String(fallbackValue));
      return;
    }

    setFocusMinutesDraft(String(parsed));
    if (parsed !== fallbackValue) {
      applyFocusMinutes(parsed);
    }
  }, [applyFocusMinutes, focusMinutesDraft, timerConfig.focusMinutes]);
  const handleFocusMinutesDraftChange = useCallback((event) => {
    setIsEditingFocusMinutes(true);
    setFocusMinutesDraft(event.target.value.replace(/\D+/g, '').slice(0, 3));
  }, []);
  const handleFocusMinutesInputKeyDown = useCallback((event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      commitFocusMinutesDraft();
      event.currentTarget.blur();
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      setFocusMinutesDraft(String(clampFocusMinutes(timerConfig.focusMinutes ?? 25)));
      setIsEditingFocusMinutes(false);
      event.currentTarget.blur();
    }
  }, [commitFocusMinutesDraft, timerConfig.focusMinutes]);
  const focusMinutesDisplayValue = isEditingFocusMinutes
    ? focusMinutesDraft
    : String(clampFocusMinutes(timerConfig.focusMinutes ?? 25));
  const focusMinutesStepBase = useMemo(() => (
    parseFocusMinutesInput(focusMinutesDisplayValue) ?? clampFocusMinutes(timerConfig.focusMinutes ?? 25)
  ), [focusMinutesDisplayValue, timerConfig.focusMinutes]);
  const activePresetId = useMemo(() => (
    QUICK_FOCUS_PRESETS.find((preset) => (
      preset.focusMinutes === timerConfig.focusMinutes
      && preset.shortBreakDuration === shortBreakDuration
      && preset.longBreakDuration === longBreakDuration
      && preset.longBreakAfterN === longBreakAfterN
    ))?.id ?? null
  ), [longBreakAfterN, longBreakDuration, shortBreakDuration, timerConfig.focusMinutes]);
  const breakProgressPct = breakTotalSeconds > 0
    ? ((breakTotalSeconds - breakSecsLeft) / breakTotalSeconds) * 100
    : 0;
  const displayRingSeconds = isBreakMode ? breakSecsLeft : displaySeconds;
  const displayProgressPct = isBreakMode ? breakProgressPct : progressPct;
  const breakRingColor = lightTheme
    ? (breakIsLong ? 'var(--accent2)' : 'var(--accent)')
    : (breakIsLong ? '#60a5fa' : '#38bdf8');
  const strokeDashoffset = RING_CIRCUMFERENCE - (displayProgressPct / 100) * RING_CIRCUMFERENCE;
  const baseRingColor = isBreakMode
    ? breakRingColor
    : (RING_COLORS[timerState] ?? RING_COLORS[TIMER_STATES.IDLE]);
  const ringColor = isBreakMode ? breakRingColor : baseRingColor;
  const shouldPrioritizeSessionReview = immersiveMode && showSessionReview;
  const sessionReviewCard = showSessionReview ? (
    <SessionReviewCard
      completedGoalAchieved={completedGoalAchieved}
      goalText={reviewGoalText}
      onPick={handleSessionReview}
    />
  ) : null;
  const canEnterFullScreen = Boolean(onEnterFullScreen) && !fullScreenMode;
  const cycleIndicator = !isBreakMode && !isStopwatchMode && longBreakAfterN > 1 ? (() => {
    const completedCyclePos = Math.max(0, (sessionsCompleted - longBreakCycleStart) % longBreakAfterN);
    const cyclePos = longBreakPreviewSession
      ? Math.min(longBreakAfterN, completedCyclePos + 1)
      : completedCyclePos;
    return (
      <div className={`flex flex-wrap items-center gap-x-2.5 gap-y-2 ${useImmersiveHeroLayout ? 'px-0' : 'px-1'}`}>
        <span className={`text-[10px] uppercase tracking-wider font-medium whitespace-nowrap ${
          lightTheme ? 'text-[var(--muted)]' : 'text-slate-600'
        }`}>
          Chu kỳ nghỉ
        </span>
        <div className="flex items-center gap-1.5">
          {Array.from({ length: longBreakAfterN }).map((_, index) => (
            <div
              key={index}
              className="rounded-full transition-all duration-300"
              style={{
                width: index < cyclePos ? 8 : 7,
                height: index < cyclePos ? 8 : 7,
                background: index < cyclePos
                  ? 'var(--accent, #6366f1)'
                  : lightTheme ? 'rgba(217, 214, 204, 0.95)' : 'var(--timer-track, #1e293b)',
                boxShadow: index < cyclePos
                  ? lightTheme
                    ? '0 6px 12px rgba(var(--accent-rgb, 99,102,241), 0.18)'
                    : '0 0 6px rgba(var(--accent-rgb, 99,102,241), 0.5)'
                  : 'none',
              }}
            />
          ))}
        </div>
        <span className={`text-[11px] font-medium tabular-nums ${
          lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-400'
        }`}>
          {cyclePos}/{longBreakAfterN}
        </span>
        <button
          type="button"
          onClick={resetLongBreakCycle}
          title="Reset chu kỳ nghỉ dài"
          aria-label="Reset chu kỳ nghỉ dài"
          className={`rounded-full px-2.5 py-1 text-[10px] transition-all focus-visible:outline-none focus-visible:ring-2 ${
            lightTheme
              ? 'border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-2)] hover:text-[var(--ink)] focus-visible:ring-[rgba(201,100,66,0.22)]'
              : 'text-slate-600 hover:text-slate-300 border border-white/[0.06] hover:border-white/[0.14] bg-white/[0.03] hover:bg-white/[0.07] focus-visible:ring-white/30'
          }`}
        >
          đặt lại
        </button>
      </div>
    );
  })() : null;
  const sessionSetupCard = (
    <div className={`w-full overflow-hidden border backdrop-blur-2xl transition-[border-color,box-shadow,background-color,opacity] duration-300 ${
      immersiveMode
        ? 'mt-3 md:mt-4 rounded-[28px] bg-white/[0.045] border-white/[0.10] shadow-[0_14px_38px_rgba(15,23,42,0.12)]'
        : 'mt-3 md:mt-4 rounded-[26px] bg-white/[0.04] border-white/[0.09] shadow-[0_10px_26px_rgba(15,23,42,0.10)]'
    } ${!isIdle || isBreakMode ? 'opacity-25 pointer-events-none' : ''}`} style={paperCardStyle}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        immersiveMode ? 'px-5 py-4 md:px-5' : 'px-4 py-4'
      }`}>
        <div className="min-w-0">
          <p className={`mono text-[10px] font-bold uppercase tracking-[0.22em] whitespace-nowrap ${
            lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'
          }`}>Thiết lập phiên</p>
          <p className={`mt-1 text-sm ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
            Chọn mode, thời lượng và mức kỷ luật trước khi bắt đầu.
          </p>
        </div>
        <ModeSwitch
          disabled={timerState !== TIMER_STATES.IDLE || isBreakMode}
          mode={timerMode}
          onChange={switchMode}
        />
      </div>

      <div className={`grid gap-4 border-t border-white/5 sm:gap-3 ${
        immersiveMode
          ? 'px-5 py-4 md:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] md:px-5'
          : 'px-4 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'
      }`}>
        <div className={`min-w-0 rounded-[22px] px-4 py-4 sm:py-3.5 ${
          lightTheme
            ? 'border border-[var(--line)] bg-[rgba(244,242,236,0.82)]'
            : 'border border-white/[0.07] bg-black/10'
        }`} style={paperInsetStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className={`mono text-[10px] font-bold uppercase tracking-[0.22em] whitespace-nowrap ${
                lightTheme ? 'text-[var(--accent)]' : 'text-emerald-400'
              }`}>
                {isStopwatchMode ? 'Mốc tham chiếu' : 'Tập trung'}
              </p>
              <p className={`mt-1 text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
                {isStopwatchMode ? 'Dùng để neo mốc thưởng khi bấm giờ.' : 'Thời lượng countdown của phiên kế tiếp.'}
              </p>
            </div>
            <div className={`flex items-center justify-between gap-3 self-stretch rounded-[18px] px-2 py-1.5 sm:self-auto sm:justify-start sm:gap-2 sm:rounded-none sm:px-0 sm:py-0 ${
              lightTheme
                ? 'bg-white/70 border border-[rgba(217,214,204,0.8)] sm:bg-transparent sm:border-transparent'
                : 'bg-white/[0.04] border border-white/[0.08] sm:bg-transparent sm:border-transparent'
            }`}>
              <button
                type="button"
                aria-label="Giảm số phút tập trung"
                onClick={() => applyFocusMinutes(focusMinutesStepBase - 1)}
                className={`size-11 rounded-full font-bold flex items-center justify-center transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 sm:size-9 ${
                  lightTheme
                    ? 'text-[var(--muted)] hover:text-[var(--ink)] bg-white border border-[var(--line)] hover:bg-[rgba(244,242,236,0.98)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                    : 'text-slate-400 hover:text-white backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.10] focus-visible:ring-white/30'
                }`}
              >
                −
              </button>
              <div className={`min-w-[4.5rem] rounded-[16px] border px-1.5 py-1 text-center transition-colors ${
                lightTheme
                  ? 'border-transparent focus-within:border-[var(--line)] focus-within:bg-white'
                  : 'border-transparent focus-within:border-white/[0.14] focus-within:bg-white/[0.05]'
              }`}>
                <label htmlFor="focus-minutes-input" className="sr-only">
                  Số phút tập trung cho phiên kế tiếp
                </label>
                <input
                  id="focus-minutes-input"
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  enterKeyHint="done"
                  autoComplete="off"
                  spellCheck={false}
                  value={focusMinutesDisplayValue}
                  onChange={handleFocusMinutesDraftChange}
                  onBlur={() => {
                    commitFocusMinutesDraft();
                    setIsEditingFocusMinutes(false);
                  }}
                  onFocus={(event) => {
                    setIsEditingFocusMinutes(true);
                    setFocusMinutesDraft(String(clampFocusMinutes(timerConfig.focusMinutes ?? 25)));
                    event.currentTarget.select();
                  }}
                  onKeyDown={handleFocusMinutesInputKeyDown}
                  disabled={!isIdle || isBreakMode}
                  aria-label="Nhập trực tiếp số phút tập trung"
                  className={`w-full bg-transparent text-center font-mono font-bold text-[2rem] leading-none tabular-nums outline-none touch-manipulation ${
                    lightTheme ? 'text-[var(--ink)]' : 'text-white'
                  } ${!isIdle || isBreakMode ? 'cursor-not-allowed' : 'cursor-text'}`}
                />
                <div className={`mono mt-1 text-[11px] uppercase tracking-[0.16em] ${
                  lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-500'
                }`}>phút</div>
              </div>
              <button
                type="button"
                aria-label="Tăng số phút tập trung"
                onClick={() => applyFocusMinutes(focusMinutesStepBase + 1)}
                className={`size-11 rounded-full font-bold flex items-center justify-center transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 sm:size-9 ${
                  lightTheme
                    ? 'text-[var(--muted)] hover:text-[var(--ink)] bg-white border border-[var(--line)] hover:bg-[rgba(244,242,236,0.98)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                    : 'text-slate-400 hover:text-white backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.10] focus-visible:ring-white/30'
                }`}
              >
                +
              </button>
            </div>
          </div>

          <QuickPresets
            className="mt-5 sm:mt-4"
            activePresetId={activePresetId}
            disabled={timerState !== TIMER_STATES.IDLE || isBreakMode}
            mode={timerMode}
            onSelect={applyQuickPreset}
          />
        </div>

        <div className={`min-w-0 rounded-[22px] px-4 py-3.5 ${
          lightTheme
            ? 'border border-[var(--line)] bg-[rgba(244,242,236,0.82)]'
            : 'border border-white/[0.07] bg-black/10'
        }`} style={paperInsetStyle}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`mono text-[10px] font-bold uppercase tracking-[0.22em] whitespace-nowrap ${
                lightTheme ? 'text-[var(--muted)]' : 'text-sky-400'
              }`}>Nghỉ giải lao</p>
              {isStopwatchMode ? (
                <>
                  <p className={`mt-1 text-sm leading-relaxed ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
                    Stopwatch dùng công thức Flowtime để tự đổi giờ nghỉ theo thời lượng bạn vừa làm.
                  </p>
                  <div className="mt-3 space-y-2">
                    {FLOWTIME_BREAK_RULES.map((rule) => (
                      <div
                        key={rule.id}
                        className={`flex items-center justify-between rounded-2xl px-3 py-2 ${
                          lightTheme
                            ? 'border border-[var(--line)] bg-white'
                            : 'border border-white/[0.08] bg-white/[0.03]'
                        }`}
                      >
                        <span className={`text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>{rule.label}</span>
                        <span className={`font-mono text-sm font-bold tabular-nums ${
                          lightTheme ? 'text-[var(--ink)]' : 'text-white'
                        }`}>{rule.breakMinutes}'</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <p className={`mt-1 text-2xl font-mono font-bold tabular-nums ${
                    lightTheme ? 'text-[var(--ink)]' : 'text-white'
                  }`}>
                    {shortBreakDuration}' <span className={lightTheme ? 'text-[var(--muted)]' : 'text-slate-600'}>/</span> {longBreakDuration}'
                  </p>
                  <p className={`mt-1 text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
                    Phiên dài xuất hiện sau mỗi {longBreakAfterN} lượt hoàn thành.
                  </p>
                </>
              )}
            </div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] whitespace-nowrap ${
              lightTheme
                ? 'border border-[var(--line)] bg-white text-[var(--muted)]'
                : 'border border-sky-400/18 bg-sky-400/10 text-sky-300'
            }`}>
              Auto
            </span>
          </div>

          <div className={`mt-4 pt-4 ${lightTheme ? 'border-t border-slate-200/80' : 'border-t border-white/5'}`}>
            <StrictModeToggle
              disabled={isActive}
              enabled={strictMode}
              onChange={(value) => setTimerConfig({ strictMode: value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
  const timerStageVisual = (
    <>
      <AnimatePresence>
        {!useMinimalFocusStage && activeMilestone && (
          <motion.div
            key={activeMilestone}
            initial={{ opacity: 0, y: -12, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2 ${
              lightTheme
                ? 'border border-[rgba(91,122,82,0.18)] bg-[rgba(229,236,223,0.94)]'
                : 'bg-white/[0.05] border-white/8'
            }`}
          >
            <span className={`mono text-[10px] uppercase tracking-[0.18em] ${lightTheme ? 'text-[var(--good)]' : 'text-[var(--accent-light)]'}`}>
              Mốc
            </span>
            <span className={`font-bold text-sm ${lightTheme ? 'text-[var(--good)]' : 'text-[var(--ink)]'}`}>
              {activeMilestone}% hoàn thành
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {(showComboBadge || showMultiplierBadge) && (
        <div className="flex w-full justify-center px-2 sm:px-3">
          <div className="flex flex-col items-center gap-2.5 sm:gap-3">
            {showComboBadge && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1.5 text-[11px] font-semibold tracking-[-0.02em] sm:px-4 sm:py-2 sm:text-sm sm:tracking-normal ${
                  lightTheme
                    ? 'border border-[rgba(245,158,11,0.18)] bg-[rgba(255,247,237,0.96)]'
                    : 'bg-white/[0.05] border-white/8'
                }`}
              >
                <div className="inline-flex items-center gap-1 whitespace-nowrap leading-none sm:gap-1.5">
                  <span className={`font-bold ${lightTheme ? 'text-[var(--warn)]' : 'text-[var(--ink)]'}`}>Combo ×{comboCount}</span>
                  <span className={`${lightTheme ? 'text-[var(--muted)]' : 'text-[var(--muted)]'}`}>+{comboBonusPercent}% XP</span>
                </div>
              </motion.div>
            )}

            {showMultiplierBadge && (
              <MultiplierBadge
                className="shrink-0"
                deepFocusThreshold={deepFocusThreshold}
                focusMinutes={timerConfig.focusMinutes}
                isStopwatchMode={isStopwatchMode}
                referenceMinutes={rewardReferenceMinutes}
                tier={tier}
              />
            )}
          </div>
        </div>
      )}

      {!useMinimalFocusStage && isBreakMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
            breakIsLong
              ? lightTheme
                ? 'bg-[rgba(255,247,237,0.96)] border-[rgba(201,100,66,0.18)] text-[var(--accent2)]'
                : 'bg-white/[0.05] border-white/8 text-[var(--ink)]'
              : lightTheme
                ? 'bg-[rgba(255,247,237,0.96)] border-[rgba(201,100,66,0.18)] text-[var(--accent2)]'
                : 'bg-white/[0.05] border-white/8 text-[var(--ink)]'
          }`}
        >
          <span className="text-sm font-bold">
            {breakIsLong ? 'Giải lao dài' : 'Giải lao ngắn'}
          </span>
        </motion.div>
      )}

      <div
        className="relative mt-5 flex w-full items-center justify-center sm:mt-5 md:mt-1"
        style={{ minHeight: timerFootprintHeight }}
      >
        <motion.div
          className="relative flex shrink-0 items-center justify-center"
          animate={{ scale: timerVisualScale, y: immersiveMode ? (isDesktopFullScreen ? 8 : 4) : 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: timerCanvasSize, height: timerCanvasSize }}
        >
          {immersiveMode && (isActive || isBreakMode) && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-10%] rounded-full blur-3xl"
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              style={{ background: immersiveGlow }}
            />
          )}
          <svg
            width={timerCanvasSize}
            height={timerCanvasSize}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="transform -rotate-90"
            aria-hidden="true"
            style={{
              filter: isBreakMode
                ? lightTheme
                  ? 'none'
                  : `drop-shadow(0 0 12px ${ringColor}55)`
                : timerState === TIMER_STATES.RUNNING
                  ? lightTheme
                    ? 'none'
                    : `drop-shadow(0 0 12px ${ringColor}60)`
                  : 'none',
              transition: 'filter 0.4s ease',
            }}
          >
            <circle cx={SVG_SIZE / 2} cy={SVG_SIZE / 2} r={RING_RADIUS - RING_STROKE / 2 - 2} style={{ fill: 'var(--timer-disc, #0c1320)' }} />
            <circle cx={SVG_SIZE / 2} cy={SVG_SIZE / 2} r={RING_RADIUS} fill="none" style={{ stroke: 'var(--timer-track, #1e3a52)' }} strokeWidth={RING_STROKE} />
            {isStopwatchMode && !isBreakMode ? (
              <circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={lightTheme ? 'rgba(201,100,66,0.26)' : 'rgba(129,140,248,0.32)'}
                strokeWidth={RING_STROKE}
                strokeDasharray="3 8"
                strokeLinecap="round"
              />
            ) : (
              <motion.circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                animate={{ strokeDashoffset, stroke: ringColor }}
                transition={{
                  strokeDashoffset: { duration: 0.8, ease: 'easeOut' },
                  stroke: { duration: 0.3 },
                }}
              />
            )}
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`mono text-[10px] uppercase tracking-[0.22em] ${
              lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'
            }`}>
              {isBreakMode && (breakIsLong ? 'Giải lao dài' : 'Giải lao')}
              {!isBreakMode && timerState === TIMER_STATES.IDLE && (isStopwatchMode ? 'Sẵn sàng bấm giờ' : 'Sẵn sàng')}
              {!isBreakMode && timerState === TIMER_STATES.RUNNING && (isStopwatchMode ? 'Đang bấm giờ' : 'Đang tập trung')}
              {!isBreakMode && timerState === TIMER_STATES.PAUSED && 'Đã tạm dừng'}
              {!isBreakMode && timerState === TIMER_STATES.FINISHED && 'Hoàn thành'}
              {!isBreakMode && timerState === TIMER_STATES.CANCELLED && 'Đã hủy'}
            </span>
            <motion.span
              key={`${isBreakMode ? 'break' : timerMode}-${displayRingSeconds}`}
              className={`mt-3 ${timerValueLayoutClass} ${timerValueFontClass} ${timerValueToneClass} tabular-nums transition-all duration-300`}
              animate={!isBreakMode && timerState === TIMER_STATES.RUNNING && !isStopwatchMode && displaySeconds <= 10
                ? { scale: [1, 1.04, 1] }
                : {}}
              transition={{ duration: 1, repeat: !isBreakMode && !isStopwatchMode && displaySeconds <= 10 ? Infinity : 0 }}
            >
              {formatTime(displayRingSeconds)}
            </motion.span>
            {!isBreakMode && isStopwatchMode && (
              <span className={`mt-0.5 text-xs ${lightTheme ? 'text-[var(--accent)]' : 'text-[var(--accent-light)]'}`}>
                Ghi nhận theo phút thực tế
              </span>
            )}
            {!isBreakMode && unlockedSkills.su_tha_thu && (
              <span className={`mt-0.5 text-xs ${lightTheme ? 'text-[var(--good)]' : 'text-[var(--accent-light)]'}`}>
                {forgiveness.chargesRemaining} lần miễn phạt
              </span>
            )}
            {isBreakMode && (
              <span className="text-xs mt-0.5" style={{ color: lightTheme ? 'var(--muted)' : 'var(--muted)' }}>
                Hít thở, thư giãn & quay lại đúng giờ
              </span>
            )}
          </div>
        </motion.div>
      </div>

    </>
  );
  const compactTimerActionRowClassName = 'grid w-full grid-flow-col auto-cols-fr items-stretch gap-1.5 sm:flex sm:w-auto sm:items-center sm:gap-3';
  const compactTimerActionButtonClassName = 'min-w-0 w-full';

  const timerStageActions = (
    <div className={shouldDockFullScreenActions
      ? 'flex w-full items-start justify-center'
      : `mt-4 flex w-full items-start justify-center md:mt-0 ${immersiveMode ? 'min-h-[104px]' : 'min-h-[68px]'}`
    }>
      <div className={`flex w-full max-w-[412px] flex-col items-stretch gap-3 ${
        shouldDockFullScreenActions ? 'sm:w-full sm:max-w-[540px] sm:items-center' : 'sm:w-auto sm:max-w-none sm:items-start'
      }`}>
        <AnimatePresence mode="wait">
          {isBreakMode && (
            <ActionButton
              key="break-skip"
              onClick={handleEndBreak}
              variant="primary"
            >
              ↩ Kết Thúc Giải Lao
            </ActionButton>
          )}

          {!isBreakMode && timerState === TIMER_STATES.IDLE && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="grid w-full grid-cols-[minmax(0,1.72fr)_minmax(112px,0.88fr)] items-stretch gap-2 sm:flex sm:w-auto sm:gap-3"
            >
              <ActionButton
                disabled={!isSessionGoalValid && !isCrisisBlockingStart}
                onClick={handleStartSession}
                variant="primary"
                className="min-w-0 w-full whitespace-nowrap px-2.5 py-3 text-[11px] font-semibold leading-none tracking-[-0.025em] sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold sm:tracking-normal"
                title={isCrisisBlockingStart
                  ? 'Cần xử lý Khủng hoảng Kỷ Nguyên trước khi bắt đầu phiên mới'
                  : isSessionGoalValid
                    ? 'Bắt đầu phiên tập trung'
                    : `Cần nhập mục tiêu ít nhất ${SESSION_GOAL_MIN_CHARS} ký tự`}
              >
                {isCrisisBlockingStart
                  ? 'Xử lý khủng hoảng'
                  : isSessionGoalValid
                    ? 'Bắt đầu phiên'
                    : 'Cần điền mục tiêu phiên'}
              </ActionButton>
              {canEnterFullScreen && (
                <ActionButton
                  onClick={onEnterFullScreen}
                  variant="soft"
                  className="w-full px-2.5 py-3 text-[12px] font-semibold leading-none whitespace-nowrap sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold"
                >
                  Full Screen
                </ActionButton>
              )}
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.RUNNING && (
            <motion.div
              key="running-btns"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={compactTimerActionRowClassName}
            >
              <ActionButton onClick={pause} variant="soft" size="compactMobile" className={compactTimerActionButtonClassName}>
                Tạm dừng
              </ActionButton>
              {canEnterFullScreen && (
                <ActionButton onClick={onEnterFullScreen} variant="soft" size="compactMobile" className={compactTimerActionButtonClassName}>
                  Full Screen
                </ActionButton>
              )}
              {canExtendActivePomodoro && (
                <ActionButton
                  onClick={() => extendCurrentSession(SESSION_EXTENSION_SECONDS)}
                  variant="info"
                  size="compactMobile"
                  className={compactTimerActionButtonClassName}
                >
                  +1 phút
                </ActionButton>
              )}
              {isStopwatchMode && (
                <ActionButton onClick={finish} variant="accent" size="compactMobile" className={compactTimerActionButtonClassName}>
                  Chốt phiên
                </ActionButton>
              )}
              <ActionButton onClick={handleCancelClick} variant="danger" size="compactMobile" className={compactTimerActionButtonClassName}>
                Hủy phiên
              </ActionButton>
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.PAUSED && (
            <motion.div
              key="paused-btns"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={compactTimerActionRowClassName}
            >
              <ActionButton onClick={resume} variant="primary" size="compactMobile" className={compactTimerActionButtonClassName}>
                Tiếp tục
              </ActionButton>
              {canEnterFullScreen && (
                <ActionButton onClick={onEnterFullScreen} variant="soft" size="compactMobile" className={compactTimerActionButtonClassName}>
                  Full Screen
                </ActionButton>
              )}
              {canExtendActivePomodoro && (
                <ActionButton
                  onClick={() => extendCurrentSession(SESSION_EXTENSION_SECONDS)}
                  variant="info"
                  size="compactMobile"
                  className={compactTimerActionButtonClassName}
                >
                  +1 phút
                </ActionButton>
              )}
              {isStopwatchMode && (
                <ActionButton onClick={finish} variant="accent" size="compactMobile" className={compactTimerActionButtonClassName}>
                  Chốt phiên
                </ActionButton>
              )}
              <ActionButton onClick={handleCancelClick} variant="danger" size="compactMobile" className={compactTimerActionButtonClassName}>
                Hủy phiên
              </ActionButton>
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.FINISHED && (
            <motion.div
              key="finished-btns"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex items-center gap-3"
            >
              {!disableBreak && !autoStartBreak && (
                <ActionButton
                  onClick={() => {
                    startBreak({
                      ...manualBreakPlan,
                      sourceSessionId: lastCompletedSessionId ?? null,
                    });
                    reset();
                  }}
                  variant="soft"
                >
                  Bắt đầu nghỉ
                </ActionButton>
              )}
              <ActionButton onClick={reset} variant="accent">
                Làm phiên mới
              </ActionButton>
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.CANCELLED && (
            <ActionButton
              key="reset-cancelled"
              onClick={reset}
              variant="accent"
            >
              Làm phiên mới
            </ActionButton>
          )}
        </AnimatePresence>

        {!useMinimalFocusStage && cycleIndicator}
      </div>
    </div>
  );
  const timerStageContent = (
    <>
      {timerStageVisual}
      {timerStageActions}
    </>
  );
  const showShortcutHint = !useMinimalFocusStage && !isBreakMode && timerState === TIMER_STATES.IDLE;

  const focusSupportContent = (
    <div className={`w-full flex flex-col gap-5 md:gap-6 ${
      useImmersiveHeroLayout
        ? `mx-auto max-w-[760px] lg:max-w-[780px] ${showShortcutHint ? 'pt-0' : 'pt-6 lg:pt-8'}`
        : ''
    }`}>
      <div className={`w-full rounded-[24px] border backdrop-blur-2xl ${
        useImmersiveHeroLayout
          ? 'bg-white/[0.045] border-white/[0.10] px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.10)]'
          : 'bg-white/[0.04] border-white/[0.09] px-3.5 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.08)]'
      }`} style={paperCardStyle}>
        <div className="flex items-center justify-between mb-2 px-0.5">
          <span className={`mono text-xs font-semibold uppercase tracking-wide ${
            lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'
          }`}>
            Ghi chú phiên
          </span>
          {noteWordCount > 0 && (
            <span className={`mono text-[10px] ${lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'}`}>{noteWordCount}/{NOTE_WORD_LIMIT} từ</span>
          )}
        </div>
        <textarea
          value={pendingNote}
          onChange={(e) => setPendingNote(trimToWordLimit(e.target.value, NOTE_WORD_LIMIT))}
          rows={useImmersiveHeroLayout ? 4 : 4}
          placeholder="Bạn đang nghĩ gì, đang kẹt ở đâu, hay cần chốt ý nào trước khi vào nhịp sâu?"
          className={`w-full rounded-xl px-3 py-2.5 text-sm placeholder-slate-600
                     resize-none focus:outline-none transition-all leading-relaxed
                     backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]
                     focus:bg-white/[0.07] focus:border-white/[0.16]
                     shadow-none ${useImmersiveHeroLayout ? 'min-h-[112px]' : 'min-h-[132px]'}`}
          style={{ ...paperInputStyle, scrollbarWidth: 'none' }}
        />
      </div>

      <div className="w-full rounded-[24px] px-3.5 py-3 backdrop-blur-2xl bg-white/[0.045] border border-white/[0.10] shadow-[0_12px_28px_rgba(15,23,42,0.10)]" style={paperCardStyle}>
        <div className="flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            <p className={`mono text-[10px] font-semibold uppercase tracking-[0.24em] ${
              lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'
            }`}>
              Chuẩn bị phiên
            </p>
            <p className={`mt-1 text-[13px] leading-5 ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
              Chốt một đích đến rõ ràng trước khi bấm bắt đầu. Ghi chú cho lần sau chỉ để giữ mạch chuyển tiếp.
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isSessionGoalValid
              ? lightTheme
                ? 'border border-[rgba(91,122,82,0.18)] bg-[rgba(229,236,223,0.92)] text-[var(--good)]'
                : 'border border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05] text-[var(--accent-light)]'
              : lightTheme
                ? 'border border-[rgba(201,100,66,0.14)] bg-[rgba(201,100,66,0.08)] text-[var(--accent2)]'
                : 'border border-white/8 bg-white/[0.05] text-[var(--muted)]'
          }`}>
            {sessionPrepStatusLabel}
          </span>
        </div>

        <Motion.div
          layout
          className={`mt-3 rounded-[22px] border px-3.5 py-3 ${
            lightTheme
              ? ''
              : isSessionGoalValid
                ? 'border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05]'
                : 'border-white/8 bg-white/[0.04]'
          }`}
          style={paperGoalInsetStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  lightTheme
                    ? 'bg-[rgba(201,100,66,0.10)] text-[var(--accent2)]'
                    : 'bg-white/[0.08] text-[var(--accent-light)]'
                }`}>
                  Bắt buộc
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className={`mono text-xs font-semibold uppercase tracking-wide ${
                    lightTheme ? 'text-[var(--accent)]' : 'text-[var(--accent-light)]'
                  }`}>
                    Mục tiêu phiên
                  </span>
                </div>
              </div>
              <p className={`mt-2 text-xs leading-relaxed ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
                Viết kết quả cần chốt trong phiên này, đủ cụ thể để tự đánh giá khi xong.
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className={`mono text-[10px] ${lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-500'}`}>
                {sessionGoalCharCount}/{SESSION_GOAL_MIN_CHARS}
              </p>
              <p className={`mt-1 text-[10px] ${lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'}`}>
                tối thiểu từ
              </p>
            </div>
          </div>

          <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${
            lightTheme ? 'bg-[rgba(201,100,66,0.08)]' : 'bg-white/8'
          }`}>
            <Motion.div
              initial={false}
              animate={{ width: `${sessionGoalCharCount > 0 ? Math.max(sessionGoalProgressPct, 8) : 0}%` }}
              transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full rounded-full ${
                isSessionGoalValid
                  ? lightTheme
                    ? 'bg-[var(--good)]'
                    : 'bg-emerald-300'
                  : lightTheme
                    ? 'bg-[var(--accent)]'
                    : 'bg-amber-300'
              }`}
            />
          </div>

          <div id="session-goal-panel" className="mt-3">
            <textarea
              value={pendingSessionGoal}
              onChange={(e) => setPendingSessionGoal(e.target.value)}
              rows={useImmersiveHeroLayout ? 2 : 2}
              placeholder="Ví dụ: chốt outline, giải xong 3 bài, viết xong phần mở đầu..."
              className="w-full rounded-xl px-3 py-2.5 text-sm placeholder-slate-600
                         resize-none focus:outline-none transition-all leading-relaxed
                         backdrop-blur-xl bg-white/[0.04] border border-white/[0.08]
                         focus:bg-white/[0.07] focus:border-amber-400/30"
              style={{ ...paperInputStyle, scrollbarWidth: 'none' }}
            />
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className={`max-w-[32rem] text-[11px] leading-5 ${
                isSessionGoalValid
                  ? lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'
                  : lightTheme ? 'font-semibold text-[var(--accent2)]' : 'font-semibold text-red-300'
              }`}>
                {sessionGoalCharCount === 0
                  ? `Cần nhập mục tiêu trước khi bắt đầu phiên. Tối thiểu ${SESSION_GOAL_MIN_CHARS} ký tự.`
                  : isSessionGoalValid
                    ? 'Mục tiêu đã đủ rõ để mở phiên mới.'
                    : `Mục tiêu còn thiếu ${sessionGoalRemainingChars} ký tự để có thể bắt đầu.`}
              </p>
              {sessionGoalText && (
                <button
                  type="button"
                  onClick={() => setPendingSessionGoal('')}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                    lightTheme
                      ? 'border border-[rgba(201,100,66,0.14)] text-[var(--accent2)] hover:bg-[rgba(201,100,66,0.08)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                      : 'border border-white/10 text-slate-300 hover:bg-white/6 focus-visible:ring-white/30'
                  }`}
                >
                  Xoá
                </button>
              )}
            </div>
          </div>
        </Motion.div>

        {!immersiveMode && (
          <AnimatePresence initial={false}>
            {sessionReviewCard}
          </AnimatePresence>
        )}
      </div>
    </div>
  );

  const fullScreenNotebook = (
    <section className="mx-auto flex w-full max-w-[780px] flex-col gap-6 px-5 pb-16 pt-10 md:px-8 md:pb-24">
      <div className="border-t" style={{ borderColor: 'var(--line)' }} />

      <div className="pt-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className={`mono text-[10px] font-semibold uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
              Sổ tay phiên
            </p>
            <p className={`mt-2 max-w-[34rem] text-[14px] leading-[1.7] ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
              Ghi nhanh ý đang giữ trong đầu, chỗ đang kẹt, hoặc điều cần khóa lại trước khi vào guồng sâu.
            </p>
          </div>
          {noteWordCount > 0 && (
            <span className={`mono shrink-0 text-[10px] ${lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'}`}>
              {noteWordCount}/{NOTE_WORD_LIMIT} từ
            </span>
          )}
        </div>

        <textarea
          value={pendingNote}
          onChange={(e) => setPendingNote(trimToWordLimit(e.target.value, NOTE_WORD_LIMIT))}
          rows={10}
          placeholder="Viết tự do. Một câu cũng được, một trang cũng được."
          className="mt-5 w-full rounded-[28px] border px-5 py-5 text-[15px] leading-[1.8] resize-none focus:outline-none transition-colors"
          style={{
            ...paperInputStyle,
            borderColor: lightTheme ? 'var(--line)' : 'rgba(255,255,255,0.08)',
            background: lightTheme ? 'rgba(255,255,255,0.76)' : 'rgba(255,255,255,0.03)',
            color: lightTheme ? 'var(--ink)' : 'var(--ink)',
            minHeight: 260,
            scrollbarWidth: 'thin',
          }}
        />
      </div>

      <div className="border-t pt-6" style={{ borderColor: 'var(--line)' }}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={`mono text-[10px] font-semibold uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--accent)]' : 'text-[var(--accent-light)]'}`}>
              Mục tiêu phiên
            </p>
            <p className={`mt-2 max-w-[34rem] text-[14px] leading-[1.7] ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
              Chỉ cần một đích đến đủ cụ thể để bạn biết phiên này có chốt được hay không.
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            isSessionGoalValid
              ? lightTheme
                ? 'border border-[rgba(91,122,82,0.18)] bg-[rgba(229,236,223,0.92)] text-[var(--good)]'
                : 'border border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05] text-[var(--accent-light)]'
              : lightTheme
                ? 'border border-[rgba(201,100,66,0.14)] bg-[rgba(201,100,66,0.08)] text-[var(--accent2)]'
                : 'border border-white/8 bg-white/[0.05] text-[var(--muted)]'
          }`}>
            {sessionPrepStatusLabel}
          </span>
        </div>

        <textarea
          value={pendingSessionGoal}
          onChange={(e) => setPendingSessionGoal(e.target.value)}
          rows={3}
          placeholder="Ví dụ: chốt outline, viết xong phần mở đầu, giải xong 3 bài..."
          className="mt-5 w-full rounded-[24px] border px-4 py-3.5 text-[15px] leading-[1.7] resize-none focus:outline-none transition-colors"
          style={{
            ...paperGoalInsetStyle,
            borderColor: lightTheme ? 'rgba(201,100,66,0.18)' : 'rgba(255,255,255,0.08)',
            background: lightTheme ? 'rgba(255,248,243,0.96)' : 'rgba(255,255,255,0.03)',
            color: lightTheme ? 'var(--ink)' : 'var(--ink)',
            scrollbarWidth: 'thin',
          }}
        />

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <p className={`max-w-[36rem] text-[12px] leading-[1.7] ${
            isSessionGoalValid
              ? lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'
              : lightTheme ? 'font-semibold text-[var(--accent2)]' : 'font-semibold text-red-300'
          }`}>
            {sessionGoalCharCount === 0
              ? `Cần nhập mục tiêu trước khi bắt đầu phiên. Tối thiểu ${SESSION_GOAL_MIN_CHARS} ký tự.`
              : isSessionGoalValid
                ? 'Mục tiêu đã đủ rõ. Bạn có thể quay lên và bắt đầu phiên bất cứ lúc nào.'
                : `Mục tiêu còn thiếu ${sessionGoalRemainingChars} ký tự để có thể bắt đầu.`}
          </p>
          {sessionGoalText && (
            <button
              type="button"
              onClick={() => setPendingSessionGoal('')}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 ${
                lightTheme
                  ? 'border border-[rgba(201,100,66,0.14)] text-[var(--accent2)] hover:bg-[rgba(201,100,66,0.08)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'border border-white/10 text-slate-300 hover:bg-white/6 focus-visible:ring-white/30'
              }`}
            >
              Xoá mục tiêu
            </button>
          )}
        </div>
      </div>
    </section>
  );

  const shortcutHint = showShortcutHint ? (
    <div className="hidden w-full justify-center py-5 md:flex">
      <p className={`mono px-1 text-center text-[10px] uppercase tracking-[0.18em] ${
        lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-500'
      }`}>
        Space bắt đầu · Shift trái + F full screen · Shift trái + G thu/mở cột
      </p>
    </div>
  ) : null;

  if (fullScreenMode) {
    return (
      <Motion.div className="relative mx-auto flex w-full flex-col items-stretch select-none">
        <button
          type="button"
          onClick={onExitFullScreen}
          aria-label="Thoát chế độ pomodoro toàn màn hình"
          className={`fixed right-4 top-4 z-20 rounded-full border px-3 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 md:right-6 md:top-6 ${
            lightTheme
              ? 'border-[var(--line)] bg-[rgba(255,255,255,0.82)] text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[rgba(31,30,29,0.14)]'
              : 'border-white/10 bg-black/30 text-slate-300 hover:text-white focus-visible:ring-white/30'
          }`}
          style={{ top: 'calc(env(safe-area-inset-top) + 16px)' }}
        >
          Thu nhỏ
        </button>

        <section className={shouldDockFullScreenActions
          ? 'relative flex h-[100svh] min-h-[100svh] items-center justify-center overflow-hidden px-5 py-10 md:px-8 lg:px-10'
          : 'flex min-h-[100svh] items-center justify-center px-5 py-10 md:px-8 lg:px-10'}
        >
          {shouldDockFullScreenActions ? (
            <>
              <div
                className="mx-auto flex w-full max-w-[1180px] items-center justify-center"
                style={{ transform: fullScreenDesktopStageLift !== 0 ? `translateY(${fullScreenDesktopStageLift}px)` : undefined }}
              >
                {timerStageVisual}
              </div>

              <div
                className="pointer-events-none absolute inset-x-0 z-10 flex justify-center px-5 md:px-8 lg:px-10"
                style={{ bottom: 'calc(env(safe-area-inset-bottom) + 2px)' }}
              >
                <div
                  className="pointer-events-auto flex w-full max-w-[960px] flex-col items-center gap-4"
                  style={{ transform: 'translateY(18px)' }}
                >
                  {timerStageActions}
                </div>
              </div>
            </>
          ) : (
            <div
              className="mx-auto flex w-full max-w-[960px] flex-col items-center gap-8"
              style={{ transform: fullScreenDesktopStageLift !== 0 ? `translateY(${fullScreenDesktopStageLift}px)` : undefined }}
            >
              {timerStageContent}
              {showSessionReview && (
                <div className="w-full max-w-[520px]">
                  {sessionReviewCard}
                </div>
              )}
            </div>
          )}
        </section>

        {fullScreenNotebook}

        <AnimatePresence>
          {showCancelConfirm && (
            <CancelConfirmDialog
              hasForgivenessCharge={unlockedSkills.su_tha_thu && forgiveness.chargesRemaining > 0}
              onAbort={() => setShowCancelConfirm(false)}
              onConfirm={handleConfirmCancel}
              preview={cancelPenaltyPreview}
            />
          )}
        </AnimatePresence>
      </Motion.div>
    );
  }

  return (
    <Motion.div
      className="relative mx-auto flex w-full max-w-full flex-col items-center overflow-x-hidden select-none"
      animate={{ maxWidth: immersiveRootMaxWidth, gap: useImmersiveHeroLayout ? 46 : immersiveMode ? 38 : 34 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      {eraCrisis.active && (
        <motion.button
          animate={{ borderColor: ['#ef4444', '#f59e0b', '#ef4444'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          onClick={openCrisis}
          className="w-full py-2 rounded-xl border-2 border-red-700 bg-red-950 text-red-300 text-sm font-bold flex items-center justify-center gap-2"
        >
          <span className="animate-pulse">{eraCrisis.icon}</span>
          {eraCrisis.name} — Nhấn để Xem Lựa Chọn
          <span className="animate-pulse">{eraCrisis.icon}</span>
        </motion.button>
      )}

      {useImmersiveHeroLayout ? (
        <>
          {shouldPrioritizeSessionReview && (
            <div className="w-full max-w-[760px] lg:max-w-[780px]">
              <AnimatePresence initial={false}>
                {sessionReviewCard}
              </AnimatePresence>
            </div>
          )}
          <div className={`w-full flex flex-col items-center gap-5 lg:gap-7 ${
            shouldPrioritizeSessionReview
              ? 'justify-start'
              : 'min-h-[76vh] lg:min-h-[84vh] xl:min-h-[88vh] justify-center'
          }`}>
            {timerStageContent}
          </div>
          {shortcutHint}
          {focusSupportContent}
        </>
      ) : (
        <>
          {timerStageContent}
          {shortcutHint}
          {focusSupportContent}
        </>
      )}

      <AnimatePresence>
        {showCancelConfirm && (
          <CancelConfirmDialog
            hasForgivenessCharge={unlockedSkills.su_tha_thu && forgiveness.chargesRemaining > 0}
            onAbort={() => setShowCancelConfirm(false)}
            onConfirm={handleConfirmCancel}
            preview={cancelPenaltyPreview}
          />
        )}
      </AnimatePresence>

      {prioritizeSetupCard && sessionSetupCard}

      <div className={`w-full pt-4 transition-opacity sm:pt-5 ${isActive || isBreakMode ? 'opacity-40 pointer-events-none' : ''}`}>
        <AnimatePresence>
          {showCatManager && (
            <CategoryManager
              categories={sessionCategories ?? []}
              onClose={() => setShowCatManager(false)}
              onAdd={(category) => { addCategory(category); }}
              onDelete={(id) => { deleteCategory(id); }}
            />
          )}
        </AnimatePresence>

        {!showCatManager && (
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="min-w-0">
                <span className={`mono text-[10px] uppercase tracking-wider font-medium whitespace-nowrap ${
                  lightTheme ? 'text-[var(--muted)]' : 'text-slate-600'
                }`}>
                  Loại phiên
                </span>
              </div>
              {timerState === TIMER_STATES.IDLE && (
                <button
                  type="button"
                  onClick={() => setShowCatManager(true)}
                  aria-label="Mở quản lý phân loại"
                  className={`flex-shrink-0 size-7 rounded-full flex items-center justify-center transition-all text-xs focus-visible:outline-none focus-visible:ring-2 ${
                    lightTheme
                      ? 'border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[rgba(201,100,66,0.22)]'
                      : 'text-slate-500 hover:text-slate-200 backdrop-blur-md bg-white/[0.05] hover:bg-white/[0.10] border border-white/[0.08] focus-visible:ring-white/30'
                  }`}
                  title="Quản lý phân loại"
                >
                  ⚙
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <CategoryChip
                active={pendingCategoryId === null}
                disabled={false}
                label="✦ Tất cả"
                onClick={() => setPendingCategory(null)}
              />
              {(sessionCategories ?? []).map((category) => (
              <CategoryChip
                key={category.id}
                active={pendingCategoryId === category.id}
                color={category.color}
                disabled={false}
                label={category.label}
                onClick={() => setPendingCategory(category.id)}
              />
            ))}
            </div>
          </div>
        )}
      </div>

      {!prioritizeSetupCard && sessionSetupCard}

      {isIdle && !isBreakMode && !isStopwatchMode && timerConfig.focusMinutes >= OVERCLOCK_MIN_SESSION_MIN && (
        <StakePanel />
      )}
    </Motion.div>
  );
}

function MultiplierBadge({
  className = '',
  tier,
  focusMinutes,
  deepFocusThreshold,
  isStopwatchMode,
  referenceMinutes,
}) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const isHigh = tier.multiplier >= 2.0;
  const isMid = tier.multiplier >= 1.3;

  return (
    <div
      className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1.5 text-[11px] font-semibold leading-none tracking-[-0.02em] sm:gap-2 sm:px-4 sm:py-2 sm:text-sm sm:tracking-normal ${
        isHigh
          ? lightTheme
            ? 'bg-[rgba(255,247,237,0.98)] border-[rgba(245,158,11,0.22)] text-[var(--warn)]'
            : 'bg-white/[0.05] border-[rgba(var(--accent-rgb),0.18)] text-[var(--accent-light)]'
          : isMid
            ? lightTheme
              ? 'bg-white border-[var(--line)] text-[var(--ink)]'
              : 'bg-white/[0.04] border-white/8 text-[var(--ink)]'
            : lightTheme
              ? 'bg-[rgba(244,242,236,0.96)] border-[var(--line)] text-[var(--muted)]'
              : 'bg-white/[0.04] border-white/[0.08] text-slate-500'
      } ${className}`}
    >
      <span>{tier.tierLabel}</span>
      {tier.chestGuaranteed && <span className="mono text-[10px] uppercase tracking-[0.16em]" title="Rương Lớn đảm bảo">lớn</span>}
      {isStopwatchMode && <span className="text-[10px] opacity-70 sm:text-xs">tham chiếu {referenceMinutes}'</span>}
      {!isStopwatchMode && tier.multiplier < 1.3 && focusMinutes < deepFocusThreshold && (
        <span className="text-[10px] opacity-60 sm:text-xs">còn {deepFocusThreshold - focusMinutes}' để ×1.3</span>
      )}
    </div>
  );
}

function ModeSwitch({ disabled, mode, onChange }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <div className={`inline-flex rounded-full border p-1 ${disabled ? 'opacity-45' : ''} ${
      lightTheme
        ? 'border-[var(--line)] bg-[rgba(244,242,236,0.96)]'
        : 'border-white/10 bg-white/[0.04]'
    }`}>
      {[
        { id: TIMER_MODES.POMODORO, label: 'Pomo' },
        { id: TIMER_MODES.STOPWATCH, label: 'Bấm giờ' },
      ].map((item) => {
        const active = item.id === mode;
        return (
          <button
            key={item.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(item.id)}
            className={`relative rounded-full px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 md:px-4 ${
              active
                ? lightTheme
                  ? 'text-[var(--canvas)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'text-white focus-visible:ring-white/30'
                : lightTheme
                  ? 'text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'text-slate-500 hover:text-slate-200 focus-visible:ring-white/30'
            }`}
          >
            {active && (
              <motion.span
                layoutId="focus-mode-indicator"
                className={`absolute inset-0 rounded-full ${
                  lightTheme
                    ? 'bg-[var(--ink)] shadow-[0_10px_20px_rgba(31,30,29,0.14)]'
                    : 'bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                }`}
                transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              />
            )}
            <span className="relative z-10">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuickPresets({ className = '', activePresetId, disabled, mode, onSelect }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';

  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-2.5 gap-y-3.5 sm:gap-2 ${className}`}>
      {QUICK_FOCUS_PRESETS.map((preset) => {
        const active = activePresetId === preset.id;

        return (
          <button
            key={preset.id}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(preset)}
            className={`min-w-0 overflow-hidden rounded-[20px] border px-3.5 py-4 text-left transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed sm:rounded-[18px] sm:px-3 sm:py-2.5 ${
              active
                ? lightTheme
                  ? 'border-[rgba(31,30,29,0.16)] bg-[rgba(238,234,227,0.99)] text-[var(--ink)] shadow-[0_10px_20px_rgba(31,30,29,0.05)] focus-visible:ring-[rgba(31,30,29,0.12)]'
                  : 'border-[rgba(var(--accent-rgb),0.20)] bg-white/[0.08] text-[var(--ink)] focus-visible:ring-white/30'
                : lightTheme
                  ? 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-2)] hover:bg-[rgba(250,249,246,0.98)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/16 hover:text-slate-100 focus-visible:ring-white/30'
            }`}
          >
            <span className="inline-flex max-w-full items-center gap-2 whitespace-nowrap">
              <span className={`font-mono text-lg font-bold tabular-nums ${
                active
                  ? lightTheme
                    ? 'text-[var(--ink)]'
                    : 'text-white'
                  : lightTheme
                    ? 'text-slate-900'
                    : 'text-slate-100'
              }`}>
                {preset.focusMinutes}'
              </span>
              <span className={`shrink-0 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold tabular-nums ${
                active
                    ? lightTheme
                      ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                      : 'bg-white/[0.08] text-[var(--ink)]'
                    : lightTheme
                      ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                      : 'bg-white/[0.06] text-slate-500'
              }`}>
                ×{preset.longBreakAfterN}
              </span>
            </span>
            <span className="mt-3 flex flex-wrap gap-2 sm:mt-2.5 sm:gap-1.5">
              {mode === TIMER_MODES.STOPWATCH ? (
                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                  active
                    ? lightTheme
                      ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                      : 'bg-white/[0.08] text-[var(--ink)]'
                    : lightTheme
                      ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                      : 'bg-white/[0.06] text-[var(--muted)]'
                }`}>
                  Flowtime
                </span>
              ) : (
                <>
                  <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                    active
                      ? lightTheme
                        ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                        : 'bg-white/[0.08] text-[var(--ink)]'
                      : lightTheme
                        ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                        : 'bg-white/[0.05] text-slate-300'
                  }`}>
                    nghỉ {preset.shortBreakDuration}'
                  </span>
                  <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${
                    active
                      ? lightTheme
                        ? 'bg-[rgba(255,255,255,0.54)] text-[var(--ink)]'
                        : 'bg-white/[0.08] text-[var(--ink)]'
                      : lightTheme
                        ? 'bg-[rgba(244,242,236,0.96)] text-[var(--muted)]'
                        : 'bg-white/[0.05] text-slate-300'
                  }`}>
                    dài {preset.longBreakDuration}'
                  </span>
                </>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function StrictModeToggle({ disabled, enabled, onChange }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';

  return (
    <div className={`flex items-center justify-between gap-4 ${disabled ? 'opacity-45' : ''}`}>
      <div>
        <p className={`text-sm font-semibold ${lightTheme ? 'text-slate-900' : 'text-white'}`}>Kỷ luật phiên</p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Bật nếu bạn muốn giữ luật phạt khi hủy giữa chừng.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Bật hoặc tắt kỷ luật phiên"
        disabled={disabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 ${
          enabled
            ? lightTheme
              ? 'bg-rose-500/85 focus-visible:ring-rose-400/25'
              : 'bg-rose-500/85 focus-visible:ring-white/30'
            : lightTheme
              ? 'bg-slate-300 focus-visible:ring-[rgba(31,30,29,0.14)]'
              : 'bg-slate-700/90 focus-visible:ring-white/30'
        }`}
      >
        <motion.span
          animate={{ x: enabled ? 20 : 0 }}
          transition={{ type: 'spring', stiffness: 380, damping: 28 }}
          className="absolute left-1 top-1 size-5 rounded-full bg-white shadow"
        />
      </button>
    </div>
  );
}

function CategoryChip({ active, color, disabled, label, onClick }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`max-w-full rounded-full border px-3.5 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed truncate focus-visible:outline-none focus-visible:ring-2 ${
        lightTheme ? 'focus-visible:ring-[rgba(31,30,29,0.14)]' : 'focus-visible:ring-white/30'
      }`}
      style={active
        ? {
            borderColor: lightTheme ? 'rgba(217,214,204,0.98)' : (color ? `${color}44` : 'rgba(129,140,248,0.6)'),
            background: lightTheme ? 'rgba(255,255,255,0.98)' : (color ? `${color}20` : 'rgba(99,102,241,0.16)'),
            color: lightTheme ? '#1f1e1d' : (color ?? '#c7d2fe'),
            boxShadow: lightTheme ? '0 8px 14px rgba(31,30,29,0.04)' : 'none',
          }
        : {
            borderColor: lightTheme ? 'rgba(217,214,204,0.95)' : 'rgba(255,255,255,0.08)',
            background: lightTheme ? 'rgba(244,242,236,0.82)' : 'rgba(255,255,255,0.03)',
            color: lightTheme ? '#6a6862' : 'rgb(148 163 184)',
          }}
    >
      {label}
    </button>
  );
}

function SessionReviewCard({ completedGoalAchieved, goalText, onPick }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className={`mx-auto w-full max-w-[520px] rounded-[28px] border p-4 ${
        lightTheme
          ? 'border-[var(--line)] bg-white shadow-[0_22px_56px_rgba(31,30,29,0.08)]'
          : 'border-white/8 bg-white/[0.04] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl'
      }`}
    >
      <p className={`mono text-[11px] uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--muted)]' : 'text-amber-200/90'}`}>Đánh giá phiên vừa xong</p>
      <p className={`mt-2 text-sm leading-relaxed ${lightTheme ? 'text-[var(--ink-2)]' : 'text-slate-300'}`}>
        {goalText
          ? <>Mục tiêu: <span className={`font-semibold ${lightTheme ? 'text-[var(--ink)]' : 'text-slate-50'}`}>{goalText}</span></>
          : 'Phiên này chưa có mục tiêu ghi sẵn. Bạn vẫn có thể tự đánh giá nhanh.'}
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={() => onPick(true)}
          className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            completedGoalAchieved === true
              ? lightTheme
                ? 'border-emerald-200 bg-[rgba(229,236,223,0.96)] text-[var(--good)] shadow-[0_10px_24px_rgba(91,122,82,0.12)]'
                : 'border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.06] text-[var(--ink)]'
              : lightTheme
                ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--muted)] hover:border-emerald-200 hover:text-[var(--good)]'
                : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-emerald-300/25 hover:bg-emerald-400/10 hover:text-emerald-100'
          }`}
        >
          Đạt
        </button>
        <button
          type="button"
          onClick={() => onPick(false)}
          className={`flex-1 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            completedGoalAchieved === false
              ? lightTheme
                ? 'border-[rgba(201,100,66,0.22)] bg-[rgba(255,247,237,0.96)] text-[var(--accent2)] shadow-[0_10px_24px_rgba(201,100,66,0.12)]'
                : 'border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.06] text-[var(--accent-light)]'
              : lightTheme
                ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--muted)] hover:border-[rgba(201,100,66,0.22)] hover:text-[var(--accent2)]'
                : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-rose-300/25 hover:bg-rose-400/10 hover:text-rose-100'
          }`}
        >
          Chưa đạt
        </button>
      </div>
    </motion.div>
  );
}

function CancelConfirmDialog({ hasForgivenessCharge, onAbort, onConfirm, preview }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.98 }}
      className={`rounded-[30px] border p-5 ${
        lightTheme
          ? 'border-[rgba(201,100,66,0.22)] bg-white shadow-[0_24px_64px_rgba(31,30,29,0.10)]'
          : 'border-white/8 bg-white/[0.04] shadow-[0_22px_56px_rgba(0,0,0,0.18)] backdrop-blur-2xl'
      }`}
    >
      <p className={`mono text-[11px] uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--accent2)]' : 'text-rose-300'}`}>Xác nhận hủy phiên</p>
      <p className={`mt-2 text-sm leading-relaxed ${lightTheme ? 'text-[var(--ink-2)]' : 'text-slate-200'}`}>
        {hasForgivenessCharge
          ? 'Bạn còn lượt tha thứ, nên lần hủy này sẽ không mất tài nguyên.'
          : 'Hệ thống sẽ tính phạt theo phần tiến độ bạn đã đi qua. Hủy càng muộn, giá phải trả càng cao.'}
      </p>
      {preview && (
        <p className={`mt-2 text-xs leading-relaxed ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
          {preview.waived
            ? `Tiến độ hiện tại ${formatPreviewPercent(preview.progressPct)}%. Phiên này đang được bảo vệ hoàn toàn.`
            : `Tiến độ hiện tại ${formatPreviewPercent(preview.progressPct)}%. Phạt ước tính ${formatPreviewPercent(preview.minPct)}%–${formatPreviewPercent(preview.maxPct)}% tài nguyên sau khi đã tính kỹ năng và công trình.`}
        </p>
      )}
      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAbort}
          className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            lightTheme
              ? 'border-[var(--line)] bg-[rgba(244,242,236,0.82)] text-[var(--ink)] hover:border-[var(--line-2)]'
              : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-white/18 hover:bg-white/[0.08]'
          }`}
        >
          Quay lại
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
            lightTheme
              ? 'border-[rgba(201,100,66,0.22)] bg-[rgba(255,247,237,0.96)] text-[var(--accent2)] hover:bg-[rgba(255,239,228,0.98)]'
              : 'border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.06] text-[var(--accent-light)] hover:bg-white/[0.08]'
          }`}
        >
          {hasForgivenessCharge ? 'Hủy có bảo vệ' : 'Hủy phiên'}
        </button>
      </div>
    </motion.div>
  );
}

function CategoryManager({ categories, onClose, onAdd, onDelete }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const [newLabel, setNewLabel] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const colors = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#8b5cf6', '#f97316'];
  const defaultIds = ['cat_hoc_dh', 'cat_tu_hoc', 'cat_lam_viec', 'cat_doc_sach', 'cat_luyen_tap', 'cat_khac'];
  const customCategories = categories.filter((category) => !defaultIds.includes(category.id));

  const handleAdd = () => {
    const label = newLabel.trim();
    if (!label) return;

    onAdd({ id: `cat_${Date.now()}`, label, icon: '', color: newColor });
    setNewLabel('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className={`mt-3 rounded-3xl border p-4 ${
        lightTheme
          ? 'border-[var(--line)] bg-white shadow-[0_18px_40px_rgba(31,30,29,0.06)]'
          : 'border-white/8 bg-white/[0.03]'
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-semibold ${lightTheme ? 'text-[var(--ink)]' : 'text-white'}`}>Quản lý phân loại</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng quản lý phân loại"
          className={`text-xl leading-none transition ${
            lightTheme ? 'text-[var(--muted)] hover:text-[var(--ink)]' : 'text-slate-500 hover:text-white'
          }`}
        >
          ✕
        </button>
      </div>

      {customCategories.length > 0 && (
        <div className="mt-3 flex flex-col gap-2">
          {customCategories.map((category) => (
            <div
              key={category.id}
              className={`flex items-center justify-between rounded-2xl border px-3 py-2 ${
                lightTheme ? 'border-[var(--line)] bg-[rgba(244,242,236,0.78)]' : 'border-white/8 bg-white/[0.03]'
              }`}
            >
              <span style={{ color: category.color }}>{category.label}</span>
              <button
                type="button"
                onClick={() => onDelete(category.id)}
                className={`text-xs font-semibold transition ${
                  lightTheme ? 'text-[var(--muted)] hover:text-[var(--accent2)]' : 'text-slate-500 hover:text-rose-300'
                }`}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={`mt-4 rounded-2xl border p-3 ${
        lightTheme ? 'border-[var(--line)] bg-[rgba(244,242,236,0.78)]' : 'border-white/8 bg-white/[0.03]'
      }`}>
        <div className="flex flex-wrap gap-2">
          {colors.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setNewColor(color)}
              aria-label={`Chọn màu ${color}`}
              aria-pressed={newColor === color}
              className={`h-6 w-6 rounded-full ${newColor === color ? lightTheme ? 'ring-2 ring-[var(--ink)] ring-offset-2 ring-offset-[var(--canvas)]' : 'ring-2 ring-white/80 ring-offset-2 ring-offset-black/40' : ''}`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <input
            type="text"
            name="newCategoryLabel"
            value={newLabel}
            onChange={(event) => setNewLabel(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleAdd();
            }}
            aria-label="Tên phân loại mới"
            autoComplete="off"
            placeholder="Tên phân loại mới"
            className={`flex-1 rounded-2xl border px-3 py-2 text-sm focus:outline-none ${
              lightTheme
                ? 'border-[var(--line)] bg-white text-[var(--ink)] placeholder:text-[var(--muted-2)] focus:border-[var(--line-2)]'
                : 'border-white/8 bg-black/20 text-white placeholder:text-slate-600 focus:border-white/16'
            }`}
          />
          <button
            type="button"
            disabled={!newLabel.trim()}
            onClick={handleAdd}
            className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-40 ${
              lightTheme
                ? 'border-[rgba(201,100,66,0.22)] bg-[var(--ink)] text-[var(--canvas)] hover:bg-[var(--ink-2)]'
                : 'border-[rgba(var(--accent-rgb),0.20)] bg-[rgba(var(--accent-rgb),0.88)] text-white hover:bg-[rgba(var(--accent-rgb),0.78)]'
            }`}
          >
            Thêm
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ActionButton({ children, className = '', disabled = false, onClick, size = 'default', title, variant = 'soft', ...motionProps }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';

  const themeMap = lightTheme
    ? {
        primary: 'border-transparent bg-[var(--ink)] text-[var(--canvas)] shadow-[0_12px_24px_rgba(31,30,29,0.14)] hover:bg-[var(--ink-2)]',
        accent: 'border-transparent bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(201,100,66,0.16)] hover:bg-[var(--accent2)]',
        soft: 'border-[var(--line)] bg-white text-[var(--ink)] shadow-[0_8px_16px_rgba(31,30,29,0.05)] hover:border-[var(--line-2)] hover:bg-[rgba(244,242,236,0.96)]',
        info: 'border-[rgba(201,100,66,0.14)] bg-[rgba(255,247,237,0.98)] text-[var(--accent2)] shadow-[0_8px_16px_rgba(201,100,66,0.06)] hover:bg-[rgba(255,239,228,0.98)]',
        danger: 'border-[rgba(31,30,29,0.08)] bg-[rgba(244,242,236,0.96)] text-[var(--ink)] shadow-[0_8px_16px_rgba(31,30,29,0.04)] hover:border-[var(--line-2)] hover:bg-white',
      }
    : {
        primary: 'text-[var(--ink)] bg-white/[0.08] border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.14)] hover:bg-white/[0.10]',
        accent: 'text-white bg-[rgba(var(--accent-rgb),0.88)] border-[rgba(var(--accent-rgb),0.24)] shadow-[0_4px_20px_rgba(var(--accent-rgb),0.18)] hover:bg-[rgba(var(--accent-rgb),0.78)]',
        soft: 'text-[var(--ink)] bg-white/[0.05] border-white/8 shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-white/[0.08]',
        info: 'text-[var(--accent-light)] bg-white/[0.05] border-[rgba(var(--accent-rgb),0.18)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-white/[0.08]',
        danger: 'text-[var(--accent-light)] bg-white/[0.05] border-[rgba(var(--accent-rgb),0.18)] shadow-[0_4px_16px_rgba(0,0,0,0.12)] hover:bg-white/[0.08]',
      };

  const sizeMap = {
    default: 'px-7 py-3.5 text-lg font-bold leading-none whitespace-nowrap',
    compactMobile: 'min-w-0 w-full px-1 py-2.5 text-[10px] font-semibold leading-[1.05] tracking-[-0.03em] whitespace-normal sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold sm:leading-none sm:tracking-normal sm:whitespace-nowrap',
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      title={title}
      whileHover={disabled ? undefined : { scale: 1.03, y: -1 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      onClick={onClick}
      className={`inline-flex max-w-full items-center justify-center rounded-2xl border text-center transition-all ${
        sizeMap[size] ?? sizeMap.default
      } ${
        themeMap[variant] ?? themeMap.soft
      } ${disabled ? 'cursor-not-allowed opacity-45' : ''} ${className}`}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
