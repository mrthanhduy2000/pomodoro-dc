/**
 * rewardTierSound.test.js — canh "một lượt thẻ mới = ĐÚNG MỘT tiếng, chọn theo bậc hiếm nhất".
 *
 * Bản trước rẽ ba nhánh `if` theo NGUỒN nên 6/9 nguồn thẻ hoàn toàn câm — gồm cả di vật và mốc
 * chuỗi vĩnh viễn, hai thứ mang bậc `huyenThoai`, tức đúng những phần thưởng hiếm nhất game lại
 * không kêu một tiếng nào.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { REWARD_TIER_KEYS, REWARD_TIER_SOUND, soundForTier } from './rewardTiers.js';
import { buildRewardToasts, highestTier } from './rewardFeed.js';
import { stripComments } from '../utils/sourceScan.js';

// THỬ-CHO-ĐỎ: bỏ một khoá bất kỳ khỏi REWARD_TIER_SOUND ⇒ bài 1 đỏ, kể đích danh bậc nào.
test('mọi bậc đều có tiếng, và tiếng phải TỒN TẠI trong soundEngine', () => {
  const nguon = readFileSync(new URL('./soundEngine.js', import.meta.url), 'utf8');
  const coThat = new Set([...nguon.matchAll(/^ {2}(play[A-Za-z]+)\(/gm)].map((m) => m[1]));
  assert.ok(coThat.size >= 10, `mới thấy ${coThat.size} hàm play* — phép đo đang chạy rỗng`);

  for (const bac of REWARD_TIER_KEYS) {
    const ten = soundForTier(bac);
    assert.ok(ten, `bậc "${bac}" không có tiếng`);
    assert.ok(coThat.has(ten), `bậc "${bac}" trỏ tới "${ten}" — hàm ấy KHÔNG có trong soundEngine`);
  }
  // Đầu vào rác không được làm câm cả app.
  assert.ok(coThat.has(soundForTier('không-phải-bậc')));
  assert.ok(coThat.has(soundForTier(undefined)));
});

// THỬ-CHO-ĐỎ: đổi `hiem` về 'playChestOpen' ⇒ bài 2 đỏ.
test('bậc càng hiếm thì tiếng càng phải KHÁC bậc thường — nếu không thì bảng vô nghĩa', () => {
  const tiengThuong = soundForTier('thuong');
  assert.equal(soundForTier('tot'), tiengThuong, 'hai bậc thấp CỐ Ý dùng chung tiếng — xem chú thích');
  assert.notEqual(soundForTier('hiem'), tiengThuong, 'bậc Hiếm đang kêu y hệt phiên thường');
  assert.notEqual(soundForTier('huyenThoai'), tiengThuong, 'bậc Huyền thoại đang kêu y hệt phiên thường');
  assert.notEqual(soundForTier('huyenThoai'), soundForTier('hiem'), 'Hiếm và Huyền thoại trùng tiếng');
  // Gác chạy-rỗng: bảng phải thật sự dùng ≥3 tiếng khác nhau.
  assert.ok(new Set(Object.values(REWARD_TIER_SOUND)).size >= 3);
});

// THỬ-CHO-ĐỎ: nối lại `if (toast.source === 'loot')` vào RewardToastHost ⇒ bài 3 đỏ.
test('tầng giao diện tra BẢNG, không rẽ nhánh theo NGUỒN', () => {
  const ma = stripComments(readFileSync(new URL('../components/RewardToastHost.jsx', import.meta.url), 'utf8'));
  assert.ok(/soundForTier\s*\(/.test(ma), 'không còn chỗ nào tra bảng — phép đo chạy rỗng');
  assert.ok(
    !/source\s*===\s*'(loot|level|milestone)'[^\n]*soundEngine/.test(ma),
    'lại rẽ nhánh tiếng theo nguồn — 6/9 nguồn sẽ câm trở lại',
  );
  // Tiếng phải đi theo thẻ ĐANG HIỆN, không theo cả danh sách: thẻ nằm ngoài chồng mà kêu thì
  // Đàm nghe một tiếng cho tấm thẻ anh không hề thấy.
  assert.ok(
    /const moi = shown\.filter\(/.test(ma),
    'vòng phát tiếng không còn duyệt `shown` — thẻ vô hình sẽ kêu',
  );
});

// THỬ-CHO-ĐỎ: đổi `highestTier` thành `lowestTier` giả ⇒ bài 4 đỏ.
test('lượt có thứ hiếm thì tiếng phải theo THỨ HIẾM, không theo thẻ đầu tiên', () => {
  const the = buildRewardToasts({
    lootModalOpen: true,
    pendingReward: { totalSessionXP: 500, multiplier: 1.0, streakDays: 30, streakMissionXP: 40 },
  });
  // Thẻ tổng kết (bậc thấp) đứng TRƯỚC thẻ mốc vĩnh viễn (huyenThoai) trong SOURCE_ORDER.
  assert.equal(the[0].source, 'loot');
  assert.ok(the.some((t) => t.tier === 'huyenThoai'), 'kịch bản thử không sinh ra thẻ hiếm');
  assert.equal(highestTier(the), 'huyenThoai');
  assert.equal(soundForTier(highestTier(the)), 'playJackpot',
    'lượt có mốc chuỗi vĩnh viễn mà vẫn kêu tiếng phiên thường');
});
