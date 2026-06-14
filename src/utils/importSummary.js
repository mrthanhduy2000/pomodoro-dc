/**
 * importSummary.js — tiện ích đọc nhanh nội dung file backup trước khi ghi đè.
 * Tách khỏi component để vừa test được, vừa không vi phạm rule fast-refresh.
 */

// Đếm số mục đã mở khoá, chấp nhận cả mảng lẫn object {id: true}.
export function countUnlocked(value) {
  if (Array.isArray(value)) return value.length;
  if (value && typeof value === 'object') return Object.values(value).filter(Boolean).length;
  return 0;
}

export function formatFocusMinutes(minutes) {
  const m = Math.max(0, Math.round(Number(minutes) || 0));
  if (m < 60) return `${m} phút`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem ? `${h}h ${rem}m` : `${h}h`;
}

// Nhận diện file có vẻ là backup game hợp lệ (tránh hiện hộp xác nhận cho rác).
export function looksLikeGameExport(data) {
  return Boolean(data && typeof data === 'object'
    && (data.player || data.progress || Array.isArray(data.history)));
}

// Rút gọn nội dung file backup để người dùng kiểm tra trước khi ghi đè.
// Phòng thủ với optional chaining: file lạ/cũ vẫn đọc ra được phần lấy được.
// `exportedAt` trả về dạng ISO thô — phần hiển thị do component tự format.
export function extractImportSummary(data) {
  const player = data?.player ?? {};
  const progress = data?.progress ?? {};
  const history = Array.isArray(data?.history) ? data.history : [];
  return {
    version: data?._version ?? '?',
    exportedAt: data?._exportedAt ?? null,
    level: Number.isFinite(player.level) ? player.level : 0,
    sessions: Number.isFinite(progress.sessionsCompleted) ? progress.sessionsCompleted : history.length,
    historyCount: history.length,
    focusMinutes: Number.isFinite(progress.totalFocusMinutes) ? progress.totalFocusMinutes : 0,
    prestige: data?.prestige?.count ?? data?.prestige?.totalPrestiges ?? 0,
    relics: countUnlocked(data?.relics),
    achievements: countUnlocked(data?.achievements?.unlocked ?? data?.achievements),
  };
}
