/**
 * ringText.test.js — THE GATE ĐÀM ASKED FOR IN ROUND 42: text may never land on a graphic.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * WHY A TEST AND NOT A LESSON
 *
 * Round 39 closed "no text is ever CUT". Round 42 closes the next one: "no text ever lands ON
 * something else". Both had already been written down as lessons before they broke — and the
 * project's own rule says why that was never going to be enough: *a lesson that is written down
 * stops nothing; only a TEST stops anything.*
 *
 * What broke, twice, is the same shape: a size was expressed as an ABSOLUTE number next to a shape
 * whose size could change. Đàm's two questions for round 42 name it exactly —
 *   «nếu chữ này dài gấp đôi thì sao? nếu hình này to hơn 20% thì sao?»
 * — and this file answers both by construction rather than by inspection:
 *
 *   • "20 % bigger" — every string inside the disc is sized in `cqw`, a FRACTION of the ring, so
 *     the ratio of text to shape is a constant. The tests below run every ring diameter the app can
 *     build, from the smallest phone to full screen on a 2000 px desktop, and demand the same margin
 *     at all of them. A ratio that only holds at one size would fail at the others.
 *   • "twice as long" — the longest string the clock can produce is "180:00" (`clampFocusMinutes`
 *     stops the stopwatch at 180 minutes). It is tested, and so is a deliberately absurd 8-character
 *     string, which MUST fail: a gate that passes everything is not a gate.
 *
 * ⚠️ THE MEASURING TOOL IS THE FIRST SUSPECT (lesson #1 of this project, paid for 28 times). The
 * glyph advance used here is not a guess and not a home-made estimator: it is solved from a real
 * in-browser measurement round 39 recorded, and it then PREDICTS two further measurements it was
 * not fitted to, both within 1 px. The calibration test below re-runs that prediction, so if anyone
 * ever changes the constant, the three real numbers it has to reproduce go red first.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CLOCK_ADVANCE_EM,
  DISC_DIAMETER_RATIO,
  RING_HEIGHT_RESERVE_PX,
  RING_MAX_PX,
  ringReservePx,
  RING_TEXT_CQW,
  clockCqw,
  clockFitsRing,
  clockWidthPx,
  discChordPx,
  ringSizeCss,
  ringSizePx,
} from './ringMetrics.js';

/** Every ring diameter the app can actually build, in px, coarse enough to run instantly. */
const RING_SIZES = [];
for (let d = 160; d <= RING_MAX_PX.fullScreen; d += 5) RING_SIZES.push(d);

/** Every string the clock can show. `formatTime` gives MM:SS, then HHH:MM past 100 minutes. */
const CLOCK_STRINGS = ['00:00', '01:00', '25:00', '59:59', '99:59', '100:00', '180:00'];

test('CALIBRATION: the glyph advance reproduces the three widths round 39 measured in the browser', () => {
  // "180:00" at font-size 72 px, measured in Chromium: 247 px at 0.1em tracking, 226 at 0.05em,
  // 215 at 0.025em. The constant was solved from the FIRST one only.
  const measured = [[0.1, 247], [0.05, 226], [0.025, 215]];
  for (const [tracking, px] of measured) {
    const predicted = clockWidthPx('180:00', 72, tracking);
    assert.ok(
      Math.abs(predicted - px) <= 1.5,
      `at tracking ${tracking}em the browser measured ${px}px, the constant predicts ${predicted.toFixed(1)}px`,
    );
  }
  assert.ok(CLOCK_ADVANCE_EM > 0.4 && CLOCK_ADVANCE_EM < 0.55, 'the advance left the range a real font can have');
});

test('THE CLOCK NEVER TOUCHES THE RING — every string, every ring size the app can build', () => {
  const tight = [];
  for (const text of CLOCK_STRINGS) {
    for (const ringPx of RING_SIZES) {
      const fit = clockFitsRing(text, ringPx);
      assert.ok(
        fit.fits,
        `"${text}" at a ${ringPx}px ring is ${fit.widthPx.toFixed(0)}px wide against a ${fit.chordPx.toFixed(0)}px chord`,
      );
      // A margin under 10 % is a collision waiting for one font-stack difference.
      assert.ok(
        fit.marginRatio >= 0.10,
        `"${text}" at ${ringPx}px clears the disc by only ${(fit.marginRatio * 100).toFixed(1)}%`,
      );
      tight.push(fit.marginRatio);
    }
  }
  // ⚠️ And the ratio must be the SAME at every size — that is what "a fraction of the ring" means,
  // and it is exactly what absolute rem values could not promise. Spread across 5×113 combinations.
  const perText = CLOCK_STRINGS.map((t) => RING_SIZES.map((d) => clockFitsRing(t, d).marginRatio));
  for (const [i, series] of perText.entries()) {
    const spread = Math.max(...series) - Math.min(...series);
    assert.ok(
      spread < 1e-9,
      `"${CLOCK_STRINGS[i]}" clears the disc by a DIFFERENT fraction at different ring sizes `
      + `(spread ${spread}) — its size is not a fraction of the ring`,
    );
  }
});

