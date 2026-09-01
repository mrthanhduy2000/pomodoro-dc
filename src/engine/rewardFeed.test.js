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
  assert.deepEqual(buildRewardToasts(ui()), []);
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
  }));

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
  }));

  assert.equal(toasts.filter((t) => t.source === 'loot').length, 0);
});

test('hộp thoại phần thưởng đã đóng thì không còn toast tổng kết', () => {
  const toasts = buildRewardToasts(ui({
    lootModalOpen: false,
    pendingReward: { totalSessionXP: 120, multiplier: 1 },
  }));
  assert.equal(toasts.length, 0);
});

test('thành tích và nhiệm vụ lấy tên + bậc từ bảng THẬT, không bịa', () => {
  const gold = ACHIEVEMENTS.find((a) => a.tier === 'gold');
  const bronze = ACHIEVEMENTS.find((a) => a.tier === 'bronze');
  const mission = MISSIONS.list[0];

  const toasts = buildRewardToasts(ui({
    achievementQueue: [gold.id, bronze.id],
    missionCompletedIds: [mission.id],
  }));

  const byId = Object.fromEntries(toasts.map((t) => [t.id, t]));
  assert.equal(byId[`achievement:${gold.id}`].name, gold.label);
  assert.equal(byId[`achievement:${gold.id}`].tier, 'hiem');
  assert.equal(byId[`achievement:${bronze.id}`].tier, 'thuong');
  // ⚠️ NHIỆM VỤ NGÀY ĐÃ RỜI KHỎI CHỒNG THẺ (2026-09-01) — nó xong gần như MỖI NGÀY, tức là nguồn
  // thường xuyên nhất và ít bất ngờ nhất, mà tab "Nhiệm vụ" (nút thứ 2/5 thanh dưới) đã hiện tiến
  // độ SỐNG của từng nhiệm vụ. Bài này nay khoá điều NGƯỢC LẠI: nó không được quay lại.
  assert.equal(
    byId[`mission:${mission.id}`], undefined,
    'nhiệm vụ ngày lại sinh thẻ toast — mỗi ngày một lần thì đó là tiếng ồn, không phải tin',
  );

  // Thứ tự trong CÙNG một nguồn giữ nguyên thứ tự store ghi (sort ổn định).
  const achOrder = toasts.filter((t) => t.source === 'achievement').map((t) => t.key);
  assert.deepEqual(achOrder, [gold.id, bronze.id]);
});

test('id lạ bị bỏ qua, không dựng thẻ rỗng', () => {
  const toasts = buildRewardToasts(ui({
    achievementQueue: ['khong_ton_tai'],
    missionCompletedIds: ['cung_khong_ton_tai'],
  }));
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
  }));

  assert.deepEqual(
    toasts.map((t) => t.source),
    ['loot', 'relic', 'level', 'achievement'],
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
  }));

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
  }));

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
  const [loot] = buildRewardToasts(PHIEN_THUONG).filter((t) => t.source === 'loot');
  assert.ok(loot, 'mất luôn thẻ tổng kết phiên');
  assert.match(loot.description, /tài nguyên/, 'không có mốc mà đã thôi nói tài nguyên');
});

test('sắp tới mốc ⇒ thẻ phiên NÓI VỀ MỐC thay vì đếm tài nguyên', () => {
  // ⚠️ THAY chứ không NỐI: `description` của `RewardCard` chỉ được ĐÚNG MỘT DÒNG, nối thêm thì bị
  // cắt bằng "…" và mất đúng phần đáng đọc. Thứ bị thay là con số Đàm không dùng để quyết gì.
  const hint = 'Một phiên nữa là tới «Khám Phá Tân Thế Giới»';
  const [loot] = buildRewardToasts(PHIEN_THUONG, { stageHint: hint }).filter((t) => t.source === 'loot');
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
  const [loot] = buildRewardToasts(PHIEN_CO_SU_KIEN).filter((t) => t.source === 'loot');
  assert.ok(loot, 'mất luôn thẻ tổng kết phiên');
  assert.equal(loot.name, 'Đột Phá!', 'thẻ vẫn dùng nhãn chung ⇒ câu chuyện của phiên bị xoá');
  assert.equal(loot.icon, '💡', 'vẫn dùng icon quà chung ⇒ mọi phiên trông giống hệt nhau');
  assert.match(loot.description, /hiểu sâu/, 'mất câu kể chuyện');
  assert.match(loot.description, /30 XP thưởng/, 'không nói phần XP mà chính sự kiện mang lại');
});

