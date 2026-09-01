/**
 * rewardTiers.js — THANG ĐỘ HIẾM DUY NHẤT của app (2026-08-27, ADR-060).
 * ─────────────────────────────────────────────────────────────────────────────
 * Trước file này, mỗi đường trao thưởng tự chọn màu lấy: `LootDropModal` có bốn
 * "tone" riêng (`amber`/`orange`/`sky`/`violet`), `badgeStyles.js` có ba bậc
 * Tailwind (`slate`/`cyan`/`fuchsia`), thành tích có năm hạng huy chương, còn
 * phiên làm việc thì chỉ có một dòng chữ `tierLabel`. Bốn từ vựng cho cùng MỘT
 * câu hỏi *"cái này quý tới đâu?"* — nên không có cách nào để Đàm so hai phần
 * thưởng đến từ hai đường khác nhau.
 *
 * ⚠️ ĐÚNG BỐN BẬC — KHÔNG THÊM BẬC THỨ NĂM. Đây là ràng buộc Đàm ra, và
 * `rewardTiers.test.js` khoá đúng con số 4. Lý do không phải thẩm mỹ: mắt chỉ
 * đọc được một thang màu khi số bậc còn đếm được trong một cái liếc. Thêm bậc
 * thứ năm là cách rẻ nhất để biến thang này về lại "mỗi chỗ một màu".
 *
 * ⚠️ VÌ SAO SỐNG Ở `engine/` CHỨ KHÔNG Ở `components/shared/` (nơi `badgeStyles.js`
 * đang ở): `engine/rewardFeed.js` cần đúng thang này để chấm hạng cho mỗi phần
 * thưởng, mà **chưa từng có file nào trong `engine/` import từ `components/`** —
 * mở đường đó ra là tạo một chiều phụ thuộc ngược. Đặt thang ở tầng dưới thì cả
 * hai tầng cùng dùng được, và vẫn chỉ có MỘT bản. (`constants.js` cũng đã chứa
 * nhãn tiếng Việt và emoji, nên chuỗi trình bày ở `engine/` không phải cái mới.)
 *
 * ⚠️ MỖI BẬC MỘT BIẾN CSS, KHÔNG PHẢI MỘT MÃ MÀU. Dự án có 5 skin × 2 theme;
 * viết `#b07d3b` vào đây là khoá một bậc vào đúng một skin. Bốn biến dưới đây đều
 * khai ở `:root` trong `index.css` nên chúng có mặt ở mọi tổ hợp skin/theme.
 */

/** Thứ tự từ thấp tới cao. Đây là DANH SÁCH GỐC — mọi phép duyệt phải đi qua nó. */
export const REWARD_TIER_KEYS = ['thuong', 'tot', 'hiem', 'huyenThoai'];

/**
 * `colorVar` là token CSS, không phải mã màu (xem chú thích đầu file).
 * `pips` là tín hiệu THỨ HAI, không phụ thuộc màu: Đàm phải đọc được độ hiếm cả
 * khi không phân biệt được màu (mù màu, ảnh đen trắng, màn hình ngoài nắng).
 * Nhãn chữ mới là thứ bảo đảm điều đó; `pips` chỉ là lớp thứ ba cho dễ liếc.
 */
export const REWARD_TIER = {
  thuong:     { key: 'thuong',     label: 'Thường',      colorVar: 'var(--muted)',  rank: 0, pips: 1 },
  tot:        { key: 'tot',        label: 'Tốt',         colorVar: 'var(--good)',   rank: 1, pips: 2 },
  hiem:       { key: 'hiem',       label: 'Hiếm',        colorVar: 'var(--warn)',   rank: 2, pips: 3 },
  huyenThoai: { key: 'huyenThoai', label: 'Huyền thoại', colorVar: 'var(--accent)', rank: 3, pips: 4 },
};

export const DEFAULT_REWARD_TIER = 'thuong';

/** Luôn trả về một key HỢP LỆ — không có nhánh nào ném lỗi giữa màn hình phần thưởng. */
export function resolveRewardTier(key) {
  return REWARD_TIER[key] ? key : DEFAULT_REWARD_TIER;
}

export function getRewardTier(key) {
  return REWARD_TIER[resolveRewardTier(key)];
}

/**
 * Bản vẽ: `common`/`rare`/`epic` → nhãn tiếng Việt sẵn có là *Phổ Thông / Hiếm /
 * Sử Thi*. Ghép theo ĐÚNG TÊN: `rare` đã tên là "Hiếm" nên nó phải rơi vào bậc
 * "hiếm" — đẩy nó xuống "tốt" là bắt app gọi cùng một thứ bằng hai tên.
 * Hệ quả có chủ đích: bậc "tốt" không có bản vẽ nào; nó tới từ thành tích bạc và
 * phiên ×1.3. Thang này là của CẢ APP, không phải của riêng một nguồn.
 */
const BLUEPRINT_RARITY_TO_TIER = {
  common: 'thuong',
  rare:   'hiem',
  epic:   'huyenThoai',
};

export function tierFromBlueprintRarity(rarity) {
  return BLUEPRINT_RARITY_TO_TIER[rarity] ?? DEFAULT_REWARD_TIER;
}

/** Năm hạng huy chương → bốn bậc: hai hạng cao nhất dùng chung bậc đỉnh. */
const ACHIEVEMENT_TIER_TO_TIER = {
  bronze:   'thuong',
  silver:   'tot',
  gold:     'hiem',
  platinum: 'huyenThoai',
  diamond:  'huyenThoai',
};

