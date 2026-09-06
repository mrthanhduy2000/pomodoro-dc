/**
 * relicGrowth.test.js — di vật tiến hoá theo PHIÊN (ADR-070). Đóng `TECH_DEBT #96`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { RELIC_EVOLUTION, RELIC_EVOLVE_MIN_MINUTES, RELIC_EVOLVE_SESSIONS } from './constants.js';
import {
  applyRelicEvolutions, countSessionsSince, describeRelicGrowth, evaluateRelicEvolutions,
  relicStageThresholds, stageForSessions, withCanonicalRelicText,
} from './relicGrowth.js';

const T0 = Date.parse('2026-09-01T00:00:00Z');
const H = 3_600_000;
const phien = (offsetH, minutes = 25, extra = {}) => ({ timestamp: new Date(T0 + offsetH * H).toISOString(), minutes, completed: true, ...extra });
const ID = Object.keys(RELIC_EVOLUTION)[0];
const relic = { id: ID, earnedAt: new Date(T0).toISOString() };

test('ngưỡng bậc: bậc 0 luôn 0; hệ số kỳ quan làm tròn LÊN và không bao giờ về 0', () => {
  assert.deepEqual(relicStageThresholds(1), RELIC_EVOLVE_SESSIONS);
  const nhanh = relicStageThresholds(0.7);
  assert.equal(nhanh[0], 0);
  assert.equal(nhanh[1], Math.ceil(RELIC_EVOLVE_SESSIONS[1] * 0.7));
  assert.ok(nhanh[1] < RELIC_EVOLVE_SESSIONS[1]);
  assert.deepEqual(relicStageThresholds(0), RELIC_EVOLVE_SESSIONS, 'hệ số hỏng ⇒ dùng bảng gốc');
  assert.equal(relicStageThresholds(0.001)[1], 1);
});

test('đếm phiên: chỉ phiên hoàn thành, đủ dài, và SAU lúc nhận (phiên nhận di vật không tính)', () => {
  const history = [
    phien(0),                                     // đúng lúc nhận — không tính
    phien(1),                                     // tính
    phien(2, RELIC_EVOLVE_MIN_MINUTES - 1),       // ngắn — không
    phien(3, 45, { status: 'cancelled', completed: false }), // huỷ — không
    phien(-5),                                    // trước lúc nhận — không
    { minutes: 30 },                              // không mốc — không
    phien(4, 60),                                 // tính
  ];
  assert.equal(countSessionsSince(history, T0), 2);
  assert.equal(countSessionsSince([], T0), 0);
});

test('stageForSessions là hàm bậc thang theo bảng', () => {
  const th = relicStageThresholds(1);
  assert.equal(stageForSessions(0, th), 0);
  assert.equal(stageForSessions(th[1] - 1, th), 0);
  assert.equal(stageForSessions(th[1], th), 1);
  assert.equal(stageForSessions(th[2], th), 2);
  assert.equal(stageForSessions(10_000, th), 2, 'không vượt bậc cao nhất của bảng');
});

test('describeRelicGrowth kể đúng: còn bao nhiêu phiên, phần trăm, và Huyền Thoại thì hết đếm', () => {
  const th = relicStageThresholds(1);
  const history = Array.from({ length: th[1] - 3 }, (_, i) => phien(i + 1));
  const d = describeRelicGrowth({ relic, stage: 0, history });
  assert.equal(d.sessions, th[1] - 3);
  assert.equal(d.remaining, 3);
  assert.equal(d.nextAt, th[1]);
  assert.equal(d.isMax, false);
  assert.equal(d.counting, true);
  assert.ok(d.pct > 0.8 && d.pct < 1);
  assert.equal(d.stageLabel, RELIC_EVOLUTION[ID].stages[0].label);
  const max = describeRelicGrowth({ relic, stage: 2, history });
  assert.equal(max.isMax, true);
  assert.equal(max.remaining, 0);
  assert.equal(max.nextAt, null);
  // Di vật đời cũ chưa có `earnedAt` ⇒ không đếm, không hứa.
  const cu = describeRelicGrowth({ relic: { id: ID }, stage: 0, history });
  assert.equal(cu.counting, false);
  assert.equal(cu.sessions, 0);
});

test('evaluateRelicEvolutions: đủ phiên thì lên bậc, có thể nhảy hai bậc, kỳ quan làm ngưỡng ngắn lại', () => {
  const th = relicStageThresholds(1);
  const duBac1 = Array.from({ length: th[1] }, (_, i) => phien(i + 1));
  assert.deepEqual(evaluateRelicEvolutions({ relics: [relic], relicEvolutions: {}, history: duBac1 }), [{ id: ID, from: 0, to: 1 }]);
  assert.deepEqual(evaluateRelicEvolutions({ relics: [relic], relicEvolutions: { [ID]: 1 }, history: duBac1 }), [], 'đã ở bậc 1 thì không kể lại');
  const duBac2 = Array.from({ length: th[2] }, (_, i) => phien(i + 1));
  assert.deepEqual(evaluateRelicEvolutions({ relics: [relic], relicEvolutions: {}, history: duBac2 }), [{ id: ID, from: 0, to: 2 }]);
  // Kỳ quan nhanh hơn 30%: cùng lịch sử vừa thiếu 1 phiên ở hệ số 1 thì đủ ở hệ số 0,7.
  const thieuMot = Array.from({ length: th[1] - 1 }, (_, i) => phien(i + 1));
  assert.deepEqual(evaluateRelicEvolutions({ relics: [relic], relicEvolutions: {}, history: thieuMot }), []);
  assert.deepEqual(evaluateRelicEvolutions({ relics: [relic], relicEvolutions: {}, history: thieuMot, factor: 0.7 }), [{ id: ID, from: 0, to: 1 }]);
  // Không `earnedAt` ⇒ không bao giờ tự lên.
  assert.deepEqual(evaluateRelicEvolutions({ relics: [{ id: ID }], relicEvolutions: {}, history: duBac2 }), []);
  // Id lạ ⇒ bỏ qua, không ném.
  assert.deepEqual(evaluateRelicEvolutions({ relics: [{ id: 'la', earnedAt: T0 }], relicEvolutions: {}, history: duBac2 }), []);
});

test('applyRelicEvolutions không đụng bản đồ cũ và giữ bậc của di vật khác', () => {
  const cu = { khac: 2 };
  const moi = applyRelicEvolutions(cu, [{ id: ID, from: 0, to: 1 }]);
  assert.deepEqual(moi, { khac: 2, [ID]: 1 });
  assert.deepEqual(cu, { khac: 2 });
  assert.equal(applyRelicEvolutions(cu, []), cu);
});

test('withCanonicalRelicText: chữ và buff gốc đọc từ bảng, giữ earnedAt và mọi trường khác; id lạ thì trả nguyên', () => {
  const stale = { id: 'mam_song_bat_diet', label: 'Cũ', icon: '?', description: 'Di vật Kỷ Băng Hà — tăng tài nguyên rớt.', buff: { resourceBonus: 0.2 }, earnedAt: '2026-01-01T00:00:00.000Z', extra: 1 };
  const fresh = withCanonicalRelicText(stale);
  assert.equal(fresh.label, 'Mầm Sống Bất Diệt');
  assert.equal(fresh.icon, '🌱');
  assert.ok(!/tài nguyên/.test(fresh.description), 'mô tả cũ (đồng tiền ngủ) phải được thay bằng bản bảng');
  assert.deepEqual(fresh.buff, { epBonus: 0.08 });
  assert.equal(fresh.earnedAt, stale.earnedAt);
  assert.equal(fresh.extra, 1);
  assert.deepEqual(withCanonicalRelicText({ id: 'khong_co', label: 'x' }), { id: 'khong_co', label: 'x' });
});
