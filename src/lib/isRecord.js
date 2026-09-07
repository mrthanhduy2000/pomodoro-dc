/** `isRecord(value)` — a plain object (not null, not an array). Shared by the store and the engine (ADR-078). */
export function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}
