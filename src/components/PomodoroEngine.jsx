import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

import { SCRIM_FADE, useCustomMotion, useEnterMotion, usePressMotion, useRewardMotion, useSnapMotion } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { pushNow } from '../lib/syncService';
import useSettingsStore from '../store/settingsStore';
import { useTimer, formatTime, TIMER_MODES, TIMER_STATES } from '../hooks/useTimer';
import { getComboDecayMs, getDailyGoalProgress, getMultiplierTier, suggestSessionLength, clampRelicDisasterReduction } from '../engine/gameMath';
import { getVietnamHour, localDateStr } from '../engine/time';
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
import { RichNoteEditor } from './RichText';
import { countRichTextWords, trimRichTextToWordLimit } from '../utils/richText';
import {
  SESSION_GOAL_MIN_CHARS,
  deriveSessionGoalState,
  pickRecentGoals,
  sessionGoalHint,
} from './sessionGoalState';
import { jumpToSessionGoal } from './focusGoalJump';

const NOTE_WORD_LIMIT = 3000;
const SESSION_EXTENSION_SECONDS = 60;
const SESSION_EXTENSION_WINDOW_SECONDS = 5 * 60;
const SESSION_EXTENSION_IDLE_GRACE_MS = 30 * 1000;
const RING_RADIUS = 128;
const RING_STROKE = 14;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
// ── Vòng thứ hai: MỤC TIÊU NGÀY ──────────────────────────────────────────────
// Mảnh hơn hẳn vòng chính (4 so với 14) và nằm NGOÀI nó, cách một khoảng trống rõ — để mắt đọc ra
// ngay đâu là "phiên này" và đâu là "cả ngày", không phải đoán. Bán kính suy ra từ hình học chứ
// KHÔNG viết cứng: mép ngoài vòng chính + khoảng trống + nửa nét vòng ngoài. Đổi độ dày vòng chính
// thì vòng ngoài tự dịch theo, và `SVG_SIZE` bên dưới cũng tự nới — không có con số nào phải sửa tay.
const GOAL_RING_GAP = 8;
const GOAL_RING_STROKE = 4;
const GOAL_RING_RADIUS = RING_RADIUS + RING_STROKE / 2 + GOAL_RING_GAP + GOAL_RING_STROKE / 2;
const GOAL_RING_CIRCUMFERENCE = 2 * Math.PI * GOAL_RING_RADIUS;
// Khung SVG phải ôm được VÒNG NGOÀI CÙNG, nay là vòng mục tiêu chứ không còn là vòng chính.
const SVG_SIZE = (GOAL_RING_RADIUS + GOAL_RING_STROKE / 2) * 2 + 4;

