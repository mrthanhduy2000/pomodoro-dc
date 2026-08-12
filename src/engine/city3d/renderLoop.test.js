/**
 * renderLoop.test.js — khoá bất biến pin của cảnh 3D.
 *
 * Bất biến số 1 (**lý do file này tồn tại**): thành phố đứng yên ⇒ **không một nhịp rAF nào**.
 * Không phải "có nhịp nhưng bỏ qua không vẽ" — mà là không có nhịp. Đây là khác biệt giữa việc
 * mở tab Thành Phố suốt phiên 25 phút mà máy vẫn mát, và việc nó âm thầm ăn pin cả buổi.
 *
 * Bất biến số 2: FPS **chỉ** đo trong lúc có hoạt hoạ. Đo lúc đứng yên sẽ ra 0 và watchdog hạ
 * xuống 2D oan — đúng cái bẫy mà render-on-demand tự tạo ra cho chính nó.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createRenderLoop,
  FPS_SAMPLE_MS,
  SLOW_FPS_THRESHOLD,
  SLOW_SAMPLES_TO_GIVE_UP,
} from './renderLoop.js';

/**
 * Trình duyệt giả: rAF phải được "quay tay" từng nhịp, đồng hồ do ta điều khiển.
 * Không có nhịp nào tự chạy — nhờ vậy đếm được CHÍNH XÁC số nhịp mà vòng lặp yêu cầu.
 */
function createFakeBrowser({ frameCostMs = 4, frameGapMs = 16 } = {}) {
  let clock = 0;
  let nextHandle = 1;
  const queue = new Map();
  const cancelled = [];
  let renders = 0;

  // Đọc lại mỗi nhịp (không chốt lúc dựng) để bài test đổi được nhịp máy giữa chừng — cần cho ca
  // "máy chậm thoáng qua rồi hồi".
  const cfg = { frameCostMs, frameGapMs };

  const browser = {
    cfg,
    requestFrame(callback) {
      const handle = nextHandle++;
      queue.set(handle, callback);
      return handle;
    },
    cancelFrame(handle) {
      cancelled.push(handle);
      queue.delete(handle);
    },
    now: () => clock,
    render() {
      renders += 1;
      clock += cfg.frameCostMs;              // thời gian VẼ trôi qua
    },
    /** Chạy đúng một nhịp rAF đang chờ (nếu có). Trả về true nếu có nhịp để chạy. */
    step() {
      const [handle, callback] = queue.entries().next().value ?? [];
      if (handle === undefined) return false;
      queue.delete(handle);
      clock += cfg.frameGapMs - cfg.frameCostMs;  // phần còn lại của một khung hình
      callback(clock);
      return true;
    },
    /** Chạy nhiều nhịp; dừng sớm nếu hết nhịp (tức vòng lặp đã tự tắt). */
    run(times) {
      let ran = 0;
      for (let i = 0; i < times; i += 1) {
        if (!browser.step()) break;
        ran += 1;
      }
      return ran;
    },
    get pending() { return queue.size; },
    get renders() { return renders; },
    get cancelled() { return cancelled.slice(); },
    advance(ms) { clock += ms; },
  };
  return browser;
}

function mount(browser, extra = {}) {
  return createRenderLoop({
    render: browser.render,
    requestFrame: browser.requestFrame,
    cancelFrame: browser.cancelFrame,
    now: browser.now,
    ...extra,
  });
}

// ─── Bất biến số 1: đứng yên = 0 nhịp ────────────────────────────────────────

test('vừa dựng xong mà chưa ai gọi gì: KHÔNG có nhịp rAF nào', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  assert.equal(browser.pending, 0, 'vòng lặp tự đặt lịch khi chưa ai yêu cầu ⇒ ăn pin vô cớ');
  assert.equal(loop.isIdle(), true);
  assert.equal(browser.renders, 0);
});

test('vẽ xong một khung rời rạc thì vòng lặp TỰ TẮT, không quay tiếp', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  loop.invalidate();
  assert.equal(browser.pending, 1, 'invalidate phải đặt đúng 1 nhịp');

  browser.step();
  assert.equal(browser.renders, 1);
  assert.equal(browser.pending, 0, 'sau khi vẽ xong vẫn còn nhịp chờ ⇒ vòng lặp chạy mãi');
  assert.equal(loop.isIdle(), true);

  // để yên thật lâu — vẫn không có nhịp nào mọc ra
  assert.equal(browser.run(1000), 0);
  assert.equal(browser.renders, 1);
});

