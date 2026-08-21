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
 * ⚠️ **LỖI ĐÃ VÁ (2026-08-18, Phase 12) — CÔNG CỤ NÀY TỪNG BỎ QUÊN 30% CHIỀU CAO, THEO HƯỚNG TRẤN
 * AN.** `cityBoxes` nhân `BUILDING_SCALE` vào bề NGANG (`reach`) nhưng viết `top: base +
 * spec.height` — không nhân. Trong cảnh thật thì `geometryFactory` nhân `scale` vào **cả ba chiều**
 * (`h: part.h * scale`, `oy: y + part.y * scale`), vì `placement.scale = BUILDING_SCALE` là một
 * phép phóng ĐỀU. Nên mọi công trình thật cao hơn thứ công cụ này tưởng đúng **1,3 lần**, biên mép
 * TRÊN thật hẹp hơn số đã báo, và số kỷ bị cắt thật **nhiều hơn**. Sai theo hướng trấn an — đúng
 * loại sai tệ nhất cho một đồng hồ đo, và cũng đúng cái bẫy mà chính khối chú thích ngay trên đây
 * đã cảnh báo (*"công cụ đo chép lại một hằng số của công cụ dựng rồi hai bên trôi khỏi nhau"*).
 * ⇒ **Mọi con số `frame-fit` ghi trước 2026-08-18 đều đo một thành phố thấp hơn thành phố thật.**
 * `TECH_DEBT #24` dựa trên bộ số cũ, nên nó **nhẹ hơn sự thật**, không nặng hơn.
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
import { BUILDING_SCALE, specSpan } from '../src/engine/city3d/parts.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { computeCityLayout } from '../src/engine/cityLayout.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from '../src/engine/constants.js';

const GRID = 12;
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
    // ⚠️ CHIỀU CAO CŨNG PHẢI NHÂN `BUILDING_SCALE` — xem khối chú thích "LỖI ĐÃ VÁ" ở đầu file.
    out.push({
      id: b.bpId, cx: b.x - half, cz: b.y - half, reach, base,
      top: base + spec.height * BUILDING_SCALE,
      h: spec.height * BUILDING_SCALE,
    });
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
  // ── PHASE 12: bốn chiều MỚI, mỗi ca làm hỏng ĐÚNG một chiều ────────────────────────────────
  // ⚠️ Bốn ca này thêm vào vì `--scale` đo những đại lượng mà bốn ca trên KHÔNG chạm tới. Một phép
  // tự-kiểm chỉ bảo chứng chiều nó thật sự vặn — đúng bài học đã cắn hai lần ở `--selftest` của
  // `sweep-score.mjs` và của chính file này (Phase 4C/4G/7B).
  const o5 = cityOrbitOptions(GRID, 5);
  const b5 = sceneBoxes(5, 80);
  const camXa = cameraBasis({ distance: o5.distance * 1.0, targetY: o5.target.y });
  const camGan = cameraBasis({ distance: o5.distance * 0.6, targetY: o5.target.y });
  const cao = (cam, px) => {
    const dw = projectedHeights(b5, cam).filter((x) => x.kind === 'dwelling');
    return dw.reduce((t, v) => t + v.share * px, 0) / dw.length;
  };
  const caoXa = cao(camXa, 780);
  const caoGan = cao(camGan, 780);
  const it = sceneBoxes(5, 20).filter((b) => b.kind === 'dwelling').length;
  const nhieu = sceneBoxes(5, 80).filter((b) => b.kind === 'dwelling').length;
  // Gác chạy-rỗng: nếu quần thể không đổi theo số phiên thì ca "đông hơn" bên dưới vô nghĩa.
  const camTrong = cameraBasis({ distance: o5.distance * 0.15, targetY: o5.target.y });

  rows.push(
    ['zoom 0,6 (LẠI GẦN) ⇒ nhà phải CAO hơn tính bằng điểm ảnh', caoGan > caoXa],
    ['khung cao gấp đôi ⇒ số điểm ảnh phải gấp đôi (tuyến tính)',
      Math.abs(cao(camXa, 1560) - caoXa * 2) < 1e-6],
    ['nhiều phiên hơn ⇒ nhiều nhà dân hơn (gác chạy-rỗng cho ca trên)', nhieu > it && it > 0],
    ['camera dí sát 0,15 ⇒ GÁC phải nổ, không được trả về một con số',
      frameShare(b5, camTrong, 1.3).trong === false],
  );

  let ok = true;
  for (const [name, pass] of rows) {
    console.log(`${pass ? '✓' : '❌'} ${name}`);
    if (!pass) ok = false;
  }
  console.log(ok ? '\n✓ công cụ đo phản ứng đúng trên MỌI chiều đã kiểm' : '\n❌ CÔNG CỤ ĐO HỎNG — đừng tin số nào ở trên');
  return ok;
}


