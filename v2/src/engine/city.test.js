import test from 'node:test';
import assert from 'node:assert/strict';

import { blueprintsOf, ERA_BRICKS, HOIAN_BLUEPRINTS, blueprint } from './catalog.js';
import {
  brickReport, buildCity, candidatePlots, cmdCancelPlan, cmdPlan, GOLD_RATE, hash01, isCandidatePlot, ledger,
  STATUE_RATE, surpriseOf, constructionProgress, constructionMinutes,
} from './city.js';
import { reduce } from './timer.js';

const MIN = 60_000;
const DAY = 24 * 60 * MIN;
const T0 = Date.parse('2026-10-05T02:00:00.000Z'); // Monday 09:00 in Hanoi

/** A completed 25-minute session as the timer writes it: start + its auto completion. */
function session(sid, at, extra = {}) {
  return [
    { id: `focus.start:${sid}`, at, kind: 'focus.start', data: { sid, targetMin: 25, categoryId: 'cat_hoc_dh', goal: '', ...extra } },
    { id: `focus.complete:${sid}`, at: at + 25 * MIN, kind: 'focus.complete', data: { sid, auto: true } },
  ];
}
const plan = (planId, at, key = 'e1-0', plot = { x: 0, y: 0 }) =>
  ({ id: `build.plan:${planId}`, at, kind: 'build.plan', data: { planId, blueprint: key, plot } });
const city = (log, now = T0 + 90 * DAY) => buildCity(log, reduce(log, now), now);

test('one completed session = one brick = one storey, in the planned building, coloured by its category', () => {
  const log = [plan('p1', T0 - MIN), ...session('a', T0, { categoryId: 'cat_tu_hoc', goal: 'ôn chương 4' })];
  const c = city(log);
  assert.equal(c.totalBricks, 1);
  const b = c.buildings[0];
  assert.equal(b.bricks.length, 1);
  assert.equal(b.bricks[0].categoryId, 'cat_tu_hoc');
  assert.equal(b.bricks[0].storey, 0);
  assert.deepEqual(ledger(b).notes.map((n) => n.text), ['ôn chương 4']);
});

test('a building completes at its size; the next brick waits in the yard until Đàm chooses again', () => {
  const log = [plan('p1', T0 - MIN)]; // e1-0 = a 4-brick house
  for (let i = 0; i < 5; i += 1) log.push(...session(`s${i}`, T0 + i * 30 * MIN));
  const c = city(log);
  assert.equal(c.buildings[0].bricks.length, 4);
  assert.equal(c.buildings[0].completedAt, T0 + 3 * 30 * MIN + 25 * MIN);
  assert.equal(c.pile.length, 1, 'brick 5 has no building yet');
  assert.equal(c.current, null);
  assert.ok(brickReport(c, 's3').finished, 'the 4th session finished the house');
  assert.ok(brickReport(c, 's4').inPile);
  // Choosing the next building moves the yard into it — the brick keeps its date.
  const next = cmdPlan(c, T0 + DAY, { planId: 'p2', blueprintKey: 'e1-1', plot: c.candidates[0] });
  assert.ok(next);
  const c2 = city([...log, next]);
  assert.equal(c2.pile.length, 0);
  assert.equal(c2.buildings[1].bricks[0].sid, 's4');
});

test('bricks laid before any plan move into the first building, in order', () => {
  const log = [...session('a', T0), ...session('b', T0 + 30 * MIN), plan('p1', T0 + DAY)];
  const c = city(log);
  assert.deepEqual(c.buildings[0].bricks.map((b) => b.sid), ['a', 'b']);
});

test('legacy (v1) sessions are stats only — the city starts from zero', () => {
  const log = [plan('p1', T0), { id: 'legacy:x', at: T0 + MIN, kind: 'legacy.session', data: { sid: 'legacy:x', minutes: 25, status: 'completed' } }];
  assert.equal(city(log).totalBricks, 0);
});

test('welcome back: the first session after ≥ 2 empty days gives two bricks; one empty day does not', () => {
  const log = [plan('p1', T0 - MIN, 'e1-1'), ...session('d0', T0), ...session('d2', T0 + 2 * DAY), ...session('d5', T0 + 5 * DAY), ...session('d5b', T0 + 5 * DAY + 60 * MIN)];
  const c = city(log);
  assert.equal(brickReport(c, 'd2').count, 1, 'one empty day is not an absence');
  const back = brickReport(c, 'd5');
  assert.equal(back.count, 2, 'two empty days earn a double brick');
  assert.ok(back.welcomeBack);
  assert.equal(brickReport(c, 'd5b').count, 1, 'only the FIRST session of the return day');
  assert.ok(city(log.slice(0, 5), T0 + 5 * DAY - 60 * MIN).welcomeBack, 'the promise is visible before the session');
  assert.equal(city(log, T0 + 5 * DAY + 2 * 60 * MIN).welcomeBack, false);
});

