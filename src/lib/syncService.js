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

// Có phải state "thật sự có dữ liệu" không? Dùng để KHÔNG bao giờ để một state
// trắng (2 key localStorage lệch nhau: dữ liệu game mất nhưng last-cloud-version
// còn, hoặc ngược lại) ghi đè bản cloud thật. Nhận diện qua chính các tài sản
// không thể tự sinh ra: lịch sử phiên, số phiên đã xong, EXP, số lần prestige.
// Dùng cho CẢ state local lẫn data đọc từ cloud (cùng một hình dạng).
export function hasMeaningfulState(state) {
  if (!state || typeof state !== 'object') return false;
  return (
    (Array.isArray(state.history) && state.history.length > 0) ||
    (state.progress?.sessionsCompleted ?? 0) > 0 ||
    (state.player?.totalEXP ?? 0) > 0 ||
    (state.prestige?.count ?? 0) > 0
  );
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
  // C1-1: state sắp bị THAY NGUYÊN KHỐI. Lịch push đang chờ (nếu có) chỉ còn đẩy
  // lại chính bản cloud này (echo vô nghĩa, tăng version) — huỷ nó. Thay đổi local
  // chưa kịp đẩy đã mất ngay khi _importGameData chạy: không cứu được ở tầng này
  // (giới hạn đã biết của "first action wins"), nhưng phải NHÌN THẤY, không im lặng.
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
    console.warn('[sync] thay đổi local chưa kịp đẩy có thể đã bị bản cloud mới hơn ghi đè');
  }
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
      // A2: đây là đường ghi DUY NHẤT không có compare-and-swap. Trước khi ghi phải
      // xem cloud có gì: nếu cloud đang giữ dữ liệu thật thì máy này (chưa biết
      // version — có thể do key last-cloud-version bị mất) TUYỆT ĐỐI không được đè.
      const { data: existing, error: readError } = await supabase
        .from('game_state')
        .select('data, version')
        .eq('id', SYNC_ID)
        .single();

      // PGRST116 = không có dòng nào ⇒ cloud thật sự trống, khởi tạo bình thường.
      if (readError && readError.code !== 'PGRST116') {
        console.warn('[sync] không đọc được cloud trước khi khởi tạo — hoãn ghi', readError);
        return;
      }

      if (hasMeaningfulState(existing?.data)) {
        console.warn('[sync] cloud đang có dữ liệu nhưng máy này chưa biết version — nhận bản cloud thay vì ghi đè');
        await importCloudRow(existing);
        return;
      }

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

// A1: `debounceTimer` PHẢI về null ngay khi hết hiệu lực (nổ hoặc bị huỷ) — nó là
// tín hiệu "còn thay đổi chưa đẩy" mà C1-3 (flush khi rời app) và C1-1 (huỷ lịch
// mồ côi lúc import) dựa vào. Giữ handle chết sẽ làm tín hiệu luôn bật.
function schedulePush() {
  if (isImporting) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    pushToCloud();
  }, DEBOUNCE_MS);
}

export async function pushNow() {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  await pushToCloud();
}

// C1-3: chỉ đẩy khi THẬT SỰ còn thay đổi đang chờ (dựa vào A1), tránh ghi vô nghĩa
// mỗi lần ẩn app. Gửi kiểu "best-effort": nếu hệ điều hành giết tiến trình ngay thì
// vẫn có thể lỡ, nhưng cửa sổ rủi ro co từ "tới lần mở app sau" xuống mili-giây.
function flushPendingBeforeHide() {
  if (!debounceTimer) return;
  void pushNow();
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

    // C1-5: thiếu cột `version` (chưa chạy migration) làm MỌI push/pull hỏng nhưng
    // app trông vẫn bình thường — phải báo to, kèm cách xử lý.
    if (error?.code === '42703') {
      console.error(
        '[sync] Bảng game_state thiếu cột "version" — ĐỒNG BỘ SẼ KHÔNG CHẠY. '
        + 'Chạy supabase/game_state_version.sql trong Supabase SQL editor rồi mở lại app.',
      );
    }

    if (error || !data?.data || Object.keys(data.data).length === 0) {
      await pushToCloud();
    } else if (shouldImportVersion(data.version, getKnownVersion())) {
      const result = await importCloudRow(data);
      if (!result.ok) {
        console.warn('[sync] import failed:', result.message);
        await pushToCloud();
      }
    } else if (!hasMeaningfulState(useGameStore.getState()) && hasMeaningfulState(data.data)) {
      // C1-4: cloud không mới hơn NHƯNG local đang trắng còn cloud có dữ liệu thật
      // ⇒ hai key localStorage đã lệch nhau. Đẩy local lúc này sẽ xoá sạch cloud.
      console.error('[sync] dữ liệu local trống bất thường trong khi cloud có dữ liệu — nhận lại bản cloud thay vì ghi đè');
      await importCloudRow(data);
    } else {
      // Local có dữ liệu thật: giữ nguyên đường đẩy cũ — đây chính là đường HỒI PHỤC
      // cho thay đổi offline chưa kịp đẩy (bị kill giữa chừng, mở lại, version bằng nhau).
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
    if (document.visibilityState !== 'visible') {
      flushPendingBeforeHide();
      return;
    }
    pullFromCloud();
    subscribeRealtime();
  });

  // Extra triggers for iOS PWA: focus covers switching apps, pageshow covers BFCache restore
  window.addEventListener('focus', pullFromCloud);
  window.addEventListener('pageshow', pullFromCloud);
  // C1-3: rời app là lúc debounce 5s KHÔNG BAO GIỜ nổ (iOS đóng băng tab) — phải
  // đẩy ngay. pagehide là lưới thứ hai cho các đường đóng mà visibilitychange bỏ sót.
  window.addEventListener('pagehide', flushPendingBeforeHide);

  // Safety net: poll every 30s when visible, in case WebSocket is silently dead
  setInterval(() => {
    if (document.visibilityState === 'visible') pullFromCloud();
  }, 30_000);
}
