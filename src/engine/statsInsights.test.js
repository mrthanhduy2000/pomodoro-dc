import test from 'node:test';
import assert from 'node:assert/strict';

import { buildStatsInsights, MAX_INSIGHTS } from './statsInsights';
import { localDateStr } from './time';

const NOW = new Date('2026-08-26T20:00:00+07:00');
const DAY = 86400000;

/** Dựng một lịch sử ĐỦ DÀY để phần lớn tín hiệu vượt được gác cỡ mẫu của chúng.
 *
 * ⚠️ GIỜ PHẢI ĐẶT THEO MÚI GIỜ VIỆT NAM, KHÔNG DÙNG `Date.setHours`. Bản đầu của fixture này
 * dùng `d.setHours(19, ...)` — tức 19 giờ theo giờ MÁY CHẠY TEST (UTC trong hộp cát) — trong khi
 * mã sản phẩm đọc giờ bằng `getVietnamHour`. Lệch 7 tiếng, nên nhóm phiên tôi cố ý đặt vào
 * "buổi tối" lại rơi vào "đêm khuya", và bài test khẳng định một điều về một khung giờ khác hẳn
 * khung giờ nó tưởng. Nó không đỏ — nó chỉ lặng lẽ kiểm sai chỗ.
 */
function duLieuDay() {
  const out = [];
  let id = 0;
  const them = (daysAgo, gioVN, extra = {}) => {
    const ngay = localDateStr(new Date(NOW.getTime() - daysAgo * DAY));
    const hh = String(gioVN).padStart(2, '0');
    out.push({
      id: `s${id++}`,
      timestamp: `${ngay}T${hh}:00:00+07:00`,
      minutes: 25,
      completed: true,
      pauseSegments: [],
      ...extra,
    });
  };
  // Buổi sáng: đạt mục tiêu đều — nuôi tín hiệu "giờ vàng".
  for (let i = 0; i < 24; i++) them(i, 9, { goalAchieved: true, minutes: 45 });
  // Đêm khuya: đạt thấp hẳn — nuôi "phiên khuya kém hơn".
  for (let i = 0; i < 20; i++) them(i, 23, { goalAchieved: i % 5 === 0, minutes: 20 });
  // Buổi tối: nhiều phiên huỷ — nuôi "hay bỏ giữa chừng".
  for (let i = 0; i < 14; i++) them(i, 19, { completed: false, status: 'cancelled', cancelled: true, minutes: 5 });
  // Vài phiên có tạm dừng — nuôi "phiên liền mạch".
  for (let i = 0; i < 10; i++) them(i, 14, { goalAchieved: i % 3 !== 0, pauseSegments: [{ at: 1 }] });
  return out;
}

test('KHÔNG CÓ DỮ LIỆU thì không bịa ra thẻ nào', () => {
  assert.deepEqual(buildStatsInsights([], { now: NOW }), []);
  assert.deepEqual(buildStatsInsights(null, { now: NOW }), []);
  assert.deepEqual(buildStatsInsights(undefined, { now: NOW }), []);
});

test('DỮ LIỆU MỎNG thì im lặng, KHÔNG hạ chuẩn cỡ mẫu để có cái mà hiện', () => {
  const it = buildStatsInsights([{ id: 'a', timestamp: NOW.toISOString(), minutes: 25, completed: true }], { now: NOW });
  assert.equal(it.length, 0, `một phiên duy nhất mà ra ${it.length} thẻ — gác cỡ mẫu đã bị thủng`);
});

// ⚠️ GÁC CHẠY-RỖNG. Không có bài này thì mọi bài dưới đây "đạt" một cách vô nghĩa khi
// `buildStatsInsights` trả về mảng rỗng, và không ai biết.
test('GÁC CHẠY-RỖNG — dữ liệu dày PHẢI sinh ra thẻ', () => {
  const it = buildStatsInsights(duLieuDay(), { now: NOW });
  assert.ok(it.length >= 3, `dữ liệu dày mà chỉ ra ${it.length} thẻ — fixture hoặc phép gọi đang hỏng`);
});

test('KHÔNG BAO GIỜ vượt trần số thẻ', () => {
  const it = buildStatsInsights(duLieuDay(), { now: NOW });
  assert.ok(it.length <= MAX_INSIGHTS, `ra ${it.length} thẻ, trần là ${MAX_INSIGHTS}`);
});

test('MỌI THẺ đều đủ trường và không có trường rỗng', () => {
  for (const x of buildStatsInsights(duLieuDay(), { now: NOW })) {
    for (const f of ['id', 'tone', 'headline', 'detail', 'sample']) {
      assert.ok(typeof x[f] === 'string' && x[f].length > 0, `thẻ ${x.id}: trường "${f}" rỗng`);
    }
    assert.ok(['good', 'warn', 'info'].includes(x.tone), `thẻ ${x.id}: tone lạ "${x.tone}"`);
  }
});

test('ID KHÔNG TRÙNG — một tín hiệu không được kể hai lần', () => {
  const ids = buildStatsInsights(duLieuDay(), { now: NOW }).map((x) => x.id);
  assert.equal(new Set(ids).size, ids.length, `id trùng: ${ids.join(',')}`);
});

