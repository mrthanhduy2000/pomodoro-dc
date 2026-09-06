/**
 * gameStore.weeklyReport.test.js — khoá việc gỡ NGOẠI LỆ CUỐI của luật mức độ làm phiền
 * (2026-08-27, đóng `TECH_DEBT #87`).
 * ─────────────────────────────────────────────────────────────────────────────
 * Sáng thứ Hai, bản tổng kết tuần từng TỰ mở một hộp thoại chắn ngang app — thứ duy nhất còn
 * chặn màn hình mà không nằm trong bốn việc ADR-060 cho phép. Nay nó chỉ MỜI bằng một thẻ toast.
 *
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY, VÀ VÌ SAO NÓ ĐO Ở TẦNG STORE CHỨ KHÔNG Ở TẦNG THUẦN:
 * `TECH_DEBT #87` cảnh báo đúng một điều — bản cũ gộp "đã mời" với "đã xem" vào MỘT trường, và
 * `dismissWeeklyReport` ghi trường ấy ở mọi lần đóng. (ADR-076: dialog folded into Stats; `markWeeklyReportSeen` replaces open/dismiss.) Đẩy thẳng sang toast 4 giây mà giữ nguyên
 * cách ghi thì **lỡ một cái toast = mất báo cáo của cả tuần**. Cái mất ấy không nằm trong một hàm
 * thuần nào cả: nó nằm ở việc BỐN hành động (`checkWeeklyReport` · `openWeeklyReport` ·
 * `dismissWeeklyReportToast` · `dismissWeeklyReport`) ghi vào HAI trường theo đúng luật nào. Một
 * bài test thuần không thể thấy nó; chỉ chạy store thật mới thấy.
 *
 * ⚠️ ĐỒNG HỒ BỊ ĐÓNG BĂNG. `checkWeeklyReport` hỏi "hôm nay có phải thứ Hai không" bằng
 * `new Date()`, nên chạy bài test này vào thứ Ba thì nó lặng lẽ không kiểm gì cả — đúng kiểu
 * "xanh vì không đo gì" mà dự án đã bị cắn nhiều lần. `2026-08-24T03:00:00Z` là thứ Hai theo giờ
 * Việt Nam (UTC+7), và có một bài đối chứng bên dưới KHẲNG ĐỊNH điều đó thay vì tin lời chú thích.
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
  { buildRewardToasts },
  { getVietnamDayOfWeek, localWeekMondayStr },
] = await Promise.all([
  import('./gameStore.js'),
  import('../engine/rewardFeed.js'),
  import('../engine/time.js'),
]);

const initialState = useGameStore.getInitialState();

const MONDAY_ISO = '2026-08-24T03:00:00Z';
const MONDAY_KEY = '2026-08-24';
const TUESDAY_ISO = '2026-08-25T03:00:00Z';

const RealDate = Date;

/** Đóng băng đồng hồ. `new Date()` và `Date.now()` đều trả về đúng một mốc. */
function freezeAt(iso) {
  const fixed = new RealDate(iso).getTime();
  class FrozenDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) super(fixed);
      else super(...args);
    }

    static now() { return fixed; }
  }
  globalThis.Date = FrozenDate;
}

function unfreeze() { globalThis.Date = RealDate; }

/**
 * Store sạch, có sẵn một phiên trong lịch sử (điều kiện `history.length > 0` của
 * `checkWeeklyReport` — không có nó thì mọi bài dưới đây "xanh" vì chẳng gì chạy).
 */
function reset({ history = [{ id: 's1', minutes: 25 }], ...rest } = {}) {
  window.localStorage.clear();
  useGameStore.setState(initialState, true);
  useGameStore.setState({ history, ...rest });
}

function ui() { return useGameStore.getState().ui; }

test('ĐỐI CHỨNG ĐỒNG HỒ: mốc dùng trong file này thật sự là thứ Hai giờ VN', () => {
  freezeAt(MONDAY_ISO);
  try {
    assert.equal(getVietnamDayOfWeek(), 1, 'Không phải thứ Hai ⇒ mọi bài dưới đây không kiểm gì cả.');
    assert.equal(localWeekMondayStr(), MONDAY_KEY);
  } finally { unfreeze(); }

  freezeAt(TUESDAY_ISO);
  try {
    assert.notEqual(getVietnamDayOfWeek(), 1, 'Mốc "thứ Ba" phải KHÔNG phải thứ Hai.');
  } finally { unfreeze(); }
});

test('Monday only INVITES — no dialog flag exists any more (ADR-076: the summary is the Stats screen)', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();
    assert.equal(ui().weeklyReportPending, true, 'sáng thứ Hai phải có lời mời');
    assert.equal('weeklyReportOpen' in ui(), false, 'the dialog flag must not come back');
    assert.equal(useGameStore.getState().lastWeeklyReportDate, MONDAY_KEY);
    assert.equal(useGameStore.getState().lastWeeklyReportSeenDate, null, 'inviting is not seeing');
  } finally { unfreeze(); }
});

test('⚠️ TOAST TIMEOUT MUST NOT RECORD "SEEN" — the #87 trap; the dot stays until Stats is opened', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    const store = useGameStore.getState();
    store.checkWeeklyReport();
    store.dismissWeeklyReportToast();          // 4 seconds pass, Đàm did not tap
    assert.equal(ui().weeklyReportPending, false);
    assert.equal(useGameStore.getState().lastWeeklyReportSeenDate, null, 'a missed toast is not a seen report');
    useGameStore.getState().markWeeklyReportSeen();
    assert.equal(useGameStore.getState().lastWeeklyReportSeenDate, MONDAY_KEY);
    assert.equal(ui().weeklyReportPending, false);
  } finally { unfreeze(); }
});

test('Mỗi tuần MỜI ĐÚNG MỘT LẦN, dù mở app bao nhiêu lần', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();
    useGameStore.getState().dismissWeeklyReportToast();
    useGameStore.getState().checkWeeklyReport();
    assert.equal(ui().weeklyReportPending, false, 'mời lại lần hai trong cùng một tuần');
  } finally { unfreeze(); }
});

test('Chưa có phiên nào thì không mời — bản tổng kết rỗng thì mời cái gì', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset({ history: [] });
    useGameStore.getState().checkWeeklyReport();
    assert.equal(ui().weeklyReportPending, false);
  } finally { unfreeze(); }
});

test('Không phải thứ Hai thì không mời', () => {
  freezeAt(TUESDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();
    assert.equal(ui().weeklyReportPending, false);
  } finally { unfreeze(); }
});

test('NỐI HAI ĐẦU: cờ store bật ⇒ `buildRewardToasts` sinh thẻ đứng ĐẦU chồng, và thẻ dẫn tới Thống kê', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();
    useGameStore.setState((prev) => ({
      ui: { ...prev.ui, levelUpQueue: [{ levelsGained: 1, newLevel: 4, spGained: 2 }] },
    }));
    const toasts = buildRewardToasts(useGameStore.getState().ui);
    const weekly = toasts.find((t) => t.source === 'weekly');
    assert.ok(weekly, 'Store bật cờ mà bộ dựng toast không thấy ⇒ sáng thứ Hai không hiện gì cả.');
    assert.ok(toasts.length >= 2, 'Chồng phải có ít nhất hai thẻ, nếu không phép so thứ tự là vô nghĩa.');
    assert.equal(toasts[0].source, 'weekly');
    assert.deepEqual(weekly.action, { weekly: true, tab: 'stats' },
      'ADR-076: the toast must record seen through the store AND navigate to the Stats tab');
  } finally { unfreeze(); }
});
