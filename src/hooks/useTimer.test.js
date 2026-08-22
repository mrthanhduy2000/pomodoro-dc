/**
 * useTimer.test.js — CHARACTERIZATION TESTS
 * ─────────────────────────────────────────────────────────────────────────────
 * Mục đích: KHÓA hành vi hiện tại của `useTimer.js` (1407 dòng, 0 test trước đây)
 * làm lưới an toàn TRƯỚC khi tách nhỏ God File. `useTimer` là đường sinh Raw Event
 * DUY NHẤT của hệ thống và là nơi gọi `completeFocusSession`, nên đây là blocker
 * cuối cùng của Giai đoạn A.
 *
 * ĐÂY LÀ TEST ĐẶC TẢ HÀNH VI THẬT (golden master), KHÔNG phải test đúng/sai thiết
 * kế. Mọi giá trị dưới đây quan sát từ code đang chạy rồi chốt lại. Test rớt =
 * hành vi runtime đã đổi, phải rà soát có chủ ý (xem "Rollback" trong báo cáo).
 *
 * ── PHẠM VI ──────────────────────────────────────────────────────────────────
 * Test HỢP ĐỒNG GỌI, không test toán. Toán đã có lưới ở nơi khác, KHÔNG lặp lại:
 *   - `src/engine/timerSession.test.js`  → công thức phút, chuyển pomodoro→bấm giờ
 *   - `src/engine/breaks.test.js`        → kế hoạch giải lao
 *   - `src/store/gameStore.completeFocusSession.test.js` → store LÀM GÌ với tham số
 *   - `src/store/gameStore.cancelFocusSession.test.js`
 *   - `src/lib/syncService.behavior.test.js` → đồng bộ, gồm cả `pagehide`
 * `pagehide` KHÔNG thuộc `useTimer` (nó nằm ở `syncService.js`, bản vá C1-3) — xem
 * bài "chỉ đăng ký visibilitychange" bên dưới, nó khoá đúng ranh giới đó.
 *
 * ── NHÃN ─────────────────────────────────────────────────────────────────────
 *   [DI SẢN]  hành vi kỳ lạ nhưng đang chạy thật, cố ý giữ nguyên
 *   [BUG KHÓA] sai thật, cố ý khóa lại chứ KHÔNG sửa trong task này (TECH_DEBT)
 * Muốn sửa một hành vi có nhãn ⇒ phải sửa test TRONG CÙNG commit với bản sửa code,
 * kèm lý do. Không được sửa test cho xanh rồi tính sau.
 *
 * ── AN TOÀN DỮ LIỆU (đọc kỹ trước khi sửa file này) ──────────────────────────
 * `useTimer` → `timerLiveService` → `supabase.js` = client Supabase THẬT với khoá
 * production. Một test gọi `start()` mà không chặn `fetch` sẽ GHI THẲNG vào dòng
 * `timer_live`/`game_state` production của Đàm (đúng thứ `CLAUDE.md` cấm tuyệt
 * đối). Vì vậy `globalThis.fetch` bị thay TRƯỚC mọi import dự án, và có một bài
 * test riêng canh chốt đó. ĐỪNG bỏ hay đảo thứ tự phần thiết lập ở đầu file.
 *
 * ── GIÀN (0 thư viện mới) ────────────────────────────────────────────────────
 * React 19.2.4 + react-dom/client THẬT mount vào container GIẢ. Cần đúng 3 chỗ vá
 * DOM mà react-dom đọc: document.body/activeElement, window.HTMLIFrameElement,
 * document.defaultView. Đồng hồ và bộ hẹn giờ là giả để test tất định, không chờ
 * thật. ⚠️ Hook gọi `window.setInterval`/`window.setTimeout` (có tiền tố) nhưng
 * gọi `clearInterval`/`clearTimeout` TRẦN — nên phải thay cả bản trần bằng bộ
 * định tuyến, id của mình thì tự huỷ, id lạ (của bộ lập lịch React) thì chuyển
 * cho bản thật. Bỏ bước này = test treo.
 * ⚠️ Node 24 có sẵn `globalThis.navigator` CHỈ ĐỌC — gán đè sẽ ném TypeError.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

// ═══════════════════════════════════════════════════════════════════════════════
// 1) GIÀN — phải chạy TRƯỚC mọi import của dự án
// ═══════════════════════════════════════════════════════════════════════════════

const REAL_TIMERS = {
  setTimeout: globalThis.setTimeout,
  clearTimeout: globalThis.clearTimeout,
  setInterval: globalThis.setInterval,
  clearInterval: globalThis.clearInterval,
};

// ── Đồng hồ giả ──────────────────────────────────────────────────────────────
const T0 = Date.parse('2026-08-05T09:00:00.000Z');
let nowMs = T0;
let timerSeq = 1;
/** @type {Map<number, {fn: Function, dueAt: number, everyMs: number|null}>} */
const fakeTimers = new Map();

Date.now = () => nowMs;

function fakeSetTimeout(fn, ms = 0) {
  const id = timerSeq++;
  fakeTimers.set(id, { fn, dueAt: nowMs + Math.max(0, ms), everyMs: null });
  return id;
}
function fakeSetInterval(fn, ms = 1000) {
  const id = timerSeq++;
  fakeTimers.set(id, { fn, dueAt: nowMs + Math.max(1, ms), everyMs: Math.max(1, ms) });
  return id;
}
/** Trả true nếu id là của bộ hẹn giờ giả (đã huỷ xong). */
function fakeClear(id) {
  if (typeof id === 'number' && fakeTimers.has(id)) {
    fakeTimers.delete(id);
    return true;
  }
  return false;
}
// Bộ định tuyến cho lời gọi TRẦN trong useTimer.js (dòng 280, 351, 474, 553, 607,
// 1082, 1210, 1214, 1254, 1350...). id lạ ⇒ trả về cho bản thật của Node để không
// phá bộ lập lịch nội bộ của React.
globalThis.clearTimeout = (id) => { if (!fakeClear(id)) REAL_TIMERS.clearTimeout(id); };
globalThis.clearInterval = (id) => { if (!fakeClear(id)) REAL_TIMERS.clearInterval(id); };

