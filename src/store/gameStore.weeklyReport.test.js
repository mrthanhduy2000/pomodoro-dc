/**
 * gameStore.weeklyReport.test.js — khoá việc gỡ NGOẠI LỆ CUỐI của luật mức độ làm phiền
 * (2026-08-27, đóng `TECH_DEBT #87`).
 * ─────────────────────────────────────────────────────────────────────────────
 * Sáng thứ Hai, bản tổng kết tuần từng TỰ mở một hộp thoại chắn ngang app — thứ duy nhất còn
 * chặn màn hình mà không nằm trong bốn việc ADR-060 cho phép. Nay nó chỉ MỜI bằng một thẻ toast.
 *
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY, VÀ VÌ SAO NÓ ĐO Ở TẦNG STORE CHỨ KHÔNG Ở TẦNG THUẦN:
 * `TECH_DEBT #87` cảnh báo đúng một điều — bản cũ gộp "đã mời" với "đã xem" vào MỘT trường, và
 * `dismissWeeklyReport` ghi trường ấy ở mọi lần đóng. Đẩy thẳng sang toast 4 giây mà giữ nguyên
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

test('Sáng thứ Hai CHỈ MỜI — tuyệt đối không tự mở hộp thoại chặn màn hình', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();

    assert.equal(ui().weeklyReportPending, true, 'Phải có một lời mời (thẻ toast).');
    assert.equal(ui().weeklyReportOpen, false,
      '⚠️ HỘP THOẠI KHÔNG ĐƯỢC TỰ BẬT. Đây là cả lý do của `TECH_DEBT #87`: chặn màn hình chỉ dành\n'
      + 'cho lên kỷ · thăng hoa · khủng hoảng kỷ · thảm hoạ (ADR-060). Bản tổng kết không nằm trong bốn thứ đó.');
  } finally { unfreeze(); }
});

test('⚠️ TOAST HẾT GIỜ KHÔNG ĐƯỢC GHI "ĐÃ XEM" — đây chính là cái bẫy của #87', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    const store = useGameStore.getState();
    store.checkWeeklyReport();
    store.dismissWeeklyReportToast();          // 4 giây trôi qua, Đàm không kịp bấm

    assert.equal(ui().weeklyReportPending, false, 'Lời mời phải tắt.');
    assert.equal(useGameStore.getState().lastWeeklyReportSeenDate, null,
      '⚠️ Lỡ một cái toast KHÔNG được tính là đã xem. Ghi "đã xem" ở đây nghĩa là mất báo cáo của\n'
      + 'cả tuần — đúng thứ mà #87 bắt phải tách hai trạng thái TRƯỚC khi đụng vào tính năng này.');

    // Và lưới an toàn phải còn nguyên: cú bấm sau đó vẫn mở đúng bản TUẦN TRƯỚC.
    useGameStore.getState().openWeeklyReport();
    assert.equal(ui().weeklyReportMode, 'previous',
      'Lỡ toast rồi thì nút "Báo cáo tuần" phải đưa đúng bản tuần trước — thứ hộp thoại cũ vẫn đưa.');
  } finally { unfreeze(); }
});

test('Cú mở ĐẦU TIÊN trong tuần là bản TUẦN TRƯỚC; những cú sau là tuần đang chạy', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    const store = useGameStore.getState();

    store.openWeeklyReport();
    assert.equal(ui().weeklyReportMode, 'previous',
      'Đổi sang toast mà quên luật này là âm thầm đổi luôn NỘI DUNG Đàm nhận được: nút thanh bên\n'
      + 'xưa nay mở `current` (tuần đang chạy dở), còn hộp thoại tự bật thì mở `previous`.');
    assert.equal(useGameStore.getState().lastWeeklyReportSeenDate, MONDAY_KEY, 'Mở ra = đã xem.');

    store.dismissWeeklyReport();
    useGameStore.getState().openWeeklyReport();
    assert.equal(ui().weeklyReportMode, 'current', 'Đã xem tuần trước rồi thì lần sau xem tuần này.');
  } finally { unfreeze(); }
});

test('Đóng hộp thoại KHÔNG ghi ngày nào — "đã xem" đã ghi lúc MỞ', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset({ lastWeeklyReportDate: null });
    const store = useGameStore.getState();
    store.dismissWeeklyReport();

    assert.equal(useGameStore.getState().lastWeeklyReportSeenDate, null,
      'Đóng một hộp thoại chưa từng mở mà đã tính là xem thì lại đúng cái bệnh cũ.');
    assert.equal(useGameStore.getState().lastWeeklyReportDate, null,
      '`dismissWeeklyReport` không còn là chỗ chốt tuần nữa — `checkWeeklyReport` mới là.');
  } finally { unfreeze(); }
});

test('Mỗi tuần MỜI ĐÚNG MỘT LẦN, dù mở app bao nhiêu lần', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();
    assert.equal(useGameStore.getState().lastWeeklyReportDate, MONDAY_KEY, 'Phải chốt "đã mời" ngay.');

    useGameStore.getState().dismissWeeklyReportToast();
    useGameStore.getState().checkWeeklyReport();       // mở lại app trong cùng ngày thứ Hai
    assert.equal(ui().weeklyReportPending, false,
      'Mời lại mỗi lần mở app là biến một lời mời thành một sự đeo bám.');
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

test('NỐI HAI ĐẦU: cờ store bật ⇒ `buildRewardToasts` thật sự sinh ra thẻ, và nó đứng ĐẦU chồng', () => {
  freezeAt(MONDAY_ISO);
  try {
    reset();
    useGameStore.getState().checkWeeklyReport();

    // ⚠️ PHẢI CÓ MỘT THẺ THỨ HAI TRONG CHỒNG. Bản đầu của bài này chỉ dựng mỗi thẻ tuần rồi hỏi
    // `toasts[0].source === 'weekly'` — và nó XANH kể cả khi gỡ `'weekly'` khỏi `SOURCE_ORDER`,
    // vì một danh sách một phần tử thì phần tử nào cũng đứng đầu. Một phép sắp xếp chỉ kiểm được
    // khi có thứ để sắp. (Bắt được đúng lúc chạy phép thử ngược, không phải lúc đọc lại mã.)
    useGameStore.setState((prev) => ({
      ui: { ...prev.ui, rankUpNotification: { rankLabel: 'Thử Thách Mẫu' } },
    }));

    const state = useGameStore.getState();
    const toasts = buildRewardToasts(state.ui, state.missions);
    const weekly = toasts.find((t) => t.source === 'weekly');

    assert.ok(weekly, 'Store bật cờ mà bộ dựng toast không thấy ⇒ sáng thứ Hai không hiện gì cả.');
    assert.ok(toasts.length >= 2, 'Chồng phải có ít nhất hai thẻ, nếu không phép so thứ tự là vô nghĩa.');
    assert.equal(toasts[0].source, 'weekly',
      'Thẻ này chỉ đến một lần mỗi tuần và không thể tự đến lần thứ hai — xếp nó xuống dưới là mở\n'
      + 'đường cho nó rơi khỏi ba thẻ đầu rồi biến mất.');
    assert.deepEqual(weekly.action, { weekly: true },
      'Phải đi qua `openWeeklyReport()` của store — nơi giữ luật "cú mở đầu tiên là bản tuần trước".');
  } finally { unfreeze(); }
});
