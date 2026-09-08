/**
 * RankDisplay.jsx — BẬC KỶ NÀY, tự thăng (2026-09-06, ADR-069).
 *
 * Bản cũ là một nghi thức: nút "Bắt đầu thử thách", đồng hồ đếm ngược 48 giờ, "Đang khóa" khi có
 * khủng hoảng, và một hộp thoại đỏ "mất 5% tài nguyên" nếu trễ. Nay thẻ này CHỈ KỂ: bậc đang có,
 * bậc kế, và hai điều kiện để lên — cả hai đọc thẳng từ lịch sử phiên (`engine/rankLadder.js`)
 * nên không có gì để bấm, không có hạn để trễ. Đủ là lên, ngay trong chuỗi thẻ thưởng.
 *
 * Kèm thử thách kỷ nguyên (khủng hoảng cũ) dưới dạng nhiệm vụ mềm, cùng một phép đếm.
 *
 * ⚠️ THE FIRST CONDITION DOES NOT PRINT EP ANY MORE (round 43, ADR-082). It used to read
 * `✓ 3.955 / 672` — a met condition, shown as a fraction bigger than its own denominator, which
 * looks exactly like a bug and is the single most confusing number on the screen. Worse, both
 * halves were EP, and ADR-069 fixed the only currency of this game as a SESSION: Đàm cannot spend
 * EP, aim at it, or feel the difference between 672 and 3.955. So the row now says either "Đã đủ"
 * (met — the number was never the point, the ✓ was) or the distance IN SESSIONS, using the same
 * `medianSessionEP` the Focus screen's countdown uses. The bar underneath still carries the
 * fraction visually, where a fraction belongs.
 */
import React, { useState } from 'react';
import useGameStore from '../store/gameStore';
import { RANK_SYSTEM } from '../engine/constants';
import { describeCrisisQuest, describeRankStep } from '../engine/rankLadder';
import { medianSessionEP, sessionsToStageEnd } from '../engine/eraStage';

const CARD = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width,1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card,18px)',
  boxShadow: 'var(--skin-card-shadow)',
};
const eyebrowClass = 'mono text-[10px] uppercase tracking-[0.2em]';

function Bar({ pct, accent = false }) {
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ background: 'var(--timer-track)' }}>
      <div
        className="h-full rounded-full transition-[width] duration-500 ease-out"
        style={{ width: `${Math.max(0, Math.min(100, pct))}%`, background: accent ? 'var(--accent)' : 'var(--ink)' }}
      />
    </div>
  );
}

function Condition({ label, value, pct, met }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[12px]" style={{ color: 'var(--muted)' }}>{label}</span>
        <span className="mono text-[11px] font-semibold tabular-nums" style={{ color: met ? 'var(--good)' : 'var(--ink)' }}>
          {met ? '✓ ' : ''}{value}
        </span>
      </div>
      <div className="mt-1.5"><Bar pct={pct} accent={!met} /></div>
    </div>
  );
}

