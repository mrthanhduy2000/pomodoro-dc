/**
 * rewardMoment.test.js — canh KHOẢNH KHẮC SAU PHIÊN, thứ vừa được soi lần đầu (2026-09-02).
 *
 * Cả màn này sống trong `state.ui` nên suốt nhiều vòng KHÔNG ai nhìn thấy nó; `src/dev/
 * previewStage.js` mới mở được cửa. Nhìn lần đầu thì thấy ba khuyết tật, và cả ba đều ĐO ĐƯỢC:
 *   · một DI VẬT HUYỀN THOẠI hiện ra y hệt một phiên 25 phút thường — bậc chỉ đổi được 3px vệt
 *     màu, mấy cái chấm và một chữ;
 *   · chữ "THƯỜNG" bị đóng dấu lên đúng chiến thắng vừa giành được, dù `thuong` là bậc MẶC ĐỊNH
 *     (tức nó mang sự VẮNG tin, không mang tin);
 *   · lúc Đàm mở một KỶ NGUYÊN MỚI, tin ấy nằm trong thẻ cao 299px ở ĐÁY trang cao 3.201px,
 *     trong khi dòng chữ to nhất đầu trang chỉ ghi "Tổng kết phiên".
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { stripComments } from '../utils/sourceScan.js';
import { REWARD_TIER, REWARD_TIER_KEYS } from '../engine/rewardTiers.js';

const doc = (p) => stripComments(readFileSync(new URL(p, import.meta.url), 'utf8'));

// THỬ-CHO-ĐỎ: bỏ `if (tier.rank === 0) return null;` ⇒ bài này đỏ.
test('bậc THẤP NHẤT không được dán nhãn — nó là mặc định, tức sự VẮNG tin', () => {
  const src = doc('./shared/RewardCard.jsx');
  assert.match(
    src, /export function RewardTierBadge\([^)]*\) \{[\s\S]{0,200}?if \(tier\.rank === 0\) return null;/,
    'nhãn bậc thấp nhất quay lại ⇒ màn hình đóng dấu "THƯỜNG" lên đúng phiên Đàm vừa làm xong',
  );
  // Gác: bậc 0 phải THẬT SỰ là bậc mặc định, nếu không câu trên nói về một thứ khác.
  assert.equal(REWARD_TIER.thuong.rank, 0);
  assert.equal(REWARD_TIER_KEYS[0], 'thuong');
});

// THỬ-CHO-ĐỎ: đổi `borderLeft` về hằng số `3px` ⇒ bài này đỏ.
test('thẻ phải LEO THANG theo bậc — hiếm mà không nổi thì độ hiếm là chữ suông', () => {
  const src = doc('./shared/RewardCard.jsx');
  assert.match(
    src, /borderLeft: `\$\{3 \+ Math\.max\(0, tier\.rank - 1\) \* 2\}px/,
    'vệt màu lại thành hằng số ⇒ di vật huyền thoại và phiên thường có cùng bề dày',
  );
  assert.match(
    src, /background: tier\.rank >= 2\s*\?\s*`color-mix/,
    'nền thôi pha theo bậc ⇒ ba thẻ xám chồng nhau, không thẻ nào nổi hơn thẻ nào',
  );
  // ⚠️ CHỈ hai bậc CAO mới được nổi. Tô đậm cả bốn bậc là biến mọi phần thưởng thành quảng cáo —
  // và lúc ấy "nổi" thôi mang tin, đúng cái bệnh vừa chữa ở nhãn bậc.
  assert.match(src, /tier\.rank >= 2/, 'phải có ngưỡng bậc, không được tô đậm mọi thẻ');
  assert.doesNotMatch(
    src, /background: `color-mix\(in srgb, \$\{tier\.colorVar\} \d+%, var\(--card-bg-solid\)\)`,\n/,
    'nền pha màu VÔ ĐIỀU KIỆN ⇒ bậc thường cũng nổi, tức không còn phân bậc',
  );
});

// ⚠️ ADR-070 (2026-09-06): hai bài đọc `LootDropModal.jsx` (nhan đề nói thứ to nhất · bốn đoạn kể sổ
// sách) đã gỡ CÙNG hộp thoại ấy. Chuỗi thẻ thưởng là cái kết duy nhất; thứ tự "tin to nhất trước"
// nay là thứ tự thẻ, khoá ở `sessionRewardStory.test.js`.
