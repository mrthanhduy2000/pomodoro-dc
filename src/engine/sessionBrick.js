/**
 * sessionBrick.js — "this session's brick" (ADR-077, round 37). PURE: no store, no DOM, no clock.
 *
 * ONE question, answered in ONE shape for three screens — the idle Focus screen, the running timer
 * and the ending card: *which building does THIS session push, how many bricks are laid, which one
 * is being laid right now?* Before this round the Focus screen had a one-line "tease" that was often
 * silent, the ending had a separate 3.2-second "city moment" overlay, and a session with an empty
 * queue built nothing at all. Now:
 *   · the queue can never be empty for a session: `autoQueueSessionProject` picks the next project
 *     when nothing in the current era is being built (the player can still change it on the Build
 *     screen — the pick is the same one the strip showed before Start);
 *   · progress numbers come from `describeQueue`/`describeCraftProgress` — one formula, no copy.
 *
 * Does NOT touch the 3D city: it only reads `craftingQueue`/`buildings`, the same inputs the city
 * composition layer already consumes.
 */
import { describeProject, describeQueue, eraBuildProgress, listNextProjects } from './buildChoices';
import {
  CRAFT_QUEUE_SLOTS, LUCKY_BRICK_CHANCE, LUCKY_BRICK_MIN_MINUTES, LUCKY_BRICK_MIN_PROJECT_SESSIONS,
} from './constants';
import { countActiveCrafting } from './eraLegacy';
import { describeCraftProgress } from './craftProgress';

/** The project this session pushes: current-era queue head → restoration head → auto-pick → none. */
export function pickSessionProject({ craftingQueue = [], activeBook = 1, buildings = [] } = {}) {
  const queue = describeQueue({ craftingQueue, activeBook });
  const head = queue.find((q) => !q.restoration) ?? queue[0] ?? null;
  if (head) return { source: head.restoration ? 'restoration' : 'queue', project: head, others: queue.length - 1 };
  const next = listNextProjects({ activeBook, buildings, craftingQueue })[0] ?? null;
  if (next) {
    return {
      source: 'auto',
      project: { ...next, total: next.sessions, done: 0, remaining: next.sessions, ratio: 0, pct: 0, restoration: false },
      others: 0,
    };
  }
  return { source: 'none', project: null, others: 0, eraComplete: eraBuildProgress({ activeBook, buildings }).complete };
}

/**
 * For the store, right before the queue advances: if nothing at all is being built and a project can
 * be chosen, queue it — so the finished session lays its brick somewhere real.
 * Returns the SAME array reference when nothing changes.
 */
export function autoQueueSessionProject({ craftingQueue = [], activeBook = 1, buildings = [], now = Date.now() } = {}) {
  // Only when NOTHING is being built — a legacy restoration in the queue is a project the player chose,
  // and it is the one the strip names (`pickSessionProject`), so the brick lands there, nowhere else.
  if (describeQueue({ craftingQueue, activeBook }).length > 0) return { craftingQueue, autoQueuedId: null };
  const next = listNextProjects({ activeBook, buildings, craftingQueue })[0] ?? null;
  if (!next) return { craftingQueue, autoQueuedId: null };
  return {
    craftingQueue: [...craftingQueue, { bpId: next.bpId, sessionsRemaining: next.sessions, startedAt: now }],
    autoQueuedId: next.bpId,
  };
}

const clamp01 = (x) => Math.min(1, Math.max(0, Number(x) || 0));

function brickStates(total, done, { laying = false, fresh = 0 } = {}) {
  return Array.from({ length: total }, (_, i) => {
    if (i < done - fresh) return 'laid';
    if (i < done) return 'new';
    if (laying && i === done) return 'laying';
    return 'empty';
  });
}

/**
 * The strip/card data.
 * @param {object} p
 * @param {Array}   p.craftingQueue   queue as it is NOW (before the session for idle/running, after it for landed)
 * @param {number}  p.activeBook
 * @param {string[]} p.buildings
 * @param {'idle'|'running'|'landed'} [p.phase]
 * @param {number}  [p.progressRatio]   0..1 of the running session
 * @param {string[]} [p.newlyBuiltIds]  landed: buildings finished by this session
 * @param {string[]} [p.acceleratedIds] landed: buildings that got a second brick from a haste perk
 * @param {string|null} [p.luckyBrickId] landed: the project that got the LUCKY second brick (ADR-080)
 * @param {string|null} [p.autoQueuedId] landed: project the game queued by itself this session
 */
