/**
 * craftProgress.test.js — canh MỘT công thức tiến độ xây, và canh cả nguồn số của nó.
 *
 * Bài quan trọng nhất ở đây KHÔNG phải bài kẹp biên (dễ đoán), mà là bài cuối: **hai bảng
 * `BLUEPRINT_META` và `BUILDING_EFFECTS` phải luôn khớp nhau về `sessionsToComplete`**. Hôm nay
 * chúng khớp 75/75, nên nếu bài đó có xanh cũng không chứng minh được gì về hiện tại — giá trị của
 * nó nằm ở TƯƠNG LAI: ngày ai đó chỉnh cân bằng ở một bảng mà quên bảng kia, đây là thứ duy nhất
 * đỏ lên. Không có nó thì hai màn hình lặng lẽ hiện hai tiến độ khác nhau cho cùng một công trình.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG, BLUEPRINT_META, BUILDING_EFFECTS } from './constants';
import { describeCraftProgress, blueprintLabel } from './craftProgress';

/** Một bản vẽ có `sessionsToComplete` biết chắc, để khỏi phụ thuộc số cụ thể của cân bằng. */
const SAMPLE = BLUEPRINT_CATALOG[4][0].id;
const SAMPLE_TOTAL = BUILDING_EFFECTS[SAMPLE].sessionsToComplete;

test('ca thường: còn N phiên → đã xong total−N, tỉ lệ khớp', () => {
  const p = describeCraftProgress(SAMPLE, SAMPLE_TOTAL);
  assert.equal(p.total, SAMPLE_TOTAL);
  assert.equal(p.remaining, SAMPLE_TOTAL);
  assert.equal(p.done, 0);
  assert.equal(p.ratio, 0);
  assert.equal(p.pct, 0);

  const q = describeCraftProgress(SAMPLE, 0);
  assert.equal(q.done, SAMPLE_TOTAL);
  assert.equal(q.ratio, 1);
  assert.equal(q.pct, 100);
});

test('CÒN LẠI NHIỀU HƠN TỔNG → kẹp, KHÔNG được ra số âm ("-4/2 phiên")', () => {
  // ⚠️ Đây là lỗi ĐÃ HIỆN RA MÀN HÌNH ngày 2026-08-13 trong `BuildingWorkshop.jsx`: một mục hàng đợi
  // có `sessionsRemaining` lớn hơn `sessionsToComplete` vẽ ra dòng chữ "-4/2 phiên" kèm thanh rỗng.
  // Dữ liệu kiểu này tới được từ cloud lệch, từ file import cũ, hoặc từ một bản cân bằng rút ngắn
  // số phiên của bản vẽ — tức nó KHÔNG phải chuyện giả tưởng.
  const p = describeCraftProgress(SAMPLE, SAMPLE_TOTAL + 99);
  assert.equal(p.remaining, SAMPLE_TOTAL, 'còn lại phải kẹp về đúng tổng');
  assert.equal(p.done, 0, 'đã xong không bao giờ được âm');
  assert.equal(p.ratio, 0);
  assert.equal(p.pct, 0);
});

test('đầu vào rác cho số phiên → coi như còn 0, không NaN', () => {
  for (const bad of [undefined, null, NaN, Infinity, -5, 'x', {}]) {
    const p = describeCraftProgress(SAMPLE, bad);
    assert.ok(Number.isFinite(p.ratio), `ratio phải là số với đầu vào ${String(bad)}`);
    assert.ok(p.ratio >= 0 && p.ratio <= 1, `ratio phải nằm trong [0,1] với ${String(bad)}`);
    assert.ok(p.remaining >= 0);
    assert.ok(p.done >= 0);
  }
});

test('BẢN VẼ LẠ → tổng `null` và tỉ lệ 0, TUYỆT ĐỐI không phải 1', () => {
  // Không biết tổng thì không được đoán bừa. Thanh đầy sẽ hứa một công trình sắp xong mà không ai
  // biết có thật không — đúng tinh thần chống-bịa đang áp cho AI Coach, áp lại cho giao diện.
  const p = describeCraftProgress('bp_khong_co_that', 3);
  assert.equal(p.total, null);
  assert.equal(p.ratio, 0);
  assert.equal(p.pct, 0);
  assert.equal(p.remaining, 3, 'vẫn giữ con số thô để màn hình nói được "còn 3 phiên"');
});

test('ĐI HẾT 75 BẢN VẼ: không bản nào cho ra NaN / âm / vượt 100%', () => {
  for (const era of Object.keys(BLUEPRINT_CATALOG)) {
    for (const bp of BLUEPRINT_CATALOG[era]) {
      const total = BUILDING_EFFECTS[bp.id]?.sessionsToComplete;
      for (const remaining of [0, 1, total, total + 1, total * 3]) {
        const p = describeCraftProgress(bp.id, remaining);
        assert.ok(Number.isFinite(p.pct) && p.pct >= 0 && p.pct <= 100,
          `${bp.id} còn ${remaining} → pct=${p.pct}`);
        assert.ok(p.done >= 0 && p.remaining >= 0, `${bp.id}: có số âm`);
      }
    }
  }
});

