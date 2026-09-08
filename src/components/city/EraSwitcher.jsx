/**
 * EraSwitcher.jsx — the museum's shelf: one tile per era, wrapping, never scrolling.
 *
 * ⚠️ WHAT A TILE MAY SAY (round 46, ADR-086 — measured, then cut):
 *   ADR-080 promised «fifteen chips fit three rows at 390 px and one at 1280». Measured 2026-09-08
 *   with a 12-era save: **6 rows / 217 px at 390, 2 rows at 1280.** The chips had grown fat —
 *   «Kỷ 12 · 4/5 · đang xây» — after «5/5 ★» and «· đang xây» were added, and nobody re-measured
 *   the ADR's number. Every new era pushed the city another ~35 px down the phone.
 *   A tile now carries TWO lines and nothing else:
 *       Kỷ 12          ← the era
 *       ★ | 4/5 | —    ← complete · fraction · lost
 *   «5/5 ★» said one thing twice (the star MEANS five of five); «· đang xây» is said once, in the
 *   era card's status line, and a sealed era with a restoration in flight keeps its fraction in the
 *   accent tone instead. The words live in `cityCopy.js` (`eraTile`), so a test can read them.
 *   Result: 15 tiles = **2 rows at 390 px, 1 row at 1280** — inside the promise again.
 *
 * ⚠️ THE GRID WRAPS, IT NEVER SCROLLS (ADR-080). A horizontal scroller cut the first chip in half
 *   and hid every era past the fold. `repeat(auto-fill, minmax(…))` puts as many tiles on a row
 *   as fit and wraps the rest, whole. No `ResizeObserver`, no scroll-to-active machinery.
 *
 * ⚠️ THE STAR IS «★» (U+2605), NEVER THE EMOJI ⭐ — the emoji is drawn by the OS colour font,
 *   ignores `color`, and differs in width between iPhone and Mac.
 * ⚠️ THE STAR IS `--accent`, NOT THE ERA COLOUR — measured 2026-08-13 across all theme × skin
 *   pairs: era 9 (`#a3e635`) reaches 1,49:1 on a light card, era 3 (`#facc15`) 1,51:1, i.e. the
 *   reward was invisible exactly where it should shine; `--accent` measures 2,97:1 (worst) to
 *   7,43:1. The era DOT keeps the era colour: it is decoration (the number is written next to it).
 *
 * Three states an era can be in: the one being played (`isCurrent`) · sealed (museum, with or
 * without a star) · LOST — the city passed before the museum existed (2026-08-12, `MIGRATION.md`
 * schema 3→4): an intentional empty state, not a bug.
 */

import { eraSolid } from './cityTokens';
import { eraTile } from './cityCopy';

/** Colours of line 2, per tone. The active tile paints everything white on `--accent`. */
const MARK_STYLE = {
  complete: { color: 'var(--accent)', fontWeight: 600 },
  current:  { color: 'var(--ink)', fontWeight: 600 },
  open:     { color: 'var(--accent)', fontWeight: 600 },
  sealed:   { color: 'var(--muted)', fontWeight: 400 },
  lost:     { color: 'var(--muted-2)', fontWeight: 400 },
};

export default function EraSwitcher({ eras, viewingEra, onSelect }) {
  return (
    <div
      className="grid gap-1"
      // ⚠️ 40 px is the floor a finger can hit and the width «Kỷ 15» needs at 11 px. At 350 px of
      // column (iPhone 390 minus px-5) that is 8 tiles a row ⇒ 15 eras in 2 rows; at 375 it is 7 ⇒
      // 3 rows; at 1280 the 15 sit on one row. `1fr` lets the tiles share leftover width equally.
      style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))' }}
      role="tablist"
      aria-label="Các kỷ trong bảo tàng"
    >
      {eras.map((era) => {
        const active = era.era === viewingEra;
        const tile = eraTile(era);
        const mark = active ? { color: '#fff', fontWeight: 600 } : MARK_STYLE[tile.tone];
        return (
          <button
            key={era.era}
            type="button"
            role="tab"
            onClick={() => onSelect(era.era)}
            aria-selected={active ? 'true' : 'false'}
            aria-label={tile.aria}
            title={tile.aria}
            className="flex min-w-0 flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 py-1.5 text-[11px] leading-none transition-colors"
            style={{
              background: active ? 'var(--accent)' : 'var(--card-bg-solid)',
              color: active ? '#fff' : (era.isLost ? 'var(--muted-2)' : 'var(--ink-2)'),
              border: `1px solid ${active ? 'var(--accent)' : 'var(--line)'}`,
              opacity: era.isLost && !active ? 0.6 : 1,
            }}
          >
            <span className="flex items-center gap-1 whitespace-nowrap">
              <span
                className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                aria-hidden="true"
                style={{
                  background: era.isLost ? 'transparent' : eraSolid(era.era),
                  border: era.isLost ? '1px solid var(--muted-2)' : 'none',
                }}
              />
              <span>{tile.title}</span>
            </span>
            {/* The star must stay visible on the selected tile too — white on `--accent`. */}
            <span className="mono whitespace-nowrap text-[11px]" style={mark} aria-hidden="true">
              {tile.mark}
            </span>
          </button>
        );
      })}
    </div>
  );
}