// ═══════════════════════════════════════════════════════════════════════════════════════════════
// PHASE 12 — "THÀNH PHỐ CHIẾM BAO NHIÊU KHUNG HÌNH, VÀ MỘT CĂN NHÀ CAO BAO NHIÊU ĐIỂM ẢNH"
// ═══════════════════════════════════════════════════════════════════════════════════════════════
/**
 * ⚠️ VÌ SAO PHẢI ĐO **ĐIỂM ẢNH MỖI CĂN NHÀ**, KHÔNG PHẢI CHỈ TỈ LỆ KHUNG HÌNH.
 * Phase 11 thêm 110.076 tam giác lên mái và bản quét 15 kỷ **không phân biệt được** với bản trước
 * (90/90 ô dưới ngưỡng mắt). Câu hỏi "thành phố chiếm bao nhiêu phần khung" KHÔNG trả lời được vì
 * sao: một thành phố chiếm trọn khung vẫn có thể gồm 40 căn nhà tí hon. Đại lượng thật sự quyết
 * định việc một chi tiết có đọc được hay không là **chiều cao của MỘT CĂN NHÀ tính bằng điểm ảnh**
 * — vì chi tiết mái/tầng trệt to chừng 1/10 đến 1/20 căn nhà, nên nhà cao 50 điểm ảnh nghĩa là chi
 * tiết còn 2,5–5 điểm ảnh, tức dưới mọi ngưỡng mắt bất kể vẽ khéo tới đâu.
 *
 * ⚠️ ĐO CẢ **NHÀ DÂN**, không chỉ 5 bản vẽ. Nhà dân đông gấp 4–6 lần và nhỏ hơn hẳn, nên trung
 * bình tính riêng trên 5 công trình lớn sẽ **trấn an sai** — đúng bẫy "một hằng số nền pha loãng
 * tín hiệu" đã cắn ở ngân sách tam giác. Quần thể lấy từ `collectCitySpecs`, tức ĐÚNG cái hàm
 * `sceneGraph.js` dùng để dựng — không dựng lại một quần thể giả định (bài học `groundFloor.test.js`).
 *
 * ⚠️ `--zoom` NHÂN VÀO KHOẢNG CÁCH, nên `0.4` là LẠI GẦN và `2.0` là LÙI XA. Cùng quy ước với
 * `city-preview.mjs` — đọc ngược cờ này đã một lần bịa ra bộ số sai (xem `sweep-diff.mjs`).
 *
 * ⚠️ Con số điểm ảnh phụ thuộc CHIỀU CAO KHUNG (`--height`, mặc định 780 = đúng chiều cao mọi ảnh
 * đã chụp trong Phase 11). Cột "% khung" là đại lượng KHÔNG phụ thuộc thiết bị — đọc cột đó khi
 * muốn suy sang màn hình khác, đừng suy từ cột điểm ảnh.
 */
function sceneBoxes(era, sessions) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  const layout = computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 3])),
    era,
    stats: { sessionCount: sessions, streakLength: 9 },
  });
  const terrain = buildTerrain({ era, gridSize: GRID });
  const half = (GRID - 1) / 2;
  const out = [];
  for (const item of collectCitySpecs({ layout })) {
    if (item.kind !== 'building' && item.kind !== 'dwelling') continue;
    const { spec, source } = item;
    const reach = (specSpan(spec.parts) * BUILDING_SCALE) / 2;
    const span = Math.max(1, Math.round(specSpan(spec.parts) * BUILDING_SCALE));
    const base = terrain.footprint(source.x, source.y, span).top;
    out.push({
      kind: item.kind, cx: source.x - half, cz: source.y - half, reach, base,
      h: spec.height * BUILDING_SCALE, top: base + spec.height * BUILDING_SCALE,
    });
  }
  return out;
}

