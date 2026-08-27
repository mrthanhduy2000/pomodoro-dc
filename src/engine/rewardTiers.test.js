import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  REWARD_TIER,
  REWARD_TIER_KEYS,
  getRewardTier,
  resolveRewardTier,
  tierFromAchievementTier,
  tierFromBlueprintRarity,
  tierFromSessionMultiplier,
} from './rewardTiers.js';
import { ACHIEVEMENTS, BLUEPRINT_RARITY_LABEL } from './constants.js';

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * ⚠️ Bài này khoá một RÀNG BUỘC Đàm ra ("đúng bốn bậc, không thêm bậc thứ năm"),
 * không khoá một phép làm tròn. Cách rẻ nhất để thang màu thoái hoá về "mỗi chỗ
 * một màu" là thêm dần bậc cho vừa một ca khó — con số 4 ở đây là cái chặn duy
 * nhất, vì thêm một bậc thì build vẫn xanh và lint vẫn sạch.
 */
test('thang độ hiếm có ĐÚNG bốn bậc, mỗi bậc một màu riêng', () => {
  assert.equal(REWARD_TIER_KEYS.length, 4);
  assert.equal(Object.keys(REWARD_TIER).length, 4, 'bảng style phải phủ đúng danh sách gốc, không dư');

  for (const key of REWARD_TIER_KEYS) {
    assert.ok(REWARD_TIER[key], `thiếu bậc "${key}" trong bảng style`);
  }

  const colors = REWARD_TIER_KEYS.map((key) => REWARD_TIER[key].colorVar);
  assert.equal(new Set(colors).size, 4, `hai bậc đang dùng chung một màu: ${colors.join(' · ')}`);

  // Thứ hạng phải tăng đều theo đúng thứ tự danh sách — nếu không thì phép sắp
  // xếp "phần thưởng quý nhất lên trước" ở `rewardFeed.js` sẽ xếp sai mà không kêu.
  const ranks = REWARD_TIER_KEYS.map((key) => REWARD_TIER[key].rank);
  assert.deepEqual(ranks, [0, 1, 2, 3]);
});

/**
 * Màu phải là BIẾN CSS, không phải mã màu: app có 5 skin × 2 theme, một mã màu
 * cứng chỉ đúng ở đúng một tổ hợp. Bốn biến này đều khai ở `:root` của
 * `index.css` nên chúng tồn tại ở MỌI tổ hợp — bài này kiểm cả hai vế.
 */
test('mỗi bậc trỏ tới một biến CSS có thật ở :root', () => {
  const css = readFileSync(join(HERE, '..', 'index.css'), 'utf8');
  const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('[data-skin='));

  for (const key of REWARD_TIER_KEYS) {
    const { colorVar } = REWARD_TIER[key];
    const name = /^var\((--[a-z0-9-]+)\)$/.exec(colorVar)?.[1];
    assert.ok(name, `bậc "${key}" khai màu "${colorVar}" — phải là dạng var(--x)`);
    assert.ok(
      rootBlock.includes(`${name}:`),
      `biến ${name} (bậc "${key}") không được khai ở :root — nó sẽ rỗng ở skin nào không khai lại`,
    );
  }
});

test('mọi từ vựng độ hiếm đang có của app đều ánh xạ được vào bốn bậc', () => {
  // Bản vẽ: 3 mức. Đọc THẲNG từ bảng nhãn thay vì chép tay ba chữ — thêm mức thứ
  // tư ở `constants.js` thì bài này đỏ ngay thay vì im lặng rơi về "thường".
  for (const rarity of Object.keys(BLUEPRINT_RARITY_LABEL)) {
    assert.ok(
      REWARD_TIER[tierFromBlueprintRarity(rarity)],
      `độ hiếm bản vẽ "${rarity}" không ánh xạ được`,
    );
  }

  // Thành tích: 5 hạng huy chương. Duyệt bảng thật, không duyệt danh sách nhớ.
  const achievementTiers = new Set(ACHIEVEMENTS.map((a) => a.tier));
  assert.ok(achievementTiers.size >= 4, 'không đọc được hạng thành tích — bảng đã đổi hình?');
  for (const tier of achievementTiers) {
    assert.ok(REWARD_TIER[tierFromAchievementTier(tier)], `hạng thành tích "${tier}" không ánh xạ được`);
  }
});

test('hệ số nhân phiên chấm đúng bậc, và ĐẠI TRÚNG THƯỞNG là bậc đỉnh', () => {
  assert.equal(tierFromSessionMultiplier(1.0), 'thuong');
  assert.equal(tierFromSessionMultiplier(1.3), 'tot');
  assert.equal(tierFromSessionMultiplier(2.0), 'hiem');
  assert.equal(tierFromSessionMultiplier(1.0, true), 'huyenThoai');
  // Hệ số cuối còn nhân buff nên nó hiếm khi bằng đúng mốc — ngưỡng phải bắt được
  // cả các giá trị lệch, nếu không thì mọi phiên có buff đều tụt về "thường".
  assert.equal(tierFromSessionMultiplier(1.43), 'tot');
  assert.equal(tierFromSessionMultiplier(2.6), 'hiem');
});

test('đầu vào lạ rơi về "thường" chứ không làm vỡ màn hình phần thưởng', () => {
  assert.equal(resolveRewardTier('khong_co_that'), 'thuong');
  assert.equal(resolveRewardTier(undefined), 'thuong');
  assert.equal(getRewardTier(null).label, 'Thường');
  assert.equal(tierFromSessionMultiplier(Number.NaN), 'thuong');
});
