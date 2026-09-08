/**
 * challengeEngine.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Động cơ thuần túy (không side-effect) xử lý hai hệ thống thử thách:
 *
 *   1. THỬ THÁCH THĂNG CẤP (Micro-Boss)
 *      Người chơi phải hoàn thành N phiên ≥ X phút trong vòng 48 giờ
 *      để đạt bậc danh xưng tiếp theo. Thất bại = trừ tài nguyên.
 *
 *   2. KHỦNG HOẢNG KỶ NGUYÊN (Macro-Boss)
 *      Khi EP vượt ngưỡng triggerEP, UI bị khóa. Người chơi chọn:
 *        - Hiến tế (mất 50% tài nguyên, vượt qua ngay)
 *        - Đương đầu (3 phiên ×90 phút / 48 giờ; thua mất 30%)
 *
 * Tất cả hàm nhận tham số tường minh → 100% có thể unit-test độc lập.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  RANK_SYSTEM, ERA_CRISES, DISASTER_PENALTY_RATE, RELIC_EVOLUTION, XP_SEAL_HARD_CAP,
  // Bản Cập Nhật Cộng Hưởng — softcap theo từng loại buff cổ vật (D2)
  RELIC_RESOURCE_BONUS_CAP, RELIC_GACHA_BONUS_CAP, RELIC_PITY_SEAL_CAP,
  RELIC_DISASTER_REDUCTION_CAP, RELIC_COMBO_WINDOW_CAP_HOURS, RELIC_EP_BONUS_CAP, RELIC_EXP_BONUS_CAP,
} from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER CHUNG
// ─────────────────────────────────────────────────────────────────────────────




// ─────────────────────────────────────────────────────────────────────────────
// 1. THỬ THÁCH THĂNG CẤP (Rank Challenge)
// ─────────────────────────────────────────────────────────────────────────────





// ─────────────────────────────────────────────────────────────────────────────
// 2. KHỦNG HOẢNG KỶ NGUYÊN (Era Crisis)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * detectEraCrisis
 * Phát hiện xem một mốc khủng hoảng có bị vượt qua trong phiên vừa rồi không.
 * Gọi sau mỗi lần EP thay đổi.
 *
 * @param {number} prevEP  - EP trước phiên
 * @param {number} newEP   - EP sau phiên
 * @returns {object|null}  - ERA_CRISES[n] nếu có khủng hoảng, null nếu không
 */
export function detectEraCrisis(prevEP, newEP) {
  for (const [, crisisData] of Object.entries(ERA_CRISES)) {
    if (prevEP < crisisData.triggerEP && newEP >= crisisData.triggerEP) {
      return crisisData;
    }
  }
  return null;
}

/**
 * createEraCrisisState
 * Tạo trạng thái khủng hoảng ban đầu khi được kích hoạt.
 *
 * @param {object} crisisData  - từ ERA_CRISES
 * @returns {EraCrisisState}
 *
 * @typedef {object} EraCrisisState
 * @property {boolean} active
 * @property {string}  crisisId
 * @property {string}  name
 * @property {string}  icon
 * @property {string}  description
 * @property {null|'sacrifice'|'challenge'} choiceMade
 * @property {number|null} challengeDeadline
 * @property {number}      challengeSessionsRequired
 * @property {number}      challengeMinMinutes
 * @property {number}      challengeSessionsDone
 * @property {boolean}     passed
 */
export function createEraCrisisState(crisisData) {
  return {
    active:                     true,
    crisisId:                   crisisData.id,
    name:                       crisisData.name,
    icon:                       crisisData.icon,
    description:                crisisData.description,
    sacrificeOption:            crisisData.sacrificeOption,
    challengeOption:            crisisData.challengeOption,
    choiceMade:                 null,
    challengeDeadline:          null,
    challengeSessionsRequired:  crisisData.challengeOption.sessions,
    challengeMinMinutes:        crisisData.challengeOption.minMinutes,
    challengeSessionsDone:      0,
    passed:                     false,
    relicEarned:                null,
  };
}






// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Tính tổng buff đang hoạt động từ rank + relic
// ─────────────────────────────────────────────────────────────────────────────

/** Tra khủng hoảng theo `id` ('ky_bang_ha'…) — `ERA_CRISES` khoá theo SỐ KỶ, còn save chỉ giữ `crisisId`. */
export function findEraCrisisById(crisisId) {
  if (!crisisId) return null;
  return Object.values(ERA_CRISES).find((c) => c?.id === crisisId) ?? null;
}

