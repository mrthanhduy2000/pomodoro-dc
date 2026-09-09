/**
 * motion.js (render side) — the scenery moves (round 48, ADR-088).
 *
 * Three mechanisms, all driven by ONE clock (`uniforms.uTime`, seconds, wrapped by
 * `engine/city3d/motion.motionTime`) so a frame is a pure function of time:
 *   1. VERTEX MOTION for the merged city geometry — foliage sways, cloth flaps, floating things bob.
 *      `geometryFactory` writes a per-vertex `aMotion` attribute (kind · amplitude · phase · weight);
 *      the GLSL below displaces `transformed` in the vertex stage. Zero draw calls, zero CPU per frame.
 *   2. WATER — the water mesh's vertices ride two crossed waves and its normal follows the slope,
 *      so the sky/ENV reflection shifts as the surface moves ("phản chiếu chao").
 *   3. PARTICLES — a few `InstancedMesh`es (smoke from chimneys, snow, sand, dust, birds), each
 *      instance a function of (index, time), updated on the CPU (a few hundred matrices a frame).
 *
 * ⚠️ `three` allows ONE `onBeforeCompile` per material. `surfaceDetail.applySurfaceDetail` owns it
 * for the merged materials and calls `injectMotion` from inside its own hook; the water material has
 * no surface detail, so it gets `injectWater` directly. Never set `onBeforeCompile` twice.
 */
import {
  AdditiveBlending, Color, DynamicDrawUsage, InstancedMesh, Matrix4, MeshBasicMaterial, Object3D, Sphere,
  SphereGeometry, Vector3,
} from 'three';
import { MOTION_KIND, PARTICLE_STYLE, SMOKE_INTENSITY, phaseAt } from '../../../engine/city3d/motion';

export const MOTION_ATTRIBUTE = 'aMotion';

/** Shared uniforms for every merged material of one scene. */
export function createMotionUniforms(wind) {
  return {
    uTime: { value: 0 },
    uWindAmp: { value: wind?.amp ?? 0.1 },
    uWindSpeed: { value: wind?.speed ?? 1 },
    uMotionFade: { value: 1 },
  };
}

const MOTION_PARS = `
attribute vec4 aMotion;
uniform float uTime;
uniform float uWindAmp;
uniform float uWindSpeed;
uniform float uMotionFade;
`;

/**
 * Runs right after `begin_vertex` (where `transformed` = local position). Amplitude fades with
 * camera distance so the far edge of the hinterland does not shimmer, but never to zero — an
 * abrupt cut would draw a visible line where motion stops (the LOD lesson of `TECH_DEBT_3D #26`).
 */
const MOTION_VERTEX = `
if ( aMotion.x > 0.5 && aMotion.w > 0.0 ) {
  float mt = uTime * uWindSpeed + aMotion.z;
  vec4 mvProbe = modelViewMatrix * vec4( transformed, 1.0 );
  float mdist = length( mvProbe.xyz );
  float mfade = clamp( 1.0 - ( mdist - 9.0 ) * 0.025, 0.35, 1.0 ) * uMotionFade;
  float ma = uWindAmp * aMotion.y * aMotion.w * mfade;
  if ( aMotion.x < 1.5 ) {
    float g = sin( mt ) * 0.7 + sin( mt * 2.31 + 1.3 ) * 0.3;
    transformed.x += ma * g;
    transformed.z += ma * 0.45 * sin( mt * 1.7 + 0.8 );
    transformed.y -= abs( ma * g ) * 0.25;
  } else if ( aMotion.x < 2.5 ) {
    transformed.y += ma * sin( mt * 1.4 );
  } else {
    float mw = aMotion.w;
    transformed.z += ma * sin( mt * 3.0 - mw * 6.0 ) * mw;
    transformed.y += ma * 0.3 * sin( mt * 2.2 - mw * 4.0 ) * mw;
  }
}
`;

/** Called from inside a material's `onBeforeCompile`. */
export function injectMotion(shader, uniforms) {
  Object.assign(shader.uniforms, uniforms);
  shader.vertexShader = MOTION_PARS + shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>\n${MOTION_VERTEX}`,
  );
}

/** Water: two crossed waves; the normal is recomputed from the analytic slope BEFORE lighting. */
export function createWaterUniforms(amp = 0.02) {
  return { uTime: { value: 0 }, uWaveAmp: { value: amp } };
}

const WATER_PARS = `
uniform float uTime;
uniform float uWaveAmp;
float dcWaveH( vec3 p, float t ) {
  return uWaveAmp * ( 0.35 * sin( p.x * 2.1 + t * 0.9 ) + 0.35 * sin( p.z * 1.7 - t * 0.7 )
    + 0.30 * sin( ( p.x + p.z ) * 4.3 + t * 1.9 ) );
}
`;

export function injectWater(material, uniforms) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = WATER_PARS + shader.vertexShader
      .replace(
        '#include <beginnormal_vertex>',
        `#include <beginnormal_vertex>
        {
          float e = 0.05;
          float hx = dcWaveH( position + vec3( e, 0.0, 0.0 ), uTime ) - dcWaveH( position - vec3( e, 0.0, 0.0 ), uTime );
          float hz = dcWaveH( position + vec3( 0.0, 0.0, e ), uTime ) - dcWaveH( position - vec3( 0.0, 0.0, e ), uTime );
          objectNormal = normalize( vec3( -hx / ( 2.0 * e ), 1.0, -hz / ( 2.0 * e ) ) );
        }`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        transformed.y += dcWaveH( position, uTime );`,
      );
  };
  return material;
}

