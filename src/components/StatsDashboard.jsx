/**
 * StatsDashboard.jsx — Bảng Thống Kê Nâng Cao v2
 * ─────────────────────────────────────────────────────────────────────────────
 * Fixes v2:
 *  1. SVG height bug — thêm style height tường minh, không để browser tự tính
 *  2. BarChart — gridlines, y-axis max label, hover tooltip SVG-native
 *  3. AreaChart — dots có title tooltip, chiều cao đúng
 *  4. 30-phiên chart — không tràn ra ngoài card
 *  5. Category tab — thêm bộ lọc thời gian + so sánh kỳ trước
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useId, useRef, useState, useMemo, useTransition, useDeferredValue } from 'react';
import { motion as Motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import useGameStore from '../store/gameStore';
import { RichTextView } from './RichText';
import { createRichTextPreview } from '../utils/richText';
import {
  computeWeeklyStats,
  computeAllTimeStats,
  computePrevWeekStats,
  computeYearGrid,
  computeCategoryStats,
  computePeriodStats,
} from '../engine/gameMath';
import { STREAK_MAX_BONUS_DAYS, STREAK_BONUS_PER_DAY, BUILDING_EFFECTS } from '../engine/constants';
import {
  formatVietnamDate,
  formatVietnamDateTime,
  formatVietnamTime,
  getVietnamHour,
  startOfVietnamDayTs,
  startOfVietnamMonthTs,
  startOfVietnamQuarterTs,
  startOfVietnamWeekTs,
  startOfVietnamYearTs,
} from '../engine/time';

// ─── Palette ─────────────────────────────────────────────────────────────────
const BG_CARD  = 'var(--card-bg-solid, rgba(255,255,255,0.94))';
const ACCENT   = '#c96442';
const ACCENT2  = '#8a3f24';
const TEXT_PRIMARY = 'var(--stats-text-primary, #f8fafc)';
const TEXT_MUTED   = 'var(--stats-text-muted, #94a3b8)';
const TEXT_SOFT    = 'var(--stats-text-soft, #64748b)';
const PANEL_BG     = 'var(--stats-panel-bg, rgba(15, 23, 42, 0.72))';
const PANEL_BG_SOFT = 'var(--stats-panel-bg-soft, rgba(15, 23, 42, 0.42))';
const PANEL_BORDER = 'var(--stats-panel-border, rgba(255, 255, 255, 0.08))';
const GRID_LINE    = 'var(--stats-grid-line, rgba(148, 163, 184, 0.18))';
const TAB_BAR_BG   = 'var(--stats-tab-bar-bg, rgba(244, 242, 236, 0.78))';
const TAB_IDLE_BG  = 'var(--stats-tab-idle-bg, transparent)';
const TAB_IDLE_BORDER = 'var(--stats-tab-idle-border, rgba(31,30,29,0.02))';
const TAB_IDLE_TEXT = 'var(--stats-tab-idle-text, #6a6862)';
const TAB_ACTIVE_BG = 'var(--stats-tab-active-bg, rgba(255,255,255,0.96))';
const TAB_ACTIVE_TEXT = 'var(--stats-tab-active-text, #1f1e1d)';
const TAB_ACTIVE_BORDER = 'var(--stats-tab-active-border, rgba(31,30,29,0.10))';
const TAB_ACTIVE_SHADOW = 'var(--stats-tab-active-shadow, 0 10px 24px rgba(31,30,29,0.06))';
const FILTER_PILL_BG = 'var(--stats-filter-pill-bg, rgba(244,242,236,0.76))';
const FILTER_PILL_BORDER = 'var(--stats-filter-pill-border, rgba(31,30,29,0.06))';
const FILTER_PILL_TEXT = 'var(--stats-filter-pill-text, #6a6862)';
const FILTER_PILL_ACTIVE_BG = 'var(--stats-filter-pill-active-bg, rgba(255,255,255,0.96))';
const FILTER_PILL_ACTIVE_TEXT = 'var(--stats-filter-pill-active-text, #1f1e1d)';
const FILTER_PILL_ACTIVE_BORDER = 'var(--stats-filter-pill-active-border, rgba(31,30,29,0.10))';
const JOURNAL_ROW_BG = 'var(--stats-journal-row-bg, linear-gradient(135deg, rgba(15,23,42,0.84) 0%, rgba(15,23,42,0.72) 100%))';
const JOURNAL_ROW_BORDER = 'var(--stats-journal-row-border, rgba(255,255,255,0.06))';
const JOURNAL_PANEL_BG = 'var(--stats-journal-panel-bg, rgba(30,41,59,0.45))';
const JOURNAL_PANEL_BORDER = 'var(--stats-journal-panel-border, rgba(99,102,241,0.12))';
const JOURNAL_PANEL_TITLE = 'var(--stats-journal-panel-title, #818cf8)';
const JOURNAL_PANEL_MUTED = 'var(--stats-journal-panel-muted, #64748b)';
const JOURNAL_PANEL_TEXT = 'var(--stats-journal-panel-text, #e2e8f0)';
const JOURNAL_PANEL_SUB_BG = 'var(--stats-journal-panel-sub-bg, rgba(15,23,42,0.55))';
const NOTE_PANEL_BG = 'var(--stats-note-panel-bg, rgba(15,23,42,0.65))';
const NOTE_PANEL_BORDER = 'var(--stats-note-panel-border, rgba(148,163,184,0.14))';
const NOTE_PANEL_TITLE = 'var(--stats-note-panel-title, #64748b)';
const NOTE_PANEL_TEXT = 'var(--stats-note-panel-text, #cbd5e1)';
const BADGE_BG = 'var(--stats-badge-bg, rgba(15,23,42,0.08))';
const BADGE_TEXT = 'var(--stats-badge-text, #64748b)';
const BADGE_STRONG_BG = 'var(--stats-badge-strong-bg, rgba(99,102,241,0.16))';
const BADGE_STRONG_TEXT = 'var(--stats-badge-strong-text, #a5b4fc)';
const CHART_SURFACE = 'var(--stats-chart-surface, linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(244,242,236,0.98) 100%))';
const CHART_SURFACE_COMPACT = 'var(--stats-chart-surface-compact, linear-gradient(180deg, rgba(250,249,246,0.98) 0%, rgba(242,238,230,0.98) 100%))';
const CHART_GUIDE = 'var(--stats-chart-guide, rgba(180,171,154,0.52))';
const CHART_INSET_LINE = 'var(--stats-chart-inset-line, rgba(255,255,255,0.72))';
const CHART_CALLOUT_BG = 'var(--stats-chart-callout-bg, rgba(255,255,255,0.94))';
const CHART_CALLOUT_TEXT = 'var(--stats-chart-callout-text, #1f1e1d)';
const CHART_CALLOUT_MUTED = 'var(--stats-chart-callout-muted, #6a6862)';
const CHART_AXIS_TEXT = 'var(--stats-chart-axis-text, #8b847b)';
const CHART_POINT_FILL = 'var(--stats-chart-point-fill, rgba(255,255,255,0.98))';
const CHART_POINT_RING = 'var(--stats-chart-point-ring, #fffaf3)';
const CHART_SHADOW = 'var(--stats-chart-shadow, rgba(31,30,29,0.1))';
const SANS_FONT = '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
const DISPLAY_FONT = SANS_FONT;
const MONO_FONT = '"JetBrains Mono", "SFMono-Regular", Menlo, monospace';
const METRIC_FONT = SANS_FONT;
const METRIC_TRACKING = '-0.035em';
const COUNT_FORMATTER = new Intl.NumberFormat('vi-VN');
const TIMESTAMP_MS_CACHE = new Map();

function getLabelMark(label, fallback = 'NA') {
  return String(label ?? fallback)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || fallback;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function timeAgo(timestamp) {
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

function formatExactDateTime(timestamp) {
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

function formatPreciseDuration(durationMs) {
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

function resolveEntryCategory(entry, catMap = {}) {
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

function fmtHours(mins) {
  if (!mins || mins <= 0) return '0p';
  if (mins < 60) return `${mins}p`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}g ${m}p` : `${h}g`;
}

function fmtXPCompact(xp) {
  if (!xp || xp <= 0) return '0';
  return xp >= 1000 ? `${(xp / 1000).toFixed(1)}k` : `${xp}`;
}

function fmtCount(value) {
  return COUNT_FORMATTER.format(value ?? 0);
}

function fmtVal(v, key) {
  if (key === 'minutes') return fmtHours(v);
  if (key === 'xp') return v >= 1000 ? `${(v / 1000).toFixed(1)}k XP` : `${v} XP`;
  return `${v} phiên`;
}

function hexToRgba(hex, alpha) {
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

function fmtChartAxisValue(value, key) {
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

function clampValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function useResponsiveChartWidth(fallbackWidth) {
  const rootRef = useRef(null);
  const [width, setWidth] = useState(fallbackWidth);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return undefined;

    const applyWidth = (nextWidth) => {
      if (!Number.isFinite(nextWidth) || nextWidth <= 0) return;
      setWidth((current) => (Math.abs(current - nextWidth) > 0.5 ? nextWidth : current));
    };

    applyWidth(node.getBoundingClientRect().width);

    if (typeof ResizeObserver === 'undefined') {
      const handleResize = () => applyWidth(node.getBoundingClientRect().width);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      applyWidth(entry?.contentRect?.width ?? node.getBoundingClientRect().width);
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, [fallbackWidth]);

  return [rootRef, width];
}

function getTrendDateLabels(entry, index) {
  if (entry?.date) {
    const safeDate = new Date(`${entry.date}T00:00:00+07:00`);
    if (!Number.isNaN(safeDate.getTime())) {
      const weekday = formatWeekdayLabel(entry.date);
      return {
        compact: weekday.replace(/^Th\s*/i, 'T'),
        weekday,
        calendar: formatVietnamDate(safeDate, { day: 'numeric', month: 'numeric' }),
        full: formatVietnamDate(safeDate, { weekday: 'long', day: 'numeric', month: 'numeric' }),
      };
    }
  }

  const rawLabel = String(entry?.label ?? `Mốc ${index + 1}`);
  return {
    compact: rawLabel.slice(0, 3).toUpperCase(),
    weekday: rawLabel,
    calendar: '',
    full: rawLabel,
  };
}

function getTrendMetricMeta(key) {
  if (key === 'minutes') {
    return {
      selectedLabel: 'Thời lượng đang xem',
      averageLabel: 'TB mỗi ngày',
      peakLabel: 'Đỉnh tuần',
    };
  }
  if (key === 'xp') {
    return {
      selectedLabel: 'XP đang xem',
      averageLabel: 'TB mỗi ngày',
      peakLabel: 'Đỉnh tuần',
    };
  }
  return {
    selectedLabel: 'Số phiên đang xem',
    averageLabel: 'TB mỗi ngày',
    peakLabel: 'Đỉnh tuần',
  };
}

function getNiceTrendDomainMax(rawMaxValue, key) {
  if (!Number.isFinite(rawMaxValue) || rawMaxValue <= 0) return 1;
  if (key === 'sessions') return Math.max(Math.ceil(rawMaxValue * 1.15), Math.ceil(rawMaxValue));
  if (key === 'minutes') {
    if (rawMaxValue <= 30) return Math.ceil(rawMaxValue / 5) * 5;
    if (rawMaxValue <= 90) return Math.ceil(rawMaxValue / 10) * 10;
    return Math.ceil(rawMaxValue / 30) * 30;
  }
  if (key === 'xp') {
    if (rawMaxValue <= 500) return Math.ceil(rawMaxValue / 50) * 50;
    if (rawMaxValue <= 2000) return Math.ceil(rawMaxValue / 100) * 100;
    return Math.ceil(rawMaxValue / 250) * 250;
  }
  return Math.ceil(rawMaxValue);
}

function getCompactTrendTickIndices(length) {
  return Array.from(new Set([
    0,
    Math.max(0, Math.floor((length - 1) / 2)),
    Math.max(0, length - 1),
  ]));
}

function buildSmoothLinePath(points) {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;

  let path = `M ${points[0].x.toFixed(2)},${points[0].y.toFixed(2)}`;
  for (let index = 0; index < points.length - 1; index += 1) {
    const previous = points[index === 0 ? index : index - 1];
    const current = points[index];
    const next = points[index + 1];
    const future = points[index + 2] || next;
    const controlPoint1X = current.x + (next.x - previous.x) / 6;
    const controlPoint1Y = current.y + (next.y - previous.y) / 6;
    const controlPoint2X = next.x - (future.x - current.x) / 6;
    const controlPoint2Y = next.y - (future.y - current.y) / 6;

    path += ` C ${controlPoint1X.toFixed(2)},${controlPoint1Y.toFixed(2)} ${controlPoint2X.toFixed(2)},${controlPoint2Y.toFixed(2)} ${next.x.toFixed(2)},${next.y.toFixed(2)}`;
  }
  return path;
}

function getSessionGoalText(entry) {
  if (typeof entry?.goal !== 'string') return '';
  return entry.goal.trim();
}

function getSessionNextNoteText(entry) {
  if (typeof entry?.nextNote !== 'string') return '';
  return entry.nextNote.trim();
}

function getSessionReviewMeta(entry) {
  const goalText = getSessionGoalText(entry);
  if (!goalText && typeof entry?.goalAchieved !== 'boolean') return null;

  if (entry?.goalAchieved === true) {
    return {
      key: 'achieved',
      label: 'Chạm mục tiêu đã đặt',
      shortLabel: 'Đúng nhịp',
      bg: 'rgba(201,100,66,0.10)',
      border: 'rgba(201,100,66,0.18)',
      color: '#8a3f24',
    };
  }

  if (entry?.goalAchieved === false) {
    return {
      key: 'missed',
      label: 'Chưa chạm mục tiêu',
      shortLabel: 'Lệch nhịp',
      bg: 'rgba(31,30,29,0.06)',
      border: 'rgba(31,30,29,0.10)',
      color: '#5f5b54',
    };
  }

  return {
    key: 'pending',
    label: 'Chưa đánh giá',
    shortLabel: 'Chờ chấm',
    bg: 'rgba(244,242,236,0.94)',
    border: 'rgba(31,30,29,0.08)',
    color: '#8b847b',
  };
}

function isSessionReviewed(entry) {
  return typeof entry?.goalAchieved === 'boolean';
}

function summarizeSessionReviews(entries = []) {
  return entries.reduce((acc, entry) => {
    const goalText = getSessionGoalText(entry);
    if (!goalText) return acc;

    acc.sessionsWithGoal += 1;

    if (entry?.goalAchieved === true) {
      acc.reviewedCount += 1;
      acc.achievedCount += 1;
      return acc;
    }

    if (entry?.goalAchieved === false) {
      acc.reviewedCount += 1;
      acc.missedCount += 1;
      return acc;
    }

    acc.pendingCount += 1;
    return acc;
  }, {
    sessionsWithGoal: 0,
    reviewedCount: 0,
    achievedCount: 0,
    missedCount: 0,
    pendingCount: 0,
  });
}

function SessionReviewBadge({ entry, compact = false }) {
  const meta = getSessionReviewMeta(entry);
  if (!meta) return null;

  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold tracking-[0.04em] ${compact ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-[11px]'}`}
      style={{ background: meta.bg, borderColor: meta.border, color: meta.color }}
    >
      {compact ? meta.shortLabel : meta.label}
    </span>
  );
}

