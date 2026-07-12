import test from 'node:test';
import assert from 'node:assert/strict';

import {
  parseGoalAdviceFromContext, recordGoalAdvice, pickGoalFollowup, buildAdviceMemoryLine,
  loadAdviceMemory, saveAdviceMemory, ADVICE_KEY,
} from './coachAdviceMemory.js';
import { findFabricatedNumbers } from './guard.js';

const DAY = 86400000;
const CTX_LINE = 'Mục tiêu ngày hơi quá sức: đạt 20% trên 15 ngày, trung vị 2 phiên/ngày (thử chỉnh về 3 phiên/ngày).';

test('parseGoalAdviceFromContext: rút đúng số từ dòng context; không khớp → null', () => {
  const a = parseGoalAdviceFromContext(`Tổng quan: 10 phiên.\n${CTX_LINE}`);
  assert.deepEqual(a, { verdict: 'too-hard', goalRate: 20, daysCounted: 15, suggested: '3', unit: 'phiên' });
  assert.equal(parseGoalAdviceFromContext('Tổng quan: 10 phiên.'), null);
  // bản "hơi nhẹ" + đơn vị phút
  const b = parseGoalAdviceFromContext('Mục tiêu ngày hơi nhẹ: đạt 80% trên 9 ngày, trung vị 120 phút/ngày (thử chỉnh về 150 phút/ngày).');
  assert.equal(b.verdict, 'too-easy'); assert.equal(b.suggested, '150'); assert.equal(b.unit, 'phút');
});

test('recordGoalAdvice: ghi khi trống; bỏ qua khi trùng trong cooldown; ghi lại khi đổi giá trị', () => {
  const adv = { verdict: 'too-hard', goalRate: 20, daysCounted: 15, suggested: '3', unit: 'phiên' };
  const t0 = 1000 * DAY;
  const r1 = recordGoalAdvice([], adv, t0);
  assert.equal(r1.changed, true);
  assert.equal(r1.list.length, 1);
  // cùng gợi ý, trong cooldown (1 ngày sau) → không ghi
  const r2 = recordGoalAdvice(r1.list, adv, t0 + 1 * DAY);
  assert.equal(r2.changed, false);
  // gợi ý ĐỔI (2 thay vì 3) trong cooldown → vẫn ghi
  const r3 = recordGoalAdvice(r1.list, { ...adv, suggested: '2' }, t0 + 1 * DAY);
  assert.equal(r3.changed, true);
  assert.equal(r3.list.length, 2);
  // cùng gợi ý nhưng đã QUA cooldown (3 ngày) → ghi lại
  const r4 = recordGoalAdvice(r1.list, adv, t0 + 3 * DAY);
  assert.equal(r4.changed, true);
});

test('pickGoalFollowup: chỉ chọn bản ghi đủ cũ (3..21 ngày), mới nhất trong cửa sổ', () => {
  const now = 1000 * DAY;
  const mk = (ageDays, suggested) => ({ at: now - ageDays * DAY, type: 'goalCalibration', suggested: String(suggested), unit: 'phiên', goalRate: 20, daysCounted: 15, verdict: 'too-hard' });
  const list = [mk(1, 9), mk(5, 5), mk(10, 4), mk(30, 1)]; // 1 ngày (quá mới), 5+10 (trong cửa sổ), 30 (quá cũ)
  const f = pickGoalFollowup(list, now);
  assert.equal(f.suggested, '5'); // mới nhất trong [3,21] là cái 5 ngày
  // không có cái nào trong cửa sổ → null
  assert.equal(pickGoalFollowup([mk(1, 9), mk(40, 1)], now), null);
});

test('buildAdviceMemoryLine: dòng nhắc-nhớ có số THẬT + guard KHÔNG báo bịa; null → ""', () => {
  const now = 1000 * DAY;
  const followup = { at: now - 7 * DAY, type: 'goalCalibration', suggested: '3', unit: 'phiên', goalRate: 20, daysCounted: 15, verdict: 'too-hard' };
  const line = buildAdviceMemoryLine(followup, now);
  assert.match(line, /khoảng 7 ngày trước/);
  assert.match(line, /về 3 phiên\/ngày/);
  assert.match(line, /20% trên 15 ngày/);
  assert.match(line, /tương quan, không phải kết luận/);
  // mọi số trong dòng đều có trong chính dòng (ctx) → không bị coi là bịa
  assert.deepEqual(findFabricatedNumbers(line, line), []);
  assert.equal(buildAdviceMemoryLine(null, now), '');
});

test('tích hợp: parse → record → (7 ngày sau) → pick → dòng nhắc nhắc đúng gợi ý cũ', () => {
  const t0 = 1000 * DAY;
  const adv = parseGoalAdviceFromContext(CTX_LINE);
  const { list } = recordGoalAdvice([], adv, t0);
  const later = t0 + 7 * DAY;
  const f = pickGoalFollowup(list, later);
  assert.ok(f);
  const line = buildAdviceMemoryLine(f, later);
  assert.match(line, /về 3 phiên\/ngày/); // gợi ý cũ "3" được nhớ lại
});

test('load/save: vòng đời với storage giả; lỗi storage → an toàn', () => {
  const mem = {};
  const storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
  assert.deepEqual(loadAdviceMemory(storage), []);
  saveAdviceMemory([{ at: 5 * DAY, type: 'goalCalibration', suggested: '3' }], storage);
  assert.equal(JSON.parse(mem[ADVICE_KEY]).length, 1);
  assert.equal(loadAdviceMemory(storage).length, 1);
  // storage ném lỗi → không throw
  const bad = { getItem: () => { throw new Error('x'); }, setItem: () => { throw new Error('x'); } };
  assert.deepEqual(loadAdviceMemory(bad), []);
  assert.doesNotThrow(() => saveAdviceMemory([{ at: 1 }], bad));
});
