import test from 'node:test';
import assert from 'node:assert/strict';

import {
  stripHtmlToText, l2normalize, cosineSimilarity, buildTfidfVectors,
  clusterByThreshold, labelCluster, findSimilar, analyzeNoteThemes,
} from './semantic.js';

test('cosine & l2normalize cơ bản', () => {
  assert.equal(cosineSimilarity([1, 0], [0, 1]), 0);
  assert.equal(cosineSimilarity([1, 0], [1, 0]), 1);
  assert.equal(cosineSimilarity([], [1]), 0);
  const u = l2normalize([3, 4]);
  assert.ok(Math.abs(Math.hypot(u[0], u[1]) - 1) < 1e-9);
  assert.deepEqual(l2normalize([0, 0]), [0, 0]);
});

test('stripHtmlToText bỏ thẻ', () => {
  assert.equal(stripHtmlToText('<p>ôn <b>thi</b></p>'), 'ôn thi');
});

test('tfidf: ghi chú cùng nghĩa gần nhau hơn khác nghĩa', () => {
  const v = buildTfidfVectors(['ôn thi toán', 'ôn tập toán', 'nấu ăn tối']);
  const same = cosineSimilarity(v[0], v[1]);
  const diff = cosineSimilarity(v[0], v[2]);
  assert.ok(same > diff, `same(${same}) phải > diff(${diff})`);
});

test('clusterByThreshold: 3 cụm rõ ràng → 3 nhãn, tất định', () => {
  const vecs = [
    [1, 0, 0], [0.99, 0.1, 0], [0.97, 0.05, 0.05],
    [0, 1, 0], [0.1, 0.99, 0], [0.05, 0.97, 0.05],
    [0, 0, 1], [0, 0.1, 0.99], [0.05, 0.05, 0.97],
  ];
  const a = clusterByThreshold(vecs, { threshold: 0.5 });
  assert.equal(new Set(a).size, 3);
  assert.equal(a[0], a[1]); assert.equal(a[1], a[2]);
  assert.equal(a[3], a[4]); assert.equal(a[4], a[5]);
  assert.equal(a[6], a[7]); assert.equal(a[7], a[8]);
  assert.notEqual(a[0], a[3]);
  assert.deepEqual(clusterByThreshold(vecs, { threshold: 0.5 }), a); // tất định
});

test('labelCluster chọn đại diện gần tâm; findSimilar đúng thứ tự + loại trừ', () => {
  const vecs = [[1, 0], [0.9, 0.1], [0, 1]];
  const lab = labelCluster([0, 1], vecs, ['phiên A', 'phiên B']);
  assert.ok(lab.label === 'phiên A' || lab.label === 'phiên B');
  assert.equal(lab.size, 2);
  const sim = findSimilar([1, 0], vecs, { topK: 2, excludeIndex: 0, minScore: 0 });
  assert.equal(sim[0].index, 1); // gần [1,0] nhất (sau khi loại 0)
  assert.ok(sim[0].score >= (sim[1]?.score ?? 0));
});

test('analyzeNoteThemes: thiếu ghi chú → chưa sẵn sàng', () => {
  const r = analyzeNoteThemes([{ completed: true, nextNote: 'ôn thi' }], {});
  assert.equal(r.ready, false);
});

test('analyzeNoteThemes: gom đúng chủ đề lặp lại', () => {
  const h = [
    { completed: true, minutes: 30, nextNote: 'ôn thi toán cuối kỳ' },
    { completed: true, minutes: 30, nextNote: 'ôn tập toán cho thi' },
    { completed: true, minutes: 30, nextNote: 'làm đề toán ôn thi' },
    { completed: true, minutes: 40, nextNote: 'đọc sách lịch sử thế giới' },
    { completed: true, minutes: 40, nextNote: 'đọc sách lịch sử Việt Nam' },
    { completed: true, minutes: 40, nextNote: 'đọc thêm sách lịch sử' },
    { completed: true, minutes: 20, nextNote: 'gọi điện cho khách' },
  ];
  const r = analyzeNoteThemes(h, {});
  assert.equal(r.ready, true);
  assert.ok(r.themes.length >= 2);
  assert.ok(r.themes.some((t) => /toán|thi/i.test(t.label)));
  assert.ok(r.themes.some((t) => /sách|lịch sử/i.test(t.label)));
});
