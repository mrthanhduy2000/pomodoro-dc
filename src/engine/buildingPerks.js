/**
 * buildingPerks.js — Building perks at session end: crafting acceleration, advancing the queue, per-session perk rewards and their feed line. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { BUILDING_EFFECTS } from './constants';

export function getBuildingPerkEffects(perk) {
  return Array.isArray(perk?.effects) ? perk.effects : [];
}

export function getBuiltPerks(buildings = []) {
  return (buildings ?? [])
    .map((bpId) => BUILDING_EFFECTS[bpId]?.perk)
    .filter(Boolean);
}

export function findBuiltPerk(buildings = [], effectId) {
  return getBuiltPerks(buildings).find((perk) => getBuildingPerkEffects(perk).includes(effectId)) ?? null;
}

export function getCraftingAccelerationMode(buildings = [], minutesFocused = 0) {
  if (minutesFocused < 45) return null;
  if (findBuiltPerk(buildings, 'craft_haste_all')) return 'all';
  if (findBuiltPerk(buildings, 'craft_haste_first')) return 'first';
  return null;
}

export function advanceCraftingQueueWithPerks(craftingQueue = [], accelerationMode = null) {
  const nextQueue = [];
  const newlyBuilt = [];
  const acceleratedIds = [];

  for (const [index, item] of (craftingQueue ?? []).entries()) {
    const extraProgress = accelerationMode === 'all' || (accelerationMode === 'first' && index === 0) ? 1 : 0;
    const remaining = item.sessionsRemaining - 1 - extraProgress;

    if (extraProgress > 0) acceleratedIds.push(item.bpId);
    if (remaining <= 0) {
      newlyBuilt.push(item.bpId);
    } else {
      nextQueue.push({ ...item, sessionsRemaining: remaining });
    }
  }

  return { nextQueue, newlyBuilt, acceleratedIds };
}

export function getBuildingPerkSessionRewards(prev, {
  minutesFocused = 0,
  newSessionsCompletedToday = 0,
  consecutiveSameCat = 0,
  categoryId = null,
  catsToday = [],
  uniqueCatsToday = new Set(),
} = {}) {
  const rewards = [];

  const addReward = (perk, reason, xp = 0) => {
    rewards.push({
      id: `${perk.id}_${reason}`,
      label: perk.label,
      family: perk.family,
      reason,
      xp: Math.max(0, Math.round(xp ?? 0)),
    });
  };

  const dailyChest = findBuiltPerk(prev.buildings, 'daily_chest');
  if (
    dailyChest
    && newSessionsCompletedToday > 0
    && newSessionsCompletedToday % (dailyChest.everySessions ?? 3) === 0
  ) {
    addReward(dailyChest, 'Phiên thứ 3 trong ngày', dailyChest.xp);
  }

  const deepChest = findBuiltPerk(prev.buildings, 'deep_chest');
  if (deepChest && minutesFocused >= (deepChest.minMinutes ?? 60)) {
    addReward(deepChest, 'Phiên dài', deepChest.xp);
  }

  const safetyNet = findBuiltPerk(prev.buildings, 'recovery_bonus');
  if (safetyNet && prev.sessionMeta?.lastSessionCancelled && minutesFocused >= (safetyNet.minMinutes ?? 15)) {
    addReward(safetyNet, 'Phiên bù sau khi hủy', safetyNet.xp);
  }

  const sameCategory = findBuiltPerk(prev.buildings, 'same_category_combo');
  if (
    sameCategory
    && categoryId
    && consecutiveSameCat >= (sameCategory.minStreak ?? 3)
  ) {
    addReward(sameCategory, 'Chuỗi cùng danh mục', sameCategory.xp);
  }

  const varietyDay = findBuiltPerk(prev.buildings, 'variety_day');
  const requiredCategories = varietyDay?.requiredCategories ?? 3;
  if (
    varietyDay
    && (catsToday?.length ?? 0) < requiredCategories
    && uniqueCatsToday.size >= requiredCategories
  ) {
    addReward(varietyDay, 'Đủ 3 danh mục hôm nay', varietyDay.xp);
  }

  return rewards.reduce((summary, reward) => ({
    xp: summary.xp + reward.xp,
    rewards: [...summary.rewards, reward],
  }), { xp: 0, rewards: [] });
}

export function makeBuildingPerkRewardNotification(reward) {
  return {
    title: reward.family ?? 'Đặc quyền công trình',
    body: `${reward.label}: ${reward.reason}${reward.xp > 0 ? `, +${reward.xp} XP` : ''}`,
    icon: '⚡',
    category: 'workshop',
    action: { tab: 'collection', collectionTab: 'workshop' },
  };
}

// ─── FACTORY: TIMER SESSION (persist qua F5) ─────────────────────────────────
