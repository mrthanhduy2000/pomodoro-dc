/**
 * eraLegacy.test.js — "di sản dang dở".
 *
 * Đây là tầng THUẦN. Bài kiểm hành vi thật (chạy qua `completeFocusSession`, ~760 dòng) nằm ở
 * `src/store/gameStore.eraLegacy.test.js` — và **hai file phải đọc cùng nhau**: một bài ở đây từng
 * mang chú thích khẳng định "lấy nhầm kỷ ⇒ mất trắng", đo ra thì tầng hành vi có lưới thứ hai
 * (lần niêm phong) che đúng ca đó. Tầng thuần chứng minh được HÀM này làm gì; nó **không** chứng
 * minh được hệ thống sẽ hỏng ra sao khi hàm này sai.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG } from './constants';
import {
  blueprintEraOf,
  countActiveCrafting,
  pickLegacyCompletions,
  splitCraftingQueue,
} from './eraLegacy';

const era5 = BLUEPRINT_CATALOG[5].map((bp) => bp.id);
const era7 = BLUEPRINT_CATALOG[7].map((bp) => bp.id);
const era9 = BLUEPRINT_CATALOG[9].map((bp) => bp.id);
const q = (bpId, sessionsRemaining = 3) => ({ bpId, sessionsRemaining });

test('blueprintEraOf: tra đúng kỷ, id lạ → null (KHÔNG ném lỗi)', () => {
  for (const eraKey of Object.keys(BLUEPRINT_CATALOG)) {
    for (const bp of BLUEPRINT_CATALOG[eraKey]) {
      assert.equal(blueprintEraOf(bp.id), Number(eraKey));
    }
  }
  for (const bad of ['bp_khong_co_that', '', null, undefined, 42, {}]) {
    assert.equal(blueprintEraOf(bad), null, `id lạ ${String(bad)} phải ra null`);
  }
});

test('tách hàng đợi: kỷ hiện tại vào `active`, kỷ ĐÃ QUA vào `legacy`', () => {
  const { active, legacy } = splitCraftingQueue(
    [q(era7[0]), q(era5[1]), q(era7[2]), q(era5[0])],
    7,
  );
  assert.deepEqual(active.map((i) => i.bpId), [era7[0], era7[2]]);
  assert.deepEqual(legacy.map((i) => i.bpId), [era5[1], era5[0]]);
  // Giữ nguyên object gốc (kể cả `sessionsRemaining`) — tiến độ tám phiên không được mất.
  assert.equal(legacy[0].sessionsRemaining, 3);
});

test('bản vẽ của kỷ TƯƠNG LAI bị loại — không được xây trước lượt', () => {
  const { active, legacy } = splitCraftingQueue([q(era9[0]), q(era7[0])], 7);
  assert.deepEqual(active.map((i) => i.bpId), [era7[0]]);
  assert.deepEqual(legacy, [], 'bản vẽ kỷ 9 lọt vào lúc đang ở kỷ 7 là dữ liệu lệch, phải bỏ');
});

test('id LẠ bị loại khỏi cả hai nhóm — giữ lại thì nó ngồi trong hàng đợi vĩnh viễn', () => {
  const { active, legacy } = splitCraftingQueue([q('bp_ma'), q(era7[0]), q(null)], 7);
  assert.deepEqual(active.map((i) => i.bpId), [era7[0]]);
  assert.deepEqual(legacy, []);
});

test('đầu vào rác → hai mảng rỗng, không ném lỗi', () => {
  for (const bad of [undefined, null, 'x', 42, {}]) {
    const out = splitCraftingQueue(bad, 7);
    assert.deepEqual(out.active, []);
    assert.deepEqual(out.legacy, []);
  }
});

test('DI SẢN KHÔNG CHIẾM Ô HÀNG ĐỢI — lời hứa cốt lõi của tính năng', () => {
  // Phần thưởng của di sản thuần tuý là lịch sử (không đặc quyền, không sức mạnh). Nếu nó còn
  // chiếm 1 trong 2 ô xây dựng thì nó thành cái bẫy, và người chơi sẽ học được đúng bài học ngược:
  // "đừng bao giờ khởi công khi sắp lên kỷ".
  const queue = [q(era5[0]), q(era5[1]), q(era7[0])];
  assert.equal(countActiveCrafting(queue, 7), 1, 'hai di sản kỷ 5 không được tính vào ô');
  assert.equal(queue.length, 3, 'nhưng chúng VẪN nằm trong hàng đợi và vẫn xây tiếp');

  // Ca đầy ô thật: 2 mục kỷ hiện tại ⇒ chặn, dù có thêm bao nhiêu di sản.
  assert.equal(countActiveCrafting([q(era7[0]), q(era7[1]), ...era5.map((id) => q(id))], 7), 2);
});

test('PHẢI DÙNG KỶ SAU PHIÊN — phiên vừa xây xong vừa lên kỷ', () => {
  // Đàm đang ở kỷ 7, xây xong một công trình kỷ 7, và CHÍNH phiên đó đủ EP lên kỷ 8.
  const builtInEra7 = era7[0];

  // ĐÚNG: chấm theo kỷ SAU phiên (8) ⇒ công trình kỷ 7 là di sản ⇒ được ghi vào bảo tàng.
  assert.deepEqual(
    pickLegacyCompletions([builtInEra7], 8),
    [{ bpId: builtInEra7, era: 7 }],
  );

  // Chấm theo kỷ TRƯỚC phiên (7) ⇒ coi là "của kỷ hiện tại" ⇒ tầng này không ghi gì cả.
  //
  // ⚠️ ĐỪNG ĐỌC DÒNG TRÊN THÀNH "MẤT TRẮNG" — chú thích bản đầu ở đây viết đúng như vậy và **đã đo
  // ra là SAI** (2026-08-13). Ở ca đó `completeFocusSession` niêm phong kỷ 7, và chính lần niêm
  // phong ghi công trình vừa xong vào `cityArchive[7]`. Sửa `finalBook` thành kỷ trước phiên rồi
  // chạy `gameStore.eraLegacy.test.js`: **vẫn xanh**. Hai lưới độc lập, không phải một.
  // Giá trị thật của việc chấm theo kỷ SAU phiên: tầng di sản TỰ ĐỦ, không phụ thuộc ngầm vào việc
  // lần niêm phong có quét trúng công trình đó hay không.
  assert.deepEqual(pickLegacyCompletions([builtInEra7], 7), [],
    'chấm theo kỷ TRƯỚC phiên thì công trình vừa xong không được tầng này nhận là di sản');
});

test('công trình của kỷ HIỆN TẠI không bao giờ bị coi là di sản', () => {
  assert.deepEqual(pickLegacyCompletions([era7[0], era7[3]], 7), []);
});

test('nhiều di sản, nhiều kỷ, giữ nguyên thứ tự đầu vào', () => {
  assert.deepEqual(
    pickLegacyCompletions([era5[0], era7[1], era5[2]], 9),
    [{ bpId: era5[0], era: 5 }, { bpId: era7[1], era: 7 }, { bpId: era5[2], era: 5 }],
  );
});

test('pickLegacyCompletions: đầu vào rác → mảng rỗng', () => {
  for (const bad of [undefined, null, 'x', 42, {}]) {
    assert.deepEqual(pickLegacyCompletions(bad, 7), []);
  }
  assert.deepEqual(pickLegacyCompletions(['bp_ma'], 7), [], 'id lạ không được ghi vào bảo tàng');
});
