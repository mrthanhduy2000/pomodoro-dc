/**
 * prestigeCarryover.js — BA ĐẶC QUYỀN THĂNG HOA, nay có thật (đóng `TECH_DEBT #3`).
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI. Ba kỹ năng nhánh Thăng Hoa — `kien_thuc_nen` (3 SP), `ke_thua`
 * (5 SP), `sieu_viet` (8 SP) — có mô tả hứa hẹn rành mạch trong `constants.js`, và
 * `triggerPrestige` **chưa bao giờ đọc tới chúng**. Tức Đàm bỏ ra **16 điểm kỹ năng** cho ba thứ
 * không làm gì cả, và app nói với anh là chúng có làm. Đó không phải một mô tả sai — đó là bán
 * một món hàng rỗng.
 *
 * Hai cách sửa được cân nhắc: (a) sửa MÔ TẢ cho khớp hành vi ("kỹ năng này không làm gì"), hay
 * (b) NỐI DÂY thật. (a) là hợp thức hoá việc bán hàng rỗng, nên chọn (b).
 *
 * THUẦN tuyệt đối: không `Date`, không `Math.random`, không store. Chọn kỹ năng giữ lại phải TẤT
 * ĐỊNH — một lần Thăng Hoa không được cho ra hai kết quả khác nhau.
 */

import {
  SKILL_TREE,
  KE_THUA_SP_RETENTION,
  SIEU_VIET_ERA1_XP_BONUS,
  SIEU_VIET_MIN_MINUTES,
} from './constants';

/** Mọi nút kỹ năng, phẳng. */
function moiNut() {
  return Object.values(SKILL_TREE ?? {}).flatMap((b) => b?.nodes ?? []);
}

/**
 * Kỹ năng Cao Cấp được giữ lại khi có `kien_thuc_nen`.
 *
 * ⚠️ TẤT ĐỊNH: đắt nhất trước; hoà thì id nhỏ hơn (thứ tự chữ cái) đứng trước. Không random, không
 * phụ thuộc thứ tự Đàm mở khoá — nếu không thì cùng một hồ sơ chơi lại ra hai kết quả, và không
 * bài test nào khoá được.
 */
export function chonKyNangGiuLai(unlockedSkills = {}) {
  const ungVien = moiNut()
    .filter((n) => n?.id && n.tier === 'advanced' && unlockedSkills[n.id])
    .sort((a, b) => (b.spCost ?? 0) - (a.spCost ?? 0) || String(a.id).localeCompare(String(b.id)));
  return ungVien[0]?.id ?? null;
}

/**
 * Trạng thái người chơi được mang qua lần Thăng Hoa.
 *
 * @returns {{ sp:number, unlockedSkills:object, giuKyNang:string|null, sieuViet:boolean }}
 */
export function tinhGiuLai({ unlockedSkills = {}, sp = 0, skillsMacDinh = {} } = {}) {
  const coKienThucNen = !!unlockedSkills.kien_thuc_nen;
  const coKeThua = !!unlockedSkills.ke_thua;
  const coSieuViet = !!unlockedSkills.sieu_viet;

  const giuKyNang = coKienThucNen ? chonKyNangGiuLai(unlockedSkills) : null;

  // ⚠️ `Math.floor`, không làm tròn: hứa "giữ 50%" thì 5 SP phải ra 2, không phải 3. Làm tròn lên
  // là tự tặng thêm một điểm mà mô tả không hứa — nhỏ, nhưng nó là chỗ niềm tin bị bào mòn.
  const spGiu = coKeThua ? Math.floor(Math.max(0, sp) * KE_THUA_SP_RETENTION) : 0;

  const skillsMoi = { ...skillsMacDinh };
  if (giuKyNang) skillsMoi[giuKyNang] = true;

  return { sp: spGiu, unlockedSkills: skillsMoi, giuKyNang, sieuViet: coSieuViet };
}

/**
 * Hệ số XP của `sieu_viet` cho một phiên SAU khi đã Thăng Hoa.
 *
 * ⚠️ CHỈ kỷ nguyên 1 và chỉ phiên đủ dài — đúng như mô tả. Trả 1 (không đổi gì) ở mọi ca khác,
 * nên chỗ gọi không cần một cái `if` riêng.
 */
export function heSoXpSieuViet({ sieuViet = false, book = 1, minutes = 0 } = {}) {
  if (!sieuViet) return 1;
  if (book !== 1) return 1;
  if (!Number.isFinite(minutes) || minutes < SIEU_VIET_MIN_MINUTES) return 1;
  return 1 + SIEU_VIET_ERA1_XP_BONUS;
}
