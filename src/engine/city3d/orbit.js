/**
 * orbit.js — trạng thái camera xoay quanh thành phố. THUẦN: chỉ toán, không DOM, không three.
 *
 * ⚠️ VÌ SAO TỰ VIẾT CHỨ KHÔNG DÙNG `OrbitControls` của three: `OrbitControls` nằm trong
 * `three/examples/`, tự gắn listener vào DOM và **tự chạy vòng lặp cập nhật** — nó giả định cảnh
 * được vẽ liên tục 60 khung/giây. Cách đó phá thẳng cơ chế render-on-demand (xem `renderLoop.js`),
 * tức là phá đúng thứ giữ cho iPhone không nóng máy. Phần ta thật sự cần chỉ ~60 dòng toán này.
 *
 * Quy ước góc: `yaw` xoay quanh trục đứng, `pitch` là độ cao nhìn xuống.
 */

import { getEraStyle } from './eraStyle';
import { buildTerrain, terrainMaxHeight } from './terrain';
import { buildBuildingSpec } from './buildingSpec';
import { BUILDING_SCALE, specSpan } from './parts';
import { computeCityLayout } from '../cityLayout';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from '../constants';

const TAU = Math.PI * 2;

/** Giới hạn góc nhìn. Không được chạm 0 hay 90° — camera sẽ chui xuống dưới sàn hoặc lật. */
export const MIN_PITCH = 0.18;                 // ~10°, gần ngang tầm mắt
export const MAX_PITCH = Math.PI / 2 - 0.08;   // ~85°, gần nhìn thẳng từ trên xuống
/**
 * ~34°. Thấp hơn góc isometric 41° của bộ vẽ 2D, và đó là CHỦ Ý.
 *
 * ⚠️ Ở 41°, tầm nhìn dọc 38° trải từ 22° tới 60° BÊN DƯỚI đường chân trời — nghĩa là không có
 * lấy một mảnh trời nào lọt vào khung hình. Cả buổi chỉnh màu bầu trời đã trôi đi vì chuyện này:
 * bảng màu vẫn ra đúng màu xanh, chỉ là bầu trời chưa bao giờ được nhìn thấy. Ở 34° thì dải trên
 * cùng của khung hình vượt qua đường chân trời và bầu trời hiện ra sau thành phố — đó là thứ biến
 * "nhìn xuống một mô hình" thành "đứng nhìn một vùng đất".
 */
export const DEFAULT_PITCH = 0.6;
export const DEFAULT_YAW = Math.PI / 4;        // 45° — cùng hướng nhìn với bộ vẽ 2D

export function clampPitch(value) {
  return Math.min(MAX_PITCH, Math.max(MIN_PITCH, value));
}

/** Đưa góc về [0, 2π) để số không lớn dần vô hạn sau nhiều lần kéo. */
export function wrapYaw(value) {
  const wrapped = value % TAU;
  return wrapped < 0 ? wrapped + TAU : wrapped;
}

/**
 * Vị trí camera trong không gian, nhìn về `target`.
 * @returns {{x:number, y:number, z:number}}
 */
export function orbitPosition({ yaw, pitch, distance, target = { x: 0, y: 0, z: 0 } }) {
  const safePitch = clampPitch(pitch);
  const horizontal = Math.cos(safePitch) * distance;
  return {
    x: target.x + Math.sin(yaw) * horizontal,
    y: target.y + Math.sin(safePitch) * distance,
    z: target.z + Math.cos(yaw) * horizontal,
  };
}

/**
 * Tạo một "cần cẩu" camera có trạng thái.
 *
 * @param {object} [options]
 * @param {number} [options.distance]     khoảng cách ban đầu
 * @param {number} [options.minDistance]
 * @param {number} [options.maxDistance]
 * @param {{x:number,y:number,z:number}} [options.target]
 * @param {number} [options.dragSpeed]    radian trên mỗi pixel kéo
 */
