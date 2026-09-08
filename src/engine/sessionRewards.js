/**
 * sessionRewards.js — EVERYTHING a finished focus session changes, as one pure function (ADR-078).
 *
 * `completeFocusSession` in `gameStore.js` used to hold ~710 lines that computed the reward and
 * built the next state inside `set((prev) => …)`. It was the last hand-written block of the God
 * File and the place every "make the game more fun" round had to edit. It now lives here, verbatim
 * except for its inputs: `state` replaces both `get()` and `prev` (the two were always the same
 * object — the action is synchronous), and every clock, calendar, settings read and dice roll is a
 * PARAMETER (`now` · `today` · `weekKey` · `dailyGoal` · `random`). The store applies `patch`
 * with `set(patch)` and returns `sessionResult` — nothing else.
 *
 * Why a parameter for time instead of `Date.now()` inside: the same session must produce the same
 * patch in a test at any hour, and the Monday/midnight edge cases (`today`, `weekKey`) become a
 * value you can set, not a clock you have to wait for. Same law as `engine/missions.js` and
 * `engine/weeklyChain.js` (ADR-077).
 *
 * Comments inside are the originals; the numbers and rules have not changed by moving.
 */
import { countBuiltBuildings } from './journey';
import { settleCitySP } from './skillPointEconomy';
import { advanceCraftingQueueWithPerks, getBuildingPerkSessionRewards, getCraftingAccelerationMode, makeBuildingPerkRewardNotification } from './buildingPerks';
import { aggregateActiveBuffs, createEraCrisisState, detectEraCrisis } from './challengeEngine';
import { mergeCityArchive } from './cityArchive';
import {
  COMBO_BONUS_PER_STACK,
  COMBO_MAX_STACKS,
  ERA_MINI_EVENTS,
  OVERCLOCK_REWARD_MULTIPLIER,
  POSITIVE_EVENTS,
  POSITIVE_EVENT_XP_SCALE,
  RELIC_EVOLUTION,
  SO_DO_MIN_MINUTES,
  WEEKLY_CHAINS,
} from './constants';
import { pickLegacyCompletions } from './eraLegacy';
import { isCurrentEraBlueprint, pruneEraScopedBlueprintState } from './eraScope';
import { appendUiNotifications, makeEraUpFeedNotification, makeLegacyCompletedNotification, makeRankUpFeedNotification, makeWorkshopCompletedNotification } from './feedNotifications';
import { HISTORY_ENTRY_STATUS, calculateRewards, computeLevelUps, countSessionsOnDay, getActiveBook, getComboDecayMs, getHistoryEntryTimestampMs, isCancelledHistoryEntry } from './gameMath';
import { applyHistoryReviewStatsDelta, normalizeStoredHistoryStats } from './historyStats';
import { syncLongBreakCycleProgress } from './longBreakCycle';
import { refreshMissionsIfStale, tickDailyMissions } from './missions';
import { applyOverclockRewardBonus, makeDefaultStaking } from './overclock';
import { heSoXpSieuViet } from './prestigeCarryover';
import { describeCrisisQuest, evaluateRankPromotion, openCrisisQuest, settleCrisisQuest } from './rankLadder';
import { applyRelicEvolutions, evaluateRelicEvolutions } from './relicGrowth';
import { upsertSavedNoteEntry } from './savedNotes';
import { autoQueueSessionProject, rollLuckyBrick } from './sessionBrick';
import { GOLDEN_BEAT_XP_BONUS, planSessionBeats, rollGoldenBeat } from './sessionBeats';
import { advanceStreak, refreshStreakIfExpired, streakBonusRate } from './streak';
import { localDateStr, localWeekMondayStr } from './time';
import { makeDefaultDailyTracking, makeDefaultSkillActivations } from './trackingDefaults';
import { autoClaimWeeklySteps, getWeeklyStepProgress, refreshWeeklyChain, weeklySnapshotWithSession } from './weeklyChain';
import { wonderCrisisWindowBonusHours, wonderPassiveBuffs, wonderRelicEvolveFactor } from './wonderEffects.js';

