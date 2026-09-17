/**
 * surface.test.js — THE GATE THAT KEEPS ONE APP LOOKING LIKE ONE APP (round 62, ADR-098).
 *
 * ⚠️ WHY A TEST AND NOT A CONVENTION. Every one of the drifts this file now forbids was introduced
 * by a careful commit. Nobody typed a second card style on purpose; they typed a card style, in a
 * file, because there was no name to import. **A threshold with no guard is a funnel** — the
 * project's own doc-budget lesson, applied to pixels instead of tokens.
 *
 * ⚠️ AND IT MUST BE ABLE TO GO RED. Each case below was checked by actually reintroducing the drift
 * it describes; the *"red when you remove WHAT?"* answer is written above each one.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { CARD, CARD_INSET, EYEBROW, ratio, remaining } from './surface.js';

const ROOT = new URL('../', import.meta.url).pathname;

/** Every component the app actually ships, minus the frozen 3D city (Đàm forbids touching it). */
function componentFiles(dir = ROOT, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === 'render3d' || name === 'city3d') continue;
      componentFiles(full, out);
    } else if (name.endsWith('.jsx')) {
      out.push(full);
    }
  }
  return out;
}

const FILES = componentFiles();
const SOURCES = FILES.map((f) => [f.replace(ROOT, ''), readFileSync(f, 'utf8')]);

// ─── THE EYEBROW ─────────────────────────────────────────────────────────────────────────────
// ⚠️ THE COUNT THAT STARTED THE ROUND: 22 size+tracking combinations over 111 instances of ONE
// visual element. Not a single one was wrong on its own; together they were the reason the app
// read as thirteen people's work.
// RED WHEN: any `text-[11px] … uppercase … tracking-[0.18em]`-style pair comes back.
test('the small uppercase label has exactly ONE size and ONE tracking, app-wide', () => {
  // ⚠️ SCOPED TO 10–12px ON PURPOSE. Below that the app uses uppercase letters as an ICON
  // FALLBACK — `hasGlyphIcon(x) ? 'text-[20px]' : 'mono text-[9px] uppercase …'` — where the size
  // is dictated by the icon slot it has to fill, not by a label hierarchy. Those are not eyebrows
  // and forcing them to 10px would push letters out of a 24px circle. Same for the 22px glyph
  // stand-in on the ending's project card.
  const PAIR = /(?:text-\[(1[0-2](?:\.5)?)px\][^"'`]*uppercase[^"'`]*tracking-\[([\d.]+)em\]|uppercase[^"'`]*tracking-\[([\d.]+)em\][^"'`]*text-\[(1[0-2](?:\.5)?)px\])/g;
  const seen = new Map();
  for (const [name, src] of SOURCES) {
    for (const m of src.matchAll(PAIR)) {
      const size = m[1] ?? m[4];
      const track = m[2] ?? m[3];
      // A pill with its own background is a BADGE, a different element with its own one rule.
      const key = `${size}px/${track}em`;
      if (!seen.has(key)) seen.set(key, name);
    }
  }
  const allowed = new Set(['10px/0.2em', '11px/0.14em']);
  const stray = [...seen.entries()].filter(([k]) => !allowed.has(k));
  assert.deepEqual(
    stray, [],
    'một biến thể mới của cái nhãn nhỏ viết hoa. Chỉ có HAI hình dạng hợp lệ: nhãn mục '
    + '(10px/0.2em, `EYEBROW`) và viên nhãn có nền (11px/0.14em). Thấy: '
    + stray.map(([k, f]) => `${k} ở ${f}`).join(' · '),
  );
  assert.ok(EYEBROW.includes('text-[10px]') && EYEBROW.includes('tracking-[0.2em]'));
});

// ─── THE CARD ────────────────────────────────────────────────────────────────────────────────
// ⚠️ THE DRIFT THAT PROVES THE POINT: three byte-identical copies plus a fourth that hardcoded
// `1px` where the others read the skin variable — so under a skin that sets it, Thống kê had a
// different border width from the whole rest of the app, invisibly, for ten rounds.
// RED WHEN: a component declares its own card surface again instead of importing `CARD`.
test('no component redeclares the card surface — one source, or it drifts again', () => {
  const OWN_CARD = /(?:const|let)\s+[A-Za-z_$][\w$]*\s*=\s*\{[^}]*?background:\s*['"`]var\(--card-bg-solid\)['"`][^}]*?borderRadius:\s*['"`]var\(--skin-radius-card/s;
  const offenders = SOURCES.filter(([, src]) => OWN_CARD.test(src)).map(([name]) => name);
  assert.deepEqual(
    offenders, [],
    'một bản sao mới của mặt thẻ. Bốn bản sao cũ đã lệch một bản mà không ai thấy trong mười vòng — '
    + `import { CARD } from './shared/surface' thay vì gõ lại: ${offenders.join(', ')}`,
  );
  assert.equal(CARD.background, 'var(--card-bg-solid)');
  assert.equal(CARD_INSET.boxShadow, 'none', 'bóng lồng trong bóng đọc ra như một lỗi dựng hình');
  assert.equal(CARD_INSET.borderRadius, CARD.borderRadius, 'thẻ trong thẻ phải cùng hình học');
});

// ─── THE DENOMINATOR ─────────────────────────────────────────────────────────────────────────
// ⚠️ ONE SCREEN, FOUR SHAPES: `38/75 công trình` · `4/5` · `38/75 còn 37` · `0 / 7`.
// RED WHEN: a spaced slash comes back between two rendered numbers.
test('a number with a denominator is written n/N — never with spaces around the slash', () => {
  const SPACED = /\{[^{}]*\}\s+\/\s+\{[^{}]*\}/g;
  const hits = [];
  for (const [name, src] of SOURCES) {
    for (const m of src.matchAll(SPACED)) hits.push(`${name}: ${m[0].slice(0, 46)}`);
  }
  assert.deepEqual(
    hits, [],
    'dấu gạch có khoảng trắng hai bên. Ô «Chuỗi» in "0 / 7" trong khi tám viên nhãn ngay dưới nó in '
    + `"4/5" — một quan hệ, hai kiểu chấm câu, trên cùng một màn hình: ${hits.join(' · ')}`,
  );
});

// ⚠️ RED WHEN: the maths stops clamping. A negative or fractional numerator is how a denominator
// turns into `-1/75` on a screen Đàm is looking at.
test('ratio and remaining clamp, floor, and survive rubbish', () => {
  assert.equal(ratio(38, 75), '38/75');
  assert.equal(ratio(0, 7), '0/7');
  assert.equal(ratio(-3, 75), '0/75', 'âm phải kẹp về 0, không in ra màn hình');
  assert.equal(ratio(4.7, 5.2), '4/5', 'số lẻ phải sàn, không in "4.7/5.2"');
  assert.equal(ratio(undefined, null), '0/0');
  assert.equal(remaining(38, 75), 37);
  assert.equal(remaining(80, 75), 0, 'vượt đích thì còn 0, không phải -5');
  assert.equal(remaining('hỏng', 'hỏng'), 0);
});
