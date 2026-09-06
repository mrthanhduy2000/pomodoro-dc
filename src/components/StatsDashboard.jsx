/**
 * StatsDashboard.jsx — MÀN THỐNG KÊ TRẢ LỜI, KHÔNG TRÌNH BÀY (ADR-071, 2026-09-06)
 * ─────────────────────────────────────────────────────────────────────────────
 * Trước: 3.792 dòng · 5 tab · 6 kỳ · 4 biểu đồ · 2 bản đồ nhiệt — mở màn lên thì nếp gấp đầu là
 * hai hàng nút, và ba câu Đàm thật sự hỏi không câu nào được trả lời mà không bấm tab con.
 * Nay: mở ra là thấy BA CÂU TRẢ LỜI (engine `statsAnswers.js`), rồi dải "Điều đáng chú ý"
 * (`statsInsights.js`), rồi SỔ TRA CỨU (Nhật ký · Ghi chú) GẤP xuống dưới — không giấu, chỉ gấp
 * (`StatsJournal.jsx` · `StatsNotes.jsx`).
 *
 * ⚠️ LUẬT "MỘT CON SỐ KHÔNG CÓ MẪU SỐ THÌ KHÔNG PHẢI MỤC TIÊU": mọi tỉ lệ ở đây đi kèm cỡ mẫu do
 * engine trả về (`sample`). Con số nào không gắn được mẫu số hay mốc so sánh đã bị xoá cùng biểu đồ.
 *
 * ⚠️ Gợi ý "làm gì tiếp" là một NÚT, không phải một câu: bấm là đặt độ dài + loại việc rồi nhảy sang
 * màn Tập trung qua `onNavigate` (App.jsx truyền — cùng đường với thông báo đẩy). Đang có phiên chạy
 * thì KHÔNG đổi cấu hình đồng hồ (đổi giữa chừng là phá phiên đang chạy), chỉ đưa về màn ấy.
 */
import { useMemo, useState } from 'react';
import { motion as Motion } from 'framer-motion';
import { useEnterMotion, withDelay } from '../lib/motionPresets';
import useGameStore from '../store/gameStore';
import { buildStatsAnswers, formatMinutesVi } from '../engine/statsAnswers';
import { buildStatsInsights } from '../engine/statsInsights';
import { fmtCount } from './statsFormatters';
import StatsJournal from './StatsJournal';
import StatsNotes from './StatsNotes';
import {
  ACCENT2, BG_CARD, DISPLAY_FONT, PANEL_BG_SOFT, PANEL_BORDER,
  TAB_ACTIVE_BG, TAB_ACTIVE_BORDER, TAB_ACTIVE_SHADOW, TAB_ACTIVE_TEXT, TAB_BAR_BG,
  TAB_IDLE_BG, TAB_IDLE_BORDER, TAB_IDLE_TEXT, TEXT_MUTED, TEXT_PRIMARY, TEXT_SOFT,
} from './statsTheme';

