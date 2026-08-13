import test from 'node:test';
import assert from 'node:assert/strict';

import {
  listVisitableEras,
  mergeCityArchive,
  normalizeCityArchive,
} from './cityArchive.js';
import { BLUEPRINT_CATALOG, ERA_METADATA } from './constants.js';

const ERA_1 = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
const ERA_2 = BLUEPRINT_CATALOG[2].map((bp) => bp.id);
const ERA_3 = BLUEPRINT_CATALOG[3].map((bp) => bp.id);

const SEAL = { epAtSeal: 4200, sealedAt: '2026-08-12', sessionCount: 37 };

// ─── 1. Không có gì bị cắt → không tạo object mới ───────────────────────────

test('removedIds rỗng → trả về CHÍNH prevArchive (so sánh tham chiếu)', () => {
  const prev = { 3: { built: ERA_3, levels: {}, sealedAt: '2026-01-01', epAtSeal: 1, sessionCount: 2 } };
  assert.equal(mergeCityArchive(prev, [], {}, SEAL), prev);
  assert.equal(mergeCityArchive(prev, null, {}, SEAL), prev);
  assert.equal(mergeCityArchive(prev, undefined, {}, SEAL), prev);
  // toàn id rác cũng không được đẻ ra bản ghi rỗng
  assert.equal(mergeCityArchive(prev, ['bp_khong_ton_tai', ''], {}, SEAL), prev);
});

test('prevArchive không phải object → trả về {} an toàn, không ném lỗi', () => {
  for (const bad of [null, undefined, 'rác', 42, []]) {
    assert.deepEqual(mergeCityArchive(bad, [], {}, SEAL), {});
  }
});

// ─── 2. Niêm phong cơ bản ───────────────────────────────────────────────────

test('niêm phong kỷ 3 → built/levels/sealedAt/epAtSeal/sessionCount đúng', () => {
  const archive = mergeCityArchive({}, ERA_3, { [ERA_3[0]]: 2, [ERA_3[4]]: 3 }, SEAL);

  assert.deepEqual(Object.keys(archive), ['3']);
  assert.deepEqual(archive[3].built, ERA_3);
  assert.equal(archive[3].sealedAt, '2026-08-12');
  assert.equal(archive[3].epAtSeal, 4200);
  assert.equal(archive[3].sessionCount, 37);
  assert.equal(archive[3].levels[ERA_3[0]], 2);
  assert.equal(archive[3].levels[ERA_3[4]], 3);
  assert.equal(archive[3].levels[ERA_3[1]], 1, 'thiếu cấp → mặc định 1');
});

test('không làm thay đổi prevArchive (không mutate)', () => {
  const prev = { 1: { built: [ERA_1[0]], levels: {}, sealedAt: 'x', epAtSeal: 0, sessionCount: 0 } };
  const snapshot = JSON.stringify(prev);
  mergeCityArchive(prev, ERA_2, {}, SEAL);
  assert.equal(JSON.stringify(prev), snapshot);
});

// ─── 3. Idempotent ──────────────────────────────────────────────────────────

test('gọi 2 lần cùng đầu vào → kết quả bằng nhau (idempotent)', () => {
  const once = mergeCityArchive({}, ERA_2, { [ERA_2[0]]: 2 }, SEAL);
  const twice = mergeCityArchive(once, ERA_2, { [ERA_2[0]]: 2 }, SEAL);
  assert.deepEqual(twice, once);
  assert.equal(twice[2].built.length, ERA_2.length, 'gọi lại làm nhân đôi danh sách');
});

// ─── 4. Nhảy nhiều kỷ trong một phiên ───────────────────────────────────────

test('removedIds lẫn id của 2 kỷ → phân về đúng 2 khoá', () => {
  const archive = mergeCityArchive({}, [...ERA_1, ...ERA_2], {}, SEAL);
  assert.deepEqual(Object.keys(archive).sort(), ['1', '2']);
  assert.deepEqual(archive[1].built, ERA_1);
  assert.deepEqual(archive[2].built, ERA_2);
});