/** Trục camera đúng như `worstMargin` dựng — một luật một công thức, không chép lại phép toán. */
function cameraBasis({ distance, targetY }) {
  const target = { x: 0, y: targetY, z: 0 };
  const eye = orbitPosition({ yaw: DEFAULT_YAW, pitch: DEFAULT_PITCH, distance, target });
  const fwd = { x: -eye.x, y: target.y - eye.y, z: -eye.z };
  const fl = Math.hypot(fwd.x, fwd.y, fwd.z);
  fwd.x /= fl; fwd.y /= fl; fwd.z /= fl;
  const right = { x: -fwd.z, y: 0, z: fwd.x };
  const rl = Math.hypot(right.x, right.z);
  right.x /= rl; right.z /= rl;
  const up = {
    x: right.y * fwd.z - right.z * fwd.y,
    y: right.z * fwd.x - right.x * fwd.z,
    z: right.x * fwd.y - right.y * fwd.x,
  };
  return { eye, fwd, right, up };
}

/**
 * Bề rộng/bề cao thành phố chiếm bao nhiêu phần khung (1,0 = trọn khung).
 *
 * ⚠️ **GÁC BẮT BUỘC — VÀ NÓ LÀ MỘT PHÁT HIỆN, KHÔNG PHẢI MỘT CHI TIẾT KỸ THUẬT.** Khi camera lại
 * gần tới mức **lọt vào trong thành phố**, có khối nằm sau lưng hoặc sát ngay trước ống kính; phép
 * chia cho `f` nổ tung và bảng in ra những con số như *"rộng 12725%"* hay *"kỳ quan 4230,9px"* —
 * trông vẫn như số liệu, vẫn xếp thành cột thẳng hàng. Bản đầu của bộ đo này in đúng bộ số ấy cho
 * `zoom 0.4` và suýt được đọc thành "lại gần thì chi tiết to gấp 13 lần".
 *
 * Sự thật là **"tỉ lệ khung hình" NGỪNG TỒN TẠI khi camera vào trong cảnh** — không có một hộp bao
 * nào để mà chiếm phần trăm nữa. Nên ở đây KHÔNG tự chữa bằng cách kẹp giá trị (kẹp thì ra một con
 * số trông hợp lý mà vô nghĩa, đúng bẫy `MIN_STONE` Phase 9D); hàm trả về `null` kèm số khối bị
 * loại, và người gọi phải in ra lời từ chối chứ không in một con số.
 */
const NEAR_CLIP = 0.5;

function frameShare(boxes, cam, aspect) {
  const halfY = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  const halfX = Math.atan(Math.tan(halfY) * aspect);
  let minU = Infinity, maxU = -Infinity, minR = Infinity, maxR = -Infinity;
  let loai = 0;
  let tong = 0;
  for (const b of boxes) {
    for (const dx of [-b.reach, b.reach]) {
      for (const dz of [-b.reach, b.reach]) {
        for (const wy of [b.base, b.top]) {
          tong += 1;
          const v = { x: b.cx + dx - cam.eye.x, y: wy - cam.eye.y, z: b.cz + dz - cam.eye.z };
          const f = v.x * cam.fwd.x + v.y * cam.fwd.y + v.z * cam.fwd.z;
          if (f <= NEAR_CLIP) { loai += 1; continue; }
          const u = (v.x * cam.up.x + v.y * cam.up.y + v.z * cam.up.z) / (f * Math.tan(halfY));
          const r = (v.x * cam.right.x + v.y * cam.right.y + v.z * cam.right.z) / (f * Math.tan(halfX));
          minU = Math.min(minU, u); maxU = Math.max(maxU, u);
          minR = Math.min(minR, r); maxR = Math.max(maxR, r);
        }
      }
    }
  }
  if (loai > 0) return { trong: false, loai, tong };
  return { trong: true, loai: 0, tong, hShare: (maxU - minU) / 2, wShare: (maxR - minR) / 2 };
}

