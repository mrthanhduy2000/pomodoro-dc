/**
 * legacyImport.js — turn v1's persisted game state into v2 events. Pure and idempotent:
 * every event id is derived from the v1 record id, so importing twice adds nothing.
 *
 * Only the session HISTORY and the category list come across (Đàm's decision: the game and the
 * city restart from zero; old sessions feed statistics only). Legacy sessions are tagged
 * `legacy: true` by the reducer so the game layer can ignore them.
 */

function toMs(value) {
  const ms = typeof value === 'number' ? value : Date.parse(value ?? '');
  return Number.isFinite(ms) ? ms : null;
}

/** Accepts the raw Supabase row data, `{ state }`, or the state itself. */
export function unwrapLegacyState(raw) {
  if (!raw || typeof raw !== 'object') return null;
  if (Array.isArray(raw.history) || Array.isArray(raw.sessionCategories)) return raw;
  if (raw.state && typeof raw.state === 'object') return unwrapLegacyState(raw.state);
  if (raw.data && typeof raw.data === 'object') return unwrapLegacyState(raw.data);
  return null;
}

export function legacyEvents(raw) {
  const state = unwrapLegacyState(raw);
  if (!state) return [];
  const out = [];

  for (const c of Array.isArray(state.sessionCategories) ? state.sessionCategories : []) {
    if (!c?.id) continue;
    out.push({
      id: `legacy-cat:${c.id}`,
      at: 0, // older than anything typed in v2, so a v2 edit always wins
      kind: 'category.upsert',
      data: { id: c.id, label: c.label ?? c.id, color: c.color ?? '#94a3b8', icon: c.icon ?? '' },
    });
  }

  for (const h of Array.isArray(state.history) ? state.history : []) {
    if (h?.id == null) continue;
    const at = toMs(h.finishedAt) ?? toMs(h.timestamp) ?? toMs(h.cancelledAt);
    if (at == null) continue;
    const completed = h.status === 'completed' || (h.completed === true && !h.cancelled);
    out.push({
      id: `legacy:${h.id}`,
      at,
      kind: 'legacy.session',
      data: {
        sid: `legacy:${h.id}`,
        startedAt: toMs(h.startedAt) ?? at,
        minutes: Math.max(0, Math.round(Number(h.minutes) || 0)),
        targetMin: Number(h.targetMinutes) || null,
        status: completed ? 'completed' : 'cancelled',
        categoryId: h.categoryId ?? h.categorySnapshot?.id ?? null,
        goal: typeof h.goal === 'string' ? h.goal : '',
      },
    });
  }
  return out;
}
