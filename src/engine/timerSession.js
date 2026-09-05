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
 *
 * ⚠️⚠️ ĐÍNH CHÍNH 2026-09-01 — TIỀN ĐỀ CỦA ĐOẠN NGAY TRÊN ĐÃ CHẾT, VÀ NÓ CHẾT DO HAI BẢN VÁ Ở
 * CHỖ KHÁC, KHÔNG DO AI ĐỘNG VÀO FILE NÀY.
 *   · ADR-060 (2026-08-27) làm phiên thường THÔI tự mở hộp phần thưởng — nay chỉ còn một thẻ
 *     toast nhỏ ở góc.
 *   · Vòng 22 (2026-08-31) siết lễ mừng thành phố xuống CHỈ khi có công trình vừa xong.
 * Đo lại: `sessionsToComplete` qua 15 kỷ cho trung bình **5,60 phiên mỗi công trình ⇒ lễ mừng
 * chỉ chạy ở ~17,9% số phiên**. Tức câu "cả hai trường hợp người dùng đều đang nhìn hộp phần
 * thưởng" nay SAI ở khoảng 82% số phiên: ở đó không có lễ mừng nào để che, mà màn hình vẫn giữ
 * trạng thái vừa-xong thêm 3,2 giây trước khi chuyển sang nghỉ. Trên fixture 588 phiên hoàn
 * thành, đó là **31,4 phút** chờ trong 180 ngày.
 *
 * ⚠️ CỐ Ý CHƯA ĐỔI CON SỐ, và đây là một quyết định chứ không phải một chỗ bỏ sót:
 *   (a) đường đúng là làm độ trễ THEO chính thứ nó sinh ra để che (3 200 khi có lễ mừng, 500 khi
 *       không) — tức một QUAN HỆ, không phải một hằng số; nhưng
 *   (b) nó đụng thẳng vào luồng tự-vào-nghỉ, nơi một sai lầm sẽ ÂM THẦM ăn bớt giờ nghỉ thật của
 *       Đàm; và
 *   (c) khoảnh khắc ấy **KHÔNG chụp ảnh kiểm được trên bản dev** — `ui` không nằm trong
 *       `partialize` nên không gieo được bằng `--fixture`, và cấm bấm "Bắt đầu" trên dev (dùng
 *       chung một hàng Supabase với bản thật).
 * Đổi một hành vi đồng hồ mà KHÔNG quan sát được nó là đúng thứ phải hỏi Đàm trước.
 * Ghi ở `TECH_DEBT` và ở báo cáo vòng 23.
 */
export const BREAK_START_DELAY_MS = 3200;

/**
 * Độ trễ khi KHÔNG có lễ mừng nào để che. 500ms là giá trị đã chạy đúng suốt thời kỳ trước khi
 * có lễ mừng thành phố — không phải một con số mới chọn tay.
 */
export const BREAK_START_DELAY_QUICK_MS = 500;

/**
 * ⚠️ ĐỘ TRỄ VÀO NGHỈ PHẢI THEO CHÍNH THỨ NÓ CHE (2026-09-02, đóng `TECH_DEBT #94`).
 *
 * `BREAK_START_DELAY_MS = 3200` là một HẰNG SỐ, còn thứ nó sinh ra để che là một BIẾN — và chú
 * thích cũ biện minh cho nó bằng câu *"cả hai trường hợp người dùng đều đang nhìn hộp phần
 * thưởng"*. Câu ấy chết do HAI bản vá ở chỗ khác, không do ai động vào file này:
 *   · ADR-060 làm phiên thường thôi TỰ mở hộp phần thưởng;
 *   · vòng 22 siết lễ mừng thành phố xuống CHỈ khi có công trình vừa xong.
 * Đo `sessionsToComplete` qua 15 kỷ: trung bình **5,60 phiên mỗi công trình ⇒ lễ mừng chỉ chạy ở
 * 17,9% số phiên**. Tức ~82% số phiên đứng chờ 3,2 giây trước một màn hình không có gì diễn ra —
 * trên fixture 588 phiên là **31,4 phút** chờ vô ích trong 180 ngày.
 *
 * Đây là bẫy Phase 7D ở tầng thời gian: *một con số tuyệt đối không diễn đạt được một luật nói
 * về QUAN HỆ*. Luật thật là "chờ đủ lâu để xem hết lễ mừng", mà "lễ mừng" thì có hoặc không.
 */
export function breakStartDelayMs(hasCelebration) {
  return hasCelebration ? BREAK_START_DELAY_MS : BREAK_START_DELAY_QUICK_MS;
}

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
