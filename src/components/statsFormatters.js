/**
 * statsFormatters.js — hàm định dạng/format THUẦN dùng cho StatsDashboard.jsx (tách ra để
 * giảm kích thước file — StatsDashboard vẫn còn rất lớn, đây là bước dọn nội bộ rủi ro thấp
 * theo yêu cầu tách helper/formatter khỏi God file, KHÔNG đổi hành vi hiển thị).
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

export function fmtHours(mins) {
  if (!mins || mins <= 0) return '0p';
  if (mins < 60) return `${mins}p`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}g ${m}p` : `${h}g`;
}

export function fmtXPCompact(xp) {
  if (!xp || xp <= 0) return '0';
  return xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`;
}

export function fmtCount(value) {
  return COUNT_FORMATTER.format(value ?? 0);
}

export function fmtVal(v, key) {
  if (key === 'minutes') return fmtHours(v);
  if (key === 'xp') return v >= 1000 ? `${(v / 1000).toFixed(1)}k XP` : `${v} XP`;
  return `${v} phiên`;
}

export function hexToRgba(hex, alpha) {
  if (typeof hex !== 'string') return `rgba(201, 100, 66, ${alpha})`;
  const normalized = hex.replace('#', '').trim();
  if (![3, 6].includes(normalized.length)) return `rgba(201, 100, 66, ${alpha})`;
  const full = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const numeric = Number.parseInt(full, 16);
  if (Number.isNaN(numeric)) return `rgba(201, 100, 66, ${alpha})`;
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function fmtChartAxisValue(value, key) {
  const rounded = Math.max(0, Math.round(value));
  if (key === 'minutes') {
    if (rounded >= 60) {
      const hours = rounded / 60;
      return `${Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1)}g`;
    }
    return `${rounded}p`;
  }
  if (key === 'xp') return rounded >= 1000 ? `${(rounded / 1000).toFixed(1)}k` : `${rounded}`;
  return `${rounded}`;
}

export function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
