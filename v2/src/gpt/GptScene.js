import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { CityScene } from '../city/CityScene.js';
import { plotBounds, plotCenter, PLOT } from '../city/layout.js';
import { hash01 } from '../engine/city.js';
import { drawHoiAnBuilding } from './hoian.js';
import { architectureOf, DEFAULT_APPEARANCE, PLACES, snowIn } from './art.js';

const GEO = {
  box: new RoundedBoxGeometry(1, 1, 1, 2, 0.04),
  orb: new THREE.SphereGeometry(1, 12, 9),
  pole: new THREE.CylinderGeometry(1, 1, 1, 10),
  roofTile: new THREE.CylinderGeometry(1, 1, 1, 8, 1, true, Math.PI/2, Math.PI),
  taper: new THREE.CylinderGeometry(0.68, 1, 1, 4).rotateY(Math.PI / 4),
};
// Curved leaf silhouettes give foliage a broken, organic edge instead of sphere clusters.
const leafShape=new THREE.Shape();
leafShape.moveTo(0,0);leafShape.bezierCurveTo(-.45,.25,-.4,.7,0,1);
leafShape.bezierCurveTo(.4,.7,.45,.25,0,0);
const leafGeometry=new THREE.ShapeGeometry(leafShape,8);
const leafPos=leafGeometry.attributes.position;
for(let i=0;i<leafPos.count;i+=1) leafPos.setZ(i,Math.sin(leafPos.getY(i)*Math.PI)*.055);
leafGeometry.computeVertexNormals();
GEO.leaf = leafGeometry;