test('HAI BẢNG PHẢI KHỚP: `BLUEPRINT_META` và `BUILDING_EFFECTS` cùng một `sessionsToComplete`', () => {
  // ⚠️ Bài này canh TƯƠNG LAI, không canh hiện tại. Hôm nay hai bảng khớp 75/75 — đã đo — nên nó
  // xanh một cách hiển nhiên. Nhưng trước Phase 4E, `cityLayout.js` đọc `BUILDING_EFFECTS` còn
  // `BuildingWorkshop.jsx` đọc `BLUEPRINT_META` cho CÙNG một con số. Ngày ai đó chỉnh cân bằng ở
  // một bảng mà quên bảng kia, hai màn hình sẽ hiện hai tiến độ khác nhau cho cùng một công trình
  // và **không có gì đỏ lên**. Đây là thứ duy nhất đỏ.
  //
  // (Nay cả hai màn hình đều gọi `describeCraftProgress`, tức chỉ còn đọc `BUILDING_EFFECTS`. Bài
  // test vẫn giữ vì `BLUEPRINT_META.sessionsToComplete` còn được dùng ở chỗ khác — dòng "N phiên để
  // hoàn thành" trong thẻ bản vẽ chưa xây — nên hai bảng vẫn phải nói cùng một con số.)
  const mismatched = [];
  for (const era of Object.keys(BLUEPRINT_CATALOG)) {
    for (const bp of BLUEPRINT_CATALOG[era]) {
      const meta = BLUEPRINT_META[bp.id]?.sessionsToComplete;
      const eff  = BUILDING_EFFECTS[bp.id]?.sessionsToComplete;
      if (meta !== eff) mismatched.push(`${bp.id}: META=${meta} ≠ EFFECTS=${eff}`);
    }
  }
  assert.deepEqual(mismatched, [],
    'hai bảng lệch nhau về số phiên xây — tab Thành Phố và Xưởng sẽ nói hai con số khác nhau');
});

/**
 * ⚠️ BÀI NÀY RA ĐỜI TỪ MỘT BUG CẮN HAI LẦN TRONG MỘT PHIÊN (2026-09-02).
 * Chuỗi tra tên bản vẽ bị chép ra BA nơi và sai ở hai nơi khác nhau: một chỗ hỏi `.name` (trường
 * KHÔNG tồn tại — cả hai bảng đều dùng `label`), một chỗ chỉ hỏi `BUILDING_EFFECTS` rồi rơi về
 * "Công trình". Cả hai im lặng, vì `??` nuốt gọn và câu hỏng đọc lên vẫn xuôi tai
 * ("Công trình sẽ mọc lên trong thành phố."). Nay chỉ còn MỘT hàm.
 */
test('blueprintLabel: tra được tên thật, và KHÔNG bao giờ trả về undefined', () => {
  const moiBanVe = Object.values(BLUEPRINT_CATALOG).flat().filter((b) => b?.id);
  assert.ok(moiBanVe.length >= 50, `mới thấy ${moiBanVe.length} bản vẽ — phép đo đang chạy rỗng`);

  // MỌI bản vẽ phải tra ra tên thật — không cái nào được rơi về câu mặc định.
  const roiVeMacDinh = moiBanVe.filter((b) => blueprintLabel(b.id) === 'Công trình');
  assert.deepEqual(roiVeMacDinh.map((b) => b.id), [], 'có bản vẽ không tra ra tên');
  assert.equal(blueprintLabel(moiBanVe[0].id), moiBanVe[0].label);

  assert.equal(blueprintLabel('bp_khong_ton_tai'), 'Công trình', 'id lạ phải rơi về câu mặc định');
  assert.equal(blueprintLabel(null), 'Công trình');
  assert.equal(blueprintLabel(undefined, 'X'), 'X');
});

// ⚠️ Bài này nhốt SỰ THẬT đã làm ba bản chép sai: KHÔNG bảng nào có `name`, và `BUILDING_EFFECTS`
// KHÔNG có `label`. Ngày nào một trong hai điều đó đổi thì bài này đỏ và nhắc người ta đọc lại.
test('không bảng nào dùng `name`, và BUILDING_EFFECTS không giữ tên hiển thị', () => {
  const moiBanVe = Object.values(BLUEPRINT_CATALOG).flat().filter((b) => b?.id);
  assert.equal(moiBanVe.filter((b) => b.name !== undefined).length, 0, 'catalog không có `name`');

  const hieuUng = Object.values(BUILDING_EFFECTS);
  assert.ok(hieuUng.length >= 50, 'phép đo đang chạy rỗng');
  assert.equal(
    hieuUng.filter((v) => v?.label).length, 0,
    'BUILDING_EFFECTS nay CÓ `label` — nếu vậy phải quyết lại đâu là nguồn duy nhất của tên, '
    + 'chứ đừng hỏi cả hai bảng: hỏi cả hai là dựng lại đúng cái đã sai ba lần.',
  );
});