/** Mức zoom nhỏ nhất mà camera CHƯA lọt vào trong thành phố (chia đôi 30 lần là quá đủ). */
function zoomAnToanNhoNhat(era, sessions, aspect) {
  const opts = cityOrbitOptions(GRID, era);
  const boxes = sceneBoxes(era, sessions);
  let lo = 0.05;
  let hi = 1.0;
  if (!frameShare(boxes, cameraBasis({ distance: opts.distance * hi, targetY: opts.target.y }), aspect).trong) {
    return null;                       // ngay cả zoom mặc định đã lọt vào trong — đáng báo động
  }
  for (let i = 0; i < 30; i += 1) {
    const mid = (lo + hi) / 2;
    const cam = cameraBasis({ distance: opts.distance * mid, targetY: opts.target.y });
    if (frameShare(boxes, cam, aspect).trong) hi = mid; else lo = mid;
  }
  return hi;
}

/** Chiều cao chiếu lên màn hình của TỪNG khối, theo phần khung hình (nhân `heightPx` ra điểm ảnh). */
function projectedHeights(boxes, cam) {
  const halfY = ((CITY_CAMERA_FOV / 2) * Math.PI) / 180;
  return boxes.map((b) => {
    const cy = (b.base + b.top) / 2;
    const v = { x: b.cx - cam.eye.x, y: cy - cam.eye.y, z: b.cz - cam.eye.z };
    const f = v.x * cam.fwd.x + v.y * cam.fwd.y + v.z * cam.fwd.z;
    // Chiếu chiều cao THEO TRỤC MÀN HÌNH: camera chúc xuống nên một cột đứng cao `h` chỉ hiện ra
    // `h × |thành phần thẳng đứng của trục `up`|`. Bỏ vế này là thổi phồng, vì góc chúc gần 40°.
    const doc = Math.abs(cam.up.y);
    return { kind: b.kind, share: (b.h * doc) / (2 * f * Math.tan(halfY)) };
  });
}

