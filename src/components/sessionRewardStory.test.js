import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_CARD_MS,
  STORY_HOLD,
  STORY_LAST_CARD_MS,
  buildRewardStoryCards,
  storyCardDurationMs,
} from './sessionRewardStory.js';
import { PREVIEW_SCENES } from '../dev/previewStage.js';
import { STREAK_MILESTONES } from '../engine/constants.js';

const REWARD = PREVIEW_SCENES.loot.pendingReward;
const REWARD_MAX = PREVIEW_SCENES['loot-max'].pendingReward;
const REWARD_ERA = PREVIEW_SCENES.era.pendingReward;

const todayGoal = (currentValue, goalValue = 5) => ({
  hasGoal: true, currentValue, goalValue, unit: 'phiên', useMinutes: false,
});
const missions = (list, bonusClaimedToday = false) => ({ list, bonusClaimedToday });

test('không có phần thưởng thì không có thẻ nào', () => {
  assert.deepEqual(buildRewardStoryCards({}), []);
  assert.deepEqual(buildRewardStoryCards({ reward: null }), []);
});

test('thẻ XP luôn đứng đầu và nói ĐÚNG con số toast đang nói (totalSessionXP)', () => {
  const [xp] = buildRewardStoryCards({ reward: REWARD });
  assert.equal(xp.id, 'xp');
  assert.equal(xp.xp, REWARD.totalSessionXP);
  assert.equal(xp.minutes, REWARD.effectiveMinutes);
  assert.equal(xp.multiplier, 1);
  assert.equal(xp.tier, 'thuong');
  assert.equal(xp.jackpot, false);
  assert.equal(xp.event, null);
  // Phiên thường: EP (ADR-070 — trục kỷ nguyên phải thấy được), chuỗi 4 ngày +10 XP, combo ×2 +5 XP;
  // không có Rương Lớn.
  assert.deepEqual(xp.chips.map((c) => c.id), ['ep', 'streak', 'combo']);
  assert.equal(xp.chips[0].value, `+${REWARD.finalEP} EP`);
  // Không có EP thì không có chip EP — một chip "+0 EP" là một con số chết.
  const [khongEp] = buildRewardStoryCards({ reward: { ...REWARD, finalEP: 0 } });
  assert.deepEqual(khongEp.chips.map((c) => c.id), ['streak', 'combo']);
});

test('ca đỉnh: EP rồi Rương Lớn đứng TRƯỚC các chip khác, KHÔNG còn chip tinh luyện (ADR-069), sự kiện tích cực được kể, jackpot bật', () => {
  const [xp] = buildRewardStoryCards({ reward: REWARD_MAX });
  assert.deepEqual(xp.chips.slice(0, 2).map((c) => c.id), ['ep', 'chest']);
  assert.ok(!xp.chips.some((c) => c.id === 'refined'), 'tinh luyện đã rời khỏi đường chơi — chip của nó không được quay lại');
  assert.equal(xp.jackpot, true);
  assert.equal(xp.tier, 'huyenThoai');
  assert.equal(xp.event.label, REWARD_MAX.positiveEvent.label);
  assert.equal(xp.event.bonus, REWARD_MAX.positiveEventBonus);
});

test('thứ tự câu chuyện: xp → chuỗi → hôm nay → nhiệm vụ → lên cấp → kỷ mới', () => {
  // `REWARD_ERA` kế thừa ca đỉnh (có bậc + di vật + bước tuần + di vật lên bậc); tắt bốn tin ấy để
  // bài này chỉ đo bộ khung cũ.
  const cards = buildRewardStoryCards({
    reward: { ...REWARD_ERA, levelsGained: 1, rankUp: null, relicEarned: null, weeklySteps: [], relicsEvolved: [] },
    streak: { currentStreak: 4 },
    todayGoal: todayGoal(2),
    missions: missions([{ id: 'm1', label: 'A', progress: 1, goal: 3, rewardXP: 10 }]),
  });
  assert.deepEqual(cards.map((c) => c.id), ['xp', 'streak', 'today', 'quests', 'level', 'era']);
});

