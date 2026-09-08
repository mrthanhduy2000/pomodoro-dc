/**
 * stageMetrics.js — THE CITY PICTURE'S HEIGHT IS ONE NUMBER, AND EVERYTHING READS THAT NUMBER.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY THIS FILE EXISTS — measured on 2026-09-08, iPhone 390×844, a 12-era save (`shot.mjs --probe`)
 *
 *   the city picture           201 px  = 23,8 % of the screen — the SMALLEST block on the tab named
 *                                        after it (header 202 · era strip 217 · stat grid 135)
 *   the picture started at     y = 494  (8 eras: 421 · 15 eras: ~564) — one has to scroll to see it
 *
 * The whole picture had exactly one line of geometry: `aspectRatio: 1 / 0.62` on the stage. That
 * makes the height a SLAVE of the card's width and says nothing about how much of the SCREEN the
 * picture deserves. Round 42 solved the same problem for the clock ring (`focus/ringMetrics.js`,
 * ADR-083) and paid for the lesson: TWO expressions for one shape — a drawn size and a reserved
 * size — drift apart the moment a viewport cap binds (427 px drawn in a 281 px hole). So here, as
 * there, there is ONE owner and the slot has no size of its own.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * THE THREE TERMS — and the smallest wins
 *
 *   `aspect-ratio: 1.3`   ← the FLOOR of the frame. `engine/city3d/orbit.js` fits the camera for a
 *                            1,30 frame (`FRAME_FIT_ASPECT`): "a wider frame only adds margin, a
 *                            narrower one CUTS the city". So the picture may be as tall as
 *                            width ÷ 1,3 and not one pixel taller — taller would zoom the same
 *                            vertical FOV into a narrower frame and crop the near corner. That is
 *                            why this file imports the engine's constant instead of typing 1,3:
 *                            the black box owns the number, this file obeys it.
 *   `calc(100svh − reserve)` ← never taller than the screen minus everything else on it, so Đàm
 *                            sees the picture, the destination AND the skill points without
 *                            scrolling (his acceptance test for the round).
 *   `<ceiling>px`         ← never absurd on a very tall window.
 *
 * On the phone the aspect floor binds (350 ÷ 1,3 ≈ 269 px); on a desktop window the viewport term
 * binds. Either way what is reserved IS what is drawn: `CityScene3D` runs in `fill` mode inside this
 * frame and reads the frame's height — it has no aspect of its own any more.
 *
 * ⚠️ NEVER give the frame a second height (a `height`, a wrapper with `aspect-ratio`, a transform).
 * ⚠️ NEVER lower the aspect floor below `FRAME_FIT_ASPECT` — that is the one way to crop a building
 * without touching the camera, and the 3D city is a finished black box.
 * ⚠️ The reserves are DECLARED, not measured at runtime, for the same reason as the ring's: a
 * ResizeObserver feeding a size that feeds a layout is a loop, and a declared reserve fails SAFE
 * (too large only shrinks the picture). Each reserve lists what it contains, so raising one means
 * naming what grew.
 */
import { FRAME_FIT_ASPECT } from '../../engine/city3d/orbit';

/** The frame's aspect floor — the engine's own fit ratio, never a local copy of it. */
export const STAGE_ASPECT_FLOOR = FRAME_FIT_ASPECT;

/** Ceilings, in px, on the picture's rendered height. `compact` = phone/tablet column · `wide` = md+. */
export const STAGE_MAX_PX = Object.freeze({ compact: 560, wide: 680 });

/**
 * The picture never collapses below this, whatever the screen — a 667 px phone still gets a city,
 * and pays for it with a little scrolling rather than with a postage stamp.
 */
export const STAGE_MIN_PX = 200;

/**
 * The height everything OTHER than the picture needs on the City tab, per context, in px —
 * measured in the browser on 2026-09-08 (`shot.mjs --probe`) after the round-46 layout, then rounded
 * UP so the picture gives way first.
 */
export const STAGE_HEIGHT_RESERVE_PX = Object.freeze({
  // Measured top to bottom at 390×844, 12 eras (`--probe`, 2026-09-08): top rail — title, level and
  // bell only (77) + pt-5 (20) + era tiles, two rows (80) + gap (13) + caption block: era name ·
  // status · country (63) + gap (13) + stat grid 2×2 (135) + floating tab bar clearance (118) = 519,
  // + safety (8) — spent at 15 eras, where the era name wraps in the rail and the country line wraps
  // in the caption (measured +34 px), so the reserve is a floor for the common case, not the worst.
  // At 390 px the ASPECT floor binds first (348 ÷ 1,3 ≈ 268 px); this term takes over on shorter
  // phones. The «Kéo để xoay» hint costs nothing here: it is a pill ON the picture.
  compact: 527,
  // Measured at 1280×900: top rail (89) + pt-8 (32) + h1 + subtitle + mb-6 (116) + era tiles, one row
  // (38) + gap (13) + caption block (67) + gap (13) + stat row (62) + pb-8 (32) = 462.
  // No safety on purpose: the desktop has no floating bar to clear, and every px here is picture.
  wide: 462,
});

/**
 * Which of the two contexts a render is in. `wide` = the `md` breakpoint (768 px), where the
 * ShellPane title block appears and the era tiles fit one row.
 * @param {{wide?: boolean}} at
 * @returns {'compact'|'wide'}
 */
export function stageContext({ wide = false } = {}) {
  return wide ? 'wide' : 'compact';
}

/**
 * The frame's inline style: aspect floor + the two caps. The frame's `width` is the column's
 * (`100%`); nothing else about its size is declared anywhere.
 * @param {'compact'|'wide'|{wide?: boolean}} at
 */
export function stageFrameStyle(at) {
  const key = typeof at === 'string' ? at : stageContext(at);
  return {
    aspectRatio: `${STAGE_ASPECT_FLOOR} / 1`,
    maxHeight: `min(${STAGE_MAX_PX[key]}px, calc(100svh - ${STAGE_HEIGHT_RESERVE_PX[key]}px))`,
    minHeight: `${STAGE_MIN_PX}px`,
  };
}

/**
 * The same three terms, evaluated. The browser does this in CSS; tests do it here.
 * @param {'compact'|'wide'|{wide?: boolean}} at
 * @param {{width:number, height:number}} frame  the viewport, in CSS px
 * @param {number} columnWidth  the width of the column the picture spans, in CSS px
 */
export function stageHeightPx(at, frame, columnWidth) {
  const key = typeof at === 'string' ? at : stageContext(at);
  const byAspect = columnWidth / STAGE_ASPECT_FLOOR;
  const byViewport = frame.height - STAGE_HEIGHT_RESERVE_PX[key];
  return Math.max(STAGE_MIN_PX, Math.min(STAGE_MAX_PX[key], byAspect, byViewport));
}
