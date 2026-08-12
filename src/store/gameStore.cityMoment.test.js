/**
 * gameStore.cityMoment.test.js — NỐI HAI ĐẦU: store THẬT → engine "khoảnh khắc thành phố".
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI (đọc trước khi sửa):
 * Phase 4′ có hai lớp test, và cả hai đều CÓ THỂ XANH trong khi tính năng vẫn hỏng:
 *   • `engine/cityMoment.test.js` đưa giàn giáo TỰ TAY DỰNG vào engine — nó chứng minh engine
 *     tính đúng, nhưng không chứng minh store có bao giờ đưa cho engine đúng thứ đó không.
 *   • Phép soi bằng trình duyệt thì BƠM THẲNG `pendingReward` qua `window.__store` — nó chứng
 *     minh giao diện hiện đúng, nhưng cũng bơm tay luôn cái trường mà nó đáng lẽ phải kiểm.
 *
 * Chỗ hở nằm chính giữa: **`completeFocusSession` có thật sự sinh ra `newlyBuiltIds` không, và
 * hàng đợi thật sau một phiên thật có khớp với câu chữ hiện ra không.** Đổi tên trường, đổi thứ
 * tự dọn hàng đợi, hay lọc nhầm kỷ — cả hai lớp test kia đều KHÔNG đỏ, còn Đàm thì hoàn thành một
 * công trình mà không có lễ mừng nào.
 *
 * File này chạy ĐÚNG đường thật: gọi `completeFocusSession()` rồi lấy state SAU ĐÓ nuôi thẳng vào
 * `computeCityLayout` + `buildGrowthMoment`/`buildFocusTease`. Không có fixture nào tự chế.
 *
 * (Cách dựng store mượn nguyên của `gameStore.completeFocusSession.test.js` — cùng một khuôn.)
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
  { computeCityLayout },
  { buildFocusTease, buildGrowthMoment },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/cityLayout.js'),
  import('../engine/cityMoment.js'),
]);

const initialState = useGameStore.getInitialState();
const realRandom = Math.random;
const NO_EVENT = 0.999999;

/** Dựng lại store sạch, đặt sẵn một hàng đợi xây dựng. */
function resetWithQueue(queue = []) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  useGameStore.setState(initialState, true);
  useGameStore.setState({ craftingQueue: queue });
}

/** Chạy một phiên THẬT rồi trả về state sau phiên (tắt sự kiện ngẫu nhiên cho tất định). */
function runSession(minutes = 25) {
  Math.random = () => NO_EVENT;
  try {
    useGameStore.getState().completeFocusSession(minutes);
  } finally {
    Math.random = realRandom;
  }
  return useGameStore.getState();
}

/** Đúng thứ mà `RewardSequence` dựng ở lúc chạy — không thêm bớt gì. */
function momentFrom(state) {
  const layout = computeCityLayout({
    built: state.buildings,
    era: state.progress.activeBook,
    pending: state.craftingQueue,
  });
  return buildGrowthMoment({
    newlyBuilt: state.ui.pendingReward?.newlyBuiltIds ?? [],
    scaffolds: layout.scaffolds,
    acceleratedIds: state.ui.pendingReward?.acceleratedCraftingIds ?? [],
  });
}

function teaseFrom(state) {
  const layout = computeCityLayout({
    built: state.buildings,
    era: state.progress.activeBook,
    pending: state.craftingQueue,
  });
  return buildFocusTease({
    scaffolds: layout.scaffolds,
    hasBuilt: state.buildings.length > 0,
  });
}

// ─────────────────────────────────────────────────────────────────────────────

test('PHIÊN THẬT hoàn thành một công trình ⇒ store CÓ ghi `newlyBuiltIds`, và lễ mừng khoe nó', () => {
  // ⚠️ Đây là bài quan trọng nhất file. `newlyBuiltIds` là trường DUY NHẤT mà Phase 4′ thêm vào
  // store; nếu nó im lặng rỗng thì lễ mừng vẫn chạy — chỉ là nó khoe giàn giáo kế tiếp thay vì
  // khoe cái công trình vừa xong. Hỏng theo kiểu KHÔNG có gì đỏ, và đúng vào lần đáng nhớ nhất.
  resetWithQueue([{ bpId: 'bp_hang_dong', sessionsRemaining: 1, startedAt: '2026-08-11T02:00:00.000Z' }]);
  const s = runSession(25);

  assert.ok(s.buildings.includes('bp_hang_dong'), 'công trình chưa được dựng vào thành phố');
  assert.equal(s.craftingQueue.length, 0, 'hàng đợi chưa được dọn');
  assert.deepEqual(s.ui.pendingReward.newlyBuiltIds, ['bp_hang_dong']);

  const moment = momentFrom(s);
  assert.ok(moment, 'phiên vừa dựng xong một công trình mà KHÔNG có lễ mừng nào');
  assert.equal(moment.kind, 'built');
  assert.match(moment.headline, /hoàn thành/i);
  assert.match(moment.detail, /Hang Động/);
  assert.equal(moment.progress, 1);
});

