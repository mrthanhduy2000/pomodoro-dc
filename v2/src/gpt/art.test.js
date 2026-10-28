import test from 'node:test';
import assert from 'node:assert/strict';
import { architectureOf, PLACES, SEASONS, postcardCity, streetJourney, journeyAt, projectGptCity, riverSite, riverCandidates, tradeAt } from './art.js';
import { HOIAN_BLUEPRINTS } from '../engine/catalog.js';
import { buildCity, ledger } from '../engine/city.js';
import { reduce } from '../engine/timer.js';
import { plotCenter, PLOT } from '../city/layout.js';
import { parcelPostcardCity } from './art.js';
import { validParcel, parcelsOverlap } from '../engine/parcels.js';

function freeze(value) {
  if (value && typeof value === 'object') { Object.freeze(value); Object.values(value).forEach(freeze); }
  return value;
}

test('real-parcel preview uses valid canonical footprints, stays read-only and preserves old presentation identity',()=>{
  const source=freeze({buildings:[{planId:'museum',plot:{x:2,y:1},bricks:[{id:'earned'}]}],totalBricks:1});
  const before=JSON.stringify(source),preview=parcelPostcardCity(source),shown=projectGptCity(preview);
  assert.equal(preview.buildings.length,20);assert.equal(preview.totalBricks,0);
  for(let i=0;i<preview.buildings.length;i++) {
    const b=preview.buildings[i];assert.ok(validParcel(b.site,b.key));
    assert.equal(shown.buildings[i].site,b.site);assert.equal(shown.buildings[i].bricks,b.bricks);
    assert.equal(shown.buildings[i].world.yaw,b.site.yaw);
    for(const other of preview.buildings.slice(0,i))assert.ok(!parcelsOverlap(b.site,other.site));
  }
  assert.equal(projectGptCity(shown),shown);assert.equal(JSON.stringify(source),before);
});

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
  assert.deepEqual(sample.buildings.slice(0,HOIAN_BLUEPRINTS.length).map(b=>b.key),HOIAN_BLUEPRINTS.map(b=>b.key));
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


test('compiled street journeys pause, close without teleporting, and preserve their source positions',()=>{
  const points=freeze([[2.12,-3.68,.015,2],[2.12,-2,.62,1],[2.12,-.38,.015,2],[2.12,-2,.62,0]]);
  const before=JSON.stringify(points),journey=streetJourney(points),out={};
  assert.equal(journeyAt(journey,0,out),out,'frame sampling reuses its caller-owned pose');
  assert.deepEqual([out.x,out.z,out.y],[2.12,-3.68,.015]);
  assert.equal(out.walking,0);
  journeyAt(journey,1,out);assert.deepEqual([out.x,out.z],[2.12,-3.68],'waiting feet remain planted');
  for(const segment of journey.segments)for(const t of [segment.start,segment.start+segment.pause]) {
    const a=journeyAt(journey,t-.0001),b=journeyAt(journey,t+.0001);
    assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.001,'no teleport at a pause or the closed-loop seam');
  }
  for(let n=-50;n<100;n++) {
    journeyAt(journey,n*.73,out);assert.ok([out.x,out.y,out.z,out.heading,out.distance].every(Number.isFinite));
    assert.ok(out.z>=-3.68&&out.z<=-.38&&out.x===2.12,'the crossing route stays in its clear walking lane');
  }
  assert.equal(JSON.stringify(points),before);
});


test('Chua Cau river sites preserve diary facts and all other buildings; later plans never move an existing site',()=>{
  const ordinary=freeze({planId:'home',key:'e1-0',plot:{x:0,y:0},bricks:[{id:'earned-sid'}]});
  const bridge=freeze({planId:'real-bridge',key:'ha-chuacau-v1',plot:{x:-1,y:-1},workMs:18000000,targetMinutes:300,bricks:[{id:'real-focus'}]});
  const city=freeze({buildings:[ordinary,bridge],candidates:[{x:1,y:0}],totalBricks:2});
  const before=JSON.stringify(city),projected=projectGptCity(city),moved=projected.buildings[1];
  assert.equal(projected.buildings[0],ordinary,'no other museum building may move or be rewritten');
  assert.equal(moved.bricks,bridge.bricks);assert.equal(moved.workMs,bridge.workMs);assert.equal(moved.planId,bridge.planId);
  assert.equal(moved.sourcePlot,bridge.plot);assert.equal(moved.plot.y,-.5,'the crossing spans the actual fixed channel');
  const appended=projectGptCity({...city,buildings:[{...bridge,planId:'later',plot:{x:2,y:3}},...city.buildings]});
  assert.deepEqual(appended.buildings.find(b=>b.planId===bridge.planId).plot,moved.plot);
  assert.equal(projectGptCity(projected),projected,'repeated render projection is idempotent');
  const seen=new Set();
  for(let x=-6;x<=6;x++)for(let y=-6;y<=6;y++) {
    const site=riverSite({x,y});assert.equal(site.z,-2);assert.ok(!seen.has(site.x),'distinct original plans get distinct water crossings');seen.add(site.x);
  }
  assert.deepEqual(riverSite({x:0,y:0}),{x:2,z:-2});
  const choices=riverCandidates(city.candidates);assert.equal(choices[0],city.candidates[0],'picking returns the original valid candidate');
  assert.equal(JSON.stringify(city),before,'render-only placement cannot edit old events, land plots or minutes');
});