// ⚠️ LUẬT NỘI DUNG (a) — cùng luật với AI Coach: mọi % phải đi kèm cỡ mẫu.
// THỬ-CHO-ĐỎ: bỏ trường `sample` của một thẻ bất kỳ ⇒ bài này đỏ.
test('MỌI PHẦN TRĂM ĐỀU KÈM CỠ MẪU — không có con số trần trụi', () => {
  const items = buildStatsInsights(duLieuDay(), { now: NOW });
  let coPhanTram = 0;
  for (const x of items) {
    const text = `${x.headline} ${x.detail}`;
    if (!/\d+%/.test(text)) continue;
    coPhanTram += 1;
    assert.ok(/\d/.test(x.sample), `thẻ "${x.id}" có % nhưng cỡ mẫu không chứa con số nào: "${x.sample}"`);
  }
  assert.ok(coPhanTram >= 2, `chỉ ${coPhanTram} thẻ có %, bài test này gần như không kiểm gì`);
});

// ⚠️ LUẬT NỘI DUNG (b) — nói TƯƠNG QUAN, không nói NHÂN QUẢ.
test('KHÔNG DÙNG TỪ NHÂN QUẢ — dữ liệu này không chứng minh được chiều nhân quả', () => {
  const cam = [' vì ', ' nên ', ' do ', ' bởi ', 'khiến', 'dẫn đến', 'gây ra'];
  for (const x of buildStatsInsights(duLieuDay(), { now: NOW })) {
    const text = ` ${x.headline} ${x.detail} `.toLowerCase();
    for (const tu of cam) {
      assert.ok(!text.includes(tu), `thẻ "${x.id}" dùng từ nhân quả "${tu.trim()}": ${x.detail}`);
    }
  }
});

test('XẾP HẠNG — việc cần để ý (warn) đứng trước điểm mạnh (good) và thông tin nền (info)', () => {
  const rank = { warn: 0, good: 1, info: 2 };
  const tones = buildStatsInsights(duLieuDay(), { now: NOW }).map((x) => rank[x.tone]);
  for (let i = 1; i < tones.length; i++) {
    assert.ok(tones[i] >= tones[i - 1], `thứ tự sai ở vị trí ${i}: ${tones.join(',')}`);
  }
});

test('TẤT ĐỊNH — cùng đầu vào thì cùng đầu ra (không phụ thuộc thứ tự Map hay ngẫu nhiên)', () => {
  const h = duLieuDay();
  assert.deepEqual(buildStatsInsights(h, { now: NOW }), buildStatsInsights(h, { now: NOW }));
});

test('LOẠI VIỆC BỎ BÊ chỉ xét khi có danh sách loại đang dùng', () => {
  const h = duLieuDay();
  const khong = buildStatsInsights(h, { now: NOW }).map((x) => x.id);
  assert.ok(!khong.includes('neglected'), 'không truyền activeCategoryIds mà vẫn ra thẻ bỏ bê');
});

// ⚠️ BÀI NÀY SINH RA TỪ MỘT LỖI THẬT (2026-08-30). `getNeglectedCategory` gọi
// `activeCategoryIds.has(...)` — nó chờ một **Set**. Bản đầu của `buildStatsInsights` truyền
// thẳng MẢNG xuống, nên nó ném `TypeError` giữa lúc render và cả màn Thống kê ra trang trắng.
// Lint không bắt (JS không có kiểu), build không bắt, và bài "LOẠI VIỆC BỎ BÊ chỉ xét khi có
// danh sách" ở trên cũng không bắt — vì nó chỉ đi vào nhánh KHÔNG truyền danh sách, tức đúng
// nhánh không có lỗi. Lỗi chỉ lộ khi chạy trên fixture thật.
// THỬ-CHO-ĐỎ: đổi `new Set(opts.activeCategoryIds)` về `opts.activeCategoryIds` ⇒ bài này đỏ.
test('LOẠI VIỆC BỎ BÊ — nhận MẢNG id và không được ném lỗi', () => {
  const h = duLieuDay();
  const themLoai = (daysAgo, catId, label) => {
    const ngay = localDateStr(new Date(NOW.getTime() - daysAgo * DAY));
    h.push({
      id: `c_${catId}_${daysAgo}`,
      timestamp: `${ngay}T10:00:00+07:00`,
      minutes: 60,
      completed: true,
      categoryId: catId,
      categorySnapshot: { label },
      pauseSegments: [],
    });
  };
  // ⚠️ PHẢI CÓ ÍT NHẤT HAI loại việc: `getNeglectedCategory` trả `null` khi `byCat.size < 2`, và
  // đó là gác ĐÚNG — "bị bỏ bê" là một phát biểu SO SÁNH, một loại việc duy nhất thì không có gì
  // để so. Fixture một-loại làm bài test đỏ trong khi mã hoàn toàn lành.
  for (let i = 14; i < 24; i++) themLoai(i, 'doc-sach', 'Đọc Sách');   // lâu rồi chưa đụng
  for (let i = 0; i < 10; i++) themLoai(i, 'lam-viec', 'Làm Việc');    // vẫn đang làm đều

  let items;
  assert.doesNotThrow(() => {
    items = buildStatsInsights(h, { now: NOW, activeCategoryIds: ['doc-sach', 'lam-viec'] });
  }, 'truyền MẢNG id phải chạy được — engine chờ Set nên phải chuyển kiểu ở đây');

  const neg = items.find((x) => x.id === 'neglected');
  assert.ok(neg, `phải ra thẻ "loại việc bỏ bê", chỉ nhận được: ${items.map((x) => x.id).join(',')}`);
  assert.ok(neg.headline.includes('Đọc Sách'), `thẻ phải gọi đúng tên loại việc: ${neg.headline}`);
  assert.ok(/\d/.test(neg.sample), 'thẻ phải kèm cỡ mẫu có số');
});