test('gọi invalidate 100 lần trong cùng một nhịp chỉ ra ĐÚNG MỘT khung hình', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  for (let i = 0; i < 100; i += 1) loop.invalidate();
  assert.equal(browser.pending, 1, 'không gộp ⇒ 100 khung hình cho một thay đổi');

  browser.step();
  assert.equal(browser.renders, 1);
});

// ─── Chế độ sustained + đếm tham chiếu ───────────────────────────────────────

test('sustained: vẽ liên tục, và chỉ dừng khi NGƯỜI CUỐI CÙNG rời đi', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  loop.beginSustained('kéo-camera');
  loop.beginSustained('mưa');
  browser.run(5);
  assert.equal(browser.renders, 5);
  assert.equal(loop.isSustained(), true);

  // tắt MỘT hoạt hoạ — cái còn lại phải giữ vòng lặp sống
  loop.endSustained('kéo-camera');
  browser.run(3);
  assert.equal(browser.renders, 8, 'tắt 1 trong 2 hoạt hoạ mà vòng lặp đã chết ⇒ mưa đứng hình');

  loop.endSustained('mưa');
  // còn đúng một nhịp đã đặt trước: cho nó vẽ nốt rồi phải tắt hẳn
  const remaining = browser.run(50);
  assert.equal(remaining, 1, 'phải vẽ nốt đúng 1 khung rồi tắt, không hơn');
  assert.equal(loop.isIdle(), true);
});

test('bật cùng một token hai lần rồi tắt một lần thì vẫn tắt (Set, không phải bộ đếm)', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  loop.beginSustained('mưa');
  loop.beginSustained('mưa');
  loop.endSustained('mưa');
  browser.run(50);
  assert.equal(loop.isIdle(), true, 'token trùng tên phải coi là MỘT — nếu không sẽ kẹt vòng lặp');
});

test('pause/resume: rời tab rồi quay lại thì cảnh KHÔNG đóng băng vĩnh viễn', () => {
  // Đây là lỗi đã xảy ra thật lúc viết `CityScene3D`: dùng `stop()` cho `visibilitychange`.
  // `stop()` là vĩnh viễn ⇒ quay lại tab là thành phố đứng hình, không cách nào cứu.
  const browser = createFakeBrowser();
  const loop = mount(browser);

  loop.beginSustained('kéo-camera');
  browser.run(3);
  assert.equal(browser.renders, 3);

  loop.pause();
  assert.equal(browser.pending, 0, 'pause phải huỷ nhịp đang chờ');
  assert.equal(loop.isSustained(), false, 'pause phải bỏ hoạt hoạ dở — ngón tay đâu còn trên màn hình');
  assert.equal(browser.run(10), 0, 'đang tạm dừng mà vẫn vẽ');

  loop.resume();
  assert.equal(browser.run(10), 1, 'quay lại phải vẽ ĐÚNG một khung rồi lại đứng yên');
  assert.equal(browser.renders, 4);

  // và sau khi quay lại thì mọi thứ hoạt động bình thường trở lại
  loop.invalidate();
  browser.step();
  assert.equal(browser.renders, 5);
});

test('resume() sau stop() KHÔNG hồi sinh vòng lặp (canvas có thể đã bị huỷ)', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  loop.stop();
  loop.resume();
  assert.equal(browser.pending, 0, 'hồi sinh sau stop ⇒ vẽ lên WebGL context đã dọn');
});

test('stop() huỷ nhịp đang chờ và chặn mọi lời gọi sau đó', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  loop.beginSustained('mưa');
  assert.equal(browser.pending, 1);

  loop.stop();
  assert.equal(browser.cancelled.length, 1, 'stop phải huỷ nhịp đang chờ, không để nó vẽ vào canvas đã dọn');
  assert.equal(browser.pending, 0);

  loop.invalidate();
  loop.beginSustained('mưa-lần-hai');
  assert.equal(browser.pending, 0, 'sau stop mà còn đặt được nhịp ⇒ vẽ lên WebGL context đã huỷ');
  assert.equal(browser.run(10), 0);
});

// ─── Bất biến số 2: FPS chỉ đo trong sustained ───────────────────────────────

test('đứng yên: KHÔNG sinh ra chỉ số FPS (nếu không watchdog sẽ hạ 2D oan)', () => {
  const browser = createFakeBrowser();
  const loop = mount(browser);

  // vẽ vài khung rời rạc, cách nhau rất xa như người dùng thật bấm lai rai
  for (let i = 0; i < 5; i += 1) {
    loop.invalidate();
    browser.step();
    browser.advance(30_000);
  }

  assert.equal(loop.getStats().fps, 0, 'khung rời rạc không được gộp thành FPS');
  assert.equal(loop.getStats().framesRendered, 5, 'vẫn phải đếm được số khung đã vẽ cho HUD');
});

