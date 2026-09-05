import test from 'node:test';
import assert from 'node:assert/strict';

import {
  STORY_CARD_MS,
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
  // Phiên thường: chuỗi 4 ngày +10 XP và combo ×2 +5 XP là hai chip; không có Rương Lớn.
  assert.deepEqual(xp.chips.map((c) => c.id), ['streak', 'combo']);
});

test('ca đỉnh: Rương Lớn và tinh luyện đứng TRƯỚC các chip khác, sự kiện tích cực được kể, jackpot bật', () => {
  const [xp] = buildRewardStoryCards({ reward: REWARD_MAX });
  assert.deepEqual(xp.chips.slice(0, 2).map((c) => c.id), ['chest', 'refined']);
  assert.equal(xp.jackpot, true);
  assert.equal(xp.tier, 'huyenThoai');
  assert.equal(xp.event.label, REWARD_MAX.positiveEvent.label);
  assert.equal(xp.event.bonus, REWARD_MAX.positiveEventBonus);
});

test('thứ tự câu chuyện: xp → chuỗi → hôm nay → nhiệm vụ → lên cấp → kỷ mới', () => {
  const cards = buildRewardStoryCards({
    reward: { ...REWARD_ERA, levelsGained: 1 },
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

test('thẻ nhiệm vụ: chỉ hiện khi có gì nhúc nhích; đánh dấu đúng nhiệm vụ VỪA xong; nút nhận trọn ngày', () => {
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
  assert.equal(quests.bonusReady, false);

  const xongHet = buildRewardStoryCards({
    reward: REWARD,
    missions: missions([{ id: 'a', label: 'A', progress: 2, goal: 2, claimed: true, rewardXP: 10 }]),
    bonusXP: 43,
  }).find((c) => c.id === 'quests');
  assert.equal(xongHet.bonusReady, true);
  assert.equal(xongHet.bonusXP, 43);

  const daNhan = buildRewardStoryCards({
    reward: REWARD,
    missions: missions([{ id: 'a', label: 'A', progress: 2, goal: 2, claimed: true, rewardXP: 10 }], true),
  }).find((c) => c.id === 'quests');
  assert.equal(daNhan.bonusReady, false);
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
