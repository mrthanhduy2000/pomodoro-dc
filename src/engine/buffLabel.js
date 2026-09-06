/**
 * buffLabel.js — MỘT cách đọc một `buff` thành chữ, dùng chung cho kho di vật và chuỗi thẻ thưởng
 * (2026-09-06, ADR-070). Trước đây `RelicInventory.jsx` có bản chép riêng, còn thẻ "di vật lên bậc"
 * mới cần đúng phép dịch ấy — hai bản chép là hai con số sớm muộn lệch nhau (một luật một công thức).
 *
 * ⚠️ CHỈ CÒN NĂM TRỤC SỐNG (ADR-069): tất cả · EP · XP · cửa sổ combo · XP ★★★. Các trục ngủ
 * (tài nguyên, RP, thất thoát thảm hoạ) đã rời khỏi bảng di vật; không dịch chúng nữa để một bảng
 * lỡ khai lại trục chết thì CHỮ KHÔNG HIỆN, tức có thứ nhìn thấy được để hỏi.
 */
export function describeBuffParts(buff) {
  if (!buff || typeof buff !== 'object') return [];
  const pct = (v) => `${Math.round(Number(v) * 100)}%`;
  const parts = [];
  if (buff.allBonus) parts.push(`+${pct(buff.allBonus)} tất cả`);
  if (buff.epBonus) parts.push(`+${pct(buff.epBonus)} EP`);
  if (buff.expBonus) parts.push(`+${pct(buff.expBonus)} XP`);
  if (buff.comboWindowHours) parts.push(`+${buff.comboWindowHours}h combo`);
  if (buff.xpSeal) parts.push(`+${pct(buff.xpSeal)} XP ★★★`);
  return parts;
}

/** Một dòng: "+11% EP · +2% XP ★★★". Rỗng khi buff không có trục sống nào. */
export function describeBuff(buff) {
  return describeBuffParts(buff).join(' · ');
}
