#!/usr/bin/env node
/**
 * frame-fit.mjs — CÔNG TRÌNH NÀO ĐANG BỊ MÉP KHUNG HÌNH CẮT, VÀ PHẢI LÙI BAO NHIÊU THÌ HẾT.
 *
 * Chạy:
 *   node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs            (khung 1,3)
 *   node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs 1.0        (khung vuông)
 *   node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs 1.3 --flat (đối chứng)
 *   node --import ./scripts/register-esm-loader.mjs scripts/frame-fit.mjs --selftest
 *
 * ⚠️ VÌ SAO CẦN CÔNG CỤ NÀY CHỨ KHÔNG PHẢI NHÌN ẢNH. Bảng quét `city-preview.mjs` cho thấy MỘT
 * khung hình; mắt đọc được "cái nhà kia bị cắt" nhưng KHÔNG đọc được "cắt mất bao nhiêu" và tuyệt
 * đối không đọc được "trên máy của Đàm, nơi thẻ cảnh có tỉ lệ khung khác, còn cắt những gì nữa".
 * Tỉ lệ khung là thứ đổi theo từng thiết bị, và mỗi tỉ lệ cho một đáp án khác — đo được 13/15 kỷ
 * bị cắt ở khung 1,6 nhưng **15/15** ở khung vuông.
 *
 * ⚠️ VÀ NÓ ĐÃ TỪNG NÓI DỐI NGAY LẦN CHẠY ĐẦU, theo đúng kiểu quen thuộc của dự án này (lần thứ 17).
 * Vector `right` viết ngược dấu (`fwd.z, 0, -fwd.x` thay vì `-fwd.z, 0, fwd.x`) ⇒ `up` suy ra từ nó
 * cũng lộn 180°. ĐỘ LỚN của biên vẫn đúng nên mọi con số vẫn chính xác, chỉ có NHÃN MÉP là đảo:
 * công cụ báo "bị cắt ở mép TRÊN" trong khi ảnh chụp rõ ràng cho thấy cắt ở mép DƯỚI. Ảnh đúng.
 * ⇒ Bài học lặp lại lần nữa: **phép đo cãi lại con mắt thì kiểm CÔNG CỤ trước, kiểm mã sau.**
 *
 * Cách đọc "biên": tính theo phần NỬA khung hình.
 *   1,0 = ở đúng tâm · 0,0 = chạm đúng mép · số ÂM = đã lọt ra ngoài, tức bị cắt.
 * Ngưỡng dùng ở đây là 0,04 (cách mép ~2% chiều khung) — "vừa đúng mép" không phải là đạt, vì chỉ
 * cần đổi tỉ lệ khung một chút là lại cắt.
 */

import {
  CITY_CAMERA_FOV, DEFAULT_PITCH, DEFAULT_YAW, cityOrbitOptions, orbitPosition,
} from '../src/engine/city3d/orbit.js';
import { buildBuildingSpec } from '../src/engine/city3d/buildingSpec.js';
import { specSpan } from '../src/engine/city3d/parts.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from '../src/engine/constants.js';

const GRID = 12;
/**
 * ⚠️ Phải KHỚP `BUILDING_SCALE` trong `sceneGraph.js`. Đây đúng cái bẫy đã làm `sweep-score.mjs`
 * bịa ra 5 lỗi không có thật ở Phase 4G: công cụ đo chép lại một hằng số của công cụ dựng rồi hai
 * bên trôi khỏi nhau. Ở đây chưa tách ra được vì hằng số ấy không được export; nếu có ngày đổi nó
 * mà quên chỗ này, mọi con số dưới đây sai hết mà vẫn trông rất thuyết phục.
 */
const BUILDING_SCALE = 1.3;
const MARGIN_OK = 0.04;

/** Hộp bao của mọi công trình trong một kỷ, đã đặt lên địa hình đúng như `sceneGraph.js` đặt. */
function cityBoxes(era, { flat = false } = {}) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const layout = computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 3])),
    era,
    stats: { sessionCount: 80, streakLength: 9 },
  });
  const terrain = buildTerrain({ era, gridSize: GRID });
  const half = (GRID - 1) / 2;
  const out = [];
  for (const b of layout.buildings ?? []) {
    const bp = BLUEPRINT_CATALOG[era].find((p) => p.id === b.bpId);
    if (!bp) continue;
    const spec = buildBuildingSpec({
      bpId: b.bpId, era, rarity: bp.rarity,
      type: BUILDING_EFFECTS[b.bpId]?.type ?? 'infrastructure', level: 3,
    });
    const reach = (specSpan(spec.parts) * BUILDING_SCALE) / 2;
    const span = Math.max(1, Math.round(specSpan(spec.parts) * BUILDING_SCALE));
    const base = flat ? 0 : terrain.footprint(b.x, b.y, span).top;
    out.push({ id: b.bpId, cx: b.x - half, cz: b.y - half, reach, base, top: base + spec.height });
  }
  return out;
}