/** Dịch đồng hồ mà KHÔNG chạy bộ hẹn giờ nào. */
function jumpBy(ms) { nowMs += ms; }

function resetClock() {
  nowMs = T0;
  fakeTimers.clear();
}

// ── DOM giả ──────────────────────────────────────────────────────────────────
/** @type {Map<string, Function[]>} */
const docListeners = new Map();

function makeNode(tag = 'div') {
  return {
    nodeType: 1,
    nodeName: tag.toUpperCase(),
    tagName: tag.toUpperCase(),
    ownerDocument: null,
    parentNode: null,
    childNodes: [],
    firstChild: null,
    lastChild: null,
    nextSibling: null,
    style: {},
    setAttribute() {},
    removeAttribute() {},
    addEventListener() {},
    removeEventListener() {},
    appendChild(child) {
      this.childNodes.push(child);
      child.parentNode = this;
      [this.firstChild] = this.childNodes;
      this.lastChild = child;
      return child;
    },
    insertBefore(child) { return this.appendChild(child); },
    removeChild(child) {
      this.childNodes = this.childNodes.filter((c) => c !== child);
      return child;
    },
    contains() { return true; },
  };
}

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

// ── AudioContext giả ─────────────────────────────────────────────────────────
// `soundEngine` tạo AudioContext ngay lần phát âm đầu tiên (start/finish/tick).
// Bề mặt dùng thật rất nhỏ: createOscillator/createGain + setValueAtTime +
// linearRampToValueAtTime + connect/start/stop + currentTime/destination.
function makeAudioParam() {
  return { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {} };
}
function makeAudioNode() {
  return {
    type: '',
    frequency: makeAudioParam(),
    gain: makeAudioParam(),
    connect() {},
    disconnect() {},
    start() {},
    stop() {},
  };
}
class FakeAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0;
    this.destination = makeAudioNode();
  }

  createOscillator() { return makeAudioNode(); }

  createGain() { return makeAudioNode(); }

  resume() {}

  close() {}
}

const doc = {
  nodeType: 9,
  title: '',
  visibilityState: 'visible',
  documentElement: makeNode('html'),
  createElement: (tag) => { const n = makeNode(tag); n.ownerDocument = doc; return n; },
  createElementNS: (_ns, tag) => doc.createElement(tag),
  createTextNode: (text) => ({ nodeType: 3, nodeValue: text, ownerDocument: doc, parentNode: null }),
  createComment: (text) => ({ nodeType: 8, nodeValue: text, ownerDocument: doc, parentNode: null }),
  querySelector: () => null,
  addEventListener: (type, fn) => { docListeners.set(type, [...(docListeners.get(type) ?? []), fn]); },
  removeEventListener: (type, fn) => {
    docListeners.set(type, (docListeners.get(type) ?? []).filter((f) => f !== fn));
  },
};
doc.documentElement.ownerDocument = doc;
// VÁ 1 — react-dom đọc trong getActiveElementDeep lúc commit.
doc.body = makeNode('body');
doc.body.ownerDocument = doc;
doc.activeElement = doc.body;

globalThis.document = doc;
globalThis.window = {
  document: doc,
  // VÁ 2 — react-dom làm `element instanceof containerInfo.HTMLIFrameElement`.
  HTMLIFrameElement: class HTMLIFrameElement {},
  AudioContext: FakeAudioContext,
  localStorage: createMemoryStorage(),
  sessionStorage: createMemoryStorage(),
  addEventListener: () => {},
  removeEventListener: () => {},
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  atob: (value) => globalThis.atob(String(value)),
  setTimeout: fakeSetTimeout,
  setInterval: fakeSetInterval,
  clearTimeout: globalThis.clearTimeout,
  clearInterval: globalThis.clearInterval,
};
// VÁ 3 — react-dom đi qua ownerDocument.defaultView để lấy window.
doc.defaultView = globalThis.window;
globalThis.localStorage = globalThis.window.localStorage;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

/** Bắn một sự kiện vòng đời trang tới đúng các listener useTimer đã đăng ký. */
function fireDocEvent(type) {
  (docListeners.get(type) ?? []).forEach((fn) => fn());
}

// ── BroadcastChannel giả (BẮT BUỘC — nếu bỏ, `npm test` sẽ TREO VĨNH VIỄN) ────
// `useTimer` → `timerLiveService` → `supabase.js` gọi `createClient()` ngay lúc nạp
// module. Tầng auth của Supabase mở một `BroadcastChannel` để đồng bộ phiên đăng
// nhập giữa các tab. Trên trình duyệt thì vô hại, nhưng trong Node `BroadcastChannel`
// chạy trên một `MessagePort` — và MessagePort GIỮ event loop sống mãi mãi. Hệ quả:
// toàn bộ 41 bài test chạy xong, in ✔ hết, rồi tiến trình đứng đó không thoát.
// Đã khoanh vùng bằng `process.getActiveResourcesInfo()`: nạp `supabase.js` làm
// xuất hiện đúng một "MessagePort", stub bên dưới làm nó biến mất.
globalThis.BroadcastChannel = class BroadcastChannel {
  constructor(name) { this.name = name; }

  postMessage() {}

  close() {}

  addEventListener() {}

  removeEventListener() {}
};

// ── Chốt an toàn: chặn TOÀN BỘ lưu lượng ra ngoài ────────────────────────────
const SUPABASE_HOST = 'jcefdsdccmnmqvuwelmm.supabase.co';
/** @type {{url: string, method: string}[]} */
let netLog = [];

// Trả về object GIỐNG Response chứ không phải `new Response(...)` thật: Response
// thật kéo theo ReadableStream của undici, mỗi body không được đọc hết là một
// handle treo lại làm tiến trình test không thoát được.
function makeFakeResponse() {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: { get: (name) => (String(name).toLowerCase() === 'content-type' ? 'application/json' : null) },
    json: async () => [],
    text: async () => '[]',
    clone() { return makeFakeResponse(); },
  };
}

const fetchStub = async (input, init) => {
  const url = typeof input === 'string' ? input : String(input?.url ?? input);
  netLog.push({ url, method: init?.method ?? 'GET' });
  return makeFakeResponse();
};
globalThis.fetch = fetchStub;