const CARD_STYLE = {
  background: BG_CARD,
  border: `1px solid ${PANEL_BORDER}`,
  borderRadius: 'var(--skin-radius-card, 18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

/** Hai cuốn sổ tra cứu. Nhãn KHÔNG được trùng mục điều hướng chính (`statsNavClarity.test.js`). */
const LOOKUP = [
  { key: 'journal', label: 'Nhật ký' },
  { key: 'notes',   label: 'Ghi chú' },
];

const INSIGHT_TONE = {
  warn: { dot: '#c2663f', label: 'Đáng để ý' },
  good: { dot: '#5f8a5f', label: 'Điểm mạnh' },
  info: { dot: '#9b9892', label: 'Ghi nhận' },
};

// ─── Một thẻ trả lời: câu hỏi ở trên, câu trả lời ở dưới ──────────────────────
function AnswerCard({ index, question, children }) {
  const enterMotion = useEnterMotion();
  return (
    <Motion.section {...withDelay(enterMotion, index * 0.05)} className="p-5" style={CARD_STYLE} aria-label={question}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>{question}</p>
      {children}
    </Motion.section>
  );
}

// ─── (1) Bảy cặp cột: tuần này (đậm) cạnh tuần trước tới cùng lúc này (nhạt) ──
function WeekBars({ days, scope }) {
  const max = Math.max(1, ...days.map((d) => Math.max(d.thisMinutes, d.prevMinutes)));
  const heightOf = (m) => `${Math.max(m > 0 ? 6 : 2, (m / max) * 100)}%`;
  return (
    <div className="mt-4">
      <div className="grid grid-cols-7 gap-2" role="img" aria-label={`Phút tập trung từng ngày, ${scope.current.toLowerCase()} so với ${scope.baseline.toLowerCase()}`}>
        {days.map((d) => (
          <div key={d.label} className="flex flex-col items-center gap-1.5">
            <div className="flex h-16 w-full items-end justify-center gap-[3px]">
              <span
                className="w-[38%] rounded-t-[4px]"
                style={{ height: heightOf(d.prevMinutes), background: PANEL_BG_SOFT, opacity: d.elapsed ? 1 : 0.45 }}
                title={`${scope.baseline}: ${formatMinutesVi(d.prevMinutes)}`}
              />
              <span
                className="w-[38%] rounded-t-[4px]"
                style={{ height: heightOf(d.thisMinutes), background: 'rgb(var(--accent-rgb))', opacity: d.elapsed ? 1 : 0.25 }}
                title={`${scope.current}: ${formatMinutesVi(d.thisMinutes)}`}
              />
            </div>
            <span className="text-[10px] font-semibold" style={{ color: d.elapsed ? TEXT_MUTED : TEXT_SOFT }}>{d.label}</span>
          </div>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10.5px]" style={{ color: TEXT_SOFT }}>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: 'rgb(var(--accent-rgb))' }} />{scope.current}</span>
        <span className="inline-flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-sm" style={{ background: PANEL_BG_SOFT }} />{scope.baseline}</span>
      </div>
    </div>
  );
}

// ─── "Điều đáng chú ý" — đưa phân tích của engine ra màn hình ────────────────
// Đọc TOÀN BỘ lịch sử (các hàm tín hiệu ở `gameMath.js` tự gác cỡ mẫu), và nói rõ điều đó.
function InsightStrip({ items }) {
  const enterMotion = useEnterMotion();
  if (!items || items.length === 0) return null;
  return (
    <Motion.section {...withDelay(enterMotion, 0.15)} className="p-5" style={CARD_STYLE} aria-label="Điều đáng chú ý">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: TEXT_SOFT }}>Điều đáng chú ý</p>
        <p className="text-[11px]" style={{ color: TEXT_SOFT }}>Đọc trên toàn bộ lịch sử của bạn</p>
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
              {/* Cỡ mẫu KHÔNG phải chi tiết trang trí: "79%" không có mẫu số thì không đọc được là mạnh hay ngẫu nhiên. */}
              <p className="mt-2 text-[11px]" style={{ color: TEXT_SOFT }}>Dựa trên {x.sample}</p>
            </div>
          );
        })}
      </div>
    </Motion.section>
  );
}

