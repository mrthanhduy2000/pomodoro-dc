/**
 * ringMetrics.js — THE RING'S SIZE IS ONE NUMBER, AND EVERYTHING READS THAT NUMBER.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY THIS FILE EXISTS — the bug it deletes, not the feature it adds
 *
 * Round 39 moved the session goal and the break line OUT of the disc and UNDER the ring, because
 * inside the disc every real goal ran across the stroke. The new position was right; the way it
 * was measured was not. The ring was drawn at
 *
 *     min(canvasPx, viewportCap)          ← a box …
 *     × transform: scale(visualScale)      ← … then blown up by a transform
 *
 * while the space reserved under it was computed from a SECOND, different expression
 * (`min(canvasPx × visualScale + pad, viewportCap)`). A transform does not change layout, so the
 * moment the viewport cap bit, the two disagreed. Measured on 2026-09-08, iPhone 390 in full
 * screen, a session running: the ring RENDERED 427 px tall, the slot RESERVED 281 px, and the goal
 * line therefore started 32 px INSIDE the arc — "sức khoẻ" was swallowed by the ring. At 1280 and
 * 2000 in full screen the same fragment of stacked blocks was dropped into a ROW flex container,
 * so the goal line flew to the ring's right edge and landed on top of the digits.
 *
 * ⇒ Two parallel expressions for one circle is the bug. There is now ONE:
 *
 *   • `ringSizeCss()` is the ring's WIDTH. `aspect-ratio: 1` derives the height from it.
 *   • The slot around it has NO height of its own (auto) — so what is reserved IS what is drawn,
 *     by construction. There is no second number left to disagree with the first.
 *   • Nothing scales the ring by transform any more. What you measure is what you see.
 *
 * ⚠️ NEVER give the ring's slot a `minHeight`/`height` again, and never wrap the ring in a
 * transform that scales it. Both re-create the exact gap this file was written to close.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * AND THE SECOND HALF: text INSIDE the disc is a FRACTION of the disc
 *
 * The old font sizes were absolute rem values per breakpoint, tuned for the ring size of the day.
 * That is the same class of bug one layer in: change the ring and the text stays put, so it either
 * rattles around in a big disc or runs over the stroke in a small one. Round 39 already paid for
 * this once (`tracking-widest` → `tracking-wide` after "180:00" overflowed by 9 px).
 *
 * Every string inside the disc is now sized in `cqw` — 1 % of the ring's own width — so the answer
 * to "what if this ring were 20 % bigger?" is "the text is 20 % bigger, and the margin is
 * unchanged". `clockFitsRing()` proves the margin holds, and `ringText.test.js` runs it over every
 * string the clock can produce at every ring size the app can build.
 */

/** The SVG's own coordinate system — the drawing, not the box it is drawn into. */
export const RING_ART = Object.freeze({ radius: 128, stroke: 14, pad: 4 });

/** The SVG viewBox edge: the ring plus its stroke plus a hair, so the stroke is never clipped. */
export const RING_ART_SIZE = (RING_ART.radius + RING_ART.stroke / 2) * 2 + RING_ART.pad;

/**
 * The dark disc inside the ring, as a fraction of the whole box. Text lives in HERE, not in the
 * box — the difference is the stroke, and the stroke is exactly what text used to run over.
 */
export const DISC_DIAMETER_RATIO = ((RING_ART.radius - RING_ART.stroke / 2 - 2) * 2) / RING_ART_SIZE;

/**
 * Ceilings, in px, on the ring's rendered diameter.
 *
 * ⚠️ These are CEILINGS, not sizes. The ring is normally smaller than its ceiling because the
 * height budget below binds first; the ceiling only stops it growing absurd on a very tall window.
 * `compact` = phone/tablet column · `wide` = the desktop Focus stage · `fullScreen` = the mode
 * whose whole job is to be nothing but the clock.
 */
export const RING_MAX_PX = Object.freeze({ compact: 320, wide: 460, fullScreen: 720 });

/**
 * The height everything OTHER than the ring needs, per context, in px — measured in the browser on
 * 2026-09-08 (`shot.mjs --probe`), then rounded UP so the ring gives way first.
 *
 * ⚠️ WHY A DECLARED NUMBER AND NOT A MEASUREMENT AT RUNTIME: a `ResizeObserver` feeding a size that
 * feeds a layout that feeds the observer is a loop that can oscillate, and it would run 60× a
 * second for 25 minutes on a battery. A declared reserve is checked by EYE at the four frames Đàm
 * judges on — which is the acceptance he asked for — and it fails SAFE: too large only shrinks the
 * ring, it can never put text back on the arc (the slot has no height of its own any more).
 *
 * What each reserve contains is written next to it, so raising one means naming what grew.
 */
