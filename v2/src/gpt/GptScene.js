import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { CityScene } from '../city/CityScene.js';
import { plotBounds, plotCenter, PLOT } from '../city/layout.js';
import { hash01, constructionProgress, candidatePlots } from '../engine/city.js';
import { heritageOf } from '../engine/catalog.js';
import { fitHeritageQuay, heritageFootprints } from './heritage.js';
import { drawHoiAnBuilding } from './hoian.js';
import { MAP_ROADS, mapPoint, mapReference } from '../engine/hoianMap.js';
import { TANKY_NEIGHBOURS } from './world.js';
import mappedContext from './hoian-buildings.json' with { type: 'json' };
import { architectureOf, DEFAULT_APPEARANCE, PLACES, snowIn, streetJourney, journeyAt, projectGptCity, riverSite, riverCandidates, tradeAt, bridgeWalkHeight } from './art.js';

function balconyPanelGeometry() {
  const panel=new THREE.Shape().moveTo(-.5,-.5).lineTo(.5,-.5).lineTo(.5,.5).lineTo(-.5,.5).closePath();
  for(let i=0;i<8;i++) {
    const hole=new THREE.Path();hole.absellipse((i-3.5)/8,0,.035,.30,0,Math.PI*2,true);panel.holes.push(hole);
  }
  return new THREE.ExtrudeGeometry(panel,{depth:1,bevelEnabled:false,curveSegments:10}).translate(0,0,-.5);
}

function archMouldingGeometry() {
  const arch=new THREE.Shape().moveTo(-.5,0).quadraticCurveTo(0,.5,.5,0)
    .lineTo(.44,-.015).quadraticCurveTo(0,.40,-.44,-.015).closePath();
  return new THREE.ExtrudeGeometry(arch,{depth:1,bevelEnabled:false,curveSegments:12}).translate(0,0,-.5);
}

const GEO = {
  surveyBalustrade: balconyPanelGeometry(),
  surveyArch: archMouldingGeometry(),
  detailBox: new THREE.BoxGeometry(1,1,1),
  mapBlock: new THREE.BoxGeometry(1,1,1),
  torso: new THREE.LatheGeometry([[.68,-.5],[.78,-.43],[.65,-.15],[.85,.24],[.74,.4],[.4,.5]].map(p=>new THREE.Vector2(...p)),10),
  vase: new THREE.LatheGeometry([[.45,-.5],[.75,-.43],[1,-.12],[.9,.18],[.58,.32],[.55,.47],[.7,.5],[.56,.5],[.47,.31]].map(p=>new THREE.Vector2(...p)),16),
  bowl: new THREE.LatheGeometry([[0,-.5],[.4,-.45],[1,.5],[.88,.5],[.3,-.32],[0,-.32]].map(p=>new THREE.Vector2(...p)),16),
  cloth: new THREE.PlaneGeometry(1,1,6,3).rotateX(-Math.PI/2),
  hat: new THREE.ConeGeometry(1,1,18),
  hip: new THREE.ConeGeometry(1,1,4).rotateY(Math.PI/4),
  hoop: new THREE.TorusGeometry(1,.075,6,24),
  box: new RoundedBoxGeometry(1, 1, 1, 2, 0.04),
  orb: new THREE.SphereGeometry(1, 12, 9),
  pole: new THREE.CylinderGeometry(1, 1, 1, 10),
  roofTile: new THREE.CylinderGeometry(1, 1, 1, 8, 1, true, Math.PI/2, Math.PI),
  taper: new THREE.CylinderGeometry(0.68, 1, 1, 4).rotateY(Math.PI / 4),
};
const clothPositions=GEO.cloth.attributes.position;
for(let i=0;i<clothPositions.count;i+=1)clothPositions.setY(i,Math.sin(clothPositions.getX(i)*Math.PI*6)*.045*(clothPositions.getZ(i)+.5));
GEO.cloth.computeVertexNormals();
// Curved leaf silhouettes give foliage a broken, organic edge instead of sphere clusters.
const leafShape=new THREE.Shape();
leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.45,.25,-.4,.7,0,1);
leafShape.bezierCurveTo(.4,.7,.45,.25,0,0);
const leafGeometry=new THREE.ShapeGeometry(leafShape,8);
const leafPos=leafGeometry.attributes.position;
for(let i=0;i<leafPos.count;i+=1) leafPos.setZ(i,Math.sin(leafPos.getY(i)*Math.PI)*.055);
leafGeometry.computeVertexNormals();
GEO.leaf = leafGeometry;
const distantLeafGeometry=new THREE.ShapeGeometry(leafShape,3);
const distantLeafPos=distantLeafGeometry.attributes.position;
for(let i=0;i<distantLeafPos.count;i+=1)distantLeafPos.setZ(i,Math.sin(distantLeafPos.getY(i)*Math.PI)*.055);
distantLeafGeometry.computeVertexNormals();
// Shared leaf sprays preserve the fine silhouette without rebuilding every leaf per tree.
for(let color=0;color<3;color+=1) {
  const leaves=[],distant=[];
  for(let i=0;i<310;i+=1) {
    if((i<80?0:i%3)!==color)continue;
    const u=hash01(`spray:${i}:u`),v=hash01(`spray:${i}:v`),theta=u*Math.PI*2;
    const radius=Math.sqrt(v)*(i<80?.2:.38);
    const matrix=new THREE.Matrix4().compose(
      new THREE.Vector3(Math.cos(theta)*radius,(hash01(`spray:${i}:y`)-.4)*.38,Math.sin(theta)*radius),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(u*5,v*6,theta)),
      new THREE.Vector3(.055+v*.025,.08+u*.04,.075),
    );
    leaves.push(leafGeometry.clone().applyMatrix4(matrix));
    if(Math.floor(i/3)%3===0) {
      const coarse=distantLeafGeometry.clone().scale(1.6,1.6,1.6).applyMatrix4(matrix);
      distant.push(coarse);
    }
  }
  GEO[`leafSpray${color}`]=mergeGeometries(leaves);
  GEO[`leafSpray${color}Distant`]=mergeGeometries(distant);
  leaves.forEach(leaf=>leaf.dispose());distant.forEach(leaf=>leaf.dispose());
}


// Retain only immutable CPU canvases across scene mounts; GPU textures remain scene-owned.
const SURFACE_CANVASES=new Map();
function surfaceMaps(canvases) {
  const maps=canvases.map((canvas,i)=>{const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(i===0)t.colorSpace=THREE.SRGBColorSpace;return t;});
  return {color:maps[0],height:maps[1],roughness:maps[2]};
}
// Deterministic, locally generated material relief: no remote assets or loading dependencies.
function surfaceTexture(kind) {
  if(SURFACE_CANVASES.has(kind))return surfaceMaps(SURFACE_CANVASES.get(kind));
  const size=512;
  const canvases=Array.from({length:3},()=>{const c=document.createElement('canvas');c.width=c.height=size;return c;});
  const contexts=canvases.map(c=>c.getContext('2d'));
  const pixels=contexts.map(ctx=>ctx.createImageData(size,size));
  const random=(x,y)=>{let n=Math.imul(x+19,374761393)^Math.imul(y+71,668265263);n=Math.imul(n^(n>>>13),1274126177);return ((n^(n>>>16))>>>0)/4294967295;};
  const noise=(x,y,cells)=>{
    const px=x/size*cells,py=y/size*cells,ix=Math.floor(px),iy=Math.floor(py);
    const sx=px-ix,sy=py-iy,u=sx*sx*(3-2*sx),v=sy*sy*(3-2*sy);
    const at=(dx,dy)=>random((ix+dx)%cells,(iy+dy)%cells);
    return (at(0,0)*(1-u)+at(1,0)*u)*(1-v)+(at(0,1)*(1-u)+at(1,1)*u)*v;
  };
  for(let y=0;y<size;y+=1) for(let x=0;x<size;x+=1) {
    const broad=noise(x,y,5),fine=noise(x,y,31),grit=random(x,y);
    let shade=.78+(broad-.5)*.2+(fine-.5)*.1+(grit-.5)*.04;
    let relief=.5+(fine-.5)*.23+(grit-.5)*.12,rough=.86+(fine-.5)*.16;
    if(kind==='timber') {
      const warp=Math.sin(y/size*Math.PI*4)*5+(broad-.5)*24;
      const grain=Math.sin((x+warp)/size*Math.PI*78+Math.sin(y/size*Math.PI*6)*1.5);
      const pore=Math.pow(Math.max(0,grain),12);
      const knot=Math.exp(-Math.pow((x-178)/24,2)-Math.pow((y-290)/60,2));
      shade=.74+(broad-.5)*.18-pore*.12-knot*.19;
      relief=.5-pore*.13+(fine-.5)*.12;rough=.72+pore*.14+(fine-.5)*.16;
    }
    if(kind==='paving') {
      const row=Math.floor(y/64),px=(x+(row%2)*32)%64,py=y%64;
      const joint=px<2 || py<2;
      const slab=random(Math.floor((x+(row%2)*32)/64),row);
      shade=joint?.4:.76+(slab-.5)*.19+(fine-.5)*.11+(grit-.5)*.035;
      relief=joint?.16:.53+(fine-.5)*.12;rough=joint?.98:.83+(fine-.5)*.17;
    }
    if(kind==='plaster') {
      const eroded=Math.max(0,.38-broad)*.65;
      shade=.89+(broad-.5)*.17+(fine-.5)*.08-eroded;
      relief=.53+(fine-.5)*.13-eroded*.4;rough=.91;
    }
    if(kind==='tile') {
      shade=.81+(broad-.5)*.27+(fine-.5)*.13;
      relief=.5+(fine-.5)*.12;rough=.82+(broad-.5)*.2;
    }
    const offset=(y*size+x)*4;
    const warm=kind==='timber'?[1,.96,.88]:kind==='stone'?[.98,1,.99]:[1,.99,.95];
    for(let channel=0;channel<3;channel+=1) {
      pixels[0].data[offset+channel]=Math.round(shade*255*warm[channel]);
      pixels[1].data[offset+channel]=Math.round(relief*255);
      pixels[2].data[offset+channel]=Math.round(rough*255);
    }
    for(const data of pixels) data.data[offset+3]=255;
  }
  canvases.forEach((canvas,i)=>contexts[i].putImageData(pixels[i],0,0));
  SURFACE_CANVASES.set(kind,canvases);
  return surfaceMaps(canvases);
}

// Material roles include the independently shaded quay stones and boat timbers.
const SURFACES=new Map([
  ...['#526a5d','#958d79','#a69c85','#afa58e','#b3a68f'].map(key=>[key,'stone']),
  ...['#70503b','#a57c53','#af8c58'].map(key=>[key,'timber']),
]);

const archShape=new THREE.Shape();
archShape.moveTo(-.5,-.5); archShape.lineTo(.5,-.5); archShape.lineTo(.5,0);
archShape.absarc(0,0,.5,0,Math.PI,false); archShape.lineTo(-.5,-.5);
GEO.arch=new THREE.ExtrudeGeometry(archShape,{depth:1,bevelEnabled:false,curveSegments:16}).translate(0,0,-.5);
const UP = new THREE.Vector3(0, 1, 0);

function geometryKind(kind,scale) {
  return kind==='box' && Math.min(...scale)<.09?'detailBox':kind;
}

/** Same canvas lifecycle, picking and camera navigation as v2; a separate art layer only. */
export class GptScene extends CityScene {
  constructor(canvas,options) {
    // The scene already resolves 4x MSAA in the composer. Antialiasing its final fullscreen quad is redundant.
    super(canvas,{...options,antialias:false});
    this.controls.minDistance=2.2;
  }
  focusParcel(site,ms=700) {
    const radius=Math.max(5,Math.hypot(site.width,site.depth)*.9),angle=site.yaw+.35;
    this.flyTo({target:{x:site.x,y:.2,z:site.z},position:{x:site.x+Math.sin(angle)*radius,y:Math.max(5,radius*.75),z:site.z+Math.cos(angle)*radius}},ms);
    this.renderDirty=true;
  }
  setModel(model) {
    model={...model,city:projectGptCity(model.city)};
    if(model.placementBlueprint!==this.model?.placementBlueprint||JSON.stringify(model.placementSites)!==JSON.stringify(this.model?.placementSites))this.signature='';
    if (model.selectedPlan !== this.model?.selectedPlan) this.renderDirty=true;
    const signature = JSON.stringify({ ...model.appearance, motion: undefined });
    if (signature !== this.appearanceSignature) {
      this.appearanceSignature = signature;
      this.signature = '';
    }
    if (this.a && model.appearance) this.a.motion = model.appearance.motion;
    super.setModel(model);
  }

  /** GPT-only framing: choose a clear approach instead of a fixed view through the next roof. */
  focusBuilding(planId, ms=1400) {
    const b=this.model?.city.buildings.find(item=>item.planId===planId);
    if(!b)return;
    const c=plotCenter(b.plot),craft=['ha-thanhha-v1','ha-kimbong-v1','ha-cho-v1'].includes(b.key);
    const target={x:c.x,y:b.shape==='tower'?1.65:craft?.78:1.15,z:c.z};
    const radius=(b.shape==='tower'?5.2:craft?4.15:4.6)*Math.max(1,b.world?.sx??1,(b.world?.sz??1)*.8),eye=(b.shape==='tower'?3.8:craft?1.8:2.85)*(b.site?Math.sqrt(Math.max(1,b.world?.sz??1)):1);
    let best=null;
    for(let i=0;i<12;i++) {
      const angle=(b.site?b.site.yaw:b.riverBridge?(b.world?.yaw??Math.PI/2):0)+(i-5.5)*Math.PI/18,position={x:c.x+Math.sin(angle)*radius,y:eye,z:c.z+Math.cos(angle)*radius};
      let score=0;
      for(const other of this.model.city.buildings) {
        if(other.planId===planId||constructionProgress(other)<.18)continue;
        const p=plotCenter(other.plot),dx=position.x-c.x,dz=position.z-c.z;
        const u=Math.max(0,Math.min(1,((p.x-c.x)*dx+(p.z-c.z)*dz)/(dx*dx+dz*dz)));
        const clearance=Math.hypot(p.x-c.x-dx*u,p.z-c.z-dz*u);
        const radius=this.model.city.geoPlan?Math.hypot((other.site?.width??3.8*(other.world?.sx??1))/2,(other.site?.depth??3.2*(other.world?.sz??1))/2)+.2:1.65;
        if(u>.16 && clearance<radius && target.y+(position.y-target.y)*u<3.2)score+=(radius-clearance)*5;
      }
      if(this.model.city.geoPlan)for(const block of this.mapContext||[]) {
        const dx=position.x-c.x,dz=position.z-c.z;
        const u=Math.max(0,Math.min(1,((block.x-c.x)*dx+(block.z-c.z)*dz)/(dx*dx+dz*dz)));
        const clearance=Math.hypot(block.x-c.x-dx*u,block.z-c.z-dz*u),radius=Math.hypot(block.width,block.depth)/2;
        if(u>.12&&clearance<radius&&target.y+(position.y-target.y)*u<2)score+=(radius-clearance)*3;
      }
      for(const crown of this.treeCrowns||[]) {
        const dx=position.x-c.x,dy=position.y-target.y,dz=position.z-c.z;
        const u=Math.max(0,Math.min(1,((crown.x-c.x)*dx+(crown.y-target.y)*dy+(crown.z-c.z)*dz)/(dx*dx+dy*dy+dz*dz)));
        const distance=Math.hypot(crown.x-c.x-dx*u,crown.y-target.y-dy*u,crown.z-c.z-dz*u);
        if(u>.12 && distance<crown.r)score+=(crown.r-distance)*4;
      }
      score+=Math.abs((i-5.5)*Math.PI/18)*.07;
      if(!best||score<best.score)best={position,target,score};
    }
    if(this.model.city.geoPlan&&best.score>2)best.position.y+=Math.min(4,best.score*.4);
    this.flyTo(best,ms);this.renderDirty=true;
  }

  viewQuarter(mode,ms=1000) {
    if(this.model.city.geoPlan&&mode!=='market') {
      this.flyTo(mode==='bridge'?{target:{x:0,y:.8,z:0},position:{x:6,y:4,z:7}}:{target:{x:48,y:.7,z:23},position:{x:59,y:6,z:31}},ms);this.renderDirty=true;return;
    }
    const frames={river:{target:{x:0,y:.7,z:-2},position:{x:8.6,y:4.4,z:-1.7}},bridge:{target:{x:2,y:.85,z:-2},position:{x:-4.2,y:3.7,z:-1.8}}};
    if(mode==='market' && this.trades?.length) {
      const trade=this.trades.find(t=>t.market)||this.trades[0];
      this.flyTo({target:{x:trade.x-.2,y:.48,z:trade.z+.14},position:{x:trade.x-.85,y:1.25,z:trade.z+2.35}},ms);this.renderDirty=true;return;
    }
    if(mode==='bridge') {
      const bridge=this.model.city.buildings.find(b=>b.riverBridge);
      if(bridge){this.focusBuilding(bridge.planId,ms);return;}
    }
    if(mode==='river'&&this.model.city.futurePlan)frames.river={target:{x:0,y:.8,z:10},position:{x:26,y:13,z:32}};
    else if(mode==='river'&&this.model.city.buildings.some(b=>b.site)){
      const site=this.model.city.buildings.find(b=>b.site?.district==='oldtown')?.site||this.model.city.buildings.find(b=>b.site).site;
      frames.river={target:{x:site.x,y:.7,z:-2},position:{x:site.x+8.6,y:4.4,z:-1.7}};
    }
    if(frames[mode]){this.flyTo(frames[mode],ms);this.renderDirty=true;}
  }

