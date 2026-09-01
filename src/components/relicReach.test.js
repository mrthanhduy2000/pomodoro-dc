import test from 'node:test';
import assert from 'node:assert/strict';
import { ERA_CRISES } from '../engine/constants.js';
import { chiaNhomDiVat, daQuaMoc } from './relicReach.js';

const DINH_NGHIA = Object.entries(ERA_CRISES)
  .sort(([a], [b]) => Number(a) - Number(b))
  .map(([era, c]) => ({ ...c.challengeOption.successRelic, triggerEP: c.triggerEP, era: Number(era) }));

test('mốc EP: ĐÚNG mốc là đã qua, không phải "vượt hẳn"', () => {
  // `detectEraCrisis` dùng `newEP >= triggerEP`, nên phép chia nhóm phải dùng đúng phép so ấy —
  // lệch một dấu bằng là một di vật bị xếp nhầm nhóm ở đúng khoảnh khắc nó vừa trôi qua.
  assert.equal(daQuaMoc(99, 100), false);
  assert.equal(daQuaMoc(100, 100), true);
  assert.equal(daQuaMoc(101, 100), true);
});

test('chia đúng hai nhóm trên dữ liệu THẬT, và hai nhóm phủ kín phần chưa có', () => {
  const daCo = new Set([DINH_NGHIA[0].id, DINH_NGHIA[3].id, DINH_NGHIA[6].id]);
  const { conLay, daLo } = chiaNhomDiVat(DINH_NGHIA, daCo, 23553);
  assert.equal(conLay.length + daLo.length, DINH_NGHIA.length - daCo.size, 'hai nhóm phải phủ kín phần chưa có');
  assert.equal(daLo.length, 5, 'ở 23.553 EP có đúng 5 di vật đã đi qua mốc');
  assert.equal(conLay.length, 7);
  for (const r of daLo) assert.ok(23553 >= r.triggerEP);
  for (const r of conLay) assert.ok(23553 < r.triggerEP);
});

test('"sắp tới" là mốc GẦN NHẤT phía trước, và số EP còn lại khớp với nó', () => {
  const { sapToi, conBaoNhieuEP } = chiaNhomDiVat(DINH_NGHIA, new Set(), 23553);
  const mocGanNhat = DINH_NGHIA.map((r) => r.triggerEP).filter((t) => t > 23553).sort((a, b) => a - b)[0];
  assert.equal(sapToi.triggerEP, mocGanNhat);
  assert.equal(conBaoNhieuEP, mocGanNhat - 23553);
});

test('ván mới (0 EP): chưa lỡ gì cả — "đã lỡ" phải RỖNG', () => {
  // Đối chứng bắt buộc: nếu phép chia nhóm bị đảo dấu thì ca này ra 15/0 thay vì 0/15, và một
  // người chơi mới sẽ được báo rằng mình đã lỡ toàn bộ trò chơi.
  const { conLay, daLo } = chiaNhomDiVat(DINH_NGHIA, new Set(), 0);
  assert.equal(daLo.length, 0);
  assert.equal(conLay.length, DINH_NGHIA.length);
});

test('ván đã đi rất xa: không còn gì phía trước ⇒ "sắp tới" là null, không phải một mốc bịa', () => {
  const { conLay, sapToi, conBaoNhieuEP } = chiaNhomDiVat(DINH_NGHIA, new Set(), 99_999_999);
  assert.equal(conLay.length, 0);
  assert.equal(sapToi, null);
  assert.equal(conBaoNhieuEP, null);
});

test('đầu vào rác không làm nổ, và mục thiếu id bị bỏ', () => {
  assert.deepEqual(chiaNhomDiVat().conLay, []);
  assert.deepEqual(chiaNhomDiVat([{ triggerEP: 5 }], new Set(), 0).conLay, [], 'mục không có id thì bỏ');
});
