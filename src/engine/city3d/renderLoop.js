/**
 * renderLoop.js — bộ điều phối khung hình cho cảnh 3D. THUẦN: `requestAnimationFrame` và đồng hồ
 * đều được TRUYỀN VÀO, nên toàn bộ luật ở đây test được bằng `node --test` không cần trình duyệt.
 *
 * ⚠️ VÌ SAO KHÔNG DÙNG `renderer.setAnimationLoop`: cách thường thấy là chạy một vòng lặp 60 lần/
 * giây mãi mãi rồi bên trong kiểm tra cờ "có gì đổi không, không thì thôi". Vòng lặp đó **vẫn đánh
 * thức CPU 60 lần mỗi giây** kể cả khi thành phố đứng yên tuyệt đối — với một app mà Đàm mở suốt
 * phiên 25 phút trên iPhone, đó là ăn pin không đổi lấy gì. Ở đây: đứng yên ⇒ **không một nhịp
 * rAF nào tồn tại**, không phải "có nhịp nhưng không vẽ".
 *
 * Hai chế độ:
 *   • `invalidate()`   — "có gì đó đổi, vẽ lại MỘT khung". Gọi 100 lần trong cùng một nhịp cũng
 *                        chỉ ra đúng một khung hình (gộp lại).
 *   • sustained        — "đang có hoạt hoạ thật" (kéo camera, mưa rơi, lễ mừng). ĐẾM THAM CHIẾU
 *                        bằng token, nên nhiều hoạt hoạ chạy chồng nhau không ai tắt nhầm của ai.
 *
 * ⚠️ FPS chỉ đo TRONG chế độ sustained. Lúc đứng yên không có khung hình nào — đo sẽ ra 0 và
 * watchdog sẽ hạ xuống 2D một cách oan uổng. Đây là cái bẫy chính của render-on-demand.
 */

/** Cửa sổ gộp mẫu FPS (ms) — đủ dài để ổn định, đủ ngắn để watchdog phản ứng kịp. */
export const FPS_SAMPLE_MS = 1000;

/** Dưới ngưỡng này, đủ số lần liên tiếp, thì coi như máy không kham nổi 3D. */
export const SLOW_FPS_THRESHOLD = 24;
export const SLOW_SAMPLES_TO_GIVE_UP = 3;

/**
 * @param {object} deps
 * @param {Function} deps.render        vẽ đúng MỘT khung hình
 * @param {Function} deps.requestFrame  `requestAnimationFrame`
 * @param {Function} deps.cancelFrame   `cancelAnimationFrame`
 * @param {Function} deps.now           đồng hồ ms (`performance.now`)
 * @param {Function} [deps.onSlow]      gọi khi máy chậm dai dẳng → nên hạ về 2D
 * @param {Function} [deps.onError]     gọi khi `render` ném lỗi (vòng lặp tự dừng, không quay vòng lỗi)
 */