/**
 * Khoảng cách camera theo cỡ lưới — MỘT nguồn sự thật cho cả app lẫn trang xem thử.
 *
 * ⚠️ 1,5 chứ không phải 1,85 (Phase 3C). Lưới luôn là 12×12 nhưng mỗi kỷ chỉ có 5 bản vẽ, nên
 * thành phố **không bao giờ** phủ kín lưới — phần rìa vĩnh viễn là đất trống. Ở 1,85 thì ảnh chụp
 * ra một mảng đất mênh mông với dúm nhà bé tí ở giữa: khung hình bị chiếm bởi đúng phần không có
 * gì để nhìn. Lại gần thì phần trống bị cắt bớt và công trình chiếm chỗ xứng đáng của nó.
 * Vẫn giữ nguyên quyền thu nhỏ tới `maxDistance` nếu Đàm muốn ngắm toàn cảnh.
 *
 * ⚠️ **1,18 CHỨ KHÔNG PHẢI 1,5 (2026-08-14, Đàm: "thu phóng cho vừa đủ thôi, không thu quá xa rồi
 * bị mờ").** Lập luận Phase 3C ở trên vẫn đúng — chỉ là nó chưa đi đủ xa. Ở 1,5 thì trên khung
 * điện thoại (thẻ cảnh chỉ cao ~300px), một căn nhà cao 3 ô lưới chiếm chưa tới 60px chiều cao;
 * mà chi tiết kiến trúc phân biệt kỷ này với kỷ kia — độ dốc mái, hàng cột, vòm cửa — nằm ở cỡ vài
 * điểm ảnh, tức **bị khử răng cưa xoá sạch trước khi tới mắt**. Cái Đàm gọi là "mờ" chính là chỗ
 * đó: không phải ảnh out nét, mà là chi tiết nhỏ hơn một điểm ảnh.
 * ⚠️ VÀ NÂNG LUÔN `CAMERA_MIN_FACTOR` 0,9 → 0,72: mức thu-gần-nhất cũ vẫn còn xa hơn mức mặc định
 * MỚI, nên nếu chỉ hạ mặc định thì Đàm sẽ không kéo gần thêm được nữa — một cái trần vô hình.
 * Trần XA (`MAX`) giữ nguyên 3,1: ai muốn ngắm toàn cảnh vẫn ngắm được.
 */
export const CAMERA_DISTANCE_FACTOR = 1.18;
export const CAMERA_MIN_FACTOR = 0.72;
export const CAMERA_MAX_FACTOR = 3.1;

/**
 * Góc mở DỌC của ống kính, độ. Ba nơi từng viết cứng số 38 (`CityScene3D.jsx` và hai chỗ trong
 * `scripts/city-preview.mjs`), nghĩa là trang xem thử có thể lặng lẽ đóng khung khác app — đúng cái
 * bẫy "một luật ba công thức". Đưa về một chỗ để bài test "khung hình không cắt ngọn" bên dưới đo
 * đúng ống kính mà Đàm nhìn qua, chứ không đo một ống kính giả định.
 */
export const CITY_CAMERA_FOV = 38;

/**
 * Mốc "kỷ cao trung bình". Kỷ trên mốc thì camera lùi ra cho khỏi cắt ngọn; kỷ DƯỚI mốc thì camera
 * tiến vào gần hơn — nhà đã thấp mà khung hình vẫn giữ nguyên thì cả thành phố thành một dúm nhỏ
 * giữa bãi đất trống, đúng cái "thu quá xa rồi bị mờ" mà Đàm phàn nàn.
 */
