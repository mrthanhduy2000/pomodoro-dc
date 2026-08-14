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
 * Bộ tham số camera chuẩn của màn hình Thành Phố.
 * ⚠️ Tồn tại để `CityScene3D.jsx` và `scripts/city-preview.mjs` KHÔNG tự viết số riêng — trang xem
 * thử mà đóng khung khác app thì nó thôi kiểm chứng được thứ cần kiểm chứng.
 */
export function cityOrbitOptions(gridSize) {
  return {
    distance: gridSize * CAMERA_DISTANCE_FACTOR,
    minDistance: gridSize * CAMERA_MIN_FACTOR,
    maxDistance: gridSize * CAMERA_MAX_FACTOR,
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
      pitch = clampPitch(pitch + dy * dragSpeed);
      return `${yaw}|${pitch}` !== before;
    },

    /** Phóng to/thu nhỏ. `factor` > 1 là ra xa. Trả về `true` nếu khoảng cách đổi. */
    zoom(factor) {
      const next = Math.min(maxDistance, Math.max(minDistance, dist * factor));
      if (next === dist) return false;
      dist = next;
      return true;
    },

    reset() {
      yaw = DEFAULT_YAW;
      pitch = DEFAULT_PITCH;
      dist = Math.min(maxDistance, Math.max(minDistance, distance));
    },

    /** Đặt thẳng góc (dùng cho hoạt hoạ bay giữa các kỷ ở Phase 3C). */
    set({ yaw: nextYaw, pitch: nextPitch, distance: nextDistance }) {
      if (Number.isFinite(nextYaw)) yaw = wrapYaw(nextYaw);
      if (Number.isFinite(nextPitch)) pitch = clampPitch(nextPitch);
      if (Number.isFinite(nextDistance)) {
        dist = Math.min(maxDistance, Math.max(minDistance, nextDistance));
      }
    },

    getState: () => ({ yaw, pitch, distance: dist, target: { ...target } }),
    getPosition: () => orbitPosition({ yaw, pitch, distance: dist, target }),
    getTarget: () => ({ ...target }),
  };
}
