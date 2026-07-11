import test from 'node:test';
import assert from 'node:assert/strict';

import { evaluateStreakRisk, pickActiveBucketLabel, buildStreakNudgePayload } from '../_lib/coachDigest.js';

const sess = (dayNum, hour = 9, ok = true) => ({ day: dayNum, hour, minutes: 30, completed: ok, cancelled: !ok });
const getDay = (e) => e.day;
const getHour = (e) => e.hour;

test('evaluateStreakRisk: còn chuỗi + hôm nay CHƯA làm → atRisk; đã làm → không; chuỗi 0 → không', () => {
  const today = 100;
  const hist = [sess(99), sess(98), sess(97)]; // hôm nay (100) chưa có phiên
  assert.deepEqual(
    evaluateStreakRisk({ history: hist, currentStreak: 3, nowDayNumber: today, getEntryDayNumber: getDay }),
    { atRisk: true, streak: 3, hasToday: false },
  );
  // hôm nay đã có phiên → không treo
  const r2 = evaluateStreakRisk({ history: [sess(100), ...hist], currentStreak: 3, nowDayNumber: today, getEntryDayNumber: getDay });
  assert.equal(r2.atRisk, false);
  assert.equal(r2.hasToday, true);
  // chuỗi 0 → không bao giờ treo
  assert.equal(evaluateStreakRisk({ history: hist, currentStreak: 0, nowDayNumber: today, getEntryDayNumber: getDay }).atRisk, false);
  // phiên hôm nay bị HUỶ → vẫn coi là chưa làm
  assert.equal(evaluateStreakRisk({ history: [sess(100, 9, false), ...hist], currentStreak: 3, nowDayNumber: today, getEntryDayNumber: getDay }).atRisk, true);
});

test('pickActiveBucketLabel: buổi chiếm ưu thế (≥40%, đủ mẫu) → nhãn; mờ/thiếu mẫu → null', () => {
  // 6 phiên tối (19h) + 1 sáng → "buổi tối" ưu thế
  const hist = [...Array(6)].map((_, i) => sess(i, 19)).concat([sess(7, 8)]);
  assert.equal(pickActiveBucketLabel({ history: hist, getEntryHour: getHour }), 'buổi tối');
  // thiếu mẫu (<5) → null
  assert.equal(pickActiveBucketLabel({ history: [sess(1, 19), sess(2, 19)], getEntryHour: getHour }), null);
  // dàn đều không buổi nào ≥40% → null
  const flat = [sess(1, 8), sess(2, 12), sess(3, 15), sess(4, 19), sess(5, 23)];
  assert.equal(pickActiveBucketLabel({ history: flat, getEntryHour: getHour }), null);
});

test('buildStreakNudgePayload: định dạng push (title/body/tag), có/không mẹo buổi', () => {
  const p = buildStreakNudgePayload({ streak: 6, activeBucketLabel: 'buổi tối' });
  assert.match(p.title, /Chuỗi 6 ngày đang treo/);
  assert.match(p.body, /buổi tối/);
  assert.equal(p.tag, 'dc-coach-streak-risk');
  assert.equal(p.url, '/');
  // không có buổi → mẹo chung
  assert.match(buildStreakNudgePayload({ streak: 2 }).body, /Làm 1 phiên ngắn/);
});
