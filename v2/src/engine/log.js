/**
 * log.js — merging event logs and converting to/from database rows. Pure.
 *
 * The merge is a set union by `id`: the first copy of an id wins and is never replaced. Every
 * fact that two devices may both emit has a deterministic id (see timer.js), so a union can only
 * ever ADD information, never duplicate or overwrite it.
 */
import { isEvent } from './timer.js';

export function mergeEvents(existing, incoming) {
  const seen = new Set(existing.map((e) => e.id));
  const added = [];
  for (const e of incoming) {
    if (!isEvent(e) || seen.has(e.id)) continue;
    seen.add(e.id);
    added.push(e);
  }
  return { events: added.length ? [...existing, ...added] : existing, added };
}

export function eventToRow(e, device) {
  return { id: e.id, at: new Date(e.at).toISOString(), kind: e.kind, data: e.data ?? {}, device: device ?? null };
}

export function rowToEvent(row) {
  const at = Date.parse(row?.at ?? '');
  if (!row?.id || !Number.isFinite(at) || typeof row.kind !== 'string') return null;
  return { id: String(row.id), at, kind: row.kind, data: row.data ?? {} };
}

/** PostgREST / Postgres codes meaning "events_v2 does not exist yet" (SQL not run). */
export function isMissingTableError(error) {
  const code = error?.code ?? '';
  const msg = error?.message ?? '';
  return code === '42P01' || code === 'PGRST205' || (/events_v2/.test(msg) && /not (exist|find)/i.test(msg));
}

/*
 * Pulling by `seq` alone can skip a row for good: Postgres hands out a `seq` when an INSERT
 * starts, not when it commits. If the row holding seq 10 commits after the one holding 11, a pull
 * in between sees 11, moves the cursor past 10, and never asks for 10 again — one device then
 * misses a session forever (the diary city would differ between the phone and the Mac).
 * So the cursor only moves past rows that have been in the table for SETTLE_MS: anything that
 * started before them has long committed. Fresh rows are read again on the next pull (cheap: it
 * is only the last minute's handful) and the merge, a union by id, ignores the repeats.
 */
export const SETTLE_MS = 60_000;

/**
 * Read every row after `cursor`, page by page. `fetchPage(afterSeq, limit)` resolves to rows
 * ordered by `seq` ascending, each with `created_at`. Returns the events and the SAFE cursor.
 * The clock reference is the later of this device's clock and the newest row seen, so a device
 * whose clock runs behind still lets old rows settle.
 */
export async function pullAll(fetchPage, cursor, clientNow, page = 500) {
  const events = [];
  let from = cursor;
  let safe = cursor;
  let blocked = false;
  const rowsSeen = [];
  for (;;) {
    const rows = await fetchPage(from, page);
    if (!rows?.length) break;
    for (const r of rows) {
      const e = rowToEvent(r);
      if (e) events.push(e);
      rowsSeen.push(r);
      from = Math.max(from, Number(r.seq) || 0);
    }
    if (rows.length < page) break;
  }
  let newest = clientNow;
  for (const r of rowsSeen) newest = Math.max(newest, Date.parse(r.created_at ?? '') || 0);
  for (const r of rowsSeen) {
    const created = Date.parse(r.created_at ?? '');
    if (blocked || !(created <= newest - SETTLE_MS)) {
      blocked = true; // the cursor may only cover a settled PREFIX: never jump over a fresh row
      continue;
    }
    safe = Math.max(safe, Number(r.seq) || 0);
  }
  return { events, cursor: safe };
}
