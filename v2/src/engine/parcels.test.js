import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCity, cmdPlan, cmdCancelPlan } from './city.js';
import { reduce } from './timer.js';
import { HOIAN_BLUEPRINTS } from './catalog.js';
import { parcelCandidates, validParcel, buildingParcel, parcelsOverlap, parcelCells } from './parcels.js';

const MIN=60000,T0=Date.parse('2026-10-25T02:00:00Z');
const replay=events=>buildCity(events,reduce(events,T0+86400000),T0+86400000);
const focus=(id,at,minutes)=>[
  {id:`start:${id}`,at,kind:'focus.start',data:{sid:id,targetMin:minutes,goal:'Real completed work'}},
  {id:`end:${id}`,at:at+minutes*MIN,kind:'focus.complete',data:{sid:id,auto:true}},
];
const plan=(city,id,key='ha-tanky-v1',at=T0,site=parcelCandidates(city,key)[0])=>cmdPlan(city,at,{planId:id,blueprintKey:key,site});

test('all parcel profiles offer valid land/water sites, with different real footprints and no source mutation',()=>{
  const city=replay([]),before=JSON.stringify(city);
  const areas=new Set();
  for(const bp of HOIAN_BLUEPRINTS) {
    const sites=parcelCandidates(city,bp.key);
    assert.equal(sites.length,5);
    for(const s of sites){assert.ok(validParcel(s,bp.key));areas.add(s.width*s.depth);}
    assert.ok(!validParcel({...sites[0],width:999},bp.key));
    assert.ok(!validParcel({...sites[0],z:-2},bp.key)||bp.key==='ha-chuacau-v1');
    assert.ok(!validParcel({...sites[0],version:99},bp.key));
  }
  assert.ok(areas.size>=8);assert.equal(JSON.stringify(city),before);
  assert.ok(parcelCandidates(city,'ha-tanky-v1').every(s=>s.x>2),'Tan Ky is east of the reference bridge');
  assert.ok(parcelCandidates(city,'ha-quangtrieu-v1').every(s=>s.x>2),'Quang Trieu is east of the reference bridge');
  assert.ok(parcelCandidates(city,'ha-phunghung-v1').every(s=>s.x<2),'Phung Hung is west of the reference bridge');
  assert.ok(parcelCandidates(city,'ha-campho-v1').every(s=>s.x<2),'Cam Pho remains on the western side');
});

test('new parcels preserve every historical plot and completed fact; append cannot move an accepted site',()=>{
  const old={id:'old',at:T0-1000,kind:'build.plan',data:{planId:'museum',blueprint:'e1-0',plot:{x:0,y:0}}};
  const log=[old,...Array.from({length:4},(_,i)=>focus(`old-work-${i}`,T0+i*30*MIN,25)).flat()],original=replay(log),before=JSON.stringify(log);
  const event=plan(original,'new','ha-tanky-v1',T0+121*MIN);
  assert.equal(event.data.workVersion,2);
  const city=replay([...log,event]);
  assert.deepEqual(city.buildings[0],original.buildings[0]);
  const accepted=city.buildings[1];assert.deepEqual(accepted.site,event.data.site);
  assert.deepEqual(accepted.plot,{x:accepted.site.x/4,y:accepted.site.z/4});
  const second=plan(city,'second','ha-quangtrieu-v1',T0+122*MIN);
  const appended=replay([...log,event,second]);
  assert.deepEqual(appended.buildings[1],accepted);assert.equal(JSON.stringify(log),before);
  assert.ok(!parcelsOverlap(buildingParcel(appended.buildings[0]),accepted.site));
});

test('two devices choosing the same site resolve deterministically without moving the earlier plan',()=>{
  const city=replay([]),first=plan(city,'a'),second=plan(city,'b','ha-tanky-v1',T0+1,first.data.site);
  const a=replay([first,second]),b=replay([second,first]);
  assert.deepEqual(a.buildings,b.buildings);
  assert.deepEqual(a.buildings[0].site,first.data.site);
  assert.ok(!parcelsOverlap(a.buildings[0].site,a.buildings[1].site));
  assert.deepEqual(a.buildings[1].requestedSite,first.data.site);
  assert.equal(cmdPlan(a,T0+2,{planId:'bad',blueprintKey:'ha-tanky-v1',site:first.data.site}),null);
});

test('shared legacy cell reservations survive cancellation of one adjacent parcel and release when both cancel',()=>{
  const first=plan(replay([]),'a');let city=replay([first]);
  const second=plan(city,'b','ha-tanky-v1',T0+1);city=replay([first,second]);
  const common=parcelCells(first.data.site).filter(a=>parcelCells(second.data.site).some(b=>a.x===b.x&&a.y===b.y));
  assert.ok(common.length>0,'fixture covers shared conservative reservations');
  const cancelA=cmdCancelPlan(city,T0+2,'a'),one=replay([first,second,cancelA]);
  for(const cell of common)assert.ok(one.occupied.has(`${cell.x},${cell.y}`));
  for(const candidate of one.candidates)assert.ok(!parcelsOverlap({x:candidate.x*4,z:candidate.y*4,width:3.9,depth:3.2},second.data.site));
  const cancelB=cmdCancelPlan(one,T0+3,'b'),empty=replay([first,second,cancelA,cancelB]);
  assert.equal(empty.occupied.size,0);assert.deepEqual(empty.candidates,[{x:0,y:0}]);
});

test('parcel plans conserve exact completed-focus overflow, exclude cancelled work and reject cancellation after credit',()=>{
  const first=plan(replay([]),'a'),second=plan(replay([first]),'b','ha-tanky-v1',T0+1);
  const cancelled=[{id:'cancel-start',at:T0+2,kind:'focus.start',data:{sid:'cancelled',targetMin:25}},{id:'cancel-end',at:T0+3,kind:'focus.cancel',data:{sid:'cancelled'}}];
  const city=replay([first,second,...cancelled,...focus('earned',T0+MIN,150)]);
  assert.equal(city.buildings[0].workMs,100*MIN);assert.equal(city.buildings[1].workMs,50*MIN);
  assert.equal(city.buildings.flatMap(b=>b.bricks).reduce((sum,b)=>sum+b.creditedMs,0),150*MIN);
  assert.equal(cmdCancelPlan(city,T0+200*MIN,'a'),null);
  assert.equal(cmdCancelPlan(city,T0+200*MIN,'b'),null);
  assert.deepEqual(city.buildings[0].site,first.data.site);
  const malformed={...first,id:'bad',data:{...first.data,planId:'bad',site:{...first.data.site,z:0}}};
  assert.equal(replay([malformed]).buildings.length,0);
  assert.equal(replay([{...first,data:{...first.data,workUnit:undefined}}]).buildings.length,0,'parcel geometry cannot bypass minute accounting');
});
