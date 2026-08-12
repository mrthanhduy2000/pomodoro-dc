/**
 * archetypes.js — TRỤC THỨ HAI và THỨ BA của ngôn ngữ hình khối: công trình dùng để LÀM GÌ
 * (`BUILDING_EFFECTS[bpId].type`) và nó QUÝ tới mức nào (`BLUEPRINT_CATALOG[].rarity`).
 *
 * THUẦN: chỉ dữ liệu. Không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ PHÂN VAI GIỮA BA TRỤC — đây là chỗ dễ lẫn nhất, lẫn là ra 75 căn nhà giống nhau:
 *   - `eraStyle.js` quyết định **nét vẽ**: mái hình gì, cửa sổ kiểu gì, diềm thò bao xa.
 *   - File này quyết định **khối tích**: mấy mảng nhà, xếp thế nào, cao hay bè ra.
 *   - `buildingSpec.js` ghép hai thứ lại.
 * Nói cách khác: cùng một "toà nhà kinh tế hạng epic", ở kỷ 2 ra cái kho thóc mái tranh, ở kỷ 14 ra
 * toà tháp kính — cùng khối tích, khác hoàn toàn nét vẽ. Đó là lý do 15 × 5 cho ra 75 hình khác
 * nhau thật chứ không phải 15 hình tô 5 màu.
 *
 * Đơn vị: 1.0 = bề ngang một ô lưới. Khu đất của mỗi công trình rộng 3×3 ô và **mỗi khu chỉ có
 * đúng một công trình** (xem `cityLayout.js` — đó là thứ bảo đảm "bảo tàng bất động"), nên kỳ quan
 * được phép trải tới ~1.7 ô mà không bao giờ cắm vào nhà bên cạnh.
 */

/**
 * Mỗi "mảng nhà" (mass) là một khối chữ nhật trong mặt bằng:
 *   `x`,`z`  lệch tâm so với gốc công trình
 *   `w`,`d`  bề ngang / bề sâu
 *   `s`      số tầng (nhân với `storyHeight` của kỷ)
 *   `role`   vai màu; thiếu thì lấy `wall`
 *   `low`    true = khối phụ thấp (sân, tường bao) → không lợp mái, chỉ có gờ
 */

