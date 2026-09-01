/**
 * weeklyXpNote — dòng chú thích dưới ô "XP kiếm được" của bản tổng kết tuần.
 *
 * VÌ SAO TÁCH RA `.js`: đây là một LUẬT (ngưỡng nào thì gọi là "đi lên"), không phải bố cục —
 * và `node --test` không biên dịch được `.jsx`, nên luật nằm trong `.jsx` là luật không test
 * được. Quy ước này đã có trong `PROJECT_STRUCTURE.md`.
 *
 * VÌ SAO CÓ (2026-09-01): chỗ này trước đây in "Không có jackpot." mỗi tuần. Jackpot đòi BA
 * điều kiện cùng lúc — mở kỹ năng "Đại Trúng Thưởng" + phiên ≥45 phút + trúng cú tung 2,5% —
 * mà Đàm chưa mở kỹ năng ấy, nên với anh nó **không thể xảy ra**. Một dòng báo cáo sự vắng mặt
 * của một việc không thể xảy ra thì tuần nào cũng giống tuần nào, tức nó không còn là tin.
 *
 * ⚠️ NGƯỠNG 5% LÀ MỘT QUYẾT ĐỊNH, KHÔNG PHẢI MỘT PHÉP LÀM TRÒN: dưới mức đó thì hai tuần thật
 * ra ĐỀU NHAU, và gọi một dao động 2% là "đi lên" thì tuần sau nó "đi xuống" mà chẳng có gì
 * đổi cả — một cái mũi tên nhấp nháy vô nghĩa còn tệ hơn không có mũi tên.
 */

/** Chênh lệch dưới mức này thì coi hai tuần là ĐỀU NHAU. */
export const WEEKLY_XP_FLAT_PCT = 5;

export function weeklyXpNote(currentXP, previousXP) {
  const nay = Number(currentXP) || 0;
  const truoc = Number(previousXP) || 0;

  if (nay <= 0) return 'Chưa có XP tuần này.';
  // Không có tuần trước để so — đừng bịa ra một mốc.
  if (truoc <= 0) return 'Tuần đầu tiên có số để so.';

  const pct = Math.round(((nay - truoc) / truoc) * 100);
  if (Math.abs(pct) < WEEKLY_XP_FLAT_PCT) return 'Đều với tuần trước.';
  return pct > 0 ? `Hơn tuần trước ${pct}%` : `Kém tuần trước ${Math.abs(pct)}%`;
}
