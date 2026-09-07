/**
 * timerRing.test.js — pins the promises of the clock ring that no other gate watches.
 *
 * Why a source-reading test and not a screenshot: the RUNNING and BREAK colours only appear with a
 * real session running, and law #4 forbids starting a focus session on dev/localhost (dev shares
 * Đàm's production Supabase row — see `START_HERE.md`). So the two states that matter most are the
 * two that cannot be photographed; they are locked here, where they can actually drift.
 *
 * ADR-079 (round 39): ONE ring. Until round 38 a second, thinner arc around the clock drew the
 * daily-goal fraction in `--warn`; on a break it sat over the green arc and Đàm read the two as one
 * broken ring ("two arcs, green + yellow"). While a session runs the ONLY progress indicator on the
 * screen is the time left. This file used to pin the geometry of the second ring; it now pins its
 * ABSENCE, plus the three-colour rule of the Focus screen.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const SOURCE = await readFile(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');

/** Strip comments — otherwise a test reads the very counter-example its explanation quotes. */
function codeOnly(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}
const CODE = codeOnly(SOURCE);

/** Read a `const NAME = <expr>;` and EVALUATE it instead of copying the value. */
function evalConst(name) {
  const re = new RegExp(`const ${name} = ([^;]+);`);
  const m = re.exec(CODE);
  assert.ok(m, `constant \`${name}\` not found`);
  const scope = {};
  for (const d of ['RING_RADIUS', 'RING_STROKE']) {
    if (d === name) break;
    const mm = new RegExp(`const ${d} = ([^;]+);`).exec(CODE);
    if (mm) scope[d] = Function(...Object.keys(scope), `return (${mm[1]});`)(...Object.values(scope));
  }
  return Function(...Object.keys(scope), `return (${m[1]});`)(...Object.values(scope));
}

test('GEOMETRY: one thick ring, and the SVG frame hugs it without clipping', () => {
  const R = evalConst('RING_RADIUS');
  const S = evalConst('RING_STROKE');
  const SIZE = evalConst('SVG_SIZE');
  assert.ok(S >= 10, `the ring must be THICK to be the visual centre — it is ${S}px`);
  assert.ok(SIZE >= (R + S / 2) * 2, `SVG_SIZE = ${SIZE} but the ring needs ${(R + S / 2) * 2}px ⇒ clipped edge`);
  assert.ok(SIZE <= (R + S / 2) * 2 + 16, `SVG_SIZE = ${SIZE}: the frame is sized for a ring that is no longer drawn`);
});

test('ONE ARC (ADR-079): no daily-goal ring — no GOAL_RING constant, no `--warn` stroke, one track + one progress circle', () => {
  assert.doesNotMatch(CODE, /GOAL_RING/, 'the second ring came back under its old name');
  assert.doesNotMatch(CODE, /stroke: 'var\(--warn\)'/, 'a `--warn` arc is the daily-goal ring — on a break it overlapped the green one');
  assert.doesNotMatch(CODE, /dailyGoal\./, 'the clock no longer reads the daily-goal fraction — that lives on the idle postcard caption');
  assert.doesNotMatch(CODE, /getDailyGoalProgress/, 'same');
  // Progress is drawn by dashing an arc; exactly one element does that (the stopwatch's full ring
  // replaces it, never joins it). The disc and the track are plain circles with no dash.
  const dashed = (CODE.match(/strokeDasharray=/g) ?? []).length;
  const animated = (CODE.match(/<motion\.circle\b/g) ?? []).length;
  assert.equal(dashed, 1, `expected exactly ONE dashed (progress) arc, found ${dashed} — a second arc is a second progress indicator`);
  assert.equal(animated, 1, `expected exactly ONE animated arc, found ${animated}`);
});