  rebuild() {
    this.clearWorld();
    // Preserve the 40 Hz budget, carrying fractional frame time instead of dropping alternate 60 Hz callbacks.
    this.frameInterval=1000/40;
    if(import.meta.env.DEV && new URLSearchParams(location.search).get('bench')==='gpt'){this.renderer.setPixelRatio(2);this.resize();}
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.05;
    this.renderer.shadowMap.type=THREE.PCFShadowMap;
    this.mats.ring.color.set('#b89b63');this.mats.ring.opacity=.28;
    this.bodies = null;
    this.storeys = null;
    this.windows = null;
    this.drop = null;
    this.plotTiles = null;
    this.batches = new Map();
    this.artMaterials = new Map();
    this.textures ??= new Map();
    this.actors = [];
    this.treeCrowns = [];
    this.trades = [];
    this.detailBatches = [];
    this.detailView = null;
    this.shopPools = [];
    this.windTime = {value:this.motionTime||0};
    this.actorBatches = [];
    this.a = { ...(this.model.appearance || DEFAULT_APPEARANCE) };
    this.palette = PLACES[this.a.place] || PLACES.hoian;
    this.snow = snowIn(this.a);
    const extentCandidates=[...this.model.city.candidates,...this.model.city.buildings.filter(b=>b.sourcePlot).map(b=>b.sourcePlot)];
    if(this.model.placementSites)extentCandidates.push(...this.model.placementSites.flatMap(s=>[{x:(s.x-s.width/2)/4,y:(s.z-s.depth/2)/4},{x:(s.x+s.width/2)/4,y:(s.z+s.depth/2)/4}]));
    else if(this.model.placementBlueprint==='ha-chuacau-v1')extentCandidates.push(...riverCandidates(this.model.city.candidates).map(plot=>({x:riverSite(plot).x/4,y:-.5})));
    const legacy=this.model.city.buildings.filter(b=>!b.site).map(b=>b.sourcePlot?{...b,plot:b.sourcePlot}:b);
    const landCandidates=this.model.city.buildings.some(b=>b.site)?candidatePlots(new Map(legacy.map(b=>[`${b.plot.x},${b.plot.y}`,b.planId]))):this.model.city.candidates;
    this.landBounds=plotBounds(legacy,landCandidates);
    const bounds=plotBounds(this.model.city.buildings,extentCandidates);
    this.bounds={minX:Math.floor(bounds.minX),maxX:Math.ceil(bounds.maxX),minY:Math.floor(bounds.minY),maxY:Math.ceil(bounds.maxY)};
    this.bridgeRotations=new Map(this.model.city.buildings.filter(b=>b.riverBridge||b.world).map(b=>{
      const c=plotCenter(b.plot),matrix=new THREE.Matrix4().makeTranslation(c.x,0,c.z)
        .multiply(new THREE.Matrix4().makeRotationY(b.world?.yaw??Math.PI/2)).multiply(new THREE.Matrix4().makeScale(b.world?.sx??1,b.world?.sy??1,b.world?.sz??1)).multiply(new THREE.Matrix4().makeTranslation(-c.x,0,-c.z));
      return [b.planId,matrix];
    }));
    this.heritageQuays=new Map(this.model.city.buildings.filter(b=>!b.site&&!this.model.city.futurePlan&&heritageOf(b.key)&&(b.plot.y===0||b.plot.y===-1)).map(b=>[b.planId,plotCenter(b.plot).z]));
    this.buildLandscape();
    this.buildSky();
    for (const b of this.model.city.buildings) this.buildHouse(b);
    if(this.model.city.futurePlan){
      this.buildFutureLife();
      if(this.model.city.geoPlan){
        this.buildStreetscape(this.model.city.buildings.filter(b=>!b.site&&!b.illustrative));
        this.buildParcelLife(this.model.city.buildings.filter(b=>b.site?.version===1));
      }
    }else if(this.a.place==='hoian'){this.buildStreetscape();this.buildParcelLife();}
    if(this.model.picking&&this.model.placementSites)for(const site of this.model.placementSites) {
      const pick={type:'parcel',site},bridge=this.model.placementBlueprint==='ha-chuacau-v1';
      const front=site.z+(bridge?1:Math.cos(site.yaw))*site.depth/2;
      this.part('box','candidate',[site.x,.09,site.z],[site.width,.08,site.depth],[0,0,0],pick);
      // A bounded floor plan makes the actual land area and street-facing entrance readable.
      for(const side of [-1,1]) {
        this.part('box','#45695c',[site.x+side*site.width/2,.15,site.z],[.045,.05,site.depth],[0,0,0],pick);
        this.part('box','#45695c',[site.x,.15,site.z+side*site.depth/2],[site.width,.05,.045],[0,0,0],pick);
      }
      this.part('box','#e0d8b8',[site.x,.18,front],[Math.min(1.2,site.width*.4),.07,.24],[0,0,0],pick);
      if(bridge)this.part('box','#e0d8b8',[site.x,.18,site.z-site.depth/2],[Math.min(1.2,site.width*.4),.07,.24],[0,0,0],pick);
      const sx=bridge?1:site.width/3.8,sz=bridge?1:site.depth/3.2,cos=Math.cos(site.yaw),sin=Math.sin(site.yaw);
      for(const [x,z,w,d] of heritageFootprints(this.model.placementBlueprint,site)||[[0,0,3,2]]) {
        this.part('box','#8e9b86',[site.x+x*sx*cos+z*sz*sin,.17,site.z-x*sx*sin+z*sz*cos],[w*sx,.075,d*sz],[0,site.yaw,0],pick);
      }
    }
    if (this.model.picking&&!this.model.placementSites) {
      for (const plot of this.model.placementBlueprint==='ha-chuacau-v1'?riverCandidates(this.model.city.candidates):this.model.city.candidates) {
        const bridge=this.model.placementBlueprint==='ha-chuacau-v1';
        const p=bridge?riverSite(plot):plotCenter(plot);
        this.part('box', 'candidate', [p.x,bridge?.3:.07,p.z], bridge?[.82,.08,3.25]:[2.8,.08,2.8], [0, 0, 0], { type: 'plot', plot });
      }
    }
    // Every original session remains independently selectable in the building's front mosaic.
    for (const b of this.model.city.buildings) {
      const c = plotCenter(b.plot);
      b.bricks.forEach((brick, i) => {
        const color = brick.kind === 'gold' ? '#dab762' : this.model.categories.get(brick.categoryId)?.color || '#71978b';
        const rows=Math.max(1,Math.ceil(b.bricks.length/8));
        const position=b.riverBridge?[c.x-1.05+(i%8)*.3,.382,c.z-.24+(Math.floor(i/8)+.5)*.48/rows]:[c.x-.85+(i%6)*.3,.12,c.z+1.14+Math.floor(i/6)*.16];
        this.part('box',color,position,b.riverBridge?[.23,.025,.38/rows]:[.23,.06,.12],[0,0,0],{type:'brick',brick,planId:b.planId});
      });
    }
    this.model.city.pile.forEach((brick, i) => {
      this.part('box', '#b77852', [1.6 + (i % 3) * 0.2, 0.12 + Math.floor(i / 9) * 0.1, 1.6 + (Math.floor(i / 3) % 3) * 0.2], [0.17, 0.09, 0.17], [0, 0, 0], { type: 'brick', brick });
    });
    this.buildMilestones();
    this.flushParts();
    this.createWeather();
    this.fitShadow(this.bounds);
    this.applySky(true);
    this.animatePeople(this.motionTime||0);
    this.renderer.shadowMap.autoUpdate=false;
    this.renderer.shadowMap.needsUpdate=true;
  }

