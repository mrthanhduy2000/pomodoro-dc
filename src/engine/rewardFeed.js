/**
 * rewardFeed.js — GOM mọi phần thưởng "nhẹ" thành MỘT hàng đợi toast (2026-08-27, ADR-060).
 * ─────────────────────────────────────────────────────────────────────────────
 * LUẬT MỨC ĐỘ LÀM PHIỀN (Đàm ra, áp cho toàn app):
 *   • CHẶN MÀN HÌNH chỉ dành cho việc buộc phải QUYẾT ĐỊNH gì đó — lên kỷ,
 *     thăng hoa (prestige), khủng hoảng kỷ, thảm hoạ.
 *   • Mọi thứ còn lại — di vật, bản vẽ, thành tích, nhiệm vụ ngày, lên cấp,
 *     tổng kết phiên thường — đi qua toast góc màn hình.
 *
 * ⚠️ FILE NÀY THUẦN, VÀ KHÔNG ĐỔI MỘT LUẬT TÍNH THƯỞNG NÀO. Nó chỉ ĐỌC những
 * trường `ui.*` mà store đã ghi sẵn từ trước rồi dịch sang một danh sách thẻ.
 * Đây là điểm cắm được chọn rất kỹ, cùng lý do đã ghi ở `RewardSequence`
 * (`App.jsx`): `completeFocusSession` là hàm dài nhất dự án và có ba bài test
 * khẳng định `lootModalOpen` bật ĐỒNG BỘ. Sửa store để hoãn/đổi luồng là cách
 * chắc chắn làm vỡ chúng. Ta chỉ đổi phần HIỂN THỊ.
 *
 * ⚠️ PHÁT HIỆN LÚC LÀM: BA trong bốn kênh thông báo dưới đây được store GHI mà
 * KHÔNG có màn hình nào ĐỌC — `relicNotification` (di vật, phần thưởng quý nhất
 * game), `rankUpNotification` và `missionCompletedIds`. Chúng có cả hàm dismiss
 * (`dismissRelicNotification`…) nhưng không nơi nào gọi. Nghĩa là **nhận một di
 * vật xưa nay không hiện gì cả**. Không có gì đỏ lên: build xanh, lint sạch,
 * test xanh — đúng hình dạng `TECH_DEBT` "hàm engine chưa có ai gọi" (Phase 4H).
 * File này là chỗ gọi đó.
 */
import {
  ACHIEVEMENTS,
  BLUEPRINT_RARITY_LABEL,
} from './constants.js';
import {
  getRewardTier,
  tierFromAchievementTier,
  tierFromMissionBucket,
  tierFromSessionMultiplier,
} from './rewardTiers.js';

/** Tối đa 3 thẻ xếp chồng; phần dư gộp thành một dòng. Đàm chốt con số 3. */
export const MAX_REWARD_TOASTS = 3;

/** Toast tự biến mất sau 4 giây (Đàm chốt). */
export const REWARD_TOAST_MS = 4000;

const ACHIEVEMENT_LOOKUP = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));

/**
 * Thứ tự ưu tiên khi có nhiều phần thưởng cùng lúc.
 *
 * ⚠️ XẾP THEO NGUỒN, KHÔNG XẾP THEO BẬC ĐỘ HIẾM. Xếp theo bậc nghe hợp lý hơn
 * nhưng nó làm thứ tự NHẢY giữa các phiên: cùng một phiên xong, hôm nay tổng kết
 * đứng đầu, mai một thành tích vàng đẩy nó xuống thứ ba rồi rơi khỏi ba thẻ đầu.
 * Một chồng toast chỉ đọc được khi vị trí ổn định — thứ vừa xảy ra (tổng kết
 * phiên) luôn ở trên cùng, thứ hiếm nhất (di vật) ngay dưới.
 */
const SOURCE_ORDER = ['loot', 'relic', 'level', 'rank', 'achievement', 'mission'];