const TALL_ERA_THRESHOLD = 0.7;
/** Không kỷ nào được tiến vào gần hơn mức này (× mức sát) — chừa đường cho kỷ thấp hơn sau này. */
const MIN_DISTANCE_RATIO = 0.88;
/** Lùi thêm bao nhiêu (× cỡ lưới) cho mỗi đơn vị `massScale` vượt ngưỡng. */
const LIFT_TO_DISTANCE = 0.34;
/** Nâng điểm ngắm lên bao nhiêu (× cỡ lưới) cho mỗi đơn vị `massScale` vượt ngưỡng. */
const LIFT_TO_TARGET_Y = 0.15;
/**
 * Lùi camera thêm bao nhiêu cho mỗi ĐƠN VỊ THẾ GIỚI mà địa hình nâng công trình lên.
 * Đơn vị thế giới, không phải × cỡ lưới — xem lý do đầy đủ trong `cityOrbitOptions`.
 */
export const TERRAIN_TO_DISTANCE = 1.25;
/** Nâng điểm ngắm thêm bao nhiêu cho mỗi đơn vị thế giới địa hình nâng lên. */
export const TERRAIN_TO_TARGET_Y = 0.55;

/**
 * Bộ tham số camera chuẩn của màn hình Thành Phố.
 * ⚠️ Tồn tại để `CityScene3D.jsx` và `scripts/city-preview.mjs` KHÔNG tự viết số riêng — trang xem
 * thử mà đóng khung khác app thì nó thôi kiểm chứng được thứ cần kiểm chứng.
 *
 * ⚠️ THAM SỐ `era` THÊM 2026-08-14, VÀ NÓ SỬA MỘT LỖI CẮT NGỌN CÓ THẬT.
 * Khi `massScale` ra đời (xem `eraStyle.js`), chiều cao công trình trải từ 0,36 tới 1,72 lần — tức
 * kỷ 15 cao gấp gần 5 lần kỷ 1. Một khung hình cố định thì **không thể** vừa cả hai: đóng sát cho
 * túp lều thì tháp kính bị cắt mất nóc, mà đóng rộng cho tháp thì túp lều lại thành một chấm nhỏ
 * giữa bãi đất — đúng cái "thu quá xa rồi bị mờ" mà Đàm vừa yêu cầu bỏ đi.
 * Tính ra được (lưới 12, pitch 34°, FOV dọc 38°): mép TRÊN khung hình nằm ở 15° dưới đường chân
 * trời, còn nóc tháp kỷ 15 ở 13,7° — lọt ra ngoài đúng 1,3°. Không nhiều, nhưng đủ để cắt cụt cái
 * thứ đáng xem nhất của kỷ cuối cùng.
 * ⇒ Khung hình co giãn theo chính con số đã sinh ra chiều cao ấy (`massScale`), chứ không phải một
 * hằng số đoán mò song song — đúng luật "một luật chỉ được có một công thức". Kỷ thấp giữ y nguyên
 * khung sát: `lift` bằng 0 tuyệt đối, không phải "gần bằng 0".
 */
/**
 * ── KHUNG HÌNH KHÔNG ĐƯỢC CẮT CÔNG TRÌNH (`TECH_DEBT #24`, Phase 19 VIỆC 5) ───────────────────
 *
 * ⚠️ HỆ SỐ `massScale` Ở TRÊN LÀ MỘT **DỰ ĐOÁN**, VÀ ĐÃ ĐO RA LÀ NÓ ĐOÁN GẦN NHƯ NGƯỢC.
 * Đặt cạnh nhau lần đầu (2026-08-24, `scripts/frame-fit.mjs`, khung 1,30):
 *
 *   kỷ  |  CẦN  | massScale ĐANG CHO
 *    1  | 1,31  | 1,10        8  | 1,88  | 1,25       15  | 1,52  | 1,57
 *    7  | 1,75  | 1,25       11  | 1,82  | 1,25
 *
 * Kỷ 8 cần LÙI XA NHẤT bảng mà `massScale` cho nó gần như mức sát nhất; kỷ 15 cao nhất bảng lại là
 * kỷ DUY NHẤT không bị cắt. Lý do: 13/15 kỷ bị cắt ở mép **DƯỚI**, tức góc GẦN của thành phố rơi
 * khỏi khung — thứ quyết định là BỀ NGANG mặt bằng cộng CAO ĐỘ ĐẤT, không phải chiều cao nhà.
 * ⇒ Đúng bài học *"đừng DỰ ĐOÁN thứ có thể ĐO"*: nay khoảng cách có một cái SÀN đo thẳng trên
 *   chính hộp bao của thành phố đã dựng, và số cũ chỉ còn là sàn dưới.
 *
 * ⚠️ VÌ SAO PHÉP ĐO NÀY KHÔNG PHÁ ADR-007 (bảo tàng bất động): nó dựng thành phố ở trạng thái
 * **XÂY ĐỦ 5 BẢN VẼ, CẤP 3** chứ không đọc tiến độ thật, nên nó là hàm thuần của `era`. Nếu lấy
 * thành phố đang xây dở thì khung hình sẽ nhích mỗi lần Đàm hoàn thành một công trình.
 *
 * ⚠️ VÀ NÓ PHẢI LÀ MỘT NGUỒN SỰ THẬT DUY NHẤT: `scripts/frame-fit.mjs` nay `import` chính hai hàm
 * dưới đây thay vì chép lại công thức — công cụ đo mà chép công thức của công cụ dựng thì hai bên
 * trôi khỏi nhau, đúng thứ đã cắn ở `sweep-score.mjs` (lần thứ 16 công cụ nói dối).
 */
