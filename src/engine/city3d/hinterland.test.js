/**
 * hinterland.test.js — CANH TẦNG HÌNH HỌC CỦA VÙNG PHỤ CẬN.
 *
 * ⚠️ BÀI QUAN TRỌNG NHẤT FILE NÀY LÀ BÀI ĐẾM Ở ĐẦU BÊN KIA ("bảng khai gì thì phải dựng ra thứ
 * ấy"), và nó không phải lý thuyết: chính nó đã bắt được **BỐN lỗi im lặng** trong lần chạy đầu,
 * lỗi nào cũng để bảng hợp lệ · validator nhận · hàm dựng chạy đủ · không một dòng nào đỏ:
 *
 *   1. `setting.side` KHÔNG TỒN TẠI (trường thật là `setting.style.side`) ⇒ biểu thức rơi về
 *      `'nam'` ở cả 15 kỷ ⇒ **0/13 bến và 0/4 cầu được dựng.**
 *   2. Đọc đúng `setting.style.side` rồi VẪN hụt 7/13 bến, vì `side` là hướng CAMERA
 *      (`SIDE_YAW`/`worldYaw`) chứ không phải hướng hình học nước. Bản đúng phải QUÉT.
 *   3. Tường tre bị loại thẳng khỏi vòng lặp ⇒ kỷ 6 khai `wall:'bamboo'` + `gate:true` mà không
 *      có cả hai.
 *   4. Cổng bị chính phép lọc khô ráo nuốt ⇒ kỷ 5 có tường mà không có cổng.
 *
 * Bốn lỗi, một bài test. Đó là lý do luật *"từ chối thẳng phải đi kèm một phép đếm ở đầu bên kia"*
 * (Phase 10 Bước 2) được viết ra, và là lý do bài này đứng đầu file.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  deriveHinterland, planHinterland, buildHinterlandSpec,
  HINTERLAND_KINDS, HINTERLAND_REACH, HINTERLAND_CLEAR,
} from './hinterland.js';
import { HINTERLAND_STYLES, HINTERLAND_ERAS, getHinterlandStyle } from './hinterlandStyle.js';
import { buildSetting, distanceOutsideGrid, PROP_SHORE_CLEAR } from './setting.js';
import { PART_ROLES } from './parts.js';
import { readFileSync } from 'node:fs';

const G = 12;
const VAI_HOP_LE = new Set(PART_ROLES);

/** Mọi thứ một dòng bảng HỨA sẽ có mặt trên màn hình. */
function kyVongCua(style) {
  const v = new Set(['roadway', 'hamlet', ...style.infra]);
  if (style.fields !== 'none') v.add('parcel');
  if (style.waterworks !== 'none') v.add('waterwork');
  if (style.wall !== 'none') v.add('rampart');
  if (style.gate) v.add('gatehouse');
  if (style.dock !== 'none') v.add('dock');
  return v;
}

// ─────────────────────────────────────────────────────────────────────────────

test('PHÉP ĐẾM Ở ĐẦU BÊN KIA — kỷ nào khai thứ gì thì phải DỰNG RA thứ ấy', () => {
  // THỬ-CHO-ĐỎ: cho nhánh `style.dock !== 'none'` không đặt gì → đỏ, kể tên 13 kỷ thiếu bến.
  const hut = [];
  for (const era of HINTERLAND_ERAS) {
    const co = new Set(deriveHinterland({ era, gridSize: G }).map((i) => i.kind));
    const thieu = [...kyVongCua(HINTERLAND_STYLES[era])].filter((k) => !co.has(k));
    if (thieu.length) hut.push(`kỷ ${era} thiếu: ${thieu.join(', ')}`);
  }
  assert.deepEqual(hut, [], hut.join(' · '));
});

test('KHÔNG dựng ra thứ bảng KHÔNG khai — chiều ngược của bài trên', () => {
  // Không có chiều này thì cách rẻ nhất để bài trên xanh là dựng đủ mọi loại ở mọi kỷ.
  for (const era of HINTERLAND_ERAS) {
    const co = new Set(deriveHinterland({ era, gridSize: G }).map((i) => i.kind));
    const thua = [...co].filter((k) => !kyVongCua(HINTERLAND_STYLES[era]).has(k));
    assert.deepEqual(thua, [], `kỷ ${era} dựng ra thứ KHÔNG khai: ${thua.join(', ')}`);
  }
});