// ─── 5. Niêm phong lại kỷ đã có bản ghi ─────────────────────────────────────

test('niêm phong kỷ đã có bản ghi → GỘP, không mất công trình cũ', () => {
  const first = mergeCityArchive({}, [ERA_1[0], ERA_1[1]], { [ERA_1[0]]: 3 }, SEAL);
  const second = mergeCityArchive(
    first,
    [ERA_1[2]],
    { [ERA_1[2]]: 2 },
    { epAtSeal: 9000, sealedAt: '2026-09-01', sessionCount: 12 },
  );

  assert.deepEqual(second[1].built, [ERA_1[0], ERA_1[1], ERA_1[2]]);
  assert.equal(second[1].levels[ERA_1[0]], 3, 'cấp công trình cũ bị mất');
  assert.equal(second[1].levels[ERA_1[2]], 2);
  assert.equal(second[1].sessionCount, 37, 'sessionCount phải giữ giá trị lớn nhất đã biết');
});

// ─── 6. Chuẩn hoá dữ liệu bẩn ───────────────────────────────────────────────

test('normalizeCityArchive: đầu vào rác → {} , không ném lỗi', () => {
  for (const bad of [null, undefined, [], 'rác', 42, true]) {
    assert.deepEqual(normalizeCityArchive(bad), {});
  }
});

test('normalizeCityArchive: bỏ entry hỏng, giữ entry lành', () => {
  const clean = normalizeCityArchive({
    1: { built: ERA_1, levels: { [ERA_1[0]]: 2 }, sealedAt: '2026-01-01', epAtSeal: 100, sessionCount: 9 },
    2: 'rác',
    3: { built: [] },                       // rỗng → bỏ
    4: { built: 'không phải mảng' },        // hỏng → bỏ
    5: null,
    99: { built: ERA_1 },                   // kỷ ngoài [1,15] → bỏ
    abc: { built: ERA_1 },                  // khoá không phải số → bỏ
  });

  assert.deepEqual(Object.keys(clean), ['1']);
  assert.deepEqual(clean[1].built, ERA_1);
  assert.equal(clean[1].levels[ERA_1[0]], 2);
  assert.equal(clean[1].sessionCount, 9);
});

test('normalizeCityArchive: lọc id không phải chuỗi và điền mặc định thiếu trường', () => {
  const clean = normalizeCityArchive({
    2: { built: [ERA_2[0], 42, null, '', ERA_2[1]] },
  });
  assert.deepEqual(clean[2].built, [ERA_2[0], ERA_2[1]]);
  assert.equal(clean[2].sealedAt, null);
  assert.equal(clean[2].epAtSeal, 0);
  assert.equal(clean[2].sessionCount, 0);
});

test('normalizeCityArchive giữ nguyên kết quả của mergeCityArchive (đi vòng qua JSON)', () => {
  const archive = mergeCityArchive({}, [...ERA_1, ...ERA_2], { [ERA_1[0]]: 2 }, SEAL);
  const roundTripped = normalizeCityArchive(JSON.parse(JSON.stringify(archive)));
  assert.deepEqual(roundTripped, archive);
});

// ─── 7-8. Danh sách kỷ ghé thăm được ────────────────────────────────────────

test('listVisitableEras: đánh dấu isLost cho kỷ quá khứ không có bản ghi', () => {
  const archive = mergeCityArchive({}, ERA_3, {}, SEAL);
  const list = listVisitableEras(archive, 4);

  const byEra = Object.fromEntries(list.map((item) => [item.era, item]));
  assert.equal(byEra[1].isLost, true, 'kỷ 1 không có bản ghi → thất truyền');
  assert.equal(byEra[2].isLost, true);
  assert.equal(byEra[3].isLost, false, 'kỷ 3 có bản ghi → không thất truyền');
  assert.equal(byEra[4].isLost, false, 'kỷ đang chơi không bao giờ là thất truyền');
  assert.equal(byEra[4].isCurrent, true);
  assert.equal(byEra[3].isCurrent, false);
});

