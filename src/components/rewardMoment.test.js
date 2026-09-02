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

// THỬ-CHO-ĐỎ: đổi thứ tự ternary cho `levelsGained` lên trước `eraChanged` ⇒ bài này đỏ.
test('nhan đề phải nói THỨ TO NHẤT vừa xảy ra, theo đúng thứ tự hiếm', () => {
  const src = doc('./LootDropModal.jsx');
  // ⚠️ NEO PHẢI DUY NHẤT. Bản đầu neo vào `resolvedPhase === 0` và bài test ĐỎ trên mã hoàn toàn
  // đúng: chuỗi ấy xuất hiện **6 lần** trong file (hoạt hoạ lắc, nhịp lặp, tiếng mở rương…) và
  // `indexOf` trả về lần THỨ NHẤT, cách nhan đề vài nghìn ký tự. Neo vào câu chỉ nhan đề mới có.
  const i = src.indexOf("'Đang tổng hợp phần thưởng'");
  assert.ok(i > 0, 'không tìm thấy nhan đề — phép đo đang chạy rỗng');
  assert.equal(
    src.split("'Đang tổng hợp phần thưởng'").length - 1, 1,
    'neo thôi duy nhất ⇒ bài test có thể đang đo một chỗ khác',
  );
  const khoi = src.slice(i, i + 420);

  const viTriKy = khoi.indexOf('reward.eraChanged');
  const viTriCap = khoi.indexOf('reward.levelsGained');
  assert.ok(viTriKy > 0, 'nhan đề không còn nói tới kỷ nguyên — tin hiếm nhất game lại nằm ở đáy '
    + 'một trang cao gần bốn màn hình, đúng chỗ Đàm không cuộn tới');
  assert.ok(viTriCap > 0, 'nhan đề không còn nói tới lên cấp');
  assert.ok(
    viTriKy < viTriCap,
    'lên cấp đang được hỏi TRƯỚC kỷ nguyên ⇒ một phiên vừa mở kỷ mới lại hiện "Lên cấp N", tức '
    + 'nhan đề nói tin nhỏ hơn trong khi tin lớn hơn có sẵn',
  );

  // ⚠️ GIỮ NGUYÊN thẻ ăn mừng ở giai đoạn 6: cả chuỗi 7 giai đoạn sinh ra để dồn nén tới đó.
  // Thứ được sửa là cái NHAN ĐỀ, không phải bỏ phần ăn mừng đi.
  assert.match(
    src, /resolvedPhase >= 6 && reward\.eraChanged && \(\s*<EraChangeBanner/,
    'thẻ ăn mừng kỷ nguyên bị gỡ mất — sửa nhan đề KHÔNG được đánh đổi bằng phần ăn mừng',
  );
});

// THỬ-CHO-ĐỎ: dán lại một trong bốn câu ⇒ bài này đỏ.
test('bốn đoạn KỂ LẠI NGHIỆP VỤ KẾ TOÁN không được quay lại', () => {
  /*
    Đo trước khi cắt: 3.384px = 4,01 màn hình điện thoại · 327 chữ · 31 con số cho MỘT phiên xong.
    Bốn câu dưới đây đều GIẢI THÍCH cách ghi sổ (hoặc mô tả bố cục trang) ở đúng khoảnh khắc đáng
    lẽ phải ăn mừng, và mọi con số chúng nhắc tới đều đã có sẵn thành thẻ ngay bên cạnh.
  */
  const src = doc('./LootDropModal.jsx');
  const CAM = [
    'đã được ghi lại thành XP, tài nguyên và RP',
    'mọi phần thưởng được gom lại ở đây theo cùng một nhịp đọc',
    'Giá trị cuối sau khi cộng mọi hệ số và phần thưởng thêm',
    'Tổng kết phiên',
  ];
  for (const cau of CAM) {
    assert.ok(!src.includes(cau), `câu kể-lại-sổ-sách quay lại: "${cau}"`);
  }
  // Gác chạy-rỗng: `stripComments` phải thật sự để lại phần JSX, nếu không mọi assert trên xanh oan.
  assert.ok(src.includes('EraChangeBanner') && src.length > 20_000, 'phép đo đang chạy rỗng');
});
