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
import { hash01, constructionProgress } from '../engine/city.js';
import { heritageOf } from '../engine/catalog.js';
import { fitHeritageQuay } from './heritage.js';
import { drawHoiAnBuilding } from './hoian.js';
import { architectureOf, DEFAULT_APPEARANCE, PLACES, snowIn, streetJourney, journeyAt, crossingDeck } from './art.js';

const GEO = {
  detailBox: new THREE.BoxGeometry(1,1,1),
  vase: new THREE.LatheGeometry([[.45,-.5],[.75,-.43],[1,-.12],[.9,.18],[.58,.32],[.55,.47],[.7,.5],[.56,.5],[.47,.31]].map(p=>new THREE.Vector2(...p)),16),
  bowl: new THREE.LatheGeometry([[0,-.5],[.4,-.45],[1,.5],[.88,.5],[.3,-.32],[0,-.32]].map(p=>new THREE.Vector2(...p)),16),
  cloth: new THREE.PlaneGeometry(1,1,6,3).rotateX(-Math.PI/2),
  hat: new THREE.ConeGeometry(1,1,18),
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
  }
  setModel(model) {
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
    const radius=b.shape==='tower'?5.2:craft?4.15:4.6,eye=b.shape==='tower'?3.8:craft?1.8:2.85;
    let best=null;
    for(let i=0;i<12;i++) {
      const angle=(i-5.5)*Math.PI/18,position={x:c.x+Math.sin(angle)*radius,y:eye,z:c.z+Math.cos(angle)*radius};
      let score=0;
      for(const other of this.model.city.buildings) {
        if(other.planId===planId||constructionProgress(other)<.18)continue;
        const p=plotCenter(other.plot),dx=position.x-c.x,dz=position.z-c.z;
        const u=Math.max(0,Math.min(1,((p.x-c.x)*dx+(p.z-c.z)*dz)/(dx*dx+dz*dz)));
        const clearance=Math.hypot(p.x-c.x-dx*u,p.z-c.z-dz*u);
        if(u>.16 && clearance<1.65 && target.y+(position.y-target.y)*u<3.2)score+=(1.65-clearance)*5;
      }
      for(const crown of this.treeCrowns||[]) {
        const dx=position.x-c.x,dy=position.y-target.y,dz=position.z-c.z;
        const u=Math.max(0,Math.min(1,((crown.x-c.x)*dx+(crown.y-target.y)*dy+(crown.z-c.z)*dz)/(dx*dx+dy*dy+dz*dz)));
        const distance=Math.hypot(crown.x-c.x-dx*u,crown.y-target.y-dy*u,crown.z-c.z-dz*u);
        if(u>.12 && distance<crown.r)score+=(crown.r-distance)*4;
      }
      score+=Math.abs(angle)*.07;
      if(!best||score<best.score)best={position,target,score};
    }
    this.flyTo(best,ms);this.renderDirty=true;
  }

  viewQuarter(mode,ms=1000) {
    const frames={river:{target:{x:0,y:.7,z:-2},position:{x:8.6,y:4.4,z:-1.7}},bridge:{target:{x:2,y:.85,z:-2},position:{x:-4.2,y:3.7,z:-1.8}}};
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
    this.bounds = plotBounds(this.model.city.buildings, this.model.city.candidates);
    this.heritageQuays=new Map(this.model.city.buildings.filter(b=>heritageOf(b.key)&&(b.plot.y===0||b.plot.y===-1)).map(b=>[b.planId,plotCenter(b.plot).z]));
    this.buildLandscape();
    this.buildSky();
    for (const b of this.model.city.buildings) this.buildHouse(b);
    if(this.a.place==='hoian') this.buildStreetscape();
    if (this.model.picking) {
      for (const plot of this.model.city.candidates) {
        const p = plotCenter(plot);
        this.part('box', 'candidate', [p.x, 0.07, p.z], [2.8, 0.08, 2.8], [0, 0, 0], { type: 'plot', plot });
      }
    }
    // Every original session remains independently selectable in the building's front mosaic.
    for (const b of this.model.city.buildings) {
      const c = plotCenter(b.plot);
      b.bricks.forEach((brick, i) => {
        const color = brick.kind === 'gold' ? '#dab762' : this.model.categories.get(brick.categoryId)?.color || '#71978b';
        this.part('box', color, [c.x - 0.85 + (i % 6) * 0.3, 0.12, c.z + 1.14 + Math.floor(i / 6) * 0.16], [0.23, 0.06, 0.12], [0, 0, 0], { type: 'brick', brick, planId: b.planId });
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
    fitHeritageQuay(matrix,this.heritageQuays?.get(pick?.planId));
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
      const mesh=this.instanced(GEO[kind],this.material(mat),nodes.length);
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      this.actorUploadMatrix ??= new THREE.Matrix4();
      nodes.forEach((node,i)=>mesh.setMatrixAt(i,fitHeritageQuay(this.actorUploadMatrix.copy(node.matrixWorld),node.userData.actor.quayOrigin)));
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
    if(this.a.place==='hoian' && !seed.startsWith('street-edge:') && hash01(`palm:${seed}`)>.7) {
      // Curved trunks and feathered fronds give the riverside a second tree silhouette.
      const height=size*(2.5+hash01(`palm-height:${seed}`)*.65);
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

  buildCoveredCrossing(x) {
    // Fixed public crossing and approaches: independent of plans, focus time and completion.
    for(const end of [-1,1]) {
      const z=-2+end*1.25;
      for(let step=0;step<4;step++)this.part('box','stone',[x,.13-step*.028,z+end*step*.13],[.84,.12,.15]);
      for(const side of [-1,1]) {
        this.part('box','stone',[x+side*.48,.27,z],[.16,.42,.35]);
        this.part('pole','timber',[x+side*.48,.71,z],[.035,.52,.035]);
        this.part('orb','glow',[x+side*.48,.93,z],[.065,.1,.065]);
      }
    }
    for(let board=0;board<31;board++) {
      const z=-3.14+board*.076,y=crossingDeck(z);
      this.part('box','timber',[x,y,z],[.72,.055,.071]);
    }
    for(const side of [-1,1]) {
      for(let bay=0;bay<6;bay++) {
        const z=-3.08+bay*.432;
        this.beam('timber',[x+side*.36,.28,z],[x+side*.36,1.45,z],.032);
        this.beam('timber',[x+side*.36,1.15,z],[x+side*.25,1.43,z+.16],.018);
      }
      this.part('box','timber',[x+side*.36,.7,-2],[.045,.2,2.3]);
      for(let bar=0;bar<30;bar++)this.beam('timber',[x+side*.36,.8,-3.12+bar*.077],[x+side*.36,1.15,-3.12+bar*.077],.01);
      // Individually curved courses, staggered grey clay and sculpted ridge ends.
      for(let row=0;row<8;row++) {
        const u=(row+.5)/8,y=1.76-u*.39+.07*Math.pow(u,4);
        this.part('box','tile',[x+side*u*.6,y,-2],[.108,.035,2.8],[0,0,-side*.52]);
      }
      for(let row=0;row<8;row++)for(let tile=0;tile<33;tile++) {
        const u=(row+.5)/8,wear=hash01(`crossing:${side}:${row}:${tile}`),y=1.78-u*.39+.07*Math.pow(u,4);
        this.part('roofTile',wear>.8?'tile:#7c7765':'tile:#505b57',[x+side*u*.6,y,-3.33+tile*.083],[.029,.09,.029],[0,0,Math.PI/2-side*.52]);
      }
      for(const z of [-3.36,-.64])this.beam('tile',[x,1.79,z],[x+side*.63,1.48,z],.037);
    }
    this.beam('tile',[x,1.83,-3.42],[x,1.83,-.58],.05);
    // Adjoining quiet shrine stands above the water, clear of the crossing's walking lane.
    for(const z of [-2.4,-1.6])this.part('box','stone',[x+.78,.18,z],[.23,.48,.24]);
    this.part('box','timber',[x+.78,.5,-2],[.83,.09,1.02]);
    this.part('box','wall:#c8ab76',[x+1.12,.95,-2],[.09,.85,.94]);
    for(const z of [-2.46,-1.54])this.part('box','wall:#c8ab76',[x+.78,.95,z],[.77,.85,.07]);
    this.part('box','timber',[x+.9,.8,-2],[.29,.42,.53]);
    for(const side of [-1,1])this.part('box','tile',[x+.78,1.5,-2+side*.26],[1.02,.06,.64],[side*.42,0,0]);
    this.beam('tile',[x+.24,1.65,-2],[x+1.32,1.65,-2],.035);
  }

  buildLandscape() {
    const dense=this.a.place==='hoian';
    // plotBounds includes a one-plot navigation margin. It is not an extra paved plaza.
    const b=dense && this.model.city.buildings.length ? {
      minX:this.bounds.minX+1,maxX:this.bounds.maxX-1,
      minY:this.bounds.minY+1,maxY:this.bounds.maxY-1,
    }:this.bounds;
    const padding=dense?0:1;
    const span = Math.max(48, (b.maxX - b.minX + 5) * PLOT, (b.maxY - b.minY + 5) * PLOT);
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
      // Walkable bridges stay on street axes, never over occupied plots.
      if (x % 2 === 0) {
        const bx = x * PLOT + 2;
        for (let i = 0; i < 11; i += 1) {
          const z = -3.16 + i * 0.232;
          const y = 0.12 + Math.sin((i / 10) * Math.PI) * 0.35;
          this.part('box', 'stone', [bx, y, z], [0.84, 0.16, 0.225]);
          if(!(dense && x===0))for (const side of [-1, 1]) {
            if (i % 2 === 0) {
              this.beam('stone', [bx + side * 0.38, y, z], [bx + side * 0.38, y + 0.42, z], 0.045);
              this.part('orb','stone',[bx+side*.38,y+.45,z],[.06,.06,.06]);
            }
            if (i < 10) this.beam('stone', [bx + side * 0.38, y + 0.38, z], [bx + side * 0.38, 0.5 + Math.sin(((i + 1) / 10) * Math.PI) * 0.35, z + 0.232], 0.035);
          }
        }
        if(x===0 && this.a.place==='hoian')this.buildCoveredCrossing(bx);

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
    const waterGeo = new THREE.PlaneGeometry(span*2, 2.05);
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
        float edge=smoothstep(.55,1.025,abs(vSurface.y));
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
      if(!this.reflectionDirty && ((!moving && !this.a.motion) || now-reflectedAt<(moving?80:125)))return;
      reflect.call(this.water,renderer,scene,camera,...args);
      previousView.copy(camera.matrixWorldInverse);reflectedAt=now;this.reflectionDirty=false;
    };
    this.water.rotation.x=-Math.PI/2; this.water.position.set(0,.018,-2);
    this.world.add(this.water); this.disposables.push(waterGeo,this.water);
    // Fixed moorings occupy the canal between the existing bridges, never building plots.
    this.boats=[];
    for(const [i,bx] of [.1,4.2,-3.1].entries()) {
      const boat=this.buildRiverBoat(i);
      const bz=i===1?-2.5:i===2?-1.55:-2.05;
      boat.position.set(bx,.055,bz);boat.rotation.y=i===1?-.13:i===2?.12:.06;
      this.world.add(boat);this.boats.push(boat);
      const bank=i===1?-3.08:-.92;
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

  streetPerson(x,y,z,seed,pose='walk',heading=0,parent=null,route=null) {
    const random=label=>hash01(`${seed}:${label}`);
    const shirt=['#526f7a','#a87950','#8b5650','#b6ab8e','#546b59'][Math.floor(random('shirt')*5)];
    const skin='#c69875',sitting=['sit','row','potter','eat'].includes(pose),hip=sitting?.19:.3;
    const root=new THREE.Group(),body=new THREE.Group();
    root.position.set(x,y,z);root.rotation.y=heading;root.add(body);
    (parent||this.world).add(root);
    const actor={root,body,pose,route,heading,origin:root.position.clone(),phase:random('phase')*Math.PI*2,pace:.9+random('pace')*.25,parts:[],legs:[],arms:[]};
    const joint=(owner,p)=>{const node=new THREE.Group();node.position.set(...p);owner.add(node);return node;};
    const part=(owner,kind,mat,p,scale,rotation=[0,0,0])=>{
      kind=geometryKind(kind,scale);
      const node=new THREE.Object3D();node.position.set(...p);node.scale.set(...scale);node.rotation.set(...rotation);
      node.userData={kind,mat,actor};owner.add(node);actor.parts.push(node);return node;
    };
    const bone=(owner,mat,a,b,r)=>{
      const from=new THREE.Vector3(...a),to=new THREE.Vector3(...b),direction=to.clone().sub(from);
      const node=part(owner,'pole',mat,from.clone().add(to).multiplyScalar(.5).toArray(),[r,direction.length(),r]);
      node.quaternion.setFromUnitVectors(UP,direction.normalize());return node;
    };
    part(body,'pole',shirt,[0,hip+.12,0],[.075,.24,.055]);
    const head=joint(body,[0,hip+.27,0]);actor.head=head;
    part(head,'orb',skin,[0,.04,.006],[.054,.066,.052]);
    bone(body,skin,[0,hip+.23,0],[0,hip+.27,0],.023);
    for(const side of [-1,1]) {
      const leg=joint(body,[side*.036,hip,0]),knee=joint(leg,[0,-.14,0]),shin=sitting?.16:hip-.175;
      bone(leg,'#4c514b',[0,0,0],[0,-.14,0],.024);
      bone(knee,'#4c514b',[0,0,0],[0,-shin,0],.02);
      part(knee,'box','#493e34',[0,-shin+.01,.025],[.045,.035,.09]);
      actor.legs.push({leg,knee,side});
      if(sitting){leg.rotation.x=-1.45;knee.rotation.x=1.45;}
      const arm=joint(body,[side*.063,hip+.21,0]),elbow=joint(arm,[side*.023,-.12,0]);
      bone(arm,shirt,[0,0,0],[side*.023,-.12,0],.024);
      bone(elbow,skin,[0,0,0],[-side*.015,-.115,0],.017);
      actor.arms.push({arm,elbow,side});
    }
    const builder=seed.endsWith(':builder')||seed.endsWith(':carrier');
    if(builder) {
      part(head,'orb','#d8b55d',[0,.095,0],[.07,.043,.065]);
      part(head,'box','#cba64c',[0,.078,.018],[.15,.012,.14]);
      for(const side of [-1,1])part(body,'box','#dfbd65',[side*.034,hip+.13,.054],[.012,.16,.012]);
    } else if(random('hat')>.28)part(head,'hat','#c8b68c',[0,.116,0],[.11,.065,.11]);
    else part(head,'orb','#493e34',[0,.084,-.008],[.057,.034,.053]);
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
    this.actors.push(actor);return actor;
  }

  animatePeople(time) {
    this.actorPoseTick=(this.actorPoseTick||0)+1;
    this.actorDistance ??= new THREE.Vector3();
    // Paired shop activity shares one clock: approach, browse, hand over, then leave with a parcel.
    for(const trade of this.trades||[]) {
      const u=(time+trade.phase)%26,approach=THREE.MathUtils.smoothstep(u,0,9),depart=THREE.MathUtils.smoothstep(u,14,23);
      trade.u=u;trade.offset=approach-depart;
      trade.walking=u<9?Math.sin(u/9*Math.PI):u>=14&&u<23?Math.sin((u-14)/9*Math.PI):0;
      trade.greet=THREE.MathUtils.smoothstep(u,9,10)*(1-THREE.MathUtils.smoothstep(u,13,14));
      trade.exchange=Math.sin(THREE.MathUtils.smoothstep(u,10.5,12.5)*Math.PI);
    }
    for(const actor of this.actors||[]) {
      const {root,body,head,pose,route,phase,pace}=actor,t=time*pace+phase;
      // Tiny distant figures sample their poses at 15 Hz; nearby hands/feet retain scene cadence.
      this.actorDistance.setFromMatrixPosition(root.matrixWorld);
      if(this.actorDistance.distanceToSquared(this.camera.position)>400 && actor.lastPose!=null && time-actor.lastPose<1/15)continue;
      actor.lastPose=time;actor.poseTick=this.actorPoseTick;
      let walking=0,gait=t*7.2;
      if(actor.trade && pose==='customer') {
        const trade=actor.trade,u=trade.u;
        root.position.copy(actor.origin);root.position.x+=trade.offset*trade.length;
        root.position.z+=trade.offset*(trade.depth||0);
        walking=trade.walking;gait=trade.offset*trade.length*14;
        const faceStall=THREE.MathUtils.smoothstep(u,8,9.5),leave=THREE.MathUtils.smoothstep(u,13,14),reset=THREE.MathUtils.smoothstep(u,24,26);
        root.rotation.y=Math.PI/2+(trade.heading-Math.PI/2)*faceStall+(-Math.PI/2-trade.heading)*leave+Math.PI*reset;
        actor.parcel.scale.setScalar(u>=12?.95:.001);
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
        if(actor.onCrossing && trip.z>=-3.14 && trip.z<=-.86)root.position.y=crossingDeck(trip.z)+.04;
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
        } else if(pose==='customer' && actor.trade.greet>0) {
          arm.rotation.x=-actor.trade.greet*.3-actor.trade.exchange*.65;
          elbow.rotation.x=-.15-actor.trade.exchange*.6;
        } else if(pose==='work') {
          arm.rotation.x=-.55-Math.max(0,Math.sin(t*2.2+side))*.5;
          elbow.rotation.x=-.5-Math.max(0,Math.sin(t*2.2+side))*.35;
        } else if(pose==='sit') {
          arm.rotation.x=side===1?-.55-Math.max(0,Math.sin(t*.65))*.35:-.1;
          elbow.rotation.x=side===1?-.95:-.2;
        } else if(pose==='customer' && actor.trade.u>=12) {
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
    for(const {mesh,nodes} of this.actorBatches||[]) {
      mesh.instanceMatrix.clearUpdateRanges();
      let start=-1;
      for(let i=0;i<=nodes.length;i+=1) {
        const changed=i<nodes.length && nodes[i].userData.actor.poseTick===this.actorPoseTick;
        if(changed){mesh.setMatrixAt(i,fitHeritageQuay(this.actorUploadMatrix.copy(nodes[i].matrixWorld),nodes[i].userData.actor.quayOrigin));if(start<0)start=i;}
        else if(start>=0){mesh.instanceMatrix.addUpdateRange(start*16,(i-start)*16);start=-1;}
      }
      if(mesh.instanceMatrix.updateRanges.length)mesh.instanceMatrix.needsUpdate=true;
    }
  }

  buildStreetscape() {
    const buildings=this.model.city.buildings;
    const byPlot=new Map(buildings.map(b=>[`${b.plot.x},${b.plot.y}`,b]));
    // The public crossing has a real continuous route, including the arched deck height.
    if(buildings.some(b=>constructionProgress(b)>=1))for(const side of [-1,1]) {
      const walker=this.streetPerson(2+side*.12,.015,-3.7,`crossing:walker:${side}`,'walk');
      walker.onCrossing=true;
      walker.journey=streetJourney([[2+side*.12,-3.68,.015,1],[2+side*.12,-3.14,.27,0],[2+side*.12,-2,.62,1],[2+side*.12,-.82,.27,0],[2+side*.12,-.38,.015,2],[2+side*.12,-.82,.27,0],[2+side*.12,-2,.62,0],[2+side*.12,-3.14,.27,0]]);
    }
    for(const b of buildings) {
      const progress=constructionProgress(b);
      if(progress>0 && progress<1)this.buildWorksite(b);
      if(progress<.65) continue;
      const heritage=heritageOf(b.key),quiet=['ha-chuacau-v1','ha-phuckien-v1'].includes(b.key),craft=['ha-thanhha-v1','ha-kimbong-v1'].includes(b.key);
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
      const activity=hash01(`${b.planId}:street-life`),hasVendor=!quiet && !craft && b.plot.y!==-1 && (b.shape==='market'||activity>.48) && progress>=1;
      if(!hasVendor && !craft)this.streetPerson(c.x+(b.plot.y===-1?-1.8:0),.015,b.plot.y===-1?streetZ-.3:c.z+1.96,`${b.planId}:visitor`,activity>.5?'carry':'walk',b.plot.y===-1?0:Math.PI/2,null,{axis:b.plot.y===-1?'z':'x',length:b.plot.y===-1?.26:2.7});
      if(progress>=1 && !quiet && !craft && b.plot.y!==-1 && b.shape!=='tower')this.streetPerson(c.x-.47,.015,c.z+1.62,`${b.planId}:neighbour`,b.key==='ha-cho-v1'?'eat':'sit',Math.PI/2);
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
        const vx=c.x+.99,vz=c.z+1.48;
        this.part('box','timber',[vx,.39,vz],[.58,.45,.3]);
        for(const side of [-1,1])this.part('hoop','iron',[vx+side*.22,.15,vz+.17],[.12,.12,.12]);
        this.beam('timber',[vx,.46,vz],[vx,1.13,vz],.018);
        this.part('hat',activity>.75?'#b47b57':'#718575',[vx,1.19,vz],[.45,.15,.4]);
        for(let fruit=0;fruit<15;fruit+=1)this.part('orb',fruit%2?'#b28d4e':'#85914c',[vx+(fruit%5-2)*.09,.65,vz+(Math.floor(fruit/5)-1)*.065],[.04,.038,.04]);
        const trade={phase:hash01(`${b.planId}:trade`)*26,length:2.29,depth:-.27,heading:Math.atan2(.33,-.33)};
        this.trades.push(trade);
        const seller=this.streetPerson(vx+.38,.015,vz-.12,`${b.planId}:vendor`,'vendor',Math.atan2(-.33,.6));
        const customer=this.streetPerson(c.x-1.3,.015,c.z+1.96,`${b.planId}:customer`,'customer',Math.PI/2);
        seller.trade=trade;customer.trade=trade;
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
    const c=plotCenter(b.plot),quiet=['ha-chuacau-v1','ha-phuckien-v1'].includes(b.key);
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
    if(!next||quiet||['ha-chuacau-v1','ha-phuckien-v1'].includes(next.key)||constructionProgress(next)<.82||b.plot.y===-1)return;
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
    for (const [i, r] of city.residents.slice(-320).entries()) {
      const home = homes.get(r.home);
      const c = home ? plotCenter(home.plot) : { x: 0, z: 0 };
      const x = c.x + 1.35;
      const z = c.z - 0.9 + (i % 6) * 0.32;
      const pick = { type: 'resident', resident: r };
      this.part('pole', i % 2 ? '#7b6351' : '#64868b', [x, 0.22, z], [0.065, 0.26, 0.065], [0, 0, 0], pick);
      this.part('orb', '#d0a584', [x, 0.41, z], [0.066, 0.072, 0.066], [0, 0, 0], pick);
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
    this.scene.fog=new THREE.FogExp2(horizon,THREE.MathUtils.lerp(.006,.009,dusk)+rain*.006);
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
    if(!this.a.motion && !this.fly && !this.drop && !this.model.picking && !this.renderDirty && this.lastRenderedView.equals(this.camera.matrixWorld))return;
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
    if(t-this.lastFrame<(this.frameInterval??1000/40))return;
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