/** Đếm request đã bị chặn có URL chứa `part`. */
function netHits(part) {
  return netLog.filter((entry) => entry.url.includes(part)).length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2) IMPORT (sau khi globals đã sẵn sàng) — dùng đường dẫn TƯƠNG ĐỐI
//    ⚠️ Import tuyệt đối sẽ nạp HAI bản React (bẫy NFC/NFD của thư mục có dấu).
// ═══════════════════════════════════════════════════════════════════════════════

const [React, { createRoot }, timerModule, gameStoreModule, settingsStoreModule, timerSessionModule]
  = await Promise.all([
    import('react'),
    import('react-dom/client'),
    import('./useTimer.js'),
    import('../store/gameStore.js'),
    import('../store/settingsStore.js'),
    import('../engine/timerSession.js'),
  ]);

// ⚠️ HOÁN ĐỔI BỘ HẸN GIỜ TOÀN CỤC — PHẢI làm SAU khi react-dom đã nạp xong.
// Lý do: `syncService.js` hẹn giờ bằng `setTimeout` TRẦN (debounce 5s ở dòng 193),
// tức bộ đếm THẬT của Node. Mỗi lần store đổi là một bộ đếm thật được tạo, khiến
// tiến trình test KHÔNG BAO GIỜ thoát và `npm test` treo vĩnh viễn.
// An toàn vì react-dom chụp `setTimeout` ngay lúc nạp module (react-dom-client
// dòng 27493: `scheduleTimeout = typeof setTimeout === 'function' ? setTimeout : ...`),
// nên bộ lập lịch của React vẫn giữ bản THẬT. Cùng cách `syncService.behavior.test.js`
// đã dùng để khử flaky.
globalThis.setTimeout = fakeSetTimeout;
globalThis.setInterval = fakeSetInterval;
globalThis.window.setTimeout = fakeSetTimeout;
globalThis.window.setInterval = fakeSetInterval;

const { act, createElement } = React;
const { useTimer, TIMER_STATES, TIMER_MODES, formatTime } = timerModule;
const useGameStore = gameStoreModule.default;
const useSettingsStore = settingsStoreModule.default;
// ⚠️ ĐỌC THẲNG HẰNG SỐ SẢN PHẨM, KHÔNG CHÉP LẠI CON SỐ.
// Bài dưới từng chờ cứng 500 ms và ĐỎ VĨNH VIỄN từ lúc `BREAK_START_DELAY_MS` được nâng lên
// 3200 ms (để đồng hồ nghỉ không cắt ngang lễ mừng, xem `timerSession.test.js`). Mã đúng, phép
// đo già đi — đúng bẫy "một luật hai công thức".
const { BREAK_START_DELAY_MS } = timerSessionModule;

const initialGameState = useGameStore.getInitialState();
const initialSettingsState = useSettingsStore.getState();

// ═══════════════════════════════════════════════════════════════════════════════
// 3) HELPER
// ═══════════════════════════════════════════════════════════════════════════════

/** Chạy mọi bộ hẹn giờ giả đã tới hạn (mỗi interval nổ tối đa 1 lần mỗi lượt). */
async function flushDueTimers() {
  const due = [...fakeTimers.entries()]
    .filter(([, timer]) => timer.dueAt <= nowMs)
    .sort((a, b) => a[1].dueAt - b[1].dueAt);

  for (const [id, timer] of due) {
    if (!fakeTimers.has(id)) continue;
    if (timer.everyMs) timer.dueAt = nowMs + timer.everyMs;
    else fakeTimers.delete(id);
    await act(async () => { timer.fn(); });
  }
}

/** Dịch đồng hồ rồi cho bộ hẹn giờ nổ đúng một lượt. */
async function advance(ms) {
  jumpBy(ms);
  await flushDueTimers();
}

/**
 * Các root React còn sống. Một bài test RỚT sẽ bỏ qua lệnh unmount ở cuối, để lại
 * component "xác sống" vẫn lắng nghe store — bài sau gọi setState sẽ làm nó render
 * ngoài act() và phun cảnh báo che mất lỗi thật. Vì vậy resetWorld() dọn trước.
 */
const liveRoots = new Set();

async function resetWorld() {
  for (const root of liveRoots) {
    await act(async () => { root.unmount(); });
  }
  liveRoots.clear();

  resetClock();
  netLog = [];
  docListeners.clear();
  globalThis.window.localStorage.clear();
  globalThis.window.sessionStorage.clear();
  useGameStore.setState(initialGameState, true);
  useSettingsStore.setState(initialSettingsState, true);
}

/**
 * Thay 2 hành động sinh Raw Event bằng gián điệp (không chạy engine phần thưởng —
 * phần đó đã có test riêng), và BỌC 3 hành động còn lại để vừa quan sát vừa giữ
 * nguyên hành vi thật.
 */
function installSpies({ sessionId = 501 } = {}) {
  const real = useGameStore.getState();
  const calls = {
    complete: [],
    cancel: [],
    clearTimerSession: 0,
    persist: [],
    startBreak: [],
    prepare: [],
    /** Thứ tự gọi, dùng để khoá "complete TRƯỚC clearTimerSession". */
    order: [],
  };

  useGameStore.setState({
    completeFocusSession: (...args) => {
      calls.complete.push(args);
      calls.order.push('complete');
      return { sessionId };
    },
    cancelFocusSession: (...args) => {
      calls.cancel.push(args);
      calls.order.push('cancel');
      return undefined;
    },
    clearTimerSession: (...args) => {
      calls.clearTimerSession += 1;
      calls.order.push('clearTimerSession');
      return real.clearTimerSession(...args);
    },
    persistTimerSession: (...args) => {
      calls.persist.push(args[0]);
      return real.persistTimerSession(...args);
    },
    startBreak: (...args) => {
      calls.startBreak.push(args[0]);
      return real.startBreak(...args);
    },
    prepareFocusSessionStart: (...args) => {
      calls.prepare.push(args[0]);
      calls.order.push('prepare');
      return real.prepareFocusSessionStart(...args);
    },
  });

  return calls;
}