test('surprises are a hash of the session id: deterministic, and near the promised rates', () => {
  assert.equal(surpriseOf('abc'), surpriseOf('abc'));
  let gold = 0;
  let statue = 0;
  const N = 20_000;
  for (let i = 0; i < N; i += 1) {
    const k = surpriseOf(`sid-${i}`);
    if (k === 'gold') gold += 1;
    if (k === 'statue') statue += 1;
  }
  assert.ok(Math.abs(gold / N - GOLD_RATE) < 0.01, `gold rate ${gold / N}`);
  assert.ok(Math.abs(statue / N - STATUE_RATE) < 0.004, `statue rate ${statue / N}`);
  assert.ok(hash01('x') >= 0 && hash01('x') < 1);
});

test('two devices choosing the SAME plot offline: the earlier plan keeps it, the later moves next door', () => {
  const log = [plan('p1', T0, 'e1-0', { x: 0, y: 0 }), plan('p2', T0 + MIN, 'e1-0', { x: 0, y: 0 })];
  const c = city(log);
  assert.deepEqual(c.buildings[0].plot, { x: 0, y: 0 });
  assert.notDeepEqual(c.buildings[1].plot, { x: 0, y: 0 });
  assert.ok(c.buildings[1].moved);
  const d = Math.abs(c.buildings[1].plot.x) + Math.abs(c.buildings[1].plot.y);
  assert.equal(d, 1, 'moved to an adjacent plot, the city stays connected');
});

test('plots: the first building sits in the centre, later ones must touch the city', () => {
  assert.deepEqual(candidatePlots(new Map()), [{ x: 0, y: 0 }]);
  const c = city([plan('p1', T0)]);
  assert.equal(c.candidates.length, 4);
  assert.equal(cmdPlan(c, T0, { planId: 'far', blueprintKey: 'e1-0', plot: { x: 5, y: 5 } }), null, 'a detached plot is refused');
});

test('only an EMPTY plan can be withdrawn, and at most two buildings are open at once', () => {
  const c0 = city([plan('p1', T0)]);
  assert.ok(cmdCancelPlan(c0, T0 + MIN, 'p1'));
  const withBrick = [plan('p1', T0), ...session('a', T0 + MIN)];
  assert.equal(cmdCancelPlan(city(withBrick), T0 + DAY, 'p1'), null);
  const two = city([plan('p1', T0), plan('p2', T0 + MIN, 'e1-0', { x: 1, y: 0 })]);
  assert.equal(two.canPlan, false);
  // A hand-written cancel of a building that already has bricks is ignored by the reducer.
  const c = city([...withBrick, { id: 'build.cancel:p1', at: T0 + DAY, kind: 'build.cancel', data: { planId: 'p1' } }]);
  assert.equal(c.buildings.length, 1);
});

test('eras: every 70 bricks opens a chapter; a future era\'s blueprint is refused until then', () => {
  const log = [];
  for (let i = 0; i < ERA_BRICKS + 1; i += 1) log.push(...session(`s${i}`, T0 + i * 30 * MIN));
  const early = city([plan('p0', T0 - 2 * MIN, 'e2-0'), ...log]);
  assert.equal(early.buildings.length, 0, 'era 2 blueprint planned in era 1 is invalid');
  const c = city(log);
  assert.equal(c.era, 2);
  assert.equal(c.eraUps.length, 1);
  assert.equal(c.eraProgress.done, 1);
  assert.ok(cmdPlan(c, T0 + 90 * DAY, { planId: 'p9', blueprintKey: blueprintsOf(2)[0].key, plot: { x: 0, y: 0 } }));
});

test('residents: one per active day, living where that day\'s first brick went; lanterns use the goal OF THAT DAY', () => {
  const log = [plan('p1', T0 - MIN, 'e1-4')];
  for (let i = 0; i < 4; i += 1) log.push(...session(`a${i}`, T0 + i * 30 * MIN)); // day 0: 4 sessions
  for (let i = 0; i < 3; i += 1) log.push(...session(`b${i}`, T0 + DAY + i * 30 * MIN)); // day 1: 3
  // Raising the goal to 6 on day 2 must NOT put out day 0's lantern.
  log.push({ id: 'prefs:x', at: T0 + 2 * DAY, kind: 'prefs.set', data: { dailyGoal: 6 } });
  const c = city(log);
  assert.equal(c.residents.length, 2);
  assert.equal(c.residents[0].home, 'p1');
  assert.deepEqual(c.lanterns.map((r) => r.sessions), [4]);
  assert.equal(c.goalToday, 6);
});