function sourceRank(source) {
  const index = SOURCE_ORDER.indexOf(source);
  return index === -1 ? SOURCE_ORDER.length : index;
}

/**
 * Một phiên thường → một thẻ tổng kết. Bấm vào mở hộp thoại phần thưởng đầy đủ.
 *
 * ⚠️ LÊN KỶ THÌ KHÔNG CÓ THẺ NÀY: kỷ mới là một trong bốn việc được phép chặn
 * màn hình, nên hộp thoại mở thẳng và toast sẽ chỉ là một bản sao thừa.
 */
function buildLootToast(pendingReward) {
  if (!pendingReward || pendingReward.eraChanged) return null;

  const xp = Number(pendingReward.totalSessionXP ?? pendingReward.finalXP ?? 0);
  const resourceUnits = Object.values(pendingReward.resources ?? {})
    .reduce((sum, value) => sum + (Number(value) || 0), 0);
  const bits = [];
  if (resourceUnits > 0) bits.push(`+${resourceUnits} tài nguyên`);
  if ((pendingReward.rpEarned ?? 0) > 0) bits.push(`+${pendingReward.rpEarned} RP`);

  return {
    id: 'loot',
    source: 'loot',
    key: 'loot',
    icon: '🎁',
    name: 'Phiên đã xong',
    tier: tierFromSessionMultiplier(pendingReward.multiplier, pendingReward.jackpotApplied),
    description: bits.length > 0 ? bits.join(' · ') : (pendingReward.tierLabel ?? 'Phần thưởng đã được cộng.'),
    amount: xp > 0 ? `+${xp.toLocaleString('vi-VN')} XP` : null,
    action: { detail: 'loot' },
  };
}

/** Di vật — phần thưởng quý nhất game (chỉ có khi vượt qua một khủng hoảng kỷ). */
function buildRelicToast(relic) {
  if (!relic?.id) return null;
  return {
    id: `relic:${relic.id}`,
    source: 'relic',
    key: relic.id,
    icon: relic.icon ?? '🏺',
    name: relic.label ?? 'Di vật mới',
    tier: 'huyenThoai',
    description: relic.description ?? 'Di vật vĩnh viễn — buff luôn có hiệu lực.',
    amount: null,
    action: { tab: 'collection', collectionTab: 'relics' },
  };
}

function buildLevelToast(entry) {
  if (!entry || !(entry.levelsGained > 0)) return null;
  return {
    id: `level:${entry.newLevel}`,
    source: 'level',
    key: entry.newLevel,
    icon: '⭐',
    name: `Cấp ${entry.newLevel}`,
    // Lên cấp là việc thường xuyên; để nó ở bậc "tốt" thì bậc trên còn nghĩa.
    tier: 'tot',
    description: entry.spGained > 0 ? `Có ${entry.spGained} điểm kỹ năng để tiêu.` : 'Đã lên một cấp.',
    amount: entry.spGained > 0 ? `+${entry.spGained} SP` : null,
    action: { detail: 'level' },
  };
}

function buildRankToast(rankUp) {
  if (!rankUp?.rankLabel) return null;
  return {
    id: `rank:${rankUp.rankLabel}`,
    source: 'rank',
    key: rankUp.rankLabel,
    icon: rankUp.rankIcon ?? '🎖️',
    name: rankUp.rankLabel,
    tier: 'hiem',
    description: 'Đã hoàn thành thử thách danh xưng.',
    amount: null,
    action: { tab: 'skills' },
  };
}

function buildAchievementToast(id) {
  const ach = ACHIEVEMENT_LOOKUP[id];
  if (!ach) return null;
  return {
    id: `achievement:${id}`,
    source: 'achievement',
    key: id,
    icon: ach.icon ?? '🏅',
    name: ach.label,
    tier: tierFromAchievementTier(ach.tier),
    description: ach.description ?? 'Thành tích mới mở khoá.',
    amount: null,
    action: { tab: 'achievements' },
  };
}

