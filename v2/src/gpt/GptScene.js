import * as THREE from 'three';
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
    this.bodies = null;
    this.storeys = null;
    this.windows = null;
    this.drop = null;
    this.plotTiles = null;
    this.batches = new Map();
    this.artMaterials = new Map();
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
    const mat = new THREE.MeshStandardMaterial({ color: colors[key] || key, roughness: this.a.weather === 'rain' ? 0.5 : 0.87 });
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
    for (const { geo, mat, parts } of this.batches.values()) {
      const mesh = this.instanced(geo, mat, parts.length, { pick: parts.some((p) => p.pick) ? parts.map((p) => p.pick) : null });
      parts.forEach((p, i) => mesh.setMatrixAt(i, p.matrix));
      mesh.instanceMatrix.needsUpdate = true;
    }
    this.batches.clear();
  }

  tree(x, z, size, seed) {
    this.beam('timber', [x, 0.08, z], [x + 0.09, size * 1.3, z], 0.065 * size);
    const blossom = this.a.place === 'kyoto' && this.a.season === 'spring';
    for (let i = 0; i < 9; i += 1) {
      const h = hash01(`tree:${seed}:${i}`);
      const angle = i * 2.4;
      const radius = (i < 3 ? 0.2 : 0.48) * size;
      this.part('orb', blossom ? 'flower' : i % 3 === 0 ? (this.a.season === 'autumn' ? '#ca994b' : this.snow ? '#e1e5dc' : '#75935c') : 'leaf', [x + Math.cos(angle) * radius, size * (1.18 + h * 0.5), z + Math.sin(angle) * radius], [size * (0.36 + h * 0.12), size * 0.39, size * 0.37]);
    }
  }

  buildLandscape() {
    const b = this.bounds;
    const span = Math.max(48, (b.maxX - b.minX + 5) * PLOT, (b.maxY - b.minY + 5) * PLOT);
    this.part('box', this.snow ? '#d7dfd8' : '#91a582', [0, -0.17, 0], [span * 3, 0.25, span * 3]);
    // Fixed canal in the street between rows -1 and 0. It never displaces a building.
    this.part('box', '#526f67', [0, -0.06, -2], [span * 2, 0.14, 1.35]);
    for (const z of [-2.77, -1.23]) {
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
        // Stone joints and street edges create a readable scale without noisy textures.
        for (let i = 0; i < 8; i += 1) {
          this.part('box', i % 2 ? '#b3a68f' : 'paving', [cx - 1.4 + i * 0.4, 0.025, cz + 1.48], [0.37, 0.03, 0.35]);
          if (z !== -1) this.part('box', '#afa58e', [cx - 1.4 + i * 0.4, 0.005, cz + 1.9], [0.37, 0.03, 0.36]);
        }
        this.tree(cx - 1.5, cz - 0.4, 0.65 + hash01(`${x},${z}`) * 0.3, `${x},${z}`);
        if ((x + z) % 2 === 0) {
          this.beam('iron', [cx + 1.55, 0, cz + 1.3], [cx + 1.55, 1.35, cz + 1.3], 0.025);
          this.part('orb', 'glow', [cx + 1.55, 1.4, cz + 1.3], [0.1, 0.15, 0.1]);
        }
      }
      // Walkable bridges stay on street axes, never over occupied plots.
      if (x % 2 === 0) {
        const bx = x * PLOT + 2;
        for (let i = 0; i < 11; i += 1) {
          const z = -2.8 + i * 0.16;
          const y = 0.12 + Math.sin((i / 10) * Math.PI) * 0.15;
          this.part('box', 'timber', [bx, y, z], [0.78, 0.09, 0.155]);
          for (const side of [-1, 1]) {
            if (i % 2 === 0) this.beam('timber', [bx + side * 0.38, y, z], [bx + side * 0.38, y + 0.42, z], 0.025);
            if (i < 10) this.beam('timber', [bx + side * 0.38, y + 0.42, z], [bx + side * 0.38, 0.54 + Math.sin(((i + 1) / 10) * Math.PI) * 0.15, z + 0.16], 0.025);
          }
        }
      }
    }
    const waterGeo = new THREE.PlaneGeometry(span * 2, 1.32, 160, 8).rotateX(-Math.PI / 2);
    const waterMat = new THREE.MeshStandardMaterial({ color: this.palette.water, metalness: 0.35, roughness: 0.26, transparent: true, opacity: 0.92 });
    this.water = new THREE.Mesh(waterGeo, waterMat);
    this.water.position.set(0, 0.012, -2);
    this.water.receiveShadow = true;
    this.world.add(this.water);
    this.disposables.push(waterGeo, waterMat);
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
    const { width: w, depth: d, height: h, floors, progress } = spec;
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
    if (progress >= 0.8) {
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
      this.hemi.intensity = night ? 1.2 : 2.2;
      this.hemi.color.set(night ? '#8faac3' : '#fff3dc');
      this.sun.intensity = night ? 0.7 : 2.5;
      this.sun.color.set(night ? '#9db5d3' : '#ffe3b3');
      this.sun.position.set(-18, 24, 16);
    }
    this.artMaterials.get('glow')?.emissive.copy(this.mats.lamp.emissive);
    const glow = this.artMaterials.get('glow');
    if (glow) glow.emissiveIntensity = night ? 2 : this.a.light === 'live' ? this.mats.lamp.emissiveIntensity : 0.5;
  }

  startDrop(sid) {
    const b = this.model.city.buildings.find((x) => x.bricks.some((brick) => brick.sid === sid));
    if (b) { this.focusBuilding(b.planId, this.a?.motion ? 1400 : 0); this.setSelection(b.planId); }
  }

  frame(t) {
    if (this.a?.motion && this.onScreen) {
      const time = t / 1000;
      if (this.water) {
        const attr = this.water.geometry.attributes.position;
        for (let i = 0; i < attr.count; i += 1) attr.setY(i, Math.sin(attr.getX(i) * 3 + time * 1.2 + attr.getZ(i) * 4) * 0.009);
        attr.needsUpdate = true;
        this.water.geometry.computeVertexNormals();
      }
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
