/**
 * surface.js — ONE VISUAL VOCABULARY FOR THE WHOLE APP (round 46, ADR-086).
 *
 * ⚠️ WHY THIS FILE EXISTS — Đàm's own final criterion for round 46, and three counts that failed it:
 *   *"mở bất kỳ màn nào trong app, nó trông như cùng một người làm ra."*
 *
 *   | one visual element | how many ways the app drew it |
 *   |---|---|
 *   | the small uppercase section label ("eyebrow") | **22 size+tracking combinations over 111 uses** |
 *   | the card surface | **4 local definitions**, and the Thống kê one had drifted |
 *   | a number with a denominator | **4 shapes on the Thành Phố screen alone** |
 *
 *   None of these was a bug. Each screen was built in a different round, each decision was
 *   reasonable on the day, and nothing ever compared them side by side. That is exactly how an app
 *   comes to look *"vá bởi mười ba người"* while every individual commit looks careful.
 *
 * ⚠️ THE CARD DRIFT WAS REAL, NOT COSMETIC. `BuildScreen` · `RankDisplay` · `SkillTree` carried three
 * byte-identical copies; `StatsDashboard` carried a fourth that hardcoded `1px` where the others read
 * `var(--skin-card-border-width, 1px)`. Under any skin that sets that variable, the Thống kê screen's
 * cards had a different border width from every other screen — a difference no one could have found
 * by reading one file, because reading one file is all anyone ever did.
 *
 * ⚠️ ONE EYEBROW SIZE, NOT TWO. The temptation is to keep a "small" and a "large" and call it a
 * system. But 22 variants did not arise from a design intent with two tiers — they arose from
 * nobody having a name to reuse. A second size is a second place to drift, and the moment there are
 * two, the next round makes it three. If a label genuinely needs to be louder, it is not an eyebrow;
 * it is a TITLE, and titles have their own treatment.
 *
 * PURE: no React, no store, no DOM. Import the constants, spread them into `style`/`className`.
 */

/**
 * THE card surface. Every panel, every screen.
 * ⚠️ Every value is a skin token, so a skin can restyle the whole app by moving four variables.
 * Do not hardcode a fallback that differs from another call site — that is precisely the drift this
 * file was created to end.
 */
export const CARD = {
  background: 'var(--card-bg-solid)',
  border: 'var(--skin-card-border-width, 1px) solid var(--line)',
  borderRadius: 'var(--skin-radius-card, 18px)',
  boxShadow: 'var(--skin-card-shadow)',
};

/**
 * A second, quieter surface for a panel sitting INSIDE a card (a selected row, an inset detail).
 * Same geometry, no shadow — a shadow inside a shadow reads as a rendering mistake.
 */
export const CARD_INSET = {
  ...CARD,
  background: 'var(--card-bg-solid2, var(--card-bg-solid))',
  boxShadow: 'none',
};

/**
 * THE eyebrow: the small uppercase label that names a section.
 * ⚠️ `text-[10px]` + `tracking-[0.2em]` won on count (29 of 111 uses) rather than on taste — the
 * cheapest migration is the one that already matches the most screens. Colour is deliberately NOT
 * baked in: some eyebrows sit on `--muted`, some on `--muted-2`, and that difference carries real
 * hierarchy inside a card. Everything else is fixed.
 */
export const EYEBROW = 'mono text-[10px] uppercase tracking-[0.2em]';

/** The eyebrow, when it also has to carry weight (a live value, not a name). */
export const EYEBROW_STRONG = `${EYEBROW} font-semibold`;

/**
 * A NUMBER WITH A DENOMINATOR — one shape, everywhere: `n/N`.
 *
 * ⚠️ NO SPACES AROUND THE SLASH. The header rail printed `0 / 7` while the eight era chips below it
 * printed `4/5`; on one screen, at one moment, the same relation was punctuated two ways.
 *
 * ⚠️ AND NEVER A REMAINDER BESIDE IT. The Thành Phố screen printed `38/75 còn 37` and
 * `4/5 còn 1 nữa` — but `còn 37` is exactly `75 − 38`, the same fact subtracted, costing a second
 * number and a second colour to say nothing new. A remainder is a fine sentence ON ITS OWN
 * (*"còn 3 phiên nữa xong Kho Gia Vị"* answers *when*); it is noise next to the fraction it was
 * derived from. `remaining()` exists for the first case and must never be rendered adjacent to
 * `ratio()` of the same pair — `surface.test.js` fails any file that does.
 */
export function ratio(done, total) {
  const n = Math.max(0, Math.floor(Number(done) || 0));
  const N = Math.max(0, Math.floor(Number(total) || 0));
  return `${n}/${N}`;
}

/** How many are left. For a sentence that asks *when*, never for a chip beside `ratio()`. */
export function remaining(done, total) {
  const n = Math.max(0, Math.floor(Number(done) || 0));
  const N = Math.max(0, Math.floor(Number(total) || 0));
  return Math.max(0, N - n);
}