test('sustained: FPS đo ra đúng nhịp giả lập', () => {
  const browser = createFakeBrowser({ frameGapMs: 16, frameCostMs: 4 });  // ~62,5 khung/giây
  const loop = mount(browser);

  loop.beginSustained('kéo-camera');
  browser.run(200);

  const { fps, lastFrameMs } = loop.getStats();
  assert.ok(fps >= 55 && fps <= 70, `FPS đo được (${fps}) lệch xa nhịp giả lập 62,5`);
  assert.equal(lastFrameMs, 4, 'thời gian vẽ mỗi khung phải khớp chi phí giả lập');
});

test('watchdog: máy chậm dai dẳng thì báo, và chỉ báo MỘT lần', () => {
  const browser = createFakeBrowser({ frameGapMs: 100, frameCostMs: 90 });  // 10 FPS
  const calls = [];
  const loop = mount(browser, { onSlow: (info) => calls.push(info) });

  loop.beginSustained('kéo-camera');
  browser.run(500);

  assert.equal(calls.length, 1, 'báo mỗi giây một lần sẽ dội bom tầng trên — chỉ được báo một lần');
  assert.ok(calls[0].fps < SLOW_FPS_THRESHOLD);
  assert.ok(calls[0].samples >= SLOW_SAMPLES_TO_GIVE_UP);
});

test('watchdog: chậm THOÁNG QUA (vài nhịp xấu rồi hồi) thì KHÔNG hạ 2D', () => {
  // Vài khung hình xấu là chuyện bình thường: đúng lúc trình duyệt dọn rác, hoặc lúc dựng cảnh
  // lần đầu. Hạ 2D vì một đợt xấu ngắn là phản ứng thái quá — 3D vẫn dùng tốt.
  const browser = createFakeBrowser({ frameGapMs: 200, frameCostMs: 190 });   // 5 FPS
  const calls = [];
  const loop = mount(browser, { onSlow: (info) => calls.push(info) });

  loop.beginSustained('kéo-camera');
  browser.run(10);                    // đúng 2 cửa sổ mẫu chậm — vẫn dưới ngưỡng 3
  assert.equal(calls.length, 0, 'nổ quá sớm: mới 2 mẫu đã hạ 2D');

  browser.cfg.frameGapMs = 16;        // máy hồi lại, ~62 FPS
  browser.cfg.frameCostMs = 4;
  browser.run(400);

  assert.equal(calls.length, 0, `hạ 2D vì chậm thoáng qua (cần ${SLOW_SAMPLES_TO_GIVE_UP} mẫu LIÊN TIẾP)`);
  assert.ok(loop.getStats().fps > SLOW_FPS_THRESHOLD, 'sau khi hồi, FPS phải phản ánh nhịp mới');
});

test('render ném lỗi: dừng hẳn, không quay vòng lỗi 60 lần/giây', () => {
  const browser = createFakeBrowser();
  const errors = [];
  let shouldThrow = false;
  const loop = createRenderLoop({
    render: () => { if (shouldThrow) throw new Error('WebGL toang'); browser.render(); },
    requestFrame: browser.requestFrame,
    cancelFrame: browser.cancelFrame,
    now: browser.now,
    onError: (error) => errors.push(error),
  });

  loop.beginSustained('mưa');
  browser.run(3);
  assert.equal(browser.renders, 3);

  shouldThrow = true;
  browser.step();

  assert.equal(errors.length, 1);
  assert.equal(errors[0].message, 'WebGL toang');
  assert.equal(loop.isIdle(), true, 'lỗi rồi mà vòng lặp còn sống ⇒ ném lỗi 60 lần/giây, treo máy');
  assert.equal(browser.run(10), 0);
});

test('cửa sổ đo FPS không rò từ lần sustained này sang lần sau', () => {
  const browser = createFakeBrowser({ frameGapMs: 16, frameCostMs: 4 });
  const loop = mount(browser);

  loop.beginSustained('lần-1');
  browser.run(30);                    // chưa đủ 1 giây → chưa chốt mẫu nào
  loop.endSustained('lần-1');
  browser.run(5);

  browser.advance(10 * FPS_SAMPLE_MS); // người dùng bỏ đi rất lâu

  loop.beginSustained('lần-2');
  browser.run(3);
  // Nếu cửa sổ cũ còn sót, `startedAt - windowStart` sẽ ra hàng chục giây → FPS gần 0 và
  // watchdog nổ oan ngay lập tức.
  assert.ok(loop.getStats().fps === 0 || loop.getStats().fps > SLOW_FPS_THRESHOLD,
    `FPS rò từ phiên trước (${loop.getStats().fps})`);
});
