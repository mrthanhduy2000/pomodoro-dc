/**
 * tokens2d.js — kích thước ô + bảng màu RIÊNG của bộ vẽ 2D isometric.
 *
 * ⚠️ Vì sao tách khỏi `../cityTokens.js`: bảng màu ở đây là các chuỗi `rgba()` được vẽ CHỒNG LÊN
 * nền theo theme — một mẹo compositing chỉ đúng trong SVG/CSS. WebGL không đọc được CSS variable
 * và cũng không composite kiểu đó, nên bộ vẽ 3D sẽ tự dựng màu riêng từ `eraSolid`/`eraTint`.
 * Giữ chung một file sẽ khiến `render3d/` import nhầm thứ nó không dùng được.
 *
 * `../cityTokens.js` giữ những gì DÙNG CHUNG cho mọi bộ vẽ: `eraTint`, `eraSolid`, `cardStyle`.
 */

import { eraTint, eraSolid } from '../cityTokens';

/** Kích thước ô isometric — phải khớp `TILE_W`/`TILE_H` trong `src/engine/cityLayout.js`. */
export const TILE = {
  W: 64,        // bề rộng ô
  H: 32,        // bề cao ô (tỉ lệ 2:1)
  LIFT: 18,     // độ cao khối nhà cấp 1
  LIFT_STEP: 7, // mỗi cấp nâng cấp cao thêm bấy nhiêu
};

/**
 * Bảng màu mỗi kỷ. 4 sắc `ground` ứng với 4 biến thể ô nền mà `computeCityLayout` sinh ra —
 * chênh nhau rất nhẹ để mặt đất không phẳng lì mà cũng không thành bàn cờ.
 */
function makePalette(era) {
  return {
    ground: [
      eraTint(era, 0.10),
      eraTint(era, 0.16),
      eraTint(era, 0.13),
      eraTint(era, 0.19),
    ],
    edge:      eraTint(era, 0.22),   // đường kẻ giữa các ô
    road:      eraTint(era, 0.30),
    roofTop:   eraTint(era, 0.52),   // mặt trên khối nhà
    wallLeft:  eraTint(era, 0.40),   // mặt tường trái (khuất sáng hơn)
    wallRight: eraTint(era, 0.28),   // mặt tường phải (khuất sáng nhất)
    accent:    eraSolid(era),
  };
}

/** Dựng lười theo kỷ + nhớ lại — 15 kỷ nhưng mỗi phiên chỉ xem vài kỷ. */
const paletteCache = new Map();

export function getEraPalette(era) {
  const key = Number(era) || 1;
  let palette = paletteCache.get(key);
  if (!palette) {
    palette = makePalette(key);
    paletteCache.set(key, palette);
  }
  return palette;
}

/** Toạ độ pixel của tâm ô — phải khớp `cellToScreen` trong `src/engine/cityLayout.js`. */
export function cellCenter(x, y) {
  return { cx: (x - y) * (TILE.W / 2), cy: (x + y) * (TILE.H / 2) };
}

/**
 * Khung nhìn SVG bao trọn lưới 12×12 cộng khoảng trống phía trên cho các khối nhà cao.
 * x ∈ [-(N)·W/2, +(N)·W/2] · y ∈ [-H/2, (2N-2)·H/2 + H/2]
 */
export function computeViewBox(gridSize) {
  const halfW = (gridSize * TILE.W) / 2;
  const topPad = TILE.LIFT + TILE.LIFT_STEP * 2 + 44;   // chừa chỗ cho nhà cấp 3 + emoji
  const minY = -TILE.H / 2 - topPad;
  const height = (gridSize - 1) * TILE.H + TILE.H + topPad;
  return {
    minX: -halfW,
    minY,
    width: gridSize * TILE.W,
    height,
    viewBox: `${-halfW} ${minY} ${gridSize * TILE.W} ${height}`,
  };
}