export function describeSessionBrick({
  craftingQueue = [], activeBook = 1, buildings = [], phase = 'idle', progressRatio = 0,
  newlyBuiltIds = [], acceleratedIds = [], autoQueuedId = null, luckyBrickId = null,
} = {}) {
  if (phase === 'landed') {
    const builtId = (Array.isArray(newlyBuiltIds) ? newlyBuiltIds : []).find((id) => describeProject(id));
    if (builtId) {
      const project = describeProject(builtId);
      const total = Math.max(1, project.sessions);
      const lucky = luckyBrickId != null && luckyBrickId === builtId;
      const fresh = (acceleratedIds.includes(builtId) ? 2 : 1) + (lucky ? 1 : 0);
      return {
        status: 'built', phase, bpId: builtId, label: project.label, icon: project.icon, total, done: total,
        remaining: 0, auto: false, lucky, bricks: brickStates(total, total, { fresh: Math.min(fresh, total) }),
        headline: `${project.label} hoàn thành!`,
        sub: lucky ? 'Gạch đôi may mắn đặt nốt viên cuối — đứng trong thành phố từ hôm nay.' : 'Đứng trong thành phố từ hôm nay.',
      };
    }
  }
  const pick = pickSessionProject({ craftingQueue, activeBook, buildings });
  if (!pick.project) {
    return {
      status: 'era-complete', phase, bpId: null, label: null, icon: '🏛️', total: 0, done: 0, remaining: 0, auto: false, bricks: [],
      headline: 'Kỷ này đã xây trọn.', sub: 'Mỗi phiên vẫn cộng EP — kỷ mới sẽ mở thêm công trình.',
    };
  }
  const { project } = pick;
  const total = Math.max(1, project.total ?? project.sessions ?? 1);
  const done = Math.max(0, Math.min(total, project.done ?? 0));
  const auto = pick.source === 'auto' || (autoQueuedId != null && autoQueuedId === project.bpId);
  const base = { status: 'building', phase, bpId: project.bpId, label: project.label, icon: project.icon, total, auto };
  if (phase === 'landed') {
    const lucky = luckyBrickId != null && luckyBrickId === project.bpId;
    const fresh = Math.min(done, (acceleratedIds.includes(project.bpId) ? 2 : 1) + (lucky ? 1 : 0));
    const remaining = total - done;
    return {
      ...base, done, remaining, lucky, bricks: brickStates(total, done, { fresh }),
      // ADR-080: the lucky brick is named FIRST — it is the surprise, and it must read at a glance.
      headline: lucky ? `Gạch đôi — hôm nay may! · ${done}/${total}` : fresh >= 2 ? `Hai viên gạch đã đặt · ${done}/${total}` : `Viên gạch ${done}/${total} đã đặt`,
      sub: auto
        ? `Tự chọn ${project.label} cho bạn.`
        : remaining === 1 ? `Một phiên nữa là ${project.label} mọc lên.` : `Còn ${remaining} phiên nữa ${project.label} mọc lên.`,
    };
  }
  const isFinal = done + 1 >= total;
  const remainingAfter = Math.max(0, total - done - 1);
  if (phase === 'running') {
    return {
      ...base, done, remaining: remainingAfter, isFinal, progressRatio: clamp01(progressRatio),
      bricks: brickStates(total, done, { laying: true }),
      // ADR-079: while the session runs the strip says WHAT is being built, never how much — the ring
      // is the only progress on screen. The numbers wait in `sub` for anything that wants them.
      headline: `Đang xây ${project.label}`,
      sub: isFinal ? 'Viên cuối — xong phiên này là mọc lên.' : `Viên gạch ${done + 1}/${total} · ${Math.round(clamp01(progressRatio) * 100)}%`,
    };
  }
  return {
    ...base, done, remaining: remainingAfter, isFinal,
    bricks: brickStates(total, done, { laying: true }),
    headline: isFinal
      ? `Phiên này đặt viên gạch cuối — ${project.label} xong.`
      : done === 0
        ? `Phiên này đặt viên gạch đầu cho ${project.label}.`
        : `Phiên này đặt viên gạch ${done + 1}/${total} cho ${project.label}.`,
    sub: auto
      ? 'Tự chọn cho bạn · bấm «Đổi» nếu muốn công trình khác.'
      : isFinal ? 'Hoàn thành ngay sau phiên này.' : `Còn ${remainingAfter} phiên sau phiên này.`,
  };
}

/**
 * Change this session's project IN PLACE (ADR-078, Việc 2): put `bpId` at the HEAD of the queue.
 *
 * Đàm's rule: *the app may decide for me, but I must be able to change my mind right where I stand.*
 * Round 37's auto-pick chose the cheapest project and sent him to another screen to disagree —
 * exactly the friction four rounds went to remove. So:
 *   · already queued        → moved to the head, its bricks kept;
 *   · not queued            → inserted at the head with a fresh scaffold (current era, not built);
 *   · queue over the cap    → the LAST item with NO brick laid makes room; if every item already has
 *                             bricks, refuse (`reason: 'full'`) — a tap never throws bricks away;
 *   · restorations (older eras) keep their own door on the Build screen (`reason: 'era'`).
 * Pure: `now` and `slots` are parameters; the store only applies the returned queue.
 */