function SessionReviewControls({ achieved, onPick }) {
  const options = [
    {
      value: true,
      label: 'Đạt',
      activeStyle: {
        background: 'rgba(91,122,82,0.18)',
        borderColor: 'rgba(91,122,82,0.34)',
        color: '#6f8f62',
        boxShadow: '0 10px 22px rgba(91,122,82,0.12)',
      },
      idleStyle: {
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(148,163,184,0.18)',
        color: NOTE_PANEL_TEXT,
      },
    },
    {
      value: false,
      label: 'Không đạt',
      activeStyle: {
        background: 'rgba(201,100,66,0.16)',
        borderColor: 'rgba(201,100,66,0.30)',
        color: ACCENT2,
        boxShadow: '0 10px 22px rgba(201,100,66,0.12)',
      },
      idleStyle: {
        background: 'rgba(255,255,255,0.04)',
        borderColor: 'rgba(148,163,184,0.18)',
        color: NOTE_PANEL_TEXT,
      },
    },
  ];

  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {options.map((option) => {
        const isActive = achieved === option.value;
        return (
          <button
            key={option.label}
            type="button"
            aria-pressed={isActive}
            onClick={() => onPick(option.value)}
            className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2"
            style={isActive ? option.activeStyle : option.idleStyle}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

function formatHourWindow(hour) {
  if (!Number.isFinite(hour)) return '—';
  const start = String(hour).padStart(2, '0');
  const end = String((hour + 1) % 24).padStart(2, '0');
  return `${start}:00–${end}:00`;
}

function getTimestampMs(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (!value) return NaN;

  const key = String(value);
  if (TIMESTAMP_MS_CACHE.has(key)) {
    return TIMESTAMP_MS_CACHE.get(key);
  }

  const parsed = new Date(value).getTime();
  if (TIMESTAMP_MS_CACHE.size > 5000) {
    TIMESTAMP_MS_CACHE.clear();
  }
  TIMESTAMP_MS_CACHE.set(key, parsed);
  return parsed;
}

function buildCategoryAdvisor({
  catStats,
  totalMins,
  totalSess,
  avgMinutesOverall,
  topTimeCat,
  topShare,
  bestEfficiencyCat,
  longestAvgCat,
  leastUsedCat,
  periodLabel,
}) {
  const uncategorized = catStats.find((cat) => cat.id === '__none__') ?? null;
  const uncategorizedShare = uncategorized && totalMins > 0 ? (uncategorized.minutes / totalMins) * 100 : 0;
  const namedCats = catStats.filter((cat) => cat.id !== '__none__');
  const primaryNamedCat = namedCats[0] ?? topTimeCat ?? null;
  const recommendedFocusCat = (bestEfficiencyCat?.id !== '__none__' ? bestEfficiencyCat : null)
    ?? primaryNamedCat
    ?? topTimeCat
    ?? null;
  const balanceTargetCat = (leastUsedCat?.id !== '__none__' ? leastUsedCat : null)
    ?? (namedCats.length > 1 ? [...namedCats].sort((a, b) => a.minutes - b.minutes)[0] : null);

  let mentorTone = 'Góc nhìn hiện tại';
  let mentorHeadline = 'Phân bổ hiện tại đang khá ổn định';
  let mentorBody = 'Các loại đang phân bố tương đối hợp lý. Đây là lúc tinh chỉnh nhẹ để tăng hiệu quả thay vì đổi hướng quá mạnh.';

  if (totalSess < 4) {
    mentorTone = 'Dữ liệu mở đầu';
    mentorHeadline = 'Dữ liệu hiện còn hơi mỏng';
    mentorBody = `Anh mới có ${totalSess} phiên trong ${periodLabel.toLowerCase()}, nên tab này vẫn đang ở giai đoạn gom nền dữ liệu. Hãy thêm vài phiên có chủ đích trước khi rút kết luận mạnh.`;
  } else if (uncategorizedShare >= 25) {
    mentorTone = 'Chất lượng dữ liệu';
    mentorHeadline = 'Dữ liệu đang bị loãng vì thiếu phân loại';
    mentorBody = `Có tới ${uncategorizedShare.toFixed(0)}% thời gian đang nằm ở nhóm chưa phân loại. Khi phần này quá lớn, các nhận định phía sau sẽ kém chính xác hơn mức cần thiết.`;
  } else if (
    topTimeCat
    && bestEfficiencyCat
    && topTimeCat.id !== bestEfficiencyCat.id
    && topShare >= 55
  ) {
    mentorTone = 'Cơ hội điều chỉnh';
    mentorHeadline = 'Thời gian và hiệu suất đang lệch nhau';
    mentorBody = `${topTimeCat.label} đang giữ phần lớn thời gian, nhưng ${bestEfficiencyCat.label} mới là loại cho XP/phút tốt nhất. Đây là một cơ hội điều chỉnh đáng thử.`;
  } else if (topShare >= 75) {
    mentorTone = 'Trục đang nổi lên';
    mentorHeadline = 'Một trục chính đang nổi lên rất rõ';
    mentorBody = `${topTimeCat?.label ?? 'Loại chủ đạo'} đang chiếm gần hết quỹ thời gian. Cấu trúc này hợp lý nếu anh đang đẩy một mục tiêu lớn, nhưng dễ làm các nhóm khác bị bỏ quên.`;
  } else if (topShare <= 40 && namedCats.length >= 4) {
    mentorTone = 'Độ đa dạng hiện tại';
    mentorHeadline = 'Phân bổ hiện khá đa dạng';
    mentorBody = 'Thời gian hiện được chia cho khá nhiều loại. Điều này tốt cho độ rộng, nhưng nên có một trục ưu tiên rõ hơn để giữ cảm giác tiến bộ.';
  }

  const recommendations = [];

  if (uncategorizedShare >= 15) {
    recommendations.push(`Khóa thói quen gắn loại ngay trước khi bấm bắt đầu phiên để giảm nhóm “Chưa gắn loại” xuống dưới 10%.`);
  }

  if (
    recommendedFocusCat
    && topTimeCat
    && bestEfficiencyCat
    && topTimeCat.id !== bestEfficiencyCat.id
  ) {
    recommendations.push(`Thử chuyển 1 đến 2 phiên kế tiếp từ ${topTimeCat.label} sang ${recommendedFocusCat.label} để xem hiệu suất chung có nhảy lên hay không.`);
  }

  if (avgMinutesOverall < 15 && longestAvgCat) {
    recommendations.push(`Phiên trung bình đang hơi ngắn. Nếu muốn tiến sâu hơn, hãy thử kéo ${longestAvgCat.label} lên khoảng ${Math.max(20, Math.round(longestAvgCat.minutes / longestAvgCat.sessions))} phút.`);
  } else if (avgMinutesOverall > 45 && bestEfficiencyCat) {
    recommendations.push(`Phiên trung bình đang khá dài. Hãy thử tách bớt thành các phiên quanh ${Math.max(20, Math.min(35, Math.round(bestEfficiencyCat.minutes / Math.max(bestEfficiencyCat.sessions, 1))))} phút để giữ chất lượng ổn định hơn.`);
  }

  if (balanceTargetCat && namedCats.length >= 3) {
    recommendations.push(`Dành một phiên nhỏ cho ${balanceTargetCat.label} để giữ phân bổ cân đối, tránh việc một nhóm bị bỏ quên quá lâu.`);
  }

  if (recommendations.length < 3 && primaryNamedCat) {
    recommendations.push(`Giữ ${primaryNamedCat.label} làm trục chính, nhưng chừa ít nhất 1 phiên phụ trong ${periodLabel.toLowerCase()} để không bị đơn điệu.`);
  }

  const scenarios = [
    {
      key: 'next-session',
      title: 'Hướng cho phiên kế tiếp',
      icon: 'NX',
      color: recommendedFocusCat?.color ?? ACCENT,
      summary: recommendedFocusCat
        ? `Nếu cần một nước đi an toàn và hiệu quả, hãy ưu tiên ${recommendedFocusCat.label} ở phiên tiếp theo.`
        : 'Nếu cần một nước đi an toàn, hãy tiếp tục với loại đã cho cảm giác ổn định nhất gần đây.',
      steps: [
        recommendedFocusCat
          ? `Chọn ${recommendedFocusCat.label} ngay từ đầu để dữ liệu phân loại không bị rơi vào “Chưa gắn loại”.`
          : 'Chọn một loại rõ ràng ngay từ đầu phiên.',
        avgMinutesOverall > 0
          ? `Giữ thời lượng quanh ${avgMinutesOverall} phút để bám sát nhịp thật của anh.`
          : 'Giữ thời lượng ở mức anh thấy dễ hoàn thành trọn vẹn.',
        'Kết thúc phiên xong quay lại tab này để kiểm tra xem tỷ trọng và hiệu suất có thay đổi theo hướng mong muốn không.',
      ],
    },
    {
      key: 'xp-optimization',
      title: 'Hướng tăng hiệu suất',
      icon: 'XP',
      color: bestEfficiencyCat?.color ?? '#0ea5e9',
      summary: bestEfficiencyCat
        ? `${bestEfficiencyCat.label} đang cho hiệu suất XP/phút tốt nhất, nên đây là lựa chọn hợp lý nếu anh muốn đẩy tốc độ tăng trưởng.`
        : 'Kịch bản này sẽ mạnh hơn khi có thêm dữ liệu từ vài phiên nữa.',
      steps: [
        bestEfficiencyCat
          ? `Ưu tiên 2 phiên liên tiếp cho ${bestEfficiencyCat.label} để xác nhận đây có phải vùng hiệu suất thật hay chỉ là đột biến ngắn.`
          : 'Ghi nhận thêm ít nhất 2 phiên có gắn loại rõ ràng để hệ thống xác định vùng hiệu suất.',
        bestEfficiencyCat
          ? `So sánh với ${topTimeCat?.label ?? 'loại hiện tại'}: nếu XP/phút vẫn cao hơn, cân nhắc tăng tỷ trọng của ${bestEfficiencyCat.label}.`
          : 'Theo dõi XP/phút thay vì chỉ nhìn tổng XP.',
        'Không cần thay toàn bộ lịch ngay; chỉ cần chuyển 20 đến 30% quỹ phiên sang loại đang có tín hiệu tốt hơn.',
      ],
    },
    {
      key: 'balance-plan',
      title: 'Hướng cân bằng và mở rộng',
      icon: 'CB',
      color: balanceTargetCat?.color ?? '#8b5cf6',
      summary: balanceTargetCat
        ? `${balanceTargetCat.label} đang là nhóm ít được nuôi nhất. Một phiên nhỏ đúng lúc có thể làm phân bổ hiện tại cân bằng hơn rất nhiều.`
        : 'Kịch bản này phù hợp khi anh muốn giữ các loại hoạt động sống đồng đều hơn.',
      steps: [
        balanceTargetCat
          ? `Cấy một phiên ngắn cho ${balanceTargetCat.label} trong hôm nay hoặc ngày mai để tránh nó bị tụt khỏi nhịp chung.`
          : 'Cấy một phiên phụ cho nhóm ít được dùng hơn trong chu kỳ tới.',
        namedCats.length >= 2
          ? `Giữ một loại chủ đạo và một loại phụ, thay vì dàn đều toàn bộ các loại cùng lúc.`
          : 'Khi mở rộng, chỉ thêm từng loại một để dễ đọc dữ liệu hơn.',
        'Sau 3 đến 5 phiên, kiểm tra lại xem độ đa dạng tăng lên nhưng hiệu suất tổng có bị giảm đáng kể hay không.',
      ],
    },
  ];

  const mentorSignals = [
    {
      label: 'Nhóm chủ đạo',
      value: topTimeCat ? `${topShare.toFixed(0)}%` : '0%',
      sub: topTimeCat?.label ?? 'Chưa có',
      color: topTimeCat?.color ?? ACCENT,
    },
    {
      label: 'Nhịp hiệu quả',
      value: bestEfficiencyCat ? `${(bestEfficiencyCat.xp / bestEfficiencyCat.minutes).toFixed(1)} XP/p` : '—',
      sub: bestEfficiencyCat?.label ?? 'Đang chờ dữ liệu',
      color: bestEfficiencyCat?.color ?? '#0ea5e9',
    },
    {
      label: 'Chưa gắn loại',
      value: `${uncategorizedShare.toFixed(0)}%`,
      sub: uncategorized ? fmtHours(uncategorized.minutes) : '0p',
      color: uncategorizedShare >= 20 ? '#ef4444' : '#64748b',
    },
  ];

  return {
    mentorTone,
    mentorHeadline,
    mentorBody,
    recommendations: recommendations.slice(0, 4),
    scenarios,
    mentorSignals,
  };
}

/** Lọc history theo khoảng thời gian */
function getPeriodStartTs(period) {
  if (period === 'today') return startOfVietnamDayTs();
  if (period === 'week') return startOfVietnamWeekTs();
  if (period === 'month') return startOfVietnamMonthTs();
  if (period === 'quarter') return startOfVietnamQuarterTs();
  if (period === 'year') return startOfVietnamYearTs();
  return null;
}

function filterByPeriod(history, period) {
  const startTs = getPeriodStartTs(period);
  if (startTs === null) return history;

  const filtered = [];
  for (const entry of history) {
    const timestampMs = getTimestampMs(entry?.timestamp);
    if (Number.isFinite(timestampMs) && timestampMs >= startTs) {
      filtered.push(entry);
    }
  }
  return filtered;
}

// ─── SVG Bar Chart ────────────────────────────────────────────────────────────
// FIX: preserveAspectRatio="none" distorts SVG <text> (non-uniform scale).
// Solution: SVG renders ONLY bars + gridlines; all text is HTML (crisp font).
const BarChart = React.memo(function BarChart({ data, valueKey = 'minutes', height = 110, accentColor = ACCENT }) {
  const [hovIdx, setHovIdx] = useState(null);

  const values = useMemo(() => data.map((d) => d[valueKey] ?? 0), [data, valueKey]);
  const maxVal = useMemo(() => Math.max(...values, 1), [values]);
  const n      = data.length;
  const barW   = 100 / n;   // % width per bar column
  const LABEL_H = 20;        // px for HTML x-labels below svg
  const svgH    = height - LABEL_H;

  return (
    <div className="relative select-none">

      {/* Y-axis hint — HTML, not SVG */}
      <div className="absolute top-0 left-0 leading-none pointer-events-none"
        style={{ fontSize: '10px', color: CHART_AXIS_TEXT, fontFamily: SANS_FONT, fontWeight: 600, letterSpacing: '0.04em' }}>
        {fmtVal(maxVal, valueKey)}
      </div>

      {/* Hover tooltip — HTML div, perfectly crisp */}
      {hovIdx !== null && values[hovIdx] > 0 && (
        <div className="absolute pointer-events-none z-20 rounded-lg px-2 py-0.5 text-xs font-medium whitespace-nowrap"
          style={{
            left: `clamp(0px, calc(${(hovIdx + 0.5) * barW}% - 44px), calc(100% - 88px))`,
            bottom: `${LABEL_H + 6}px`,
            background: CHART_CALLOUT_BG,
            border: `1px solid ${PANEL_BORDER}`,
            color: CHART_CALLOUT_TEXT,
            boxShadow: `0 12px 26px ${CHART_SHADOW}`,
            fontFamily: SANS_FONT,
          }}>
          {data[hovIdx].label}: {fmtVal(values[hovIdx], valueKey)}
        </div>
      )}

      {/* SVG — ONLY bars + gridlines, zero text */}
      <svg viewBox={`0 0 100 ${svgH}`} preserveAspectRatio="none"
        style={{ display: 'block', width: '100%', height: `${svgH}px` }}>
        {/* Gridlines */}
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <line key={f} x1="0" x2="100"
            y1={svgH * (1 - f)} y2={svgH * (1 - f)}
            stroke={CHART_GUIDE} strokeWidth="0.5" />
        ))}
        {/* Bars */}
        {data.map((d, i) => {
          const val    = values[i];
          const bH     = val > 0 ? Math.max((val / maxVal) * (svgH - 4), 2) : 0;
          const x      = i * barW + barW * 0.1;
          const bw     = barW * 0.8;
          const isLast = i === n - 1;
          const isHov  = hovIdx === i;
          return (
            <g key={i}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
              style={{ cursor: 'pointer' }}>
              {/* Invisible full-column hover target */}
              <rect x={i * barW} y={0} width={barW} height={svgH} fill="transparent" />
              {bH > 0
                ? <rect x={x} y={svgH - bH} width={bw} height={bH} rx="1.5"
                    fill={isHov || isLast ? accentColor : accentColor + '55'}
                    style={{ transition: 'fill 0.12s' }} />
                : <rect x={x} y={svgH - 1} width={bw} height={1} fill={CHART_GUIDE} />
              }
            </g>
          );
        })}
      </svg>

      {/* X-axis labels — HTML flex row, crisp font, no SVG distortion */}
      <div className="flex" style={{ height: `${LABEL_H}px`, alignItems: 'flex-start', paddingTop: '3px' }}>
        {data.map((d, i) => (
          <div key={i} className="flex-1 text-center overflow-hidden leading-none"
            style={{
              fontSize: '10px',
              color: i === n - 1 ? ACCENT2 : CHART_AXIS_TEXT,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              fontFamily: SANS_FONT,
              fontWeight: 600,
              letterSpacing: '0.04em',
            }}>
            {String(d.label ?? '').slice(0, 8)}
          </div>
        ))}
      </div>
    </div>
  );
});

// ─── SVG Area/Line Chart — redesign with readable axes, labels and focus state ─
function AreaChart({ data, valueKey = 'minutes', height = 80, accentColor = ACCENT }) {
  const shouldReduceMotion = useReducedMotion();
  const chartId = useId().replace(/:/g, '');
  const isCompact = height <= 72;
  const pointCount = data.length;
  const [activeIndex, setActiveIndex] = useState(Math.max(pointCount - 1, 0));
  const fallbackWidth = Math.max(isCompact ? 292 : 420, pointCount * (isCompact ? 36 : 54));
  const [chartRef, measuredWidth] = useResponsiveChartWidth(fallbackWidth);

  const chart = useMemo(() => {
    if (pointCount < 2) return null;

    const width = Math.max(measuredWidth, isCompact ? 292 : 360);
    const padding = isCompact
      ? { top: 16, right: 10, bottom: 16, left: 10 }
      : { top: 18, right: 18, bottom: 20, left: 42 };
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;
    const baselineY = padding.top + innerHeight;
    const numericValues = data.map((entry) => Number(entry?.[valueKey] ?? 0));
    const rawMaxValue = Math.max(...numericValues, 0);
    const domainMax = getNiceTrendDomainMax(rawMaxValue, valueKey);
    const averageValue = numericValues.reduce((sum, value) => sum + value, 0) / pointCount;
    const stepX = pointCount > 1 ? innerWidth / (pointCount - 1) : innerWidth;

    const points = data.map((entry, index) => {
      const value = numericValues[index];
      const labels = getTrendDateLabels(entry, index);
      const x = padding.left + (stepX * index);
      const y = padding.top + (1 - (value / domainMax)) * innerHeight;
      return {
        entry,
        index,
        value,
        x,
        y,
        ...labels,
      };
    });

    const peak = points.reduce((best, point) => (point.value > best.value ? point : best), points[0]);
    const linePath = buildSmoothLinePath(points);
    const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(2)},${baselineY.toFixed(2)} L ${points[0].x.toFixed(2)},${baselineY.toFixed(2)} Z`;
    const guideValues = [domainMax, domainMax * 0.66, domainMax * 0.33, 0]
      .map((value) => (valueKey === 'sessions' ? Math.round(value) : value))
      .filter((value, index, list) => list.findIndex((candidate) => Math.abs(candidate - value) < (valueKey === 'sessions' ? 1 : 0.35)) === index)
      .sort((left, right) => right - left);
    const averageY = padding.top + (1 - (averageValue / domainMax)) * innerHeight;
    const metricMeta = getTrendMetricMeta(valueKey);

    return {
      width,
      padding,
      innerHeight,
      baselineY,
      points,
      linePath,
      areaPath,
      guideValues,
      averageValue,
      averageY,
      peak,
      guideMax: Math.max(...guideValues, 1),
      stepX,
      metricMeta,
    };
  }, [data, height, isCompact, measuredWidth, pointCount, valueKey]);

  if (!chart) return null;

  const safeActiveIndex = activeIndex >= 0 && activeIndex < chart.points.length
    ? activeIndex
    : chart.points.length - 1;
  const activePoint = chart.points[safeActiveIndex];
  const activeValueLabel = fmtVal(Math.round(activePoint.value), valueKey);
  const activeColumnLeft = safeActiveIndex === 0
    ? chart.padding.left
    : activePoint.x - (chart.stepX / 2);
  const activeColumnRight = safeActiveIndex === chart.points.length - 1
    ? chart.width - chart.padding.right
    : activePoint.x + (chart.stepX / 2);
  const accentSoft = hexToRgba(accentColor, 0.12);
  const accentMid = hexToRgba(accentColor, 0.24);
  const accentStrong = hexToRgba(accentColor, 0.82);
  const areaGradientId = `statsArea_${chartId}`;
  const lineGlowId = `statsGlow_${chartId}`;
  const compactTickIndices = getCompactTrendTickIndices(chart.points.length);
  const peakLabelX = clampValue(chart.peak.x, chart.padding.left + 30, chart.width - chart.padding.right - 30);
  const activeCalloutLeft = clampValue(
    activePoint.x - 62,
    chart.padding.left + 8,
    chart.width - chart.padding.right - 124
  );

  if (isCompact) {
    return (
      <div ref={chartRef} className="space-y-2.5" onMouseLeave={() => setActiveIndex(chart.points.length - 1)}>
        <div className="flex items-center justify-between gap-3 px-1">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
              {activePoint.weekday}
            </p>
            <p className="mt-1 text-[12px] font-semibold tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: SANS_FONT }}>
              {activePoint.calendar || activePoint.full}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
              7 ngày
            </p>
            <p className="mt-1 text-[1.05rem] font-semibold leading-none tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: METRIC_FONT, letterSpacing: METRIC_TRACKING }}>
              {fmtChartAxisValue(activePoint.value, valueKey)}
            </p>
          </div>
        </div>

        <div
          className="relative overflow-hidden rounded-[20px]"
          style={{
            background: `radial-gradient(circle at ${activePoint.x}px 18%, ${hexToRgba(accentColor, 0.16)} 0%, transparent 36%), ${CHART_SURFACE_COMPACT}`,
            border: `1px solid ${hexToRgba(accentColor, 0.18)}`,
            boxShadow: `inset 0 1px 0 ${CHART_INSET_LINE}`,
          }}
        >
          <div
            className="pointer-events-none absolute inset-y-2 rounded-[16px]"
            style={{
              left: `${(activeColumnLeft / chart.width) * 100}%`,
              width: `${Math.max(((activeColumnRight - activeColumnLeft) / chart.width) * 100, 8)}%`,
              background: `linear-gradient(180deg, ${hexToRgba(accentColor, 0.12)} 0%, transparent 100%)`,
            }}
          />

          <svg
            viewBox={`0 0 ${chart.width} ${height}`}
            style={{ display: 'block', width: '100%', height: `${height}px` }}
          >
            <defs>
              <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={hexToRgba(accentColor, 0.32)} />
                <stop offset="100%" stopColor={hexToRgba(accentColor, 0.02)} />
              </linearGradient>
              <filter id={lineGlowId} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={hexToRgba(accentColor, 0.3)} />
              </filter>
            </defs>

            {[0.25, 0.55, 0.85].map((ratio) => {
              const guideY = chart.padding.top + (chart.innerHeight * ratio);
              return (
                <line
                  key={`compact-guide-${ratio}`}
                  x1={chart.padding.left}
                  x2={chart.width - chart.padding.right}
                  y1={guideY}
                  y2={guideY}
                  stroke={CHART_GUIDE}
                  strokeWidth="1"
                  strokeDasharray="4 8"
                />
              );
            })}

            {chart.points.map((point) => {
              const left = point.index === 0 ? chart.padding.left : point.x - (chart.stepX / 2);
              const right = point.index === chart.points.length - 1 ? chart.width - chart.padding.right : point.x + (chart.stepX / 2);
              return (
                <rect
                  key={`compact-band-${point.index}`}
                  x={left}
                  y={chart.padding.top + 6}
                  width={Math.max(right - left, 10)}
                  height={chart.innerHeight - 8}
                  rx="12"
                  fill={point.index === safeActiveIndex ? 'transparent' : hexToRgba(accentColor, point.value > 0 ? 0.05 : 0.01)}
                />
              );
            })}

            <Motion.path
              d={chart.areaPath}
              fill={`url(#${areaGradientId})`}
              initial={shouldReduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            />
            <Motion.path
              d={chart.linePath}
              fill="none"
              stroke={accentColor}
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter={`url(#${lineGlowId})`}
              initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
            />

            <line
              x1={activePoint.x}
              x2={activePoint.x}
              y1={activePoint.y - 10}
              y2={height - chart.padding.bottom + 1}
              stroke={hexToRgba(accentColor, 0.42)}
              strokeWidth="1.2"
              strokeDasharray="3 4"
            />

            {chart.points.map((point) => {
              const isActive = point.index === safeActiveIndex;
              return (
                <g key={`compact-point-${point.index}`}>
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 5.6 : 2.2}
                    fill={isActive ? hexToRgba(accentColor, 0.18) : hexToRgba(accentColor, 0.1)}
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r={isActive ? 3.4 : 1.8}
                    fill={isActive ? accentColor : CHART_POINT_FILL}
                    stroke={accentColor}
                    strokeWidth={isActive ? 1.8 : 1.1}
                  />
                  <title>{`${point.full}: ${fmtVal(Math.round(point.value), valueKey)}`}</title>
                </g>
              );
            })}

            {chart.points.map((point) => {
              const left = point.index === 0 ? chart.padding.left : point.x - (chart.stepX / 2);
              const right = point.index === chart.points.length - 1 ? chart.width - chart.padding.right : point.x + (chart.stepX / 2);
              return (
                <rect
                  key={`compact-target-${point.index}`}
                  x={left}
                  y={0}
                  width={Math.max(right - left, 10)}
                  height={height}
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActiveIndex(point.index)}
                  onFocus={() => setActiveIndex(point.index)}
                  onClick={() => setActiveIndex(point.index)}
                />
              );
            })}
          </svg>
        </div>

        <div className="flex items-center justify-between gap-3 px-1">
          {compactTickIndices.map((index) => {
            const point = chart.points[index];
            const isActive = index === safeActiveIndex;
            return (
              <div key={`compact-tick-${index}`} className="min-w-0">
                <div className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: isActive ? accentColor : CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
                  {point.compact}
                </div>
                <div className="mt-0.5 text-[10px] tabular-nums" style={{ color: TEXT_MUTED, fontFamily: SANS_FONT }}>
                  {fmtChartAxisValue(point.value, valueKey)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div ref={chartRef} className="space-y-4" onMouseLeave={() => setActiveIndex(chart.points.length - 1)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
            {chart.metricMeta.selectedLabel}
          </p>
          <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
            <span className="text-[2rem] font-semibold leading-none tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: METRIC_FONT, letterSpacing: METRIC_TRACKING }}>
              {activeValueLabel}
            </span>
            <span className="text-[13px] font-medium" style={{ color: TEXT_MUTED, fontFamily: SANS_FONT }}>
              {activePoint.full}
            </span>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
          {[
            { label: 'Mốc đang xem', value: fmtChartAxisValue(activePoint.value, valueKey), tone: TEXT_PRIMARY },
            { label: chart.metricMeta.averageLabel, value: fmtVal(Math.round(chart.averageValue), valueKey), tone: TEXT_MUTED },
            { label: chart.metricMeta.peakLabel, value: `${chart.peak.weekday} · ${fmtChartAxisValue(chart.peak.value, valueKey)}`, tone: accentColor },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[18px] px-3.5 py-3"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
                {item.label}
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-tight tabular-nums" style={{ color: item.tone, fontFamily: SANS_FONT }}>
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div
        className="relative overflow-hidden rounded-[26px]"
        style={{
          background: `radial-gradient(circle at ${activePoint.x}px 18%, ${hexToRgba(accentColor, 0.16)} 0%, transparent 34%), ${CHART_SURFACE}`,
          border: `1px solid ${hexToRgba(accentColor, 0.18)}`,
          boxShadow: `0 18px 42px ${CHART_SHADOW}, inset 0 1px 0 ${CHART_INSET_LINE}`,
        }}
      >
        <div className="pointer-events-none absolute inset-0 z-[2]">
          {chart.guideValues.map((guideValue) => {
            const guideY = chart.padding.top + (1 - (guideValue / chart.guideMax)) * chart.innerHeight;
            return (
              <div
                key={`guide-label-${guideValue.toFixed(2)}`}
                className="absolute text-right text-[10px] font-semibold"
                style={{
                  left: 0,
                  top: `${guideY - 7}px`,
                  width: `${Math.max(chart.padding.left - 10, 24)}px`,
                  color: CHART_AXIS_TEXT,
                  fontFamily: SANS_FONT,
                  letterSpacing: '0.04em',
                }}
              >
                {fmtChartAxisValue(guideValue, valueKey)}
              </div>
            );
          })}

          {chart.averageValue > 0 && (
            <div
              className="absolute text-[10px] font-bold"
              style={{
                right: `${Math.max(chart.padding.right - 2, 8)}px`,
                top: `${Math.max(chart.averageY - 17, chart.padding.top + 2)}px`,
                color: accentStrong,
                fontFamily: SANS_FONT,
                letterSpacing: '0.08em',
              }}
            >
              TB
            </div>
          )}

          {chart.peak.value > 0 && (
            <div
              className="absolute text-[10px] font-bold"
              style={{
                left: `${peakLabelX}px`,
                top: `${Math.max(chart.peak.y - 31, chart.padding.top + 2)}px`,
                transform: 'translateX(-50%)',
                color: accentStrong,
                fontFamily: SANS_FONT,
                letterSpacing: '0.08em',
              }}
            >
              Đỉnh
            </div>
          )}
        </div>

        <div
          className="pointer-events-none absolute z-[2] rounded-[18px] px-3.5 py-2.5"
          style={{
            left: `${activeCalloutLeft}px`,
            top: `${Math.max(activePoint.y - 58, 14)}px`,
            background: CHART_CALLOUT_BG,
            border: `1px solid ${hexToRgba(accentColor, 0.16)}`,
            boxShadow: `0 16px 36px ${CHART_SHADOW}`,
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
            {activePoint.weekday}
          </p>
          <p className="mt-1 text-[1rem] font-semibold leading-none tabular-nums" style={{ color: CHART_CALLOUT_TEXT, fontFamily: METRIC_FONT, letterSpacing: METRIC_TRACKING }}>
            {activeValueLabel}
          </p>
          <p className="mt-1 text-[11px]" style={{ color: CHART_CALLOUT_MUTED, fontFamily: SANS_FONT }}>
            {activePoint.calendar}
          </p>
        </div>

        <svg
          viewBox={`0 0 ${chart.width} ${height}`}
          style={{ display: 'block', width: '100%', height: `${height}px` }}
        >
          <defs>
            <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={hexToRgba(accentColor, 0.44)} />
              <stop offset="72%" stopColor={hexToRgba(accentColor, 0.14)} />
              <stop offset="100%" stopColor={hexToRgba(accentColor, 0.02)} />
            </linearGradient>
            <filter id={lineGlowId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="8" stdDeviation="7" floodColor={hexToRgba(accentColor, 0.28)} />
            </filter>
          </defs>

          <rect
            x={activeColumnLeft}
            y={chart.padding.top - 6}
            width={Math.max(activeColumnRight - activeColumnLeft, 20)}
            height={chart.innerHeight + 12}
            rx="18"
            fill={hexToRgba(accentColor, 0.12)}
          />

          {chart.points.map((point) => {
            const left = point.index === 0 ? chart.padding.left : point.x - (chart.stepX / 2);
            const right = point.index === chart.points.length - 1 ? chart.width - chart.padding.right : point.x + (chart.stepX / 2);
            const bandAlpha = point.value > 0 ? 0.03 + ((point.value / Math.max(chart.peak.value, 1)) * 0.05) : 0.015;
            return (
              <rect
                key={`detailed-band-${point.index}`}
                x={left}
                y={chart.padding.top}
                width={Math.max(right - left, 8)}
                height={chart.innerHeight}
                fill={point.index === safeActiveIndex ? 'transparent' : hexToRgba(accentColor, bandAlpha)}
              />
            );
          })}

          {chart.guideValues.map((guideValue) => {
            const y = chart.padding.top + (1 - (guideValue / chart.guideMax)) * chart.innerHeight;
            return (
              <g key={`guide-${guideValue.toFixed(2)}`}>
                <line
                  x1={chart.padding.left}
                  x2={chart.width - chart.padding.right}
                  y1={y}
                  y2={y}
                  stroke={CHART_GUIDE}
                  strokeWidth="1"
                  strokeDasharray={guideValue === 0 ? '0' : '4 7'}
                />
              </g>
            );
          })}

          {chart.averageValue > 0 && (
            <>
              <line
                x1={chart.padding.left}
                x2={chart.width - chart.padding.right}
                y1={chart.averageY}
                y2={chart.averageY}
                stroke={hexToRgba(accentColor, 0.52)}
                strokeWidth="1.2"
                strokeDasharray="4 5"
              />
            </>
          )}

          <Motion.path
            d={chart.areaPath}
            fill={`url(#${areaGradientId})`}
            initial={shouldReduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
          <Motion.path
            d={chart.linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth="2.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${lineGlowId})`}
            initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0.45 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.82, ease: 'easeOut' }}
          />

          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={Math.max(activePoint.y - 18, chart.padding.top)}
            y2={height - chart.padding.bottom + 1}
            stroke={hexToRgba(accentColor, 0.38)}
            strokeWidth="1.2"
            strokeDasharray="4 4"
          />

          {chart.peak.value > 0 && (
            <g>
              <line
                x1={chart.peak.x}
                x2={chart.peak.x}
                y1={chart.peak.y - 16}
                y2={chart.peak.y - 5}
                stroke={accentStrong}
                strokeWidth="1.2"
                strokeLinecap="round"
              />
            </g>
          )}

          {chart.points.map((point) => {
            const isActive = point.index === safeActiveIndex;
            const isPeak = point.index === chart.peak.index && point.value > 0;
            const radius = isActive ? 4.8 : isPeak ? 3.7 : 2.6;

            return (
              <g key={`point-${point.index}`}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius + (isActive ? 4 : 2)}
                  fill={hexToRgba(accentColor, isActive ? 0.16 : 0.08)}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={radius}
                  fill={isActive ? accentColor : CHART_POINT_FILL}
                  stroke={isActive ? CHART_POINT_RING : accentColor}
                  strokeWidth={isActive ? 2.2 : 1.5}
                />
                <title>{`${point.full}: ${fmtVal(Math.round(point.value), valueKey)}`}</title>
              </g>
            );
          })}

          {chart.points.map((point) => {
            const left = point.index === 0 ? chart.padding.left : point.x - (chart.stepX / 2);
            const right = point.index === chart.points.length - 1 ? chart.width - chart.padding.right : point.x + (chart.stepX / 2);
            return (
              <rect
                key={`target-${point.index}`}
                x={left}
                y={0}
                width={Math.max(right - left, 10)}
                height={height}
                fill="transparent"
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setActiveIndex(point.index)}
                onFocus={() => setActiveIndex(point.index)}
                onClick={() => setActiveIndex(point.index)}
              />
            );
          })}
        </svg>
      </div>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${chart.points.length}, minmax(0, 1fr))` }}
      >
        {chart.points.map((point) => {
          const isActive = point.index === safeActiveIndex;
          return (
            <button
              key={`label-${point.index}`}
              type="button"
              onMouseEnter={() => setActiveIndex(point.index)}
              onFocus={() => setActiveIndex(point.index)}
              onClick={() => setActiveIndex(point.index)}
              className="rounded-[16px] px-2 py-2 text-center transition-colors duration-150"
              style={{
                background: isActive ? accentSoft : PANEL_BG_SOFT,
                border: `1px solid ${isActive ? accentMid : PANEL_BORDER}`,
              }}
            >
              <div
                className="text-[10px] font-semibold uppercase tracking-[0.16em]"
                style={{ color: isActive ? TEXT_PRIMARY : CHART_AXIS_TEXT, fontFamily: SANS_FONT }}
              >
                {point.compact}
              </div>
              <div className="mt-1 text-[11px] font-medium tabular-nums" style={{ color: isActive ? TEXT_PRIMARY : TEXT_MUTED, fontFamily: SANS_FONT }}>
                {fmtChartAxisValue(point.value, valueKey)}
              </div>
              <div className="mt-0.5 text-[10px]" style={{ color: CHART_AXIS_TEXT, fontFamily: SANS_FONT }}>
                {point.calendar}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Scatter Plot: XP/phút vs Độ dài TB/phiên ────────────────────────────────
function CategoryScatterPlot({ catStats }) {
  const [hov, setHov] = useState(null);
  const withData = catStats.filter((c) => c.sessions > 0 && c.minutes > 0);
  if (withData.length < 2) return null;

  const xpPerMinValues = withData.map((c) => c.xp / c.minutes);
  const avgMinsValues = withData.map((c) => c.minutes / c.sessions);
  const maxXPM = Math.max(...xpPerMinValues, 1);
  const maxAvgMin = Math.max(...avgMinsValues, 1);
  const minXPM = Math.min(...xpPerMinValues);
  const minAvgMin = Math.min(...avgMinsValues);
  const maxSess = Math.max(...withData.map((c) => c.sessions), 1);

  const xRange = Math.max(maxAvgMin - minAvgMin, 1);
  const yRange = Math.max(maxXPM - minXPM, 0.4);

  const toPctX = (value) => 3 + ((value - minAvgMin) / xRange) * 94;
  const toPctY = (value) => 4 + (1 - ((value - minXPM) / yRange)) * 88;
  const toSize = (sessions) => 20 + Math.sqrt(sessions / maxSess) * 14;
  const hovered = hov !== null ? withData[hov] : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3 px-1">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
            XP / phút
          </span>
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {minXPM.toFixed(1)} → {maxXPM.toFixed(1)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
            Độ dài trung bình / phiên
          </span>
          <span className="text-[11px]" style={{ color: TEXT_MUTED }}>
            {minAvgMin.toFixed(0)}p → {maxAvgMin.toFixed(0)}p
          </span>
        </div>
      </div>

      <div
        className="rounded-[22px] p-4"
        style={{
          background: PANEL_BG_SOFT,
          border: `1px solid ${PANEL_BORDER}`,
        }}
      >
        <div className="relative">
          <div className="flex items-stretch gap-3">
            <div className="w-14 shrink-0 flex flex-col justify-between py-3 text-[11px] font-medium text-right" style={{ color: TEXT_MUTED }}>
              {[maxXPM, minXPM + yRange * 0.66, minXPM + yRange * 0.33, minXPM].map((value, index) => (
                <span key={index}>{value.toFixed(1)}</span>
              ))}
            </div>

            <div className="flex-1">
              <div
                className="relative rounded-[18px] overflow-hidden"
                style={{
                  height: '220px',
                  background: `linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)`,
                  border: `1px solid ${PANEL_BORDER}`,
                }}
              >
                <div
                  className="absolute inset-4 rounded-[14px]"
                  style={{
                    backgroundImage: `linear-gradient(to bottom, transparent 24%, ${GRID_LINE} 25%, transparent 26%), linear-gradient(to right, transparent 24%, ${GRID_LINE} 25%, transparent 26%)`,
                    backgroundSize: '100% 25%, 20% 100%',
                  }}
                />

                <div className="absolute inset-[16px]">
                  {withData.map((cat, index) => {
                    const xpPerMin = cat.xp / cat.minutes;
                    const avgMinutes = cat.minutes / cat.sessions;
                    const isHovered = hov === index;
                    const size = toSize(cat.sessions);
                    const iconSize = Math.max(12, Math.round(size * 0.42));

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onMouseEnter={() => setHov(index)}
                        onMouseLeave={() => setHov(null)}
                        onClick={() => setHov((current) => current === index ? null : index)}
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center transition-all duration-200"
                        style={{
                          left: `${toPctX(avgMinutes)}%`,
                          top: `${toPctY(xpPerMin)}%`,
                          width: `${size}px`,
                          height: `${size}px`,
                          background: isHovered
                            ? `radial-gradient(circle at 35% 35%, ${cat.color}40 0%, rgba(255,255,255,0.92) 68%)`
                            : `radial-gradient(circle at 35% 35%, ${cat.color}22 0%, rgba(255,255,255,0.88) 72%)`,
                          border: `2px solid ${cat.color}${isHovered ? 'aa' : '77'}`,
                          boxShadow: isHovered
                            ? `0 10px 24px ${cat.color}28`
                            : `0 6px 18px rgba(15,23,42,0.08)`,
                          transform: `translate(-50%, -50%) scale(${isHovered ? 1.05 : 1})`,
                          color: '#0f172a',
                          zIndex: isHovered ? 2 : 1,
                        }}
                        title={`${cat.label}: ${(xpPerMin).toFixed(1)} XP/p · TB ${avgMinutes.toFixed(0)}p/phiên · ${cat.sessions} phiên`}
                      >
                        <span aria-hidden="true" style={{ fontSize: `${iconSize}px`, lineHeight: 1 }}>{cat.icon}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 px-1">
                <span className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>{minAvgMin.toFixed(0)}p</span>
                <span className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>Phiên ngắn hơn</span>
                <span className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>Phiên dài hơn</span>
                <span className="text-[11px] font-medium" style={{ color: TEXT_MUTED }}>{maxAvgMin.toFixed(0)}p</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {hovered && (
        <div
          className="rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg">{hovered.icon}</span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: hovered.color }}>{hovered.label}</p>
              <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                {hovered.sessions} phiên · {fmtHours(hovered.minutes)}
              </p>
            </div>
          </div>
          <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 md:grid-cols-3">
            {[
              { label: 'Nhịp hiệu quả', value: `${(hovered.xp / hovered.minutes).toFixed(1)} XP/p` },
              { label: 'Nhịp trung bình', value: `${Math.round(hovered.minutes / hovered.sessions)}p` },
              { label: 'XP tích lũy', value: hovered.xp >= 1000 ? `${(hovered.xp / 1000).toFixed(1)}k` : hovered.xp },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl px-3 py-2"
                style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
              >
                <p className="text-[10px] uppercase tracking-wide" style={{ color: TEXT_SOFT }}>{item.label}</p>
                <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 px-1">
        <span className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>Kích thước nhỏ hơn · ít phiên hơn</span>
        <span className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>Càng lên cao · nhịp càng hiệu quả</span>
        <span className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>Chạm hoặc rê để đọc thêm</span>
      </div>
    </div>
  );
}

function CategoryDonutChart({ catStats, totalMins, totalSess }) {
  const [hoveredId, setHoveredId] = useState(null);
  const R = 34;
  const CX = 50;
  const CY = 50;
  const circ = 2 * Math.PI * R;
  const rawLengths = catStats.map((cat) => (
    totalMins > 0 ? (cat.minutes / totalMins) * circ : 0
  ));
  const minRawLength = rawLengths.length > 0 ? Math.min(...rawLengths.filter((value) => value > 0)) : 0;
  const gapLength = catStats.length > 1
    ? Math.min(2.4, Math.max(0.8, minRawLength * 0.35))
    : 0;

  const segments = catStats.reduce((acc, cat, index) => {
    const rawLength = rawLengths[index] ?? 0;
    const dash = rawLength > 0
      ? Math.max(Math.min(rawLength, 1.15), rawLength - gapLength)
      : 0;
    const hoverDash = rawLength > 0
      ? Math.max(dash, Math.min(9, rawLength + 1.5))
      : 0;

    return {
      offset: acc.offset + rawLength,
      items: [
        ...acc.items,
        {
          cat,
          dash,
          gap: circ - dash,
          offset: acc.offset + (gapLength / 2),
          hoverDash,
          hoverGap: circ - hoverDash,
          pct: totalMins > 0 ? (cat.minutes / totalMins) * 100 : 0,
        },
      ],
    };
  }, { offset: 0, items: [] }).items;

  const hoveredSegment = segments.find((segment) => segment.cat.id === hoveredId) ?? null;

  return (
    <div
      className="relative mx-auto flex flex-col items-center gap-3"
      onMouseLeave={() => setHoveredId(null)}
    >
      <div
        className="relative"
        style={{
          width: '148px',
          height: '148px',
          borderRadius: '999px',
          background: PANEL_BG_SOFT,
          border: `1px solid ${PANEL_BORDER}`,
          boxShadow: '0 18px 42px rgba(15,23,42,0.08)',
        }}
      >
        <svg viewBox="0 0 100 100" style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }}>
          <circle
            cx={CX}
            cy={CY}
            r={R}
            fill="none"
            stroke={GRID_LINE}
            strokeWidth="10"
          />
          <circle
            cx={CX}
            cy={CY}
            r="27.5"
            fill={BG_CARD}
            stroke={PANEL_BORDER}
            strokeWidth="0.8"
          />
          {segments.map(({ cat, dash, gap, offset, hoverDash, hoverGap }) => (
            <g key={cat.id}>
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke="transparent"
                strokeWidth="18"
                strokeLinecap="butt"
                strokeDasharray={`${hoverDash} ${hoverGap}`}
                strokeDashoffset={-offset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', cursor: 'pointer' }}
                onMouseEnter={() => setHoveredId(cat.id)}
                onFocus={() => setHoveredId(cat.id)}
                onClick={() => setHoveredId((current) => current === cat.id ? null : cat.id)}
                tabIndex={0}
                aria-label={`${cat.label}: ${fmtHours(cat.minutes)}, ${cat.sessions} phiên`}
              />
              <circle
                cx={CX}
                cy={CY}
                r={R}
                fill="none"
                stroke={cat.color ?? ACCENT}
                strokeWidth={hoveredId === cat.id ? '11' : '10'}
                strokeLinecap="butt"
                strokeDasharray={`${dash} ${gap}`}
                strokeDashoffset={-offset}
                style={{
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                  filter: hoveredId === cat.id ? 'drop-shadow(0 0 6px rgba(15, 23, 42, 0.12))' : 'none',
                  transition: 'stroke-width 0.16s ease, filter 0.16s ease',
                }}
              />
            </g>
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center px-3">
          <div className="flex items-end gap-1 leading-none" style={{ color: TEXT_PRIMARY }}>
            <span className="text-[34px] font-bold">{totalSess}</span>
            <span className="text-[13px] font-semibold mb-[4px]">phiên</span>
          </div>
          <p className="text-[11px] font-medium mt-1" style={{ color: TEXT_MUTED }}>
            {fmtHours(totalMins)}
          </p>
        </div>
      </div>

      <div className="relative h-[84px] w-full max-w-[280px]">
        {hoveredSegment ? (
          <div
            className="absolute inset-x-0 top-0 rounded-2xl px-3 py-2 shadow-[0_14px_34px_rgba(15,23,42,0.10)]"
            style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
          >
            <div className="flex items-center gap-2.5">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${hoveredSegment.cat.color ?? ACCENT}18`, color: hoveredSegment.cat.color ?? ACCENT }}
              >
                {hoveredSegment.cat.icon}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
                  {hoveredSegment.cat.label}
                </p>
                <p className="text-[11px] leading-tight mt-1" style={{ color: TEXT_MUTED }}>
                  {hoveredSegment.pct.toFixed(1)}% thời gian · {hoveredSegment.cat.sessions} phiên
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[13px] font-bold" style={{ color: hoveredSegment.cat.color ?? ACCENT }}>
                  {fmtHours(hoveredSegment.cat.minutes)}
                </p>
                <p className="text-[10px] font-medium mt-1" style={{ color: TEXT_SOFT }}>
                  {hoveredSegment.cat.xp >= 1000 ? `${(hoveredSegment.cat.xp / 1000).toFixed(1)}k` : hoveredSegment.cat.xp} XP
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="absolute inset-x-0 top-0 flex h-full items-center justify-center text-center">
            <p className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>
              Chạm vào từng lát để đọc thêm
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Cards ──────────────────────────────────────────────────────────
function OverviewHeroMetric({ icon, label, value, detail, accent = ACCENT, chart, className = '' }) {
  const isMarker = typeof icon === 'string' && /^[A-Z0-9]{1,3}$/.test(icon.trim());

  return (
    <Motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className={`rounded-[24px] px-3.5 py-3.5 sm:px-4 sm:py-4 md:px-5 md:py-5 ${className}`}
      style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>{label}</p>
          <p
            className="mt-2 text-[clamp(1.45rem,2.2vw,2.2rem)] font-semibold leading-tight break-words tabular-nums"
            style={{ color: TEXT_PRIMARY, fontFamily: METRIC_FONT, letterSpacing: METRIC_TRACKING }}
          >
            {value}
          </p>
          {detail && (
            <div className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
              {detail}
            </div>
          )}
        </div>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] ${isMarker ? 'text-[11px] font-semibold tracking-[0.18em]' : 'text-lg'}`}
          style={isMarker
            ? {
              background: 'rgba(255,255,255,0.72)',
              color: TEXT_SOFT,
              border: `1px solid ${PANEL_BORDER}`,
              fontFamily: MONO_FONT,
            }
            : { background: `${accent}14`, color: accent, border: `1px solid ${accent}24` }}
        >
          {icon}
        </div>
      </div>
      {chart && (
        <div className="mt-4 opacity-95">
          {chart}
        </div>
      )}
    </Motion.div>
  );
}

const OverviewRailStat = React.memo(function OverviewRailStat({ label, value, detail, accent = TEXT_PRIMARY, className = '' }) {
  return (
    <div
      className={`rounded-[22px] px-3.5 py-3.5 sm:px-4 sm:py-4 ${className}`}
      style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>{label}</p>
      <p className="mt-2 text-xl font-semibold leading-tight break-words tabular-nums" style={{ color: accent, fontFamily: METRIC_FONT, letterSpacing: METRIC_TRACKING }}>
        {value}
      </p>
      {detail && <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>{detail}</p>}
    </div>
  );
});

function formatWeekdayLabel(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(`${dateStr}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return dateStr;
  const label = formatVietnamDate(date, { weekday: 'short' });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function WeekPulseList({ weeklyData }) {
  const maxMinutes = Math.max(...weeklyData.map((day) => day.minutes), 1);

  return (
    <div className="space-y-2.5">
      {weeklyData.map((day, index) => {
        const isLatest = index === weeklyData.length - 1;
        const barWidth = day.minutes > 0 ? Math.max((day.minutes / maxMinutes) * 100, 10) : 0;

        return (
          <Motion.div
            key={day.date}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.18), duration: 0.22 }}
            className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 rounded-[20px] px-3 py-2.5"
            style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
          >
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: isLatest ? ACCENT : TEXT_SOFT }}>
              {formatWeekdayLabel(day.date)}
            </div>

            <div
              className="relative h-9 overflow-hidden rounded-[18px]"
              style={{ background: BG_CARD, border: `1px solid ${FILTER_PILL_BORDER}` }}
            >
              <div
                className="absolute inset-y-0 left-0 rounded-2xl"
                style={{
                  width: `${barWidth}%`,
                  minWidth: day.minutes > 0 ? '34px' : '0px',
                  background: isLatest
                    ? `linear-gradient(90deg, ${ACCENT2} 0%, ${ACCENT} 100%)`
                    : `linear-gradient(90deg, ${ACCENT}99 0%, ${ACCENT}33 100%)`,
                }}
              />
              <div className="relative z-[1] flex h-full items-center justify-between px-3">
                <span className="text-[11px] font-medium" style={{ color: TEXT_PRIMARY }}>
                  {fmtHours(day.minutes)}
                </span>
                <span className="text-[10px] font-medium" style={{ color: TEXT_MUTED }}>
                  {day.sessions} phiên
                </span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[12px] font-semibold" style={{ color: TEXT_PRIMARY }}>
                {day.xp >= 1000 ? `${(day.xp / 1000).toFixed(1)}k` : day.xp}
              </div>
              <div className="text-[10px]" style={{ color: TEXT_SOFT }}>XP</div>
            </div>
          </Motion.div>
        );
      })}
    </div>
  );
}

// ─── Trend Badge ─────────────────────────────────────────────────────────────
function TrendBadge({ current, previous, unit = '', baselineLabel = 'giai đoạn trước' }) {
  if (previous === 0 && current === 0) return <span className="text-xs" style={{ color: TEXT_SOFT }}>—</span>;
  const diff = current - previous;
  const pct  = previous > 0 ? Math.round((Math.abs(diff) / previous) * 100) : null;
  if (diff === 0) {
    return (
      <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em]"
      style={{ background: 'rgba(244,242,236,0.94)', borderColor: 'rgba(31,30,29,0.08)', color: '#8b847b' }}
    >
      ngang {baselineLabel}
    </span>
  );
  }

  const isPositive = diff > 0;
  const tone = isPositive
    ? { bg: 'rgba(201,100,66,0.10)', border: 'rgba(201,100,66,0.18)', color: '#8a3f24' }
    : { bg: 'rgba(31,30,29,0.06)', border: 'rgba(31,30,29,0.10)', color: '#5f5b54' };

  return (
    <span
      className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.04em]"
      style={{ background: tone.bg, borderColor: tone.border, color: tone.color }}
    >
      {diff > 0 ? 'nhỉnh hơn ' : 'thấp hơn '}{Math.abs(diff)}{unit}{pct !== null ? ` (${pct}%)` : ''}
    </span>
  );
}

// ─── Period Selector ─────────────────────────────────────────────────────────
const PERIODS = [
  { key: 'day',     label: 'Ngày',  n: 14 },
  { key: 'week',    label: 'Tuần',  n: 8  },
  { key: 'month',   label: 'Tháng', n: 6  },
  { key: 'quarter', label: 'Quý',   n: 4  },
  { key: 'year',    label: 'Năm',   n: 3  },
];
const METRIC_OPTIONS = [
  { key: 'minutes', label: 'Phút' },
  { key: 'sessions', label: 'Phiên' },
  { key: 'xp', label: 'XP' },
];
const PERIOD_UNITS = {
  day: 'ngày',
  week: 'tuần',
  month: 'tháng',
  quarter: 'quý',
  year: 'năm',
};

// ─── Tab: Tổng Quan ───────────────────────────────────────────────────────────
function OverviewTabLegacy({ history, progress, streak, prestige, buildings }) {
  const [period, setPeriod] = useState('week');
  const [metric, setMetric] = useState('minutes');
  const [isChartPending, startChartTransition] = useTransition();

  const periodDef  = PERIODS.find((p) => p.key === period) ?? PERIODS[1];
  const periodData = useMemo(
    () => computePeriodStats(history, period, periodDef.n),
    [history, period, periodDef.n]
  );
  const weeklyData   = useMemo(() => computeWeeklyStats(history), [history]);
  const prevWeekData = useMemo(() => computePrevWeekStats(history), [history]);
  const player       = useGameStore((s) => s.player);
  const historyStats = useGameStore((s) => s.historyStats);
  const allTime      = useMemo(
    () => computeAllTimeStats(history, progress, player, historyStats),
    [history, progress, player, historyStats],
  );

  const streakBonusCapDays = STREAK_MAX_BONUS_DAYS + (
    buildings.some((bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect === 'streak_cap_plus') ? 10 : 0
  );
  const bonusPct = Math.min(streak.currentStreak, streakBonusCapDays) * (STREAK_BONUS_PER_DAY * 100);
  const overview = useMemo(() => {
    const thisWeekMins = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
    const prevWeekMins = prevWeekData.reduce((sum, day) => sum + day.minutes, 0);
    const thisWeekSess = weeklyData.reduce((sum, day) => sum + day.sessions, 0);
    const prevWeekSess = prevWeekData.reduce((sum, day) => sum + day.sessions, 0);
    const thisWeekXP = weeklyData.reduce((sum, day) => sum + day.xp, 0);
    const prevWeekXP = prevWeekData.reduce((sum, day) => sum + day.xp, 0);
    const weeklyActiveDays = weeklyData.filter((day) => day.minutes > 0).length;
    const weekWindowStartTs = weeklyData[0]?.date
      ? getTimestampMs(`${weeklyData[0].date}T00:00:00+07:00`)
      : NaN;
    const recentWeekEntries = history.filter((entry) => {
      const timestampMs = getTimestampMs(entry?.timestamp);
      return Number.isFinite(timestampMs) && timestampMs >= weekWindowStartTs;
    });
    const weeklyBestSession = recentWeekEntries.reduce(
      (best, entry) => ((entry?.minutes ?? 0) > (best?.minutes ?? 0) ? entry : best),
      null,
    );
    const weeklyBestSessionLabel = (weeklyBestSession?.minutes ?? 0) > 0
      ? fmtHours(weeklyBestSession.minutes)
      : '0p';
    const weeklyBestSessionXP = Number.isFinite(weeklyBestSession?.xpEarned ?? weeklyBestSession?.epEarned)
      ? (weeklyBestSession.xpEarned ?? weeklyBestSession.epEarned)
      : 0;
    const weeklyBestSessionXPLabel = weeklyBestSessionXP >= 1000
      ? `${(weeklyBestSessionXP / 1000).toFixed(1)}k XP`
      : `${weeklyBestSessionXP} XP`;
    const weeklyJackpots = recentWeekEntries.filter((entry) => entry?.jackpot).length;
    const weeklyLongSessions = recentWeekEntries.filter((entry) => (entry?.refinedEarned ?? 0) > 0 || (entry?.minutes ?? 0) >= 45).length;
    const periodValues = periodData.map((item) => item[metric] ?? 0);
    const periodTotal = periodValues.reduce((sum, value) => sum + value, 0);
    const periodActiveCount = periodValues.filter((value) => value > 0).length;
    const periodAvg = periodActiveCount > 0 ? Math.round(periodTotal / periodActiveCount) : 0;
    const activeRatio = periodData.length > 0 ? Math.round((periodActiveCount / periodData.length) * 100) : 0;
    const periodHasActivity = periodActiveCount > 0;
    const topBucket = periodHasActivity
      ? periodData.reduce((best, item) => {
          if (!best) return item;
          return (item[metric] ?? 0) > (best[metric] ?? 0) ? item : best;
        }, null)
      : null;
    const latestBucket = periodHasActivity ? (periodData[periodData.length - 1] ?? null) : null;
    const bestDay = weeklyData.reduce(
      (best, item) => (item.minutes > best.minutes ? item : best),
      { label: '—', minutes: 0, sessions: 0, xp: 0 },
    );

    let statusTitle = '7 ngày gần đây đang khá ổn định';
    let statusBody = 'Tốc độ hiện tại khá đều. Đây là giai đoạn tốt để giữ cấu trúc hiện có và tinh chỉnh nhẹ thay vì đổi hướng mạnh.';

    if (thisWeekSess === 0) {
      statusTitle = '7 ngày gần đây chưa có phiên hoàn thành';
      statusBody = 'Màn tổng quan đang chờ phiên tiếp theo để có dữ liệu mới. Chỉ cần một phiên gọn, toàn bộ phần đọc tuần sẽ hoạt động lại ngay.';
    } else if (thisWeekSess > prevWeekSess || thisWeekMins > prevWeekMins) {
      statusTitle = '7 ngày gần đây đang đi lên';
      statusBody = `Anh đã hoàn thành ${thisWeekSess} phiên và ${fmtHours(thisWeekMins)} trong 7 ngày gần đây, nhỉnh hơn 7 ngày trước đó. Đây là lúc giữ nhịp độ hiện tại để biến lợi thế thành thói quen.`;
    } else if (prevWeekSess > 0 && (thisWeekSess < prevWeekSess || thisWeekMins < prevWeekMins)) {
      statusTitle = '7 ngày gần đây đang chậm hơn';
      statusBody = 'Khối lượng hiện tại thấp hơn 7 ngày trước đó. Nếu muốn kéo lại tiến độ, hãy thêm một phiên ngắn ở khung giờ dễ hoàn thành nhất trước khi tăng mục tiêu lớn hơn.';
    } else if (streak.currentStreak >= 7) {
      statusTitle = 'Chuỗi dài đang giữ toàn bộ bảng cân bằng';
      statusBody = `Chuỗi ${streak.currentStreak} ngày đang là lực đỡ chính. Khi streak đã ổn định, ưu tiên duy trì tần suất trước rồi mới tối ưu độ dài từng phiên.`;
    }

    const bestSessionLabel = allTime.bestSessionMins > 0 ? fmtHours(allTime.bestSessionMins) : '0p';
    const bestSessionXPLabel = allTime.bestSessionXP >= 1000
      ? `${(allTime.bestSessionXP / 1000).toFixed(1)}k XP`
      : `${allTime.bestSessionXP} XP`;
    const totalXPLabel = allTime.totalXP >= 1000
      ? `${(allTime.totalXP / 1000).toFixed(allTime.totalXP >= 10_000 ? 0 : 1)}k XP`
      : `${allTime.totalXP} XP`;
    const periodWindowLabel = `${periodDef.n} ${PERIOD_UNITS[period] ?? 'kỳ'} gần nhất`;
    return {
      thisWeekMins,
      prevWeekMins,
      thisWeekSess,
      prevWeekSess,
      thisWeekXP,
      prevWeekXP,
      weeklyActiveDays,
      periodTotal,
      periodActiveCount,
      periodAvg,
      periodHasActivity,
      activeRatio,
      topBucket,
      latestBucket,
      bestDay,
      statusTitle,
      statusBody,
      bestSessionLabel,
      bestSessionXPLabel,
      weeklyBestSessionLabel,
      weeklyBestSessionXPLabel,
      weeklyJackpots,
      weeklyLongSessions,
      totalXPLabel,
      periodWindowLabel,
      periodEmptyDetail: `Không có hoạt động trong ${periodWindowLabel.toLowerCase()}.`,
    };
  }, [allTime, history, metric, period, periodData, periodDef.n, prevWeekData, streak.currentStreak, weeklyData]);

  const handleMetricChange = (nextMetric) => {
    if (nextMetric === metric) return;
    startChartTransition(() => setMetric(nextMetric));
  };

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === period) return;
    startChartTransition(() => setPeriod(nextPeriod));
  };

  const hasOverviewData = (
    allTime.totalSessions > 0
    || progress.totalFocusMinutes > 0
    || overview.thisWeekSess > 0
    || overview.thisWeekXP > 0
    || streak.longestStreak > 0
  );

  if (!hasOverviewData) {
    return (
      <div className="space-y-4 md:space-y-5">
        <Motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[34px]"
          style={{
            background: PANEL_BG,
            border: `1px solid ${PANEL_BORDER}`,
            boxShadow: '0 20px 54px rgba(31,30,29,0.08)',
          }}
        >
          <div className="relative grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6 md:p-7 lg:p-8">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
                  Tổng quan
                </p>
                <h3
                  className="mt-3 text-3xl font-semibold leading-tight md:text-[2.75rem]"
                  style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
                >
                  Biên niên sử của anh vẫn đang chờ phiên đầu tiên.
                </h3>
                <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: TEXT_MUTED }}>
                  Hoàn thành một phiên tập trung để tab này bắt đầu vẽ nhịp tuần, streak, XP và các mốc tiến triển thật sự. Khi chưa có dữ liệu, tôi giữ màn hình này gọn để không biến nó thành một dashboard toàn số 0.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  { label: 'Chuỗi', value: `${streak.currentStreak} ngày` },
                  { label: 'Thưởng nền', value: `+${bonusPct.toFixed(0)}% XP` },
                  { label: 'Công trình', value: `${buildings.length}` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full px-4 py-2 text-[12px] font-medium"
                    style={{ background: FILTER_PILL_BG, color: TEXT_PRIMARY, border: `1px solid ${FILTER_PILL_BORDER}` }}
                  >
                    <span style={{ color: TEXT_SOFT }}>{item.label}</span>
                    <span> · {item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <div
                  className="rounded-[28px] p-5 md:p-6"
                  style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                    Khi có dữ liệu
                  </p>
                  <div
                    className="mt-4 overflow-hidden rounded-[24px] border"
                    style={{ borderColor: PANEL_BORDER, background: BG_CARD }}
                  >
                    {[
                      {
                        icon: 'TK',
                        title: 'Nhịp 7 ngày',
                        body: 'Ngày nào anh có phiên, tổng phút và XP sẽ hiện ngay ở cột bên phải.',
                      },
                      {
                        icon: 'ST',
                        title: 'Chuỗi & thưởng nền',
                        body: 'Streak hiện tại, thưởng nền XP và mốc cao nhất sẽ tự cập nhật sau mỗi phiên hoàn thành.',
                      },
                      {
                        icon: 'PG',
                        title: 'Phân tích sâu hơn',
                        body: 'Biểu đồ hoạt động, phiên tốt nhất và tần suất sẽ chỉ bung ra khi thật sự có thứ để đọc.',
                      },
                    ].map((item, index) => (
                      <div
                        key={item.title}
                        className="flex items-start gap-3 px-4 py-4"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${PANEL_BORDER}` }}
                      >
                        <div
                          className="mono flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] text-[9px] font-semibold uppercase tracking-[0.14em]"
                          style={{ background: 'rgba(var(--accent-rgb), 0.08)', color: ACCENT2, border: `1px solid rgba(var(--accent-rgb), 0.14)` }}
                        >
                          {item.icon}
                        </div>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{item.title}</p>
                          <p className="mt-1 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[28px] p-5 md:p-6"
                  style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                    Trạng thái hiện tại
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    <span
                      className="text-[4.25rem] font-semibold leading-[0.84]"
                      style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                    >
                      0
                    </span>
                    <span className="pb-2 text-lg font-medium" style={{ color: TEXT_MUTED }}>
                      phiên
                    </span>
                  </div>
                  <p className="mt-3 text-[14px] leading-6" style={{ color: TEXT_MUTED }}>
                    Sau khi xong phiên đầu tiên, màn hình này sẽ chuyển sang chế độ phân tích thật và giữ lại nhịp làm việc của anh.
                  </p>
                  <div
                    className="mt-5 overflow-hidden rounded-[24px] border"
                    style={{ borderColor: PANEL_BORDER, background: PANEL_BG_SOFT }}
                  >
                    {[
                      { label: 'Phiên tốt nhất', value: '0p', detail: 'Chưa có dữ liệu', accent: TEXT_PRIMARY },
                      { label: 'Kỷ lục streak', value: `${streak.longestStreak} ngày`, detail: 'Đang chờ chuỗi mới', accent: '#d97706' },
                      { label: 'Tổng XP', value: overview.totalXPLabel, detail: 'Sẽ tăng ngay sau phiên đầu tiên', accent: ACCENT },
                    ].map((item, index) => (
                      <div
                        key={item.label}
                        className="px-4 py-3.5"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${PANEL_BORDER}` }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                              {item.label}
                            </p>
                            <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                              {item.detail}
                            </p>
                          </div>
                          <p
                            className="shrink-0 text-right text-[1.05rem] font-semibold leading-tight"
                            style={{ color: item.accent, fontFamily: DISPLAY_FONT }}
                          >
                            {item.value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside
              className="border-t xl:border-l xl:border-t-0"
              style={{ borderColor: PANEL_BORDER, background: 'linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01))' }}
            >
              <div className="p-6 md:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
                  7 ngày gần nhất
                </p>
                <p className="mt-2 text-2xl font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
                  Chưa có nhịp mới
                </p>
                <p className="mt-2 text-[14px] leading-6" style={{ color: TEXT_MUTED }}>
                  7 ô ngày sẽ bắt đầu sáng lên ngay khi anh hoàn thành phiên đầu tiên.
                </p>

                <div className="mt-6 space-y-3">
                  {['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'].map((label) => (
                    <div
                      key={label}
                      className="grid grid-cols-[48px_minmax(0,1fr)_40px] items-center gap-3"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                        {label}
                      </span>
                      <div
                        className="h-11 rounded-2xl"
                        style={{ background: FILTER_PILL_BG, border: `1px solid ${FILTER_PILL_BORDER}` }}
                      />
                      <span className="text-right text-sm font-semibold" style={{ color: TEXT_SOFT }}>
                        0
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] p-4" style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
                    Gợi ý
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                    Bắt đầu bằng một phiên ngắn 15 đến 25 phút.
                  </p>
                  <p className="mt-1 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                    Một phiên hoàn thành là đủ để tab này chuyển từ trạng thái chờ sang trạng thái có dữ liệu thật.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Motion.section>

        {prestige.count > 0 && (
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.28, ease: 'easeOut' }}
            className="rounded-[28px] border px-5 py-5 md:px-6"
            style={{
              background: BG_CARD,
              borderColor: 'rgba(250,204,21,0.18)',
            }}
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="flex items-start gap-3">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-[18px] text-xl"
                  style={{ background: 'rgba(250,204,21,0.10)', color: '#d97706', border: '1px solid rgba(250,204,21,0.18)' }}
                >
                  ✦
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: '#d97706' }}>
                    Prestige
                  </p>
                  <p className="mt-2 text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
                    Hệ số dài hạn vẫn đang chờ vòng tiếp theo.
                  </p>
                  <p className="mt-1 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                    Những lần reset trước vẫn được giữ lại như phần lực đẩy nền cho toàn bộ tiến trình.
                  </p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:min-w-[320px]">
                <OverviewRailStat
                  label="Hệ số hiện tại"
                  value={`×${prestige.count}`}
                  detail="Mức cộng dồn đang mang sang vòng chơi sau"
                  accent="#d97706"
                />
                <OverviewRailStat
                  label="Thưởng nền"
                  value={`+${(prestige.permanentBonus * 100).toFixed(0)}%`}
                  detail="Áp dụng cho toàn bộ vòng chơi"
                  accent={TEXT_PRIMARY}
                />
              </div>
            </div>
          </Motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-5">
      <Motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[30px] p-4 sm:p-5 md:p-6 lg:p-7"
        style={{
          background: PANEL_BG_SOFT,
          border: `1px solid ${PANEL_BORDER}`,
          boxShadow: '0 20px 54px rgba(31,30,29,0.08)',
        }}
      >
        <div className="relative grid gap-4 sm:gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          <div className="space-y-4 sm:space-y-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
                  Tổng quan tuần
                </p>
                <h3
                  className="mt-2.5 text-[1.95rem] font-semibold leading-none sm:text-[2.15rem] md:text-[2.5rem]"
                  style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                >
                  {streak.currentStreak > 0 ? `${streak.currentStreak} ngày liên tiếp` : 'Sẵn sàng bắt đầu lại nhịp mới'}
                </h3>
                <p className="mt-3 max-w-2xl text-sm leading-6 md:text-[15px]" style={{ color: TEXT_MUTED }}>
                  {overview.statusBody}
                </p>
              </div>

              {streak.currentStreak >= 2 && (
                <div
                  className="self-start rounded-[22px] px-4 py-3 text-left sm:shrink-0 sm:text-right"
                  style={{ background: 'rgba(var(--accent-rgb),0.08)', border: '1px solid rgba(var(--accent-rgb),0.16)' }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT2 }}>
                    Bonus XP
                  </p>
                  <p className="mt-2 text-2xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                    +{bonusPct.toFixed(0)}%
                  </p>
                  <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                    Trần hiện tại: {streakBonusCapDays} ngày
                  </p>
                </div>
              )}
            </div>

            <div className="grid gap-2.5 sm:gap-3 md:grid-cols-2 xl:grid-cols-3">
              <OverviewHeroMetric
                icon="PH"
                label="Tổng phiên"
                value={allTime.totalSessions.toLocaleString()}
                detail={<TrendBadge current={overview.thisWeekSess} previous={overview.prevWeekSess} baselineLabel="7 ngày trước đó" />}
                accent={ACCENT}
                chart={<AreaChart data={weeklyData} valueKey="sessions" height={46} accentColor={ACCENT} />}
              />
              <OverviewHeroMetric
                icon="GI"
                label="Tổng giờ"
                value={fmtHours(progress.totalFocusMinutes)}
                detail={<TrendBadge current={Math.round((overview.thisWeekMins / 60) * 10) / 10} previous={Math.round((overview.prevWeekMins / 60) * 10) / 10} unit="g" baselineLabel="7 ngày trước đó" />}
                accent={ACCENT2}
                chart={<AreaChart data={weeklyData} valueKey="minutes" height={46} accentColor={ACCENT2} />}
              />
              <OverviewHeroMetric
                icon="XP"
                label="Tổng XP"
                value={overview.totalXPLabel}
                detail={`Phiên tốt nhất ${overview.bestSessionLabel} · ${overview.bestSessionXPLabel}`}
                accent={ACCENT}
              />
            </div>

            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {[
                { label: 'Ngày hoạt động', value: `${overview.weeklyActiveDays}/7` },
                { label: 'Kỷ lục streak', value: `${streak.longestStreak} ngày` },
                { label: 'Jackpot', value: `${allTime.totalJackpots}` },
                { label: 'Công trình', value: `${buildings.length}` },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-full px-2.5 sm:px-3 py-1.5 text-[10.5px] sm:text-[11px] font-medium"
                  style={{ background: FILTER_PILL_BG, color: TEXT_MUTED, border: `1px solid ${FILTER_PILL_BORDER}` }}
                >
                  <span style={{ color: TEXT_SOFT }}>{item.label}</span>
                  <span style={{ color: TEXT_PRIMARY }}> · {item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <Motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05, duration: 0.28, ease: 'easeOut' }}
            className="rounded-[26px] p-3.5 sm:p-4 md:p-5"
            style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                  7 ngày gần nhất
                </p>
                <p className="mt-2 text-lg font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
                  {overview.statusTitle}
                </p>
                <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                  {overview.weeklyActiveDays > 0
                    ? `${overview.weeklyActiveDays} ngày có hoạt động trong 7 ngày gần nhất, đỉnh cao nhất là ${formatWeekdayLabel(overview.bestDay.date)} với ${fmtHours(overview.bestDay.minutes)}.`
                    : 'Chưa có ngày hoạt động nào trong 7 ngày gần nhất.'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
                  Kỷ lục
                </p>
                <p className="mt-2 text-2xl font-semibold leading-none" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                  {streak.longestStreak}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>ngày</p>
              </div>
            </div>

            <div className="mt-4 space-y-2.5 sm:space-y-3">
              <OverviewRailStat
                label="Phiên 7 ngày"
                value={overview.thisWeekSess.toLocaleString()}
                detail={`${fmtHours(overview.thisWeekMins)} · ${overview.weeklyActiveDays}/7 ngày`}
                accent={TEXT_PRIMARY}
              />
              <OverviewRailStat
                label="XP 7 ngày"
                value={overview.thisWeekXP >= 1000 ? `${(overview.thisWeekXP / 1000).toFixed(1)}k` : `${overview.thisWeekXP}`}
                detail={overview.prevWeekXP > 0 ? `7 ngày trước đó ${overview.prevWeekXP >= 1000 ? `${(overview.prevWeekXP / 1000).toFixed(1)}k` : overview.prevWeekXP} XP` : '7 ngày trước đó chưa có dữ liệu'}
                accent={ACCENT}
              />
              <OverviewRailStat
                label="Phiên tốt nhất"
                value={overview.weeklyBestSessionLabel}
                detail={overview.weeklyBestSessionXPLabel}
                accent={TEXT_PRIMARY}
              />
            </div>
          </Motion.div>
        </div>
      </Motion.section>

      <Motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
        className="grid gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(260px,0.55fr)]"
      >
        <div
          className="rounded-[28px] p-3.5 sm:p-4 md:p-5"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                  Hoạt động
                </p>
                <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                  Đọc theo {METRIC_OPTIONS.find((option) => option.key === metric)?.label.toLowerCase() ?? 'phút'}
                </h4>
                <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                  {overview.periodWindowLabel} để thấy xu hướng đủ rõ, không bị nhiễu bởi từng phiên lẻ.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {METRIC_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleMetricChange(option.key)}
                    className="rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-200 hover:-translate-y-px"
                    style={metric === option.key
                      ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, border: `1px solid ${TAB_ACTIVE_BORDER}` }
                      : { background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {PERIODS.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handlePeriodChange(option.key)}
                  className="min-w-[72px] rounded-full px-3 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-200 hover:-translate-y-px"
                  style={period === option.key
                    ? { background: FILTER_PILL_ACTIVE_BG, color: FILTER_PILL_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, border: `1px solid ${FILTER_PILL_ACTIVE_BORDER}` }
                    : { background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <div
              className="rounded-[24px] px-3 py-4 md:px-4"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <BarChart data={periodData} valueKey={metric} height={156} accentColor={ACCENT} />
            </div>

            <div className="grid gap-2.5 sm:gap-3 md:grid-cols-3">
              {[
                {
                  label: 'Tổng',
                  value: fmtVal(overview.periodTotal, metric),
                  detail: `${overview.periodWindowLabel}`,
                },
                {
                  label: 'Tần suất hoạt động',
                  value: `${overview.periodActiveCount}/${periodData.length}`,
                  detail: `${overview.activeRatio}% mốc thời gian có dữ liệu`,
                },
                {
                  label: 'Trung bình khi có hoạt động',
                  value: fmtVal(overview.periodAvg, metric),
                  detail: `Tính trên ${overview.periodActiveCount || 0} ${PERIOD_UNITS[period] ?? 'kỳ'}`,
                },
              ].map((item) => (
                <OverviewRailStat key={item.label} label={item.label} value={item.value} detail={item.detail} />
              ))}
            </div>
          </div>
        </div>

        <div
          className="rounded-[28px] p-3.5 sm:p-4 md:p-5"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex h-full flex-col justify-between gap-3 sm:gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                Đọc nhanh
              </p>
              <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                Điểm nổi bật của {overview.periodWindowLabel}
              </h4>
              <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                Ba tín hiệu chính được gom lại ở đây để đọc nhanh mà không cần nhìn toàn bộ chart.
              </p>
            </div>

            <div className="space-y-3">
              <OverviewRailStat
                label="Đỉnh kỳ"
                value={overview.topBucket ? fmtVal(overview.topBucket[metric] ?? 0, metric) : '—'}
                detail={overview.topBucket ? `${overview.topBucket.label}` : overview.periodEmptyDetail}
                accent={ACCENT}
              />
              <OverviewRailStat
                label="Mốc mới nhất"
                value={overview.latestBucket ? fmtVal(overview.latestBucket[metric] ?? 0, metric) : '—'}
                detail={overview.latestBucket ? `${overview.latestBucket.label}` : overview.periodEmptyDetail}
              />
              <OverviewRailStat
                label="Độ phủ"
                value={`${overview.activeRatio}%`}
                detail={`${overview.periodActiveCount}/${periodData.length} ${PERIOD_UNITS[period] ?? 'kỳ'} có hoạt động`}
              />
            </div>

            <div
              className="rounded-[22px] px-4 py-3 text-[11px] leading-5"
              style={{ background: FILTER_PILL_BG, color: TEXT_MUTED, border: `1px solid ${FILTER_PILL_BORDER}` }}
            >
              {isChartPending
                ? 'Đang làm mới biểu đồ theo bộ lọc vừa chọn.'
                : overview.periodHasActivity
                  ? 'Đổi metric để xem góc khác, và đổi period để nới hoặc nén khoảng đọc.'
                  : overview.periodEmptyDetail}
            </div>
          </div>
        </div>
      </Motion.section>

      <Motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.28, ease: 'easeOut' }}
      >
        <div
          className="grid overflow-hidden rounded-[26px] md:grid-cols-2 xl:grid-cols-4"
          style={{ background: PANEL_BORDER, border: `1px solid ${PANEL_BORDER}` }}
        >
          {[
            { label: 'TB / phiên', value: `${allTime.avgSessionLength}p`, detail: 'Thời lượng trung bình từ toàn bộ lịch sử' },
            { label: 'Phiên dài', value: `${allTime.totalBlueprints}`, detail: 'Phiên 45p+ hoặc có refined reward' },
            { label: 'Jackpot', value: `${allTime.totalJackpots}`, detail: 'Số lần bùng nổ phần thưởng đã kích hoạt' },
            { label: 'Công trình', value: `${buildings.length}`, detail: 'Tổng số công trình đang sở hữu' },
          ].map((item) => (
            <div key={item.label} className="px-4 py-4 md:px-5 md:py-5" style={{ background: PANEL_BG }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>{item.label}</p>
              <p className="mt-2 text-2xl font-semibold leading-none" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                {item.value}
              </p>
              <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>{item.detail}</p>
            </div>
          ))}
        </div>
      </Motion.section>

      {prestige.count > 0 && (
        <Motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14, duration: 0.28, ease: 'easeOut' }}
          className="rounded-[26px] px-5 py-4 md:px-6"
          style={{
            background: 'rgba(var(--accent-rgb),0.08)',
            border: '1px solid rgba(var(--accent-rgb),0.16)',
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div
                className="mono flex h-11 w-11 items-center justify-center rounded-2xl text-[9px] font-semibold uppercase tracking-[0.14em]"
                style={{ background: 'rgba(var(--accent-rgb),0.10)', color: ACCENT2 }}
              >
                PR
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT2 }}>
                  Prestige
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
                  Vòng lặp hiện tại đang được đẩy bởi hệ số vĩnh viễn.
                </p>
                <p className="mt-1 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                  Mỗi lần reset đang để lại nhiều lực đẩy hơn cho toàn bộ chỉ số dài hạn.
                </p>
              </div>
            </div>

            <div className="rounded-[22px] px-4 py-3 md:text-right" style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
                Hệ số hiện tại
              </p>
              <p className="mt-2 text-2xl font-semibold leading-none" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                ×{prestige.count}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                +{(prestige.permanentBonus * 100).toFixed(0)}% cho toàn bộ vòng chơi
              </p>
            </div>
          </div>
        </Motion.div>
      )}
    </div>
  );
}

function OverviewTab({ history, progress, streak, prestige, buildings }) {
  const [period, setPeriod] = useState('week');
  const [metric, setMetric] = useState('minutes');
  const [isChartPending, startChartTransition] = useTransition();

  const periodDef  = PERIODS.find((p) => p.key === period) ?? PERIODS[1];
  const periodData = useMemo(
    () => computePeriodStats(history, period, periodDef.n),
    [history, period, periodDef.n]
  );
  const weeklyData   = useMemo(() => computeWeeklyStats(history), [history]);
  const prevWeekData = useMemo(() => computePrevWeekStats(history), [history]);
  const player       = useGameStore((s) => s.player);
  const historyStats = useGameStore((s) => s.historyStats);
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const allTime      = useMemo(
    () => computeAllTimeStats(history, progress, player, historyStats),
    [history, progress, player, historyStats],
  );
  const categoryMap = useMemo(() => {
    const map = {
      __none__: { id: '__none__', label: 'Chưa gắn loại', color: '#475569', icon: '❓' },
    };
    (sessionCategories ?? []).forEach((category) => {
      map[category.id] = category;
    });
    return map;
  }, [sessionCategories]);
  const reviewSummary = useMemo(() => ({
    sessionsWithGoal: historyStats?.sessionsWithGoal ?? 0,
    reviewedCount: historyStats?.reviewedCount ?? 0,
    achievedCount: historyStats?.achievedCount ?? 0,
    missedCount: historyStats?.missedCount ?? 0,
    pendingCount: historyStats?.pendingCount ?? 0,
  }), [historyStats]);
  const achievedRateOverall = reviewSummary.sessionsWithGoal > 0
    ? Math.round((reviewSummary.achievedCount / reviewSummary.sessionsWithGoal) * 100)
    : 0;
  const achievedRateReviewed = reviewSummary.reviewedCount > 0
    ? Math.round((reviewSummary.achievedCount / reviewSummary.reviewedCount) * 100)
    : 0;
  const reviewCoverageRate = reviewSummary.sessionsWithGoal > 0
    ? Math.round((reviewSummary.reviewedCount / reviewSummary.sessionsWithGoal) * 100)
    : 0;
  const hasQualitySeed = reviewSummary.sessionsWithGoal > 0;
  const hasQualityEnoughGoals = reviewSummary.sessionsWithGoal >= 3;
  const hasQualityReliable = reviewSummary.reviewedCount >= 3;
  const hasReviewedGoals = reviewSummary.reviewedCount > 0;
  const showFullQualityPanel = hasQualityEnoughGoals && hasReviewedGoals;
  const reviewPendingRatio = hasQualitySeed
    ? reviewSummary.pendingCount / reviewSummary.sessionsWithGoal
    : 0;
  const shouldEmphasizeCoverage = hasQualitySeed && reviewPendingRatio > 0.4;
  const shouldShowQualityPercent = hasQualityReliable && !shouldEmphasizeCoverage;
  const reviewHeadline = !hasQualitySeed
    ? 'Chưa có phiên nào đặt mục tiêu'
    : !hasReviewedGoals
      ? 'Đã có mục tiêu nhưng chưa tự chấm phiên nào'
    : shouldEmphasizeCoverage
      ? `${reviewCoverageRate}% phiên có mục tiêu đã được tự chấm`
      : shouldShowQualityPercent
        ? `${achievedRateOverall}% phiên có mục tiêu đã chạm đích`
        : `${reviewSummary.achievedCount}/${reviewSummary.sessionsWithGoal} mục tiêu đã chạm`;

  const streakBonusCapDays = STREAK_MAX_BONUS_DAYS + (
    buildings.some((bpId) => BUILDING_EFFECTS[bpId]?.wonderEffect === 'streak_cap_plus') ? 10 : 0
  );
  const bonusPct = Math.min(streak.currentStreak, streakBonusCapDays) * (STREAK_BONUS_PER_DAY * 100);
  const recentLogs = useMemo(() => history.slice(0, 3).map((entry) => {
    const category = resolveEntryCategory(entry, categoryMap);
    const xpEarned = Number.isFinite(entry?.xpEarned ?? entry?.epEarned)
      ? (entry.xpEarned ?? entry.epEarned)
      : 0;
    const goalText = getSessionGoalText(entry);
    const nextNoteText = getSessionNextNoteText(entry);
    const notePreview = createRichTextPreview(entry?.note?.trim() || entry?.breakNote?.trim() || '', 120)
      || goalText
      || nextNoteText
      || null;

    return {
      entry,
      category,
      xpEarned,
      goalText,
      nextNoteText,
      notePreview,
      exactTimeLabel: formatExactDateTime(entry?.finishedAt ?? entry?.timestamp) ?? '—',
    };
  }), [history, categoryMap]);

  const overview = useMemo(() => {
    const thisWeekMins = weeklyData.reduce((sum, day) => sum + day.minutes, 0);
    const prevWeekMins = prevWeekData.reduce((sum, day) => sum + day.minutes, 0);
    const thisWeekSess = weeklyData.reduce((sum, day) => sum + day.sessions, 0);
    const prevWeekSess = prevWeekData.reduce((sum, day) => sum + day.sessions, 0);
    const thisWeekXP = weeklyData.reduce((sum, day) => sum + day.xp, 0);
    const prevWeekXP = prevWeekData.reduce((sum, day) => sum + day.xp, 0);
    const weeklyActiveDays = weeklyData.filter((day) => day.minutes > 0).length;
    const weekWindowStartTs = weeklyData[0]?.date
      ? getTimestampMs(`${weeklyData[0].date}T00:00:00+07:00`)
      : NaN;
    const recentWeekEntries = history.filter((entry) => {
      const timestampMs = getTimestampMs(entry?.timestamp);
      return Number.isFinite(timestampMs) && Number.isFinite(weekWindowStartTs) && timestampMs >= weekWindowStartTs;
    });
    const weeklyBestSession = recentWeekEntries.reduce(
      (best, entry) => ((entry?.minutes ?? 0) > (best?.minutes ?? 0) ? entry : best),
      null,
    );
    const weeklyJackpots = recentWeekEntries.filter((entry) => entry?.jackpot).length;
    const weeklyLongSessions = recentWeekEntries.filter((entry) => (entry?.refinedEarned ?? 0) > 0 || (entry?.minutes ?? 0) >= 45).length;

    const periodValues = periodData.map((item) => item[metric] ?? 0);
    const periodTotal = periodValues.reduce((sum, value) => sum + value, 0);
    const periodActiveCount = periodValues.filter((value) => value > 0).length;
    const periodAvg = periodActiveCount > 0 ? Math.round(periodTotal / periodActiveCount) : 0;
    const activeRatio = periodData.length > 0 ? Math.round((periodActiveCount / periodData.length) * 100) : 0;
    const periodHasActivity = periodActiveCount > 0;
    const periodReadable = periodActiveCount >= 2;
    const topBucket = periodHasActivity
      ? periodData.reduce((best, item) => {
          if (!best) return item;
          return (item[metric] ?? 0) > (best[metric] ?? 0) ? item : best;
        }, null)
      : null;
    const latestBucket = periodHasActivity ? (periodData[periodData.length - 1] ?? null) : null;
    const bestDay = weeklyData.reduce(
      (best, item) => (item.minutes > best.minutes ? item : best),
      { date: null, minutes: 0, sessions: 0, xp: 0 },
    );

    let statusTitle = 'Nhịp 7 ngày đang đều';
    let statusBody = `Tuần này có ${thisWeekSess} phiên, ${fmtHours(thisWeekMins)} và ${thisWeekXP >= 1000 ? `${(thisWeekXP / 1000).toFixed(1)}k XP` : `${thisWeekXP} XP`}.`;
    if (thisWeekSess === 0) {
      statusTitle = 'Chưa có nhịp mới';
      statusBody = '7 ngày gần nhất chưa có phiên hoàn thành.';
    } else if (thisWeekMins > (prevWeekMins * 1.15) || thisWeekSess > (prevWeekSess + 1)) {
      statusTitle = 'Đà đang lên';
      statusBody = `Tuần này có ${thisWeekSess} phiên, ${fmtHours(thisWeekMins)} và đang nhỉnh hơn 7 ngày trước đó.`;
    } else if (prevWeekSess > 0 && thisWeekMins < (prevWeekMins * 0.85)) {
      statusTitle = 'Nhịp đang chậm lại';
      statusBody = `Khối lượng tuần này đang thấp hơn nhịp trước đó, hiện dừng ở ${fmtHours(thisWeekMins)} sau ${thisWeekSess} phiên.`;
    } else if (streak.currentStreak >= 7) {
      statusTitle = 'Chuỗi đang giữ form';
      statusBody = `Chuỗi ${streak.currentStreak} ngày đang là lực đỡ chính cho toàn bộ nhịp tuần này.`;
    }

    const bestSessionLabel = allTime.bestSessionMins > 0 ? fmtHours(allTime.bestSessionMins) : '0p';
    const bestSessionXPLabel = allTime.bestSessionXP >= 1000
      ? `${(allTime.bestSessionXP / 1000).toFixed(1)}k XP`
      : `${allTime.bestSessionXP} XP`;
    const weeklyBestSessionLabel = (weeklyBestSession?.minutes ?? 0) > 0
      ? fmtHours(weeklyBestSession.minutes)
      : '0p';
    const weeklyBestSessionXP = Number.isFinite(weeklyBestSession?.xpEarned ?? weeklyBestSession?.epEarned)
      ? (weeklyBestSession.xpEarned ?? weeklyBestSession.epEarned)
      : 0;
    const weeklyBestSessionXPLabel = weeklyBestSessionXP >= 1000
      ? `${(weeklyBestSessionXP / 1000).toFixed(1)}k XP`
      : `${weeklyBestSessionXP} XP`;
    const totalXPLabel = allTime.totalXP >= 1000
      ? `${(allTime.totalXP / 1000).toFixed(allTime.totalXP >= 10_000 ? 0 : 1)}k XP`
      : `${allTime.totalXP} XP`;
    return {
      thisWeekMins,
      prevWeekMins,
      thisWeekSess,
      prevWeekSess,
      thisWeekXP,
      prevWeekXP,
      weeklyActiveDays,
      periodTotal,
      periodActiveCount,
      periodAvg,
      periodHasActivity,
      periodReadable,
      activeRatio,
      topBucket,
      latestBucket,
      bestDay,
      statusTitle,
      statusBody,
      bestSessionLabel,
      bestSessionXPLabel,
      weeklyBestSessionLabel,
      weeklyBestSessionXPLabel,
      weeklyJackpots,
      weeklyLongSessions,
      totalXPLabel,
      periodWindowLabel: `${periodDef.n} ${PERIOD_UNITS[period] ?? 'kỳ'} gần nhất`,
      periodEmptyDetail: `Không có hoạt động trong ${`${periodDef.n} ${PERIOD_UNITS[period] ?? 'kỳ'} gần nhất`.toLowerCase()}.`,
    };
  }, [allTime, history, metric, period, periodData, periodDef.n, prevWeekData, streak.currentStreak, weeklyData]);

  const handleMetricChange = (nextMetric) => {
    if (nextMetric === metric) return;
    startChartTransition(() => setMetric(nextMetric));
  };

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === period) return;
    startChartTransition(() => setPeriod(nextPeriod));
  };

  const hasOverviewData = (
    allTime.totalSessions > 0
    || progress.totalFocusMinutes > 0
    || overview.thisWeekSess > 0
    || overview.thisWeekXP > 0
    || streak.longestStreak > 0
  );

  if (!hasOverviewData) {
    return (
      <div className="space-y-4 md:space-y-5">
        <Motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="relative overflow-hidden rounded-[34px]"
          style={{
            background: PANEL_BG,
            border: `1px solid ${PANEL_BORDER}`,
            boxShadow: '0 22px 60px rgba(31,30,29,0.08)',
          }}
        >
          <div className="relative grid gap-0 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div className="p-6 md:p-7 lg:p-8">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
                  Tổng quan
                </p>
                <h3
                  className="mt-3 text-3xl font-semibold leading-tight md:text-[2.75rem]"
                  style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
                >
                  Biên niên sử của anh vẫn đang chờ phiên đầu tiên.
                </h3>
                <p className="mt-3 max-w-2xl text-[15px] leading-7" style={{ color: TEXT_MUTED }}>
                  Hoàn thành một phiên tập trung để tab này bắt đầu vẽ nhịp tuần, streak, XP và các mốc tiến triển thật sự. Khi chưa có dữ liệu, màn hình cần giữ gọn và rõ thay vì dàn một loạt số 0 ra khắp nơi.
                </p>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {[
                  { label: 'Chuỗi', value: `${streak.currentStreak} ngày` },
                  { label: 'Thưởng nền', value: `+${bonusPct.toFixed(0)}% XP` },
                  { label: 'Công trình', value: `${buildings.length}` },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-full px-4 py-2 text-[12px] font-medium"
                    style={{ background: FILTER_PILL_BG, color: TEXT_PRIMARY, border: `1px solid ${FILTER_PILL_BORDER}` }}
                  >
                    <span style={{ color: TEXT_SOFT }}>{item.label}</span>
                    <span> · {item.value}</span>
                  </div>
                ))}
              </div>

              <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(280px,0.7fr)]">
                <div
                  className="rounded-[28px] p-5 md:p-6"
                  style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                    Khi có dữ liệu
                  </p>
                  <div
                    className="mt-4 overflow-hidden rounded-[24px] border"
                    style={{ background: BG_CARD, borderColor: PANEL_BORDER }}
                  >
                    {[
                      {
                        marker: '01',
                        title: 'Nhịp 7 ngày',
                        body: 'Ngày nào anh có phiên, tổng phút và XP sẽ hiện ngay ở cột bên phải.',
                      },
                      {
                        marker: '02',
                        title: 'Chuỗi & thưởng nền',
                        body: 'Streak hiện tại, thưởng nền XP và mốc cao nhất sẽ tự cập nhật sau mỗi phiên hoàn thành.',
                      },
                      {
                        marker: '03',
                        title: 'Phân tích sâu hơn',
                        body: 'Biểu đồ hoạt động, phiên tốt nhất và tần suất sẽ chỉ bung ra khi thật sự có thứ để đọc.',
                      },
                    ].map((item, index) => (
                      <div
                        key={item.title}
                        className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 px-4 py-4"
                        style={{ borderTop: index === 0 ? 'none' : `1px solid ${PANEL_BORDER}` }}
                      >
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-full text-[11px] font-semibold tracking-[0.18em]"
                          style={{
                            background: 'rgba(var(--accent-rgb), 0.08)',
                            color: ACCENT2,
                            border: '1px solid rgba(var(--accent-rgb), 0.14)',
                            fontFamily: MONO_FONT,
                          }}
                        >
                          {item.marker}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{item.title}</p>
                          <p className="mt-1 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>{item.body}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  className="rounded-[28px] p-5 md:p-6"
                  style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT2 }}>
                    Trạng thái hiện tại
                  </p>
                  <div className="mt-4 flex items-end gap-3">
                    <span
                      className="text-[4.25rem] font-semibold leading-[0.84]"
                      style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                    >
                      0
                    </span>
                    <span className="pb-2 text-lg font-medium" style={{ color: TEXT_MUTED }}>
                      phiên
                    </span>
                  </div>
                  <p className="mt-3 text-[14px] leading-6" style={{ color: TEXT_MUTED }}>
                    Sau khi xong phiên đầu tiên, màn hình này sẽ chuyển sang chế độ phân tích thật và giữ lại lịch sử của anh.
                  </p>
                  <div className="mt-5 grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                    <OverviewRailStat label="Phiên tốt nhất" value="0p" detail="Chưa có dữ liệu" accent={TEXT_PRIMARY} />
                    <OverviewRailStat label="Kỷ lục streak" value={`${streak.longestStreak} ngày`} detail="Đang chờ chuỗi mới" accent="#b88356" />
                    <OverviewRailStat label="Tổng XP" value={overview.totalXPLabel} detail="Sẽ tăng ngay sau phiên đầu tiên" accent={ACCENT} />
                  </div>
                </div>
              </div>
            </div>

            <aside
              className="border-t xl:border-l xl:border-t-0"
              style={{ borderColor: PANEL_BORDER, background: PANEL_BG }}
            >
              <div className="p-6 md:p-7">
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
                  7 ngày gần nhất
                </p>
                <p className="mt-2 text-2xl font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
                  Chưa có nhịp mới
                </p>
                <p className="mt-2 text-[14px] leading-6" style={{ color: TEXT_MUTED }}>
                  7 ô ngày sẽ bắt đầu sáng lên ngay khi anh hoàn thành phiên đầu tiên.
                </p>

                <div className="mt-6 space-y-3">
                  {['CN', 'TH 2', 'TH 3', 'TH 4', 'TH 5', 'TH 6', 'TH 7'].map((label) => (
                    <div
                      key={label}
                      className="grid grid-cols-[48px_minmax(0,1fr)_40px] items-center gap-3"
                    >
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                        {label}
                      </span>
                      <div
                        className="h-11 rounded-2xl"
                        style={{ background: FILTER_PILL_BG, border: `1px solid ${FILTER_PILL_BORDER}` }}
                      />
                      <span className="text-right text-sm font-semibold" style={{ color: TEXT_SOFT }}>
                        0
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-[24px] p-4" style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
                    Gợi ý
                  </p>
                  <p className="mt-2 text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>
                    Bắt đầu bằng một phiên ngắn 15 đến 25 phút.
                  </p>
                  <p className="mt-1 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                    Một phiên hoàn thành là đủ để tab này chuyển từ màn hình chờ sang màn hình thống kê thật.
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </Motion.section>

        {prestige.count > 0 && (
          <Motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.28, ease: 'easeOut' }}
            className="rounded-[28px] px-5 py-4 md:px-6"
            style={{
              background: 'rgba(var(--accent-rgb),0.08)',
              border: '1px solid rgba(var(--accent-rgb),0.14)',
            }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: ACCENT2 }}>
                  Tích lũy dài hạn
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
                  Lớp cộng dồn dài hạn vẫn đang nâng toàn bộ chu kỳ kế tiếp.
                </p>
              </div>
              <div className="rounded-[22px] px-4 py-3 md:text-right" style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
                  Mức hiện tại
                </p>
                <p className="mt-2 text-2xl font-semibold leading-none" style={{ color: ACCENT2, fontFamily: DISPLAY_FONT }}>
                  ×{prestige.count}
                </p>
              </div>
            </div>
          </Motion.div>
        )}
      </div>
    );
  }

  const weeklyXPLabel = overview.thisWeekXP >= 1000
    ? `${(overview.thisWeekXP / 1000).toFixed(1)}k XP`
    : `${overview.thisWeekXP} XP`;
  const currentMetricLabel = METRIC_OPTIONS.find((option) => option.key === metric)?.label.toLowerCase() ?? 'phút';
  const reviewTone = shouldEmphasizeCoverage
    ? TEXT_PRIMARY
    : shouldShowQualityPercent
      ? (achievedRateOverall >= 70 ? ACCENT2 : achievedRateOverall >= 50 ? '#b88356' : '#8b847b')
      : reviewSummary.achievedCount > 0
        ? ACCENT2
        : TEXT_MUTED;
  const qualityBadge = showFullQualityPanel && (hasQualityReliable || shouldEmphasizeCoverage)
    ? {
        label: shouldEmphasizeCoverage ? 'Đã chấm' : 'Tỷ lệ đạt',
        value: shouldEmphasizeCoverage ? `${reviewCoverageRate}%` : `${achievedRateOverall}%`,
      }
    : null;
  const heroBadges = [
    { label: 'Streak hiện tại', value: `${streak.currentStreak} ngày` },
    { label: 'Tuần này', value: `${overview.thisWeekSess} phiên` },
    { label: 'Thưởng nền', value: `+${bonusPct.toFixed(0)}% XP` },
    qualityBadge,
  ].filter(Boolean);
  const weeklyStats = [
    {
      label: 'Phiên tuần này',
      value: overview.thisWeekSess.toLocaleString(),
      detail: `${overview.weeklyActiveDays}/7 ngày có hoạt động`,
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Phiên tốt nhất tuần',
      value: overview.weeklyBestSessionLabel,
      detail: overview.weeklyBestSessionXPLabel,
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Thưởng lớn',
      value: `${overview.weeklyJackpots}`,
      detail: `${overview.weeklyLongSessions} phiên dài trong tuần`,
      accent: ACCENT,
    },
  ];
  const periodStats = [
    {
      label: 'Tổng',
      value: fmtVal(overview.periodTotal, metric),
      detail: overview.periodWindowLabel,
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Trung bình khi có hoạt động',
      value: fmtVal(overview.periodAvg, metric),
      detail: `Tính trên ${overview.periodActiveCount || 0} ${PERIOD_UNITS[period] ?? 'kỳ'}`,
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Đỉnh kỳ',
      value: overview.topBucket ? fmtVal(overview.topBucket[metric] ?? 0, metric) : '—',
      detail: overview.topBucket ? `${overview.topBucket.label}` : overview.periodEmptyDetail,
      accent: ACCENT,
    },
    {
      label: 'Độ phủ',
      value: `${overview.activeRatio}%`,
      detail: `${overview.periodActiveCount}/${periodData.length} ${PERIOD_UNITS[period] ?? 'kỳ'} có hoạt động`,
      accent: TEXT_PRIMARY,
    },
  ];
  const qualityStats = [
    {
      label: 'Đã tự chấm',
      value: `${reviewSummary.reviewedCount}/${reviewSummary.sessionsWithGoal || 0}`,
      detail: reviewSummary.sessionsWithGoal > 0
        ? `${reviewCoverageRate}% độ phủ trên tổng phiên có mục tiêu`
        : 'Chưa có mục tiêu nào được lưu',
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Chạm mục tiêu',
      value: `${reviewSummary.achievedCount}`,
      detail: reviewSummary.reviewedCount > 0
        ? `${achievedRateReviewed}% trên số đã chấm`
        : 'Chưa có phiên nào được chấm',
      accent: ACCENT2,
    },
    {
      label: 'Chờ chấm',
      value: `${reviewSummary.pendingCount}`,
      detail: reviewSummary.pendingCount > 0
        ? `${reviewSummary.pendingCount} phiên đang chờ kết luận`
        : 'Không còn phiên nào chờ chấm',
      accent: TEXT_MUTED,
    },
  ];
  const compactQualityStats = [
    {
      label: 'Mục tiêu đã đặt',
      value: `${reviewSummary.sessionsWithGoal}`,
      detail: hasQualitySeed ? 'Đã ghi mục tiêu trong phiên' : 'Chưa có mục tiêu nào',
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Đã tự chấm',
      value: `${reviewSummary.reviewedCount}`,
      detail: hasQualitySeed ? `${reviewSummary.pendingCount} phiên đang chờ chấm` : 'Chưa có dữ liệu',
      accent: TEXT_PRIMARY,
    },
    {
      label: 'Chạm mục tiêu',
      value: `${reviewSummary.achievedCount}`,
      detail: hasQualitySeed ? 'Ưu tiên đọc theo số lượng trước khi đủ mẫu' : 'Chưa có dữ liệu',
      accent: ACCENT2,
    },
  ];
  const qualityLeadLabel = shouldEmphasizeCoverage
    ? 'Độ phủ tự chấm'
    : shouldShowQualityPercent
      ? 'Tỷ lệ đạt chính'
      : 'Mục tiêu đã chạm';
  const qualityLeadValue = shouldEmphasizeCoverage
    ? `${reviewCoverageRate}%`
    : shouldShowQualityPercent
      ? `${achievedRateOverall}%`
      : `${reviewSummary.achievedCount}/${reviewSummary.sessionsWithGoal || 0}`;
  const qualityLeadDetail = !hasQualitySeed
    ? 'Chưa đủ dữ liệu để đọc chất lượng phiên.'
    : shouldEmphasizeCoverage
      ? `${reviewSummary.reviewedCount}/${reviewSummary.sessionsWithGoal} phiên đã được tự chấm.`
      : shouldShowQualityPercent
        ? `Tính trên ${reviewSummary.sessionsWithGoal} phiên có mục tiêu.`
        : 'Mẫu còn mỏng, nên đang ưu tiên nhìn theo số lượng thay vì phần trăm.';
  const foundationStats = [
    {
      label: 'Kỷ lục streak',
      value: `${streak.longestStreak} ngày`,
      detail: streak.currentStreak > 0 ? `Hiện tại ${streak.currentStreak} ngày` : 'Đang chờ chuỗi mới',
      accent: '#b88356',
    },
    {
      label: 'Thưởng lớn',
      value: `${allTime.totalJackpots}`,
      detail: 'Số lần phần thưởng lớn đã xuất hiện',
      accent: ACCENT,
    },
    {
      label: 'Công trình',
      value: `${buildings.length}`,
      detail: 'Tổng số công trình đang sở hữu',
      accent: TEXT_PRIMARY,
    },
    prestige.count > 0
      ? {
          label: 'Prestige',
          value: `×${prestige.count}`,
          detail: `+${(prestige.permanentBonus * 100).toFixed(0)}% thưởng nền dài hạn`,
          accent: ACCENT2,
        }
      : null,
  ].filter(Boolean);

  return (
    <div className="space-y-4 md:space-y-5">
      <Motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="relative overflow-hidden rounded-[34px]"
        style={{
          background: PANEL_BG_SOFT,
          border: `1px solid ${PANEL_BORDER}`,
          boxShadow: '0 24px 64px rgba(31,30,29,0.08)',
        }}
      >
        <div className="p-5 md:p-6 lg:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
            Tổng quan
          </p>
          <div className="mt-3 max-w-3xl">
            <h3
              className="text-3xl font-semibold leading-tight md:text-[2.6rem]"
              style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
            >
              {overview.statusTitle}
            </h3>
            <p className="mt-3 text-[15px] leading-7" style={{ color: TEXT_MUTED }}>
              {overview.statusBody}
            </p>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            {heroBadges.map((item) => (
              <div
                key={item.label}
                className="rounded-full px-4 py-2 text-[12px] font-medium"
                style={{ background: FILTER_PILL_BG, color: TEXT_PRIMARY, border: `1px solid ${FILTER_PILL_BORDER}` }}
              >
                <span style={{ color: TEXT_SOFT }}>{item.label}</span>
                <span> · {item.value}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.15fr)_repeat(2,minmax(0,1fr))]">
            <OverviewHeroMetric
              icon="01"
              label="Tổng phiên"
              value={allTime.totalSessions.toLocaleString()}
              detail={<TrendBadge current={overview.thisWeekSess} previous={overview.prevWeekSess} baselineLabel="7 ngày trước đó" />}
              accent={ACCENT}
              className="sm:col-span-2 xl:row-span-2"
              chart={<AreaChart data={weeklyData} valueKey="sessions" height={64} accentColor={ACCENT} />}
            />
            <OverviewHeroMetric
              icon="02"
              label="Tổng giờ"
              value={fmtHours(progress.totalFocusMinutes)}
              detail={allTime.totalSessions > 0 ? `Trung bình ${fmtHours(allTime.avgSessionLength)} mỗi phiên` : 'Sẽ tăng ngay sau phiên đầu tiên'}
              accent={ACCENT2}
            />
            <OverviewHeroMetric
              icon="03"
              label="Tổng XP"
              value={overview.totalXPLabel}
              detail={allTime.totalSessions > 0 ? `Đỉnh phiên ${overview.bestSessionLabel} · ${overview.bestSessionXPLabel}` : 'XP sẽ tích lũy sau từng phiên'}
              accent={ACCENT}
            />
          </div>
        </div>
      </Motion.section>

      <Motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.28, ease: 'easeOut' }}
      >
        <div
          className="rounded-[30px] p-5 md:p-6"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                Nhịp 7 ngày
              </p>
              <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                7 ngày gần nhất đang diễn ra thế nào
              </h4>
              <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                {overview.weeklyActiveDays > 0
                  ? `${overview.weeklyActiveDays}/7 ngày có hoạt động. Tuần này có ${overview.thisWeekSess} phiên, ${fmtHours(overview.thisWeekMins)} và ${weeklyXPLabel}.`
                  : 'Bắt đầu bằng một phiên ngắn để dựng lại nhịp và cho màn này có dữ liệu thật.'}
              </p>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em]" style={{ color: TEXT_SOFT }}>
                So với 7 ngày trước đó
              </p>
              <div className="mt-2 text-sm">
                <TrendBadge current={overview.thisWeekSess} previous={overview.prevWeekSess} baselineLabel="7 ngày trước đó" />
              </div>
            </div>
          </div>

          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.08fr)_360px]">
            <div
              className="rounded-[26px] px-4 py-4 md:px-5"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <AreaChart data={weeklyData} valueKey="minutes" height={116} accentColor={ACCENT} />
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {weeklyStats.map((item) => (
                  <OverviewRailStat
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    detail={item.detail}
                    accent={item.accent}
                  />
                ))}
              </div>
            </div>

            <div
              className="rounded-[26px] px-4 py-4 md:px-5"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                Từng ngày trong tuần
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                Cột này chỉ giữ nhịp từng ngày, không trộn thêm chỉ số dài hạn.
              </p>
              <div className="mt-4">
                <WeekPulseList weeklyData={weeklyData} />
              </div>
            </div>
          </div>
        </div>
      </Motion.section>

      {recentLogs.length > 0 && (
        <Motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.28, ease: 'easeOut' }}
        >
          <div
            className="rounded-[30px] p-4 md:p-5"
            style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
          >
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                  Log gần đây
                </p>
                <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                  Những phiên vừa được ghi vào lịch sử
                </h4>
                <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                  Khối này kéo log mới nhất vào `Tổng quan`, để anh còn thấy phiên cụ thể chứ không chỉ còn số tổng hợp.
                </p>
              </div>
              <div
                className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                style={{ background: FILTER_PILL_BG, color: TEXT_MUTED, border: `1px solid ${FILTER_PILL_BORDER}` }}
              >
                {fmtCount(recentLogs.length)} log mới nhất
              </div>
            </div>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {recentLogs.map(({ entry, category, xpEarned, goalText, nextNoteText, notePreview, exactTimeLabel }) => (
                <div
                  key={entry.id ?? entry.timestamp}
                  className="rounded-[24px] p-4"
                  style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div
                        className="inline-flex max-w-full items-center gap-2 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: hexToRgba(category.color, 0.14),
                          color: category.color,
                          border: `1px solid ${hexToRgba(category.color, 0.24)}`,
                        }}
                      >
                        <span aria-hidden="true">{category.icon}</span>
                        <span className="truncate">{category.label}</span>
                      </div>
                      <p
                        className="mt-3 text-[1.65rem] font-semibold leading-none"
                        style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                      >
                        {fmtHours(entry?.minutes ?? 0)}
                      </p>
                      <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                        {fmtXPCompact(xpEarned)} XP
                        {entry?.comboCount > 1 ? ` • Combo ×${entry.comboCount}` : ''}
                        {entry?.tier ? ` • ${entry.tier}` : ''}
                      </p>
                    </div>
                    <SessionReviewBadge entry={entry} compact />
                  </div>

                  <div className="mt-4 rounded-[18px] px-3 py-2.5" style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                      Thời điểm ghi
                    </p>
                    <p className="mt-1 text-[12px] font-medium" style={{ color: TEXT_PRIMARY }}>
                      {timeAgo(entry?.finishedAt ?? entry?.timestamp)}
                    </p>
                    <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                      {exactTimeLabel}
                    </p>
                  </div>

                  {(goalText || nextNoteText || notePreview) ? (
                    <div className="mt-3 space-y-2">
                      {goalText && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                            Mục tiêu
                          </p>
                          <p className="mt-1 text-[12px] leading-5" style={{ color: TEXT_PRIMARY }}>
                            {goalText}
                          </p>
                        </div>
                      )}
                      {!goalText && notePreview && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                            Ghi chú
                          </p>
                          <p className="mt-1 line-clamp-2 text-[12px] leading-5" style={{ color: TEXT_PRIMARY }}>
                            {notePreview}
                          </p>
                        </div>
                      )}
                      {nextNoteText && (
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                            Phiên kế tiếp
                          </p>
                          <p className="mt-1 line-clamp-2 text-[12px] leading-5" style={{ color: TEXT_MUTED }}>
                            {nextNoteText}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="mt-3 text-[12px] leading-5" style={{ color: TEXT_MUTED }}>
                      Phiên này chưa có ghi chú hoặc mục tiêu đính kèm.
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Motion.section>
      )}

      <Motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.28, ease: 'easeOut' }}
        className="grid gap-4 xl:grid-cols-[minmax(300px,0.72fr)_minmax(0,1.28fr)]"
      >
        <div
          className="rounded-[30px] p-4 md:p-5"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
            Chất lượng phiên
          </p>
          <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
            {reviewHeadline}
          </h4>
          <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
            {reviewSummary.sessionsWithGoal > 0
              ? reviewSummary.reviewedCount > 0
                ? `${reviewSummary.achievedCount} phiên đạt, ${reviewSummary.missedCount} phiên chưa đạt${reviewSummary.pendingCount > 0 ? ` và ${reviewSummary.pendingCount} phiên còn chờ chấm.` : '.'}`
                : `${reviewSummary.pendingCount}/${reviewSummary.sessionsWithGoal} phiên có mục tiêu đang chờ được chốt kết quả cuối phiên.`
              : 'Khi anh đặt mục tiêu và tự chấm ở cuối phiên, phần này mới phản ánh được chất lượng thay vì chỉ đếm số lượng.'}
          </p>

          {showFullQualityPanel ? (
            <>
              <div
                className="mt-5 rounded-[24px] border px-4 py-4"
                style={{ borderColor: PANEL_BORDER, background: PANEL_BG_SOFT }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                  {qualityLeadLabel}
                </p>
                <div className="mt-3 flex items-end justify-between gap-4">
                  <div>
                    <p
                      className="text-[2.5rem] font-semibold leading-none"
                      style={{ color: reviewTone, fontFamily: DISPLAY_FONT }}
                    >
                      {qualityLeadValue}
                    </p>
                    <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                      {qualityLeadDetail}
                    </p>
                  </div>
                  {reviewSummary.reviewedCount > 0 && (
                    <div className="text-right text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                      <div>{achievedRateReviewed}% trên số đã chấm</div>
                      <div>{reviewCoverageRate}% độ phủ tự chấm</div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {qualityStats.map((item) => (
                  <OverviewRailStat
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    detail={item.detail}
                    accent={item.accent}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              <div
                className="mt-5 rounded-[24px] border px-4 py-4"
                style={{ borderColor: PANEL_BORDER, background: PANEL_BG_SOFT }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                  Dữ liệu còn mỏng
                </p>
                <p className="mt-2 text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
                  {hasQualitySeed
                    ? `Hiện mới có ${reviewSummary.sessionsWithGoal} phiên có mục tiêu.`
                    : 'Chưa có phiên nào được dùng để đọc chất lượng.'}
                </p>
                <p className="mt-2 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                  {hasQualitySeed
                    ? 'Khi đủ từ 3 phiên có mục tiêu trở lên, phần này sẽ bắt đầu ưu tiên tỷ lệ thay vì chỉ nhìn số lượng.'
                    : 'Bắt đầu bằng việc ghi mục tiêu cho phiên và chốt kết quả ở cuối phiên để phần này có dữ liệu thật.'}
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                {compactQualityStats.map((item) => (
                  <OverviewRailStat
                    key={item.label}
                    label={item.label}
                    value={item.value}
                    detail={item.detail}
                    accent={item.accent}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div
          className="rounded-[30px] p-4 md:p-5"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                Hoạt động theo kỳ
              </p>
              <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                Đọc nhịp theo {currentMetricLabel}
              </h4>
              <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                {overview.periodReadable
                  ? 'Cửa sổ này gom dữ liệu đủ dài để anh nhìn được đà thật, thay vì bị kéo theo từng phiên riêng lẻ.'
                  : `Dữ liệu trong ${overview.periodWindowLabel.toLowerCase()} còn mỏng, nên phần này mới chỉ đủ để nhìn trạng thái chứ chưa nên kết luận xu hướng.`}
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                  Góc nhìn
                </p>
                <div className="flex flex-wrap gap-2">
                  {METRIC_OPTIONS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleMetricChange(option.key)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold transition-[background-color,color,transform] duration-200 hover:-translate-y-px"
                      style={metric === option.key
                        ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, border: `1px solid ${TAB_ACTIVE_BORDER}` }
                        : { background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                  Khoảng đọc
                </p>
                <div className="flex flex-wrap gap-2">
                  {PERIODS.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handlePeriodChange(option.key)}
                      className="min-w-[72px] rounded-full px-3 py-1.5 text-xs font-medium transition-[background-color,color,transform] duration-200 hover:-translate-y-px"
                      style={period === option.key
                        ? { background: FILTER_PILL_ACTIVE_BG, color: FILTER_PILL_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, border: `1px solid ${FILTER_PILL_ACTIVE_BORDER}` }
                        : { background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="rounded-[26px] px-3 py-4 md:px-4"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <BarChart data={periodData} valueKey={metric} height={196} accentColor={ACCENT} />
              <div className="mt-4 border-t pt-3" style={{ borderColor: PANEL_BORDER }}>
                <p className="text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                  {isChartPending
                    ? 'Biểu đồ đang cập nhật theo bộ lọc mới.'
                    : overview.periodReadable
                      ? 'Đổi metric hoặc khoảng đọc để xem cùng một nhịp dưới góc nhìn khác.'
                      : overview.periodHasActivity
                        ? 'Đã có tín hiệu ban đầu, nhưng chưa đủ dày để đọc thành xu hướng ổn định.'
                        : overview.periodEmptyDetail}
                </p>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {periodStats.map((item) => (
                <OverviewRailStat
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  detail={item.detail}
                  accent={item.accent}
                />
              ))}
            </div>
          </div>
        </div>
      </Motion.section>

      <Motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.14, duration: 0.28, ease: 'easeOut' }}
      >
        <div
          className="rounded-[30px] p-5 md:p-6"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                Nền dài hạn
              </p>
              <h4 className="mt-2 text-xl font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                Các mốc cần nhớ, không cần lặp lại khắp màn hình
              </h4>
              <p className="mt-2 text-sm leading-6" style={{ color: TEXT_MUTED }}>
                Phần này gom các chỉ số dài hạn vào một hàng duy nhất để tab tổng quan bớt loãng và dễ quét hơn.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {foundationStats.map((item) => (
              <OverviewRailStat
                key={item.label}
                label={item.label}
                value={item.value}
                detail={item.detail}
                accent={item.accent}
                className="h-full"
              />
            ))}
          </div>
        </div>
      </Motion.section>
    </div>
  );
}

// ─── Year Heatmap ─────────────────────────────────────────────────────────────
const HEAT_COLORS = [
  'rgba(244, 242, 236, 0.92)',
  'rgba(228, 220, 210, 0.96)',
  'rgba(217, 196, 178, 0.96)',
  'rgba(205, 148, 117, 0.92)',
  'rgba(201, 100, 66, 0.94)',
];

const FOCUS_PERIODS = [
  { key: 'all', label: 'Tất Cả' },
  { key: 'month', label: 'Tháng Này' },
  { key: 'week', label: 'Tuần Này' },
  { key: 'today', label: 'Hôm Nay' },
];

const FOCUS_BUCKETS = [
  { label: '< 15p', tone: 'Mở đầu', accent: '#9a8d82' },
  { label: '15–25p', tone: 'Giữ nhịp', accent: '#b7a596' },
  { label: '25–45p', tone: 'Nhịp chuẩn', accent: '#d0b19b' },
  { label: '45–60p', tone: 'Đi sâu dần', accent: '#c27a57' },
  { label: '60p +', tone: 'Đi sâu', accent: '#8a3f24' },
];

const FOCUS_TIME_BLOCKS = [
  { key: 'late-night', label: 'Đêm Khuya', icon: '🌙' },
  { key: 'morning', label: 'Buổi Sáng', icon: '🌤️' },
  { key: 'afternoon', label: 'Buổi Chiều', icon: '☀️' },
  { key: 'evening', label: 'Buổi Tối', icon: '🌆' },
];
const FOCUS_SPARSE_SESSION_THRESHOLD = 18;
const FOCUS_SPARSE_ACTIVE_DAY_THRESHOLD = 12;
const FOCUS_SPARSE_HOUR_THRESHOLD = 6;
const FOCUS_COMPACT_TIMELINE_DAYS = {
  all: 56,
  month: 35,
  week: 21,
  today: 14,
};

function getFocusBucketIndex(minutes) {
  if (minutes < 15) return 0;
  if (minutes < 25) return 1;
  if (minutes < 45) return 2;
  if (minutes < 60) return 3;
  return 4;
}

function getFocusTimeBlockIndex(hour) {
  if (hour < 6) return 0;
  if (hour < 12) return 1;
  if (hour < 18) return 2;
  return 3;
}

function getHeatIntensity(minutes, maxMinutes) {
  if (!minutes || minutes <= 0 || !Number.isFinite(maxMinutes) || maxMinutes <= 0) return 0;
  return Math.min(4, Math.max(1, Math.ceil((minutes / maxMinutes) * 4)));
}

function summarizeFocusStats(history, period = 'all') {
  const startTs = getPeriodStartTs(period);
  const hourlyStats = Array.from({ length: 24 }, (_, hour) => ({ hour, sessions: 0, minutes: 0 }));
  const buckets = FOCUS_BUCKETS.map((bucket) => ({ ...bucket, count: 0, minutes: 0 }));
  const timeBlocks = FOCUS_TIME_BLOCKS.map((block) => ({ ...block, sessions: 0, minutes: 0 }));
  const dayTotals = new Map();
  const filteredEntries = [];

  let totalMinutes = 0;
  let totalSessions = 0;
  let deepFocusCount = 0;
  let ultraFocusCount = 0;
  let maxSessionMinutes = 0;
  let latestSessionTs = null;

  for (const entry of history) {
    const timestampMs = getTimestampMs(entry?.timestamp);
    if (!Number.isFinite(timestampMs) || (startTs !== null && timestampMs < startTs)) continue;

    filteredEntries.push(entry);
    const minutes = Math.max(0, entry?.minutes ?? 0);

    totalMinutes += minutes;
    totalSessions += 1;
    if (minutes >= 60) deepFocusCount += 1;
    if (minutes >= 90) ultraFocusCount += 1;
    if (minutes > maxSessionMinutes) maxSessionMinutes = minutes;
    if (latestSessionTs === null || timestampMs > latestSessionTs) latestSessionTs = timestampMs;

    const hour = getVietnamHour(timestampMs);
    hourlyStats[hour].sessions += 1;
    hourlyStats[hour].minutes += minutes;

    const bucketIndex = getFocusBucketIndex(minutes);
    buckets[bucketIndex].count += 1;
    buckets[bucketIndex].minutes += minutes;

    const timeBlockIndex = getFocusTimeBlockIndex(hour);
    timeBlocks[timeBlockIndex].sessions += 1;
    timeBlocks[timeBlockIndex].minutes += minutes;

    const dayKey = startOfVietnamDayTs(timestampMs);
    const currentDay = dayTotals.get(dayKey) ?? {
      key: dayKey,
      label: formatVietnamDate(dayKey, { weekday: 'short', day: 'numeric', month: 'numeric' }),
      minutes: 0,
      sessions: 0,
    };
    currentDay.minutes += minutes;
    currentDay.sessions += 1;
    dayTotals.set(dayKey, currentDay);
  }

  const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
  const maxHourMins = Math.max(...hourlyStats.map((item) => item.minutes), 1);
  const maxBucket = Math.max(...buckets.map((bucket) => bucket.count), 1);
  const activeDays = dayTotals.size;
  const avgMinutesPerActiveDay = activeDays > 0 ? Math.round(totalMinutes / activeDays) : 0;
  const activeHours = hourlyStats
    .filter((item) => item.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes || b.sessions - a.sessions || a.hour - b.hour);
  const activeHourCount = activeHours.length;
  const recentActiveDays = Array.from(dayTotals.values())
    .sort((a, b) => b.key - a.key)
    .slice(0, 5);
  const compactWindowDays = FOCUS_COMPACT_TIMELINE_DAYS[period] ?? FOCUS_COMPACT_TIMELINE_DAYS.all;
  const compactEndTs = startOfVietnamDayTs();
  const compactTimeline = Array.from({ length: compactWindowDays }, (_, index) => {
    const dayTs = compactEndTs - ((compactWindowDays - 1 - index) * 86_400_000);
    const day = dayTotals.get(dayTs);
    return {
      key: dayTs,
      label: formatVietnamDate(dayTs, { weekday: 'short', day: 'numeric', month: 'numeric' }),
      shortLabel: formatVietnamDate(dayTs, { day: 'numeric', month: 'numeric' }),
      minutes: day?.minutes ?? 0,
      sessions: day?.sessions ?? 0,
    };
  });
  const compactTimelineMax = Math.max(...compactTimeline.map((day) => day.minutes), 1);
  const compactTimelineWeeks = Array.from(
    { length: Math.ceil(compactTimeline.length / 7) },
    (_, weekIndex) => compactTimeline
      .slice(weekIndex * 7, weekIndex * 7 + 7)
      .map((day) => ({ ...day, intensity: getHeatIntensity(day.minutes, compactTimelineMax) })),
  );
  const compactActiveDays = compactTimeline.filter((day) => day.minutes > 0).length;
  const compactConsistency = compactWindowDays > 0
    ? Math.round((compactActiveDays / compactWindowDays) * 100)
    : 0;

  const bestHour = hourlyStats.reduce(
    (best, item) => (item.minutes > best.minutes ? item : best),
    { hour: 0, sessions: 0, minutes: 0 },
  );
  const bestTimeBlock = timeBlocks.reduce(
    (best, block) => (block.minutes > best.minutes ? block : best),
    { key: 'none', label: 'Chưa có dữ liệu', icon: '🕳️', sessions: 0, minutes: 0 },
  );
  const bestDay = Array.from(dayTotals.values()).reduce(
    (best, day) => (day.minutes > best.minutes ? day : best),
    { key: 0, label: '—', minutes: 0, sessions: 0 },
  );

  const recent7 = filteredEntries.slice(0, 7);
  const prev7 = filteredEntries.slice(7, 14);
  const recent7Minutes = recent7.reduce((sum, entry) => sum + (entry?.minutes ?? 0), 0);
  const prev7Minutes = prev7.reduce((sum, entry) => sum + (entry?.minutes ?? 0), 0);
  const recent7Avg = recent7.length > 0 ? Math.round(recent7Minutes / recent7.length) : 0;
  const recent30 = filteredEntries.slice(0, 30).reverse().map((entry, index) => ({
    label: String(index + 1),
    minutes: entry?.minutes ?? 0,
    sessions: 1,
    xp: entry?.xpEarned ?? 0,
  }));
  const sparseMode = totalSessions < FOCUS_SPARSE_SESSION_THRESHOLD
    || activeDays < FOCUS_SPARSE_ACTIVE_DAY_THRESHOLD
    || activeHourCount < FOCUS_SPARSE_HOUR_THRESHOLD;

  return {
    totalSessions,
    totalMinutes,
    avgSessionMinutes,
    maxSessionMinutes,
    deepFocusCount,
    ultraFocusCount,
    activeDays,
    avgMinutesPerActiveDay,
    hourlyStats,
    maxHourMins,
    bestHour,
    buckets,
    maxBucket,
    timeBlocks,
    bestTimeBlock,
    bestDay,
    recent7Minutes,
    prev7Minutes,
    recent7Avg,
    recent30,
    activeHours,
    activeHourCount,
    recentActiveDays,
    compactTimeline,
    compactTimelineWeeks,
    compactWindowDays,
    compactActiveDays,
    compactConsistency,
    sparseMode,
    lastSessionLabel: latestSessionTs ? formatVietnamDate(latestSessionTs, { weekday: 'short', day: 'numeric', month: 'numeric' }) : 'Chưa có phiên nào',
  };
}

const YearHeatmap = React.memo(function YearHeatmap({ history }) {
  const { weeks, totalMins, activeDays } = useMemo(() => {
    const yearData = computeYearGrid(history);
    const COLS = 53;
    return {
      weeks: Array.from({ length: COLS }, (_, weekIndex) => yearData.slice(weekIndex * 7, weekIndex * 7 + 7)),
      totalMins: yearData.reduce((sum, day) => sum + day.minutes, 0),
      activeDays: yearData.filter((day) => day.minutes > 0).length,
    };
  }, [history]);

  return (
    <div
      className="rounded-[28px] p-5"
      style={{
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: '0 18px 42px rgba(15,23,42,0.06)',
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>365 Ngày Gần Đây</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
            Nhìn nhanh toàn bộ nhịp tập trung trong năm gần nhất. Ô càng đậm ấm thì tổng phút của ngày đó càng cao.
          </p>
        </div>
        <div
          className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap"
          style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
        >
          {fmtCount(activeDays)} ngày · {fmtHours(totalMins)}
        </div>
      </div>

      <div
        className="mt-4 overflow-x-auto pb-1"
        style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        <div className="flex gap-px min-w-[560px] md:min-w-[620px]">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col gap-px flex-1">
              {Array.from({ length: 7 }, (_, dayOfWeek) => {
                const cell = week[dayOfWeek];
                const color = cell ? HEAT_COLORS[cell.intensity] : HEAT_COLORS[0];

                return (
                  <div
                    key={dayOfWeek}
                    className="rounded-[3px]"
                    style={{ aspectRatio: '1', background: color, cursor: 'default' }}
                    title={cell ? `${cell.date}: ${cell.minutes}p` : ''}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5">
        <span className="text-[10px]" style={{ color: TEXT_SOFT }}>Nhẹ</span>
        {HEAT_COLORS.map((color, index) => (
          <div key={index} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: color }} />
        ))}
        <span className="text-[10px]" style={{ color: TEXT_SOFT }}>Đậm</span>
      </div>
    </div>
  );
});

const CompactFocusTimeline = React.memo(function CompactFocusTimeline({ summary, periodLabel }) {
  const visibleCompactTimelineWeeks = summary.compactTimelineWeeks.slice(-5);
  const visibleCompactTimeline = visibleCompactTimelineWeeks.flat();
  const timelineStart = visibleCompactTimeline[0]?.shortLabel ?? summary.compactTimeline[0]?.shortLabel ?? '';
  const timelineEnd = visibleCompactTimeline.at(-1)?.shortLabel ?? summary.compactTimeline.at(-1)?.shortLabel ?? '';
  const compactWeekCount = Math.max(visibleCompactTimelineWeeks.length, 1);

  return (
    <div
      className="rounded-[28px] p-4 md:p-5"
      style={{
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: '0 18px 42px rgba(15,23,42,0.06)',
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>Tín Hiệu Gần Đây</p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
            Dữ liệu trong {periodLabel.toLowerCase()} còn gọn, nên khối này giữ lại những mốc gần nhất thay vì kéo ra thành một bức tranh quá rộng.
          </p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap"
          style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
        >
          {fmtCount(summary.compactActiveDays)}/{fmtCount(summary.compactWindowDays)} ngày
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(252px,0.82fr)]">
        <div>
          <div className="pb-1">
            <div
              className="grid w-full gap-1 sm:gap-1.5"
              style={{ gridTemplateColumns: `repeat(${compactWeekCount}, minmax(0, 1fr))` }}
            >
              {visibleCompactTimelineWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="grid gap-1 sm:gap-1.5">
                  {week.map((day) => (
                    <div
                      key={day.key}
                      className="aspect-square rounded-[6px]"
                      style={{
                        background: HEAT_COLORS[day.intensity],
                        border: day.minutes > 0 ? 'none' : `1px solid ${PANEL_BORDER}`,
                      }}
                      title={`${day.label}: ${fmtHours(day.minutes)}${day.sessions > 0 ? ` • ${fmtCount(day.sessions)} phiên` : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-[10px]" style={{ color: TEXT_SOFT }}>
            <span>{timelineStart}</span>
            <span>{timelineEnd}</span>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
            >
              Độ phủ hiện tại · {summary.compactConsistency}%
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
            >
              Ngày nổi bật · {summary.bestDay.label}
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
            >
              Phiên gần nhất · {summary.lastSessionLabel}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-1">
          {summary.recentActiveDays.map((day, index) => (
            <div
              key={day.key}
              className="rounded-[20px] px-3 py-3"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                {index === 0 ? 'Mốc mới nhất' : `Mốc ${index + 1}`}
              </p>
              <p className="mt-2 text-[15px] font-semibold leading-tight" style={{ color: TEXT_PRIMARY }}>
                {day.label}
              </p>
              <p className="mt-2 text-lg font-semibold tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                {fmtHours(day.minutes)}
              </p>
              <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                {fmtCount(day.sessions)} phiên
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

const FocusHourSpotlight = React.memo(function FocusHourSpotlight({ summary, periodLabel }) {
  const sparseHours = summary.activeHours.slice(0, 6);

  return (
    <div
      className="rounded-[28px] p-4 md:p-5"
      style={{
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: '0 18px 42px rgba(15,23,42,0.06)',
      }}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>
            {summary.sparseMode ? 'Khung giờ đang hiện ra' : 'Khung giờ vào nhịp'}
          </p>
          <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
            {summary.sparseMode
              ? `Dữ liệu trong ${periodLabel.toLowerCase()} còn gọn, nên màn này chỉ giữ những giờ đã thật sự có hoạt động.`
              : `Cột càng cao thì tổng phút trong khung giờ đó càng rõ hơn ở ${periodLabel.toLowerCase()}.`}
          </p>
        </div>
        <div
          className="rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap"
          style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
        >
          Khung rõ nhất · {summary.bestTimeBlock.label}
        </div>
      </div>

      {summary.sparseMode ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            {sparseHours.map((hour, index) => (
              <div
                key={hour.hour}
                className="rounded-[20px] px-3 py-3"
                style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>
                  Mốc {index + 1} · {formatHourWindow(hour.hour)}
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                  {fmtHours(hour.minutes)}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                  {fmtCount(hour.sessions)} phiên
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <div className="flex items-end gap-1.5" style={{ height: '54px' }}>
              {summary.hourlyStats.map((hour) => {
                const pct = (hour.minutes / summary.maxHourMins) * 100;
                const isBest = hour.hour === summary.bestHour.hour && summary.bestHour.minutes > 0;

                return (
                  <div
                    key={hour.hour}
                    className="flex-1"
                    style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
                    title={`${formatHourWindow(hour.hour)} — ${fmtHours(hour.minutes)} (${fmtCount(hour.sessions)} phiên)`}
                  >
                    <div
                      className="w-full rounded-[6px]"
                      style={{
                        height: `${Math.max(pct, hour.minutes > 0 ? 16 : 6)}%`,
                        background: isBest
                          ? `linear-gradient(180deg, ${ACCENT2} 0%, ${ACCENT} 100%)`
                          : PANEL_BG_SOFT,
                        border: isBest ? 'none' : `1px solid ${PANEL_BORDER}`,
                        opacity: hour.minutes === 0 ? 0.42 : 1,
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-2 flex justify-between text-[10px]" style={{ color: TEXT_SOFT }}>
              <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: `${ACCENT}16`, color: ACCENT2, border: `1px solid rgba(var(--accent-rgb), 0.22)` }}
            >
              Khung rõ nhất · {formatHourWindow(summary.bestHour.hour)}
            </div>
            <div
              className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
              style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
            >
              Cụm giờ rõ nhất · {summary.bestTimeBlock.label}
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-end gap-1.5" style={{ height: '88px' }}>
            {summary.hourlyStats.map((hour) => {
              const pct = (hour.minutes / summary.maxHourMins) * 100;
              const isBest = hour.hour === summary.bestHour.hour && summary.bestHour.minutes > 0;

              return (
                <div
                  key={hour.hour}
                  className="flex-1"
                  style={{ height: '100%', display: 'flex', alignItems: 'flex-end' }}
                  title={`${formatHourWindow(hour.hour)} — ${fmtHours(hour.minutes)} (${fmtCount(hour.sessions)} phiên)`}
                >
                  <div
                    className="w-full rounded-[6px]"
                    style={{
                      height: `${Math.max(pct, hour.minutes > 0 ? 8 : 4)}%`,
                      background: isBest
                        ? `linear-gradient(180deg, ${ACCENT2} 0%, ${ACCENT} 100%)`
                        : PANEL_BG_SOFT,
                      border: isBest ? 'none' : `1px solid ${PANEL_BORDER}`,
                      opacity: hour.minutes === 0 ? 0.45 : 1,
                    }}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between text-[10px]" style={{ color: TEXT_SOFT }}>
            <span>00h</span><span>06h</span><span>12h</span><span>18h</span><span>23h</span>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {summary.timeBlocks.map((block) => (
              <div
                key={block.key}
                className="rounded-[20px] px-3 py-3"
                style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>
                  {block.label}
                </p>
                <p className="mt-2 text-lg font-semibold tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                  {fmtHours(block.minutes)}
                </p>
                <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>
                  {fmtCount(block.sessions)} phiên • Nhịp TB {block.sessions > 0 ? Math.round(block.minutes / block.sessions) : 0}p
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
});

// ─── Tab: Tập Trung ───────────────────────────────────────────────────────────
const FocusTab = React.memo(function FocusTab({ history }) {
  const [focusPeriod, setFocusPeriod] = useState('all');
  const [isPeriodPending, startPeriodTransition] = useTransition();
  const shouldReduceMotion = useReducedMotion();
  const deferredFocusPeriod = useDeferredValue(focusPeriod);
  const focusSummary = useMemo(
    () => summarizeFocusStats(history, deferredFocusPeriod),
    [history, deferredFocusPeriod],
  );

  const periodLabel = FOCUS_PERIODS.find((period) => period.key === deferredFocusPeriod)?.label ?? 'Tất Cả';
  const bestHourLabel = focusSummary.bestHour.minutes > 0 ? formatHourWindow(focusSummary.bestHour.hour) : 'Chưa có dữ liệu';
  const bestTimeBlockAverage = focusSummary.bestTimeBlock.sessions > 0
    ? Math.round(focusSummary.bestTimeBlock.minutes / focusSummary.bestTimeBlock.sessions)
    : 0;
  const deepFocusRatio = focusSummary.totalSessions > 0
    ? Math.round((focusSummary.deepFocusCount / focusSummary.totalSessions) * 100)
    : 0;
  const focusMomentum = focusSummary.recent7Minutes - focusSummary.prev7Minutes;
  const focusMomentumPct = focusSummary.prev7Minutes > 0
    ? Math.round((focusMomentum / focusSummary.prev7Minutes) * 100)
    : null;
  const isLagging = isPeriodPending || deferredFocusPeriod !== focusPeriod;

  const focusHeadline = focusSummary.totalSessions > 0
    ? focusSummary.sparseMode
      ? `Tín hiệu đầu tiên đang nghiêng về ${bestHourLabel}.`
      : `Nhịp mạnh nhất đang rơi vào ${bestHourLabel}.`
    : `Chưa có dữ liệu cho ${periodLabel.toLowerCase()}.`;
  const focusBody = focusSummary.totalSessions > 0
    ? focusSummary.sparseMode
      ? `${periodLabel} mới ghi nhận ${fmtCount(focusSummary.totalSessions)} phiên trên ${fmtCount(focusSummary.activeDays)} ngày có phiên. Khối này ưu tiên những gì vừa diễn ra gần đây để anh đọc nhịp nhanh hơn, thay vì trải số liệu ra quá rộng khi dữ liệu còn mỏng.`
      : `${periodLabel} ghi nhận ${fmtCount(focusSummary.totalSessions)} phiên với ${fmtHours(focusSummary.totalMinutes)} tổng thời lượng. Trung bình mỗi phiên kéo dài ${focusSummary.avgSessionMinutes} phút, và ${deepFocusRatio}% số phiên đã chạm mốc 60 phút.`
    : `Hoàn thành thêm một phiên trong ${periodLabel.toLowerCase()} để hệ thống bắt đầu đọc được nhịp tập trung của anh.`;

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === focusPeriod) return;
    startPeriodTransition(() => setFocusPeriod(nextPeriod));
  };

  return (
    <div className="space-y-3.5 md:space-y-4">
      <div
        className="overflow-x-auto rounded-2xl p-1"
        style={{ background: TAB_BAR_BG, border: `1px solid ${PANEL_BORDER}` }}
      >
        <div className="inline-flex min-w-full gap-1">
          {FOCUS_PERIODS.map((period) => (
            <button
              key={period.key}
              type="button"
              onClick={() => handlePeriodChange(period.key)}
              aria-pressed={focusPeriod === period.key}
              className="min-w-[86px] rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform,border-color] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2"
              style={focusPeriod === period.key
                ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, borderColor: TAB_ACTIVE_BORDER }
                : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER }}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {focusSummary.totalSessions === 0 ? (
        <>
          <div
            className="rounded-[30px] border px-5 py-8 md:px-6 md:py-9"
            style={{
              background: BG_CARD,
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow: '0 18px 42px rgba(31,30,29,0.06)',
            }}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                  Tập trung
                </p>
                <h3
                  className="mt-3 text-[1.8rem] font-semibold leading-tight"
                  style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
                >
                  Chưa có phiên nào trong {periodLabel.toLowerCase()}
                </h3>
                <p className="mt-3 max-w-[58ch] text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                  Khối này sẽ bắt đầu đọc khung giờ rõ nhất, độ dài phiên và nhịp gần đây ngay khi có thêm vài phiên trong khoảng đang xem. Khi dữ liệu còn trống, tôi giữ bề mặt này như một trang ghi chú mở đầu thay vì dựng chart rỗng.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                  >
                    Lưu trữ hiện có · {fmtCount(history.length)} phiên
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: `${ACCENT}10`, color: ACCENT2, border: `1px solid rgba(201,100,66,0.16)` }}
                  >
                    Khởi đầu phù hợp · 25 đến 45 phút
                  </div>
                </div>
              </div>

              <div
                className="overflow-hidden rounded-[24px] border lg:min-w-[320px]"
                style={{ borderColor: PANEL_BORDER, background: PANEL_BG_SOFT }}
              >
                {[
                  {
                    label: 'Khoảng đang xem',
                    value: periodLabel,
                    detail: 'Đổi tab thời gian ở phía trên để nới hoặc thu cửa sổ đọc.',
                  },
                  {
                    label: 'Khung giờ rõ nhất',
                    value: 'Đang chờ',
                    detail: 'Cần thêm vài phiên trước khi có thể gọi tên khung giờ mạnh nhất.',
                  },
                  {
                    label: 'Tín hiệu gần đây',
                    value: 'Mở đầu',
                    detail: 'Bắt đầu bằng một phiên gọn để dựng lại đường đọc đầu tiên.',
                  },
                ].map((item, index) => (
                  <div
                    key={item.label}
                    className="px-4 py-3.5"
                    style={{ borderTop: index === 0 ? 'none' : `1px solid ${PANEL_BORDER}` }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                          {item.label}
                        </p>
                        <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                          {item.detail}
                        </p>
                      </div>
                      <p
                        className="shrink-0 text-right text-[1.05rem] font-semibold leading-tight"
                        style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                      >
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <YearHeatmap history={history} />
        </>
      ) : (
        <>
          <Motion.section
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: 'easeOut' }}
            className="relative overflow-hidden rounded-[30px] p-4 md:p-5 lg:p-6"
            style={{
              background: BG_CARD,
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow: '0 24px 56px rgba(31,30,29,0.08)',
            }}
          >
            <div className="relative grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <span>{periodLabel}</span>
                  </div>
                  {isLagging && (
                    <div
                      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                      style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                    >
                      <span>Đang cập nhật…</span>
                    </div>
                  )}
                </div>

                <div className="max-w-3xl">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
                    Tập trung
                  </p>
                  <h3
                    className="mt-2.5 text-[1.6rem] font-semibold leading-tight md:text-[2rem]"
                    style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
                  >
                    {focusHeadline}
                  </h3>
                  <p className="mt-2.5 max-w-[60ch] text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                    {focusBody}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: `${ACCENT}16`, color: ACCENT2, border: `1px solid rgba(var(--accent-rgb), 0.22)` }}
                  >
                    Giờ rõ nhất · {bestHourLabel}
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    Phiên sâu · {fmtCount(focusSummary.deepFocusCount)}
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    Phiên rất dài · {fmtCount(focusSummary.ultraFocusCount)}
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    Ngày có phiên · {fmtCount(focusSummary.activeDays)}
                  </div>
                  {focusSummary.sparseMode && (
                    <div
                      className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                      style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                    >
                      Độ phủ gần đây · {focusSummary.compactConsistency}%
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <OverviewRailStat
                  label="Thời lượng đã ghi"
                  value={fmtHours(focusSummary.totalMinutes)}
                  detail={`${fmtCount(focusSummary.totalSessions)} phiên • ${focusSummary.avgSessionMinutes}p / phiên`}
                  accent={ACCENT2}
                />
                <OverviewRailStat
                  label="Khung giờ rõ nhất"
                  value={bestHourLabel}
                  detail={`${fmtHours(focusSummary.bestHour.minutes)} • ${fmtCount(focusSummary.bestHour.sessions)} phiên`}
                  accent="#9f7a63"
                />
                <OverviewRailStat
                  label="Tỷ lệ phiên sâu"
                  value={`${deepFocusRatio}%`}
                  detail={`${fmtCount(focusSummary.deepFocusCount)} phiên ≥ 60p`}
                  accent="#b88356"
                />
                <OverviewRailStat
                  label="Phiên nổi bật"
                  value={fmtHours(focusSummary.maxSessionMinutes)}
                  detail={focusSummary.bestDay.minutes > 0
                    ? `${focusSummary.bestDay.label} • ${fmtHours(focusSummary.bestDay.minutes)}`
                    : 'Chưa có ngày bứt lên rõ ràng'}
                  accent="#8e6b5c"
                />
              </div>
            </div>
          </Motion.section>

          <div
            className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '720px' }}
          >
            {focusSummary.sparseMode
              ? <CompactFocusTimeline summary={focusSummary} periodLabel={periodLabel} />
              : <YearHeatmap history={history} />}

            <FocusHourSpotlight summary={focusSummary} periodLabel={periodLabel} />
          </div>

          <div
            className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '640px' }}
          >
            <div
              className="rounded-[28px] p-4 md:p-5"
              style={{
                background: PANEL_BG,
                border: `1px solid ${PANEL_BORDER}`,
                boxShadow: '0 18px 42px rgba(15,23,42,0.06)',
              }}
            >
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>Phân Bổ Độ Dài Phiên</p>
                  <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
                    Mỗi dải cho biết nhóm độ dài nào đang giữ phần lớn nhịp tập trung trong {periodLabel.toLowerCase()}.
                  </p>
                </div>
                <div
                  className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold whitespace-nowrap"
                  style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                >
                  Nhịp TB {focusSummary.avgSessionMinutes}p
                </div>
              </div>

              <div className="space-y-3">
                {focusSummary.buckets.map((bucket) => {
                  const bucketScale = bucket.count > 0 ? bucket.count / focusSummary.maxBucket : 0;
                  const bucketShare = focusSummary.totalSessions > 0
                    ? Math.round((bucket.count / focusSummary.totalSessions) * 100)
                    : 0;

                  return (
                    <div key={bucket.label} className="grid grid-cols-[64px_minmax(0,1fr)_48px] items-center gap-3 md:grid-cols-[72px_minmax(0,1fr)_56px]">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold" style={{ color: TEXT_PRIMARY }}>{bucket.label}</p>
                        <p className="text-[10px]" style={{ color: TEXT_SOFT }}>{bucket.tone}</p>
                      </div>
                      <div
                        className="h-6 overflow-hidden rounded-full"
                        style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                      >
                        <Motion.div
                          initial={shouldReduceMotion ? undefined : { scaleX: 0 }}
                          animate={{ scaleX: bucketScale }}
                          transition={shouldReduceMotion ? { duration: 0 } : { duration: 0.45, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${bucket.accent}, ${bucket.accent}bb)`,
                            transformOrigin: 'left center',
                          }}
                        />
                      </div>
                      <div className="text-right">
                        <p className="text-[12px] font-semibold tabular-nums" style={{ color: TEXT_PRIMARY }}>{fmtCount(bucket.count)}</p>
                        <p className="text-[10px]" style={{ color: TEXT_SOFT }}>{bucketShare}%</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {focusSummary.recent30.length >= 3 && (
              <div
                className="rounded-[28px] p-4 md:p-5"
                style={{
                  background: PANEL_BG,
                  border: `1px solid ${PANEL_BORDER}`,
                  boxShadow: '0 18px 42px rgba(15,23,42,0.06)',
                }}
              >
                <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>30 Phiên Gần Nhất</p>
                    <p className="text-[12px] mt-1" style={{ color: TEXT_MUTED }}>
                      Trục dọc là số phút, và cột ngoài cùng bên phải là phiên mới nhất trong {periodLabel.toLowerCase()}.
                    </p>
                  </div>
                  <div className="w-fit sm:text-right">
                    <p className="text-xl font-semibold tabular-nums" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                      {focusSummary.recent7Avg}p
                    </p>
                    <p className="text-[10px]" style={{ color: TEXT_SOFT }}>Nhịp 7 phiên mới</p>
                  </div>
                </div>

                <BarChart data={focusSummary.recent30} valueKey="minutes" height={104} accentColor={ACCENT} />

                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    7 phiên mới · {fmtHours(focusSummary.recent7Minutes)}
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    7 phiên trước · {fmtHours(focusSummary.prev7Minutes)}
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{
                      background: focusMomentum > 0 ? `${ACCENT}12` : focusMomentum < 0 ? 'rgba(31,30,29,0.05)' : PANEL_BG_SOFT,
                      color: focusMomentum > 0 ? ACCENT2 : focusMomentum < 0 ? TEXT_PRIMARY : TEXT_MUTED,
                      border: focusMomentum > 0
                        ? '1px solid rgba(var(--accent-rgb), 0.18)'
                        : focusMomentum < 0
                          ? '1px solid rgba(31,30,29,0.10)'
                          : `1px solid ${PANEL_BORDER}`,
                    }}
                  >
                    {focusMomentum > 0 ? 'Mở rộng · ' : focusMomentum < 0 ? 'Chậm lại · ' : 'Giữ nhịp · '}{focusMomentum >= 0 ? '+' : ''}
                    {fmtHours(Math.abs(focusMomentum))}
                    {focusMomentumPct !== null ? ` (${focusMomentumPct >= 0 ? '+' : ''}${focusMomentumPct}%)` : ''}
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    Cụm giờ rõ nhất · {focusSummary.bestTimeBlock.label} · Nhịp TB {bestTimeBlockAverage}p
                  </div>
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    Nhịp mỗi ngày có phiên · {focusSummary.avgMinutesPerActiveDay}p
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
});

// ─── Tab: Phân Loại ───────────────────────────────────────────────────────────
const CAT_PERIODS = [
  { key: 'all',     label: 'Tất Cả' },
  { key: 'year',    label: 'Năm Nay' },
  { key: 'quarter', label: 'Quý Này' },
  { key: 'month',   label: 'Tháng Này' },
  { key: 'week',    label: 'Tuần Này' },
  { key: 'today',   label: 'Hôm Nay' },
];

function CategoryTab({ history, sessionCategories }) {
  const [catPeriod, setCatPeriod] = useState('all');

  const filteredHistory = useMemo(
    () => filterByPeriod(history, catPeriod),
    [history, catPeriod]
  );

  const catStats = useMemo(
    () => computeCategoryStats(filteredHistory, sessionCategories ?? []),
    [filteredHistory, sessionCategories]
  );

  const totalMins = catStats.reduce((s, c) => s + c.minutes, 0);
  const totalSess = catStats.reduce((s, c) => s + c.sessions, 0);
  const totalXP   = catStats.reduce((s, c) => s + c.xp, 0);
  const avgMinutesOverall = totalSess > 0 ? Math.round(totalMins / totalSess) : 0;

  const periodLabel = CAT_PERIODS.find((p) => p.key === catPeriod)?.label ?? '';

  const noData = catStats.length === 0 || totalSess === 0;
  const topTimeCat = catStats[0] ?? null;
  const topShare = topTimeCat && totalMins > 0 ? (topTimeCat.minutes / totalMins) * 100 : 0;
  const bestEfficiencyCat = catStats
    .filter((c) => c.minutes > 0)
    .reduce((best, cat) => {
      if (!best) return cat;
      return (cat.xp / cat.minutes) > (best.xp / best.minutes) ? cat : best;
    }, null);
  const longestAvgCat = catStats
    .filter((c) => c.sessions > 0)
    .reduce((best, cat) => {
      if (!best) return cat;
      return (cat.minutes / cat.sessions) > (best.minutes / best.sessions) ? cat : best;
    }, null);
  const leastUsedCat = catStats.length > 1
    ? [...catStats].sort((a, b) => a.minutes - b.minutes)[0]
    : null;

  const focusStyle = topShare >= 75
    ? 'Rất tập trung vào một loại chính'
    : topShare >= 55
      ? 'Có một loại chủ đạo khá rõ'
      : topShare >= 35
        ? 'Phân bổ tương đối cân bằng'
        : 'Phân bổ rất đa dạng giữa nhiều loại';

  const heroStats = [
    {
      label: 'Loại chủ đạo',
      value: topTimeCat?.label ?? '—',
      sub: topTimeCat ? `${topShare.toFixed(0)}% thời gian` : 'Chưa có dữ liệu',
      icon: getLabelMark(topTimeCat?.label, 'CD'),
      color: topTimeCat?.color ?? ACCENT,
    },
    {
      label: 'Nhịp hiệu quả nhất',
      value: bestEfficiencyCat ? `${(bestEfficiencyCat.xp / bestEfficiencyCat.minutes).toFixed(1)} XP/p` : '—',
      sub: bestEfficiencyCat?.label ?? 'Cần thêm dữ liệu',
      icon: getLabelMark(bestEfficiencyCat?.label, 'HQ'),
      color: bestEfficiencyCat?.color ?? '#0ea5e9',
    },
    {
      label: 'TB mỗi phiên',
      value: `${avgMinutesOverall}p`,
      sub: `${totalSess} phiên trong ${periodLabel.toLowerCase()}`,
      icon: 'TB',
      color: '#0ea5e9',
    },
    {
      label: 'Độ mở hiện tại',
      value: `${catStats.length} loại`,
      sub: focusStyle,
      icon: 'DM',
      color: '#8b5cf6',
    },
  ];

  const topInsights = [
    topTimeCat ? {
      key: 'top-time',
      title: 'Phần lớn thời gian hiện nằm ở',
      value: topTimeCat.label,
      sub: `${fmtHours(topTimeCat.minutes)} · ${topShare.toFixed(0)}%`,
      color: topTimeCat.color,
      icon: getLabelMark(topTimeCat.label, 'CD'),
    } : null,
    bestEfficiencyCat ? {
      key: 'best-eff',
      title: 'Nhóm đang cho hiệu quả rõ nhất',
      value: bestEfficiencyCat.label,
      sub: `${(bestEfficiencyCat.xp / bestEfficiencyCat.minutes).toFixed(1)} XP/p`,
      color: bestEfficiencyCat.color,
      icon: getLabelMark(bestEfficiencyCat.label, 'HQ'),
    } : null,
    longestAvgCat ? {
      key: 'longest',
      title: 'Nhóm có phiên trung bình dài nhất',
      value: longestAvgCat.label,
      sub: `${Math.round(longestAvgCat.minutes / longestAvgCat.sessions)}p / phiên`,
      color: longestAvgCat.color,
      icon: getLabelMark(longestAvgCat.label, 'DH'),
    } : null,
    leastUsedCat ? {
      key: 'least-used',
      title: 'Nhóm đang được dùng ít nhất',
      value: leastUsedCat.label,
      sub: `${fmtHours(leastUsedCat.minutes)} · ${leastUsedCat.sessions} phiên`,
      color: leastUsedCat.color,
      icon: getLabelMark(leastUsedCat.label, 'IT'),
    } : null,
  ].filter(Boolean);

  const advisor = useMemo(() => buildCategoryAdvisor({
    catStats,
    totalMins,
    totalSess,
    avgMinutesOverall,
    topTimeCat,
    topShare,
    bestEfficiencyCat,
    longestAvgCat,
    leastUsedCat,
    periodLabel,
  }), [
    catStats,
    totalMins,
    totalSess,
    avgMinutesOverall,
    topTimeCat,
    topShare,
    bestEfficiencyCat,
    longestAvgCat,
    leastUsedCat,
    periodLabel,
  ]);

  return (
    <div className="flex flex-col gap-4">

      {/* Period filter */}
      <div
        className="overflow-x-auto rounded-2xl p-1"
        style={{ background: TAB_BAR_BG, border: `1px solid ${PANEL_BORDER}` }}
      >
        <div className="inline-flex min-w-full gap-1">
          {CAT_PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setCatPeriod(p.key)}
              className="min-w-[90px] rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform,border-color] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2"
              style={catPeriod === p.key
                ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, borderColor: TAB_ACTIVE_BORDER }
                : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {noData ? (
        <div
          className="rounded-[30px] border px-5 py-8 md:px-6 md:py-9"
          style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
                Phân loại
              </p>
              <h3
                className="mt-3 text-[1.8rem] font-semibold leading-tight"
                style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
              >
                Chưa có dữ liệu cho {periodLabel.toLowerCase()}
              </h3>
              <p className="mt-3 max-w-[58ch] text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                Tab này cần vài phiên có gắn loại để bắt đầu đọc tỷ trọng thời gian, hiệu suất theo nhóm và độ lệch giữa các kiểu tập trung. Khi dữ liệu chưa đủ, tôi giữ phần này như một bề mặt định hướng thay vì đẩy chart trống ra trước mặt.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <div
                  className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                  style={{ background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                >
                  Nhóm đang có · {fmtCount(sessionCategories?.length ?? 0)} loại
                </div>
                {catPeriod !== 'all' && (
                  <div
                    className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: `${ACCENT}10`, color: ACCENT2, border: `1px solid rgba(201,100,66,0.16)` }}
                  >
                    Gợi ý · thử mở rộng sang “Tất cả”
                  </div>
                )}
              </div>
            </div>

            <div
              className="overflow-hidden rounded-[24px] border lg:min-w-[320px]"
              style={{ borderColor: PANEL_BORDER, background: PANEL_BG_SOFT }}
            >
              {[
                {
                  label: 'Khoảng đang xem',
                  value: periodLabel,
                  detail: 'Đổi khoảng ở phía trên để đọc theo ngày, tuần hay tháng.',
                },
                {
                  label: 'Loại chủ đạo',
                  value: 'Đang chờ',
                  detail: 'Cần thêm dữ liệu trước khi gọi tên nhóm đang chiếm phần lớn thời gian.',
                },
                {
                  label: 'Bước kế tiếp',
                  value: 'Gắn loại',
                  detail: 'Hoàn thành thêm vài phiên và nhớ chọn loại ngay khi bắt đầu.',
                },
              ].map((item, index) => (
                <div
                  key={item.label}
                  className="px-4 py-3.5"
                  style={{ borderTop: index === 0 ? 'none' : `1px solid ${PANEL_BORDER}` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                        {item.label}
                      </p>
                      <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                        {item.detail}
                      </p>
                    </div>
                    <p
                      className="shrink-0 text-right text-[1.05rem] font-semibold leading-tight"
                      style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                    >
                      {item.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Donut + legend */}
          <div
            className="rounded-[28px] p-5"
            style={{
              background: PANEL_BG,
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow: '0 20px 44px rgba(15,23,42,0.07)',
            }}
          >
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>Phân bổ thời gian</p>
                <p className="text-[12px]" style={{ color: TEXT_MUTED }}>Tỷ trọng thời gian tập trung của từng loại trong {periodLabel.toLowerCase()}.</p>
              </div>
              <div className="w-fit rounded-full px-3 py-1 text-[11px] font-semibold"
                   style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}`, color: TEXT_MUTED }}>
                {catStats.length} loại hoạt động
              </div>
            </div>
            <div className="grid items-start gap-5 lg:grid-cols-[320px_1fr]">
              <div className="rounded-[26px] p-4 md:p-5"
                   style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}>
                <CategoryDonutChart catStats={catStats} totalMins={totalMins} totalSess={totalSess} />
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {[
                    { label: 'Nhóm chủ đạo', value: `${topShare.toFixed(0)}%`, sub: topTimeCat?.label ?? '—' },
                    { label: 'Nhịp trung bình', value: `${avgMinutesOverall}p`, sub: `${totalSess} phiên` },
                    { label: 'Độ mở', value: `${catStats.length}`, sub: 'loại hoạt động' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl px-3 py-2.5 text-center"
                      style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
                    >
                      <p className="text-[15px] font-bold" style={{ color: TEXT_PRIMARY }}>{item.value}</p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>{item.label}</p>
                      <p className="text-[10px] mt-1 leading-tight" style={{ color: TEXT_MUTED }}>{item.sub}</p>
                    </div>
                  ))}
                </div>
              </div>
              {/* Legend */}
              <div className="space-y-3 min-w-0">
                {catStats.map((cat, index) => {
                  const pct = totalMins > 0 ? (cat.minutes / totalMins * 100).toFixed(0) : 0;
                  const avgXPPerMin = cat.minutes > 0 ? (cat.xp / cat.minutes).toFixed(1) : '0.0';
                  return (
                    <div
                      key={cat.id}
                      className="min-w-0 rounded-[24px] px-3.5 py-3 md:px-4"
                      style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}`, boxShadow: '0 10px 24px rgba(15,23,42,0.04)' }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                             style={{ background: PANEL_BG, color: TEXT_SOFT, border: `1px solid ${PANEL_BORDER}` }}>
                          {index + 1}
                        </div>
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
                             style={{ background: `${cat.color}18`, color: cat.color }}>
                          {cat.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <span className="text-sm font-semibold truncate block" style={{ color: TEXT_PRIMARY }}>
                                {cat.label}
                              </span>
                              <span className="text-[11px] mt-1 block" style={{ color: TEXT_MUTED }}>
                                {fmtHours(cat.minutes)} · {cat.sessions} phiên · {avgXPPerMin} XP/p
                              </span>
                            </div>
                            <div className="shrink-0 text-left sm:text-right">
                              <span className="text-xs font-bold block" style={{ color: cat.color }}>{pct}%</span>
                              <span className="text-[10px]" style={{ color: TEXT_SOFT }}>{fmtXPCompact(cat.xp)} XP</span>
                            </div>
                          </div>
                          <div className="mt-3 h-2 rounded-full overflow-hidden" style={{ background: PANEL_BG }}>
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${cat.color}, ${cat.color}aa)` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Biểu đồ Hiệu Suất XP/Phút ─────────────────────────────── */}
          {catStats.filter((c) => c.sessions > 0 && c.minutes > 0).length >= 2 && (
            <div
              className="rounded-[28px] p-5"
              style={{
                background: PANEL_BG,
                border: `1px solid ${PANEL_BORDER}`,
                boxShadow: '0 20px 44px rgba(15,23,42,0.07)',
              }}
            >
              <div className="mb-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-lg font-semibold" style={{ color: TEXT_PRIMARY }}>Hiệu suất theo phút</p>
                <span className="text-[11px]" style={{ color: TEXT_MUTED }}>kích thước bong bóng phản ánh nhịp xuất hiện</span>
              </div>
              <p className="text-[12px] mb-4" style={{ color: TEXT_MUTED }}>
                Mỗi bong bóng là một loại. Càng lên cao, loại đó càng cho hiệu quả rõ hơn; càng sang phải, thời lượng trung bình của mỗi phiên càng dài.
              </p>
              <CategoryScatterPlot catStats={catStats} />
              {/* Top performer */}
              {(() => {
                const withData = catStats.filter((c) => c.minutes > 0 && c.sessions >= 2);
                if (!withData.length) return null;
                const best = withData.reduce((a, b) =>
                  (b.xp / b.minutes) > (a.xp / a.minutes) ? b : a
                );
                return (
                  <div className="mt-4 grid gap-3 rounded-2xl px-4 py-3 sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                       style={{ background: `${best.color}14`, border: `1px solid ${best.color}40` }}>
                    <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg"
                         style={{ background: `${best.color}20`, color: best.color }}>
                      {best.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-semibold" style={{ color: best.color }}>{best.label}</span>
                      <span className="text-[12px] ml-1" style={{ color: TEXT_MUTED }}>đang cho tín hiệu hiệu quả rõ nhất</span>
                    </div>
                    <span className="text-sm font-bold sm:text-right" style={{ color: best.color }}>
                      {(best.xp / best.minutes).toFixed(1)} XP/p
                    </span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Category breakdown cards */}
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {catStats.map((cat) => {
            const pct    = totalMins > 0 ? (cat.minutes / totalMins) * 100 : 0;
            const avgMin = cat.sessions > 0 ? Math.round(cat.minutes / cat.sessions) : 0;
            const xpPerMin = cat.minutes > 0 ? (cat.xp / cat.minutes).toFixed(1) : '0.0';
            const badges = [
              topTimeCat?.id === cat.id ? 'Chủ đạo' : null,
              bestEfficiencyCat?.id === cat.id ? 'Hiệu quả rõ nhất' : null,
              longestAvgCat?.id === cat.id ? 'Phiên dài nhất' : null,
            ].filter(Boolean);
            return (
              <div
                key={cat.id}
                className="rounded-[28px] p-4 space-y-3"
                style={{
                  background: PANEL_BG,
                  border: `1px solid ${cat.color}30`,
                  boxShadow: '0 18px 40px rgba(15,23,42,0.06)',
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-lg shrink-0"
                         style={{ background: `${cat.color}18`, color: cat.color }}>
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{cat.label}</p>
                      <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                        {cat.sessions} phiên · {fmtHours(cat.minutes)}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {badges.map((badge) => (
                      <span
                        key={badge}
                        className="text-[10px] font-bold px-2.5 py-1 rounded-full"
                        style={{ background: `${cat.color}15`, color: cat.color, border: `1px solid ${cat.color}2d` }}
                      >
                        {badge}
                      </span>
                    ))}
                    <span className="text-xs font-bold px-3 py-1 rounded-full"
                      style={{ background: `${cat.color}18`, color: cat.color, border: `1px solid ${cat.color}33` }}>
                      {pct.toFixed(0)}% thời gian
                    </span>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="h-2.5 rounded-full overflow-hidden" style={{ background: PANEL_BG_SOFT }}>
                  <Motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.7, ease: 'easeOut' }}
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, ${cat.color}, ${cat.color}aa)` }}
                  />
                </div>
                {/* Stats row */}
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-5">
                  {[
                    { label: 'Phiên',         value: cat.sessions },
                    { label: 'Thời lượng',    value: fmtHours(cat.minutes) },
                    { label: 'Nhịp TB',       value: `${avgMin}p` },
                    { label: 'Hiệu quả',      value: xpPerMin },
                    { label: 'XP tích lũy',   value: cat.xp >= 1000 ? `${(cat.xp/1000).toFixed(1)}k` : cat.xp },
                  ].map((s, i) => (
                    <div
                      key={i}
                      className="rounded-2xl px-3 py-2 text-center"
                      style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                    >
                      <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>{s.value}</p>
                      <p className="text-[10px] uppercase tracking-[0.2em]" style={{ color: TEXT_SOFT }}>{s.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          </div>

          <div
            className="relative overflow-hidden rounded-[30px] p-5 md:p-6"
            style={{
              background: `linear-gradient(135deg, ${ACCENT}12 0%, ${ACCENT2}10 45%, ${PANEL_BG} 100%)`,
              border: `1px solid ${PANEL_BORDER}`,
              boxShadow: '0 24px 60px rgba(15,23,42,0.08)',
            }}
          >
            <div
              className="absolute right-[-40px] top-[-45px] h-36 w-36 rounded-full blur-3xl"
              style={{ background: `${ACCENT2}18` }}
            />
            <div
              className="absolute left-[-30px] bottom-[-40px] h-28 w-28 rounded-full blur-3xl"
              style={{ background: `${ACCENT}14` }}
            />
            <div className="relative grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                     style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}>
                  <span className="mono text-[9px] uppercase tracking-[0.14em]">DM</span>
                  <span>{periodLabel}</span>
                </div>
                <h3 className="mt-4 text-[28px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
                  Phân bổ loại hiện tại
                </h3>
                <p className="mt-2 max-w-[640px] text-[14px] leading-6" style={{ color: TEXT_MUTED }}>
                  {topTimeCat
                    ? `${topTimeCat.label} đang dẫn đầu với ${fmtHours(topTimeCat.minutes)}, chiếm ${topShare.toFixed(0)}% tổng thời gian. Nhìn tổng thể, phân bổ hiện tại là ${focusStyle.toLowerCase()}.`
                    : 'Hoàn thành thêm vài phiên có gắn loại để hệ thống bắt đầu đọc được phân bổ tập trung của anh.'}
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {topTimeCat && (
                    <div className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                      style={{ background: `${topTimeCat.color}16`, color: topTimeCat.color, border: `1px solid ${topTimeCat.color}33` }}>
                      Nhóm chủ đạo · {topTimeCat.label}
                    </div>
                  )}
                  {bestEfficiencyCat && (
                    <div className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                         style={{ background: `${bestEfficiencyCat.color}16`, color: bestEfficiencyCat.color, border: `1px solid ${bestEfficiencyCat.color}33` }}>
                      Nhóm hiệu quả nhất · {(bestEfficiencyCat.xp / bestEfficiencyCat.minutes).toFixed(1)} XP/p
                    </div>
                  )}
                  <div className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                       style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}>
                    Nhịp trung bình · {avgMinutesOverall}p / phiên
                  </div>
                  <div className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                       style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}>
                    Tổng XP · {fmtXPCompact(totalXP)}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {heroStats.map((item) => (
                  <div
                    key={item.label}
      className="rounded-[24px] px-4 py-4"
      style={{
        background: PANEL_BG,
        border: `1px solid ${PANEL_BORDER}`,
        boxShadow: '0 10px 24px rgba(31,30,29,0.05)',
      }}
    >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
                          {item.label}
                        </p>
                        <p className="mt-2 text-[22px] font-bold leading-tight break-words" style={{ color: TEXT_PRIMARY }}>
                          {item.value}
                        </p>
                        <p className="mt-1 text-[12px] leading-5" style={{ color: TEXT_MUTED }}>
                          {item.sub}
                        </p>
                      </div>
                      <div
                        className="mono w-11 h-11 rounded-2xl flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] shrink-0"
                        style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}2f` }}
                      >
                        {item.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {topInsights.length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {topInsights.map((item) => (
                <div
                  key={item.key}
                  className="rounded-[24px] px-4 py-3"
                  style={{
                    background: PANEL_BG,
                    border: `1px solid ${PANEL_BORDER}`,
                    boxShadow: '0 10px 24px rgba(31,30,29,0.05)',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="mono w-11 h-11 rounded-2xl flex items-center justify-center text-[9px] font-semibold uppercase tracking-[0.14em] shrink-0"
                      style={{ background: `${item.color}18`, color: item.color, border: `1px solid ${item.color}28` }}
                    >
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium leading-tight" style={{ color: TEXT_SOFT }}>{item.title}</p>
                      <p className="mt-1 text-[15px] font-semibold truncate" style={{ color: TEXT_PRIMARY }}>{item.value}</p>
                      <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>{item.sub}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.05fr_0.95fr]">
            <div
              className="rounded-[28px] p-5"
              style={{
                background: PANEL_BG,
                border: `1px solid ${PANEL_BORDER}`,
                boxShadow: '0 18px 42px rgba(15,23,42,0.06)',
              }}
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-semibold"
                       style={{ background: PANEL_BG_SOFT, color: TEXT_MUTED, border: `1px solid ${PANEL_BORDER}` }}>
                    <span>{advisor.mentorTone}</span>
                  </div>
                  <h4 className="mt-3 text-[22px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
                    {advisor.mentorHeadline}
                  </h4>
                  <p className="mt-2 text-[14px] leading-6" style={{ color: TEXT_MUTED }}>
                    {advisor.mentorBody}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                {advisor.mentorSignals.map((signal) => (
                  <div
                    key={signal.label}
                    className="rounded-[22px] px-4 py-3"
                    style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>
                      {signal.label}
                    </p>
                    <p className="mt-2 text-[18px] font-bold" style={{ color: signal.color }}>{signal.value}</p>
                    <p className="mt-1 text-[11px]" style={{ color: TEXT_MUTED }}>{signal.sub}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5">
                <p className="text-sm font-semibold" style={{ color: TEXT_PRIMARY }}>Gợi ý hành động</p>
                <div className="mt-3 space-y-2.5">
                  {advisor.recommendations.map((item, index) => (
                    <div
                      key={`${index}-${item}`}
                      className="flex items-start gap-3 rounded-2xl px-3 py-3"
                      style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                    >
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                           style={{ background: PANEL_BG, color: TEXT_PRIMARY, border: `1px solid ${PANEL_BORDER}` }}>
                        {index + 1}
                      </div>
                      <p className="text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {advisor.scenarios.map((scenario) => (
                <div
                  key={scenario.key}
                  className="rounded-[28px] p-4"
                  style={{
                    background: PANEL_BG,
                    border: `1px solid ${scenario.color}2a`,
                    boxShadow: '0 18px 42px rgba(15,23,42,0.05)',
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                      style={{ background: `${scenario.color}18`, color: scenario.color, border: `1px solid ${scenario.color}2d` }}
                    >
                      {scenario.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: TEXT_SOFT }}>
                        Hướng đi
                      </p>
                      <h5 className="mt-1 text-[18px] font-bold leading-tight" style={{ color: TEXT_PRIMARY }}>
                        {scenario.title}
                      </h5>
                      <p className="mt-2 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
                        {scenario.summary}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    {scenario.steps.map((step, index) => (
                      <div
                        key={`${scenario.key}-${index}`}
                        className="flex items-start gap-3 rounded-2xl px-3 py-2.5"
                        style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{ background: `${scenario.color}18`, color: scenario.color, border: `1px solid ${scenario.color}2d` }}
                        >
                          {index + 1}
                        </div>
                        <p className="text-[12px] leading-5" style={{ color: TEXT_MUTED }}>
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Tab: Nhật Ký Phiên ───────────────────────────────────────────────────────
function JournalTab({ history, sessionCategories }) {
  const [filterCat,    setFilterCat]    = useState(null); // null = tất cả
  const [page,         setPage]         = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null); // id phiên đang chờ xác nhận
  const [confirmDeleteNoteSessionId, setConfirmDeleteNoteSessionId] = useState(null);
  const [editingCategorySessionId, setEditingCategorySessionId] = useState(null);
  const deleteSession = useGameStore((s) => s.deleteSession);
  const deleteSavedNoteEntry = useGameStore((s) => s.deleteSavedNoteEntry);
  const deletableSessionId = useGameStore((s) => s.latestSessionUndo?.sessionId ?? null);
  const updateSessionCategory = useGameStore((s) => s.updateSessionCategory);
  const reviewCompletedSession = useGameStore((s) => s.reviewCompletedSession);
  const PAGE_SIZE = 20;

  // Tạo lookup category
  const catMap = useMemo(() => {
    const m = {};
    (sessionCategories ?? []).forEach((c) => { m[c.id] = c; });
    m['__none__'] = { id: '__none__', label: 'Chưa gắn loại', color: '#475569', icon: '❓' };
    return m;
  }, [sessionCategories]);

  const filtered = useMemo(() => {
    if (!filterCat) return history;
    return history.filter((h) => {
      return resolveEntryCategory(h, catMap).id === filterCat;
    });
  }, [history, filterCat, catMap]);

  const categoryCounts = useMemo(() => {
    const counts = new Map();
    history.forEach((entry) => {
      const catId = resolveEntryCategory(entry, catMap).id;
      counts.set(catId, (counts.get(catId) ?? 0) + 1);
    });
    return counts;
  }, [history, catMap]);

  const paged   = filtered.slice(0, (page + 1) * PAGE_SIZE);
  const hasMore = paged.length < filtered.length;

  // Danh sách category có trong history
  const usedCats = useMemo(() => {
    const seen = new Map();
    history.forEach((entry) => {
      const cat = resolveEntryCategory(entry, catMap);
      if (!seen.has(cat.id)) {
        seen.set(cat.id, cat);
      }
    });
    return [...seen.values()];
  }, [history, catMap]);

  const journalSummary = useMemo(() => {
    return filtered.reduce((acc, entry) => {
      if (entry.note || entry.breakNote) acc.noted += 1;
      if (getSessionGoalText(entry)) acc.withGoal += 1;
      if (isSessionReviewed(entry)) acc.reviewed += 1;
      if ((entry.minutes ?? 0) >= 45) acc.deep += 1;
      return acc;
    }, {
      noted: 0,
      withGoal: 0,
      reviewed: 0,
      deep: 0,
    });
  }, [filtered]);

  const activeFilterLabel = filterCat
    ? resolveEntryCategory({ categoryId: filterCat }, catMap).label
    : 'Tất cả phiên';

  if (history.length === 0) {
    return (
      <div
        className="rounded-[28px] border px-6 py-12 text-center"
        style={{ background: BG_CARD, borderColor: PANEL_BORDER }}
      >
        <p className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: TEXT_SOFT }}>
          Nhật ký
        </p>
        <h3 className="mt-3 text-[1.9rem] font-semibold leading-tight" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
          Nhật ký còn trống.
        </h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6" style={{ color: TEXT_MUTED }}>
          Khi hoàn thành vài phiên đầu tiên, bảng này sẽ chuyển thành sổ ghi chép của toàn bộ nhịp làm việc.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="rounded-[28px] border px-5 py-5"
        style={{ background: BG_CARD, borderColor: PANEL_BORDER }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: TEXT_SOFT }}>
              Lưu trữ
            </p>
            <h3 className="mt-3 text-[1.9rem] font-semibold leading-tight" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
              Nhật ký của các phiên đã hoàn thành.
            </h3>
            <p className="mt-3 max-w-2xl text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
              Khối này giữ lại nhịp, mốc XP, ghi chú và phần tự chấm theo đúng thứ tự thời gian. Bộ lọc phía dưới giúp soi từng nhóm phiên mà không làm mất cảm giác của một cuốn sổ đang được bổ sung dần.
            </p>
            <p className="mt-2 max-w-2xl text-[12px] leading-5" style={{ color: TEXT_SOFT }}>
              Xóa phiên vẫn chỉ mở cho phiên mới nhất. Riêng ghi chú cũ, bạn có thể gỡ trực tiếp trong từng bản ghi bên dưới.
            </p>
          </div>
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, borderColor: FILTER_PILL_BORDER }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>Đang xem</span>
            <span>{activeFilterLabel}</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: 'Phiên hiển thị', value: fmtCount(filtered.length), sub: `${fmtCount(history.length)} phiên toàn bộ` },
            { label: 'Có ghi chú', value: fmtCount(journalSummary.noted), sub: 'có ghi chú trong phiên hoặc lúc nghỉ' },
            { label: 'Đã tự chấm', value: fmtCount(journalSummary.reviewed), sub: `${fmtCount(journalSummary.withGoal)} phiên có mục tiêu` },
            { label: 'Phiên sâu', value: fmtCount(journalSummary.deep), sub: 'phiên từ 45 phút trở lên' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] px-4 py-3"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>{item.label}</p>
              <p className="mt-2 text-[1.35rem] font-semibold leading-none" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                {item.value}
              </p>
              <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter pills */}
      {usedCats.length > 1 && (
        <div
          className="overflow-x-auto rounded-2xl p-1"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
        >
          <div className="inline-flex min-w-full gap-1">
            <button
              type="button"
              onClick={() => { setFilterCat(null); setPage(0); }}
              className="min-w-[104px] rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2"
              style={!filterCat
                ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, borderColor: TAB_ACTIVE_BORDER, boxShadow: TAB_ACTIVE_SHADOW }
                : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER }}
            >
              Tất cả ({fmtCount(history.length)})
            </button>
            {usedCats.map((cat) => {
              const cnt = categoryCounts.get(cat.id) ?? 0;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setFilterCat(cat.id); setPage(0); }}
                  className="min-w-[118px] rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2"
                  style={filterCat === cat.id
                    ? { background: `${cat.color}18`, color: cat.color, borderColor: `${cat.color}55`, boxShadow: `0 10px 20px ${cat.color}14` }
                    : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER }}
                >
                  {cat.icon} {cat.label} ({fmtCount(cnt)})
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Session rows */}
      <div className="space-y-1.5">
        {paged.map((h, idx) => {
          const cat = resolveEntryCategory(h, catMap);
          const goalText = getSessionGoalText(h);
          const nextNoteText = getSessionNextNoteText(h);
          const reviewMeta = getSessionReviewMeta(h);
          const tierShort = h.tier?.includes('×2.0') ? '×2.0'
            : h.tier?.includes('Sâu') ? '×1.3'
            : '×1.0';
          const hasEvent = !!h.positiveEvent;
          const comboVal = h.comboCount ?? 1;
          const pauseSegments = Array.isArray(h.pauseSegments) ? h.pauseSegments : [];
          const pauseCount = pauseSegments.length;
          const pausedTotalMs = Number.isFinite(h.pausedTotalMs)
            ? h.pausedTotalMs
            : pauseSegments.reduce((sum, segment) => (
              sum + Math.max(0, Number(segment?.durationMs) || (
                new Date(segment?.endedAt).getTime() - new Date(segment?.startedAt).getTime()
              ))
            ), 0);
          const wallClockDurationMs = Number.isFinite(h.wallClockDurationMs)
            ? h.wallClockDurationMs
            : (h.startedAt && h.finishedAt
              ? Math.max(0, new Date(h.finishedAt).getTime() - new Date(h.startedAt).getTime())
              : null);
          const startedAtLabel = formatExactDateTime(h.startedAt);
          const finishedAtLabel = formatExactDateTime(h.finishedAt ?? h.timestamp);
          const hasTimingDetails = Boolean(
            startedAtLabel ||
            finishedAtLabel ||
            wallClockDurationMs !== null ||
            pauseCount > 0 ||
            pausedTotalMs > 0
          );

          const isConfirming = confirmDelete === h.id;
          const isConfirmingNoteDelete = confirmDeleteNoteSessionId === h.id;
          const isEditingCategory = editingCategorySessionId === h.id;
          const canDeleteThisSession = h.id === deletableSessionId;

          return (
            <Motion.div
              key={h.id ?? idx}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1,  x: 0  }}
              transition={{ delay: Math.min(idx * 0.02, 0.3) }}
              className="group rounded-[24px] border px-4 py-4 shadow-sm"
              style={{
                background: JOURNAL_ROW_BG,
                borderColor: JOURNAL_ROW_BORDER,
                borderLeft: `4px solid ${cat?.color ?? '#334155'}`,
                boxShadow: '0 12px 24px rgba(15,23,42,0.06)',
              }}
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div
                      className="mono flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[8px] font-semibold uppercase tracking-[0.14em]"
                      style={{ background: `${cat?.color ?? '#475569'}14`, color: cat?.color ?? '#475569', border: `1px solid ${(cat?.color ?? '#475569')}28` }}
                    >
                      {getLabelMark(cat?.label, 'DM')}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold" style={{ color: cat?.color ?? '#475569' }}>
                          {cat?.label ?? 'Chưa gắn loại'}
                        </p>
                        {reviewMeta && <SessionReviewBadge entry={h} compact />}
                        <button
                          type="button"
                          onClick={() => setEditingCategorySessionId(isEditingCategory ? null : h.id)}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2"
                          style={cat?.id === '__none__'
                            ? {
                                background: 'rgba(201,100,66,0.10)',
                                color: ACCENT2,
                                borderColor: 'rgba(201,100,66,0.18)',
                              }
                            : {
                                background: FILTER_PILL_BG,
                                color: TEXT_MUTED,
                                borderColor: FILTER_PILL_BORDER,
                              }}
                        >
                          {cat?.id === '__none__' ? 'Gắn loại' : 'Đổi loại'}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
                        <p
                          className="text-[1.4rem] font-semibold leading-none tabular-nums"
                          style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                        >
                          {h.minutes}p
                        </p>
                        <p className="text-[11px]" style={{ color: TEXT_MUTED }}>
                          {timeAgo(h.timestamp)}
                        </p>
                        <p className="text-[11px] font-medium" style={{ color: TEXT_SOFT }}>
                          {tierShort}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex items-center gap-1">
                    {canDeleteThisSession && isConfirming ? (
                      <>
                        <button
                          onClick={() => { deleteSession(h.id); setConfirmDelete(null); }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                          title="Xác nhận xoá"
                        >
                          Xoá
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                          style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}
                          title="Huỷ"
                        >
                          ✕
                        </button>
                      </>
                    ) : canDeleteThisSession ? (
                      <button
                        onClick={() => setConfirmDelete(h.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-100 transition-[background-color,color,opacity,transform] duration-200 hover:-translate-y-px sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                        title="Xoá phiên này"
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 3h8M5 3V2h2v1M4 3l.5 6.5M8 3l-.5 6.5M3 3.5l.5 6a.5.5 0 00.5.5h4a.5.5 0 00.5-.5l.5-6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                  <div
                    className="rounded-[18px] px-3 py-2.5"
                    style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>XP</p>
                    <p className="mt-2 text-[1rem] font-semibold font-mono leading-none" style={{ color: ACCENT2 }}>
                      +{(h.xpEarned ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div
                    className="rounded-[18px] px-3 py-2.5"
                    style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>Sự kiện</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {h.jackpot && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(201,100,66,0.12)', color: ACCENT2 }}>Thưởng lớn</span>}
                      {((h.refinedEarned ?? 0) > 0 || (h.minutes ?? 0) >= 45) && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(148,163,184,0.18)', color: TEXT_MUTED }}>Tinh luyện</span>}
                      {hasEvent && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--accent-rgb), 0.14)', color: ACCENT2 }}>Mốc phụ</span>}
                      {comboVal >= 2 && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(138,63,36,0.12)', color: ACCENT2 }}>Chuỗi ×{comboVal}</span>}
                      {!h.jackpot && !((h.refinedEarned ?? 0) > 0 || (h.minutes ?? 0) >= 45) && !hasEvent && comboVal < 2 && (
                        <span className="text-[11px]" style={{ color: TEXT_MUTED }}>Phiên gọn, không có lớp thưởng phụ.</span>
                      )}
                    </div>
                  </div>
                  <div
                    className="rounded-[18px] px-3 py-2.5"
                    style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>Nhịp thực tế</p>
                    <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                      {wallClockDurationMs !== null ? formatPreciseDuration(wallClockDurationMs) : 'Không có'}
                    </p>
                  </div>
                  <div
                    className="rounded-[18px] px-3 py-2.5"
                    style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>Tạm dừng</p>
                    <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                      {pauseCount > 0 ? `${pauseCount} lần • ${formatPreciseDuration(pausedTotalMs)}` : 'Không có'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {isEditingCategory && (
                    <div
                      className="rounded-[20px] px-3.5 py-3.5 space-y-3"
                      style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: TEXT_SOFT }}>
                            Phân loại
                          </p>
                          <p className="mt-1 text-[12px] leading-5" style={{ color: TEXT_MUTED }}>
                            Đổi lại loại của phiên này để nhật ký và thống kê phản ánh đúng nhịp làm việc.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingCategorySessionId(null)}
                          className="w-fit text-[10px] font-semibold"
                          style={{ color: TEXT_MUTED }}
                        >
                          Đóng
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            updateSessionCategory(h.id, null);
                            setEditingCategorySessionId(null);
                          }}
                          className="px-3 py-1 rounded-full text-[10px] font-medium border transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px"
                          style={cat?.id === '__none__'
                            ? { background: FILTER_PILL_ACTIVE_BG, color: FILTER_PILL_ACTIVE_TEXT, borderColor: FILTER_PILL_ACTIVE_BORDER, boxShadow: TAB_ACTIVE_SHADOW }
                            : { background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, borderColor: FILTER_PILL_BORDER }}
                        >
                          ❓ Chưa gắn loại
                        </button>
                        {(sessionCategories ?? []).map((option) => {
                          const active = h.categoryId === option.id;
                          return (
                            <button
                              key={`${h.id}_${option.id}`}
                              type="button"
                              onClick={() => {
                                updateSessionCategory(h.id, option.id);
                                setEditingCategorySessionId(null);
                              }}
                              className="px-3 py-1 rounded-full text-[10px] font-medium border transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px"
                              style={active
                                ? {
                                    background: `${option.color}20`,
                                    color: option.color,
                                    borderColor: `${option.color}55`,
                                    boxShadow: `0 8px 18px ${option.color}14`,
                                  }
                                : { background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, borderColor: FILTER_PILL_BORDER }}
                            >
                              {option.icon} {option.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {hasTimingDetails && (
                    <div
                      className="rounded-[20px] px-3.5 py-3.5 space-y-3"
                      style={{ background: JOURNAL_PANEL_BG, border: `1px solid ${JOURNAL_PANEL_BORDER}` }}
                    >
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: JOURNAL_PANEL_TITLE }}>
                            Dòng thời gian phiên
                          </p>
                          <p className="mt-1 text-[12px] leading-5" style={{ color: JOURNAL_PANEL_MUTED }}>
                            Mốc bắt đầu, kết thúc và các lần ngắt nhịp của phiên này.
                          </p>
                        </div>
                        <div
                          className="w-fit rounded-full px-3 py-1 text-[10px] font-semibold"
                          style={{ background: JOURNAL_PANEL_SUB_BG, color: JOURNAL_PANEL_TEXT, border: `1px solid ${JOURNAL_PANEL_BORDER}` }}
                        >
                          {pauseCount > 0 ? `${pauseCount} lần tạm dừng` : 'Không tạm dừng'}
                        </div>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                        {startedAtLabel && (
                          <div className="rounded-[16px] px-3 py-2.5" style={{ background: JOURNAL_PANEL_SUB_BG }}>
                            <p className="text-[10px]" style={{ color: JOURNAL_PANEL_MUTED }}>Bắt đầu</p>
                            <p className="mt-1 text-[11px] leading-snug tabular-nums" style={{ color: JOURNAL_PANEL_TEXT }}>{startedAtLabel}</p>
                          </div>
                        )}
                        {finishedAtLabel && (
                          <div className="rounded-[16px] px-3 py-2.5" style={{ background: JOURNAL_PANEL_SUB_BG }}>
                            <p className="text-[10px]" style={{ color: JOURNAL_PANEL_MUTED }}>Kết thúc</p>
                            <p className="mt-1 text-[11px] leading-snug tabular-nums" style={{ color: JOURNAL_PANEL_TEXT }}>{finishedAtLabel}</p>
                          </div>
                        )}
                        {wallClockDurationMs !== null && (
                          <div className="rounded-[16px] px-3 py-2.5" style={{ background: JOURNAL_PANEL_SUB_BG }}>
                            <p className="text-[10px]" style={{ color: JOURNAL_PANEL_MUTED }}>Phiên kéo dài thực tế</p>
                            <p className="mt-1 text-[11px] leading-snug tabular-nums" style={{ color: JOURNAL_PANEL_TEXT }}>
                              {formatPreciseDuration(wallClockDurationMs)}
                            </p>
                          </div>
                        )}
                        <div className="rounded-[16px] px-3 py-2.5" style={{ background: JOURNAL_PANEL_SUB_BG }}>
                          <p className="text-[10px]" style={{ color: JOURNAL_PANEL_MUTED }}>Tạm dừng</p>
                          <p className="mt-1 text-[11px] leading-snug tabular-nums" style={{ color: JOURNAL_PANEL_TEXT }}>
                            {pauseCount > 0
                              ? `${pauseCount} lần • ${formatPreciseDuration(pausedTotalMs)}`
                              : 'Không có'}
                          </p>
                        </div>
                      </div>

                      {pauseCount > 0 && (
                        <div className="grid gap-2 border-t pt-3 sm:grid-cols-2" style={{ borderColor: JOURNAL_PANEL_BORDER }}>
                          {pauseSegments.map((segment, pauseIdx) => {
                            const pauseStartedAt = formatExactDateTime(segment?.startedAt);
                            const pauseEndedAt = formatExactDateTime(segment?.endedAt);
                            const pauseDurationMs = Math.max(
                              0,
                              Number(segment?.durationMs) || (
                                new Date(segment?.endedAt).getTime() - new Date(segment?.startedAt).getTime()
                              ),
                            );

                            return (
                              <div
                                key={`${h.id ?? idx}_pause_${pauseIdx}`}
                                className="rounded-[16px] px-3 py-2.5"
                                style={{ background: JOURNAL_PANEL_SUB_BG }}
                              >
                                <p className="text-[10px] font-medium" style={{ color: TEXT_MUTED }}>
                                  Tạm dừng {pauseIdx + 1}
                                </p>
                                <p className="mt-1 text-[11px] leading-snug tabular-nums" style={{ color: JOURNAL_PANEL_TEXT }}>
                                  {pauseStartedAt ?? 'Không rõ'} → {pauseEndedAt ?? 'Không rõ'}
                                </p>
                                <p className="mt-1 text-[10px]" style={{ color: JOURNAL_PANEL_MUTED }}>
                                  Kéo dài {formatPreciseDuration(pauseDurationMs)}
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {(goalText || nextNoteText || reviewMeta) && (
                    <div className="grid gap-2 lg:grid-cols-2">
                      {(goalText || reviewMeta) && (
                        <div
                          className="rounded-[20px] px-3.5 py-3.5"
                          style={{ background: NOTE_PANEL_BG, border: `1px solid ${NOTE_PANEL_BORDER}` }}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                                Đánh giá phiên vừa xong
                              </p>
                              {goalText ? (
                                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: NOTE_PANEL_TEXT, whiteSpace: 'pre-wrap' }}>
                                  {goalText}
                                </p>
                              ) : (
                                <p className="mt-2 text-[11px] leading-relaxed" style={{ color: TEXT_MUTED }}>
                                  Phiên này đã có kết quả tự chấm nhưng không lưu mục tiêu bằng chữ.
                                </p>
                              )}
                              {goalText && (
                                <SessionReviewControls
                                  achieved={h.goalAchieved}
                                  onPick={(goalAchieved) => {
                                    reviewCompletedSession(h.id, { goal: goalText, goalAchieved });
                                  }}
                                />
                              )}
                            </div>
                            {reviewMeta && <SessionReviewBadge entry={h} />}
                          </div>
                        </div>
                      )}
                      {nextNoteText && (
                        <div
                          className="rounded-[20px] px-3.5 py-3.5"
                          style={{ background: NOTE_PANEL_BG, border: `1px solid ${NOTE_PANEL_BORDER}` }}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                            Ghi chú cho lần sau
                          </p>
                          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: NOTE_PANEL_TEXT, whiteSpace: 'pre-wrap' }}>
                            {nextNoteText}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {(h.note || h.breakNote) && (
                    <div className="grid gap-2 lg:grid-cols-2">
                      <div
                        className="lg:col-span-2 rounded-[20px] px-3.5 py-3.5 space-y-3"
                        style={{ background: NOTE_PANEL_BG, border: `1px solid ${NOTE_PANEL_BORDER}` }}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                              Ghi chú đã lưu
                            </p>
                            <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                              Xóa ở đây sẽ đồng thời gỡ bản ghi khỏi tab Ghi chú.
                            </p>
                          </div>
                          {isConfirmingNoteDelete ? (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  deleteSavedNoteEntry({ sessionId: h.id });
                                  setConfirmDeleteNoteSessionId(null);
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                                style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                              >
                                Xoá ghi chú
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteNoteSessionId(null)}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                                style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}
                              >
                                Huỷ
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteNoteSessionId(h.id)}
                              className="w-fit rounded-full border px-3 py-1 text-[10px] font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2"
                              style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', borderColor: 'rgba(239,68,68,0.24)' }}
                            >
                              Xoá ghi chú cũ
                            </button>
                          )}
                        </div>

                        <div className="grid gap-2 lg:grid-cols-2">
                          {h.note && (
                            <div
                              className="rounded-[18px] px-3.5 py-3.5"
                              style={{ background: 'rgba(15,23,42,0.18)', border: `1px solid ${NOTE_PANEL_BORDER}` }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                                Ghi chú tập trung
                              </p>
                              <RichTextView
                                value={h.note}
                                compact
                                className="mt-2"
                                style={{ color: NOTE_PANEL_TEXT }}
                              />
                            </div>
                          )}
                          {h.breakNote && (
                            <div
                              className="rounded-[18px] px-3.5 py-3.5"
                              style={{ background: 'rgba(15,23,42,0.18)', border: `1px solid ${NOTE_PANEL_BORDER}` }}
                            >
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                                Ghi chú giải lao
                              </p>
                              <RichTextView
                                value={h.breakNote}
                                compact
                                className="mt-2"
                                style={{ color: NOTE_PANEL_TEXT }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                </div>
            </Motion.div>
          );
        })}
      </div>

      {/* Load more */}
      {hasMore && (
        <button
          onClick={() => setPage((p) => p + 1)}
          className="w-full py-2.5 rounded-xl text-sm font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px"
          style={{ background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, borderColor: FILTER_PILL_BORDER }}
        >
          Xem thêm ({filtered.length - paged.length} phiên)
        </button>
      )}

      {/* Empty after filter */}
      {filtered.length === 0 && (
        <div
          className="rounded-[24px] border px-6 py-10 text-center"
          style={{ background: BG_CARD, borderColor: PANEL_BORDER }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
            Bộ lọc hiện tại
          </p>
          <p className="mt-2 text-sm" style={{ color: TEXT_MUTED }}>Không có phiên nào khớp với lựa chọn này.</p>
        </div>
      )}
    </div>
  );
}

// ─── NotesTab ─────────────────────────────────────────────────────────────────
function NotesTab({ savedNotes, sessionCategories }) {
  const [confirmDeleteNoteId, setConfirmDeleteNoteId] = useState(null);
  const deleteSavedNoteEntry = useGameStore((s) => s.deleteSavedNoteEntry);
  const catMap = useMemo(() => {
    const m = {};
    (sessionCategories ?? []).forEach((c) => { m[c.id] = c; });
    m['__none__'] = { id: '__none__', label: 'Chưa gắn loại', color: '#475569', icon: '❓' };
    return m;
  }, [sessionCategories]);

  const notesSummary = useMemo(() => {
    return savedNotes.reduce((acc, entry) => {
      if (entry.note) acc.focusNotes += 1;
      if (entry.breakNote) acc.breakNotes += 1;
      if ((entry.comboCount ?? 1) >= 2) acc.comboNotes += 1;
      return acc;
    }, {
      focusNotes: 0,
      breakNotes: 0,
      comboNotes: 0,
    });
  }, [savedNotes]);

  return (
    <div className="space-y-4">

      <div
        className="rounded-[28px] border px-5 py-5"
        style={{ background: BG_CARD, borderColor: PANEL_BORDER }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em]" style={{ color: TEXT_SOFT }}>
              Lưu trữ
            </p>
            <h3 className="mt-3 text-[1.9rem] font-semibold leading-tight" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
              Ghi chép được giữ lại sau mỗi phiên.
            </h3>
            <p className="mt-3 max-w-2xl text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
              Khối này giữ lại bản sao của ghi chú tập trung và ghi chú giải lao. Nó vận hành như một kho lưu trữ yên tĩnh để nhìn lại ý định, vấn đề và điều cần tiếp tục ở phiên kế tiếp.
            </p>
            <p className="mt-2 max-w-2xl text-[12px] leading-5" style={{ color: TEXT_SOFT }}>
              Bạn có thể xóa từng ghi chú cũ ở đây. Nếu ghi chú đó vẫn gắn với một phiên trong nhật ký, phần note ở tab Nhật ký cũng sẽ được gỡ theo.
            </p>
          </div>
          <div
            className="inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-[11px] font-semibold"
            style={{ background: FILTER_PILL_BG, color: FILTER_PILL_TEXT, borderColor: FILTER_PILL_BORDER }}
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>Lưu trữ</span>
            <span>{fmtCount(savedNotes.length)} mục</span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            { label: 'Ghi chú đã lưu', value: fmtCount(savedNotes.length), sub: 'toàn bộ mục đã giữ lại' },
            { label: 'Ghi chú tập trung', value: fmtCount(notesSummary.focusNotes), sub: 'có ghi chú trong phiên' },
            { label: 'Ghi chú giải lao', value: fmtCount(notesSummary.breakNotes), sub: 'có ghi chú lúc nghỉ' },
            { label: 'Phiên nối chuỗi', value: fmtCount(notesSummary.comboNotes), sub: 'chuỗi từ ×2 trở lên' },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[22px] px-4 py-3"
              style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>{item.label}</p>
              <p className="mt-2 text-[1.35rem] font-semibold leading-none" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}>
                {item.value}
              </p>
              <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>{item.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Saved notes archive */}
      <div>
        <p className="mb-2 px-0.5 text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
          Các bản ghi đã lưu ({savedNotes.length})
        </p>

        {savedNotes.length === 0 ? (
          <div
            className="rounded-[26px] border px-6 py-12 text-center"
            style={{ background: BG_CARD, borderColor: PANEL_BORDER }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>
              Ghi chú
            </p>
            <p className="mt-3 text-sm" style={{ color: TEXT_MUTED }}>Chưa có ghi chú nào được lưu.</p>
            <p className="mt-1 text-xs" style={{ color: TEXT_SOFT }}>Viết ghi chú trong phần Tập trung rồi hoàn thành một phiên để bắt đầu kho lưu trữ này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {savedNotes.map((entry, idx) => {
              const cat = resolveEntryCategory(entry, catMap);
              const accent = cat?.color ?? '#475569';
              const dateStr = formatVietnamDate(entry.timestamp, { day: '2-digit', month: '2-digit' });
              const timeStr = formatVietnamTime(entry.timestamp, { hour: '2-digit', minute: '2-digit' });
              const noteCount = Number(Boolean(entry.note)) + Number(Boolean(entry.breakNote));
              const isConfirmingDelete = confirmDeleteNoteId === entry.id;
              return (
                <Motion.div
                  key={entry.id ?? idx}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  className="rounded-[28px] border px-4 py-4 space-y-3.5"
                  style={{ background: BG_CARD, borderColor: PANEL_BORDER, borderLeft: `4px solid ${accent}`, boxShadow: '0 12px 26px rgba(31,30,29,0.05)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        className="mono flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-[8px] font-semibold uppercase tracking-[0.14em]"
                        style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}28` }}
                      >
                        {getLabelMark(cat?.label, 'DM')}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-semibold" style={{ color: accent }}>
                            {cat?.label ?? 'Chưa gắn loại'}
                          </span>
                          <span
                            className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                            style={{ background: BADGE_BG, color: BADGE_TEXT }}
                          >
                            {entry.minutes}p
                          </span>
                          {entry.tier && (
                            <span
                              className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                              style={{ background: BADGE_STRONG_BG, color: BADGE_STRONG_TEXT }}
                            >
                              {entry.tier}
                            </span>
                          )}
                        </div>
                        <p
                          className="mt-2 text-[1.28rem] font-semibold leading-tight"
                          style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT }}
                        >
                          Bản ghi của phiên {entry.minutes} phút
                        </p>
                        <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                          {timeStr} · +{(entry.xpEarned ?? 0).toLocaleString()} XP
                          {(entry.comboCount ?? 1) >= 2 ? ` · Chuỗi ×${entry.comboCount}` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <div
                        className="inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px]"
                        style={{ background: FILTER_PILL_BG, color: TEXT_SOFT, border: `1px solid ${FILTER_PILL_BORDER}` }}
                      >
                        {dateStr}
                      </div>
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              deleteSavedNoteEntry({
                                noteId: entry.id ?? null,
                                sessionId: entry.sourceSessionId ?? null,
                              });
                              setConfirmDeleteNoteId(null);
                            }}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                            style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                          >
                            Xoá
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteNoteId(null)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                            style={{ background: 'rgba(100,116,139,0.2)', color: '#94a3b8', border: '1px solid rgba(100,116,139,0.3)' }}
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteNoteId(entry.id)}
                          className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2"
                          style={{ background: 'rgba(239,68,68,0.10)', color: '#f87171', borderColor: 'rgba(239,68,68,0.24)' }}
                        >
                          Xoá ghi chú
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Thời lượng', value: `${entry.minutes}p`, sub: 'nhịp đặt cho phiên' },
                      { label: 'XP', value: `+${(entry.xpEarned ?? 0).toLocaleString()}`, sub: 'thành quả đã ghi nhận' },
                      { label: 'Ghi chép', value: `${noteCount} mục`, sub: noteCount > 1 ? 'cả phiên và giải lao' : 'một phần đã được lưu' },
                      { label: 'Nhịp thưởng', value: entry.tier ?? 'Phiên chuẩn', sub: (entry.comboCount ?? 1) >= 2 ? `combo ×${entry.comboCount}` : 'không có combo phụ' },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-[18px] px-3 py-2.5"
                        style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>
                          {item.label}
                        </p>
                        <p className="mt-2 text-[1rem] font-semibold leading-none break-words" style={{ color: TEXT_PRIMARY }}>
                          {item.value}
                        </p>
                        <p className="mt-2 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                          {item.sub}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-2 md:grid-cols-2">
                    {entry.note && (
                      <div
                        className="rounded-[20px] px-3.5 py-3.5"
                        style={{ background: NOTE_PANEL_BG, border: `1px solid ${NOTE_PANEL_BORDER}` }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                          Ghi chú tập trung
                        </p>
                        <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                          Điều đã được giữ lại ngay trong lúc làm việc.
                        </p>
                        <RichTextView
                          value={entry.note}
                          className="mt-2"
                          style={{ color: NOTE_PANEL_TEXT }}
                        />
                      </div>
                    )}
                    {entry.breakNote && (
                      <div
                        className="rounded-[20px] px-3.5 py-3.5"
                        style={{ background: NOTE_PANEL_BG, border: `1px solid ${NOTE_PANEL_BORDER}` }}
                      >
                        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                          Ghi chú giải lao
                        </p>
                        <p className="mt-1 text-[11px] leading-5" style={{ color: TEXT_MUTED }}>
                          Điều còn đọng lại sau khi rời phiên một nhịp ngắn.
                        </p>
                        <RichTextView
                          value={entry.breakNote}
                          className="mt-2"
                          style={{ color: NOTE_PANEL_TEXT }}
                        />
                      </div>
                    )}
                  </div>
                </Motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
const TABS = [
  { key: 'overview',  label: 'Tổng Quan', icon: '01' },
  { key: 'focus',     label: 'Tập Trung', icon: '02' },
  { key: 'category',  label: 'Phân Loại', icon: '03' },
  { key: 'journal',   label: 'Nhật Ký',   icon: '04' },
  { key: 'notes',     label: 'Ghi Chú',   icon: '05' },
];

export default function StatsDashboard() {
  const history           = useGameStore((s) => s.history);
  const savedNotes        = useGameStore((s) => s.savedNotes ?? []);
  const progress          = useGameStore((s) => s.progress);
  const streak            = useGameStore((s) => s.streak);
  const prestige          = useGameStore((s) => s.prestige);
  const buildings         = useGameStore((s) => s.buildings);
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const effectiveSavedNotes = useMemo(() => {
    if (savedNotes.length > 0) return savedNotes;
    return history
      .filter((entry) => entry.note || entry.breakNote)
      .map((entry, index) => ({
        id: entry.id != null ? `note_${entry.id}` : `legacy_note_${index}`,
        sourceSessionId: entry.id ?? null,
        timestamp: entry.timestamp,
        minutes: entry.minutes ?? 0,
        xpEarned: entry.xpEarned ?? entry.epEarned ?? 0,
        categoryId: entry.categoryId ?? null,
        categorySnapshot: entry.categorySnapshot ?? null,
        tier: entry.tier ?? null,
        comboCount: entry.comboCount ?? 1,
        note: entry.note,
        breakNote: entry.breakNote ?? null,
      }));
  }, [savedNotes, history]);
  const notesCount        = effectiveSavedNotes.length;

  const [activeTab, setActiveTab] = useState('overview');
  const [isTabPending, startTabTransition] = useTransition();

  const handleTabChange = (nextTab) => {
    if (nextTab === activeTab) return;
    startTabTransition(() => setActiveTab(nextTab));
  };

  return (
    <div className="relative isolate min-h-full w-full space-y-4 overflow-hidden" style={{ color: TEXT_PRIMARY }}>
      <div
        className="pointer-events-none absolute -top-14 bottom-[-10%] inset-x-[-6%] -z-10"
        style={{
          background: `
            linear-gradient(90deg, transparent 0%, rgba(var(--accent-rgb), 0.018) 12%, rgba(var(--accent-rgb), 0.018) 88%, transparent 100%),
            radial-gradient(56% 44% at 18% 20%, rgba(var(--accent-rgb), 0.12) 0%, rgba(var(--accent-rgb), 0.05) 34%, transparent 78%),
            radial-gradient(54% 38% at 82% 14%, rgba(var(--accent-rgb), 0.07) 0%, rgba(var(--accent-rgb), 0.03) 30%, transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.48) 0%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0.03) 74%, transparent 100%)
          `,
          filter: 'blur(16px)',
          opacity: 0.9,
          WebkitMaskImage: 'radial-gradient(124% 86% at 50% 4%, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 48%, rgba(0,0,0,0.62) 72%, rgba(0,0,0,0.18) 88%, transparent 100%)',
          maskImage: 'radial-gradient(124% 86% at 50% 4%, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.94) 48%, rgba(0,0,0,0.62) 72%, rgba(0,0,0,0.18) 88%, transparent 100%)',
        }}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em]" style={{ color: TEXT_SOFT }}>
            Workspace
          </p>
          <h2
            className="mt-1 text-[1.55rem] font-semibold leading-none md:text-[1.75rem]"
            style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}
          >
            Thống kê
          </h2>
          <p className="mt-2 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>
            Nhịp, chất lượng phiên và những ghi chú đã thành dữ liệu trong cùng một sổ làm việc.
          </p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="-mx-1 overflow-x-auto px-1 pb-1" style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}>
        <div
          className="inline-flex min-w-full gap-1.5 rounded-[24px] border p-1.5 md:min-w-0"
          style={{
            background: TAB_BAR_BG,
            borderColor: PANEL_BORDER,
            boxShadow: '0 10px 24px rgba(31,30,29,0.05)',
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className="group flex min-w-[108px] flex-1 flex-col items-start justify-center gap-1.5 rounded-[18px] border px-3 py-2.5 text-left text-[12px] font-semibold transition-[background-color,color,box-shadow,transform,border-color,opacity] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(201,100,66,0.28)] focus-visible:ring-offset-2 md:min-w-[148px] md:flex-none md:flex-row md:items-center md:justify-center md:gap-2 md:px-4 md:py-3 md:text-sm md:text-center"
              aria-pressed={activeTab === tab.key}
              aria-busy={isTabPending && activeTab !== tab.key ? 'true' : undefined}
              style={activeTab === tab.key
                ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, borderColor: TAB_ACTIVE_BORDER, touchAction: 'manipulation' }
                : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER, touchAction: 'manipulation' }}
            >
              <div className="flex items-center gap-2 md:contents">
                <span
                  aria-hidden="true"
                  className="font-mono text-[10px] tracking-[0.2em] opacity-80 group-hover:opacity-100"
                >
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </div>
              {tab.key === 'notes' && notesCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={{
                    background: activeTab === 'notes' ? 'rgba(31,30,29,0.08)' : 'rgba(201,100,66,0.10)',
                    color: activeTab === 'notes' ? TAB_ACTIVE_TEXT : ACCENT2,
                    border: `1px solid ${activeTab === 'notes' ? 'rgba(31,30,29,0.10)' : 'rgba(201,100,66,0.16)'}`,
                  }}
                >
                  {fmtCount(notesCount)}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <Motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab history={history} progress={progress} streak={streak} prestige={prestige} buildings={buildings} />
          )}
          {activeTab === 'focus' && <FocusTab history={history} />}
          {activeTab === 'category' && (
            <CategoryTab history={history} sessionCategories={sessionCategories} />
          )}
          {activeTab === 'journal' && (
            <JournalTab history={history} sessionCategories={sessionCategories} />
          )}
          {activeTab === 'notes' && (
            <NotesTab savedNotes={effectiveSavedNotes} sessionCategories={sessionCategories} />
          )}
        </Motion.div>
      </AnimatePresence>
    </div>
  );
}
