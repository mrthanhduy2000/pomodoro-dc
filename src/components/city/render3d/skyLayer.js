/**
 * skyLayer.js — Round 51 (ADR-091): what `engine/city3d/sky.js` decides, drawn.
 *
 * Four instanced layers on top of the painted gradient. They cast no shadow and receive none, and
 * they never enter the city's bounding box; `sceneGraph` labels them (`markSky`) — this file does not
 * write the label itself, so there is only ever ONE place a layer name is decided.
 *   · CLOUDS — each cloud is a CLUSTER of puffs, not one slab: `PUFFS_PER_CLOUD` low-poly spheres
 *     around a common centre, drifting on the era's own wind, tinted from below when the sun is low,
 *     wrapped so a cloud leaving one edge of the sky re-enters at the other;
 *   · CLOUD SHADOWS — one soft dark disc per cloud, laid on the ground under it and moving with it.
 *     ⚠️ This is the ONE thing in the sky that touches the ground, and it is what makes a cloud read
 *     as an object with a place rather than a decal on the backdrop;
 *   · STARS — points on the dome, only at night, thinned by the era's light pollution, with a denser
 *     Milky Way band for the centuries that still had one;
 *   · MOON — a disc whose lit share follows a deterministic cycle (`moonPhase`), drawn as a bright
 *     disc with a dark disc sliding across it.
 *
 * ⚠️ ONE CLOCK. Everything here is a function of the same `uTime` seconds the rest of round 48's
 * motion uses; nothing reads `Date.now()` and nothing calls `Math.random()`.
 * ⚠️ NAMES. Every InstancedMesh in this scene must carry a name a mask can ask for (`sceneStats`);
 * these are `sky-cloud`, `sky-shadow` and `sky-star`.
 */
import {
  AdditiveBlending, CircleGeometry, Color, DynamicDrawUsage, InstancedMesh, Mesh, MeshBasicMaterial,
  Object3D, SphereGeometry, Sphere, Vector3,
} from 'three';

import { CLOUD_SHAPE, cloudCount, starCount } from '../../../engine/city3d/sky';

const dummy = new Object3D();
const tint = new Color();

/**
 * How many puffs make one cloud.
 *
 * ⚠️ THIS IS THE WHOLE DIFFERENCE BETWEEN "A CLOUD" AND "A SLAB". The first draft gave each cloud a
 * single flattened box, and on a rendered frame the sky read as a row of grey bricks — the silhouette
 * of a cloud is LUMPY, and a lump needs at least three overlapping bodies to be one. Four puffs on a
 * 12-face sphere costs 4 × 60 triangles per cloud and buys the one thing the sky was missing.
 */
const PUFFS_PER_CLOUD = 4;

/** Deterministic unit hash — the same one the particle layer uses, so two layers never sync up. */
function unitHash(i, salt) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * @param {object} p
 * @param {object} p.sky      the answer from `skyAt`
 * @param {number} p.gridSize city size in cells
 * @param {Color}  p.dayTop   the sky's own zenith colour (clouds sit against it)
 * @param {Color}  p.glow     the sun's colour (what lights the clouds from below at dawn/dusk)
 * @param {Function} [p.groundAt] `(x, z) => y` — where the ground is, for cloud shadows
 * @param {Vector3}  [p.sunDir]   the scene's real sun direction, so a shadow falls where the sun says
 * @returns `{ meshes, update(t), dispose() }` or `null` when the sky has nothing to add
 */
