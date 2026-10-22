import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import { CityScene } from '../city/CityScene.js';
import { plotBounds, plotCenter, PLOT } from '../city/layout.js';
import { hash01 } from '../engine/city.js';
import { architectureOf, DEFAULT_APPEARANCE, PLACES, snowIn } from './art.js';

const GEO = {
  box: new RoundedBoxGeometry(1, 1, 1, 2, 0.04),
  orb: new THREE.SphereGeometry(1, 12, 9),
  pole: new THREE.CylinderGeometry(1, 1, 1, 10),
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
  const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#eee7d5'; ctx.fillRect(0,0,256,256);
  for (let i = 0; i < 7000; i += 1) {
    const h = hash01(`${kind}:${i}`);
    ctx.fillStyle = `rgba(${h > .5 ? '255,251,231' : '50,41,24'},${.02 + h * .13})`;
    ctx.fillRect(hash01(`x${i}`)*256, hash01(`y${i}`)*256, 1 + h*5, kind === 'timber' ? 12 + h*60 : 1 + h*6);
  }
  if (kind === 'plaster') for (let i = 0; i < 80; i += 1) {
    ctx.fillStyle = 'rgba(78,66,43,.055)'; ctx.beginPath();
    ctx.ellipse(hash01(`px${i}`)*256, hash01(`py${i}`)*256, 2 + hash01(`pr${i}`)*22, 3 + hash01(`ph${i}`)*14, 0,0,Math.PI*2); ctx.fill();
  }
  if (kind === 'tile' || kind === 'paving' || kind === 'stone') {
    const rows = kind === 'tile' ? 12 : 8;
    for (let y=0;y<rows;y+=1) for (let x=-1;x<8;x+=1) {
      const px=x*36+(y%2)*18, py=y*256/rows;
      ctx.fillStyle=`rgba(45,32,20,${.06+hash01(`p${x},${y}`)*.17})`;
      ctx.fillRect(px,py,34,256/rows-2);
      ctx.strokeStyle='rgba(255,247,211,.3)';ctx.strokeRect(px+1,py+1,33,256/rows-3);
    }
  }
  const tex = new THREE.CanvasTexture(canvas); tex.wrapS=tex.wrapT=THREE.RepeatWrapping;
  tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}

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
    for (const b of this.model.city.buildings) this.buildHouse(b);
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
    const colors = { plaster: p.wall, timber: p.wood, tile: this.snow ? '#e6e8e1' : p.roof, stone: '#b6aa92', paving: this.snow ? '#d9ded9' : '#c4b9a0', leaf: this.snow ? '#a5b8a5' : this.a.season === 'autumn' ? '#b0803e' : p.leaf, flower: this.a.season === 'spring' ? '#e5b2bc' : p.flower, glow: '#e6ac56', iron: '#3b514a', candidate: '#d6b96b' };
    const mat = new THREE.MeshStandardMaterial({ color: colors[key] || (key.startsWith('foliage:') ? key.slice(8) : key), roughness: this.a.weather === 'rain' ? 0.5 : 0.87 });
    if (['plaster','timber','tile','stone','paving'].includes(key)) {
      if (!this.textures.has(key)) { const tex = surfaceTexture(key); this.textures.set(key,tex); this.disposables.push(tex); }
      mat.map=this.textures.get(key); mat.bumpMap=mat.map; mat.bumpScale=key==='plaster'?.025:.045;
    }
    if (key.startsWith('foliage') || key === 'flower') { mat.side=THREE.DoubleSide; mat.roughness=1; }
    if (key === 'glow') { mat.emissive.set('#ffba62'); mat.emissiveIntensity = 0.55; }
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
    this.disposables.push(glowTexture,this.haloMaterial);
    for (const { geo, mat, parts } of this.batches.values()) {
      const mesh = this.instanced(geo, mat, parts.length, { pick: parts.some((p) => p.pick) ? parts.map((p) => p.pick) : null });
      parts.forEach((p, i) => mesh.setMatrixAt(i, p.matrix));
      mesh.instanceMatrix.needsUpdate = true;
      if(mat===this.artMaterials.get('glow')) for(const p of parts) {
        const halo=new THREE.Sprite(this.haloMaterial);halo.position.setFromMatrixPosition(p.matrix);halo.scale.set(.55,.55,.55);this.world.add(halo);
      }
    }
    this.batches.clear();
  }

  tree(x, z, size, seed) {
    const blossom = this.a.place === 'kyoto' && this.a.season === 'spring';
    const colors = this.snow ? ['#e6e6dc','#a2b2a0','#c3ccba'] : blossom ? ['#e4a7b8','#f2c9d1','#bf839d'] : this.a.season === 'autumn' ? ['#a97736','#c9a34e','#8c6535'] : ['#506c35','#75934b','#94a85b'];
    const height = size * (1.9 + hash01(seed)*.45);
    this.beam('timber', [x,0,z], [x+.12,height*.77,z-.05], .065*size);
    for (let branch=0;branch<5;branch+=1) {
      const angle=branch*2.4+hash01(seed)*4;
      const bx=x+Math.cos(angle)*size*.55, bz=z+Math.sin(angle)*size*.5;
      const by=height*(.63+hash01(`${seed}b${branch}`)*.35);
      this.beam('timber',[x+.06,height*.48,z],[bx,by,bz],.025*size);
      this.part('canopy',`foliage:${colors[branch%3]}`,[bx,by,bz],[size*.29,size*.28,size*.27],[branch*.2,branch,0]);
      for (let i=0;i<220;i+=1) {
        const u=hash01(`${seed}:${branch}:${i}u`), v=hash01(`${seed}:${branch}:${i}v`);
        const theta=u*Math.PI*2, r=Math.sqrt(v)*size*.55;
        const px=bx+Math.cos(theta)*r, pz=bz+Math.sin(theta)*r;
        const py=by+(hash01(`${seed}:${i}y`)-.4)*size*.65;
        const color=colors[i%colors.length];
        this.part('leaf',`foliage:${color}`,[px,py,pz],[size*.3,size*.36,size*.3],[u*3,v*6,theta]);
      }
    }
  }

  buildLandscape() {
    const b = this.bounds;
    const span = Math.max(48, (b.maxX - b.minX + 5) * PLOT, (b.maxY - b.minY + 5) * PLOT);
    this.part('box', this.snow ? '#d7dfd8' : '#aaad89', [0, -0.17, 0], [span * 3, 0.25, span * 3]);
    // Fixed canal in the street between rows -1 and 0. It never displaces a building.
    this.part('box', '#526f67', [0, -0.06, -2], [span * 2, 0.14, 2.05]);
    for (const z of [-3.1, -0.9]) {
      this.part('box', 'stone', [0, 0.02, z], [span * 2, 0.15, 0.2]);
    }
    for (let x = b.minX - 1; x <= b.maxX + 1; x += 1) {
      for (let z = b.minY - 1; z <= b.maxY + 1; z += 1) {
        const cx = x * PLOT;
        const cz = z * PLOT;
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
        this.tree(cx - 1.55, cz - 0.5 + hash01(`offset:${x},${z}`)*.35, 0.75 + hash01(`${x},${z}`) * 0.45, `${x},${z}`);
        if ((x + z) % 2 === 0) {
          this.beam('iron', [cx + 1.55, 0, cz + 1.3], [cx + 1.55, 1.35, cz + 1.3], 0.025);
          this.part('orb', 'glow', [cx + 1.55, 1.4, cz + 1.3], [0.1, 0.15, 0.1]);
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
          const y = 0.12 + Math.sin((i / 10) * Math.PI) * 0.15;
          this.part('box', 'timber', [bx, y, z], [0.78, 0.09, 0.225]);
          for (const side of [-1, 1]) {
            if (i % 2 === 0) this.beam('timber', [bx + side * 0.38, y, z], [bx + side * 0.38, y + 0.42, z], 0.025);
            if (i < 10) this.beam('timber', [bx + side * 0.38, y + 0.42, z], [bx + side * 0.38, 0.54 + Math.sin(((i + 1) / 10) * Math.PI) * 0.15, z + 0.232], 0.025);
          }
        }
      }
    }
    const waterGeo = new THREE.PlaneGeometry(span*2, 2.05);
    const shader = {
      ...Reflector.ReflectorShader,
      uniforms: {...THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms), uTime: {value:0}, uWater: {value:new THREE.Color(this.palette.water)}},
      vertexShader: Reflector.ReflectorShader.vertexShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec2 vSurface;').replace('vUv = textureMatrix', 'vSurface = position.xy; vUv = textureMatrix'),
      fragmentShader: Reflector.ReflectorShader.fragmentShader.replace('varying vec4 vUv;', 'varying vec4 vUv; varying vec2 vSurface; uniform float uTime; uniform vec3 uWater;').replace('vec4 base = texture2DProj( tDiffuse, vUv );', `
        vec4 rippleUv=vUv;
        rippleUv.xy += vec2(sin(vSurface.x*8.0+vSurface.y*15.0+uTime),cos(vSurface.x*5.0-uTime*.7))*0.0018*vUv.w;
        vec4 base=texture2DProj(tDiffuse,rippleUv);
        base.rgb=mix(base.rgb,uWater,.58);
        float glint=pow(max(0.,sin(vSurface.x*25.+vSurface.y*45.+uTime*1.4)),32.);
        base.rgb+=glint*.07;
      `),
    };
    const dpr=this.renderer.getPixelRatio();
    this.water = new Reflector(waterGeo,{textureWidth:Math.ceil(this.canvas.clientWidth*dpr),textureHeight:Math.ceil(this.canvas.clientHeight*dpr),color:'#79998e',clipBias:.003,shader});
    this.water.rotation.x=-Math.PI/2; this.water.position.set(0,.018,-2);
    this.world.add(this.water); this.disposables.push(waterGeo,this.water);
    // A decorative boat is scenery, not an earned building or a session.
    this.boat = new THREE.Group();
    const hullMat = this.material('timber');
    const hull = new THREE.Mesh(GEO.orb, hullMat);
    hull.scale.set(0.65, 0.08, 0.21);
    this.boat.add(hull);
    const canopy = new THREE.Mesh(GEO.box, this.material('#c29a61'));
    canopy.scale.set(0.5, 0.055, 0.4); canopy.position.y = 0.28; this.boat.add(canopy);
    this.boat.position.set(0.6, 0.08, -2); this.world.add(this.boat);
  }

  buildHouse(b) {
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
    const night = this.a.light === 'night';
    if (this.a.light !== 'live') {
      const sky = night ? '#344d59' : this.a.weather === 'rain' ? '#b4c1bb' : '#dce1cb';
      this.scene.background.set(sky);
      this.scene.fog = new THREE.Fog(sky, 27, 95);
      this.hemi.intensity = night ? 1.05 : 1.1;
      this.hemi.color.set(night ? '#8faac3' : '#fff3dc');
      this.sun.intensity = night ? 0.8 : 3.1;
      this.sun.color.set(night ? '#9db5d3' : '#ffe3b3');
      this.sun.position.set(-16, 13, 10)
      this.sun.shadow.radius=3; this.sun.shadow.normalBias=.025;
    }
    this.artMaterials.get('glow')?.emissive.copy(this.mats.lamp.emissive);
    if(this.haloMaterial) this.haloMaterial.opacity=night?.65:.08;
    const glow = this.artMaterials.get('glow');
    if (glow) glow.emissiveIntensity = night ? 1.2 : this.a.light === 'live' ? this.mats.lamp.emissiveIntensity : 0.18;
  }

  resize() {
    super.resize();
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
      if (this.boat) { this.boat.position.y = 0.09 + Math.sin(time) * 0.015; this.boat.rotation.z = Math.sin(time * 0.7) * 0.015; }
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
