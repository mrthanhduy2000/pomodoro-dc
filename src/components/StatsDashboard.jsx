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

import React, { useState, useMemo, useTransition, useDeferredValue } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import { useEnterMotion, useSnapMotion, withDelay } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { RichTextView } from './RichText';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import {
  timeAgo, formatExactDateTime, formatPreciseDuration, resolveEntryCategory,
  fmtHours, fmtXPCompact, fmtCount, fmtVal, } from './statsFormatters';
import {
  computeYearGrid,
  computeCategoryStats,
  isCancelledHistoryEntry,
} from '../engine/gameMath';
import { STREAK_MAX_BONUS_DAYS, STREAK_BONUS_PER_DAY, BUILDING_EFFECTS } from '../engine/constants';
import {
  STATS_PERIODS,
  DEFAULT_STATS_PERIOD,
  getPeriodLabel,
  getPeriodStartTs,
  getPreviousPeriodRange,
  buildPeriodBuckets,
  filterByPeriod,
  toTimestampMs,
} from '../engine/statsPeriod';
import { buildStatsInsights } from '../engine/statsInsights';
import { summarizeFocusStats } from '../engine/statsFocus';
import {
  formatVietnamDate,
  formatVietnamTime,
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
const CHART_GUIDE = 'var(--stats-chart-guide, rgba(180,171,154,0.52))';
const CHART_CALLOUT_BG = 'var(--stats-chart-callout-bg, rgba(255,255,255,0.94))';
const CHART_CALLOUT_TEXT = 'var(--stats-chart-callout-text, #1f1e1d)';
const CHART_AXIS_TEXT = 'var(--stats-chart-axis-text, #8b847b)';
const CHART_SHADOW = 'var(--stats-chart-shadow, rgba(31,30,29,0.1))';
const SANS_FONT = '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif';
const DISPLAY_FONT = SANS_FONT;
const METRIC_FONT = SANS_FONT;
const METRIC_TRACKING = '-0.035em';

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
    const bonusBits = [
      entry?.goalBonusXP > 0 ? `+${entry.goalBonusXP} EXP` : null,
      entry?.goalBonusEP > 0 ? `+${entry.goalBonusEP} EP` : null,
    ].filter(Boolean);
    return {
      key: 'achieved',
      label: bonusBits.length
        ? `Chạm mục tiêu đã đặt — thưởng ${bonusBits.join(' · ')}`
        : 'Chạm mục tiêu đã đặt',
      shortLabel: 'Đúng nhịp',
      bg: 'rgba(var(--accent-rgb),0.10)',
      border: 'rgba(var(--accent-rgb),0.18)',
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

function getSessionStatusMeta(entry) {
  if (isCancelledHistoryEntry(entry)) {
    return {
      key: 'cancelled',
      label: 'Phiên bị hủy',
      shortLabel: 'Đã hủy',
      bg: 'rgba(239,68,68,0.10)',
      border: 'rgba(239,68,68,0.22)',
      color: '#ef4444',
    };
  }

  return {
    key: 'completed',
    label: 'Phiên hoàn thành',
    shortLabel: 'Hoàn thành',
    bg: 'rgba(91,122,82,0.12)',
    border: 'rgba(91,122,82,0.24)',
    color: '#6f8f62',
  };
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

function SessionStatusBadge({ entry, compact = false }) {
  const meta = getSessionStatusMeta(entry);

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
        background: 'rgba(var(--accent-rgb),0.16)',
        borderColor: 'rgba(var(--accent-rgb),0.30)',
        color: ACCENT2,
        boxShadow: '0 10px 22px rgba(var(--accent-rgb),0.12)',
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
            className="rounded-full border px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
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

// ─── "Điều đáng chú ý" — đưa phân tích của engine ra màn hình ────────────────
//
// ⚠️ DẢI NÀY ĐỌC TOÀN BỘ LỊCH SỬ, KHÔNG THEO KỲ ĐANG CHỌN — và điều đó PHẢI được nói ra trên
// màn hình. Các hàm tín hiệu ở `gameMath.js` đều tự gác cỡ mẫu (cần 8–24 phiên tuỳ tín hiệu),
// nên lọc chúng về "Hôm Nay" là làm chúng câm hết. Nhưng nếu không ghi rõ, người đọc sẽ mặc
// định nó thuộc về khoảng thời gian đang chọn ngay phía trên — tức là dựng lại đúng cái hiểu
// nhầm mà cả bản vá bộ lọc vừa đi sửa.
const INSIGHT_TONE = {
  warn: { dot: '#c2663f', label: 'Đáng để ý' },
  good: { dot: '#5f8a5f', label: 'Điểm mạnh' },
  info: { dot: '#9b9892', label: 'Ghi nhận' },
};

const InsightStrip = React.memo(function InsightStrip({ items }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="p-5" style={{ background: BG_CARD, border: `1px solid ${PANEL_BORDER}`, borderRadius: 'var(--skin-radius-card, 18px)', boxShadow: 'var(--skin-card-shadow)' }}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>Điều đáng chú ý</p>
        <p className="text-[11px]" style={{ color: TEXT_SOFT }}>Đọc trên toàn bộ lịch sử, không theo khoảng thời gian đang chọn</p>
      </div>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        {items.map((x) => {
          const tone = INSIGHT_TONE[x.tone] ?? INSIGHT_TONE.info;
          return (
            <div key={x.id} className="rounded-[14px] border p-3.5" style={{ background: PANEL_BG_SOFT, borderColor: PANEL_BORDER }}>
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: tone.dot }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>{tone.label}</span>
              </div>
              <p className="mt-1.5 text-[13.5px] font-semibold leading-snug" style={{ color: TEXT_PRIMARY }}>{x.headline}</p>
              <p className="mt-1 text-[12px] leading-relaxed" style={{ color: TEXT_MUTED }}>{x.detail}</p>
              {/* Cỡ mẫu KHÔNG phải chi tiết trang trí: một con số "79%" không có mẫu số thì
                  không đọc được là mạnh hay là ngẫu nhiên. Cùng luật với AI Coach. */}
              <p className="mt-2 text-[11px]" style={{ color: TEXT_SOFT }}>Dựa trên {x.sample}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
});

// ─── Bộ chọn khoảng thời gian — DÙNG CHUNG CHO CẢ MÀN ────────────────────────
//
// ⚠️ Trước 2026-08-30 có BA bộ chọn khai riêng ở ba tab, khác nhau cả danh sách, cả nhãn, cả
// mặc định, và cả markup. Hệ quả người dùng thấy: bấm từ "Tổng Quan" (mặc định tuần) sang
// "Tập Trung" (mặc định tất cả) là cửa sổ thời gian âm thầm đổi mà không có gì báo. Nay danh
// sách kỳ đến từ `engine/statsPeriod.js` và TRẠNG THÁI nằm ở `StatsDashboard`, nên ba tab
// không thể lệch nhau nữa — đổi kỳ ở tab nào thì cả màn đổi theo.
//
// ⚠️ XUỐNG DÒNG, KHÔNG CUỘN NGANG (2026-09-01) — đây là một lỗi GIẤU MẤT LỰA CHỌN, không phải
// chuyện thẩm mỹ. Đo ở khung 390px thật: hàng này rộng thật **547px** trong khi chỗ nhìn thấy
// chỉ **348px** ⇒ **199px = 36% nằm ngoài màn hình**, tức **3 trong 6 kỳ** ("Quý Này", "Năm
// Nay", "Tất Cả") vô hình. Một dải cuộn ngang trên điện thoại không có thanh cuộn, không có
// mũi tên, không có gì báo còn thứ bên phải — nên với Đàm thì ba kỳ ấy đơn giản là KHÔNG TỒN
// TẠI. Xuống dòng tốn thêm ~34px chiều cao và đổi lại: không giấu gì cả.
// ⚠️ Bỏ `flex-1` và `min-w-[78px]`: chính chúng ép 6 viên phải chiếm ≥468px nên hàng buộc phải
// tràn. Nay mỗi viên vừa đúng chữ của nó.
const PeriodPicker = React.memo(function PeriodPicker({ value, onChange, className = '' }) {
  return (
    <div
      className={`rounded-2xl p-1 ${className}`}
      style={{ background: TAB_BAR_BG, border: `1px solid ${PANEL_BORDER}` }}
    >
      <div className="flex gap-1" role="group" aria-label="Khoảng thời gian">
        {STATS_PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => onChange(p.key)}
            aria-pressed={value === p.key}
            className="flex-1 rounded-xl border px-2 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,box-shadow,transform,border-color] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
            style={value === p.key
              ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, borderColor: TAB_ACTIVE_BORDER, touchAction: 'manipulation' }
              : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER, touchAction: 'manipulation' }}
          >
            {p.short ?? p.label}
          </button>
        ))}
      </div>
    </div>
  );
});

// ─── Tab: Tổng Quan ───────────────────────────────────────────────────────────
function OverviewTab({ history, streak, period, onPeriodChange }) {
  const [now] = useState(() => Date.now());
  const sessionCategories = useGameStore((s) => s.sessionCategories);
  const categoryMap = useMemo(() => {
    const map = { __none__: { id: '__none__', label: 'Chưa gắn loại', color: '#9b9892' } };
    (sessionCategories ?? []).forEach((c) => { map[c.id] = c; });
    return map;
  }, [sessionCategories]);

  // ⚠️ CỬA SỔ THỜI GIAN Ở ĐÂY LÀ CỬA SỔ **LỊCH**, KHÔNG PHẢI "N NGÀY GẦN NHẤT" (sửa 2026-08-30).
  // Bản trước tính `now - 7×86400000` rồi dán nhãn "tuần này" — hai thứ khác nhau, và biểu đồ cột
  // ngay bên dưới thì lại dựng theo tuần LỊCH (từ thứ Hai). Nghĩa là ô số tổng và bộ cột dưới nó
  // đo hai khoảng khác nhau mà mang cùng một nhãn. Nay cả hai đọc chung `getPeriodStartTs` /
  // `buildPeriodBuckets` ở `engine/statsPeriod.js`, nên chúng KHÔNG THỂ lệch nhau nữa.
  const view = useMemo(() => {
    const DAY = 86400000;
    const isDone = (s) => s && s.completed !== false && s.status !== 'cancelled' && !s.cancelled && Number.isFinite(s.minutes);
    const done = (history || []).filter(isDone);
    const ts = (s) => toTimestampMs(s.timestamp || s.finishedAt || 0);
    const sum = (arr) => arr.reduce((a, s) => a + (s.minutes || 0), 0);

    const winStart = getPeriodStartTs(period, new Date(now));
    const inWin = winStart === null ? done : done.filter((s) => ts(s) >= winStart);

    // Kỳ liền TRƯỚC theo lịch (tuần trước, tháng trước…) — trước đây là "cửa sổ N ngày lùi thêm
    // N ngày", tức so tuần này với 7 ngày trước nữa chứ không phải với tuần trước.
    const prevRange = getPreviousPeriodRange(period, new Date(now));
    const inPrev = prevRange ? done.filter((s) => ts(s) >= prevRange.startTs && ts(s) < prevRange.endTs) : [];

    const winMin = sum(inWin);
    const prevMin = sum(inPrev);
    const pct = prevMin > 0 ? Math.round(((winMin - prevMin) / prevMin) * 100) : null;

    const goaled = inWin.filter((s) => typeof s.goalAchieved === 'boolean');
    const achieved = goaled.filter((s) => s.goalAchieved === true).length;
    const achPct = goaled.length > 0 ? Math.round((achieved / goaled.length) * 100) : 0;

    // Số ngày ĐÃ TRÔI QUA trong kỳ, không phải độ dài danh nghĩa của kỳ. Chia cho 365 vào tháng
    // Giêng thì nhịp "mỗi ngày" bị dìm xuống gần bằng 0 — một con số đúng phép chia mà sai ý nghĩa.
    const spanStartTs = done.length > 0 ? Math.min(...done.map(ts)) : now;
    const elapsedFrom = winStart === null ? spanStartTs : winStart;
    const periodDays = Math.max(1, Math.ceil((now - elapsedFrom) / DAY));

    const buckets = buildPeriodBuckets(period, new Date(now), spanStartTs);
    const bars = buckets.map((b) => ({
      label: b.label,
      mins: sum(done.filter((x) => { const t = ts(x); return t >= b.startTs && t < b.endTs; })),
      active: b.active,
    }));
    const maxBar = Math.max(1, ...bars.map((b) => b.mins));

    const catMin = {};
    inWin.forEach((s) => { const k = s.categoryId || '__none__'; catMin[k] = (catMin[k] || 0) + (s.minutes || 0); });
    const catTotal = Math.max(1, Object.values(catMin).reduce((a, b) => a + b, 0));
    const cats = Object.entries(catMin)
      .map(([k, m]) => ({ id: k, mins: m, pct: Math.round((m / catTotal) * 100) }))
      .sort((a, b) => b.mins - a.mins)
      .slice(0, 5);

    const todayMid = new Date(now);
    todayMid.setHours(0, 0, 0, 0);
    const dayMin = {};
    done.forEach((s) => { const dd = new Date(ts(s)); dd.setHours(0, 0, 0, 0); dayMin[dd.getTime()] = (dayMin[dd.getTime()] || 0) + (s.minutes || 0); });
    const maxDay = Math.max(1, ...Object.values(dayMin));
    const cells = 16 * 7;
    const heat = [];
    for (let i = cells - 1; i >= 0; i--) heat.push(dayMin[todayMid.getTime() - i * DAY] || 0);

    return { winMin, winCount: inWin.length, pct, achPct, achieved, goaled: goaled.length, bars, maxBar, cats, heat, maxDay, periodDays };
  }, [history, period, now]);

  // Toàn bộ lịch sử, KHÔNG lọc theo kỳ — xem lý do ở chú thích của `InsightStrip`.
  const insights = useMemo(
    () => buildStatsInsights(history, { now: new Date(now), activeCategoryIds: (sessionCategories ?? []).map((c) => c.id) }),
    [history, now, sessionCategories],
  );

  const fmtH = (m) => { const h = Math.floor(m / 60); const r = m % 60; return h > 0 ? (r ? `${h}g ${r}p` : `${h}g`) : `${m}p`; };
  const periodLabel = getPeriodLabel(period).toLowerCase();
  const periodDays = view.periodDays;
  const shade = (v) => {
    if (v <= 0) return 'var(--heat-empty, #ece8de)';
    const r = v / view.maxDay;
    const a = r > 0.75 ? 1 : r > 0.5 ? 0.72 : r > 0.25 ? 0.48 : 0.26;
    return `rgba(var(--accent-rgb), ${a})`;
  };
  const card = { background: BG_CARD, border: `1px solid ${PANEL_BORDER}`, borderRadius: 'var(--skin-radius-card, 18px)', boxShadow: 'var(--skin-card-shadow)' };

  return (
    <div className="flex flex-col gap-4">
      {/*
        ⚠️ TIÊU ĐỀ ẨN TRÊN ĐIỆN THOẠI, VÀ ĐÂY LÀ MỘT LỖI BỐ CỤC THẬT chứ không chỉ là dọn chữ.
        Ở khung 390px, "Hành trình tập trung" phải chia chiều ngang với nhóm nút Tuần/Tháng/Năm nên
        nó vỡ thành **BỐN DÒNG, mỗi dòng một từ**, ở cỡ 1.9rem — tốn ~300px và trông như hỏng.
        Nó lại còn lặp: eyebrow "Tổng quan" nói đúng chữ mà nút tab "01 Tổng Quan" ngay phía trên
        đang sáng. Ẩn cả cụm trên điện thoại thì nhóm nút lên thẳng hàng đầu và đọc được ngay.
      */}
      <div className="hidden md:block">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em]" style={{ color: TEXT_SOFT }}>Tổng quan</p>
        <h3 className="mt-1.5 text-[1.9rem] font-semibold leading-tight md:text-[2.2rem]" style={{ color: TEXT_PRIMARY, fontFamily: 'var(--skin-font-display)' }}>Hành trình tập trung</h3>
      </div>
      <PeriodPicker value={period} onChange={onPeriodChange} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="p-4" style={card}>
          <p className="text-[12px]" style={{ color: TEXT_SOFT }}>Giờ {periodLabel}</p>
          <p className="mt-1 text-[1.6rem] font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: 'var(--skin-font-display)' }}>{fmtH(view.winMin)}</p>
          <p className="mt-1 text-[11px]" style={{ color: view.pct == null ? TEXT_SOFT : view.pct >= 0 ? 'var(--good)' : ACCENT2 }}>
            {view.pct == null ? 'Chưa đủ kỳ trước' : `${view.pct >= 0 ? '▲' : '▼'} ${Math.abs(view.pct)}% vs kỳ trước`}
          </p>
        </div>
        <div className="p-4" style={card}>
          <p className="text-[12px]" style={{ color: TEXT_SOFT }}>Phiên</p>
          <p className="mt-1 text-[1.6rem] font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: 'var(--skin-font-display)' }}>{view.winCount}</p>
          <p className="mt-1 text-[11px]" style={{ color: TEXT_SOFT }}>{(view.winCount / periodDays).toFixed(1)} / ngày</p>
        </div>
        {/*
          ⚠️ KHÔNG CÓ PHIÊN NÀO ĐẶT MỤC TIÊU THÌ IN "—", KHÔNG IN "0%" (vòng 20, 2026-08-30).
          `achPct` rơi về 0 khi mẫu số bằng 0, nên ô này hiện **"0%" cạnh "0 / 0 phiên"** — mà
          "0%" đọc ra là *"anh trượt hết"*, trong khi sự thật là *"anh chưa thi lần nào"*. Hai
          tình huống ngược hẳn nhau, cùng một con số. Đây đúng khuôn "con số tạo động lực quay ra
          làm nản" mà dự án đã vá cho dòng đếm ngược chặng.
          ⚠️ Không đụng `achPct` ở tầng tính: nó là 0 đúng theo toán học, chỗ sai là chỗ ĐỌC RA.
        */}
        <div className="p-4" style={card}>
          <p className="text-[12px]" style={{ color: TEXT_SOFT }}>Đạt mục tiêu</p>
          {view.goaled > 0 ? (
            <>
              <p className="mt-1 text-[1.6rem] font-semibold" style={{ color: TEXT_PRIMARY, fontFamily: 'var(--skin-font-display)' }}>{view.achPct}<span className="text-[1rem]" style={{ color: TEXT_SOFT }}>%</span></p>
              <p className="mt-1 text-[11px]" style={{ color: 'var(--good)' }}>{view.achieved} / {view.goaled} phiên</p>
            </>
          ) : (
            <>
              <p className="mt-1 text-[1.6rem] font-semibold" style={{ color: TEXT_SOFT, fontFamily: 'var(--skin-font-display)' }}>—</p>
              <p className="mt-1 text-[11px]" style={{ color: TEXT_SOFT }}>chưa phiên nào đặt mục tiêu</p>
            </>
          )}
        </div>
        <div className="p-4" style={card}>
          <p className="text-[12px]" style={{ color: TEXT_SOFT }}>Chuỗi</p>
          <p className="mt-1 text-[1.6rem] font-semibold" style={{ color: ACCENT, fontFamily: 'var(--skin-font-display)' }}>{streak.currentStreak}<span className="text-[1rem]" style={{ color: TEXT_SOFT }}> ngày</span></p>
          <p className="mt-1 text-[11px]" style={{ color: TEXT_SOFT }}>Kỷ lục: {streak.longestStreak}</p>
        </div>
      </div>

      <InsightStrip items={insights} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_1fr]">
        <div className="p-5" style={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>
            Giờ tập trung theo {view.bars[0]?.unit ?? 'ngày'}
          </p>
          <div className="mt-5 flex h-[170px] items-stretch justify-between gap-2">
            {view.bars.map((b, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div className="w-full rounded-t-[5px]" style={{ height: `${Math.max(3, (b.mins / view.maxBar) * 100)}%`, background: b.active ? ACCENT : 'rgba(var(--accent-rgb),0.32)' }} title={fmtH(b.mins)} />
                </div>
                <span className="text-[10px]" style={{ color: b.active ? TEXT_PRIMARY : TEXT_SOFT, fontWeight: b.active ? 600 : 400 }}>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="p-5" style={card}>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>Loại việc</p>
          <div className="mt-4 flex flex-col gap-3">
            {view.cats.length === 0 && <p className="text-[12px]" style={{ color: TEXT_SOFT }}>Chưa có dữ liệu loại việc.</p>}
            {view.cats.map((c) => {
              const meta = categoryMap[c.id] || { label: 'Khác', color: ACCENT };
              return (
                <div key={c.id}>
                  <div className="flex items-center justify-between text-[12px]">
                    <span style={{ color: TEXT_PRIMARY }}>{meta.label}</span>
                    <span style={{ color: TEXT_SOFT }}>{c.pct}%</span>
                  </div>
                  <div className="mt-1.5 h-[6px] overflow-hidden rounded-full" style={{ background: 'var(--heat-empty, #ece8de)' }}>
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: meta.color || ACCENT }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="p-5" style={card}>
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>Thói quen 16 tuần</p>
          <span className="text-[10px]" style={{ color: TEXT_SOFT }}>ít → nhiều</span>
        </div>
        <div className="mt-4" style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column', gridAutoColumns: '1fr', gap: '4px' }}>
          {view.heat.map((v, i) => (<div key={i} style={{ aspectRatio: '1', borderRadius: '3px', background: shade(v) }} />))}
        </div>
      </div>
    </div>
  );
}

// ─── Year Heatmap ─────────────────────────────────────────────────────────────
const HEAT_COLORS = [
  'rgba(244, 242, 236, 0.92)',
  'rgba(228, 220, 210, 0.96)',
  'rgba(217, 196, 178, 0.96)',
  'rgba(205, 148, 117, 0.92)',
  'rgba(var(--accent-rgb), 0.94)',
];

// ⚠️ MÀU CỦA DẢI ĐỘ DÀI PHIÊN — khớp theo THỨ TỰ với `FOCUS_BUCKETS` ở `engine/statsFocus.js`.
// Trước 2026-08-30 mã màu nằm THẲNG trong bảng ấy (`accent: '#9a8d82'`), tức một quyết định MỸ
// THUẬT lẫn vào một bảng LOGIC — và nó là thứ duy nhất giữ bảng ấy không xuống được engine.
// ⚠️ Thêm/bớt một dải thì phải sửa CẢ HAI nơi; `statsFocus.test.js` có bài đòi hai mảng cùng độ dài.
const FOCUS_BUCKET_ACCENTS = ['#9a8d82', '#b7a596', '#d0b19b', '#c27a57', '#8a3f24'];

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

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.18fr)_minmax(252px,0.82fr)]">
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
const FocusTab = React.memo(function FocusTab({ history, period: focusPeriod, onPeriodChange }) {
  const [isPeriodPending, startPeriodTransition] = useTransition();
  const enterMotion = useEnterMotion();
  // NGOẠI LỆ (mang bố cục) — bề dài cột CHÍNH LÀ số phiên của khoảng ấy; `initial`/`animate`
  // ở lại tại chỗ vì chúng đọc biến của vòng lặp, cái gác chỉ lo `transition`.
  const thanhCotMotion = useSnapMotion({ transition: { duration: 0.45, ease: 'easeOut' } });
  const deferredFocusPeriod = useDeferredValue(focusPeriod);
  const focusSummary = useMemo(
    () => summarizeFocusStats(history, deferredFocusPeriod),
    [history, deferredFocusPeriod],
  );

  const periodLabel = getPeriodLabel(deferredFocusPeriod);
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
      ? `${periodLabel} mới ghi nhận ${fmtCount(focusSummary.totalSessions)} phiên trên ${fmtCount(focusSummary.activeDays)} ngày có phiên${focusSummary.cancelledSessions > 0 ? `, trong đó ${fmtCount(focusSummary.cancelledSessions)} phiên bị hủy.` : '.'} Khối này ưu tiên những gì vừa diễn ra gần đây để anh đọc nhịp nhanh hơn, thay vì trải số liệu ra quá rộng khi dữ liệu còn mỏng.`
      : `${periodLabel} ghi nhận ${fmtCount(focusSummary.totalSessions)} phiên với ${fmtHours(focusSummary.totalMinutes)} tổng thời lượng${focusSummary.cancelledSessions > 0 ? `, gồm ${fmtCount(focusSummary.cancelledSessions)} phiên bị hủy.` : '.'} Trung bình mỗi phiên kéo dài ${focusSummary.avgSessionMinutes} phút, và ${deepFocusRatio}% số phiên đã chạm mốc 60 phút.`
    : `Hoàn thành thêm một phiên trong ${periodLabel.toLowerCase()} để hệ thống bắt đầu đọc được nhịp tập trung của anh.`;

  const handlePeriodChange = (nextPeriod) => {
    if (nextPeriod === focusPeriod) return;
    startPeriodTransition(() => onPeriodChange(nextPeriod));
  };

  return (
    <div className="space-y-3.5 md:space-y-4">
      <PeriodPicker value={focusPeriod} onChange={handlePeriodChange} />

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
                    style={{ background: `${ACCENT}10`, color: ACCENT2, border: `1px solid rgba(var(--accent-rgb),0.16)` }}
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
            {...enterMotion}
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
                  {/* ⚠️ NHÃN "TẬP TRUNG" ĐÃ GỠ (2026-08-30) — nó là ĐÚNG chữ trên nút tab đang
                      sáng cách đó vài chục điểm ảnh. Tiêu đề ngay dưới thì ĐỔI theo số liệu, nên
                      nó mới là dòng đáng chiếm chỗ. */}
                  <h3
                    className="text-[1.6rem] font-semibold leading-tight md:text-[2rem]"
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
                  {focusSummary.cancelledSessions > 0 && (
                    <div
                      className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                      style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.22)' }}
                    >
                      Phiên hủy · {fmtCount(focusSummary.cancelledSessions)}
                    </div>
                  )}
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
                  detail={`${fmtCount(focusSummary.completedSessions)} hoàn thành · ${fmtCount(focusSummary.cancelledSessions)} hủy`}
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

          {/*
            ⚠️ `grid-cols-1` LÀ BẮT BUỘC, KHÔNG PHẢI THỪA (vòng 20, 2026-08-30). Ở khung hẹp,
            `lg:grid-cols-…` chưa áp nên grid chỉ có MỘT cột NGẦM cỡ `auto` — mà một track `auto`
            thì tự PHÌNH theo nội dung rộng nhất bên trong, bất kể item khai `min-width: 0`. Nội
            dung rộng nhất ở đây là lịch nhiệt 365 ngày (`min-w-[560px]`, cố ý, nó có
            `overflow-x-auto` riêng để cuộn ngang). Hậu quả đo được ở 390px: cả THẺ phình lên
            602px ⇒ tiêu đề "365 Ngày Gần Đây" và câu "Nhìn nhanh toàn bộ nhịp tập trung trong
            năm gần nhất…" cũng rộng 560px và bị MÉP MÀN HÌNH cắt — cụt giữa từ, không có dấu "…".
            ⚠️ Không cổng nào đỏ: đây không phải `truncate` nên `--fit` mù, và `scrollWidth` cũng
            gần như mù vì `overflow-x:hidden` ở tổ tiên kẹp nó lại. Thứ bắt được là ĐỌC ẢNH, và
            một probe liệt kê mọi phần tử rộng hơn 390px.
            Cùng đúng cái bẫy `SkillTree.jsx` đã ghi lại — nay vá cho cả 8 grid cùng khuôn trong
            file này, không vá riêng chỗ đã bắt được.
          */}
          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]"
            style={{ contentVisibility: 'auto', containIntrinsicSize: '720px' }}
          >
            {focusSummary.sparseMode
              ? <CompactFocusTimeline summary={focusSummary} periodLabel={periodLabel} />
              : <YearHeatmap history={history} />}

            <FocusHourSpotlight summary={focusSummary} periodLabel={periodLabel} />
          </div>

          <div
            className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
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
                {focusSummary.buckets.map((bucket, bucketIndex) => {
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
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: bucketScale }}
                          {...thanhCotMotion}
                          className="h-full rounded-full"
                          style={{
                            background: `linear-gradient(90deg, ${FOCUS_BUCKET_ACCENTS[bucketIndex]}, ${FOCUS_BUCKET_ACCENTS[bucketIndex]}bb)`,
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
function CategoryTab({ history, sessionCategories, period: catPeriod, onPeriodChange }) {
  // NGOẠI LỆ (mang bố cục) — bề dài thanh CHÍNH LÀ tỉ lệ của loại việc ấy.
  const thanhMotion = useSnapMotion({ transition: { duration: 0.7, ease: 'easeOut' } });

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
  const totalCancelled = catStats.reduce((s, c) => s + (c.cancelled ?? 0), 0);
  const totalXP   = catStats.reduce((s, c) => s + c.xp, 0);
  const avgMinutesOverall = totalSess > 0 ? Math.round(totalMins / totalSess) : 0;

  const periodLabel = getPeriodLabel(catPeriod);

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
      icon: getGlyph(topTimeCat?.icon, topTimeCat?.label, 'CD'),
      iconIsPicture: hasGlyphIcon(topTimeCat?.icon),
      color: topTimeCat?.color ?? ACCENT,
    },
    {
      label: 'Nhịp hiệu quả nhất',
      value: bestEfficiencyCat ? `${(bestEfficiencyCat.xp / bestEfficiencyCat.minutes).toFixed(1)} XP/p` : '—',
      sub: bestEfficiencyCat?.label ?? 'Cần thêm dữ liệu',
      icon: getGlyph(bestEfficiencyCat?.icon, bestEfficiencyCat?.label, 'HQ'),
      iconIsPicture: hasGlyphIcon(bestEfficiencyCat?.icon),
      color: bestEfficiencyCat?.color ?? '#0ea5e9',
    },
    {
      label: 'TB mỗi phiên',
      value: `${avgMinutesOverall}p`,
      sub: totalCancelled > 0
        ? `${totalSess} phiên · ${totalCancelled} hủy`
        : `${totalSess} phiên trong ${periodLabel.toLowerCase()}`,
      icon: '⏱️',
      iconIsPicture: true,
      color: '#0ea5e9',
    },
    {
      label: 'Độ mở hiện tại',
      value: `${catStats.length} loại`,
      sub: focusStyle,
      icon: '🧩',
      iconIsPicture: true,
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
      icon: getGlyph(topTimeCat.icon, topTimeCat.label, 'CD'),
      iconIsPicture: hasGlyphIcon(topTimeCat.icon),
    } : null,
    bestEfficiencyCat ? {
      key: 'best-eff',
      title: 'Nhóm đang cho hiệu quả rõ nhất',
      value: bestEfficiencyCat.label,
      sub: `${(bestEfficiencyCat.xp / bestEfficiencyCat.minutes).toFixed(1)} XP/p`,
      color: bestEfficiencyCat.color,
      icon: getGlyph(bestEfficiencyCat.icon, bestEfficiencyCat.label, 'HQ'),
      iconIsPicture: hasGlyphIcon(bestEfficiencyCat.icon),
    } : null,
    longestAvgCat ? {
      key: 'longest',
      title: 'Nhóm có phiên trung bình dài nhất',
      value: longestAvgCat.label,
      sub: `${Math.round(longestAvgCat.minutes / longestAvgCat.sessions)}p / phiên`,
      color: longestAvgCat.color,
      icon: getGlyph(longestAvgCat.icon, longestAvgCat.label, 'DH'),
      iconIsPicture: hasGlyphIcon(longestAvgCat.icon),
    } : null,
    leastUsedCat ? {
      key: 'least-used',
      title: 'Nhóm đang được dùng ít nhất',
      value: leastUsedCat.label,
      sub: `${fmtHours(leastUsedCat.minutes)} · ${leastUsedCat.sessions} phiên`,
      color: leastUsedCat.color,
      icon: getGlyph(leastUsedCat.icon, leastUsedCat.label, 'IT'),
      iconIsPicture: hasGlyphIcon(leastUsedCat.icon),
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

      <PeriodPicker value={catPeriod} onChange={onPeriodChange} />

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
                    style={{ background: `${ACCENT}10`, color: ACCENT2, border: `1px solid rgba(var(--accent-rgb),0.16)` }}
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
                    totalCancelled > 0 ? { label: 'Phiên hủy', value: `${totalCancelled}`, sub: 'đã tính vào thời lượng' } : null,
                  ].filter(Boolean).map((item) => (
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
                  const catCancelText = (cat.cancelled ?? 0) > 0 ? ` · ${cat.cancelled} hủy` : '';
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
                                {fmtHours(cat.minutes)} · {cat.sessions} phiên{catCancelText} · {avgXPPerMin} XP/p
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
            const cancelledCount = cat.cancelled ?? 0;
            const badges = [
              topTimeCat?.id === cat.id ? 'Chủ đạo' : null,
              bestEfficiencyCat?.id === cat.id ? 'Hiệu quả rõ nhất' : null,
              longestAvgCat?.id === cat.id ? 'Phiên dài nhất' : null,
              cancelledCount > 0 ? `${cancelledCount} hủy` : null,
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
                        {cat.sessions} phiên{cancelledCount > 0 ? ` · ${cancelledCount} hủy` : ''} · {fmtHours(cat.minutes)}
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
                    {...thanhMotion}
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
                        className={`mono w-11 h-11 rounded-2xl flex items-center justify-center font-semibold shrink-0 ${item.iconIsPicture ? 'text-[21px] leading-none' : 'text-[9px] uppercase tracking-[0.14em]'}`}
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
                      className={`mono w-11 h-11 rounded-2xl flex items-center justify-center font-semibold shrink-0 ${item.iconIsPicture ? 'text-[21px] leading-none' : 'text-[9px] uppercase tracking-[0.14em]'}`}
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
  const enterMotion = useEnterMotion();
  const [filterCat,    setFilterCat]    = useState(null); // null = tất cả
  const [page,         setPage]         = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(null); // id phiên đang chờ xác nhận
  const [confirmDeleteNoteSessionId, setConfirmDeleteNoteSessionId] = useState(null);
  const [editingCategorySessionId, setEditingCategorySessionId] = useState(null);
  const deleteSession = useGameStore((s) => s.deleteSession);
  const deleteSavedNoteEntry = useGameStore((s) => s.deleteSavedNoteEntry);
  const undoableSessionId = useGameStore((s) => s.latestSessionUndo?.sessionId ?? null);
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
      if (isCancelledHistoryEntry(entry)) acc.cancelled += 1;
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
      cancelled: 0,
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
          {/*
            ⚠️ KHỐI MỞ ĐẦU ~800px ĐÃ GỠ (2026-08-30) — bốn lớp, và cả bốn đều nói về một màn hình mà
            người đọc ĐANG ĐỨNG TRONG ĐÓ:
            · nhãn "LƯU TRỮ" — nhắc lại nút tab "Nhật Ký" đang sáng ngay phía trên;
            · tiêu đề "Nhật ký của các phiên đã ghi." ở cỡ 1,9rem, xuống HAI DÒNG ở khung 390px;
            · một đoạn kể rằng nhật ký thì lưu lại các phiên theo thứ tự thời gian;
            · một đoạn về CÁCH XOÁ — thông tin thật và quan trọng, nhưng đặt sai chỗ.
            ⚠️ Đoạn cuối KHÔNG bị mất tin: mỗi phiên đã có sẵn một bước XÁC NHẬN riêng
            (`confirmDelete === h.id`) với nút ghi rõ *"Xoá + hoàn tác"* / *"Xoá phiên"* kèm chú
            giải. Nói luật hoàn tác ở ĐẦU MÀN là nói trước cho người chưa định xoá gì, mỗi lần mở,
            mãi mãi — còn nói ở NÚT là nói đúng lúc người ta sắp bấm.
            Ở khung 390px khối này chiếm ~800px, tức người xem cuộn gần một màn hình rưỡi mới thấy
            phiên đầu tiên trong chính cuốn nhật ký mình vừa mở.
          */}
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
            { label: 'Phiên hủy', value: fmtCount(journalSummary.cancelled), sub: journalSummary.cancelled > 0 ? 'đã ghi vào thống kê' : 'chưa có phiên hủy' },
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
              className="min-w-[104px] rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
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
                  className="min-w-[118px] rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
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
          const isCancelled = isCancelledHistoryEntry(h);
          const goalText = getSessionGoalText(h);
          const nextNoteText = getSessionNextNoteText(h);
          const reviewMeta = getSessionReviewMeta(h);
          const tierShort = isCancelled ? 'Đã hủy'
            : h.tier?.includes('×2.0') ? '×2.0'
            : h.tier?.includes('Sâu') ? '×1.3'
            : '×1.0';
          const hasEvent = !isCancelled && !!h.positiveEvent;
          const comboVal = isCancelled ? 1 : (h.comboCount ?? 1);
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
          const canDeleteThisSession = h.id != null;
          const willUndoSessionReward = h.id === undoableSessionId;

          return (
            <Motion.div
              key={h.id ?? idx}
              {...withDelay(enterMotion, Math.min(idx * 0.02, 0.3))}
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
                      className={`mono flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-semibold ${hasGlyphIcon(cat?.icon) ? 'text-[19px] leading-none' : 'text-[8px] uppercase tracking-[0.14em]'}`}
                      style={{ background: `${cat?.color ?? '#475569'}14`, color: cat?.color ?? '#475569', border: `1px solid ${(cat?.color ?? '#475569')}28` }}
                    >
                      {getGlyph(cat?.icon, cat?.label, 'DM')}
                    </div>

                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[11px] font-semibold" style={{ color: cat?.color ?? '#475569' }}>
                          {cat?.label ?? 'Chưa gắn loại'}
                        </p>
                        {isCancelled && <SessionStatusBadge entry={h} compact />}
                        {reviewMeta && <SessionReviewBadge entry={h} compact />}
                        <button
                          type="button"
                          onClick={() => setEditingCategorySessionId(isEditingCategory ? null : h.id)}
                          className="rounded-full px-2 py-0.5 text-[10px] font-semibold border transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
                          style={cat?.id === '__none__'
                            ? {
                                background: 'rgba(var(--accent-rgb),0.10)',
                                color: ACCENT2,
                                borderColor: 'rgba(var(--accent-rgb),0.18)',
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
                          type="button"
                          onClick={() => { deleteSession(h.id); setConfirmDelete(null); }}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                          style={{ background: 'rgba(239,68,68,0.2)', color: '#f87171', border: '1px solid rgba(239,68,68,0.4)' }}
                          title={willUndoSessionReward ? 'Xác nhận xoá và hoàn tác phần thưởng phiên mới nhất' : 'Xác nhận xoá phiên khỏi Nhật ký'}
                        >
                          {willUndoSessionReward ? 'Xoá + hoàn tác' : 'Xoá phiên'}
                        </button>
                        <button
                          type="button"
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
                        type="button"
                        onClick={() => setConfirmDelete(h.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-100 transition-[background-color,color,opacity,transform] duration-200 hover:-translate-y-px sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 focus-visible:ring-offset-2"
                        style={{ background: 'rgba(239,68,68,0.12)', color: '#f87171' }}
                        title={willUndoSessionReward ? 'Xoá phiên này và hoàn tác phần thưởng mới nhất' : 'Xoá phiên này khỏi Nhật ký'}
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
                      {isCancelled ? 'Không thưởng' : `+${(h.xpEarned ?? 0).toLocaleString()}`}
                    </p>
                  </div>
                  <div
                    className="rounded-[18px] px-3 py-2.5"
                    style={{ background: PANEL_BG_SOFT, border: `1px solid ${PANEL_BORDER}` }}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>Sự kiện</p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {h.jackpot && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--accent-rgb),0.12)', color: ACCENT2 }}>Thưởng lớn</span>}
                      {!isCancelled && ((h.refinedEarned ?? 0) > 0 || (h.minutes ?? 0) >= 45) && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(148,163,184,0.18)', color: TEXT_MUTED }}>Tinh luyện</span>}
                      {hasEvent && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--accent-rgb), 0.14)', color: ACCENT2 }}>Mốc phụ</span>}
                      {comboVal >= 2 && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--accent2-rgb),0.12)', color: ACCENT2 }}>Chuỗi ×{comboVal}</span>}
                      {isCancelled && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444' }}>
                          Dừng ở {Number.isFinite(h.cancelProgressRatio) ? `${Math.round(h.cancelProgressRatio * 100)}%` : 'giữa phiên'}
                        </span>
                      )}
                      {!isCancelled && !h.jackpot && !((h.refinedEarned ?? 0) > 0 || (h.minutes ?? 0) >= 45) && !hasEvent && comboVal < 2 && (
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
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                      {(goalText || reviewMeta) && (
                        <div
                          className="rounded-[20px] px-3.5 py-3.5"
                          style={{ background: NOTE_PANEL_BG, border: `1px solid ${NOTE_PANEL_BORDER}` }}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 flex-1">
                              <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: NOTE_PANEL_TITLE }}>
                                {isCancelled ? 'Đánh giá phiên bị hủy' : 'Đánh giá phiên vừa xong'}
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
                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
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

                        <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
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
          className="w-full py-2.5 rounded-xl text-sm font-medium border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px"
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
  const enterMotion = useEnterMotion();
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
          {/*
            ⚠️ KHỐI MỞ ĐẦU ĐÃ GỠ (2026-08-30) — cùng ca với tab Nhật Ký, và cùng bốn lớp: nhãn "LƯU
            TRỮ" nhắc lại nút tab đang sáng · một tiêu đề 1,9rem xuống hai dòng ở khung 390px · một
            đoạn kể rằng kho ghi chú thì giữ ghi chú · một đoạn về CÁCH XOÁ.
            Đoạn cuối không mất tin: mỗi ghi chú đã có bước xác nhận riêng ngay tại nút xoá của nó.
            Nói luật xoá ở đầu màn là nói trước cho người chưa định xoá gì, mỗi lần mở, mãi mãi.
          */}
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
                  {...withDelay(enterMotion, Math.min(idx * 0.03, 0.3))}
                  className="rounded-[28px] border px-4 py-4 space-y-3.5"
                  style={{ background: BG_CARD, borderColor: PANEL_BORDER, borderLeft: `4px solid ${accent}`, boxShadow: '0 12px 26px rgba(31,30,29,0.05)' }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <div
                        className={`mono flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-semibold ${hasGlyphIcon(cat?.icon) ? 'text-[19px] leading-none' : 'text-[8px] uppercase tracking-[0.14em]'}`}
                        style={{ background: `${accent}14`, color: accent, border: `1px solid ${accent}28` }}
                      >
                        {getGlyph(cat?.icon, cat?.label, 'DM')}
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

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
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
/**
 * ⚠️ SỐ THỨ TỰ "01…05" ĐÃ GỠ (2026-08-30) — nó là trang trí, và nó phải TRẢ TIỀN bằng chỗ.
 * Đo ở khung 390px: mỗi nút chỉ rộng ~108px, mà con số chiếm mất phần đầu ⇒ nhãn hai chữ bị đẩy
 * XUỐNG HAI DÒNG ("Tổng / Quan", "Tập / Trung", "Phân / Loại"), làm cả hàng tab cao gấp đôi.
 * Con số ấy không nói được gì mà cái nhãn chưa nói: không ai gọi "tab 02", và thứ tự thì mắt đã
 * đọc ra từ vị trí trái-sang-phải. Một nhãn giống nhau ở mọi nơi thì không phân biệt được gì —
 * cùng lý do đã gỡ chữ "Workspace" khỏi `ShellPane`.
 */
// ⚠️ TAB 'focus' TỪNG TÊN LÀ "Tập Trung" — TRÙNG NGUYÊN VĂN với nút đầu tiên của thanh điều hướng
// dưới cùng, một màn hoàn toàn khác. Hai thứ khác hẳn nhau mang cùng một cái tên, cách nhau
// khoảng 600px trên cùng một màn hình, là cách rẻ nhất để làm một app khó hiểu: bấm "Tập Trung"
// ở trên thì ra thống kê, bấm "Tập trung" ở dưới thì ra đồng hồ.
// Tên mới lấy từ chính nội dung tab ấy — "Tỷ lệ phiên sâu", "Khung giờ rõ nhất", "Phiên nổi bật"
// — tức nó nói về CHIỀU SÂU của phiên, không phải về việc tập trung nói chung. Ngắn hơn 2 ký tự
// cũng giúp năm viên vừa khít hơn ở khung 390px.
const TABS = [
  { key: 'overview',  label: 'Tổng Quan' },
  { key: 'focus',     label: 'Chiều Sâu' },
  { key: 'category',  label: 'Phân Loại' },
  { key: 'journal',   label: 'Nhật Ký' },
  { key: 'notes',     label: 'Ghi Chú' },
];

export default function StatsDashboard() {
  const enterMotion       = useEnterMotion();
  const history           = useGameStore((s) => s.history);
  const savedNotes        = useGameStore((s) => s.savedNotes ?? []);
  const streak            = useGameStore((s) => s.streak);
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

  // ⚠️ KỲ THỜI GIAN SỐNG Ở ĐÂY, KHÔNG SỐNG TRONG TỪNG TAB (2026-08-30). Ba tab từng giữ ba
  // trạng thái riêng với ba mặc định khác nhau, nên chuyển tab là đổi cửa sổ thời gian mà không
  // báo gì. Nâng lên cha thì "Tuần Này" ở tab này vẫn là "Tuần Này" ở tab kia — và đó là điều
  // kiện để hai con số ở hai tab được phép đặt cạnh nhau.
  const [period, setPeriod] = useState(DEFAULT_STATS_PERIOD);

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

      {/*
        ⚠️ HEADER NÀY KHÔNG ĐI QUA `ShellPane` nên nó SỐNG SÓT qua đợt cắt trước (App.jsx dựng màn
        Thống kê bằng `<ShellPane>` KHÔNG có `title`, rồi màn tự dựng tiêu đề riêng ở đây). Đó là
        lý do chữ "Workspace" vẫn còn ở đúng một màn hình sau khi đã gỡ khỏi bốn màn kia — đúng
        hình dạng "sửa một chỗ, quên chỗ thứ hai" mà dự án đã bị cắn nhiều lần.
        Nay ẩn cả khối trên điện thoại, cùng luật: nhãn tab đang sáng đã nói tên màn hình.
      */}
      <div className="hidden flex-col gap-3 md:flex md:flex-row md:items-end md:justify-between">
        <div className="min-w-0">
          <h2
            className="text-[1.55rem] font-semibold leading-none md:text-[1.75rem]"
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
      {/*
        ⚠️ CÙNG LỖI, CÙNG BẢN VÁ. Đo ở 390px: hàng này rộng thật **499px** trên **358px** nhìn thấy
        ⇒ **141px = 28% nằm ngoài màn hình**, tức tab "Ghi Chú" (đang có 99 mục) gần như không ai
        biết là có. Cộng cả hai hàng, **48,6% nếp gấp là khung điều hướng** trước khi hiện một con
        số nào.
      */}
      <div className="-mx-1 px-1 pb-1">
        <div
          className="flex flex-wrap gap-1.5 rounded-[24px] border p-1.5"
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
              className="group flex flex-col items-start justify-center gap-1.5 rounded-[18px] border px-3 py-2.5 text-left text-[12px] font-semibold transition-[background-color,color,box-shadow,transform,border-color,opacity] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2 md:min-w-[148px] md:flex-none md:flex-row md:items-center md:justify-center md:gap-2 md:px-4 md:py-3 md:text-sm md:text-center"
              aria-pressed={activeTab === tab.key}
              aria-busy={isTabPending && activeTab !== tab.key ? 'true' : undefined}
              style={activeTab === tab.key
                ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, borderColor: TAB_ACTIVE_BORDER, touchAction: 'manipulation' }
                : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER, touchAction: 'manipulation' }}
            >
              <span className="whitespace-nowrap">{tab.label}</span>
              {tab.key === 'notes' && notesCount > 0 && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={{
                    background: activeTab === 'notes' ? 'rgba(31,30,29,0.08)' : 'rgba(var(--accent-rgb),0.10)',
                    color: activeTab === 'notes' ? TAB_ACTIVE_TEXT : ACCENT2,
                    border: `1px solid ${activeTab === 'notes' ? 'rgba(31,30,29,0.10)' : 'rgba(var(--accent-rgb),0.16)'}`,
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
          {...enterMotion}
        >
          {activeTab === 'overview' && (
            <OverviewTab history={history} streak={streak} period={period} onPeriodChange={setPeriod} />
          )}
          {activeTab === 'focus' && (
            <FocusTab history={history} period={period} onPeriodChange={setPeriod} />
          )}
          {activeTab === 'category' && (
            <CategoryTab history={history} sessionCategories={sessionCategories} period={period} onPeriodChange={setPeriod} />
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
