/**
 * cityCopy.js — the SENTENCES of the City tab, as pure functions (round 46, ADR-086).
 *
 * ⚠️ WHY A FILE FOR STRINGS. Three lines on this tab were saying something false or nothing at all,
 * and none of them could be tested while they lived inline in JSX:
 *   · an unbuilt slot in a SEALED era read «chưa xây» — "not yet", as if it would come. The truth
 *     since ADR-012 (Đàm's own choice, 2026-08-13) is the opposite of "never": the museum's empty
 *     lots can be RESTORED from Hành trang › «Trùng tu di sản», one at a time, and a restored
 *     building pays the same skill point as any other (`countBuiltBuildings` counts the archive).
 *     So the honest label names the path and the pay.
 *   · the tab said «SP» zero times while `player.spFromCity` read 37 — the exact trap round 44
 *     wrote a rule against («a screen that names a reward names it in SP first»), repeated on the
 *     one screen that earns the money.
 *   · fifteen era chips grew to «Kỷ 12 · 4/5 · đang xây» and pushed the city 217 px down the
 *     phone; ADR-080 had promised three rows.
 * Every rate below comes from `engine/skillPointEconomy.js`. Nothing here types a number.
 */
import { SP_PER_BUILDING } from '../../engine/skillPointEconomy';

/** «+1 SP» — the one phrase this tab uses for the price of a building, everywhere it is spoken. */
export const SP_TAG = `+${SP_PER_BUILDING} SP`;

/**
 * The small note beside an unbuilt or in-progress slot of the collection list.
 * @param {'built'|'building'|'empty'} state
 * @param {{sealed?: boolean}} opts  `sealed` = the era is in the museum (not the one being played)
 * @returns {string|null} `null` for a built slot — its level already says everything.
 */
export function slotNote(state, { sealed = false } = {}) {
  if (state === 'building') return 'đang xây';
  if (state === 'empty') return sealed ? `trùng tu được · ${SP_TAG}` : `chưa xây · ${SP_TAG}`;
  return null;
}

/**
 * The status line of the era card, right of the era's name.
 * The session count moved here from a stat cell: the cell failed round 43's test (*what can Đàm DO
 * with this number?*) and its slot now names the skill points; the count itself is kept because
 * for a sealed era it is the plaque — "this city took 143 sessions".
 */
export function eraStatusLine({ isCurrent = false, isLost = false, sealedAt = null, sessionCount = 0 } = {}) {
  if (isLost) return 'Thất truyền';
  const sessions = Number.isFinite(Number(sessionCount)) && Number(sessionCount) > 0
    ? ` · ${Number(sessionCount)} phiên`
    : '';
  if (isCurrent) return `Đang xây${sessions}`;
  return `Đã niêm phong${sealedAt ? ` ${sealedAt}` : ''}${sessions}`;
}

/**
 * What one era tile shows — two lines, no prose.
 *
 *   line 1  «Kỷ 12»
 *   line 2  «★» complete · «4/5» otherwise · «—» lost
 *
 * ⚠️ «· đang xây» is GONE from the tile, and so is the fraction next to a star: «5/5 ★» said the
 * same thing twice, and «· đang xây» tripled the width of the one chip it sat on. Which era is
 * being built is said ONCE, in the era card's status line; a sealed era with a restoration in
 * flight keeps its fraction in the accent tone (`tone: 'open'`), so the strip still answers
 * "which era is still worth my attention" without a word.
 *
 * @returns {{ title: string, mark: string, tone: 'complete'|'open'|'sealed'|'lost'|'current', aria: string }}
 */
export function eraTile(era) {
  const title = `Kỷ ${era.era}`;
  if (era.isLost) {
    return { title, mark: '—', tone: 'lost', aria: `${era.label ?? title} — thành phố thất truyền` };
  }
  const done = era.completion?.done ?? 0;
  const total = era.completion?.total ?? 0;
  const complete = !!era.completion?.isComplete;
  const open = !!era.isCurrent
    || (era.completion?.slots ?? []).some((slot) => slot.state === 'building');
  const mark = complete ? '★' : (total > 0 ? `${done}/${total}` : '');
  const tone = complete ? 'complete' : (era.isCurrent ? 'current' : (open ? 'open' : 'sealed'));
  const aria = `${era.label ?? title}`
    + (total > 0 ? ` — đã xây ${done}/${total} công trình` : '')
    + (complete ? ' · trọn vẹn' : '')
    + (era.isCurrent ? ' · đang xây' : (open ? ' · đang trùng tu' : ''))
    + (era.sealedAt ? ` · niêm phong ${era.sealedAt}` : '');
  return { title, mark, tone, aria };
}
