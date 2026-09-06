/**
 * rankLadder.test.js — bậc tự thăng + thử thách kỷ nguyên không chặn/không phạt (ADR-069).
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { ERA_CRISES, RANK_SYSTEM, RANK_XP_RATIOS } from './constants.js';
import {
  countQualifyingSessions,
  describeCrisisQuest,
  describeRankStep,
  eraEpRange,
  evaluateRankPromotion,
  openCrisisQuest,
  settleCrisisQuest,
} from './rankLadder.js';

const H = 3_600_000;
const NOW = Date.UTC(2026, 8, 6, 12, 0, 0);
const phien = (hoursAgo, minutes, extra = {}) => ({ timestamp: NOW - hoursAgo * H, minutes, ...extra });

test('countQualifyingSessions: đúng cửa sổ, đúng ngưỡng phút, bỏ phiên huỷ và phiên tương lai', () => {
  const history = [
    phien(1, 30),
    phien(10, 25),
    phien(47, 60),
    phien(49, 60),                          // ngoài cửa sổ 48h
    phien(2, 10),                           // quá ngắn
    phien(3, 45, { cancelled: true }),      // huỷ
    phien(4, 45, { completed: false }),     // không hoàn thành
    { minutes: 90 },                        // không có mốc thời gian
    phien(-1, 60),                          // "tương lai" (đồng hồ lệch) — không tính
  ];
  assert.equal(countQualifyingSessions(history, { minMinutes: 25, windowHours: 48, now: NOW }), 3);
  assert.equal(countQualifyingSessions(history, { minMinutes: 45, windowHours: 48, now: NOW }), 1);
  assert.equal(countQualifyingSessions(history, { minMinutes: 25, windowHours: 5, now: NOW }), 1);
  assert.equal(countQualifyingSessions([], { minMinutes: 25, windowHours: 48, now: NOW }), 0);
});

test('describeRankStep: hai điều kiện độc lập — EP gác và phiên gần đây', () => {
  const book = 1;
  const { start, gap } = eraEpRange(book);
  const next = RANK_SYSTEM[book].ranks[1];
  const req = next.challengeRequirement;
  const epDu = start + Math.floor(gap * RANK_XP_RATIOS[1]);

  const thieuEP = describeRankStep({ bookNumber: book, rankIdx: 0, totalEP: epDu - 1, history: [phien(1, 60), phien(2, 60), phien(3, 60)], now: NOW });
  assert.equal(thieuEP.epGateMet, false);
  assert.equal(thieuEP.sessionsMet, true);
  assert.equal(thieuEP.ready, false, 'đủ phiên mà thiếu EP thì chưa lên');

  const thieuPhien = describeRankStep({ bookNumber: book, rankIdx: 0, totalEP: epDu, history: [phien(1, req.minMinutes)], now: NOW });
  assert.equal(thieuPhien.epGateMet, true);
  assert.equal(thieuPhien.sessionsDone, Math.min(1, req.sessions));
  assert.equal(thieuPhien.ready, req.sessions <= 1, 'đủ EP mà thiếu phiên thì chưa lên');

  const du = describeRankStep({
    bookNumber: book, rankIdx: 0, totalEP: epDu,
    history: Array.from({ length: req.sessions }, (_, i) => phien(i + 1, req.minMinutes)),
    now: NOW,
  });
  assert.equal(du.ready, true);
  assert.equal(du.next.id, next.id);
  assert.equal(du.sessionsDone, req.sessions, 'phần trăm không được vượt quá yêu cầu');
});

test('bậc cao nhất thì không còn "kế tiếp" và không bao giờ sẵn sàng', () => {
  const ranks = RANK_SYSTEM[1].ranks;
  const step = describeRankStep({ bookNumber: 1, rankIdx: ranks.length - 1, totalEP: 1e9, history: [phien(1, 90), phien(2, 90), phien(3, 90)], now: NOW });
  assert.equal(step.isMax, true);
  assert.equal(step.next, null);
  assert.equal(step.ready, false);
  assert.equal(evaluateRankPromotion({ bookNumber: 1, rankIdx: ranks.length - 1, totalEP: 1e9, history: [phien(1, 90)], now: NOW }).promoted, false);
});

test('evaluateRankPromotion: MỖI PHIÊN NHIỀU NHẤT MỘT BẬC, và chỉ khi cả hai điều kiện đủ', () => {
  const book = 2;
  const { start, gap } = eraEpRange(book);
  const req1 = RANK_SYSTEM[book].ranks[1].challengeRequirement;
  const history = Array.from({ length: 5 }, (_, i) => phien(i + 1, 90));
  // EP vượt xa gác của bậc 3 vẫn chỉ lên bậc 1.
  const promo = evaluateRankPromotion({ bookNumber: book, rankIdx: 0, totalEP: start + gap, history, now: NOW });
  assert.equal(promo.promoted, true);
  assert.equal(promo.targetIdx, 1);
  assert.equal(promo.rank.id, RANK_SYSTEM[book].ranks[1].id);

  const chuaDuEP = evaluateRankPromotion({ bookNumber: book, rankIdx: 0, totalEP: start + Math.floor(gap * RANK_XP_RATIOS[1]) - 1, history, now: NOW });
  assert.equal(chuaDuEP.promoted, false);

  const chuaDuPhien = evaluateRankPromotion({ bookNumber: book, rankIdx: 0, totalEP: start + gap, history: [phien(1, req1.minMinutes - 1)], now: NOW });
  assert.equal(chuaDuPhien.promoted, false);
});

test('thử thách kỷ nguyên: mở ra là nhiệm vụ mềm KHÔNG deadline; đủ phiên thì qua và có di vật', () => {
  const crisis = ERA_CRISES[1];
  const opt = crisis.challengeOption;
  const state = openCrisisQuest({
    active: true, crisisId: crisis.id, name: crisis.name, icon: crisis.icon, description: crisis.description,
    challengeOption: opt, choiceMade: null, challengeDeadline: 12345,
    challengeSessionsRequired: opt.sessions, challengeMinMinutes: opt.minMinutes, challengeSessionsDone: 0,
    passed: false, relicEarned: null,
  });
  assert.equal(state.choiceMade, 'challenge');
  assert.equal(state.challengeDeadline, null, 'không còn hạn ⇒ không còn "trễ hạn"');

  const chua = describeCrisisQuest({ eraCrisis: state, history: [phien(1, opt.minMinutes)], now: NOW });
  assert.equal(chua.passed, false);
  assert.equal(chua.sessionsDone, 1);
  assert.equal(chua.sessionsRequired, opt.sessions);
  assert.equal(chua.relic.id, opt.successRelic.id, 'phải nói ra phần thưởng là gì — đó là lý do để làm');

  const du = describeCrisisQuest({
    eraCrisis: state,
    history: Array.from({ length: opt.sessions }, (_, i) => phien(i + 1, opt.minMinutes)),
    now: NOW,
  });
  assert.equal(du.passed, true);
  const xong = settleCrisisQuest(state, du);
  assert.equal(xong.active, false);
  assert.equal(xong.passed, true);
  assert.equal(xong.relicEarned.id, opt.successRelic.id);

  // Chưa qua thì `settle` không đổi gì — không có nhánh "thất bại".
  assert.equal(settleCrisisQuest(state, chua), state);
  assert.equal(describeCrisisQuest({ eraCrisis: { active: false }, history: [], now: NOW }), null);
});

test('dữ liệu đời cũ (choiceMade null, có deadline đã qua) được đọc như một nhiệm vụ đang mở — không phạt', () => {
  const crisis = ERA_CRISES[3];
  const opt = crisis.challengeOption;
  const cu = {
    active: true, crisisId: crisis.id, name: crisis.name, icon: crisis.icon,
    challengeOption: opt, choiceMade: null, challengeDeadline: NOW - 10 * H,
    challengeSessionsRequired: opt.sessions, challengeMinMinutes: opt.minMinutes, challengeSessionsDone: 0,
  };
  const q = describeCrisisQuest({ eraCrisis: cu, history: [], now: NOW });
  assert.equal(q.passed, false);
  assert.equal(q.sessionsDone, 0);
  assert.equal(q.name, crisis.name);
});