test('chuỗi 0 thì KHÔNG có thẻ chuỗi; chạm đúng mốc thì thẻ chuỗi ăn mừng', () => {
  assert.ok(!buildRewardStoryCards({ reward: REWARD, streak: { currentStreak: 0 } }).some((c) => c.id === 'streak'));
  const moc = STREAK_MILESTONES[0].days;
  const cards = buildRewardStoryCards({ reward: REWARD, streak: { currentStreak: moc }, weekDays: [{ key: 'x' }] });
  const chuoi = cards.find((c) => c.id === 'streak');
  assert.equal(chuoi.days, moc);
  assert.equal(chuoi.justHit, true);
  assert.equal(chuoi.weekDays.length, 1, 'dải bảy ngày được đưa vào thẻ y nguyên');
  const khongMoc = buildRewardStoryCards({ reward: REWARD, streak: { currentStreak: moc - 1 } }).find((c) => c.id === 'streak');
  assert.equal(khongMoc.justHit, false);
});

test('thẻ hôm nay: chạy từ mức TRƯỚC phiên tới mức SAU phiên, và biết khi nào đủ nhịp', () => {
  const [, today] = buildRewardStoryCards({ reward: REWARD, todayGoal: todayGoal(3, 5) });
  assert.equal(today.id, 'today');
  assert.equal(today.pctBefore, 40);
  assert.equal(today.pct, 60);
  assert.equal(today.remaining, 2);
  assert.equal(today.goalMet, false);

  const [, du] = buildRewardStoryCards({ reward: REWARD, todayGoal: todayGoal(6, 5) });
  assert.equal(du.goalMet, true);
  assert.equal(du.pct, 100, 'thanh không được tràn quá 100%');
  assert.equal(du.remaining, 0);

  // Mục tiêu theo PHÚT: delta là số phút của phiên, không phải 1.
  const [, phut] = buildRewardStoryCards({
    reward: REWARD,
    todayGoal: { hasGoal: true, currentValue: 50, goalValue: 100, unit: 'phút', useMinutes: true },
    todayDelta: 25,
  });
  assert.equal(phut.pctBefore, 25);
  assert.equal(phut.pct, 50);

  assert.ok(!buildRewardStoryCards({ reward: REWARD, todayGoal: { hasGoal: false } }).some((c) => c.id === 'today'));
});

test('thẻ nhiệm vụ: chỉ hiện khi có gì nhúc nhích; đánh dấu đúng nhiệm vụ VỪA xong; thưởng trọn ngày KỂ chứ không mời bấm (ADR-070)', () => {
  const yen = buildRewardStoryCards({
    reward: REWARD,
    missions: missions([{ id: 'a', label: 'A', progress: 0, goal: 2, rewardXP: 10 }]),
  });
  assert.ok(!yen.some((c) => c.id === 'quests'), 'không nhúc nhích thì không chiếm thẻ');

  const cards = buildRewardStoryCards({
    reward: REWARD,
    missions: missions([
      { id: 'a', label: 'A', progress: 2, goal: 2, claimed: true, rewardXP: 10 },
      { id: 'b', label: 'B', progress: 1, goal: 3, rewardXP: 20 },
    ]),
    completedMissionIds: ['a'],
    missionXp: (xp) => xp * 2,
    bonusXP: 43,
  });
  const quests = cards.find((c) => c.id === 'quests');
  assert.deepEqual(quests.rows.map((r) => [r.id, r.done, r.justDone, r.xp]), [['a', true, true, 20], ['b', false, false, 40]]);
  assert.equal(quests.doneCount, 1);
  assert.equal(quests.allDone, false);
  assert.equal(quests.bonusJustEarned, false);
  assert.equal(quests.bonusXP, 43, 'còn dở thì nói trước phần thưởng đang chờ — nó tự vào, không phải đi lấy');
  assert.ok(!('bonusReady' in quests), '`bonusReady` quay lại ⇒ có ai đó đang dựng lại cái nút Nhận');

  // Phiên này khép nốt nhiệm vụ cuối ⇒ store đã cộng `dailyBonusXP` ⇒ thẻ kể "đã cộng".
  const vuaVao = buildRewardStoryCards({
    reward: { ...REWARD, dailyBonusXP: 43 },
    missions: missions([{ id: 'a', label: 'A', progress: 2, goal: 2, claimed: true, rewardXP: 10 }], true),
    bonusXP: 43,
  }).find((c) => c.id === 'quests');
  assert.equal(vuaVao.bonusJustEarned, true);
  assert.equal(vuaVao.bonusEarnedXP, 43);
  assert.equal(vuaVao.bonusClaimed, false, '"vừa cộng" và "đã cộng từ trước" là hai câu — không kể cả hai');

  // Đã cộng từ phiên TRƯỚC trong ngày ⇒ chỉ một dòng xác nhận, không kể lại con số như tin mới.
  const daNhan = buildRewardStoryCards({
    reward: REWARD,
    missions: missions([{ id: 'a', label: 'A', progress: 2, goal: 2, claimed: true, rewardXP: 10 }], true),
  }).find((c) => c.id === 'quests');
  assert.equal(daNhan.bonusJustEarned, false);
  assert.equal(daNhan.bonusClaimed, true);
});