export const RING_HEIGHT_RESERVE_PX = Object.freeze({
  // section pt-8/pb-2 (40) + goal/break line, two lines (44) + gap (12) + button row (72)
  // + the docked «Sổ tay phiên» row (64) + safety (40)
  fullScreen: 272,
  // pt-8 (32) + postcard (224) + moment slot (44) + mt-6 (24) + card py-10 (80) + brick strip (26)
  // + goal line (24) + button row (72) + pb-8 (32) + safety (72, and it is EARNED: the greeting
  // block above runs 2 or 3 lines depending on the day — round 20 lost a whole ceiling to that)
  wide: 610,
  // pt-4 (16) + postcard (192) + mt-4 (16) + card py-8 (64) + brick strip (26) + goal line, two
  // lines (44) + button row (52) + floating tab bar (118) + safety (38)
  compact: 566,
});

/**
 * The same reserve, as a share of the viewport height — and the SMALLER of the two wins.
 *
 * ⚠️ WHY BOTH. The reserve above is in px because the things it counts are px: a button row, a line
 * of text, the floating tab bar. But on a SHORT screen those px are a much bigger share, and a fixed
 * reserve then leaves the ring nothing: `ringText.test.js` caught exactly that at 375×667 — 566 px
 * of reserve against a 667 px screen left a 101 px clock, i.e. the screen "fitting" by deleting the
 * only thing on it. The cap here is what makes the chrome give way FIRST on a short screen, and it
 * is honest only because the chrome really does shrink there: the city postcard is
 * `h-[min(168px,20svh)]` (`focus/CityPostcard.jsx`), unchanged at 844 px, 35 px smaller at 667 px.
 * At every frame Đàm actually judges on, the px reserve is the smaller one and nothing moves.
 */
export const RING_HEIGHT_RESERVE_SVH = Object.freeze({ fullScreen: 40, wide: 70, compact: 75 });

/** The share of the viewport height the whole Focus stack may occupy. 100 = all of it. */
export const RING_HEIGHT_BUDGET_SVH = 100;

/**
 * The share of the column's width the ring may take. 94, not 100, for two reasons that are the same
 * reason: Đàm's screenshot (c) — «vòng gần chạm mép trái/phải của thẻ» — and the fact that the glow
 * behind the ring is drawn at `inset-[-10%]`, so a ring at 100 % puts its own halo outside the card.
 */
export const RING_WIDTH_BUDGET_PCT = 94;

/**
 * Which of the three contexts a render is in.
 * @param {{fullScreen?: boolean, wide?: boolean}} at
 * @returns {'fullScreen'|'wide'|'compact'}
 */
export function ringContext({ fullScreen = false, wide = false } = {}) {
  if (fullScreen) return 'fullScreen';
  return wide ? 'wide' : 'compact';
}

/**
 * The ring's diameter as ONE CSS length. Used for `width`; `aspect-ratio: 1` gives the height.
 *
 * Three terms, and the smallest wins:
 *   `<ceiling>px`            — never absurd on a tall window
 *   `94%`                    — never wider than the column it sits in (this is what stops the ring
 *                              hanging 19 px off the left edge of a 390 px phone in full screen)
 *   `calc(100svh - min(<reserve>px, <reserve>svh))`
 *                            — never taller than the screen minus everything else, which is what
 *                              makes "no screen ever scrolls" hold instead of being hoped for
 */
export function ringSizeCss(at) {
  const key = typeof at === 'string' ? at : ringContext(at);
  const ceiling = RING_MAX_PX[key];
  const reserve = RING_HEIGHT_RESERVE_PX[key];
  const reserveSvh = RING_HEIGHT_RESERVE_SVH[key];
  return `min(${ceiling}px, ${RING_WIDTH_BUDGET_PCT}%, calc(${RING_HEIGHT_BUDGET_SVH}svh - min(${reserve}px, ${reserveSvh}svh)))`;
}

/**
 * The same three terms, evaluated. The browser does this in CSS; tests do it here.
 * @param {'fullScreen'|'wide'|'compact'|{fullScreen?:boolean,wide?:boolean}} at
 * @param {{width:number, height:number}} frame  the viewport, in CSS px
 * @param {number} columnWidth  the width of the column the ring sits in, in CSS px
 */
