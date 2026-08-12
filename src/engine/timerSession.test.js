import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BREAK_START_DELAY_MS,
  CONTINUED_POMODORO_CONFIRM_SECONDS,
  TIMER_MODES,
  getContinuedPomodoroConfirmUntilSeconds,
  getContinuedPomodoroOvertimeSeconds,
  getCreditedFocusMinutes,
  getNextContinuedPomodoroConfirmUntilSeconds,
  getWorkedMinutesForBreak,
  resolveContinueAfterPomodoro,
  shouldContinuePomodoroAsStopwatch,
  shouldHoldContinuedPomodoroForConfirmation,
  shouldInferContinuedPomodoroSession,
  shouldStartBreakAfterCompletion,
} from './timerSession.js';
import { GROWTH_MOMENT_MS } from './cityMoment.js';

test('continue-after-Pomodoro is resolved from the running session before settings fallback', () => {
  assert.equal(resolveContinueAfterPomodoro({ continueAfterPomodoro: true }, false), true);
  assert.equal(resolveContinueAfterPomodoro({ continueAfterPomodoro: false }, true), false);
  assert.equal(resolveContinueAfterPomodoro({}, true), true);
});

test('Pomodoro only switches to stopwatch when the session flag is on and countdown ended', () => {
  assert.equal(shouldContinuePomodoroAsStopwatch({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 0,
  }), true);

  assert.equal(shouldContinuePomodoroAsStopwatch({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 1,
  }), false);

  assert.equal(shouldContinuePomodoroAsStopwatch({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 0,
    isPaused: true,
  }), false);
});

test('continued Pomodoro credits the full elapsed session length', () => {
  const elapsedMs = 51 * 60_000;
  const creditedMinutes = getCreditedFocusMinutes({
    mode: TIMER_MODES.STOPWATCH,
    elapsedMs,
    targetSeconds: 25 * 60,
  });

  assert.equal(creditedMinutes, 51);
  assert.equal(getWorkedMinutesForBreak({
    mode: TIMER_MODES.STOPWATCH,
    elapsedMs,
    creditedMinutes,
  }), 51);
});

test('regular Pomodoro never credits beyond its target', () => {
  assert.equal(getCreditedFocusMinutes({
    mode: TIMER_MODES.POMODORO,
    elapsedMs: 51 * 60_000,
    targetSeconds: 25 * 60,
  }), 25);
});

test('Pomodoro completion respects auto-start break and disable-break settings', () => {
  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.POMODORO,
    autoStartBreak: true,
    disableBreak: false,
  }), true);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.POMODORO,
    autoStartBreak: false,
    disableBreak: false,
  }), false);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.POMODORO,
    autoStartBreak: true,
    disableBreak: true,
  }), false);
});

test('Stopwatch-style completion starts break after manual completion unless breaks are disabled', () => {
  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: false,
    disableBreak: false,
  }), true);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: false,
    disableBreak: true,
  }), false);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: true,
    disableBreak: false,
  }), true);

  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: true,
    disableBreak: true,
  }), false);
});

test('continued Pomodoro uses Stopwatch-style break completion policy', () => {
  assert.equal(shouldStartBreakAfterCompletion({
    mode: TIMER_MODES.STOPWATCH,
    autoStartBreak: false,
    disableBreak: false,
  }), true);
});

test('continued Pomodoro asks for confirmation after each 15 minute overtime window', () => {
  const targetSeconds = 25 * 60;
  const firstConfirmUntil = getContinuedPomodoroConfirmUntilSeconds({}, targetSeconds);

  assert.equal(firstConfirmUntil, targetSeconds + CONTINUED_POMODORO_CONFIRM_SECONDS);
  assert.equal(getContinuedPomodoroOvertimeSeconds(firstConfirmUntil, targetSeconds), 15 * 60);
  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    displaySeconds: firstConfirmUntil - 1,
    confirmUntilSeconds: firstConfirmUntil,
  }), false);
  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    displaySeconds: firstConfirmUntil,
    confirmUntilSeconds: firstConfirmUntil,
  }), true);

  assert.equal(
    getNextContinuedPomodoroConfirmUntilSeconds(firstConfirmUntil, targetSeconds),
    targetSeconds + (CONTINUED_POMODORO_CONFIRM_SECONDS * 2),
  );
});

