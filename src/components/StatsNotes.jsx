/**
 * StatsNotes.jsx — SỔ TRA CỨU của màn Thống kê: ghi chú đã lưu từ các phiên. Tách khỏi
 * `StatsDashboard.jsx` 2026-09-06 (ADR-071), cùng lý do với `StatsJournal.jsx`.
 */
import { useState, useMemo } from 'react';
import { motion as Motion } from 'framer-motion';
import { useEnterMotion, withDelay } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { RichTextView } from './RichText';
import { getGlyph, hasGlyphIcon } from '../utils/labelMark';
import { resolveEntryCategory, fmtCount } from './statsFormatters';
import { formatVietnamDate, formatVietnamTime } from '../engine/time';
import { BADGE_BG, BADGE_STRONG_BG, BADGE_STRONG_TEXT, BADGE_TEXT, BG_CARD, DISPLAY_FONT, FILTER_PILL_BG, FILTER_PILL_BORDER, FILTER_PILL_TEXT, NOTE_PANEL_BG, NOTE_PANEL_BORDER, NOTE_PANEL_TEXT, NOTE_PANEL_TITLE, PANEL_BG_SOFT, PANEL_BORDER, TEXT_MUTED, TEXT_PRIMARY, TEXT_SOFT } from './statsTheme';

// ─── Ghi chú đã lưu ───────────────────────────────────────────────────────────
export default function StatsNotes({ savedNotes, sessionCategories }) {
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
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                            style={{ background: 'rgba(var(--accent-rgb),0.2)', color: 'var(--accent2)', border: '1px solid rgba(var(--accent-rgb),0.4)' }}
                          >
                            Xoá
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteNoteId(null)}
                            className="px-2.5 py-1 rounded-lg text-[10px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--line-2)] focus-visible:ring-offset-2 transition-[background-color,color,border-color,box-shadow] duration-200"
                            style={{ background: 'var(--panel-soft)', color: 'var(--muted)', border: '1px solid var(--line)' }}
                          >
                            Huỷ
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteNoteId(entry.id)}
                          className="inline-flex w-fit items-center rounded-full border px-3 py-1 text-[10px] font-semibold transition-[background-color,color,border-color,transform] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.45)] focus-visible:ring-offset-2"
                          style={{ background: 'rgba(var(--accent-rgb),0.10)', color: 'var(--accent2)', borderColor: 'rgba(var(--accent-rgb),0.24)' }}
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
