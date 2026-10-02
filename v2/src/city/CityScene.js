/**
 * CityScene.js — the three.js view of the diary city. Imperative and self-contained: React hands it
 * a model (`setModel`) and gets picks back (`onPick`). All positions come from layout.js, all
 * light from sky.js, all facts from engine/city.js — this file only draws.
 *
 * Budget (plan stage 3, measured before adding detail): every repeated thing is ONE InstancedMesh
 * (storeys, windows, lots, lantern poles/lamps, residents, trees, yard bricks), so draw calls stay
 * ~20 whatever the city's size. Roofs are per building but share geometry and materials.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import { eraStyle, shapeOf } from '../engine/catalog.js';
import { hash01 } from '../engine/city.js';
import {
  buildingTop, focusFrame, lanternSpot, overviewFrame, PLOT, plotBounds, plotCenter, residentSpot, STREET,
  statueSpot, storeyBox, storeyHeight, yardSpot,
} from './layout.js';
import { skyAt } from './sky.js';

const GOLD = '#f2c14e';
const MAX_RESIDENTS = 320;
const FRAME_MS = 1000 / 40;

const unitBox = new THREE.BoxGeometry(1, 1, 1);

function prismGeometry() {
  const p = [-0.5, 0, -0.5, 0.5, 0, -0.5, 0, 1, -0.5, -0.5, 0, 0.5, 0.5, 0, 0.5, 0, 1, 0.5];
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setIndex([3, 4, 5, 0, 2, 1, 0, 3, 5, 0, 5, 2, 1, 2, 5, 1, 5, 4, 0, 1, 4, 0, 4, 3]);
  const flat = g.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

/** Shared roof geometries, all built for a 1×1 footprint and height 1. */
const ROOF_GEO = {
  cone: new THREE.ConeGeometry(0.62, 1, 10).translate(0, 0.5, 0),
  pyramid: new THREE.CylinderGeometry(0.03, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
  mansard: new THREE.CylinderGeometry(Math.SQRT1_2 * 0.62, Math.SQRT1_2, 1, 4).rotateY(Math.PI / 4).translate(0, 0.5, 0),
  prism: prismGeometry(),
  dome: new THREE.SphereGeometry(0.5, 20, 10, 0, Math.PI * 2, 0, Math.PI / 2),
  slab: unitBox,
  pole: new THREE.CylinderGeometry(0.5, 0.5, 1, 6).translate(0, 0.5, 0),
};

/** Geometries every rebuild reuses — created once, never per rebuild. */
const GEO = {
  lamp: new THREE.SphereGeometry(0.11, 10, 8),
  flag: new THREE.ConeGeometry(0.12, 0.22, 3).rotateX(Math.PI),
  body: new THREE.CylinderGeometry(0.075, 0.1, 0.34, 8).translate(0, 0.17, 0),
  head: new THREE.SphereGeometry(0.075, 10, 8),
  statueHead: new THREE.SphereGeometry(0.1, 12, 10),
  ring: new THREE.RingGeometry(1.45, 1.6, 40).rotateX(-Math.PI / 2),
};

const toColor = (hex) => new THREE.Color(hex);

function mix(hexA, hexB, t) {
  return toColor(hexA).lerp(toColor(hexB), t);
}

export class CityScene {
  constructor(canvas, { onPick = () => {}, interactive = true } = {}) {
    this.canvas = canvas;
    this.onPick = onPick;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 600);
    this.camera.position.set(14, 14, 18);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 160;
    this.controls.enabled = interactive;

    this.hemi = new THREE.HemisphereLight('#dfe9f5', '#6f6a55', 0.9);
    this.sun = new THREE.DirectionalLight('#fff4e3', 2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.scene.add(this.hemi, this.sun, this.sun.target);

    this.world = new THREE.Group();
    this.scene.add(this.world);
    this.disposables = [];

    this.mats = {
      storey: new THREE.MeshStandardMaterial({ roughness: 0.82 }),
      window: new THREE.MeshStandardMaterial({ color: '#5a6a7e', roughness: 0.4, emissive: '#ffcf7a', emissiveIntensity: 0 }),
      lot: new THREE.MeshStandardMaterial({ roughness: 1 }),
      street: new THREE.MeshStandardMaterial({ color: '#8f8a80', roughness: 1 }),
      ground: new THREE.MeshStandardMaterial({ roughness: 1 }),
      pole: new THREE.MeshStandardMaterial({ color: '#3b3530', roughness: 0.7 }),
      lamp: new THREE.MeshStandardMaterial({ color: '#ffcf7a', emissive: '#ffb347', emissiveIntensity: 0.6 }),
      body: new THREE.MeshStandardMaterial({ roughness: 0.9 }),
      head: new THREE.MeshStandardMaterial({ color: '#e8c9a6', roughness: 0.9 }),
      leaf: new THREE.MeshStandardMaterial({ roughness: 1, flatShading: true }),
      trunk: new THREE.MeshStandardMaterial({ color: '#6b4f36', roughness: 1 }),
      gold: new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.35, metalness: 0.6 }),
      stone: new THREE.MeshStandardMaterial({ color: '#b8b2a6', roughness: 0.9 }),
      ghost: new THREE.MeshStandardMaterial({ color: '#ffffff', transparent: true, opacity: 0.35, depthWrite: false }),
      plot: new THREE.MeshStandardMaterial({ color: '#e0794a', transparent: true, opacity: 0.55, emissive: '#e0794a', emissiveIntensity: 0.35, depthWrite: false }),
      flag: new THREE.MeshStandardMaterial({ roughness: 0.8, side: THREE.DoubleSide }),
      ring: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9 }),
    };
    this.roofMats = new Map();

    this.signature = '';
    this.model = null;
    this.pickables = [];
    this.drop = null;
    this.fly = null;
    this.selectRing = null;
    this.lastFrame = 0;
    this.start = performance.now();

    this.resize = this.resize.bind(this);
    this.ro = new ResizeObserver(this.resize);
    this.ro.observe(canvas);
    this.resize();

    if (interactive) this.bindPicking();
    this.renderer.setAnimationLoop((t) => this.frame(t));
  }

  roofMat(hex) {
    if (!this.roofMats.has(hex)) this.roofMats.set(hex, new THREE.MeshStandardMaterial({ color: hex, roughness: 0.75, flatShading: true }));
    return this.roofMats.get(hex);
  }

  resize() {
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  bindPicking() {
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    let down = null;
    this.onDown = (e) => { down = { x: e.clientX, y: e.clientY }; };
    this.onUp = (e) => {
      if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) return;
      const r = this.canvas.getBoundingClientRect();
      ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, this.camera);
      for (const m of this.pickables) if (m.isInstancedMesh) m.boundingSphere = null; // moved since
      const hit = ray.intersectObjects(this.pickables, false)[0];
      this.onPick(hit ? this.describeHit(hit) : null);
    };
    this.canvas.addEventListener('pointerdown', this.onDown);
    this.canvas.addEventListener('pointerup', this.onUp);
  }

  describeHit(hit) {
    const u = hit.object.userData;
    if (u.list && hit.instanceId != null) return u.list[hit.instanceId] ?? null;
    return u.pick ?? null;
  }

  /* ------------------------------------------------------------------ model → scene */

  setModel(model) {
    this.model = model;
    const { city, picking, selectedPlan } = model;
    const sig = JSON.stringify([
      city.buildings.map((b) => [b.planId, b.plot.x, b.plot.y, b.style, b.bricks.map((x) => x.id + x.categoryId)]),
      city.pile.map((b) => b.id), city.residents.length, city.lanterns.length, city.statues.length,
      city.festivalNow, picking ? city.candidates : 0, model.categoriesKey,
    ]);
    if (sig !== this.signature) {
      this.signature = sig;
      this.rebuild();
    }
    this.setSelection(selectedPlan);
    if (model.focusSid && model.focusSid !== this.focusedSid) {
      this.focusedSid = model.focusSid;
      this.startDrop(model.focusSid);
    }
    if (!this.framed) {
      this.framed = true;
      this.frameCity(0);
    }
  }

  clearWorld() {
    for (const d of this.disposables) d.dispose?.();
    this.disposables = [];
    this.world.clear();
    this.pickables = [];
    this.selectRing = null;
    this.ghost = null;
  }

  instanced(geo, mat, count, { shadow = true, pick = null } = {}) {
    const m = new THREE.InstancedMesh(geo, mat, Math.max(1, count));
    m.count = count;
    m.frustumCulled = false; // residents move and storeys drop: a cached bounding sphere would lie
    m.castShadow = shadow;
    m.receiveShadow = true;
    this.world.add(m);
    this.disposables.push(m);
    if (pick) {
      m.userData.list = pick;
      this.pickables.push(m);
    }
    return m;
  }

  rebuild() {
    this.clearWorld();
    const { city, categories } = this.model;
    const catColor = (id) => categories.get(id)?.color ?? '#94a3b8';
    const bounds = plotBounds(city.buildings, city.candidates);
    this.bounds = bounds;
    const style = eraStyle(city.era);
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const s = new THREE.Vector3();
    const place = (mesh, i, x, y, z, sx, sy, sz, rotY = 0) => {
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, rotY);
      mesh.setMatrixAt(i, m4.compose(v.set(x, y, z), q, s.set(sx, sy, sz)));
    };

    // Ground and streets ------------------------------------------------------------
    const spanX = (bounds.maxX - bounds.minX + 1) * PLOT;
    const spanZ = (bounds.maxY - bounds.minY + 1) * PLOT;
    const cx = ((bounds.minX + bounds.maxX) / 2) * PLOT;
    const cz = ((bounds.minY + bounds.maxY) / 2) * PLOT;
    this.mats.ground.color.set(mix(style.ground, '#56634e', 0.25));
    const ground = new THREE.Mesh(new THREE.CircleGeometry(Math.max(spanX, spanZ) * 1.6 + 30, 48).rotateX(-Math.PI / 2), this.mats.ground);
    ground.position.set(cx, -0.02, cz);
    ground.receiveShadow = true;
    this.world.add(ground);
    this.disposables.push(ground.geometry);

    const streets = [];
    for (let i = bounds.minX; i < bounds.maxX; i += 1) streets.push([(i + 0.5) * PLOT, cz, STREET, spanZ]);
    for (let j = bounds.minY; j < bounds.maxY; j += 1) streets.push([cx, (j + 0.5) * PLOT, spanX, STREET]);
    const st = this.instanced(unitBox, this.mats.street, streets.length, { shadow: false });
    streets.forEach(([x, z, w, d], i) => place(st, i, x, 0.005, z, w, 0.01, d));

    // Lots: each built plot wears the ground of the era it was built in — districts read as rings.
    const lots = this.instanced(unitBox, this.mats.lot, city.buildings.length, { shadow: false });
    city.buildings.forEach((b, i) => {
      const c = plotCenter(b.plot);
      place(lots, i, c.x, 0.02, c.z, PLOT - STREET - 0.1, 0.04, PLOT - STREET - 0.1);
      lots.setColorAt(i, mix(eraStyle(b.style).ground, '#f3eee3', 0.18));
    });

    // Storeys: one per brick, coloured by the session's category ---------------------
    const storeyList = [];
    const bands = [];
    for (const b of city.buildings) {
      const wall = eraStyle(b.style).wall;
      b.bricks.forEach((brick, i) => {
        storeyList.push({ type: 'brick', brick, planId: b.planId });
        bands.push({ box: storeyBox(b, i), color: brick.kind === 'plain' ? mix(catColor(brick.categoryId), wall, 0.3) : toColor(GOLD) });
      });
    }
    this.storeys = this.instanced(unitBox, this.mats.storey, bands.length, { pick: storeyList });
    bands.forEach(({ box, color }, i) => {
      place(this.storeys, i, box.x, box.y, box.z, box.w, box.h, box.d);
      this.storeys.setColorAt(i, color);
    });
    this.storeyBoxes = bands.map((x) => x.box);
    this.storeyRefs = storeyList;

    // Windows on all four faces of every storey -------------------------------------
    const wins = [];
    bands.forEach(({ box }, i) => {
      for (const face of [0, 1, 2, 3]) {
        const along = face % 2 === 0 ? box.w : box.d;
        const n = Math.max(1, Math.round(along / 0.62));
        for (let k = 0; k < n; k += 1) {
          if (hash01(`win:${i}:${face}:${k}`) < 0.3) continue;
          const off = (k - (n - 1) / 2) * (along / n);
          wins.push({ i, face, off, box });
        }
      }
    });
    this.windows = this.instanced(unitBox, this.mats.window, wins.length, { shadow: false, pick: wins.map((w) => storeyList[w.i]) });
    wins.forEach(({ face, off, box }, i) => {
      const h = box.h * 0.46;
      if (face === 0) place(this.windows, i, box.x + off, box.y, box.z + box.d / 2 + 0.006, 0.13, h, 0.02);
      if (face === 2) place(this.windows, i, box.x + off, box.y, box.z - box.d / 2 - 0.006, 0.13, h, 0.02);
      if (face === 1) place(this.windows, i, box.x + box.w / 2 + 0.006, box.y, box.z + off, 0.02, h, 0.13);
      if (face === 3) place(this.windows, i, box.x - box.w / 2 - 0.006, box.y, box.z + off, 0.02, h, 0.13);
    });
    this.windowBase = wins.map((_, i) => {
      const m = new THREE.Matrix4();
      this.windows.getMatrixAt(i, m);
      return m;
    });
    this.windowOf = wins.map((w) => w.i);

    // Roofs on finished buildings, a scaffold + ghost storey on the one being built ----
    for (const b of city.buildings) {
      const done = b.bricks.length >= b.size;
      if (done) this.addRoof(b);
      else this.addScaffold(b, b === city.current);
    }

    // Brick yard -----------------------------------------------------------------------
    const yard = this.instanced(unitBox, this.mats.storey, city.pile.length, { pick: city.pile.map((brick) => ({ type: 'brick', brick, planId: null })) });
    city.pile.forEach((brick, i) => {
      const p = yardSpot(bounds, i);
      place(yard, i, p.x, p.y, p.z, 0.32, 0.16, 0.34);
      yard.setColorAt(i, brick.kind === 'plain' ? toColor(catColor(brick.categoryId)) : toColor(GOLD));
    });

    // Lantern avenue: one lantern per full day ----------------------------------------
    const lanterns = city.lanterns;
    const lanternPick = lanterns.map((r) => ({ type: 'resident', resident: r }));
    const poles = this.instanced(ROOF_GEO.pole, this.mats.pole, lanterns.length);
    this.lamps = this.instanced(GEO.lamp, this.mats.lamp, lanterns.length, { shadow: false, pick: lanternPick });
    lanterns.forEach((_, k) => {
      const p = lanternSpot(k);
      place(poles, k, p.x, 0, p.z, 0.05, 1.15, 0.05);
      place(this.lamps, k, p.x, 1.22, p.z, 1, 1, 1);
    });

    // Festival bunting along the avenue when this week reached its goal -----------------
    if (city.festivalNow) {
      const flags = Math.max(12, lanterns.length * 3);
      const fl = this.instanced(GEO.flag, this.mats.flag, flags, { shadow: false });
      const palette = ['#e05a47', '#f2c14e', '#3f9b7a', '#4a7bd0', '#c45bb2'];
      for (let i = 0; i < flags; i += 1) {
        const p = lanternSpot(Math.floor(i / 3));
        place(fl, i, p.x + ((i % 3) - 1) * 0.32, 1.02, p.z + (p.z > PLOT / 2 ? -0.02 : 0.02), 1, 1, 1);
        fl.setColorAt(i, toColor(palette[i % palette.length]));
      }
    }

    // Statues at intersections -----------------------------------------------------------
    city.statues.forEach((brick, i) => {
      const p = statueSpot(bounds, i);
      const g = new THREE.Group();
      const plinth = new THREE.Mesh(unitBox, this.mats.stone);
      plinth.scale.set(0.5, 0.36, 0.5);
      plinth.position.y = 0.18;
      const fig = new THREE.Mesh(ROOF_GEO.cone, this.mats.gold);
      fig.scale.set(0.38, 0.62, 0.38);
      fig.position.y = 0.36;
      const head = new THREE.Mesh(GEO.statueHead, this.mats.gold);
      head.position.y = 1.06;
      for (const m of [plinth, fig, head]) {
        m.castShadow = true;
        m.userData.pick = { type: 'statue', brick };
        this.pickables.push(m);
        g.add(m);
      }
      g.position.set(p.x, 0, p.z);
      this.world.add(g);
    });

    // Trees: soften the edge of the city on empty outer plots -------------------------------
    const occupied = new Set(city.buildings.map((b) => `${b.plot.x},${b.plot.y}`));
    const cand = new Set((this.model.picking ? city.candidates : []).map((p) => `${p.x},${p.y}`));
    const trees = [];
    for (let x = bounds.minX - 2; x <= bounds.maxX + 2; x += 1) {
      for (let y = bounds.minY - 2; y <= bounds.maxY + 2; y += 1) {
        const k = `${x},${y}`;
        if (occupied.has(k) || cand.has(k) || (x === 0 && y === 0)) continue;
        for (let t = 0; t < 3; t += 1) {
          const h = hash01(`tree:${k}:${t}`);
          if (h > 0.55) continue;
          // inside the plot, clear of the streets
          trees.push({ x: x * PLOT + (hash01(`tx:${k}:${t}`) - 0.5) * 2, z: y * PLOT + (hash01(`tz:${k}:${t}`) - 0.5) * 2, s: 0.5 + h * 0.6 });
        }
      }
    }
    const trunks = this.instanced(ROOF_GEO.pole, this.mats.trunk, trees.length);
    const leaves = this.instanced(ROOF_GEO.cone, this.mats.leaf, trees.length);
    this.mats.leaf.color.set(mix(style.ground, '#2f5a2c', 0.55));
    trees.forEach((tr, i) => {
      place(trunks, i, tr.x, 0, tr.z, 0.09 * tr.s, 0.45 * tr.s, 0.09 * tr.s);
      place(leaves, i, tr.x, 0.32 * tr.s, tr.z, 0.8 * tr.s, 1.05 * tr.s, 0.8 * tr.s);
    });

    // Candidate plots while choosing where to build ---------------------------------------
    if (this.model.picking) {
      const list = city.candidates.map((plot) => ({ type: 'plot', plot }));
      this.plotTiles = this.instanced(unitBox, this.mats.plot, list.length, { shadow: false, pick: list });
      list.forEach(({ plot }, i) => {
        const c = plotCenter(plot);
        place(this.plotTiles, i, c.x, 0.06, c.z, PLOT - STREET - 0.3, 0.05, PLOT - STREET - 0.3);
      });
    } else this.plotTiles = null;

    // Residents ---------------------------------------------------------------------------
    const dayCats = new Map();
    for (const brick of city.bricks) {
      if (brick.bonus) continue;
      const m = dayCats.get(brick.day) ?? new Map();
      m.set(brick.categoryId, (m.get(brick.categoryId) ?? 0) + 1);
      dayCats.set(brick.day, m);
    }
    const shown = city.residents.slice(-MAX_RESIDENTS);
    const homes = new Map(city.buildings.map((b) => [b.planId, b]));
    this.residentList = shown.map((r) => ({ r, home: homes.get(r.home) ?? null }));
    const pickRes = shown.map((resident) => ({ type: 'resident', resident }));
    this.bodies = this.instanced(GEO.body, this.mats.body, shown.length, { pick: pickRes });
    this.heads = this.instanced(GEO.head, this.mats.head, shown.length, { pick: pickRes });
    shown.forEach((r, i) => {
      const tally = [...(dayCats.get(r.day) ?? new Map()).entries()].sort((a, b) => b[1] - a[1]);
      this.bodies.setColorAt(i, toColor(catColor(tally[0]?.[0])));
    });
    this.placeResidents(0);

    for (const mesh of this.world.children) {
      if (mesh.isInstancedMesh && mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    }
    this.fitShadow(bounds);
    this.applySky(true);
  }

  addRoof(b) {
    const st = eraStyle(b.style);
    const shape = shapeOf(b.shape);
    const top = buildingTop(b);
    const k = Math.max(0.35, 1 - shape.taper * (b.bricks.length - 1));
    const w = shape.w * k;
    const d = shape.d * k;
    const mat = this.roofMat(st.roofColor);
    const g = new THREE.Group();
    const add = (geo, sx, sy, sz, y = 0, x = 0, z = 0, m = mat) => {
      const mesh = new THREE.Mesh(geo, m);
      mesh.scale.set(sx, sy, sz);
      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.pick = { type: 'building', planId: b.planId };
      this.pickables.push(mesh);
      g.add(mesh);
      return mesh;
    };
    const tall = b.shape === 'tower' ? 1.5 : 1;
    switch (st.roof) {
      case 'cone': add(ROOF_GEO.cone, w * 1.3, 0.95 * tall, d * 1.3); break;
      case 'flat': add(ROOF_GEO.slab, w + 0.12, 0.12, d + 0.12, 0.06); break;
      case 'curved':
        add(ROOF_GEO.pyramid, w * 1.5, 0.42, d * 1.5);
        add(ROOF_GEO.pyramid, w * 0.9, 0.5 * tall, d * 0.9, 0.3);
        break;
      case 'crenel': {
        add(ROOF_GEO.slab, w + 0.08, 0.1, d + 0.08, 0.05);
        const n = 4;
        for (let i = 0; i < n; i += 1) {
          const t = (i / (n - 1) - 0.5) * (w - 0.1);
          add(ROOF_GEO.slab, 0.14, 0.18, 0.14, 0.19, t, (d / 2));
          add(ROOF_GEO.slab, 0.14, 0.18, 0.14, 0.19, t, -(d / 2));
        }
        break;
      }
      case 'gable': add(ROOF_GEO.prism, w + 0.22, 0.55 * tall, d + 0.18); break;
      case 'dome':
        add(ROOF_GEO.pole, Math.min(w, d) * 0.62, 0.18, Math.min(w, d) * 0.62);
        add(ROOF_GEO.dome, Math.min(w, d) * 1.05, Math.min(w, d) * 1.1 * tall, Math.min(w, d) * 1.05, 0.18);
        break;
      case 'chimney':
        add(ROOF_GEO.prism, w + 0.18, 0.5, d + 0.14);
        add(ROOF_GEO.slab, 0.16, 0.9 * tall, 0.16, 0.45, w * 0.28, d * 0.15, this.roofMat('#6a3b2c'));
        break;
      case 'mansard': add(ROOF_GEO.mansard, w + 0.08, 0.5, d + 0.08); break;
      case 'antenna':
        add(ROOF_GEO.slab, w + 0.04, 0.08, d + 0.04, 0.04);
        add(ROOF_GEO.pole, 0.03, 1.1 * tall, 0.03, 0.08);
        break;
      case 'garden': {
        add(ROOF_GEO.slab, w + 0.04, 0.1, d + 0.04, 0.05);
        add(ROOF_GEO.cone, 0.55, 0.7, 0.55, 0.1, w * 0.2, d * 0.1, this.mats.leaf);
        break;
      }
      default: add(ROOF_GEO.slab, w, 0.1, d, 0.05);
    }
    const c = plotCenter(b.plot);
    g.position.set(c.x, top, c.z);
    this.world.add(g);
  }

  addScaffold(b, isCurrent) {
    const shape = shapeOf(b.shape);
    const h = storeyHeight(b.shape);
    const c = plotCenter(b.plot);
    const full = new THREE.BoxGeometry(shape.w + 0.12, h * b.size, shape.d + 0.12);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(full), new THREE.LineBasicMaterial({ color: '#d9c7a6', transparent: true, opacity: 0.55 }));
    full.dispose();
    edges.position.set(c.x, (h * b.size) / 2, c.z);
    this.world.add(edges);
    this.disposables.push(edges.geometry, edges.material);
    // The next storey, pulsing: "your next session goes HERE".
    const next = storeyBox(b, b.bricks.length);
    const ghost = new THREE.Mesh(unitBox, this.mats.ghost);
    ghost.scale.set(next.w, next.h, next.d);
    ghost.position.set(next.x, next.y, next.z);
    ghost.userData.pick = { type: 'building', planId: b.planId };
    this.pickables.push(ghost);
    this.world.add(ghost);
    if (isCurrent) this.ghost = ghost;
  }

  setSelection(planId) {
    if (this.selectRing) {
      this.world.remove(this.selectRing);
      this.selectRing = null;
    }
    const b = planId && this.model.city.buildings.find((x) => x.planId === planId);
    if (!b) return;
    const c = plotCenter(b.plot);
    const ring = new THREE.Mesh(GEO.ring, this.mats.ring);
    ring.position.set(c.x, 0.07, c.z);
    this.world.add(ring);
    this.selectRing = ring;
  }

  fitShadow(bounds) {
    const span = Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY) * PLOT + 12;
    const cam = this.sun.shadow.camera;
    cam.left = -span; cam.right = span; cam.top = span; cam.bottom = -span;
    cam.near = 1; cam.far = span * 4;
    cam.updateProjectionMatrix();
    this.shadowSpan = span;
  }

  applySky(force = false) {
    const now = this.model?.now ?? Date.now();
    const minute = Math.floor(now / 60000);
    if (!force && minute === this.skyMinute) return;
    this.skyMinute = minute;
    const sky = skyAt(now);
    this.scene.background = toColor(sky.sky);
    this.scene.fog = new THREE.Fog(sky.sky, 60, 220);
    this.hemi.intensity = sky.ambient;
    this.hemi.color.set(mix(sky.sky, '#ffffff', 0.5));
    this.sun.intensity = sky.sunIntensity;
    this.sun.color.set(sky.sunColor);
    const b = this.bounds ?? { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    const cx = ((b.minX + b.maxX) / 2) * PLOT;
    const cz = ((b.minY + b.maxY) / 2) * PLOT;
    const r = (this.shadowSpan ?? 20) * 1.5;
    this.sun.position.set(cx + sky.sunDir.x * r, sky.sunDir.y * r, cz + sky.sunDir.z * r);
    this.sun.target.position.set(cx, 0, cz);
    this.mats.lamp.emissiveIntensity = 0.5 + sky.night * 3.2;
    this.mats.window.emissiveIntensity = sky.night * 1.1;
    this.mats.window.color.set(sky.night > 0.4 ? '#3a3020' : '#5a6a7e');
  }

  /* ------------------------------------------------------------------ motion */

  frameCity(ms = 1200) {
    if (!this.bounds) return;
    this.flyTo(overviewFrame(this.bounds), ms);
  }

  focusBuilding(planId, ms = 1400) {
    const b = this.model?.city.buildings.find((x) => x.planId === planId);
    if (b) this.flyTo(focusFrame(b), ms);
  }

  flyTo(frame, ms) {
    const to = { p: new THREE.Vector3(frame.position.x, frame.position.y, frame.position.z), t: new THREE.Vector3(frame.target.x, frame.target.y, frame.target.z) };
    if (ms <= 0) {
      this.camera.position.copy(to.p);
      this.controls.target.copy(to.t);
      this.controls.update();
      return;
    }
    this.fly = { from: { p: this.camera.position.clone(), t: this.controls.target.clone() }, to, start: performance.now(), ms };
  }

  /** The after-session moment: the camera flies to the brick, the storey drops into place. */
  startDrop(sid) {
    const idx = [];
    (this.storeyRefs ?? []).forEach((ref, i) => { if (ref.brick.sid === sid) idx.push(i); });
    const ref = this.storeyRefs?.[idx[0]];
    if (ref?.planId) this.focusBuilding(ref.planId, 1600);
    this.drop = idx.length ? { idx, start: performance.now() + 900 } : null;
  }

  placeResidents(t) {
    if (!this.bodies) return;
    const m4 = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const v = new THREE.Vector3();
    const one = new THREE.Vector3(1, 1, 1);
    this.residentList.forEach(({ r, home }, i) => {
      const p = residentSpot(r, home, t);
      const bob = Math.abs(Math.sin(t * 7 + i)) * 0.03;
      q.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, p.heading);
      this.bodies.setMatrixAt(i, m4.compose(v.set(p.x, bob, p.z), q, one));
      this.heads.setMatrixAt(i, m4.compose(v.set(p.x, 0.42 + bob, p.z), q, one));
    });
    this.bodies.instanceMatrix.needsUpdate = true;
    this.heads.instanceMatrix.needsUpdate = true;
  }

  frame(t) {
    if (t - this.lastFrame < FRAME_MS) return;
    this.lastFrame = t;
    if (this.fly) {
      const k = Math.min(1, (t - this.fly.start) / this.fly.ms);
      const e = k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2;
      this.camera.position.lerpVectors(this.fly.from.p, this.fly.to.p, e);
      this.controls.target.lerpVectors(this.fly.from.t, this.fly.to.t, e);
      if (k >= 1) this.fly = null;
    }
    this.controls.update();
    const secs = (t - this.start) / 1000;
    this.placeResidents(secs);
    if (this.ghost) {
      this.mats.ghost.opacity = 0.22 + 0.2 * (0.5 + 0.5 * Math.sin(secs * 3));
    }
    if (this.plotTiles) this.mats.plot.opacity = 0.4 + 0.25 * (0.5 + 0.5 * Math.sin(secs * 4));
    if (this.drop && this.storeys) this.animateDrop(t);
    this.applySky();
    this.renderer.render(this.scene, this.camera);
  }

  animateDrop(t) {
    const k = Math.max(0, Math.min(1, (t - this.drop.start) / 900));
    const ease = 1 - (1 - k) ** 3;
    const bounce = k < 1 ? Math.sin(k * Math.PI) * 0.06 : 0;
    const m4 = new THREE.Matrix4();
    for (const i of this.drop.idx) {
      const box = this.storeyBoxes[i];
      const lift = (1 - ease) * 4 + bounce;
      m4.compose(new THREE.Vector3(box.x, box.y + lift, box.z), new THREE.Quaternion(), new THREE.Vector3(box.w, box.h, box.d));
      this.storeys.setMatrixAt(i, m4);
    }
    this.storeys.instanceMatrix.needsUpdate = true;
    // Windows ride down with their storey.
    const lift = (1 - ease) * 4 + bounce;
    const fall = new Set(this.drop.idx);
    const shift = new THREE.Matrix4();
    this.windowOf.forEach((band, i) => {
      if (!fall.has(band)) return;
      this.windows.setMatrixAt(i, shift.makeTranslation(0, lift, 0).multiply(this.windowBase[i]));
    });
    this.windows.instanceMatrix.needsUpdate = true;
    if (k >= 1) this.drop = null;
  }

  dispose() {
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    if (this.onDown) {
      this.canvas.removeEventListener('pointerdown', this.onDown);
      this.canvas.removeEventListener('pointerup', this.onUp);
    }
    this.clearWorld();
    this.controls.dispose();
    for (const m of Object.values(this.mats)) m.dispose();
    this.disposed = true;
    for (const m of this.roofMats.values()) m.dispose();
    this.renderer.dispose();
  }
}

