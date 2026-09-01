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

/* ─── THẺ PHIÊN NÓI VỀ CỘT MỐC KHI SẮP TỚI ──────────────────────────────────── */

const PHIEN_THUONG = {
  lootModalOpen: true,
  pendingReward: { totalSessionXP: 120, resources: { go: 18 }, rpEarned: 50, multiplier: 1.3 },
};

test('không có mốc sắp tới ⇒ thẻ phiên vẫn đếm tài nguyên như cũ', () => {
  const [loot] = buildRewardToasts(PHIEN_THUONG, {}).filter((t) => t.source === 'loot');
  assert.ok(loot, 'mất luôn thẻ tổng kết phiên');
  assert.match(loot.description, /tài nguyên/, 'không có mốc mà đã thôi nói tài nguyên');
});

test('sắp tới mốc ⇒ thẻ phiên NÓI VỀ MỐC thay vì đếm tài nguyên', () => {
  // ⚠️ THAY chứ không NỐI: `description` của `RewardCard` chỉ được ĐÚNG MỘT DÒNG, nối thêm thì bị
  // cắt bằng "…" và mất đúng phần đáng đọc. Thứ bị thay là con số Đàm không dùng để quyết gì.
  const hint = 'Một phiên nữa là tới «Khám Phá Tân Thế Giới»';
  const [loot] = buildRewardToasts(PHIEN_THUONG, {}, { stageHint: hint }).filter((t) => t.source === 'loot');
  assert.equal(loot.description, hint);
  assert.ok(!/tài nguyên/.test(loot.description), 'vẫn còn đếm tài nguyên ⇒ đang NỐI chứ không THAY');
  // Mọi thứ khác của thẻ phải y nguyên — đây chỉ là đổi một dòng chữ, không đổi luật thưởng.
  assert.equal(loot.amount, '+120 XP');
  assert.deepEqual(loot.action, { detail: 'loot' });
});

test('lên kỷ vẫn KHÔNG có thẻ phiên, kể cả khi đang sắp tới mốc', () => {
  // Lên kỷ là một trong bốn việc được phép chặn màn hình; hộp thoại đã mở, thêm toast là bản sao
  // thừa. `stageHint` không được mở lại cánh cửa mà `eraChanged` đã đóng.
  const toasts = buildRewardToasts(
    { lootModalOpen: true, pendingReward: { ...PHIEN_THUONG.pendingReward, eraChanged: true } },
    {},
    { stageHint: 'Một phiên nữa là tới «X»' },
  );
  assert.equal(toasts.filter((t) => t.source === 'loot').length, 0);
});

// ─────────────────────────────────────────────────────────────────────────────
// SỰ KIỆN CỦA PHIÊN LÀM CHỦ CÁI THẺ (2026-08-30)
//
// ⚠️ VÌ SAO BỘ NÀY TỒN TẠI. Đo trên 579 phiên thật: **63% số phiên sinh ra một sự kiện có TÊN,
// có ICON, có câu chuyện riêng** (`POSITIVE_EVENTS` 6 mục + `ERA_MINI_EVENTS` mỗi kỷ 2–3 mục,
// tổng xác suất ~0,67/phiên). Nhưng nó chỉ được VẼ trong `LootDropModal`, mà hộp thoại ấy — sau
// ADR-060 — chỉ tự mở khi LÊN KỶ: 7/579 phiên = 1,2%. Tức ~358 câu chuyện đã tính xong, đã cộng
// XP, rồi bị xoá mà không ai thấy; thẻ toast thì nói "🎁 Phiên đã xong · +18 tài nguyên" ở CẢ 579
// phiên. Đây là khoản dopamine lớn nhất bị bỏ phí trong app, và nó nằm trọn ở khâu HIỂN THỊ.
//
// Bộ này khoá bốn vế, mỗi vế một cách hỏng riêng.
const SU_KIEN = {
  id: 'breakthrough', label: 'Đột Phá!', icon: '💡',
  desc: 'Khoảnh khắc hiểu sâu bất ngờ.', bonusPct: 0.25,
};
const PHIEN_CO_SU_KIEN = {
  lootModalOpen: true,
  pendingReward: { ...PHIEN_THUONG.pendingReward, positiveEvent: SU_KIEN, positiveEventBonus: 30 },
};

test('có sự kiện ⇒ thẻ mang TÊN và ICON của sự kiện, không phải "Phiên đã xong"', () => {
  const [loot] = buildRewardToasts(PHIEN_CO_SU_KIEN, {}).filter((t) => t.source === 'loot');
  assert.ok(loot, 'mất luôn thẻ tổng kết phiên');
  assert.equal(loot.name, 'Đột Phá!', 'thẻ vẫn dùng nhãn chung ⇒ câu chuyện của phiên bị xoá');
  assert.equal(loot.icon, '💡', 'vẫn dùng icon quà chung ⇒ mọi phiên trông giống hệt nhau');
  assert.match(loot.description, /hiểu sâu/, 'mất câu kể chuyện');
  assert.match(loot.description, /30 XP thưởng/, 'không nói phần XP mà chính sự kiện mang lại');
});

test('KHÔNG có sự kiện ⇒ giữ nguyên thẻ chung như cũ', () => {
  // Đối chứng: bản vá chỉ được đổi hành vi ở nhánh CÓ sự kiện. 37% số phiên còn lại phải y hệt.
  const [loot] = buildRewardToasts(PHIEN_THUONG, {}).filter((t) => t.source === 'loot');
  assert.equal(loot.name, 'Phiên đã xong');
  assert.equal(loot.icon, '🎁');
  assert.match(loot.description, /tài nguyên/);
});

test('mốc sắp tới VẪN THẮNG phần mô tả, nhưng sự kiện giữ tên và icon', () => {
  // Hai thứ này KHÔNG tranh chỗ: "còn một phiên nữa là tới «…»" là thứ khiến người ta làm phiên
  // tiếp và nó hiếm hơn nhiều; sự kiện thì nhận diện cái thẻ. Nhường một dòng, giữ mặt thẻ.
  const hint = 'Một phiên nữa là tới «Khám Phá Tân Thế Giới»';
  const [loot] = buildRewardToasts(PHIEN_CO_SU_KIEN, {}, { stageHint: hint }).filter((t) => t.source === 'loot');
  assert.equal(loot.description, hint, 'mốc bị sự kiện đẩy khỏi dòng mô tả');
  assert.equal(loot.name, 'Đột Phá!', 'có mốc thì lại mất luôn tên sự kiện');
});

test('sự kiện KHÔNG nâng bậc độ hiếm — bậc đang đo ĐỘ DÀI PHIÊN', () => {
  // ⚠️ Bậc nói về thứ Đàm CHỦ ĐỘNG quyết được (25' ×1.0 · 26' ×1.3 · 60' ×2.0). Nâng bậc theo một
  // cú tung xúc xắc sẽ làm bậc thôi nói lên điều gì về chính phiên ấy.
  const [thuong] = buildRewardToasts(PHIEN_THUONG, {}).filter((t) => t.source === 'loot');
  const [coSuKien] = buildRewardToasts(PHIEN_CO_SU_KIEN, {}).filter((t) => t.source === 'loot');
  assert.equal(coSuKien.tier, thuong.tier, 'sự kiện đang tự nâng bậc của mình');
});
