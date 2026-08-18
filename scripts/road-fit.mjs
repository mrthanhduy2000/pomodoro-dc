#!/usr/bin/env node
/**
 * road-fit.mjs — MẠNG ĐƯỜNG CÓ LỞM CHỞM KHÔNG, VÀ LỞM CHỞM CỠ NÀO?
 *
 * Chạy:
 *   node --import ./scripts/register-esm-loader.mjs scripts/road-fit.mjs
 *   node --import ./scripts/register-esm-loader.mjs scripts/road-fit.mjs --selftest
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ĐO HAI KHUYẾT TẬT KHÁC NHAU — ĐỪNG TRỘN CHÚNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm nhìn thành phố rồi nói *"đường lòi lõm, mất tự nhiên quá"*. Câu ấy gộp HAI nguyên nhân độc
 * lập, và một bản vá cho cái này không chạm được cái kia:
 *
 *   (1) **MÉP NGANG** — hai ô đường kề nhau trình ra hai bề rộng khác nhau tại chỗ giáp, nên mép
 *       đường có một BẬC VUÔNG GÓC. Đây là chuyện của `carriagewayShape`, thuần hình học 2D,
 *       không liên quan gì tới cao độ.
 *   (2) **MẶT CẮT DỌC** — hai ô đường kề nhau nằm ở hai bậc thềm khác nhau, nên con đường phải leo
 *       một cái dốc dựng đứng trong đúng một ô. Đây là chuyện của `terrain.js`, không liên quan gì
 *       tới bề rộng.
 *
 * ⚠️ VÀ CON SỐ CỦA (2) PHẢI LÀ MỘT TỈ LỆ, KHÔNG PHẢI MỘT SỐ TUYỆT ĐỐI. "Chênh 0,675 đơn vị" không
 * nói lên điều gì cả — 0,675 là to hay nhỏ thì còn tuỳ mọi thứ khác trong khung hình to cỡ nào.
 * Thứ nói lên "lòi lõm cỡ nào" là **so với chiều cao một căn nhà**: nhảy nửa căn nhà trong một ô
 * thì mắt đọc ra bậc thang; nhảy 1/20 căn nhà thì mắt đọc ra mặt đất hơi gợn. Đây đúng bài học
 * Phase 7D (`CLAUDE.md`): một lời hứa nói về QUAN HỆ thì phải đo bằng một con số QUAN HỆ.
 *
 * ⚠️ CHIỀU CAO NHÀ HỎI THẲNG BỘ SINH KHỐI, KHÔNG VIẾT CỨNG. `collectCitySpecs` là nguồn duy nhất
 * trả lời "thành phố này gồm những khối nào"; hỏi nó thì con số không thể già đi khi `massScale`
 * của một kỷ đổi. Viết cứng 1,8–2,0 vào đây là gài đúng quả mìn mà `sweep-score.mjs` đã nổ ở
 * Phase 4G (công cụ đo chép hằng số của công cụ dựng rồi hai bên trôi khỏi nhau).
 *
 * ⚠️ CÔNG CỤ NÀY HỎI CHÍNH `carriagewayShape`, KHÔNG DIỄN ĐẠT LẠI LUẬT ẤY. Hai công thức "tương
 * đương" cho cùng một luật thì gần như luôn lệch nhau ở biên, và biên chính là chỗ đang hỏng.
 *
 * ⚠️ SAU BẢN VÁ 2026-08-18, ĐO 1 RA 0 **THEO CẤU TRÚC**, KHÔNG PHẢI DO MAY MẮN — và phải nói thẳng
 * điều đó ra. Luật mới đặt bề rộng chỗ giáp là `min(nửa của tôi, nửa của hàng xóm)`, một biểu thức
 * ĐỐI XỨNG, nên hai ô kề nhau không còn cách nào khai lệch nhau. Một con số không thể khác 0 thì
 * **không còn là một phép đo có thể đỏ**; thứ thật sự canh gác việc mã DỰNG có bám theo luật ấy
 * không là bài đếm đỉnh trong `terrainMesh.test.js` (đã thử-cho-đỏ hai lần). Ở đây `--selftest`
 * giữ một ĐỐI CHỨNG bơm LUẬT CŨ vào — nếu phép đo không còn bắt được bộ số hỏng cũ thì chính nó
 * đã hỏng, và con số 0 kia vô nghĩa.
 */