test('weekly festival: a week reaching 5 × the daily goal', () => {
  const log = [plan('p1', T0 - MIN, 'e1-4')];
  for (let i = 0; i < 20; i += 1) log.push(...session(`w${i}`, T0 + Math.floor(i / 4) * DAY + (i % 4) * 30 * MIN));
  const c = city(log, T0 + 5 * DAY);
  assert.equal(c.festivals.length, 1);
  assert.ok(c.festivalNow);
  assert.equal(city(log.slice(0, -2), T0 + 5 * DAY).festivalNow, false);
});

test('the city does not depend on the order events arrived in (two devices, merged logs)', () => {
  const log = [plan('p1', T0 - MIN, 'e1-1')];
  for (let i = 0; i < 12; i += 1) log.push(...session(`s${i}`, T0 + i * 7 * 60 * MIN));
  log.push(plan('p2', T0 + 3 * DAY, 'e1-0', { x: 1, y: 0 }));
  const sig = (c) => JSON.stringify(c.buildings.map((b) => [b.planId, b.plot, b.bricks.map((x) => x.id)]));
  const want = sig(city(log));
  let seed = 7;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  for (let run = 0; run < 30; run += 1) {
    const shuffled = [...log];
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rnd() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    assert.equal(sig(city(shuffled)), want);
  }
});

test('isCandidatePlot agrees with candidatePlots on every plot, for many random cities', () => {
  for (let seed = 0; seed < 60; seed += 1) {
    const occupied = new Map();
    const n = Math.floor(hash01(`n${seed}`) * 25);
    for (let i = 0; i < n; i += 1) {
      const x = Math.floor(hash01(`x${seed}:${i}`) * 9) - 4;
      const y = Math.floor(hash01(`y${seed}:${i}`) * 9) - 4;
      occupied.set(`${x},${y}`, `p${i}`);
    }
    const listed = new Set(candidatePlots(occupied).map((p) => `${p.x},${p.y}`));
    for (let x = -7; x <= 7; x += 1) {
      for (let y = -7; y <= 7; y += 1) {
        assert.equal(isCandidatePlot({ x, y }, occupied), listed.has(`${x},${y}`), `seed ${seed} plot ${x},${y}`);
      }
    }
  }
});

test('a plan on a plot someone else just took lands on the NEAREST free plot (two devices, one plot)', () => {
  const log = [plan('p1', T0, 'e1-0', { x: 0, y: 0 }), plan('p2', T0 + 1, 'e1-0', { x: 0, y: 0 })];
  const c = city(log);
  assert.deepEqual(c.buildings.map((b) => [b.plot.x, b.plot.y]), [[0, 0], [0, -1]]);
  assert.equal(c.buildings[1].moved, true);
});


// Minute plans preserve completed focus milliseconds and never reinterpret old plan events.
const minutePlan=(id,at,plot={x:0,y:0})=>({...plan(id,at,'e1-0',plot),data:{...plan(id,at).data,plot,workUnit:'minutes',workVersion:1}});
function timedSession(sid,at,minutes,extra={}) {
  return [
    {id:`focus.start:${sid}`,at,kind:'focus.start',data:{sid,targetMin:minutes,categoryId:'cat_hoc_dh',goal:sid,...extra}},
    {id:`focus.complete:${sid}`,at:at+minutes*MIN,kind:'focus.complete',data:{sid,auto:true}},
  ];
}

test('minute construction: two 50-minute sessions equal four 25-minute sessions',()=>{
  const run=(n,duration)=>city([minutePlan('minutes',T0-MIN),...Array.from({length:n},(_,i)=>timedSession(`m${i}`,T0+i*90*MIN,duration)).flat()]);
  for(const c of [run(2,50),run(4,25)]) {
    assert.equal(c.buildings[0].targetMinutes,100);
    assert.equal(constructionMinutes(c.buildings[0]),100);
    assert.equal(constructionProgress(c.buildings[0]),1);
    assert.notEqual(c.buildings[0].completedAt,null);
    assert.equal(ledger(c.buildings[0]).minutes,100);
  }
});

test('minute construction: overflow crosses buildings or waits in the yard without losing or duplicating a millisecond',()=>{
  const log=[minutePlan('a',T0-MIN),minutePlan('b',T0-1,{x:1,y:0}),...timedSession('first',T0,75),...timedSession('crossing',T0+90*MIN,50)];
  const c=city(log);
  assert.deepEqual(c.buildings.map(b=>constructionMinutes(b)),[100,25]);
  assert.equal(c.buildings.reduce((sum,b)=>sum+ledger(b).minutes,0),125);
  assert.equal(c.totalBricks,2,'session history and era rewards are not multiplied into fake sessions');
  assert.equal(c.residents[0].home,'a');
  assert.equal(c.bricks.find(b=>b.sid==='crossing').planId,'a','the primary diary association stays on its first contribution');
  const waiting=city(log.filter(e=>e.data?.planId!=='b'));
  assert.equal(waiting.pile.reduce((sum,b)=>sum+(b.creditedMs||0),0),25*MIN);
  const next=minutePlan('later',T0+2*DAY,{x:1,y:0});
  const drained=city([...log.filter(e=>e.data?.planId!=='b'),next]);
  assert.equal(constructionMinutes(drained.buildings[1]),25);
  assert.equal(drained.pile.length,0);
});