export function assembleSessionReward({
  state,
  minutesFocused,
  categoryId = null,
  note = '',
  sessionTiming = null,
  sessionSnapshot = null,
  now = Date.now(),
  today = localDateStr(now),
  weekKey = localWeekMondayStr(now),
  dailyGoal,
  random = Math.random,
}) {
  const { unlockedSkills } = state.player;
  const totalEP = state.progress.totalEP;
  const overclockPrincipalReturn = state.staking.active
    ? Math.max(0, state.staking.stakedEP ?? 0)
    : 0;
  const rewardSourceEP = totalEP + overclockPrincipalReturn;
  const activeBook = getActiveBook(rewardSourceEP);
  let sessionResult = null;

  // Nếu đang trong Khủng Hoảng Kỷ Nguyên chế độ Đương Đầu
  // ADR-069: khủng hoảng kỷ là NHIỆM VỤ MỀM — đọc thẳng lịch sử, không hạn, không phạt, không
  // nhánh "thất bại". Đếm KÈM phiên vừa xong (nó chưa nằm trong `state.history` ở đây).
  let updatedCrisis = state.eraCrisis;
  let relicEarned   = null;
  let crisisJustPassed = false;

  if (state.eraCrisis?.active) {
    const questNow = now;
    const quest = describeCrisisQuest({
      eraCrisis: state.eraCrisis,
      history: [{ timestamp: questNow, minutes: minutesFocused }, ...(state.history ?? [])],
      now: questNow,
      extraWindowHours: wonderCrisisWindowBonusHours(state.buildings),
    });
    if (quest?.passed) {
      updatedCrisis    = settleCrisisQuest(state.eraCrisis, quest);
      relicEarned      = quest.relic;
      crisisJustPassed = true;
    }
  }

  // ─── Combo / Momentum ───────────────────────────────────────────
  const now_ts          = now;
  const lastSessionTs   = state.combo?.lastSessionTs ?? 0;
  const gapMs           = now_ts - lastSessionTs;
  const prevComboCount  = state.combo?.count ?? 0;
  const effectiveComboDecayMs = getComboDecayMs(
    unlockedSkills,
    state.relics,
    state.relicEvolutions,
    wonderPassiveBuffs(state.buildings).comboWindowHours,
  );
  const newComboCount   = (lastSessionTs > 0 && gapMs < effectiveComboDecayMs)
    ? prevComboCount + 1 : 1;
  const comboStacks     = Math.min(newComboCount - 1, COMBO_MAX_STACKS);
  const comboBonusPct   = comboStacks * COMBO_BONUS_PER_STACK;

  // Tổng hợp buff đang hoạt động (danh xưng + di vật + prestige + tiến hóa)
  const activeBuffs = aggregateActiveBuffs(
    activeBook,
    state.rankSystem,
    state.relics,
    state.prestige.permanentBonus,
    state.relicEvolutions ?? {},
  );
  // ADR-070: đặc quyền kỳ quan là buff trên trục sống — cộng vào cùng bộ hệ số với bậc + di vật.
  // `flatXp` («phiên sâu +150 XP») cộng thẳng vào XP phiên ở dưới, cùng chỗ với XP nhiệm vụ.
  const wonderBuffs = wonderPassiveBuffs(state.buildings, minutesFocused);
  activeBuffs.expBonus += wonderBuffs.expBonus;
  activeBuffs.epBonus += wonderBuffs.epBonus;

  // ─── Xây dựng sessionCtx cho gameMath ───────────────────────────
  const dt                = state.dailyTracking;
  const isToday           = dt.date === today;
  const sessionsToday     = isToday ? dt.sessionsCompleted : 0;
  const catsToday         = isToday ? (dt.categoriesUsed ?? []) : [];
  const trimmedNote       = note?.trim() || '';
  const trimmedGoal       = sessionSnapshot?.goal?.trim() || '';
  const trimmedNextNote   = sessionSnapshot?.nextNote?.trim() || '';
  const cat               = state.categoryTracking;
  const consecutiveSameCat = (categoryId && cat.lastCategoryId === categoryId)
    ? cat.consecutiveCount + 1
    : (categoryId ? 1 : 0);
  const uniqueCatsToday   = new Set([...catsToday, ...(categoryId ? [categoryId] : [])]);

  // weekly unique categories: lấy từ history 7 ngày gần nhất
  const weekAgo           = now - 7 * 86_400_000;
  const weeklyCategories  = [
    ...new Set(
      state.history
        .filter((h) => !isCancelledHistoryEntry(h) && new Date(h.timestamp).getTime() >= weekAgo && h.categoryId)
        .map((h) => h.categoryId)
    ),
  ];

  // Đồng bộ charge kỹ năng hàng ngày
  const saRaw        = state.skillActivations;
  const saToday      = saRaw.lastResetDate === today;
  const skillAct     = saToday ? saRaw : makeDefaultSkillActivations();

  // Bonus RP chỉ áp dụng cho danh mục đầu tiên được ghi nhận trong ngày.
  const isNewCategoryToday = !!categoryId && catsToday.length === 0;

  const refreshedMissionsForSession = refreshMissionsIfStale(state.missions);
  const activeStreak = refreshStreakIfExpired(state.streak, now, unlockedSkills);

  // V2: tính daily goal có đạt chưa (cho Cố Vấn)
  const dailyGoalCfg = dailyGoal;
  const focusMinutesToday = isToday
    ? state.history
        .filter((h) => !isCancelledHistoryEntry(h) && localDateStr(h.timestamp) === today)
        .reduce((sum, h) => sum + (h.minutes ?? 0), 0)
    : 0;
  // Cố Vấn áp dụng cho phiên SAU khi goal đã đạt
  const dailyGoalAchieved = dailyGoalCfg.type === 'sessions'
    ? sessionsToday >= dailyGoalCfg.sessions
    : focusMinutesToday >= dailyGoalCfg.minutes;

  // V2: Nhịp Hoàn Hảo bonus today?
  const nhipHoanHaoActiveToday = isToday
    && state.player.nhipHoanHaoBonusDay === today;

  // V2: Kế Hoạch Hoàn Hảo weekly buff active?
  const currentWeekKey = weekKey;
  const keHoachWeeklyBuffActive = state.player.keHoachWeeklyBuffWeekKey === currentWeekKey;

  const sessionCtx = {
    consecutiveSessionsToday: sessionsToday,
    superFocusActive:         skillAct.superFocusActive,
    luckyModeActive:          skillAct.luckyModeActive,
    breakCompletedOnTime:     state.sessionMeta.breakCompletedOnTime,
    isFirstSessionToday:      sessionsToday === 0,
    sessionsCompletedToday:   sessionsToday,
    currentStreak:            activeStreak.currentStreak,
    lastSessionCancelled:     state.sessionMeta.lastSessionCancelled,
    consecutiveSameCat,
    diverseCategoriesBonus:   uniqueCatsToday.size >= 3,
    weeklyCategories,
    balancedDayBonus:         isToday && (
      (dt.hasShortSession && minutesFocused >= 60)
      || (dt.hasLongSession && minutesFocused <= 25)
    ),
    isFirstSessionInNewEra:   isToday && dt.justEnteredNewEra,
    erasCompleted:            state.eraTracking.erasCompleted,
    sessionsInCurrentEra:     state.eraTracking.sessionsInCurrentEra,
    allDailyMissionsDone:     refreshedMissionsForSession.list.length > 0 &&
                              refreshedMissionsForSession.list.every((m) => m.claimed),
    isNewCategoryToday,
    wonderRPBonus:            0, // ADR-070: RP là dữ liệu ngủ, kỳ quan không còn cộng vào nó
    // V2 fields
    benVungActive:            !!state.player.benVungUnlocked,
    nhipHoanHaoActiveToday,
    hasSession45Today:        isToday && !!dt.hasSession45,
    hasSession60Today:        isToday && !!dt.hasSession60,
    dailyGoalAchieved,
    nextSessionBuffs:         Array.isArray(state.player.skillBuffQueue) ? state.player.skillBuffQueue : [],
    keHoachWeeklyBuffActive,
    // DỒN LỰC: ưu tiên trump người chơi tự chọn cho hôm nay (nếu có)
  };

  // Tính toán phần thưởng phiên và gộp thêm bonus Wonder còn hoạt động.
  const baseReward = calculateRewards(minutesFocused, unlockedSkills, rewardSourceEP, activeBuffs, sessionCtx);
  const overclockRewardMultiplier = state.staking.active
    ? (state.staking.rewardMultiplier ?? OVERCLOCK_REWARD_MULTIPLIER)
    : 1;
  const boostedReward = applyOverclockRewardBonus(baseReward, overclockRewardMultiplier);
  // ADR-071 (đóng #99): không còn hệ số tài nguyên/tinh luyện của công trình kinh tế.
  const reward = boostedReward;

  // ─── Sự kiện tích cực ngẫu nhiên (ưu tiên era-specific) ─────────
  const eraSpecific = ERA_MINI_EVENTS[activeBook] ?? [];
  const allPossible = [...eraSpecific, ...POSITIVE_EVENTS];
  const eligibleEvents = allPossible.filter((e) => minutesFocused >= e.minMinutes);
  let positiveEvent = null;
  for (const evt of eligibleEvents) {
    if (random() < evt.chance) { positiveEvent = evt; break; }
  }
  const positiveEventBonus = positiveEvent
    ? Math.round(reward.finalXP * positiveEvent.bonusPct * POSITIVE_EVENT_XP_SCALE) : 0;
  const comboBonus = Math.round(reward.finalXP * comboBonusPct);

  // Kiểm tra cập nhật Thử Thách Thăng Cấp đang active
  // ADR-069: bậc TỰ THĂNG theo lịch sử (xem `engine/rankLadder.js`) — không còn thử thách
  // chủ động, không hạn, không phạt. Quyết định nằm ở dưới, sau khi `newHistory` đã có phiên
  // này. Trạng thái `rankChallenge` đời cũ (nếu còn) được xoá êm.
  let newRankChallenge = null;
  let newRankSystem     = { ...state.rankSystem };
  let rankPromotion     = null;

  // Streak advancement — V2: dùng skill check cho Lá Chắn Streak
  const newStreak = advanceStreak(activeStreak, unlockedSkills);
  const streakBonusXP = Math.floor(reward.finalXP * streakBonusRate(newStreak.currentStreak, state.buildings));

  // V2: Bền Vững — kích hoạt khi streak đạt 30 lần đầu
  const benVungJustUnlocked = !!unlockedSkills.ben_vung
    && !state.player.benVungUnlocked
    && newStreak.currentStreak >= 30;

  const overclockBonusXP = Math.max(0, (reward.finalXP ?? 0) - (baseReward.finalXP ?? 0));
  /*
    ⚠️ `sieu_viet` (8 SP): sau Thăng Hoa, phiên đủ dài ở kỷ 1 nhận thêm XP. Hệ số trả về 1 ở
    mọi ca khác nên không cần một cái `if` riêng ở đây (`TECH_DEBT #3`).
    ⚠️ Nhân vào TỔNG sau mọi cộng thưởng — mô tả nói "+100% XP", không nói "+100% XP gốc".
  */
  const heSoSieuViet = heSoXpSieuViet({
    sieuViet: !!state.prestige?.sieuViet,
    book: activeBook,
    minutes: minutesFocused,
  });
  // ADR-081: THE GOLDEN BEAT. Rolled from the same hash the running screen used, so the session that
  // whispered «Guồng vàng» is exactly the session that pays for it — no state passed between them.
  // Only when the beat it landed on actually exists for this length (a 5-minute session has none).
  const goldenBeatId = rollGoldenBeat({
    dayKey: today,
    sessionsDoneToday: countSessionsOnDay(state.dailyTracking, today),
  });
  const goldenBeat = goldenBeatId
    && planSessionBeats(Math.round(minutesFocused * 60)).some((b) => b.id === goldenBeatId)
    ? goldenBeatId : null;
  const goldenBonusXP = goldenBeat ? Math.round(reward.finalXP * GOLDEN_BEAT_XP_BONUS) : 0;
  const baseSessionXP = Math.round(
    (reward.finalXP + comboBonus + positiveEventBonus + streakBonusXP + goldenBonusXP) * heSoSieuViet,
  );

  const resolvedStartedAt = sessionTiming?.startedAt ?? null;
  const resolvedFinishedAt = sessionTiming?.finishedAt ?? new Date(now).toISOString();
  const newBlueprints = state.blueprints;
  const sessionId = now;

  // Thêm di vật nếu có. ADR-070: đóng dấu `earnedAt` = mốc của chính phiên này (không sớm hơn
  // đồng hồ) để `relicGrowth` đếm phiên TỪ SAU lúc nhận — phiên nhận không tính.
  const newRelics = relicEarned
    ? [...state.relics, { ...relicEarned, earnedAt: new Date(Math.max(now_ts, Date.parse(resolvedFinishedAt) || 0)).toISOString() }]
    : state.relics;

  // Weekly chain progress
  const refreshedChain = refreshWeeklyChain(state.weeklyChain);
  const chain = WEEKLY_CHAINS[refreshedChain.chainIndex];
  // The finished session in history-entry shape — feeds BOTH the week snapshot and the daily
  // mission tick (ADR-077), so the two can never see a different session.
  const sessionEntryDraft = {
    timestamp: resolvedFinishedAt, minutes: minutesFocused, categoryId: categoryId ?? null,
    note: trimmedNote || null, completed: true, breakCompletedOnTime: false, breakCompletedAt: null,
  };
  const weeklySnapshot = weeklySnapshotWithSession(state.history, refreshedChain.weekKey, sessionEntryDraft);
  const chainStep = chain?.steps[refreshedChain.currentStep];
  const newChainStepProgress = chainStep && refreshedChain.currentStep < chain.steps.length
    ? getWeeklyStepProgress(chainStep, weeklySnapshot)
    : refreshedChain.stepProgress;
  const newWeeklyChain = { ...refreshedChain, stepProgress: newChainStepProgress };

  // ADR-071 (đóng #99): RP · tinh luyện · tài nguyên KHÔNG còn được cộng — đồng tiền duy nhất là phiên.

  // ── Crafting queue: mỗi phiên tiến 1 bước, đặc quyền có thể đẩy nhanh thêm ─
  // ADR-077: a session always lays a brick somewhere. If nothing in this era is queued, the game
  // queues the next project itself — the same pick the Focus strip showed before Start.
  const craftingAccelerationMode = getCraftingAccelerationMode(state.buildings, minutesFocused);
  const { craftingQueue: queueBeforeAdvance, autoQueuedId } = autoQueueSessionProject({
    craftingQueue: state.craftingQueue ?? [], activeBook, buildings: state.buildings, now: now_ts,
  });
  const {
    nextQueue: queueAfterPerks,
    newlyBuilt: builtByTheSession,
    acceleratedIds: acceleratedCraftingIds,
  } = advanceCraftingQueueWithPerks(queueBeforeAdvance, craftingAccelerationMode);
  // ADR-080: the lucky brick — sometimes the session lays TWO. Rolled with the injected dice, on the
  // queue head, never when a building just finished (that is already the bigger moment).
  const lucky = builtByTheSession.length === 0
    ? rollLuckyBrick({ craftingQueue: queueAfterPerks, minutesFocused, random })
    : { craftingQueue: queueAfterPerks, luckyBrickId: null, builtId: null };
  const nextQueue = lucky.craftingQueue;
  const newlyBuilt = lucky.builtId ? [...builtByTheSession, lucky.builtId] : builtByTheSession;
  const newBuildings = [...state.buildings, ...newlyBuilt];

  // ─── Cập nhật category tracking ──────────────────────────────────
  const categoryTrackingUpd = {
    lastCategoryId:   categoryId ?? null,
    consecutiveCount: consecutiveSameCat,
  };

  // DỒN LỰC: tiêu charge theo trump ĐÃ CHỌN.
  // - Siêu Tập Trung (tất định): chỉ tiêu khi được chọn+áp dụng; nếu bị metering
  //   chặn (Số Đỏ thắng) thì HOÀN charge.
  // - Số Đỏ (ngẫu nhiên 40%): tiêu khi đã kích hoạt + đủ điều kiện DÙ trượt roll
  //   (giữ hành vi cũ — không re-roll miễn phí); CHỈ hoàn khi bị metering chặn.
  const luckyArmedEligible = skillAct.luckyModeActive && minutesFocused >= SO_DO_MIN_MINUTES;
  const luckySuppressed    = reward.luckyBurstTriggered && reward.donLucChosen !== 'so_do';
  const consumedSuperFocus = !!reward.sieuTapTrungApplied;
  const consumedLuckyMode  = luckyArmedEligible && !luckySuppressed;

  // ─── Reset skill activations (chỉ tiêu charge khi phiên đủ điều kiện) ─
  const skillActivationsUpd = {
    ...skillAct,
    lastResetDate:    today,
    superFocusActive: skillAct.superFocusActive && !consumedSuperFocus,
    superFocusChargesUsed: consumedSuperFocus
      ? skillAct.superFocusChargesUsed + 1
      : skillAct.superFocusChargesUsed,
    luckyModeActive:  skillAct.luckyModeActive && !consumedLuckyMode,
    luckyModeChargesUsed: consumedLuckyMode
      ? skillAct.luckyModeChargesUsed + 1
      : skillAct.luckyModeChargesUsed,
  };

  // ── everything below used to run inside `set((state) => …)`; `state` is this same `state` ──
  const newSessions     = state.progress.sessionsCompleted + 1;
  const newTotalMinutes = state.progress.totalFocusMinutes + minutesFocused;
  const freshDt = isToday ? dt : makeDefaultDailyTracking();
  const deepSessionsToday = (freshDt.deepSessionsCompleted ?? 0) + (minutesFocused >= 45 ? 1 : 0);
  const catsUpdated = categoryId && !catsToday.includes(categoryId)
    ? [...catsToday, categoryId] : catsToday;
  const newSessionsCompletedToday = (freshDt.sessionsCompleted ?? 0) + 1;

  // Mission tick — ADR-070 reconciliation, ADR-077 single formula: rebuild from history WITH
  // the session that just ended, i.e. the very snapshot the reload path uses. The hand-written
  // second copy of the progress rules that used to live here is gone (engine/missions.js).
  const {
    missions: newMissions, newlyCompletedMissionIds, missionBonusXP, streakMissionXP, dailyBonusXP,
  } = tickDailyMissions({
    missions: state.missions, history: state.history, streak: newStreak, buildings: state.buildings,
    unlockedSkills: state.player.unlockedSkills, sessionEntry: sessionEntryDraft,
  });
  const buildingPerkReward = getBuildingPerkSessionRewards(state, {
    minutesFocused,
    newSessionsCompletedToday,
    consecutiveSameCat,
    categoryId,
    catsToday,
    uniqueCatsToday,
  });
  // ADR-070: BƯỚC TUẦN tự chốt khi đủ (có thể chốt liền nhiều bước) — XP vào cùng phiên này.
  const weeklyAuto = autoClaimWeeklySteps({
    weeklyChain: newWeeklyChain, weeklySnapshot, unlockedSkills: state.player.unlockedSkills, now: now_ts,
  });
  const finalSessionXP = baseSessionXP + missionBonusXP + streakMissionXP + buildingPerkReward.xp
    + dailyBonusXP + weeklyAuto.xp + wonderBuffs.flatXp;
  const finalSessionEP = Math.max(0, Math.round(reward.finalEP ?? 0));
  const finalTotalEP = state.progress.totalEP + finalSessionEP + overclockPrincipalReturn;
  const finalBook = getActiveBook(finalTotalEP);
  const eraChanged = finalBook !== activeBook;
  const { newLevel, newTotalEXP, levelsGained, spGained } =
    computeLevelUps(state.player.totalEXP, finalSessionXP);
  sessionResult = {
    sessionId,
    xpEarned: finalSessionXP,
    epEarned: finalSessionEP,
  };

  let newEraCrisis = updatedCrisis;
  if (!state.eraCrisis.active || crisisJustPassed) {
    const detectedCrisis = detectEraCrisis(rewardSourceEP, finalTotalEP);
    if (detectedCrisis) {
      // Mở ra ở dạng nhiệm vụ mềm ngay: không hộp thoại, không hạn (ADR-069).
      newEraCrisis = openCrisisQuest(createEraCrisisState(detectedCrisis));
    }
  }

  const pauseSegments = Array.isArray(sessionTiming?.pauseSegments)
    ? sessionTiming.pauseSegments
    : [];
  const pausedTotalMs = Number.isFinite(sessionTiming?.pausedTotalMs)
    ? Math.max(0, sessionTiming.pausedTotalMs)
    : 0;
  const wallClockDurationMs = Number.isFinite(sessionTiming?.wallClockDurationMs)
    ? Math.max(0, sessionTiming.wallClockDurationMs)
    : null;
  const sessionEntry = {
    id:               sessionId,
    book:             reward.activeBook,
    timestamp:        resolvedFinishedAt,
    startedAt:        resolvedStartedAt,
    finishedAt:       resolvedFinishedAt,
    pauseSegments,
    pausedTotalMs,
    wallClockDurationMs,
    minutes:          minutesFocused,
    xpEarned:         finalSessionXP,
    epEarned:         finalSessionEP,
    tier:             reward.tierLabel,
    multiplier:       reward.multiplier,
    jackpot:          reward.jackpotApplied,
    blueprint:        null,
    categoryId:       categoryId ?? null,
    categorySnapshot: sessionSnapshot?.categorySnapshot ?? null,
    status:           HISTORY_ENTRY_STATUS.COMPLETED,
    completed:        true,
    cancelled:        false,
    cancelledAt:      null,
    cancelProgressRatio: null,
    targetMinutes:    minutesFocused,
    comboCount:       newComboCount,
    positiveEvent:    positiveEvent,
    note:             trimmedNote || null,
    breakNote:        null,
    goal:             trimmedGoal || null,
    goalAchieved:     null,
    nextNote:         trimmedNextNote || null,
    breakCompletedOnTime: false,
    breakCompletedAt: null,
  };
  const newHistory = [sessionEntry, ...state.history].slice(0, 2000);

  // ADR-070: DI VẬT TIẾN HOÁ THEO PHIÊN — phiên này vừa vào `newHistory`, đếm luôn. Bậc mới
  // áp từ phiên KẾ (buff của phiên này đã tính ở trên với bậc cũ — cố ý, để hai đường đo khớp).
  const grownRelics = evaluateRelicEvolutions({
    relics: newRelics,
    relicEvolutions: state.relicEvolutions ?? {},
    history: newHistory,
    factor: wonderRelicEvolveFactor(state.buildings),
  });
  const relicEvolutionsAfter = applyRelicEvolutions(state.relicEvolutions ?? {}, grownRelics);
  const relicsEvolvedInfo = grownRelics.map((g) => {
    const def = RELIC_EVOLUTION[g.id];
    const relic = newRelics.find((r) => r.id === g.id);
    return {
      id: g.id,
      label: relic?.label ?? g.id,
      icon: relic?.icon ?? '✨',
      stage: g.to,
      stageLabel: def?.stages[g.to]?.label ?? '',
      buff: def?.stages[g.to]?.buff ?? {},
    };
  });

  // ADR-069: thăng bậc tự động — đủ EP gác + đủ phiên gần đây (đếm cả phiên này).
  // Bỏ qua khi vừa lên kỷ: bậc thuộc kỷ, và kỷ vừa đóng thì bậc của nó không còn hiệu lực.
  if (!eraChanged) {
    const rankBookKey = `book${activeBook}`;
    // ⚠️ `now` phải KHÔNG SỚM HƠN mốc của chính phiên này: `now_ts` được đọc ở đầu hàm, còn
    // `resolvedFinishedAt` đọc sau vài mili-giây — lấy `now_ts` thì phiên vừa xong bị bộ đếm
    // coi là "tương lai" và bỏ qua (đã cắn thật khi viết `gameStore.adr069.test.js`).
    const promo = evaluateRankPromotion({
      bookNumber: activeBook,
      rankIdx: state.rankSystem?.[rankBookKey] ?? 0,
      totalEP: finalTotalEP,
      history: newHistory,
      now: Math.max(now_ts, getHistoryEntryTimestampMs(sessionEntry) ?? now_ts),
    });
    if (promo.promoted) {
      rankPromotion = { bookNumber: activeBook, targetIdx: promo.targetIdx, rank: promo.rank };
      newRankSystem = { ...newRankSystem, [rankBookKey]: promo.targetIdx };
    }
  }
  const newSavedNotes = upsertSavedNoteEntry(state.savedNotes ?? [], sessionEntry);
  const currentHistoryStats = normalizeStoredHistoryStats(state.historyStats, state.history);
  const sessionWasBlueprint = minutesFocused >= 45;
  const nextHistoryStats = {
    bestSessionMinutes: currentHistoryStats.bestSessionMinutes,
    bestSessionXP: currentHistoryStats.bestSessionXP,
    bestSessionId: currentHistoryStats.bestSessionId,
    totalJackpots: currentHistoryStats.totalJackpots + (reward.jackpotApplied ? 1 : 0),
    totalBlueprints: currentHistoryStats.totalBlueprints + (sessionWasBlueprint ? 1 : 0),
    cancelledSessions: currentHistoryStats.cancelledSessions,
    cancelledMinutes: currentHistoryStats.cancelledMinutes,
    sessionsWithGoal: currentHistoryStats.sessionsWithGoal,
    reviewedCount: currentHistoryStats.reviewedCount,
    achievedCount: currentHistoryStats.achievedCount,
    missedCount: currentHistoryStats.missedCount,
    pendingCount: currentHistoryStats.pendingCount,
  };
  if (minutesFocused >= currentHistoryStats.bestSessionMinutes) {
    nextHistoryStats.bestSessionMinutes = minutesFocused;
    nextHistoryStats.bestSessionXP = finalSessionXP;
    nextHistoryStats.bestSessionId = sessionId;
  }
  const nextHistoryStatsWithReview = applyHistoryReviewStatsDelta(nextHistoryStats, null, sessionEntry);

  const etPrev = state.eraTracking;
  const eraTrackingUpd = {
    sessionsInCurrentEra: eraChanged ? 1 : etPrev.sessionsInCurrentEra + 1,
    currentEraBook:       eraChanged ? finalBook : etPrev.currentEraBook,
    erasCompleted:        eraChanged ? etPrev.erasCompleted + 1 : etPrev.erasCompleted,
  };

  const dailyTrackingUpd = {
    date:              today,
    sessionsCompleted: newSessionsCompletedToday,
    categoriesUsed:    catsUpdated,
    deepSessionsCompleted: deepSessionsToday,
    hasShortSession:   freshDt.hasShortSession || minutesFocused <= 25,
    hasLongSession:    freshDt.hasLongSession  || minutesFocused >= 60,
    // V2 thresholds cho Lịch Đầy
    hasSession45:      (!!freshDt.hasSession45) || minutesFocused >= 45,
    hasSession60:      (!!freshDt.hasSession60) || minutesFocused >= 60,
    justEnteredNewEra: eraChanged,
  };

  // V2: Lộc Ban Tặng — đếm phiên ≥30, mỗi 7 lần thưởng bonus
  let nextLocBanTangCounter = state.player.locBanTangCounter ?? 0;
  let locBanTangBonusXP = 0;
  if (unlockedSkills.loc_ban_tang && minutesFocused >= 30) {
    nextLocBanTangCounter += 1;
    if (nextLocBanTangCounter >= 7) {
      nextLocBanTangCounter = 0;
      locBanTangBonusXP = 200;
    }
  }

  // V2: Nhịp Hoàn Hảo — track ngày liên tiếp ≥6 phiên
  let nextNhipHoanHaoStreakDays = state.player.nhipHoanHaoStreakDays ?? 0;
  let nextNhipHoanHaoLastSixDate = state.player.nhipHoanHaoLastSixDate;
  let nextNhipHoanHaoBonusDay = state.player.nhipHoanHaoBonusDay;
  if (newSessionsCompletedToday === 6) {
    // Vừa đủ 6 phiên hôm nay (chỉ trigger 1 lần ở phiên thứ 6)
    const yesterday = localDateStr(now - 86_400_000);
    if (nextNhipHoanHaoLastSixDate === today) {
      // Already counted today — no-op
    } else if (nextNhipHoanHaoLastSixDate === yesterday) {
      nextNhipHoanHaoStreakDays += 1;
    } else {
      nextNhipHoanHaoStreakDays = 1;
    }
    nextNhipHoanHaoLastSixDate = today;
    // Khi đủ 3 ngày liên tiếp → ngày mai active buff
    if (nextNhipHoanHaoStreakDays >= 3) {
      nextNhipHoanHaoBonusDay = localDateStr(now + 86_400_000);
    }
  }

  // V2: Decrement skill buff queue (consumed 1 session)
  const decrementedBuffQueue = (state.player.skillBuffQueue ?? [])
    .map((b) => ({ ...b, sessionsRemaining: b.sessionsRemaining - 1 }))
    .filter((b) => b.sessionsRemaining > 0);

  // ADR-070: các buff kỹ năng mà nút "Nhận thưởng" cũ từng đẩy vào hàng — nay đẩy ở đây.
  const autoClaimBuffPushes = [
    ...(dailyBonusXP > 0 && state.player.unlockedSkills.nguoi_lap_ke ? [{ type: 'nguoi_lap_ke', sessionsRemaining: 1 }] : []),
    ...Array.from({ length: weeklyAuto.cuTriPushes }, () => ({ type: 'cu_tri', sessionsRemaining: 3 })),
  ];

  // ĐƯỜNG LÊN KỶ THẬT — chỗ DUY NHẤT được niêm phong thành phố kỷ cũ vào bảo tàng.
  // `sessionCount` phải chụp lại ở đây vì `eraTracking` chỉ giữ số liệu kỷ ĐANG chơi:
  // ngay dòng dưới `eraTrackingUpd` đã reset `sessionsInCurrentEra` về 1, sau đó không còn
  // nguồn nào biết kỷ vừa đóng lại đã làm bao nhiêu phiên.
  // ── DI SẢN DANG DỞ: công trình của kỷ ĐÃ ĐÓNG vừa xây xong (Phase 4D) ──────────────
  // Nó KHÔNG vào `buildings` (dòng dưới `pruneEraScopedBlueprintState` gạn sẵn theo kỷ, nên
  // không sinh đặc quyền — cân bằng game không đổi). Nhưng nếu chỉ để vậy thì nó biến mất
  // hẳn: tám phiên tập trung thật đổi lấy con số không. Ghi vào bảo tàng của ĐÚNG kỷ nó
  // thuộc về, để thành phố cũ có thêm căn nhà và bảng "trọn vẹn kỷ" chạm tới được 5/5.
  //
  // ⚠️ `sealedAt: null` là CHÌA KHOÁ, không phải giá trị thiếu. `mergeCityArchive` đọc nó
  // như "lần ghi này KHÔNG phải một lần niêm phong": ngày niêm phong / EP lúc niêm phong /
  // số phiên của kỷ cũ đều được GIỮ NGUYÊN. Truyền một ngày thật vào đây sẽ ghi đè lịch sử
  // của kỷ đó bằng ngày hôm nay — tức bảo tàng nói dối về quá khứ.
  const legacyCompletions = pickLegacyCompletions(newlyBuilt, finalBook);
  const archiveWithLegacy = legacyCompletions.length > 0
    ? mergeCityArchive(
      state.cityArchive,
      legacyCompletions.map((entry) => entry.bpId),
      state.buildingLevels,
      { sealedAt: null, epAtSeal: 0, sessionCount: 0 },
    )
    : state.cityArchive;

  const eraScopedState = pruneEraScopedBlueprintState({
    blueprints: newBlueprints,
    research: state.research,
    craftingQueue: nextQueue,
    buildings: newBuildings,
    buildingHP: state.buildingHP,
    buildingLastUsed: state.buildingLastUsed,
    buildingLevels: state.buildingLevels,
    cityArchive: archiveWithLegacy,
  }, finalBook, eraChanged
    ? {
        epAtSeal:     finalTotalEP,
        sealedAt:     today,
        sessionCount: state.eraTracking?.sessionsInCurrentEra ?? 0,
      }
    : null);
  /*
    ⚠️ ADR-084 — THE CITY PAYS THE SKILL TREE, AND IT PAYS FROM A LEDGER, NOT FROM THIS EVENT.
    The obvious version of this line is "if a building finished, add a point". It is wrong for three
    reasons this project has already been bitten by: it cannot pay a save that already had 38
    buildings before the rule existed; it double-pays if the reward assembly is ever run twice for
    one session; and it loses a point forever whenever a CAS write is rejected and the machine
    re-pulls (`docs/OPERATIONS.md` — first action wins). Comparing what the CITY HAS EARNED against
    what it HAS PAID has none of those failure modes, and it settles the retroactive case for free.
    ⚠️ Counted AFTER `eraScopedState`, on the archive this session produced: sealing an era moves
    its buildings out of `buildings` and into `cityArchive`, so counting `newBuildings` alone would
    make the city look like it shrank by five the moment an era closed.
  */
  const citySettlement = settleCitySP({
    builtTotal: countBuiltBuildings({
      cityArchive: eraScopedState.cityArchive,
      activeBook: finalBook,
      buildings: eraScopedState.buildings,
    }),
    credited: state.player.spFromCity,
  });
  const nextPlayer = {
    ...state.player,
    level:    newLevel,
    totalEXP: newTotalEXP + locBanTangBonusXP,
    sp:       state.player.sp + spGained + weeklyAuto.bonusSP + citySettlement.owed,
    spFromCity: citySettlement.credited,
    ...(weeklyAuto.keHoachNextWeekKey ? { keHoachWeeklyBuffWeekKey: weeklyAuto.keHoachNextWeekKey } : {}),
    // V2 fields
    benVungUnlocked: state.player.benVungUnlocked || benVungJustUnlocked,
    locBanTangCounter: nextLocBanTangCounter,
    nhipHoanHaoStreakDays: nextNhipHoanHaoStreakDays,
    nhipHoanHaoLastSixDate: nextNhipHoanHaoLastSixDate,
    nhipHoanHaoBonusDay: nextNhipHoanHaoBonusDay,
    skillBuffQueue: autoClaimBuffPushes.length > 0 ? [...decrementedBuffQueue, ...autoClaimBuffPushes] : decrementedBuffQueue,
  };

  const activeNewlyBuilt = newlyBuilt.filter((bpId) => isCurrentEraBlueprint(bpId, finalBook));
  /*
    ⚠️ `celebrates` để `useTimer` biết có nên chờ 3,2 giây hay không (`TECH_DEBT #94`).
    Hai thứ CHẶN màn hình sau một phiên thường: lễ mừng thành phố (cần công trình vừa
    xong) và hộp phần thưởng TỰ mở (chỉ khi lên kỷ). Không cái nào xảy ra thì màn hình
    trống trơn, và 3,2 giây ấy là 3,2 giây nhìn vào chỗ không có gì.
    ⚠️ Đọc CHÍNH hai biến mà `App.jsx` dùng để quyết định hiện lễ mừng — đừng chép lại
    điều kiện, hai chỗ sẽ trôi khỏi nhau đúng lúc không ai để ý.
  */
  sessionResult = { ...sessionResult, celebrates: activeNewlyBuilt.length > 0 || eraChanged };
  const activeAcceleratedCraftingIds = acceleratedCraftingIds.filter((bpId) => isCurrentEraBlueprint(bpId, finalBook));


  const syncedProgress = syncLongBreakCycleProgress(state.progress, now_ts);
  const sessionNotifications = [
    eraChanged ? makeEraUpFeedNotification(finalBook) : null,
    rankPromotion ? makeRankUpFeedNotification(rankPromotion.bookNumber, rankPromotion.targetIdx) : null,
    activeNewlyBuilt.length > 0 ? makeWorkshopCompletedNotification(activeNewlyBuilt) : null,
    legacyCompletions.length > 0 ? makeLegacyCompletedNotification(legacyCompletions) : null,
    activeAcceleratedCraftingIds.length > 0 ? {
      title: 'Xưởng tăng tốc',
      body: `${activeAcceleratedCraftingIds.length} công trình tiến thêm 1 bước nhờ đặc quyền.`,
      icon: '⚡',
      category: 'workshop',
      action: { tab: 'collection', collectionTab: 'workshop' },
    } : null,
    ...buildingPerkReward.rewards.map(makeBuildingPerkRewardNotification),
  ].filter(Boolean);

  const patch = {
    player: nextPlayer,
    progress: {
      ...syncedProgress,
      totalEP:           finalTotalEP,
      activeBook:        finalBook,
      sessionsCompleted: newSessions,
      totalFocusMinutes: newTotalMinutes,
      longBreakGraceDeadlineAt: null,
      longBreakPreviewSession: false,
    },
    rankSystem:    newRankSystem,
    rankChallenge: newRankChallenge,
    eraCrisis:     newEraCrisis,
    relics:        newRelics,
    blueprints:    eraScopedState.blueprints,
    history:       newHistory,
    historyStats:  nextHistoryStatsWithReview,
    savedNotes:    newSavedNotes,
    streak:        newStreak,
    missions:      newMissions,
    buildings:     eraScopedState.buildings,
    buildingHP:    eraScopedState.buildingHP,
    buildingLastUsed: eraScopedState.buildingLastUsed,
    buildingLevels: eraScopedState.buildingLevels,
    cityArchive:   eraScopedState.cityArchive,
    staking:       makeDefaultStaking(),
    prestige:      state.prestige,
    weeklyChain:   weeklyAuto.weeklyChain,
    relicEvolutions: relicEvolutionsAfter,
    combo:            { count: newComboCount, lastSessionTs: now_ts },
    dailyTracking:    dailyTrackingUpd,
    skillActivations: skillActivationsUpd,
    categoryTracking: categoryTrackingUpd,
    eraTracking:      eraTrackingUpd,
    sessionMeta:      { lastSessionCancelled: false, breakCompletedOnTime: false },
    research:         eraScopedState.research,
    craftingQueue:    eraScopedState.craftingQueue,
    latestSessionUndo: state.latestSessionUndo
      ? { ...state.latestSessionUndo, sessionId }
      : null,
    ui: {
      ...state.ui,
      lootModalOpen: true,
      notificationFeed: appendUiNotifications(state.ui.notificationFeed, sessionNotifications),
      postcardFocusBpId: activeNewlyBuilt[0] ?? null,
      pendingReward: {
        ...reward,
        comboCount:          newComboCount,
        comboBonus,
        positiveEvent,
        positiveEventBonus,
        totalSessionXP:       finalSessionXP,
        levelsGained,
        spGained,
        // ADR-084: skill points the CITY just paid — the reward card that finally answers
        // "I earned something; what do I spend it on?".
        citySP: citySettlement.owed,
        newLevel,
        eraChanged,
        newBook:              finalBook,
        streakBonus:          streakBonusXP,
        streakMissionXP,
        streakDays:          newStreak.currentStreak,
        overclockBonus:      overclockBonusXP,
        missionCompletedIds: newlyCompletedMissionIds,
        missionBonusXP,
        buildingPerkRewards: buildingPerkReward.rewards,
        buildingPerkBonusXP: buildingPerkReward.xp,
        acceleratedCraftingIds,
        autoQueuedId,
        // ADR-080: which project got the lucky second brick (null = a normal session).
        luckyBrickId: lucky.luckyBrickId,
        // ADR-081: the golden beat this session hit ('halfway' | 'final' | null) and what it paid.
        goldenBeat,
        goldenBonusXP,
        // ⚠️ CHỈ để KHOẢNH KHẮC THÀNH PHỐ (`engine/cityMoment.js`) biết công trình nào vừa
        // xong. `ui` KHÔNG nằm trong `partialize` nên trường này không lên Supabase, tức
        // không thêm một byte nào vào JSONB đang tranh chấp CAS.
        newlyBuiltIds: activeNewlyBuilt,
        // ADR-069: ba tin mới cho chuỗi thẻ thưởng — bậc vừa lên, di vật vừa nhận, thử thách
        // kỷ vừa mở. `ui` không nằm trong `partialize` nên không lên Supabase.
        rankUp: rankPromotion
          ? { label: rankPromotion.rank.label, icon: rankPromotion.rank.icon, buffLabel: rankPromotion.rank.buffLabel }
          : null,
        relicEarned: relicEarned ?? null,
        crisisOpened: newEraCrisis.active && !state.eraCrisis.active
          ? { name: newEraCrisis.name, icon: newEraCrisis.icon }
          : null,
        // ADR-070: ba tin tự-vào cho chuỗi thẻ — thưởng trọn ngày, bước tuần vừa chốt, di vật lên bậc.
        dailyBonusXP,
        weeklySteps: weeklyAuto.steps,
        weeklyChainTitle: weeklyAuto.title,
        weeklyBonusSP: weeklyAuto.bonusSP,
        relicsEvolved: relicsEvolvedInfo,
      },
      levelUpQueue: levelsGained > 0
        ? [...state.ui.levelUpQueue, { levelsGained, newLevel, spGained }]
        : state.ui.levelUpQueue,
      relicNotification: relicEarned,
      rankUpNotification: rankPromotion
        ? { rankLabel: rankPromotion.rank.label, rankIcon: rankPromotion.rank.icon }
        : state.ui.rankUpNotification,
      // ADR-069: không còn hộp thoại khủng hoảng — thử thách kể trong chuỗi thẻ thưởng.
      eraCrisisModalOpen: false,
      missionCompletedIds: newlyCompletedMissionIds.length > 0
        ? [...(state.ui.missionCompletedIds ?? []), ...newlyCompletedMissionIds]
        : (state.ui.missionCompletedIds ?? []),
    },
  };
  return { patch, sessionResult };
}