/** Mount hook thật vào container giả. */
async function mountTimer({ focusMinutes = 25, mode = TIMER_MODES.POMODORO } = {}) {
  const container = doc.createElement('div');
  const root = createRoot(container);
  const box = { api: null, renders: 0 };

  function Probe(props) {
    box.renders += 1;
    box.api = useTimer(props);
    return null;
  }

  liveRoots.add(root);
  await act(async () => { root.render(createElement(Probe, { focusMinutes, mode })); });

  return {
    box,
    get api() { return box.api; },
    unmount: async () => {
      liveRoots.delete(root);
      await act(async () => { root.unmount(); });
    },
  };
}

/** Bọc mọi thao tác người dùng trong act() để React xả hết effect. */
async function run(fn) {
  let result;
  await act(async () => { result = fn(); });
  return result;
}

/** Đặt trước một phiên đang chạy trong store để thử đường KHÔI PHỤC lúc mount. */
function seedPersistedSession(overrides = {}) {
  useGameStore.setState({
    timerSession: {
      isRunning: true,
      mode: TIMER_MODES.POMODORO,
      startedAt: T0,
      countdownStartedAt: T0,
      pausedAt: null,
      pausedTotalMs: 0,
      pauseSegments: [],
      categoryId: null,
      categorySnapshot: null,
      note: '',
      goal: '',
      nextNote: '',
      totalSeconds: 25 * 60,
      continueAfterPomodoro: false,
      continuedPomodoroConfirmedUntilSeconds: null,
      ...overrides,
    },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// 0) CHỐT AN TOÀN — bài này phải xanh thì các bài còn lại mới đáng tin
// ═══════════════════════════════════════════════════════════════════════════════

test('[an toàn] mọi lệnh ghi Supabase đều bị chặn, không request nào lọt ra mạng thật', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer();

  await run(() => timer.api.start());
  await run(() => timer.api.cancel());

  // Có ghi thật sự (không phải test rỗng vô nghĩa)...
  assert.ok(netHits(SUPABASE_HOST) > 0, 'phải có lệnh ghi hướng tới Supabase');
  // ...nhưng TẤT CẢ đều bị stub nuốt: fetch chưa từng bị khôi phục về bản thật.
  assert.equal(globalThis.fetch, fetchStub);
  assert.ok(netLog.every((entry) => typeof entry.url === 'string'));

  await timer.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// A) START FOCUS
// ═══════════════════════════════════════════════════════════════════════════════

test('start(): IDLE → RUNNING, hiển thị đủ số giây mục tiêu', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);
  assert.equal(timer.api.displaySeconds, 25 * 60);

  await run(() => timer.api.start());

  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);
  assert.equal(timer.api.displaySeconds, 25 * 60);
  assert.equal(timer.api.totalSeconds, 25 * 60);
  assert.equal(timer.api.activeMode, TIMER_MODES.POMODORO);
  assert.equal(typeof timer.api.sessionStartedAt, 'number');

  await timer.unmount();
});

test('start(): prepareFocusSessionStart chạy TRƯỚC khi ghi phiên vào store', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());

  assert.equal(calls.prepare.length, 1);
  assert.deepEqual(calls.prepare[0], { startedAt: T0, mode: TIMER_MODES.POMODORO });
  assert.ok(calls.persist.length >= 1);
  assert.equal(calls.order[0], 'prepare');

  await timer.unmount();
});

test('start(): ghi phiên vào store đủ trường để khôi phục được sau khi đóng tab', async () => {
  await resetWorld();
  installSpies();
  useGameStore.setState({
    pendingCategoryId: null,
    pendingNote: 'ghi chú mở đầu',
    pendingSessionGoal: 'mục tiêu A',
    pendingNextSessionNote: 'việc kế tiếp',
  });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());

  const saved = useGameStore.getState().timerSession;
  assert.equal(saved.isRunning, true);
  assert.equal(saved.mode, TIMER_MODES.POMODORO);
  assert.equal(saved.startedAt, T0);
  assert.equal(saved.countdownStartedAt, T0);
  assert.equal(saved.totalSeconds, 25 * 60);
  assert.equal(saved.pausedAt, null);
  assert.equal(saved.note, 'ghi chú mở đầu');
  assert.equal(saved.goal, 'mục tiêu A');
  assert.equal(saved.nextNote, 'việc kế tiếp');
  assert.deepEqual(saved.pauseSegments, []);

  await timer.unmount();
});

test('start(): đẩy trạng thái ra timer_live + hẹn thông báo + gọi pushNow [call-site 652]', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });
  netLog = [];

  await run(() => timer.api.start());

  assert.ok(netHits('timer_live') > 0, 'phải cập nhật timer_live cho thanh menu Mac');
  assert.ok(netHits('/api/push/schedule') > 0, 'phải hẹn thông báo báo hết giờ');
  assert.ok(netHits('game_state') > 0, 'pushNow phải đẩy trạng thái lên đám mây');

  await timer.unmount();
});

test('[chống trùng] start() khi đang RUNNING không tạo phiên thứ hai', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  const startedAt = timer.api.sessionStartedAt;
  const prepareCount = calls.prepare.length;

  await advance(60_000);
  await run(() => timer.api.start());

  assert.equal(calls.prepare.length, prepareCount, 'không được khởi tạo phiên lần hai');
  assert.equal(timer.api.sessionStartedAt, startedAt, 'mốc bắt đầu phải giữ nguyên');

  await timer.unmount();
});

test('start(): bị chặn khi đang có khủng hoảng thời đại chưa chọn "challenge"', async () => {
  await resetWorld();
  const calls = installSpies();
  useGameStore.setState({ eraCrisis: { active: true, choiceMade: null } });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());

  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);
  assert.equal(calls.prepare.length, 0);

  await timer.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// B) PAUSE / RESUME
// ═══════════════════════════════════════════════════════════════════════════════

test('pause(): RUNNING → PAUSED, lưu mốc tạm dừng + huỷ thông báo đã hẹn [call-site 661]', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(120_000);
  netLog = [];
  await run(() => timer.api.pause());

  assert.equal(timer.api.timerState, TIMER_STATES.PAUSED);
  assert.equal(useGameStore.getState().timerSession.pausedAt, T0 + 120_000);
  assert.ok(netHits('/api/push/cancel') > 0, 'phải huỷ thông báo đã hẹn khi tạm dừng');
  assert.ok(netHits('game_state') > 0, 'pushNow phải chạy khi vào trạng thái PAUSED');
  assert.equal(calls.complete.length, 0, 'tạm dừng không được sinh Raw Event');

  await timer.unmount();
});