import { computeCityLayout } from '../src/engine/cityLayout.js';
import { collectCitySpecs } from '../src/engine/city3d/cityParts.js';
import { buildTerrain } from '../src/engine/city3d/terrain.js';
import {
  SIDES, SIDE_STEPS, carriagewayShape, getStreetStyle, streetCrossSection,
} from '../src/engine/city3d/streetStyle.js';
import { BLUEPRINT_CATALOG } from '../src/engine/constants.js';

const GRID = 12;
/** ⚠️ Phải KHỚP `BUILDING_SCALE` ở `sceneGraph.js` — xem chú thích cùng tên trong `frame-fit.mjs`. */
const BUILDING_SCALE = 1.3;
/** Dưới mức này thì coi như hai bề rộng bằng nhau (sai số dấu phẩy động, không phải bậc thật). */
const EPS = 1e-6;

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
/** Ba mốc tuổi thành phố. Mạng đường mở dần theo phiên nên hình dạng mạng đổi theo mốc. */
const MOCS = [20, 50, 80];

const f2 = (n) => n.toFixed(2);
const f3 = (n) => n.toFixed(3);

function median(xs) {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function layoutOf(era, sessionCount) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  return computeCityLayout({
    built: ids,
    levels: Object.fromEntries(ids.map((id) => [id, 3])),
    era,
    stats: { sessionCount, streakLength: 9 },
  });
}

/**
 * Luật hình dạng THẬT, gói lại thành "mặt đường phủ tới đâu tại ranh giới phía X" (lệch so với tâm
 * ô). Hỏi thẳng `carriagewayShape`, không diễn đạt lại.
 */
function bienTheoLuat(oDuong, halfAt) {
  const nbOf = (x, y) => {
    const ra = {};
    for (const phía of SIDES) {
      const [dx, dy] = SIDE_STEPS[phía];
      ra[phía] = oDuong.has(`${x + dx}|${y + dy}`) ? halfAt(x + dx, y + dy) : undefined;
    }
    return ra;
  };
  return (x, y, phía) => {
    const tay = carriagewayShape(halfAt(x, y), nbOf(x, y)).arms[phía] ?? 0;
    return { lo: -tay, hi: tay };   // cánh tay đối xứng quanh tim đường
  };
}

/**
 * ── ĐO 1: BẬC Ở MÉP ĐƯỜNG ────────────────────────────────────────────────────────────────────
 *
 * Hai ô đường kề nhau theo trục `u` thì hai mép chạy DỌC theo hướng đi là mép `north` và `south`.
 * Nếu ô này khai `north = 0,36` mà ô kia khai `north = 0,5` thì tại chỗ giáp, mép đường bẻ một góc
 * vuông cao 0,14 — đó là một BẬC. Đếm số bậc và đo độ cao của chúng.
 *
 * `halfAt` tách ra thành tham số để `--selftest` bơm được bề rộng giả vào; lúc chạy thật nó hỏi
 * `streetCrossSection`.
 *
 * ⚠️ SO Ở ĐÚNG CHỖ GIÁP, KHÔNG SO Ở MÉP NGOÀI CỦA Ô. Mặt đường nay là một LÕI chữ nhật cộng tối đa
 * bốn CÁNH TAY thon dần, nên "ô này rộng bao nhiêu" đã hết là một con số duy nhất: nó rộng khác
 * nhau ở lõi và ở đầu mỗi cánh tay. Thứ tạo ra một cái bậc mắt nhìn thấy là hai bên trình ra hai
 * bề rộng khác nhau **tại đúng đường ranh giới**; chỗ thon dần bên trong ô là một cái vát, không
 * phải một cái bậc. Đo nhầm mép ngoài sẽ kêu oan mọi ô nằm cạnh một ngã tư.
 *
 * @param {Set<string>} oDuong  tập khoá "x|y" của mọi ô đường
 * @param {(x:number,y:number)=>number} halfAt  nửa bề rộng lòng đường của một ô
 * @param {?(x:number,y:number,phía:string)=>{lo:number,hi:number}} bienAt  luật hình dạng (ĐỐI CHỨNG)
 */