export default function RankDisplay() {
  const activeBook = useGameStore((s) => s.progress.activeBook);
  const rankSystem = useGameStore((s) => s.rankSystem);
  const totalEP = useGameStore((s) => s.progress.totalEP);
  const history = useGameStore((s) => s.history);
  const eraCrisis = useGameStore((s) => s.eraCrisis);
  // Đọc đồng hồ MỘT lần lúc gắn vào (lazy initializer — không gọi `Date.now()` giữa lượt vẽ): thẻ
  // này kể "48 giờ gần đây", và lệch vài phút không đổi được câu trả lời nào.
  const [now] = useState(() => Date.now());

  const ranks = RANK_SYSTEM[activeBook]?.ranks ?? [];
  if (ranks.length === 0) return null;
  const rankIdx = rankSystem?.[`book${activeBook}`] ?? 0;
  const step = describeRankStep({ bookNumber: activeBook, rankIdx, totalEP, history, now });
  const quest = describeCrisisQuest({ eraCrisis, history, now });
  if (!step.current) return null;

  const epPct = step.epRequired > 0 ? (step.epInEra / step.epRequired) * 100 : 100;
  // EP → phiên. `sessionsToStageEnd` trả `null` khi chưa đủ mẫu để ước lượng; lúc ấy nói "chưa
  // tới" còn thật thà hơn là bịa ra một con số phiên.
  const epSessionsLeft = step.epGateMet
    ? null
    : sessionsToStageEnd(Math.max(0, step.epRequired - step.epInEra), medianSessionEP(history));
  const epConditionValue = step.epGateMet
    ? 'Đã đủ'
    : (epSessionsLeft === null ? 'Chưa tới' : (epSessionsLeft <= 1 ? 'Một phiên nữa' : `Còn ~${epSessionsLeft} phiên`));
  const sessionsPct = step.sessionsRequired > 0 ? (step.sessionsDone / step.sessionsRequired) * 100 : 100;

  return (
    <div className="space-y-4">
      <section className="px-5 py-5" style={CARD}>
        <div className="flex items-center justify-between gap-3">
          <p className={eyebrowClass} style={{ color: 'var(--muted-2)' }}>Bậc kỷ này</p>
          <span className="mono text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
            {rankIdx + 1}/{ranks.length}
          </span>
        </div>

        <div className="mt-3 flex items-center gap-3">
          <span className="text-[28px] leading-none" aria-hidden="true">{step.current.icon}</span>
          <div className="min-w-0">
            <p
              className="text-[22px] font-semibold leading-tight tracking-[-0.02em]"
              style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}
            >
              {step.current.label}
            </p>
            <p className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>{step.current.buffLabel}</p>
          </div>
        </div>

        {step.isMax ? (
          <p className="mt-4 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            Bậc cao nhất của kỷ này. Kỷ mới có thang bậc mới.
          </p>
        ) : (
          <div className="mt-4 border-t pt-4" style={{ borderColor: 'var(--line)' }}>
            <div className="flex items-baseline justify-between gap-3">
              <p className={eyebrowClass} style={{ color: 'var(--muted-2)' }}>Bậc kế tiếp</p>
              <span className="text-[13px] font-semibold" style={{ color: 'var(--accent2)' }}>
                {step.next.icon} {step.next.label} · {step.next.buffLabel}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              <Condition
                label="Tiến trình trong kỷ"
                value={epConditionValue}
                pct={epPct}
                met={step.epGateMet}
              />
              {step.sessionsRequired > 0 && (
                <Condition
                  label={`Phiên ≥${step.minMinutes}′ trong ${step.windowHours} giờ gần đây`}
                  value={`${step.sessionsDone} / ${step.sessionsRequired}`}
                  pct={sessionsPct}
                  met={step.sessionsMet}
                />
              )}
            </div>
            <p className="mt-3 text-[11.5px] leading-snug" style={{ color: 'var(--muted-2)' }}>
              Đủ cả hai là tự lên bậc ngay sau phiên — không có nút, không có hạn.
            </p>
          </div>
        )}
      </section>

      {quest && (
        <section className="px-5 py-5" style={CARD}>
          <div className="flex items-center justify-between gap-3">
            <p className={eyebrowClass} style={{ color: 'var(--muted-2)' }}>Thử thách kỷ nguyên</p>
            <span className="mono text-[11px] tabular-nums" style={{ color: 'var(--muted)' }}>
              {quest.sessionsDone}/{quest.sessionsRequired}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[28px] leading-none" aria-hidden="true">{quest.icon}</span>
            <div className="min-w-0">
              <p
                className="text-[18px] font-semibold leading-tight"
                style={{ color: 'var(--ink)', fontFamily: 'var(--skin-font-display)' }}
              >
                {quest.name}
              </p>
              <p className="mt-0.5 text-[12px] leading-snug" style={{ color: 'var(--muted)' }}>
                {quest.sessionsRequired} phiên ≥{quest.minMinutes}′ trong {quest.windowHours} giờ gần đây
                {quest.relic ? ` → di vật «${quest.relic.label}»` : ''}
              </p>
            </div>
          </div>
          <div className="mt-3"><Bar pct={(quest.sessionsDone / quest.sessionsRequired) * 100} accent /></div>
          <p className="mt-2 text-[11.5px] leading-snug" style={{ color: 'var(--muted-2)' }}>
            Không có hạn. Chưa đủ thì cứ đợi phiên sau — không mất gì.
          </p>
        </section>
      )}
    </div>
  );
}
