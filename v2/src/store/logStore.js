/**
 * logStore.js — the ONLY mutable state of v2: the event log, plus the ids still waiting to be
 * uploaded (`outbox`) and the server cursor. Everything the screen shows is derived from `events`
 * by the pure reducer in engine/timer.js.
 *
 * Persisted under `dc-pomodoro-v2` — a different key from v1 (`dc-pomodoro-v1`), so the two apps
 * can never read or overwrite each other's local data.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { mergeEvents } from '../engine/log.js';

export const V2_STORAGE_KEY = 'dc-pomodoro-v2';

function newDeviceId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }
}

export const useLogStore = create(
  persist(
    (set, get) => ({
      events: [],
      outbox: [],
      cursor: 0,
      deviceId: newDeviceId(),

      /** Local facts: merged, and queued for upload. */
      append(incoming) {
        const list = Array.isArray(incoming) ? incoming : [incoming];
        const { events, added } = mergeEvents(get().events, list.filter(Boolean));
        if (!added.length) return [];
        set({ events, outbox: [...get().outbox, ...added.map((e) => e.id)] });
        return added;
      },

      /** Facts that came FROM the server: merged, never re-uploaded. */
      mergeRemote(incoming, cursor) {
        const { events, added } = mergeEvents(get().events, incoming);
        const patch = {};
        if (added.length) patch.events = events;
        if (Number.isFinite(cursor) && cursor > get().cursor) patch.cursor = cursor;
        if (Object.keys(patch).length) set(patch);
        return added;
      },

      markUploaded(ids) {
        const done = new Set(ids);
        set({ outbox: get().outbox.filter((id) => !done.has(id)) });
      },
    }),
    {
      name: V2_STORAGE_KEY,
      version: 1,
      partialize: (s) => ({ events: s.events, outbox: s.outbox, cursor: s.cursor, deviceId: s.deviceId }),
    },
  ),
);

/** A fresh id for events that only one device can emit (pause, resume, …). */
export function newEventId(prefix) {
  return `${prefix}:${newDeviceId()}`;
}