test('thẻ lên cấp và kỷ mới chỉ có khi thật sự xảy ra, và thẻ kỷ đọc tên kỷ từ ERA_METADATA', () => {
  assert.ok(!buildRewardStoryCards({ reward: REWARD }).some((c) => c.id === 'level' || c.id === 'era'));
  const era = buildRewardStoryCards({ reward: REWARD_ERA }).find((c) => c.id === 'era');
  assert.equal(era.newBook, REWARD_ERA.newBook);
  assert.ok(era.label && era.label !== `Kỷ ${REWARD_ERA.newBook}`, 'phải ra TÊN kỷ, không phải số');
});

test('nhịp lật: thẻ thường ngắn, thẻ cuối đứng lâu hơn để còn bấm được', () => {
  assert.equal(storyCardDurationMs({ id: 'xp' }, false), STORY_CARD_MS);
  assert.equal(storyCardDurationMs({ id: 'quests' }, true), STORY_LAST_CARD_MS);
  assert.ok(storyCardDurationMs({ id: 'level' }, false) > STORY_CARD_MS, 'tin hiếm được đứng lâu hơn');
  assert.ok(STORY_LAST_CARD_MS > STORY_CARD_MS);
  // Bốn thẻ thường + thẻ cuối phải xong dưới 20 giây — ngắn hơn hộp thoại 7 giai đoạn cũ.
  assert.ok(STORY_CARD_MS * 4 + STORY_LAST_CARD_MS < 20_000);
});

// ─── ADR-069: bốn thẻ mới ────────────────────────────────────────────────────

test('thứ tự đầy đủ: xp → công trình → chuỗi → hôm nay → nhiệm vụ → BƯỚC TUẦN → thử thách → lên cấp → bậc → di vật → LÊN BẬC → kỷ', () => {
  const cards = buildRewardStoryCards({
    reward: { ...REWARD_ERA, levelsGained: 1, rankUp: { label: 'Thủy Thủ', icon: '⚓', buffLabel: '+12%' }, relicEarned: { label: 'La Bàn', icon: '🧭' }, crisisOpened: { name: 'Bão', icon: '🌊' } },
    streak: { currentStreak: 4 },
    todayGoal: todayGoal(2),
    missions: missions([{ id: 'm1', label: 'A', progress: 1, goal: 3, rewardXP: 10 }]),
    project: { label: 'Hải Đăng', icon: '🗼', total: 6, done: 3 },
    crisisQuest: { name: 'Bão', icon: '🌊', sessionsDone: 1, sessionsRequired: 3, minMinutes: 45, windowHours: 48, passed: false, countedThisSession: true, relic: { label: 'La Bàn' } },
  });
  // `REWARD_ERA` (kế thừa ca đỉnh) mang sẵn một bước tuần vừa chốt và một di vật vừa lên bậc (ADR-070).
  assert.deepEqual(cards.map((c) => c.id), ['xp', 'project', 'streak', 'today', 'quests', 'chain', 'quest', 'level', 'rank', 'relic', 'evolve', 'era']);
});

// ─── ADR-070: hai thẻ tự-vào ─────────────────────────────────────────────────

