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
