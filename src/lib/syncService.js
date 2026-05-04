import { supabase } from './supabase';
import useGameStore, { GAME_STORE_EXPORT_VERSION } from '../store/gameStore';

const SYNC_ID = 'singleton';
const DEBOUNCE_MS = 5000;
const LAST_SYNC_KEY = '_civjourney_last_cloud_sync';

let debounceTimer = null;

function getExportableState() {
  const s = useGameStore.getState();
  return {
    _version: GAME_STORE_EXPORT_VERSION,
    player: s.player,
    progress: s.progress,
    resources: s.resources,
    timerConfig: s.timerConfig,
    forgiveness: s.forgiveness,
    rankSystem: s.rankSystem,
    rankChallenge: s.rankChallenge,
    eraCrisis: s.eraCrisis,
    relics: s.relics,
    blueprints: s.blueprints,
    achievements: s.achievements,
    history: s.history,
    historyStats: s.historyStats,
    savedNotes: s.savedNotes,
    sessionCategories: s.sessionCategories,
    pendingCategoryId: s.pendingCategoryId,
    pendingNote: s.pendingNote,
    pendingBreakNote: s.pendingBreakNote,
    pendingSessionGoal: s.pendingSessionGoal,
    pendingNextSessionNote: s.pendingNextSessionNote,
    streak: s.streak,
    missions: s.missions,
    buildings: s.buildings,
    staking: s.staking,
    prestige: s.prestige,
    timerSession: s.timerSession,
    breakSession: s.breakSession,
    weeklyChain: s.weeklyChain,
    combo: s.combo,
    dailyTracking: s.dailyTracking,
    skillActivations: s.skillActivations,
    categoryTracking: s.categoryTracking,
    eraTracking: s.eraTracking,
    sessionMeta: s.sessionMeta,
    research: s.research,
    craftingQueue: s.craftingQueue,
    buildingHP: s.buildingHP,
    buildingLevels: s.buildingLevels,
    resourcesRefined: s.resourcesRefined,
    relicEvolutions: s.relicEvolutions,
    lastWeeklyReportDate: s.lastWeeklyReportDate,
    buildingLastUsed: s.buildingLastUsed,
  };
}

async function pushToCloud() {
  try {
    const data = getExportableState();
    const now = new Date().toISOString();
    const { error } = await supabase
      .from('game_state')
      .upsert({ id: SYNC_ID, data, updated_at: now });

    if (error) throw error;
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());
    console.log('[sync] pushed to cloud');
  } catch (err) {
    console.warn('[sync] push failed', err);
  }
}

function schedulePush() {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(pushToCloud, DEBOUNCE_MS);
}

export async function initSync() {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('data, updated_at')
      .eq('id', SYNC_ID)
      .single();

    if (error || !data?.data || Object.keys(data.data).length === 0) {
      await pushToCloud();
    } else {
      const cloudTime = new Date(data.updated_at).getTime();
      const lastSync = parseInt(localStorage.getItem(LAST_SYNC_KEY) ?? '0', 10);

      if (cloudTime > lastSync) {
        const result = useGameStore.getState()._importGameData(data.data);
        if (result.ok) {
          localStorage.setItem(LAST_SYNC_KEY, cloudTime.toString());
          console.log('[sync] pulled newer data from cloud');
        } else {
          console.warn('[sync] import failed:', result.message);
          await pushToCloud();
        }
      } else {
        await pushToCloud();
      }
    }
  } catch (err) {
    console.warn('[sync] init failed', err);
  }

  useGameStore.subscribe(() => {
    schedulePush();
  });
}