test('PHIÊN THẬT chưa xong ⇒ lễ mừng nói ĐÚNG số phiên còn lại của hàng đợi thật', () => {
  // Con số trong câu chữ phải là con số trong store, không phải một phép trừ chạy song song.
  resetWithQueue([{ bpId: 'bp_cong_cu_da', sessionsRemaining: 3, startedAt: '2026-08-11T02:00:00.000Z' }]);
  const s = runSession(25);

  const remaining = s.craftingQueue[0].sessionsRemaining;
  assert.equal(remaining, 2, 'một phiên phải trừ đúng một bước');
  assert.equal(s.ui.pendingReward.newlyBuiltIds.length, 0, 'chưa xong mà đã báo là xong');

  const moment = momentFrom(s);
  assert.equal(moment.kind, 'scaffold');
  assert.match(moment.detail, new RegExp(`còn ${remaining} phiên`));
  // Vạch xuất phát phải lùi đúng MỘT bước so với vạch hiện tại — tức đúng một phiên vừa rồi.
  assert.ok(moment.fromProgress < moment.progress, 'thanh tiến độ không nhích lên');
});

test('PHIÊN THẬT không có công trường nào ⇒ IM LẶNG, đi thẳng vào phần thưởng', () => {
  // Đây là nhánh hỏng-theo-hướng-mở. Nếu nó bỗng trả về một khoảnh khắc, Đàm sẽ bị chèn một lời
  // chúc mừng rỗng vào giữa mỗi phiên — và mọi lời chúc mừng sau đó đều mất giá.
  resetWithQueue([]);
  const s = runSession(25);

  assert.equal(s.ui.lootModalOpen, true, 'phần thưởng phải luôn được bật đồng bộ như cũ');
  assert.equal(momentFrom(s), null);
});

test('DÒNG TRƯỚC PHIÊN đọc cùng một hàng đợi thật với lễ mừng sau phiên', () => {
  // Hai đầu của một phiên phải nói về cùng một công trình và cùng một con số. Nếu lệch, Đàm sẽ
  // thấy "còn 2 phiên" trước khi bấm rồi "còn 3 phiên" sau khi xong.
  resetWithQueue([{ bpId: 'bp_cong_cu_da', sessionsRemaining: 3, startedAt: '2026-08-11T02:00:00.000Z' }]);
  const s = runSession(25);

  const moment = momentFrom(s);
  const tease = teaseFrom(s);
  assert.equal(tease.bpId, moment.bpId);
  assert.match(tease.text, /còn 2 phiên/);
  assert.match(moment.detail, /còn 2 phiên/);
});

test('DÒNG TRƯỚC PHIÊN: xong công trình cuối ⇒ đổi sang giọng "xưởng trống", không im lặng nhầm', () => {
  // Sau khi xây xong cái cuối cùng, Đàm ĐÃ có công trình ⇒ phải được nghe sự thật là xưởng trống,
  // chứ không rơi vào nhánh im-lặng-dành-cho-người-mới.
  resetWithQueue([{ bpId: 'bp_hang_dong', sessionsRemaining: 1, startedAt: '2026-08-11T02:00:00.000Z' }]);
  const s = runSession(25);

  const tease = teaseFrom(s);
  assert.equal(tease.tone, 'idle');
  assert.match(tease.text, /Xưởng đang trống/);
});

test('`newlyBuiltIds` KHÔNG lên Supabase — nó chỉ là trường hiển thị', () => {
  // ⚠️ `ui` không nằm trong `partialize`, nên trường này không thêm byte nào vào JSONB đang tranh
  // chấp CAS. Đây là điều kiện an toàn đã ghi trong ADR-010; nếu ai đó đưa `ui` vào phần được lưu
  // thì mỗi phiên sẽ đẩy thêm dữ liệu lên đám mây mà không ai để ý.
  resetWithQueue([{ bpId: 'bp_hang_dong', sessionsRemaining: 1, startedAt: '2026-08-11T02:00:00.000Z' }]);
  runSession(25);

  const raw = window.localStorage.getItem('dc-pomodoro-v1');
  assert.ok(raw, 'store chưa ghi gì xuống localStorage');
  assert.equal(raw.includes('newlyBuiltIds'), false, '`ui.pendingReward` đang bị lưu xuống đĩa');
  assert.equal(raw.includes('pendingReward'), false, 'toàn bộ `ui` đáng lẽ nằm ngoài phần được lưu');
});
