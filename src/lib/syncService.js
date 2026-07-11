import { supabase } from './supabase';
import useGameStore, { GAME_STORE_EXPORT_VERSION } from '../store/gameStore';
import {
  LAST_CLOUD_VERSION_KEY,
  readLocalStorageValue,
} from './appIdentity';

const SYNC_ID = 'singleton';
const DEBOUNCE_MS = 5000;
let debounceTimer = null;
let isImporting = false;
let initialized = false;
let realtimeChannel = null;
let cachedKnownVersion = null;

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

// "First action wins": mỗi lần ghi vào Supabase, trigger phía server tự tăng
// `version` lên 1 (xem supabase/game_state_version.sql) — do SERVER cấp, không
// phải đồng hồ máy khách nên không bị lệch giờ giữa 2 thiết bị. Máy nào ghi tới
// server TRƯỚC sẽ khớp version đang chờ và thắng; máy ghi SAU (dù thao tác trước
// hay sau theo cảm giác người dùng) sẽ bị từ chối (0 dòng khớp điều kiện) và phải
// nhận lại đúng bản đã thắng — KHÔNG bao giờ được phép ép ghi đè lên nhau nữa.
export function shouldImportVersion(incomingVersion, knownVersion) {
  return typeof incomingVersion === 'number' && incomingVersion > knownVersion;
}

function getKnownVersion() {
  if (cachedKnownVersion != null) return cachedKnownVersion;
  const stored = parseInt(readLocalStorageValue(LAST_CLOUD_VERSION_KEY) ?? '', 10);
  cachedKnownVersion = Number.isFinite(stored) ? stored : -1;
  return cachedKnownVersion;
}

function setKnownVersion(version) {
  cachedKnownVersion = version;
  try {
    localStorage.setItem(LAST_CLOUD_VERSION_KEY, String(version));
  } catch {
    // localStorage không khả dụng (chế độ riêng tư...) — vẫn nhớ tạm trong bộ nhớ.
  }
}

async function importCloudRow(row) {
  isImporting = true;
  const result = useGameStore.getState()._importGameData(row.data);
  setTimeout(() => { isImporting = false; }, 0);
  if (result.ok && typeof row.version === 'number') {
    setKnownVersion(row.version);
    console.log('[sync] imported cloud version', row.version);
  }
  return result;
}

async function pushToCloud() {
  try {
    const data = getExportableState();
    const expectedVersion = getKnownVersion();

    if (expectedVersion < 0) {
      // Máy này chưa từng đồng bộ — ghi thẳng để khởi tạo/lấy version đầu tiên.
      const { data: rows, error } = await supabase
        .from('game_state')
        .upsert({ id: SYNC_ID, data })
        .select('version');
      if (error) throw error;
      if (rows?.[0]) setKnownVersion(rows[0].version);
      console.log('[sync] pushed to cloud (khởi tạo)');
      return;
    }

    const { data: rows, error } = await supabase
      .from('game_state')
      .update({ data })
      .eq('id', SYNC_ID)
      .eq('version', expectedVersion)
      .select('version');

    if (error) throw error;

    if (!rows || rows.length === 0) {
      // Bị từ chối: một máy khác đã ghi trước — máy đó thắng, mình nhận lại bản của họ
      // thay vì ép ghi đè (đúng tinh thần "first action wins").
      console.warn('[sync] push bị từ chối (máy khác ghi trước) — nhận lại bản mới nhất');
      await pullFromCloud();
      return;
    }

    setKnownVersion(rows[0].version);
    console.log('[sync] pushed to cloud, version', rows[0].version);
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

async function pullFromCloud() {
  try {
    const { data, error } = await supabase
      .from('game_state')
      .select('data, version')
      .eq('id', SYNC_ID)
      .single();

    if (error || !data?.data) return;

    if (shouldImportVersion(data.version, getKnownVersion())) {
      await importCloudRow(data);
    }
  } catch (err) {
    console.warn('[sync] pull failed', err);
  }
}

function handleRealtimeUpdate(payload) {
  const row = payload.new;
  if (!row?.data) return;
  if (!shouldImportVersion(row.version, getKnownVersion())) return;

  importCloudRow(row).then((result) => {
    if (result.ok) console.log('[sync] real-time update received, version', row.version);
  });
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
      .select('data, version')
      .eq('id', SYNC_ID)
      .single();

    if (error || !data?.data || Object.keys(data.data).length === 0) {
      await pushToCloud();
    } else if (shouldImportVersion(data.version, getKnownVersion())) {
      const result = await importCloudRow(data);
      if (!result.ok) {
        console.warn('[sync] import failed:', result.message);
        await pushToCloud();
      }
    } else {
      await pushToCloud();
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
