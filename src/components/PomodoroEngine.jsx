import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { tomTatThietLap } from './pomodoroSetupSummary.js';
import { AnimatePresence, motion } from 'framer-motion';

import { useCustomMotion, useEnterMotion, useSnapMotion } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { pushNow } from '../lib/syncService';
import useSettingsStore from '../store/settingsStore';
import { useTimer, formatTime, TIMER_MODES, TIMER_STATES } from '../hooks/useTimer';
import { getDailyGoalProgress, suggestSessionLength } from '../engine/gameMath';
import { getVietnamHour, localDateStr } from '../engine/time';
import { FLOWTIME_BREAK_RULES, QUICK_FOCUS_PRESETS, getBreakPlan } from '../engine/breaks';

import {
  DEFAULT_DEEP_FOCUS_THRESHOLD,
  WARMUP_REDUCED_THRESHOLD,
  BREAK_EXTENSION_MINUTES,
  COMBO_BONUS_PER_STACK,
  COMBO_MAX_STACKS,
  VUNG_DONG_CHAY_MIN_MIN,
  Y_CHI_THEP_RETENTION,
  BAT_KHUAT_DISASTER_XP_PENALTY,
  PHUC_HOI_MIN_MINUTES,
  SU_THA_THU_MIN_MINUTES,
} from '../engine/constants';
import { RichNoteEditor } from './RichText';
import { countRichTextWords, trimRichTextToWordLimit } from '../utils/richText';
import {
  GOAL_SUGGESTION_LIMIT,
  deriveSessionGoalState,
  pickRecentGoals,
  sessionGoalHint,
} from './sessionGoalState';
import SessionBrickStrip from './focus/SessionBrickStrip';
import ActionButton from './shared/ActionButton';
import { clampFocusMinutes, parseFocusMinutesInput, getSessionWorkedMinutes } from '../engine/timerSession';
import ModeSwitch from './focus/ModeSwitch';
import QuickPresets from './focus/QuickPresets';
import StrictModeToggle from './focus/StrictModeToggle';
import CategoryChip from './focus/CategoryChip';
import SessionReviewCard from './focus/SessionReviewCard';
import CancelConfirmDialog from './focus/CancelConfirmDialog';
import CategoryManager from './focus/CategoryManager';
import useMinWidth from '../hooks/useMinWidth';
import { isEditableShortcutTarget, isSpaceKeyEvent } from '../lib/keyboard';

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
  // Bảng thiết lập GẤP LẠI mặc định — xem chú thích ở `sessionSetupCard`.
  const [setupOpen, setSetupOpen] = useState(false);
  const [focusMinutesDraft, setFocusMinutesDraft] = useState(() => (
    String(clampFocusMinutes(timerConfig.focusMinutes ?? 25))
  ));
  const [isEditingFocusMinutes, setIsEditingFocusMinutes] = useState(false);
  const [extendButtonGrace, setExtendButtonGrace] = useState(null);
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

  // ADR-069: thử thách kỷ nguyên không còn chặn nút Bắt đầu — nó là một nhiệm vụ mềm kể trong
  // chuỗi thẻ thưởng và ở màn Tiến trình.
  const handleStartSession = useCallback(() => {
    if (isOnBreak || timerState !== TIMER_STATES.IDLE) return false;
    start();
    return true;
  }, [isOnBreak, start, timerState]);

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

  const currentSessionTargetMinutes = Math.max(1, Math.round(totalSeconds / 60));
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
  const isSessionGoalValid = goalState.isReady;
  const sessionPrepStatusLabel = goalState.badgeLabel;
  // Tông → class. Ô trống ở theme sáng nay dùng đúng màu chữ phụ như mọi dòng chỉ dẫn khác; ở theme
  // tối thì nhánh "chưa đủ" vốn đã trung tính sẵn, nên chỉ cần tách riêng nhánh sáng.
  const goalBadgeClass = goalState.tone === 'good'
    ? lightTheme
      ? 'border border-[rgba(91,122,82,0.18)] bg-[rgba(229,236,223,0.92)] text-[var(--good)]'
      : 'border border-[rgba(var(--accent-rgb),0.18)] bg-white/[0.05] text-[var(--accent-light)]'
    : goalState.tone === 'warn'
      ? lightTheme
        ? 'border border-[rgba(var(--accent-rgb),0.14)] bg-[rgba(var(--accent-rgb),0.08)] text-[var(--accent2)]'
        : 'border border-white/8 bg-white/[0.05] text-[var(--muted)]'
      : lightTheme
        ? 'border border-[var(--line)] bg-[var(--panel-soft)] text-[var(--muted)]'
        : 'border border-white/8 bg-white/[0.05] text-[var(--muted)]';
  // ⚠️ CHỈ GỢI Ý KHI Ô CÒN TRỐNG. Đang gõ dở mà mọc ra mấy cái chip thì chúng vừa che chỗ vừa mời
  // vứt bỏ thứ vừa gõ. Đây là lối tắt cho lúc bắt đầu, không phải một bảng chọn thường trực.
  // ⚠️ KHÔNG bọc `useMemo`: React Compiler từ chối tối ưu cả component khi thấy memo hoá thủ công
  // mà nó không bảo toàn được ("Existing memoization could not be preserved") — đổi lấy một phép
  // tính vốn đã rẻ (duyệt lịch sử và DỪNG sau 3 kết quả) là một cái giá tệ. Để compiler tự lo.
  // ADR-077: one-tap goals, same task type first. Shown in the goal card only while the box is empty.
  const recentGoals = sessionGoalText.trim() ? [] : pickRecentGoals(sessionHistory, GOAL_SUGGESTION_LIMIT, { preferCategoryId: pendingCategoryId });

  const goalHintClass = goalState.tone === 'warn'
    ? lightTheme ? 'font-semibold text-[var(--accent2)]' : 'font-semibold text-red-300'
    : lightTheme ? 'text-[var(--muted)]' : 'text-slate-500';
  const showSessionReview = Boolean(lastCompletedSessionId && completedSessionReview && !isActive);
  const completedGoalAchieved = completedSessionReview?.goalAchieved ?? null;
  const reviewGoalText = completedSessionReview?.goal?.trim() || sessionGoalText;
  const completedSessionWorkedMinutes = getSessionWorkedMinutes(completedSessionReview);
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
        ? 'radial-gradient(circle, rgba(var(--accent-rgb),0.08) 0%, rgba(var(--accent-rgb),0.03) 38%, rgba(var(--accent-rgb),0) 72%)'
        : 'radial-gradient(circle, rgba(96,165,250,0.14) 0%, rgba(96,165,250,0.06) 36%, rgba(96,165,250,0) 70%)')
      : (lightTheme
        ? 'radial-gradient(circle, rgba(var(--accent-rgb),0.07) 0%, rgba(var(--accent-rgb),0.025) 38%, rgba(var(--accent-rgb),0) 72%)'
        : 'radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.05) 36%, rgba(56,189,248,0) 70%)')
    : isActive
      ? (lightTheme
        ? 'radial-gradient(circle, rgba(var(--accent-rgb),0.10) 0%, rgba(var(--accent-rgb),0.035) 38%, rgba(var(--accent-rgb),0) 72%)'
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

  // ADR-069 (2026-09-06): cả cụm dự báo «phạt N%–M% tài nguyên» khi huỷ ĐÃ GỠ — tài nguyên rời đường
  // chơi, hộp thoại thảm hoạ đã xoá, nên hộp xác nhận huỷ chỉ còn nói sự thật còn lại: phiên huỷ
  // không tính XP/EP, và nếu có kỹ năng Ý Chí thì phiên kế được bù.
  const cancelRecoveryHint = useMemo(() => {
    if (unlockedSkills.phuc_hoi) return `Phục Hồi: phiên kế ≥${PHUC_HOI_MIN_MINUTES}′ nhận thêm XP và EP.`;
    if (unlockedSkills.su_tha_thu) return `Sự Tha Thứ: phiên kế ≥${SU_THA_THU_MIN_MINUTES}′ nhận thêm XP.`;
    return null;
  }, [unlockedSkills.phuc_hoi, unlockedSkills.su_tha_thu]);

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

  // NGOẠI LỆ (mang bố cục) — bề ngang và khoảng cách của cả khối khi đổi bố cục chuyên chú.
  const rootLayoutMotion = useSnapMotion({
    animate: { maxWidth: immersiveRootMaxWidth, gap: useImmersiveHeroLayout ? 46 : immersiveMode ? 38 : 34 },
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
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
  // ⚠️ CHỈ HIỆN KHI CHU KỲ ĐÃ CHẠY (2026-09-01). Ở `cyclePos === 0` dòng này là bốn chấm rỗng,
  // chữ "0/4", và một nút "đặt lại" cho một chu kỳ chưa bắt đầu — không mẩu tin nào. Tệ hơn, đo ở
  // khung 390px thì nó nằm y=754…779 trong khi thanh điều hướng bắt đầu ở 774 ⇒ **nút "đặt lại"
  // bị cắt mất 5px**, và nó ăn đúng vào 32px biên an toàn của nút chính.
  const cycleIndicator = !isBreakMode && !isStopwatchMode && longBreakAfterN > 1 ? (() => {
    const completedCyclePos = Math.max(0, (sessionsCompleted - longBreakCycleStart) % longBreakAfterN);
    const cyclePos = longBreakPreviewSession
      ? Math.min(longBreakAfterN, completedCyclePos + 1)
      : completedCyclePos;
    if (cyclePos <= 0) return null;
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
        {/* ⚠️ Bỏ chữ "N/4": bốn cái chấm cách nó 10px đã nói đúng điều ấy, mà chấm thì LIẾC
            được còn con số thì phải ĐỌC. Hai chỗ nói cùng một chuyện thì chỗ nói ít hơn nhường. */}
        <button
          type="button"
          onClick={resetLongBreakCycle}
          title="Reset chu kỳ nghỉ dài"
          aria-label="Reset chu kỳ nghỉ dài"
          className={`rounded-full px-2.5 py-1 text-[10px] transition-all focus-visible:outline-none focus-visible:ring-2 ${
            lightTheme
              ? 'border border-[var(--line)] bg-white text-[var(--muted)] hover:border-[var(--line-2)] hover:text-[var(--ink)] focus-visible:ring-[rgba(var(--accent-rgb),0.22)]'
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
          {/* ⚠️ ĐÃ GỠ câu "Chọn mode, thời lượng và mức kỷ luật trước khi bắt đầu." (41px, vòng 20).
              Nhãn "THIẾT LẬP PHIÊN" ngay trên đã trả lời xong, và ba thứ câu ấy liệt kê thì đứng
              ngay bên dưới nó, mỗi thứ đã có nhãn riêng. Nó còn chứa chữ "mode" — tiếng Anh trong
              một app tiếng Việt của một người không đọc tiếng Anh. */}
        </div>
        <ModeSwitch
          disabled={timerState !== TIMER_STATES.IDLE || isBreakMode}
          mode={isActive ? runtimeTimerMode : timerMode}
          onChange={switchMode}
        />
      </div>

      {/*
        ⚠️ GẤP LẠI PHẦN THIẾT LẬP (2026-09-02). Đo trên khung 390px: màn Tập trung dài **2.509px**
        và **~1.100px trong đó là bảng thiết lập** — công tắc Pomo/Bấm giờ, ô chỉnh phút, BỐN thẻ
        mẫu (15'/25'/52'/90'), giờ nghỉ, kỷ luật phiên. Nó mở sẵn ở MỌI lần vào màn, trong khi Đàm
        bắt đầu phiên bằng cùng một thiết lập gần như mọi lần: một bảng chỉnh chiếm gần một nửa
        màn hình chính để phục vụ một hành động hiếm.
        ⚠️ KHÔNG GIẤU, CHỈ GẤP: dòng tóm tắt ngay đây NÓI ĐỦ thiết lập đang chạy (chế độ · số phút ·
        giờ nghỉ · kỷ luật), nên không cần mở ra mới biết mình sắp làm gì — cùng luật đã áp cho
        102 huy hiệu chưa chạm tới. Bấm "Đổi" là mở, và nó vẫn mở nguyên bảng cũ, không cắt gì.
      */}
      <button
        type="button"
        onClick={() => setSetupOpen((v) => !v)}
        aria-expanded={setupOpen}
        className={`flex w-full items-center justify-between gap-3 border-t px-4 py-3 text-left transition-colors ${
          lightTheme ? 'border-[var(--line)]' : 'border-white/5'
        }`}
      >
        <span className="mono min-w-0 truncate text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
          {tomTatThietLap({
            mode: timerMode,
            focusMinutes: timerConfig.focusMinutes,
            shortBreak: shortBreakDuration,
            longBreak: longBreakDuration,
            strict: strictMode,
          })}
        </span>
        <span className="mono shrink-0 text-[10px] uppercase tracking-[0.18em]" style={{ color: 'var(--accent2)' }}>
          {setupOpen ? 'Thu gọn ▲' : 'Đổi ▾'}
        </span>
      </button>

      {setupOpen && (
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
              {/* ⚠️ Ở chế độ Pomo, câu "Thời lượng countdown của phiên kế tiếp." đã bị GỠ (vòng 20):
                  nhãn "TẬP TRUNG" cộng chính con số "25 PHÚT" ngay bên cạnh đã nói đủ, và câu ấy
                  còn chứa chữ "countdown". Chế độ Bấm giờ thì GIỮ — ở đó con số là một MỐC THAM
                  CHIẾU chứ không phải thời lượng đếm ngược, và không có gì khác nói ra điều đó. */}
              {isStopwatchMode && (
                <p className={`mt-1 text-xs ${lightTheme ? 'text-[var(--muted)]' : 'text-slate-500'}`}>
                  Dùng để neo mốc thưởng khi bấm giờ.
                </p>
              )}
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
                    Chế độ Bấm giờ tự đổi giờ nghỉ theo đúng thời lượng bạn vừa làm.
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
      )}
    </div>
  );
  const timerStageVisual = (
    <>
      {/*
        ADR-077 — "this session's brick" sits where the milestone toast and the combo/multiplier
        badges used to: same height budget, one story instead of two numbers. Hidden on the break
        stage and in full screen (that mode is empty by design).
      */}
      {!fullScreenMode && !isBreakMode && (
        <SessionBrickStrip
          phase={isActive ? 'running' : 'idle'}
          progressRatio={isActive ? (progressPct ?? 0) / 100 : 0}
        />
      )}

      {!useMinimalFocusStage && isBreakMode && (
        <motion.div
          {...enterMotion}
          className={`flex items-center gap-2 px-4 py-2 rounded-2xl border ${
            breakIsLong
              ? lightTheme
                ? 'bg-[rgba(255,247,237,0.96)] border-[rgba(var(--accent-rgb),0.18)] text-[var(--accent2)]'
                : 'bg-white/[0.05] border-white/8 text-[var(--ink)]'
              : lightTheme
                ? 'bg-[rgba(255,247,237,0.96)] border-[rgba(var(--accent-rgb),0.18)] text-[var(--accent2)]'
                : 'bg-white/[0.05] border-white/8 text-[var(--ink)]'
          }`}
        >
          <span className="text-sm font-bold">
            {breakIsLong ? 'Giải lao dài' : 'Giải lao ngắn'}
          </span>
        </motion.div>
      )}

      {/*
        ⚠️ TRẦN THEO BỀ NGANG MÀN HÌNH, KHÔNG PHẢI ĐỔI CỠ ĐỒNG HỒ (2026-08-30).
        Đo trên khung 390px thật: nút Bắt đầu nằm ở y=779..822 trong khi thanh tab NỔI bắt đầu ở
        y=774 ⇒ **nút chính của cả app bị thanh tab che**, và Đàm phải cuộn mới bấm được thứ anh mở
        app ra để bấm. Sau khi đã thu hết khoảng trắng quanh đồng hồ (36px) vẫn còn thiếu 48px, mà
        thứ duy nhất còn đủ lớn để nhường là chính vòng đồng hồ (298px = 76% bề ngang máy).
        ⚠️ VÌ SAO LÀ `min()` CHỨ KHÔNG PHẢI MỘT HẰNG SỐ NHỎ HƠN: hằng số thì thu đồng hồ ở MỌI khổ
        màn hình, kể cả nơi không hề thiếu chỗ — tức trả giá ở chỗ không có vấn đề. Cái trần này
        chỉ cắn khi bề ngang < 466px; từ đó trở lên `timerCanvasSize` thắng và mọi thứ y như cũ.
        ⚠️ 64vw → 58vw (vòng 20, 2026-08-30). Đo lại trên tài khoản đã chơi lâu thì nút VẪN bị
        che: khối chào là `${lời chào}. ${biến thể theo ngày}` với 8 biến thể, nên có ngày nó dài
        2 dòng, có ngày 3 dòng — chênh 26px. Ở ngày dài, nút xuống y=757…799 trong khi thanh tab
        bắt đầu ở y=774. Tức trần cũ chỉ đủ cho NGÀY NGẮN, và một cái trần chỉ đúng vào ngày may
        mắn thì không phải một cái trần. 58vw ở 390px cho ra 226px — vẫn là thứ to nhất màn hình,
        và trần chỉ cắn khi bề ngang < 514px nên máy bàn không đổi một điểm ảnh nào.
        ⚠️ `minHeight` PHẢI dùng CÙNG biểu thức: nó là chỗ giữ sẵn chiều cao, nên nếu chỉ thu cái
        vòng mà quên nó thì khoảng trống vẫn bị giữ nguyên và không được một điểm ảnh nào.
      */}
      <div
        className="relative mt-2 flex w-full items-center justify-center sm:mt-5 md:mt-1"
        style={{ minHeight: `min(${timerFootprintHeight}px, 58vw)` }}
      >
        <motion.div
          className="relative flex shrink-0 items-center justify-center"
          {...timerScaleMotion}
          style={{ width: `min(${timerCanvasSize}px, 58vw)`, height: `min(${timerCanvasSize}px, 58vw)` }}
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
            width="100%"
            height="100%"
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
              {/*
                ⚠️ "Sẵn sàng" TỪNG NÓI DỐI. Nhãn này hiện ở MỌI trạng thái chờ, kể cả khi app đang
                từ chối bắt đầu vì chưa đủ mục tiêu — tức giữa vòng đồng hồ ghi "SẴN SÀNG" trong
                khi cách đó ~200px cái nút ghi "Điền mục tiêu →". Hai câu trên cùng một màn hình
                nói ngược nhau, và cái to hơn là cái sai.
                Bấm giờ tự do không có cổng mục tiêu nên nó luôn sẵn sàng thật.
              */}
              {!isBreakMode && timerState === TIMER_STATES.IDLE && (
                isStopwatchMode
                  ? 'Sẵn sàng bấm giờ'
                  : 'Sẵn sàng'
              )}
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
            {/*
              ⚠️ MỤC TIÊU PHIÊN TỪNG BIẾN MẤT ĐÚNG LÚC CẦN NHẤT (2026-09-02). App BẮT BUỘC gõ ≥10
              ký tự mới cho bấm "Bắt đầu" — rồi giấu ngay câu ấy đi suốt 25 phút sau đó. Đo trên
              mã: mọi chỗ render mục tiêu đều nằm trong khối `isIdle` (dòng 1763) hoặc trong
              `fullScreenNotebook`, và dòng 982 còn hạ cả thẻ chuẩn bị xuống `opacity-25
              pointer-events-none` khi `!isIdle`. Tức KHÔNG có một chỗ nào gác theo `isActive`.
              Hậu quả: cái cổng bắt Đàm trả lời "phiên này chốt xong việc gì?" thu tiền xong thì
              vứt câu trả lời đi, đúng lúc câu ấy phải làm việc — nửa chừng phiên, khi đầu bắt đầu
              trôi. Nó biến một lời hứa với chính mình thành một thủ tục.
              Đặt TRONG vòng đồng hồ vì đó là chỗ mắt đã nhìn sẵn; nếu để ở thẻ dưới thì lại rơi
              xuống dưới nếp gấp đúng như ô nhập cũ.
              ⚠️ `line-clamp-2` chứ không `truncate`: một mục tiêu thật thường dài hơn một dòng,
              cắt còn một dòng thì đọc ra một câu cụt — mà câu cụt thì tệ hơn không có câu.
            */}
            {!isBreakMode && !isIdle && sessionGoalText && (
              <span
                className="mt-2 line-clamp-2 max-w-[15rem] text-center text-[12px] italic leading-snug"
                style={{ color: 'var(--muted)' }}
                title={sessionGoalText}
              >
                {sessionGoalText}
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
      : `mt-2 flex w-full items-start justify-center md:mt-4 ${immersiveMode ? 'min-h-[104px]' : 'min-h-[52px]'}`
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
              className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:w-auto sm:gap-3"
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
                ADR-077: the goal is optional, so the idle row is ONE full-width primary button — no
                "Điền mục tiêu →" detour, no chip row stealing the 3px above the tab bar. Recent goals
                are one tap away in the goal card just below the fold.
              */}
              <ActionButton
                onClick={handleStartSession}
                variant="primary"
                size="compactPrimary"
                className={compactTimerActionButtonClassName}
                title="Bắt đầu phiên tập trung"
              >
                Bắt đầu phiên
              </ActionButton>
              {/*
                ⚠️ ĐÃ GỠ nút "Toàn màn hình" Ở NHÁNH CHỜ (2026-09-01) — hai bản lúc ĐANG CHẠY và
                lúc TẠM DỪNG còn nguyên. Đo ở khung 390px: nó chiếm **112/308px = 36,4%** hàng nút
                chính, và vì nhãn hai chữ "Toàn màn hình" XUỐNG DÒNG ở cột 112px nên chính nó
                QUYẾT ĐỊNH chiều cao 59px của cả hàng — tức nút quan trọng nhất màn hình đang cao
                bằng một nhãn bị vỡ dòng của một nút phụ.
                Không mất tính năng: vào toàn màn hình TRƯỚC khi bấm Bắt đầu thì vẫn phải bấm Bắt
                đầu ở màn kia, mà toàn màn hình sinh ra để tập trung TRONG lúc chạy.
                Nút chính nay lấy trọn bề ngang — vùng chạm lớn hơn cho đúng thứ Đàm mở app để bấm.
              */}
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
                  Toàn màn hình
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
                      Toàn màn hình
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
      {/*
        ⚠️ THỨ TỰ HAI KHỐI NÀY ĐÃ ĐẢO (2026-09-01), VÀ ĐÓ LÀ MỘT LỖI BỐ CỤC CÓ SỐ ĐO.
        Ô "Mục tiêu phiên" là thứ BẮT BUỘC (10 ký tự, không có nó thì nút Bắt đầu không bật), còn
        "Ghi chú phiên" là một accordion TUỲ CHỌN đang đóng. Vậy mà cái tuỳ chọn lại nằm CHEN GIỮA
        nút bấm và cái bắt buộc. Đo ở khung 390×844 thật: nút chính ở y=661, ô mục tiêu ở **y=934**
        — tức dưới nếp gấp (thanh điều hướng bắt đầu ở y=774) đúng **160px**.
        Hậu quả: mỗi lần muốn tập trung, Đàm phải bấm "Điền mục tiêu →" (một nút chỉ để CUỘN), gõ,
        rồi cuộn ngược lên bấm "Bắt đầu". Ba thao tác cho việc quan trọng nhất của cả app, mỗi
        phiên một lần, mãi mãi.
        ⚠️ LUẬT KHÔNG BỊ NỚI — vẫn phải đủ 10 ký tự. Thứ bị gỡ là quãng ĐI LẠI, không phải cái cổng.
      */}
      {isIdle && !isBreakMode && (
      <div className="w-full px-3.5 py-3 backdrop-blur-2xl bg-white/[0.045] border border-white/[0.10] shadow-[0_12px_28px_rgba(15,23,42,0.10)]" style={{ borderRadius: 'var(--skin-radius-card, 18px)', ...paperCardStyle }}>
        <div className="flex items-start justify-between gap-3 px-0.5">
          <div className="min-w-0">
            {/*
              ⚠️ HAI ĐOẠN VĂN ĐÃ BỊ GỠ Ở ĐÂY (vòng 20, 2026-08-30) — thẻ này từng nói ĐÚNG MỘT ĐIỀU
              tới NĂM lần trong 250px, ở màn hình Đàm mở nhiều nhất:
                1. "Chốt một đích đến rõ ràng trước khi bấm bắt đầu…"   (4 dòng, 80px)  ← GỠ
                2. huy hiệu "Bắt buộc" + nhãn "Mục tiêu phiên"                            ← giữ
                3. "Viết kết quả cần chốt trong phiên này…"             (3 dòng, 59px)  ← GỠ
                4. placeholder "Ví dụ: chốt outline, giải xong 3 bài…"                    ← giữ
                5. `sessionGoalHint` ngay dưới ô nhập                                     ← giữ
              Ba cái ở lại là ba cái NÓI THÊM được: nhãn nói *bắt buộc*, placeholder cho VÍ DỤ để
              bắt chước (cụ thể hơn hẳn hai đoạn đã gỡ), và dòng gợi ý nằm ĐÚNG CHỖ SẮP GÕ. Hai
              cái gỡ đi chỉ diễn đạt lại tên của chính cái ô ngay dưới chúng.
              ⚠️ Vế "Ghi chú cho lần sau chỉ để giữ mạch chuyển tiếp" của đoạn 1 còn là hướng dẫn
              cho một Ô KHÁC (accordion "Ghi chú phiên" ở phía trên, đang đóng) — luật chỉ dùng lúc
              sắp hành động thì phải nói NGAY TẠI chỗ hành động, không nói ở đầu một thẻ khác.
            */}
            {/*
              ⚠️ HAI NHÃN NỮA ĐÃ GỠ (2026-09-01) — thẻ này nói ĐÚNG MỘT ĐIỀU tới BỐN lần trong
              ~170px, ngay trên nếp gấp của màn hình Đàm mở nhiều nhất:
                1. eyebrow "CHUẨN BỊ PHIÊN"                                          ← GỠ
                2. chip trạng thái "Chưa đặt mục tiêu"                                ← GỠ
                3. huy hiệu "BẮT BUỘC" + nhãn "MỤC TIÊU PHIÊN" + bộ đếm "0/10"        ← giữ
                4. câu "Phiên này bạn định chốt xong việc gì? Viết một dòng từ 10 ký tự…" ← giữ
              (1) là TÊN CỦA THẺ, mà thẻ này chỉ chứa đúng một thứ và thứ ấy đã tự xưng tên ngay
              dưới ("MỤC TIÊU PHIÊN"). (2) là trạng thái, mà bộ đếm "0/10" ở cách đó 40px nói cùng
              điều ấy VÀ có mẫu số — nó cho biết còn bao xa, cái chip thì không.
              ⚠️ VÌ SAO ĐÁNG GỠ, KHÔNG PHẢI VÌ GỌN: ô nhập bắt buộc này nằm ở y=873 trong khi thanh
              điều hướng bắt đầu ở y=774 — nó ở DƯỚI nếp gấp, nên mỗi phiên Đàm phải bấm một nút
              chỉ-để-cuộn rồi cuộn ngược lại. Mỗi ~40px lấy lại được ở đây là 40px đưa ô ấy lên
              chỗ nhìn thấy.
            */}
          </div>
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
                  Tuỳ chọn
                </span>
                <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                  <span className={`mono text-xs font-semibold uppercase tracking-wide ${
                    lightTheme ? 'text-[var(--accent)]' : 'text-[var(--accent-light)]'
                  }`}>
                    Mục tiêu phiên
                  </span>
                </div>
              </div>
            </div>
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
            {/* ADR-077: one-tap goals — same task type first (`pickRecentGoals`), tap to fill, never auto-filled. */}
            {recentGoals.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {recentGoals.map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setPendingSessionGoal(goal)}
                    className="max-w-full truncate rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors"
                    style={{
                      background: 'rgba(var(--accent-rgb), 0.10)',
                      border: '1px solid rgba(var(--accent-rgb), 0.30)',
                      color: 'var(--accent2)',
                    }}
                    title="Dùng lại mục tiêu này"
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
                      ? 'border border-[rgba(var(--accent-rgb),0.14)] text-[var(--accent2)] hover:bg-[rgba(var(--accent-rgb),0.08)] focus-visible:ring-[rgba(31,30,29,0.14)]'
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
          value={pendingSessionGoal}
          onChange={(e) => setPendingSessionGoal(e.target.value)}
          rows={3}
          placeholder="Ví dụ: chốt outline, viết xong phần mở đầu, giải xong 3 bài..."
          className="mt-5 w-full rounded-[24px] border px-4 py-3.5 text-[15px] leading-[1.7] resize-none focus:outline-none transition-colors"
          style={{
            ...paperGoalInsetStyle,
            borderColor: lightTheme ? 'rgba(var(--accent-rgb),0.18)' : 'rgba(255,255,255,0.08)',
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
                  ? 'border border-[rgba(var(--accent-rgb),0.14)] text-[var(--accent2)] hover:bg-[rgba(var(--accent-rgb),0.08)] focus-visible:ring-[rgba(31,30,29,0.14)]'
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
              onAbort={() => setShowCancelConfirm(false)}
              onConfirm={handleConfirmCancel}
              progressPct={progressPct}
              recoveryHint={cancelRecoveryHint}
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
            onAbort={() => setShowCancelConfirm(false)}
            onConfirm={handleConfirmCancel}
            progressPct={progressPct}
              recoveryHint={cancelRecoveryHint}
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
                      ? 'border border-[var(--line)] bg-white text-[var(--muted)] hover:text-[var(--ink)] focus-visible:ring-[rgba(var(--accent-rgb),0.22)]'
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

      {/* ADR-069: `StakePanel` (Tăng lực phiên — cược 5% EP) ĐÃ GỠ khỏi màn chờ: một quyết định
          mang khung "thua thì mất" đặt ngay trước nút Bắt đầu, ở màn tồn tại để bấm Bắt đầu.
          Store `staking` giữ nguyên, chỉ không còn lối vào. */}
    </Motion.div>
  );
}