test('THE GATE CAN GO RED: a string long enough to reach the stroke is rejected', () => {
  // ⚠️ "A test that has never gone red is not a test" (`CLAUDE.md` §3D laws). Ten characters at the
  // short ratio is what an unguarded change looks like — the gate must refuse it.
  const absurd = clockFitsRing('1888:88:88', 320, RING_TEXT_CQW.clockShort);
  assert.equal(absurd.fits, false, 'a 10-character clock fits the disc — then this gate proves nothing');
  // And so must the real 6-character string if someone puts it back on the 5-character ratio.
  const wrongRatio = clockFitsRing('180:00', 320, RING_TEXT_CQW.clockShort * 1.35);
  assert.equal(wrongRatio.fits, false, 'a 35 %-oversized clock still fits — the chord is being read too generously');
});

test('SIX CHARACTERS GET THE SMALLER RATIO — the rule that keeps "180:00" honest', () => {
  assert.equal(clockCqw('25:00'), RING_TEXT_CQW.clockShort);
  assert.equal(clockCqw('180:00'), RING_TEXT_CQW.clockLong);
  assert.ok(RING_TEXT_CQW.clockLong < RING_TEXT_CQW.clockShort, 'the long string must get the smaller size');
});

test('THE LINES ABOVE AND BELOW THE CLOCK FIT THEIR OWN CHORD, NOT THE WIDEST ONE', () => {
  // The label and the subline sit off-centre, where the disc is narrower than its diameter. Widths
  // are estimated with the same advance plus their own tracking; both must clear at the smallest
  // ring the app can build (160 px), which is where they are tightest.
  const cases = [
    { text: 'ĐANG TẬP TRUNG', cqw: RING_TEXT_CQW.label, tracking: 0.22, dy: 0.20 },
    { text: 'Phiên thứ 1 hôm nay', cqw: RING_TEXT_CQW.subline, tracking: 0, dy: 0.24 },
    { text: 'Ghi nhận theo phút thực tế', cqw: RING_TEXT_CQW.hint, tracking: 0, dy: 0.30 },
  ];
  for (const { text, cqw, tracking, dy } of cases) {
    for (const ringPx of RING_SIZES) {
      const width = clockWidthPx(text, (cqw / 100) * ringPx, tracking);
      const chord = discChordPx(ringPx, dy);
      assert.ok(
        width <= chord * 0.95,
        `"${text}" is ${width.toFixed(0)}px at a ${ringPx}px ring, against a ${chord.toFixed(0)}px chord`,
      );
    }
  }
});

test('THE RING NEVER OUTGROWS ITS FRAME — the four frames Đàm judges on, in every context', () => {
  const FRAMES = [
    { name: 'iPhone nhỏ', width: 375, height: 667 },
    { name: 'iPhone nhỏ (cao)', width: 375, height: 844 },
    { name: 'iPhone', width: 390, height: 844 },
    { name: 'Máy bàn', width: 1280, height: 900 },
    { name: 'Máy bàn rộng', width: 2000, height: 1080 },
  ];
  // The column the ring sits in, per context, measured 2026-09-08 with `shot.mjs --probe`.
  const COLUMN = { compact: (w) => Math.min(w - 82, 582), wide: () => 582, fullScreen: (w) => Math.min(w - 40, 960) };
  for (const frame of FRAMES) {
    for (const context of ['compact', 'wide', 'fullScreen']) {
      if (context === 'wide' && frame.width < 768) continue;
      const ring = ringSizePx(context, frame, COLUMN[context](frame.width));
      const reserve = ringReservePx(context, frame.height);
      assert.ok(
        ring + reserve <= frame.height,
        `${context} at ${frame.name}: a ${ring.toFixed(0)}px ring plus ${reserve.toFixed(0)}px of `
        + `everything else is taller than the ${frame.height}px screen ⇒ the screen scrolls`,
      );
      assert.ok(ring <= COLUMN[context](frame.width), `${context} at ${frame.name}: the ring is wider than its column`);
      assert.ok(
        ring >= 150,
        `${context} at ${frame.name}: the ring collapsed to ${ring.toFixed(0)}px — below ~150px the clock `
        + 'stops being the biggest thing on the screen, which is the one thing this screen is for',
      );
    }
  }
});

test('THE CSS SAYS THE SAME THING THE ARITHMETIC SAYS — three terms, no fourth', () => {
  for (const context of ['compact', 'wide', 'fullScreen']) {
    const css = ringSizeCss(context);
    assert.match(
      css, /^min\(\d+px, \d+%, calc\(100svh - min\(\d+px, \d+svh\)\)\)$/,
      `\`${css}\` is not the three-term min() with the two-form reserve`,
    );
    assert.ok(css.includes(`${RING_MAX_PX[context]}px`), 'the px ceiling in the CSS is not the one the tests evaluate');
    assert.ok(css.includes(`${RING_HEIGHT_RESERVE_PX[context]}px`), 'the reserve in the CSS is not the one the tests evaluate');
  }
});

test('THE DISC IS SMALLER THAN THE BOX — text is measured against the disc, never the frame', () => {
  // The stroke is exactly what text used to run over, so the chord must be read from the INNER disc.
  assert.ok(DISC_DIAMETER_RATIO < 0.92, 'the disc ratio no longer subtracts the ring stroke');
  assert.ok(DISC_DIAMETER_RATIO > 0.75, 'the disc ratio subtracts far more than the stroke — the clock will look tiny');
  assert.ok(discChordPx(400, 0.4) < discChordPx(400, 0), 'the chord does not narrow away from the centre');
  assert.equal(discChordPx(400, 0.5), 0, 'a line outside the disc is reported as having room');
});