function buildMissionToast(id, missionList) {
  const mission = (missionList ?? []).find((item) => item?.id === id);
  if (!mission) return null;
  return {
    id: `mission:${id}`,
    source: 'mission',
    key: id,
    icon: '✅',
    name: mission.label ?? 'Nhiệm vụ đã xong',
    tier: tierFromMissionBucket(mission.bucket),
    description: 'Nhiệm vụ ngày đã hoàn thành.',
    amount: mission.rewardXP > 0 ? `+${mission.rewardXP} XP` : null,
    action: { tab: 'skills' },
  };
}

/**
 * Bản vẽ vừa nghiên cứu xong. Store ghi nó vào `notificationFeed` (hộp thư), chứ
 * không có kênh riêng — nên chỗ gọi truyền thẳng bản vẽ vào đây khi cần.
 */
export function buildBlueprintToast(blueprint) {
  if (!blueprint?.id) return null;
  const rarityLabel = BLUEPRINT_RARITY_LABEL[blueprint.rarity];
  return {
    id: `blueprint:${blueprint.id}`,
    source: 'blueprint',
    key: blueprint.id,
    icon: blueprint.icon ?? '📐',
    name: blueprint.label ?? blueprint.id,
    tier: blueprint.tier ?? 'thuong',
    description: rarityLabel ? `Bản vẽ ${rarityLabel} — đưa vào xưởng để xây.` : 'Bản vẽ đã sẵn sàng đưa vào xưởng.',
    amount: null,
    action: { tab: 'collection', collectionTab: 'blueprints' },
  };
}

/**
 * Dựng danh sách toast từ trạng thái `ui` mà store đã ghi.
 * THUẦN: cùng đầu vào ⇒ cùng đầu ra, không đọc đồng hồ, không đọc store.
 *
 * @param {object} ui        - `state.ui`
 * @param {object} missions  - `state.missions` (cần `list` để lấy tên nhiệm vụ)
 * @returns {Array} danh sách thẻ, đã xếp theo `SOURCE_ORDER`
 */
export function buildRewardToasts(ui = {}, missions = {}) {
  const toasts = [
    buildLootToast(ui.lootModalOpen ? ui.pendingReward : null),
    buildRelicToast(ui.relicNotification),
    buildLevelToast((ui.levelUpQueue ?? [])[0]),
    buildRankToast(ui.rankUpNotification),
    ...(ui.achievementQueue ?? []).map(buildAchievementToast),
    ...(ui.missionCompletedIds ?? []).map((id) => buildMissionToast(id, missions.list)),
  ].filter(Boolean);

  // Sắp xếp ỔN ĐỊNH theo nguồn: `sort` của JS đã ổn định từ ES2019 nên thứ tự
  // trong cùng một nguồn (ví dụ ba thành tích cùng mở) giữ nguyên thứ tự store ghi.
  return toasts.sort((a, b) => sourceRank(a.source) - sourceRank(b.source));
}

/**
 * Cắt danh sách thành phần HIỆN và phần DƯ.
 * ⚠️ Trả về `overflowLabel` đã dựng sẵn, chứ không trả mỗi con số: câu này xuất
 * hiện ở đúng một chỗ trên màn hình và nó phải khớp với `hidden.length` — để chỗ
 * gọi tự ghép chuỗi là mở đường cho hai con số lệch nhau.
 */
export function splitRewardToasts(toasts = [], max = MAX_REWARD_TOASTS) {
  const shown = toasts.slice(0, max);
  const hidden = toasts.slice(max);
  return {
    shown,
    hidden,
    overflowLabel: hidden.length > 0 ? `và ${hidden.length} phần thưởng khác` : null,
  };
}

/** Bậc cao nhất trong một danh sách — dùng cho vệt màu của dòng "và N…". */
export function highestTier(toasts = []) {
  let best = null;
  for (const toast of toasts) {
    const tier = getRewardTier(toast?.tier);
    if (!best || tier.rank > best.rank) best = tier;
  }
  return best?.key ?? 'thuong';
}
