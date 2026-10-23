import test from 'node:test';
import assert from 'node:assert/strict';
import { architectureOf, PLACES, SEASONS, postcardCity } from './art.js';
import { HOIAN_BLUEPRINTS } from '../engine/catalog.js';
import { buildCity, ledger } from '../engine/city.js';
import { reduce } from '../engine/timer.js';
import { plotCenter, PLOT } from '../city/layout.js';

function freeze(value) {
  if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

test('GPT presentation preserves existing session identities, notes, plots and progress across every style', () => {
  const at = Date.parse('2026-10-22T02:00:00Z');
  const events = [
    { id: 'plan', at: at - 1000, kind: 'build.plan', data: { planId: 'home', blueprint: 'e1-0', plot: { x: 0, y: 0 } } },
    { id: 'start', at, kind: 'focus.start', data: { sid: 'real-session', targetMin: 25, categoryId: 'cat_hoc_dh', goal: 'Keep this note' } },
    { id: 'complete', at: at + 1500000, kind: 'focus.complete', data: { sid: 'real-session', auto: true } },
  ];
  const now = at + 1600000;
  const city = buildCity(events, reduce(events, now), now);
  assert.equal(city.buildings.length, 1);
  const original = JSON.stringify(city);
  const positions = city.buildings.map((b) => plotCenter(b.plot));
  freeze(city);
  for (const _place of Object.keys(PLACES)) for (const _season of Object.keys(SEASONS)) {
    city.buildings.forEach((building) => {
      const architecture = architectureOf(building);
      assert.equal(architecture.progress, building.bricks.length / building.size);
      assert.ok(architecture.width / 2 < 1.3, 'facade stays inside the plot and clear of the fixed canal');
    });
    const postcard = postcardCity(city);
    assert.ok(postcard.buildings.every((b) => b.planId.startsWith('postcard-')));
    assert.equal(JSON.stringify(city), original, 'sample generation and skin reads cannot mutate real progress');
    assert.deepEqual(city.buildings.map((b) => plotCenter(b.plot)), positions);
  }
  assert.equal(city.buildings[0].bricks[0].sid, 'real-session');
  assert.equal(ledger(city.buildings[0]).notes[0].text, 'Keep this note');
});


test('Hoi An kit keeps every construction phase anchored to the original plot and preserves its facts', async () => {
  const { drawHoiAnBuilding } = await import('./hoian.js');
  for (const shape of ['house','hall','market','tower','temple']) {
    for (let seed=0;seed<(shape==='house'?24:8);seed+=1) for (let count=0;count<=12;count+=1) {
      const b=freeze({planId:`original-${shape}-${seed}`,plot:{x:-3,y:2},shape,size:12,bricks:Array.from({length:count},(_,i)=>({id:`session-${i}`,goal:'Preserve my diary'}))});
      const original=JSON.stringify(b);
      const parts=[];
      drawHoiAnBuilding({part:(...args)=>parts.push(args),beam:()=>{}},b);
      const foundation=parts.find(p=>p[1]==='paving');
      assert.deepEqual(foundation[2],[-12,.09,8], 'construction stays on its original plot at every session count');
      for(const p of parts) {
        assert.equal(typeof p[1],'string','every rendered part must reference a valid material key');
        assert.equal(p[5].planId,b.planId,'all decorative picks lead to the original building');
        assert.ok(Math.abs(p[2][0]+12)<PLOT/2-.1 && Math.abs(p[2][2]-8)<1.5,'the kit remains local to its plot');
      }
      assert.equal(JSON.stringify(b),original);
    }
  }
});


test('minute preview phases use focused time rather than brick count and never alter earned facts',()=>{
  const b=freeze({planId:'earned',plot:{x:2,y:-1},shape:'house',size:4,workUnit:'minutes',targetMinutes:100,workMs:3000000,bricks:[{id:'one-50-minute-session'}]});
  assert.equal(architectureOf(b).progress,.5);
  const sample=postcardCity({buildings:[b]});
  sample.buildings[0].workMs=1200000;
  assert.equal(architectureOf(sample.buildings[0]).progress,.1);
  assert.equal(b.workMs,3000000);
  assert.deepEqual(b.plot,{x:2,y:-1});
});


test('every documented Hoi An choice stays local and read-only at all minute construction stages',async()=>{
  const {drawHoiAnBuilding}=await import('./hoian.js');
  const earned=freeze({buildings:[{planId:'real',plot:{x:7,y:4}}]});
  const before=JSON.stringify(earned),sample=postcardCity(earned,true);
  assert.equal(sample.buildings.length,20);
  assert.deepEqual(sample.buildings.map(b=>b.plot),postcardCity(earned).buildings.map(b=>b.plot));
  assert.deepEqual(sample.buildings.slice(0,7).map(b=>b.key),HOIAN_BLUEPRINTS.map(b=>b.key));
  for(const bp of HOIAN_BLUEPRINTS)for(let percent=0;percent<=100;percent+=5) {
    const b=freeze({key:bp.key,planId:bp.key,shape:bp.shape,plot:{x:2,y:3},size:bp.size,workUnit:'minutes',targetMinutes:bp.size*25,workMs:bp.size*25*60000*percent/100,bricks:[]});
    const original=JSON.stringify(b),parts=[];
    drawHoiAnBuilding({part:(...args)=>parts.push(args),beam:()=>{},shopPools:[]},b);
    assert.deepEqual(parts.find(p=>p[1]==='paving')[2],[8,.09,12]);
    for(const part of parts) {
      assert.ok(part[2].every(Number.isFinite));assert.ok(part[3].every(value=>Number.isFinite(value)&&value>0),`${bp.key} has invalid geometry`);
      assert.ok(Math.abs(part[2][0]-8)<1.9&&Math.abs(part[2][2]-12)<1.5,`${bp.key} escapes its original plot`);
      assert.equal(part[5].planId,b.planId);
    }
    assert.equal(JSON.stringify(b),original);
  }
  assert.equal(JSON.stringify(earned),before);
});


test('new waterfront model fitting preserves the original plot centre and only shortens depth',async()=>{
  const {fitHeritageQuay}=await import('./heritage.js');
  const matrix={elements:[1,0,0,0,0,1,0,0,0,0,1,0,8,2,-4,1]};
  fitHeritageQuay(matrix,-4);
  assert.deepEqual(matrix.elements.slice(12,15),[8,2,-4]);
  assert.equal(matrix.elements[0],1);assert.equal(matrix.elements[5],1);assert.ok(matrix.elements[10]>0&&matrix.elements[10]<1);
  assert.ok(-4+1.3*matrix.elements[10]<=-3.08,'ground props stay behind the fixed north quay');
  const before=JSON.stringify(matrix);fitHeritageQuay(matrix,null);assert.equal(JSON.stringify(matrix),before);
});
