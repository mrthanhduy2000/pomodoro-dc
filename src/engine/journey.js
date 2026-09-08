/**
 * journey.js — THE DESTINATION. One pure module that answers, in one sentence, the only question
 * this app had never answered: *"I open this thing — where am I going?"*
 *
 * ⚠️ WHY THIS FILE EXISTS (round 43). The app spoke twelve units of progress — XP · EP · level ·
 * era · rank · bricks · buildings · day streak · daily missions · weekly chain · relics · badges —
 * and every one of them was a number that GROWS. Not one of them ENDS. A number that only grows
 * cannot be a destination: at 222 EP and at 22,000 EP the screen says the same thing, *"keep
 * going"*, which is the sentence a slot machine says. Ask "what am I working towards?" in front of
 * a growing number and the honest answer is "more of it".
 *
 * The city already had an ending and nobody had ever printed it: **15 eras × 5 blueprints = 75
 * buildings, and then the city is finished.** That is a real destination — finite, countable,
 * already earned brick by brick, and it needs NO NEW UNIT (rule of the round: no ninth unit). The
 * denominator was sitting in `BLUEPRINT_CATALOG` the whole time; `summarizeMuseum` already knew the
 * numerator. This file is the missing sentence between them.
 *
 * ⚠️ ONE LAW, ONE FORMULA. Every screen that shows how far the journey has come reads THIS file —
 * the top rail, the city stat cell, the era-close card. A second place that recomputes `built/75`
 * by hand is a second place that drifts, and this project has paid for that twice already
 * (`EraStageBar` once labelled EP as "XP" for months).
 *
 * ⚠️ THE SESSION ESTIMATE COMES FROM `medianSessionEP(history)`, the same one the Focus screen's
 * countdown line already uses — never a fresh average invented here. Two places that estimate the
 * same distance with two formulas will disagree on the same screen, and the one the eye trusts is
 * whichever it read last.
 *
 * ⚠️ NEVER SHOW A RAW EP NUMBER FROM HERE. ADR-069 fixed the only currency of this game as a
 * SESSION. EP is bookkeeping — Đàm cannot spend it, cannot compare it, cannot feel it. Whenever a
 * distance has to be spoken, it is spoken in sessions (`describeStageCountdown`), and when even
 * that is too far to be honest, it is spoken as the destination instead. That fallback order —
 * sessions, then the destination, never EP — is the whole point of `describeRailProgress`.
 *
 * PURE: no store, no `Date`, no DOM. Everything arrives as arguments.
 */
import { BLUEPRINT_CATALOG } from './constants';
import { describeStageCountdown } from './eraStage';

/** How many eras the game has, and how many buildings each holds. Read from the catalog, never
 *  typed as a literal: a 16th era added to `BLUEPRINT_CATALOG` must move the destination by itself. */
export const TOTAL_ERAS = Object.keys(BLUEPRINT_CATALOG).length;
export const TOTAL_BUILDINGS = Object.values(BLUEPRINT_CATALOG)
  .reduce((sum, list) => sum + (Array.isArray(list) ? list.length : 0), 0);

/**
 * The journey so far, as one object every screen can read.
 *
 * @param {object} args
 * @param {object} [args.museum]  the `summarizeMuseum` result — only `builtTotal` is read.
 * @param {number} [args.activeBook] current era number (1-based).
 * @returns {{ built:number, total:number, remaining:number, ratio:number,
 *             eraIndex:number, eraTotal:number, line:string, short:string, sentence:string }}
 */
export function describeJourney({ museum = null, activeBook = 1 } = {}) {
  const total = Math.max(1, TOTAL_BUILDINGS);
  const built = Math.max(0, Math.min(total, Math.floor(Number(museum?.builtTotal) || 0)));
  const remaining = Math.max(0, total - built);
  const eraIndex = Math.max(1, Math.min(TOTAL_ERAS, Math.floor(Number(activeBook) || 1)));
  return {
    built,
    total,
    remaining,
    ratio: built / total,
    eraIndex,
    eraTotal: TOTAL_ERAS,
    // The number for a stat cell — a fraction, because a bare "38" is not a destination.
    short: `${built}/${total}`,
    // The line for a rail, where there is room for a word.
    line: `${built}/${total} công trình`,
    // ⚠️ THE SENTENCE OF THE ROUND. If someone asks Đàm *"what is this app for?"* this is the
    // answer, and it must survive being read alone, with no screen around it.
    sentence: remaining === 0
      ? `Thành phố đã trọn vẹn — cả ${total} công trình qua ${TOTAL_ERAS} kỷ.`
      : `Đàm đang xây một thành phố ${total} công trình qua ${TOTAL_ERAS} kỷ — xong ${built}, còn ${remaining}.`,
  };
}

/**
 * What the top rail says on the right, where `222 / 1.867 EP` used to sit.
 *
 * ⚠️ THE ORDER IS THE RULE, not a preference. A distance is told in SESSIONS while sessions can be
 * honestly estimated; the moment that estimate would be a guess or so far away it means nothing
 * (`describeStageCountdown` goes silent past 12 sessions — see `STAGE_COUNTDOWN_MAX_SESSIONS`), the
 * rail stops talking about distance altogether and shows the DESTINATION. It never falls back to
 * EP: an unspendable number is not a smaller answer, it is a different question.
 *
 * @returns {{ text:string, tone:'imminent'|'normal'|'destination' }}
 */
export function describeRailProgress({ stage = null, epPerSession = 0, journey = null } = {}) {
  const countdown = describeStageCountdown(stage, epPerSession);
  // `describeStageCountdown` still answers in EP when it has no session sample yet; that answer is
  // the one thing this rail must never print, so it is dropped here rather than at the call site.
  if (countdown && !/\bEP\b/.test(countdown.text)) {
    return { text: countdown.text, tone: countdown.tone };
  }
  const j = journey ?? describeJourney({});
  return { text: j.line, tone: 'destination' };
}