function reportScale(aspect, heightPx) {
  console.log(`\n═══ PHASE 12 — THÀNH PHỐ CHIẾM BAO NHIÊU KHUNG · MỘT CĂN NHÀ CAO BAO NHIÊU ĐIỂM ẢNH ═══`);
  console.log(`tỉ lệ khung ${aspect.toFixed(2)} · chiều cao khung ${heightPx}px · FOV ${CITY_CAMERA_FOV}°`);
  console.log('⚠️ zoom NHÂN vào khoảng cách: 1,0 = mặc định · 0,4 = LẠI GẦN\n');
  const rows = [];
  for (const zoom of [1.0, 0.4]) {
    for (const sessions of [20, 50, 80]) {
      console.log(`── zoom ${zoom.toFixed(1)} · ${sessions} phiên ─────────────────────────────`);
      console.log(' kỷ | rộng% | cao%  | nhà dân px (TB) | kỳ quan px (TB) | thấp nhất px');
      const acc = { dw: [], bd: [], lo: Infinity, wS: [], hS: [], hong: 0 };
      for (let era = 1; era <= 15; era += 1) {
        const opts = cityOrbitOptions(GRID, era);
        const boxes = sceneBoxes(era, sessions);
        const cam = cameraBasis({ distance: opts.distance * zoom, targetY: opts.target.y });
        const sh = frameShare(boxes, cam, aspect);
        if (!sh.trong) {
          console.log(` ${String(era).padStart(2)} | ❌ CAMERA ĐÃ LỌT VÀO TRONG THÀNH PHỐ `
            + `(${sh.loai}/${sh.tong} đỉnh khối nằm sau hoặc sát ống kính) ⇒ mọi con số vô nghĩa`);
          acc.hong += 1;
          continue;
        }
        const ph = projectedHeights(boxes, cam);
        const dw = ph.filter((x) => x.kind === 'dwelling').map((x) => x.share * heightPx);
        const bd = ph.filter((x) => x.kind === 'building').map((x) => x.share * heightPx);
        const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
        const lo = Math.min(...ph.map((x) => x.share * heightPx));
        acc.dw.push(...dw); acc.bd.push(...bd); acc.lo = Math.min(acc.lo, lo);
        acc.wS.push(sh.wShare); acc.hS.push(sh.hShare);
        console.log(
          ` ${String(era).padStart(2)} | ${(sh.wShare * 100).toFixed(0).padStart(4)}% `
          + `| ${(sh.hShare * 100).toFixed(0).padStart(4)}% `
          + `| ${(dw.length ? avg(dw).toFixed(1) : '—').padStart(15)} `
          + `| ${avg(bd).toFixed(1).padStart(15)} | ${lo.toFixed(1).padStart(12)}`,
        );
      }
      const avg = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);
      const line = {
        zoom, sessions, hong: acc.hong,
        wShare: avg(acc.wS), hShare: avg(acc.hS),
        dwPx: avg(acc.dw), bdPx: avg(acc.bd), loPx: acc.lo,
      };
      rows.push(line);
      if (acc.hong === 15) {
        console.log('  ⇒ ❌ CẢ 15 KỶ đều lọt camera vào trong — mức zoom này KHÔNG dùng được.\n');
      } else {
        console.log(`  ⇒ TB ${15 - acc.hong}/15 kỷ đọc được: rộng ${(line.wShare * 100).toFixed(0)}% · cao `
          + `${(line.hShare * 100).toFixed(0)}% · nhà dân ${line.dwPx.toFixed(1)}px · `
          + `kỳ quan ${line.bdPx.toFixed(1)}px · thấp nhất ${line.loPx.toFixed(1)}px`
          + (acc.hong ? `  (${acc.hong} kỷ hỏng)` : '') + '\n');
      }
    }
  }
  console.log('════ TÓM TẮT ════');
  console.log('zoom | phiên | rộng% | cao% | nhà dân px | kỳ quan px | chi tiết mái ước tính px¹');
  for (const r of rows) {
    if (r.hong === 15) {
      console.log(` ${r.zoom.toFixed(1)} |  ${String(r.sessions).padStart(3)}  | ❌ camera lọt vào trong thành phố — không đo được`);
      continue;
    }
    console.log(` ${r.zoom.toFixed(1)} |  ${String(r.sessions).padStart(3)}  `
      + `| ${(r.wShare * 100).toFixed(0).padStart(4)}% | ${(r.hShare * 100).toFixed(0).padStart(3)}% `
      + `| ${r.dwPx.toFixed(1).padStart(10)} | ${r.bdPx.toFixed(1).padStart(10)} `
      + `| ${(r.dwPx / 12).toFixed(1).padStart(24)}`);
  }
  console.log('\n════ LẠI GẦN ĐƯỢC TỚI ĐÂU TRƯỚC KHI CAMERA CHUI VÀO TRONG THÀNH PHỐ ════');
  console.log('kỷ | zoom nhỏ nhất còn an toàn | nhà dân px ở mức đó | so với zoom 1,0');
  for (let era = 1; era <= 15; era += 1) {
    const z = zoomAnToanNhoNhat(era, 80, aspect);
    const opts = cityOrbitOptions(GRID, era);
    const boxes = sceneBoxes(era, 80);
    const px = (zz) => {
      const cam = cameraBasis({ distance: opts.distance * zz, targetY: opts.target.y });
      const dw = projectedHeights(boxes, cam).filter((x) => x.kind === 'dwelling');
      return dw.reduce((s, v) => s + v.share * heightPx, 0) / dw.length;
    };
    if (z === null) { console.log(` ${String(era).padStart(2)} | ❌ ngay ở zoom 1,0 đã lọt vào trong`); continue; }
    console.log(` ${String(era).padStart(2)} | ${z.toFixed(2).padStart(24)} `
      + `| ${px(z).toFixed(1).padStart(19)} | ${(px(z) / px(1.0)).toFixed(2)}×`);
  }

  console.log('\n¹ Chi tiết mái (ống khói, bồn nước, lan can) cao chừng 1/12 căn nhà — hệ số ĐO TỪ');
  console.log('  `rooftop.js`, không phải đoán: `STACK_W_MAX_RATIO` 0,3 bề ngang mái và cao ~0,4 lần');
  console.log('  bề ngang ấy. Dưới ~3px thì không một cách vẽ nào cứu được.');
  return rows;
}

const args = process.argv.slice(2);
function flagNum(name, fallback) {
  const i = args.indexOf(name);
  return i >= 0 && Number.isFinite(Number(args[i + 1])) ? Number(args[i + 1]) : fallback;
}

if (args.includes('--selftest')) {
  process.exit(selftest() ? 0 : 1);
} else if (args.includes('--scale')) {
  reportScale(flagNum('--aspect', 1.3), flagNum('--height', 780));
} else {
  const aspect = Number(args.find((a) => !a.startsWith('--')) ?? 1.3);
  report(aspect, args.includes('--flat'));
}