export const ARCHETYPES = {
  /** Hạ tầng: bè ngang, thấp, nằm ngang — trông như thứ phục vụ chứ không phải thứ để ngắm. */
  infrastructure: {
    label: 'hạ tầng',
    heightScale: 0.78,
    masses: {
      common: [
        { x: 0, z: 0, w: 0.86, d: 0.68, s: 1 },
      ],
      rare: [
        { x: -0.16, z: 0, w: 0.9, d: 0.72, s: 1 },
        { x: 0.52, z: 0.06, w: 0.42, d: 0.54, s: 1, role: 'wall2' },
      ],
      epic: [
        { x: 0, z: 0, w: 1.16, d: 0.86, s: 2 },
        { x: -0.78, z: 0.04, w: 0.44, d: 0.62, s: 1, role: 'wall2' },
        { x: 0.78, z: -0.04, w: 0.44, d: 0.62, s: 1, role: 'wall2' },
      ],
    },
  },

  /** Kinh tế: một khối chính + nhà kho phụ + sân hàng có tường bao thấp. */
  economy: {
    label: 'kinh tế',
    heightScale: 0.92,
    masses: {
      common: [
        { x: -0.06, z: 0, w: 0.7, d: 0.7, s: 1 },
        { x: 0.44, z: 0.2, w: 0.34, d: 0.34, s: 1, role: 'wall2', low: true },
      ],
      rare: [
        { x: -0.14, z: -0.04, w: 0.78, d: 0.74, s: 2 },
        { x: 0.5, z: 0.12, w: 0.46, d: 0.52, s: 1, role: 'wall2' },
        { x: 0.16, z: 0.6, w: 0.86, d: 0.2, s: 1, role: 'stone', low: true },
      ],
      epic: [
        { x: -0.2, z: -0.06, w: 0.92, d: 0.86, s: 3 },
        { x: 0.62, z: 0.06, w: 0.6, d: 0.68, s: 2, role: 'wall2' },
        { x: 0.1, z: 0.76, w: 1.3, d: 0.22, s: 1, role: 'stone', low: true },
        { x: -0.78, z: 0.5, w: 0.24, d: 0.24, s: 1, role: 'wood' },
      ],
    },
  },

  /** Phòng thủ: gọn, dày, vuông vức, tháp ở góc — cảm giác nặng và đóng. */
  defense: {
    label: 'phòng thủ',
    heightScale: 1.02,
    masses: {
      common: [
        { x: 0, z: 0, w: 0.66, d: 0.66, s: 1, role: 'stone' },
      ],
      rare: [
        { x: 0, z: 0, w: 0.78, d: 0.78, s: 2, role: 'stone' },
        { x: -0.42, z: -0.42, w: 0.28, d: 0.28, s: 3, role: 'stone', tower: true },
      ],
      epic: [
        { x: 0, z: 0, w: 0.96, d: 0.96, s: 3, role: 'stone' },
        { x: -0.56, z: -0.56, w: 0.32, d: 0.32, s: 4, role: 'stone', tower: true },
        { x: 0.56, z: -0.56, w: 0.32, d: 0.32, s: 4, role: 'stone', tower: true },
        { x: -0.56, z: 0.56, w: 0.32, d: 0.32, s: 4, role: 'stone', tower: true },
        { x: 0.56, z: 0.56, w: 0.32, d: 0.32, s: 4, role: 'stone', tower: true },
      ],
    },
  },

  /**
   * Kỳ quan: cao, đối xứng tuyệt đối, bệ giật cấp, đỉnh nhọn hoặc vòm.
   * ⚠️ Hạng 4 của MỌI kỷ đều là `wonder` (đã kiểm 15/15) và `cityLayout.js` đặt nó vào khu đất
   * TRUNG TÂM. Vì vậy bố cục 2D và ngôn ngữ 3D tự khớp nhau: thứ cao nhất đứng đúng giữa thành
   * phố — không phải may mắn, mà là hệ quả của hai quyết định đã có từ trước.
   */
  wonder: {
    label: 'kỳ quan',
    heightScale: 1.45,
    symmetric: true,
    masses: {
      common: [
        { x: 0, z: 0, w: 0.72, d: 0.72, s: 2 },
      ],
      rare: [
        { x: 0, z: 0, w: 0.96, d: 0.96, s: 1, role: 'stone', low: true },
        { x: 0, z: 0, w: 0.7, d: 0.7, s: 3 },
      ],
      epic: [
        { x: 0, z: 0, w: 1.66, d: 1.66, s: 1, role: 'stone', low: true },
        { x: 0, z: 0, w: 1.2, d: 1.2, s: 1, role: 'trim', low: true },
        { x: 0, z: 0, w: 0.86, d: 0.86, s: 4 },
        { x: -0.62, z: -0.62, w: 0.2, d: 0.2, s: 5, role: 'trim', tower: true },
        { x: 0.62, z: -0.62, w: 0.2, d: 0.2, s: 5, role: 'trim', tower: true },
        { x: -0.62, z: 0.62, w: 0.2, d: 0.2, s: 5, role: 'trim', tower: true },
        { x: 0.62, z: 0.62, w: 0.2, d: 0.2, s: 5, role: 'trim', tower: true },
      ],
    },
  },
};

/** Loại mặc định khi `BUILDING_EFFECTS` không có `type` (bản vẽ lạ / dữ liệu hỏng). */
const DEFAULT_TYPE = 'infrastructure';
const DEFAULT_RARITY = 'common';

/** Nhân chiều cao theo độ hiếm — hạng quý phải NHÌN THẤY là bề thế hơn, không chỉ khác màu. */
export const RARITY_SCALE = {
  common: 1,
  rare: 1.16,
  epic: 1.34,
};

/** Số chi tiết đặc trưng (`motifs` của kỷ) được phép dựng theo độ hiếm. */
export const RARITY_MOTIF_BUDGET = {
  common: 0,
  rare: 1,
  epic: 3,
};

export function getArchetype(type) {
  return ARCHETYPES[type] ?? ARCHETYPES[DEFAULT_TYPE];
}

/**
 * Mặt bằng của một công trình: danh sách mảng nhà theo loại + độ hiếm.
 * Luôn trả về mảng KHÔNG rỗng — màn hình Thành Phố không được có công trình tàng hình.
 */
export function getMassing(type, rarity) {
  const archetype = getArchetype(type);
  return archetype.masses[rarity] ?? archetype.masses[DEFAULT_RARITY];
}

export function getRarityScale(rarity) {
  return RARITY_SCALE[rarity] ?? RARITY_SCALE[DEFAULT_RARITY];
}

export function getMotifBudget(rarity) {
  return RARITY_MOTIF_BUDGET[rarity] ?? RARITY_MOTIF_BUDGET[DEFAULT_RARITY];
}