export function chooseSessionProject({
  craftingQueue = [], activeBook = 1, buildings = [], bpId, now = Date.now(), slots = CRAFT_QUEUE_SLOTS,
} = {}) {
  const queue = Array.isArray(craftingQueue) ? craftingQueue : [];
  const refuse = (reason) => ({ craftingQueue: queue, ok: false, changed: false, dropped: null, reason });
  const project = describeProject(bpId);
  if (!project) return refuse('unknown');
  if ((Array.isArray(buildings) ? buildings : []).includes(bpId)) return refuse('built');

  const idx = queue.findIndex((q) => q?.bpId === bpId);
  if (idx === 0) return { craftingQueue: queue, ok: true, changed: false, dropped: null, reason: null };
  if (idx > 0) {
    return {
      craftingQueue: [queue[idx], ...queue.slice(0, idx), ...queue.slice(idx + 1)],
      ok: true, changed: true, dropped: null, reason: null,
    };
  }
  if (project.era !== activeBook) return refuse('era');

  let rest = queue;
  let dropped = null;
  if (countActiveCrafting(rest, activeBook) >= slots) {
    const victim = [...rest].reverse().find((q) => (
      describeProject(q?.bpId)?.era === activeBook
      && describeCraftProgress(q.bpId, q.sessionsRemaining).done === 0
    ));
    if (!victim) return refuse('full');
    dropped = victim.bpId;
    rest = rest.filter((q) => q !== victim);
  }
  return {
    craftingQueue: [{ bpId, sessionsRemaining: project.sessions, startedAt: now }, ...rest],
    ok: true, changed: true, dropped, reason: null,
  };
}

/**
 * The choices the in-place switch offers, in the order they are shown: projects already in the
 * queue first (they keep their bricks, so they are the cheapest change), then unbuilt blueprints of
 * the era in `listNextProjects` order (cheapest first). Never the head itself, never a restoration.
 */
export function listSessionProjectChoices({ craftingQueue = [], activeBook = 1, buildings = [], limit = 4 } = {}) {
  const head = pickSessionProject({ craftingQueue, activeBook, buildings }).project;
  const queued = describeQueue({ craftingQueue, activeBook })
    .filter((q) => !q.restoration && q.bpId !== head?.bpId)
    .map((q) => ({ ...q, queued: true }));
  const fresh = listNextProjects({ activeBook, buildings, craftingQueue })
    .filter((p) => p.bpId !== head?.bpId)
    .map((p) => ({ ...p, total: p.sessions, done: 0, remaining: p.sessions, queued: false }));
  return [...queued, ...fresh].slice(0, Math.max(0, Math.floor(limit) || 0));
}

/**
 * THE LUCKY BRICK (ADR-080). Sometimes a session lays two bricks instead of one.
 *
 * Đàm: "I can predict 100 % of what happens when a session ends — so much XP, so many bricks."
 * The one unpredictable thing the game can give without a fourth currency is the thing it already
 * counts in: a brick. Rules, all from his order — never negative (a miss is "bình thường", never a
 * loss), no countdown or spin (the roll is silent and the odds are not shown), understandable at
 * first sight ("two bricks landed"), on the SESSION axis only (ADR-069: the only currency is a
 * session — this changes `sessionsRemaining`, nothing else).
 *
 * The extra brick goes to the project the session's own brick went to — the queue head — never to
 * a building that just finished (that ending is already the bigger moment; `sessionRewards.js`
 * skips the roll then). Short sessions are not eligible: a 5-minute session laying two bricks
 * would make the lucky brick worth more than the work.
 *
 * `random` is injected so the reward assembly stays deterministic under test.
 */
export function rollLuckyBrick({
  craftingQueue = [], minutesFocused = 0, random = Math.random, chance = LUCKY_BRICK_CHANCE,
} = {}) {
  const queue = Array.isArray(craftingQueue) ? craftingQueue : [];
  const miss = { craftingQueue: queue, luckyBrickId: null, builtId: null };
  const head = queue[0];
  if (!head?.bpId || !(Number(head.sessionsRemaining) >= 1)) return miss;
  if (!(Number(minutesFocused) >= LUCKY_BRICK_MIN_MINUTES)) return miss;
  // ADR-081: never on a 2-session project — see LUCKY_BRICK_MIN_PROJECT_SESSIONS.
  if ((describeProject(head.bpId)?.sessions ?? 0) < LUCKY_BRICK_MIN_PROJECT_SESSIONS) return miss;
  if (!(random() < chance)) return miss;
  const remaining = Number(head.sessionsRemaining) - 1;
  if (remaining <= 0) {
    return { craftingQueue: queue.slice(1), luckyBrickId: head.bpId, builtId: head.bpId };
  }
  return { craftingQueue: [{ ...head, sessionsRemaining: remaining }, ...queue.slice(1)], luckyBrickId: head.bpId, builtId: null };
}
