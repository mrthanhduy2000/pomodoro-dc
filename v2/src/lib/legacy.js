/**
 * legacy.js — READ-ONLY access to v1's data for the one-time history import. Never writes to
 * v1's `game_state` row or v1's localStorage key.
 */
import { supabase } from '../../../src/lib/supabase.js';
import { legacyEvents } from '../engine/legacyImport.js';

export async function loadLegacyEvents() {
  try {
    const { data, error } = await supabase.from('game_state').select('data').eq('id', 'singleton').single();
    if (!error && data?.data) {
      const fromCloud = legacyEvents(data.data);
      if (fromCloud.length) return { source: 'cloud', events: fromCloud };
    }
  } catch {
    // offline — fall through to this browser's copy of v1
  }
  try {
    const raw = JSON.parse(localStorage.getItem('dc-pomodoro-v1') ?? 'null');
    return { source: 'local', events: legacyEvents(raw) };
  } catch {
    return { source: 'none', events: [] };
  }
}
