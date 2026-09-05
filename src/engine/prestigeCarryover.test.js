/**
 * prestigeCarryover.test.js — luật của ba đặc quyền Thăng Hoa (`TECH_DEBT #3`).
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { tinhGiuLai, chonKyNangGiuLai, heSoXpSieuViet } from './prestigeCarryover.js';
import {
  SKILL_TREE, KE_THUA_SP_RETENTION, SIEU_VIET_ERA1_XP_BONUS, SIEU_VIET_MIN_MINUTES,
} from './constants.js';

const NUT = Object.values(SKILL_TREE).flatMap((b) => b.nodes);
const ADVANCED = NUT.filter((n) => n.tier === 'advanced').map((n) => n.id);

test('chọn kỹ năng giữ lại phải TẤT ĐỊNH — cùng đầu vào, cùng kết quả', () => {
  assert.ok(ADVANCED.length >= 2, 'cây kỹ năng không đủ nút Cao Cấp — phép đo chạy rỗng');
  const moKhoa = Object.fromEntries(ADVANCED.map((id) => [id, true]));
  const a = chonKyNangGiuLai(moKhoa);
  // Đảo thứ tự khoá: kết quả PHẢI không đổi. Không có vế này thì "tất định" chỉ là một lời hứa.
  const dao = Object.fromEntries(Object.entries(moKhoa).reverse());
  assert.equal(chonKyNangGiuLai(dao), a, 'kết quả đổi theo thứ tự khoá ⇒ không tất định');
  assert.ok(ADVANCED.includes(a));
  assert.equal(chonKyNangGiuLai({}), null, 'chưa mở gì thì không giữ gì');
});

test('giữ đúng MỘT kỹ năng, và chỉ khi đã mua `kien_thuc_nen`', () => {
  const moKhoa = Object.fromEntries(ADVANCED.map((id) => [id, true]));
  const co = tinhGiuLai({ unlockedSkills: { ...moKhoa, kien_thuc_nen: true }, sp: 0 });
  assert.equal(Object.values(co.unlockedSkills).filter(Boolean).length, 1);

  const khong = tinhGiuLai({ unlockedSkills: moKhoa, sp: 0 });
  assert.equal(Object.values(khong.unlockedSkills).filter(Boolean).length, 0,
    'chưa mua `kien_thuc_nen` mà vẫn giữ kỹ năng — đặc quyền 3 SP thành miễn phí');
});

test('`ke_thua` giữ 50% SP và LÀM TRÒN XUỐNG', () => {
  assert.equal(tinhGiuLai({ unlockedSkills: { ke_thua: true }, sp: 13 }).sp,
    Math.floor(13 * KE_THUA_SP_RETENTION));
  assert.equal(tinhGiuLai({ unlockedSkills: { ke_thua: true }, sp: 5 }).sp, 2,
    'làm tròn LÊN là tự tặng thêm một điểm mà mô tả không hứa');
  assert.equal(tinhGiuLai({ unlockedSkills: {}, sp: 13 }).sp, 0, 'chưa mua thì không giữ gì');
  assert.equal(tinhGiuLai({ unlockedSkills: { ke_thua: true }, sp: -5 }).sp, 0, 'SP âm ⇒ 0');
});

test('`sieu_viet` chỉ ăn ở kỷ 1 VÀ phiên đủ dài', () => {
  const bat = { sieuViet: true, book: 1 };
  assert.equal(heSoXpSieuViet({ ...bat, minutes: SIEU_VIET_MIN_MINUTES }), 1 + SIEU_VIET_ERA1_XP_BONUS);
  assert.equal(heSoXpSieuViet({ ...bat, minutes: SIEU_VIET_MIN_MINUTES - 1 }), 1, 'phiên ngắn không ăn');
  assert.equal(heSoXpSieuViet({ sieuViet: true, book: 2, minutes: 60 }), 1, 'kỷ 2 không ăn');
  assert.equal(heSoXpSieuViet({ sieuViet: false, book: 1, minutes: 60 }), 1, 'chưa mua không ăn');
  assert.equal(heSoXpSieuViet({}), 1, 'không tham số ⇒ không đổi gì');
  assert.equal(heSoXpSieuViet({ ...bat, minutes: NaN }), 1, 'đầu vào rác ⇒ không đổi gì');
});
