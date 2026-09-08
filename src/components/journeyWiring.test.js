/**
 * journeyWiring.test.js — the destination must be ON SCREEN, not merely computed.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ THIS FILE EXISTS BECAUSE THE PROJECT HAS ALREADY LOST THIS EXACT BET, TWICE.
 *   · `summarizeMuseum` was written, documented and unit-tested at Phase 4B, and no screen called
 *     it for months (`city/cityViewShellWiring.test.js` tells that story).
 *   · `describeStageCountdown` — the EP→sessions converter — was written with a threshold, a
 *     silence rule and its own tests, and round 43 found it reachable from exactly ONE screen while
 *     the top rail, on every tab, still printed raw EP all day.
 * Both times: build green, lint clean, every test green, no "unused" warning (the function IS used
 * — by its own test). **An engine test proves a function RUNS; it never proves anyone CALLS it.**
 *
 * So these tests read the source of the call sites. That is the only layer where "nobody wired it"
 * is visible, and it is the layer lint and build cannot see.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const APP = await readFile(new URL('../App.jsx', import.meta.url), 'utf8');
const BAR = await readFile(new URL('./shared/EraStageBar.jsx', import.meta.url), 'utf8');
const CITY = await readFile(new URL('./city/CityViewShell.jsx', import.meta.url), 'utf8');
const RANK = await readFile(new URL('./RankDisplay.jsx', import.meta.url), 'utf8');
const SKILLS = await readFile(new URL('./SkillTree.jsx', import.meta.url), 'utf8');

/** Strip comments, so a test never reads its own explanation and calls it code. */
function codeOnly(source) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

// ─── THE RAIL ────────────────────────────────────────────────────────────────────────────────
// RED WHEN: the `progressText` prop is dropped from either EraStageBar call site. The bar still
// renders — it falls back to the EP string it has always had — so nothing else notices.
test('both tenants of EraStageBar pass a progressText, so neither falls back to EP', () => {
  const app = codeOnly(APP);
  const uses = app.match(/<EraStageBar[\s\S]*?\/>/g) ?? [];
  assert.ok(uses.length >= 1, 'App.jsx no longer renders EraStageBar at all.');
  for (const use of uses) {
    assert.match(use, /progressText=/, `An EraStageBar in App.jsx has no progressText and will print raw EP:\n${use}`);
  }
  assert.match(app, /railProgressText=\{railProgress\.text\}/,
    'The Focus screen postcard no longer receives the rail text — its caption is the same bar and would print EP.');
});

test('App.jsx actually calls useJourney — the hook is not left sitting in the tree unused', () => {
  const app = codeOnly(APP);
  assert.match(app, /import\s+useJourney\s+from\s+'\.\/hooks\/useJourney'/);
  assert.match(app, /useJourney\s*\(/,
    'useJourney is imported but never called — exactly the failure mode this file was written for.');
});

// RED WHEN: someone "restores" the number the round removed, in the bar itself.
test('EraStageBar prefers progressText over its EP fallback, not the other way round', () => {
  const bar = codeOnly(BAR);
  assert.match(bar, /progressText\s*\n?\s*\?\?/,
    'EraStageBar no longer prefers progressText — the EP string would win again.');
});

// ─── THE CITY CELL ───────────────────────────────────────────────────────────────────────────
// RED WHEN: the fourth stat cell is reverted to a decorative number. The screen looks fine either
// way, which is precisely why this needs a test rather than an eye.
test('the city screen spends one of its four stat cells on the destination', () => {
  const city = codeOnly(CITY);
  assert.match(city, /import\s*\{\s*describeJourney\s*\}\s*from\s*'\.\.\/\.\.\/engine\/journey'/);
  assert.match(city, /describeJourney\s*\(/, 'CityViewShell imports describeJourney but never calls it.');
  assert.match(city, /label:\s*'Thành phố'/, 'The destination cell is gone from the city stat grid.');
  assert.doesNotMatch(city, /label:\s*'Cư dân'/,
    'The residents cell came back. It is decoration — nothing Đàm can do anything with — and it costs one of only four slots.');
});

// ─── NO SCREEN TELLS A DISTANCE IN EP ANY MORE ───────────────────────────────────────────────
// RED WHEN: the rank card or the level card is edited back to raw units. Both once printed a
// number Đàm cannot spend: `3.955 / 672` (EP, and met, so the fraction read like a bug) and
// «Còn 5.438 XP nữa lên cấp 6».
test('the rank card states its first condition in sessions, never as an EP fraction', () => {
  const rank = codeOnly(RANK);
  assert.doesNotMatch(rank, /step\.epInEra\.toLocaleString\(\)\}\s*\/\s*\$\{step\.epRequired/,
    'The rank card prints the raw EP fraction again.');
  assert.match(rank, /medianSessionEP\s*\(/, 'The rank card no longer converts its distance into sessions.');
  assert.match(rank, /sessionsToStageEnd\s*\(/);
});

test('the level card states its distance in sessions, with the XP number only as a fallback', () => {
  const skills = codeOnly(SKILLS);
  assert.match(skills, /medianSessionXP\s*\(/, 'The level card no longer estimates sessions to the next level.');
  assert.match(skills, /sessionsToNextLevel/,
    'The level line stopped asking how many sessions the next level is away.');
});
