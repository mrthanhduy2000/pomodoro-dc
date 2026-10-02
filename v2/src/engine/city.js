/**
 * city.js — the diary city, derived PURELY from the event log (v2/DESIGN.md, ADR-102).
 *
 * Nothing about the city is stored. Bricks come from completed v2 sessions (the timer reducer);
 * the only game facts Đàm writes are his CHOICES — which building next, on which plot — as
 * `build.plan` / `build.cancel` events. Everything else (which building a brick went into, who
 * lives where, which lantern burns, which brick is gold) is recomputed the same way on every
 * device, so the city cannot drift between the laptop and the phone.
 *
 * Rules (plan "Thành phố nhật ký"):
 * - 1 completed session = 1 brick = 1 storey of the building being built. Legacy (v1) sessions
 *   are stats only: the game starts from zero.
 * - Bricks fill planned buildings first-planned-first. With nothing planned they wait in the
 *   brick yard (`pile`) and move in the moment a building is planned.
 * - 1 active day = 1 resident, living in the building that took that day's first brick.
 * - A day reaching the daily goal (as it was set THAT day) lights a lantern.
 * - The first session after ≥ 2 empty days gives two bricks (welcome back). Cancelling costs nothing.
 * - ~8% of bricks are gold, ~1% raise a statue — decided by a hash of the session id, so every
 *   device agrees and nobody can reroll it.
 * - Every ERA_BRICKS bricks opens the next era; old districts keep the style they were built in.
 */
import { blueprint, ERA_BRICKS } from './catalog.js';
import { compareEvents, DEFAULT_PREFS } from './timer.js';
import { dayIndex, dayKey } from './stats.js';

const DAY_MS = 24 * 60 * 60 * 1000;
export const GOLD_RATE = 0.08;
export const STATUE_RATE = 0.01;
export const WELCOME_BACK_GAP_DAYS = 2; // empty days in between that earn a double brick
export const MAX_OPEN_PLANS = 2; // the building in progress + one queued

/** FNV-1a → [0, 1). Deterministic across devices and versions. */
export function hash01(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 4294967296;
}

export function surpriseOf(sid) {
  const h = hash01(`brick:${sid}`);
  if (h < STATUE_RATE) return 'statue';
  if (h < STATUE_RATE + GOLD_RATE) return 'gold';
  return 'plain';
}

export const eraOf = (totalBricks) => 1 + Math.floor(totalBricks / ERA_BRICKS);

/** Monday-based Vietnam week: epoch day 0 (1970-01-01) was a Thursday. */
export const weekIndex = (day) => Math.floor((day + 3) / 7);

const plotKey = (p) => `${p.x},${p.y}`;
const NEIGHBOURS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** Free plots touching the city (4-neighbourhood). An empty city offers only the centre. */
export function candidatePlots(occupied) {
  if (!occupied.size) return [{ x: 0, y: 0 }];
  const seen = new Set();
  const out = [];
  for (const key of occupied.keys()) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of NEIGHBOURS) {
      const p = { x: x + dx, y: y + dy };
      const k = plotKey(p);
      if (occupied.has(k) || seen.has(k)) continue;
      seen.add(k);
      out.push(p);
    }
  }
  return out.sort((a, b) => (a.x * a.x + a.y * a.y) - (b.x * b.x + b.y * b.y) || a.y - b.y || a.x - b.x);
}

/** The requested plot if it is valid, otherwise the nearest valid one (two devices, same plot). */
function placePlot(requested, occupied) {
  const cands = candidatePlots(occupied);
  const rx = Number(requested?.x);
  const ry = Number(requested?.y);
  if (Number.isInteger(rx) && Number.isInteger(ry)) {
    const hit = cands.find((p) => p.x === rx && p.y === ry);
    if (hit) return hit;
    let best = null;
    let bestD = Infinity;
    for (const p of cands) {
      const d = (p.x - rx) ** 2 + (p.y - ry) ** 2;
      if (d < bestD) {
        best = p;
        bestD = d;
      }
    }
    return best;
  }
  return cands[0];
}

function goalTimeline(events) {
  return events
    .filter((e) => e.kind === 'prefs.set' && Number(e.data?.dailyGoal) > 0)
    .sort(compareEvents)
    .map((e) => ({ at: e.at, goal: Math.round(Number(e.data.dailyGoal)) }));
}

function goalAtFactory(changes) {
  return (t) => {
    let g = DEFAULT_PREFS.dailyGoal;
    for (const c of changes) {
      if (c.at > t) break;
      g = c.goal;
    }
    return g;
  };
}

