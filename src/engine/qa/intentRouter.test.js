import test from 'node:test';
import assert from 'node:assert/strict';

import { routeIntent, buildIntentIndex, normalizeVi, stripDiacritics } from './intentRouter.js';

const idx = buildIntentIndex();
const route = (q) => routeIntent(q, idx);

test('normalize + strip dấu', () => {
  assert.equal(stripDiacritics('buổi tối đẹp'), 'buoi toi dep');
  assert.ok(normalizeVi('Tuần Này?').includes('tuan nay'));
});

test('định tuyến đúng ý định (có dấu + không dấu + teen-code)', () => {
  const cases = [
    ['tuần này tôi thế nào', 'this-week'],
    ['tuan nay so voi tuan truoc', 'this-week'],
    ['giờ vàng của mình', 'best-time'],
    ['gio vang cua minh la khi nao', 'best-time'],
    ['nên làm phiên bao nhiêu phút', 'session-length'],
    ['chuỗi của tôi mấy ngày rồi', 'streak'],
    ['sao tôi hay bỏ phiên buổi tối', 'abandon'],
    ['giờ này nên làm gì', 'recommendation'],
    ['mục tiêu ngày có hợp lý không', 'goal-calibration'],
    ['kỷ lục của tôi', 'records'],
    ['bạn làm được gì', 'capabilities'],
    ['tóm tắt giúp mình', 'overview'],
    ['dạo này tôi hay làm gì', 'note-topics'],
  ];
  for (const [q, exp] of cases) {
    const r = route(q);
    assert.equal(r.status, 'ok', `"${q}" phải route ok (được ${r.status})`);
    assert.equal(r.intent, exp, `"${q}" → ${r.intent}, mong ${exp}`);
  }
});

test('câu lạc đề → unknown/low + mời escalate', () => {
  for (const q of ['app này tải file kiểu gì', 'kể chuyện cười đi', 'một cộng một bằng mấy']) {
    const r = route(q);
    assert.ok(r.status === 'unknown' || r.status === 'low', `"${q}" → ${r.status}`);
    assert.equal(r.suggestEscalate, true);
  }
});

test('tất định: gọi 2 lần cùng câu → y hệt', () => {
  assert.deepEqual(route('giờ vàng của mình'), route('giờ vàng của mình'));
});

test('câu rỗng → empty', () => {
  assert.equal(route('').status, 'empty');
});