test('mỗi kỷ dựng ra một vùng phụ cận CÓ THẬT — không kỷ nào rỗng, không kỷ nào 0 tam giác', () => {
  for (const era of HINTERLAND_ERAS) {
    const items = deriveHinterland({ era, gridSize: G });
    assert.ok(items.length >= 10, `kỷ ${era} chỉ có ${items.length} vật thể ngoài lưới`);
    const tam = items.reduce((s, i) => s + i.spec.triangles, 0);
    assert.ok(tam > 0, `kỷ ${era} dựng ra 0 tam giác`);
    const rong = items.filter((i) => i.spec.parts.length === 0);
    assert.equal(rong.length, 0,
      `kỷ ${era} có ${rong.length} vật thể RỖNG (loại: ${[...new Set(rong.map((r) => r.kind))].join(',')})`);
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BẤT BIẾN — ADR-007 và "cao độ không phụ thuộc tiến độ chơi"
// ─────────────────────────────────────────────────────────────────────────────

test('ADR-007 — KHÔNG vật nào của vùng phụ cận chạm vào toạ độ bên trong lưới', () => {
  // Vùng phụ cận nằm NGOÀI lưới. Chạm vào trong là dời chỗ của một công trình đã xây, tức phá
  // "bảo tàng bất động". THỬ-CHO-ĐỎ: bỏ `if (d < HINTERLAND_CLEAR) return false` trong `khoRao`.
  for (const era of HINTERLAND_ERAS) {
    for (const it of deriveHinterland({ era, gridSize: G })) {
      const d = distanceOutsideGrid(it.x, it.y, G);
      assert.ok(d > 0, `kỷ ${era}: ${it.kind} ở (${it.x.toFixed(2)}, ${it.y.toFixed(2)}) nằm TRONG lưới`);
      assert.ok(d >= HINTERLAND_CLEAR - 1e-9,
        `kỷ ${era}: ${it.kind} chỉ cách lưới ${d.toFixed(2)} ô, dưới vành trống ${HINTERLAND_CLEAR}`);
      assert.ok(d <= HINTERLAND_REACH + 1e-9,
        `kỷ ${era}: ${it.kind} xa ${d.toFixed(2)} ô, vượt tầm ${HINTERLAND_REACH}`);
    }
  }
});

test('KHÔNG phụ thuộc tiến độ chơi — gọi kèm DỮ LIỆU RÁC phải ra kết quả y hệt', () => {
  // Cùng khuôn với `buildTerrain`/`deriveOutskirts`: "hàm hiện không nhận tham số đó" là một sự
  // thật rất dễ mất — người sau chỉ cần thêm một tham số tuỳ chọn là bất biến chết trong im lặng.
  for (const era of HINTERLAND_ERAS) {
    const sach = deriveHinterland({ era, gridSize: G });
    const rac = deriveHinterland({
      era, gridSize: G,
      built: ['a', 'b', 'c'], buildings: [1, 2, 3], sessionCount: 999,
      levels: { 1: 3 }, craftingQueue: [{ bpId: 'x' }],
    });
    assert.deepEqual(rac, sach, `kỷ ${era}: vùng phụ cận ĐỔI khi có dữ liệu tiến độ`);
  }
});

test('TẤT ĐỊNH — cùng một kỷ luôn ra cùng một vùng phụ cận', () => {
  for (const era of [1, 6, 11, 15]) {
    assert.deepEqual(deriveHinterland({ era, gridSize: G }), deriveHinterland({ era, gridSize: G }));
  }
});

test('vật KHÔ không được đứng dưới nước; vật ƯỚT phải thật sự ở mép nước', () => {
  // THỬ-CHO-ĐỎ: bỏ vế `setting.insetAt(...) <= -PROP_SHORE_CLEAR` trong `khoRao`.
  for (const era of HINTERLAND_ERAS) {
    const setting = buildSetting({ era, gridSize: G });
    if (!setting.hasWater) continue;
    for (const it of deriveHinterland({ era, gridSize: G })) {
      const ins = setting.insetAt(it.x, it.y);
      if (it.onWater) {
        assert.ok(ins > -1.6,
          `kỷ ${era}: ${it.kind} khai ƯỚT nhưng đứng cách nước ${(-ins).toFixed(2)} ô`);
      } else {
        assert.ok(ins <= -PROP_SHORE_CLEAR + 1e-9,
          `kỷ ${era}: ${it.kind} khô mà lấn nước (inset ${ins.toFixed(2)})`);
      }
    }
  }
});

test('CỔNG nằm đúng trên trục con đường — không phải một khung cửa dựng giữa đồng', () => {
  // Chỉ thị của Đàm: cổng PHẢI nối vào một trục đường thật. Ở đây kiểm bằng hình học chứ không
  // bằng cách đọc mã: cổng phải có một đoạn `roadway` nằm gần nó hơn hẳn một đoạn tường bất kỳ.
  // THỬ-CHO-ĐỎ: đổi `tam` của cổng thành `giua - lechTruc` → đỏ ở kỷ nào có `lechTruc ≠ 0`.
  let soCong = 0;
  for (const era of HINTERLAND_ERAS) {
    const items = deriveHinterland({ era, gridSize: G });
    const duong = items.filter((i) => i.kind === 'roadway');
    for (const cong of items.filter((i) => i.kind === 'gatehouse')) {
      soCong += 1;
      const gan = Math.min(...duong.map((d) => Math.hypot(d.x - cong.x, d.y - cong.y)));
      assert.ok(gan <= 1.6,
        `kỷ ${era}: cổng ở (${cong.x.toFixed(1)}, ${cong.y.toFixed(1)}) cách đoạn đường gần nhất ${gan.toFixed(2)} ô`);
    }
  }
  // Gác chạy-rỗng: nếu không kỷ nào có cổng thì vòng lặp trên chưa bao giờ chạy và bài này rỗng.
  assert.ok(soCong >= 8, `phải có ít nhất 8 cổng trên toàn bảng để bài này có gì mà kiểm, đếm được ${soCong}`);
});

// ─────────────────────────────────────────────────────────────────────────────
// HÌNH HỌC
// ─────────────────────────────────────────────────────────────────────────────

test('MỌI loại hình bảng khai đều DỰNG RA khối thật', () => {
  // ⚠️ Bài này bắt đúng lỗi đã xảy ra thật khi viết file: 17 chỗ khai `role: 'metal'`/`'concrete'`
  // /`'brick'`/`'dirt'`/`'thatch'` — không vai nào có trong `PART_ROLES`, và `safeRole` sẽ NUỐT
  // chúng trong im lặng rồi trả về một vai mặc định.
  //
  // ⚠️ CHỈ duyệt những cặp (loại, kỷ) thật sự XẢY RA, dùng CHÍNH `kyVongCua` — hỏi `dock` ở kỷ 1
  // (`dock: 'none'`) rồi đòi nó ra khối là hỏi một câu vô nghĩa, và câu trả lời đúng của mã lại
  // làm bài test đỏ. Gác chạy-rỗng ở cuối bảo đảm phép lọc ấy không âm thầm bỏ qua cả bảng.
  let soCap = 0;
  const chuaCham = new Set(HINTERLAND_KINDS);
  for (const era of HINTERLAND_ERAS) {
    const style = HINTERLAND_STYLES[era];
    for (const kind of kyVongCua(style)) {
      soCap += 1;
      chuaCham.delete(kind);
      const spec = buildHinterlandSpec({ kind, style, seed: `t|${era}|${kind}` });
      assert.ok(spec.parts.length > 0, `loại "${kind}" (kỷ ${era}) dựng ra 0 khối`);
      assert.ok(spec.triangles > 0, `loại "${kind}" (kỷ ${era}) ra 0 tam giác`);
      assert.ok(spec.height > 0, `loại "${kind}" (kỷ ${era}) cao 0`);
    }
  }
  assert.ok(soCap >= 100, `chỉ duyệt được ${soCap} cặp — phép lọc đang nuốt mất phần lớn bảng`);
  // Và mọi loại hình phải được ÍT NHẤT một kỷ dùng tới: một loại không kỷ nào dùng là mã chết
  // mang hình dạng một tính năng (đúng cơ chế "lùm cây" chết im lặng ở Phase 8D).
  assert.deepEqual([...chuaCham], [], `loại hình KHÔNG kỷ nào dùng tới: ${[...chuaCham].join(', ')}`);
});

test('dock của kỷ khai `dock: none` phải dựng ra RỖNG — chiều ngược của bài trên', () => {
  const spec = buildHinterlandSpec({ kind: 'dock', style: HINTERLAND_STYLES[1], seed: 'x' });
  assert.deepEqual(spec.parts, [], 'kỷ khai không có bến mà hàm dựng vẫn ra khối');
});

test('LOẠI LẠ ra RỖNG, không rơi về một hình mặc định', () => {
  // Rơi về hình mặc định thì một lỗi gõ tên sẽ dựng ra một cái nhà kho ở chỗ đáng lẽ là cây cầu,
  // và nó trông hoàn toàn hợp lý. Rỗng thì phép đếm ở bài đầu file bắt được ngay.
  const spec = buildHinterlandSpec({ kind: 'sân bay', style: getHinterlandStyle(1) });
  assert.deepEqual(spec.parts, []);
  assert.equal(spec.triangles, 0);
});

test('MỌI `role:` viết trong mã nguồn đều nằm trong PART_ROLES — hỏi ở tầng DUY NHẤT còn thấy sự thật', () => {
  /**
   * ⚠️ BÀI NÀY TỪNG ĐƯỢC VIẾT SAI, VÀ CÁI SAI ẤY LÀ MỘT CÁI PHỄU ĐỘI LỐT MỘT HÀNG RÀO.
   *
   * Bản đầu duyệt `spec.parts` rồi hỏi `PART_ROLES.has(p.role)`. Nó **không thể đỏ**: `prism()` và
   * `gable()` gọi `safeRole()` NGAY LÚC TẠO KHỐI, nên một vai lạ đã bị viết lại thành `'wall'`
   * trước khi tới được mảng `parts`. Phép thử ngược (bơm `role: 'concrete'` vào `rampart`) làm đỏ
   * một bài KHÁC chứ không làm đỏ bài này — và chính chỗ "đỏ sai chỗ" ấy mới lộ ra sự thật.
   *
   * Đây là biến thể khó thấy nhất của luật *"một bài test chưa từng thấy đỏ thì chưa phải test"*:
   * không phải CHƯA đỏ, mà là KHÔNG THỂ đỏ, và lý do nằm ở một hàm khác file. Cùng họ với bài học
   * `nut === daGhi` ở ADR-048.
   *
   * ⇒ Tầng duy nhất còn nhìn thấy vai gốc là MÃ NGUỒN. Bài này đọc thẳng file — đúng khuôn
   * `cityPreviewSource.test.js` / `sceneGraphWiring.test.js`. Nó bắt đúng lỗi đã xảy ra thật khi
   * viết `hinterland.js`: 17 chỗ khai `'metal'`/`'concrete'`/`'brick'`/`'dirt'`/`'thatch'`.
   */
  const ma = readFileSync(new URL('./hinterland.js', import.meta.url), 'utf8');
  const la = new Set();
  for (const m of ma.matchAll(/\brole:\s*'([^']+)'/g)) {
    if (!VAI_HOP_LE.has(m[1])) la.add(m[1]);
  }
  assert.deepEqual([...la], [], `vai vật liệu KHÔNG có trong PART_ROLES: ${[...la].join(', ')} — safeRole sẽ nuốt chúng trong im lặng`);

  // Gác chạy-rỗng: nếu regex hỏng thì tập rỗng ở trên vẫn xanh mà chẳng kiểm gì.
  const soVai = [...ma.matchAll(/\brole:\s*'([^']+)'/g)].length;
  assert.ok(soVai >= 60, `chỉ tìm thấy ${soVai} chỗ khai vai — regex đang trượt`);
});

/**
 * ⚠️ BA LOẠI CỐ Ý KHÔNG BIẾN THIÊN, VÀ DANH SÁCH NÀY PHẢI ĐÚNG BẰNG — KHÔNG PHẢI "BAO GỒM".
 *
 * `roadway` · `waterwork` · `railway` là những phần tử TUYẾN: chúng được đặt hàng chục đoạn nối
 * đuôi nhau, và chính sự LẶP LẠI mới làm chúng đọc ra thành MỘT con đường / MỘT con kênh liên tục.
 * Một đoạn đường mỗi đoạn một cỡ thì mắt đọc ra là những mảng nhựa rời rạc — đúng khuyết tật mà
 * `carriagewayShape` đã phải sửa ở Phase 9D.
 *
 * Viết `>=` hay "bao gồm" ở đây là cách một ngoại lệ lặng lẽ nở thành một cái chăn trùm (bài học
 * `TECH_DEBT #52`). Bằng ĐÚNG thì loại thứ tư rơi vào sẽ đỏ, mà một trong ba loại này được sửa cho
 * biến thiên cũng đỏ.
 */
const TUYEN_KHONG_BIEN_THIEN = ['railway', 'roadway', 'waterwork'];

test('MỖI HÌNH biến thiên theo hạt giống — trừ đúng ba phần tử TUYẾN đã kể tên', () => {
  // Bài học Phase 8D: `sides`/`taper` viết cứng thì "40 hạt chỉ ra 2–4 dáng", và lỗi ấy cắn BỐN
  // lần trong một file. Ký tên bằng chính hình học, không bằng hạt giống.
  // THỬ-CHO-ĐỎ: bỏ `unit(seed|dai)` khỏi `terracedHousing` → đỏ đúng ở loại đó.
  const ngheo = [];
  for (const kind of HINTERLAND_KINDS) {
    const van = new Set();
    // `dock` phải hỏi một kỷ CÓ bến; kỷ 9 (Pháp) khai `wharf`.
    const style = HINTERLAND_STYLES[kind === 'dock' ? 9 : 7];
    for (let i = 0; i < 24; i += 1) {
      const spec = buildHinterlandSpec({ kind, style, seed: `v|${kind}|${i}` });
      van.add(spec.parts.map((p) =>
        `${p.role}|${(p.w ?? 0).toFixed(3)}|${(p.h ?? 0).toFixed(3)}|${(p.x ?? 0).toFixed(3)}`).join(';'));
    }
    if (van.size < 4) ngheo.push(kind);
  }
  assert.deepEqual(ngheo.sort(), [...TUYEN_KHONG_BIEN_THIEN].sort(),
    `tập loại KHÔNG biến thiên đã đổi: đo được [${ngheo.join(', ')}]`);
});

test('MỨC CHI TIẾT THẤP phải RẺ HƠN THẬT — ngân sách LOD không được là lời hứa suông', () => {
  // Bài học Phase 8D: đặt trần mức thấp bằng đúng khoảng mà mức cao có thể ra thì một nửa số hạt
  // cho hai mức y hệt nhau, tức cơ chế LOD chạy đủ mà chưa bao giờ tiết kiệm được gì.
  let caoHon = 0;
  for (const kind of HINTERLAND_KINDS) {
    for (let i = 0; i < 8; i += 1) {
      const s = { kind, style: getHinterlandStyle(9), seed: `lod|${kind}|${i}` };
      const cao = buildHinterlandSpec({ ...s, detail: 'high' }).triangles;
      const thap = buildHinterlandSpec({ ...s, detail: 'low' }).triangles;
      assert.ok(thap <= cao, `"${kind}" mức thấp (${thap}) TỐN HƠN mức cao (${cao})`);
      if (thap < cao) caoHon += 1;
    }
  }
  assert.ok(caoHon >= HINTERLAND_KINDS.length,
    `LOD chỉ thật sự cắt được ở ${caoHon} ca — quá ít để gọi là một ngân sách`);
});

test('planHinterland KHÔNG dựng gì khi thiếu bảng — và deriveHinterland từ chối dòng hỏng', () => {
  assert.deepEqual(planHinterland({ era: 3, gridSize: G, style: undefined, setting: null }), []);
  /**
   * Kỷ lạ rơi về dòng NGHÈO NHẤT (kỷ 1) chứ không rơi về một dòng "trung bình" trông hợp lý ở mọi
   * kỷ — một vùng phụ cận thưa thớt bất thường thì dễ nhận ra, một vùng trung bình thì không.
   *
   * ⚠️ So TẬP LOẠI, KHÔNG so danh sách vị trí. Bản đầu của assert này so cả số lượng và ĐỎ — nhưng
   * mã đúng: `getHinterlandStyle` chỉ quyết định BẢNG, còn `key` vẫn đi vào hạt giống và trục
   * đường, nên kỷ 99 có một bố cục riêng đúng như nó phải thế. Phép đo hỏng, không phải mã hỏng.
   */
  assert.deepEqual(
    [...new Set(deriveHinterland({ era: 99, gridSize: G }).map((i) => i.kind))].sort(),
    [...new Set(deriveHinterland({ era: 1, gridSize: G }).map((i) => i.kind))].sort(),
  );
});