/** Completed v2 sessions → bricks (welcome-back doubles, surprises). */
function makeBricks(sessions) {
  const bricks = [];
  let prevDay = null;
  let lastDay = null;
  for (const s of sessions) {
    const day = dayIndex(s.endedAt);
    const firstOfDay = day !== lastDay;
    if (firstOfDay && lastDay != null) prevDay = lastDay;
    const double = firstOfDay && prevDay != null && day - prevDay - 1 >= WELCOME_BACK_GAP_DAYS;
    const surprise = surpriseOf(s.sid);
    const base = {
      sid: s.sid, at: s.endedAt, day, minutes: s.minutes, categoryId: s.categoryId, goal: s.goal,
    };
    bricks.push({ ...base, id: `${s.sid}#0`, kind: surprise, bonus: false, welcomeBack: double });
    if (double) bricks.push({ ...base, id: `${s.sid}#1`, kind: 'plain', bonus: true, welcomeBack: true });
    lastDay = day;
  }
  return bricks;
}

/**
 * Reduce everything the city needs. `timerState` is `reduce(events, now)` from timer.js.
 */
export function buildCity(events, timerState, now = Date.now()) {
  const sessions = [...timerState.sessions.values()]
    .filter((s) => s.status === 'completed' && !s.legacy)
    .sort((a, b) => a.endedAt - b.endedAt || (a.sid < b.sid ? -1 : 1));
  const goalAt = goalAtFactory(goalTimeline(events));
  const bricks = makeBricks(sessions);

  const items = [
    ...events
      .filter((e) => e.kind === 'build.plan' || e.kind === 'build.cancel')
      .map((e) => ({ at: e.at, order: 0, id: e.id, event: e })),
    ...bricks.map((b) => ({ at: b.at, order: 1, id: b.id, brick: b })),
  ].sort((a, b) => a.at - b.at || a.order - b.order || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const buildings = [];
  const byPlan = new Map();
  const occupied = new Map();
  const pile = [];
  const eraUps = [];
  let total = 0;

  const fill = (b, brick, at) => {
    brick.planId = b.planId;
    brick.storey = b.bricks.length;
    b.bricks.push(brick);
    if (b.bricks.length >= b.size) b.completedAt = at;
  };

  for (const it of items) {
    if (it.brick) {
      const brick = it.brick;
      const before = eraOf(total);
      total += 1;
      brick.n = total;
      brick.era = eraOf(total - 1); // the era this brick was laid in
      if (eraOf(total) > before) eraUps.push({ era: eraOf(total), at: brick.at, brickId: brick.id, sid: brick.sid });
      const target = buildings.find((b) => b.bricks.length < b.size);
      if (target) fill(target, brick, brick.at);
      else {
        brick.planId = null;
        pile.push(brick);
      }
      continue;
    }
    const e = it.event;
    const d = e.data ?? {};
    if (e.kind === 'build.plan') {
      if (!d.planId || byPlan.has(d.planId)) continue;
      const bp = blueprint(d.blueprint);
      const era = eraOf(total);
      if (!bp || bp.era > era) continue; // a future era's blueprint is not unlocked yet
      const plot = placePlot(d.plot, occupied);
      const b = {
        planId: d.planId, key: bp.key, name: bp.name, shape: bp.shape, size: bp.size, style: bp.era,
        plot, requested: d.plot ?? null, moved: Boolean(d.plot) && plotKey(d.plot) !== plotKey(plot),
        plannedAt: e.at, bricks: [], completedAt: null,
      };
      buildings.push(b);
      byPlan.set(b.planId, b);
      occupied.set(plotKey(plot), b.planId);
      while (pile.length && b.bricks.length < b.size) fill(b, pile.shift(), e.at);
    } else {
      const b = byPlan.get(d.planId);
      if (!b || b.bricks.length) continue; // only an empty plan can be withdrawn
      buildings.splice(buildings.indexOf(b), 1);
      byPlan.delete(b.planId);
      occupied.delete(plotKey(b.plot));
    }
  }

  // Residents: one per active day, home = the building that took that day's first brick.
  const days = new Map();
  for (const s of sessions) {
    const day = dayIndex(s.endedAt);
    const cur = days.get(day) ?? { day, sessions: 0, minutes: 0, lastAt: 0, firstSid: s.sid };
    cur.sessions += 1;
    cur.minutes += s.minutes;
    cur.lastAt = s.endedAt;
    days.set(day, cur);
  }
  const brickBySid = new Map(bricks.filter((b) => !b.bonus).map((b) => [b.sid, b]));
  const residents = [...days.values()].sort((a, b) => a.day - b.day).map((d, i) => {
    const goal = goalAt(d.lastAt);
    return {
      n: i + 1, day: d.day, key: dayKey(d.day * DAY_MS), sessions: d.sessions, minutes: d.minutes,
      goal, full: d.sessions >= goal, home: brickBySid.get(d.firstSid)?.planId ?? null,
    };
  });

  // Weekly festival: the week's sessions reach 5 × the daily goal.
  const weeks = new Map();
  for (const r of residents) {
    const w = weekIndex(r.day);
    const cur = weeks.get(w) ?? { week: w, sessions: 0, goal: 0 };
    cur.sessions += r.sessions;
    cur.goal = Math.max(cur.goal, r.goal * 5);
    weeks.set(w, cur);
  }
  const festivals = [...weeks.values()].filter((w) => w.sessions >= w.goal).map((w) => w.week);
  const thisWeek = weekIndex(dayIndex(now));
  const weekNow = weeks.get(thisWeek) ?? { sessions: 0 };

  const today = dayIndex(now);
  const lastActive = residents.length ? residents[residents.length - 1].day : null;
  const workedToday = lastActive === today;

  const current = buildings.find((b) => b.bricks.length < b.size) ?? null;
  const open = buildings.filter((b) => b.bricks.length < b.size);
  const era = eraOf(total);

  return {
    bricks,
    buildings,
    current,
    queued: open.slice(1),
    canPlan: open.length < MAX_OPEN_PLANS,
    pile,
    residents,
    lanterns: residents.filter((r) => r.full),
    statues: bricks.filter((b) => b.kind === 'statue'),
    festivals,
    festivalNow: festivals.includes(thisWeek),
    week: { sessions: weekNow.sessions, goal: goalAt(now) * 5 },
    totalBricks: total,
    era,
    eraProgress: { done: total - (era - 1) * ERA_BRICKS, need: ERA_BRICKS },
    eraUps,
    candidates: candidatePlots(occupied),
    occupied,
    welcomeBack: !workedToday && lastActive != null && today - lastActive - 1 >= WELCOME_BACK_GAP_DAYS,
    goalToday: goalAt(now),
  };
}

/** What one session did to the city — the after-session moment. */
export function brickReport(city, sid) {
  const mine = city.bricks.filter((b) => b.sid === sid);
  if (!mine.length) return null;
  const main = mine[0];
  const building = main.planId ? city.buildings.find((b) => b.planId === main.planId) : null;
  const last = mine[mine.length - 1];
  return {
    bricks: mine,
    count: mine.length,
    kind: main.kind,
    welcomeBack: main.welcomeBack,
    building,
    finished: Boolean(building && building.completedAt != null && building.bricks[building.bricks.length - 1]?.sid === sid),
    inPile: !main.planId,
    eraUp: city.eraUps.find((u) => u.sid === sid) ?? null,
    n: last.n,
  };
}

/** The ledger a finished (or growing) building keeps. */
export function ledger(building) {
  const tally = new Map();
  for (const b of building.bricks) tally.set(b.categoryId, (tally.get(b.categoryId) ?? 0) + 1);
  const first = building.bricks[0];
  const last = building.bricks[building.bricks.length - 1];
  return {
    from: first?.at ?? null,
    to: last?.at ?? null,
    minutes: building.bricks.reduce((s, b) => s + (b.bonus ? 0 : b.minutes), 0),
    tally: [...tally.entries()].map(([categoryId, count]) => ({ categoryId, count })).sort((a, b) => b.count - a.count),
    notes: building.bricks.filter((b) => b.goal && !b.bonus).map((b) => ({ at: b.at, text: b.goal })),
    gold: building.bricks.filter((b) => b.kind !== 'plain').length,
  };
}

/* ---------- commands ---------- */

export function cmdPlan(city, now, { planId, blueprintKey, plot }) {
  const bp = blueprint(blueprintKey);
  if (!city.canPlan || !bp || bp.era > city.era) return null;
  if (!city.candidates.some((p) => p.x === plot?.x && p.y === plot?.y)) return null;
  return { id: `build.plan:${planId}`, at: now, kind: 'build.plan', data: { planId, blueprint: bp.key, plot: { x: plot.x, y: plot.y } } };
}

export function cmdCancelPlan(city, now, planId) {
  const b = city.buildings.find((x) => x.planId === planId);
  if (!b || b.bricks.length) return null;
  return { id: `build.cancel:${planId}`, at: now, kind: 'build.cancel', data: { planId } };
}
