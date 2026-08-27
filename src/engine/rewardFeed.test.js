import test from 'node:test';
import assert from 'node:assert/strict';

import {
  MAX_REWARD_TOASTS,
  buildRewardToasts,
  highestTier,
  splitRewardToasts,
} from './rewardFeed.js';
import { ACHIEVEMENTS, MISSION_CATALOG } from './constants.js';

/** Ba nhiệm vụ THẬT lấy từ catalog — không bịa `bucket`, vì chính `bucket` là thứ chấm bậc. */
const MISSIONS = {
  list: MISSION_CATALOG.slice(0, 3).map((m) => ({ ...m, progress: m.goal, claimed: false })),
};

const RELIC = {
  id: 'mam_song_bat_diet',
  label: 'Mầm Sống Bất Diệt',
  icon: '🌱',
  description: 'Di vật Kỷ Băng Hà — tăng tài nguyên rớt.',
};

function ui(extra = {}) {
  return {
    lootModalOpen: false,
    pendingReward: null,
    relicNotification: null,
    levelUpQueue: [],
    rankUpNotification: null,
    achievementQueue: [],
    missionCompletedIds: [],
    ...extra,
  };
}

test('trạng thái sạch không sinh toast nào', () => {
  assert.deepEqual(buildRewardToasts(ui(), MISSIONS), []);
  // Gọi trần cũng không được ném — nó chạy trong đường vẽ của mọi khung hình.
  assert.deepEqual(buildRewardToasts(), []);
});

/**
 * ⚠️ ĐÂY LÀ ĐIỀU KIỆN NGHIỆM THU CỦA CẢ THAY ĐỔI NÀY: xong một phiên và nhận một
 * di vật thì màn hình KHÔNG bị chặn — chỉ có toast. Bài này khoá vế "có toast";
 * vế "không chặn" nằm ở `rewardToastWiring.test.js` (đọc mã `App.jsx`).
 */
test('phiên thường + di vật ⇒ hai toast, KHÔNG có gì đòi chặn màn hình', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: true,
    pendingReward: {
      totalSessionXP: 120, multiplier: 1.0, resources: { go: 3 }, rpEarned: 4, eraChanged: false,
    },
    relicNotification: RELIC,
  }), MISSIONS);

  assert.equal(toasts.length, 2);
  assert.equal(toasts[0].source, 'loot');
  assert.equal(toasts[1].source, 'relic');
  assert.equal(toasts[1].tier, 'huyenThoai', 'di vật là phần thưởng quý nhất game');
  assert.equal(toasts[0].action.detail, 'loot', 'bấm vào tổng kết phải mở được hộp thoại đầy đủ');
});

/**
 * Lên kỷ là MỘT trong bốn việc được phép chặn màn hình ⇒ hộp thoại mở thẳng, và
 * một toast tổng kết lúc đó chỉ là bản sao thừa nằm dưới lớp mờ.
 */
test('lên kỷ KHÔNG sinh toast tổng kết — hộp thoại giữ nguyên vai trò', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 300, multiplier: 2, eraChanged: true, newBook: 3 },
  }), MISSIONS);

  assert.equal(toasts.filter((t) => t.source === 'loot').length, 0);
});

test('hộp thoại phần thưởng đã đóng thì không còn toast tổng kết', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: false,
    pendingReward: { totalSessionXP: 120, multiplier: 1 },
  }), MISSIONS);
  assert.equal(toasts.length, 0);
});

test('thành tích và nhiệm vụ lấy tên + bậc từ bảng THẬT, không bịa', () => {
  const gold = ACHIEVEMENTS.find((a) => a.tier === 'gold');
  const bronze = ACHIEVEMENTS.find((a) => a.tier === 'bronze');
  const mission = MISSIONS.list[0];

  const toasts = buildRewardToasts(ui({
    achievementQueue: [gold.id, bronze.id],
    missionCompletedIds: [mission.id],
  }), MISSIONS);

  const byId = Object.fromEntries(toasts.map((t) => [t.id, t]));
  assert.equal(byId[`achievement:${gold.id}`].name, gold.label);
  assert.equal(byId[`achievement:${gold.id}`].tier, 'hiem');
  assert.equal(byId[`achievement:${bronze.id}`].tier, 'thuong');
  assert.equal(byId[`mission:${mission.id}`].name, mission.label);

  // Thứ tự trong CÙNG một nguồn giữ nguyên thứ tự store ghi (sort ổn định).
  const achOrder = toasts.filter((t) => t.source === 'achievement').map((t) => t.key);
  assert.deepEqual(achOrder, [gold.id, bronze.id]);
});