export function ringSizePx(at, frame, columnWidth) {
  const key = typeof at === 'string' ? at : ringContext(at);
  return Math.max(0, Math.min(
    RING_MAX_PX[key],
    (RING_WIDTH_BUDGET_PCT / 100) * columnWidth,
    (RING_HEIGHT_BUDGET_SVH / 100) * frame.height - ringReservePx(key, frame.height),
  ));
}

/** The reserve that actually applies at this viewport height: the smaller of the px and svh forms. */
export function ringReservePx(at, viewportHeight) {
  const key = typeof at === 'string' ? at : ringContext(at);
  return Math.min(RING_HEIGHT_RESERVE_PX[key], (RING_HEIGHT_RESERVE_SVH[key] / 100) * viewportHeight);
}

// ── TEXT INSIDE THE DISC ──────────────────────────────────────────────────────────────────────

/**
 * Every string inside the ring, as a percentage of the ring's width (`cqw`).
 *
 * Calibrated against what the screen showed before this change, so the clock does not visibly
 * change size where it was already right: at the 274 px phone ring `clockShort` gives 68.5 px
 * against the old 72 px, and at the 460 px desktop ring it gives 115 px against the old ~100 px.
 */
export const RING_TEXT_CQW = Object.freeze({
  label: 3.6,       // "ĐANG TẬP TRUNG" — uppercase, wide tracking
  clockShort: 25,   // "25:00"
  clockLong: 20.5,  // "180:00" — the stopwatch past 100 minutes, the longest the clock can get
  subline: 4.8,     // "Phiên thứ 1 hôm nay"
  hint: 3.9,        // the stopwatch's two small lines
});

/**
 * Horizontal advance of ONE clock glyph, in em.
 *
 * ⚠️ NOT A GUESS — and not a home-made measuring tool either. Round 39 measured the same string in
 * the real browser at three tracking values: "180:00" at font-size 72 px came out 247 px at
 * `tracking-widest` (0.1em), 226 px at `wider` (0.05em) and 215 px at `wide` (0.025em). Solving the
 * first for the glyph advance gives (247 − 6 × 0.1 × 72) / 6 / 72 = 0.4718 em, and that single
 * constant then PREDICTS the other two at 225.4 and 214.6 — both within 1 px of what the browser
 * reported. A constant that predicts two measurements it was not fitted to is a measurement, not a
 * model. (Digits are tabular here, so every glyph — including ":" — has the same advance.)
 */
export const CLOCK_ADVANCE_EM = 0.4718;

/** The clock's tracking, in em. Matches `tracking-wide` in the component. */
export const CLOCK_TRACKING_EM = 0.025;

/** 6 characters means the stopwatch has passed 100 minutes; it needs the smaller of the two sizes. */
export function clockCqw(text) {
  return String(text).length >= 6 ? RING_TEXT_CQW.clockLong : RING_TEXT_CQW.clockShort;
}

/** How wide `text` renders at `fontPx`, tracking included. */
export function clockWidthPx(text, fontPx, trackingEm = CLOCK_TRACKING_EM) {
  return String(text).length * (CLOCK_ADVANCE_EM + trackingEm) * fontPx;
}

/**
 * The chord of the inner disc at a vertical offset of `dyRatio × ringPx` from the centre — i.e.
 * how much room a line of text actually has where it sits, not at the widest point of the circle.
 */
export function discChordPx(ringPx, dyRatio) {
  const r = (DISC_DIAMETER_RATIO / 2) * ringPx;
  const dy = Math.abs(dyRatio) * ringPx;
  if (dy >= r) return 0;
  return 2 * Math.sqrt(r * r - dy * dy);
}

/**
 * Where the widest edge of each line sits, as a fraction of the ring's diameter from the centre.
 * The clock straddles the centre, so its own half-height is the offset that matters; the label sits
 * above it and the subline below. Deliberately generous — being wrong here must cost margin, not
 * a collision.
 */
export const RING_LINE_DY_RATIO = Object.freeze({ label: 0.20, clock: 0.13, subline: 0.24 });

/**
 * Does a clock string fit the disc where it is drawn?
 * @returns {{fontPx:number, widthPx:number, chordPx:number, marginRatio:number, fits:boolean}}
 */
export function clockFitsRing(text, ringPx, cqw = clockCqw(text)) {
  const fontPx = (cqw / 100) * ringPx;
  const widthPx = clockWidthPx(text, fontPx);
  const chordPx = discChordPx(ringPx, RING_LINE_DY_RATIO.clock);
  return {
    fontPx,
    widthPx,
    chordPx,
    marginRatio: chordPx > 0 ? 1 - widthPx / chordPx : -1,
    fits: widthPx <= chordPx,
  };
}
