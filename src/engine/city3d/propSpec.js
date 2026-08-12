/**
 * propSpec.js — cây cối, đá, đèn, mặt nước, ruộng đồng. Những thứ KHÔNG phải công trình.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO ĐÂY KHÔNG PHẢI "TRANG TRÍ THÊM CHO VUI":
 * Lưới thành phố có 144 ô nhưng chỉ 5 công trình — nghĩa là 97% mặt đất trống. Nhìn từ trên xuống,
 * một mặt bàn cờ trống trải với năm khối nhà cắm rời rạc trông như mô hình chưa làm xong, chứ
 * không phải một nơi có người ở. `deriveProps` trong `cityLayout.js` đã sinh sẵn danh sách cảnh
 * vật từ nhiều phiên trước (bộ vẽ 2D dùng rồi) — bộ vẽ 3D chỉ mới đọc mỗi đường sá và bỏ qua tất
 * cả phần còn lại. File này lấp đúng khoảng trống đó.
 *
 * Cảnh vật cũng CHÍNH LÀ thước đo tiến độ nhìn thấy được: số lượng suy từ số phiên và độ dài
 * chuỗi, nên thành phố rậm rạp dần theo công sức Đàm bỏ ra, không cần thêm một byte state nào.
 */

import { hashId } from '../cityLayout';
import { prism, countSpecTriangles, specHeight } from './parts';
import { getEraStyle } from './eraStyle';

function unit(key) {
  return (hashId(key) % 10000) / 10000;
}

function signed(key) {
  return unit(key) * 2 - 1;
}

/**
 * Cây. Hình dáng đổi theo kỷ vì thảm thực vật của một khu định cư nói lên thời đại của nó gần
 * bằng kiến trúc: rừng nguyên sinh tán rộng ở kỷ tiền sử, cây cắt tỉa hình nón ở kỷ Phục Hưng,
 * cây trồng theo hàng gầy guộc ở kỷ công nghiệp.
 */
function tree(seed, era) {
  const style = getEraStyle(era);
  const parts = [];
  const h = 0.3 + unit(`${seed}|h`) * 0.26;
  const lean = signed(`${seed}|lean`) * 0.08;

  // Thân
  parts.push(prism({ x: 0, y: 0, z: 0, w: 0.055, h, sides: 5, taper: 0.7, ry: lean, role: 'wood' }));

  if (era >= 10) {
    // Kỷ công nghiệp trở đi: cây trồng theo hàng, tán gọn và thưa.
    parts.push(prism({ x: 0, y: h, z: 0, w: 0.24, h: 0.26, sides: 6, taper: 0.45, role: 'leaf' }));
  } else if (style.rough > 0.5) {
    // Kỷ tiền sử: tán rộng, nhiều lớp, không đều.
    parts.push(prism({ x: 0, y: h * 0.86, z: 0, w: 0.42, h: 0.2, sides: 6, taper: 0.7, role: 'leaf' }));
    parts.push(prism({
      x: signed(`${seed}|ox`) * 0.05, y: h * 0.86 + 0.16, z: signed(`${seed}|oz`) * 0.05,
      w: 0.3, h: 0.18, sides: 6, taper: 0.4, role: 'leaf',
    }));
  } else {
    // Cây tán tròn thông thường: hai lớp cho có khối, rẻ hơn nhiều so với một hình cầu thật.
    parts.push(prism({ x: 0, y: h * 0.82, z: 0, w: 0.32, h: 0.19, sides: 6, taper: 0.86, role: 'leaf' }));
    parts.push(prism({ x: 0, y: h * 0.82 + 0.19, z: 0, w: 0.28, h: 0.2, sides: 6, taper: 0.2, role: 'leaf' }));
  }
  return parts;
}

function rock(seed) {
  const parts = [];
  const count = 1 + (hashId(`${seed}|n`) % 2);
  for (let i = 0; i < count; i += 1) {
    parts.push(prism({
      x: signed(`${seed}|x${i}`) * 0.16,
      z: signed(`${seed}|z${i}`) * 0.16,
      y: 0,
      w: 0.13 + unit(`${seed}|w${i}`) * 0.12,
      h: 0.09 + unit(`${seed}|h${i}`) * 0.1,
      sides: 5, taper: 0.55,
      ry: unit(`${seed}|r${i}`) * 2,
      role: 'stone',
    }));
  }
  return parts;
}

/**
 * Đèn / cột mốc. Ở kỷ hiện đại là cột đèn, ở kỷ cổ là cột đá có ngọn lửa.
 * Không dùng `seed`: đèn đường phải ĐỀU NHAU — chỗ này lệch lạc thì mất luôn cảm giác quy hoạch.
 */
function lamp(_seed, era) {
  const modern = era >= 10;
  return [
    prism({ x: 0, y: 0, z: 0, w: 0.045, h: 0.34, sides: modern ? 6 : 4, taper: 0.8, role: modern ? 'stone' : 'wood' }),
    prism({
      x: 0, y: 0.34, z: 0, w: 0.11, h: 0.11,
      sides: modern ? 6 : 4, taper: modern ? 0.7 : 0,
      role: 'gold',
    }),
  ];
}

/**
 * Mặt nước: một mảng phẳng thấp hơn mặt đất, viền đá. Không gợn sóng — tĩnh thì mới yên.
 * Không dùng `seed`: ao hồ vuông vắn theo ô lưới, méo mó ngẫu nhiên chỉ làm nó trông như lỗi.
 */
function water() {
  return [
    prism({ x: 0, y: -0.02, z: 0, w: 0.9, d: 0.9, h: 0.06, sides: 4, role: 'water' }),
    prism({ x: 0, y: -0.03, z: 0, w: 0.98, d: 0.98, h: 0.035, sides: 4, role: 'stone' }),
  ];
}

/** Ruộng: những luống song song thấp — đọc ra ngay là đất canh tác chứ không phải sân trống. */
function field(seed) {
  const parts = [];
  const rows = 4;
  const ry = unit(`${seed}|dir`) > 0.5 ? Math.PI / 2 : 0;
  for (let i = 0; i < rows; i += 1) {
    const t = (i / (rows - 1)) - 0.5;
    parts.push(prism({
      x: ry ? 0 : t * 0.72, z: ry ? t * 0.72 : 0, y: 0,
      w: ry ? 0.86 : 0.12, d: ry ? 0.12 : 0.86,
      h: 0.045 + unit(`${seed}|h${i}`) * 0.03,
      sides: 4, role: 'leaf',
    }));
  }
  return parts;
}

const BUILDERS = { tree, rock, lamp, water, field };

/**
 * Mô tả hình học cho MỘT cảnh vật.
 *
 * @param {object} input
 * @param {string} input.kind  'tree' | 'rock' | 'lamp' | 'water' | 'field' (loại lạ → cây)
 * @param {number} input.era
 * @param {string} input.seed  khoá băm — phải ổn định theo ô lưới để cây không nhảy chỗ
 * @returns {{parts:Array, height:number, triangles:number}}
 */
export function buildPropSpec({ kind, era, seed = 'p' } = {}) {
  const build = BUILDERS[kind] ?? BUILDERS.tree;
  const parts = build(seed, Number.isFinite(era) ? era : 1);
  return { parts, height: specHeight(parts), triangles: countSpecTriangles(parts) };
}

/** Các loại cảnh vật mà bộ vẽ 3D dựng được — dùng cho test và cho việc bỏ sót kiểu mới. */
export const PROP_KINDS = Object.keys(BUILDERS);
