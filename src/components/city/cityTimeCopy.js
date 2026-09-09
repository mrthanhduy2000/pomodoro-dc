/**
 * cityTimeCopy.js — Round 50 (ADR-090): the words of the hour strip, kept out of the component file so
 * React fast-refresh keeps working (a component file may export only components).
 */
import { DAY_PHASE_LABEL, deriveDaylight } from '../../engine/city3d/daylight';

export const HOUR_MAX = 23;

/** `18h · Hoàng hôn` — the hour and the name of its phase, clamped to 0…23. */
export function hourCaption(hour) {
  const h = Math.max(0, Math.min(HOUR_MAX, Math.round(Number.isFinite(hour) ? hour : 12)));
  return `${String(h).padStart(2, '0')}h · ${DAY_PHASE_LABEL[deriveDaylight(h).phase] ?? ''}`;
}
