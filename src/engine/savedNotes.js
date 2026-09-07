/**
 * savedNotes.js — Saved notes derived from session history: build, sanitise, rebuild, upsert. Moved verbatim out of gameStore.js (ADR-078).
 *
 * Comments inside are the originals (Vietnamese where they were written so); the rules they
 * explain have not changed by moving. Pure: no store, no DOM.
 */

export function buildSavedNoteEntry(source, index = 0) {
  const noteText = source?.note?.trim() || '';
  const breakNoteText = source?.breakNote?.trim() || '';
  if (!noteText && !breakNoteText) return null;

  return {
    id: source.id != null ? `note_${source.id}` : `note_${index}`,
    sourceSessionId: source.id ?? null,
    timestamp: source.timestamp ?? new Date().toISOString(),
    minutes: Number.isFinite(source.minutes) ? source.minutes : 0,
    xpEarned: Number.isFinite(source.xpEarned ?? source.epEarned) ? (source.xpEarned ?? source.epEarned) : 0,
    categoryId: source.categoryId ?? null,
    categorySnapshot: source.categorySnapshot ?? null,
    tier: source.tier ?? null,
    comboCount: Number.isFinite(source.comboCount) ? source.comboCount : 1,
    note: noteText || null,
    breakNote: breakNoteText || null,
  };
}

export function sanitizeSavedNotes(savedNotes = []) {
  return savedNotes
    .map((entry, index) => {
      const noteText = entry?.note?.trim() || '';
      const breakNoteText = entry?.breakNote?.trim() || '';
      if (!noteText && !breakNoteText) return null;
      return {
        id: entry.id ?? `note_import_${index}`,
        sourceSessionId: entry.sourceSessionId ?? null,
        timestamp: entry.timestamp ?? new Date().toISOString(),
        minutes: Number.isFinite(entry.minutes) ? entry.minutes : 0,
        xpEarned: Number.isFinite(entry.xpEarned) ? entry.xpEarned : 0,
        categoryId: entry.categoryId ?? null,
        categorySnapshot: entry.categorySnapshot ?? null,
        tier: entry.tier ?? null,
        comboCount: Number.isFinite(entry.comboCount) ? entry.comboCount : 1,
        note: noteText || null,
        breakNote: breakNoteText || null,
      };
    })
    .filter(Boolean);
}

export function buildSavedNotesFromHistory(history = []) {
  return history
    .map((session, index) => buildSavedNoteEntry(session, index))
    .filter(Boolean);
}

export function upsertSavedNoteEntry(savedNotes = [], sessionEntry) {
  const filtered = (savedNotes ?? []).filter((entry) => entry.sourceSessionId !== sessionEntry?.id);
  const nextEntry = buildSavedNoteEntry(sessionEntry);
  return nextEntry ? [nextEntry, ...filtered].slice(0, 2000) : filtered;
}
