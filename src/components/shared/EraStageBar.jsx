/**
 * EraStageBar.jsx — the era STAGE progress bar: stage label · EP inside the stage · 3px bar ·
 * one dot per stage.
 *
 * One component, two tenants (ADR-078): the top rail on every tab except Focus, and the caption
 * of the city postcard on the Focus screen. The picture of the city and the bar that measures its
 * growth belong on the same card — and a bar drawn twice drifts twice. `onImage` only swaps the
 * colours so the same numbers read over a photograph (light ink on the postcard's dark scrim).
 *
 * ⚠️ THANH NÀY ĐO **CHẶNG**, KHÔNG ĐO CẢ KỶ (2026-08-29). Một kỷ dài 5.600–20.800 EP ⇒ ở nhịp
 * thường một phiên đẩy thanh ~1% và nó đầy ĐÚNG MỘT LẦN mỗi 1–6 tháng. Một cái đích xa tới mức
 * không nhìn thấy mình đang tiến thì không phải một cái đích. Mỗi kỷ đã chia sẵn 3 chặng
 * (`makeEraStages`); phép tính ở `engine/eraStage.js` — file này CHỈ vẽ.
 * ⚠️ Chữ "EP", không phải "XP": thanh này đo tiến trình KỶ (EP). Nhãn "XP" từng nói dối ở đây
 * suốt một thời gian dài — chỉ lộ ra khi soi bằng fixture "đã chơi 6 tháng" (cấp 4 mà thanh báo
 * 20.888, trong khi cấp 4 cần 24.000 XP — hai đại lượng khác nhau, cùng một nhãn).
 *
 * ⚠️ THE NUMBER ON THE RIGHT IS NO LONGER EP (round 43). It used to read `222 / 1.867 EP`, on every
 * tab, all day. ADR-069 fixed the only currency of this game as a SESSION, and EP fails every test
 * of a currency: Đàm cannot spend it, cannot compare two numbers of it, and cannot feel the
 * difference between 222 and 1.867 — so the most-repeated number in the whole app was the one he
 * could do the least with. `progressText` now arrives already phrased in sessions, or in the
 * destination when a session count would be a guess (`engine/journey.js` owns that order).
 * `totalEP` / `eraEnd` stay as the LAST-RESORT caption for the pre-stage case only; if you find
 * yourself printing EP again, read `describeRailProgress` first — the fallback is deliberate and it
 * is not EP.
 */
export default function EraStageBar({
  eraStage = null,
  eraProgress = 0,
  totalEP = 0,
  eraEnd = 0,
  progressText = null,
  onImage = false,
  className = '',
}) {
  const ink = onImage ? 'rgba(255,255,255,0.92)' : 'var(--muted)';
  const track = onImage ? 'rgba(255,255,255,0.28)' : 'var(--line)';
  const fillColor = onImage ? 'rgba(255,255,255,0.95)' : 'var(--ink)';
  const dot = onImage ? 'rgba(255,255,255,0.95)' : 'var(--accent)';
  const ratio = eraStage ? eraStage.progress : eraProgress;
  return (
    <div className={className}>
      <div className="flex items-center justify-between gap-3">
        <span className="mono min-w-0 break-words text-[10px] uppercase tracking-[0.2em] leading-snug" style={{ color: ink }}>
          {eraStage ? eraStage.label : 'Tiến trình kỷ'}
        </span>
        <span className="mono whitespace-nowrap text-[11.5px]" style={{ color: ink }}>
          {progressText
            ?? (eraStage
              ? `${Math.round(eraStage.epInStage).toLocaleString()} / ${eraStage.epRange.toLocaleString()} EP`
              : `${Number(totalEP).toLocaleString()} / ${Number(eraEnd).toLocaleString()} EP`)}
        </span>
      </div>
      <div className="mt-2.5 h-[3px] overflow-hidden rounded-full" style={{ background: track }}>
        <div
          className="h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.min(1, Math.max(0, Number(ratio) || 0)) * 100}%`, background: fillColor }}
        />
      </div>
      {/*
        Stage dots: the bar fills ~3 times per era, not once. Without them the new bar looks like
        the old one, only faster, and nobody could tell why.
      */}
      {eraStage && (
        <div className="mt-1.5 flex gap-1" aria-hidden="true">
          {Array.from({ length: eraStage.total }, (_, i) => (
            <span
              key={i}
              className="h-[2px] flex-1 rounded-full"
              style={{ background: i <= eraStage.index ? dot : track }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