const RING_COLORS = {
  [TIMER_STATES.IDLE]: 'var(--ink)',
  [TIMER_STATES.RUNNING]: 'var(--accent)',
  [TIMER_STATES.FINISHED]: 'var(--good)',
  [TIMER_STATES.CANCELLED]: 'var(--accent2)',
};
const Motion = motion;

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
  const sessionHistory = useGameStore((s) => s.history);
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
  const dailyTracking = useGameStore((s) => s.dailyTracking);

  const autoStartNext = useSettingsStore((s) => s.autoStartNext);
  const disableBreak = useSettingsStore((s) => s.disableBreak);
  const autoStartBreak = useSettingsStore((s) => s.autoStartBreak);
  const shortBreakDuration = useSettingsStore((s) => s.shortBreakDuration);
  const longBreakDuration = useSettingsStore((s) => s.longBreakDuration);
  const longBreakAfterN = useSettingsStore((s) => s.longBreakAfterN);
  const setBreakProfile = useSettingsStore((s) => s.setBreakProfile);
  const dailyGoalType = useSettingsStore((s) => s.dailyGoalType);
  const dailyGoalSessions = useSettingsStore((s) => s.dailyGoalSessions);
  const dailyGoalMinutes = useSettingsStore((s) => s.dailyGoalMinutes);
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const paperCardStyle = lightTheme
    ? {
        background: 'var(--card-bg-solid)',
        border: 'var(--skin-card-border-width, 1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card, 18px)',
        boxShadow: 'var(--skin-card-shadow)',
      }
    : undefined;
  // Thẻ nổi bao đồng hồ (mọi skin/theme) — để màn Focus giống mockup: đồng hồ nằm trong một thẻ.
  const timerCardStyle = {
    background: 'var(--card-bg-solid)',
    border: 'var(--skin-card-border-width, 1px) solid var(--line)',
    borderRadius: 'var(--skin-radius-card, 18px)',
    boxShadow: 'var(--skin-card-shadow)',
  };
  const paperInsetStyle = lightTheme
    ? {
        background: 'var(--card-bg-solid2)',
        border: 'var(--skin-card-border-width, 1px) solid var(--line)',
        borderRadius: 'var(--skin-radius-card, 18px)',
        boxShadow: 'none',
      }
    : undefined;
  const paperInputStyle = lightTheme
    ? {
        background: 'rgba(250, 249, 246, 0.98)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--skin-radius-control, 14px)',
        color: 'var(--ink)',
        boxShadow: 'none',
      }
    : undefined;
  const paperGoalInsetStyle = lightTheme
    ? {
        background: 'var(--accent-soft, rgba(255, 248, 243, 0.98))',
        border: 'var(--skin-card-border-width, 1px) solid rgba(var(--accent-rgb), 0.18)',
        borderRadius: 'var(--skin-radius-card, 18px)',
        boxShadow: 'none',
      }
    : undefined;
  const timerMode = timerConfig.mode ?? TIMER_MODES.POMODORO;
  const strictMode = timerConfig.strictMode;

  const {
    activeMode,
    displaySeconds,
    visibleDisplaySeconds,
    elapsedSeconds,
    totalSeconds,
    progressPct,
    timerState,
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
  } = useTimer({
    focusMinutes: timerConfig.focusMinutes,
    mode: timerMode,
  });
  const runtimeTimerMode = activeMode ?? timerMode;
  const isStopwatchMode = runtimeTimerMode === TIMER_MODES.STOPWATCH;

  const completedSessionReview = useGameStore((s) => (
    lastCompletedSessionId
      ? (s.history.find((entry) => entry.id === lastCompletedSessionId) ?? null)
      : null
  ));

  const [showCatManager, setShowCatManager] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState(null);
  const [focusMinutesDraft, setFocusMinutesDraft] = useState(() => (
    String(clampFocusMinutes(timerConfig.focusMinutes ?? 25))
  ));
  const [isEditingFocusMinutes, setIsEditingFocusMinutes] = useState(false);
  const [extendButtonGrace, setExtendButtonGrace] = useState(null);
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
  // Gợi ý độ dài phiên: học từ chính lịch sử người dùng theo buổi trong ngày.
  const lengthSuggestion = useMemo(
    () => suggestSessionLength(sessionHistory, {
      nowHour: getVietnamHour(),
      categoryId: pendingCategoryId,
      getEntryHour: (entry) => getVietnamHour(new Date(entry?.timestamp ?? 0)),
    }),
    [sessionHistory, pendingCategoryId],
  );
  const finishedSessionWillStartBreak = !disableBreak && (autoStartBreak || isStopwatchMode);
  const isCrisisBlockingStart = eraCrisis.active && eraCrisis.choiceMade !== 'challenge';
  const isExtensionWindowOpen = displaySeconds > 0 && displaySeconds <= SESSION_EXTENSION_WINDOW_SECONDS;
  const isExtensionGraceActive = Number.isFinite(extendButtonGrace?.until)
    && extendButtonGrace.sessionStartedAt === sessionStartedAt;
  const canExtendActivePomodoro = !isBreakMode
    && !isStopwatchMode
    && (timerState === TIMER_STATES.RUNNING || timerState === TIMER_STATES.PAUSED)
    && displaySeconds > 0
    && (isExtensionWindowOpen || isExtensionGraceActive);

  useEffect(() => {
    if (!Number.isFinite(extendButtonGrace?.until)) return undefined;

    const delay = Math.max(0, extendButtonGrace.until - Date.now());
    const timeoutId = window.setTimeout(() => {
      setExtendButtonGrace(null);
    }, delay + 50);

    return () => window.clearTimeout(timeoutId);
  }, [extendButtonGrace]);

  const handleExtendActivePomodoro = useCallback(() => {
    const didExtend = extendCurrentSession(SESSION_EXTENSION_SECONDS);
    if (!didExtend) return;
    setExtendButtonGrace({
      sessionStartedAt,
      until: Date.now() + SESSION_EXTENSION_IDLE_GRACE_MS,
    });
  }, [extendCurrentSession, sessionStartedAt]);

  const noteWordCount = countRichTextWords(pendingNote);
  // ⚠️ BA trạng thái, không phải hai — xem `sessionGoalState.js`. Trước đây ô CHƯA GÕ GÌ và ô GÕ DỞ
  // dùng chung một bộ class cảnh báo, nên mỗi lần mở app là một dòng chữ đậm màu cảnh báo trên một
  // ô Đàm còn chưa chạm vào.
  const goalState = deriveSessionGoalState(pendingSessionGoal);
  const sessionGoalText = goalState.text;
  const sessionGoalCharCount = goalState.charCount;
  const isSessionGoalValid = goalState.isReady;
  const sessionGoalProgressPct = goalState.progressPct;
  const sessionPrepStatusLabel = goalState.badgeLabel;
  // Tông → class. Ô trống ở theme sáng nay dùng đúng màu chữ phụ như mọi dòng chỉ dẫn khác; ở theme
  // tối thì nhánh "chưa đủ" vốn đã trung tính sẵn, nên chỉ cần tách riêng nhánh sáng.
  const goalBadgeClass = goalState.tone === 'good'
    ? lightTheme
      ? 'border border-[rgba(91,122,82,0.18)] bg-[rgba(229,236,223,0.92)] text-[var(--good)]'
      : 'border border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05] text-[var(--accent-light)]'
    : goalState.tone === 'warn'
      ? lightTheme
        ? 'border border-[rgba(201,100,66,0.14)] bg-[rgba(201,100,66,0.08)] text-[var(--accent2)]'
        : 'border border-white/8 bg-white/[0.05] text-[var(--muted)]'
      : lightTheme
        ? 'border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]'
        : 'border border-white/8 bg-white/[0.05] text-[var(--muted)]';
  // ⚠️ CHỈ GỢI Ý KHI Ô CÒN TRỐNG. Đang gõ dở mà mọc ra mấy cái chip thì chúng vừa che chỗ vừa mời
  // vứt bỏ thứ vừa gõ. Đây là lối tắt cho lúc bắt đầu, không phải một bảng chọn thường trực.
  // ⚠️ KHÔNG bọc `useMemo`: React Compiler từ chối tối ưu cả component khi thấy memo hoá thủ công
  // mà nó không bảo toàn được ("Existing memoization could not be preserved") — đổi lấy một phép
  // tính vốn đã rẻ (duyệt lịch sử và DỪNG sau 3 kết quả) là một cái giá tệ. Để compiler tự lo.
  const recentGoals = sessionGoalText.trim() ? [] : pickRecentGoals(sessionHistory);

  const goalHintClass = goalState.tone === 'warn'
    ? lightTheme ? 'font-semibold text-[var(--accent2)]' : 'font-semibold text-red-300'
    : lightTheme ? 'text-[var(--muted)]' : 'text-slate-500';
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
  const fullScreenTimerScaleDown = shouldDockFullScreenActions ? 1 : 1;
  const fullScreenTimerCanvasDown = shouldDockFullScreenActions ? 1 : 1;
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
  // Màn Focus "tĩnh": khi đang chạy/tạm dừng (không phải giải lao) cũng dùng
  // chế độ tối giản như fullscreen — ẩn huy hiệu game để 25 phút chỉ còn đồng hồ.
  const useMinimalFocusStage = fullScreenMode || (isActive && !isBreakMode);
  const showComboBadge = !useMinimalFocusStage && !isBreakMode && comboCount >= 2;
  const showMultiplierBadge = !useMinimalFocusStage && !isBreakMode;
  // Cỡ chữ đã tăng ~20% so với bản trước (2026-08-27) để con số thành trung tâm thị giác thật sự.
  // ⚠️ Mọi mốc đáp ứng đều phải nhân CÙNG hệ số — nới một mốc rồi bỏ quên mốc kia thì chữ nhảy cỡ
  // đúng lúc xoay ngang máy. Bảng cũ → mới: 4.8→5.75 · 5.6→6.7 · 6.4→7.7 · 7.05→8.45 ·
  // 4.55→5.45 · 4.9→5.9 · 5.2→6.25 · 5.55→6.65 · 3.95→4.75 · 4.65→5.6 · 5.2→6.25 ·
  // text-6xl (3.75rem) → 4.5rem.
  const timerValueLayoutClass = useImmersiveHeroLayout
    ? fullScreenMode
      ? isDesktopFullScreen
        ? 'block w-[82%] text-center text-[5.75rem] leading-[0.81] tracking-[-0.065em] md:text-[6.7rem] xl:text-[7.7rem] 2xl:text-[8.45rem]'
        : 'block w-[84%] text-center text-[5.45rem] leading-[0.8] tracking-[-0.068em] sm:text-[5.9rem] md:text-[6.25rem] xl:text-[6.65rem]'
      : 'block max-w-[82%] text-center text-[4.75rem] leading-[0.86] tracking-[-0.06em] md:text-[5.6rem] xl:text-[6.25rem]'
    // ⚠️ `tracking-wide` chứ KHÔNG còn `tracking-widest`, và đây là hệ quả ĐO ĐƯỢC của việc nâng
    // cỡ chữ 20%: nhánh này là nhánh DUY NHẤT không có ràng buộc bề rộng, mà ở khung 390px lòng
    // đĩa chỉ rộng 238px. Đo thật: "180:00" (bấm giờ chạy quá 100 phút — `clampFocusMinutes` cho
    // tới 180) ở `widest` (0,1em) rộng **247px ⇒ TRÀN 9px** ra đè lên vòng; `wider` 226px; `wide`
    // 215px ⇒ dư 23px. Bản trước cỡ chữ nhỏ hơn nên `widest` vẫn vừa — cái tràn này do chính phép
    // nâng cỡ sinh ra, không phải có sẵn.
    : 'text-[4.5rem] tracking-wide';
  // ⚠️ MỘT lớp độ đậm duy nhất. `.serif`/`.mono` chỉ khai font-family (kiểm ở `index.css`), nên
  // `font-extrabold` không phải tranh với ai — chồng thêm `font-medium`/`font-bold` như bản cũ là
  // để hai lớp cùng khai `font-weight` rồi phó mặc thứ tự bảng kiểu Tailwind quyết ai thắng.
  const timerValueFontClass = `${lightTheme ? 'serif' : 'font-mono'} font-extrabold`;
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
    mode: runtimeTimerMode,
    workedMinutes: manualBreakWorkedMinutes,
    sessionsCompleted,
    longBreakCycleStart,
    shortBreakDuration,
    longBreakDuration,
    longBreakAfterN,
    extraBreakMinutes: unlockedSkills.hit_tho_sau ? BREAK_EXTENSION_MINUTES : 0,
  });

  const disasterReductionPreview = useMemo(() => (
    clampRelicDisasterReduction(relics.reduce((acc, relic) => {
      const stage = relicEvolutions[relic.id] ?? 0;
      const evoDef = RELIC_EVOLUTION[relic.id];
      const buff = evoDef?.stages[stage]?.buff ?? relic.buff ?? {};
      return acc + (buff.disasterReduction ?? 0);
    }, 0))
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
  const displayRingSeconds = isBreakMode ? breakSecsLeft : visibleDisplaySeconds;
  const displayProgressPct = isBreakMode ? breakProgressPct : progressPct;
  // Nghỉ NGẮN hay nghỉ DÀI đều là "đang nghỉ" ⇒ cùng một màu, và là màu tích cực `--good`.
  // ⚠️ Bản cũ rẽ theo `lightTheme` rồi chốt cứng `#60a5fa`/`#38bdf8` cho chế độ tối — hai mã màu
  // xanh lam ấy không thuộc bảng màu nào của 5 skin hiện tại, nên vòng đồng hồ là thứ DUY NHẤT
  // trên màn hình không đổi theo skin. Nay đọc token, đúng ở cả 10 tổ hợp skin × chế độ.
  const breakRingColor = 'var(--good)';
  const strokeDashoffset = RING_CIRCUMFERENCE - (displayProgressPct / 100) * RING_CIRCUMFERENCE;
  // ⚠️ Dùng CHUNG công thức với thẻ "Hôm nay" ở `FocusRail` (qua `App.jsx`) — xem khối chú thích
  // ở `getDailyGoalProgress` trong `gameMath.js`. Tính lại tại chỗ là cách chắc chắn nhất để hai
  // con số cạnh nhau trên cùng màn hình nói hai điều khác nhau.
  const dailyGoal = getDailyGoalProgress({
    dailyTracking,
    history: sessionHistory,
    todayKey: localDateStr(),
    dailyGoalType,
    dailyGoalSessions,
    dailyGoalMinutes,
  });
  // Vòng tròn thì PHẢI kẹp ở 100% (vẽ quá một vòng là vẽ đè lên chính nó, đọc ra thành "chưa xong"),
  // còn dòng chữ bên dưới vẫn nói thật con số đã vượt.
  const goalRingDashoffset = GOAL_RING_CIRCUMFERENCE
    - (Math.min(100, Math.max(0, dailyGoal.pct)) / 100) * GOAL_RING_CIRCUMFERENCE;
  const baseRingColor = isBreakMode
    ? breakRingColor
    : (RING_COLORS[timerState] ?? RING_COLORS[TIMER_STATES.IDLE]);
  const ringColor = isBreakMode ? breakRingColor : baseRingColor;
  // Quầng sáng quanh vòng: cùng màu vòng, pha loãng. Nhạt hơn ở theme sáng vì nền sáng thì một
  // quầng đậm đọc ra thành vệt bẩn, còn nền tối thì nó là thứ làm vòng "phát sáng".
  const ringGlowColor = `color-mix(in srgb, ${ringColor} ${lightTheme ? 22 : 45}%, transparent)`;
  // ── BA NHỊP CHUNG + NHỮNG NGOẠI LỆ CÓ LÝ DO ────────────────────────────────────────────────
  // Ba nhịp ở `src/lib/motionPresets.js`. Mỗi `useSnapMotion`/`useCustomMotion` bên dưới là một
  // ngoại lệ, và mỗi ngoại lệ phải tự khai lý do — không có dòng lý do thì nó đáng lẽ là `enter`.
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();

  // NGOẠI LỆ (mang bố cục) — cỡ đồng hồ lúc vào/ra chế độ chuyên chú. `animate` KHAI ra tỉ lệ, bỏ
  // hẳn thì đồng hồ nhảy về cỡ mặc định và chế độ chuyên chú mất luôn ý nghĩa.
  const timerScaleMotion = useSnapMotion({
    animate: { scale: timerVisualScale, y: immersiveMode ? (isDesktopFullScreen ? 8 : 4) : 0 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  });

  // NGOẠI LỆ (trang trí) — nhịp thở của đồng hồ: lặp VÔ HẠN, nên nó không thể là `enter` (một nhịp
  // xuất hiện chạy đúng một lần). Bỏ hẳn thì đồng hồ đứng yên ở tỉ lệ 1 — đúng thứ cần.
  const timerBreathMotion = useCustomMotion({
    animate: timerState === TIMER_STATES.FINISHED && !isBreakMode
      ? { scale: [1, 1.06, 1] }
      : timerState === TIMER_STATES.RUNNING && !isBreakMode
        ? { scale: [1, 1.018, 1] }
        : { scale: 1 },
    transition: timerState === TIMER_STATES.FINISHED && !isBreakMode
      ? { duration: 0.7, ease: 'easeOut' }
      : timerState === TIMER_STATES.RUNNING && !isBreakMode
        ? { duration: 5, repeat: Infinity, ease: 'easeInOut' }
        : { duration: 0.3 },
  });

  // NGOẠI LỆ (mang bố cục) — vòng tiến độ: `strokeDashoffset` CHÍNH LÀ phần trăm đã trôi qua, bỏ
  // đi thì vòng luôn đầy. 0,8s là cố ý: nó phải chậm hơn mọi thứ khác để đọc ra "đang trôi".
  const ringProgressMotion = useSnapMotion({
    animate: { strokeDashoffset, stroke: ringColor },
    transition: { strokeDashoffset: { duration: 0.8, ease: 'easeOut' }, stroke: { duration: 0.3 } },
  });

  // NGOẠI LỆ (mang bố cục) — vòng MỤC TIÊU NGÀY: cung dài bao nhiêu CHÍNH LÀ đã đi được mấy phần
  // mục tiêu, bỏ đi thì vòng luôn đầy và nói dối. Cùng 0,8s với vòng tiến độ phiên để hai vòng
  // chạy như một khối, không phải hai thứ rời nhau.
  const goalRingMotion = useSnapMotion({
    animate: { strokeDashoffset: goalRingDashoffset },
    transition: { duration: 0.8, ease: 'easeOut' },
  });

  // NGOẠI LỆ (trang trí) — mười giây cuối đập theo nhịp giây, lặp vô hạn. Con số vẫn đọc được khi tắt.
  const countdownPulseMotion = useCustomMotion({
    animate: !isBreakMode && timerState === TIMER_STATES.RUNNING && !isStopwatchMode && displaySeconds <= 10
      ? { scale: [1, 1.04, 1] }
      : {},
    transition: { duration: 1, repeat: !isBreakMode && !isStopwatchMode && displaySeconds <= 10 ? Infinity : 0 },
  });

  // NGOẠI LỆ (mang bố cục) — thanh tiến độ ô mục tiêu: bề dài CHÍNH LÀ số ký tự đã gõ.
  const goalProgressMotion = useSnapMotion({
    initial: false,
    animate: { width: `${sessionGoalCharCount > 0 ? Math.max(sessionGoalProgressPct, 8) : 0}%` },
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
  });

  // NGOẠI LỆ (mang bố cục) — bề ngang và khoảng cách của cả khối khi đổi bố cục chuyên chú.
  const rootLayoutMotion = useSnapMotion({
    animate: { maxWidth: immersiveRootMaxWidth, gap: useImmersiveHeroLayout ? 46 : immersiveMode ? 38 : 34 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
  });

  // NGOẠI LỆ (trang trí) — viền báo động nhấp nháy, lặp vô hạn. Chữ trên nút vẫn nói đủ khi tắt.
  const crisisPulseMotion = useCustomMotion({
    animate: { borderColor: ['#ef4444', '#f59e0b', '#ef4444'] },
    transition: { duration: 1.5, repeat: Infinity },
  });

  const shouldPrioritizeSessionReview = immersiveMode && showSessionReview;
  const sessionReviewCard = showSessionReview ? (
    <SessionReviewCard
      completedGoalAchieved={completedGoalAchieved}
      goalText={reviewGoalText}
      goalBonusXP={completedSessionReview?.goalBonusXP ?? 0}
      goalBonusEP={completedSessionReview?.goalBonusEP ?? 0}
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
        ? 'mt-3 md:mt-4 bg-white/[0.045] border-white/[0.10] shadow-[0_14px_38px_rgba(15,23,42,0.12)]'
        : 'mt-3 md:mt-4 bg-white/[0.04] border-white/[0.09] shadow-[0_10px_26px_rgba(15,23,42,0.10)]'
    } ${!isIdle || isBreakMode ? 'opacity-25 pointer-events-none' : ''}`} style={{ borderRadius: 'var(--skin-radius-card, 18px)', ...paperCardStyle }}>
      <div className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
        immersiveMode ? 'px-5 py-4 md:px-5' : 'px-4 py-4'
      }`}>
        <div className="min-w-0">
          <p className={`mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap ${
            lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-400'
          }`}>Thiết lập phiên</p>
          <p
            className={`mt-1.5 text-[15px] leading-snug ${lightTheme ? 'text-[var(--ink-2)]' : 'text-slate-500'}`}
            style={lightTheme ? { fontFamily: 'var(--skin-font-display)' } : undefined}
          >
            Chọn mode, thời lượng và mức kỷ luật trước khi bắt đầu.
          </p>
        </div>
        <ModeSwitch
          disabled={timerState !== TIMER_STATES.IDLE || isBreakMode}
          mode={isActive ? runtimeTimerMode : timerMode}
          onChange={switchMode}
        />
      </div>

      <div className={`grid gap-4 border-t border-white/5 sm:gap-3 ${
        immersiveMode
          ? 'px-5 py-4 md:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)] md:px-5'
          : 'px-4 py-4 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]'
      }`}>
        <div className={`min-w-0 px-4 py-4 sm:py-3.5 ${
          lightTheme
            ? 'border border-[var(--line)] bg-[rgba(244,242,236,0.82)]'
            : 'border border-white/[0.07] bg-black/10 rounded-[22px]'
        }`} style={paperInsetStyle}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <p className={`mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap ${
                lightTheme ? 'text-[var(--muted-2)]' : 'text-emerald-400'
              }`}>
                {isStopwatchMode ? 'Mốc tham chiếu' : 'Tập trung'}
              </p>
              <p className={`mt-1 text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
                {isStopwatchMode ? 'Dùng để neo mốc thưởng khi bấm giờ.' : 'Thời lượng countdown của phiên kế tiếp.'}
              </p>
            </div>
            <div className={`flex items-center justify-between gap-3 self-stretch rounded-[var(--skin-radius-control,14px)] px-2 py-1.5 sm:self-auto sm:justify-start sm:gap-2 sm:rounded-none sm:px-0 sm:py-0 ${
              lightTheme
                ? 'bg-white/70 border border-[var(--line)] sm:bg-transparent sm:border-transparent'
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
              <div className={`min-w-[4.5rem] rounded-[var(--skin-radius-control,14px)] border px-1.5 py-1 text-center transition-colors ${
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
            mode={isActive ? runtimeTimerMode : timerMode}
            onSelect={applyQuickPreset}
          />

          {isIdle && !isBreakMode && !isStopwatchMode && lengthSuggestion
            && lengthSuggestion.minutes !== timerConfig.focusMinutes && (
            <button
              type="button"
              onClick={() => applyFocusMinutes(lengthSuggestion.minutes)}
              className={`mt-4 flex w-full items-center justify-between gap-3 rounded-[var(--skin-radius-control,14px)] border px-3.5 py-2.5 text-left transition ${
                lightTheme
                  ? 'border-[rgba(91,122,82,0.28)] bg-[rgba(229,236,223,0.6)] hover:bg-[rgba(229,236,223,0.95)]'
                  : 'border-emerald-300/20 bg-emerald-400/[0.07] hover:bg-emerald-400/[0.14]'
              }`}
            >
              <span className="min-w-0">
                <span className={`block text-[13px] font-semibold ${lightTheme ? 'text-[var(--good)]' : 'text-emerald-200'}`}>
                  💡 {lengthSuggestion.bucketLabel} bạn thường hợp phiên ~{lengthSuggestion.minutes} phút
                </span>
                <span className={`mono mt-0.5 block text-[10px] uppercase tracking-[0.16em] ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
                  dựa trên {lengthSuggestion.sampleSize} phiên{lengthSuggestion.categoryScoped ? ' cùng loại' : ''}
                </span>
              </span>
              <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-semibold ${
                lightTheme
                  ? 'border-[rgba(91,122,82,0.3)] text-[var(--good)]'
                  : 'border-emerald-300/30 text-emerald-200'
              }`}>
                Dùng {lengthSuggestion.minutes}′
              </span>
            </button>
          )}
        </div>

        <div className={`min-w-0 px-4 py-3.5 ${
          lightTheme
            ? 'border border-[var(--line)] bg-[rgba(244,242,236,0.82)]'
            : 'border border-white/[0.07] bg-black/10 rounded-[22px]'
        }`} style={paperInsetStyle}>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className={`mono text-[10px] uppercase tracking-[0.2em] whitespace-nowrap ${
                lightTheme ? 'text-[var(--muted-2)]' : 'text-sky-400'
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
            {...rewardMotion}
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
                {...rewardMotion}
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
          {...enterMotion}
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
          {...timerScaleMotion}
          style={{ width: timerCanvasSize, height: timerCanvasSize }}
        >
          {immersiveMode && (isActive || isBreakMode) && (
            <motion.div
              aria-hidden="true"
              className="pointer-events-none absolute inset-[-10%] rounded-full blur-3xl"
              {...enterMotion}
              style={{ background: immersiveGlow }}
            />
          )}
          <motion.div className="relative" {...timerBreathMotion}>
          <svg
            width={timerCanvasSize}
            height={timerCanvasSize}
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="transform -rotate-90"
            aria-hidden="true"
            style={{
              // ⚠️ Bản cũ ghép chuỗi `${ringColor}55` để lấy màu mờ. Cách ấy CHỈ hợp lệ khi
              // `ringColor` là một mã hex; từ lúc màu vòng đọc token nó cho ra `var(--accent)55`
              // — một giá trị CSS vô nghĩa, nên `drop-shadow` im lặng không vẽ gì. Thật ra nó đã
              // hỏng sẵn ở theme sáng từ trước (ở đó `RING_COLORS` vốn đã là token); chỉ nhánh tối
              // còn chạy nhờ hai mã hex cứng, mà hai mã ấy vừa bị gỡ. `color-mix` giữ được `var()`
              // nên quầng sáng đi theo skin — dự án đã dùng cách này ở `cityBackdropScrim.js`.
              filter: isBreakMode || timerState === TIMER_STATES.RUNNING
                ? `drop-shadow(0 0 12px ${ringGlowColor})`
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
                style={{ stroke: 'var(--accent)' }}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                opacity={0.6}
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
                {...ringProgressMotion}
              />
            )}
            {/* Vòng NGOÀI = tiến độ MỤC TIÊU NGÀY. Chưa đặt mục tiêu thì không vẽ gì cả — một
                vòng rỗng vẫn là một vòng, và nó sẽ bị đọc thành "hôm nay chưa làm được gì". */}
            {dailyGoal.hasGoal && (
              <motion.circle
                cx={SVG_SIZE / 2}
                cy={SVG_SIZE / 2}
                r={GOAL_RING_RADIUS}
                fill="none"
                style={{ stroke: 'var(--warn)' }}
                strokeWidth={GOAL_RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={GOAL_RING_CIRCUMFERENCE}
                {...goalRingMotion}
              />
            )}
          </svg>
          </motion.div>

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`mono text-[10px] uppercase tracking-[0.22em] ${
              lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'
            }`}>
              {isBreakMode && (breakIsLong ? 'Giải lao dài' : 'Giải lao')}
              {!isBreakMode && timerState === TIMER_STATES.IDLE && (isStopwatchMode ? 'Sẵn sàng bấm giờ' : 'Sẵn sàng')}
              {!isBreakMode && timerState === TIMER_STATES.RUNNING && (isStopwatchMode ? 'Đang bấm giờ' : 'Đang tập trung')}
              {!isBreakMode && timerState === TIMER_STATES.PAUSED && (
                continuedPomodoroConfirmationPending ? 'Chờ xác nhận' : 'Đã tạm dừng'
              )}
              {!isBreakMode && timerState === TIMER_STATES.FINISHED && 'Hoàn thành'}
              {!isBreakMode && timerState === TIMER_STATES.CANCELLED && 'Đã hủy'}
            </span>
            <motion.span
              key={`${isBreakMode ? 'break' : runtimeTimerMode}-${displayRingSeconds}`}
              className={`mt-3 ${timerValueLayoutClass} ${timerValueFontClass} ${timerValueToneClass} tabular-nums transition-all duration-300`}
              {...countdownPulseMotion}
            >
              {formatTime(displayRingSeconds)}
            </motion.span>
            {/* Câu trả lời thứ hai của đồng hồ: hôm nay đã đi được mấy phần mục tiêu. Đọc CÙNG
                nguồn số liệu với vòng ngoài, nên hai thứ không thể nói hai điều khác nhau — và
                cùng nguồn với thẻ "Hôm nay" ở cột bên phải.
                ⚠️ Ở đây KHÔNG kẹp 100%: vượt mục tiêu thì phải nói thật là "Phiên 6/4", trong khi
                vòng tròn thì buộc phải kẹp (vẽ quá một vòng là vẽ đè lên chính nó). */}
            {dailyGoal.hasGoal && (
              <span className="mt-1.5 text-[13px] leading-none" style={{ color: 'var(--muted)' }}>
                {dailyGoal.useMinutes
                  ? `${dailyGoal.currentValue}/${dailyGoal.goalValue} phút hôm nay`
                  : `Phiên ${dailyGoal.currentValue}/${dailyGoal.goalValue} hôm nay`}
              </span>
            )}
            {!isBreakMode && isStopwatchMode && (
              <>
                <span className={`mt-0.5 text-xs ${lightTheme ? 'text-[var(--accent)]' : 'text-[var(--accent-light)]'}`}>
                  Ghi nhận theo phút thực tế
                </span>
                {isContinuingAfterPomodoro && (
                  <span className="mt-1 flex flex-col items-center leading-tight">
                    <span className={`text-[11px] font-semibold ${lightTheme ? 'text-[var(--accent)]' : 'text-[var(--accent-light)]'}`}>
                      {continuedPomodoroConfirmationPending
                        ? 'Đã thêm 15 phút nữa — tiếp tục hay dừng?'
                        : `Xong ${currentSessionTargetMinutes}′ — đang tính giờ thêm`}
                    </span>
                    {!continuedPomodoroConfirmationPending && (
                      <span className={`mt-0.5 text-[10px] ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
                        Bấm Hết Phiên khi muốn dừng
                      </span>
                    )}
                  </span>
                )}
              </>
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
              {...enterMotion}
              className="grid w-full grid-cols-[minmax(0,1.72fr)_minmax(112px,0.88fr)] items-stretch gap-2 sm:flex sm:w-auto sm:gap-3"
            >
              {/* ⚠️ PHẢI DÙNG `size="compactMobile"`, ĐỪNG NHÉT `px-…`/`text-…` VÀO `className`.
                  Bài học đắt (2026-08-13): bản trước truyền `px-2.5 text-[11px]` qua `className`
                  và tôi tưởng đã sửa xong. Hỏi thẳng trình duyệt thì nút vẫn đang chạy
                  **`font-size: 18px`, `padding: 28px`** — tức `text-lg`/`px-7` của khuôn nút THẮNG.
                  Lý do: Tailwind quyết lớp nào thắng theo THỨ TỰ TRONG BẢNG KIỂU, không theo thứ tự
                  viết trong `className`; dự án lại không có `tailwind-merge`. ⇒ Hai lớp cùng khai
                  một thuộc tính là một canh bạc, và ở đây tôi thua mà không hay.
                  `ActionButton` đã có sẵn lối đúng: `sizeMap[size] ?? sizeMap.default` chỉ phát ra
                  MỘT bộ, nên không có gì để đánh nhau. `compactMobile` còn cho chữ XUỐNG DÒNG ở
                  khung hẹp (`whitespace-normal`) rồi trở lại một dòng từ `sm:` — hơn hẳn cắt bằng
                  dấu "…". `className` chỉ giữ những lớp KHÔNG đụng hàng: `min-w-0 w-full`.
                  Kiểm bằng: `node scripts/shot.mjs --phone --fit`
                  và `node scripts/shot.mjs --phone --fit --el "Cần điền mục tiêu"`. */}
              {/*
                ⚠️ KHI CHƯA CÓ MỤC TIÊU, NÚT NÀY **DẪN ĐƯỜNG** CHỨ KHÔNG CÒN LÀ NGÕ CỤT (2026-08-30).
                Bản cũ để nó `disabled` với nhãn "Cần điền mục tiêu". Một nút `disabled` không nhận
                sự kiện bấm, nên nó nói ra điều đang thiếu mà **không nói thiếu ở đâu**, và bấm vào
                thì không có gì xảy ra. Đo trên ảnh chụp 390px: ô mục tiêu nằm ở y≈1400 của một
                trang cao 3035px — Đàm phải cuộn qua đồng hồ, qua "Chu kỳ nghỉ", qua "Ghi chú
                phiên" mới thấy nó, rồi cuộn ngược lên mới bấm được. Mỗi phiên một lần, mãi mãi,
                ngay tại hành động quan trọng nhất của cả app.
                ⚠️ LUẬT KHÔNG BỊ NỚI: vẫn phải đủ `SESSION_GOAL_MIN_CHARS` ký tự mới bắt đầu được.
                Thứ bị gỡ là ma sát ĐI LẠI, không phải cái cổng. Nhãn cũng đổi theo cho khỏi nói
                dối: nút này giờ ĐƯA TỚI ô mục tiêu, nên nó nói "Điền mục tiêu →", không nói "Cần".
                ⚠️ Vẫn `variant="soft"` chứ không "primary": bấm nó KHÔNG bắt đầu phiên, và một nút
                trông như nút chính mà làm việc khác là cách nhanh nhất để mất lòng tin vào nút.
                Ca khủng hoảng thì giữ nguyên `disabled` — ở đó thứ chặn không nằm trên màn này.
              */}
              {!isCrisisBlockingStart && !isSessionGoalValid ? (
                <ActionButton
                  onClick={() => jumpToSessionGoal()}
                  variant="soft"
                  size="compactPrimary"
                  className={compactTimerActionButtonClassName}
                  title={`Đưa tới ô mục tiêu — cần ít nhất ${SESSION_GOAL_MIN_CHARS} ký tự`}
                >
                  Điền mục tiêu →
                </ActionButton>
              ) : (
                <ActionButton
                  disabled={isCrisisBlockingStart}
                  onClick={handleStartSession}
                  variant="primary"
                  size="compactPrimary"
                  className={compactTimerActionButtonClassName}
                  title={isCrisisBlockingStart
                    ? 'Cần xử lý Khủng hoảng Kỷ Nguyên trước khi bắt đầu phiên mới'
                    : 'Bắt đầu phiên tập trung'}
                >
                  {/* "phiên" ở cuối là chữ thừa: cả màn hình này đang nói về một phiên, và ô nhập
                      ngay bên dưới đã ghi rõ "MỤC TIÊU PHIÊN". Bỏ nó đi thì nhãn vừa khung 390px. */}
                  {isCrisisBlockingStart ? 'Xử lý khủng hoảng' : 'Bắt đầu phiên'}
                </ActionButton>
              )}
              {canEnterFullScreen && (
                <ActionButton
                  onClick={onEnterFullScreen}
                  variant="soft"
                  size="compactPrimary"
                  className={compactTimerActionButtonClassName}
                >
                  Full Screen
                </ActionButton>
              )}
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.RUNNING && (
            <motion.div
              key="running-btns"
              {...enterMotion}
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
                  onClick={handleExtendActivePomodoro}
                  variant="info"
                  size="compactMobile"
                  className={compactTimerActionButtonClassName}
                >
                  +1 phút
                </ActionButton>
              )}
              {isStopwatchMode && (
                <ActionButton onClick={finish} variant="accent" size="compactMobile" className={compactTimerActionButtonClassName}>
                  Hết Phiên
                </ActionButton>
              )}
              <ActionButton onClick={handleCancelClick} variant="danger" size="compactMobile" className={compactTimerActionButtonClassName}>
                Hủy phiên
              </ActionButton>
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.PAUSED && (
            <motion.div
              key={continuedPomodoroConfirmationPending ? 'continued-confirm-btns' : 'paused-btns'}
              {...enterMotion}
              className={continuedPomodoroConfirmationPending
                ? 'grid w-full grid-cols-2 items-stretch gap-2 sm:w-auto sm:min-w-[360px]'
                : compactTimerActionRowClassName}
            >
              {continuedPomodoroConfirmationPending ? (
                <>
                  <ActionButton onClick={resume} variant="primary" size="compactMobile" className={compactTimerActionButtonClassName}>
                    Tiếp tục thêm giờ
                  </ActionButton>
                  <ActionButton onClick={finish} variant="accent" size="compactMobile" className={compactTimerActionButtonClassName}>
                    Hết Phiên
                  </ActionButton>
                </>
              ) : (
                <>
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
                      onClick={handleExtendActivePomodoro}
                      variant="info"
                      size="compactMobile"
                      className={compactTimerActionButtonClassName}
                    >
                      +1 phút
                    </ActionButton>
                  )}
                  {isStopwatchMode && (
                    <ActionButton onClick={finish} variant="accent" size="compactMobile" className={compactTimerActionButtonClassName}>
                      Hết Phiên
                    </ActionButton>
                  )}
                  <ActionButton onClick={handleCancelClick} variant="danger" size="compactMobile" className={compactTimerActionButtonClassName}>
                    Hủy phiên
                  </ActionButton>
                </>
              )}
            </motion.div>
          )}

          {!isBreakMode && timerState === TIMER_STATES.FINISHED && (
            <motion.div
              key="finished-btns"
              {...enterMotion}
              className="flex items-center gap-3"
            >
              {!disableBreak && !finishedSessionWillStartBreak && (
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
      <div className={`w-full border backdrop-blur-2xl ${
        useImmersiveHeroLayout
          ? 'bg-white/[0.045] border-white/[0.10] px-4 py-4 shadow-[0_12px_28px_rgba(15,23,42,0.10)]'
          : 'bg-white/[0.04] border-white/[0.09] px-3.5 py-3 shadow-[0_8px_22px_rgba(15,23,42,0.08)]'
      }`} style={{ borderRadius: 'var(--skin-radius-card, 18px)', ...paperCardStyle }}>
        <button
          type="button"
          onClick={() => setNoteExpanded((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-0.5 text-left"
          aria-expanded={noteExpanded}
        >
          <span className={`mono text-[10px] uppercase tracking-[0.2em] ${
            lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-500'
          }`}>
            Ghi chú phiên{!noteExpanded && noteWordCount > 0 ? ` · ${noteWordCount} từ` : ''}
          </span>
          <span className={`mono text-[10px] uppercase tracking-[0.16em] ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
            {noteExpanded ? 'Thu gọn ▴' : 'Mở ▾'}
          </span>
        </button>
        {noteExpanded && (
          <div className="mt-2.5">
            <RichNoteEditor
              value={pendingNote}
              onChange={(nextNote) => setPendingNote(trimRichTextToWordLimit(nextNote, NOTE_WORD_LIMIT))}
              rows={4}
              maxWords={NOTE_WORD_LIMIT}
              wordCount={noteWordCount}
              lightTheme={lightTheme}
              inputStyle={paperInputStyle}
              placeholder="Bạn đang nghĩ gì, đang kẹt ở đâu, hay cần chốt ý nào trước khi vào nhịp sâu?"
            />
          </div>
        )}
      </div>

      {isIdle && !isBreakMode && (
      <div className="w-full px-3.5 py-3 backdrop-blur-2xl bg-white/[0.045] border border-white/[0.10] shadow-[0_12px_28px_rgba(15,23,42,0.10)]" style={{ borderRadius: 'var(--skin-radius-card, 18px)', ...paperCardStyle }}>
        <div className="flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            <p className={`mono text-[10px] uppercase tracking-[0.2em] ${
              lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-500'
            }`}>
              Chuẩn bị phiên
            </p>
            <p className={`mt-1 text-[13px] leading-5 ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-400'}`}>
              Chốt một đích đến rõ ràng trước khi bấm bắt đầu. Ghi chú cho lần sau chỉ để giữ mạch chuyển tiếp.
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${goalBadgeClass}`}>
            {sessionPrepStatusLabel}
          </span>
        </div>

        <Motion.div
          layout
          className={`mt-3 border px-3.5 py-3 ${
            lightTheme
              ? ''
              : isSessionGoalValid
                ? 'rounded-[22px] border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05]'
                : 'rounded-[22px] border-white/8 bg-white/[0.04]'
          }`}
          style={paperGoalInsetStyle}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${
                  lightTheme
                    ? 'bg-[rgba(var(--accent-rgb),0.1)] text-[var(--accent2)]'
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
              {/* ⚠️ Bộ đếm ngay trên là `sessionGoalCharCount` — KÝ TỰ, không phải TỪ. Nhãn cũ ghi
                  "tối thiểu từ" nên "0/10" đọc thành "tối thiểu 10 TỪ", gấp nhiều lần luật thật và
                  đủ để làm người ta nản trước khi gõ chữ đầu tiên. */}
              <p className={`mt-1 text-[10px] ${lightTheme ? 'text-[var(--muted-2)]' : 'text-slate-600'}`}>
                ký tự tối thiểu
              </p>
            </div>
          </div>

          <div className={`mt-3 h-1.5 overflow-hidden rounded-full ${
            lightTheme ? 'bg-[rgba(201,100,66,0.08)]' : 'bg-white/8'
          }`}>
            <Motion.div
              {...goalProgressMotion}
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
              data-session-goal-field
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
            {/*
              ⚠️ LỐI TẮT, KHÔNG PHẢI NỚI LUẬT. Nút Bắt đầu vẫn bị khoá cho tới khi đủ
              `SESSION_GOAL_MIN_CHARS` ký tự — đó là luật CÓ CHỦ ĐÍCH (mục tiêu làm phiên có nghĩa,
              có thưởng khi đạt, AI Coach đọc nó). Nhưng phần lớn công việc là LẶP LẠI: "Hoàn thành
              phần đang dở" hôm nay cũng đúng như hôm qua, mà app bắt gõ lại 10 ký tự ấy mỗi phiên
              — ma sát đặt đúng vào hành động quan trọng nhất của cả app. Chip này bỏ việc GÕ LẠI,
              không bỏ luật. `pickRecentGoals` chỉ trả mục tiêu ĐỦ DÀI, nên bấm cái nào cũng mở
              được nút ngay — gợi ý một chuỗi bấm vào vẫn không dùng được là một cái bẫy.
            */}
            {recentGoals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recentGoals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setPendingSessionGoal(goal)}
                    className="max-w-full truncate rounded-full px-2.5 py-1 text-[11px] transition-colors"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.08)',
                      border: '1px solid rgba(var(--accent-rgb), 0.18)',
                      color: 'var(--accent2)',
                    }}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            )}
            <div className="mt-2 flex items-start justify-between gap-3">
              <p className={`max-w-[32rem] text-[11px] leading-5 ${goalHintClass}`}>
                {sessionGoalHint(goalState, 'compact')}
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
      </div>
      )}

      {!immersiveMode && (
        <AnimatePresence initial={false}>
          {sessionReviewCard}
        </AnimatePresence>
      )}
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
        </div>

        <div className="mt-5">
          <RichNoteEditor
            value={pendingNote}
            onChange={(nextNote) => setPendingNote(trimRichTextToWordLimit(nextNote, NOTE_WORD_LIMIT))}
            rows={10}
            maxWords={NOTE_WORD_LIMIT}
            wordCount={noteWordCount}
            lightTheme={lightTheme}
            roomy
            inputStyle={{
              ...paperInputStyle,
              borderColor: lightTheme ? 'var(--line)' : 'rgba(255,255,255,0.08)',
              background: lightTheme ? 'rgba(255,255,255,0.76)' : 'rgba(255,255,255,0.03)',
              color: lightTheme ? 'var(--ink)' : 'var(--ink)',
            }}
            placeholder="Viết tự do. Một câu cũng được, một trang cũng được."
          />
        </div>
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
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${goalBadgeClass}`}>
            {sessionPrepStatusLabel}
          </span>
        </div>

        <textarea
          data-session-goal-field
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
          <p className={`max-w-[36rem] text-[12px] leading-[1.7] ${goalHintClass}`}>
            {sessionGoalHint(goalState, 'expanded')}
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
            <div
              className="mx-auto flex w-full max-w-[1180px] items-center justify-center"
              style={{ transform: fullScreenDesktopStageLift !== 0 ? `translateY(${fullScreenDesktopStageLift}px)` : undefined }}
            >
              {timerStageVisual}
            </div>
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

        {shouldDockFullScreenActions && (
          <div className="mx-auto flex w-full max-w-[960px] justify-center px-5 pb-8 pt-5 md:px-8 md:pb-10 md:pt-6 lg:px-10">
            {timerStageActions}
          </div>
        )}

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
      {...rootLayoutMotion}
    >
      {eraCrisis.active && (
        <motion.button
          {...crisisPulseMotion}
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
            <div className="mx-auto flex w-full max-w-[640px] flex-col items-center px-5 py-8 md:px-7 md:py-10" style={timerCardStyle}>
              {timerStageContent}
            </div>
          </div>
          {shortcutHint}
          {focusSupportContent}
        </>
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-[640px] flex-col items-center px-5 py-8 md:px-7 md:py-10" style={timerCardStyle}>
            {timerStageContent}
          </div>
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

      {!isActive && !isBreakMode && (
      <div className="w-full pt-4 sm:pt-5">
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
      )}

      {!prioritizeSetupCard && isIdle && !isBreakMode && sessionSetupCard}

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
  // NGOẠI LỆ (mang bố cục) — viên nền trượt từ tab cũ sang tab mới bằng `layoutId`. Vị trí của
  // nó CHÍNH LÀ tab đang chọn, nên bật Giảm chuyển động thì nó nhảy chứ không biến mất.
  const pillMotion = useSnapMotion({ transition: { type: 'spring', stiffness: 320, damping: 28 } });
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
                {...pillMotion}
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
  const pressMotion = usePressMotion();
  // NGOẠI LỆ (mang bố cục) — thẻ đang chọn được nhấc lên 1px; `y` chính là trạng thái "đang chọn".
  const liftMotion = useSnapMotion({ transition: { type: 'spring', stiffness: 360, damping: 28 } });
  // NGOẠI LỆ (mang bố cục) — vạch nhấn trượt sang thẻ mới bằng `layoutId`, cùng chuyện với ModeSwitch.
  const activeLineMotion = useSnapMotion({ transition: { type: 'spring', stiffness: 420, damping: 34 } });

  return (
    <div className={`grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-x-2.5 gap-y-3.5 sm:gap-2 ${className}`}>
      {QUICK_FOCUS_PRESETS.map((preset) => {
        const active = activePresetId === preset.id;

        return (
          <motion.button
            key={preset.id}
            layout
            type="button"
            disabled={disabled}
            aria-label={`Chọn preset ${preset.label}: ${preset.focusMinutes} phút tập trung`}
            onClick={() => onSelect(preset)}
            initial={false}
            // `animate` phải ở lại tại chỗ vì `active` chỉ có trong vòng lặp, không có ở tầng hook.
            animate={{ y: active ? -1 : 0 }}
            {...liftMotion}
            {...(disabled ? {} : pressMotion)}
            className={`relative min-w-0 overflow-hidden rounded-[20px] border px-3.5 py-4 text-left transition-colors touch-manipulation focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed sm:rounded-[18px] sm:px-3 sm:py-2.5 ${
              active
                ? lightTheme
                  ? 'border-[rgba(31,30,29,0.16)] bg-[rgba(238,234,227,0.99)] text-[var(--ink)] shadow-[0_10px_20px_rgba(31,30,29,0.05)] focus-visible:ring-[rgba(31,30,29,0.12)]'
                  : 'border-[rgba(var(--accent-rgb),0.20)] bg-white/[0.08] text-[var(--ink)] focus-visible:ring-white/30'
                : lightTheme
                  ? 'border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-2)] hover:bg-[rgba(250,249,246,0.98)] focus-visible:ring-[rgba(31,30,29,0.14)]'
                  : 'border-white/8 bg-white/[0.03] text-slate-400 hover:border-white/16 hover:text-slate-100 focus-visible:ring-white/30'
            }`}
          >
            {active && (
              <motion.span
                layoutId="quick-preset-active-line"
                className={`absolute inset-x-3 top-0 h-0.5 rounded-full ${
                  lightTheme ? 'bg-[var(--accent)]' : 'bg-[var(--accent-light)]'
                }`}
                {...activeLineMotion}
              />
            )}
            {/*
              ⚠️ XẾP DỌC Ở MỌI BỀ NGANG — ĐỪNG CHIA TRÁI–PHẢI. Bản trước chia đôi hàng ngang (số
              phút bên trái, tên + mô tả bên phải). Đo thật: thẻ này KHÔNG BAO GIỜ rộng, vì lưới
              là `minmax(120px,1fr)` và nó luôn nằm trong một cột hẹp — 390px cho thẻ ~131px, còn
              1280px thì thẻ nằm trong bảng "Thời lượng countdown" chỉ ~130px. Trừ đệm còn ~103px,
              số phút ăn ~33px + khoảng cách 8px ⇒ mô tả chỉ còn **60–65px**, trong khi "Vào việc
              nhanh" cần 77px và "Nhịp hằng ngày" cần 79px ⇒ hiện ra "Vào việc …", "Nhịp hằn…" —
              nhãn cố định viết sẵn trong mã bị cắt ngang từ, trông như app hỏng.
              ⚠️ ĐÃ THỬ cách vá theo breakpoint (`sm:flex-row`) và nó SAI: `sm:` hỏi bề ngang MÀN
              HÌNH, còn thứ quyết định ở đây là bề ngang CỦA THẺ. Hai đại lượng đó không liên quan
              nhau ở chỗ này — máy bàn 1280 lại cho thẻ HẸP HƠN điện thoại. Nên xếp dọc luôn.
              ⚠️ `truncate` KHÔNG được gỡ — nó vẫn là lưới an toàn cho những bề ngang chưa từng đo.
              Đo lại bằng: `node scripts/shot.mjs --fit --phone` (các dòng bắt đầu bằng "…").
            */}
            <span className="flex min-w-0 flex-col gap-0.5">
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
              <span className="min-w-0">
                <span className={`block truncate text-[11px] font-semibold leading-4 ${
                  active
                    ? lightTheme ? 'text-[var(--ink)]' : 'text-white'
                    : lightTheme ? 'text-[var(--ink)]' : 'text-slate-200'
                }`}>
                  {preset.label}
                </span>
                <span className={`block truncate text-[10px] leading-4 ${
                  active
                    ? lightTheme ? 'text-[var(--muted)]' : 'text-slate-300'
                    : lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'
                }`}>
                  {preset.description}
                </span>
              </span>
            </span>
            <span className="mt-3 flex flex-wrap gap-2 sm:mt-2.5 sm:gap-1.5">
              <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold tabular-nums ${
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
          </motion.button>
        );
      })}
    </div>
  );
}

function StrictModeToggle({ disabled, enabled, onChange }) {
  // NGOẠI LỆ (mang bố cục) — vị trí núm gạt CHÍNH LÀ bật/tắt. Bỏ `animate` đi thì núm kẹt bên trái
  // trong khi nền đã đổi màu sang "đang bật": người dùng đọc ra hai câu trả lời trái ngược nhau.
  const knobMotion = useSnapMotion({
    animate: { x: enabled ? 20 : 0 },
    transition: { type: 'spring', stiffness: 380, damping: 28 },
  });
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
          {...knobMotion}
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

function SessionReviewCard({ completedGoalAchieved, goalText, goalBonusXP = 0, goalBonusEP = 0, onPick }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const showGoalBonus = completedGoalAchieved === true && (goalBonusXP > 0 || goalBonusEP > 0);
  const bonusParts = [
    goalBonusXP > 0 ? `+${goalBonusXP} EXP` : null,
    goalBonusEP > 0 ? `+${goalBonusEP} EP` : null,
  ].filter(Boolean);
  const enterMotion = useEnterMotion();
  const rewardMotion = useRewardMotion();
  return (
    <motion.div
      {...enterMotion}
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
      {showGoalBonus && (
        <motion.p
          {...rewardMotion}
          className={`mt-3 text-center text-[13px] font-semibold ${lightTheme ? 'text-[var(--good)]' : 'text-emerald-300'}`}
        >
          🎯 Hoàn thành mục tiêu — thưởng {bonusParts.join(' · ')}
        </motion.p>
      )}
    </motion.div>
  );
}

function CancelConfirmDialog({ hasForgivenessCharge, onAbort, onConfirm, preview }) {
  const uiTheme = useSettingsStore((s) => s.uiTheme);
  const lightTheme = uiTheme === 'light';
  const enterMotion = useEnterMotion();
  const scrimMotion = useCustomMotion(SCRIM_FADE);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onAbort();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAbort]);

  return (
    <motion.div
      {...scrimMotion}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6"
      style={{ backgroundColor: 'rgba(31, 30, 29, 0.34)', backdropFilter: 'blur(10px)' }}
      onClick={onAbort}
    >
      <motion.div
        {...enterMotion}
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-session-dialog-title"
        onClick={(event) => event.stopPropagation()}
        className={`w-full max-w-md rounded-[30px] border p-5 ${
          lightTheme
            ? 'border-[rgba(201,100,66,0.22)] bg-white shadow-[0_24px_64px_rgba(31,30,29,0.10)]'
            : 'border-white/8 bg-[rgba(21,19,16,0.92)] shadow-[0_22px_56px_rgba(0,0,0,0.24)] backdrop-blur-2xl'
        }`}
      >
        <p
          id="cancel-session-dialog-title"
          className={`mono text-[11px] uppercase tracking-[0.22em] ${lightTheme ? 'text-[var(--accent2)]' : 'text-rose-300'}`}
        >
          Xác nhận hủy phiên
        </p>
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
    </motion.div>
  );
}

function CategoryManager({ categories, onClose, onAdd, onDelete }) {
  const enterMotion = useEnterMotion();
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
      {...enterMotion}
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

/**
 * ActionButton — nút hành động chuẩn của app.
 *
 * ⚠️ MÀU ĐỌC TỪ TOKEN, KHÔNG RẼ NHÁNH THEO `lightTheme`. Bản cũ khai hai bảng màu cứng (một cho
 * sáng, một cho tối) với mã màu chốt thẳng vào chuỗi lớp — nên **đổi skin không đổi được nút**:
 * app có 5 skin × 2 chế độ = 10 tổ hợp, mà bảng cứng chỉ biết 2. Nay mỗi biến thể chỉ trỏ tới
 * token; token đã tự đổi theo CẢ skin lẫn chế độ sáng/tối, nên nút đi theo miễn phí. Vì vậy
 * component này KHÔNG còn đọc `useSettingsStore` nữa — nó không cần biết đang ở chế độ nào.
 *
 * ⚠️ BÓNG LÀ BÓNG ĐẶC (`0 4px 0 0`), KHÔNG PHẢI BÓNG MỜ. Bóng mờ nhiều lớp làm nút trông như một
 * thẻ giấy đang trôi; một vạch đặc dày 4px dưới đáy làm nó trông như một PHÍM BẤM có chiều dày.
 * Cả cảm giác bấm nằm ở chỗ đó: `whileTap` hạ nút xuống **đúng 4px** — bằng chiều dày vạch —
 * đồng thời `active:shadow-none` xoá vạch, nên mép dưới của nút đứng yên tại chỗ và mắt đọc ra
 * "nút vừa lún xuống chạm mặt bàn". Lệch hai con số ấy là hỏng hiệu ứng.
 *
 * ⚠️ VÌ SAO BÓNG XOÁ BẰNG CSS `active:` CHỨ KHÔNG BẰNG `whileTap: { boxShadow }` — đây là cái bẫy
 * đắt nhất ở đây. Framer Motion animate `boxShadow` bằng cách ghi một **style inline đã resolve**
 * (`var(--line-2)` bị thay bằng mã màu cụ thể tại thời điểm chạm). Style inline thắng mọi lớp CSS,
 * và nó ở lại sau khi animation kết thúc ⇒ nút sẽ **đóng băng màu bóng của skin cũ**: đổi skin
 * xong, mọi nút đã từng được bấm vẫn giữ bóng cũ, mà không có gì đỏ lên. Dùng `active:` thì `var()`
 * còn sống, nên bóng luôn đi theo skin. Framer chỉ lo `y` — thứ không chứa màu.
 *
 * ⚠️ `transition` CHỈ LIỆT KÊ THUỘC TÍNH CSS THẬT SỰ SỞ HỮU. Bản cũ dùng `transition-all`, mà
 * `all` bao gồm `transform` — thứ Framer đang tự animate bằng vòng lặp riêng của nó. Hai bên cùng
 * điều khiển một thuộc tính thì trình duyệt phải nội suy lại từng giá trị Framer ghi ra, và cú bấm
 * thành nhão. Bỏ `transform` khỏi danh sách thì cú lún đanh lại.
 */
/** Bật Giảm chuyển động thì trải cái này SAU `whileHover`/`whileTap` để xoá cả hai — xem chú thích dưới. */
const ACTION_BUTTON_STILL = Object.freeze({ whileHover: undefined, whileTap: undefined });

function ActionButton({ children, className = '', disabled = false, onClick, size = 'default', title, variant = 'soft', ...motionProps }) {
  const reduceMotion = useReducedMotion();
  // Bóng đặc dày ĐÚNG bằng quãng lún của `whileTap` bên dưới. Đổi một con số thì phải đổi cả hai.
  const themeMap = {
    primary: 'border-transparent bg-[var(--ink)] text-[var(--canvas)] shadow-[0_4px_0_0_var(--line-2)]',
    accent: 'border-transparent bg-[var(--accent)] text-white shadow-[0_4px_0_0_var(--accent2)]',
    soft: 'border-[var(--line-2)] bg-[var(--card-bg-solid)] text-[var(--ink)] shadow-[0_4px_0_0_var(--line-2)]',
    // `--accent-soft` chưa skin nào khai (2026-08-27) nên hôm nay fallback luôn là đường chạy thật.
    // Giữ nguyên lối `var(a, b)` để skin nào muốn có nền nhấn riêng thì chỉ cần khai thêm token.
    info: 'border-transparent bg-[var(--accent-soft,var(--card-bg-solid2))] text-[var(--accent-ink)] shadow-[0_4px_0_0_var(--line-2)]',
    // ⚠️ `danger` PHẢI LÙI VỀ SAU, KHÔNG ĐƯỢC NỔI (đổi 2026-08-29). Bản cũ dùng nền ĐẶC
    // (`--card-bg-solid2`) + chữ `--ink` đen đậm, tức nặng hơn cả `soft` đứng ngay cạnh — nên trên
    // màn hình phiên đang chạy, "Hủy phiên" là nút HÚT MẮT NHẤT trong ba nút. Mà nó là hành động
    // phá hoại: mất toàn bộ tiến độ phiên VÀ chịu phạt tài nguyên (`DISASTER_*_PENALTY_RATE`).
    // Thứ tự thị giác phải khớp thứ tự hậu quả. Nay: nền trong, viền nhạt, chữ `--muted` — vẫn tìm
    // ra ngay khi cần, nhưng thôi mời gọi. KHÔNG tô đỏ rực: đỏ cũng là một cách để nổi nhất, chỉ
    // đổi từ "mời gọi" sang "doạ", mà cả hai đều kéo mắt khỏi cái đồng hồ.
    danger: 'border-[var(--line-2)] bg-transparent text-[var(--muted)] shadow-[0_4px_0_0_var(--line-2)]',
  };

  // ⚠️ MỖI `size` LÀ MỘT BỘ TRỌN VẸN, CỐ Ý — đừng "gọn hơn" bằng cách để nơi gọi chồng thêm lớp.
  // `sizeMap[size] ?? sizeMap.default` chỉ phát ra ĐÚNG MỘT bộ, nên không có hai lớp nào cùng khai
  // một thuộc tính để mà tranh nhau. Dự án không có `tailwind-merge`, và Tailwind quyết lớp nào
  // thắng theo thứ tự trong BẢNG KIỂU chứ không theo thứ tự viết trong `className` — đã có một lần
  // thua mà không hay biết (xem chú thích ở nút "Cần điền mục tiêu"). Cần cỡ khác ⇒ THÊM một mục
  // vào đây. Có test canh: `components/actionButtonSizing.test.js`.
  const sizeMap = {
    default: 'px-7 py-3.5 text-lg font-bold leading-none whitespace-nowrap',
    // Cho HÀNG 4–5 NÚT lúc phiên đang chạy: mỗi nút chỉ được ~70px nên phải bóp rất mạnh.
    compactMobile: 'min-w-0 w-full px-1 py-2.5 text-[10px] font-semibold leading-[1.05] tracking-[-0.03em] whitespace-normal sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold sm:leading-none sm:tracking-normal sm:whitespace-nowrap',
    // Cho HÀNG 2 NÚT lúc chưa bắt đầu. Đo thật ở 390px: nút chính được **186px** — rộng gấp 2,7
    // lần một ô của hàng 4–5 nút, nên dùng `compactMobile` ở đây là bóp chữ xuống 10px một cách
    // không cần thiết cho nút QUAN TRỌNG NHẤT màn hình. 13px vẫn vừa (đo lại sau khi đổi), lại
    // trên ngưỡng cỡ chữ dễ đọc trên điện thoại.
    compactPrimary: 'min-w-0 w-full px-3 py-3 text-[13px] font-semibold leading-tight tracking-[-0.01em] whitespace-normal sm:w-auto sm:px-7 sm:py-3.5 sm:text-lg sm:font-bold sm:leading-none sm:tracking-normal sm:whitespace-nowrap',
  };

  return (
    <motion.button
      type="button"
      disabled={disabled}
      title={title}
      data-variant={variant}
      // Nhấc nhẹ 1px + sáng lên 6%: đủ để biết con trỏ đang ở đâu, không đủ để chữ nhoè.
      // (Bản cũ dùng `scale: 1.03` — phóng to cả khối làm chữ bị nội suy lại nên MỜ đi đúng lúc
      // người dùng đang nhìn vào nó.)
      whileHover={disabled ? undefined : { y: -1 }}
      whileTap={disabled ? undefined : { y: 4 }}
      // ⚠️ NGOẠI LỆ CÓ LÝ DO — nút này KHÔNG dùng nhịp `press` (scale 0,97) của `motionPresets.js`.
      // Cú lún `y: 4` không phải một lựa chọn mỹ thuật rời rạc: nó BẰNG ĐÚNG chiều dày vạch bóng
      // đặc bên dưới, nên khi bấm thì nút hạ xuống đúng bằng vạch rồi vạch tắt đi ⇒ mép dưới đứng
      // yên và mắt đọc ra "lún chạm mặt bàn". `actionButtonPress.test.js` khoá cứng quan hệ ấy,
      // và cùng bài test cấm `scale` trong `whileHover` (phóng to làm chữ nhoè). Một nhịp `press`
      // dùng `scale` sẽ vừa phá quan hệ lún↔bóng vừa mất luôn hiệu ứng bóng đặc của skin.
      // Trải SAU hai dòng trên nên nó THẮNG: bật Giảm chuyển động là nút đứng yên hoàn toàn.
      // (Phải ghi đè chứ không gộp vào hai dòng trên, vì bài test khoá NGUYÊN VĂN dòng `whileTap`.)
      {...(reduceMotion ? ACTION_BUTTON_STILL : null)}
      onClick={onClick}
      // ⚠️ `disabled:shadow-none` chứ KHÔNG phải `shadow-none` trần. Lớp trần có cùng độ đặc hiệu
      // (0,1,0) với `shadow-[0_4px…]` của biến thể, nên ai thắng là do THỨ TỰ trong bảng kiểu
      // Tailwind quyết — hôm nay đo được `.shadow-none` tình cờ đứng sau nên nó thắng, nhưng đó là
      // một sự trùng hợp, không phải một luật. `:disabled` nâng độ đặc hiệu lên (0,2,0) nên nó
      // thắng bất kể thứ tự. Cùng lý do với `active:shadow-none`. (Đây đúng là cái canh bạc mà
      // chú thích của `sizeMap` ngay trên đã cảnh báo — chỉ khác là ở thuộc tính `box-shadow`.)
      className={`inline-flex max-w-full items-center justify-center rounded-2xl border text-center transition-[background-color,border-color,color,box-shadow,filter] duration-150 disabled:shadow-none ${
        sizeMap[size] ?? sizeMap.default
      } ${
        themeMap[variant] ?? themeMap.soft
      } ${
        disabled
          ? 'cursor-not-allowed opacity-45'
          : 'hover:brightness-[1.06] active:shadow-none'
      } ${className}`}
      {...motionProps}
    >
      {children}
    </motion.button>
  );
}
