/**
 * sessionCredits.test.js — the ledger that finally lets the ending name who paid.
 *
 * Every case answers *"red when you remove WHAT?"* (project law #3) and each was checked by
 * actually removing that thing.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { SKILL_TREE, XP_FACTOR_HARD_CAP } from './constants.js';
import { SKILL_LABEL, makeCreditLedger, settleCredits, topCredits, MAX_CREDIT_CHIPS } from './sessionCredits.js';
import { calculateRewards } from './gameMath.js';

// ─── NAMES COME FROM THE TREE, NEVER FROM A SECOND COPY ──────────────────────────────────────
// RED WHEN: someone types a skill name into this module. A hand-written table drifts the first
// time a node is renamed, and the ending card would then credit a skill by a name that exists
// nowhere else in the app.
test('every skill in the tree has a label, and the labels are the tree own labels', () => {
  const nodes = Object.values(SKILL_TREE).flatMap((b) => b.nodes);
  assert.equal(Object.keys(SKILL_LABEL).length, nodes.length);
  for (const n of nodes) assert.equal(SKILL_LABEL[n.id], n.label);
});

// ─── THE LEDGER ──────────────────────────────────────────────────────────────────────────────
test('a zero contribution is never recorded — no chip for a skill that did nothing', () => {
  const l = makeCreditLedger();
  l.add('vao_guong', 'skill', 0);
  l.add('chuyen_can', 'skill', 0, 0);
  assert.equal(l.list.length, 0);
  l.add('chuyen_can', 'skill', 0.08);
  assert.equal(l.list.length, 1);
});

// ⚠️ THE TEST THIS FILE EXISTS FOR. Below the hard cap the factor is a plain sum, so each credit is
// exactly its share; the chips must add up to the bonus the session actually paid.
// RED WHEN: the conversion drops the multiplier, or uses baseXP alone.
test('below the cap, the credits add up to exactly the bonus XP the session paid', () => {
  const baseXP = 500;
  const multiplier = 1.3;
  const credits = [
    { id: 'a', kind: 'skill', label: 'A', xpPct: 0.08 },
    { id: 'b', kind: 'skill', label: 'B', xpPct: 0.05 },
  ];
  const rawXpFactor = 1 + 0.08 + 0.05;
  const settled = settleCredits({
    credits, baseXP, multiplier, rawXpFactor, cappedXpFactor: rawXpFactor,
    rawEpFactor: 1, cappedEpFactor: 1,
  });
  const paidBonus = Math.round(baseXP * multiplier * rawXpFactor) - Math.round(baseXP * multiplier);
  const summed = settled.reduce((n, c) => n + c.xp, 0);
  assert.ok(Math.abs(summed - paidBonus) <= 2, `chips claim ${summed} XP, session paid ${paidBonus}`);
});

// RED WHEN: the proportional rescale is removed. At the cap the raw percentages claim more XP than
// the session actually paid, so the chips would add up to more than the headline above them — the
// fastest way for a breakdown to lose all credibility.
test('at the hard cap the credits are scaled down so they never claim more than was paid', () => {
  const rawXpFactor = XP_FACTOR_HARD_CAP + 2;
  const credits = [{ id: 'a', kind: 'skill', label: 'A', xpPct: rawXpFactor - 1 }];
  const settled = settleCredits({
    credits, baseXP: 100, multiplier: 1, rawXpFactor, cappedXpFactor: XP_FACTOR_HARD_CAP,
    rawEpFactor: 1, cappedEpFactor: 1,
  });
  const uncapped = 100 * (rawXpFactor - 1);
  assert.ok(settled[0].xp < uncapped, 'the credit was not scaled down at the cap');
  assert.ok(settled[0].xp <= 100 * XP_FACTOR_HARD_CAP);
});

// ─── DISPLAY ─────────────────────────────────────────────────────────────────────────────────
// RED WHEN: the cap on chips is lifted. Eight chips under one big number is the 360-badge wall
// coming back in a different shape.
test('at most three chips are shown, the rest are counted rather than hidden', () => {
  const many = Array.from({ length: 8 }, (_, i) => ({ id: `s${i}`, kind: 'skill', label: `S${i}`, xp: i + 1, epPct: 0 }));
  const { shown, hiddenCount } = topCredits(many);
  assert.equal(shown.length, MAX_CREDIT_CHIPS);
  assert.equal(hiddenCount, 8 - MAX_CREDIT_CHIPS);
  assert.deepEqual(shown.map((c) => c.xp), [8, 7, 6], 'the biggest contributors must lead');
});

// ─── THE WIRE, END TO END ────────────────────────────────────────────────────────────────────
// ⚠️ An engine test proves a function runs, never that anyone calls it — this project has shipped
// three finished-but-uncalled functions. So this one runs the REAL reward calculation.
// RED WHEN: a `ledger.add` line is dropped from `gameMath.js`, or `credits` stops being returned.
test('a real session calculation names the skills that fired', () => {
  const out = calculateRewards(50, { vao_guong: true, chuyen_can: true }, 1000, {}, {});
  const ids = out.credits.map((c) => c.id);
  assert.ok(ids.includes('vao_guong'), `«Vào Guồng» fired but was not credited: ${ids.join(', ')}`);
  assert.ok(ids.includes('chuyen_can'), `«Chuyên Cần» fired but was not credited: ${ids.join(', ')}`);
  for (const c of out.credits) {
    assert.ok(c.label && c.label !== c.id, `credit «${c.id}» has no human label`);
    assert.ok(c.xp > 0 || c.epPct > 0);
  }
});

// RED WHEN: a skill's bonus is added to the math but no credit line is written beside it — the
// silent-skill bug this whole round exists to kill, reintroduced one skill at a time.
test('a skill that pays nothing this session is not credited', () => {
  const out = calculateRewards(20, { vao_guong: true, chuyen_can: true }, 1000, {}, {});
  assert.deepEqual(out.credits.map((c) => c.id), [], 'a skill was credited for a session it did not touch');
});

// RED WHEN: relics and building perks go back to being anonymous — they enter the maths as three
// pre-summed numbers, so without `sources` the ending can never name them.
test('a relic that buffs the session is named, not folded into an anonymous total', () => {
  const out = calculateRewards(50, {}, 1000, {
    expBonus: 0.1,
    sources: [{ id: 'relic:x', kind: 'relic', label: 'Ngọc Thử', xpPct: 0.1 }],
  }, {});
  const relic = out.credits.find((c) => c.id === 'relic:x');
  assert.ok(relic, 'the relic paid but was not named');
  assert.equal(relic.label, 'Ngọc Thử');
  assert.ok(relic.xp > 0);
});

// ⚠️ ROUND 45 (ADR-085) — A PERCENTAGE THAT MOVES THE NUMBER MUST ARRIVE WITH A NAME.
// Three kinds of buff meet in `sessionRewards.js`: rank titles and relics come from
// `aggregateActiveBuffs`, building perks from `wonderPassiveBuffs`. Each contributes to the SAME
// two accumulators (`expBonus`, `epBonus`), and each now also contributes to the SAME list of
// sources. The failure this guards is the quiet one: a future buff adds its percentage and forgets
// its name, so the ending card keeps printing three chips while a fourth thing is silently paying.
// That is precisely the bug round 45 exists to fix — 27 of 36 skills were exactly this — and it
// cannot be caught by any assertion on the payout, because the payout stays right.
// THỬ-CHO-ĐỎ: xoá dòng gộp `activeBuffs.sources = [...]` ⇒ bài này đỏ.
test('every buff that moves expBonus/epBonus also merges its source list', () => {
  const src = readFileSync(new URL('./sessionRewards.js', import.meta.url), 'utf8');
  // Which buff bags are folded into the accumulators?
  const bags = new Set(
    [...src.matchAll(/activeBuffs\.(?:expBonus|epBonus)\s*\+=\s*(\w+)\./g)].map((m) => m[1]),
  );
  assert.ok(bags.size > 0, 'không còn phép cộng buff nào — phép đo chạy rỗng');
  for (const bag of bags) {
    assert.ok(
      new RegExp(`activeBuffs\\.sources\\s*=[^;]*\\b${bag}\\.sources`).test(src),
      `\`${bag}\` cộng phần trăm của nó vào phần thưởng nhưng KHÔNG nối tên của nó vào `
      + '`activeBuffs.sources` — thẻ kết phiên sẽ trả một con số không ai nhận',
    );
  }
});
