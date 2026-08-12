export const TIMER_MODES = {
  POMODORO: 'pomodoro',
  STOPWATCH: 'stopwatch',
};

export const TIMER_END_REASONS = {
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RESET: 'reset',
};

export const CONTINUED_POMODORO_CONFIRM_SECONDS = 15 * 60;

/**
 * Phiên xong → chờ bao lâu rồi mới cho phiên NGHỈ bắt đầu đếm (mili-giây).
 *
 * ⚠️ ĐÃ ĐỔI 500 → 3 200 (2026-08-12). ĐÂY LÀ THAY ĐỔI HÀNH VI, ĐỌC KỸ TRƯỚC KHI ĐỘNG VÀO.
 * 500 ms là con số có từ TRƯỚC khi có lễ mừng — hồi đó nó chỉ cần đủ để màn hình kịp chuyển trạng
 * thái. Nhưng từ Phase 4′, giữa "phiên xong" và "Đàm thật sự bắt đầu nghỉ" còn chen vào lễ mừng
 * 3 200 ms rồi mới tới hộp phần thưởng. Hệ quả đo được: đồng hồ nghỉ chạy **2 700 ms trước khi lễ
 * mừng kết thúc**, rồi chạy tiếp suốt lúc đọc hộp phần thưởng — khoảng 8–18 giây trên một phiên
 * nghỉ 5 phút. Con số không lớn; điều sai là VỀ NGUYÊN TẮC: **phần thưởng cho việc vừa làm xong
 * đang bị trừ vào thời gian nghỉ.** Lễ mừng là tiền công, không phải khoản người dùng tự trả.
 *
 * ⚠️ VÌ SAO KHÔNG `import { GROWTH_MOMENT_MS }` TỪ `cityMoment.js` CHO KHỎI TRÙNG SỐ.
 * Vì đó sẽ là tầng ĐỒNG HỒ phụ thuộc tầng THÀNH PHỐ — đồng hồ phải chạy đúng kể cả khi không có
 * thành phố nào (và lễ mừng CHỈ xuất hiện khi có công trình tiến triển). Ràng buộc giữa hai số
 * được canh bằng BÀI TEST (`timerSession.test.js`, bài "NHỊP MỘT PHIÊN") chứ không bằng import —
 * đúng chỗ để một ràng buộc xuyên tầng nên nằm.
 *
 * ⚠️ ĐÁNH ĐỔI ĐÃ CÂN NHẮC: những phiên KHÔNG có lễ mừng nay cũng chờ 3,2 s mới vào nghỉ. Chấp nhận
 * được vì cả hai trường hợp người dùng đều đang nhìn hộp phần thưởng, không nhìn đồng hồ; và vì
 * lệch về phía "được nghỉ đủ" thì an toàn hơn lệch về phía "bị ăn bớt".
 * Muốn quay lại: đổi đúng dòng dưới về 500 (bài test sẽ ĐỎ và nhắc lại toàn bộ lý do ở trên).
 */
export const BREAK_START_DELAY_MS = 3200;

export function resolveContinueAfterPomodoro(timerSession = {}, fallback = false) {
  if (typeof timerSession?.continueAfterPomodoro === 'boolean') {
    return timerSession.continueAfterPomodoro;
  }

  return Boolean(fallback);
}

export function getContinuedPomodoroOvertimeSeconds(displaySeconds = 0, targetSeconds = 0) {
  return Math.max(0, Math.floor(displaySeconds) - Math.max(0, Math.floor(targetSeconds)));
}

export function getContinuedPomodoroConfirmUntilSeconds(
  timerSession = {},
  targetSeconds = 0,
  windowSeconds = CONTINUED_POMODORO_CONFIRM_SECONDS,
) {
  const safeTargetSeconds = Math.max(0, Math.floor(targetSeconds));
  const safeWindowSeconds = Math.max(1, Math.floor(windowSeconds));
  const fallbackUntilSeconds = safeTargetSeconds + safeWindowSeconds;
  const persistedUntilSeconds = Number(timerSession?.continuedPomodoroConfirmedUntilSeconds);

  return Number.isFinite(persistedUntilSeconds) && persistedUntilSeconds > safeTargetSeconds
    ? Math.floor(persistedUntilSeconds)
    : fallbackUntilSeconds;
}