/** Tỉ lệ khung dùng để đóng khung. 1,30 là thẻ cảnh HẸP; khung rộng hơn thì chỉ dư ra, không thiếu. */
export const FRAME_FIT_ASPECT = 1.3;
/** Biên tối thiểu tính theo phần NỬA khung: 0,04 ≈ cách mép 2% chiều khung. "Vừa chạm mép" không đạt. */
export const FRAME_FIT_MARGIN = 0.04;

/** Hộp bao của mọi công trình một kỷ khi đã XÂY ĐỦ, đặt lên địa hình đúng như `sceneGraph.js` đặt. */
export function cityFrameBoxes(era, gridSize) {
  const ids = (BLUEPRINT_CATALOG[era] ?? []).map((bp) => bp.id);
  const layout = computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 3])),
    era,
    stats: { sessionCount: 80, streakLength: 9 },
  });
  const terrain = buildTerrain({ era, gridSize });
  const half = (gridSize - 1) / 2;
  const out = [];
  for (const b of layout.buildings ?? []) {
    const bp = (BLUEPRINT_CATALOG[era] ?? []).find((p) => p.id === b.bpId);
    if (!bp) continue;
    const spec = buildBuildingSpec({
      bpId: b.bpId,
      era,
      rarity: bp.rarity,
      type: BUILDING_EFFECTS[b.bpId]?.type ?? 'infrastructure',
      level: 3,
    });
    const nhip = specSpan(spec.parts) * BUILDING_SCALE;
    const base = terrain.footprint(b.x, b.y, Math.max(1, Math.round(nhip))).top;
    // ⚠️ CHIỀU CAO CŨNG NHÂN `BUILDING_SCALE` — `geometryFactory` phóng ĐỀU cả ba chiều. Bản cũ của
    // `frame-fit.mjs` quên vế này và báo thiếu 30% chiều cao, tức sai theo hướng TRẤN AN.
    out.push({
      id: b.bpId,
      cx: b.x - half,
      cz: b.y - half,
      reach: nhip / 2,
      base,
      top: base + spec.height * BUILDING_SCALE,
    });
  }
  return out;
}

/**
 * Biên hẹp nhất của cả kỷ trong khung hình, kèm tên công trình và mép nào đang cắt.
 * 1,0 = ở đúng tâm · 0,0 = chạm đúng mép · ÂM = đã lọt ra ngoài, tức bị cắt.
 */
