/**
 * postFx.js — ROUND 52 (ADR-092): THE POST PASS. One place, five effects, one switch.
 *
 * ⚠️ THIS FILE EXISTS BECAUSE A BAN WAS LIFTED, AND THE BAN WAS NOT WRONG WHEN IT WAS WRITTEN.
 * `CityScene3D.jsx` refused an `EffectComposer` and `materials.js`/`occlusion.js` refused SSAO, all
 * three for the same measured reason: a full-screen pass bills per PIXEL, `PERFORMANCE.md` found 80 %
 * of this scene's frame cost is already per-pixel, and an extra pass every frame breaks
 * render-on-demand. Đàm lifted it on 2026-09-11 in one sentence — *"Máy tôi rất mạnh. Lag thì tôi
 * nói."* — and asked for a switch so he can take it back himself. So the cost is real, the decision
 * is his, and this file's job is to make the switch honest: with `enabled: false` NOTHING here is
 * constructed, no render target is allocated, and the scene renders exactly as it did in round 51.
 *
 * ⚠️ ORDER IS NOT A PREFERENCE, IT IS PHYSICS. Ambient occlusion darkens creases in the RAW image, so
 * it must run before anything adds light. God rays are light scattering in the air between the city
 * and the eye, so they come after the image exists but before the lens sees it. Bloom is the LENS
 * failing to contain a bright spot, so it comes after everything that makes light. Depth of field,
 * vignette and grain are the lens and the film, so they are last. Put bloom before AO and the AO
 * eats the glow; put god rays after bloom and the shafts bloom twice.
 *
 *   RenderPass → god rays → bloom → lens (AO · DOF · vignette · grain) → OutputPass
 *
 * ⚠️ TONE MAPPING MOVES TO `OutputPass`, AND THAT IS WHY THE PAINTED LOOK SURVIVES. With a composer,
 * `RenderPass` writes LINEAR colour into a float buffer; if the renderer also tone-mapped there, the
 * image would be tone-mapped twice and come out washed — the exact "pastel như sữa" failure this
 * project nearly died of twice. `OutputPass` reads `renderer.toneMapping` (Neutral, exposure 1,2 —
 * set by `applyPaintedLook`) and applies it ONCE, at the end. Nothing about the look is re-chosen here.
 */