test('pause() khi không RUNNING và resume() khi không PAUSED đều không làm gì', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.pause());
  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);

  await run(() => timer.api.resume());
  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);

  await run(() => timer.api.start());
  await run(() => timer.api.resume()); // đang RUNNING, không phải PAUSED
  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);

  await timer.unmount();
});

test('resume(): cộng đúng MỘT đoạn tạm dừng vào pauseSegments + pausedTotalMs', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(60_000);
  await run(() => timer.api.pause());
  await advance(30_000);
  await run(() => timer.api.resume());

  const saved = useGameStore.getState().timerSession;
  assert.equal(saved.pausedTotalMs, 30_000);
  assert.equal(saved.pauseSegments.length, 1);
  assert.deepEqual(saved.pauseSegments[0], {
    startedAt: T0 + 60_000,
    endedAt: T0 + 90_000,
    durationMs: 30_000,
  });
  assert.equal(saved.pausedAt, null);
  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);

  await timer.unmount();
});

test('resume(): dịch mốc đồng hồ nên thời gian nghỉ KHÔNG bị tính là thời gian tập trung', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(60_000);              // đã tập trung 1 phút
  await run(() => timer.api.pause());
  await advance(300_000);             // nghỉ 5 phút
  await run(() => timer.api.resume());
  await advance(60_000);              // tập trung thêm 1 phút
  await flushDueTimers();

  // Đã trôi 2 phút thật, 5 phút nghỉ không được tính.
  assert.equal(timer.api.displaySeconds, 25 * 60 - 120);
  assert.equal(useGameStore.getState().timerSession.countdownStartedAt, T0 + 300_000);

  await timer.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// C) COMPLETE FOCUS — đường sinh Raw Event số 1
// ═══════════════════════════════════════════════════════════════════════════════

test('finish(): gọi completeFocusSession ĐÚNG 1 lần với 5 tham số đúng thứ tự', async () => {
  await resetWorld();
  const calls = installSpies();
  useGameStore.setState({ pendingNote: 'xong bài', pendingSessionGoal: 'mục tiêu' });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  await run(() => timer.api.finish());

  assert.equal(calls.complete.length, 1);
  const [creditedMinutes, categoryId, note, sessionTiming, sessionSnapshot] = calls.complete[0];
  assert.equal(creditedMinutes, 25);
  assert.equal(categoryId, null);
  assert.equal(note, 'xong bài');
  assert.equal(typeof sessionTiming, 'object');
  assert.deepEqual(Object.keys(sessionSnapshot).sort(), ['categorySnapshot', 'goal', 'nextNote']);
  assert.equal(sessionSnapshot.goal, 'mục tiêu');

  await timer.unmount();
});

test('finish(): phút được ghi nhận = min(mục tiêu, đã trôi), có sàn 1 phút', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(30 * 60 * 1000); // chạy quá 5 phút so với mục tiêu
  await run(() => timer.api.finish());

  assert.equal(calls.complete[0][0], 25, 'không được vượt mục tiêu ở chế độ pomodoro');

  await timer.unmount();
});

test('finish(): sessionTiming đủ 5 trường, pauseSegments là chuỗi ISO (không phải mili giây)', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(60_000);
  await run(() => timer.api.pause());
  await advance(30_000);
  await run(() => timer.api.resume());
  jumpBy(25 * 60 * 1000);
  await run(() => timer.api.finish());

  const timing = calls.complete[0][3];
  assert.deepEqual(
    Object.keys(timing).sort(),
    ['finishedAt', 'pauseSegments', 'pausedTotalMs', 'startedAt', 'wallClockDurationMs'],
  );
  assert.equal(timing.startedAt, new Date(T0).toISOString());
  assert.equal(timing.pausedTotalMs, 30_000);
  assert.equal(timing.pauseSegments.length, 1);
  assert.equal(typeof timing.pauseSegments[0].startedAt, 'string');
  assert.equal(timing.pauseSegments[0].startedAt, new Date(T0 + 60_000).toISOString());
  assert.equal(timing.pauseSegments[0].durationMs, 30_000);

  await timer.unmount();
});

test('finish(): lấy ghi chú/mục tiêu MỚI NHẤT lúc kết thúc, không phải giá trị lúc bấm Bắt đầu', async () => {
  await resetWorld();
  const calls = installSpies();
  useGameStore.setState({ pendingNote: 'bản nháp', pendingSessionGoal: 'mục tiêu cũ' });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  // Người dùng sửa ghi chú giữa phiên (3 effect gương ở useTimer.js dòng 284-309).
  await run(() => useGameStore.getState().setPendingNote('bản cuối'));
  await run(() => useGameStore.getState().setPendingSessionGoal('mục tiêu mới'));
  jumpBy(25 * 60 * 1000);
  await run(() => timer.api.finish());

  assert.equal(calls.complete[0][2], 'bản cuối');
  assert.equal(calls.complete[0][4].goal, 'mục tiêu mới');

  await timer.unmount();
});

test('[DI SẢN] finish() khi pomodoro CÒN thời gian: im lặng không ghi phiên, chỉ đồng bộ lại số hiển thị', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(60_000);
  await run(() => timer.api.finish());

  assert.equal(calls.complete.length, 0, 'KHÔNG sinh Raw Event khi còn thời gian');
  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING, 'trạng thái giữ nguyên');
  assert.equal(timer.api.displaySeconds, 25 * 60 - 60, 'chỉ đồng bộ lại số hiển thị');

  await timer.unmount();
});

test('[DI SẢN] finish() lúc đang PAUSED: mốc kết thúc = lúc bấm tạm dừng, đoạn nghỉ đang mở KHÔNG được cộng', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25, mode: TIMER_MODES.STOPWATCH });

  await run(() => timer.api.start());
  await advance(600_000);            // bấm giờ 10 phút
  await run(() => timer.api.pause());
  await advance(3_600_000);          // để yên 1 tiếng ở trạng thái tạm dừng
  await run(() => timer.api.finish());

  const timing = calls.complete[0][3];
  assert.equal(timing.finishedAt, new Date(T0 + 600_000).toISOString(), 'kết thúc tính tại lúc tạm dừng');
  assert.equal(timing.pausedTotalMs, 0, 'đoạn nghỉ đang mở KHÔNG vào tổng thời gian nghỉ');
  assert.deepEqual(timing.pauseSegments, [], 'đoạn nghỉ đang mở KHÔNG vào danh sách');
  assert.equal(calls.complete[0][0], 10, 'ghi nhận 10 phút, không cộng 1 tiếng chờ');

  await timer.unmount();
});

