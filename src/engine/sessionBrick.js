/**
 * sessionBrick.js — "this session's brick" (ADR-076, round 37). PURE: no store, no DOM, no clock.
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
 * For the store, right before the queue advances: if nothing in the current era is being built and a
 * project can be chosen, queue it — so the finished session lays its brick somewhere real.
 * Returns the SAME array reference when nothing changes.
 */
export function autoQueueSessionProject({ craftingQueue = [], activeBook = 1, buildings = [], now = Date.now() } = {}) {
  const hasCurrentEra = describeQueue({ craftingQueue, activeBook }).some((q) => !q.restoration);
  if (hasCurrentEra) return { craftingQueue, autoQueuedId: null };
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
 * @param {string|null} [p.autoQueuedId] landed: project the game queued by itself this session
 */
export function describeSessionBrick({
  craftingQueue = [], activeBook = 1, buildings = [], phase = 'idle', progressRatio = 0,
  newlyBuiltIds = [], acceleratedIds = [], autoQueuedId = null,
} = {}) {
  if (phase === 'landed') {
    const builtId = (Array.isArray(newlyBuiltIds) ? newlyBuiltIds : []).find((id) => describeProject(id));
    if (builtId) {
      const project = describeProject(builtId);
      const total = Math.max(1, project.sessions);
      const fresh = acceleratedIds.includes(builtId) ? 2 : 1;
      return {
        status: 'built', phase, bpId: builtId, label: project.label, icon: project.icon, total, done: total,
        remaining: 0, auto: false, bricks: brickStates(total, total, { fresh: Math.min(fresh, total) }),
        headline: `${project.label} hoàn thành!`, sub: 'Đứng trong thành phố từ hôm nay.',
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
    const fresh = Math.min(done, acceleratedIds.includes(project.bpId) ? 2 : 1);
    const remaining = total - done;
    return {
      ...base, done, remaining, bricks: brickStates(total, done, { fresh }),
      headline: fresh >= 2 ? `Hai viên gạch đã đặt · ${done}/${total}` : `Viên gạch ${done}/${total} đã đặt`,
      sub: auto
        ? `Tự chọn ${project.label} cho bạn — đổi ở Hành trang › Công trình.`
        : remaining === 1 ? `Một phiên nữa là ${project.label} mọc lên.` : `Còn ${remaining} phiên nữa ${project.label} mọc lên.`,
    };
  }
  const isFinal = done + 1 >= total;
  const remainingAfter = Math.max(0, total - done - 1);
  if (phase === 'running') {
    return {
      ...base, done, remaining: remainingAfter, isFinal, progressRatio: clamp01(progressRatio),
      bricks: brickStates(total, done, { laying: true }),
      headline: `Đang đặt viên ${done + 1}/${total} · ${project.label}`,
      sub: isFinal ? 'Viên cuối — xong phiên này là mọc lên.' : `${Math.round(clamp01(progressRatio) * 100)}% viên gạch này.`,
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
      ? 'Tự chọn cho bạn · đổi ở Hành trang › Công trình.'
      : isFinal ? 'Hoàn thành ngay sau phiên này.' : `Còn ${remainingAfter} phiên sau phiên này.`,
  };
}