export function worstFrameMargin(boxes, { distance, targetY, aspect = FRAME_FIT_ASPECT }) {
  // ⚠️ HAI CÁI GÁC NÀY SINH RA TỪ MỘT LẦN NÓI DỐI THẬT (2026-08-24). `aspect` trước đây KHÔNG có
  // giá trị mặc định, nên một bên gọi quên nó thì `halfX = atan(tan(halfY) * undefined) = NaN`,
  // mọi phép so `NaN < worst.margin` đều FALSE, và hàm trả về `margin: Infinity` — tức là
  // **"không công trình nào bị cắt, biên rộng vô hạn"**. Sai theo đúng hướng TRẤN AN, loại sai tệ
  // nhất cho một dụng cụ đo, và nó đã suýt cấp giấy chứng nhận cho một bài test đo bằng NaN.
  // Cùng họ với `TECH_DEBT #43`: một phép đo không được phép trả lời "ổn cả" khi nó chưa đo gì.
  if (!Number.isFinite(aspect) || aspect <= 0) {
    throw new Error(`worstFrameMargin: tỉ lệ khung không dùng được (${aspect})`);
  }
  const halfY = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  const halfX = Math.atan(Math.tan(halfY) * aspect);   // three suy FOV ngang từ FOV dọc × tỉ lệ
  const target = { x: 0, y: targetY, z: 0 };
  const eye = orbitPosition({ yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance, target });

  const fwd = { x: -eye.x, y: target.y - eye.y, z: -eye.z };
  const fl = Math.hypot(fwd.x, fwd.y, fwd.z);
  fwd.x /= fl; fwd.y /= fl; fwd.z /= fl;
  // ⚠️ DẤU Ở ĐÂY đã từng viết ngược (lần thứ 17 công cụ nói dối): độ lớn vẫn đúng mà NHÃN MÉP đảo
  // hết — công cụ báo "cắt ở mép TRÊN" trong khi ảnh cho thấy cắt ở mép DƯỚI.
  const right = { x: -fwd.z, y: 0, z: fwd.x };
  const rl = Math.hypot(right.x, right.z);
  right.x /= rl; right.z /= rl;
  const up = {
    x: right.y * fwd.z - right.z * fwd.y,
    y: right.z * fwd.x - right.x * fwd.z,
    z: right.x * fwd.y - right.y * fwd.x,
  };

  let worst = { margin: Infinity, id: '?', edge: '?' };
  for (const b of boxes) {
    for (const dx of [-b.reach, b.reach]) {
      for (const dz of [-b.reach, b.reach]) {
        for (const wy of [b.base, b.top]) {
          const v = { x: b.cx + dx - eye.x, y: wy - eye.y, z: b.cz + dz - eye.z };
          const f = v.x * fwd.x + v.y * fwd.y + v.z * fwd.z;
          if (f <= 0) continue;                        // sau lưng camera, không đóng khung được
          const u = v.x * up.x + v.y * up.y + v.z * up.z;
          const r = v.x * right.x + v.y * right.y + v.z * right.z;
          const mV = 1 - Math.abs(u / (f * Math.tan(halfY)));
          const mH = 1 - Math.abs(r / (f * Math.tan(halfX)));
          const margin = Math.min(mV, mH);
          if (margin < worst.margin) {
            worst = {
              margin,
              id: b.id,
              edge: mV < mH ? (u > 0 ? 'TRÊN' : 'DƯỚI') : (r > 0 ? 'PHẢI' : 'TRÁI'),
            };
          }
        }
      }
    }
  }
  // ⚠️ KHÔNG ĐO ĐƯỢC Ô NÀO ⇒ NÉM, ĐỪNG TRẢ `Infinity`. Danh sách rỗng (kỷ lạ, bảng bản vẽ thiếu)
  // hay mọi góc nằm sau lưng camera đều là LỖI, không phải "lọt khung thoải mái".
  if (!Number.isFinite(worst.margin)) {
    throw new Error(`worstFrameMargin: không chấm được góc nào trên ${boxes.length} công trình`);
  }
  return worst;
}

const FIT_CACHE = new Map();