/** Biên hẹp nhất trong cả kỷ, kèm tên công trình và mép nào đang cắt. */
function worstMargin(boxes, { distance, targetY, aspect }) {
  const halfY = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  const halfX = Math.atan(Math.tan(halfY) * aspect);   // three suy FOV ngang từ FOV dọc × tỉ lệ
  const target = { x: 0, y: targetY, z: 0 };
  const eye = orbitPosition({ yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance, target });

  const fwd = { x: -eye.x, y: target.y - eye.y, z: -eye.z };
  const fl = Math.hypot(fwd.x, fwd.y, fwd.z);
  fwd.x /= fl; fwd.y /= fl; fwd.z /= fl;
  // ⚠️ DẤU Ở ĐÂY — xem chú thích đầu file. Viết ngược thì số vẫn đúng mà nhãn mép đảo hết.
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
              margin, id: b.id,
              edge: mV < mH ? (u > 0 ? 'TRÊN' : 'DƯỚI') : (r > 0 ? 'PHẢI' : 'TRÁI'),
            };
          }
        }
      }
    }
  }
  return worst;
}

/** Hệ số khoảng cách nhỏ nhất (× cỡ lưới) để cả kỷ vào trọn khung. Chia đôi 40 lần là quá đủ. */
function fitFactor(boxes, { targetY, aspect }) {
  let lo = 0.8;
  let hi = 4.0;
  for (let i = 0; i < 40; i += 1) {
    const mid = (lo + hi) / 2;
    if (worstMargin(boxes, { distance: GRID * mid, targetY, aspect }).margin >= MARGIN_OK) hi = mid;
    else lo = mid;
  }
  return hi;
}

function report(aspect, flat) {
  console.log(`\ntỉ lệ khung ${aspect.toFixed(2)}${flat ? '  ·  ĐỊA HÌNH PHẲNG (đối chứng)' : ''}`);
  console.log('kỷ | biên  | mép   | cần hệ số | đang | công trình hẹp nhất');
  let cut = 0;
  let needed = 0;
  for (let era = 1; era <= 15; era += 1) {
    const opts = cityOrbitOptions(GRID, era);
    const boxes = cityBoxes(era, { flat });
    const w = worstMargin(boxes, { distance: opts.distance, targetY: opts.target.y, aspect });
    const need = fitFactor(boxes, { targetY: opts.target.y, aspect });
    if (w.margin < 0) cut += 1;
    needed = Math.max(needed, need);
    const tag = w.margin < 0 ? '❌' : w.margin < MARGIN_OK ? '⚠️' : '  ';
    console.log(
      `${String(era).padStart(2)} | ${w.margin.toFixed(3).padStart(6)} | ${w.edge.padEnd(5)} |`
      + `   ${need.toFixed(2)}    | ${(opts.distance / GRID).toFixed(2)} | ${tag} ${w.id}`,
    );
  }
  console.log(`⇒ ${cut}/15 kỷ có công trình bị cắt · hệ số chung cần ${needed.toFixed(2)} `
    + `(đang dùng ${(cityOrbitOptions(GRID, 1).distance / GRID).toFixed(2)}–`
    + `${(cityOrbitOptions(GRID, 15).distance / GRID).toFixed(2)})`);
  return { cut, needed };
}

/**
 * ⚠️ PHÉP TỰ KIỂM PHẢI CHẠM TỚI TỪNG CHIỀU NÓ MUỐN BẢO CHỨNG (bài học Phase 4G). Ở đây có hai
 * chiều dễ sai độc lập nhau — trục DỌC và trục NGANG — nên phải có hai ca, và mỗi ca phải làm
 * hỏng ĐÚNG một trục. Một phép tự kiểm chỉ vặn khoảng cách sẽ xanh dù trục ngang tính sai hoàn toàn.
 */
function selftest() {
  const boxes = cityBoxes(5);
  const opts = cityOrbitOptions(GRID, 5);
  const near = worstMargin(boxes, { distance: opts.distance, targetY: opts.target.y, aspect: 1.3 });
  const far = worstMargin(boxes, { distance: opts.distance * 3, targetY: opts.target.y, aspect: 1.3 });
  const wide = worstMargin(boxes, { distance: opts.distance, targetY: opts.target.y, aspect: 3.0 });
  const narrow = worstMargin(boxes, { distance: opts.distance, targetY: opts.target.y, aspect: 0.6 });

  const rows = [
    ['lùi camera ra xa 3× ⇒ biên phải RỘNG ra', far.margin > near.margin],
    ['khung rộng bè ra 3,0 ⇒ mép BÊN phải nới ⇒ biên rộng hơn khung 1,3', wide.margin >= near.margin],
    ['khung hẹp 0,6 ⇒ mép BÊN bóp lại ⇒ biên hẹp hơn khung 1,3', narrow.margin < near.margin],
    ['khung hẹp phải cắt ở mép TRÁI/PHẢI, không phải TRÊN/DƯỚI', ['TRÁI', 'PHẢI'].includes(narrow.edge)],
  ];
  let ok = true;
  for (const [name, pass] of rows) {
    console.log(`${pass ? '✓' : '❌'} ${name}`);
    if (!pass) ok = false;
  }
  console.log(ok ? '\n✓ công cụ đo phản ứng đúng trên CẢ HAI trục' : '\n❌ CÔNG CỤ ĐO HỎNG — đừng tin số nào ở trên');
  return ok;
}

const args = process.argv.slice(2);
if (args.includes('--selftest')) {
  process.exit(selftest() ? 0 : 1);
} else {
  const aspect = Number(args.find((a) => !a.startsWith('--')) ?? 1.3);
  report(aspect, args.includes('--flat'));
}
