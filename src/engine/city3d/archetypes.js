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
      // ⚠️ THÁP GÓC KHÔNG ĐƯỢC CAO HƠN THÂN CHÍNH QUÁ MỘT TẦNG.
      // Bản đầu để tháp 3 tầng trên thân 2 tầng (và 4 trên 3 ở hạng epic), kết quả đo được là
      // tỉ lệ cao/rộng 2,33 — và ảnh chụp thử kỷ 2 cho ra hai cái ống khói đứng giữa làng.
      // Càng tệ vì "Kho Lúa" cũng mang loại `defense`: một vựa thóc mà mọc tháp canh cao vống.
      // Công trình phòng thủ phải NẶNG và THẤP; sức mạnh nằm ở bề dày, không ở chiều cao.
      rare: [
        { x: 0, z: 0, w: 0.86, d: 0.86, s: 2, role: 'stone' },
        { x: -0.46, z: -0.46, w: 0.3, d: 0.3, s: 2, role: 'stone', tower: true },
      ],
      epic: [
        { x: 0, z: 0, w: 1.12, d: 1.12, s: 2, role: 'stone' },
        { x: -0.62, z: -0.62, w: 0.34, d: 0.34, s: 3, role: 'stone', tower: true },
        { x: 0.62, z: -0.62, w: 0.34, d: 0.34, s: 3, role: 'stone', tower: true },
        { x: -0.62, z: 0.62, w: 0.34, d: 0.34, s: 3, role: 'stone', tower: true },
        { x: 0.62, z: 0.62, w: 0.34, d: 0.34, s: 3, role: 'stone', tower: true },
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
    // ⚠️ 1.0 chứ không phải 1.45. Bản đầu để 1.45 và ảnh chụp thử cho ra một cây cột khổng lồ đâm
    // thẳng ra khỏi khung hình — kỳ quan phải là ĐIỂM NHẤN của thành phố, không phải thứ che mất
    // thành phố. Mốc ngắm: cao khoảng một phần ba bề ngang lưới (12 ô), tức ~4 đơn vị.
    // ⚠️ 0,68 — con số này đã phải hạ HAI LẦN sau khi nhìn ảnh chụp thử. Thủ phạm là các hệ số
    // NHÂN CHỒNG NHAU: số tầng × chiều cao tầng × hệ số loại × hệ số độ hiếm × hệ số nâng cấp ×
    // hệ số phóng to. Mỗi hệ số nhìn riêng đều hợp lý, nhân lại thành gần gấp đôi. Mốc kiểm bằng
    // mắt: kỳ quan phải ra dáng CUNG ĐIỆN (bè, có bệ, có vòm), không phải THÁP.
    heightScale: 0.68,
    symmetric: true,
    masses: {
      common: [
        { x: 0, z: 0, w: 0.78, d: 0.78, s: 2 },
      ],
      rare: [
        { x: 0, z: 0, w: 0.96, d: 0.96, s: 1, role: 'stone', low: true },
        { x: 0, z: 0, w: 0.76, d: 0.76, s: 3 },
      ],
      epic: [
        { x: 0, z: 0, w: 1.72, d: 1.72, s: 1, role: 'stone', low: true },
        { x: 0, z: 0, w: 1.44, d: 1.44, s: 1, role: 'trim', low: true },
        { x: 0, z: 0, w: 1.16, d: 1.16, s: 3 },
        // Tháp góc THẤP, MẬP, và đứng HẲN RA NGOÀI thân chính (±0,66 so với nửa bề ngang 0,58).
        // Bản đầu để `s: 5, w: 0.2` và ra bốn cây sào; bản sau đặt sát quá nên chúng dính vào
        // tường thành gờ trang trí. Tháp canh phải đọc ra là bốn khối RIÊNG ở bốn góc.
        { x: -0.66, z: -0.66, w: 0.3, d: 0.3, s: 2, role: 'trim', tower: true },
        { x: 0.66, z: -0.66, w: 0.3, d: 0.3, s: 2, role: 'trim', tower: true },
        { x: -0.66, z: 0.66, w: 0.3, d: 0.3, s: 2, role: 'trim', tower: true },
        { x: 0.66, z: 0.66, w: 0.3, d: 0.3, s: 2, role: 'trim', tower: true },
      ],
    },
  },

  // ── NHÀ DÂN (Phase 7C) ───────────────────────────────────────────────────
  //
  // ⚠️ VÌ SAO NHÀ DÂN DÙNG ĐÚNG BỘ MÁY NÀY CHỨ KHÔNG PHẢI MỘT HỆ THỐNG SONG SONG.
  // Đàm yêu cầu *"nhà dân cũng phải đúng thời đại + quốc gia, không dùng nhà generic rồi đổi
  // texture"*. Nếu viết một bộ sinh nhà riêng thì mọi thứ đã dạy cho thành phố suốt 6 phase —
  // kiểu mái theo kỷ, vật liệu tường/mái, `massScale`, `spread`, kiểu cửa sổ — sẽ phải chép lại
  // lần thứ hai, và bản chép sẽ trôi khỏi bản gốc y như mọi bản chép khác trong lịch sử dự án này.
  // Đi qua `buildBuildingSpec` thì nhà dân kỷ 6 TỰ ĐỘNG có mái ngói nung Bắc Bộ và nhà dân kỷ 14
  // TỰ ĐỘNG có mặt kính Singapore, không cần một dòng dữ liệu mới nào.
  //
  // ⚠️ HAI TRỤC ĐƯỢC DÙNG LẠI VỚI NGHĨA MỚI, và đây là chỗ dễ đọc nhầm nhất:
  //   `type`   = nhà ở / cửa hàng / xưởng  → CÔNG NĂNG
  //   `rarity` = common / rare / epic      → **CỠ NHÀ nhỏ / vừa / lớn** (KHÔNG phải độ quý)
  // Đàm yêu cầu đích danh *"nhà dân nhỏ/vừa/lớn"*, và trục `rarity` đã có sẵn đúng ba nấc cùng
  // toàn bộ hệ số nhân đi kèm. Đặt thêm một trục thứ tư chỉ để nói "cỡ nhà" là tạo pattern mới
  // trong khi pattern cũ dùng được — đúng thứ mục "Tính nhất quán kiến trúc" ở `CLAUDE.md` cấm.
  //
  // ⚠️ `plain: true` LÀ THỨ GIỮ CHO LANDMARK CÒN LÀ LANDMARK. Đàm: *"5 landmark phải có silhouette
  // đặc trưng, detail cao hơn nhà dân và nhận ra được từ xa"*. Cờ này bỏ CHỮ KÝ KIẾN TRÚC
  // (`emitSignature`) và CHI TIẾT ĐẶC TRƯNG (`motifs`) khỏi nhà dân — hai thứ đắt nhất và cũng là
  // hai thứ mang căn cước của kỷ. Không có nó thì 30 căn nhà dân đều đội cột chữ T Göbekli Tepe
  // như kỳ quan, và kỳ quan chìm nghỉm giữa đám đông bản sao của chính nó.

  /** Nhà ở: một khối, mái là thứ nói lên tất cả. Nhỏ nhất trong ba loại. */
  house: {
    label: 'nhà ở',
    heightScale: 0.62,
    plain: true,
    masses: {
      // nhỏ — một gian
      common: [
        { x: 0, z: 0, w: 0.46, d: 0.40, s: 1 },
      ],
      // vừa — thêm một chái bên hông
      rare: [
        { x: -0.06, z: 0, w: 0.52, d: 0.44, s: 1 },
        { x: 0.32, z: 0.06, w: 0.24, d: 0.30, s: 1, role: 'wall2' },
      ],
      // lớn — hai tầng + sân có tường bao thấp
      epic: [
        { x: -0.04, z: -0.02, w: 0.56, d: 0.48, s: 2 },
        { x: 0.34, z: 0.10, w: 0.26, d: 0.32, s: 1, role: 'wall2' },
        { x: 0.02, z: 0.42, w: 0.62, d: 0.12, s: 1, role: 'stone', low: true },
      ],
    },
  },

  /** Cửa hàng: mặt tiền rộng hơn nhà ở, thấp, có mái hiên (khối thấp nhô ra phía trước). */
  shop: {
    label: 'cửa hàng',
    heightScale: 0.60,
    plain: true,
    masses: {
      common: [
        { x: 0, z: -0.04, w: 0.54, d: 0.36, s: 1 },
        { x: 0, z: 0.28, w: 0.54, d: 0.14, s: 1, role: 'wood', low: true },
      ],
      rare: [
        { x: 0, z: -0.06, w: 0.62, d: 0.40, s: 1 },
        { x: 0, z: 0.30, w: 0.66, d: 0.16, s: 1, role: 'wood', low: true },
        { x: -0.40, z: 0.14, w: 0.14, d: 0.14, s: 1, role: 'wall2' },
      ],
      epic: [
        { x: 0, z: -0.08, w: 0.70, d: 0.44, s: 2 },
        { x: 0, z: 0.34, w: 0.74, d: 0.18, s: 1, role: 'wood', low: true },
        { x: -0.44, z: 0.16, w: 0.16, d: 0.16, s: 1, role: 'wall2' },
        { x: 0.44, z: 0.16, w: 0.16, d: 0.16, s: 1, role: 'wall2' },
      ],
    },
  },

  /** Xưởng / kho: bè ngang, thấp, mái dài — thứ nằm ở ngoại vi chứ không ở mặt phố. */
  workshop: {
    label: 'xưởng',
    heightScale: 0.66,
    plain: true,
    masses: {
      common: [
        { x: 0, z: 0, w: 0.60, d: 0.34, s: 1, role: 'wood' },
      ],
      rare: [
        { x: -0.08, z: 0, w: 0.68, d: 0.38, s: 1, role: 'wood' },
        { x: 0.40, z: 0, w: 0.22, d: 0.26, s: 1, role: 'stone', low: true },
      ],
      epic: [
        { x: -0.10, z: 0, w: 0.78, d: 0.42, s: 1, role: 'wood' },
        { x: 0.46, z: -0.04, w: 0.26, d: 0.30, s: 1, role: 'wall2' },
        { x: 0.10, z: 0.40, w: 0.72, d: 0.14, s: 1, role: 'stone', low: true },
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