/** Deterministic unit hash for particle i and salt k. */
function unitHash(i, k = 0) {
  const s = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const SPHERE = new SphereGeometry(1, 6, 4);
const dummy = new Object3D();
const matrix = new Matrix4();
const colour = new Color();

/**
 * One particle system. `sources` — world points the particles are born at (chimney tops); when the
 * style is `wide`, particles instead fill `bounds` = { x0, x1, z0, z1, y0, y1 }.
 * Returns `{ mesh, update(t), count }`; `mesh` is an `InstancedMesh` to add to the scene.
 */
export function createParticles({ kind, sources = [], bounds = null, intensity = 1, sky = 0xcfd8e0, light = 1 }) {
  const style = PARTICLE_STYLE[kind];
  if (!style) return null;
  const count = style.wide ? style.count : Math.round(sources.length * style.perSource * (kind === 'fire' ? 1 : intensity));
  if (!(count > 0)) return null;
  if (style.wide && !bounds) return null;

  const material = new MeshBasicMaterial({
    color: style.tint, transparent: style.alpha < 1 || Boolean(style.additive), opacity: style.alpha,
    depthWrite: false, fog: style.fog ?? true,
    // Round 49 (ADR-089): fire ADDS light to what is behind it instead of painting over it
    ...(style.additive ? { blending: AdditiveBlending } : {}),
  });
  const mesh = new InstancedMesh(SPHERE, material, count);
  mesh.instanceMatrix.setUsage(DynamicDrawUsage);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  mesh.name = `particles-${kind}`;
  // Frustum culling stays ON with a FIXED bounding sphere over the whole volume the particles can
  // ever occupy: a camera that looks away from the city must draw nothing (the sceneStats control test),
  // and recomputing a sphere from hundreds of moving instances every frame would be waste.
  {
    const c = new Vector3(); let r = 1;
    if (style.wide && bounds) {
      c.set((bounds.x0 + bounds.x1) / 2, (bounds.y0 + bounds.y1) / 2, (bounds.z0 + bounds.z1) / 2);
      r = Math.hypot(bounds.x1 - bounds.x0, bounds.y1 - bounds.y0, bounds.z1 - bounds.z0) / 2 + style.drift * style.life + 4;
    } else if (sources.length) {
      let x0 = Infinity; let x1 = -Infinity; let z0 = Infinity; let z1 = -Infinity; let y0 = Infinity; let y1 = -Infinity;
      for (const p of sources) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); y0 = Math.min(y0, p.y); y1 = Math.max(y1, p.y); }
      const rise = Math.abs(style.rise) * style.life * 1.3 + style.size[1];
      c.set((x0 + x1) / 2, (y0 + y1 + rise) / 2, (z0 + z1) / 2);
      r = Math.hypot(x1 - x0, y1 - y0 + rise, z1 - z0) / 2 + style.drift * style.life * 2 + style.size[1];
    }
    mesh.boundingSphere = new Sphere(c, r);
    mesh.frustumCulled = true;
  }
  const tint = new Color(style.tint);
  // Round 49: smoke and steam are LIT by the sky (`light`, see `smokeLightFor`); fire lights itself
  if (!style.wide && !style.additive) tint.multiplyScalar(light);
  // a smoke puff fades into the SKY; a tongue of fire cools into dark red (`tintEnd`)
  const fade = new Color(style.tintEnd ?? sky);
  const emberTint = new Color(0xffd98a);
  const isFire = kind === 'fire';

  const spanX = bounds ? bounds.x1 - bounds.x0 : 0;
  const spanZ = bounds ? bounds.z1 - bounds.z0 : 0;
  const spanY = bounds ? bounds.y1 - bounds.y0 : 0;

  function update(t) {
    for (let i = 0; i < count; i += 1) {
      const life = style.life * (0.8 + unitHash(i, 1) * 0.4);
      const age = (t + unitHash(i, 2) * life) % life;
      const u = age / life;
      let x; let y; let z; let s;
      if (style.wide) {
        // fill the volume: snow falls, sand/dust drift sideways, birds glide in slow arcs
        const dirX = Math.cos(unitHash(i, 3) * Math.PI * 2);
        const dirZ = Math.sin(unitHash(i, 3) * Math.PI * 2);
        if (kind === 'birds') {
          const cx = bounds.x0 + unitHash(i, 4) * spanX;
          const cz = bounds.z0 + unitHash(i, 5) * spanZ;
          const r = 1.5 + unitHash(i, 6) * 3;
          const w = 0.25 + unitHash(i, 7) * 0.2;
          x = cx + Math.cos(t * w + unitHash(i, 8) * 6.28) * r;
          z = cz + Math.sin(t * w + unitHash(i, 8) * 6.28) * r * 0.6;
          y = bounds.y1 + Math.sin(t * 0.7 + i) * 0.3;
          s = style.size[0];
          dummy.position.set(x, y, z);
          dummy.scale.set(s * 2.4, s * (0.5 + 0.5 * Math.abs(Math.sin(t * 9 + i))), s * 0.7);
          dummy.rotation.set(0, -(t * w + unitHash(i, 8) * 6.28) + Math.PI / 2, 0);
          dummy.updateMatrix();
          mesh.setMatrixAt(i, dummy.matrix);
          continue;
        }
        x = bounds.x0 + unitHash(i, 4) * spanX + dirX * style.drift * age;
        z = bounds.z0 + unitHash(i, 5) * spanZ + dirZ * style.drift * age;
        y = style.rise < 0
          ? bounds.y1 - (bounds.y1 - bounds.y0) * u
          : bounds.y0 + unitHash(i, 6) * spanY + style.rise * age;
        if (!style.streak) x += Math.sin(t * 1.3 + i) * 0.08;   // snow wanders; rain does not
        s = style.size[0] + (style.size[1] - style.size[0]) * u;
      } else if (isFire) {
        // Round 49 (ADR-089): tongues rise straight and fast from the flame top, wobbling; every
        // fourth particle is an EMBER — a speck that lives longer, drifts wider, stays bright.
        const src = sources[Math.floor(i / style.perSource) % sources.length];
        const ph = phaseAt(src.x, src.z);
        const ember = i % 4 === 3;
        const lifeF = ember ? life * 2.2 : life;
        const ageF = (t + unitHash(i, 2) * lifeF) % lifeF;
        const uF = ageF / lifeF;
        const wob = ember ? 0.05 : 0.018;
        x = src.x + Math.sin(ageF * 7.1 + ph + i) * wob * (1 + uF * 2) + (unitHash(i, 4) - 0.5) * 0.05;
        z = src.z + Math.cos(ageF * 6.3 + ph * 1.7 + i) * wob * (1 + uF * 2) + (unitHash(i, 5) - 0.5) * 0.05;
        y = src.y - 0.03 + style.rise * ageF * (ember ? 0.75 : 1);
        s = ember
          ? 0.011 * (0.8 + 0.4 * Math.abs(Math.sin(t * 21 + i)))
          : (style.size[0] + (style.size[1] - style.size[0]) * uF) * (0.85 + 0.3 * Math.abs(Math.sin(t * 23 + i * 1.3)));
        dummy.position.set(x, y, z);
        dummy.rotation.set(0, 0, 0);
        dummy.scale.setScalar(Math.max(1e-4, s));
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
        if (ember) colour.copy(emberTint); else colour.copy(tint).lerp(fade, uF * uF);
        mesh.setColorAt(i, colour);
        continue;
      } else {
        const src = sources[Math.floor(i / Math.max(1, style.perSource * intensity)) % sources.length];
        const ph = phaseAt(src.x, src.z);
        const dirX = Math.cos(ph) * 0.6 + 0.8;   // leeward: smoke bends one way, like a real wind
        const dirZ = Math.sin(ph) * 0.6;
        const rise = style.rise * age * (0.8 + intensity * 0.2);
        x = src.x + dirX * style.drift * age * (1 + u) + Math.sin(age * 1.9 + ph) * 0.03 * (1 + u * 3);
        z = src.z + dirZ * style.drift * age * (1 + u) + Math.cos(age * 1.6 + ph) * 0.03 * (1 + u * 3);
        y = src.y + rise;
        s = (style.size[0] + (style.size[1] - style.size[0]) * u) * (0.9 + intensity * 0.15);
      }
      const shrink = u > 0.8 ? 1 - (u - 0.8) / 0.2 : 1;
      dummy.position.set(x, y, z);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.setScalar(Math.max(1e-4, s * shrink));
      if (style.streak) dummy.scale.y *= style.streak;   // a raindrop is a streak, not a bead
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      if (!style.wide) {
        colour.copy(tint).lerp(fade, u * 0.8);
        mesh.setColorAt(i, colour);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }

  update(0);
  return {
    mesh,
    count,
    update,
    dispose: () => { material.dispose(); mesh.dispose(); },
  };
}

/** Kind code helper for the factory (keeps the attribute layout in one place). */
export function motionVertex(kind, amp, phase, weight) {
  return [kind ?? MOTION_KIND.none, amp ?? 0, phase ?? 0, weight ?? 0];
}

export { matrix as _motionScratchMatrix };