/**
 * withCanonicalCrisisText — ĐỌC LẠI CHỮ TỪ BẢNG lúc nạp save (ADR-071; cùng luật với di vật ở
 * `relicGrowth.withCanonicalRelicText` và nhiệm vụ ở `normalizeMissionTemplate`): save chỉ được tin ở
 * `crisisId` + các con số tiến độ; `name`/`icon`/`description` và nhãn của hai lựa chọn là BẢN CHÉP của
 * `ERA_CRISES` — bảng đổi chữ thì bản chép hoá cũ trong im lặng (đã cắn thật ở di vật, ADR-070).
 * CHỈ làm tươi CHỮ: `sessions`/`minMinutes`/`resourceLoss` đã chép là LUẬT của thử thách đang chạy,
 * đổi giữa chừng là đổi đích của một việc người chơi đang làm. `crisisId` lạ ⇒ trả nguyên, không xoá.
 */
export function withCanonicalCrisisText(crisisState) {
  if (!crisisState || typeof crisisState !== 'object') return crisisState;
  const canon = findEraCrisisById(crisisState.crisisId);
  if (!canon) return crisisState;
  const refreshOption = (own, table) => (own && typeof own === 'object' && table
    ? { ...own, label: table.label, description: table.description, icon: table.icon }
    : own);
  return {
    ...crisisState,
    name: canon.name,
    icon: canon.icon,
    description: canon.description,
    sacrificeOption: refreshOption(crisisState.sacrificeOption, canon.sacrificeOption),
    challengeOption: refreshOption(crisisState.challengeOption, canon.challengeOption),
  };
}

/**
 * aggregateActiveBuffs
 * Tổng hợp tất cả buff từ bậc danh xưng hiện tại và di vật đã nhận.
 * Kết quả được truyền vào calculateRewards.
 *
 * @param {number} activeBook     - Quyển đang chơi (1, 2, 3)
 * @param {object} ranks          - { book1: idx, book2: idx, book3: idx }
 * @param {Array}  relics         - [{ id, buff: {...} }]
 * @returns {ActiveBuffs}
 *
 * @typedef {object} ActiveBuffs
 * @property {number} epBonus            - tỉ lệ cộng thêm vào EP (bậc lẻ + di vật «tăng trưởng», ADR-069)
 * @property {number} expBonus           - tỉ lệ cộng thêm vào EXP (bậc + di vật «tri thức», ADR-069)
 * @property {number} resourceBonus      - (đời cũ) % tài nguyên rớt — không bậc/di vật nào còn cấp sau ADR-069
 * @property {number} allBonus           - buff tất cả từ rank/prestige (additive)
 * @property {number} gachaBonus         - key cũ, hiện dùng làm % RP cộng thêm (từ di vật)
 * @property {number} pitySeal           - key cũ, hiện dùng làm bonus RP theo bậc 2% mỗi điểm
 * @property {number} disasterReduction  - % giảm mất mát khi thảm họa (từ di vật)
 * @property {number} comboWindowHours   - số giờ mở rộng cửa sổ combo (từ di vật)
 * @property {number} xpSeal             - % XP bổ sung từ di vật ★★★ (hard-cap 15%)
 */
