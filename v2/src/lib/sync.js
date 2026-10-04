/**
 * sync.js — upload the outbox, pull new rows, listen live. Talks only to `events_v2`; v2 has NO
 * code path that writes to v1's `game_state` or `timer_live` (plan: two apps must never cross-write).
 *
 * Uploads use INSERT … ON CONFLICT DO NOTHING (`ignoreDuplicates`), so retrying is always safe and
 * a fact emitted by two devices (deterministic id) lands once.
 */
import { supabase } from '../../../src/lib/supabase.js';
import { eventToRow, isMissingTableError, pullAll, rowToEvent } from '../engine/log.js';
import { useLogStore } from '../store/logStore.js';

const TABLE = 'events_v2';
const PAGE = 500;
const MISSING_TABLE_RETRY_MS = 5 * 60_000; // until the SQL is run, poll rarely instead of every 20 s
const listeners = new Set();
let status = { state: 'idle', detail: '' };
let started = false;
let busy = false;
let again = false;
let debounce = null;
let lastAttempt = 0;

function setStatus(state, detail = '') {
  if (status.state === state && status.detail === detail) return;
  status = { state, detail };
  for (const fn of listeners) fn(status);
}

export function getSyncStatus() {
  return status;
}

export function onSyncStatus(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

async function upload() {
  const { outbox, events, deviceId } = useLogStore.getState();
  if (!outbox.length) return true;
  const pending = new Set(outbox);
  const rows = events.filter((e) => pending.has(e.id)).map((e) => eventToRow(e, deviceId));
  for (let i = 0; i < rows.length; i += PAGE) {
    const chunk = rows.slice(i, i + PAGE);
    const { error } = await supabase.from(TABLE).upsert(chunk, { onConflict: 'id', ignoreDuplicates: true });
    if (error) throw error;
    useLogStore.getState().markUploaded(chunk.map((r) => r.id));
  }
  // ids in the outbox with no matching event (should not happen) are dropped, not retried forever
  const known = new Set(events.map((e) => e.id));
  useLogStore.getState().markUploaded(outbox.filter((id) => !known.has(id)));
  return true;
}

/** Pull with a cursor that never jumps a row still committing (see `pullAll` in engine/log.js). */
async function pull() {
  const fetchPage = async (after, limit) => {
    const { data, error } = await supabase
      .from(TABLE)
      .select('id, seq, at, kind, data, created_at')
      .gt('seq', after)
      .order('seq', { ascending: true })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  };
  const { events, cursor } = await pullAll(fetchPage, useLogStore.getState().cursor, Date.now(), PAGE);
  useLogStore.getState().mergeRemote(events, cursor);
}

export async function syncNow() {
  if (busy) {
    again = true;
    return;
  }
  busy = true;
  lastAttempt = Date.now();
  setStatus('syncing');
  try {
    await upload();
    await pull();
    setStatus('ok');
  } catch (error) {
    if (isMissingTableError(error)) {
      setStatus('missing-table', 'Chưa chạy supabase/v2_events.sql — dữ liệu đang chỉ lưu trên máy này.');
    } else {
      setStatus('error', error?.message ?? String(error));
    }
  } finally {
    busy = false;
    if (again) {
      again = false;
      void syncNow();
    }
  }
}

function scheduleSync(ms = 400) {
  clearTimeout(debounce);
  debounce = setTimeout(() => void syncNow(), ms);
}

/*
 * Dev safety (CLAUDE.md "never start a focus session on dev/localhost"): on a local host the
 * cloud log is never touched unless `?sync=1` is in the URL, so test sessions stay in the test
 * browser and can never reach Đàm's real log.
 */
export function isDevHost(hostname = location.hostname) {
  return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(hostname) || hostname.endsWith('.local');
}

export function startSync() {
  if (started) return;
  started = true;
  if (isDevHost() && !new URLSearchParams(location.search).has('sync')) {
    setStatus('dev-local', 'Đang chạy trên máy dev: không đồng bộ lên đám mây (thêm ?sync=1 nếu thật sự cần).');
    return;
  }
  void syncNow();

  // Every local append is uploaded shortly after.
  let lastOutbox = useLogStore.getState().outbox;
  useLogStore.subscribe((s) => {
    if (s.outbox !== lastOutbox) {
      lastOutbox = s.outbox;
      if (s.outbox.length) scheduleSync();
    }
  });

  supabase
    .channel('events-v2')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: TABLE }, (payload) => {
      // The new row is in the message: show it now, then pull to move the cursor safely.
      const e = rowToEvent(payload?.new);
      if (e) useLogStore.getState().mergeRemote([e]);
      scheduleSync(150);
    })
    .subscribe();

  // iOS freezes background tabs: a debounce timer may never fire, so flush on the way out and
  // pull on the way back in. Polling covers a silently dead realtime socket.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') void syncNow();
    else scheduleSync(50);
  });
  window.addEventListener('pagehide', () => void syncNow());
  window.addEventListener('focus', () => scheduleSync(50));
  window.addEventListener('online', () => scheduleSync(50));
  setInterval(() => {
    if (document.visibilityState !== 'visible') return;
    if (status.state === 'missing-table' && Date.now() - lastAttempt < MISSING_TABLE_RETRY_MS) return;
    void syncNow();
  }, 20_000);
}