test('thẻ bước tuần: chỉ khi store vừa chốt bước; kể đủ bước, XP, SP chuỗi; đứng lâu như tin hiếm', () => {
  assert.ok(!buildRewardStoryCards({ reward: { ...REWARD, weeklySteps: [] } }).some((c) => c.id === 'chain'));
  const chain = buildRewardStoryCards({ reward: REWARD_MAX }).find((c) => c.id === 'chain');
  assert.equal(chain.title, REWARD_MAX.weeklyChainTitle);
  assert.equal(chain.steps.length, 1);
  assert.equal(chain.steps[0].xp, REWARD_MAX.weeklySteps[0].xp);
  assert.equal(chain.total, 4);
  assert.equal(chain.doneCount, 1);
  assert.equal(chain.finished, false);
  assert.equal(chain.bonusSP, 0);
  assert.ok(storyCardDurationMs(chain, false) > STORY_CARD_MS);

  // Chốt liền nhiều bước (ảnh chụp tuần đã vượt vài mốc) — thẻ kể HẾT, và bước cuối mang SP chuỗi.
  const het = buildRewardStoryCards({
    reward: {
      ...REWARD,
      weeklyChainTitle: 'X',
      weeklyBonusSP: 1,
      weeklySteps: [
        { index: 2, total: 4, label: 'C', xp: 56, isLast: false, bonusSP: 0 },
        { index: 3, total: 4, label: 'D', xp: 360, isLast: true, bonusSP: 1 },
      ],
    },
  }).find((c) => c.id === 'chain');
  assert.equal(het.steps.length, 2);
  assert.equal(het.doneCount, 4);
  assert.equal(het.finished, true);
  assert.equal(het.xp, 416);
  assert.equal(het.bonusSP, 1);
});

test('thẻ di vật lên bậc: chỉ khi store vừa nâng bậc; dịch buff ra chữ; biết bậc cao nhất và mốc kế', () => {
  assert.ok(!buildRewardStoryCards({ reward: { ...REWARD, relicsEvolved: [] } }).some((c) => c.id === 'evolve'));
  const evolve = buildRewardStoryCards({ reward: REWARD_MAX }).find((c) => c.id === 'evolve');
  const r = evolve.relics[0];
  assert.equal(r.id, REWARD_MAX.relicsEvolved[0].id);
  assert.equal(r.stageLabel, 'Tiến Hóa');
  assert.match(r.buffText, /% EP/, 'buff phải được dịch ra chữ người đọc được');
  assert.equal(r.isMax, false);
  assert.equal(r.nextAt, 50, 'bậc kế ở mốc phiên thứ hai của bảng');
  assert.ok(storyCardDurationMs(evolve, false) > STORY_CARD_MS);

  const max = buildRewardStoryCards({
    reward: { ...REWARD, relicsEvolved: [{ id: 'mam_song_bat_diet', label: 'M', icon: '🌱', stage: 2, stageLabel: 'Huyền Thoại', buff: { epBonus: 0.15, xpSeal: 0.02 } }] },
  }).find((c) => c.id === 'evolve');
  assert.equal(max.relics[0].isMax, true);
  assert.equal(max.relics[0].nextAt, null);
});

test('thẻ công trình: chạy từ nấc TRƯỚC tới nấc SAU; tăng tốc thì nhảy hai nấc', () => {
  const [, p] = buildRewardStoryCards({ reward: REWARD, project: { label: 'Hải Đăng', icon: '🗼', total: 6, done: 3 } });
  assert.equal(p.id, 'project');
  assert.equal(p.remaining, 3);
  assert.equal(p.pctBefore, (2 / 6) * 100);
  assert.equal(p.pct, 50);
  const [, nhanh] = buildRewardStoryCards({ reward: REWARD, project: { label: 'X', total: 6, done: 4, stepped: 2 } });
  assert.equal(nhanh.pctBefore, (2 / 6) * 100, 'đặc quyền tăng tốc: nấc trước cách nấc sau HAI bậc');
  // Vượt tổng (dữ liệu lệch) thì kẹp, không âm, không quá 100.
  const [, kep] = buildRewardStoryCards({ reward: REWARD, project: { label: 'X', total: 2, done: 9 } });
  assert.equal(kep.pct, 100);
  assert.equal(kep.remaining, 0);
});

test('thẻ công trình khi hàng chờ TRỐNG: mời chọn (≤3 tên + phần dư); kỷ trọn hoặc không có gì thì im', () => {
  const [, moi] = buildRewardStoryCards({ reward: REWARD, project: { empty: true, choices: ['A', 'B', 'C', 'D', 'E'] } });
  assert.equal(moi.id, 'project');
  assert.equal(moi.empty, true);
  assert.deepEqual(moi.choices, ['A', 'B', 'C']);
  assert.equal(moi.extra, 2);
  assert.ok(!buildRewardStoryCards({ reward: REWARD, project: { empty: true, choices: [], eraComplete: true } }).some((c) => c.id === 'project'));
  assert.ok(!buildRewardStoryCards({ reward: REWARD, project: { empty: true, choices: [] } }).some((c) => c.id === 'project'));
  assert.ok(!buildRewardStoryCards({ reward: REWARD, project: null }).some((c) => c.id === 'project'));
});