export function createRenderLoop({ render, requestFrame, cancelFrame, now, onSlow, onError }) {
  let handle = null;
  let stopped = false;
  const sustained = new Set();

  // Số liệu cho HUD
  let fps = 0;
  let lastFrameMs = 0;
  let framesRendered = 0;
  let windowStart = null;
  let windowFrames = 0;
  let slowStreak = 0;
  let gaveUp = false;

  function resetSampleWindow() {
    windowStart = null;
    windowFrames = 0;
  }

  function schedule() {
    if (stopped || handle !== null) return;
    handle = requestFrame(tick);
  }

  function measure(startedAt) {
    lastFrameMs = now() - startedAt;
    framesRendered += 1;

    // Ngoài sustained thì các khung hình rời rạc, cách nhau tuỳ hứng — gộp chúng lại thành "FPS"
    // là vô nghĩa. Bỏ cửa sổ đang đo dở luôn, đừng để nó rò sang lần sustained kế tiếp.
    if (sustained.size === 0) {
      resetSampleWindow();
      return;
    }

    if (windowStart === null) {
      windowStart = startedAt;
      windowFrames = 0;
    }
    windowFrames += 1;

    const elapsed = startedAt - windowStart;
    if (elapsed < FPS_SAMPLE_MS) return;

    fps = (windowFrames * 1000) / elapsed;
    windowStart = startedAt;
    windowFrames = 0;

    if (fps >= SLOW_FPS_THRESHOLD) {
      slowStreak = 0;
      return;
    }
    slowStreak += 1;
    if (slowStreak >= SLOW_SAMPLES_TO_GIVE_UP && !gaveUp) {
      gaveUp = true;                 // chỉ báo MỘT lần, không gọi lặp mỗi giây
      onSlow?.({ fps, samples: slowStreak });
    }
  }

  function tick() {
    handle = null;
    if (stopped) return;

    const startedAt = now();
    try {
      render();
    } catch (error) {
      // Vòng lặp lỗi là thứ tệ nhất có thể xảy ra ở đây: nó sẽ ném lỗi 60 lần mỗi giây và làm
      // treo máy. Dừng hẳn, để tầng trên quyết định lùi về 2D.
      stop();
      onError?.(error);
      return;
    }
    measure(startedAt);

    if (sustained.size > 0) schedule();
  }

  function invalidate() {
    schedule();
  }

  /** Bắt đầu một hoạt hoạ. `token` là chuỗi bất kỳ, dùng để tắt đúng cái mình đã bật. */
  function beginSustained(token) {
    if (stopped) return;
    sustained.add(token);
    schedule();
  }

  /**
   * Kết thúc một hoạt hoạ. KHÔNG huỷ khung hình đang chờ — cứ để nó vẽ nốt một lần rồi vòng lặp
   * tự tắt. Huỷ ngay sẽ để lại cảnh dở dang ở khung hình áp chót.
   */
  function endSustained(token) {
    sustained.delete(token);
    if (sustained.size === 0) resetSampleWindow();
  }

  /**
   * Dừng VĨNH VIỄN. Dùng khi tháo cảnh (unmount, mất context) — sau lời gọi này mọi yêu cầu vẽ
   * đều bị bỏ qua, vì canvas/WebGL context có thể đã bị huỷ.
   * ⚠️ KHÔNG dùng cho việc rời tab — xem `pause`.
   */
  function stop() {
    stopped = true;
    if (handle !== null) cancelFrame(handle);
    handle = null;
    sustained.clear();
    resetSampleWindow();
  }

  /**
   * Tạm dừng và QUAY LẠI ĐƯỢC. Dùng khi người dùng chuyển sang tab khác hoặc khoá màn hình.
   *
   * ⚠️ Mọi hoạt hoạ đang chạy bị BỎ, không giữ lại: nếu người dùng đang kéo camera rồi chuyển
   * tab, ngón tay họ không còn trên màn hình nữa — giữ lại token "đang kéo" sẽ khiến lúc quay lại
   * vòng lặp chạy liên tục mà không ai điều khiển, ăn pin cho tới khi tắt tab.
   */
  function pause() {
    if (handle !== null) cancelFrame(handle);
    handle = null;
    sustained.clear();
    resetSampleWindow();
  }

  /** Quay lại sau `pause`. Vẽ đúng MỘT khung để cảnh hiện lại đúng trạng thái hiện tại. */
  function resume() {
    if (stopped) return;
    slowStreak = 0;      // số đo lúc bị treo nền không phản ánh máy — đừng để nó cộng dồn
    schedule();
  }

  return {
    invalidate,
    beginSustained,
    endSustained,
    pause,
    resume,
    stop,
    /** Có nhịp rAF nào đang tồn tại không — dùng để TEST bất biến "đứng yên = 0 nhịp". */
    isIdle: () => handle === null && sustained.size === 0,
    isSustained: () => sustained.size > 0,
    getStats: () => ({
      fps: Math.round(fps),
      lastFrameMs: Math.round(lastFrameMs * 10) / 10,
      framesRendered,
      sustained: sustained.size,
    }),
  };
}
