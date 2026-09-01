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
  STREAK_MILESTONES,
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
const SOURCE_ORDER = ['weekly', 'loot', 'milestone', 'relic', 'level', 'rank', 'achievement', 'mission'];

function sourceRank(source) {
  const index = SOURCE_ORDER.indexOf(source);
  return index === -1 ? SOURCE_ORDER.length : index;
}

/**
/**
 * Tổng kết tuần trước — lời mời sáng thứ Hai, thay cho hộp thoại tự chặn màn hình ngày xưa
 * (2026-08-27, đóng `TECH_DEBT #87`).
 *
 * ⚠️ ĐỨNG ĐẦU `SOURCE_ORDER`, và đây là ngoại lệ CÓ LÝ DO của lời giải thích ngay bên trên
 * ("thứ vừa xảy ra luôn ở trên cùng"). Thẻ này chỉ sinh ra lúc MỞ APP và nhiều nhất một lần mỗi
 * tuần, nên nó không tranh chỗ với một phiên vừa xong; thứ nằm cùng chồng với nó lúc ấy là
 * trạng thái còn sót từ phiên trước. Xếp nó xuống cuối là mở đường cho nó rơi khỏi ba thẻ đầu
 * rồi biến mất — mà nó là thẻ DUY NHẤT trong chồng này không thể tự đến lần thứ hai.
 *
 * ⚠️ `action.weekly` chứ không phải `action.detail`: mở bản tổng kết phải đi qua
 * `openWeeklyReport()` của store, nơi giữ luật "cú mở đầu tiên trong tuần là bản TUẦN TRƯỚC"
 * và luật ghi "đã xem". Bật cờ mở bằng tay ở tầng giao diện là chép lại hai luật ấy lần thứ hai.
 */
function buildWeeklyToast(pending) {
  if (!pending) return null;
  return {
    id: 'weekly',
    source: 'weekly',
    key: 'weekly',
    icon: '📊',
    name: 'Tổng kết tuần trước',
    // `tot` chứ không phải `hiem`: nó đến đều đặn mỗi tuần. Bậc hiếm để dành cho thứ hiếm thật.
    tier: 'tot',
    description: 'Xem lại bảy ngày vừa qua.',
    amount: null,
    action: { weekly: true },
  };
}

/**
 * Một phiên thường → một thẻ tổng kết. Bấm vào mở hộp thoại phần thưởng đầy đủ.
 *
 * ⚠️ LÊN KỶ THÌ KHÔNG CÓ THẺ NÀY: kỷ mới là một trong bốn việc được phép chặn
 * màn hình, nên hộp thoại mở thẳng và toast sẽ chỉ là một bản sao thừa.
 */