test('thẻ lên cấp: có kỹ năng mở được ⇒ ĐỨNG YÊN chờ chọn (≤3); không có ⇒ nói còn thiếu bao nhiêu, và tự lật', () => {
  const reward = { ...REWARD, levelsGained: 1, spGained: 2, newLevel: 6 };
  const chon = buildRewardStoryCards({
    reward,
    skills: { sp: 4, choices: [{ id: 'a', label: 'A', cost: 2 }, { id: 'b', label: 'B', cost: 2 }, { id: 'c', label: 'C', cost: 3 }, { id: 'd', label: 'D', cost: 3 }], next: null },
  }).find((c) => c.id === 'level');
  assert.equal(chon.hold, true, 'đang hỏi "chọn cái nào" thì không được tự trả lời thay');
  assert.equal(chon.skillChoices.length, 3, 'nhiều nhất ba lựa chọn — đủ để chọn, không đủ để phải so bảng');
  assert.equal(chon.sp, 4);
  assert.equal(chon.nextSkill, null);
  assert.equal(storyCardDurationMs(chon, false), STORY_HOLD);
  assert.equal(storyCardDurationMs({ ...chon, hold: false }, false) > 0, true, 'chọn xong thì thẻ lại tự lật như tin hiếm');

  const thieu = buildRewardStoryCards({ reward, skills: { sp: 1, choices: [], next: { label: 'Vào Guồng', spNeeded: 1 } } }).find((c) => c.id === 'level');
  assert.equal(thieu.hold, false);
  assert.deepEqual(thieu.nextSkill, { label: 'Vào Guồng', spNeeded: 1 });
  assert.ok(storyCardDurationMs(thieu, false) > 0);

  const khong = buildRewardStoryCards({ reward }).find((c) => c.id === 'level');
  assert.equal(khong.hold, false);
  assert.equal(khong.nextSkill, null);
});

test('thẻ bậc và thẻ di vật chỉ có khi phần thưởng nói có', () => {
  assert.ok(!buildRewardStoryCards({ reward: REWARD }).some((c) => c.id === 'rank' || c.id === 'relic'));
  const cards = buildRewardStoryCards({ reward: REWARD_MAX });
  const rank = cards.find((c) => c.id === 'rank');
  assert.equal(rank.label, REWARD_MAX.rankUp.label);
  assert.equal(rank.buffLabel, REWARD_MAX.rankUp.buffLabel);
  const relic = cards.find((c) => c.id === 'relic');
  assert.equal(relic.label, REWARD_MAX.relicEarned.label);
  assert.ok(storyCardDurationMs(rank, false) > STORY_CARD_MS, 'tin hiếm đứng lâu hơn thẻ thường');
});

test('thẻ thử thách kỷ nguyên: chỉ khi vừa mở hoặc phiên này vừa được tính; qua rồi thì nhường thẻ di vật', () => {
  const quest = { name: 'Bão', icon: '🌊', sessionsDone: 1, sessionsRequired: 3, minMinutes: 45, windowHours: 48, passed: false, relic: { label: 'La Bàn' } };
  assert.ok(!buildRewardStoryCards({ reward: REWARD, crisisQuest: { ...quest, countedThisSession: false } }).some((c) => c.id === 'quest'), 'phiên ngắn không tính vào thử thách thì đừng chiếm thẻ');
  const tinh = buildRewardStoryCards({ reward: REWARD, crisisQuest: { ...quest, countedThisSession: true } }).find((c) => c.id === 'quest');
  assert.equal(tinh.sessionsDone, 1);
  assert.equal(tinh.relicLabel, 'La Bàn');
  assert.equal(tinh.opened, false);
  const mo = buildRewardStoryCards({ reward: { ...REWARD, crisisOpened: { name: 'Bão', icon: '🌊' } }, crisisQuest: { ...quest, countedThisSession: false } }).find((c) => c.id === 'quest');
  assert.equal(mo.opened, true, 'vừa mở thì phải kể, dù phiên này chưa được tính');
  assert.ok(!buildRewardStoryCards({ reward: REWARD, crisisQuest: { ...quest, passed: true, countedThisSession: true } }).some((c) => c.id === 'quest'));
});