export function edgeSteps(oDuong, halfAt, bienAt = null) {
  const bien = bienAt ?? bienTheoLuat(oDuong, halfAt);

  const buoc = [];
  let capKe = 0;
  for (const key of oDuong) {
    const [x, y] = key.split('|').map(Number);
    // Chỉ nhìn sang ĐÔNG và NAM ⇒ mỗi cặp kề nhau được xét đúng một lần.
    for (const [du, dv, ben, kia] of [[1, 0, 'east', 'west'], [0, 1, 'south', 'north']]) {
      if (!oDuong.has(`${x + du}|${y + dv}`)) continue;
      capKe += 1;
      const a = bien(x, y, ben);
      const b = bien(x + du, y + dv, kia);
      // Hai ĐẦU của đường ranh giới. So cả hai vì mép bắc và mép nam có thể lệch độc lập nhau.
      for (const canh of ['lo', 'hi']) {
        const d = Math.abs(a[canh] - b[canh]);
        if (d > EPS) buoc.push(d);
      }
    }
  }
  return {
    capKe,
    soBuoc: buoc.length,
    tiLe: capKe ? buoc.length / (capKe * 2) : 0,
    lonNhat: buoc.length ? Math.max(...buoc) : 0,
    trungVi: median(buoc),
  };
}

/**
 * ── ĐO 2: MẶT CẮT DỌC ────────────────────────────────────────────────────────────────────────
 *
 * Chênh cao độ giữa hai ô đường KỀ NHAU, quy về phần của MỘT CĂN NHÀ.
 *
 * ⚠️ ĐỘ DỐC KHÔNG PHẢI `atan(Δh / 1)`. Mặt đường lấy cao độ từ `surfaceHeightAt`, mà hàm ấy nội
 * suy giữa hai tâm ô bằng `smoothstep` — đạo hàm của `smoothstep` đạt CỰC ĐẠI 1,5 ở chính giữa.
 * Nên chỗ dốc nhất dốc gấp rưỡi mức trung bình, và đó mới là con số mắt nhìn thấy.
 */
export function heightJumps(oDuong, heightAt, chieuCaoNha) {
  const jumps = [];
  for (const key of oDuong) {
    const [x, y] = key.split('|').map(Number);
    for (const [du, dv] of [[1, 0], [0, 1]]) {
      if (!oDuong.has(`${x + du}|${y + dv}`)) continue;
      jumps.push(Math.abs(heightAt(x, y) - heightAt(x + du, y + dv)));
    }
  }
  const lonNhat = jumps.length ? Math.max(...jumps) : 0;
  return {
    soCap: jumps.length,
    lonNhat,
    trungVi: median(jumps),
    phanNha: chieuCaoNha > 0 ? lonNhat / chieuCaoNha : 0,
    docNhat: (Math.atan(1.5 * lonNhat) * 180) / Math.PI,
    soCapDoc: jumps.filter((d) => d > EPS).length,
  };
}

/** Chiều cao một căn nhà dân của kỷ này, hỏi thẳng bộ sinh khối. Trung vị, đã nhân `BUILDING_SCALE`. */
export function chieuCaoNhaDan(layout) {
  const hs = collectCitySpecs({ layout })
    .filter((it) => it.kind === 'dwelling')
    .map((it) => it.spec.height * BUILDING_SCALE);
  return median(hs);
}

function roadCellsOf(layout) {
  const set = new Set();
  const laneOf = new Map();
  for (const prop of layout?.props ?? []) {
    if (prop?.kind !== 'road') continue;
    set.add(`${prop.x}|${prop.y}`);
    laneOf.set(`${prop.x}|${prop.y}`, prop.variant === 1 || prop.variant === 2);
  }
  return { set, laneOf };
}