export function createSkyLayer({
  sky, gridSize = 12, dayTop, glow, night = false,
  skyRadius = null, groundAt = null, sunDir = null, shadowReach = null,
}) {
  if (!sky) return null;
  const meshes = [];
  const disposers = [];
  /**
   * ⚠️ THE SKY IS A DOME, NOT A CEILING — and getting this wrong is what the first rendered frame
   * caught. The first draft scattered clouds on a FLAT plane at `height × cell`, i.e. about 8 units
   * up over a 36-unit square. The camera orbits at ~22 units out and ~12 up, so half the clouds
   * ended up BETWEEN the camera and the city: the photo showed pale slabs draped over Tuscany.
   *
   * A sky is high in the middle and comes down to the horizon all round. So: clouds sit on a shallow
   * dome inside the gradient dome (`skyRadius`), their height falling with the square of the distance
   * from the centre, and they drift by TURNING about the vertical axis. Turning has no seam to wrap
   * — and from the street, where round 51 says the eye now stands, turning is exactly what the eye
   * sees: cloud crossing the gap between two roofs.
   */
  const R = skyRadius ?? Math.max(8, gridSize) * 3.6;
  const field = R * 0.88;
  const shape = CLOUD_SHAPE[sky.kind] ?? null;

  // ── clouds ────────────────────────────────────────────────────────────────
  let clouds = null;
  let shadows = null;
  const nClouds = cloudCount(sky, gridSize);
  if (shape && nClouds > 0) {
    // 7×5 segments: a cloud is seen from below and from far away, so its silhouette is all that
    // matters — 60 triangles is where the outline stops looking faceted.
    const geometry = new SphereGeometry(1, 7, 5);
    // A cloud is LIT FROM BELOW at dawn and dusk — the single cue that says "low sun". By day it is
    // the sky's own top colour lightened; a storm is grey whatever the hour.
    const base = new Color(dayTop ?? 0xffffff);
    const cloudColour = new Color();
    // ⚠️ AT NIGHT A CLOUD IS DARKER THAN THE SKY BEHIND IT, not brighter. Nothing lights it from
    // above, so what the eye sees is a hole in the star field. The first night render had them pale
    // grey and they read as daytime cloud pasted onto a night — the one thing that broke the hour.
    if (sky.kind === 'storm') cloudColour.setRGB(0.32, 0.31, 0.34).multiplyScalar(night ? 0.45 : 1);
    else if (sky.kind === 'low' || sky.kind === 'stratus') cloudColour.copy(base).lerp(new Color(0xffffff), 0.45).multiplyScalar(night ? 0.30 : 0.86);
    else cloudColour.copy(new Color(0xffffff)).multiplyScalar(night ? 0.22 : 1);
    // ⚠️ A FULL SKY IS A GREY SKY. The underside of a cloud is dark because the light had to come
    // through it, and how much there is to come through IS the cover. Without this line Manchester
    // at 0,94 cover came out as bright white streaks — the shape said "lid", the colour said "June".
    if (sky.kind !== 'storm') cloudColour.multiplyScalar(1 - 0.30 * sky.amount);
    if (sky.underlit > 0 && glow) cloudColour.lerp(new Color(glow), 0.55 * sky.underlit);

    const material = new MeshBasicMaterial({
      color: cloudColour, transparent: true, opacity: shape.alpha * (night ? 0.8 : 1),
      depthWrite: false, fog: false,
    });
    clouds = new InstancedMesh(geometry, material, nClouds * PUFFS_PER_CLOUD);
    clouds.name = 'sky-cloud';
    clouds.instanceMatrix.setUsage(DynamicDrawUsage);
    clouds.castShadow = false;
    clouds.receiveShadow = false;
    clouds.renderOrder = -1;                          // behind the city, in front of the dome
    clouds.frustumCulled = false;                     // it IS the sky; culling it looks like a bug
    meshes.push(clouds);
    disposers.push(() => { geometry.dispose(); material.dispose(); clouds.dispose(); });

    // ── cloud shadows ───────────────────────────────────────────────────────
    // ⚠️ NOT A REAL SHADOW MAP, and that is deliberate: making the clouds shadow-casters would make
    // the sun's shadow camera cover the whole sky and every building's shadow would go soft and
    // wrong. A dark disc laid on the ground under each cloud costs one draw call, moves with the
    // cloud, and is hidden by any building standing in front of it — which is all the eye asks for.
    // ⚠️ AND AN OVERCAST SKY HAS NO SHADOWS AT ALL — that is not an omission, it is the fact. When
    // cover approaches 1 the ground is uniformly shaded and there is no edge to see; the darkness
    // therefore peaks at broken cloud (`amount ≈ 0,5`) and falls away at both ends.
    const shadowDark = 0.42 * (shape.shadow ?? 1) * sky.amount * (1 - sky.amount);
    if (groundAt && !night && shadowDark > 0.012) {
      const shadowGeo = new CircleGeometry(1, 14);
      shadowGeo.rotateX(-Math.PI / 2);
      const shadowMat = new MeshBasicMaterial({
        color: 0x1a1c22, transparent: true, opacity: Math.min(0.34, shadowDark),
        depthWrite: false, fog: true,
      });
      shadows = new InstancedMesh(shadowGeo, shadowMat, nClouds);
      shadows.name = 'sky-shadow';
      shadows.instanceMatrix.setUsage(DynamicDrawUsage);
      shadows.castShadow = false;
      shadows.receiveShadow = false;
      shadows.renderOrder = 1;                        // after the opaque ground, before the people
      meshes.push(shadows);
      disposers.push(() => { shadowGeo.dispose(); shadowMat.dispose(); shadows.dispose(); });
    }
  }

  // ── stars + Milky Way ─────────────────────────────────────────────────────
  let stars = null;
  const nStars = starCount(sky);
  if (nStars > 0) {
    // Four segments is a lump, not a ball — and that is right: a star is one or two pixels wide, so
    // any triangle spent on its roundness is a triangle burnt on something nobody can see.
    const geometry = new SphereGeometry(1, 4, 3);
    const material = new MeshBasicMaterial({
      color: 0xffffff, transparent: true, opacity: 0.9, depthWrite: false, fog: false,
      blending: AdditiveBlending,
    });
    stars = new InstancedMesh(geometry, material, nStars);
    stars.name = 'sky-star';
    stars.castShadow = false;
    stars.receiveShadow = false;
    stars.renderOrder = -2;
    stars.frustumCulled = false;
    const r = R * 0.94;
    const milky = sky.milkyWay ? Math.round(nStars * 0.52) : 0;
    for (let i = 0; i < nStars; i += 1) {
      // a band for the Milky Way, a hemisphere for the rest — both deterministic in `i`
      const inBand = i < milky;
      const theta = unitHash(i, 3) * Math.PI * 2;
      const height = inBand
        // the band: a wide arc across the dome, its own scatter tight so it reads as ONE thing
        ? 0.34 + Math.sin(theta * 1.3) * 0.20 + (unitHash(i, 5) - 0.5) * 0.14
        : 0.05 + unitHash(i, 7) * 0.93;
      const y = height * r;
      const ring = Math.sqrt(Math.max(0, r * r - y * y));
      dummy.position.set(Math.cos(theta) * ring, y, Math.sin(theta) * ring);
      const size = (inBand ? 0.020 : 0.026 + unitHash(i, 11) * 0.052) * R * 0.026;
      dummy.scale.setScalar(size);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      stars.setMatrixAt(i, dummy.matrix);
      const b = inBand ? 0.35 + unitHash(i, 13) * 0.2 : 0.55 + unitHash(i, 17) * 0.45;
      tint.setRGB(b, b, b * (0.95 + unitHash(i, 19) * 0.1));
      stars.setColorAt(i, tint);
    }
    stars.instanceMatrix.needsUpdate = true;
    if (stars.instanceColor) stars.instanceColor.needsUpdate = true;
    meshes.push(stars);
    disposers.push(() => { geometry.dispose(); material.dispose(); stars.dispose(); });
  }

  // ── moon ──────────────────────────────────────────────────────────────────
  if (sky.moon && sky.moon.lit > 0.04) {
    const r = R * 0.9;
    const size = R * 0.028;
    const geometry = new SphereGeometry(size, 16, 12);
    const material = new MeshBasicMaterial({ color: 0xf3efe2, fog: false, depthWrite: false });
    const moon = new Mesh(geometry, material);
    // the moon rides the same circle the stars do, at a phase-dependent place in the sky
    const ang = Math.PI * 0.35 + sky.moon.frac * Math.PI * 1.2;
    moon.position.set(Math.cos(ang) * r * 0.8, r * 0.55, Math.sin(ang) * r * 0.8);
    moon.name = 'sky-moon';
    moon.renderOrder = -2;
    moon.frustumCulled = false;
    meshes.push(moon);
    disposers.push(() => { geometry.dispose(); material.dispose(); });

    // the unlit part: a dark disc sliding across, so a crescent reads as a crescent
    if (sky.moon.lit < 0.97) {
      const shadowGeo = new SphereGeometry(size * 1.02, 16, 12);
      const shadowMat = new MeshBasicMaterial({ color: 0x0b1020, fog: false, depthWrite: false });
      const shadow = new Mesh(shadowGeo, shadowMat);
      const offset = size * 2 * (1 - sky.moon.lit) * (sky.moon.waxing ? -1 : 1);
      const toCentre = new Vector3(-moon.position.x, 0, -moon.position.z).normalize();
      shadow.position.copy(moon.position).addScaledVector(new Vector3(-toCentre.z, 0, toCentre.x), offset);
      shadow.position.y = moon.position.y;
      shadow.name = 'sky-moon-shadow';
      shadow.renderOrder = -2;
      shadow.frustumCulled = false;
      meshes.push(shadow);
      disposers.push(() => { shadowGeo.dispose(); shadowMat.dispose(); });
    }
  }

  if (meshes.length === 0) return null;

  /**
   * Where cloud `c` is at time `t` — the ONE formula, read by both the puffs and the shadow so the
   * two can never drift apart. Wrapping is `mod span`: a cloud leaving one edge re-enters at the
   * other, which is why the sky never runs out.
   */
  // Angular drift: `sky.speed` is a linear wind, so divide by a mid-dome radius to get radians.
  const spin = sky.speed / Math.max(1, field * 0.6);
  function cloudAt(c, t) {
    // `sqrt` on the radius spreads clouds EVENLY OVER AREA. Without it they crowd the zenith, which
    // is exactly backwards: from the ground most of the sky you can see is near the horizon.
    const r = field * Math.sqrt(0.05 + 0.95 * unitHash(c, 29));
    const theta = unitHash(c, 23) * Math.PI * 2 + t * spin * (0.7 + unitHash(c, 31) * 0.6);
    const drop = 1 - (r / field) * (r / field);        // high overhead, low at the horizon
    const y = R * (0.10 + 0.42 * drop) * (shape.height / 3.9) * (0.85 + unitHash(c, 37) * 0.3);
    const w = shape.puff * (0.7 + unitHash(c, 41) * 0.9) * R * 0.055;
    // A cloud is drawn out ALONG THE WIND, and the wind here is the direction the cloud is turning
    // in — so the long axis is the tangent, not a random yaw. Yaw `-(θ + π/2)` is the three.js
    // rotation whose local +x points along that tangent (+x maps to `(cos φ, 0, −sin φ)`).
    return {
      along: Math.cos(theta) * r, across: Math.sin(theta) * r, y, w,
      tx: -Math.sin(theta), tz: Math.cos(theta),
      rx: Math.cos(theta), rz: Math.sin(theta),
      yaw: -(theta + Math.PI / 2),
    };
  }

  // The direction a shadow slides from its cloud: straight down the sun's own ray, flattened onto the
  // ground. Without this the shadow sits under the cloud at noon and STAYS there at dusk, which is
  // the one thing that would give it away.
  const sunX = sunDir ? sunDir.x : 0.433;
  const sunY = sunDir ? Math.max(0.12, sunDir.y) : 0.5;
  const sunZ = sunDir ? sunDir.z : -0.75;

  /** Clouds drift; the stars and the moon are fixed for the scene's lifetime. */
  function update(t) {
    if (!clouds || !shape) return;
    const stretch = shape.stretch ?? 1;
    for (let c = 0; c < nClouds; c += 1) {
      const { along, across, y, w, tx, tz, rx, rz, yaw } = cloudAt(c, t);
      for (let k = 0; k < PUFFS_PER_CLOUD; k += 1) {
        const i = c * PUFFS_PER_CLOUD + k;
        // puffs sit around the cloud's centre — spread far ALONG the wind, little across it, barely
        // up, so the cluster reads as one body with a lumpy top rather than four separate balls
        const a = (unitHash(i, 53) - 0.5) * w * 1.7 * stretch;
        const b = (unitHash(i, 59) - 0.5) * w * 1.1;
        const oy = (unitHash(i, 61) - 0.35) * w * shape.flat * 0.9;
        const size = w * (0.45 + unitHash(i, 67) * 0.5);
        dummy.position.set(along + a * tx + b * rx, y + oy, across + a * tz + b * rz);
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(
          size * stretch * (0.75 + unitHash(i, 47) * 0.5),
          size * Math.max(0.35, shape.flat),
          size * (0.75 + unitHash(i, 71) * 0.5),
        );
        dummy.updateMatrix();
        clouds.setMatrixAt(i, dummy.matrix);
      }
    }
    clouds.instanceMatrix.needsUpdate = true;
    if (!clouds.boundingSphere) clouds.boundingSphere = new Sphere(new Vector3(0, 0, 0), R * 1.2);

    if (shadows) {
      const stretchS = shape.stretch ?? 1;
      for (let c = 0; c < nClouds; c += 1) {
        const { along, across, y, w, yaw } = cloudAt(c, t);
        // follow the sun's ray down to y = 0, then ask the terrain how high it actually is there
        const x = along - (sunX / sunY) * y;
        const z = across - (sunZ / sunY) * y;
        // ⚠️ CHỈ ĐỔ BÓNG TRÊN PHẦN ĐẤT ĐỦ THOẢI. `groundAt` trả lời được ở mọi nơi, nhưng một cái
        // đĩa PHẲNG đặt trên sườn núi thì cắm một nửa vào trong núi. `shadowReach` là vành đất còn
        // thoải quanh thành phố; ra ngoài đó thu về 0 (không vẽ) chứ không đặt bừa.
        const reach = shadowReach ?? gridSize * 1.5;
        const out = Math.max(Math.abs(x), Math.abs(z));
        let fade = out >= reach ? 0 : Math.min(1, (reach - out) / 4);
        const g = groundAt(x, z);
        // ⚠️ VÀ MỘT PHÉP KIỂM ĐỘ DỐC TẠI CHỖ, không chỉ một bán kính. Bán kính là một con số tuyệt
        // đối nói thay cho một QUAN HỆ ("chỗ này có thoải không") — đúng cái bẫy đã trả giá nhiều
        // lần ở đây. Hỏi thẳng mặt đất ở hai mép đĩa: chênh quá nửa đơn vị thì đây là sườn dốc,
        // đĩa phẳng sẽ cắm vào trong đất, nên không vẽ.
        if (fade > 0) {
          const rr = w * 1.5;
          const dh = Math.max(
            Math.abs(groundAt(x + rr, z) - g),
            Math.abs(groundAt(x, z + rr) - g),
          );
          if (dh > 0.5) fade = 0;
        }
        dummy.position.set(x, (Number.isFinite(g) ? g : 0) + 0.035, z);
        // the shadow is the cloud seen from above, so it is stretched the same way and turned the
        // same way — a round blob under a long streak would give the whole trick away
        dummy.rotation.set(0, yaw, 0);
        dummy.scale.set(w * 1.5 * stretchS * fade, 1, w * 1.2 * fade);
        dummy.updateMatrix();
        shadows.setMatrixAt(c, dummy.matrix);
      }
      shadows.instanceMatrix.needsUpdate = true;
      if (!shadows.boundingSphere) shadows.boundingSphere = new Sphere(new Vector3(0, 0, 0), R * 2);
    }
  }
  update(0);

  return { meshes, update, dispose: () => disposers.forEach((d) => d()) };
}
