/**
 * overclock.js — Overclock (staking) default state and the reward multiplier. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */
import { OVERCLOCK_REWARD_MULTIPLIER } from './constants';

export const makeDefaultStaking = () => ({
  active:          false,
  stakedEP:        0,
  startedAt:       null,
  rewardMultiplier: OVERCLOCK_REWARD_MULTIPLIER,
});

export function applyOverclockRewardBonus(baseReward = {}, rewardMultiplier = 1) {
  if (!Number.isFinite(rewardMultiplier) || rewardMultiplier <= 1) return baseReward;

  return {
    ...baseReward,
    finalXP: Math.round((baseReward.finalXP ?? 0) * rewardMultiplier),
    finalEP: Math.round((baseReward.finalEP ?? 0) * rewardMultiplier),
    finalEXP: Math.round((baseReward.finalEXP ?? baseReward.finalXP ?? 0) * rewardMultiplier),
    multiplier: (baseReward.multiplier ?? 1) * rewardMultiplier,
  };
}

// ─── FACTORY: DAILY TRACKING ─────────────────────────────────────────────────