import {
  Color, DepthTexture, FloatType, HalfFloatType, MeshDepthMaterial, NoBlending, RGBADepthPacking,
  ShaderMaterial, UnsignedShortType, Vector2, Vector3, WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

/**
 * How strong each effect is, by daylight phase. One table, so "the night looks different" is a row
 * to read rather than a chain of `if (night)` scattered through the file.
 *
 * ⚠️ BLOOM AT NIGHT IS NOT "MORE BLOOM", IT IS A LOWER THRESHOLD. The scene has 235 self-lit sources
 * (fire, forges, lamps, lit windows); at noon they sit below a daylight-bright wall and must NOT
 * glow, or every whitewashed facade halos. At night they are the only bright things in the frame, so
 * the threshold drops and they are the only things that glow. Same pass, one number.
 */
/**
 * ⚠️ THESE NUMBERS WERE MEASURED ON A FRAME, NOT CHOSEN FROM A TUTORIAL. The first build used the
 * values every bloom example uses at night — strength 1,05, threshold 0,26 — and the rendered street
 * came back with every lit window blown into a white blob that ate the facade around it. The reason
 * is specific to this scene and worth writing down: the buffer is LINEAR HDR, and round 49's glow
 * sink draws fire and lit windows near 0,9 while a sunlit wall sits near 1,0 — so a threshold under
 * ~0,5 does not separate "a lamp" from "a bright wall", it selects BOTH. The threshold is what
 * decides WHAT glows; the strength only decides how much. Fix the threshold first, always.
 */
/**
 * Số mẫu mỗi điểm ảnh của khung đệm hậu kỳ (MSAA). Round 55, Việc 1.
 * Xem khối cảnh báo lớn ở chỗ dựng `target` trong `createPostFx` — nó giải thích vì sao cờ
 * `antialias` của `WebGLRenderer` đã mất tác dụng từ vòng 52, và vì sao số này phải đặt CAO.
 * three tự kẹp xuống `gl.MAX_SAMPLES`, nên đây là "xin tối đa", không phải "ép phần cứng".
 */
export const MSAA_SAMPLES = 8;

export const POST_PROFILE = Object.freeze({
  day:   { bloom: 0.26, threshold: 1.05, radius: 0.40, ao: 0.62, rays: 0.34, grain: 0.018, vignette: 0.22 },
  golden:{ bloom: 0.42, threshold: 0.92, radius: 0.52, ao: 0.70, rays: 0.85, grain: 0.024, vignette: 0.28 },
  night: { bloom: 0.46, threshold: 0.72, radius: 0.46, ao: 0.48, rays: 0.10, grain: 0.030, vignette: 0.32 },
});

/** Which row of the table an hour lands on. `daylight.js` owns the phases; this only groups them. */
export function postProfileFor(phase) {
  if (phase === 'night') return POST_PROFILE.night;
  if (phase === 'dawn' || phase === 'dusk') return POST_PROFILE.golden;
  return POST_PROFILE.day;
}

/**
 * GOD RAYS — light scattering in the air between the city and the eye.
 *
 * ⚠️ IT IS A RADIAL BLUR OF THE BRIGHT PARTS TOWARD THE SUN, NOT A VOLUME TRACE. A true volumetric
 * integral would march the shadow map per pixel; this samples the already-rendered image along the
 * line to the sun's SCREEN position and keeps only what is bright. That is the classic Crytek trick
 * and it is honest here for one reason this scene happens to satisfy: the things that occlude the sun
 * — roofs, towers, chimneys, tree canopies — are opaque and already in the frame, so the shafts land
 * exactly where a roof edge cuts the light, which is the whole point of the effect.
 *
 * ⚠️ AND IT IS MULTIPLIED BY `uAir`: shafts only exist if there is something in the air to scatter
 * off. Round 49 gave the scene fog, smoke, rain, snow and sand, and round 51 gave it cloud; a clear
 * desert noon has no shafts and must not get them.
 */
const GodRaysShader = {
  uniforms: {
    tDiffuse:  { value: null },
    uSun:      { value: new Vector2(0.5, 0.8) },
    uStrength: { value: 0.4 },
    uAir:      { value: 0.5 },
    uTint:     { value: new Color(0xffd9a0) },
    uBehind:   { value: 0 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform vec2 uSun;
    uniform float uStrength;
    uniform float uAir;
    uniform vec3 uTint;
    uniform float uBehind;
    varying vec2 vUv;

    const int STEPS = 24;

    void main() {
      vec4 base = texture2D(tDiffuse, vUv);
      // the sun behind the camera, or nothing in the air to scatter off: the pass is a no-op, and a
      // no-op that costs one texture fetch is cheaper than a branch in the composer
      if (uBehind > 0.5 || uStrength * uAir < 0.002) { gl_FragColor = base; return; }

      vec2 delta = (vUv - uSun) * (1.0 / float(STEPS)) * 0.92;
      vec2 uv = vUv;
      float decay = 1.0;
      vec3 sum = vec3(0.0);
      for (int i = 0; i < STEPS; i++) {
        uv -= delta;
        vec3 s = texture2D(tDiffuse, clamp(uv, 0.0, 1.0)).rgb;
        // keep only what is genuinely bright — a shaft is made of light, not of pale plaster
        float lum = dot(s, vec3(0.2126, 0.7152, 0.0722));
        s *= smoothstep(0.55, 1.15, lum);
        sum += s * decay;
        decay *= 0.955;
      }
      sum /= float(STEPS);
      // fade with distance from the sun: shafts are strongest at the source and die out across frame
      float fall = 1.0 - smoothstep(0.0, 1.1, length(vUv - uSun));
      gl_FragColor = vec4(base.rgb + sum * uTint * uStrength * uAir * fall, base.a);
    }
  `,
};

/**
 * THE LENS — depth of field, vignette, grain, in one pass because they are one thing: the camera.
 *
 * ⚠️ THE DEPTH OF FIELD IS REAL DEPTH, NOT A DISTANCE FROM THE CENTRE OF THE FRAME. The cheap trick
 * (blur by radius) puts the corners of a wall out of focus while its middle stays sharp, which reads
 * as a smear rather than as a lens. This samples the composer's own depth texture, converts to view
 * distance, and blurs by how far that is from the focus plane — so a lamp post three metres away is
 * sharp and the street behind it goes soft, which is what a real lens does and what makes walk mode
 * feel like a camera rather than a viewport.
 *
 * ⚠️ IT IS ONLY ON WHEN WALKING. From the overview camera everything is far away and roughly
 * equidistant, so a depth blur there only destroys the skyline it was supposed to flatter.
 *
 * ⚠️ THE GRAIN IS DETERMINISTIC IN `uFrame`, NOT IN TIME. The project's whole photographic method
 * depends on the same command producing the same pixels (lesson 105); a grain seeded from
 * `Date.now()` would make every before/after comparison noise.
 */
const LensShader = {
  uniforms: {
    tDiffuse:   { value: null },
    tDepth:     { value: null },
    uNear:      { value: 0.1 },
    uFar:       { value: 100 },
    uFocus:     { value: 2.4 },
    uDofRange:  { value: 9.0 },
    uDofAmount: { value: 0.0 },
    uTexel:     { value: new Vector2(1 / 1024, 1 / 1024) },
    uVignette:  { value: 0.24 },
    uVignetteTint: { value: new Color(0x2a1c0f) },
    uGrain:     { value: 0.02 },
    uFrame:     { value: 0 },
    uAo:        { value: 0.0 },
    uAoRadius:  { value: 0.28 },
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
  `,
  fragmentShader: /* glsl */`
    #include <packing>
    uniform sampler2D tDiffuse;
    uniform sampler2D tDepth;
    uniform float uNear;
    uniform float uFar;
    uniform float uFocus;
    uniform float uDofRange;
    uniform float uDofAmount;
    uniform vec2 uTexel;
    uniform float uVignette;
    uniform vec3 uVignetteTint;
    uniform float uGrain;
    uniform float uFrame;
    uniform float uAo;
    uniform float uAoRadius;
    varying vec2 vUv;

    float viewDistance(vec2 uv) {
      float d = texture2D(tDepth, uv).x;
      float vz = perspectiveDepthToViewZ(d, uNear, uFar);
      return -vz;
    }

    /*
      ════════════════════════════════════════════════════════════════════════════════════════
      CHE KHUẤT MÔI TRƯỜNG (AO) — ROUND 53 (ADR-093), Việc 5. ĐÓNG "TECH_DEBT #52".
      ════════════════════════════════════════════════════════════════════════════════════════
      Vòng 52 dùng "GTAOPass" của three và phải TẮT nó ở chế độ đi bộ: nó trả về đệm che khuất
      ĐEN ĐẶC cho mọi thứ gần camera ở tầm mắt (một đường ngang thẳng tắp ở hàng 612/700, lệch
      16,5/255, không nhúc nhích dù vặn mọi tham số). Đề xuất ghi trong chính mục nợ ấy là: viết
      phép che khuất THẲNG VÀO ĐÂY, lấy mẫu trên đệm độ sâu ĐÃ CÓ SẴN cho xoá phông. Vòng 53 làm.

      ⚠️ KHÔNG DỰNG LẠI TOẠ ĐỘ KHÔNG GIAN NHÌN, VÀ ĐÓ LÀ CẢ LÝ DO NÓ KHÔNG DÍNH LỖI CŨ. GTAO dựng
      lại vị trí 3D từ độ sâu bằng ma trận chiếu nghịch đảo — chính chỗ ấy hỏng ở tầm mắt. Ở đây ta
      chỉ SO SÁNH KHOẢNG CÁCH: điểm nào quanh ta ở GẦN HƠN thì nó che ta. Không ma trận, không
      nghịch đảo, không chỗ nào để một phép chiếu sai làm hỏng cả vùng ảnh.

      ⚠️ BA CÁI KẸP, MỖI CÁI CHẶN MỘT LỖI CÓ THẬT CỦA HỌ THUẬT TOÁN NÀY:
        1. "bias" — bỏ qua chênh lệch quá nhỏ. Không có nó thì một mặt phẳng nghiêng tự che chính
           nó và cả mặt đường tối đi (đúng triệu chứng "dải tối" của GTAO, chỉ khác nguyên nhân).
        2. "range" — bỏ qua chênh lệch quá lớn. Một mái nhà cách xa 5 đơn vị KHÔNG che chân tường
           trước mặt; nó là một vật khác, và tính nó vào là vẽ một viền đen quanh mọi bóng dáng.
        3. Bán kính lấy mẫu tỉ lệ **NGHỊCH** với khoảng cách: một góc tường rộng 10cm phải cho ra
           cùng một vệt tối dù ta đứng cách 1 mét hay 10 mét. Bán kính cố định theo điểm ảnh thì
           vật ở xa bị bôi đen còn vật ở gần chẳng có gì — một cái thước đo bằng đơn vị sai.

      ⚠️ TẤT ĐỊNH TUYỆT ĐỐI: 12 hướng lấy mẫu KHAI CỨNG, không xoay ngẫu nhiên theo điểm ảnh. Xoay
      ngẫu nhiên cho ảnh mịn hơn nhưng phá luật "ảnh tĩnh phải ra cùng một byte" ("still"), mà luật
      ấy là thứ đã chữa vệt rách của vòng 52. Đổi mịn lấy tất định là một đánh đổi đã trả tiền rồi.
    */
    const vec2 AO_DIR[12] = vec2[12](
      vec2( 1.000,  0.000), vec2( 0.866,  0.500), vec2( 0.500,  0.866), vec2( 0.000,  1.000),
      vec2(-0.500,  0.866), vec2(-0.866,  0.500), vec2(-1.000,  0.000), vec2(-0.866, -0.500),
      vec2(-0.500, -0.866), vec2( 0.000, -1.000), vec2( 0.500, -0.866), vec2( 0.866, -0.500)
    );

    float ambientOcclusion(vec2 uv, float dist) {
      // Bán kính theo điểm ảnh, suy từ bán kính THẾ GIỚI chia cho khoảng cách — xem kẹp số 3.
      float r = clamp(uAoRadius / max(dist, 0.35), 0.004, 0.075);
      float bias = 0.012 + dist * 0.006;
      float range = 0.22 + dist * 0.16;
      float occ = 0.0;
      for (int i = 0; i < 12; i += 1) {
        // Hai vành: vành trong bắt nếp gấp hẹp (má cửa sổ), vành ngoài bắt góc rộng (chân tường).
        for (int k = 1; k <= 2; k += 1) {
          vec2 off = AO_DIR[i] * r * (k == 1 ? 0.45 : 1.0);
          float dz = dist - viewDistance(uv + off);
          occ += (dz > bias && dz < range) ? smoothstep(bias, bias + range * 0.45, dz) : 0.0;
        }
      }
      return occ / 24.0;
    }

    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;

      // ── che khuất môi trường ──────────────────────────────────────────────
      // ⚠️ NHÂN VÀO MÀU, KHÔNG TRỪ ĐI. Trừ một hằng số làm vùng tối bị NGHIỀN xuống 0 và mất hết
      // sắc — đúng bệnh "vùng tối là ĐEN chứ không phải LAM" mà "sceneGraph.js" đã đo và chữa một
      // lần bằng tỉ lệ đèn trời. Nhân thì giữ nguyên sắc, chỉ hạ giá trị.
      if (uAo > 0.001) {
        float dist = viewDistance(vUv);
        // Trời không có độ sâu (độ sâu = xa vô cùng) ⇒ không bao giờ bị che. Thiếu vế này thì
        // đường chân trời viền một vệt đen, và nó trông y hệt một khuyết tật của bầu trời.
        if (dist < uFar * 0.96) {
          col *= 1.0 - ambientOcclusion(vUv, dist) * uAo;
        }
      }

      // ── depth of field ────────────────────────────────────────────────────
      if (uDofAmount > 0.001) {
        float dist = viewDistance(vUv);
        float coc = clamp(abs(dist - uFocus) / uDofRange, 0.0, 1.0);
        coc = coc * coc * uDofAmount;
        if (coc > 0.003) {
          vec3 blur = vec3(0.0);
          float r = coc * 3.2;
          // eight taps on a ring plus the centre — enough for a soft street, cheap enough to be free
          blur += texture2D(tDiffuse, vUv + vec2( 1.0,  0.0) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2(-1.0,  0.0) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2( 0.0,  1.0) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2( 0.0, -1.0) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2( 0.7,  0.7) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2(-0.7,  0.7) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2( 0.7, -0.7) * uTexel * r).rgb;
          blur += texture2D(tDiffuse, vUv + vec2(-0.7, -0.7) * uTexel * r).rgb;
          blur /= 8.0;
          col = mix(col, blur, clamp(coc * 1.6, 0.0, 0.85));
        }
      }

      // ── vignette ──────────────────────────────────────────────────────────
      // The same warm brown the CSS layer used since Phase 8 (#2a1c0f): pure black reads as a broken
      // screen, warm brown reads as old varnish. It stays a relation to the image, not a constant.
      vec2 p = vUv - 0.5;
      float vig = smoothstep(0.34, 0.82, length(p * vec2(1.06, 1.0)));
      col = mix(col, uVignetteTint, vig * uVignette);

      // ── grain ─────────────────────────────────────────────────────────────
      float n = fract(sin(dot(vUv * 1024.0 + uFrame, vec2(12.9898, 78.233))) * 43758.5453);
      col += (n - 0.5) * uGrain;

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};

/**
 * Build the post pass. Returns `null` when disabled — the caller then keeps `renderer.render(...)`,
 * which is the round-51 path, byte for byte.
 *
 * @param {object} p
 * @param {object} p.renderer
 * @param {object} p.scene
 * @param {object} p.camera
 * @param {number} p.width  drawing-buffer width
 * @param {number} p.height drawing-buffer height
 * @param {object} [p.profile] a row of `POST_PROFILE`
 * @param {boolean} [p.walk]  walk mode ⇒ depth of field on
 * @returns {{render:Function,setSize:Function,update:Function,dispose:Function,passes:object}|null}
 */
export function createPostFx({
  renderer, scene, camera, width, height, profile = POST_PROFILE.day, walk = false,
  /**
   * Which effects to build. `null` = all of them.
   *
   * ⚠️ THIS EXISTS BECAUSE THE FIRST POST-PROCESSED FRAME CAME OUT BLACK, and the only way to find
   * out WHICH pass ate the image is to build them one at a time. It stayed after the bug was found,
   * for the same reason `--nomotion` and `--dry` stayed: a pass you can switch off is a pass you can
   * prove is doing something, and this round's whole evidence standard is "show it running".
   */
  only = null,
  /** Still capture: pin the film grain so every draw is byte-identical — see the note at `still`. */
  still = false,
} = {}) {
  const want = (name) => !only || only.includes(name);
  if (!renderer || !scene || !camera) return null;
  const w = Math.max(2, Math.round(width || 2));
  const h = Math.max(2, Math.round(height || 2));

  /**
   * ⚠️ HALF FLOAT. Bloom needs values ABOVE 1 to know what is bright — in an 8-bit buffer a forge
   * fire and a whitewashed wall are both 1,0 and the threshold has nothing left to separate.
   */
  /*
    ══════════════════════════════════════════════════════════════════════════════════════════════
    ⚠️ `samples` — KHỬ RĂNG CƯA. ROUND 55, VIỆC 1. ĐỌC CẢ KHỐI NÀY TRƯỚC KHI ĐỘNG VÀO DÒNG DƯỚI.
    ══════════════════════════════════════════════════════════════════════════════════════════════
    Phát hiện của Đàm, và nó đúng: `CityScene3D.jsx` khai `antialias: true` lúc dựng `WebGLRenderer`,
    nhưng **từ vòng 52 cảnh không còn vẽ thẳng ra màn hình nữa**. Nó vẽ vào khung đệm của
    `EffectComposer`, và một `WebGLRenderTarget` mặc định `samples: 0` — tức KHÔNG đa mẫu. Cái cờ
    `antialias` chỉ áp cho khung đệm mặc định của canvas, mà thứ duy nhất còn vẽ vào đó là một tấm
    quad phủ kín màn hình của `OutputPass` — một hình chữ nhật không có cạnh chéo nào để khử.
    ⇒ **Ba vòng liền (52 · 53 · 54) mọi mép mái, mép cột, viền người đều là bậc thang**, trong khi
    một dòng mã nói rằng đã khử răng cưa. Đây đúng họ bài học *"một câu tự trấn an phải được kiểm
    như một con số"* — chỉ khác là lần này câu trấn an là một tham số của thư viện.

    ⚠️ VÀ CÔNG CỤ CHỤP ẢNH KHÔNG NÓI DỐI — đã kiểm, và câu trả lời quan trọng hơn bản vá.
    `scripts/city-preview.mjs` **gọi đúng `createPostFx` của file này** (dòng import ở đầu nó), nên
    nó mang y hệt khuyết tật. Nghĩa là mọi ảnh nghiệm thu từ vòng 52 tới nay **xấu đúng bằng** thứ
    Đàm nhìn trên máy, không xấu hơn và không đẹp hơn. Nếu công cụ ấy đã tự dựng lấy một chuỗi hậu
    kỳ riêng thì ba vòng ảnh vừa qua đã là bằng chứng giả — đó là lý do phải kiểm trước khi vá.

    ⚠️ `8` KHÔNG PHẢI MỘT CON SỐ MẠO HIỂM: three tự kẹp xuống `gl.MAX_SAMPLES` của phần cứng
    (`WebGLRenderer`: `Math.min(capabilities.maxSamples, renderTarget.samples)`), nên máy chỉ hỗ trợ
    4 sẽ nhận 4, không lỗi và không cảnh báo. Đặt cao là cách duy nhất để máy MẠNH của Đàm dùng hết
    những gì nó có, đúng lệnh ngân sách của vòng 55.
    ⚠️ ĐỪNG BỎ `HalfFloatType` để "cho nhẹ": đa mẫu và dải động là hai chuyện khác nhau, và bỏ nửa
    thực thì bloom mất ngưỡng (xem khối ngay trên).
    ⚠️ ĐỆM ĐỘ SÂU BÊN DƯỚI CỐ Ý KHÔNG ĐA MẪU: nó được ĐỌC theo từng điểm ảnh cho xoá phông và che
    khuất, không được NHÌN. Đa mẫu ở đó chỉ thêm một lượt phân giải mà không đổi một điểm ảnh nào.
  */
  const target = new WebGLRenderTarget(w, h, { type: HalfFloatType, samples: MSAA_SAMPLES });
  const composer = new EffectComposer(renderer, target);
  /*
    ══════════════════════════════════════════════════════════════════════════════════════════════
    ⚠️ `setPixelRatio(1)` — MỘT QUY ƯỚC CỠ CHO CẢ CHUỖI. ROUND 57, VIỆC 2. ĐỌC TRƯỚC KHI SỬA.
    ══════════════════════════════════════════════════════════════════════════════════════════════
    `EffectComposer` **TỰ NHÂN `pixelRatio` của bộ dựng** — ba chỗ, không chỗ nào ghi trong tài liệu
    ta hay đọc: `setSize` (`this._width * this._pixelRatio`), `addPass`, và `render` khi cỡ đổi.
    Mà `createPostFx` lại nhận cỡ tính bằng ĐIỂM ẢNH THẬT (chỗ gọi đã nhân sẵn). ⇒ Nhân hai lần.

    ĐO ĐƯỢC ngày 2026-09-12, khung 1400×700, pixelRatio 2, bằng dòng `[res]` của công cụ chụp:
        chuỗi hậu kỳ (composer)  5600×2800     ← điểm ảnh thật × 2 LẦN NỮA
        đệm độ sâu               2800×1400
        bloom                    2800×1400
        `uTexel` của lượt ống kính 2800×1400
    Ba lượt dưới nhận cỡ ta truyền (đã đúng, một lần nhân); riêng composer nhân thêm lần nữa.

    ⚠️ VÀ HẬU QUẢ NẶNG NHẤT KHÔNG PHẢI LÃNG PHÍ, MÀ LÀ **LƯỢT ỐNG KÍNH LÀM MỜ GẤP ĐÔI BÁN KÍNH
    ĐỊNH LÀM.** `uTexel` là bề rộng MỘT điểm ảnh của tấm ảnh nó đang lấy mẫu. Nếu `uTexel` khai theo
    tấm 2800 mà tấm thật là 5600 thì mỗi bước lấy mẫu nhảy HAI điểm ảnh — che khuất và xoá phông đều
    nhoè gấp đôi. Đó chính là "mềm nhũn" mà Đàm tả, và nó KHÔNG phải do thiếu điểm ảnh.

    ⇒ Cách chữa gốc là bỏ hẳn phép nhân của composer (`setPixelRatio(1)`) chứ không phải chia đôi
    số ta truyền: chia đôi thì quy ước lại thành "chỗ này tính bằng CSS, chỗ kia bằng điểm ảnh thật"
    — đúng loại mập mờ đã đẻ ra lỗi này. Nay **mọi cỡ trong file này là ĐIỂM ẢNH THẬT, không trừ
    một lượt nào**, và `sizes()` bên dưới cho phép đo lại điều đó bất cứ lúc nào.
    ⚠️ Đây là lần THỨ HAI `EffectComposer` không thừa hưởng cấu hình của bộ dựng (lần đầu: `samples`,
    round 55). Nên bài test giữ chỗ này canh QUAN HỆ "mọi lượt cùng một cỡ, và cỡ ấy bằng cỡ bộ
    dựng", chứ không canh một con số.
  */
  composer.setPixelRatio(1);
  composer.setSize(w, h);

  /**
   * ⚠️ THE DEPTH THE LENS READS IS RENDERED SEPARATELY, AND THE REASON IS WORTH KEEPING.
   *
   * The obvious build attaches a `DepthTexture` to the composer's own target and lets the lens pass
   * sample it. It produced a **completely black frame** — the exact trap Đàm named in the brief, and
   * it survived the first three hypotheses. The bisect (`--post none` · `--post rays` · `--post
   * lens`) found it in three runs: `EffectComposer` keeps TWO targets and `RenderPass` renders into
   * `readBuffer`, which is `renderTarget2` — while the `DepthTexture` handed to the constructor
   * belongs to `renderTarget1`, and `RenderTarget.copy()` gives the clone its OWN depth texture
   * (three r185, `RenderTarget.js:381`). So the lens was sampling a depth texture nothing had ever
   * written; SwiftShader returned garbage, `perspectiveDepthToViewZ` returned NaN, and `mix()` with
   * a NaN weight is black. Nothing errored, nothing warned.
   *
   * ⇒ The depth comes from a pass of our own, into a target that takes no part in the ping-pong. It
   * is what three's own `BokehPass` does, and it costs one extra scene render — but ONLY in walk
   * mode, where the depth of field is the point. From the overview it never runs.
   *
   * ⚠️ `overrideMaterial` means the depth pass does NOT run round 48's vertex motion, so a flag or a
   * leaf is at its rest position in the depth buffer while the beauty shows it mid-sway. At the
   * scale of a blur radius that is invisible; noted so nobody spends an afternoon on it.
   */
  const depthTarget = new WebGLRenderTarget(w, h, {
    depthTexture: new DepthTexture(w, h, UnsignedShortType),
  });
  const depthMaterial = new MeshDepthMaterial({ depthPacking: RGBADepthPacking, blending: NoBlending });

  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // ── ambient occlusion ──────────────────────────────────────────────────────
  // Radius in WORLD units: one grid cell is 1, a doorway is ~0,3, the gap between two houses ~0,2.
  // 0,35 therefore reaches across a crease and stops before it starts shading whole walls.
  /*
    ⚠️ `GTAOPass` CỦA THREE ĐÃ BỊ GỠ KHỎI ỐNG NÀY — ROUND 53 (ADR-093), Việc 5, ĐÓNG `TECH_DEBT #52`.
    Vòng 52 phải tắt nó ở chế độ đi bộ: nó trả về đệm che khuất ĐEN ĐẶC cho mọi thứ gần camera ở
    tầm mắt (đường ngang ở hàng 612/700, lệch 16,5/255, không nhúc nhích dù vặn mọi tham số —
    bán kính 0,12/0,35/0,70, bán kính theo điểm ảnh, độ dày 0,6→3,5, ba bề rộng ảnh).
    Nay phép che khuất nằm THẲNG TRONG `LensShader`, lấy mẫu trên đệm độ sâu vốn đã dựng cho xoá
    phông — xem khối cảnh báo lớn trong đó. Ba cái được cùng lúc:
      · nó CHẠY ở tầm mắt, tức đúng chỗ Đàm chấm và đúng chỗ những cái hốc của Phần A hiện ra;
      · nó không dựng lại toạ độ không gian nhìn, tức không có chỗ cho lỗi cũ tái diễn;
      · **một hệ thay vì hai** — giữ GTAO cho khung thành phố và tự viết một cái cho tầm mắt là
        đúng thứ *Composition over Duplication* cấm, và là hai bộ tham số sẽ trôi khỏi nhau.
    ⇒ Đừng thêm `GTAOPass` trở lại "cho khung xa nét hơn" mà chưa đọc mục nợ #52.
  */

  // ── god rays ───────────────────────────────────────────────────────────────
  const rays = new ShaderPass(GodRaysShader);
  rays.uniforms.uStrength.value = profile.rays;
  if (want('rays')) composer.addPass(rays);

  // ── bloom ──────────────────────────────────────────────────────────────────
  const bloom = new UnrealBloomPass(new Vector2(w, h), profile.bloom, profile.radius, profile.threshold);
  if (want('bloom')) composer.addPass(bloom);

  // ── the lens ───────────────────────────────────────────────────────────────
  const lens = new ShaderPass(LensShader);
  lens.uniforms.tDepth.value = depthTarget.depthTexture;
  lens.uniforms.uNear.value = camera.near;
  lens.uniforms.uFar.value = camera.far;
  lens.uniforms.uTexel.value.set(1 / w, 1 / h);
  lens.uniforms.uVignette.value = profile.vignette;
  lens.uniforms.uGrain.value = profile.grain;
  lens.uniforms.uDofAmount.value = walk ? 1 : 0;
  // ⚠️ `want('ao')` VẪN QUYẾT ĐỊNH PHÉP CHE KHUẤT, dù nó không còn là một lượt riêng — `--post ao`
  // của công cụ xem thử phải tiếp tục bật/tắt được nó, vì đó là đúng cái cần gạt đã tìm ra khuyết
  // tật của vòng 52 (`--post` bisect). Một cần gạt mất đi là một phép bisect không làm được nữa.
  lens.uniforms.uAo.value = want('ao') ? profile.ao : 0;
  if (want('lens')) composer.addPass(lens);

  // ── tone mapping + colour space, ONCE, at the end ──────────────────────────
  composer.addPass(new OutputPass());

  /*
    ⚠️ GỌI LẠI `setSize` SAU KHI ĐÃ THÊM HẾT CÁC LƯỢT — VÀ ĐÂY LÀ BẢN VÁ CỦA MỘT VẾT THẤY ĐƯỢC.
    `EffectComposer.setSize` chỉ đi qua những lượt ĐANG có trong danh sách lúc nó được gọi. Gọi nó
    ngay sau khi dựng composer (như bản đầu) thì mọi lượt thêm sau đó — GTAO, bloom, hai ShaderPass
    — không bao giờ nhận được cỡ ấy; chúng chỉ có cỡ mình tự dựng lấy, và lượt nào tự dựng thiếu
    thì lặng lẽ chạy ở cỡ khác.
    Triệu chứng đo được (kỷ 10, 12 giờ, 1400×700): một BƯỚC NHẢY ĐỘ SÁNG 16,5/255 vắt ngang TOÀN
    BỘ bề rộng ở đúng **hàng 612/700**, lặp lại y hệt qua nhiều lượt chụp. Bisect bằng `--post`:
    có ở `--post ao`, KHÔNG có ở `--nopost`, `--post bloom`, `--post rays`, `--post lens` (cả bốn
    đều có bước lớn nhất ở hàng 335 — đường chân trời, một chi tiết THẬT của cảnh, chỉ 7/255).
    ⇒ Một phép đo theo HÀNG tách được "vệt lỗi" khỏi "nội dung" mà mắt thì không: cả hai đều là
    một đường ngang sẫm.
  */
  composer.setSize(w, h);

  const sunWorld = new Vector3();
  const sunNdc = new Vector3();
  let frame = 0;

  /*
    ⚠️ `still` — GIỮ HẠT PHIM ĐỨNG YÊN, VÀ ĐÂY KHÔNG PHẢI MỘT TIỆN NGHI CHO CÔNG CỤ.
    Hạt phim được gieo từ `uFrame`, tăng mỗi lượt vẽ. Trong app đó đúng là thứ phải có — hạt đứng
    yên giữa một cảnh đang động đọc ra là bụi bẩn trên màn hình, không phải hạt phim.
    Nhưng `city-preview.mjs` chụp ảnh TĨNH bằng **nhiều dải ngang**, mỗi dải một lần đọc màn hình.
    Hạt đổi giữa hai dải ⇒ hai dải không khớp, và chỗ ghép hiện ra thành một ĐƯỜNG NGANG SẪM vắt
    qua cả bề rộng — đo được ở vòng 52: bước nhảy 16,5/255 tại hàng 612/700, đúng mốc chia dải mà
    `chiaBang` tính ra cho khung 1400 điểm ảnh. Trông y hệt một khuyết tật của phép che khuất.
    ⇒ Ảnh tĩnh thì mọi lượt vẽ phải cho ra CÙNG MỘT BYTE. `still` làm đúng thế.
  */
  const stillFrame = still === true;

  return {
    composer,
    passes: { renderPass, rays, bloom, lens },
    /**
     * Kích thước THẬT của từng lượt, để dụng cụ đo hỏi được thay vì phải đoán — round 57, Việc 3.
     * ⚠️ Đọc từ chính các đối tượng đang chạy, KHÔNG từ `w`/`h` đã khai. Cả khuyết tật của vòng này
     * là "số đã khai" và "số đang dùng" khác nhau, nên một phép đo đọc lại số đã khai thì mù đúng
     * cái nó sinh ra để thấy (`TECH_DEBT #42`).
     */
    sizes() {
      return {
        composer: [composer.readBuffer.width, composer.readBuffer.height],
        depth: [depthTarget.width, depthTarget.height],
        // ⚠️ `renderTargetBright`, KHÔNG PHẢI `bloom.resolution` — VÀ ĐÂY LÀ DỤNG CỤ ĐO SUÝT NÓI DỐI.
        // `UnrealBloomPass.setSize()` đổi mọi tấm đích BÊN TRONG nhưng KHÔNG cập nhật trường
        // `resolution`; trường ấy đứng nguyên giá trị lúc dựng. Bản đầu của hàm này đọc `resolution`
        // và báo bloom đã đổi cỡ trong khi nó chưa — đúng `TECH_DEBT #42`: đọc con số đã KHAI thay
        // vì con số đang DÙNG, ở ngay trong cái hàm sinh ra để phát hiện chuyện đó.
        // Bloom chạy ở NỬA cỡ chuỗi (dòng `Math.round(width / 2)` của three) — một quan hệ CÓ CHỦ Ý,
        // nên bài test canh đúng quan hệ ấy chứ không canh bằng nhau.
        bloom: [bloom.renderTargetBright.width, bloom.renderTargetBright.height],
        lensTexel: [1 / lens.uniforms.uTexel.value.x, 1 / lens.uniforms.uTexel.value.y],
      };
    },

    /** Draw one frame through the chain. */
    render() {
      if (!stillFrame) frame = (frame + 1) % 4096;
      lens.uniforms.uFrame.value = frame;
      /*
        ⚠️ ĐỆM ĐỘ SÂU NAY CÓ **HAI** NGƯỜI ĐỌC, KHÔNG CÒN MỘT — round 53 (ADR-093).
        Trước: chỉ xoá phông đọc nó, nên nó chỉ được dựng ở chế độ đi bộ. Nay phép che khuất cũng
        đọc nó, và phép che khuất chạy Ở MỌI KHUNG NHÌN. Để nguyên điều kiện cũ thì AO lấy mẫu
        trên một đệm chưa ai ghi vào — và kết quả KHÔNG phải "không có AO", nó là một đệm rác:
        đúng hình dạng của cái khung đen đầu tiên ở vòng 52, chỉ khác chỗ.
      */
      if (lens.uniforms.uDofAmount.value > 0.001 || lens.uniforms.uAo.value > 0.001) {
        const prevTarget = renderer.getRenderTarget();
        scene.overrideMaterial = depthMaterial;
        renderer.setRenderTarget(depthTarget);
        renderer.clear();
        renderer.render(scene, camera);
        scene.overrideMaterial = null;
        renderer.setRenderTarget(prevTarget);
      }
      composer.render();
    },

    setSize(nw, nh) {
      const sw = Math.max(2, Math.round(nw));
      const sh = Math.max(2, Math.round(nh));
      composer.setSize(sw, sh);
      depthTarget.setSize(sw, sh);
      bloom.setSize(sw, sh);
      lens.uniforms.uTexel.value.set(1 / sw, 1 / sh);
    },

    /**
     * Follow the scene: the sun moves with the hour, the air thickens with the weather, and the
     * focus plane follows whatever the walker is looking at.
     */
    update({ sunDirection = null, air = 0.4, profile: next = null, walk: walking = null, focus = null } = {}) {
      if (next) {
        lens.uniforms.uAo.value = next.ao;
        bloom.strength = next.bloom;
        bloom.radius = next.radius;
        bloom.threshold = next.threshold;
        rays.uniforms.uStrength.value = next.rays;
        lens.uniforms.uVignette.value = next.vignette;
        lens.uniforms.uGrain.value = next.grain;
      }
      if (walking !== null) lens.uniforms.uDofAmount.value = walking ? 1 : 0;
      if (Number.isFinite(focus)) lens.uniforms.uFocus.value = focus;
      lens.uniforms.uNear.value = camera.near;
      lens.uniforms.uFar.value = camera.far;
      rays.uniforms.uAir.value = air;
      if (sunDirection) {
        // the sun sits at infinity along its direction — project a point far along it
        sunWorld.copy(sunDirection).multiplyScalar(600).add(camera.position);
        sunNdc.copy(sunWorld).project(camera);
        rays.uniforms.uSun.value.set((sunNdc.x + 1) / 2, (sunNdc.y + 1) / 2);
        // ⚠️ `project()` gives a POINT BEHIND THE CAMERA the same screen position as the point in
        // front of it mirrored through the origin. Without this test, a midnight sun under the world
        // would paint shafts streaming out of the pavement.
        rays.uniforms.uBehind.value = sunNdc.z > 1 ? 1 : 0;
      }
    },

    dispose() {
      composer.dispose?.();
      target.dispose();
      depthTarget.dispose();
      depthTarget.depthTexture.dispose();
      depthMaterial.dispose();
      bloom.dispose?.();
      lens.dispose?.();
      renderPass.dispose?.();
      rays.dispose?.();
    },
  };
}

/** Kept exported so a test can build the lens material without a WebGL context. */
export const POST_SHADERS = Object.freeze({ GodRaysShader, LensShader, ShaderMaterial, FloatType });