test('finish(): clearTimerSession chạy SAU completeFocusSession và xoá phiên khỏi store', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  await run(() => timer.api.finish());

  const completeAt = calls.order.indexOf('complete');
  const clearAt = calls.order.indexOf('clearTimerSession');
  assert.ok(completeAt >= 0 && clearAt >= 0);
  assert.ok(completeAt < clearAt, 'thứ tự này là CHỦ Ý (useTimer.js dòng 504)');
  assert.equal(useGameStore.getState().timerSession.isRunning, false);

  await timer.unmount();
});

test('finish(): store không trả sessionId → về IDLE, không mở giải lao [call-site 595]', async () => {
  await resetWorld();
  const calls = installSpies({ sessionId: null });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  netLog = [];
  await run(() => timer.api.finish());

  assert.equal(calls.complete.length, 1);
  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);
  assert.equal(timer.api.lastCompletedSessionId, null);
  assert.equal(calls.startBreak.length, 0);
  assert.ok(netHits('game_state') > 0, 'vẫn phải pushNow ở nhánh phòng thủ này');

  await timer.unmount();
});

/**
 * ⚠️ GHIM CẢ HAI PHÍA NGƯỠNG, VÀ GHIM BẰNG CHÍNH HẰNG SỐ SẢN PHẨM.
 * Bản cũ viết cứng `advance(500)` nên khi `BREAK_START_DELAY_MS` được nâng 500 → 3200 nó ĐỎ
 * VĨNH VIỄN trong khi mã hoàn toàn đúng. Chép con số mới vào cũng sai y hệt, chỉ là chưa cắn:
 * lần chỉnh sau nó lại trôi. Nay bài này hỏi thẳng hằng số, và hỏi HAI phía — trước ngưỡng một
 * mili-giây thì CHƯA được mở, đúng ngưỡng thì PHẢI mở. Một phía thôi là cái phễu, không phải
 * hàng rào: `advance(999999)` cũng qua được vế "phải mở".
 */
test('finish(): tự mở giải lao đúng BREAK_START_DELAY_MS, kèm đúng sourceSessionId', async () => {
  await resetWorld();
  const calls = installSpies({ sessionId: 777 });
  useSettingsStore.setState({ autoStartBreak: true, disableBreak: false });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  await run(() => timer.api.finish());

  assert.equal(timer.api.timerState, TIMER_STATES.FINISHED);
  assert.equal(timer.api.lastCompletedSessionId, 777);
  assert.equal(calls.startBreak.length, 0, 'ngay lúc finish() thì chưa mở giải lao');

  await advance(BREAK_START_DELAY_MS - 1);
  assert.equal(calls.startBreak.length, 0,
    `còn 1 ms nữa mới tới ${BREAK_START_DELAY_MS} ms mà đã mở giải lao`);

  await advance(1);

  assert.equal(calls.startBreak.length, 1,
    `đã qua ${BREAK_START_DELAY_MS} ms mà giải lao chưa mở`);
  assert.equal(calls.startBreak[0].sourceSessionId, 777);
  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);

  await timer.unmount();
});

test('[chống trùng] gọi finish() hai lần liên tiếp chỉ sinh MỘT Raw Event', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  await run(() => timer.api.finish());
  await run(() => timer.api.finish());

  assert.equal(calls.complete.length, 1, 'bấm hai lần không được cộng thưởng hai lần');

  await timer.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// D) CANCEL FOCUS — đường sinh Raw Event số 2
// ═══════════════════════════════════════════════════════════════════════════════

test('cancel(): gọi cancelFocusSession đúng 1 lần với tỉ lệ tiến độ + đủ khoá [call-site 678]', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(5 * 60_000); // 5/25 phút = 20%
  netLog = [];
  await run(() => timer.api.cancel());

  assert.equal(calls.cancel.length, 1);
  const [progressRatio, options] = calls.cancel[0];
  assert.ok(Math.abs(progressRatio - 0.2) < 1e-9, `tiến độ 20%, nhận ${progressRatio}`);
  assert.equal(options.recordSession, true);
  assert.equal(options.mode, TIMER_MODES.POMODORO);
  assert.equal(options.elapsedSeconds, 300);
  assert.equal(options.elapsedMinutes, 5);
  assert.equal(options.targetMinutes, 25);
  assert.equal(typeof options.sessionTiming, 'object');
  assert.equal(timer.api.timerState, TIMER_STATES.CANCELLED);
  assert.ok(netHits('game_state') > 0, 'pushNow phải chạy khi kết thúc phiên bằng huỷ');

  await timer.unmount();
});

test('[DI SẢN] cancel() lúc đang PAUSED CÓ cộng đoạn nghỉ đang mở (ngược với finish())', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(300_000);
  await run(() => timer.api.pause());
  await advance(120_000);   // đoạn nghỉ đang mở dài 2 phút
  await run(() => timer.api.cancel());

  const timing = calls.cancel[0][1].sessionTiming;
  assert.equal(timing.pausedTotalMs, 120_000, 'huỷ thì CÓ cộng đoạn nghỉ đang mở');
  assert.equal(timing.pauseSegments.length, 1);
  assert.equal(timing.pauseSegments[0].durationMs, 120_000);

  await timer.unmount();
});

test('[DI SẢN] cancel() làm tròn XUỐNG số phút, khác finish() làm tròn gần nhất', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(5 * 60_000 + 50_000); // 5 phút 50 giây
  await run(() => timer.api.cancel());

  assert.equal(calls.cancel[0][1].elapsedMinutes, 5, 'floor(5.83) = 5, KHÔNG phải round = 6');

  await timer.unmount();
});