test('id lạ bị bỏ qua, không dựng thẻ rỗng', () => {
  const toasts = buildRewardToasts(ui({
    achievementQueue: ['khong_ton_tai'],
    missionCompletedIds: ['cung_khong_ton_tai'],
  }), MISSIONS);
  assert.deepEqual(toasts, []);
});

/**
 * ⚠️ Nếu xếp theo BẬC thay vì theo NGUỒN thì vị trí thẻ nhảy giữa các phiên (một
 * thành tích vàng sẽ đẩy tổng kết phiên xuống dưới). Bài này khoá đúng điều đó:
 * di vật là bậc CAO NHẤT bảng mà vẫn phải đứng SAU tổng kết phiên.
 */
test('thứ tự xếp theo nguồn — vị trí thẻ không nhảy khi phần thưởng đổi bậc', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 10, multiplier: 1 },
    relicNotification: RELIC,
    levelUpQueue: [{ levelsGained: 1, newLevel: 7, spGained: 2 }],
    achievementQueue: [ACHIEVEMENTS[0].id],
    missionCompletedIds: [MISSIONS.list[0].id],
  }), MISSIONS);

  assert.deepEqual(
    toasts.map((t) => t.source),
    ['loot', 'relic', 'level', 'achievement', 'mission'],
  );
});

test('mỗi thẻ có id DUY NHẤT — chồng toast không thể vẽ trùng key', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 10, multiplier: 1 },
    relicNotification: RELIC,
    levelUpQueue: [{ levelsGained: 2, newLevel: 9, spGained: 4 }],
    rankUpNotification: { rankLabel: 'Tân Binh', rankIcon: '🎖️' },
    achievementQueue: ACHIEVEMENTS.slice(0, 4).map((a) => a.id),
    missionCompletedIds: MISSIONS.list.map((m) => m.id),
  }), MISSIONS);

  const ids = toasts.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length, `id trùng: ${ids.join(' · ')}`);
  assert.ok(toasts.every((t) => t.source && t.key !== undefined), 'thẻ nào cũng phải chỉ về được kênh dismiss của nó');
});

test('quá 3 thẻ thì phần dư gộp thành MỘT dòng, và con số khớp phần bị giấu', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 10, multiplier: 1 },
    relicNotification: RELIC,
    levelUpQueue: [{ levelsGained: 1, newLevel: 3, spGained: 1 }],
    achievementQueue: ACHIEVEMENTS.slice(0, 3).map((a) => a.id),
  }), MISSIONS);

  const { shown, hidden, overflowLabel } = splitRewardToasts(toasts);
  assert.equal(shown.length, MAX_REWARD_TOASTS);
  assert.equal(hidden.length, toasts.length - MAX_REWARD_TOASTS);
  assert.equal(overflowLabel, `và ${hidden.length} phần thưởng khác`);
  assert.equal(shown.length + hidden.length, toasts.length, 'không được nuốt mất thẻ nào');
});

test('đúng 3 thẻ thì KHÔNG có dòng phần dư', () => {
  const { shown, overflowLabel } = splitRewardToasts([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
  assert.equal(shown.length, 3);
  assert.equal(overflowLabel, null);
});

test('bậc cao nhất của phần dư đọc đúng, kể cả khi danh sách rỗng', () => {
  assert.equal(highestTier([{ tier: 'thuong' }, { tier: 'huyenThoai' }, { tier: 'tot' }]), 'huyenThoai');
  assert.equal(highestTier([]), 'thuong');
  assert.equal(highestTier([{ tier: 'lung_tung' }]), 'thuong');
});