test('listVisitableEras: sắp xếp tăng dần và kèm nhãn kỷ thật', () => {
  const list = listVisitableEras({}, 5);
  assert.deepEqual(list.map((item) => item.era), [1, 2, 3, 4, 5]);
  assert.equal(list[0].label, ERA_METADATA[1].label);
  assert.equal(list[4].label, ERA_METADATA[5].label);
});

test('listVisitableEras: đầu vào hỏng → vẫn trả danh sách dùng được', () => {
  assert.deepEqual(listVisitableEras(null, null).map((item) => item.era), [1]);
  assert.deepEqual(listVisitableEras('rác', 0).map((item) => item.era), [1]);
  assert.deepEqual(listVisitableEras(undefined, 99).map((item) => item.era), [1]);

  // bản ghi lệch ở kỷ tương lai vẫn hiện ra thay vì biến mất im lặng
  const archive = mergeCityArchive({}, ERA_3, {}, SEAL);
  assert.deepEqual(listVisitableEras(archive, 1).map((item) => item.era), [1, 3]);
});

// ─── 9. sessionCount — trường bắt buộc cho mật độ cảnh vật ──────────────────

test('sessionCount ghi đúng vào entry; thiếu → mặc định 0, không ném lỗi', () => {
  const withCount = mergeCityArchive({}, ERA_1, {}, SEAL);
  assert.equal(withCount[1].sessionCount, 37);

  const noCount = mergeCityArchive({}, ERA_1, {}, { epAtSeal: 10, sealedAt: '2026-08-12' });
  assert.equal(noCount[1].sessionCount, 0);

  const noSeal = mergeCityArchive({}, ERA_1, {}, undefined);
  assert.equal(noSeal[1].sessionCount, 0);
  assert.equal(noSeal[1].epAtSeal, 0);
  assert.equal(noSeal[1].sealedAt, null);
  assert.deepEqual(noSeal[1].built, ERA_1);
});

test('GHI BỔ SUNG (`sealedAt: null`) KHÔNG được ghi đè lịch sử niêm phong của kỷ', () => {
  // ⚠️ Đây là hợp đồng mà "di sản dang dở" (Phase 4D, `engine/eraLegacy.js`) dựa vào để tồn tại.
  // Khi Đàm xây xong một công trình của kỷ ĐÃ ĐÓNG, ta gọi lại `mergeCityArchive` để thêm căn nhà
  // đó vào bảo tàng — nhưng lần ghi ấy KHÔNG phải một lần niêm phong. Nếu nó ghi đè `sealedAt` /
  // `epAtSeal` / `sessionCount` thì bảo tàng sẽ nói dối về quá khứ: một thành phố niêm phong từ
  // tháng trước bỗng mang ngày hôm nay, và số EP lúc niêm phong nhảy sang số EP hiện tại.
  const sealed = mergeCityArchive({}, ['bp_hang_dong'], { bp_hang_dong: 2 }, {
    sealedAt: '2026-01-15', epAtSeal: 1234, sessionCount: 40,
  });

  const restored = mergeCityArchive(sealed, ['bp_bep_lua'], {}, {
    sealedAt: null, epAtSeal: 0, sessionCount: 0,
  });

  assert.equal(restored[1].sealedAt, '2026-01-15', 'ngày niêm phong bị ghi đè');
  assert.equal(restored[1].epAtSeal, 1234, 'EP lúc niêm phong bị ghi đè');
  assert.equal(restored[1].sessionCount, 40, 'số phiên của kỷ bị ghi đè');
  assert.deepEqual(restored[1].built, ['bp_hang_dong', 'bp_bep_lua'], 'căn nhà mới phải được thêm vào');
  assert.equal(restored[1].levels.bp_hang_dong, 2, 'cấp công trình cũ phải giữ nguyên');
  assert.equal(restored[1].levels.bp_bep_lua, 1, 'công trình vừa xây xong vào ở cấp 1');
});
