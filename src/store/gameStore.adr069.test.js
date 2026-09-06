/**
 * gameStore.adr069.test.js — "ĐỒNG TIỀN DUY NHẤT LÀ PHIÊN" chạy THẬT qua store (2026-09-06, ADR-069).
 * ─────────────────────────────────────────────────────────────────────────────
 * Tầng thuần đã khoá ở `engine/buildChoices.test.js` và `engine/rankLadder.test.js`. File này khoá
 * ba thứ chỉ lộ ra khi có store thật:
 *   1. `startProject` đưa bản vẽ vào hàng chờ KHÔNG hỏi RP/nguyên liệu, nhưng vẫn giữ mọi cổng về
 *      hình dạng dữ liệu (ô hàng chờ · trùng · đã xây · trùng tu).
 *   2. `completeFocusSession` TỰ thăng bậc khi đủ EP + đủ phiên gần đây — và kể vào `pendingReward`.
 *   3. Khủng hoảng kỷ mở ra là nhiệm vụ mềm (không hộp thoại, không hạn), qua là có di vật.
 *
 * ⚠️ Bài học Phase 4H: một action viết xong, có test tầng thuần, mà không ai gọi thì vẫn xanh. Nên
 * bài quan trọng nhất ở đây là bài chứng minh cái NÚT thật sự đi tới hàng chờ.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
    clear: () => values.clear(),
  };
}

globalThis.window = {
  localStorage: createMemoryStorage(),
  sessionStorage: createMemoryStorage(),
};

const [
  { default: useGameStore },
  { BLUEPRINT_CATALOG, BLUEPRINT_META, CRAFT_QUEUE_SLOTS, ERA_CRISES, RANK_SYSTEM, RANK_XP_RATIOS },
  { eraEpRange },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/constants.js'),
  import('../engine/rankLadder.js'),
]);

const initialState = useGameStore.getInitialState();
const era7 = BLUEPRINT_CATALOG[7].map((bp) => bp.id);
const era5 = BLUEPRINT_CATALOG[5].map((bp) => bp.id);

function reset(patch = {}) {
  window.localStorage.clear();
  useGameStore.setState(initialState, true);
  const s = useGameStore.getState();
  useGameStore.setState({
    progress: { ...s.progress, activeBook: 7, totalEP: eraEpRange(7).start + 10 },
    craftingQueue: [],
    buildings: [],
    // Túi rỗng + 0 RP: chính ca mà `startCrafting` cũ từ chối thẳng.
    resources: {},
    resourcesRefined: {},
    research: { rp: 0, researched: [] },
    cityArchive: {},
    ...patch,
  });
}

// ─── 1. startProject ──────────────────────────────────────────────────────────

test('startProject: 0 RP · túi rỗng ⇒ VẪN khởi công được — cái giá chỉ còn là phiên và ô', () => {
  reset();
  const ok = useGameStore.getState().startProject(era7[0]);
  assert.equal(ok, true, 'startProject từ chối vì thiếu tiền ⇒ cổng cũ vẫn còn, ADR-069 chưa hề được nối vào');
  const st = useGameStore.getState();
  const item = st.craftingQueue.find((q) => q.bpId === era7[0]);
  assert.ok(item, 'bản vẽ không nằm trong hàng chờ');
  assert.equal(item.sessionsRemaining, BLUEPRINT_META[era7[0]].sessionsToComplete, 'số phiên phải là con số BLUEPRINT_META khai');
  assert.ok(Number.isFinite(item.startedAt), 'mục hàng chờ giữ NGUYÊN hình dạng cũ — tầng thành phố đọc nó');
  assert.ok(st.research.researched.includes(era7[0]), 'bản vẽ phải được ghi "đã mở" để thành tích/bảo tàng thấy');
  assert.equal(st.research.rp, 0, 'không được trừ RP');
});

test('startProject: giữ nguyên các cổng về hình dạng — trùng · đã xây · đầy ô', () => {
  reset();
  const s = useGameStore.getState();
  assert.equal(s.startProject(era7[0]), true);
  assert.equal(useGameStore.getState().startProject(era7[0]), false, 'cùng bản vẽ hai lần');
  assert.equal(useGameStore.getState().startProject(era7[1]), true);
  assert.equal(useGameStore.getState().craftingQueue.length, CRAFT_QUEUE_SLOTS);
  assert.equal(useGameStore.getState().startProject(era7[2]), false, 'hết ô thì phải từ chối — ô là cái giá duy nhất còn lại');

  reset({ buildings: [era7[3]] });
  assert.equal(useGameStore.getState().startProject(era7[3]), false, 'đã xây rồi');
  assert.equal(useGameStore.getState().startProject('bp_khong_ton_tai'), false, 'id lạ');
});

test('startProject: trùng tu di sản đi qua ô RIÊNG, không lấn ô của kỷ đang chơi (ADR-012 giữ nguyên)', () => {
  reset({ cityArchive: { 5: { built: [], levels: {}, sealedAt: '2026-05-01', epAtSeal: 1, sessionCount: 1 } } });
  const s = useGameStore.getState();
  assert.equal(s.startProject(era7[0]), true);
  assert.equal(useGameStore.getState().startProject(era7[1]), true);
  // Hai ô kỷ 7 đã đầy — di sản kỷ 5 VẪN vào được, vì nó có ô riêng.
  assert.equal(useGameStore.getState().startProject(era5[0]), true, 'di sản bị ô kỷ hiện tại chặn — bẫy Phase 4D quay lại');
  assert.equal(useGameStore.getState().startProject(era5[1]), false, 'ô di sản chỉ có một');
});

// ─── 2. Bậc tự thăng ──────────────────────────────────────────────────────────

function daySessionAt(minutesAgo, minutes) {
  return { timestamp: Date.now() - minutesAgo * 60_000, minutes, completed: true, status: 'completed' };
}

test('completeFocusSession: đủ EP gác + đủ phiên gần đây ⇒ TỰ lên bậc, kể vào pendingReward, không cần bấm gì', () => {
  const book = 7;
  const { start, gap } = eraEpRange(book);
  const req = RANK_SYSTEM[book].ranks[1].challengeRequirement;
  // EP đã qua gác của bậc 1; lịch sử đã có (req.sessions − 1) phiên đủ dài trong 48h; phiên này là phiên đủ.
  reset({
    progress: { ...initialState.progress, activeBook: book, totalEP: start + Math.floor(gap * RANK_XP_RATIOS[1]) + 50 },
    history: Array.from({ length: req.sessions - 1 }, (_, i) => daySessionAt((i + 1) * 60, req.minMinutes)),
    rankSystem: { ...initialState.rankSystem, [`book${book}`]: 0 },
  });
  const before = useGameStore.getState().rankSystem[`book${book}`];
  assert.equal(before, 0);

  useGameStore.getState().completeFocusSession(req.minMinutes);
  const st = useGameStore.getState();
  assert.equal(st.rankSystem[`book${book}`], 1, 'bậc không tự lên — ADR-069 chưa nối vào completeFocusSession');
  assert.equal(st.ui.pendingReward?.rankUp?.label, RANK_SYSTEM[book].ranks[1].label, 'chuỗi thẻ thưởng phải được kể bậc mới');
  assert.equal(st.rankChallenge, null, 'không còn thử thách chủ động');
});

test('completeFocusSession: thiếu phiên gần đây thì KHÔNG lên bậc dù EP dư — và không có gì bị phạt', () => {
  const book = 7;
  const { start, gap } = eraEpRange(book);
  reset({
    progress: { ...initialState.progress, activeBook: book, totalEP: start + gap - 100 },
    history: [],
    rankSystem: { ...initialState.rankSystem, [`book${book}`]: 0 },
  });
  useGameStore.getState().completeFocusSession(10); // phiên quá ngắn, không đủ ngưỡng bậc
  const st = useGameStore.getState();
  assert.equal(st.rankSystem[`book${book}`], 0);
  assert.equal(st.ui.pendingReward?.rankUp, null);
  assert.equal(st.ui.disasterModalOpen, undefined, 'không còn hộp thoại phạt — cờ đã gỡ hẳn');
});

// ─── 3. Khủng hoảng kỷ = nhiệm vụ mềm ─────────────────────────────────────────

test('khủng hoảng kỷ mở ra ở dạng nhiệm vụ mềm: không hộp thoại, không hạn, không chặn; qua thì có di vật', () => {
  const book = 7;
  const crisis = ERA_CRISES[book];
  const opt = crisis.challengeOption;
  // Đặt EP ngay dưới mốc kích hoạt để phiên này vượt qua nó.
  reset({
    progress: { ...initialState.progress, activeBook: book, totalEP: crisis.triggerEP - 1 },
    history: [],
    eraCrisis: { ...initialState.eraCrisis },
  });
  useGameStore.getState().completeFocusSession(25);
  let st = useGameStore.getState();
  assert.equal(st.eraCrisis.active, true, 'phiên vượt mốc phải mở khủng hoảng — bài test đang chạy rỗng nếu không');
  assert.equal(st.eraCrisis.choiceMade, 'challenge', 'mở ra là nhiệm vụ mềm ngay, không đợi chọn');
  assert.equal(st.eraCrisis.challengeDeadline, null, 'không còn hạn');
  assert.equal(st.ui.eraCrisisModalOpen, false, 'không còn hộp thoại chặn');
  assert.equal(st.ui.pendingReward?.crisisOpened?.name, crisis.name, 'chuỗi thẻ phải được kể thử thách vừa mở');

  // Làm đủ phiên dài trong cửa sổ ⇒ qua, di vật vào túi, không ai bấm gì.
  useGameStore.setState({
    history: Array.from({ length: opt.sessions - 1 }, (_, i) => daySessionAt((i + 1) * 60, opt.minMinutes)),
  });
  useGameStore.getState().completeFocusSession(opt.minMinutes);
  st = useGameStore.getState();
  assert.equal(st.eraCrisis.active, false, 'đủ phiên mà không qua');
  assert.equal(st.eraCrisis.passed, true);
  assert.ok(st.relics.some((r) => r.id === opt.successRelic.id), 'di vật không vào túi');
  assert.equal(st.ui.pendingReward?.relicEarned?.id, opt.successRelic.id, 'chuỗi thẻ phải được kể di vật');
});

test('checkEraCrisisDeadlines: dữ liệu đời cũ (chưa chọn / còn hạn) được đưa về nhiệm vụ mềm, không phạt', () => {
  const crisis = ERA_CRISES[7];
  reset({
    eraCrisis: {
      ...initialState.eraCrisis,
      active: true,
      crisisId: crisis.id,
      name: crisis.name,
      icon: crisis.icon,
      challengeOption: crisis.challengeOption,
      choiceMade: null,
      challengeDeadline: Date.now() - 1000,
      challengeSessionsRequired: crisis.challengeOption.sessions,
      challengeMinMinutes: crisis.challengeOption.minMinutes,
    },
    resources: { book7: { x: 100 } },
  });
  const changed = useGameStore.getState().checkEraCrisisDeadlines();
  assert.equal(changed, true);
  const st = useGameStore.getState();
  assert.equal(st.eraCrisis.active, true, 'vẫn mở — không có "hết hạn"');
  assert.equal(st.eraCrisis.choiceMade, 'challenge');
  assert.equal(st.eraCrisis.challengeDeadline, null);
  assert.equal(st.resources.book7.x, 100, 'không trừ tài nguyên');
  assert.equal(st.ui.disasterModalOpen, undefined, 'cờ hộp thoại phạt đã gỡ hẳn');
  assert.equal(useGameStore.getState().checkEraCrisisDeadlines(), false, 'đã chuẩn hoá thì lần sau không đổi gì');
});