export default function StatsDashboard({ onNavigate }) {
  const history            = useGameStore((s) => s.history);
  const savedNotes         = useGameStore((s) => s.savedNotes ?? []);
  const sessionCategories  = useGameStore((s) => s.sessionCategories);
  const focusMinutes       = useGameStore((s) => s.timerConfig?.focusMinutes ?? 25);
  const timerRunning       = useGameStore((s) => s.timerSession?.isRunning === true);
  const setTimerConfig     = useGameStore((s) => s.setTimerConfig);
  const setPendingCategory = useGameStore((s) => s.setPendingCategory);

  const answers = useMemo(
    () => buildStatsAnswers(history ?? [], { categories: sessionCategories ?? [], fallbackMinutes: focusMinutes }),
    [history, sessionCategories, focusMinutes],
  );
  const insights = useMemo(
    () => buildStatsInsights(history ?? [], { activeCategoryIds: (sessionCategories ?? []).map((c) => c.id) }),
    [history, sessionCategories],
  );
  // Ghi chú đã lưu; save cũ chưa có `savedNotes` thì rút từ chính lịch sử phiên.
  const effectiveSavedNotes = useMemo(() => {
    if (savedNotes.length > 0) return savedNotes;
    return (history ?? [])
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
  const lookupCount = { journal: (history ?? []).length, notes: effectiveSavedNotes.length };
  const hasSessions = (answers.totals?.completed ?? 0) > 0;

  // Sổ tra cứu GẤP mặc định: mở màn là thấy ba câu trả lời, không phải một danh sách 600 dòng.
  const [lookup, setLookup] = useState(null);

  const startSuggested = () => {
    if (!timerRunning) {
      setTimerConfig({ focusMinutes: answers.next.minutes });
      if (answers.next.categoryId) setPendingCategory(answers.next.categoryId);
    }
    onNavigate?.({ tab: 'focus' });
  };

  return (
    <div className="relative isolate min-h-full w-full space-y-4 overflow-hidden" style={{ color: TEXT_PRIMARY }}>
      <div
        className="pointer-events-none absolute -top-14 bottom-[-10%] inset-x-[-6%] -z-10"
        style={{
          background: `
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

      {/* Tiêu đề chỉ hiện ở máy bàn — trên điện thoại, nhãn tab đang sáng đã nói tên màn hình. */}
      <div className="hidden md:block">
        <h2 className="text-[1.55rem] font-semibold leading-none md:text-[1.75rem]" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}>
          Thống kê
        </h2>
        <p className="mt-2 text-[13px] leading-6" style={{ color: TEXT_MUTED }}>Ba câu trả lời trước, sổ tra cứu sau.</p>
      </div>

      {/* (1) Tôi có đang khá lên không? — hidden before the first session: at zero history the only
          honest answer is the Start button in card (3), not two cards saying "nothing yet". */}
      {hasSessions && (
        <AnswerCard index={0} question="Tôi có đang khá lên không?">
          <p className="mt-2 text-[17px] font-semibold leading-snug" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}>
            {answers.week.headline}
          </p>
          <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>{answers.week.detail}</p>
          <WeekBars days={answers.week.days} scope={answers.week.scope} />
        </AnswerCard>
      )}

      {/* (2) Khi nào tôi mạnh nhất? — whole-session basis (ADR-076): the card never asks for homework.
          A line with nothing to rank (no session carries a category yet) is DROPPED, not captioned. */}
      {hasSessions && (
        <AnswerCard index={1} question="Khi nào tôi mạnh nhất?">
          <ul className="mt-2">
            {answers.best.filter((b) => b.ready).map((b) => (
              <li key={b.id} className="flex items-baseline justify-between gap-3 border-t py-2.5 first:border-t-0" style={{ borderColor: PANEL_BORDER }}>
                <span className="w-[76px] shrink-0 text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color: TEXT_SOFT }}>{b.label}</span>
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[14px] font-semibold leading-snug" style={{ color: TEXT_PRIMARY }}>{b.value}</p>
                  <p className="text-[11.5px] leading-snug" style={{ color: TEXT_MUTED }}>{b.note} · trên {b.sample}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] leading-relaxed" style={{ color: TEXT_SOFT }}>
            Phiên trọn vẹn = bắt đầu rồi đi tới cùng, không huỷ, không tự chấm «Chưa đạt».
          </p>
        </AnswerCard>
      )}

      {/* (3) Làm gì tiếp? — đúng MỘT gợi ý, và nó là một nút */}
      <AnswerCard index={2} question="Làm gì tiếp?">
        <p className="mt-2 text-[15px] font-semibold leading-snug" style={{ color: TEXT_PRIMARY, fontFamily: DISPLAY_FONT, textWrap: 'balance' }}>
          {answers.next.headline}
        </p>
        {/* `reason` tự mang mẫu số ("Dựa trên N phiên cùng khung…") — không ghép thêm, kẻo in hai lần. */}
        <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: TEXT_MUTED }}>{answers.next.reason}</p>
        <button
          type="button"
          onClick={startSuggested}
          className="mt-4 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-[14px] font-semibold transition-[transform,box-shadow] duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2 md:w-auto"
          style={{ background: 'rgb(var(--accent-rgb))', color: '#fff', boxShadow: '0 10px 24px rgba(var(--accent-rgb),0.28)', touchAction: 'manipulation' }}
        >
          {timerRunning ? 'Đang có phiên chạy — mở màn Tập trung' : answers.next.cta}
        </button>
      </AnswerCard>

      <InsightStrip items={insights} />

      {/* Sổ tra cứu — gấp, không giấu: hai cuốn sổ có tên và số mục ngay trên nút */}
      <section className="rounded-[24px] border p-1.5" style={{ background: TAB_BAR_BG, borderColor: PANEL_BORDER, boxShadow: '0 10px 24px rgba(31,30,29,0.05)' }} aria-label="Sổ tra cứu">
        <div className="flex items-baseline justify-between gap-3 px-2.5 pb-1.5 pt-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: TEXT_SOFT }}>Sổ tra cứu</span>
          <span className="text-[11px]" style={{ color: TEXT_SOFT }}>{lookup ? 'Bấm lại để gấp' : 'Gấp sẵn — mở khi cần'}</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LOOKUP.map((tab) => {
            const active = lookup === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                aria-pressed={active}
                onClick={() => setLookup(active ? null : tab.key)}
                className="inline-flex items-center justify-center gap-2 rounded-[18px] border px-3 py-2.5 text-[12.5px] font-semibold transition-[background-color,color,box-shadow,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(var(--accent-rgb),0.28)] focus-visible:ring-offset-2"
                style={active
                  ? { background: TAB_ACTIVE_BG, color: TAB_ACTIVE_TEXT, boxShadow: TAB_ACTIVE_SHADOW, borderColor: TAB_ACTIVE_BORDER, touchAction: 'manipulation' }
                  : { background: TAB_IDLE_BG, color: TAB_IDLE_TEXT, borderColor: TAB_IDLE_BORDER, touchAction: 'manipulation' }}
              >
                <span className="whitespace-nowrap">{tab.label}</span>
                <span
                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none"
                  style={active
                    ? { background: 'rgba(31,30,29,0.08)', color: TAB_ACTIVE_TEXT, border: '1px solid rgba(31,30,29,0.10)' }
                    : { background: 'rgba(var(--accent-rgb),0.10)', color: ACCENT2, border: '1px solid rgba(var(--accent-rgb),0.16)' }}
                >
                  {fmtCount(lookupCount[tab.key])}
                </span>
              </button>
            );
          })}
        </div>
      </section>
      {lookup === 'journal' && <StatsJournal history={history} sessionCategories={sessionCategories} />}
      {lookup === 'notes' && <StatsNotes savedNotes={effectiveSavedNotes} sessionCategories={sessionCategories} />}
    </div>
  );
}
