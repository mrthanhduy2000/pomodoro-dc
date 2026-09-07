/**
 * soundEngine.cues.test.js — the three moments of a session have THREE DIFFERENT SOUNDS (ADR-078,
 * closing round 37's "shipped but nobody heard it").
 *
 * No speaker in the sandbox, so this test listens at the only place it can: the Web Audio calls.
 * A stub AudioContext records every oscillator (waveform · start frequency · start offset ·
 * duration). Two cues are "the same sound" when their recordings are identical; a cue that
 * records nothing is a silent function — the exact thing Đàm forbade ("a function that calls
 * into the void is worse than no function"). Checked for every sound pack, because a pack can
 * redefine any cue.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import soundEngine from './soundEngine.js';

const PACK_NAMES = ['classic', 'nature', 'synthwave', 'minimal'];

function makeRecorder() {
  const events = [];
  const param = (rec, key) => ({
    setValueAtTime: (v, t) => { rec[key] = v; rec[`${key}At`] = t; },
    linearRampToValueAtTime: (v, t) => { rec[`${key}End`] = v; rec[`${key}EndAt`] = t; },
  });
  const ctx = {
    currentTime: 0,
    state: 'running',
    destination: {},
    resume() { this.state = 'running'; },
    createOscillator() {
      const rec = { kind: 'osc' };
      return {
        set type(v) { rec.type = v; },
        get type() { return rec.type; },
        frequency: param(rec, 'freq'),
        connect() {},
        start(t) { rec.start = t; },
        stop(t) { rec.stop = t; events.push(rec); },
      };
    },
    createGain() {
      const rec = { kind: 'gain' };
      return { gain: param(rec, 'gain'), connect() {} };
    },
  };
  return { ctx, events };
}

/** Recording of one cue: the ordered list of oscillators it schedules. */
function record(play) {
  const { ctx, events } = makeRecorder();
  soundEngine._ctx = ctx;
  play();
  soundEngine._ctx = null;
  return events.map((e) => `${e.type}@${Math.round(e.freq)}Hz+${(e.start ?? 0).toFixed(3)}s×${((e.stop ?? 0) - (e.start ?? 0)).toFixed(3)}s`);
}

const CUES = {
  sessionStart: () => soundEngine.playSessionStart(),
  lastMinute: () => soundEngine.playLastMinute(),
  brickLaid: () => soundEngine.playBrickLaid(),
  finish: () => soundEngine.playTimerFinish(),
  breakOver: () => soundEngine.playBreakOver(),
  urgentTick: () => soundEngine.playUrgentTick(),
};

for (const pack of PACK_NAMES) {
  test(`pack "${pack}": start · last minute · brick landing · finish · break over are pairwise DIFFERENT and never silent`, () => {
    soundEngine.setPack(pack);
    assert.equal(soundEngine.pack, pack, 'unknown pack name — the table of packs changed, update PACK_NAMES');
    soundEngine.enabled = true;
    const recordings = Object.fromEntries(Object.entries(CUES).map(([name, play]) => [name, record(play)]));
    for (const [name, rec] of Object.entries(recordings)) {
      assert.ok(rec.length >= 1, `${pack}/${name} scheduled NO oscillator — a silent cue is a function that calls into the void`);
    }
    const names = Object.keys(recordings);
    for (let i = 0; i < names.length; i += 1) {
      for (let j = i + 1; j < names.length; j += 1) {
        assert.notDeepEqual(recordings[names[i]], recordings[names[j]],
          `${pack}: "${names[i]}" and "${names[j]}" are the SAME sound — Đàm could not tell the two moments apart`);
      }
    }
    // The last-minute bell is ONE sustained tone (a bell, not a jingle) and clearly longer than
    // the urgent tick — the two must not be confused in the final seconds.
    assert.equal(recordings.lastMinute.length, 1, `${pack}: last minute must be a single bell`);
    const dur = (r) => parseFloat(r.split('×')[1]);
    assert.ok(dur(recordings.lastMinute[0]) > dur(recordings.urgentTick[0]) * 3, `${pack}: the bell must ring visibly longer than a tick`);
  });
}

test('the cues are wired to their moments, and the first one happens inside the tap (autoplay-safe)', () => {
  const timer = readFileSync(new URL('../hooks/useTimer.js', import.meta.url), 'utf8');
  const story = readFileSync(new URL('../components/SessionRewardStory.jsx', import.meta.url), 'utf8');
  const audio = readFileSync(new URL('./audioContext.js', import.meta.url), 'utf8');

  // 1 · session start: `playSessionStart()` is called synchronously in the Start handler — the
  //     AudioContext is created/resumed INSIDE a user gesture, which is what iOS Safari requires.
  const start = timer.indexOf('soundEngine.playSessionStart();');
  assert.ok(start > 0, 'no session-start cue');
  assert.ok(timer.lastIndexOf('setTimerState(TIMER_STATES.RUNNING);', start) > start - 200,
    'the start cue must sit next to the state switch in the Start handler, not in a timer callback');
  assert.match(audio, /state === 'suspended'\) holder\._ctx\.resume\(\)/, 'a suspended context must be resumed before a cue');

  // 2 · last minute: rung ONCE, armed above 60 s and disarmed after ringing — never every tick.
  assert.match(timer, /LAST_MINUTE_SECONDS = 60/);
  assert.match(timer, /lastMinuteArmedRef\.current = true;/);
  assert.match(timer, /soundEngine\.playLastMinute\(\);\s*\n\s*lastMinuteArmedRef\.current = false;/,
    'the bell must disarm itself right after ringing');

  // 3 · brick landing: rung when the project card of the ending shows, and only there.
  assert.match(story, /if \(cardId === 'project'\) soundEngine\.playBrickLaid\(\);/);
  const brickCalls = (timer + story).match(/playBrickLaid\(\)/g) ?? [];
  assert.equal(brickCalls.length, 1, 'the brick sound has exactly one caller: the ending card');
});

test('haptics: there is NO vibration code, on purpose — iOS Safari has no Vibration API', () => {
  // A `navigator.vibrate` call would be a no-op on every iPhone (the API is not implemented in
  // Safari on iOS) — a function that calls into the void. If one ever appears, this goes red and
  // whoever adds it must show a device where it works.
  const files = ['../hooks/useTimer.js', './soundEngine.js', '../components/SessionRewardStory.jsx', '../components/PomodoroEngine.jsx'];
  for (const f of files) {
    const src = readFileSync(new URL(f, import.meta.url), 'utf8');
    assert.doesNotMatch(src, /navigator\.vibrate|haptic/i, `${f} contains vibration/haptic code that cannot run on iOS`);
  }
});