function report() {
  console.log('═══ ĐO 1 — BẬC Ở MÉP ĐƯỜNG (hai ô kề nhau trình ra hai bề rộng khác nhau) ═══');
  console.log('kỷ  phiên  cặp kề  số bậc  tỉ lệ   bậc lớn nhất  trung vị');
  const tongTiLe = [];
  const tongLon = [];
  for (const era of ERAS) {
    for (const moc of MOCS) {
      const layout = layoutOf(era, moc);
      const { set, laneOf } = roadCellsOf(layout);
      const street = getStreetStyle(era);
      const halfAt = (x, y) => streetCrossSection(street, !!laneOf.get(`${x}|${y}`)).half;
      const r = edgeSteps(set, halfAt);
      tongTiLe.push(r.tiLe);
      tongLon.push(r.lonNhat);
      console.log(
        String(era).padStart(2) + '  ' + String(moc).padStart(5) + '  '
        + String(r.capKe).padStart(6) + '  ' + String(r.soBuoc).padStart(6) + '  '
        + (r.tiLe * 100).toFixed(0).padStart(4) + '%  ' + f3(r.lonNhat).padStart(12)
        + '  ' + f3(r.trungVi).padStart(8),
      );
    }
  }
  console.log('→ tỉ lệ mép có bậc: trung vị ' + (median(tongTiLe) * 100).toFixed(0)
    + '% · bậc to nhất cả bảng ' + f3(Math.max(...tongLon)) + ' ô');

  console.log('');
  console.log('═══ ĐO 2 — MẶT CẮT DỌC (chênh cao độ hai ô đường kề nhau) ═══');
  console.log('kỷ  nhà cao  cặp lệch/cặp  lệch lớn nhất  = mấy phần nhà  dốc nhất');
  const tongPhan = [];
  for (const era of ERAS) {
    const layout = layoutOf(era, 80);
    const { set } = roadCellsOf(layout);
    const terrain = buildTerrain({ era, gridSize: GRID });
    const nha = chieuCaoNhaDan(layout);
    const r = heightJumps(set, (x, y) => terrain.heightAt(x, y), nha);
    tongPhan.push(r.phanNha);
    console.log(
      String(era).padStart(2) + '  ' + f2(nha).padStart(7) + '  '
      + (String(r.soCapDoc) + '/' + String(r.soCap)).padStart(12) + '  '
      + f3(r.lonNhat).padStart(13) + '  ' + (r.phanNha * 100).toFixed(0).padStart(13) + '%'
      + '  ' + (r.docNhat.toFixed(1) + '°').padStart(8),
    );
  }
  console.log('→ lệch lớn nhất so với một căn nhà: trung vị ' + (median(tongPhan) * 100).toFixed(0)
    + '% · tệ nhất ' + (Math.max(...tongPhan) * 100).toFixed(0) + '%');
}

/**
 * ⚠️ MỖI CA PHẢI CHẠM MỘT CHIỀU KHÁC NHAU, và phải nêu TRƯỚC nó mong đợi thấy gì. Một phép tự kiểm
 * chỉ chứng minh bộ đo CÓ chạy thì vô giá trị — bài học `--selftest` ở Phase 4C/4G/7B.
 */