/**
 * Khoảng cách NHỎ NHẤT để cả kỷ vào trọn khung. Chia đôi 40 lần là quá đủ cho dải [0,8 ; 4,0]×lưới.
 * Nhớ lại kết quả theo `(era, gridSize, targetY, aspect)` — mỗi lần dựng cảnh chỉ hỏi một lần.
 */
export function cityFrameDistance(era, gridSize, { targetY = 0, aspect = FRAME_FIT_ASPECT } = {}) {
  const khoa = `${era}|${gridSize}|${targetY.toFixed(4)}|${aspect.toFixed(3)}`;
  const co = FIT_CACHE.get(khoa);
  if (co !== undefined) return co;
  const boxes = cityFrameBoxes(era, gridSize);
  let lo = 0.8;
  let hi = 4.0;
  if (boxes.length) {
    for (let i = 0; i < 40; i += 1) {
      const mid = (lo + hi) / 2;
      const m = worstFrameMargin(boxes, { distance: gridSize * mid, targetY, aspect }).margin;
      if (m >= FRAME_FIT_MARGIN) hi = mid; else lo = mid;
    }
  } else {
    hi = CAMERA_DISTANCE_FACTOR;
  }
  const ra = gridSize * hi;
  FIT_CACHE.set(khoa, ra);
  return ra;
}

export function cityOrbitOptions(gridSize, era) {
  const scale = getEraStyle(era)?.massScale ?? 1;
  // `lift` ÂM ở kỷ nhà thấp — đó là nửa thứ hai của yêu cầu, và là nửa dễ quên. Bản đầu kẹp
  // `Math.max(0, …)` nên chỉ biết lùi ra, không biết tiến vào: kỷ 1 (nhà cao bằng 0,36 mức cũ) vẫn
  // đứng nguyên khoảng cách đóng cho nhà cao gấp ba, và ảnh quét ra một bãi cỏ mênh mông với mấy
  // cái lều bằng đầu ngón tay.
  const lift = scale - TALL_ERA_THRESHOLD;
  const factor = Math.max(
    CAMERA_DISTANCE_FACTOR * MIN_DISTANCE_RATIO,
    CAMERA_DISTANCE_FACTOR + lift * LIFT_TO_DISTANCE,
  );

  /**
   * ⚠️ ĐỊA HÌNH LÀ CHIỀU THỨ HAI CỦA CÙNG MỘT LỖI CẮT NGỌN, và nó phải cộng theo ĐƠN VỊ THẾ GIỚI,
   * KHÔNG được trộn vào `massScale`.
   *
   * Bản đầu tôi viết `scale = massScale + terrainMaxHeight / gridSize` — nghe rất gọn, và **sai 4
   * lần**. Lý do: một đơn vị `massScale` không phải một đơn vị chiều cao. Đo thật thì `massScale`
   * 0,70 cho ra công trình cao 3,66 đơn vị, tức **1 đơn vị `massScale` ≈ 5 đơn vị thế giới**; chia
   * cao độ đất cho cỡ lưới (12) là quy đổi bằng một con số chẳng liên quan gì. Kết quả: kỷ 8 được
   * lùi thêm 0,8 trong khi nhà bị nâng lên 2,4 — bù chưa tới một phần ba, và ảnh chụp ra một thành
   * phố bị cắt cả mép trái lẫn mép trên.
   *
   * Cộng thẳng theo đơn vị thế giới thì không cần biết hệ số quy đổi nào cả. Hai hằng số dưới đây
   * chọn bằng cách dựng ảnh rồi nhìn, không phải bằng suy luận — cùng kỷ luật với `ENV_DIFFUSE`.
   */
  const terrainLift = terrainMaxHeight(era);

  // Ngắm cao hơn mặt đất một chút ở kỷ cao: nếu chỉ lùi xa mà vẫn ngắm chân tường thì tháp vẫn
  // chạy lên mép trên, chỉ là chậm hơn.
  // ⚠️ CHỈ nâng, không bao giờ HẠ: điểm ngắm âm sẽ kéo đường chân trời lên giữa khung và cắt mất
  // dải trời — thứ đã tốn cả một phase (3V/3W) mới đưa được vào khung hình.
  const targetY = gridSize * Math.max(0, lift) * LIFT_TO_TARGET_Y + terrainLift * TERRAIN_TO_TARGET_Y;

  // ⚠️ SÀN ĐO ĐƯỢC, KHÔNG PHẢI MỘT TRẦN CHUNG. Cách vá "hiển nhiên" cho `TECH_DEBT #24` là nâng
  // `CAMERA_DISTANCE_FACTOR` lên đúng con số của kỷ tệ nhất (1,88) — nhưng thế là bắt kỷ 1 lùi từ
  // 1,10 lên 1,88 (+71%) chỉ vì kỷ 8 cần, tức dựng lại đúng cái "thu quá xa rồi bị mờ" mà Đàm đã
  // yêu cầu bỏ. Mỗi kỷ lùi đúng bằng nhu cầu của CHÍNH NÓ, không hơn.
  const sanDo = cityFrameDistance(era, gridSize, { targetY });

  return {
    distance: Math.max(gridSize * factor + terrainLift * TERRAIN_TO_DISTANCE, sanDo),
    minDistance: gridSize * CAMERA_MIN_FACTOR,
    maxDistance: gridSize * CAMERA_MAX_FACTOR,
    target: { x: 0, y: targetY, z: 0 },
  };
}