test('cancel() và finish() lúc IDLE đều không sinh Raw Event', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.cancel());
  await run(() => timer.api.finish());

  assert.equal(calls.cancel.length, 0);
  assert.equal(calls.complete.length, 0);
  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);

  await timer.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// E) VISIBILITYCHANGE (và ranh giới với pagehide)
// ═══════════════════════════════════════════════════════════════════════════════

test('visibilitychange: quay lại tab thì tính lại số giây theo đồng hồ tường', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  // Tab bị hệ điều hành đóng băng: đồng hồ chạy nhưng bộ đếm KHÔNG nổ.
  jumpBy(10 * 60_000);
  assert.equal(timer.api.displaySeconds, 25 * 60, 'chưa quay lại thì số hiển thị còn cũ');

  await run(() => fireDocEvent('visibilitychange'));

  assert.equal(timer.api.displaySeconds, 15 * 60, 'quay lại phải bắt kịp đồng hồ thật');

  await timer.unmount();
});

test('visibilitychange: đang PAUSED thì KHÔNG tính lại (giữ nguyên số đang dừng)', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(60_000);
  await run(() => timer.api.pause());
  const frozen = timer.api.displaySeconds;

  jumpBy(10 * 60_000);
  await run(() => fireDocEvent('visibilitychange'));

  assert.equal(timer.api.displaySeconds, frozen);
  assert.equal(timer.api.timerState, TIMER_STATES.PAUSED);

  await timer.unmount();
});

test('[ranh giới] useTimer chỉ đăng ký visibilitychange, KHÔNG đăng ký pagehide, và gỡ sạch khi unmount', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal((docListeners.get('visibilitychange') ?? []).length, 1);
  assert.equal((docListeners.get('pagehide') ?? []).length, 0,
    'pagehide thuộc syncService.js (bản vá C1-3), đã có test ở syncService.behavior.test.js');

  await timer.unmount();

  assert.equal((docListeners.get('visibilitychange') ?? []).length, 0, 'không được rò rỉ listener');
});

// ═══════════════════════════════════════════════════════════════════════════════
// F) KHÔI PHỤC PHIÊN LÚC MOUNT — đường sinh Raw Event số 3 (ít ai để ý nhất)
// ═══════════════════════════════════════════════════════════════════════════════

test('khôi phục: phiên còn thời gian → RUNNING, số giây tính từ đồng hồ tường', async () => {
  await resetWorld();
  installSpies();
  seedPersistedSession();
  jumpBy(10 * 60_000); // đóng tab 10 phút rồi mở lại

  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);
  assert.equal(timer.api.displaySeconds, 15 * 60);
  assert.equal(timer.api.sessionStartedAt, T0);

  await timer.unmount();
});

test('khôi phục: phiên có pausedAt → PAUSED, bộ đếm không chạy', async () => {
  await resetWorld();
  installSpies();
  seedPersistedSession({ pausedAt: T0 + 5 * 60_000 });
  jumpBy(60 * 60_000);

  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(timer.api.timerState, TIMER_STATES.PAUSED);
  assert.equal(timer.api.displaySeconds, 20 * 60, 'số giây đóng băng tại lúc tạm dừng');

  await advance(60_000);
  assert.equal(timer.api.displaySeconds, 20 * 60, 'đang tạm dừng thì không được trôi');

  await timer.unmount();
});

test('khôi phục: phiên ĐÃ hết giờ → sinh Raw Event ngay lúc mount', async () => {
  await resetWorld();
  const calls = installSpies();
  seedPersistedSession();
  jumpBy(40 * 60_000); // quá hạn 15 phút

  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(calls.complete.length, 1, 'đây là đường sinh Raw Event THỨ HAI');
  assert.equal(calls.complete[0][0], 25);
  const timing = calls.complete[0][3];
  assert.equal(timing.startedAt, new Date(T0).toISOString());
  assert.equal(timing.finishedAt, new Date(T0 + 25 * 60_000).toISOString(),
    'mốc kết thúc là lúc HẾT GIỜ, không phải lúc mở lại tab');

  await timer.unmount();
});

test('[DI SẢN] khôi phục dùng công thức phút RIÊNG (round(tổng/60)), không dùng getCreditedFocusMinutes', async () => {
  await resetWorld();
  const calls = installSpies();
  // 25 phút 40 giây: đường finish() sẽ min(round(25.67), round(25.67)) = 26,
  // đường khôi phục dùng round(1540/60) = 26 — hiện TRÙNG nhau.
  // Bài này khoá NGUỒN của con số (tổng đã lưu), không khoá sự trùng hợp.
  seedPersistedSession({ totalSeconds: 1540 });
  jumpBy(60 * 60_000);

  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(calls.complete.length, 1);
  assert.equal(calls.complete[0][0], 26, 'lấy từ totalSeconds đã lưu, KHÔNG từ thời gian trôi thật');

  await timer.unmount();
});

test('[BUG KHÓA] khôi phục GHI ĐÈ pauseSegments bằng dữ liệu trong store; thiếu trường → mảng rỗng', async () => {
  await resetWorld();
  const calls = installSpies();
  // Dòng persist do máy khác ghi, thiếu hẳn trường pauseSegments.
  seedPersistedSession({ pausedTotalMs: 90_000, pauseSegments: undefined });
  jumpBy(40 * 60_000);

  const timer = await mountTimer({ focusMinutes: 25 });

  const timing = calls.complete[0][3];
  assert.deepEqual(timing.pauseSegments, [],
    'BUG ĐÃ BIẾT: lịch sử tạm dừng bị xoá sạch — đây là trường AI Coach đọc để tính '
    + '"phiên liền mạch" (getInterruptionPattern). Ghi ở TECH_DEBT, KHÔNG sửa ở task này.');
  assert.equal(timing.pausedTotalMs, 90_000, 'tổng thời gian nghỉ thì vẫn giữ');

  await timer.unmount();
});