  material(key) {
    if (this.artMaterials.has(key)) return this.artMaterials.get(key);
    const p = this.palette;
    const colors = { lanternRed:'#b9442a', plaster: p.wall, timber: p.wood, tile: this.snow ? '#e6e8e1' : p.roof, stone: '#a2a297', paving: this.snow ? '#d9ded9' : '#b9b09a', leaf: this.snow ? '#a5b8a5' : this.a.season === 'autumn' ? '#b0803e' : p.leaf, flower: this.a.season === 'spring' ? '#e5b2bc' : p.flower, glow: '#e6ac56', iron: '#3b514a', candidate: '#d6b96b' };
    const mat = new THREE.MeshStandardMaterial({ color: colors[key] || (key.startsWith('foliage:') ? key.slice(8) : key.startsWith('cloth:') ? key.slice(6) : key.startsWith('wall:') ? key.slice(5) : key.startsWith('tile:') ? (this.snow?'#e6e8e1':key.slice(5)) : key), roughness: this.a.weather === 'rain' ? 0.5 : 0.87 });
    const textureKey=key.startsWith('wall:') ? 'plaster' : key.startsWith('tile:') ? 'tile' : SURFACES.get(key)||key;
    if (['plaster','timber','tile','stone','paving'].includes(textureKey)) {
      if (!this.textures.has(textureKey)) {
        const maps=surfaceTexture(textureKey);this.textures.set(textureKey,maps);
      }
      const maps=this.textures.get(textureKey);
      mat.map=maps.color;mat.bumpMap=maps.height;mat.roughnessMap=maps.roughness;
      mat.bumpScale=textureKey==='stone'?.018:textureKey==='paving'?.022:.012;
      mat.roughness=this.a.weather==='rain'?.57:1;
      if(textureKey==='stone' || textureKey==='paving' || textureKey==='plaster') {
        // World-space colour/roughness remove the miniature brick pattern stretched on every stone.
        mat.onBeforeCompile=shader=>{
          shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vStonePosition; varying vec3 vStoneNormal;');
          shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
            vec4 stonePosition=vec4(position,1.);
            vec3 stoneNormal=normal;
            #ifdef USE_INSTANCING
            stonePosition=instanceMatrix*stonePosition;
            stoneNormal=mat3(instanceMatrix)*stoneNormal;
            #endif
            vStonePosition=(modelMatrix*stonePosition).xyz;
            vStoneNormal=normalize(mat3(modelMatrix)*stoneNormal);
          `);
          shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vStonePosition; varying vec3 vStoneNormal;');
          const uv='(abs(vStoneNormal.y)>.5?vStonePosition.xz:abs(vStoneNormal.x)>.5?vStonePosition.zy:vStonePosition.xy)*.5';
          shader.fragmentShader=shader.fragmentShader
            .replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replaceAll('vMapUv',uv))
            .replace('#include <roughnessmap_fragment>',THREE.ShaderChunk.roughnessmap_fragment.replaceAll('vRoughnessMapUv',uv))
            .replace('#include <bumpmap_pars_fragment>',THREE.ShaderChunk.bumpmap_pars_fragment.replaceAll('vBumpMapUv',uv));
          if(textureKey==='plaster') {
            shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
              float plasterNoise(vec2 p) {
                vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
                vec4 h=fract(sin(vec4(dot(i,vec2(127.1,311.7)),dot(i+vec2(1.,0.),vec2(127.1,311.7)),dot(i+vec2(0.,1.),vec2(127.1,311.7)),dot(i+vec2(1.,1.),vec2(127.1,311.7))))*43758.5453);
                return mix(mix(h.x,h.y,f.x),mix(h.z,h.w,f.x),f.y);
              }
            `);
            shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
              vec2 wallUv=abs(vStoneNormal.x)>.5?vStonePosition.zy:vStonePosition.xy;
              float plasterWear=plasterNoise(wallUv*2.7);
              float damp=exp(-max(0.,vStonePosition.y-.18)*3.5);
              float streak=plasterNoise(vec2(wallUv.x*9.,wallUv.y*.65));
              float weather=damp*(.14+streak*.23)+smoothstep(.62,.86,plasterWear)*.12;
              diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.57,.62,.52),weather);
            `);
          }
        };
        mat.customProgramCacheKey=()=> `gpt-world-${textureKey}-v3`;
      } else if(textureKey==='timber') {
        mat.onBeforeCompile=shader=>{
          shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec2 vWoodOffset;');
          shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
            vec4 woodOrigin=vec4(0.,0.,0.,1.);
            #ifdef USE_INSTANCING
            woodOrigin=instanceMatrix*woodOrigin;
            #endif
            vec3 woodWorld=(modelMatrix*woodOrigin).xyz;
            vWoodOffset=fract(sin(vec2(dot(woodWorld,vec3(12.9898,78.233,37.719)),dot(woodWorld,vec3(39.346,11.135,83.155))))*43758.5453);
          `);
          shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec2 vWoodOffset;');
          shader.fragmentShader=shader.fragmentShader
            .replace('#include <map_fragment>',THREE.ShaderChunk.map_fragment.replaceAll('vMapUv','(vMapUv+vWoodOffset)'))
            .replace('#include <roughnessmap_fragment>',THREE.ShaderChunk.roughnessmap_fragment.replaceAll('vRoughnessMapUv','(vRoughnessMapUv+vWoodOffset)'))
            .replace('#include <bumpmap_pars_fragment>',THREE.ShaderChunk.bumpmap_pars_fragment.replaceAll('vBumpMapUv','(vBumpMapUv+vWoodOffset)'));
        };
        mat.customProgramCacheKey=()=> 'gpt-wood-grain-v1';
      }
    }
    if(key.startsWith('cloth:')) {mat.side=THREE.DoubleSide;mat.roughness=1;}
    if (key.startsWith('foliage') || key === 'flower') { mat.side=THREE.DoubleSide; mat.roughness=1; }
    if (key === 'glow' || key === 'lanternRed') { mat.emissive.set(key==='glow'?'#ffba62':'#ff6427'); mat.emissiveIntensity = 0.55; }
    if(key.startsWith('foliage:') || key.startsWith('cloth:') || key==='lanternRed') {
      const fabric=key.startsWith('cloth:');
      mat.onBeforeCompile=shader=>{
        shader.uniforms.uBreeze=this.windTime;
        shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nuniform float uBreeze;');
        shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
          vec3 breezeOrigin=vec3(0.);
          #ifdef USE_INSTANCING
          breezeOrigin=instanceMatrix[3].xyz;
          #endif
          float breezePhase=dot(breezeOrigin.xz,vec2(.73,.51));
          transformed.${fabric?'y':'x'}+=sin(uBreeze*.85+breezePhase)*${fabric?'.06*(position.z+.5)':'.015'};
        `);
      };
      mat.customProgramCacheKey=()=>`gpt-breeze-${fabric?'cloth':'leaf'}-v1`;
    }
    if (key === 'candidate') { mat.transparent = true; mat.opacity = 0.5; }
    this.artMaterials.set(key, mat);
    this.disposables.push(mat);
    return mat;
  }

  part(kind, material, position, scale, rotation = [0, 0, 0], pick = null, quaternion = null) {
    // Subpixel bevels on thin boards/slabs add many invisible triangles; keep the full large forms.
    kind=geometryKind(kind,scale);
    const key = `${kind}:${material}`;
    if (!this.batches.has(key)) this.batches.set(key, { kind, geo: GEO[kind], mat: this.material(material), parts: [] });
    const q = quaternion || new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...position), q, new THREE.Vector3(...scale));
    const planId=pick?.planId||this.activeBridge;
    fitHeritageQuay(matrix,this.heritageQuays?.get(planId));
    const bridgeRotation=this.bridgeRotations?.get(planId);
    if(bridgeRotation)matrix.premultiply(bridgeRotation);
    this.batches.get(key).parts.push({ matrix, pick });
  }

  beam(mat, from, to, radius = 0.035, pick = null) {
    const a = new THREE.Vector3(...from);
    const b = new THREE.Vector3(...to);
    const d = b.clone().sub(a);
    this.part('pole', mat, a.add(b).multiplyScalar(0.5).toArray(), [radius, d.length(), radius], [0, 0, 0], pick, new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()));
  }

  flushParts() {
    const glowCanvas=document.createElement('canvas');glowCanvas.width=glowCanvas.height=64;
    const ctx=glowCanvas.getContext('2d');
    const gradient=ctx.createRadialGradient(32,32,0,32,32,32);
    gradient.addColorStop(0,'rgba(255,213,143,.8)');gradient.addColorStop(.2,'rgba(255,180,90,.3)');gradient.addColorStop(1,'rgba(255,150,50,0)');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);
    const glowTexture=new THREE.CanvasTexture(glowCanvas);
    this.haloMaterial=new THREE.MeshBasicMaterial({map:glowTexture,color:'#ffcb87',blending:THREE.AdditiveBlending,transparent:true,opacity:.15,depthWrite:false,toneMapped:false});
    this.poolMaterial=new THREE.MeshBasicMaterial({map:glowTexture,color:'#ffbd6d',blending:THREE.AdditiveBlending,transparent:true,opacity:.2,depthWrite:false,toneMapped:false});
    const haloGeometry=new THREE.PlaneGeometry(1,1);
    this.haloMaterial.onBeforeCompile=shader=>{
      shader.vertexShader=shader.vertexShader.replace('#include <project_vertex>',`
        vec4 mvPosition=modelViewMatrix*vec4(instanceMatrix[3].xyz,1.);
        mvPosition.xy+=position.xy*vec2(length(instanceMatrix[0].xyz),length(instanceMatrix[1].xyz));
        gl_Position=projectionMatrix*mvPosition;
      `);
    };
    this.haloMaterial.customProgramCacheKey=()=> 'gpt-batched-billboard-halos-v1';
    const poolGeometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
    this.disposables.push(glowTexture,this.haloMaterial,this.poolMaterial,poolGeometry,haloGeometry);
    for (const { kind, geo, mat, parts } of this.batches.values()) {
      if(kind.startsWith('leafSpray')) {
        // Spatial crown batches can be culled behind the camera in both view and shadow passes.
        const cells=new Map();
        for(const part of parts) {
          const e=part.matrix.elements,key=`${Math.floor(e[12]/8)},${Math.floor(e[14]/8)}`;
          if(!cells.has(key))cells.set(key,[]);
          cells.get(key).push(part);
        }
        for(const cluster of cells.values()) {
          const near=this.instanced(geo,mat,cluster.length),far=this.instanced(GEO[`${kind}Distant`],mat,cluster.length);
          near.frustumCulled=true;far.frustumCulled=true;
          this.detailBatches.push({near,far,parts:cluster});
        }
        continue;
      }
      // Expanded parcels need coarse static visibility cells; the compact historical scene keeps
      // its measured batching path. Geometry and per-instance pick identities remain identical.
      if(this.model.city.buildings.some(b=>b.site)&&parts.length>=256&&['roofTile','detailBox','box','pole'].includes(kind)&&mat!==this.artMaterials.get('glow')&&mat!==this.artMaterials.get('lanternRed')) {
        const cells=new Map();
        for(const part of parts){const e=part.matrix.elements,key=`${Math.floor(e[12]/20)},${Math.floor(e[14]/20)}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(part);}
        for(const cluster of cells.values()) {
          const mesh=this.instanced(geo,mat,cluster.length,{pick:cluster.some(p=>p.pick)?cluster.map(p=>p.pick):null});
          cluster.forEach((part,i)=>mesh.setMatrixAt(i,part.matrix));mesh.instanceMatrix.needsUpdate=true;
          mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.12;mesh.frustumCulled=true;
        }
        continue;
      }
      const mesh = this.instanced(geo, mat, parts.length, { pick: parts.some((p) => p.pick) ? parts.map((p) => p.pick) : null });
      parts.forEach((p, i) => mesh.setMatrixAt(i, p.matrix));
      mesh.instanceMatrix.needsUpdate = true;
      if(mat===this.artMaterials.get('glow')) {
        const groundPools=[],halos=this.instanced(haloGeometry,this.haloMaterial,parts.length,{shadow:false});
        const center=new THREE.Vector3(),matrix=new THREE.Matrix4();
        for(let i=0;i<parts.length;i+=1) {
          center.setFromMatrixPosition(parts[i].matrix);
          halos.setMatrixAt(i,matrix.makeScale(.42,.42,.42).setPosition(center));
          if(center.y < 1.5) groundPools.push({x:center.x,z:center.z+.2,w:1.15,d:.95});
        }
        halos.instanceMatrix.needsUpdate=true;
        groundPools.push(...this.shopPools);
        const pools=new THREE.InstancedMesh(poolGeometry,this.poolMaterial,groundPools.length);
        groundPools.forEach((p,i)=>pools.setMatrixAt(i,new THREE.Matrix4().makeScale(p.w,1,p.d).setPosition(p.x,.081,p.z)));
        pools.instanceMatrix.needsUpdate=true;this.world.add(pools);
      }
    }
    this.batches.clear();
    // Separate moving figures from buildings: uploading a hand must never upload a whole street.
    const batches=new Map();
    for(const actor of this.actors) {
      actor.root.updateWorldMatrix(true,true);
      for(const node of actor.parts) {
        const {kind,mat}=node.userData,key=`${kind}:${mat}`;
        if(!batches.has(key))batches.set(key,{kind,mat,nodes:[]});
        batches.get(key).nodes.push(node);
      }
    }
    for(const {kind,mat,nodes} of batches.values()) {
      const mesh=this.instanced(GEO[kind],this.material(mat),nodes.length,{pick:nodes.some(node=>node.userData.actor.pick)?nodes.map(node=>node.userData.actor.pick||null):null});
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.actorUploadMatrix ??= new THREE.Matrix4();
      nodes.forEach((node,i)=>mesh.setMatrixAt(i,this.actorMatrix(node)));
      mesh.instanceMatrix.needsUpdate=true;
      this.actorBatches.push({mesh,nodes});
    }
  }

  updateDetail() {
    const position=this.camera.position;
    if(this.detailView && position.distanceToSquared(this.detailView)<.64)return;
    if(this.detailView && this.frameTime-(this.detailTick||0)<160)return;
    this.detailView ??= new THREE.Vector3();this.detailView.copy(position);this.detailTick=this.frameTime||0;
    const point=new THREE.Vector3();let detailChanged=false;
    for(const {near,far,parts} of this.detailBatches||[]) {
      let changed=false;
      for(const part of parts) {
        point.setFromMatrixPosition(part.matrix);
        const close=point.distanceToSquared(position)<(part.near?361:289);
        if(part.near!==close){part.near=close;changed=true;}
      }
      if(!changed)continue;
      let ni=0,fi=0;
      for(const part of parts) {
        if(part.near)near.setMatrixAt(ni++,part.matrix);
        else far.setMatrixAt(fi++,part.matrix);
      }
      near.count=ni;far.count=fi;detailChanged=true;
      for(const mesh of [near,far])if(mesh.count){mesh.computeBoundingSphere();mesh.boundingSphere.radius+=.04;}
      near.instanceMatrix.needsUpdate=true;far.instanceMatrix.needsUpdate=true;
    }
    if(detailChanged){this.renderer.shadowMap.needsUpdate=true;this.reflectionDirty=true;}
  }

  tree(x, z, size, seed) {
    if(!this.model.city.futurePlan&&this.model.city.buildings.some(b=>b.site&&!b.riverBridge&&Math.abs(x-b.site.x)<b.site.width/2+.35&&Math.abs(z-b.site.z)<b.site.depth/2+.35))return;
    if(this.a.place==='hoian' && (seed.startsWith('nipa:')||(!seed.startsWith('street-edge:')&&hash01(`palm:${seed}`)>.7))) {
      // Curved trunks and feathered fronds give the riverside a second tree silhouette.
      const height=size*(seed.startsWith('nipa:')?.7:2.5+hash01(`palm-height:${seed}`)*.65);
      this.treeCrowns.push({x,y:height,z,r:size*1.2});
      const bendX=(hash01(`palm-x:${seed}`)-.3)*.4,bendZ=(hash01(`palm-z:${seed}`)-.5)*.35;
      for(let i=0;i<9;i+=1) {
        const u=i/9,v=(i+1)/9;
        this.beam('timber',[x+bendX*u*u,height*u,z+bendZ*u*u],[x+bendX*v*v,height*v,z+bendZ*v*v],size*(.065-u*.025));
      }
      for(let frond=0;frond<9;frond+=1) {
        const spread=hash01(`${seed}:frond:${frond}`),angle=frond*Math.PI*2/9+(spread-.5)*.45;
        const length=size*(.82+spread*.45),droop=.35+hash01(`${seed}:droop:${frond}`)*.4;
        const point=(u)=>[x+bendX+Math.cos(angle)*u*length,height+Math.sin(u*Math.PI)*size*.3-u*u*size*droop,z+bendZ+Math.sin(angle)*u*length];
        for(let j=0;j<10;j+=1) {
          const u=j/10, p=point(u);
          this.beam('leaf',p,point((j+1)/10),.012*size);
          if(j<2) continue;
          for(const side of [-1,1]) {
            const direction=new THREE.Vector3(Math.cos(angle+side*.85),-.25,Math.sin(angle+side*.85)).normalize();
            this.part('leaf',`foliage:${j%2?'#58773e':'#79914b'}`,p,[size*.12,size*(.48-u*.3),size*.12],[0,0,0],null,new THREE.Quaternion().setFromUnitVectors(UP,direction));
          }
        }
      }
      return;
    }
    const blossom = this.a.place === 'kyoto' && this.a.season === 'spring';
    const colors = this.snow ? ['#e6e6dc','#a2b2a0','#c3ccba'] : blossom ? ['#e4a7b8','#f2c9d1','#bf839d'] : this.a.season === 'autumn' ? ['#a97736','#c9a34e','#8c6535'] : ['#476544','#64834e','#819761'];
    const height=size*(2+hash01(`height:${seed}`)*.7);
    const leanX=(hash01(`leanx:${seed}`)-.5)*.45,leanZ=(hash01(`leanz:${seed}`)-.5)*.35;
    for(let segment=0;segment<6;segment+=1) {
      const u=segment/6,v=(segment+1)/6;
      this.beam('timber',[x+leanX*u*u,height*u*.8,z+leanZ*u*u],[x+leanX*v*v,height*v*.8,z+leanZ*v*v],size*(.065-u*.035));
    }
    for(let root=0;root<4;root+=1) {
      const angle=root*1.6+hash01(seed)*2;
      this.beam('timber',[x,.2,z],[x+Math.cos(angle)*.22,.03,z+Math.sin(angle)*.22],.026*size);
    }
    for(let branch=0;branch<9;branch+=1) {
      const angle=branch*2.4+hash01(seed)*5+(hash01(`${seed}:angle:${branch}`)-.5)*1.25;
      const reach=.8+hash01(`${seed}:reach:${branch}`)*.8;
      const bx=x+leanX+Math.cos(angle)*size*.48*reach,bz=z+leanZ+Math.sin(angle)*size*.46*reach;
      const by=height*(.66+hash01(`${seed}:b${branch}`)*.28);
      this.beam('timber',[x+leanX*.6,height*.51,z+leanZ*.6],[bx,by,bz],.024*size);
      for(let twig=0;twig<5;twig+=1) {
        const a=angle+twig*1.8,r=size*(.16+hash01(`${seed}:twig:${branch}:${twig}`)*.35);
        const ex=bx+Math.cos(a)*r,ez=bz+Math.sin(a)*r,ey=by+(hash01(`${seed}:tw:${branch}:${twig}`)-.4)*size*.45;
        this.beam('timber',[bx,by,bz],[ex,ey,ez],.011*size);
        this.treeCrowns.push({x:ex,y:ey,z:ez,r:size*.55});
        for(let color=0;color<3;color+=1) {
          this.part(`leafSpray${color}`,`foliage:${colors[color]}`,[ex,ey,ez],[size,size,size],[0,a,0]);
        }
      }
    }
  }

  viewDistrict(district,ms=1100) {
    const radius=Math.max(12,district.span*.85);
    this.flyTo({target:{x:district.x,y:.6,z:district.z},position:{x:district.x+radius*.65,y:radius*.7,z:district.z+radius*.8}},ms);this.renderDirty=true;
  }

  buildFutureLandscape() {
    if(this.model.city.geoPlan){this.buildMappedLandscape();return;}
    this.part('box','#7a8a69',[0,-.18,8],[240,.25,180]);
    for(const b of this.model.city.buildings) {
      if(b.riverBridge)continue;
      const c=plotCenter(b.plot),{sx,sz}=b.world;
      this.part('box','paving',[c.x,-.015,c.z],[3.5*sx,.06,2.8*sz]);
    }
    // Two connected river forms: a narrow bridge creek feeding the wider southern river.
    const points=[[-100,-22],[44,-22],[44,-34],[100,-34],[100,-4],[44,-4],[44,-10],[-10.9,-10],[-10.9,22],[-13.1,22],[-13.1,-10],[-100,-10]];
    this.createRiver(new THREE.ShapeGeometry(new THREE.Shape(points.map(p=>new THREE.Vector2(...p)))),0);
    // Street axes stop at the creek, instead of placing paving across its water.
    for(const [x,z,w,d] of [[-24,-3,20,.9],[12,-3,45,.9],[-23,4,18,.9],[12,4,45,.9],[3,8.8,62,1.1],[-58,7,20,.8],[-6,35,23,.85]])this.part('box','paving',[x,.015,z],[w,.06,d]);
    for(let i=0;i<70;i++) {
      const x=-30+i*.9;
      this.part('box','stone',[x,.06,9.8],[.86,.24,.3]);
      this.part('box','stone',[x,.06,22.2],[.86,.24,.3]);
    }
    for(let i=0;i<34;i++)for(const x of [-13.18,-10.82])this.part('box','stone',[x,.06,-20+i*.9],[.2,.24,.86]);
    for(let i=0;i<23;i++) {
      const x=-31+i*2.9;
      this.tree(x,-21.5,1.1+hash01(`future-tree:${i}`)*.25,`street-edge:future:${i}`);
      if(i%3===0){this.beam('iron',[x,.04,8.9],[x,1.3,8.9],.025);this.part('orb','glow',[x,1.32,8.9],[.075,.12,.075]);}
    }
    for(const z of [-10,6.8])for(let i=0;i<14;i++){const x=-29+i*4.6;if(Math.abs(x+12)<2)continue;this.tree(x,z,.65+hash01(`street-size:${i}:${z}`)*.2,`street-edge:future:${i}:${z}`);}
    // Connected tidal banks: nipa grows in shore belts, not on isolated circular pedestals.
    for(const side of [0,1]) {
      const outer=side?34:4,edge=Array.from({length:15},(_,i)=>[100-i*4,-(side?28.2+hash01(`bank:${i}`)*1.6:8.8+hash01(`bank:${i}`)*1.7)]);
      const outline=[[44,-outer],[100,-outer],...edge];
      const geometry=new THREE.ShapeGeometry(new THREE.Shape(outline.map(point=>new THREE.Vector2(...point))));
      geometry.rotateX(-Math.PI/2);
      const bank=new THREE.Mesh(geometry,this.material('#6d7855'));bank.position.y=.06;bank.receiveShadow=true;
      this.world.add(bank);this.disposables.push(geometry);
    }
    for(let i=0;i<36;i++) {
      const x=46+(i%9)*5.6+hash01(`nipa-x:${i}`)*1.6,z=(i%2?6:30)+Math.floor(i/18)*.7+hash01(`nipa-z:${i}`)*.8;
      this.tree(x,z,1+hash01(`nipa:${i}`)*.35,`nipa:${i}`);
    }
    for(const [cx,cz] of [[-59,2],[-6,31]])for(let i=0;i<7;i++)this.tree(cx-10+i*3,cz+10,1.1,`village:${cx}:${i}`);
  }

  buildMappedLandscape() {
    this.part('box','#788467',[48,-.18,0],[460,.25,280]);
    const bank=MAP_ROADS.filter(r=>r.name==='Bạch Đằng').sort((a,b)=>b.points.length-a.points.length)[0].points.slice().reverse();
    // The road centreline is mapped; bank offsets and the creek are an explicitly stylised envelope.
    const north=[{x:-100,z:11},{x:-1.1,z:10},{x:-1.1,z:-75},{x:1.1,z:-75},{x:1.1,z:10},{x:9.864,z:12.8},...bank.map(p=>({x:p.x,z:p.z+1.3})),{x:200,z:12}];
    const south=[{x:200,z:36},...bank.slice().reverse().map(p=>({x:p.x,z:p.z+11})),{x:-100,z:31}];
    this.createRiver(new THREE.ShapeGeometry(new THREE.Shape([...north,...south].map(p=>new THREE.Vector2(p.x,-p.z)))),0);
    for(const road of MAP_ROADS)for(let i=1;i<road.points.length;i++) {
      const a=road.points[i-1],b=road.points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
      if(length<.02)continue;
      this.part('box','paving',[(a.x+b.x)/2,.015,(a.z+b.z)/2],[road.name==='Cầu An Hội'?1.3:1.05,.06,length+.03],[0,Math.atan2(dx,dz),0]);
    }
    // Surveyed quay language; offsets remain illustrative, not a measured river boundary.
    for(let i=1;i<bank.length;i++) {
      const a=bank[i-1],b=bank[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
      if(length<.02)continue;
      const yaw=Math.atan2(dx,dz),mx=(a.x+b.x)/2,mz=(a.z+b.z)/2;
      this.part('mapBlock','paving',[mx,.025,mz+.94],[.78,.09,length+.04],[0,yaw,0]);
      this.part('mapBlock','stone',[mx,-.13,mz+1.29],[.12,.35,length+.04],[0,yaw,0]);
      this.part('mapBlock','#697466',[mx,-.24,mz+1.35],[.025,.10,length+.04],[0,yaw,0]);
      const slabs=Math.max(1,Math.ceil(length/.72));
      for(let j=0;j<slabs;j++) {
        const t=(j+.5)/slabs,x=a.x+dx*t,z=a.z+dz*t;
        this.part('mapBlock',j%3===0?'#b4b2a0':'stone',[x,.09,z+1.23],[.22,.055,length/slabs-.025],[0,yaw,0]);
        this.part('mapBlock','#9c9f91',[x,.074,z+.88],[.58,.008,.012],[0,Math.atan2(dz,dx),0]);
      }
      if(i%3===0) {
        this.part('mapBlock','stone',[b.x,.075,b.z+.91],[.44,.06,.40]);
        this.part('mapBlock','#626b51',[b.x,.11,b.z+.91],[.33,.025,.29]);
        this.tree(b.x,b.z+.91,.8+hash01(`map-bank:${i}`)*.2,`map-bank:${i}`);
      }
    }
    // Place short capped mooring posts by travelled distance, not by OSM vertex density.
    let nextPost=1.2;
    for(let i=1;i<bank.length;i++) {
      const a=bank[i-1],b=bank[i],length=Math.hypot(b.x-a.x,b.z-a.z);
      for(;nextPost<length;nextPost+=2.8) {
        const t=nextPost/length,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t+1.13;
        this.part('mapBlock','stone',[x,.19,z],[.105,.22,.105]);
        this.part('mapBlock','#c6c2ad',[x,.30,z],[.21,.055,.18]);
      }
      nextPost-=length;
    }
    for(const b of this.model.city.buildings)if(!b.riverBridge) {
      const c=plotCenter(b.plot),scale=b.world||{sx:1,sz:1};
      this.part('box','paving',[c.x,-.015,c.z],[3.5*scale.sx,.06,2.8*scale.sz]);
    }
    // Bounded static context: mapped building centres, interpreted height/roof, no extra actors.
    const protectedLots=[...this.model.city.buildings.map(b=>({c:plotCenter(b.plot),w:b.site?.width||3.9,d:b.site?.depth||3.2})),
      ...(this.model.placementSites||[]).map(site=>({c:{x:site.x,z:site.z},w:site.width,d:site.depth}))];
    const context=mappedContext.buildings.map(b=>({...b,...mapPoint(b.lat,b.lon)})).map(b=>{
      const survey=TANKY_NEIGHBOURS.find(p=>p.id===b.id);
      if(!survey)return b;
      // Compress only this render-only frontage where approximate source rectangles overlap.
      const renderWidth=survey.width;
      const fits=protectedLots.every(lot=>Math.abs(lot.c.z-b.z)>=(lot.d+b.depth)/2+.1||
        2*(Math.abs(lot.c.x-b.x)-lot.w/2-.12)>=renderWidth);
      return {...b,survey,renderWidth,fits};
    }).filter(b=>b.x>-50&&b.x<145&&b.z>-38&&b.z<25&&(b.survey?b.fits&&b.renderWidth>=b.width*.55:
        !protectedLots.some(p=>Math.abs(p.c.x-b.x)<(p.w+b.width)/2+.2&&Math.abs(p.c.z-b.z)<(p.d+b.depth)/2+.2)))
      .slice(0,2660);
    this.mapContext=context;
    // Only nearby street frontages receive detail. All context keeps material-only batching.
    const corridors=['Trần Phú','Nguyễn Thái Học','Bạch Đằng'];
    const frontages=new Map();
    for(const name of corridors) {
      const segments=MAP_ROADS.filter(r=>r.name===name).flatMap(r=>r.points.slice(1).map((b,i)=>({a:r.points[i],b})));
      const candidates=context.map(house=>{
        let nearest={distance:Infinity,gap:Infinity};
        for(const {a,b} of segments) {
          const dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;
          if(length2<.0001)continue;
          const t=Math.max(0,Math.min(1,((house.x-a.x)*dx+(house.z-a.z)*dz)/length2));
          const x=a.x+dx*t,z=a.z+dz*t,distance=Math.hypot(house.x-x,house.z-z);
          const cos=Math.cos(house.yaw),sin=Math.sin(house.yaw),hx=x-house.x,hz=z-house.z;
          const gap=Math.hypot(Math.max(0,Math.abs(cos*hx-sin*hz)-house.width*.47),
            Math.max(0,Math.abs(sin*hx+cos*hz)-house.depth*.47));
          if(gap<nearest.gap||(gap===nearest.gap&&distance<nearest.distance))nearest={x,z,distance,gap};
        }
        return {house,name,...nearest};
      }).filter(c=>c.gap<.75).sort((a,b)=>a.gap-b.gap||a.distance-b.distance||a.house.id-b.house.id).slice(0,72);
      for(const c of candidates) {
        if(!frontages.has(c.house.id))frontages.set(c.house.id,[]);
        frontages.get(c.house.id).push(c);
      }
    }
    const tanKyRef=mapReference('ha-tanky-v1'),tanKy=mapPoint(tanKyRef.lat,tanKyRef.lon);
    const merchantRow=new Set(context.filter(b=>Math.abs(b.x-tanKy.x)<8&&Math.abs(b.z-tanKy.z)<4&&Math.max(b.width,b.depth)>1.8)
      .sort((a,b)=>Math.hypot(a.x-tanKy.x,a.z-tanKy.z)-Math.hypot(b.x-tanKy.x,b.z-tanKy.z)).slice(0,10).map(b=>b.id));
    for(const b of context) {
      if(b.survey||merchantRow.has(b.id)){this.buildMappedMerchantHouse(b);continue;}
      const seed=hash01(`map-house:${b.id}`),h=.8+seed*.7,rise=.25+seed*.15;
      const w=b.width*.94,d=b.depth*.94,cos=Math.cos(b.yaw),sin=Math.sin(b.yaw);
      this.part('mapBlock',['wall:#bda66d','wall:#cab377','wall:#d2ba81'][b.id%3],[b.x,h/2,b.z],[w,h,d],[0,b.yaw,0]);
      for(const side of [-1,1]) {
        const offset=side*d/4,slope=Math.atan2(rise,d/2);
        const rotation=new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeRotationY(b.yaw).multiply(new THREE.Matrix4().makeRotationX(side*slope)));
        this.part('mapBlock',['tile:#535c51','tile:#6a6554','tile:#665c4d'][b.id%3],[b.x+sin*offset,h+rise/2,b.z+cos*offset],[w+.13,.045,Math.hypot(d/2,rise)+.09],[rotation.x,rotation.y,rotation.z]);
      }
      const frontage=frontages.get(b.id);
      if(frontage) {
        // Deep tube houses can address two streets; retain a distinct rear trading frontage.
        const faces=new Set();
        for(const street of frontage.sort((a,b)=>a.distance-b.distance)) {
          const dx=street.x-b.x,dz=street.z-b.z,lx=cos*dx-sin*dz,lz=sin*dx+cos*dz;
          const face=Math.abs(lx)/w>Math.abs(lz)/d?`x:${Math.sign(lx)}`:`z:${Math.sign(lz)}`;
          if(faces.has(face)||faces.size===2)continue;
          faces.add(face);this.buildMappedFrontage(b,w,d,h,street);
        }
        const roof=['tile:#535c51','tile:#6a6554','tile:#665c4d'][b.id%3];
        this.part('mapBlock',roof,[b.x,h+rise+.025,b.z],[w+.19,.07,.09],[0,b.yaw,0]);
        const channels=Math.max(4,Math.min(18,Math.ceil(w/.16)));
        for(const side of [-1,1]) {
          const slope=Math.atan2(rise,d/2),offset=side*d/4;
          const rotation=new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeRotationY(b.yaw).multiply(new THREE.Matrix4().makeRotationX(side*slope)));
          for(let j=0;j<=channels;j++) {
            const u=(j/channels-.5)*w;
            this.part('mapBlock',roof,[b.x+cos*u+sin*offset,h+rise/2+.025,b.z-sin*u+cos*offset],
              [.025,.025,Math.hypot(d/2,rise)+.09],[rotation.x,rotation.y,rotation.z]);
          }
        }
      }
      else this.part('mapBlock','timber',[b.x+sin*d*.48,h*.43,b.z+cos*d*.48],[Math.min(w*.55,.6),h*.62,.025],[0,b.yaw,0]);
    }
  }

  buildMappedMerchantHouse(b) {
    // Original block variants within immutable mapped envelopes, not numbered-house replicas.
    let w=b.renderWidth??b.width*.94,d=b.depth*.94,yaw=b.yaw;
    if(w>d){[w,d]=[d,w];yaw+=Math.PI/2;}
    if(Math.cos(yaw)>0)yaw+=Math.PI;
    const cos=Math.cos(yaw),sin=Math.sin(yaw),seed=hash01(`merchant:${b.id}`),type=b.id%4;
    const wall=['wall:#d2b577','wall:#bea16a','wall:#d8be89','wall:#c7b68e'][type];
    const roofMat=['tile:#535c51','tile:#6a6554','tile:#665c4d'][b.id%3];
    const put=(mat,x,y,z,sx,sy,sz,rx=0,kind='mapBlock')=>{
      const rotation=new THREE.Euler().setFromRotationMatrix(new THREE.Matrix4().makeRotationY(yaw).multiply(new THREE.Matrix4().makeRotationX(rx)));
      this.part(kind,mat,[b.x+cos*x+sin*z,y,b.z-sin*x+cos*z],[sx,sy,sz],[rotation.x,rotation.y,rotation.z]);
    };
    const tiledRoof=(z,depth,h,rise,width=w)=>{
      const run=depth/2,slope=Math.atan2(rise,run),count=Math.max(4,Math.min(12,Math.ceil(width/.12)));
      for(const side of [-1,1]) {
        put(roofMat,0,h+rise/2,z+side*depth/4,width+.10,.035,Math.hypot(run,rise)+.08,side*slope);
        for(let j=0;j<=count;j++)put(roofMat,(j/count-.5)*width,h+rise/2+.021,z+side*depth/4,.024,.025,Math.hypot(run,rise)+.09,side*slope);
        put('timber',0,h-.012,z+side*(run+.02),width+.08,.045,.07);
        // Stepped gable infill closes the roof silhouette without filling the light well.
        for(const end of [-1,1])for(let j=0;j<4;j++)put(wall,end*(width/2-.025),h+rise*(j+.5)/4,z,.05,rise/4,depth*(1-(j+.5)/4));
      }
      put(roofMat,0,h+rise+.025,z,width+.13,.06,.07);
    };
    const frontDepth=d*(.28+seed*.035),rearDepth=d*.24,middleDepth=d*.19;
    const frontZ=d/2-frontDepth/2,rearZ=-d/2+rearDepth/2,middleZ=-d*.04;
    const frontH=b.survey?(b.survey.style==='recessed'?1.88:1.65):type===1?1.5:1.0+seed*.25,rearH=.77+seed*.25;
    put('paving',0,.035,0,w,.06,d);
    for(const [z,depth,h] of [[frontZ,frontDepth,frontH],[middleZ,middleDepth,.83],[rearZ,rearDepth,rearH]]) {
      for(const side of [-1,1])put(wall,side*(w/2-.035),h/2,z,.07,h,depth);
      put('timber',0,.08,z,w,.045,depth);
      const behindCornice=b.survey?.style==='balcony'&&z===frontZ;
      tiledRoof(z-(behindCornice?.10:0),depth-(behindCornice?.14:0),h,.20+seed*.10);
    }
    // Thin galleries and exposed posts connect roofed ranges around two actual air gaps.
    for(const side of [-1,1]) {
      const gx=side*(w/2-.065),galleryW=Math.min(.16,w*.18);
      put('timber',gx,.78,0,galleryW,.035,d*.57);
      for(const z of [-d*.22,d*.15]) {
        put('timber',gx,.39,z,.032,.78,.035);
        put('stone',gx,.09,z,.08,.10,.08);
      }
      put('stone',side*(w/2-.11),.067,0,.04,.025,d*.55);
    }
    if(b.survey) {
      let nearest={distance:Infinity};
      for(const road of MAP_ROADS.filter(r=>r.name==='Nguyễn Thái Học'))for(let i=1;i<road.points.length;i++) {
        const a=road.points[i-1],to=road.points[i],dx=to.x-a.x,dz=to.z-a.z,length2=dx*dx+dz*dz;
        if(length2<.0001)continue;
        const t=Math.max(0,Math.min(1,((b.x-a.x)*dx+(b.z-a.z)*dz)/length2)),x=a.x+dx*t,z=a.z+dz*t;
        const distance=Math.hypot(x-b.x,z-b.z);
        if(distance<nearest.distance)nearest={x,z,distance};
      }
      const apron=sin*(nearest.x-b.x)+cos*(nearest.z-b.z)-d/2-.52;
      if(apron>.03&&apron<1.8)put('paving',0,.028,d/2+apron/2,w,.045,apron+.025);
    }
    const frontFace=d/2+.012,entry=Math.min(.30,w*.32),bay=(w-entry)/2;
    for(const side of [-1,1]) {
      if(!b.survey) {
        put('timber',side*(entry/2+bay/2),.47,frontFace,bay*.94,.78,.04);
        for(let j=0;j<6;j++)put('#8c7650',side*(entry/2+bay/2),.16+j*.12,frontFace+.027,bay*.90,.012,.01);
        put('timber',side*entry/2,.47,frontFace+.035,.035,.86,.065);
      }
      // The rear has smaller practical doors, uneven limewashed shoulders and a shallow canopy.
      put(wall,side*(w+entry)/4,rearH*.46,-d/2-.012,(w-entry)/2,rearH*.92,.055);
      put('timber',side*entry*.53,.42,-d/2-.05,.035,.79,.055);
    }
    if(!b.survey)put('timber',0,.91,frontFace+.025,w,.06,.09);
    put('stone',0,.08,frontFace+.07,w,.09,.16);
    if(b.survey)this.buildSurveyedFrontage(put,b.survey,w,d,frontH);
    else if(frontH>1.35) {
      put(wall,0,1.21,frontFace,w,.52,.07);
      for(const x of [-w*.28,0,w*.28]) {
        put('timber',x,1.23,frontFace+.05,w*.18,.31,.025);
        for(let j=0;j<4;j++)put('#8c7650',x,1.12+j*.07,frontFace+.07,w*.15,.012,.012);
      }
    } else put(wall,0,(frontH+.91)/2,frontFace,w,Math.max(.04,frontH-.91),.06);
    if(!b.survey&&type!==2) {
      put(type===0?'#666a52':'#79715c',0,.88,frontFace+.10,w+.03,.035,.27,.12);
      for(const side of [-1,1])put('timber',side*w*.43,.43,frontFace+.21,.022,.84,.022);
    }
    put('#79715c',0,rearH*.88,-d/2-.08,w,.03,.20,-.12);
    put('stone',0,.09,-d/2-.07,w*.78,.10,.16);
    for(let j=0;j<2+type%2;j++)put('timber',-w*.25+j*w*.16,.15,-d/2+.12,.11,.15,.14);
    // Recessed threshold glimpses and a planter add life without per-house actors or lights.
    put('#b59970',0,.073,d*.19,Math.min(.28,w*.35),.018,.24);
    put('stone',w*.22,.12,-d*.21,.16,.16,.15);
    put('foliage:#647053',w*.22,.22,-d*.21,.17,.12,.16);
  }

  buildSurveyedFrontage(put,survey,w,d,h) {
    const face=d/2+.02,recess=survey.style==='recessed';
    const plaster=recess?'wall:#c5c6b2':'wall:#d2b06d',trim=recess?'#a5a99b':'#d1c4a0';
    const shutter=recess?'#607580':'timber';
    const louvre=(x,y,z,width,height)=>{
      put(trim,x,y,z,width+.055,height+.055,.055);
      put(shutter,x,y,z+.04,width,height,.035);
      put('timber',x,y,z+.065,.012,height,.012);
      for(let j=0;j<7;j++)put(recess?'#87979b':'#8c7650',x,y-height*.42+j*height*.14,z+.065,width*.88,.012,.012);
      put(trim,x,y-height/2-.045,z+.055,width+.10,.045,.12);
    };
    if(recess) {
      // 103: tall masonry shoulders frame a full-height recessed entrance, not a flat door decal.
      const shoulder=w*.32,door=w*.26;
      for(const side of [-1,1]) {
        const x=side*w*.34;
        put(plaster,x,h/2,face,shoulder,h,.10);
        put(trim,side*w*.49,h/2,face+.065,.045,h,.045);
        louvre(x,.62,face+.07,w*.23,.54);
        louvre(x,1.45,face+.07,w*.16,.38);
        put(trim,x,.25,face+.075,w*.27,.18,.025);
        for(let j=0;j<4;j++)put('#929b91',x+(j-1.5)*w*.052,.25,face+.095,.022,.075,.013);
        put(plaster,side*door*.58,.81,face-.16,.065,1.62,.39);
        put('timber',side*door*.50,.49,face-.33,.035,.88,.055);
      }
      put('timber',0,.49,face-.35,door,.89,.035);
      put('timber',0,1.31,face-.31,door,.23,.055);
      put('#65513c',0,1.06,face-.25,door*.90,.16,.035);
      put('stone',0,.09,face-.04,door+.10,.08,.52);
      for(const y of [h-.075,h+.005])put(trim,0,y,face+.04,w+.06,.045,.13);
    } else {
      // 99–99A group: open ground trading bays under an oval-pierced masonry balcony.
      put(plaster,0,1.33,face-.17,w,.65,.065);
      put(plaster,0,1.69,face-.14,w,.10,.065);
      put(trim,0,1.76,face-.12,w+.06,.055,.12);
      for(const side of [-1,1])louvre(side*w*.28,1.34,face-.11,w*.23,.43);
      for(const x of [-w*.46,0,w*.46]) {
        put(plaster,x,.50,face+.02,.055,.95,.075);
        put(trim,x,1.37,face+.03,.065,.66,.10);
        put(trim,x,1.68,face+.02,.12,.06,.13);
      }
      put(trim,0,.99,face+.075,w+.06,.065,.34);
      put(trim,0,1.19,face+.22,w+.06,.055,.07);
      put(trim,0,1.04,face+.22,w+.06,.04,.07);
      put(trim,0,1.115,face+.22,w+.06,.18,.07,0,'surveyBalustrade');
      for(const side of [-1,1])put(trim,side*w*.24,1.60,face-.08,w*.41,.22,.06,0,'surveyArch');
      put('#79715c',0,.94,face+.16,w,.035,.36,.12);
      for(let step=0;step<3;step++)put('stone',0,.04+step*.035,face+.18-step*.07,w*.86,.05,.13);
      for(const side of [-1,1])for(let j=0;j<4;j++)put(['#947465','#6d8185','#ad9777'][j%3],side*w*.28,.39,face-.08+j*.05,.08,.43,.035);
    }
    // Both shells keep a few shaded interior shelves; no extra residents, lamps or product brands.
    for(let j=0;j<3;j++)put('timber',w*.35,.29+j*.19,face-.32,w*.18,.025,.16);
    put('glow',0,.84,face-.25,w*.30,.018,.025);
  }

  viewSurveyedHouse(id,ms=900) {
    const house=this.mapContext?.find(b=>b.id===id&&b.survey)||TANKY_NEIGHBOURS.find(b=>b.id===id);
    if(!house)return;
    this.flyTo({target:{x:house.x,y:.75,z:house.z-1},position:{x:house.x+2.6,y:3.8,z:house.z-6.8}},ms);
    this.renderDirty=true;
  }

  buildMappedFrontage(b,w,d,h,street) {
    const cos=Math.cos(b.yaw),sin=Math.sin(b.yaw),dx=street.x-b.x,dz=street.z-b.z;
    const lx=cos*dx-sin*dz,lz=sin*dx+cos*dz;
    const sideX=Math.abs(lx)/w>Math.abs(lz)/d;
    const localX=sideX?Math.sign(lx):0,localZ=sideX?0:Math.sign(lz);
    const nx=cos*localX+sin*localZ,nz=-sin*localX+cos*localZ;
    const yaw=Math.atan2(nx,nz),half=sideX?w/2:d/2,span=sideX?d:w;
    const seed=hash01(`map-front:${b.id}`),upper=h>1.13,ground=upper?h*.51:h*.85;
    const front=(mat,u,y,v,sx,sy,sz)=>this.part('mapBlock',mat,
      [b.x+nx*(half+v)+nz*u,y,b.z+nz*(half+v)-nx*u],[sx,sy,sz],[0,yaw,0]);
    // Deep timber trading bays, without inventing a business identity or address.
    const bays=Math.max(1,Math.min(5,Math.floor(span/.48))),bay=Math.min(.58,span*.86/bays);
    front('stone',0,.075,.10,span*.98,.11,.28);
    front('#8c6650',0,.14,.045,span*.90,.025,.18);
    front('timber',0,ground*.55,.025,span*.88,ground*.88,.045);
    for(let i=0;i<bays;i++) {
      const u=(i-(bays-1)/2)*span*.84/bays;
      front(i===(b.id%bays)?'#262e28':'#5c4932',u,ground*.54,.052,bay*.88,ground*.77,.018);
      front('timber',u-bay*.49,ground*.55,.075,.027,ground*.91,.04);
      if(i!==(b.id%bays))for(let j=1;j<5;j++)front('#8c7650',u-bay/2+bay*j/5,ground*.53,.067,.012,ground*.72,.012);
    }
    front('timber',0,ground+.045,.075,span*.98,.065,.09);
    // Variable upper openings and plaster surrounds distinguish masonry from low timber houses.
    if(upper) {
      front(street.name==='Nguyễn Thái Học'?'#d3c5a1':'stone',0,ground+.10,.035,span,.045,.10);
      const count=Math.max(1,Math.min(4,Math.floor(span/.55))),spacing=span*.80/count;
      for(let i=0;i<count;i++) {
        const u=(i-(count-1)/2)*spacing,win=Math.min(.34,spacing*.66),y=ground+(h-ground)*.51,wh=(h-ground)*.59;
        front('#d3c5a1',u,y,.025,win+.075,wh+.075,.065);
        front('timber',u,y,.068,win,wh,.025);
        for(let j=0;j<4;j++)front('#8c7650',u,y-wh*.38+j*wh*.24,.087,win*.88,.013,.014);
        front('#d3c5a1',u,y+wh*.62,.07,win+.13,.035,.10);
      }
      if(street.name==='Nguyễn Thái Học'&&seed>.45) {
        front('stone',0,ground+.03,.19,span*.95,.06,.38);
        front('#d3c5a1',0,ground+.18,.35,span*.95,.07,.065);
        for(let j=0;j<=bays;j++)front('#d3c5a1',(j/bays-.5)*span*.90,ground+.12,.35,.04,.22,.06);
      }
    }
    front('timber',0,h-.025,.10,span+.08,.055,.24);
    // Deep, uneven awnings observed on Bach Dang; restrained overhangs on the inner streets.
    const awning=street.name==='Bạch Đằng'||seed>.57;
    if(awning) {
      const depth=street.name==='Bạch Đằng'?.34+seed*.13:.19;
      front(seed>.6?'#666a52':'#79715c',0,ground+.015,depth*.48,span*.96,.035,depth);
      for(const side of [-1,1])front('timber',side*span*.43,ground*.49,depth*.91,.022,ground,.022);
    }
  }

  buildFutureLife() {
    for(const b of this.model.city.buildings) {
      if(b.site?.version===1||(!b.site&&!b.illustrative))continue;
      if(constructionProgress(b)<1){
        this.activeBridge=b.site||b.riverBridge?b.planId:null;
        this.buildWorksite(b);this.activeBridge=null;continue;
      }
      const c=plotCenter(b.plot),scale=b.world||{sx:1,sz:1};
      if(b.riverBridge) {
        for(const side of [-1,1]){const actor=this.streetPerson(c.x-1.93,.015,c.z+side*.1,`${b.planId}:visitor:${side}`,'walk');actor.bridgeWalk={axis:'x',center:c.x};actor.journey=streetJourney([[c.x-1.93,c.z+side*.1,.015,2],[c.x+1.93,c.z+side*.1,.015,2]]);}
      } else if(b.key==='ha-thanhha-v1') {
        const potter=this.streetPerson(c.x-.72*scale.sx,.015,c.z+.45*scale.sz,`${b.planId}:potter`,'potter');
        const helper=this.streetPerson(c.x-.72*scale.sx+.38,.015,c.z+.45*scale.sz+.15,`${b.planId}:helper`,'potterHelper',-Math.PI/2);helper.phase=potter.phase;helper.pace=potter.pace;
      } else if(b.key==='ha-kimbong-v1')this.streetPerson(c.x-.66*scale.sx,.015,c.z+.6*scale.sz-.28,`${b.planId}:carver`,'carve');
      else if(b.shape==='house')this.streetPerson(c.x,.015,c.z+1.5*scale.sz,`${b.planId}:walker`,'walk',Math.PI/2,null,{axis:'x',length:1.4});
      else if(b.key==='ha-cho-v1'||b.shape==='market') {
        const x=c.x,z=c.z+1.5*scale.sz;
        this.part('box','timber',[x,.28,z],[.58,.3,.3]);
        const trade={phase:3,length:2.1,depth:-.2,heading:Math.atan2(.38,-.33),x,z,shelfY:.46,market:true,wares:3,customers:[]};this.trades.push(trade);
        const seller=this.streetPerson(x+.38,.015,z-.12,`${b.planId}:seller`,'vendor',Math.atan2(-.38,.33));seller.trade=trade;trade.seller=seller;
        for(let i=0;i<2;i++){const customer=this.streetPerson(x-2.1-i*.42,.015,z+.4+i*.12,`${b.planId}:customer:${i}`,'customer');customer.trade=trade;customer.customerIndex=i;trade.customers.push(customer);}
        this.buildTradeGoods(trade);
      }
      else if(b.site)this.streetPerson(c.x,.015,c.z+Math.cos(b.site.yaw)*(b.site.depth/2+.45),`${b.planId}:visitor`,'walk',Math.PI/2,null,{axis:'x',length:1.2});
    }
  }

  buildLandscape() {
    if(this.model.city.futurePlan){this.buildFutureLandscape();return;}
    const dense=this.a.place==='hoian';
    // plotBounds includes a one-plot navigation margin. It is not an extra paved plaza.
    // River-site addresses must not generate thousands of empty paved plots between districts.
    const land=this.landBounds;
    const b=dense && this.model.city.buildings.length ? {
      minX:land.minX+1,maxX:land.maxX-1,
      minY:land.minY+1,maxY:land.maxY-1,
    }:land;
    const padding=dense?0:1;
    const span = Math.max(48, (b.maxX - b.minX + 5) * PLOT, (b.maxY - b.minY + 5) * PLOT,Math.abs(this.bounds.minX)*PLOT+12,Math.abs(this.bounds.maxX)*PLOT+12);
    for(const building of this.model.city.buildings.filter(item=>item.sourcePlot)) {
      const site=plotCenter(building.plot);
      if(site.x>=b.minX*PLOT-2&&site.x<=b.maxX*PLOT+2)continue;
      for(const z of [-4,0])this.part('box','paving',[site.x,-.015,z],[3.2,.06,1.8]);
      for(const z of [-3.1,-.9])this.part('box','stone',[site.x,.02,z],[3.4,.15,.2]);
    }
    this.part('box', this.snow ? '#d7dfd8' : '#6d8077', [0, -0.17, 0], [span * 8, 0.25, span * 8]);
    // Fixed canal in the street between rows -1 and 0. It never displaces a building.
    this.part('box', '#526f67', [0, -0.06, -2], [span * 2, 0.14, 2.05]);
    for (const z of [-3.1, -0.9]) {
      this.part('box', 'stone', [0, 0.02, z], [span * 2, 0.15, 0.2]);
    }
    for (let x = b.minX - padding; x <= b.maxX + padding; x += 1) {
      for (let z = b.minY - padding; z <= b.maxY + padding; z += 1) {
        const cx = x * PLOT;
        const cz = z * PLOT;
        if(dense) {
          // Continuous street paving, clipped around the fixed river; no checkerboard grass gaps.
          const near=z===0?-.88:cz-PLOT/2,far=z===-1?-3.12:cz+PLOT/2;
          this.part('box','paving',[cx,-.015,(near+far)/2],[PLOT,.06,far-near]);
          for(let edge=0;edge<9;edge+=1) {
            const wear=hash01(`curb:${x}:${z}:${edge}`),ex=cx-PLOT/2+(edge+.5)*PLOT/9;
            this.part('box',wear>.65?'#958d79':'stone',[ex,.025+(wear-.5)*.018,z===-1?-3.14:cz+1.42+(wear-.5)*.035],[PLOT/9-.012,.07,.13],[0,(wear-.5)*.045,0]);
            if(wear>.68 && z!==-1) for(let blade=0;blade<5;blade+=1) {
              this.part('leaf','foliage:#64834e',[ex+(blade-2)*.035,.035,cz+1.46+wear*.035],[.025,.065+wear*.04,.025],[blade*.6,wear*4,blade*.4]);
            }
          }
        } else {
        this.part('box', 'paving', [cx, -0.005, cz + 1.1], [3.45, 0.06, 0.45]);
        this.part('box', 'paving', [cx + 1.8, -0.005, cz], [0.6, 0.06, 2.55]);
        for (let j = 0; j < 3; j += 1) {
          this.part('orb', j % 2 ? 'flower' : 'leaf', [cx - 1.5 + j * 0.17, 0.18, cz + 0.95], [0.2, 0.19, 0.23]);
        }
        if (z !== -1) this.part('box','paving',[cx,.008,cz+1.85],[4,.04,.9]);
        this.part('box','paving',[cx+1.85,.008,cz],[.9,.04,3.1]);
        for (let k=0;k<30;k+=1) {
          const u=hash01(`garden:${x},${z}:${k}`);
          this.part('leaf',`foliage:${k%2?'#667c43':'#8a9b58'}`,[cx-1.5+u*.7,.15+hash01(`gy${k}`)*.2,cz+.95+Math.sin(k)*.17],[.14,.23,.14],[k,.4,k*.7]);
          if(k%3===0) this.part('orb','flower',[cx-1.5+u*.7,.35,cz+.95+Math.sin(k)*.17],[.045,.035,.045]);
        }
        // Stone joints and street edges create a readable scale without noisy textures.
        for (let i = 0; i < 8; i += 1) {
          this.part('box', i % 2 ? '#b3a68f' : 'paving', [cx - 1.4 + i * 0.4, 0.025, cz + 1.48], [0.37, 0.03, 0.35]);
          if (z !== -1) this.part('box', '#afa58e', [cx - 1.4 + i * 0.4, 0.005, cz + 1.9], [0.37, 0.03, 0.36]);
        }
        }
        if(dense) {
          // Only the outer pavement edge receives erosion, soil and self-seeded plants.
          const edges=[];
          if(x===b.minX)edges.push([-1,0]);if(x===b.maxX)edges.push([1,0]);
          if(z===b.minY)edges.push([0,-1]);if(z===b.maxY)edges.push([0,1]);
          for(const [nx,nz] of edges) for(let clump=0;clump<9;clump+=1) {
            const seed=`edge:${x}:${z}:${nx}:${nz}:${clump}`,u=hash01(seed);
            if(u<.42)continue;
            const along=(clump-4)*.43,px=cx+nx*1.97+nz*along,pz=cz+nz*1.97+nx*along;
            this.part('orb','#6d765a',[px,.002,pz],[.12+u*.12,.018,.1+u*.13],[0,u*5,0]);
            for(let blade=0;blade<9;blade+=1) {
              const v=hash01(`${seed}:${blade}`);
              this.part('leaf','foliage:#64834e',[px+(v-.5)*.24,.025,pz+Math.sin(blade)*.1],[.025,.055+v*.11,.025],[v*1.4,u*6,blade*.7]);
            }
            if(u>.75)this.part('box','#958d79',[px-nx*.12,.025,pz-nz*.12],[.085,.045,.12],[u*.13,u*4,.1]);
          }
        }
        if (hash01(`grove:${x},${z}`) > (dense?.35:.55)) {
          const tx=cx-1.76+(hash01(`treex:${x},${z}`)-.5)*.23,tz=cz+(dense?.05:-.65)+hash01(`offset:${x},${z}`)*.55;
          if(dense) this.part('orb','#686b4b',[tx,.02,tz],[.33,.025,.45]);
          this.tree(tx,tz,.7+hash01(`${x},${z}`)*.35,`${x},${z}`);
        }
        if ((x + z) % 2 === 0) {
          this.beam('iron', [cx + 1.55, 0, cz + 1.3], [cx + 1.55, 1.35, cz + 1.3], 0.025);
          this.part('orb', 'glow', [cx + 1.55, 1.4, cz + 1.3], [0.1, 0.15, 0.1]);
        }
      }
      // Staggered masonry, damp joints and a lighter coping give the quay a real waterline.
      for(const bank of [-3.08,-.92]) {
        const toward=bank<-2?1:-1;
        for(let row=0;row<3;row+=1) for(let block=0;block<12;block+=1) {
          const bx=x*PLOT-2+(block+.5)*PLOT/12+(row%2)*.08;
          const tint=hash01(`quay:${x}:${row}:${block}`);
          this.part('box',row===0?'#526a5d':tint>.5?'#958d79':'#a69c85',[bx,-.065+row*.075,bank],[.31,.069,.23],[0,(tint-.5)*.025,0]);
        }
        for(let joint=0;joint<8;joint+=1) {
          const bx=x*PLOT-1.8+joint*.49;
          this.part('leaf','foliage:#5f7447',[bx,.08,bank+toward*.07],[.07,.12,.07],[joint,0,joint]);
        }
        if(x%2!==0) {
          for(let step=0;step<5;step+=1) {const wear=hash01(`landing:${x}:${bank}:${step}`);this.part('box','stone',[x*PLOT+1.5+(wear-.5)*.025,.14-step*.045,bank+toward*(.05+step*.09)],[.7+wear*.04,.085,.2],[0,(wear-.5)*.025,0]);}
          this.part('pole','timber',[x*PLOT+.99,.27,bank],[.035,.44,.035]);
          this.part('orb','iron',[x*PLOT+.99,.48,bank],[.05,.025,.05]);
        }
      }
      // Quays are built from separate weathered stones and carry warm lantern reflections.
      for (let i=0;i<10;i+=1) for (const bank of [-3.08,-.92]) {
        this.part('box',i%3 ? 'stone':'paving',[x*PLOT-2+i*.4,.055,bank],[.38,.2,.19]);
      }
      if(x%2===0) for (const bank of [-3.12,-.88]) {
        const lx=x*PLOT+.9;
        this.beam('iron',[lx,.1,bank],[lx,1.05,bank],.022);
        this.beam('iron',[lx,1.05,bank],[lx+.22,1.05,bank],.018);
        this.part('orb','glow',[lx+.22,.87,bank],[.09,.14,.09]);
        for(const y of [.73,1.01]) this.part('pole','timber',[lx+.22,y,bank],[.075,.035,.075]);
      }

    }
    if(dense && this.model.city.buildings.length) {
      for(let x=b.minX;x<=b.maxX;x+=1) {
        const seed=`street-edge:${x}:${b.maxY}`;
        this.tree(x*PLOT-1.3,(b.maxY+.5)*PLOT+.35,1.05+hash01(seed)*.25,seed);
        this.tree(x*PLOT+.65,(b.maxY+.5)*PLOT+.5,1+hash01(`${seed}:back`)*.2,`${seed}:back`);
        this.tree(x*PLOT+.5,(b.minY-.5)*PLOT-.35,1.05+hash01(`${seed}:near`)*.22,`${seed}:near`);
      }
    }
    this.createRiver(new THREE.PlaneGeometry(span*2,2.05));
    for(const building of this.model.city.buildings.filter(b=>b.site&&!b.riverBridge)) {
      const s=building.site,dir=Math.cos(s.yaw),front=s.z+dir*s.depth/2;
      this.part('box','paving',[s.x,.015,s.z],[s.width+.12,.06,s.depth+.12]);
      this.part('box','paving',[s.x,.015,front+dir*.55],[s.width+.26,.06,1.05]);
      for(let i=0;i<Math.ceil(s.width/.45);i++)this.part('box','stone',[s.x-s.width/2+(i+.5)*s.width/Math.ceil(s.width/.45),.025,front+dir*1.02],[s.width/Math.ceil(s.width/.45)-.015,.07,.12]);
      // The first north-bank row has a separate rear service path towards the quay.
      const rear=s.z-dir*s.depth/2;
      if(dir<0&&rear>-8)this.part('box','paving',[s.x,-.005,(rear-3.2)/2],[.75,.04,Math.max(.1,-3.2-rear)]);
    }
  }

  createRiver(waterGeo,centerZ=-2) {
    const shader = {
      ...Reflector.ReflectorShader,
      uniforms: {...THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms), uTime: {value:0}, uWater: {value:new THREE.Color(this.palette.water)}},
      vertexShader: Reflector.ReflectorShader.vertexShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec2 vSurface; varying vec3 vWorldPosition;').replace('vUv = textureMatrix', 'vSurface = position.xy; vWorldPosition = (modelMatrix*vec4(position,1.)).xyz; vUv = textureMatrix'),
      fragmentShader: Reflector.ReflectorShader.fragmentShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec2 vSurface; varying vec3 vWorldPosition; uniform float uTime; uniform vec3 uWater;').replace('vec4 base = texture2DProj( tDiffuse, vUv );', `
        vec4 rippleUv=vUv;
        float swell=sin(vSurface.x*3.7+vSurface.y*5.2-uTime*.8);
        float ripple=sin(vSurface.x*11.3-vSurface.y*8.1+uTime*1.3+swell*.65);
        rippleUv.xy += vec2(swell*.0015+ripple*.0006,cos(vSurface.x*4.9+vSurface.y*7.1+uTime*.6)*.0019)*vUv.w;
        vec4 base=texture2DProj(tDiffuse,rippleUv);
        float edge=${this.model.city.futurePlan?'smoothstep(.8,1.,vSurface.y>-10.?abs(vSurface.x+12.)/1.1:abs(-vSurface.y-16.)/6.)':'smoothstep(.55,1.025,abs(vSurface.y))'};
        float fresnel=pow(1.-clamp(dot(normalize(cameraPosition-vWorldPosition),vec3(0.,1.,0.)),0.,1.),3.);
        base.rgb=mix(base.rgb,uWater,.18+edge*.18+(1.-fresnel)*.16);
        base.rgb*=1.-edge*.12;
        float glint=pow(max(0.,sin(vSurface.y*39.+swell*1.8+ripple*.35+uTime*.5)),24.);
        base.rgb+=glint*(.009+fresnel*.018);
      `),
    };
    const dpr=this.renderer.getPixelRatio();
    this.water = new Reflector(waterGeo,{textureWidth:Math.ceil(this.canvas.clientWidth*dpr),textureHeight:Math.ceil(this.canvas.clientHeight*dpr),color:'#79998e',clipBias:.003,shader});
    // Keep native-resolution reflection, but reuse it between updates while the camera rests.
    const reflect=this.water.onBeforeRender;
    const previousView=new THREE.Matrix4();
    let reflectedAt=-Infinity;
    this.water.onBeforeRender=(renderer,scene,camera,...args)=>{
      const now=this.frameTime||0;
      const moving=!previousView.equals(camera.matrixWorldInverse);
      // Do not stack a full reflection on a frame that already refreshed full-resolution shadows.
      if(this.shadowWasDue&&Number.isFinite(reflectedAt)){this.renderDirty=true;return;}
      if(!this.reflectionDirty && ((!moving && !this.a.motion) || now-reflectedAt<(moving?80:125)))return;
      reflect.call(this.water,renderer,scene,camera,...args);
      previousView.copy(camera.matrixWorldInverse);reflectedAt=now;this.reflectionDirty=false;
    };
    this.water.rotation.x=-Math.PI/2; this.water.position.set(0,.018,centerZ);
    this.world.add(this.water); this.disposables.push(waterGeo,this.water);
    // Fixed moorings occupy the canal between the existing bridges, never building plots.
    this.boats=[];
    for(const [i,bx] of (this.model.city.geoPlan?[28,74,112]:this.model.city.futurePlan?[-18,0,25]:[.1,4.2,-3.1]).entries()) {
      const boat=this.buildRiverBoat(i);
      const bz=this.model.city.geoPlan?[25,31,28][i]:this.model.city.futurePlan?(i===1?13.5:i===2?18:15):i===1?-2.5:i===2?-1.55:-2.05;
      boat.position.set(bx,.055,bz);boat.rotation.y=i===1?-.13:i===2?.12:.06;
      this.world.add(boat);this.boats.push(boat);
      const bank=this.model.city.geoPlan?[21,27,24][i]:this.model.city.futurePlan?10:i===1?-3.08:-.92;
      for(let segment=0;segment<8;segment+=1) {
        const point=u=>[bx-.6-.32*u,.17+.05*u-Math.sin(u*Math.PI)*.07,bz+(bank-bz)*u];
        this.beam('timber',point(segment/8),point((segment+1)/8),.008);
      }
      boat.userData.mooringX=bx;boat.userData.mooringZ=bz;
    }
  }

  buildRiverBoat(index) {
    const boat=new THREE.Group(),wood=this.material(index===1?'#70503b':'timber');
    const add=(geometry,material,position,scale,rotation=[0,0,0])=>{
      const mesh=new THREE.Mesh(geometry,material);mesh.position.set(...position);mesh.scale.set(...scale);mesh.rotation.set(...rotation);mesh.castShadow=true;mesh.receiveShadow=true;boat.add(mesh);return mesh;
    };
    const spar=(a,b,r=.012,material=wood)=>{
      const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),direction=to.clone().sub(from);
      const mesh=add(GEO.pole,material,from.add(to).multiplyScalar(.5).toArray(),[r,direction.length(),r]);
      mesh.quaternion.setFromUnitVectors(UP,direction.normalize());return mesh;
    };
    const outline=new THREE.Shape();
    outline.moveTo(-.88,0);outline.bezierCurveTo(-.6,-.33,.6,-.33,.88,0);outline.bezierCurveTo(.6,.33,-.6,.33,-.88,0);
    const opening=new THREE.Path();opening.moveTo(-.71,0);opening.bezierCurveTo(-.49,.24,.49,.24,.71,0);opening.bezierCurveTo(.49,-.24,-.49,-.24,-.71,0);outline.holes.push(opening);
    const shell=new THREE.ExtrudeGeometry(outline,{depth:.16,bevelEnabled:true,bevelSize:.014,bevelThickness:.014,bevelSegments:3,steps:1,curveSegments:24}).rotateX(-Math.PI/2);
    this.disposables.push(shell);add(shell,wood,[0,0,0],[1,1,1]);
    for(let plank=0;plank<5;plank+=1) add(GEO.box,wood,[0,.022,(plank-2)*.071],[1.28,.025,.065]);
    for(let rib=0;rib<7;rib+=1) add(GEO.box,this.material('#a57c53'),[(rib-3)*.18,.065,0],[.018,.07,.37]);
    for(const x of [-.42,.33]) add(GEO.box,wood,[x,.14,0],[.12,.035,.41]);
    // Raised bow/stern, an oar, ceramic cargo and a small lantern distinguish each hull.
    for(const side of [-1,1]) spar([side*.6,.12,0],[side*.87,.25,0],.025);
    const oar=new THREE.Group();oar.position.set(.1,.2,.08);boat.add(oar);
    oar.attach(spar([-.58,.19,-.19],[.65,.2,.31],.012));
    oar.attach(add(GEO.box,wood,[.68,.2,.32],[.22,.025,.075],[0,-.39,0]));
    if(index===0)boat.userData.oar=oar;
    add(GEO.taper,this.material('#b28a60'),[-.14,.12,0],[.07,.13,.07]);
    add(GEO.taper,this.material('#887950'),[.02,.1,-.11],[.055,.1,.055]);
    spar([-.57,.14,.1],[-.57,.48,.1],.012);
    add(GEO.orb,this.material('glow'),[-.57,.37,.1],[.045,.068,.045]);
    if(index===1) {
      for(const x of [-.27,.27]) for(const z of [-.18,.18]) spar([x,.14,z],[x,.45,z]);
      for(let slat=0;slat<9;slat+=1) {
        const z=(slat-4)*.047,y=.45+.065*Math.cos(z/.2*Math.PI/2);
        add(GEO.box,this.material('#af8c58'),[0,y,z],[.67,.025,.045],[z*.7,0,0]);
      }
    }
    if(this.a.place==='hoian'){const passenger=this.streetPerson(index===0?.33:-.35,.01,0,`boat-person:${index}`,index===0?'row':'sit',Math.PI/2,boat);if(index===0){passenger.phase=0;passenger.pace=1;}}
    boat.userData.phase=index*2.1;return boat;
  }

  figurePart(actor,owner,kind,mat,p,scale,rotation=[0,0,0]) {
    kind=geometryKind(kind,scale);
    const node=new THREE.Object3D();node.position.set(...p);node.scale.set(...scale);node.rotation.set(...rotation);
    node.userData={kind,mat,actor};owner.add(node);actor.parts.push(node);return node;
  }

  buildTradeGoods(trade) {
    const {seller,x,z,wares}=trade;
    const add=(...args)=>{const node=this.figurePart(seller,...args);node.userData.trade=trade;return node;};
    const root=new THREE.Group();this.world.add(root);trade.goodsRoot=root;trade.stockItems=[];
    for(let item=0;item<6;item++) {
      const group=new THREE.Group();group.position.set(x+(item%3-1)*.16,trade.shelfY,z+(Math.floor(item/3)-.5)*.12);root.add(group);trade.stockItems.push(group);
      const part=(kind,mat,p,size)=>add(group,kind,mat,p,size);
      if(wares===0)for(let fruit=0;fruit<3;fruit++)part('orb',fruit%2?'#bca04c':'#81924e',[(fruit-1)*.035,.02+fruit%2*.03,0],[.032,.033,.032]);
      else if(wares===1)part('vase','tile:#b98053',[0,.055,0],[.055,.12,.055]);
      else if(wares===2)for(let fold=0;fold<3;fold++)part('box',['#5f8583','#b67a6a','#d1bb8c'][fold],[0,.02+fold*.025,0],[.12,.023,.09]);
      else {part('bowl','#c7b795',[0,.025,0],[.06,.045,.06]);part('orb','#8d6d47',[0,.055,0],[.045,.008,.045]);}
    }
    const transfer=new THREE.Group();root.add(transfer);trade.transfer=transfer;
    add(transfer,'box','#b99e72',[0,0,0],[.11,.13,.075]);
    add(transfer,'hoop','timber',[0,.09,0],[.04,.04,.028]);
    const coin=new THREE.Group();root.add(coin);trade.coin=coin;
    add(coin,'pole','#c0a25e',[0,0,0],[.022,.006,.022],[Math.PI/2,0,0]);
  }

  animateTradeGoods(time) {
    this.tradeHand ??= new THREE.Vector3();
    for(const trade of this.trades) {
      if(trade.seller.poseTick!==this.actorPoseTick && time-(trade.lastGoodsTime??-Infinity)<.125)continue;
      trade.lastGoodsTime=time;
      const customer=trade.customers[trade.active];
      customer.parcel.getWorldPosition(this.tradeHand);
      const progress=trade.handover;
      trade.transfer.position.set(THREE.MathUtils.lerp(trade.x+.2,this.tradeHand.x,progress),THREE.MathUtils.lerp(trade.shelfY+.02,this.tradeHand.y,progress)+Math.sin(progress*Math.PI)*.08,THREE.MathUtils.lerp(trade.z-.03,this.tradeHand.z,progress));
      trade.transfer.scale.setScalar(trade.u>=19&&trade.u<23?1:.001);
      const pay=trade.payment;
      trade.coin.position.set(THREE.MathUtils.lerp(this.tradeHand.x,trade.x+.24,pay),.45+Math.sin(pay*Math.PI)*.07,THREE.MathUtils.lerp(this.tradeHand.z,trade.z-.03,pay));
      trade.coin.scale.setScalar(trade.u>=16&&trade.u<19?1:.001);
      if(trade.lastStock!==trade.stock) {
        trade.stockItems.forEach((item,i)=>item.scale.setScalar(i<trade.stock?1:.001));trade.lastStock=trade.stock;
      }
      trade.goodsRoot.updateWorldMatrix(true,true);
      // Goods have a shared owner batch even when that owner's distant body pose is sampled less.
      trade.goodsTick=this.actorPoseTick;
    }
  }

  streetPerson(x,y,z,seed,pose='walk',heading=0,parent=null,route=null) {
    const random=label=>hash01(`${seed}:${label}`);
    const shirt=['#526f7a','#a87950','#8b5650','#b6ab8e','#546b59'][Math.floor(random('shirt')*5)];
    const model=Math.floor(random('model')*6),skin=['#c69875','#b88764','#d0ab86'][model%3];
    const sitting=['sit','row','potter','eat'].includes(pose),hip=sitting?.19:.3;
    const root=new THREE.Group(),body=new THREE.Group();
    root.position.set(x,y,z);root.rotation.y=heading;root.add(body);
    if(!sitting)root.scale.setScalar([1.03,.94,1.08,.98,.91,1][model]);
    body.scale.set([.9,1.08,.96,1.04,.86,1.1][model],1,[1,.93,1.06,.94,1,1.08][model]);
    (parent||this.world).add(root);
    const actor={root,body,pose,route,heading,origin:root.position.clone(),phase:random('phase')*Math.PI*2,pace:.9+random('pace')*.25,parts:[],legs:[],arms:[]};
    const joint=(owner,p)=>{const node=new THREE.Group();node.position.set(...p);owner.add(node);return node;};
    const part=(owner,kind,mat,p,scale,rotation=[0,0,0])=>this.figurePart(actor,owner,kind,mat,p,scale,rotation);
    const bone=(owner,mat,a,b,r)=>{
      const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),direction=to.clone().sub(from);
      const node=part(owner,'pole',mat,from.clone().add(to).multiplyScalar(.5).toArray(),[r,direction.length(),r]);
      node.quaternion.setFromUnitVectors(UP,direction.normalize());return node;
    };
    part(body,'torso',shirt,[0,hip+.12,0],[.092,.25,.067]);
    for(let button=0;button<3;button++)part(body,'orb','#b5b09c',[.008,hip+.06+button*.043,.06],[.006,.006,.004]);
    if(['vendor','potter','carve'].includes(pose))part(body,'box','#b1a080',[0,hip+.025,.065],[.11,.24,.012]);
    else if(model===3)part(body,'torso',shirt,[0,hip-.045,0],[.11,.18,.072]);
    const head=joint(body,[0,hip+.27,0]);actor.head=head;
    part(head,'orb',skin,[0,.04,.006],[.051+model%2*.005,.064+model%3*.003,.049]);
    for(const side of [-1,1]) {
      part(head,'orb',skin,[side*.052,.04,0],[.011,.018,.013]);
      part(head,'orb','#3e3830',[side*.019,.05,.05],[.006,.005,.0035]);
    }
    part(head,'orb',skin,[0,.035,.057],[.009,.013,.012]);
    part(head,'box','#875d48',[0,.012,.052],[.018,.003,.003]);
    bone(body,skin,[0,hip+.23,0],[0,hip+.27,0],.023);
    for(const side of [-1,1]) {
      const leg=joint(body,[side*.036,hip,0]),knee=joint(leg,[0,-.14,0]),shin=sitting?.16:hip-.175;
      bone(leg,'#4c514b',[0,0,0],[0,-.14,0],.024);
      bone(knee,'#4c514b',[0,0,0],[0,-shin,0],.02);
      part(knee,'box','#493e34',[0,-shin+.01,.025],[.045,.035,.09]);
      part(knee,'orb','#4c514b',[0,0,0],[.026,.026,.025]);
      actor.legs.push({leg,knee,side});
      if(sitting){leg.rotation.x=-1.45;knee.rotation.x=1.45;}
      const arm=joint(body,[side*.063,hip+.21,0]),elbow=joint(arm,[side*.023,-.12,0]);
      bone(arm,shirt,[0,0,0],[side*.023,-.12,0],.024);
      bone(elbow,skin,[0,0,0],[-side*.015,-.115,0],.017);
      part(elbow,'orb',skin,[-side*.015,-.124,.007],[.021,.025,.016]);
      actor.arms.push({arm,elbow,side});
    }
    const builder=seed.endsWith(':builder')||seed.endsWith(':carrier');
    if(builder) {
      part(head,'orb','#d8b55d',[0,.095,0],[.07,.043,.065]);
      part(head,'box','#cba64c',[0,.078,.018],[.15,.012,.14]);
      for(const side of [-1,1])part(body,'box','#dfbd65',[side*.034,hip+.13,.054],[.012,.16,.012]);
    } else if(model%2===0)part(head,'hat','#c8b68c',[0,.116,0],[.11,.065,.11]);
    else {
      part(head,'orb','#493e34',[0,.084,-.008],[.057,.034,.053]);
      if(model===3)part(head,'orb','#493e34',[0,.055,-.055],[.033,.036,.026]);
      if(model===5)part(head,'box','#a99070',[0,.085,-.03],[.11,.035,.075]);
    }
    if(pose==='carry') {
      const load=joint(body,[0,hip-.015,.23]);
      part(load,'taper','#a8875b',[0,0,0],[.12,.12,.09]);
      part(load,'hoop','#c8b68c',[0,.065,0],[.115,.09,.075],[Math.PI/2,0,0]);
      if(builder)for(let brick=0;brick<3;brick+=1)part(load,'box','#a98565',[(brick-1)*.06,.075,0],[.055,.04,.11]);
    }
    if(pose==='customer') {
      actor.parcel=joint(body,[0,hip-.015,.2]);
      part(actor.parcel,'box','#b19162',[0,0,0],[.11,.13,.075]);
      part(actor.parcel,'hoop','timber',[0,.09,0],[.04,.04,.028]);
    }
    if(pose==='work'||pose==='carve') {
      const hand=actor.arms[1].elbow;
      part(hand,'pole','timber',[0,-.1,.045],[.009,.15,.009],[Math.PI/2,0,0]);
      part(hand,'box',pose==='carve'?'timber':'iron',[0,-.1,.11],[.055,.03,.03]);
      if(pose==='carve')part(actor.arms[0].elbow,'pole','iron',[0,-.115,.025],[.004,.11,.004]);
    }
    if(pose==='potter') {
      const wheel=joint(root,[0,.16,.28]);actor.wheel=wheel;
      part(wheel,'pole','stone',[0,0,0],[.19,.035,.19]);
      part(wheel,'vase','tile:#b07a56',[0,.065,0],[.055,.12,.055]);
      part(root,'pole','timber',[0,.1,0],[.12,.18,.12]);
    }
    if(pose==='eat') {
      part(actor.arms[0].elbow,'bowl','#bcae8e',[0,-.1,.02],[.05,.035,.05]);
      for(const side of [-1,1])part(actor.arms[1].elbow,'pole','timber',[side*.008,-.105,.055],[.003,.13,.003],[Math.PI/3,0,0]);
    }
    if(pose==='sit')part(actor.arms[1].elbow,'taper','#c8b98d',[0,-.12,0],[.025,.04,.025]);
    actor.bridgeRotation=this.bridgeRotations?.get(this.activeBridge);
    actor.parcelSite=this.activeBridge?this.model.city.buildings.find(b=>b.planId===this.activeBridge)?.site:null;
    this.actors.push(actor);return actor;
  }

  actorMatrix(node) {
    const actor=node.userData.actor;
    const matrix=fitHeritageQuay(this.actorUploadMatrix.copy(node.matrixWorld),actor.quayOrigin);
    if(actor.bridgeRotation) {
      if(actor.parcelSite) {
        if(!actor.rigidSite||actor.siteTick!==actor.poseTick) {
          const origin=new THREE.Vector3().setFromMatrixPosition(actor.root.matrixWorld),at=origin.clone().applyMatrix4(actor.bridgeRotation);
          actor.rigidSite=new THREE.Matrix4().makeTranslation(at.x,at.y,at.z).multiply(new THREE.Matrix4().makeRotationY(actor.parcelSite.yaw)).multiply(new THREE.Matrix4().makeTranslation(-origin.x,-origin.y,-origin.z));
          actor.siteTick=actor.poseTick;
        }
        matrix.premultiply(actor.rigidSite);
      }else matrix.premultiply(actor.bridgeRotation);
    }
    return matrix;
  }

  animatePeople(time) {
    this.actorPoseTick=(this.actorPoseTick||0)+1;
    this.actorDistance ??= new THREE.Vector3();
    this.actorFrustum ??= new THREE.Frustum();this.actorView ??= new THREE.Matrix4();this.actorSphere ??= new THREE.Sphere(new THREE.Vector3(),.65);
    this.actorFrustum.setFromProjectionMatrix(this.actorView.multiplyMatrices(this.camera.projectionMatrix,this.camera.matrixWorldInverse));
    // Paired shop activity shares one clock: approach, browse, hand over, then leave with a parcel.
    for(const trade of this.trades||[]) {
      tradeAt(time,trade.phase,trade);
    }
    for(const actor of this.actors||[]) {
      const {root,body,head,pose,route,phase,pace}=actor,t=time*pace+phase;
      // Tiny distant figures sample their poses at 15 Hz; nearby hands/feet retain scene cadence.
      this.actorDistance.setFromMatrixPosition(root.matrixWorld);
      if(actor.bridgeRotation)this.actorDistance.applyMatrix4(actor.bridgeRotation);
      this.actorSphere.center.copy(this.actorDistance);this.actorSphere.center.y+=.34;
      const cadence=!this.actorFrustum.intersectsSphere(this.actorSphere)?1/8:this.actorDistance.distanceToSquared(this.camera.position)>400?1/15:0;
      if(actor.lastPose!=null && time-actor.lastPose<cadence)continue;
      actor.lastPose=time;actor.poseTick=this.actorPoseTick;
      let walking=0,gait=t*7.2;
      if(actor.trade && pose==='customer') {
        const trade=actor.trade,u=trade.u;
        const active=(actor.customerIndex||0)===trade.active,length=trade.length+(actor.customerIndex||0)*.42,depth=(trade.depth||0)-(actor.customerIndex||0)*.12;
        root.position.copy(actor.origin);root.position.x+=active?trade.offset*length:0;
        root.position.z+=active?trade.offset*depth:0;
        walking=active?trade.walking:0;gait=trade.offset*length*14;
        const faceStall=THREE.MathUtils.smoothstep(u,9,11),leave=THREE.MathUtils.smoothstep(u,22,23),reset=THREE.MathUtils.smoothstep(u,36,44);
        root.rotation.y=Math.PI/2+(trade.heading-Math.PI/2)*faceStall+(-Math.PI/2-trade.heading)*leave+Math.PI*reset;
        if(!active)root.rotation.y=trade.heading;
        actor.parcel.scale.setScalar(active&&u>=23?.95:.001);
      }
      if(route) {
        // Stop, turn on the spot, then accelerate into the return trip; no teleport at the seam.
        const duration=route.length/.24,cycle=duration*2+4,u=(t%(cycle)+cycle)%cycle;
        const returning=u>=duration+2,travel=returning?u-duration-2:u;
        const progress=THREE.MathUtils.clamp(travel/duration,0,1);
        const eased=progress*progress*(3-2*progress),offset=(returning?1-eased:eased)-.5;
        root.position.copy(actor.origin);root.position[route.axis]+=offset*route.length;
        walking=travel<duration?Math.sin(progress*Math.PI):0;gait=eased*route.length*14;
        const turn=THREE.MathUtils.smoothstep(u,duration+.4,duration+1.6)-THREE.MathUtils.smoothstep(u,cycle-1.6,cycle-.4);
        root.rotation.y=actor.heading+turn*Math.PI;
      }
      if(actor.journey) {
        const trip=journeyAt(actor.journey,time+phase,actor.tripState ||= {});
        root.position.set(trip.x,trip.y,trip.z);
        if(actor.bridgeWalk)root.position.y=bridgeWalkHeight(trip[actor.bridgeWalk.axis]-actor.bridgeWalk.center-2);
        else if(actor.onBridge)root.position.y=bridgeWalkHeight(trip.z);
        const delta=Math.atan2(Math.sin(trip.heading-root.rotation.y),Math.cos(trip.heading-root.rotation.y));
        root.rotation.y+=delta*Math.min(1,(time-(actor.lastJourneyTime??time))*6);
        actor.lastJourneyTime=time;walking=trip.walking;gait=trip.distance*14;
      }
      const stride=Math.sin(gait)*.42*walking;
      body.position.y=Math.abs(Math.cos(gait))*.012*walking+Math.sin(t*1.7)*.002;
      body.rotation.z=Math.sin(t*3.6)*.025*walking;
      body.rotation.x=pose==='vendor'?.035+(actor.trade?.exchange||0)*.1:pose==='work'?.16+Math.sin(t*2.2)*.05:pose==='row'?Math.sin(t*1.4)*.06:0;
      head.rotation.y=Math.sin(t*.57)*.14*(1-walking);
      for(const {leg,knee,side} of actor.legs) {
        if(['sit','row','potter','eat'].includes(pose))continue;
        leg.rotation.x=stride*side;knee.rotation.x=Math.max(0,-Math.sin(gait)*side)*.45*walking;
      }
      for(const {arm,elbow,side} of actor.arms) {
        if(pose==='potter'||pose==='potterHelper'||pose==='carve') {
          const stroke=Math.sin(t*(pose==='carve'?3.2:1.8)+side*.35);
          arm.rotation.x=-.68+stroke*.09;elbow.rotation.x=-.7-stroke*.12;
        } else if(pose==='eat') {
          arm.rotation.x=side===1?-.72-Math.max(0,Math.sin(t*.8))*.22:-.55;
          elbow.rotation.x=side===1?-1.05:-.85;
        } else if(pose==='vendor') {
          const gesture=actor.trade?actor.trade.greet*.2+actor.trade.exchange*(side===1?.8:.35):Math.max(0,Math.sin(t*.95+side*.9))*.25;
          arm.rotation.x=-.25-gesture*.62;arm.rotation.z=side*(.08+gesture*.12);
          elbow.rotation.x=-.35-gesture*.35;
        } else if(pose==='customer' && (actor.customerIndex||0)===actor.trade.active && actor.trade.greet>0) {
          arm.rotation.x=-actor.trade.greet*.3-actor.trade.exchange*.65;
          elbow.rotation.x=-.15-actor.trade.exchange*.6;
        } else if(pose==='work') {
          arm.rotation.x=-.55-Math.max(0,Math.sin(t*2.2+side))*.5;
          elbow.rotation.x=-.5-Math.max(0,Math.sin(t*2.2+side))*.35;
        } else if(pose==='sit') {
          arm.rotation.x=side===1?-.55-Math.max(0,Math.sin(t*.65))*.35:-.1;
          elbow.rotation.x=side===1?-.95:-.2;
        } else if(pose==='customer' && (actor.customerIndex||0)===actor.trade.active && actor.trade.u>=23) {
          arm.rotation.x=-.55;elbow.rotation.x=-.7;
        } else if(pose==='carry'||pose==='row') {
          arm.rotation.x=-.65+(pose==='row'?Math.sin(t*1.4)*.3:Math.sin(t*.8)*.035);
          elbow.rotation.x=-.65;
        } else {
          arm.rotation.x=-stride*side*.8;elbow.rotation.x=-.12-Math.max(0,stride*side)*.25;
        }
      }
      if(actor.wheel)actor.wheel.rotation.y=t*2.3+.12*Math.sin(t*1.8);
      if(pose==='potterHelper')actor.legs[1].knee.rotation.x=.18+Math.max(0,Math.sin(t*1.8))*.25;
      root.updateWorldMatrix(true,true);
    }
    this.animateTradeGoods(time);
    for(const {mesh,nodes} of this.actorBatches||[]) {
      mesh.instanceMatrix.clearUpdateRanges();
      let start=-1;
      for(let i=0;i<=nodes.length;i+=1) {
        const changed=i<nodes.length && (nodes[i].userData.actor.poseTick===this.actorPoseTick||nodes[i].userData.trade?.goodsTick===this.actorPoseTick);
        if(changed){mesh.setMatrixAt(i,this.actorMatrix(nodes[i]));if(start<0)start=i;}
        else if(start>=0){mesh.instanceMatrix.addUpdateRange(start*16,(i-start)*16);start=-1;}
      }
      if(mesh.instanceMatrix.updateRanges.length)mesh.instanceMatrix.needsUpdate=true;
    }
  }

  buildParcelLife(plots=this.model.city.buildings.filter(b=>b.site)) {
    const recent=new Set(plots.slice(-60).map(b=>b.planId));
    // Bound optional decorative commerce; every real building and resident record is retained.
    for(const b of plots.filter(b=>recent.has(b.planId)||constructionProgress(b)<1)) {
      const s=b.site,c=plotCenter(b.plot),progress=constructionProgress(b);
      if(progress<1){this.activeBridge=b.planId;this.buildWorksite(b);this.activeBridge=null;continue;}
      if(b.riverBridge) {
        for(const side of [-1,1]){
          const x=c.x+side*.1,walker=this.streetPerson(x,.015,-3.94,`${b.planId}:walker:${side}`,'walk');
          walker.onBridge=true;walker.journey=streetJourney([[x,-3.94,.015,2],[x,-3.48,.33,0],[x,-2,.33,1],[x,-.52,.33,0],[x,-.06,.015,2],[x,-2,.33,0]]);
        }
        continue;
      }
      const dir=Math.cos(s.yaw),front=s.z+dir*(s.depth/2+.5);
      this.streetPerson(s.x,.015,front,`${b.planId}:visitor`,'walk',Math.PI/2,null,{axis:'x',length:Math.min(1.4,s.width*.35)});
      if(['ha-phuckien-v1','ha-quangtrieu-v1','ha-quancong-v1','ha-campho-v1'].includes(b.key))continue;
      if(b.key==='ha-thanhha-v1'||b.key==='ha-kimbong-v1'){
        this.streetPerson(s.x-.45,.015,front-dir*.35,`${b.planId}:craft`,b.key==='ha-thanhha-v1'?'potter':'carve',s.yaw);continue;
      }
      const x=s.x+.55,z=front;
      this.part('box','timber',[x,.28,z],[.58,.3,.3]);
      const trade={phase:hash01(b.planId)*44,length:1.5,depth:-.2,heading:Math.atan2(.38,-.33),x,z,shelfY:.46,market:b.key==='ha-cho-v1',wares:Math.floor(hash01(`${b.planId}:wares`)*4),customers:[]};
      this.trades.push(trade);
      const seller=this.streetPerson(x+.38,.015,z-.12,`${b.planId}:seller`,'vendor',Math.atan2(-.38,.33));seller.trade=trade;trade.seller=seller;
      for(let i=0;i<2;i++){const buyer=this.streetPerson(x-1.5-i*.42,.015,z+.4+i*.12,`${b.planId}:buyer:${i}`,'customer');buyer.trade=trade;buyer.customerIndex=i;trade.customers.push(buyer);}
      this.buildTradeGoods(trade);
    }
  }

  buildStreetscape(buildings=this.model.city.buildings.filter(b=>!b.site)) {
    const byPlot=new Map(buildings.map(b=>[`${b.plot.x},${b.plot.y}`,b]));
    for(const bridge of buildings.filter(b=>b.riverBridge && constructionProgress(b)>=1))for(const side of [-1,1]) {
      const c=plotCenter(bridge.plot),x=c.x+side*.1;
      const walker=this.streetPerson(x,.015,-3.94,`${bridge.planId}:walker:${side}`,'walk');
      walker.onBridge=true;
      walker.journey=streetJourney([[x,-3.94,.015,2],[x,-3.48,.33,0],[x,-2,.33,1],[x,-.52,.33,0],[x,-.06,.015,2],[x,-.52,.33,0],[x,-2,.33,0],[x,-3.48,.33,0]]);
    }
    for(const b of buildings) {
      const progress=constructionProgress(b);
      if(progress>0 && progress<1) {
        this.activeBridge=b.riverBridge?b.planId:null;this.buildWorksite(b);this.activeBridge=null;
      }
      if(b.riverBridge)continue;
      if(progress<.65) continue;
      const heritage=heritageOf(b.key),quiet=['ha-chuacau-v1','ha-phuckien-v1','ha-quangtrieu-v1','ha-quancong-v1','ha-campho-v1'].includes(b.key),craft=['ha-thanhha-v1','ha-kimbong-v1'].includes(b.key);
      const c=plotCenter(b.plot),next=byPlot.get(`${b.plot.x+1},${b.plot.y}`);
      if(progress>=.82)this.buildFrontageConnections(b,next);
      if(next && !heritage && !heritageOf(next.key) && constructionProgress(next)>=.65) {
        // Neighbouring earned frontages share a real planted pergola over the alley.
        const x=c.x+PLOT/2,z=c.z+(b.plot.y===-1?.2:.88);
        for(const dx of [-.38,.38]) for(const dz of [-.55,.55]) this.beam('timber',[x+dx,.04,z+dz],[x+dx,1.85,z+dz],.033);
        for(let course=0;course<8;course+=1) {
          const u=(course+.5)/8,rz=z-.64+u*1.28,ry=2.03-u*.25;
          this.part('box','tile',[x,ry,rz],[1.14,.035,.18],[.19,0,0]);
          for(let tile=0;tile<13;tile+=1) this.part('roofTile','tile:#68716a',[x-.52+tile*.086,ry+.03,rz],[.029,.18,.029],[Math.PI/2+.19,0,0]);
        }
        this.part('box','timber',[x,1.02,z-.35],[.75,.055,.23]);
        for(let jar=0;jar<4;jar+=1)this.part('taper',jar%2?'#b98855':'#c8b98d',[x+(jar-1.5)*.16,1.12,z-.35],[.055,.14,.055]);
        if(hash01(`${b.planId}:alley-life`)>.55) {
          this.beam('timber',[x-.48,1.65,z+.23],[x+.48,1.62,z+.23],.008);
          for(const side of [-1,1])this.part('cloth',side===1?'cloth:#a87950':'cloth:#c6b994',[x+side*.21,1.4,z+.23],[.24,.09,.4],[Math.PI/2,0,side*.08]);
          this.part('taper','timber',[x-.37,.2,z-.18],[.12,.32,.12]);
          this.beam('timber',[x+.43,.03,z-.25],[x+.38,.83,z-.36],.013);
        }
        for(let i=0;i<6;i+=1) this.beam('timber',[x-.5,1.84,z-.6+i*.24],[x+.5,1.84,z-.6+i*.24],.02);
        for(let i=0;i<90;i+=1) {
          const u=hash01(`${b.planId}:trellis:${i}`),v=hash01(`trellis:${i}`);
          this.part('leaf','foliage:#536e3f',[x+(u-.5)*1.1,2.08-v*.19,z+(v-.5)*1.2],[.1,.15,.1],[u*3,v*5,u]);
          if(i%3===0) this.part('orb','#b93678',[x+(u-.5)*1.1,2.09-v*.2,z+(v-.5)*1.2],[.04,.03,.04]);
        }
        for(let i=0;i<14;i+=1) {
          const u=i/14,v=(i+1)/14;
          this.beam('iron',[c.x+.8+u*2.4,2.35-Math.sin(u*Math.PI)*.28,c.z+1.18],[c.x+.8+v*2.4,2.35-Math.sin(v*Math.PI)*.28,c.z+1.18],.008);
        }
        for(let i=0;i<5;i+=1) {
          const u=(i+1)/6,lx=c.x+.8+u*2.4,ly=2.2-Math.sin(u*Math.PI)*.28;
          this.part('orb',i%2?'lanternRed':'glow',[lx,ly,c.z+1.18],[.075,.11,.075]);
          this.beam('timber',[lx,ly+.15,c.z+1.18],[lx,ly+.08,c.z+1.18],.009);
          this.beam('#c39040',[lx,ly-.11,c.z+1.18],[lx,ly-.21,c.z+1.18],.008);
        }
      }
      // Street furniture stays on the same plot; no decorative houses count as progress.
      const x=c.x+1.57,z=c.z+.65;
      this.part('taper','#a56c48',[x,.25,z],[.13,.35,.13]);
      for(let leaf=0;leaf<15;leaf+=1) this.part('leaf','foliage:#587642',[x+Math.sin(leaf)*.14,.43+hash01(`pot:${leaf}`)*.22,z+Math.cos(leaf)*.13],[.12,.25,.12],[leaf,.6,leaf]);
      if(!quiet && !craft && b.plot.y!==-1 && b.shape!=='tower') {
        const tx=c.x-.82,tz=c.z+1.62;
        this.part('pole','timber',[tx,.36,tz],[.2,.04,.2]);
        this.beam('iron',[tx,.06,tz],[tx,.34,tz],.017);
        for(const side of [-1,1]) {
          this.part('box','timber',[tx+side*.35,.2,tz],[.2,.04,.18]);
          for(const dx of [-.06,.06])this.beam('timber',[tx+side*.35+dx,.02,tz],[tx+side*.35+dx,.2,tz],.014);
        }
        this.part('taper','#b98855',[tx,.42,tz],[.04,.07,.04]);
      }
      const streetZ=c.z+(b.plot.y===-1?.79:1.58);
      const activity=hash01(`${b.planId}:street-life`),hasVendor=!quiet && !craft && (b.plot.y!==-1 || b.key==='ha-cho-v1') && (b.shape==='market'||activity>.48) && progress>=1;
      if(!hasVendor && !craft)this.streetPerson(c.x+(b.plot.y===-1?-1.8:0),.015,b.plot.y===-1?streetZ-.3:c.z+1.96,`${b.planId}:visitor`,activity>.5?'carry':'walk',b.plot.y===-1?0:Math.PI/2,null,{axis:b.plot.y===-1?'z':'x',length:b.plot.y===-1?.26:2.7});
      if(progress>=1 && !hasVendor && !quiet && !craft && b.plot.y!==-1 && b.shape!=='tower')this.streetPerson(c.x-.47,.015,c.z+1.62,`${b.planId}:neighbour`,b.key==='ha-cho-v1'?'eat':'sit',Math.PI/2);
      if(craft && progress>=1) {
        if(b.key==='ha-thanhha-v1') {
          const potter=this.streetPerson(c.x-.72,.015,c.z+.42,`${b.planId}:potter`,'potter');
          const helper=this.streetPerson(c.x-.34,.015,c.z+.58,`${b.planId}:wheel-helper`,'potterHelper',-Math.PI/2);
          helper.phase=potter.phase;helper.pace=potter.pace;
          potter.quayOrigin=this.heritageQuays.get(b.planId);helper.quayOrigin=potter.quayOrigin;
        } else {
          const carver=this.streetPerson(c.x-.72,.015,c.z+.31,`${b.planId}:carver`,'carve');
          const carrier=this.streetPerson(c.x+1.65,.015,c.z+.38,`${b.planId}:wood-carrier`,'carry',0,null,{axis:'z',length:.7});
          carver.quayOrigin=this.heritageQuays.get(b.planId);carrier.quayOrigin=carver.quayOrigin;
        }
      }
      if(b.key==='ha-cho-v1' && b.plot.y===-1 && progress>=1)for(const dx of [-.87,.77]) {
        const diner=this.streetPerson(c.x+dx,.015,c.z+.42,`${b.planId}:diner:${dx}`,'eat');
        diner.quayOrigin=c.z;
      }
      if(hasVendor) {
        // A fruit cart, parasol and vendor occupy the existing street edge.
        const north=b.plot.y===-1,vx=c.x+(north?.77:.99),vz=c.z+(north?.46:1.48);
        if(b.key!=='ha-cho-v1') {
        this.part('box','timber',[vx,.28,vz],[.58,.3,.3]);
        for(const side of [-1,1])this.part('hoop','iron',[vx+side*.22,.15,vz+.17],[.12,.12,.12]);
        this.beam('timber',[vx,.46,vz],[vx,1.13,vz],.018);
        this.part('hat',activity>.75?'#b47b57':'#718575',[vx,1.19,vz],[.45,.15,.4]);
        }
        const trade={phase:hash01(`${b.planId}:trade`)*44,length:north?2.07:2.29,depth:north?-.14:-.27,shelfY:b.key==='ha-cho-v1'?.55:.46,heading:Math.atan2(.33,-.33),x:vx,z:vz,market:b.key==='ha-cho-v1',wares:b.key==='ha-cho-v1'?3:Math.floor(hash01(`${b.planId}:wares`)*4)};
        this.trades.push(trade);
        const seller=this.streetPerson(vx+.38,b.key==='ha-cho-v1'?.16:.015,vz-.12,`${b.planId}:vendor`,'vendor',Math.atan2(-.38,.33));
        seller.trade=trade;trade.seller=seller;trade.customers=[];
        for(let i=0;i<2;i++) {
          const customer=this.streetPerson(c.x-1.3-i*.42,.015,c.z+(north?.78:1.96)+i*.12,`${b.planId}:customer:${i}`,'customer',Math.PI/2);
          customer.trade=trade;customer.customerIndex=i;trade.customers.push(customer);
        }
        this.buildTradeGoods(trade);

      }
      if(b.plot.y===0 || b.plot.y===-1) {
        const bankZ=b.plot.y===0?-.62:-3.33,bankX=c.x+1.7;
        this.part('taper','#a8875b',[bankX,.19,bankZ],[.13,.22,.11]);
        this.part('hoop','#c8b68c',[bankX,.31,bankZ],[.13,.1,.08],[Math.PI/2,0,0]);
        if(progress>=1 && !quiet) {
          const toward=b.plot.y===0?1:-1;
          const porter=this.streetPerson(bankX+.11,.015,bankZ+toward*.28,`${b.planId}:quay`,'carry');
          porter.journey=streetJourney([[bankX+.11,bankZ+toward*.28,.015,3],[bankX-.65,bankZ+toward*.28,.015,0],[bankX-1.05,bankZ+toward*.17,.015,3],[bankX-.65,bankZ+toward*.28,.015,0]]);
          for(let basket=0;basket<3;basket++) {
            this.part('taper',basket%2?'#99774e':'#b19566',[bankX-.05+basket*.18,.14,bankZ+toward*.12],[.075,.21,.075]);
            this.part('hoop','#c8b68c',[bankX-.05+basket*.18,.25,bankZ+toward*.12],[.071,.071,.023],[Math.PI/2,0,0]);
          }
          if(b.plot.x%2!==0)for(let plank=0;plank<5;plank++)this.part('box','timber',[c.x+1.5,.12,bankZ-toward*(.04+plank*.07)],[.6,.04,.063]);
        }
        if(activity>.5) {
          const toward=b.plot.y===0?-1:1;
          this.beam('timber',[bankX-.14,.5,bankZ],[bankX+.1,.74,bankZ+toward*.45],.008);
          this.beam('iron',[bankX+.1,.74,bankZ+toward*.45],[bankX+.1,.06,bankZ+toward*.52],.002);
        }
      }
      if(b.shape==='house') {
        for(const wheel of [-.2,.2]) {
          this.part('hoop','iron',[c.x-1.27+wheel,.21,c.z+.95],[.14,.14,.14]);
          for(let spoke=0;spoke<8;spoke+=1) {
            const angle=spoke*Math.PI/4;
            this.beam('iron',[c.x-1.27+wheel,.21,c.z+.95],[c.x-1.27+wheel+Math.sin(angle)*.14,.21+Math.cos(angle)*.14,c.z+.95],.004);
          }
        }
        this.beam('iron',[c.x-1.47,.21,c.z+.95],[c.x-1.19,.45,c.z+.95],.013);
        this.beam('iron',[c.x-1.19,.45,c.z+.95],[c.x-1.07,.21,c.z+.95],.013);
        this.part('box','timber',[c.x-1.22,.46,c.z+.95],[.12,.035,.08]);
      }
    }
  }

  buildFrontageConnections(b,next) {
    const c=plotCenter(b.plot),quiet=['ha-chuacau-v1','ha-phuckien-v1','ha-quangtrieu-v1','ha-quancong-v1','ha-campho-v1'].includes(b.key);
    // A side lane, drain and settled threshold join the house to its public pavement.
    if(!quiet && b.plot.y!==-1) {
      const lane=c.x+1.76;
      for(let slab=0;slab<9;slab++) {
        const z=c.z-.62+slab*.26,wear=hash01(`${b.planId}:lane:${slab}`);
        this.part('box',wear>.5?'paving':'stone',[lane,.027+(wear-.5)*.008,z],[.34,.035,.247],[0,(wear-.5)*.025,0]);
        this.part('box','#657461',[lane-.2,.012,z],[.026,.018,.25]);
      }
      for(let step=0;step<3;step++)this.part('box','stone',[c.x,.055+step*.035,c.z+1.18-step*.12],[.62,.07,.15]);
    }
    if(!quiet && b.shape==='house' && b.plot.y!==0 && b.plot.y!==-1 && constructionProgress(b)>=.95) {
      // A usable rear yard, with a low boundary and working objects, rather than empty grass.
      this.part('box','paving',[c.x,.025,c.z-1.66],[2.8,.04,.45]);
      for(const side of [-1,1]) {
        this.part('box','wall:#bbad83',[c.x+side*1.49,.27,c.z-1.53],[.08,.48,.65]);
        this.part('box','tile',[c.x+side*1.49,.53,c.z-1.53],[.14,.05,.71]);
      }
      this.part('vase','tile:#a97850',[c.x-.94,.23,c.z-1.65],[.12,.39,.12]);
      for(let wood=0;wood<6;wood++)this.part('box','timber',[c.x+.71,.07+wood*.035,c.z-1.65],[.62,.03,.2],[0,wood*.025,0]);
      this.beam('timber',[c.x-.7,.03,c.z-1.77],[c.x-.6,.72,c.z-1.71],.012);
      for(let twig=0;twig<7;twig++)this.beam('#a58e64',[c.x-.7,.03,c.z-1.77],[c.x-.77+twig*.022,.18,c.z-1.77],.005);
    }
    if(!next||quiet||['ha-chuacau-v1','ha-phuckien-v1','ha-quangtrieu-v1','ha-quancong-v1','ha-campho-v1'].includes(next.key)||constructionProgress(next)<.82||b.plot.y===-1)return;
    // Link existing earned frontages only; no decorative houses or unearned building facts.
    const x=c.x+2,z=c.z+.82;
    for(const side of [-1,1]) {
      this.beam('timber',[x+side*.27,.04,z],[x+side*.27,1.72,z],.025);
      this.beam('timber',[x+side*.27,1.42,z],[x,1.72,z],.015);
    }
    this.part('cloth','cloth:#b8a67d',[x,1.8,z],[.77,.08,.5],[.08,0,0]);
    this.part('orb','glow',[x,1.45,z+.03],[.065,.09,.065]);
    this.beam('timber',[x,1.72,z+.03],[x,1.54,z+.03],.008);
    for(let paving=0;paving<4;paving++)this.part('box','paving',[x+(paving-1.5)*.19,.028,z],[.18,.03,.57]);
  }

  buildWorksite(b) {
    const c=plotCenter(b.plot),x=c.x+1.74,z=c.z+.05;
    const progress=constructionProgress(b),elevated=progress>=.5 && progress<.82;
    if(progress>=.18) {
      for(const dz of [-.45,.45])this.beam('timber',[x,.03,z+dz],[x,1.45,z+dz],.023);
      for(const y of [.48,1.1])this.beam('timber',[x,y,z-.45],[x,y,z+.45],.02);
      this.beam('timber',[x,.06,z-.45],[x,1.4,z+.45],.016);
      this.part('box','timber',[x,.52,z],[.32,.045,.95]);
      for(let rung=0;rung<5;rung+=1)this.beam('timber',[x-.14,.12+rung*.18,z+.46],[x+.14,.12+rung*.18,z+.46],.014);
    }
    for(let plank=0;plank<4;plank+=1)this.part('box','timber',[x,.07+plank*.045,z+.63],[.28,.035,.54],[0,.08*plank,0]);
    for(let row=0;row<3;row+=1)for(let brick=0;brick<3;brick+=1)this.part('box',progress>=.65?'tile':'stone',[x-.1+brick*.09,.05+row*.055,z-.65],[.08,.05,.15]);
    this.part('taper','stone',[x-.03,.12,z-.9],[.1,.18,.1]);
    this.streetPerson(x-.02,elevated?.548:.015,z-.3,`${b.planId}:builder`,'work',Math.PI/2);
    if(progress>=.32) {
      const carrier=this.streetPerson(x-.08,.015,z+.95,`${b.planId}:carrier`,'carry');
      carrier.journey=streetJourney([[x-.08,z+.8,.015,3],[x-.08,z+.38,.015,0],[x-.08,z-.48,.015,4],[x-.08,z+.38,.015,0]]);
    }

  }

  buildHouse(b) {
    if (this.a.place === 'hoian' || heritageOf(b.key)) { drawHoiAnBuilding(this, b); return; }
    const c = plotCenter(b.plot);
    const spec = architectureOf(b);
    const { width: w, depth: d, floors, progress } = spec;
    const h=spec.height*(.94+hash01(b.planId)*.13);
    const pick = { type: 'building', planId: b.planId };
    const part = (kind, mat, x, y, z, sx, sy, sz, rotation = [0, 0, 0]) => this.part(kind, mat, [c.x + x, y, c.z + z], [sx, sy, sz], rotation, pick);
    const beam = (mat, from, to, radius) => this.beam(mat, [from[0] + c.x, from[1], from[2] + c.z], [to[0] + c.x, to[1], to[2] + c.z], radius, pick);
    part('box', 'stone', 0, 0.1, 0, w + 0.14, 0.17, d + 0.16);
    if (progress === 0) {
      for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) beam('timber', [x, 0.1, z], [x, 0.7, z], 0.04);
      return;
    }
    const builtH = progress < 0.35 ? h * 0.48 : h;
    part('box', 'plaster', 0, builtH / 2 + 0.16, 0, w, builtH, d);
    for (let f = 0; f < (progress < 0.35 ? 1 : floors); f += 1) {
      const fy = 0.16 + f * 0.9;
      part('box', 'timber', 0, fy + 0.04, 0, w + 0.07, 0.09, d + 0.07);
      if (progress < 0.4) continue;
      for (const x of [-w * 0.3, w * 0.3]) {
        for (const side of [-1, 1]) {
          const z = side * (d / 2 + 0.025);
          part('box', 'timber', x, fy + 0.48, z, 0.46, 0.6, 0.06);
          part('box', 'glow', x, fy + 0.48, z + side * 0.035, 0.34, 0.47, 0.02);
          part('box', 'timber', x, fy + 0.48, z + side * 0.05, 0.035, 0.48, 0.025);
          part('box', 'timber', x, fy + 0.46, z + side * 0.05, 0.36, 0.035, 0.025);
          if (this.a.place === 'hoian' || this.a.place === 'colmar') {
            for (const dx of [-0.31, 0.31]) part('box', 'timber', x + dx, fy + 0.48, z + side * 0.04, 0.17, 0.53, 0.05, [0, dx, 0]);
          }
        }
      }
      // Side windows prevent the town reading as decorated front faces on empty boxes.
      for (const side of [-1, 1]) for (const z of [-0.4, 0.4]) {
        part('box', 'timber', side * (w / 2 + 0.02), fy + 0.48, z, 0.05, 0.53, 0.36);
        part('box', 'glow', side * (w / 2 + 0.05), fy + 0.48, z, 0.02, 0.4, 0.25);
      }
      if (this.a.place === 'colmar' || this.a.place === 'kyoto') {
        for (const x of [-w / 2, 0, w / 2]) part('box', 'timber', x, fy + 0.45, d / 2 + 0.06, 0.07, 0.9, 0.07);
        if (this.a.place === 'colmar') for (const side of [-1, 1]) beam('timber', [side * w / 2, fy + 0.1, d / 2 + 0.06], [0, fy + 0.83, d / 2 + 0.06], 0.035);
      }
    }
    if (progress >= .4) {
      // Layered stone lintels, shutter boards and projecting shopfronts cast their own shadows.
      for (let f=0;f<floors;f+=1) for (const side of [-1,1]) for (const x of [-w*.3,w*.3]) {
        const y=.16+f*.9;
        part('box','stone',x,y+.8,side*(d/2+.07),.56,.065,.15);
        part('box','stone',x,y+.18,side*(d/2+.09),.55,.07,.18);
        for (const dx of [-.31,.31]) for (let j=0;j<4;j+=1)
          part('box','timber',x+dx,y+.28+j*.12,side*(d/2+.1),.16,.025,.04);
      }
      for (const x of [-w/2,w/2]) part('box','stone',x,h/2+.16,d/2+.015,.1,h,.08);
      part('arch','stone',0,.62,d/2+.13,.62,.95,.16);
      part('arch','timber',0,.62,d/2+.22,.49,.82,.045);
      part('arch','glow',0,.62,d/2+.25,.36,.67,.025);
      for (const x of [-.12,.12]) part('box','timber',x,.66,d/2+.23,.025,.68,.035);
    }
    if (progress >= 0.5) {
      const roofY = h + 0.2;
      if (this.a.place === 'paris') {
        part('taper', 'tile', 0, roofY + 0.36, 0, (w + 0.12) / 1.414, 0.72, (d + 0.12) / 1.414);
        part('box', 'tile', 0, roofY + 0.74, 0, w * 0.7, 0.08, d * 0.7);
        for (const x of [-w * 0.28, w * 0.28]) {
          part('box', 'stone', x, roofY + 0.34, d * 0.42, 0.35, 0.43, 0.2);
          part('box', 'glow', x, roofY + 0.33, d * 0.49, 0.22, 0.29, 0.03);
        }
        part('box', 'stone', w * 0.25, roofY + 0.97, -0.35, 0.22, 0.5, 0.25);
      } else {
        const rise = this.a.place === 'colmar' ? 1.05 : this.a.place === 'kyoto' ? 0.62 : 0.52;
        const reach = d / 2 + 0.22;
        const slope = Math.atan2(rise, reach);
        const len = Math.hypot(reach, rise);
        for (const side of [-1, 1]) {
          part('box', 'tile', 0, roofY + rise / 2, side * reach / 2, w + 0.35, 0.09, len, [side * slope, 0, 0]);
          for (let i = 0; i <= 16; i += 1) {
            const x = -w / 2 - 0.14 + (i / 16) * (w + 0.28);
            beam('tile', [x, roofY + rise + 0.04, 0], [x, roofY + 0.04, side * reach], 0.027);
          }
          for (let j = 1; j <= 6; j += 1) {
            const u = j / 6;
            part('box', j % 2 ? 'tile' : this.snow ? '#f1f1e8' : this.palette.roof, 0, roofY + rise * (1 - u) + 0.04, side * reach * u, w + 0.34, 0.035, 0.035);
          }
          // Overlapping curved terracotta courses break the single smooth roof plane.
          for (let row=0;row<8;row+=1) for (let col=0;col<15;col+=1) {
            const u=(row+.55)/8;
            const x=-w/2-.13+(col+.5)*(w+.26)/15;
            const y=roofY+rise*(1-u)+.075;
            const z=side*reach*u;
            const shade=this.snow ? '#eaebe4' : this.a.place==='kyoto' ? (col%3 ? '#535a50':'#697064') : (col%3 ? '#a56646':'#b47a54');
            part('pole',shade,x,y,z,.043,len/7.5,.043,[Math.PI/2+side*slope,0,0]);
          }
          // The gable is closed with wooden horizontal boards, rather than a hollow roof.
          for (let j = 0; j < 7; j += 1) {
            const u = j / 7;
            for (const end of [-1, 1]) part('box', 'timber', end * w / 2, roofY + rise * u, 0, 0.05, rise / 7 + 0.01, d * (1 - u));
          }
        }
        beam('tile', [-w / 2 - 0.23, roofY + rise + 0.05, 0], [w / 2 + 0.23, roofY + rise + 0.05, 0], 0.06);
        if (this.a.place === 'kyoto' && b.shape === 'temple') {
          part('taper', 'tile', 0, roofY + rise + 0.3, 0, w * 0.42, 0.35, d * 0.42);
          beam('timber', [0, roofY + rise, 0], [0, roofY + rise + 0.85, 0], 0.035);
        }
      }
    }
    if (progress >= 0.65) {
      part('box', 'timber', 0, 0.45, d / 2 + 0.06, 0.38, 0.7, 0.08);
      if (floors > 1) {
        part('box', 'timber', 0, 1.04, d / 2 + 0.19, w + 0.1, 0.1, 0.45);
        for (let i = 0; i < 11; i += 1) beam(this.a.place === 'paris' ? 'iron' : 'timber', [-w / 2 + (i / 10) * w, 1.07, d / 2 + 0.39], [-w / 2 + (i / 10) * w, 1.4, d / 2 + 0.39], 0.018);
        part('box', 'timber', 0, 1.41, d / 2 + 0.39, w + 0.09, 0.05, 0.06);
      }
      if (this.a.place === 'paris' || b.shape === 'market') {
        for (let i = 0; i < 9; i += 1) part('box', i % 2 ? '#e5d6b3' : this.a.place === 'paris' ? '#954a43' : '#647751', -w / 2 + (i + 0.5) * w / 9, 0.98, d / 2 + 0.25, w / 9, 0.05, 0.6, [0.18, 0, 0]);
      }
    }
    if (progress >= .8) {
      // A veranda, cafe furniture and climbing flowers give each plot a lived-in silhouette.
      for (const x of [-w*.43,w*.43]) beam('timber',[x,.15,d/2+.34],[x,h*.7,d/2+.34],.035);
      part('box','tile',0,h*.7,d/2+.23,w+.12,.06,.38,[.12,0,0]);
      part('pole','timber',w*.3,.32,d/2+.46,.17,.035,.17);
      beam('iron',[w*.3,.1,d/2+.46],[w*.3,.31,d/2+.46],.018);
      for (let i=0;i<85;i+=1) {
        const u=hash01(`${b.planId}:vine:${i}`), v=hash01(`${b.planId}:flower:${i}`);
        const vx=-w*.48+u*w*.82, vy=h*.8+Math.sin(u*9)*.12-v*.38;
        part('leaf',`foliage:${i%2?'#526e39':'#7e9148'}`,vx,vy,d/2+.2+v*.18,.12,.16,.12,[u*3,v*6,u*4]);
        if (i%3===0) part('orb','flower',vx,vy+.04,d/2+.32+v*.12,.055,.04,.055);
      }
      for (const side of [-1, 1]) {
        part('pole', '#a97552', side * (w / 2 + 0.13), 0.23, d / 2, 0.14, 0.3, 0.14);
        for (let i = 0; i < 5; i += 1) part('orb', i % 2 ? 'flower' : 'leaf', side * (w / 2 + 0.13) + Math.sin(i * 2) * 0.11, 0.42 + (i % 3) * 0.08, d / 2 + Math.cos(i * 2) * 0.08, 0.12, 0.15, 0.12);
      }
    }
    if (progress >= 1 && (this.a.place === 'hoian' || this.a.place === 'kyoto')) {
      for (const x of [-w * 0.35, 0, w * 0.35]) {
        beam('timber', [x, h + 0.1, d / 2 + 0.18], [x, h - 0.14, d / 2 + 0.18], 0.009);
        part('orb', x === 0 ? 'glow' : '#bf6245', x, h - 0.22, d / 2 + 0.18, 0.115, 0.16, 0.115);
        part('pole', 'glow', x, h - 0.41, d / 2 + 0.18, 0.015, 0.1, 0.015);
      }
    }
  }

  buildMilestones() {
    const city = this.model.city;
    const homes = new Map(city.buildings.map((b) => [b.planId, b]));
    // Keep residents and their day records accessible in the new visual layer.
    const residents=city.residents.slice(-320);
    for (const [i, r] of residents.entries()) {
      const home = homes.get(r.home);
      const c = home ? plotCenter(home.plot) : { x: 0, z: 0 };
      const x = home?.site&&!home.riverBridge?c.x-home.site.width*.25+(i%6)*.17:home?.riverBridge?c.x-.6+(i%6)*.22:c.x+1.65;
      const z = home?.site&&!home.riverBridge?c.z+Math.cos(home.site.yaw)*(home.site.depth/2+.55):home?.riverBridge?(i%2?-.52:-3.48):c.z-.7+(i%6)*.27;
      const pick = { type: 'resident', resident: r };
      if(i>=residents.length-24) {
        const actor=this.streetPerson(x,.015,z,`earned:${r.key||i}`,'walk',Math.PI/2,null,{axis:'x',length:.16});actor.pick=pick;continue;
      }
      this.part('torso',i%2?'#7b6351':'#64868b',[x,.22,z],[.08,.26,.06],[0,0,0],pick);
      this.part('orb','#d0a584',[x,.41,z],[.055,.066,.05],[0,0,0],pick);
      this.part('orb','#493e34',[x,.455,z-.008],[.056,.033,.05],[0,0,0],pick);
      for(const side of [-1,1])this.beam('#d0a584',[x+side*.07,.3,z],[x+side*.1,.15,z+.025],.017,pick);
      for (const side of [-1, 1]) this.beam('timber', [x + side * 0.035, 0.07, z], [x + side * 0.035, 0.15, z], 0.018, pick);
    }
    city.lanterns.forEach((r, i) => {
      const x = (i % 18 - 8.5) * 0.45;
      const z = 2.35 + Math.floor(i / 18) * 4;
      this.beam('timber', [x, 0.05, z], [x, 0.8, z], 0.018);
      this.part('orb', 'glow', [x, 0.85, z], [0.075, 0.1, 0.075], [0, 0, 0], { type: 'resident', resident: r });
    });
    city.statues.forEach((brick, i) => {
      const x = 2 + Math.floor(i / 8) * 4;
      const z = 2 + (i % 8) * 4;
      const pick = { type: 'statue', brick };
      this.part('box', 'stone', [x, 0.2, z], [0.5, 0.35, 0.5], [0, 0, 0], pick);
      this.part('orb', '#b29761', [x, 0.65, z], [0.14, 0.3, 0.14], [0, 0, 0], pick);
    });
    if (city.festivalNow) for (let i = 0; i < 16; i += 1) {
      const x = (i - 8) * 0.4;
      const y = 1.7 + Math.pow((i - 8) / 8, 2) * 0.3;
      this.part('orb', i % 2 ? 'glow' : '#b85948', [x, y, 2], [0.08, 0.11, 0.08]);
      if (i) this.beam('timber', [x - 0.4, y + 0.13, 2], [x, y + 0.12, 2], 0.008);
    }
  }

  createWeather() {
    const petal = this.a.place === 'kyoto' && this.a.season === 'spring';
    const autumn = this.a.season === 'autumn';
    const rain = this.a.weather === 'rain';
    this.weatherKind = this.snow ? 'snow' : rain ? 'rain' : petal ? 'petal' : autumn ? 'leaf' : null;
    this.particles = null;
    if (!this.weatherKind) return;
    const count = rain ? 240 : 100;
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < coords.length; i += 3) {
      coords[i] = (hash01(`wx:${i}`) - 0.5) * 35;
      coords[i + 1] = hash01(`wy:${i}`) * 12;
      coords[i + 2] = (hash01(`wz:${i}`) - 0.5) * 35;
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(coords, 3));
    const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(16, 16, rain ? 2 : 10, rain ? 15 : this.snow ? 10 : 5, 0.5, 0, Math.PI * 2); ctx.fill();
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.PointsMaterial({ color: this.snow ? '#ffffff' : rain ? '#d6e5e2' : petal ? '#efd1d7' : '#bc813b', size: rain ? 0.2 : 0.15, map: texture, transparent: true, opacity: rain ? 0.45 : 0.8, depthWrite: false });
    this.particles = new THREE.Points(geo, mat); this.world.add(this.particles);
    this.disposables.push(geo, mat, texture);
  }

  applySky(force = false) {
    super.applySky(force);
    if (!this.a || !this.artMaterials) return;
    const artSkyKey = `${this.appearanceSignature}:${this.skyMinute}`;
    if (!force && this.artSkyKey === artSkyKey) return;
    this.artSkyKey = artSkyKey;
    this.reflectionDirty=true;
    this.renderDirty=true;
    this.renderer.shadowMap.needsUpdate=true;
    this.nightAmount = this.a.light === 'night' ? 1 : this.a.light === 'live' ? (this.mats.lamp.emissiveIntensity-.5)/3.2 : 0;
    this.nightAmount=THREE.MathUtils.clamp(this.nightAmount,0,1);
    const dusk=this.nightAmount;
    const rain=this.a.weather==='rain'?1:0;
    const blend=(day,night)=>new THREE.Color(day).lerp(new THREE.Color(night),dusk);
    // Cool open-sky fill and warm direct sun keep shaded plaster/foliage out of sepia.
    this.hemi.color.copy(blend('#c2d9ed','#859fbf'));
    this.hemi.groundColor.copy(blend('#928875','#655d57'));
    this.hemi.intensity=THREE.MathUtils.lerp(1.35,1.15,dusk)+rain*.18;
    this.sun.color.copy(blend('#ffd9ab','#b0c5e1'));
    this.sun.intensity=THREE.MathUtils.lerp(3.1,.6,dusk)*(1-rain*.72);
    if(this.a.light!=='live') {
      const center=this.sun.target.position;
      const radius=(this.shadowSpan??20)*1.5;
      this.sun.position.set(center.x-radius*.8,radius*.57,center.z+radius*.55);
    }
    this.sun.shadow.normalBias=.018;
    this.renderer.toneMappingExposure=THREE.MathUtils.lerp(1.08,1.18,dusk);
    const horizon=blend('#dbd7c9','#344959').lerp(new THREE.Color('#87999f'),rain*.34);
    this.scene.background.copy(horizon);
    // Distance haze, not focus blur: nearby tiles stay crisp while far streets lose contrast.
    this.scene.fog=new THREE.FogExp2(horizon,(THREE.MathUtils.lerp(.006,.009,dusk)+rain*.006)*(this.model.city.futurePlan?.22:1));
    if(this.skyMaterial) {
      const uniforms=this.skyMaterial.uniforms;
      uniforms.bottom.value.copy(horizon);
      uniforms.top.value.copy(blend('#8baecb','#12283f')).lerp(new THREE.Color('#738d9e'),rain*.52);
      uniforms.sunDirection.value.copy(this.sun.position).sub(this.sun.target.position).normalize();
      uniforms.sunWarmth.value=(1-dusk)*(1-rain*.85);
    }
    const glow=this.artMaterials.get('glow');
    if(glow) {glow.emissive.set('#ffba63');glow.emissiveIntensity=THREE.MathUtils.lerp(.3,1.65,dusk);}
    const red=this.artMaterials.get('lanternRed');
    if(red)red.emissiveIntensity=THREE.MathUtils.lerp(.35,1.85,dusk);
    if(this.haloMaterial)this.haloMaterial.opacity=THREE.MathUtils.lerp(.055,.24,dusk);
    if(this.poolMaterial)this.poolMaterial.opacity=THREE.MathUtils.lerp(.05,.5,dusk);
  }

  buildSky() {
    const geo=new THREE.SphereGeometry(180,32,16);
    const mat=new THREE.ShaderMaterial({
      side:THREE.BackSide,depthWrite:false,
      uniforms:{
        top:{value:new THREE.Color('#8baecb')},bottom:{value:new THREE.Color('#dbd7c9')},
        sunDirection:{value:new THREE.Vector3(-.8,.57,.55).normalize()},sunWarmth:{value:1},
      },
      vertexShader:`varying vec3 vDirection;
        void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader:`uniform vec3 top;uniform vec3 bottom;uniform vec3 sunDirection;
        uniform float sunWarmth;varying vec3 vDirection;
        void main(){
          vec3 direction=normalize(vDirection);
          float height=smoothstep(-.08,.72,direction.y);
          vec3 sky=mix(bottom,top,height);
          float alignment=max(0.,dot(direction,sunDirection));
          float glow=pow(alignment,8.)*.18+pow(alignment,64.)*.12;
          sky+=vec3(1.,.58,.25)*glow*sunWarmth;
          // Subtle screen-space dither keeps the broad sky gradient from banding.
          float grain=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453);
          gl_FragColor=vec4(sky+(grain-.5)/255.,1.);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.skyMaterial=mat;
    const sky=new THREE.Mesh(geo,mat);sky.renderOrder=-100;this.world.add(sky);this.disposables.push(geo,mat);
  }

  // Extend the existing dev scene handle with a reproducible, read-only orbit/zoom capture.
  startBenchmark(mode,done) {
    if(!import.meta.env.DEV || this.benchmark)return;
    if(this.fly){this.camera.position.copy(this.fly.to.p);this.controls.target.copy(this.fly.to.t);this.fly=null;}
    const gl=this.renderer.getContext(),debug=gl.getExtension('WEBGL_debug_renderer_info');
    this.benchmark={mode,done,start:performance.now(),frames:[],position:this.camera.position.clone(),target:this.controls.target.clone(),damping:this.controls.enableDamping,
      gpu:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),width:this.canvas.width,height:this.canvas.height,dpr:this.renderer.getPixelRatio(),camera:this.camera.position.toArray(),lookAt:this.controls.target.toArray()};
    this.benchmarkVisibility=()=>{if(document.hidden && this.benchmark)this.benchmark.invalid=true;};
    document.addEventListener('visibilitychange',this.benchmarkVisibility);
    this.fly=null;this.controls.enableDamping=false;
  }

  benchmarkCamera(t) {
    const run=this.benchmark;if(!run)return;
    const elapsed=(t-run.start)/1000,offset=run.position.clone().sub(run.target);
    if(run.mode==='orbit')offset.applyAxisAngle(UP,Math.sin(elapsed*.7)*.85);
    else offset.multiplyScalar(1+.3*Math.sin(elapsed*.8));
    this.camera.position.copy(run.target).add(offset);this.controls.target.copy(run.target);
  }

  recordBenchmark() {
    const run=this.benchmark;if(!run)return;
    const now=performance.now(),elapsed=now-run.start;
    if(document.hidden || !this.onScreen || this.canvas.width!==run.width || this.canvas.height!==run.height)run.invalid=true;
    if(elapsed>=2000 && run.previous)run.frames.push(now-run.previous);
    run.previous=elapsed>=2000?now:null;
    if(elapsed<12000)return;
    const times=run.frames.slice().sort((a,b)=>a-b),sum=times.reduce((a,b)=>a+b,0);
    const result={mode:run.mode,valid:!run.invalid,gpu:run.gpu,width:run.width,height:run.height,dpr:run.dpr,camera:run.camera,lookAt:run.lookAt,frames:times.length,
      fps:times.length?+(1000*times.length/sum).toFixed(2):0,p95ms:times[Math.ceil(times.length*.95)-1],worstMs:times.at(-1),over50ms:times.filter(t=>t>50).length};
    this.camera.position.copy(run.position);this.controls.target.copy(run.target);this.controls.enableDamping=run.damping;
    document.removeEventListener('visibilitychange',this.benchmarkVisibility);
    this.benchmark=null;this.renderDirty=true;run.done(result);
  }

  renderScene() {
    this.camera.updateMatrixWorld();
    this.updateDetail();
    this.lastRenderedView ??= new THREE.Matrix4();
    if(!this.a.motion && !this.fly && !this.drop && !this.model.picking && !this.renderDirty && this.bloom?.enabled!==false && this.lastRenderedView.equals(this.camera.matrixWorld))return;
    this.lastRenderedView.copy(this.camera.matrixWorld);this.renderDirty=false;
    if(!this.composer) {
      this.composer=new EffectComposer(this.renderer);
      this.composer.renderTarget1.samples=4;this.composer.renderTarget2.samples=4;
      this.renderPass=new RenderPass(this.scene,this.camera);
      this.bloom=new UnrealBloomPass(new THREE.Vector2(this.canvas.clientWidth,this.canvas.clientHeight),.22,.45,1.05);
      this.output=new OutputPass();
      this.composer.addPass(this.renderPass);this.composer.addPass(this.bloom);this.composer.addPass(this.output);
    }
    this.bloom.strength=.10+(this.nightAmount||0)*.035;
    // Keep native pixels, geometry and MSAA while navigating. The soft fullscreen bloom returns
    // on the first settled frame; emissive lamps, billboard halos and ground pools remain visible.
    this.bloomPosition ??= this.camera.position.clone();this.bloomRotation ??= this.camera.quaternion.clone();
    const navigating=Boolean(this.benchmark||this.fly)||this.camera.position.distanceToSquared(this.bloomPosition)>1e-8||1-Math.abs(this.camera.quaternion.dot(this.bloomRotation))>1e-8;
    if(navigating)this.bloomMotionUntil=this.frameTime+100;
    this.bloom.enabled=this.frameTime>=(this.bloomMotionUntil||0);
    this.bloomPosition.copy(this.camera.position);this.bloomRotation.copy(this.camera.quaternion);
    this.shadowWasDue=this.renderer.shadowMap.needsUpdate;
    this.composer.render();
    this.recordBenchmark();
  }

  dispose() {
    if(this.benchmarkVisibility)document.removeEventListener('visibilitychange',this.benchmarkVisibility);
    for(const maps of this.textures?.values()||[])for(const map of Object.values(maps))map.dispose();
    this.bloom?.dispose();this.output?.dispose();this.composer?.dispose();
    super.dispose();
  }

  resize() {
    if(this.benchmark)this.benchmark.invalid=true;
    super.resize();
    this.composer?.setSize(this.canvas.clientWidth,this.canvas.clientHeight);
    this.reflectionDirty=true;
    this.renderDirty=true;
    if (this.water) this.water.getRenderTarget().setSize(Math.ceil(this.canvas.clientWidth*this.renderer.getPixelRatio()),Math.ceil(this.canvas.clientHeight*this.renderer.getPixelRatio()));
  }

  startDrop(sid) {
    const b = this.model.city.buildings.find((x) => x.bricks.some((brick) => brick.sid === sid));
    if (b) { this.focusBuilding(b.planId, this.a?.motion ? 1400 : 0); this.setSelection(b.planId); }
  }

  frame(t) {
    // Match the base scene's cadence before any simulation work. Hidden tabs never catch up.
    if(document.hidden || (!this.onScreen && !this.fly && !this.drop)) {if(this.benchmark)this.benchmark.invalid=true;this.weatherTick=t;return;}
    // A bounded cadence is steadier on the M3 than saturating the GPU during navigation.
    this.frameInterval=1000/40;
    if(t-this.lastFrame<this.frameInterval)return;
    this.frameTime=t;
    this.benchmarkCamera(t);
    if (this.a?.motion && this.onScreen) {
      const delta=Math.min(.05,Math.max(0,(t-(this.weatherTick||t))/1000));
      this.motionTime=(this.motionTime||0)+delta;
      const time = this.motionTime;
      this.windTime.value=time;
      // Static architecture keeps its full-resolution shadow map between small actor updates.
      this.camera.updateMatrixWorld();
      const orbiting=this.lastRenderedView && !this.lastRenderedView.equals(this.camera.matrixWorld);
      if(t-(this.shadowTick||0)>=(orbiting?350:125)){this.renderer.shadowMap.needsUpdate=true;this.shadowTick=t;}
      if (this.water) this.water.material.uniforms.uTime.value=time;
      for(const boat of this.boats||[]) { const phase=boat.userData.phase;boat.position.y=.055+Math.sin(time*.8+phase)*.009;boat.rotation.z=Math.sin(time*.65+phase)*.012;boat.position.x=boat.userData.mooringX+Math.sin(time*.45+phase)*.015;boat.position.z=boat.userData.mooringZ+Math.sin(time*.57+phase)*.012;if(boat.userData.oar)boat.userData.oar.rotation.y=Math.sin(time*1.4)*.16; }
      this.animatePeople(time);
      if (this.particles) {
        const attr = this.particles.geometry.attributes.position;
        const step = Math.min(0.05, Math.max(0, (t - (this.weatherTick || t)) / 1000));
        for (let i = 0; i < attr.count; i += 1) {
          let y = attr.getY(i) - step * (this.weatherKind === 'rain' ? 8 : 0.45);
          if (y < 0.1) y = 12;
          attr.setY(i, y);
          attr.setX(i, attr.getX(i) + Math.sin(time + i) * step * 0.1);
        }
        attr.needsUpdate = true;
      }
    }
    this.weatherTick = t;
    super.frame(t);
  }
}
