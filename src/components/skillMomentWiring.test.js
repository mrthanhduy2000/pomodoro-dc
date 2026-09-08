/**
 * skillMomentWiring.test.js — opening a skill must be a MOMENT, and it must be reachable.
 *
 * ⚠️ WHY A WIRING TEST AND NOT ONLY AN ENGINE TEST. This project has shipped three finished-but-
 * uncalled engine functions (`summarizeMuseum`, `describeStageCountdown`, twice over), and round 41
 * lost a whole banner to a subtler version of the same thing: `DayMoment` was mounted INSIDE
 * `GlobalOverlays`, which early-returns null whenever nothing is blocking, so it never rendered on
 * an ordinary screen and nothing went red. `SkillMoment` sits in exactly that trap's blast radius.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const APP = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
const STORE = readFileSync(new URL('../store/gameStore.js', import.meta.url), 'utf8');
const MOMENT = readFileSync(new URL('./focus/SkillMoment.jsx', import.meta.url), 'utf8');

/** Strip comments so a test never reads its own explanation and calls it code. */
function codeOnly(source) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

// RED WHEN: `<SkillMoment />` is moved inside `<GlobalOverlays>` — the exact mistake that hid
// round 41's day banner until a photograph found it.
test('SkillMoment is mounted OUTSIDE GlobalOverlays, like DayMoment', () => {
  const app = codeOnly(APP);
  const moment = app.indexOf('<SkillMoment');
  const overlays = app.indexOf('<GlobalOverlays');
  assert.ok(moment > 0, 'App.jsx does not render <SkillMoment> at all.');
  assert.ok(overlays > 0, 'App.jsx no longer renders <GlobalOverlays> — this test needs re-aiming.');
  assert.ok(
    moment < overlays,
    'SkillMoment moved inside GlobalOverlays, which early-returns null when nothing is blocking — '
    + 'the banner would never appear on an ordinary screen and nothing else would go red.',
  );
});

// RED WHEN: the two banners are allowed to fire at once again. Both sit at `top: 96px`; the first
// photograph of this feature came back showing the DAY banner instead, because it wins the race.
test('a skill unlock silences the day/week banner, which shares its position', () => {
  const app = codeOnly(APP);
  assert.match(app, /skillUnlockedOpen/, 'App.jsx no longer tracks whether a skill moment is up.');
  const dayMount = app.match(/<DayMoment[\s\S]{0,220}?\/>/);
  assert.ok(dayMount, 'App.jsx no longer renders <DayMoment>.');
  assert.match(
    dayMount[0], /skillUnlockedOpen/,
    'DayMoment is no longer quieted by a skill unlock — two banners would stack at the same 96px.',
  );
});

// ⚠️ THE ORDER TEST. `previewSkillGain` measures by running the reward formula with the skill OFF
// and ON. Called after the `set()` that unlocks it, "off" already contains the skill and the answer
// is always 0 — the banner would appear saying nothing, which is the silence this round exists to
// end. RED WHEN: the preview call is moved below the `set(`.
test('the gain is measured BEFORE the skill is written into state', () => {
  const store = codeOnly(STORE);
  const unlock = store.slice(store.indexOf('unlockSkill:'), store.indexOf('dismissSkillUnlocked:'));
  assert.ok(unlock.length > 0, 'unlockSkill / dismissSkillUnlocked no longer sit together in the store.');
  const preview = unlock.indexOf('previewSkillGain(');
  const write = unlock.indexOf('set((prev)');
  assert.ok(preview > 0, 'unlockSkill no longer measures what the skill is worth.');
  assert.ok(write > 0, 'unlockSkill no longer writes state — this test needs re-aiming.');
  assert.ok(
    preview < write,
    'previewSkillGain runs AFTER the unlock is written, so the before/after comparison sees the '
    + 'skill on both sides and always measures +0.',
  );
});

// RED WHEN: the banner is made permanent. ADR-080: a thing that stands still is noise; a thing that
// happens and is gone is a reward. Unlocking is rare — roughly one per finished building — which is
// exactly what earns a moment rather than a badge.
test('the moment leaves on its own and blocks nothing while it is up', () => {
  const moment = codeOnly(MOMENT);
  assert.match(moment, /setTimeout\(/, 'the banner no longer dismisses itself — it became permanent.');
  assert.match(moment, /VISIBLE_MS/);
  assert.match(moment, /pointer-events-none/, 'the banner wrapper stopped being click-through — it now blocks the screen under it.');
  assert.doesNotMatch(moment, /role="dialog"/, 'the moment became a dialog — round 45 forbids a blocking box for this.');
});