test('COLOURS FROM TOKENS — no hard-coded code, in any theme branch', () => {
  const mapMatch = /const RING_COLORS = \{([\s\S]*?)\n\};/.exec(CODE);
  assert.ok(mapMatch, '`RING_COLORS` not found');
  const hard = [...mapMatch[1].matchAll(/#[0-9a-fA-F]{3,8}|rgba?\(/g)].map((m) => m[0]);
  assert.deepEqual(hard, [], `RING_COLORS still has hard-coded colours: ${hard.join(', ')}`);

  const breakLine = /const breakRingColor = ([^;]+);/.exec(CODE);
  assert.ok(breakLine, '`breakRingColor` not found');
  assert.match(breakLine[1], /var\(--good\)/, 'short and long breaks both use `var(--good)`');
  assert.ok(!/#[0-9a-fA-F]{3,8}/.test(breakLine[1]), `\`breakRingColor\` has a hard-coded colour: ${breakLine[1].trim()}`);
  assert.ok(!/lightTheme/.test(breakLine[1]), 'the ring colour must not branch on `lightTheme`: tokens already follow skin and mode');
  assert.match(CODE, /\[TIMER_STATES\.RUNNING\]: 'var\(--accent\)'/, 'focusing uses `var(--accent)`');
  assert.match(CODE, /stroke: 'var\(--timer-track/, 'the track uses `var(--timer-track)`');

  // The big number wears the ring's colour and nothing else — one accent per state (ADR-079).
  const tone = /const timerValueToneClass = ([^;]+);/.exec(CODE);
  assert.ok(tone, '`timerValueToneClass` not found');
  assert.doesNotMatch(tone[1], /text-(blue|sky|red|white|slate)/, `the clock number still uses a palette colour: ${tone[1].trim()}`);
  assert.match(tone[1], /var\(--good\)/, 'on a break the number is green like the arc');
  // The glow behind the ring is mixed from the same tokens, never a fixed rgba.
  const glow = /const immersiveGlow = ([\s\S]*?);\n/.exec(CODE);
  assert.ok(glow, '`immersiveGlow` not found');
  assert.doesNotMatch(glow[1], /rgba?\(\s*\d/, 'the glow has a numeric rgba — a colour outside the tokens');
});

test('ROUND CAPS on every arc', () => {
  const caps = [...CODE.matchAll(/strokeLinecap="(\w+)"/g)].map((m) => m[1]);
  assert.ok(caps.length >= 2, `only ${caps.length} strokeLinecap declarations — the extractor broke`);
  assert.deepEqual([...new Set(caps)], ['round'], `an arc end is not round: ${caps.join(', ')}`);
});

test('ONE LINE UNDER THE CLOCK (ADR-079): an ordinal from `describeClockSubline`, no per-device fraction, no pill', () => {
  assert.match(CODE, /describeClockSubline\(\{/, 'the line under the clock must come from the pure helper in engine/timerSession.js');
  assert.match(CODE, /\{clockSubline\}/, 'and be rendered as is');
  assert.doesNotMatch(CODE, /\/\$\{[^`\n]*hôm nay/, 'an "N/M hôm nay" fraction is back under the clock — it reads differently on each device');
  // The «Giải lao dài / Giải lao ngắn» pill above the ring duplicated the ring label; the label is
  // the only place the break kind is named.
  const pills = (CODE.match(/'Giải lao dài'/g) ?? []).length;
  assert.equal(pills, 1, `"Giải lao dài" appears ${pills} times — once (the ring label) is the rule`);
  assert.doesNotMatch(CODE, /'Giải lao ngắn'/);
});

test('THREE COLOURS (ADR-079): the Focus screen files use no Tailwind palette colour class', async () => {
  const dir = new URL('./focus/', import.meta.url);
  const files = [['PomodoroEngine.jsx', SOURCE]];
  for (const name of await readdir(dir)) {
    if (name.endsWith('.jsx')) files.push([`focus/${name}`, await readFile(new URL(name, dir), 'utf8')]);
  }
  const PALETTE = /(^|[^-\w])(bg|text|border|from|to|via|ring|shadow|fill|stroke|placeholder|divide|outline|decoration)-(slate|sky|blue|emerald|red|rose|amber|indigo|green|orange|yellow|zinc|gray|neutral|stone|white|black|purple|violet|pink|teal|cyan|lime)([-/][0-9]|\b)/;
  const hits = [];
  for (const [name, src] of files) {
    codeOnly(src).split('\n').forEach((line, i) => { if (PALETTE.test(line)) hits.push(`${name}:${i + 1}: ${line.trim()}`); });
  }
  assert.deepEqual(hits, [], `palette colours on the Focus screen (background · ink · one accent is the rule):\n${hits.join('\n')}`);
});
