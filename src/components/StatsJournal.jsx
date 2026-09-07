/**
 * StatsJournal.jsx — SỔ TRA CỨU của màn Thống kê: nhật ký từng phiên (mục tiêu · ghi chú · sửa loại
 * · xoá · hoàn tác). Tách khỏi `StatsDashboard.jsx` 2026-09-06 (ADR-071): màn Thống kê nay TRẢ LỜI
 * ba câu ở đầu, còn sổ này được GẤP xuống dưới — không giấu, chỉ gấp.
 */
import { useState, useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { useEnterMotion, withDelay } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { RichTextView } from './RichText';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import { timeAgo, formatExactDateTime, formatPreciseDuration, resolveEntryCategory, fmtCount } from './statsFormatters';
import { isCancelledHistoryEntry } from '../engine/gameMath';
import { ACCENT2, BG_CARD, DISPLAY_FONT, FILTER_PILL_ACTIVE_BG, FILTER_PILL_ACTIVE_BORDER, FILTER_PILL_ACTIVE_TEXT, FILTER_PILL_BG, FILTER_PILL_BORDER, FILTER_PILL_TEXT, JOURNAL_PANEL_BG, JOURNAL_PANEL_BORDER, JOURNAL_PANEL_MUTED, JOURNAL_PANEL_SUB_BG, JOURNAL_PANEL_TEXT, JOURNAL_PANEL_TITLE, JOURNAL_ROW_BG, JOURNAL_ROW_BORDER, NOTE_PANEL_BG, NOTE_PANEL_BORDER, NOTE_PANEL_TEXT, NOTE_PANEL_TITLE, PANEL_BG, PANEL_BG_SOFT, PANEL_BORDER, TAB_ACTIVE_BG, TAB_ACTIVE_BORDER, TAB_ACTIVE_SHADOW, TAB_ACTIVE_TEXT, TAB_IDLE_BG, TAB_IDLE_BORDER, TAB_IDLE_TEXT, TEXT_MUTED, TEXT_PRIMARY, TEXT_SOFT } from './statsTheme';
import ActionButton from './shared/ActionButton';

// ─── Trạng thái ôn tập của một phiên (mục tiêu · ghi chú kế) ─────────────────
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


// ─── Nhật ký phiên ────────────────────────────────────────────────────────────
export default function StatsJournal({ history, sessionCategories }) {
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
          className="rounded-2xl p-1"
          style={{ background: PANEL_BG, border: `1px solid ${PANEL_BORDER}` }}
        >
          {/* XUỐNG DÒNG, không cuộn ngang: trên điện thoại một dải cuộn ngang giấu mất các loại việc ở bên phải. */}
          <div className="flex flex-wrap gap-1">
            <button
              type="button"
              onClick={() => { setFilterCat(null); setPage(0); }}
              className="rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
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
                  className="rounded-xl border px-3 py-2 text-xs font-semibold whitespace-nowrap transition-[background-color,color,border-color,box-shadow,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
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
                        <ActionButton
                          size="sm"
                          variant="danger"
                          onClick={() => { deleteSession(h.id); setConfirmDelete(null); }}
                          title={willUndoSessionReward ? 'Xác nhận xoá và hoàn tác phần thưởng phiên mới nhất' : 'Xác nhận xoá phiên khỏi Nhật ký'}
                        >
                          {willUndoSessionReward ? 'Xoá + hoàn tác' : 'Xoá phiên'}
                        </ActionButton>
                        <ActionButton size="sm" variant="soft" onClick={() => setConfirmDelete(null)} title="Huỷ">
                            ✕
                        </ActionButton>
                      </>
                    ) : canDeleteThisSession ? (
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(h.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg opacity-100 transition-[background-color,color,opacity,transform] duration-200 hover:-translate-y-px sm:opacity-0 sm:group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] focus-visible:ring-offset-2"
                        style={{ background: 'rgba(var(--accent-rgb),0.12)', color: 'var(--accent2)' }}
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
                      {!isCancelled && (h.minutes ?? 0) >= 45 && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(148,163,184,0.18)', color: TEXT_MUTED }}>Phiên sâu</span>}
                      {hasEvent && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--accent-rgb), 0.14)', color: ACCENT2 }}>Mốc phụ</span>}
                      {comboVal >= 2 && <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(var(--accent2-rgb),0.12)', color: ACCENT2 }}>Chuỗi ×{comboVal}</span>}
                      {isCancelled && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(239,68,68,0.10)', color: '#ef4444' }}>
                          Dừng ở {Number.isFinite(h.cancelProgressRatio) ? `${Math.round(h.cancelProgressRatio * 100)}%` : 'giữa phiên'}
                        </span>
                      )}
                      {!isCancelled && !h.jackpot && !((h.minutes ?? 0) >= 45) && !hasEvent && comboVal < 2 && (
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
                              <ActionButton
                                size="sm"
                                variant="danger"
                                onClick={() => { deleteSavedNoteEntry({ sessionId: h.id }); setConfirmDeleteNoteSessionId(null); }}
                              >
                                Xoá ghi chú
                              </ActionButton>
                              <ActionButton size="sm" variant="soft" onClick={() => setConfirmDeleteNoteSessionId(null)}>
                                Huỷ
                              </ActionButton>
                            </div>
                          ) : (
                            <ActionButton size="sm" variant="danger" onClick={() => setConfirmDeleteNoteSessionId(h.id)}>
                              Xoá ghi chú cũ
                            </ActionButton>
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
        <ActionButton size="md" variant="soft" className="w-full" onClick={() => setPage((p) => p + 1)}>
          Xem thêm ({filtered.length - paged.length} phiên)
        </ActionButton>
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