test('continued Pomodoro confirmation state only applies to continued stopwatch sessions', () => {
  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: false,
    displaySeconds: 60 * 60,
    confirmUntilSeconds: 30 * 60,
  }), false);

  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 60 * 60,
    confirmUntilSeconds: 30 * 60,
  }), false);

  assert.equal(shouldHoldContinuedPomodoroForConfirmation({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    displaySeconds: 60 * 60,
    confirmUntilSeconds: null,
  }), false);
});

test('legacy stopwatch restore can be inferred as continued Pomodoro from configured mode', () => {
  assert.equal(shouldInferContinuedPomodoroSession({
    mode: TIMER_MODES.STOPWATCH,
    configuredMode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: false,
    displaySeconds: 41 * 60,
    targetSeconds: 25 * 60,
  }), true);

  assert.equal(shouldInferContinuedPomodoroSession({
    mode: TIMER_MODES.STOPWATCH,
    configuredMode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: false,
    displaySeconds: 41 * 60,
    targetSeconds: 25 * 60,
  }), false);

  assert.equal(shouldInferContinuedPomodoroSession({
    mode: TIMER_MODES.STOPWATCH,
    configuredMode: TIMER_MODES.POMODORO,
    continueAfterPomodoro: true,
    displaySeconds: 41 * 60,
    targetSeconds: 25 * 60,
  }), false);
});

test('NHỊP MỘT PHIÊN: lễ mừng KHÔNG được tính vào giờ nghỉ', () => {
  // ⚠️ LỊCH SỬ CỦA BÀI TEST NÀY — đọc để đừng vô tình quay ngược.
  // Bản đầu (Phase 3P) là bài "CHỐT NỢ": lúc đó `BREAK_START_DELAY_MS` còn là 500 ms trong khi lễ
  // mừng chiếm 3 200 ms, nên đồng hồ nghỉ chạy 2 700 ms TRƯỚC KHI lễ mừng kết thúc. Nợ đã ghi ở
  // `TECH_DEBT.md` #12 và bài test chỉ chặn cho nó khỏi phình to.
  // Nay (Phase 3Q) nợ ĐÃ TRẢ: độ trễ vào nghỉ nâng lên cho phủ trọn lễ mừng, nên bài test đổi từ
  // "chốt mức nợ" sang khẳng định BẤT BIẾN THẬT.
  //
  // Bất biến: **đồng hồ nghỉ không được bắt đầu đếm trước khi lễ mừng kết thúc.** Người dùng chưa
  // nghỉ khi còn đang xem phần thưởng của mình; tính khoảng đó vào giờ nghỉ là bắt họ trả tiền cho
  // chính phần thưởng của họ.
  //
  // ⚠️ Hai hằng số CỐ Ý không import lẫn nhau (tầng đồng hồ không được phụ thuộc tầng thành phố —
  // đồng hồ phải chạy đúng cả khi không có lễ mừng nào). Ràng buộc giữa chúng sống ở ĐÂY.
  assert.ok(BREAK_START_DELAY_MS >= GROWTH_MOMENT_MS,
    `đồng hồ nghỉ bắt đầu sau ${BREAK_START_DELAY_MS} ms trong khi lễ mừng còn chạy tới `
    + `${GROWTH_MOMENT_MS} ms ⇒ ${GROWTH_MOMENT_MS - BREAK_START_DELAY_MS} ms đầu của giờ nghỉ bị `
    + 'lễ mừng ăn mất. Xem TECH_DEBT.md #12 trước khi nới ngưỡng này.');

  // Ba chốt chặn để bất biến trên không bao giờ được "thoả" bằng cách phá thứ khác — rút lễ mừng
  // về 0 cũng làm nó đúng, nhưng lúc đó lễ mừng coi như không còn.
  assert.ok(GROWTH_MOMENT_MS >= 2000,
    `lễ mừng chỉ còn ${GROWTH_MOMENT_MS} ms — ngắn tới mức không kịp nhìn thấy thành phố lớn lên`);
  assert.ok(GROWTH_MOMENT_MS <= 3500,
    `lễ mừng ${GROWTH_MOMENT_MS} ms vượt trần 3,5 s của kế hoạch — chen ngang chứ không còn là thưởng`);
  // Và không được kéo dài vô tội vạ: chờ quá lâu mới vào nghỉ thì thành đứng hình.
  assert.ok(BREAK_START_DELAY_MS <= GROWTH_MOMENT_MS + 800,
    `chờ ${BREAK_START_DELAY_MS} ms mới bắt đầu nghỉ — dài hơn lễ mừng quá nhiều, màn hình như treo`);
});