function buildLootToast(pendingReward, stageHint = null) {
  if (!pendingReward || pendingReward.eraChanged) return null;

  const xp = Number(pendingReward.totalSessionXP ?? pendingReward.finalXP ?? 0);
  const resourceUnits = Object.values(pendingReward.resources ?? {})
    .reduce((sum, value) => sum + (Number(value) || 0), 0);
  /*
    ⚠️ XẾP HIẾM TRƯỚC, THƯỜNG SAU — dòng này chỉ được MỘT dòng, dài hơn là bị cắt "…", nên thứ
    tự ở đây quyết định cái gì sống sót. Đo trên fixture 624 phiên (ngưỡng lấy thẳng từ
    `constants.js`, không chép tay):
      · Rương Lớn (phiên ≥60 phút)      —  63/624 =  10,1%
      · Tinh luyện T2 (phiên ≥45 phút)  — 180/624 =  28,8%
      · tài nguyên / RP                  — gần như MỌI phiên
    Hai thứ đầu là phần thưởng cho việc KHÓ NHẤT Đàm làm, và chúng đã được tính từ lâu mà chưa
    bao giờ được GỌI TÊN trên thẻ: "Rương Lớn" trước nay chỉ là chữ "lớn" viết thường bé xíu
    trên huy hiệu hệ số, còn tinh luyện thì không hiện ở đâu cả. Để "+18 tài nguyên" — con số
    có ở mọi phiên nên chẳng phân biệt được phiên nào — đứng trước chúng là đẩy phần thưởng
    hiếm nhất ra khỏi dòng.
  */
  const bits = [];
  if (pendingReward.largeChest) bits.push('Rương Lớn');
  const tinhLuyen = Number(pendingReward.t2Drop ?? 0);
  if (tinhLuyen > 0) bits.push(`+${tinhLuyen} tinh luyện`);
  if (resourceUnits > 0) bits.push(`+${resourceUnits} tài nguyên`);
  if ((pendingReward.rpEarned ?? 0) > 0) bits.push(`+${pendingReward.rpEarned} RP`);

  // ⚠️ SẮP TỚI MỐC THÌ NÓI VỀ MỐC, KHÔNG ĐẾM TÀI NGUYÊN. `description` chỉ được ĐÚNG MỘT DÒNG
  // (dài hơn bị cắt "…"), nên đây là THAY chứ không nối thêm — và cái được thay là con số Đàm
  // không dùng để quyết gì ("+18 tài nguyên"), còn thứ thay vào ("một phiên nữa là tới «…»") là
  // thứ khiến người ta muốn làm phiên tiếp. Bấm vào thẻ vẫn mở hộp thoại đủ mọi con số.
  // Chỉ áp khi CÒN ≤1 PHIÊN: mốc còn xa thì tin ấy chưa đáng chiếm chỗ, và một dòng lúc nào cũng
  // nói về mốc thì hết là tin.

  /*
    ⚠️ SỰ KIỆN CỦA PHIÊN LÀM CHỦ CÁI THẺ (2026-08-30). Đây là khoản dopamine lớn nhất bị bỏ phí
    trong cả app, và nó đã được TÍNH XONG từ lâu — chỉ chưa bao giờ được HIỆN RA.

    Đo trên 579 phiên thật: **63% số phiên sinh ra một sự kiện có TÊN, có ICON, có câu chuyện
    riêng** — "Đột Phá! 💡 Khoảnh khắc hiểu sâu bất ngờ" (+25% XP) · "Lý Trí Thắng Lợi 💡" ·
    "Buổi Thảo Luận Salon 🍷 Tranh luận triết học mang lại insight" (+30% XP). `POSITIVE_EVENTS`
    (6 mục) cộng `ERA_MINI_EVENTS` (mỗi kỷ 2–3 mục riêng) — tổng xác suất ~0,67/phiên.
    Nhưng nó CHỈ được vẽ bên trong `LootDropModal`, mà hộp thoại ấy — sau ADR-060 — chỉ tự mở khi
    LÊN KỶ: **7/579 phiên = 1,2%**. Tức ~358 câu chuyện đã tính, đã cộng XP, rồi bị xoá không ai
    thấy. Thẻ toast thì nói "🎁 Phiên đã xong · +18 tài nguyên · +120 RP" ở CẢ 579 phiên.

    ⇒ Có sự kiện thì để SỰ KIỆN làm mặt thẻ: icon riêng, tên riêng, câu chuyện riêng. Cái thẻ
    thôi giống hệt nhau ở mọi phiên, và thứ Đàm đọc được đổi từ một con số anh không dùng để
    quyết gì ("+18 tài nguyên") sang một câu kể phiên vừa rồi đã xảy ra chuyện gì.
    ⚠️ KHÔNG đổi một luật tính thưởng nào — `positiveEventBonus` vẫn cộng y như cũ ở
    `completeFocusSession`. Đây thuần là khâu HIỂN THỊ, đúng chỗ cắm mà ADR-060 đã chọn.
    ⚠️ `stageHint` VẪN THẮNG ở phần mô tả: "còn một phiên nữa là tới «…»" là thứ khiến người ta
    làm phiên tiếp, và nó hiếm hơn nhiều (chỉ khi còn ≤1 phiên). Sự kiện giữ icon + tên, nhường
    một dòng mô tả — hai thứ không tranh nhau chỗ.
    ⚠️ Bậc độ hiếm KHÔNG bị nâng lên theo sự kiện: bậc đang đo ĐỘ DÀI PHIÊN (×1.0/×1.3/×2.0), tức
    thứ Đàm CHỦ ĐỘNG quyết được. Nâng bậc theo một cú tung xúc xắc sẽ làm bậc thôi nói lên điều
    gì về chính phiên ấy.
  */
  const event = pendingReward.positiveEvent;
  const eventBonus = Number(pendingReward.positiveEventBonus ?? 0);
  if (event?.label) {
    // ⚠️ Nhánh CÓ sự kiện cũng phải khoe hai thứ hiếm: chúng không tranh chỗ với câu chuyện
    // (đây là phần đuôi nối sau `event.desc`), và bỏ chúng ở đây nghĩa là 63% số phiên — đúng
    // những phiên VUI NHẤT — lại là những phiên giấu mất Rương Lớn.
    const khoe = [
      pendingReward.largeChest ? 'Rương Lớn' : null,
      eventBonus > 0 ? `+${eventBonus.toLocaleString('vi-VN')} XP thưởng` : null,
    ].filter(Boolean).join(' · ') || null;
    return {
      id: 'loot',
      source: 'loot',
      key: 'loot',
      icon: event.icon ?? '✨',
      name: event.label,
      tier: tierFromSessionMultiplier(pendingReward.multiplier, pendingReward.jackpotApplied),
      description: stageHint ?? ([event.desc, khoe].filter(Boolean).join(' · ') || 'Phiên đã xong.'),
      amount: xp > 0 ? `+${xp.toLocaleString('vi-VN')} XP` : null,
      action: { detail: 'loot' },
    };
  }

  return {
    id: 'loot',
    source: 'loot',
    key: 'loot',
    icon: '🎁',
    name: 'Phiên đã xong',
    tier: tierFromSessionMultiplier(pendingReward.multiplier, pendingReward.jackpotApplied),
    description: stageHint ?? (bits.length > 0 ? bits.join(' · ') : (pendingReward.tierLabel ?? 'Phần thưởng đã được cộng.')),
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
const MILESTONE_DAYS = new Map(STREAK_MILESTONES.map((m) => [m.days, m]));

/**
 * MỐC CHUỖI — thẻ ăn mừng ngày chuỗi chạm mốc 7 / 14 / 30 (2026-09-01).
 *
 * VÌ SAO CÓ: `STREAK_MILESTONES` tồn tại từ lâu và được dùng để vẽ "đích kế tiếp" ở thanh trên,
 * nhưng LÚC CHẠM mốc thì app không nói một câu nào — con số chuỗi chỉ lặng lẽ nhích thêm một.
 * Mốc 30 còn mở +5% allBonus VĨNH VIỄN (`BEN_VUNG_STREAK_THRESHOLD`) mà cũng không được báo.
 * Đây là phần thưởng đắt nhất game về mặt công sức (30 ngày liên tục) và rẻ nhất về mặt ăn mừng.
 *
 * ⚠️ KHÔNG THÊM MỘT TRƯỜNG NÀO VÀO STORE, KHÔNG DÙNG localStorage. Cái khó duy nhất là chống
 * lặp: `streakDays` giữ nguyên giá trị ở MỌI phiên trong ngày, nên hỏi mỗi nó thì làm phiên thứ
 * hai của ngày mốc sẽ ăn mừng lần nữa. Nhưng `streakMissionXP` đã là tín hiệu **một lần mỗi
 * ngày** có sẵn (`streakMissionClaimedToday` gác nó ở `completeFocusSession`), và ngưỡng của nó
 * — `STREAK_MISSION_MIN_STREAK = 7` — nằm ĐÚNG dưới cả ba mốc (7 · 14 · 30), nên nó che trọn.
 * Có test khoá quan hệ ấy: thêm một mốc nhỏ hơn 7 thì bài test đỏ chứ không im lặng bỏ sót.
 *
 * ⚠️ Bậc `huyenThoai` chỉ dành cho mốc VĨNH VIỄN. Mốc 7 và 14 là lời động viên; mốc 30 mở một
 * thứ không bao giờ mất đi. Cho cả ba cùng bậc là làm bậc thôi nói lên điều gì.
 */
export function buildMilestoneToast(pendingReward) {
  if (!pendingReward) return null;
  // Tín hiệu MỘT-LẦN-MỖI-NGÀY. Thiếu vế này thì mỗi phiên trong ngày mốc lại ăn mừng một lần.
  if (!(Number(pendingReward.streakMissionXP ?? 0) > 0)) return null;

  const moc = MILESTONE_DAYS.get(Number(pendingReward.streakDays));
  if (!moc) return null;

  return {
    id: `milestone-${moc.days}`,
    source: 'milestone',
    key: `milestone-${moc.days}`,
    icon: moc.permanent ? '🏅' : '🔥',
    name: `Chuỗi ${moc.days} ngày`,
    tier: moc.permanent ? 'huyenThoai' : 'hiem',
    description: moc.permanent
      ? `«${moc.label}» — từ nay mọi phần thưởng +5% vĩnh viễn.`
      : `${moc.days} ngày liên tục. Giữ nhịp này.`,
    amount: null,
    action: { tab: 'stats' },
  };
}

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
/**
 * @param {object} [extras] tin ngoài `ui`. `stageHint`: câu về cột mốc sắp tới, chỉ truyền khi
 *   CÒN ≤1 PHIÊN là tới — xem `buildLootToast`.
 */
export function buildRewardToasts(ui = {}, missions = {}, extras = {}) {
  const toasts = [
    buildWeeklyToast(ui.weeklyReportPending),
    buildLootToast(ui.lootModalOpen ? ui.pendingReward : null, extras.stageHint ?? null),
    buildMilestoneToast(ui.lootModalOpen ? ui.pendingReward : null),
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