test('KHÔNG có sự kiện ⇒ giữ nguyên thẻ chung như cũ', () => {
  // Đối chứng: bản vá chỉ được đổi hành vi ở nhánh CÓ sự kiện. 37% số phiên còn lại phải y hệt.
  const [loot] = buildRewardToasts(PHIEN_THUONG).filter((t) => t.source === 'loot');
  assert.equal(loot.name, 'Phiên đã xong');
  assert.equal(loot.icon, '🎁');
  assert.match(loot.description, /tài nguyên/);
});

test('mốc sắp tới VẪN THẮNG phần mô tả, nhưng sự kiện giữ tên và icon', () => {
  // Hai thứ này KHÔNG tranh chỗ: "còn một phiên nữa là tới «…»" là thứ khiến người ta làm phiên
  // tiếp và nó hiếm hơn nhiều; sự kiện thì nhận diện cái thẻ. Nhường một dòng, giữ mặt thẻ.
  const hint = 'Một phiên nữa là tới «Khám Phá Tân Thế Giới»';
  const [loot] = buildRewardToasts(PHIEN_CO_SU_KIEN, { stageHint: hint }).filter((t) => t.source === 'loot');
  assert.equal(loot.description, hint, 'mốc bị sự kiện đẩy khỏi dòng mô tả');
  assert.equal(loot.name, 'Đột Phá!', 'có mốc thì lại mất luôn tên sự kiện');
});

test('sự kiện KHÔNG nâng bậc độ hiếm — bậc đang đo ĐỘ DÀI PHIÊN', () => {
  // ⚠️ Bậc nói về thứ Đàm CHỦ ĐỘNG quyết được (25' ×1.0 · 26' ×1.3 · 60' ×2.0). Nâng bậc theo một
  // cú tung xúc xắc sẽ làm bậc thôi nói lên điều gì về chính phiên ấy.
  const [thuong] = buildRewardToasts(PHIEN_THUONG).filter((t) => t.source === 'loot');
  const [coSuKien] = buildRewardToasts(PHIEN_CO_SU_KIEN).filter((t) => t.source === 'loot');
  assert.equal(coSuKien.tier, thuong.tier, 'sự kiện đang tự nâng bậc của mình');
});

// ─── Rương Lớn + tinh luyện phải được GỌI TÊN trên thẻ (2026-09-01) ──────────
// Đo trên fixture 624 phiên: Rương Lớn ở 10,1% số phiên, tinh luyện ở 28,8% — cả hai đã được
// tính từ lâu mà chưa bao giờ hiện tên. "Rương Lớn" trước nay chỉ là chữ "lớn" viết thường bé
// xíu trên huy hiệu hệ số; tinh luyện thì không hiện ở đâu cả.

// THỬ-CHO-ĐỎ: xoá dòng `if (pendingReward.largeChest) bits.push('Rương Lớn');` ⇒ bài này đỏ.
test('thẻ tổng kết gọi tên Rương Lớn và tinh luyện, xếp HIẾM trước THƯỜNG', () => {
  const [the] = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: {
      totalSessionXP: 900, multiplier: 2.0, largeChest: true, t2Drop: 1,
      resources: { go: 18 }, rpEarned: 120,
    },
  });
  assert.equal(the.source, 'loot');
  const mo = the.description;
  assert.ok(mo.includes('Rương Lớn'), `thiếu Rương Lớn: ${mo}`);
  assert.ok(mo.includes('tinh luyện'), `thiếu tinh luyện: ${mo}`);
  // Thứ tự là phần quan trọng: dòng chỉ có MỘT dòng, dài hơn bị cắt "…".
  assert.ok(
    mo.indexOf('Rương Lớn') < mo.indexOf('tinh luyện'),
    `Rương Lớn (10,1% phiên) phải đứng trước tinh luyện (28,8%): ${mo}`,
  );
  assert.ok(
    mo.indexOf('tinh luyện') < mo.indexOf('tài nguyên'),
    `tinh luyện phải đứng trước tài nguyên (có ở gần như mọi phiên): ${mo}`,
  );
});