test('extendCurrentSession(): cộng thêm giờ cho pomodoro [call-site 1345], trả false ở chế độ bấm giờ', async () => {
  await resetWorld();
  installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(60_000);
  netLog = [];
  const okPomodoro = await run(() => timer.api.extendCurrentSession(60));

  assert.equal(okPomodoro, true);
  assert.equal(timer.api.totalSeconds, 25 * 60 + 60);
  assert.equal(useGameStore.getState().timerSession.totalSeconds, 25 * 60 + 60);
  assert.ok(netHits('game_state') > 0, 'pushNow phải chạy sau khi cộng giờ');
  await timer.unmount();

  await resetWorld();
  installSpies();
  const stopwatch = await mountTimer({ focusMinutes: 25, mode: TIMER_MODES.STOPWATCH });
  await run(() => stopwatch.api.start());
  const okStopwatch = await run(() => stopwatch.api.extendCurrentSession(60));

  assert.equal(okStopwatch, false, 'bấm giờ không có khái niệm cộng thêm giờ');
  await stopwatch.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// G) POMODORO CHẠY TIẾP THÀNH BẤM GIỜ — phủ nốt các call-site pushNow còn lại
// ═══════════════════════════════════════════════════════════════════════════════

test('chạy tiếp: pomodoro hết giờ với thiết lập "chạy tiếp" → chuyển sang bấm giờ, KHÔNG sinh Raw Event [call-site 342]', async () => {
  await resetWorld();
  const calls = installSpies();
  useSettingsStore.setState({ continueTimingAfterPomodoro: true });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  netLog = [];
  await flushDueTimers();

  assert.equal(calls.complete.length, 0, 'chạy tiếp thì CHƯA kết thúc phiên');
  assert.equal(timer.api.activeMode, TIMER_MODES.STOPWATCH);
  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);
  assert.equal(timer.api.isContinuingAfterPomodoro, true);
  assert.equal(timer.api.visibleDisplaySeconds, 0, 'phần chạy tiếp đếm từ 0');
  assert.ok(netHits('game_state') > 0);

  await timer.unmount();
});

test('chạy tiếp: chạm ngưỡng xác nhận (mục tiêu + 15 phút) → tự dừng chờ xác nhận [call-site 372]', async () => {
  await resetWorld();
  const calls = installSpies();
  useSettingsStore.setState({ continueTimingAfterPomodoro: true });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  await flushDueTimers();                    // chuyển sang bấm giờ
  jumpBy(15 * 60 * 1000);
  netLog = [];
  await flushDueTimers();                    // chạm mốc 25 + 15 phút

  assert.equal(timer.api.timerState, TIMER_STATES.PAUSED);
  assert.equal(timer.api.continuedPomodoroConfirmationPending, true);
  assert.equal(calls.complete.length, 0, 'chờ xác nhận KHÔNG phải kết thúc phiên');
  assert.ok(netHits('game_state') > 0);

  await timer.unmount();
});

test('chạy tiếp: resume() sau khi chờ xác nhận đẩy ngưỡng lên thêm 15 phút nữa', async () => {
  await resetWorld();
  installSpies();
  useSettingsStore.setState({ continueTimingAfterPomodoro: true });
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  jumpBy(25 * 60 * 1000);
  await flushDueTimers();
  jumpBy(15 * 60 * 1000);
  await flushDueTimers();
  await run(() => timer.api.resume());

  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);
  assert.equal(timer.api.continuedPomodoroConfirmationPending, false);
  assert.equal(
    useGameStore.getState().timerSession.continuedPomodoroConfirmedUntilSeconds,
    (25 + 15 + 15) * 60,
  );

  await timer.unmount();
});

test('khôi phục: phiên pomodoro quá giờ với "chạy tiếp" → mở lại thành bấm giờ [call-site 1007]', async () => {
  await resetWorld();
  const calls = installSpies();
  seedPersistedSession({ continueAfterPomodoro: true });
  jumpBy(30 * 60_000); // quá hạn 5 phút
  netLog = [];

  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(calls.complete.length, 0, 'không được âm thầm kết thúc phiên đang chạy tiếp');
  assert.equal(timer.api.activeMode, TIMER_MODES.STOPWATCH);
  assert.equal(timer.api.timerState, TIMER_STATES.RUNNING);
  assert.equal(timer.api.displaySeconds, 30 * 60);
  assert.ok(netHits('game_state') > 0);

  await timer.unmount();
});

test('khôi phục: phiên chạy tiếp đã vượt ngưỡng xác nhận → mở lại ở trạng thái chờ xác nhận [call-site 930/941]', async () => {
  await resetWorld();
  const calls = installSpies();
  seedPersistedSession({
    mode: TIMER_MODES.STOPWATCH,
    continueAfterPomodoro: true,
    continuedPomodoroConfirmedUntilSeconds: (25 + 15) * 60,
  });
  jumpBy(50 * 60_000); // đã chạy 50 phút, vượt ngưỡng 40 phút
  netLog = [];

  const timer = await mountTimer({ focusMinutes: 25 });

  assert.equal(calls.complete.length, 0);
  assert.equal(timer.api.timerState, TIMER_STATES.PAUSED);
  assert.equal(timer.api.continuedPomodoroConfirmationPending, true);
  assert.equal(timer.api.displaySeconds, (25 + 15) * 60, 'đóng băng đúng tại ngưỡng');
  assert.ok(netHits('timer_live') > 0);
  assert.ok(netHits('game_state') > 0);

  await timer.unmount();
});

// ═══════════════════════════════════════════════════════════════════════════════
// H) RESET + hàm thuần
// ═══════════════════════════════════════════════════════════════════════════════

test('reset(): về IDLE, xoá phiên khỏi store, KHÔNG sinh Raw Event', async () => {
  await resetWorld();
  const calls = installSpies();
  const timer = await mountTimer({ focusMinutes: 25 });

  await run(() => timer.api.start());
  await advance(120_000);
  await run(() => timer.api.reset());

  assert.equal(timer.api.timerState, TIMER_STATES.IDLE);
  assert.equal(timer.api.displaySeconds, 25 * 60);
  assert.equal(useGameStore.getState().timerSession.isRunning, false);
  assert.equal(calls.complete.length, 0);
  assert.equal(calls.cancel.length, 0);

  await timer.unmount();
});

test('formatTime(): định dạng mm:ss, chặn giá trị âm và giá trị không hợp lệ', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(59), '00:59');
  assert.equal(formatTime(60), '01:00');
  assert.equal(formatTime(1500), '25:00');
  assert.equal(formatTime(-10), '00:00');
  assert.equal(formatTime(NaN), '00:00');
  assert.equal(formatTime(undefined), '00:00');
});