// Deterministic, locally generated material relief: no remote assets or loading dependencies.
function surfaceTexture(kind) {
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
    if(kind==='paving' || kind==='tile') {
      const row=Math.floor(y/64),px=(x+(row%2)*32)%64,py=y%64;
      const joint=px<2 || py<2;
      const slab=random(Math.floor((x+(row%2)*32)/64),row);
      shade=joint?.4:.76+(slab-.5)*.19+(fine-.5)*.11+(grit-.5)*.035;
      relief=joint?.16:.53+(fine-.5)*.12;rough=joint?.98:.83+(fine-.5)*.17;
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
  const maps=canvases.map((canvas,i)=>{contexts[i].putImageData(pixels[i],0,0);const t=new THREE.CanvasTexture(canvas);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;if(i===0)t.colorSpace=THREE.SRGBColorSpace;return t;});
  return {color:maps[0],height:maps[1],roughness:maps[2]};
}

// Material roles include the independently shaded quay stones and boat timbers.
const SURFACES=new Map([
  ...['#526a5d','#958d79','#a69c85','#afa58e','#b3a68f'].map(key=>[key,'stone']),
  ...['#70503b','#a57c53','#af8c58'].map(key=>[key,'timber']),
]);

const canopy = new THREE.SphereGeometry(1,18,12);
const canopyPos=canopy.attributes.position;
for(let i=0;i<canopyPos.count;i+=1) {
  const x=canopyPos.getX(i),y=canopyPos.getY(i),z=canopyPos.getZ(i);
  const r=1+.13*Math.sin(x*12+y*6)*Math.cos(z*11)+.08*Math.sin(y*18+z*4);
  canopyPos.setXYZ(i,x*r,y*r,z*r);
}
canopy.computeVertexNormals(); GEO.canopy=canopy;
const archShape=new THREE.Shape();
archShape.moveTo(-.5,-.5); archShape.lineTo(.5,-.5); archShape.lineTo(.5,0);
archShape.absarc(0,0,.5,0,Math.PI,false); archShape.lineTo(-.5,-.5);
GEO.arch=new THREE.ExtrudeGeometry(archShape,{depth:1,bevelEnabled:false,curveSegments:16}).translate(0,0,-.5);
const UP = new THREE.Vector3(0, 1, 0);

/** Same canvas lifecycle, picking and camera navigation as v2; a separate art layer only. */
export class GptScene extends CityScene {
  setModel(model) {
    const signature = JSON.stringify(model.appearance);
    if (signature !== this.appearanceSignature) {
      this.appearanceSignature = signature;
      this.signature = '';
    }
    super.setModel(model);
  }

  rebuild() {
    this.clearWorld();
    this.renderer.toneMapping=THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.05;
    this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    this.bodies = null;
    this.storeys = null;
    this.windows = null;
    this.drop = null;
    this.plotTiles = null;
    this.batches = new Map();
    this.artMaterials = new Map();
    this.textures = new Map();
    this.a = this.model.appearance || DEFAULT_APPEARANCE;
    this.palette = PLACES[this.a.place] || PLACES.hoian;
    this.snow = snowIn(this.a);
    this.bounds = plotBounds(this.model.city.buildings, this.model.city.candidates);
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
  }

  material(key) {
    if (this.artMaterials.has(key)) return this.artMaterials.get(key);
    const p = this.palette;
    const colors = { lanternRed:'#b9442a', plaster: p.wall, timber: p.wood, tile: this.snow ? '#e6e8e1' : p.roof, stone: '#a2a297', paving: this.snow ? '#d9ded9' : '#b9b09a', leaf: this.snow ? '#a5b8a5' : this.a.season === 'autumn' ? '#b0803e' : p.leaf, flower: this.a.season === 'spring' ? '#e5b2bc' : p.flower, glow: '#e6ac56', iron: '#3b514a', candidate: '#d6b96b' };
    const mat = new THREE.MeshStandardMaterial({ color: colors[key] || (key.startsWith('foliage:') ? key.slice(8) : key.startsWith('wall:') ? key.slice(5) : key), roughness: this.a.weather === 'rain' ? 0.5 : 0.87 });
    const textureKey=key.startsWith('wall:') ? 'plaster' : SURFACES.get(key)||key;
    if (['plaster','timber','tile','stone','paving'].includes(textureKey)) {
      if (!this.textures.has(textureKey)) {
        const maps=surfaceTexture(textureKey);this.textures.set(textureKey,maps);this.disposables.push(...Object.values(maps));
      }
      const maps=this.textures.get(textureKey);
      mat.map=maps.color;mat.bumpMap=maps.height;mat.roughnessMap=maps.roughness;
      mat.bumpScale=textureKey==='stone'?.018:textureKey==='paving'?.022:.012;
      mat.roughness=this.a.weather==='rain'?.57:1;
      if(textureKey==='stone' || textureKey==='paving') {
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
        };
        mat.customProgramCacheKey=()=> 'gpt-world-stone-v2';
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
    if (key.startsWith('foliage') || key === 'flower') { mat.side=THREE.DoubleSide; mat.roughness=1; }
    if (key === 'glow' || key === 'lanternRed') { mat.emissive.set(key==='glow'?'#ffba62':'#ff6427'); mat.emissiveIntensity = 0.55; }
    if (key === 'candidate') { mat.transparent = true; mat.opacity = 0.5; }
    this.artMaterials.set(key, mat);
    this.disposables.push(mat);
    return mat;
  }

  part(kind, material, position, scale, rotation = [0, 0, 0], pick = null, quaternion = null) {
    const key = `${kind}:${material}`;
    if (!this.batches.has(key)) this.batches.set(key, { geo: GEO[kind], mat: this.material(material), parts: [] });
    const q = quaternion || new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation));
    const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...position), q, new THREE.Vector3(...scale));
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
    this.haloMaterial=new THREE.SpriteMaterial({map:glowTexture,color:'#ffcb87',blending:THREE.AdditiveBlending,transparent:true,opacity:.15,depthWrite:false,toneMapped:false});
    this.poolMaterial=new THREE.MeshBasicMaterial({map:glowTexture,color:'#ffbd6d',blending:THREE.AdditiveBlending,transparent:true,opacity:.2,depthWrite:false,toneMapped:false});
    const poolGeometry=new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2);
    this.disposables.push(glowTexture,this.haloMaterial,this.poolMaterial,poolGeometry);
    for (const { geo, mat, parts } of this.batches.values()) {
      const mesh = this.instanced(geo, mat, parts.length, { pick: parts.some((p) => p.pick) ? parts.map((p) => p.pick) : null });
      parts.forEach((p, i) => mesh.setMatrixAt(i, p.matrix));
      mesh.instanceMatrix.needsUpdate = true;
      if(mat===this.artMaterials.get('glow')) {
        const groundPools=[];
        for(const p of parts) {
          const halo=new THREE.Sprite(this.haloMaterial);halo.position.setFromMatrixPosition(p.matrix);halo.scale.set(.42,.42,.42);this.world.add(halo);
          if(halo.position.y < 1.5) groundPools.push(halo.position.clone());
        }
        const pools=new THREE.InstancedMesh(poolGeometry,this.poolMaterial,groundPools.length);
        groundPools.forEach((p,i)=>pools.setMatrixAt(i,new THREE.Matrix4().makeScale(1.15,1,.95).setPosition(p.x,.075,p.z+.2)));
        pools.instanceMatrix.needsUpdate=true;this.world.add(pools);
      }
    }
    this.batches.clear();
  }

  tree(x, z, size, seed) {
    if(this.a.place==='hoian' && hash01(`palm:${seed}`)>.7) {
      // Curved trunks and feathered fronds give the riverside a second tree silhouette.
      const height=size*2.8;
      for(let i=0;i<9;i+=1) {
        const u=i/9,v=(i+1)/9;
        this.beam('timber',[x+.16*u*u,height*u,z],[x+.16*v*v,height*v,z],size*(.065-u*.025));
      }
      for(let frond=0;frond<9;frond+=1) {
        const angle=frond*Math.PI*2/9;
        const point=(u)=>[x+.16+Math.cos(angle)*u*size*1.05,height+Math.sin(u*Math.PI)*size*.3-u*u*size*.55,z+Math.sin(angle)*u*size*1.05];
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
    const colors = this.snow ? ['#e6e6dc','#a2b2a0','#c3ccba'] : blossom ? ['#e4a7b8','#f2c9d1','#bf839d'] : this.a.season === 'autumn' ? ['#a97736','#c9a34e','#8c6535'] : ['#506c35','#75934b','#94a85b'];
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
    for(let branch=0;branch<7;branch+=1) {
      const angle=branch*2.4+hash01(seed)*5;
      const bx=x+leanX+Math.cos(angle)*size*.48,bz=z+leanZ+Math.sin(angle)*size*.46;
      const by=height*(.52+branch*.07+hash01(`${seed}:b${branch}`)*.08);
      this.beam('timber',[x+leanX*.6,height*.51,z+leanZ*.6],[bx,by,bz],.024*size);
      for(let twig=0;twig<4;twig+=1) {
        const a=angle+twig*1.8,r=size*(.2+hash01(`${seed}:twig:${branch}:${twig}`)*.23);
        const ex=bx+Math.cos(a)*r,ez=bz+Math.sin(a)*r,ey=by+(hash01(`tw:${branch}:${twig}`)-.4)*size*.3;
        this.beam('timber',[bx,by,bz],[ex,ey,ez],.011*size);
        this.part('canopy',`foliage:${colors[(branch+twig)%3]}`,[ex,ey,ez],[size*.16,size*.13,size*.16],[twig*.3,branch,.2]);
        for(let i=0;i<110;i+=1) {
          const u=hash01(`${seed}:${branch}:${twig}:${i}u`),v=hash01(`${seed}:${branch}:${twig}:${i}v`);
          const theta=u*Math.PI*2,radius=Math.sqrt(v)*size*.32;
          const px=ex+Math.cos(theta)*radius,pz=ez+Math.sin(theta)*radius;
          const py=ey+(hash01(`${seed}:ly:${i}`)-.4)*size*.38;
          this.part('leaf',`foliage:${colors[i%3]}`,[px,py,pz],[size*.13,size*.18,size*.13],[u*5,v*6,theta]);
        }
      }
    }
  }

  buildLandscape() {
    const b = this.bounds;
    const dense=this.a.place==='hoian';
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
          this.part('box','stone',[cx,.025,z===-1?-3.14:cz+1.42],[PLOT,.07,.13]);
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
        if (hash01(`grove:${x},${z}`) > (dense?.35:.55)) {
          const tx=cx-1.76,tz=cz+(dense?.05:-.65)+hash01(`offset:${x},${z}`)*.4;
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
          for(let step=0;step<5;step+=1) this.part('box','stone',[x*PLOT+1.5,.14-step*.045,bank+toward*(.05+step*.09)],[.72,.085,.2]);
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
          for (const side of [-1, 1]) {
            if (i % 2 === 0) {
              this.beam('stone', [bx + side * 0.38, y, z], [bx + side * 0.38, y + 0.42, z], 0.045);
              this.part('orb','stone',[bx+side*.38,y+.45,z],[.06,.06,.06]);
            }
            if (i < 10) this.beam('stone', [bx + side * 0.38, y + 0.38, z], [bx + side * 0.38, 0.5 + Math.sin(((i + 1) / 10) * Math.PI) * 0.35, z + 0.232], 0.035);
          }
        }
        if(x===0 && this.a.place==='hoian') {
          // A covered footbridge is fixed street scenery, never a planned building.
          for(const side of [-1,1]) {
            for(const z of [-2.95,-2,-1.05]) this.beam('timber',[bx+side*.37,.25,z],[bx+side*.37,1.28,z],.04);
            this.part('box','tile',[bx+side*.29,1.4,-2],[.68,.065,2.65],[0,0,side*.5]);
            this.beam('timber',[bx+side*.58,1.25,-3.3],[bx+side*.58,1.25,-.7],.035);
            for(let course=0;course<18;course+=1) this.beam('tile',[bx,1.58,-3.25+course*.145],[bx+side*.59,1.26,-3.25+course*.145],.023);
            for(const z of [-2.85,-1.15]) this.part('orb','glow',[bx+side*.48,1.04,z],[.08,.12,.08]);
          }
          this.beam('tile',[bx,1.59,-3.34],[bx,1.59,-.66],.045);
        }
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
    this.water.rotation.x=-Math.PI/2; this.water.position.set(0,.018,-2);
    this.world.add(this.water); this.disposables.push(waterGeo,this.water);
    // Fixed moorings occupy the canal between the existing bridges, never building plots.
    this.boats=[];
    for(const [i,bx] of [.1,3.6,-3.1].entries()) {
      const boat=this.buildRiverBoat(i);
      const bz=i===1?-2.5:i===2?-1.55:-2.05;
      boat.position.set(bx,.055,bz);boat.rotation.y=i===1?-.13:i===2?.12:.06;
      this.world.add(boat);this.boats.push(boat);
      const bank=i===1?-3.08:-.92;
      this.beam('timber',[bx-.6,.17,bz],[bx-.92,.22,bank],.008);
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
      mesh.quaternion.setFromUnitVectors(UP,direction.normalize());
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
    spar([-.58,.19,-.19],[.65,.2,.31],.012);
    add(GEO.box,wood,[.68,.2,.32],[.22,.025,.075],[0,-.39,0]);
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
    boat.userData.phase=index*2.1;return boat;
  }

  buildStreetscape() {
    const buildings=this.model.city.buildings;
    const byPlot=new Map(buildings.map(b=>[`${b.plot.x},${b.plot.y}`,b]));
    for(const b of buildings) {
      if(b.bricks.length/b.size<.65) continue;
      const c=plotCenter(b.plot),next=byPlot.get(`${b.plot.x+1},${b.plot.y}`);
      if(next && next.bricks.length/next.size>=.65) {
        // Neighbouring earned frontages share a real planted pergola over the alley.
        const x=c.x+PLOT/2,z=c.z+.88;
        for(const dx of [-.33,.33]) this.beam('timber',[x+dx,.04,z],[x+dx,1.85,z],.033);
        for(let i=0;i<6;i+=1) this.beam('timber',[x-.5,1.84,z-.3+i*.12],[x+.5,1.84,z-.3+i*.12],.02);
        for(let i=0;i<90;i+=1) {
          const u=hash01(`${b.planId}:trellis:${i}`),v=hash01(`trellis:${i}`);
          this.part('leaf','foliage:#536e3f',[x+(u-.5)*1.1,1.86-v*.18,z+(v-.5)*.65],[.1,.15,.1],[u*3,v*5,u]);
          if(i%3===0) this.part('orb','#b93678',[x+(u-.5)*1.1,1.87-v*.2,z+(v-.5)*.65],[.04,.03,.04]);
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
      if(b.shape==='house') {
        for(const wheel of [-.2,.2]) this.part('orb','iron',[c.x-1.27+wheel,.21,c.z+.95],[.14,.14,.022]);
        this.beam('iron',[c.x-1.47,.21,c.z+.95],[c.x-1.19,.45,c.z+.95],.013);
        this.beam('iron',[c.x-1.19,.45,c.z+.95],[c.x-1.07,.21,c.z+.95],.013);
        this.part('box','timber',[c.x-1.22,.46,c.z+.95],[.12,.035,.08]);
      }
    }
  }

  buildHouse(b) {
    if (this.a.place === 'hoian') { drawHoiAnBuilding(this, b); return; }
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
    if(this.poolMaterial)this.poolMaterial.opacity=THREE.MathUtils.lerp(.05,.36,dusk);
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

  renderScene() {
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
  }

  dispose() {
    this.bloom?.dispose();this.output?.dispose();this.composer?.dispose();
    super.dispose();
  }

  resize() {
    super.resize();
    this.composer?.setSize(this.canvas.clientWidth,this.canvas.clientHeight);
    if (this.water) this.water.getRenderTarget().setSize(Math.ceil(this.canvas.clientWidth*this.renderer.getPixelRatio()),Math.ceil(this.canvas.clientHeight*this.renderer.getPixelRatio()));
  }

  startDrop(sid) {
    const b = this.model.city.buildings.find((x) => x.bricks.some((brick) => brick.sid === sid));
    if (b) { this.focusBuilding(b.planId, this.a?.motion ? 1400 : 0); this.setSelection(b.planId); }
  }

  frame(t) {
    if (this.a?.motion && this.onScreen) {
      const time = t / 1000;
      if (this.water) this.water.material.uniforms.uTime.value=time;
      for(const boat of this.boats||[]) { const phase=boat.userData.phase;boat.position.y=.055+Math.sin(time*.8+phase)*.009;boat.rotation.z=Math.sin(time*.65+phase)*.012; }
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