// THỬ-CHO-ĐỎ: bỏ `pendingReward.largeChest ? 'Rương Lớn' : null` khỏi mảng `khoe` ⇒ đỏ.
test('phiên CÓ sự kiện vẫn khoe Rương Lớn — 63% phiên đi qua nhánh này', () => {
  const [the] = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: {
      totalSessionXP: 900, multiplier: 2.0, largeChest: true,
      positiveEvent: { icon: '💡', label: 'Đột Phá!', desc: 'Khoảnh khắc hiểu sâu bất ngờ' },
      positiveEventBonus: 120,
    },
  });
  assert.equal(the.icon, '💡');
  assert.equal(the.name, 'Đột Phá!');
  assert.ok(the.description.includes('Rương Lớn'), `thiếu Rương Lớn: ${the.description}`);
  assert.ok(the.description.includes('Khoảnh khắc hiểu sâu'), 'mất câu chuyện của sự kiện');
});

test('không có gì hiếm thì KHÔNG bịa ra dòng nào', () => {
  const [the] = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 300, multiplier: 1.0, resources: { go: 4 }, rpEarned: 40 },
  });
  assert.ok(!the.description.includes('Rương Lớn'));
  assert.ok(!the.description.includes('tinh luyện'));
  assert.equal(the.description, '+4 tài nguyên · +40 RP');
});

// ─── MỐC CHUỖI 7 / 14 / 30 (2026-09-01) ──────────────────────────────────────
// `STREAK_MILESTONES` có từ lâu và được dùng để vẽ "đích kế tiếp", nhưng LÚC CHẠM mốc thì app
// không nói một câu nào — kể cả mốc 30, thứ mở +5% allBonus VĨNH VIỄN.

// THỬ-CHO-ĐỎ: xoá `buildMilestoneToast(...)` khỏi mảng trong `buildRewardToasts` ⇒ bài này đỏ.
test('chạm mốc chuỗi thì có thẻ ăn mừng, và mốc vĩnh viễn mang bậc cao hơn', () => {
  const nhinThay = (streakDays) => buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 500, multiplier: 1.3, streakDays, streakMissionXP: 40 },
  }).find((t) => t.source === 'milestone');

  const moc7 = nhinThay(7);
  assert.ok(moc7, 'mốc 7 không sinh thẻ');
  assert.equal(moc7.name, 'Chuỗi 7 ngày');
  assert.equal(moc7.tier, 'hiem');

  const moc30 = nhinThay(30);
  assert.ok(moc30, 'mốc 30 không sinh thẻ');
  assert.equal(moc30.tier, 'huyenThoai', 'mốc mở buff vĩnh viễn phải ở bậc cao nhất');
  assert.ok(/vĩnh viễn/.test(moc30.description), 'không nói ra phần thưởng vĩnh viễn');

  // ngày thường thì im lặng
  for (const ngay of [1, 6, 8, 13, 29, 31]) {
    assert.equal(nhinThay(ngay), undefined, `ngày ${ngay} không phải mốc mà vẫn ăn mừng`);
  }
});

// THỬ-CHO-ĐỎ: bỏ vế `if (!(Number(pendingReward.streakMissionXP ?? 0) > 0)) return null;` ⇒ đỏ.
test('mỗi mốc ăn mừng ĐÚNG MỘT LẦN, kể cả khi làm nhiều phiên trong ngày mốc', () => {
  // Phiên thứ hai trong cùng ngày: `streakDays` VẪN là 7 (chuỗi chỉ nhích ở phiên đầu ngày),
  // nhưng `streakMissionXP` đã bị `streakMissionClaimedToday` gác về 0.
  const phienSau = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 500, multiplier: 1.3, streakDays: 7, streakMissionXP: 0 },
  });
  assert.equal(
    phienSau.filter((t) => t.source === 'milestone').length, 0,
    'phiên thứ hai trong ngày mốc lại ăn mừng lần nữa',
  );
});

