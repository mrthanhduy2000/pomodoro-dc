/**
 * "THÀNH TÍCH MỚI MỞ KHOÁ" — phần bền của cái chấm trên tab "Hành trang".
 *
 * Vấn đề: `ui.achievementQueue` là hàng đợi TOAST, nó tự rút cạn khi toast hiện xong, nên nó
 * KHÔNG trả lời được câu "Đàm đã ngó qua danh sách thành tích chưa?". Còn `achievements.timeline`
 * chỉ nói MỞ KHOÁ LÚC NÀO — muốn suy ra "mới" từ nó thì phải bịa ra một cửa sổ thời gian
 * ("trong 3 ngày qua"), tức một ngưỡng chưa hiệu chuẩn tự bật/tắt theo đồng hồ chứ không theo
 * việc Đàm có xem hay chưa. Cả hai đều trả lời một câu khác với câu đang hỏi.
 *
 * Nên "mới" ở đây định nghĩa đúng nghĩa của nó: **đã mở khoá mà CHƯA XEM**. Dấu "đã xem" nằm ở
 * localStorage (như `dc-coach-nudge-v1`) vì nó là chuyện của TỪNG MÁY, không phải của ván chơi —
 * đẩy nó vào state đồng bộ thì xem trên iPhone sẽ tắt mất cái chấm trên Mac.
 *
 * ⚠️ LẦN ĐẦU PHẢI IM LẶNG. Máy chưa có dấu nào thì mọi thành tích đã mở khoá đều "chưa xem" —
 * Đàm sẽ mở app và thấy một cái chấm báo hàng chục thứ mới mà thật ra anh đã xem từ lâu. Nên lần
 * đọc đầu tiên GIEO dấu bằng đúng danh sách hiện tại rồi báo "không có gì mới";
 * `pickUnseenAchievements` nhận `seen = null` (chưa từng ghi) khác hẳn `seen = []` (đã ghi, và
 * lúc ấy chưa có gì).
 */

export const NAV_SEEN_KEY = 'dc-nav-seen-v1';

function toIdList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((id) => typeof id === 'string' && id.length > 0);
}

/**
 * Thành tích đã mở khoá mà chưa được ghi nhận là đã xem.
 * `seenIds === null` nghĩa là máy này chưa từng ghi dấu → coi như đã xem hết (xem chú thích trên).
 */
export function pickUnseenAchievements(unlockedIds, seenIds) {
  const unlocked = toIdList(unlockedIds);
  if (seenIds === null || seenIds === undefined) return [];
  const seen = new Set(toIdList(seenIds));
  return unlocked.filter((id) => !seen.has(id));
}

/** Đọc dấu "đã xem". Trả `null` khi máy chưa từng ghi — KHÔNG trả `[]`, hai thứ đó khác nhau. */
export function readSeenAchievements(storage) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(NAV_SEEN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.achievements)) return null;
    return toIdList(parsed.achievements);
  } catch {
    // localStorage hỏng/đầy/bị chặn (Safari riêng tư) → coi như chưa có dấu, đừng ném lỗi ra
    // giữa màn hình vì một cái chấm trang trí.
    return null;
  }
}

/** Ghi dấu "đã xem". Trả về danh sách vừa ghi để nơi gọi khỏi phải đọc lại. */
export function writeSeenAchievements(storage, unlockedIds) {
  const ids = toIdList(unlockedIds);
  if (!storage) return ids;
  try {
    storage.setItem(NAV_SEEN_KEY, JSON.stringify({ achievements: ids }));
  } catch {
    // Ghi hỏng thì cái chấm sẽ sáng lại ở lần mở sau — phiền một chút, không phải lỗi chặn.
  }
  return ids;
}
