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

test('NHỊP MỘT PHIÊN: lễ mừng đang bị tính vào giờ nghỉ — bài test này CHỐT khoảng lệch lại', () => {
  // ⚠️ ĐÂY LÀ BÀI TEST "CHẶN NỢ PHÌNH TO", KHÔNG PHẢI BÀI TEST "MỌI THỨ ĐÃ ĐÚNG".
  // Sự thật hiện tại: phiên nghỉ bắt đầu đếm sau `BREAK_START_DELAY_MS` = 500 ms, trong khi lễ
  // mừng "thành phố lớn lên" chiếm sóng `GROWTH_MOMENT_MS` = 3 200 ms rồi mới tới hộp phần thưởng.
  // ⇒ đồng hồ nghỉ chạy 2 700 ms TRƯỚC KHI lễ mừng kết thúc, rồi chạy tiếp suốt lúc Đàm đọc hộp
  // phần thưởng. Tức **phần thưởng cho việc vừa làm xong đang bị trừ vào thời gian nghỉ.**
  //
  // Vì sao không sửa luôn ở đây: đổi `BREAK_START_DELAY_MS` là đổi HÀNH VI ĐỒNG HỒ trên app
  // production, mà `useTimer.js` là hot spot và hiện chưa có lưới test hành vi (`TECH_DEBT.md` #13).
  // Hai phương án đã ghi ở `TECH_DEBT.md` #12 và cần Đàm chọn — không phải việc AI tự quyết.
  //
  // Vậy bài test này làm gì? Nó CHỐT khoảng lệch ở mức hiện tại. Nợ kỹ thuật nguy hiểm nhất là nợ
  // âm thầm lớn lên: chỉ cần ai đó kéo dài lễ mừng (thêm màn mở khoá kỷ mới, thêm thành tích...)
  // là khoảng bị trừ tăng theo mà không một dấu hiệu nào. Có bài này thì lần đó sẽ ĐỎ, và người
  // sửa buộc phải đọc `TECH_DEBT.md` #12 rồi ra quyết định TỈNH TÁO thay vì vô tình làm nặng thêm.
  const stolenMs = GROWTH_MOMENT_MS - BREAK_START_DELAY_MS;

  assert.ok(stolenMs <= 2700,
    `khoảng bị trừ vào giờ nghỉ đã tăng lên ${stolenMs} ms (trước là 2700). `
    + 'Ai đó vừa kéo dài lễ mừng hoặc rút ngắn độ trễ vào nghỉ. Đọc TECH_DEBT.md #12 TRƯỚC khi '
    + 'nới ngưỡng này — nới cho qua chính là cách khoản nợ đó lớn lên mà không ai biết.');

  // Hai chốt chặn cơ bản, để bài trên không bao giờ được "thoả" bằng cách làm hỏng thứ khác:
  // rút lễ mừng về 0 thì `stolenMs` cũng nhỏ đi, nhưng lúc đó lễ mừng coi như không còn.
  assert.ok(GROWTH_MOMENT_MS >= 2000,
    `lễ mừng chỉ còn ${GROWTH_MOMENT_MS} ms — ngắn tới mức không kịp nhìn thấy thành phố lớn lên`);
  assert.ok(GROWTH_MOMENT_MS <= 3500,
    `lễ mừng ${GROWTH_MOMENT_MS} ms vượt trần 3,5 s của kế hoạch — chen ngang chứ không còn là thưởng`);
  assert.ok(BREAK_START_DELAY_MS > 0,
    'độ trễ vào nghỉ bằng 0 ⇒ phiên nghỉ đá vào đúng lúc màn hình đang chuyển trạng thái');
});