// THỬ-CHO-ĐỎ: thêm `{ days: 3, label: 'mốc 3' }` vào STREAK_MILESTONES ⇒ bài này đỏ.
// Đây là bài canh QUAN HỆ, không canh con số: nó bảo đảm tín hiệu chống-lặp còn CHE HẾT các mốc.
test('mọi mốc phải nằm trên ngưỡng của tín hiệu chống-lặp một-lần-mỗi-ngày', async () => {
  const { STREAK_MILESTONES, STREAK_MISSION_MIN_STREAK } = await import('./constants.js');
  assert.ok(STREAK_MILESTONES.length > 0, 'bảng mốc rỗng — phép đo chạy rỗng');
  const hoLot = STREAK_MILESTONES.filter((m) => m.days < STREAK_MISSION_MIN_STREAK);
  assert.deepEqual(
    hoLot, [],
    `mốc ${hoLot.map((m) => m.days).join(', ')} nằm DƯỚI ngưỡng ${STREAK_MISSION_MIN_STREAK} `
    + 'nên `streakMissionXP` không che được nó ⇒ mốc ấy sẽ ăn mừng lại ở MỌI phiên trong ngày. '
    + 'Thêm mốc nhỏ hơn thì phải tìm một tín hiệu một-lần-mỗi-ngày khác, đừng bỏ qua bài này.',
  );
});

// ─── CHỒNG THẺ SAU MỘT PHIÊN: CẮT CHỖ LẶP, GIỮ CHỖ VUI (2026-09-01) ──────────
// Đo ca xấu nhất hợp lý trước vòng 23: **8 thẻ · 87 từ · 12 giây thẻ nối đuôi**, và thứ tự đặt
// «tổng kết tuần» lên trước cả DI VẬT — phần thưởng hiếm nhất game — nên di vật rơi khỏi ba thẻ
// được hiện. Hai nguồn bị cắt vì chúng ĐÃ có một kênh bền và chúng LẶP:
//   `rank`    — cùng sự kiện đã vào chuông (`makeRankUpFeedNotification`) ⇒ kể hai lần
//   `mission` — xong gần như MỖI NGÀY, mà tab "Nhiệm vụ" hiện tiến độ sống
// Hai nguồn KHÔNG bị cắt dù cũng có chấm bền, vì chúng là KHOẢNH KHẮC chứ không phải tiếng ồn:
//   `weekly`      — đến đúng một lần mỗi tuần, không thể tự đến lần thứ hai
//   `achievement` — mở khoá một thành tích là chuyện đáng ăn mừng; một cái chấm 6px thì không.

// THỬ-CHO-ĐỎ: nối lại `...missionCompletedIds.map(buildMissionToast)` ⇒ bài này đỏ.
test('nguồn LẶP đã rời chồng thẻ, nguồn KHOẢNH KHẮC thì ở lại', () => {
  const day = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 900, multiplier: 1.3 },
    weeklyReportPending: true,
    relicNotification: RELIC,
    levelUpQueue: [{ levelsGained: 1, newLevel: 6, spGained: 2 }],
    achievementQueue: [ACHIEVEMENTS[0].id],
    missionCompletedIds: ['m1', 'm2', 'm3'],
    rankUpNotification: { rankLabel: 'Cao thủ', rankIcon: '🎖️' },
  });
  const nguon = new Set(day.map((t) => t.source));

  assert.ok(!nguon.has('mission'), 'nhiệm vụ ngày quay lại chồng thẻ — nguồn thường xuyên nhất');
  assert.ok(!nguon.has('rank'), 'thăng hạng quay lại chồng thẻ — chuông đã kể chuyện ấy rồi');
  for (const phai of ['loot', 'weekly', 'relic', 'level', 'achievement']) {
    assert.ok(nguon.has(phai), `mất nguồn "${phai}" — đó là khoảnh khắc, không phải tiếng ồn`);
  }
  // Gác chạy-rỗng: kịch bản phải THẬT SỰ dựng ra nhiều thẻ, nếu không mọi assert trên là vô nghĩa.
  assert.ok(day.length >= 5, `mới có ${day.length} thẻ — kịch bản thử không đủ dày`);
});

// THỬ-CHO-ĐỎ: nối lại nguồn `mission` ⇒ bài này đỏ (ca thường ngày thành 2 thẻ).
test('ngày thường: xong phiên + xong nhiệm vụ ngày vẫn chỉ MỘT thẻ', () => {
  const chiPhien = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 900, multiplier: 1.3 },
  });
  const kemNhiemVu = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 900, multiplier: 1.3 },
    missionCompletedIds: ['m1', 'm2'],
  });
  assert.equal(chiPhien.length, 1);
  assert.equal(
    kemNhiemVu.length, 1,
    'xong nhiệm vụ ngày lại đẻ thêm thẻ — đây là ca xảy ra gần như mỗi ngày, tức chỗ mà một thẻ '
    + 'thừa bị nhìn thấy nhiều nhất',
  );
});