export function getNextContinuedPomodoroConfirmUntilSeconds(
  currentUntilSeconds = 0,
  targetSeconds = 0,
  windowSeconds = CONTINUED_POMODORO_CONFIRM_SECONDS,
) {
  const safeCurrentUntilSeconds = Number.isFinite(Number(currentUntilSeconds))
    ? Math.max(0, Math.floor(Number(currentUntilSeconds)))
    : 0;
  const safeTargetSeconds = Math.max(0, Math.floor(targetSeconds));
  const safeWindowSeconds = Math.max(1, Math.floor(windowSeconds));

  return Math.max(safeCurrentUntilSeconds, safeTargetSeconds) + safeWindowSeconds;
}

export function shouldContinuePomodoroAsStopwatch({
  mode = TIMER_MODES.POMODORO,
  continueAfterPomodoro = false,
  displaySeconds = 0,
  isPaused = false,
} = {}) {
  return mode === TIMER_MODES.POMODORO
    && continueAfterPomodoro === true
    && !isPaused
    && displaySeconds <= 0;
}

export function shouldInferContinuedPomodoroSession({
  mode = TIMER_MODES.STOPWATCH,
  configuredMode = TIMER_MODES.POMODORO,
  continueAfterPomodoro = false,
  displaySeconds = 0,
  targetSeconds = 0,
} = {}) {
  const safeDisplaySeconds = Number(displaySeconds);
  const safeTargetSeconds = Number(targetSeconds);

  return mode === TIMER_MODES.STOPWATCH
    && configuredMode === TIMER_MODES.POMODORO
    && continueAfterPomodoro !== true
    && Number.isFinite(safeDisplaySeconds)
    && Number.isFinite(safeTargetSeconds)
    && safeTargetSeconds > 0
    && safeDisplaySeconds > safeTargetSeconds;
}

export function shouldHoldContinuedPomodoroForConfirmation({
  mode = TIMER_MODES.STOPWATCH,
  continueAfterPomodoro = false,
  displaySeconds = 0,
  confirmUntilSeconds = Infinity,
} = {}) {
  const safeDisplaySeconds = Number(displaySeconds);
  const safeConfirmUntilSeconds = Number(confirmUntilSeconds);

  return mode === TIMER_MODES.STOPWATCH
    && continueAfterPomodoro === true
    && confirmUntilSeconds != null
    && Number.isFinite(safeDisplaySeconds)
    && Number.isFinite(safeConfirmUntilSeconds)
    && safeDisplaySeconds >= safeConfirmUntilSeconds;
}

export function shouldStartBreakAfterCompletion({
  mode = TIMER_MODES.POMODORO,
  disableBreak = false,
  autoStartBreak = false,
} = {}) {
  if (disableBreak) return false;
  return autoStartBreak || mode === TIMER_MODES.STOPWATCH;
}

export function getCreditedFocusMinutes({
  mode = TIMER_MODES.POMODORO,
  elapsedMs = 0,
  targetSeconds = 0,
} = {}) {
  const elapsedMinutes = Math.max(1, Math.round(Math.max(0, elapsedMs) / 60_000));
  const targetMinutes = Math.max(1, Math.round(Math.max(0, targetSeconds) / 60));

  return mode === TIMER_MODES.STOPWATCH
    ? elapsedMinutes
    : Math.min(targetMinutes, elapsedMinutes);
}

export function getWorkedMinutesForBreak({
  mode = TIMER_MODES.POMODORO,
  elapsedMs = 0,
  creditedMinutes = 0,
} = {}) {
  return mode === TIMER_MODES.STOPWATCH
    ? Math.max(0, elapsedMs / 60_000)
    : Math.max(0, creditedMinutes);
}