export function createOrbit({
  distance = 26,
  minDistance = 12,
  maxDistance = 48,
  target = { x: 0, y: 0, z: 0 },
  dragSpeed = 0.007,
} = {}) {
  let yaw = DEFAULT_YAW;
  let pitch = DEFAULT_PITCH;
  let dist = Math.min(maxDistance, Math.max(minDistance, distance));

  /**
   * ⚠️ ĐIỂM NGẮM NAY DI CHUYỂN ĐƯỢC (chế độ cận cảnh, `cityFocus.js`) — trước đây nó là một hằng
   * số đóng kín trong closure. Bản gốc `getState()` trả về chính tham số `target`, nên nếu chỉ
   * thêm đường ghi mà quên sửa chỗ đọc thì camera sẽ BAY tới khu phố trong khi mọi phép đo vẫn
   * tường nó đang đứng giữa thành phố — sai im lặng, đúng họ "một luật hai công thức".
   * `home*` giữ nguyên bộ số toàn cảnh để `reset()` luôn có đường về, kể cả sau nhiều lần bay.
   */
  const homeTarget = { x: target?.x ?? 0, y: target?.y ?? 0, z: target?.z ?? 0 };
  const homeMinDistance = minDistance;
  let tgt = { ...homeTarget };

  /**
   * SÀN GÓC NHÌN ĐỘNG. Ở toàn cảnh nó là `MIN_PITCH`; ở cận cảnh nó được nâng lên đúng góc mà
   * `planCityFocus` đã chứng minh là thoáng. Không có nó thì lời hứa "camera không bao giờ chui
   * vào phố" chỉ đúng ĐÚNG MỘT LẦN — lúc hạ cánh — rồi vỡ ngay ở cú kéo đầu tiên của Đàm.
   */
  let pitchFloor = MIN_PITCH;
  let distFloor = minDistance;

  const clampPitchNow = (value) => Math.min(MAX_PITCH, Math.max(pitchFloor, value));
  const clampDistNow = (value) => Math.min(maxDistance, Math.max(distFloor, value));

  return {
    /**
     * Kéo chuột/ngón tay. `dx`/`dy` tính theo pixel màn hình (y tăng khi đi XUỐNG).
     * Trả về `true` nếu góc THẬT SỰ đổi — bên gọi dùng để quyết định có cần vẽ lại không. Kéo 0
     * pixel (chạm rồi thả) không được sinh ra một khung hình thừa.
     *
     * ⚠️ CHIỀU KÉO theo đúng quy ước `OrbitControls` của three (và của hầu hết trình xem 3D):
     * kéo SANG PHẢI ⇒ `yaw` giảm · kéo XUỐNG ⇒ `pitch` TĂNG (nghiêng dần về góc nhìn từ trên).
     * Đảo dấu ở đây là kiểu bug người dùng cảm thấy ngay nhưng khó gọi tên — "sao kéo ngược thế".
     */
    drag(dx, dy) {
      const before = `${yaw}|${pitch}`;
      yaw = wrapYaw(yaw - dx * dragSpeed);
      pitch = clampPitchNow(pitch + dy * dragSpeed);
      return `${yaw}|${pitch}` !== before;
    },

    /** Phóng to/thu nhỏ. `factor` > 1 là ra xa. Trả về `true` nếu khoảng cách đổi. */
    zoom(factor) {
      const next = clampDistNow(dist * factor);
      if (next === dist) return false;
      dist = next;
      return true;
    },

    reset() {
      yaw = DEFAULT_YAW;
      pitch = DEFAULT_PITCH;
      pitchFloor = MIN_PITCH;
      distFloor = homeMinDistance;
      tgt = { ...homeTarget };
      dist = clampDistNow(distance);
    },

    /**
     * Đặt thẳng góc (hoạt hoạ bay giữa các kỷ ở Phase 3C, và bay tới một khu phố ở chế độ cận
     * cảnh). `target` là tuỳ chọn — bỏ trống thì giữ nguyên điểm ngắm đang có.
     *
     * ⚠️ CỐ Ý dùng `clampPitch`/trần-sàn TĨNH ở đây chứ không dùng sàn động: một chuyến bay khởi
     * hành từ góc nhìn thấp và hạ dần xuống góc cao, nên nếu sàn mới có hiệu lực ngay từ khung
     * hình đầu thì camera sẽ GIẬT một cái ngay lúc cất cánh. Sàn được bật lên sau khi hạ cánh,
     * qua `setLimits`.
     */
    set({ yaw: nextYaw, pitch: nextPitch, distance: nextDistance, target: nextTarget }) {
      if (Number.isFinite(nextYaw)) yaw = wrapYaw(nextYaw);
      if (Number.isFinite(nextPitch)) pitch = clampPitch(nextPitch);
      if (Number.isFinite(nextDistance)) {
        dist = Math.min(maxDistance, Math.max(0, nextDistance));
      }
      if (nextTarget) {
        tgt = {
          x: Number.isFinite(nextTarget.x) ? nextTarget.x : tgt.x,
          y: Number.isFinite(nextTarget.y) ? nextTarget.y : tgt.y,
          z: Number.isFinite(nextTarget.z) ? nextTarget.z : tgt.z,
        };
      }
    },

    /**
     * Nâng SÀN góc nhìn và SÀN khoảng cách. Đây là lưới an toàn sống mãi trong lúc còn ở chế độ
     * cận cảnh: kéo xuống thấp hay lăn chuột vào gần nữa cũng không xuống dưới mức đã chứng minh
     * là thoáng. `reset()` trả cả hai về mức toàn cảnh.
     */
    setLimits({ minPitch: nextMinPitch, minDistance: nextMinDistance } = {}) {
      if (Number.isFinite(nextMinPitch)) {
        pitchFloor = Math.min(MAX_PITCH, Math.max(MIN_PITCH, nextMinPitch));
        pitch = clampPitchNow(pitch);
      }
      if (Number.isFinite(nextMinDistance)) {
        distFloor = Math.max(0, nextMinDistance);
        dist = clampDistNow(dist);
      }
    },

    getLimits: () => ({ minPitch: pitchFloor, minDistance: distFloor }),
    getHome: () => ({ target: { ...homeTarget }, distance, minDistance: homeMinDistance }),
    getState: () => ({ yaw, pitch, distance: dist, target: { ...tgt } }),
    getPosition: () => orbitPosition({ yaw, pitch, distance: dist, target: tgt }),
    getTarget: () => ({ ...tgt }),
  };
}