test('local commerce transfers finite stock only on handover, alternates buyers and replenishes without writing history',()=>{
  const out={};assert.equal(tradeAt(0,0,out),out);
  assert.equal(out.stock,6);assert.equal(out.active,0);
  assert.equal(tradeAt(18,0).stock,6,'payment does not yet remove the merchandise');
  assert.equal(tradeAt(22,0).stock,5,'handover removes exactly one item');
  assert.equal(tradeAt(44,0).active,1,'next buyer takes a turn');assert.equal(tradeAt(44,0).stock,5);
  assert.equal(tradeAt(5*44+25,0).stock,0,'six completed sales exhaust a shelf');
  assert.equal(tradeAt(5*44+40,0).restock,true);assert.ok(tradeAt(5*44+40,0).stock>0);
  assert.equal(tradeAt(6*44,0).stock,6,'new batch of goods is available');
  for(let i=0;i<1000;i++) {tradeAt(i*.37,9,out);assert.ok(out.stock>=0&&out.stock<=6);assert.ok(out.handover>=0&&out.handover<=1);}
});


test('future regional study has varied free footprints and never changes earned city facts', async () => {
  const {futureCity,DISTRICTS}=await import('./world.js');
  const source=freeze({buildings:[{planId:'earned',plot:{x:1,y:2}}],residents:[{id:'real'}],totalBricks:17});
  const before=JSON.stringify(source),future=futureCity(source);
  assert.equal(JSON.stringify(source),before);assert.equal(future.totalBricks,0);
  assert.equal(future.buildings.length,48);assert.equal(future.candidates.length,0);
  assert.equal(new Set(future.buildings.map(b=>b.planId)).size,48);
  assert.ok(new Set(future.buildings.map(b=>b.world.sx*b.world.sz)).size>5);
  assert.ok(future.buildings.some(b=>!Number.isInteger(b.plot.x)));
  const regions=Object.fromEntries(DISTRICTS.map(d=>[d.id,d]));
  assert.ok(regions.thanhha.x<regions.oldtown.x&&regions.camthanh.x>regions.oldtown.x);
  assert.ok(regions.kimbong.z>regions.oldtown.z);
  assert.deepEqual(futureCity(source),future,'projection is deterministic');
});

test('one regional world uses upgraded parcel kits and preserves earned buildings in both preview states',async()=>{
  const {futureCity,regionalCity,MAP_ROADS}=await import('./world.js');
  const {mappedCandidates}=await import('../engine/parcels.js');
  const site=mappedCandidates({buildings:[]},'ha-phuckien-v1')[0];
  const earned=freeze({planId:'earned-map',key:'ha-phuckien-v1',site,plot:{x:site.x/4,y:site.z/4},workMs:1234567,bricks:[{sid:'real'}]});
  const city=freeze({buildings:[earned],candidates:[],current:earned,queued:[],totalBricks:1});
  const before=JSON.stringify(city),sample=futureCity(city);
  assert.equal(sample.buildings.filter(b=>b.site?.version===2).length,8);
  assert.ok(sample.buildings.find(b=>b.key==='ha-phuckien-v1').site,'regional model reaches the upgraded parcel-only kit');
  assert.ok(MAP_ROADS.some(r=>r.name==='Trần Phú')&&MAP_ROADS.some(r=>r.name==='Bạch Đằng'));
  for(const preview of [false,true]) {
    const shown=regionalCity(city,preview);
    assert.equal(shown.buildings[0],earned);assert.equal(shown.current,earned);assert.equal(shown.totalBricks,1);
    assert.equal(shown.buildings.filter(b=>b.key===earned.key).length,1,'preview cannot duplicate a completed geographic monument');
  }
  assert.equal(JSON.stringify(city),before);
});


test('street clearance fits display geometry without mutating recorded sites or road coordinates',async()=>{
  const {streetEnvelopeFit,streetIntersectsEnvelope,MAP_ROADS}=await import('../engine/hoianMap.js');
  const {mappedCandidates}=await import('../engine/parcels.js');
  const site=freeze(mappedCandidates({buildings:[]},'ha-tanky-v1')[0]);
  const source=JSON.stringify({site,roads:MAP_ROADS});
  const envelope={x:site.x,z:site.z,width:site.width+.5,depth:site.depth+.6};
  assert.equal(streetIntersectsEnvelope(envelope),true,'the released oversized shell blocks a street');
  const fit=streetEnvelopeFit(envelope,site);
  const shown={...envelope,width:envelope.width*fit.x,depth:envelope.depth*fit.z};
  assert.ok(fit.x>0&&fit.z>0&&fit.x<=1&&fit.z<=1);
  assert.equal(streetIntersectsEnvelope(shown),false,'roof/threshold extent clears the full walking corridor');
  assert.deepEqual(streetEnvelopeFit(envelope,site),fit,'no progress-dependent terrain adjustment');
  const p=MAP_ROADS.find(r=>r.name==='Nguyễn Thái Học').points[2];
  assert.deepEqual(streetEnvelopeFit({...p,width:2,depth:2}),{x:0,z:0},'illustrative houses centred on a street must be rejected');
  assert.equal(JSON.stringify({site,roads:MAP_ROADS}),source);
});