export function tierFromAchievementTier(tier) {
  return ACHIEVEMENT_TIER_TO_TIER[tier] ?? DEFAULT_REWARD_TIER;
}

/**
 * Nhiệm vụ ngày: `bucket` (`core`/`variety`/`stretch`/`rare`) đã là thang khó-dễ
 * mà `MISSION_CATALOG` dùng để rút bài mỗi ngày — chấm hạng theo nó thay vì theo
 * số XP (XP còn bị nhân bởi công trình và kỹ năng, nên cùng một nhiệm vụ sẽ đổi
 * bậc theo tiến độ chơi, tức bậc thôi không còn nói về nhiệm vụ nữa).
 * Nhiệm vụ ngày KHÔNG chạm bậc đỉnh — đó là chủ ý: một việc làm mỗi ngày thì
 * không thể là "huyền thoại", và thang này chỉ có nghĩa khi bậc đỉnh vẫn hiếm.
 */
const MISSION_BUCKET_TO_TIER = {
  core:    'thuong',
  variety: 'thuong',
  stretch: 'tot',
  rare:    'hiem',
};

export function tierFromMissionBucket(bucket) {
  return MISSION_BUCKET_TO_TIER[bucket] ?? DEFAULT_REWARD_TIER;
}

/**
 * Phiên làm việc: hệ số nhân (`getMultiplierTier` ở `gameMath.js`) là thứ app đã
 * dùng để nói phiên này "nặng" tới đâu — ×1.0 / ×1.3 / ×2.0 — nên chấm hạng theo
 * nó thay vì bịa một trục mới. ĐẠI TRÚNG THƯỞNG là bậc đỉnh.
 * ⚠️ So sánh dùng NGƯỠNG chứ không dùng `===`: hệ số cuối còn nhân thêm buff kỹ
 * năng/công trình nên nó hiếm khi bằng đúng 1.3.
 */
export function tierFromSessionMultiplier(multiplier, jackpotApplied = false) {
  if (jackpotApplied) return 'huyenThoai';
  const m = Number(multiplier);
  if (!Number.isFinite(m)) return DEFAULT_REWARD_TIER;
  if (m >= 2)   return 'hiem';
  if (m >= 1.3) return 'tot';
  return 'thuong';
}

/**
 * TIẾNG THEO BẬC — mỗi lượt thẻ mới kêu ĐÚNG MỘT tiếng, chọn theo bậc hiếm nhất trong lượt ấy.
 *
 * VÌ SAO CÓ (2026-09-01): `rewardFeed.js` có **9 nguồn thẻ** nhưng `RewardToastHost` chỉ rẽ **3
 * nhánh `if`** (`loot` · `milestone` · `level`) ⇒ **6/9 nguồn hoàn toàn câm**, trong đó có cả di
 * vật và mốc chuỗi vĩnh viễn — hai thứ mang bậc `huyenThoai`, tức đúng những phần thưởng hiếm
 * nhất game lại là những phần thưởng không kêu một tiếng nào. Trong khi đó bậc độ hiếm ĐÃ được
 * tính cho MỌI thẻ và đã được kênh MẮT dùng (vệt màu + chấm `pips` của `RewardCard`); chỉ kênh
 * TAI là chưa bao giờ đọc tới nó.
 *
 * ⚠️ ĐÂY LÀ PHÉP GỘP, KHÔNG PHẢI PHÉP THÊM. Nó XOÁ ba nhánh `if` (kể cả trường hợp đặc biệt
 * `!coMoc` viết ngày 2026-09-01 để chống hai tiếng chồng nhau) và thay bằng một bảng bốn dòng:
 * "một lượt một tiếng" biến việc chống-chồng-tiếng thành HỆ QUẢ CỦA CẤU TẠO chứ không phải một
 * cái `if` phải nhớ. **0 tiếng mới, 0 chữ mới trên màn hình, ít mã hơn trước.**
 *
 * ⚠️ GHI TÊN HÀM, KHÔNG GHI HÀM. `engine/` chưa từng import `components/` hay `soundEngine`
 * (xem chú thích đầu file về chiều phụ thuộc); để tầng giao diện tự tra tên trong `soundEngine`
 * thì bảng này vẫn thuần và vẫn test được mà không kéo Web Audio vào `node --test`.
 *
 * ⚠️ `tot` và `thuong` CỐ Ý DÙNG CHUNG một tiếng. Bốn bậc là để MẮT đọc (bốn màu, bốn mức chấm);
 * tai không phân biệt nổi bốn tiếng chuông gần nhau trong 4 giây, và hai bậc thấp chiếm 89,9%
 * số phiên (đo 624 phiên: thuong 25,8% · tot 64,1% · hiem 10,1%) — cho chúng hai tiếng khác nhau
 * là làm cái tiếng thường gặp nhất mất ý nghĩa. Tiếng chỉ cần trả lời "vừa rồi có gì hiếm không".
 */
export const REWARD_TIER_SOUND = {
  thuong:     'playChestOpen',
  tot:        'playChestOpen',
  hiem:       'playMilestone',
  huyenThoai: 'playJackpot',
};

/** Tên hàm trong `soundEngine` cho một bậc; luôn trả về một tên hợp lệ. */
export function soundForTier(key) {
  return REWARD_TIER_SOUND[resolveRewardTier(key)];
}
