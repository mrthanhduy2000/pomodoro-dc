/**
 * cityCompletion.test.js — bảng sưu tập "trọn vẹn kỷ".
 *
 * Bài quan trọng nhất trong file này KHÔNG phải mấy bài đếm 3/5 — mà là bài khoá **mẫu số tự đếm
 * từ catalog**. Nếu mẫu số bị viết cứng, ngày nào một kỷ có thêm bản vẽ thứ 6 thì màn hình sẽ gắn
 * sao "trọn vẹn" cho một thành phố còn thiếu nhà, và **không có gì đỏ lên cả** — đúng kiểu lỗi im
 * lặng mà dự án này đã trả giá nhiều lần.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG } from './constants';
import {
  listEraBlueprints,
  summarizeEraCompletion,
  summarizeMuseum,
  withEraCompletion,
} from './cityCompletion';

const eraOne = BLUEPRINT_CATALOG[1].map((bp) => bp.id);

test('mỗi kỷ trả về đúng danh sách bản vẽ của nó, GIỮ NGUYÊN thứ tự catalog', () => {
  for (const eraKey of Object.keys(BLUEPRINT_CATALOG)) {
    const era = Number(eraKey);
    const got = listEraBlueprints(era).map((bp) => bp.bpId);
    assert.deepEqual(got, BLUEPRINT_CATALOG[era].map((bp) => bp.id),
      `kỷ ${era}: danh sách hoặc thứ tự lệch khỏi catalog — thứ tự này chính là `
      + '`rank` mà cityLayout dùng để chia khu đất, đảo nó là cắt liên hệ bảng ↔ bản đồ');
  }
});

test('kỷ lạ → mảng rỗng, KHÔNG ném lỗi (đây là đường vẽ màn hình)', () => {
  for (const bad of [99, 0, -1, undefined, null, NaN, 'kỷ bốn', {}]) {
    assert.deepEqual(listEraBlueprints(bad), [], `kỷ lạ ${String(bad)} phải ra mảng rỗng`);
  }
  // ⚠️ `listEraBlueprints('4')` KHÔNG rỗng, và đó là đúng chứ không phải lỗi: khoá của object
  // trong JS luôn là chuỗi, nên `[4]` và `['4']` là CÙNG một khoá — không có cách nào phân biệt mà
  // không thêm một lớp kiểm kiểu chẳng để làm gì. Mọi bên gọi đều lấy `era` từ `listVisitableEras`,
  // nơi đã lọc bằng `Number.isInteger`. Ghi ra đây để phiên sau khỏi tưởng mình vừa tìm ra lỗi.
  assert.equal(listEraBlueprints('4').length, listEraBlueprints(4).length);
});

test('MẪU SỐ PHẢI TỰ ĐẾM TỪ CATALOG, không được viết cứng số 5', () => {
  // Hôm nay cả 15 kỷ đều đúng 5 bản vẽ. Bài này không kiểm "bằng 5" — nó kiểm `total` BÁM theo
  // catalog. Thêm/bớt bản vẽ mà quên chỗ nào đó thì đây là nơi đỏ lên đầu tiên.
  for (const eraKey of Object.keys(BLUEPRINT_CATALOG)) {
    const era = Number(eraKey);
    const summary = summarizeEraCompletion({ era, built: [] });
    assert.equal(summary.total, BLUEPRINT_CATALOG[era].length,
      `kỷ ${era}: mẫu số ${summary.total} ≠ ${BLUEPRINT_CATALOG[era].length} bản vẽ thật trong catalog`);
    assert.equal(summary.slots.length, summary.total);
  }
});

test('đếm đúng đã xây / còn thiếu, và ba trạng thái ô không lẫn nhau', () => {
  const summary = summarizeEraCompletion({
    era: 1,
    built: [eraOne[0], eraOne[2]],
    pending: [{ bpId: eraOne[4], sessionsRemaining: 2 }],
  });

  assert.equal(summary.done, 2);
  assert.equal(summary.total, eraOne.length);
  assert.equal(summary.isComplete, false);
  assert.deepEqual(
    summary.slots.map((slot) => slot.state),
    ['built', 'empty', 'built', 'empty', 'building'],
  );
  // `missing` = mọi ô CHƯA XONG, kể cả cái đang xây — vì cái đang xây vẫn chưa phải một căn nhà.
  assert.deepEqual(summary.missing.map((slot) => slot.bpId), [eraOne[1], eraOne[3], eraOne[4]]);
});

test('CÔNG TRÌNH ĐANG XÂY KHÔNG ĐƯỢC CỘNG VÀO "đã xây"', () => {
  // Con số này chỉ đáng tin nếu khoảnh khắc nó nhảy lên TRÙNG với khoảnh khắc căn nhà hiện ra
  // trong cảnh 3D. Cộng giàn giáo vào là phá đúng chỗ đó.
  const summary = summarizeEraCompletion({
    era: 1,
    built: [],
    pending: eraOne.map((bpId) => ({ bpId, sessionsRemaining: 1 })),
  });
  assert.equal(summary.done, 0);
  assert.equal(summary.isComplete, false);
  assert.ok(summary.slots.every((slot) => slot.state === 'building'));
});

test('xây đủ → trọn vẹn, tỉ lệ đúng 1', () => {
  const summary = summarizeEraCompletion({ era: 1, built: eraOne });
  assert.equal(summary.done, summary.total);
  assert.equal(summary.isComplete, true);
  assert.equal(summary.ratio, 1);
  assert.deepEqual(summary.missing, []);
});

test('id của kỷ KHÁC lọt vào `built` không được đẩy số vượt mẫu số', () => {
  // Xảy ra thật: dữ liệu lệch một nhịp từ cloud, hoặc file import đời cũ. "6/5" là con số vô nghĩa
  // và nó phá luôn cả cái sao "trọn vẹn".
  const intruders = BLUEPRINT_CATALOG[7].map((bp) => bp.id);
  const summary = summarizeEraCompletion({ era: 1, built: [...eraOne, ...intruders] });
  assert.equal(summary.done, eraOne.length);
  assert.ok(summary.done <= summary.total);
});

test('đầu vào rác không làm sập, và kỷ rỗng KHÔNG được gắn sao trọn vẹn', () => {
  for (const bad of [undefined, {}, { era: null }, { era: 99, built: null }, { era: 1, built: 'x' }]) {
    const summary = summarizeEraCompletion(bad);
    assert.ok(Number.isFinite(summary.ratio), 'ratio phải là số, không được NaN');
    assert.ok(summary.done <= summary.total);
  }
  // 0 bản vẽ mà báo "trọn vẹn" tức là gắn sao cho dữ liệu hỏng.
  assert.equal(summarizeEraCompletion({ era: 99, built: [] }).isComplete, false);
});

test('withEraCompletion: kỷ HIỆN TẠI lấy state sống, kỷ đã niêm phong lấy ảnh chụp', () => {
  // Đây là chỗ dễ sai nhất cả tính năng: kỷ đang chơi CHƯA có trong bảo tàng nên `built` của nó
  // luôn rỗng. Lấy nhầm nguồn thì kỷ đang chơi vĩnh viễn hiện 0/5 dù thành phố đầy nhà.
  const eras = [
    { era: 1, built: [BLUEPRINT_CATALOG[1][0].id], isCurrent: false, isLost: false },
    { era: 2, built: [], isCurrent: true, isLost: false },
  ];
  const out = withEraCompletion(eras, {
    built: [BLUEPRINT_CATALOG[2][0].id, BLUEPRINT_CATALOG[2][1].id],
    pending: [{ bpId: BLUEPRINT_CATALOG[2][2].id }],
  });

  assert.equal(out[0].completion.done, 1, 'kỷ đã niêm phong phải đọc ảnh chụp của chính nó');
  assert.equal(out[1].completion.done, 2, 'kỷ hiện tại phải đọc state sống, không đọc mảng rỗng');
  assert.equal(out[1].completion.slots[2].state, 'building');
  // Không được nuốt mất khoá cũ — `EraSwitcher`/`CityViewShell` vẫn dùng `label`, `sealedAt`…
  assert.equal(out[0].era, 1);
  assert.equal(out[1].isCurrent, true);
});

test('withEraCompletion: state sống KHÔNG được rò sang kỷ đã niêm phong', () => {
  const eras = [
    { era: 1, built: [], isCurrent: false, isLost: false },
    { era: 2, built: [], isCurrent: true, isLost: false },
  ];
  const out = withEraCompletion(eras, { built: BLUEPRINT_CATALOG[2].map((bp) => bp.id) });
  assert.equal(out[0].completion.done, 0, 'kỷ 1 đã niêm phong mà lại nhận công trình của kỷ 2');
  assert.equal(out[1].completion.isComplete, true);
});

test('withEraCompletion: đầu vào rác → mảng rỗng, không ném lỗi', () => {
  assert.deepEqual(withEraCompletion(null), []);
  assert.deepEqual(withEraCompletion(undefined, { built: ['x'] }), []);
  assert.equal(withEraCompletion([{}])[0].completion.total, 0);
});

test('summarizeMuseum: KỶ THẤT TRUYỀN không bị tính là "bỏ dở"', () => {
  // Kỷ thất truyền rỗng vì bảo tàng chưa tồn tại lúc đó, KHÔNG phải vì Đàm bỏ dở. Tính chúng vào
  // mẫu số là trách anh về một chuyện anh không làm — và con số đó vĩnh viễn không sửa được.
  const eras = withEraCompletion([
    { era: 1, built: [], isCurrent: false, isLost: true },
    { era: 2, built: BLUEPRINT_CATALOG[2].map((bp) => bp.id), isCurrent: false, isLost: false },
    { era: 3, built: [BLUEPRINT_CATALOG[3][0].id], isCurrent: true, isLost: false },
  ], { built: [BLUEPRINT_CATALOG[3][0].id] });

  const museum = summarizeMuseum(eras);
  assert.equal(museum.countedEras, 2, 'kỷ thất truyền phải bị loại khỏi mẫu số');
  assert.equal(museum.completeEras, 1);
  assert.equal(museum.builtTotal, BLUEPRINT_CATALOG[2].length + 1);
  assert.equal(museum.possibleTotal, BLUEPRINT_CATALOG[2].length + BLUEPRINT_CATALOG[3].length);
});

test('PHÉP ĐO NÀY PHẢI CÒN BẮT ĐƯỢC ĐÚNG CÁI LỖI ĐÃ SINH RA NÓ', () => {
  // Một bài test chưa từng được nhìn thấy đỏ thì không phải là một bài test. Ở đây dựng lại HAI
  // lỗi thật mà tính năng này tồn tại để chặn, rồi khẳng định phép đo thật sự phân biệt được.

  // Lỗi 1 — mẫu số viết cứng: kỷ có 6 bản vẽ mà vẫn chia cho 5 ⇒ "5/5 trọn vẹn" khi còn thiếu 1.
  const hardcoded = { done: 5, total: 5 };
  const honest = summarizeEraCompletion({ era: 1, built: eraOne.slice(0, 4) });
  assert.notEqual(honest.done, hardcoded.done,
    'phép đo thật phải khác kết quả của mẫu số viết cứng');
  assert.equal(honest.isComplete, false);

  // Lỗi 2 — cộng giàn giáo vào "đã xây": 4 xong + 1 đang xây KHÔNG phải trọn vẹn.
  const almost = summarizeEraCompletion({
    era: 1,
    built: eraOne.slice(0, eraOne.length - 1),
    pending: [{ bpId: eraOne[eraOne.length - 1] }],
  });
  assert.equal(almost.done, eraOne.length - 1);
  assert.equal(almost.isComplete, false,
    'gộp cái đang xây vào "đã xây" sẽ gắn sao sớm một phiên — sao phải rơi ĐÚNG lúc căn nhà hiện ra');
});
