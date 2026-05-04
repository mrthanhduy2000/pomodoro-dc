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

import { RANK_SYSTEM, ERA_CRISES, DISASTER_PENALTY_RATE, RELIC_EVOLUTION, XP_SEAL_HARD_CAP } from './constants';

// ─────────────────────────────────────────────────────────────────────────────
// HELPER CHUNG
// ─────────────────────────────────────────────────────────────────────────────

/** Trả về thời điểm deadline (ms epoch) từ thời điểm bắt đầu + số giờ */
export function makeDeadline(startTimestamp, windowHours) {
  return startTimestamp + windowHours * 60 * 60 * 1000;
}

/** Kiểm tra deadline đã qua chưa */
export function isExpired(deadlineTimestamp) {
  return Date.now() > deadlineTimestamp;
}

/** Định dạng thời gian còn lại (giờ:phút) từ deadline */
export function formatDeadlineRemaining(deadlineTimestamp) {
  const ms = Math.max(0, deadlineTimestamp - Date.now());
  const totalMinutes = Math.floor(ms / 60_000);
  const hours   = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}g ${minutes.toString().padStart(2, '0')}p`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. THỬ THÁCH THĂNG CẤP (Rank Challenge)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createRankChallenge
 * Tạo đối tượng thử thách mới khi người chơi bắt đầu cố thăng cấp.
 *
 * @param {number} bookNumber     - Quyển hiện tại (1, 2, 3)
 * @param {number} targetRankIdx  - Chỉ số bậc muốn đạt (0-4)
 * @returns {RankChallenge}
 *
 * @typedef {object} RankChallenge
 * @property {number}  bookNumber
 * @property {number}  targetRankIdx
 * @property {string}  targetRankLabel
 * @property {string}  targetRankIcon
 * @property {number}  sessionsRequired  - tổng phiên cần hoàn thành
 * @property {number}  minMinutes        - số phút tối thiểu mỗi phiên
 * @property {number}  windowHours       - cửa sổ thời gian (giờ)
 * @property {number}  deadline          - epoch ms
 * @property {number}  sessionsCompleted - tiến trình hiện tại
 * @property {boolean} active
 */
export function createRankChallenge(bookNumber, targetRankIdx) {
  const bookRanks   = RANK_SYSTEM[bookNumber].ranks;
  const targetRank  = bookRanks[targetRankIdx];
  const req         = targetRank.challengeRequirement;

  if (!req) {
    throw new Error(`Bậc ${targetRank.label} không có yêu cầu thử thách.`);
  }

  return {
    bookNumber,
    targetRankIdx,
    targetRankLabel: targetRank.label,
    targetRankIcon:  targetRank.icon,
    sessionsRequired:  req.sessions,
    minMinutes:        req.minMinutes,
    windowHours:       req.windowHours,
    deadline:          makeDeadline(Date.now(), req.windowHours),
    sessionsCompleted: 0,
    active:            true,
  };
}

/**
 * updateRankChallenge
 * Kiểm tra phiên vừa hoàn thành có đủ điều kiện không và cập nhật tiến trình.
 *
 * @param {RankChallenge} challenge
 * @param {number}        minutesFocused  - phút của phiên vừa hoàn thành
 * @returns {{ challenge: RankChallenge, qualified: boolean, completed: boolean, failed: boolean }}
 */
export function updateRankChallenge(challenge, minutesFocused) {
  if (!challenge || !challenge.active) {
    return { challenge, qualified: false, completed: false, failed: false };
  }

  // Kiểm tra hết deadline
  if (isExpired(challenge.deadline)) {
    return {
      challenge: { ...challenge, active: false },
      qualified: false,
      completed: false,
      failed:    true,
    };
  }

  const qualified = minutesFocused >= challenge.minMinutes;
  const newSessions = qualified
    ? challenge.sessionsCompleted + 1
    : challenge.sessionsCompleted;

  const completed = newSessions >= challenge.sessionsRequired;

  return {
    challenge: {
      ...challenge,
      sessionsCompleted: newSessions,
      active: !completed,
    },
    qualified,
    completed,
    failed: false,
  };
}

/**
 * checkRankChallengeExpiry
 * Gọi định kỳ (hoặc khi load app) để phát hiện thử thách hết hạn.
 * Trả về { failed: true } nếu đã hết giờ mà chưa hoàn thành.
 *
 * @param {RankChallenge|null} challenge
 * @returns {{ failed: boolean }}
 */
export function checkRankChallengeExpiry(challenge) {
  if (!challenge || !challenge.active) return { failed: false };
  if (isExpired(challenge.deadline) && challenge.sessionsCompleted < challenge.sessionsRequired) {
    return { failed: true };
  }
  return { failed: false };
}

/**
 * applyRankChallengePenalty
 * Trừ tài nguyên khi thử thách thăng cấp thất bại (dùng cùng tỉ lệ thảm họa 5%).
 *
 * @param {object} allResources
 * @returns {object} newResources
 */
export function applyRankChallengePenalty(allResources) {
  const newResources = structuredClone(allResources);
  for (const bookKey of Object.keys(newResources)) {
    for (const resId of Object.keys(newResources[bookKey])) {
      const loss = Math.floor(newResources[bookKey][resId] * DISASTER_PENALTY_RATE);
      newResources[bookKey][resId] -= loss;
    }
  }
  return newResources;
}

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

/**
 * applyEraCrisisSacrifice
 * Hiến tế: cắt 50% tất cả tài nguyên, đánh dấu khủng hoảng đã qua.
 *
 * @param {object}         allResources
 * @param {EraCrisisState} crisisState
 * @returns {{ newResources: object, newCrisisState: EraCrisisState }}
 */
export function applyEraCrisisSacrifice(allResources, crisisState) {
  const lossRate   = crisisState.sacrificeOption.resourceLoss; // 0.50
  const newResources = structuredClone(allResources);

  for (const bookKey of Object.keys(newResources)) {
    for (const resId of Object.keys(newResources[bookKey])) {
      newResources[bookKey][resId] = Math.floor(
        newResources[bookKey][resId] * (1 - lossRate)
      );
    }
  }

  return {
    newResources,
    newCrisisState: {
      ...crisisState,
      active:     false,
      choiceMade: 'sacrifice',
      passed:     true,
    },
  };
}

/**
 * startEraCrisisChallenge
 * Bắt đầu đếm ngược 48 giờ cho lựa chọn Đương Đầu.
 *
 * @param {EraCrisisState} crisisState
 * @returns {EraCrisisState}
 */
export function startEraCrisisChallenge(crisisState) {
  const deadline = makeDeadline(Date.now(), crisisState.challengeOption.windowHours);
  return {
    ...crisisState,
    choiceMade:        'challenge',
    challengeDeadline: deadline,
  };
}

/**
 * updateEraCrisisChallenge
 * Gọi sau mỗi phiên tập trung khi đang trong chế độ Đương Đầu.
 *
 * @param {EraCrisisState} crisisState
 * @param {number}         minutesFocused
 * @returns {{ newCrisisState: EraCrisisState, completed: boolean, failed: boolean, relic: object|null }}
 */
export function updateEraCrisisChallenge(crisisState, minutesFocused) {
  // Kiểm tra hết hạn
  if (crisisState.challengeDeadline && isExpired(crisisState.challengeDeadline)) {
    return {
      newCrisisState: { ...crisisState, active: true },
      completed: false,
      failed:    true,
      relic:     null,
    };
  }

  const qualified   = minutesFocused >= crisisState.challengeMinMinutes;
  const newDone     = qualified
    ? crisisState.challengeSessionsDone + 1
    : crisisState.challengeSessionsDone;
  const completed   = newDone >= crisisState.challengeSessionsRequired;

  if (completed) {
    const relic = crisisState.challengeOption.successRelic;
    return {
      newCrisisState: {
        ...crisisState,
        challengeSessionsDone: newDone,
        active:      false,
        passed:      true,
        relicEarned: relic,
      },
      completed: true,
      failed:    false,
      relic,
    };
  }

  return {
    newCrisisState: { ...crisisState, challengeSessionsDone: newDone },
    completed: false,
    failed:    false,
    relic:     null,
  };
}

/**
 * checkEraCrisisChallengeExpiry
 * Gọi khi app khởi động lại hoặc lấy lại focus để reconcile thử thách
 * Khủng Hoảng Kỷ Nguyên đã quá hạn mà chưa cần chờ thêm một session mới.
 *
 * @param {EraCrisisState|null} crisisState
 * @returns {{ failed: boolean }}
 */
export function checkEraCrisisChallengeExpiry(crisisState) {
  if (!crisisState?.active || crisisState.choiceMade !== 'challenge') {
    return { failed: false };
  }

  if (crisisState.challengeDeadline && isExpired(crisisState.challengeDeadline)) {
    return { failed: true };
  }

  return { failed: false };
}

/**
 * applyEraCrisisChallengePenalty
 * Thất bại thử thách Đương Đầu: cắt 30% tài nguyên, đánh dấu khủng hoảng qua (bị thua).
 *
 * @param {object}         allResources
 * @param {EraCrisisState} crisisState
 * @returns {{ newResources: object, newCrisisState: EraCrisisState }}
 */
export function applyEraCrisisChallengePenalty(allResources, crisisState) {
  const lossRate   = crisisState.challengeOption.failureLoss; // 0.30
  const newResources = structuredClone(allResources);

  for (const bookKey of Object.keys(newResources)) {
    for (const resId of Object.keys(newResources[bookKey])) {
      newResources[bookKey][resId] = Math.floor(
        newResources[bookKey][resId] * (1 - lossRate)
      );
    }
  }

  return {
    newResources,
    newCrisisState: {
      ...crisisState,
      active:     false,
      passed:     true, // thất bại nhưng vẫn được tiếp tục chơi
    },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Tính tổng buff đang hoạt động từ rank + relic
// ─────────────────────────────────────────────────────────────────────────────

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
 * @property {number} epBonus            - tỉ lệ cộng thêm vào EP từ rank (0.1 = +10%)
 * @property {number} expBonus           - tỉ lệ cộng thêm vào EXP từ rank
 * @property {number} resourceBonus      - % cộng thêm tài nguyên rớt (từ di vật)
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

  // Buff từ bậc danh xưng hiện tại của quyển đang chơi
  const bookKey   = `book${activeBook}`;
  const rankIdx   = ranks[bookKey] ?? 0;
  const rankDef   = RANK_SYSTEM[activeBook]?.ranks[rankIdx];
  if (rankDef?.passiveBuff) {
    for (const [key, val] of Object.entries(rankDef.passiveBuff)) {
      accumulated[key] = (accumulated[key] ?? 0) + val;
    }
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
    }
  }

  // Buff từ Prestige vĩnh viễn
  accumulated.allBonus = (accumulated.allBonus ?? 0) + prestigeBonus;

  // Hard cap: xpSeal từ di vật ★★★ không vượt quá XP_SEAL_HARD_CAP
  accumulated.xpSeal = Math.min(accumulated.xpSeal, XP_SEAL_HARD_CAP);

  return accumulated;
}