test('minute construction: pauses, cancelled work and welcome bonuses cannot manufacture focus minutes',()=>{
  const log=[minutePlan('a',T0-MIN),...timedSession('a',T0,50)];
  log[2]={...log[2],at:T0+60*MIN};
  log.push({id:'pause',at:T0+10*MIN,kind:'focus.pause',data:{sid:'a'}},{id:'resume',at:T0+20*MIN,kind:'focus.resume',data:{sid:'a'}});
  log.push({id:'focus.start:cancel',at:T0+90*MIN,kind:'focus.start',data:{sid:'cancel',targetMin:50}},{id:'focus.cancel:cancel',at:T0+110*MIN,kind:'focus.cancel',data:{sid:'cancel'}});
  log.push(...timedSession('return',T0+3*DAY,25));
  const c=city(log);
  assert.equal(constructionMinutes(c.buildings[0]),75);
  assert.equal(ledger(c.buildings[0]).minutes,75);
  assert.equal(c.bricks.filter(b=>b.bonus).length,1);
  assert.equal(c.buildings[0].completedAt,null);
});

test('minute construction: exact focus time is used instead of the rounded diary-minute display',()=>{
  const log=[minutePlan('a',T0-MIN),...timedSession('precise',T0,50)];
  log[2]={...log[2],at:T0+25*MIN+31000,data:{sid:'precise',auto:false}};
  const c=city(log);
  assert.equal(c.buildings[0].workMs,25*MIN+31000);
  assert.equal(ledger(c.buildings[0]).minutes,(25*MIN+31000)/MIN);
});

test('minute construction: legacy buildings, session identities and original plots replay unchanged',()=>{
  const legacy=[plan('old',T0-MIN),...Array.from({length:4},(_,i)=>timedSession(`old-${i}`,T0+i*90*MIN,50)).flat()];
  const before=city(legacy);
  const extended=city([...legacy,minutePlan('new',T0+DAY,{x:1,y:0}),...timedSession('new-work',T0+DAY+MIN,50)]);
  assert.deepEqual(extended.buildings[0],before.buildings[0]);
  assert.equal(extended.buildings[0].bricks.length,4);
  assert.equal(constructionMinutes(extended.buildings[1]),50);
  assert.deepEqual(extended.buildings.map(b=>b.plot),[{x:0,y:0},{x:1,y:0}]);
});


test('Hoi An choices persist exact blueprint identities, minute budgets and fixed plots without reinterpreting old plans',()=>{
  const contracts=[['ha-tanky-v1','house',4],['ha-phunghung-v1','house',4],['ha-phuckien-v1','hall',8],['ha-chuacau-v1','temple',12],['ha-cho-v1','market',8],['ha-thanhha-v1','market',8],['ha-kimbong-v1','hall',8],['ha-quangtrieu-v1','hall',8],['ha-quancong-v1','temple',12],['ha-campho-v1','hall',8]];
  for(const [key,shape,size] of contracts)assert.deepEqual([blueprint(key)?.key,blueprint(key)?.shape,blueprint(key)?.size],[key,shape,size],'released choices must never change shape or minute budget');
  const historic=[plan('old',T0-MIN),...Array.from({length:4},(_,i)=>session(`old${i}`,T0+i*30*MIN)).flat()];
  const before=city(historic).buildings[0];
  for(const bp of HOIAN_BLUEPRINTS) {
    assert.equal(blueprint(bp.key).name,bp.name);
    const command=cmdPlan(city(historic),T0+DAY,{planId:bp.key,blueprintKey:bp.key,plot:{x:1,y:0}});
    assert.ok(command);
    const log=[...historic,command,...Array.from({length:bp.size},(_,i)=>timedSession(`work-${i}`,T0+DAY+MIN+i*30*MIN,25)).flat()];
    const after=city(log),built=after.buildings[1];
    assert.deepEqual(after.buildings[0],before);
    assert.equal(built.key,bp.key);assert.equal(built.name,bp.name);
    assert.equal(constructionMinutes(built),bp.size*25);assert.equal(constructionProgress(built),1);
    assert.deepEqual(built.plot,{x:1,y:0});
    assert.equal(after.totalBricks,4+bp.size);
  }
});