export function aggregateActiveBuffs(activeBook, ranks, relics = [], prestigeBonus = 0, relicEvolutions = {}) {
  const accumulated = {
    epBonus:           0,
    expBonus:          0,
    resourceBonus:     0,
    allBonus:          0,
    gachaBonus:        0,
    pitySeal:          0,
    disasterReduction: 0,
    comboWindowHours:  0,
    xpSeal:            0,
  };
  /*
    ⚠️ ADR-085 — BẢN KÊ DỰNG CÙNG LÚC VỚI PHÉP CỘNG, KHÔNG DỰNG LẠI SAU.
    Hàm này gộp bậc danh xưng + mọi di vật + prestige thành ba con số (`expBonus`/`epBonus`/
    `allBonus`), và ba con số ấy là TẤT CẢ những gì `calculateSessionRewards` nhìn thấy. Nghĩa là
    sau khi ra khỏi đây, "+8% XP" không còn tên. Thẻ kết phiên vì thế chưa bao giờ kể được di vật
    nào đang chạy — mà một phần thưởng không cảm thấy được thì không phải phần thưởng (luật vòng 43).
    Dựng bản kê Ở ĐÂY, trong đúng vòng lặp đang cộng, là cách duy nhất khiến tên và số không lệch
    nhau. Đừng suy lại nó ở màn hình bằng cách duyệt `relics` lần thứ hai: đó là hai công thức cho
    một sự thật, và chúng sẽ trôi khỏi nhau ở đúng ca tiến hoá di vật.
    ⚠️ Bản kê KHÔNG chịu trần. Trần (`RELIC_EXP_BONUS_CAP`…) áp lên TỔNG ở cuối hàm; phần chia lại
    khi chạm trần do `settleCredits` lo, để mọi nguồn (kể cả kỹ năng) chịu chung một phép chia.
  */
  const sources = [];

  // Buff từ bậc danh xưng hiện tại của quyển đang chơi
  const bookKey   = `book${activeBook}`;
  const rankIdx   = ranks[bookKey] ?? 0;
  const rankDef   = RANK_SYSTEM[activeBook]?.ranks[rankIdx];
  if (rankDef?.passiveBuff) {
    for (const [key, val] of Object.entries(rankDef.passiveBuff)) {
      accumulated[key] = (accumulated[key] ?? 0) + val;
    }
    sources.push({
      id: `rank:${activeBook}:${rankIdx}`,
      kind: 'rank',
      label: rankDef.label ?? 'Bậc',
      xpPct: (rankDef.passiveBuff.expBonus ?? 0) + (rankDef.passiveBuff.allBonus ?? 0),
      epPct: (rankDef.passiveBuff.epBonus ?? 0) + (rankDef.passiveBuff.allBonus ?? 0),
    });
  }

  // Buff từ tất cả di vật đã nhận (tất cả quyển, cộng dồn vĩnh viễn)
  // Dùng buff của giai đoạn tiến hóa hiện tại nếu có
  for (const relic of relics) {
    const stage      = relicEvolutions[relic.id] ?? 0;
    const evoDef     = RELIC_EVOLUTION[relic.id];
    const effectiveBuff = evoDef?.stages[stage]?.buff ?? relic.buff;
    if (effectiveBuff) {
      for (const [key, val] of Object.entries(effectiveBuff)) {
        accumulated[key] = (accumulated[key] ?? 0) + val;
      }
      sources.push({
        id: `relic:${relic.id}`,
        kind: 'relic',
        label: relic.label ?? relic.id,
        xpPct: (effectiveBuff.expBonus ?? 0) + (effectiveBuff.allBonus ?? 0),
        epPct: (effectiveBuff.epBonus ?? 0) + (effectiveBuff.allBonus ?? 0),
      });
    }
  }

  // Buff từ Prestige vĩnh viễn
  accumulated.allBonus = (accumulated.allBonus ?? 0) + prestigeBonus;

  // Hard cap: xpSeal từ di vật ★★★ không vượt quá XP_SEAL_HARD_CAP
  accumulated.xpSeal = Math.min(accumulated.xpSeal, XP_SEAL_HARD_CAP);

  // D2: softcap theo TỪNG loại buff, trên TỔNG đã cộng (no-op với loadout hiện tại).
  // resourceBonus / gachaBonus / pitySeal được calculateRewards đọc trực tiếp từ đây.
  accumulated.resourceBonus = Math.min(accumulated.resourceBonus, RELIC_RESOURCE_BONUS_CAP);
  accumulated.gachaBonus    = Math.min(accumulated.gachaBonus,    RELIC_GACHA_BONUS_CAP);
  accumulated.pitySeal      = Math.min(accumulated.pitySeal,      RELIC_PITY_SEAL_CAP);
  // disasterReduction / comboWindowHours: clamp ở ĐÂY chỉ để hiển thị đồng nhất;
  // hiệu ứng THẬT được clamp tại nơi tiêu thụ (clampRelicDisasterReduction + getComboDecayMs).
  accumulated.disasterReduction = Math.min(accumulated.disasterReduction, RELIC_DISASTER_REDUCTION_CAP);
  accumulated.comboWindowHours  = Math.min(accumulated.comboWindowHours,  RELIC_COMBO_WINDOW_CAP_HOURS);
  // ADR-069: hai trục mới của di vật (EP · XP) — cùng kiểu lưới an toàn, đặt trên tổng đã cộng cả bậc.
  accumulated.epBonus           = Math.min(accumulated.epBonus,           RELIC_EP_BONUS_CAP);
  accumulated.expBonus          = Math.min(accumulated.expBonus,          RELIC_EXP_BONUS_CAP);

  return { ...accumulated, sources };
}