function selftest() {
  const ca = [];
  const ok = (ten, dieu) => ca.push({ ten, dieu });

  const set = (keys) => new Set(keys);
  const line = ['5|1', '5|2', '5|3'];

  /**
   * LUẬT CŨ (hình chữ nhật, trước 2026-08-18) — dựng lại ở ĐÂY làm ĐỐI CHỨNG, KHÔNG phải mã sản
   * phẩm. Nó nhốt bộ số hỏng cũ lại: dưới luật mới ĐO 1 ra 0 ở mọi nơi, nên nếu phép đo mất khả
   * năng nhìn thấy một cái bậc thì con số 0 kia chẳng chứng minh được gì. Ô nào có hàng xóm thì
   * vươn thẳng ra mép ô (0,5) BẤT KỂ hàng xóm rộng bao nhiêu — chính chỗ "bất kể" ấy đẻ ra bậc.
   */
  const bienCu = (oDuong, halfAt) => (x, y, phía) => {
    const h = halfAt(x, y);
    const co = (dx, dy) => oDuong.has(`${x + dx}|${y + dy}`);
    const doc = phía === 'west' || phía === 'east';   // ranh giới dọc ⇒ hai đầu là bắc/nam
    return {
      lo: -((doc ? co(0, -1) : co(-1, 0)) ? 0.5 : h),
      hi: (doc ? co(0, 1) : co(1, 0)) ? 0.5 : h,
    };
  };

  // (a) Đường thẳng, mọi ô cùng bề rộng ⇒ KHÔNG có bậc nào. Chứng minh nó không kêu oan.
  ok('đường thẳng cùng bề rộng ⇒ 0 bậc',
    edgeSteps(set(line), () => 0.18).soBuoc === 0);

  // (b) Đường thẳng, ô GIỮA khai bề rộng KHÁC ⇒ luật mới tự khớp về bên hẹp hơn ⇒ vẫn 0 bậc.
  ok('ô giữa khác bề rộng ⇒ luật min tự khớp ⇒ 0 bậc',
    edgeSteps(set(line), (x, y) => (y === 2 ? 0.36 : 0.18)).soBuoc === 0);

  // (c) NGÃ BA — chỗ luật cũ hỏng nặng nhất — nay cũng phải sạch.
  ok('ngã ba ⇒ 0 bậc', edgeSteps(set([...line, '6|2']), () => 0.18).soBuoc === 0);

  // (d) Khối 3×3 kín ⇒ 0 bậc. Chứng minh nó không kêu oan ở ca dày đặc.
  const block = [];
  for (let x = 1; x <= 3; x += 1) for (let y = 1; y <= 3; y += 1) block.push(`${x}|${y}`);
  ok('khối 3×3 kín ⇒ 0 bậc', edgeSteps(set(block), () => 0.18).soBuoc === 0);

  // (đ1) ĐỐI CHỨNG — luật CŨ + ô giữa khác bề rộng ⇒ phải BẮT được, và bậc đúng bằng 0,36 − 0,18.
  const d1 = edgeSteps(set(line), (x, y) => (y === 2 ? 0.36 : 0.18),
    bienCu(set(line), (x, y) => (y === 2 ? 0.36 : 0.18)));
  ok('ĐỐI CHỨNG luật cũ: khác bề rộng ⇒ bắt được, bậc = 0,18',
    d1.soBuoc > 0 && Math.abs(d1.lonNhat - 0.18) < EPS);

  // (đ2) ĐỐI CHỨNG — luật CŨ + ngã ba dù CÙNG bề rộng ⇒ vẫn phải bắt được, bậc = 0,5 − 0,18.
  //      Đây là khuyết tật KHÁC hẳn (đ1): nó do KẾT NỐI sinh ra, không do bề rộng khai.
  const d2 = edgeSteps(set([...line, '6|2']), () => 0.18, bienCu(set([...line, '6|2']), () => 0.18));
  ok('ĐỐI CHỨNG luật cũ: ngã ba cùng bề rộng ⇒ vẫn bắt được, bậc = 0,32',
    d2.soBuoc > 0 && Math.abs(d2.lonNhat - 0.32) < EPS);

  // (đ3) Phép đo phải đọc đúng ĐỘ LỚN, không chỉ bật/tắt. Bơm thẳng một lệch 0,07 đã biết.
  const d3 = edgeSteps(set(line), () => 0.18,
    (x, y, phía) => (phía === 'south' ? { lo: -0.25, hi: 0.25 } : { lo: -0.18, hi: 0.18 }));
  ok('bơm lệch 0,07 ⇒ đo ra đúng 0,07',
    d3.soBuoc === 4 && Math.abs(d3.lonNhat - 0.07) < EPS);

  // (f) Cao độ phẳng ⇒ 0 lệch.
  ok('cao độ phẳng ⇒ 0 lệch', heightJumps(set(line), () => 1.2, 2).lonNhat === 0);

  // (g) Một bậc đã biết ⇒ đo ra đúng bậc ấy, và tỉ lệ theo nhà đúng nửa.
  const h = heightJumps(set(line), (x, y) => (y >= 2 ? 1 : 0), 2);
  ok('bậc 1,0 trên nhà cao 2,0 ⇒ 50% một căn nhà',
    Math.abs(h.lonNhat - 1) < EPS && Math.abs(h.phanNha - 0.5) < EPS);

  // (h) Nhà CAO GẤP ĐÔI ⇒ cùng cái bậc ấy phải đọc ra NỬA tỉ lệ. Chiều "mẫu số".
  ok('nhà cao gấp đôi ⇒ tỉ lệ giảm nửa',
    Math.abs(heightJumps(set(line), (x, y) => (y >= 2 ? 1 : 0), 4).phanNha - 0.25) < EPS);

  // (i) Độ dốc nhân 1,5 của `smoothstep`, không phải atan thẳng. Chiều "công thức dốc".
  ok('dốc nhất = atan(1,5 × lệch)',
    Math.abs(h.docNhat - (Math.atan(1.5) * 180) / Math.PI) < 1e-9);

  let fail = 0;
  for (const c of ca) {
    console.log((c.dieu ? '  ✓ ' : '  ✗ ') + c.ten);
    if (!c.dieu) fail += 1;
  }
  console.log(fail ? `✗ ${fail}/${ca.length} ca hỏng` : `✓ cả ${ca.length} ca đạt`);
  if (fail) process.exitCode = 1;
}

if (process.argv.includes('--selftest')) selftest();
else report();
