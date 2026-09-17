/**
 * viewports.js — THE FRAMES THIS APP IS DESIGNED FOR, IN ORDER (round 63, ADR-099).
 *
 * ⚠️ A FACT THAT WAS WRONG FOR FOURTEEN ROUNDS. Every brief from round 38 to round 62 said
 * *"390px — khung tôi dùng nhiều nhất"*, and every layout decision was made against it. On
 * 2026-09-17 Đàm corrected it: **98% of his use is a MacBook Air M3, 2% is the iPhone.** So for
 * fourteen rounds the app was tuned for the frame he almost never opens.
 *
 * ⚠️ AND THE SCARCE AXIS FLIPS WITH THE FRAME. A phone is short of WIDTH; a laptop is short of
 * HEIGHT. Fourteen rounds of habits — stack it vertically, cap the column, let it scroll — are all
 * optimisations for the wrong axis on the frame that matters. Measured on the first laptop pass,
 * every one of the six main screens needed scrolling at 790px: the Focus screen was 1627px
 * (2,06 screens) and the ending card 1666px (2,11), which is the screen he meets several times a day.
 *
 * ⚠️ THE PHONE IS SECOND, NOT DROPPED. Nothing here licenses making 390px worse; it decides which
 * frame wins when the two disagree.
 *
 * PURE: no React, no DOM, no store. Numbers only, so a test and a doc can quote the same source.
 */

/**
 * MacBook Air M3 13,6" at its default scaled resolution ("Looks like 1470 × 956").
 * ⚠️ `CSS` is what the display reports; `CHROME` is what a real browser window leaves after the
 * menu bar, the tab strip and the address bar — and the second one is the number that decides
 * layout, because it is the one Đàm actually looks at. Design against `CHROME`.
 */
export const LAPTOP = {
  label: 'MacBook Air M3 13,6"',
  css: { width: 1470, height: 956 },
  chrome: { width: 1440, height: 790 },
};

/** iPhone, portrait. Second frame: must stay good, never leads. */
export const PHONE = {
  label: 'iPhone',
  chrome: { width: 390, height: 844 },
};

/**
 * The height a screen must fit into before it is allowed to scroll on the reference frame.
 * ⚠️ Read it as a CEILING ON THE DESIGN, not a target for the content: a screen that does not fit
 * is re-columned (a laptop has spare width), shrunk, or folded — never trimmed of content.
 */
export const LAPTOP_FOLD = LAPTOP.chrome.height;

/**
 * Where the app stops being one column and starts being two.
 * ⚠️ 1280 is Tailwind's `xl`, and it is the first width at which a 1440px laptop has genuinely
 * spare room after the 230px sidebar. Below it nothing changes, so the phone and the tablet are
 * untouched by every laptop decision this round makes.
 */
export const TWO_COLUMN_MIN = 1280;
