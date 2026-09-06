/**
 * statsFormatters.js — hàm định dạng THUẦN cho sổ tra cứu của màn Thống kê (`StatsJournal` ·
 * `StatsNotes`). Các hàm cho biểu đồ (fmtHours · fmtXPCompact · fmtVal · hexToRgba ·
 * fmtChartAxisValue · clampValue) đã xoá cùng biểu đồ 2026-09-06 (ADR-071).
 */
import { formatVietnamDate, formatVietnamDateTime } from '../engine/time';

export const COUNT_FORMATTER = new Intl.NumberFormat('vi-VN');

export function timeAgo(timestamp) {
  const diff  = Date.now() - new Date(timestamp).getTime();
  const mins  = Math.floor(diff / 60_000);
  const hrs   = Math.floor(diff / 3_600_000);
  const days  = Math.floor(diff / 86_400_000);
  if (mins < 1)   return 'Vừa xong';
  if (mins < 60)  return `${mins}p trước`;
  if (hrs  < 24)  return `${hrs}g trước`;
  if (days < 7)   return `${days} ngày trước`;
  return formatVietnamDate(timestamp, { day: 'numeric', month: 'numeric' });
}

export function formatExactDateTime(timestamp) {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return formatVietnamDateTime(date, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatPreciseDuration(durationMs) {
  if (!Number.isFinite(durationMs) || durationMs <= 0) return '0 giây';
  const totalSeconds = Math.max(0, Math.round(durationMs / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (hours > 0) parts.push(`${hours}g`);
  if (minutes > 0) parts.push(`${minutes}p`);
  if (seconds > 0 || parts.length === 0) parts.push(`${seconds}gi`);
  return parts.join(' ');
}

export function resolveEntryCategory(entry, catMap = {}) {
  if (entry?.categoryId && catMap[entry.categoryId]) {
    return catMap[entry.categoryId];
  }
  if (entry?.categoryId && entry?.categorySnapshot) {
    return {
      id: entry.categoryId,
      label: entry.categorySnapshot.label ?? 'Loại cũ',
      color: entry.categorySnapshot.color ?? '#475569',
      icon: entry.categorySnapshot.icon ?? '🏷️',
    };
  }
  return catMap.__none__ ?? { id: '__none__', label: 'Chưa gắn loại', color: '#475569', icon: '❓' };
}

export function fmtCount(value) {
  return COUNT_FORMATTER.format(value ?? 0);
}
