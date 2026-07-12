/**
 * labelMark.js — sinh "ký hiệu tắt" 1-2 chữ cái từ nhãn (label) để hiện trong badge/icon tròn
 * (thành tích, kỹ năng, công trình, bản vẽ, di vật...). Trước đây bị chép tay ~7 lần rải rác
 * khắp components — gộp về đây, giữ NGUYÊN hành vi từng nơi gọi (kể cả các trường hợp biên).
 */

export function initialsFromLabel(label) {
  return String(label ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function getLabelMark(label, fallback = 'NA') {
  return initialsFromLabel(label ?? fallback) || fallback;
}
