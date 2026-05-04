/**
 * WeeklyReportModal.jsx — Báo Cáo Tuần
 * ─────────────────────────────────────────────────────────────────────────────
 * Mục tiêu:
 *  • Đưa tín hiệu quan trọng lên đầu
 *  • Giữ báo cáo ngắn, dễ đọc, có thể hành động ngay
 *  • Trực quan hơn nhưng không nặng thêm về thao tác
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useGameStore from '../store/gameStore';
import {
  localDateStr,
  formatVietnamDate,
  getVietnamDayOfWeek,
  getVietnamHour,
  startOfVietnamWeekTs,
} from '../engine/time';

const DAY_MS = 86_400_000;

function getMonday(offsetWeeks = 0) {
  return new Date(startOfVietnamWeekTs(Date.now() + offsetWeeks * 7 * DAY_MS));
}

function fmtHours(minutes) {
  if (minutes < 60) return `${minutes}p`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}g${m}p` : `${h}g`;
}

function fmtDate(date) {
  return formatVietnamDate(date, { day: '2-digit', month: '2-digit' });
}

const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DAY_NAMES = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];
const HOUR_BLOCKS = [
  { label: '0-6h', start: 0, end: 6 },
  { label: '6-9h', start: 6, end: 9 },
  { label: '9-12h', start: 9, end: 12 },
  { label: '12-15h', start: 12, end: 15 },
  { label: '15-18h', start: 15, end: 18 },
  { label: '18-21h', start: 18, end: 21 },
  { label: '21-24h', start: 21, end: 24 },
];

const DISPLAY_FONT = '"Source Serif 4", Georgia, serif';
const PAPER_BG = 'var(--card-bg-solid, rgba(255,255,255,0.94))';
const PAPER_BG_SOFT = 'var(--card-bg-solid2, rgba(244,242,236,0.96))';
const LINE = 'var(--line-2, #d9d6cc)';
const INK = 'var(--ink, #1f1e1d)';
const INK_SOFT = 'var(--ink-2, #3a3936)';
const MUTED = 'var(--muted, #6a6862)';
const MUTED_SOFT = 'var(--muted-2, #9b9892)';
const ACCENT = 'var(--accent, #c96442)';
const ACCENT_DEEP = 'var(--accent2, #8a3f24)';
const GOOD = 'var(--good, #5b7a52)';
const GOOD_SOFT = 'var(--good-soft, #e5ecdf)';
const WARN = 'var(--warn, #b07d3b)';
const WARN_SOFT = 'var(--warn-soft, #f2e6d1)';

const GRADES = [
  { min: 1200, id: 'S', label: 'Huyền Thoại', color: WARN, bg: WARN_SOFT },
  { min: 900, id: 'A', label: 'Xuất Sắc', color: GOOD, bg: GOOD_SOFT },
  { min: 600, id: 'B', label: 'Tốt', color: ACCENT_DEEP, bg: 'rgba(201,100,66,0.12)' },
  { min: 300, id: 'C', label: 'Trung Bình', color: INK_SOFT, bg: PAPER_BG },
  { min: 60, id: 'D', label: 'Cần Cố Gắng', color: ACCENT, bg: 'rgba(201,100,66,0.08)' },
  { min: 0, id: 'F', label: 'Chưa Bắt Đầu', color: MUTED, bg: PAPER_BG_SOFT },
];

function getGrade(minutes) {
  return GRADES.find((grade) => minutes >= grade.min) ?? GRADES.at(-1);
}

function computeWeekStats(history, mondayMs, nextMondayMs) {
  const entries = history.filter((entry) => {
    const ts = typeof entry.timestamp === 'string'
      ? new Date(entry.timestamp).getTime()
      : entry.timestamp;
    return ts >= mondayMs && ts < nextMondayMs;
  });

  const totalMinutes = entries.reduce((sum, entry) => sum + (entry.minutes ?? 0), 0);
  const totalXP = entries.reduce((sum, entry) => sum + (entry.xpEarned ?? 0), 0);
  const sessions = entries.length;
  const jackpots = entries.filter((entry) => entry.jackpot).length;
  const maxCombo = entries.reduce((max, entry) => Math.max(max, entry.comboCount ?? 0), 0);
  const longestSession = entries.reduce((max, entry) => Math.max(max, entry.minutes ?? 0), 0);

  const byDay = Array(7).fill(0);
  entries.forEach((entry) => {
    const day = getVietnamDayOfWeek(entry.timestamp);
    const dayIndex = day === 0 ? 6 : day - 1;
    byDay[dayIndex] += entry.minutes ?? 0;
  });

  const byHour = Array(24).fill(0);
  entries.forEach((entry) => {
    const hour = getVietnamHour(entry.timestamp);
    byHour[hour] += entry.minutes ?? 0;
  });

  const activeDays = new Set(
    entries.map((entry) => localDateStr(new Date(entry.timestamp))),
  ).size;

  const catMinutes = {};
  entries.forEach((entry) => {
    const key = entry.categoryId ?? '__none__';
    catMinutes[key] = (catMinutes[key] ?? 0) + (entry.minutes ?? 0);
  });

  return {
    totalMinutes,
    totalXP,
    sessions,
    jackpots,
    maxCombo,
    longestSession,
    byDay,
    byHour,
    activeDays,
    catMinutes,
  };
}

function buildInsight(curr, prev, streak, bestDayIdx) {
  const dayName = DAY_NAMES[bestDayIdx] ?? '';
  const pct = prev.totalMinutes > 0
    ? Math.round(((curr.totalMinutes - prev.totalMinutes) / prev.totalMinutes) * 100)
    : null;

  if (curr.totalMinutes === 0) {
    return 'Tuần này chưa có phiên nào được ghi nhận. Bắt đầu lại bằng một phiên ngắn, rõ mục tiêu.';
  }
  if (pct !== null && pct >= 30) {
    return `Bạn tăng ${pct}% so với tuần trước. Nhịp làm việc đang đi đúng hướng.`;
  }
  if (pct !== null && pct >= 10) {
    return `Bạn đang tăng ${pct}% so với tuần trước. Giữ nguyên cấu trúc hiện tại là đã đủ tốt.`;
  }
  if (pct !== null && pct < -20) {
    return `Tuần này giảm ${Math.abs(pct)}% so với tuần trước. Chỉ cần một vài phiên đúng lúc là có thể kéo nhịp lại.`;
  }
  if (streak.currentStreak >= 7) {
    return `Chuỗi ${streak.currentStreak} ngày đang tạo nền rất chắc. Điều quan trọng nhất bây giờ là giữ nhịp.`;
  }
  if (curr.maxCombo >= 5) {
    return `Combo ×${curr.maxCombo} cho thấy bạn đã có những cụm làm việc đủ sâu để lặp lại.`;
  }
  if (bestDayIdx >= 0 && curr.byDay[bestDayIdx] > 0) {
    return `${dayName} là ngày mạnh nhất tuần này với ${fmtHours(curr.byDay[bestDayIdx])} tập trung.`;
  }
  return 'Tuần này vẫn có đà. Giữ đều từng phiên sẽ quan trọng hơn việc cố bứt quá mạnh.';
}

function getPeakBlock(byHour) {
  return HOUR_BLOCKS.reduce(
    (best, block) => {
      const minutes = byHour.slice(block.start, block.end).reduce((sum, value) => sum + value, 0);
      return minutes > best.minutes ? { label: block.label, minutes } : best;
    },
    { label: '', minutes: 0 },
  );
}

function getTopCategory(catMinutes, sessionCategories) {
  const sorted = Object.entries(catMinutes)
    .filter(([, minutes]) => minutes > 0)
    .sort((a, b) => b[1] - a[1]);

  if (sorted.length === 0) return null;

  const categoryMap = {};
  (sessionCategories ?? []).forEach((category) => {
    categoryMap[category.id] = category;
  });

  const [categoryId, minutes] = sorted[0];
  const totalMinutes = sorted.reduce((sum, [, value]) => sum + value, 0);
  const category = categoryMap[categoryId];

  return {
    id: categoryId,
    label: category?.label ?? 'Chưa phân loại',
    color: category?.color ?? '#475569',
    minutes,
    share: totalMinutes > 0 ? Math.round((minutes / totalMinutes) * 100) : 0,
  };
}

function buildActionPlan({ curr, prev, streak, peakBlock, topCategory }) {
  const actions = [];

  if (peakBlock.minutes > 0) {
    actions.push(`Ưu tiên phiên quan trọng vào ${peakBlock.label}. Đây là khung bạn tập trung tốt nhất tuần này.`);
  }

  if (curr.activeDays < 4) {
    const nextTarget = Math.min(curr.activeDays + 1, 5);
    actions.push(`Thêm 1 ngày hoạt động nữa trước khi tăng thời lượng. Mục tiêu ${nextTarget}/7 ngày sẽ vừa sức hơn.`);
  } else if (prev.totalMinutes > curr.totalMinutes) {
    const gap = prev.totalMinutes - curr.totalMinutes;
    const chunk = Math.max(20, Math.ceil(gap / 3 / 5) * 5);
    actions.push(`Bạn cần thêm ${fmtHours(gap)} để quay về mức tuần trước. Chia đều thành 3 phiên khoảng ${chunk} phút sẽ dễ giữ hơn.`);
  } else if (curr.longestSession > 0 && curr.longestSession < 45) {
    const target = Math.max(45, Math.min(60, curr.longestSession + 10));
    actions.push(`Cài một phiên ${target} phút trong tuần tới để tăng độ sâu, không cần kéo cả tuần dài hơn.`);
  }

  if (actions.length < 2 && topCategory?.share >= 45) {
    actions.push(`Dồn phần việc nặng vào ${topCategory.label}. Danh mục này đã chiếm ${topCategory.share}% thời lượng tuần này.`);
  }

  if (actions.length < 2 && streak.currentStreak >= 5) {
    actions.push(`Bảo toàn chuỗi ${streak.currentStreak} ngày trước. Khi nhịp còn nguyên, phần tăng thêm sẽ dễ hơn nhiều.`);
  }

  if (actions.length === 0) {
    actions.push('Giữ đúng nhịp hiện tại thêm một tuần trước khi tăng mục tiêu mới.');
  }

  return actions.slice(0, 2);
}

function SnapshotMetric({ label, value, note, color = INK }) {
  return (
    <div className="rounded-[18px] border px-3 py-3" style={{ background: PAPER_BG, borderColor: LINE }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED_SOFT }}>
        {label}
      </p>
      <p className="mt-2 text-lg font-bold leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-snug" style={{ color: MUTED }}>
        {note}
      </p>
    </div>
  );
}

function HighlightCard({ eyebrow, value, caption, color = INK_SOFT }) {
  return (
    <div className="rounded-[20px] border px-4 py-4" style={{ background: PAPER_BG, borderColor: LINE }}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED_SOFT }}>
        {eyebrow}
      </p>
      <p className="mt-2 text-[1.2rem] font-semibold leading-tight" style={{ color, fontFamily: DISPLAY_FONT }}>
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-snug" style={{ color: MUTED }}>
        {caption}
      </p>
    </div>
  );
}

function DailyBars({ byDay }) {
  const max = Math.max(...byDay, 1);
  return (
    <div className="space-y-2">
      {DAY_LABELS.map((label, index) => {
        const pct = (byDay[index] / max) * 100;
        const isMax = byDay[index] === max && byDay[index] > 0;
        return (
          <div key={label} className="flex items-center gap-2.5">
            <span className="w-5 flex-shrink-0 text-right text-[10px]" style={{ color: MUTED }}>
              {label}
            </span>
            <div className="h-5 flex-1 overflow-hidden rounded-md" style={{ background: PAPER_BG }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5, delay: index * 0.04 }}
                className="h-full rounded-md"
                style={{
                  background: isMax ? ACCENT : 'var(--timer-track, #e5dfd2)',
                  minWidth: pct > 0 ? 4 : 0,
                }}
              />
            </div>
            <span className="w-10 flex-shrink-0 text-[10px]" style={{ color: byDay[index] > 0 ? MUTED : MUTED_SOFT }}>
              {byDay[index] > 0 ? fmtHours(byDay[index]) : '–'}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function HourHeatmap({ byHour }) {
  const blockMinutes = HOUR_BLOCKS.map(({ start, end }) =>
    byHour.slice(start, end).reduce((sum, value) => sum + value, 0),
  );
  const max = Math.max(...blockMinutes, 1);
  const levels = blockMinutes.map((minutes) => {
    if (minutes === 0) return 0;
    const pct = minutes / max;
    if (pct > 0.75) return 4;
    if (pct > 0.5) return 3;
    if (pct > 0.25) return 2;
    return 1;
  });
  const colors = ['var(--heat-empty, #ece8de)', '#f2e6d1', '#e6c4b2', '#d98c6f', '#c96442'];

  return (
    <div className="flex gap-1">
      {HOUR_BLOCKS.map(({ label }, index) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="w-full rounded-md"
            style={{
              height: 32,
              background: colors[levels[index]],
              border: levels[index] === 4 ? `1px solid ${ACCENT}` : 'none',
            }}
            title={`${label}: ${fmtHours(blockMinutes[index])}`}
          />
          <span className="text-center text-[8px] leading-tight" style={{ color: MUTED }}>
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}

function CategoryBars({ catMinutes, sessionCategories }) {
  const categoryMap = {};
  (sessionCategories ?? []).forEach((category) => {
    categoryMap[category.id] = category;
  });

  const sorted = Object.entries(catMinutes)
    .filter(([, minutes]) => minutes > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  if (sorted.length === 0) {
    return <p className="py-2 text-xs" style={{ color: MUTED }}>Chưa có dữ liệu danh mục.</p>;
  }

  const max = sorted[0][1];

  return (
    <div className="space-y-2.5">
      {sorted.map(([categoryId, minutes]) => {
        const category = categoryMap[categoryId];
        const pct = (minutes / max) * 100;
        const color = category?.color ?? '#475569';
        return (
          <div key={categoryId}>
            <div className="mb-1 flex items-center justify-between gap-3">
              <span className="truncate text-[11px]" style={{ color }}>
                {category?.label ?? 'Chưa phân loại'}
              </span>
              <span className="flex-shrink-0 text-[11px] font-mono" style={{ color: MUTED }}>
                {fmtHours(minutes)}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'var(--timer-track, #e5dfd2)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.5 }}
                className="h-full rounded-full"
                style={{ background: color }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function WeeklyReportModal() {
  const open = useGameStore((state) => state.ui.weeklyReportOpen);
  const reportMode = useGameStore((state) => state.ui.weeklyReportMode ?? 'current');
  const dismissWeeklyReport = useGameStore((state) => state.dismissWeeklyReport);
  const history = useGameStore((state) => state.history);
  const streak = useGameStore((state) => state.streak);
  const sessionCategories = useGameStore((state) => state.sessionCategories);

  return (
    <AnimatePresence>
      {open && (
        <WeeklyReportModalContent
          key={reportMode}
          dismissWeeklyReport={dismissWeeklyReport}
          history={history}
          initialMode={reportMode}
          sessionCategories={sessionCategories}
          streak={streak}
        />
      )}
    </AnimatePresence>
  );
}

function WeeklyReportModalContent({
  dismissWeeklyReport,
  history,
  initialMode,
  sessionCategories,
  streak,
}) {
  const [selectedMode, setSelectedMode] = useState(initialMode);

  const { curr, prev, rangeStart, rangeEnd, summaryLabel } = useMemo(() => {
    const isCurrentWeek = selectedMode === 'current';
    const currentWeekStart = getMonday(isCurrentWeek ? 0 : -1);
    const currentWeekEnd = getMonday(isCurrentWeek ? 1 : 0);
    const previousWeekStart = getMonday(isCurrentWeek ? -1 : -2);
    const previousWeekEnd = getMonday(isCurrentWeek ? 0 : -1);
    const now = new Date();

    return {
      curr: computeWeekStats(
        history,
        currentWeekStart.getTime(),
        isCurrentWeek ? Math.min(currentWeekEnd.getTime(), now.getTime() + 1) : currentWeekEnd.getTime(),
      ),
      prev: computeWeekStats(history, previousWeekStart.getTime(), previousWeekEnd.getTime()),
      rangeStart: currentWeekStart,
      rangeEnd: isCurrentWeek ? now : new Date(currentWeekEnd.getTime() - 1),
      summaryLabel: isCurrentWeek ? 'Tiến độ tuần này' : 'Tổng kết tuần trước',
    };
  }, [history, selectedMode]);

  const grade = getGrade(curr.totalMinutes);
  const bestDayIdx = curr.byDay.indexOf(Math.max(...curr.byDay));
  const insight = useMemo(
    () => buildInsight(curr, prev, streak, bestDayIdx),
    [curr, prev, streak, bestDayIdx],
  );
  const peakBlock = useMemo(() => getPeakBlock(curr.byHour), [curr.byHour]);
  const topCategory = useMemo(
    () => getTopCategory(curr.catMinutes, sessionCategories),
    [curr.catMinutes, sessionCategories],
  );
  const actionPlan = useMemo(
    () => buildActionPlan({ curr, prev, streak, peakBlock, topCategory }),
    [curr, prev, streak, peakBlock, topCategory],
  );

  const minTrend = prev.totalMinutes > 0
    ? Math.round(((curr.totalMinutes - prev.totalMinutes) / prev.totalMinutes) * 100)
    : null;
  const avgSession = curr.sessions > 0 ? Math.round(curr.totalMinutes / curr.sessions) : 0;
  const avgActiveDay = curr.activeDays > 0 ? Math.round(curr.totalMinutes / curr.activeDays) : 0;
  const comparisonMax = Math.max(curr.totalMinutes, prev.totalMinutes, 1);
  const currComparisonWidth = (curr.totalMinutes / comparisonMax) * 100;
  const prevComparisonWidth = (prev.totalMinutes / comparisonMax) * 100;
  const bestDayLabel = bestDayIdx >= 0 && curr.byDay[bestDayIdx] > 0 ? DAY_NAMES[bestDayIdx] : 'Chưa rõ';
  const weekRange = `${fmtDate(rangeStart)} – ${fmtDate(rangeEnd)}`;
  const trendLabel = minTrend === null
    ? 'Chưa có mốc so sánh'
    : minTrend === 0
      ? 'Ngang tuần trước'
      : `${minTrend > 0 ? '+' : ''}${minTrend}% so với tuần trước`;
  const primaryCtaLabel = selectedMode === 'current' ? 'Tiếp tục tuần này' : 'Bắt đầu tuần mới';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(31,30,29,0.34)', backdropFilter: 'blur(8px)' }}
      onClick={(event) => event.target === event.currentTarget && dismissWeeklyReport()}
    >
      <motion.div
        initial={{ scale: 0.94, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 24 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-[28px]"
        style={{
          background: 'var(--modal-bg, rgba(255,255,255,0.96))',
          border: `1px solid ${LINE}`,
          boxShadow: '0 30px 80px rgba(31,30,29,0.14)',
        }}
      >
        <div
          className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6"
          style={{ scrollbarWidth: 'thin', scrollbarColor: `${LINE} transparent` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em]" style={{ color: MUTED_SOFT }}>
                Báo cáo tuần
              </p>
              <h2
                className="mt-2 text-[1.9rem] font-semibold leading-none sm:text-[2.1rem]"
                style={{ color: INK, fontFamily: DISPLAY_FONT }}
              >
                {summaryLabel}
              </h2>
              <p className="mt-2 text-[12px] font-semibold" style={{ color: MUTED }}>
                {weekRange}
              </p>
            </div>
            <button
              type="button"
              aria-label="Đóng báo cáo tuần"
              onClick={dismissWeeklyReport}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border text-lg transition-colors"
              style={{ borderColor: LINE, color: MUTED, background: PAPER_BG }}
            >
              ×
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 rounded-[20px] border p-1" style={{ background: PAPER_BG_SOFT, borderColor: LINE }}>
            {[
              { id: 'previous', label: 'Tuần trước' },
              { id: 'current', label: 'Tuần này' },
            ].map((option) => {
              const active = selectedMode === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelectedMode(option.id)}
                  className="rounded-xl px-3 py-2 text-xs font-bold transition-all"
                  style={{
                    background: active ? '#1f1e1d' : 'transparent',
                    color: active ? '#faf9f6' : MUTED,
                    border: active ? 'none' : `1px solid ${LINE}`,
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <section
            className="rounded-[26px] border p-4 sm:p-5"
            style={{ background: grade.bg, borderColor: `${grade.color}33` }}
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ color: MUTED_SOFT }}>
                  Tập trung đã ghi nhận
                </p>
                <div className="mt-3 flex flex-wrap items-end gap-3">
                  <h3
                    className="text-[2.6rem] font-semibold leading-none sm:text-[3rem]"
                    style={{ color: grade.color, fontFamily: DISPLAY_FONT }}
                  >
                    {fmtHours(curr.totalMinutes)}
                  </h3>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-semibold"
                    style={{
                      background: minTrend !== null && minTrend >= 0 ? GOOD_SOFT : 'rgba(201,100,66,0.12)',
                      color: minTrend === null ? MUTED : minTrend >= 0 ? GOOD : ACCENT_DEEP,
                    }}
                  >
                    {trendLabel}
                  </span>
                </div>
                <p className="mt-3 max-w-[44rem] text-sm leading-relaxed" style={{ color: INK_SOFT }}>
                  {insight}
                </p>
              </div>

              <div
                className="flex min-w-[108px] flex-col items-center rounded-[20px] px-4 py-3"
                style={{ background: PAPER_BG, border: `1px solid ${grade.color}22` }}
              >
                <span className="text-[2rem] font-black leading-none" style={{ color: grade.color }}>
                  {grade.id}
                </span>
                <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: grade.color }}>
                  {grade.label}
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <div className="h-2 overflow-hidden rounded-full" style={{ background: 'rgba(31,30,29,0.08)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${currComparisonWidth}%` }}
                  transition={{ duration: 0.55 }}
                  className="h-full rounded-full"
                  style={{ background: grade.color }}
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-[11px]" style={{ color: INK_SOFT }}>
                  <span>Tuần đang xem: {fmtHours(curr.totalMinutes)}</span>
                  <span style={{ color: MUTED }}>Mốc trước: {fmtHours(prev.totalMinutes)}</span>
                </div>
                {prev.totalMinutes > 0 && (
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: 'rgba(31,30,29,0.08)' }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prevComparisonWidth}%` }}
                      transition={{ duration: 0.55, delay: 0.08 }}
                      className="h-full rounded-full"
                      style={{ background: 'rgba(31,30,29,0.24)' }}
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <SnapshotMetric
                label="Ngày hoạt động"
                value={`${curr.activeDays}/7`}
                note={curr.activeDays >= 5 ? 'Độ đều đang tốt.' : curr.activeDays >= 3 ? 'Giữ nhịp ổn.' : 'Cần dàn đều hơn.'}
                color={GOOD}
              />
              <SnapshotMetric
                label="Phiên hoàn thành"
                value={curr.sessions}
                note={curr.sessions > 0 ? `${avgSession} phút mỗi phiên` : 'Chưa có phiên nào.'}
                color={WARN}
              />
              <SnapshotMetric
                label="Phiên dài nhất"
                value={curr.longestSession > 0 ? `${curr.longestSession}p` : '–'}
                note={curr.longestSession >= 45 ? 'Độ sâu đang tốt.' : 'Có thể tăng thêm một chút.'}
                color={ACCENT}
              />
              <SnapshotMetric
                label="XP kiếm được"
                value={curr.totalXP > 999 ? `${(curr.totalXP / 1000).toFixed(1)}k` : curr.totalXP}
                note={curr.jackpots > 0 ? `${curr.jackpots} jackpot trong tuần` : 'Không có jackpot.'}
                color={ACCENT_DEEP}
              />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <HighlightCard
              eyebrow="Ngày mạnh nhất"
              value={bestDayLabel}
              caption={bestDayIdx >= 0 && curr.byDay[bestDayIdx] > 0 ? `${fmtHours(curr.byDay[bestDayIdx])} tập trung.` : 'Tuần này chưa có điểm nổi bật.'}
              color={ACCENT_DEEP}
            />
            <HighlightCard
              eyebrow="Khung tốt nhất"
              value={peakBlock.minutes > 0 ? peakBlock.label : 'Chưa rõ'}
              caption={peakBlock.minutes > 0 ? `${fmtHours(peakBlock.minutes)} ghi nhận trong khung này.` : 'Chưa đủ dữ liệu để xác định.'}
              color={GOOD}
            />
            <HighlightCard
              eyebrow="Danh mục chính"
              value={topCategory?.label ?? 'Chưa có'}
              caption={topCategory ? `${topCategory.share}% thời lượng, tương đương ${fmtHours(topCategory.minutes)}.` : 'Tuần này chưa có phân bổ rõ.'}
              color={topCategory?.color ?? INK_SOFT}
            />
          </section>

          <section className="rounded-[22px] border p-4" style={{ background: PAPER_BG_SOFT, borderColor: LINE }}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED_SOFT }}>
                  Nhịp 7 ngày
                </p>
                <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                  Nhìn nhanh ngày nào đẩy được việc, ngày nào còn trống.
                </p>
              </div>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: PAPER_BG, color: INK_SOFT }}>
                TB/ngày hoạt động: {avgActiveDay > 0 ? fmtHours(avgActiveDay) : '–'}
              </span>
            </div>
            <div className="mt-4">
              <DailyBars byDay={curr.byDay} />
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[22px] border p-4" style={{ background: PAPER_BG_SOFT, borderColor: LINE }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED_SOFT }}>
                Khung giờ hiệu quả
              </p>
              <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                Ô càng đậm nghĩa là bạn đã dồn nhiều phút hơn vào khung đó.
              </p>
              <div className="mt-4">
                <HourHeatmap byHour={curr.byHour} />
              </div>
              <p className="mt-4 text-[11px]" style={{ color: peakBlock.minutes > 0 ? ACCENT_DEEP : MUTED }}>
                {peakBlock.minutes > 0
                  ? `Khung rõ nhất: ${peakBlock.label} với ${fmtHours(peakBlock.minutes)}.`
                  : 'Chưa có đủ dữ liệu để kết luận khung giờ nào trội hơn.'}
              </p>
            </div>

            <div className="rounded-[22px] border p-4" style={{ background: PAPER_BG_SOFT, borderColor: LINE }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED_SOFT }}>
                Phân bổ danh mục
              </p>
              <p className="mt-1 text-[12px]" style={{ color: MUTED }}>
                Chỉ giữ những nhóm chiếm nhiều thời lượng nhất để đọc nhanh hơn.
              </p>
              <div className="mt-4">
                <CategoryBars catMinutes={curr.catMinutes} sessionCategories={sessionCategories} />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-[22px] border p-4" style={{ background: PAPER_BG_SOFT, borderColor: LINE }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED_SOFT }}>
                Ghi chú tuần
              </p>
              <div className="mt-4 space-y-3">
                <RecordRow mark="LP" label="Phiên dài nhất" value={curr.longestSession > 0 ? `${curr.longestSession}p` : '–'} />
                <RecordRow mark="CB" label="Combo cao nhất" value={curr.maxCombo > 0 ? `×${curr.maxCombo}` : '–'} />
                <RecordRow mark="XP" label="XP kiếm được" value={curr.totalXP > 999 ? `${(curr.totalXP / 1000).toFixed(1)}k` : curr.totalXP} />
                <RecordRow mark="ST" label="Streak hiện tại" value={`${streak.currentStreak} ngày`} highlight={streak.currentStreak >= 7} />
              </div>
            </div>

            <div className="rounded-[22px] border p-4" style={{ background: PAPER_BG_SOFT, borderColor: LINE }}>
              <p className="text-xs font-bold uppercase tracking-wide" style={{ color: MUTED_SOFT }}>
                Tuần tới nên làm gì
              </p>
              <div className="mt-4 space-y-3">
                {actionPlan.map((action, index) => (
                  <ActionRow key={action} index={index + 1} text={action} />
                ))}
              </div>
            </div>
          </section>
        </div>

        <div
          className="flex-shrink-0 px-5 pb-5 pt-3 sm:px-6 sm:pb-6"
          style={{ borderTop: `1px solid ${LINE}`, background: 'var(--modal-bg, rgba(255,255,255,0.96))' }}
        >
          <button
            type="button"
            onClick={dismissWeeklyReport}
            className="w-full rounded-2xl py-3 text-sm font-bold transition-all"
            style={{ background: '#1f1e1d', color: '#faf9f6' }}
          >
            {primaryCtaLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function RecordRow({ mark, label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-[11px]" style={{ color: MUTED }}>
        <span
          className="mono inline-flex h-5 w-5 items-center justify-center rounded-full border text-[7px] font-semibold uppercase tracking-[0.12em]"
          style={{ borderColor: LINE, background: PAPER_BG, color: MUTED }}
        >
          {mark}
        </span>
        {label}
      </span>
      <span className="text-[11px] font-bold font-mono" style={{ color: highlight ? WARN : INK_SOFT }}>
        {value}
      </span>
    </div>
  );
}

function ActionRow({ index, text }) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
        style={{ background: GOOD_SOFT, color: GOOD }}
      >
        {index}
      </span>
      <p className="pt-0.5 text-[12px] leading-relaxed" style={{ color: INK_SOFT }}>
        {text}
      </p>
    </div>
  );
}
