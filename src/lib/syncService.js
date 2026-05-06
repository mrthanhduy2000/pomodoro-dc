import { supabase } from './supabase';
import useGameStore, { GAME_STORE_EXPORT_VERSION } from '../store/gameStore';
import {
  LAST_CLOUD_SYNC_KEY,
  LEGACY_LAST_CLOUD_SYNC_KEYS,
  readLocalStorageValue,
} from './appIdentity';

const SYNC_ID = 'singleton';
const DEBOUNCE_MS = 5000;
let debounceTimer = null;
let isImporting = false;
let initialized = false;
let realtimeChannel = null;

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
    localStorage.setItem(LAST_CLOUD_SYNC_KEY, Date.now().toString());
    console.log('[sync] pushed to cloud');
  } catch (err) {
    console.warn('[sync] push failed', err);
  }
}

function schedulePush() {
  if (isImporting) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(pushToCloud, DEBOUNCE_MS);
}

export async function pushNow() {
  if (debounceTimer) clearTimeout(debounceTimer);
  await pushToCloud();
}

function isSameSession(localSession, cloudSession) {
  return localSession?.startedAt && cloudSession?.startedAt &&
    localSession.startedAt === cloudSession.startedAt;
}

async function pullFromCloud() {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('data, updated_at')
      .eq('id', SYNC_ID)
      .single();

    if (error || !data?.data) return;

    const cloudTime = new Date(data.updated_at).getTime();
    const lastSync = parseInt(readLocalStorageValue(LAST_CLOUD_SYNC_KEY, LEGACY_LAST_CLOUD_SYNC_KEYS) ?? '0', 10);

    if (cloudTime > lastSync) {
      const localSession = useGameStore.getState().timerSession;
      const cloudSession = data.data?.timerSession;
      if (localSession?.isRunning && !isSameSession(localSession, cloudSession)) return;

      isImporting = true;
      const result = useGameStore.getState()._importGameData(data.data);
      setTimeout(() => { isImporting = false; }, 0);
      if (result.ok) {
        localStorage.setItem(LAST_CLOUD_SYNC_KEY, cloudTime.toString());
        console.log('[sync] pulled update from cloud');
      }
    }
  } catch (err) {
    console.warn('[sync] pull failed', err);
  }
}

function handleRealtimeUpdate(payload) {
  const cloudData = payload.new;
  if (!cloudData?.data) return;
  const cloudTime = new Date(cloudData.updated_at).getTime();
  const lastSync = parseInt(readLocalStorageValue(LAST_CLOUD_SYNC_KEY, LEGACY_LAST_CLOUD_SYNC_KEYS) ?? '0', 10);
  if (cloudTime <= lastSync) return;

  const localSession = useGameStore.getState().timerSession;
  const cloudSession = cloudData.data?.timerSession;
  if (localSession?.isRunning && !isSameSession(localSession, cloudSession)) return;

  isImporting = true;
  const result = useGameStore.getState()._importGameData(cloudData.data);
  setTimeout(() => { isImporting = false; }, 0);
  if (result.ok) {
    localStorage.setItem(LAST_CLOUD_SYNC_KEY, cloudTime.toString());
    console.log('[sync] real-time update received');
  }
}

function subscribeRealtime() {
  if (realtimeChannel) {
    supabase.removeChannel(realtimeChannel);
    realtimeChannel = null;
  }
  realtimeChannel = supabase
    .channel('game-state-sync')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'game_state', filter: `id=eq.${SYNC_ID}` },
      handleRealtimeUpdate,
    )
    .subscribe();
}

export async function initSync() {
  if (initialized) return;
  initialized = true;

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
      const lastSync = parseInt(readLocalStorageValue(LAST_CLOUD_SYNC_KEY, LEGACY_LAST_CLOUD_SYNC_KEYS) ?? '0', 10);

      if (cloudTime > lastSync) {
        const result = useGameStore.getState()._importGameData(data.data);
        if (result.ok) {
          localStorage.setItem(LAST_CLOUD_SYNC_KEY, cloudTime.toString());
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

  subscribeRealtime();

  // On visibility change: pull latest + reconnect WebSocket (iOS kills it when backgrounded)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;
    pullFromCloud();
    subscribeRealtime();
  });

  // Extra triggers for iOS PWA: focus covers switching apps, pageshow covers BFCache restore
  window.addEventListener('focus', pullFromCloud);
  window.addEventListener('pageshow', pullFromCloud);

  // Safety net: poll every 30s when visible, in case WebSocket is silently dead
  setInterval(() => {
    if (document.visibilityState === 'visible') pullFromCloud();
  }, 30_000);
}
