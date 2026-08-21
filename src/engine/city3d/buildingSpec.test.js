/**
 * buildingSpec.test.js — khoá lại ngôn ngữ hình khối 3 trục.
 *
 * Ba nhóm bất biến, xếp theo mức thiệt hại nếu vỡ:
 *   1. **TẤT ĐỊNH** — công trình không bao giờ đổi hình. Vỡ cái này là bảo tàng "động đậy":
 *      Đàm mở lại kỷ cũ và thấy một thành phố khác. Không có cách nào phát hiện bằng mắt cho tới
 *      khi đã muộn, nên phải có test.
 *   2. **NGÂN SÁCH** — vượt trần tam giác = điện thoại nóng. Đây là thứ duy nhất trong cả nhánh 3D
 *      mà hậu quả rơi thẳng vào phần cứng của Đàm.
 *   3. **BA TRỤC THỰC SỰ KHÁC NHAU** — nếu 15 kỷ cho ra 15 hình giống hệt thì cả file
 *      `eraStyle.js` là công vô ích, mà build vẫn xanh. Đây chính là lời phàn nàn "quá đơn giản"
 *      ở dạng máy kiểm được.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from '../constants.js';
import { buildBuildingSpec, buildScaffoldSpec, emitRoof } from './buildingSpec.js';
import {
  ERA_STYLES, getEraStyle, getVernacularStyle, ROOF_KINDS, WINDOW_KINDS,
} from './eraStyle.js';
import { ARCHETYPES, getMassing } from './archetypes.js';
import { MAX_SIDES, MIN_SIDES, PART_ROLES, countTriangles } from './parts.js';
import { SIGNATURE_KINDS, emitSignature } from './signature.js';
import { parseCssColor } from './palette3d.js';
import {
  MAX_TRIANGLES_PER_BUILDING,
  MAX_TRIANGLES_PER_CITY,
  describeBudget,
  specTriangles,
} from './budget.js';
import {
  CORNICE_SPREAD, PLINTH_SPREAD, COURSE_SPREAD, MAX_COURSES, SILL_RELIEF, WINDOW_RELIEF,
} from './buildingSpec.js';

const ROLE_SET = new Set(PART_ROLES);
const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);
/** So sánh số thực do nhân/chia sinh ra. Đòi bằng tuyệt đối là canh phép làm tròn, không canh luật. */
const gần = (a, b) => Math.abs(a - b) < 1e-9;

/** Mọi bản vẽ có thật, kèm đủ ba trục — dùng lại cho gần hết bài test bên dưới. */
const ALL_BLUEPRINTS = Object.entries(BLUEPRINT_CATALOG).flatMap(([eraKey, list]) =>
  list.map((bp) => ({
    bpId: bp.id,
    era: Number(eraKey),
    type: BUILDING_EFFECTS[bp.id]?.type,
    rarity: bp.rarity,
    label: bp.label,
  })));

/**
 * "Chữ ký hình học": bảng đếm (hình, số cạnh, độ thóp, vai màu). Hai công trình có chữ ký khác
 * nhau thì mắt CHẮC CHẮN phân biệt được; chữ ký giống nhau thì gần như chắc chắn là trông y hệt.
 * Cố ý bỏ qua toạ độ — dịch một khối sang trái 2cm không phải là "khác kiến trúc".
 */
function signature(spec) {
  const counts = new Map();
  for (const p of spec.parts) {
    const key = `${p.shape}|${p.sides ?? '-'}|${(p.taper ?? 1).toFixed(1)}|${p.role}`;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([k, v]) => `${k}x${v}`).join(';');
}

// ─── 1. TẤT ĐỊNH ─────────────────────────────────────────────────────────────

test('tất định: cùng đầu vào → mô tả byte-identical, gọi bao nhiêu lần cũng vậy', () => {
  for (const bp of ALL_BLUEPRINTS.slice(0, 12)) {
    const a = JSON.stringify(buildBuildingSpec({ ...bp, level: 2 }));
    const b = JSON.stringify(buildBuildingSpec({ ...bp, level: 2 }));
    assert.equal(a, b, `${bp.bpId} đổi hình giữa hai lần gọi`);
  }
});

/**
 * Bỏ chú thích khỏi mã nguồn trước khi soi.
 * ⚠️ Cần thiết, không phải cầu kỳ: chính các file này có những dòng chú thích GIẢI THÍCH vì sao
 * cấm `Math.random`. Quét thẳng văn bản thô thì test đỏ vì đọc trúng lời cảnh báo của chính nó —
 * một bài test bắt nhầm còn tệ hơn không có test, vì lần sau người ta sẽ nới nó ra cho hết đỏ.
 */
function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('tất định: KHÔNG có Math.random / Date trong tầng mô tả', async () => {
  // Chặn ở mức mã nguồn, vì một lời gọi `Math.random` lọt vào sẽ chỉ lộ ra sau nhiều tháng —
  // đúng lúc Đàm mở lại một kỷ cũ và thấy nó khác đi.
  const { readFileSync } = await import('node:fs');
  const files = ['buildingSpec.js', 'eraStyle.js', 'archetypes.js', 'parts.js', 'budget.js'];
  for (const name of files) {
    const code = stripComments(readFileSync(new URL(name, import.meta.url), 'utf8'));
    assert.ok(!/Math\.random/.test(code), `${name} dùng Math.random — phá vỡ bất biến tất định`);
    assert.ok(!/new Date\(|Date\.now/.test(code), `${name} dùng Date — phá vỡ bất biến tất định`);
    assert.ok(!/from '(three|\.\.\/\.\.\/store|\.\.\/\.\.\/components)/.test(code),
      `${name} import ra ngoài tầng engine`);
  }
});

test('bộ lọc chú thích của bài test trên thật sự hoạt động', () => {
  // Tự kiểm: nếu `stripComments` lặng lẽ hỏng thì bài test ở trên sẽ xanh vĩnh viễn dù có vi phạm.
  assert.equal(stripComments('/* nói về Math.random */ const a = 1;').includes('Math.random'), false);
  assert.equal(stripComments('// cấm Date.now\nconst b = 2;').includes('Date.now'), false);
  assert.equal(stripComments('const c = Math.random();').includes('Math.random'), true,
    'phải GIỮ LẠI mã thật, nếu không bài test trên vô nghĩa');
});

// ─── 2. SINH ĐƯỢC & HỢP LỆ ───────────────────────────────────────────────────

test('cả 75 công trình đều sinh được, không khối nào hỏng', () => {
  assert.equal(ALL_BLUEPRINTS.length, 75, 'catalog phải có đúng 75 bản vẽ');
  for (const bp of ALL_BLUEPRINTS) {
    for (const level of [1, 2, 3]) {
      const spec = buildBuildingSpec({ ...bp, level });
      assert.ok(spec.parts.length > 0, `${bp.bpId} cấp ${level} ra mô tả rỗng`);
      assert.ok(spec.height > 0, `${bp.bpId} cấp ${level} cao 0`);
      for (const p of spec.parts) {
        for (const field of ['x', 'y', 'z', 'w', 'h', 'd']) {
          assert.ok(Number.isFinite(p[field]), `${bp.bpId}: ${field} không phải số hữu hạn`);
        }
        assert.ok(ROLE_SET.has(p.role), `${bp.bpId}: vai màu lạ "${p.role}"`);
        if (p.shape === 'prism') {
          assert.ok(p.sides >= MIN_SIDES && p.sides <= MAX_SIDES, `${bp.bpId}: số cạnh ${p.sides}`);
          assert.ok(p.taper >= 0 && p.taper <= 1, `${bp.bpId}: taper ${p.taper}`);
        }
      }
    }
  }
});

test('dữ liệu rác không làm nổ màn hình Thành Phố', () => {
  const junk = [
    {},
    { bpId: 'bp_khong_ton_tai', era: 99, type: 'không-có-loại-này', rarity: 'huyền-thoại' },
    { bpId: null, era: NaN, level: -5 },
    { bpId: 'x', era: 0, rarity: null, level: 999 },
  ];
  for (const input of junk) {
    const spec = buildBuildingSpec(input);
    assert.ok(spec.parts.length > 0, 'phải ra khối mặc định chứ không được rỗng');
    assert.ok(Number.isFinite(spec.height) && spec.height > 0);
  }
});

// ─── 3. NÂNG CẤP PHẢI NHÌN THẤY ──────────────────────────────────────────────

test('cấp 3 luôn cao hơn cấp 2, cấp 2 luôn cao hơn cấp 1', () => {
  for (const bp of ALL_BLUEPRINTS) {
    const h = [1, 2, 3].map((level) => buildBuildingSpec({ ...bp, level }).height);
    assert.ok(h[1] > h[0], `${bp.bpId}: nâng lên cấp 2 mà không cao thêm`);
    assert.ok(h[2] > h[1], `${bp.bpId}: nâng lên cấp 3 mà không cao thêm`);
  }
});

// ─── 4. BA TRỤC THỰC SỰ TẠO KHÁC BIỆT ────────────────────────────────────────

test('TRỤC KỶ: 15 kỷ cho ra 15 kiến trúc phân biệt được', () => {
  const seen = new Map();
  for (const era of Object.keys(ERA_STYLES).map(Number)) {
    const sig = signature(buildBuildingSpec({
      bpId: `bp_mau_${era}`, era, type: 'infrastructure', rarity: 'rare', level: 2,
    }));
    const clash = seen.get(sig);
    assert.equal(clash, undefined, `kỷ ${era} trông y hệt kỷ ${clash} — trục kỷ không có tác dụng`);
    seen.set(sig, era);
  }
  assert.equal(seen.size, 15);
});

test('TRỤC LOẠI: mỗi loại công trình cho ra một khối tích khác nhau', () => {
  const seen = new Set();
  for (const type of Object.keys(ARCHETYPES)) {
    const sig = signature(buildBuildingSpec({ bpId: `bp_${type}`, era: 6, type, rarity: 'epic', level: 1 }));
    assert.ok(!seen.has(sig), `loại "${type}" trùng khối tích với loại khác`);
    seen.add(sig);
  }
  // ⚠️ ĐẾM THEO CHÍNH BẢNG, KHÔNG VIẾT CỨNG CON SỐ. Dòng này trước đây là `assert.equal(seen.size, 4)`
  // và nó đỏ ngay khi Phase 7C thêm 3 nguyên mẫu nhà dân — không phải vì mã hỏng mà vì **phép đo đã
  // già đi**, đúng bài học đã ghi ở `CLAUDE.md` (bài "kỳ quan đối xứng" lọc tháp góc bằng ngưỡng
  // tuyệt đối rồi đỏ oan khi `spread` co lại). Việc dòng này canh là "vòng lặp có chạy hết bảng
  // không", nên nó phải HỎI chính cái bảng ấy; viết cứng số là gài mìn cho lần thêm nguyên mẫu sau.
  assert.equal(seen.size, Object.keys(ARCHETYPES).length);
});

test('TRỤC ĐỘ HIẾM: quý hơn = nhiều mảng nhà hơn, cao hơn, nhiều chi tiết hơn', () => {
  const base = { bpId: 'bp_do_hiem', era: 7, type: 'economy', level: 1 };
  const common = buildBuildingSpec({ ...base, rarity: 'common' });
  const rare = buildBuildingSpec({ ...base, rarity: 'rare' });
  const epic = buildBuildingSpec({ ...base, rarity: 'epic' });

  assert.ok(getMassing('economy', 'epic').length > getMassing('economy', 'common').length);
  assert.ok(rare.height > common.height, 'rare phải cao hơn common');
  assert.ok(epic.height > rare.height, 'epic phải cao hơn rare');
  assert.ok(epic.parts.length > rare.parts.length, 'epic phải nhiều chi tiết hơn rare');
  assert.ok(rare.parts.length > common.parts.length, 'rare phải nhiều chi tiết hơn common');
});

test('kỳ quan luôn đối xứng tuyệt đối, kể cả ở kỷ có nét vẽ thô nhất', () => {
  // Kỷ 1 có `rough: 0.9` — cao nhất bảng. Kỳ quan đứng giữa thành phố mà xiêu vẹo thì cả bố cục
  // mất điểm tựa, nên `archetype.symmetric` phải thắng được `style.rough`.
  const spec = buildBuildingSpec({ bpId: 'bp_tho_pho_linh', era: 1, type: 'wonder', rarity: 'epic', level: 1 });

  // Chỉ soi KHỐI KẾT CẤU. Trang trí (`deco`) được phép lệch: kỳ quan kỷ 1 là bãi đá thờ, mấy tảng
  // đá dựng quanh nó mà thẳng hàng răm rắp mới là sai.
  const structural = spec.parts.filter((p) => !p.deco);
  assert.ok(structural.length > 0);
  for (const p of structural) {
    assert.equal(p.ry, 0, 'khối kết cấu của kỳ quan bị xoay lệch');
  }
  assert.ok(spec.parts.some((p) => p.deco && p.ry !== 0), 'trang trí phải được phép lệch tự nhiên');

  // Bốn tháp góc phải đối xứng từng đôi một qua tâm.
  // ⚠️ NHẬN DIỆN THÁP BẰNG VAI + "CÓ LỆCH TÂM", KHÔNG BẰNG NGƯỠNG TUYỆT ĐỐI.
  // Bản cũ lọc `Math.abs(p.x) > 0.5`, hợp lý khi mọi kỷ có cùng bề ngang. Khi `spread` ra đời
  // (2026-08-14), kỷ 1 co lại còn 0,72 nên bốn tháp lùi về ±0,475 — LỌT DƯỚI ngưỡng, và bài test
  // đỏ với thông báo "kỳ quan epic phải có 4 tháp góc" trong khi bốn tháp vẫn còn nguyên và vẫn
  // đối xứng hoàn hảo. Tức PHÉP ĐO hỏng chứ không phải mã hỏng — đúng cái luật của dự án này:
  // *số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước, kiểm mã sau.* Trong danh sách khối kết cấu,
  // vai `trim` mà lệch khỏi tâm theo CẢ HAI trục thì chỉ có thể là tháp góc (bệ và thân đều nằm
  // đúng tâm), nên phép lọc này không phụ thuộc kỷ nào đang dựng.
  const towers = structural.filter((p) => p.role === 'trim'
    && Math.abs(p.x) > 1e-6 && Math.abs(p.z) > 1e-6);
  assert.ok(towers.length >= 4, 'kỳ quan epic phải có 4 tháp góc');
  const sumX = towers.reduce((s, p) => s + p.x, 0);
  const sumZ = towers.reduce((s, p) => s + p.z, 0);
  assert.ok(Math.abs(sumX) < 1e-9 && Math.abs(sumZ) < 1e-9, 'bốn tháp góc không đối xứng qua tâm');
});

test('TỈ LỆ: không công trình nào cao vống thành ống khói', () => {
  // ⚠️ Bài test này sinh ra từ một lỗi thật nhìn thấy trên ảnh chụp thử: "Kho Lúa" của kỷ 2 mang
  // loại `defense`, mà nguyên mẫu phòng thủ lại cho tháp góc CAO HƠN thân chính — kết quả là hai
  // cái ống khói đứng giữa một ngôi làng mái tranh. Lỗi thuộc loại nguy hiểm nhất: mọi test đều
  // xanh, ngân sách tam giác vẫn ổn, chỉ có mắt người mới bắt được. Khoá tỉ lệ lại là cách biến
  // "nhìn thấy sai" thành "máy tự chặn".
  //
  // Trần 2,4 cho phần lớn các kỷ. Ba kỷ được nới lên 3,2 vì CHIỀU CAO CHÍNH LÀ BẢN SẮC của
  // chúng, không phải lỗi tỉ lệ: kỷ 11 (Phố Wall — đúng thời điểm nhà chọc trời ra đời, và ngữ
  // pháp của nó có `spire`), kỷ 14 (tháp kính) và kỷ 15 (khối lơ lửng). Danh sách này là một
  // phát biểu về mỹ thuật, nên nó nằm ở test chứ không lẫn vào mã dựng hình.
  const CAP = 2.4;
  const TALL_ERAS = new Set([11, 14, 15]);

  for (const bp of ALL_BLUEPRINTS) {
    const spec = buildBuildingSpec({ ...bp, level: 3 });
    const ratio = spec.height / (spec.span || 1);
    const cap = TALL_ERAS.has(bp.era) ? 3.2 : CAP;
    assert.ok(
      ratio <= cap,
      `${bp.bpId} (kỷ ${bp.era}, ${bp.type}/${bp.rarity}): cao ${spec.height.toFixed(2)} / rộng ${spec.span.toFixed(2)} = ${ratio.toFixed(2)} — vượt trần ${cap}`,
    );
  }
});

test('TỈ LỆ: tháp góc không được cao hơn thân chính quá một tầng', () => {
  // Khoá chính cái luật vừa nêu ở `archetypes.js`, để lần sau ai sửa bảng mặt bằng thì biết ngay.
  for (const type of Object.keys(ARCHETYPES)) {
    for (const rarity of ['common', 'rare', 'epic']) {
      const masses = getMassing(type, rarity);
      const mainStories = Math.max(...masses.filter((m) => !m.low && !m.tower).map((m) => m.s), 0);
      for (const tower of masses.filter((m) => m.tower)) {
        assert.ok(
          tower.s <= mainStories + 1,
          `${type}/${rarity}: tháp góc ${tower.s} tầng trên thân ${mainStories} tầng — chênh quá 1`,
        );
      }
    }
  }
});

// ─── 5. NGÂN SÁCH ────────────────────────────────────────────────────────────

test('NGÂN SÁCH: không công trình nào vượt trần tam giác', () => {
  let worst = { tris: 0, id: '' };
  for (const bp of ALL_BLUEPRINTS) {
    const tris = specTriangles(buildBuildingSpec({ ...bp, level: 3 }));
    if (tris > worst.tris) worst = { tris, id: `${bp.bpId} (kỷ ${bp.era})` };
    assert.ok(
      tris <= MAX_TRIANGLES_PER_BUILDING,
      `${bp.bpId} kỷ ${bp.era} cấp 3 = ${tris} tam giác, vượt trần ${MAX_TRIANGLES_PER_BUILDING}`,
    );
  }
  console.log(`   [ngân sách] công trình nặng nhất: ${worst.id} — ${describeBudget(worst.tris, MAX_TRIANGLES_PER_BUILDING)}`);
});

test('NGÂN SÁCH: không thành phố nào vượt trần tam giác', () => {
  let worst = { tris: 0, era: 0 };
  for (const [eraKey, list] of Object.entries(BLUEPRINT_CATALOG)) {
    const era = Number(eraKey);
    const tris = list.reduce((sum, bp) => sum + specTriangles(buildBuildingSpec({
      bpId: bp.id, era, type: BUILDING_EFFECTS[bp.id]?.type, rarity: bp.rarity, level: 3,
    })), 0);
    if (tris > worst.tris) worst = { tris, era };
    assert.ok(
      tris <= MAX_TRIANGLES_PER_CITY,
      `kỷ ${era} đủ 5 công trình cấp 3 = ${tris} tam giác, vượt trần ${MAX_TRIANGLES_PER_CITY}`,
    );
  }
  console.log(`   [ngân sách] thành phố nặng nhất: kỷ ${worst.era} — ${describeBudget(worst.tris, MAX_TRIANGLES_PER_CITY)}`);
});

test('đếm tam giác khớp công thức của từng hình nguyên thuỷ', () => {
  assert.equal(countTriangles({ shape: 'prism', sides: 4, taper: 1 }), 12, 'hộp = 12 tam giác');
  assert.equal(countTriangles({ shape: 'prism', sides: 4, taper: 0 }), 6, 'kim tự tháp = 6');
  assert.equal(countTriangles({ shape: 'prism', sides: 8, taper: 1 }), 28, 'trụ 8 cạnh = 28');
  assert.equal(countTriangles({ shape: 'gable' }), 8, 'mái dốc hai phía = 8');
  assert.equal(countTriangles(null), 0);
});

// ─── 6. BẢNG NGỮ PHÁP HỢP LỆ ─────────────────────────────────────────────────

test('bảng ngữ pháp 15 kỷ: đủ trường, giá trị nằm trong danh mục cho phép', () => {
  const roofs = new Set(ROOF_KINDS);
  const windows = new Set(WINDOW_KINDS);
  for (let era = 1; era <= 15; era += 1) {
    const style = getEraStyle(era);
    assert.ok(style, `thiếu ngữ pháp cho kỷ ${era}`);
    assert.ok(roofs.has(style.roof), `kỷ ${era}: kiểu mái lạ "${style.roof}"`);
    assert.ok(windows.has(style.windows), `kỷ ${era}: kiểu cửa sổ lạ "${style.windows}"`);
    assert.ok(style.rough >= 0 && style.rough <= 1, `kỷ ${era}: rough ngoài [0,1]`);
    assert.ok(style.storyHeight > 0 && style.storyHeight < 2, `kỷ ${era}: chiều cao tầng vô lý`);
    assert.ok(Array.isArray(style.motifs) && style.motifs.length > 0, `kỷ ${era}: thiếu chi tiết đặc trưng`);
  }
});

test('kỷ lạ vẫn tra được ngữ pháp mặc định', () => {
  for (const era of [0, 16, -3, NaN, undefined, 'bảy']) {
    assert.ok(getEraStyle(era), `kỷ ${era} không tra được`);
  }
});

test('MỖI KỶ MỘT ĐẤT NƯỚC, và 15 nước không được trùng nhau', () => {
  // Đàm: *"mỗi kỷ có thể lấy một đất nước làm biểu tượng — ví dụ thời phục hưng có thể lấy nhà của
  // Ý hoặc Pháp"*. Bài test khoá cả hai vế: có đủ, và KHÔNG TRÙNG. Vế thứ hai mới là vế dễ vỡ —
  // hai kỷ cùng lấy một nước thì hành trình 15 kỷ mất đi đúng cái cảm giác "đi vòng quanh thế
  // giới" mà nó được sinh ra để tạo, và không có gì đỏ lên khi điều đó xảy ra.
  const seen = new Map();
  for (let era = 1; era <= 15; era += 1) {
    const style = getEraStyle(era);
    assert.ok(style.country && style.country.trim(), `kỷ ${era}: thiếu đất nước biểu tượng`);
    assert.ok(style.landmark && style.landmark.trim(), `kỷ ${era}: thiếu công trình lấy làm mẫu`);
    assert.ok(!seen.has(style.country),
      `kỷ ${era} và kỷ ${seen.get(style.country)} cùng lấy "${style.country}" làm biểu tượng`);
    seen.set(style.country, era);
  }
  // Hai nước Đàm nêu đích danh phải nằm đúng chỗ anh nêu.
  assert.equal(getEraStyle(7).country, 'Ý', 'kỷ Phục Hưng phải là Ý — Đàm nêu đích danh');
  assert.equal(getEraStyle(9).country, 'Pháp', 'kỷ Khai Sáng phải là Pháp — Đàm nêu đích danh');
});

test('MỖI KỶ PHẢI KHAI MỘT MÀU VẬT LIỆU LỢP ĐỌC ĐƯỢC — thiếu là lặng lẽ tụt về bảng màu cũ', () => {
  // ⚠️ BÀI NÀY CANH DỮ LIỆU NGƯỜI VIẾT RA, KHÔNG CANH MÃ — và đó là chỗ thật sự hở.
  // `palette3d.js` tra màu mái bằng `parseCssColor(getEraStyle(era)?.roofColor) ?? era`. Dấu `??`
  // ấy là một đường lùi cần thiết (dữ liệu cloud hỏng thì vẫn phải ra được bảng màu), nhưng nó
  // cũng có nghĩa là: một kỷ **thiếu** `roofColor`, hoặc gõ sai màu, sẽ lặng lẽ quay về đúng con
  // bug mà Phase 6B vừa đi sửa — mái suy từ MÀU NHẤN GIAO DIỆN — cho riêng kỷ đó. Không ném lỗi,
  // không cảnh báo, không lint, không build đỏ. Triệu chứng duy nhất: đình làng Bắc Bộ lợp mái tím.
  // ⚠️ Và các hàng rào ở `palette3d.test.js` KHÔNG bắt được ca này: hỏng MỘT kỷ trong 15 thì trung
  // vị 105 cặp gần như không nhúc nhích. Một bài test đo cả bảng thì mù với lỗi của một ô.
  const seen = new Map();
  for (let era = 1; era <= 15; era += 1) {
    const { roofColor } = getEraStyle(era);
    const rgb = parseCssColor(roofColor);
    assert.ok(rgb, `kỷ ${era}: \`roofColor\` = ${JSON.stringify(roofColor)} không đọc được ⇒ mái kỷ này `
      + 'sẽ lặng lẽ suy từ màu nhấn giao diện, đúng con bug Phase 6B vừa sửa');

    // Trùng màu vật liệu = hai kỷ lợp cùng một thứ. Có thể đúng ngoài đời (nhiều nước dùng ngói
    // đất nung), nhưng trùng ĐÚNG TỪNG BYTE thì là chép-dán, không phải lựa chọn.
    assert.ok(!seen.has(roofColor),
      `kỷ ${era} và kỷ ${seen.get(roofColor)} khai y hệt \`roofColor: '${roofColor}'\``);
    seen.set(roofColor, era);
  }

  // Vật liệu lợp có thật thì không rực như màu nhấn giao diện. Canh ở ĐẦU VÀO (thứ người viết gõ),
  // khác hẳn bài trần độ tươi ở `palette3d.test.js` vốn canh ĐẦU RA sau khi mã đã kẹp — kẹp xong
  // thì con số nào cũng vừa, nên chỉ canh đầu ra là canh chính cái kẹp chứ không canh dữ liệu.
  for (let era = 1; era <= 15; era += 1) {
    const { r, g, b } = parseCssColor(getEraStyle(era).roofColor);
    const mx = Math.max(r, g, b) / 255;
    const mn = Math.min(r, g, b) / 255;
    const l = (mx + mn) / 2;
    const s = mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1));
    assert.ok(s <= 0.85,
      `kỷ ${era} khai \`roofColor\` tươi ${s.toFixed(2)} — đó là màu nhấn giao diện chứ không phải `
      + 'vật liệu lợp. Ngói men rực nhất bảng (kỷ 4, Tử Cấm Thành) cũng chỉ 0,80.');
  }
});

test('NHÀ HIỆN ĐẠI KHÔNG ĐƯỢC GIỐNG NHÀ THỜI ĐỒ ĐỒNG: 15 kỷ phải trải chiều cao thật sự', () => {
  // ⚠️ ĐÂY LÀ BÀI TEST QUAN TRỌNG NHẤT CỦA FILE NÀY, và nó sinh ra từ một câu của Đàm chứ không
  // phải từ một lỗi crash: *"không thể nào nhà hiện đại lại giống nhà thời đồ đồng được"*.
  // Đo lúc đó: kỷ 1 cao trung bình 1,81 · kỷ 14 cao 2,05 — chênh 13%, cả bảng trải 1,88 lần, và
  // lâu đài kỷ 5 (2,28) còn CAO HƠN cao ốc kính. Mọi bài test đều xanh, ngân sách tam giác vẫn
  // thừa, không một dòng lint nào đỏ. Đúng loại lỗi chỉ mắt người mới bắt được — nên nó phải được
  // đổi thành một con số máy tự canh, y như đã làm với "công trình cao vống thành ống khói".
  const avg = [];
  for (let era = 1; era <= 15; era += 1) {
    const bps = ALL_BLUEPRINTS.filter((b) => b.era === era);
    const hs = bps.map((b) => buildBuildingSpec({ ...b, level: 3 }).height);
    avg[era] = hs.reduce((s, h) => s + h, 0) / hs.length;
  }

  // (a) Cả bảng phải trải đủ rộng. Ngưỡng 2,8 đặt DƯỚI giá trị đo được (3,27) và TRÊN hẳn vùng
  // hỏng (1,88) — hàng rào, không phải cái phễu.
  const lo = Math.min(...avg.slice(1));
  const hi = Math.max(...avg.slice(1));
  assert.ok(hi / lo >= 2.8,
    `15 kỷ chỉ trải ${(hi / lo).toFixed(2)} lần chiều cao — thấp nhất ${lo.toFixed(2)}, cao nhất `
    + `${hi.toFixed(2)}. Dưới 2,8 thì mắt đọc ra "cùng một thành phố tô màu khác"`);

  // (b) VÀ PHẢI ĐÚNG CHIỀU. Vế (a) một mình vẫn xanh nếu túp lều là thứ cao nhất bảng — đúng cái
  // trạng thái hỏng có thật ở trên (kỷ 5 cao hơn kỷ 14). Nên phải nêu đích danh: tháp kính cao
  // hơn lều da thú, và cao hơn nhiều.
  assert.ok(avg[14] >= avg[1] * 2.5,
    `tháp kính kỷ 14 cao ${avg[14].toFixed(2)} còn lều da thú kỷ 1 cao ${avg[1].toFixed(2)} `
    + '⇒ chưa tới 2,5 lần, vẫn là đúng lời phàn nàn của Đàm');
  assert.ok(avg[15] > avg[14] && avg[14] > avg[13],
    'ba kỷ cuối phải cao dần — đó là phần thưởng nhìn thấy được của việc đi hết 15 kỷ');

  // (c) Và bốn kỷ đầu — giai đoạn Đàm gặp NHIỀU NHẤT vì ai cũng bắt đầu từ đó — phải thấp hơn hẳn
  // mức trung bình, nếu không thì "thành phố lớn lên theo thời gian" không có điểm xuất phát thấp.
  const overall = avg.slice(1).reduce((s, h) => s + h, 0) / 15;
  for (const era of [1, 2]) {
    assert.ok(avg[era] < overall * 0.85,
      `kỷ ${era} cao ${avg[era].toFixed(2)}, gần bằng mức trung bình ${overall.toFixed(2)} — `
      + 'thời tiền sử mà không thấp hơn hẳn thì cả hành trình mất điểm xuất phát');
  }
});

// ─── 7. GIÀN GIÁO — CÔNG TRÌNH ĐANG XÂY ──────────────────────────────────────

test('giàn giáo cao dần theo tiến độ, và đủ 0..1 đều dựng được', () => {
  const heights = [0, 0.25, 0.5, 0.75, 1].map((progress) =>
    buildScaffoldSpec({ bpId: 'bp_dang_xay', era: 6, progress }).height);

  for (let i = 1; i < heights.length; i += 1) {
    assert.ok(heights[i] > heights[i - 1], `tiến độ tăng mà giàn giáo không cao thêm (bước ${i})`);
  }

  // ⚠️ HƯỚNG THÔI CHƯA ĐỦ — PHẢI KHOÁ CẢ ĐỘ LỚN.
  // Đoạn trên chỉ đòi "cao hơn bước trước". Một bản sửa làm giàn giáo lớn lên 1,02 lần từ đầu tới
  // cuối vẫn thoả sạch, trong khi mắt thì KHÔNG THẤY GÌ — mà "nhìn thấy thành phố lớn lên sau mỗi
  // phiên" chính là lời hứa game hoá cốt lõi nhất của cả dự án. Đây đúng cái bẫy "ngưỡng chỉ chặn
  // một phía thì là cái phễu" đã gặp ở mặt đất ban đêm, chỉ khác chỗ: ở đây phễu nằm ở ĐỘ LỚN.
  // Số 3 lấy từ giá trị đo được thật (3,48 lần) và đặt DƯỚI nó, đúng nguyên tắc hàng rào phải nằm
  // dưới giá trị đang chạy nhưng trên vùng hỏng.
  const ratio = heights[heights.length - 1] / heights[0];
  assert.ok(ratio >= 3,
    `giàn giáo chỉ lớn lên ${ratio.toFixed(2)} lần từ lúc khởi công tới lúc sắp xong `
    + '⇒ mắt không đọc ra "mỗi phiên xây thêm được một ít", lời hứa game hoá thành lời suông');

  // ⚠️ VÀ NHỮNG PHIÊN CUỐI CÙNG KHÔNG ĐƯỢC "CHẾT".
  // Khung gỗ CỐ Ý bị kẹp ở `fullHeight` (giàn giáo luôn vượt lên trên phần đã xây, nên khi tường
  // xây gần tới nơi thì khung hết chỗ cao thêm) — từ khoảng 78% tiến độ trở đi, chiều cao tổng
  // đứng yên. Điều đó CHẤP NHẬN ĐƯỢC, nhưng chỉ với đúng một điều kiện: phải còn thứ khác đổi,
  // nếu không thì 1–2 phiên cuối — đúng lúc hồi hộp nhất — sẽ không thấy gì nhúc nhích.
  // Thứ đổi là bức tường đá bên trong dâng lên cho đầy khung. Bài này khoá điều đó.
  const stoneHeight = (progress) => {
    const spec = buildScaffoldSpec({ bpId: 'bp_dang_xay', era: 6, progress });
    return spec.parts.filter((p) => p.role === 'stone').reduce((max, p) => Math.max(max, p.h), 0);
  };
  assert.ok(stoneHeight(1) > stoneHeight(0.8) * 1.1,
    `từ 80% tới xong, tường trong lòng giàn giáo chỉ dâng từ ${stoneHeight(0.8).toFixed(3)} lên `
    + `${stoneHeight(1).toFixed(3)} ⇒ mấy phiên cuối cùng không có gì nhúc nhích`);

  // Tiến độ rác không được làm nổ
  for (const progress of [NaN, -1, 5, null, undefined]) {
    const spec = buildScaffoldSpec({ bpId: 'x', era: 3, progress });
    assert.ok(spec.parts.length > 0 && spec.height > 0);
  }
});

test('giàn giáo tất định như công trình hoàn thiện', () => {
  const a = JSON.stringify(buildScaffoldSpec({ bpId: 'bp_x', era: 9, progress: 0.6 }));
  const b = JSON.stringify(buildScaffoldSpec({ bpId: 'bp_x', era: 9, progress: 0.6 }));
  assert.equal(a, b);
});

test('MỌI KỶ ĐỀU PHẢI CÓ BỀ MẶT MANG MÀU KỶ — kể cả kỷ mái bằng', () => {
  // ⚠️ BÀI NÀY SINH RA TỪ `TECH_DEBT.md` #18, và nó bắt một loại lỗi mà TOÀN BỘ tầng bảng màu
  // không thể nhìn thấy: **màu đúng, ánh sáng đúng, nhưng KHÔNG CÓ BỀ MẶT NÀO ĐỂ MÀU ẤY NÓI RA.**
  // Ba kỷ 12/13/14 đều dùng `roof: 'flat'`, mà nhánh 'flat' của `roofParts` khi đó chỉ đẩy đúng
  // MỘT khối với vai `trim` — vai TRUNG TÍNH thuộc họ tường, chỉ ngấm 0,18 sắc kỷ. Nghĩa là ba kỷ
  // ấy chưa bao giờ hiện lấy một milimét vuông vai `roof` nào.
  // Bài test màu mái ("15 kỷ phải ra 15 màu") vẫn XANH suốt, vì nó đo MÀU trong bảng chứ không hỏi
  // màu ấy có được đem vẽ ra hay không. Đo trên ảnh thật thì kỷ 12 ↔ 13 chỉ cách 6,4/255 (ngưỡng
  // mắt ~12). Sau khi thêm tấm phủ mang vai `roof`: **0/105 cặp kỷ còn dưới ngưỡng** (trước là 5).
  // ⇒ Bài học đáng giữ: một bài test về BẢNG MÀU không bao giờ thay thế được một bài test về việc
  // màu đó có xuất hiện trong HÌNH HỌC hay không. Hai câu hỏi khác nhau.
  for (const bp of ALL_BLUEPRINTS) {
    for (const level of [1, 2, 3]) {
      const spec = buildBuildingSpec({ ...bp, level });
      assert.ok(spec.parts.some((part) => part.role === 'roof'),
        `kỷ ${bp.era} · bản vẽ "${bp.bpId}" cấp ${level} (kiểu mái "${getEraStyle(bp.era).roof}") `
        + 'không có phần nào mang vai `roof` ⇒ sắc kỷ không có bề mặt nào để hiện ra, và kỷ này sẽ '
        + 'trông giống mọi kỷ mái bằng khác dù bảng màu của nó hoàn toàn đúng');
    }
  }

  // Và khoá luôn cái nhánh đã hỏng, để không ai lặng lẽ bỏ tấm phủ đi lần nữa.
  const flatEras = Object.keys(ERA_STYLES).map(Number).filter((e) => getEraStyle(e).roof === 'flat');
  assert.ok(flatEras.length >= 3, 'bảng kỷ đổi rồi — xem lại bài test này');
  for (const era of flatEras) {
    const bp = ALL_BLUEPRINTS.find((b) => b.era === era);
    const roofParts = buildBuildingSpec({ ...bp, level: 1 }).parts.filter((p) => p.role === 'roof');
    assert.ok(roofParts.length > 0, `kỷ mái bằng ${era} lại mất tấm phủ mang màu kỷ`);
  }
});

// ─── CHỮ KÝ KIẾN TRÚC (Phase 6A) ─────────────────────────────────────────────

test('CHỮ KÝ: mỗi kỷ đúng một chữ ký, 15 kỷ không kỷ nào trùng, và tất cả đều dựng được', () => {
  // ⚠️ VÌ SAO PHẢI CANH TÍNH KHÔNG-TRÙNG Ở ĐÂY: `roof` chỉ có 9 giá trị và `windows` có 7, nên hai
  // trục ấy BUỘC phải dùng lại cho 15 kỷ (`cone` dùng chung kỷ 1+2, `flat` chung 12/13/14). Chữ ký
  // là trục DUY NHẤT có đủ giá trị cho mỗi kỷ một cái, nên nếu ai đó lỡ tay để hai kỷ trùng chữ ký
  // thì tầng này mất luôn lý do tồn tại — mà build vẫn xanh và ảnh chụp vẫn "trông ổn".
  const eras = Object.keys(ERA_STYLES).map(Number);
  const names = eras.map((era) => getEraStyle(era).signature);
  for (const [i, name] of names.entries()) {
    assert.equal(typeof name, 'string', `kỷ ${eras[i]} thiếu chữ ký`);
    assert.ok(SIGNATURE_KINDS.includes(name),
      `kỷ ${eras[i]} khai chữ ký "${name}" mà signature.js không dựng được`);
  }
  assert.equal(new Set(names).size, names.length,
    `có kỷ dùng chung chữ ký: ${names.join(', ')}`);

  // Và mọi chữ ký dựng được đều phải có kỷ dùng — một hàm không ai gọi là đúng cái bẫy Phase 4H.
  for (const kind of SIGNATURE_KINDS) {
    assert.ok(names.includes(kind), `chữ ký "${kind}" viết ra mà không kỷ nào dùng`);
  }
});

test('CHỮ KÝ: hiện ở MỌI hạng, kể cả `common` — không còn công trình nào là hộp trơn', () => {
  // ⚠️ ĐÂY LÀ LÝ DO TẦNG CHỮ KÝ RA ĐỜI. `RARITY_MOTIF_BUDGET.common = 0` nghĩa là 2 trong 5 công
  // trình mỗi kỷ (30 trong 75 căn của cả game) trước đây KHÔNG có lấy một chi tiết đặc trưng nào.
  // Bài test này đo đúng điều đó: gỡ dòng `emitSignature` trong `buildingSpec.js` thì nó đỏ.
  const commons = ALL_BLUEPRINTS.filter((bp) => bp.rarity === 'common');
  assert.ok(commons.length >= 30, 'bảng bản vẽ đổi rồi — xem lại bài test này');
  for (const bp of commons) {
    const probe = [];
    const emitted = emitSignature(probe, getEraStyle(bp.era).signature, {
      bpId: bp.bpId, era: bp.era, style: getEraStyle(bp.era),
      w: 0.86, d: 0.68, x: 0, z: 0, base: 0, top: 0.5, symmetric: false,
    });
    assert.ok(emitted && probe.length > 0, `kỷ ${bp.era}: chữ ký không dựng ra khối nào`);

    const spec = buildBuildingSpec({ ...bp, level: 1 });
    // Khối kết cấu (không `deco`) phải nhiều hơn hẳn phần thân+mái trần trụi. Thân + gờ chân +
    // mái + cửa ra vào = khoảng 4; có chữ ký thì luôn từ 6 trở lên.
    const structural = spec.parts.filter((p) => !p.deco);
    assert.ok(structural.length >= 6,
      `kỷ ${bp.era} · "${bp.bpId}" hạng common chỉ có ${structural.length} khối kết cấu `
      + '⇒ vẫn là hộp trơn, chữ ký chưa tới được hạng này');
  }
});

test('CHỮ KÝ: kỳ quan của MỌI kỷ vẫn đối xứng tuyệt đối sau khi thêm chữ ký', () => {
  // ⚠️ Bài "kỳ quan đối xứng" ở trên chỉ soi kỷ 1. Chữ ký là khối KẾT CẤU đặt lệch tâm ở nhiều kỷ
  // (tháp Đức, ống khói Anh, tháp chuông Ý), nên nguy cơ làm lệch kỳ quan nay có ở CẢ 15 kỷ chứ
  // không riêng kỷ có `rough` cao. Duyệt đủ 15 — đúng luật "bất biến kiểu 'các thứ này phải …' thì
  // phải duyệt hết, đừng duyệt mẫu".
  //
  // ⚠️ VÀ PHÉP ĐO PHẢI ĐO ĐÚNG THỨ NÓ MUỐN BẢO CHỨNG — bài này đã sai HAI LẦN trước khi đúng, và cả
  // hai lần đều là *phép đo hỏng*, không phải mã hỏng. Ghi lại vì cách sai rất dễ lặp:
  //   (1) Bản đầu canh `ry === 0` cho MỌI khối kết cấu → đỏ ở kỷ 5. Thủ phạm là mái `gable` nằm
  //       ĐÚNG TÂM quay nóc 90° — vẫn cân hai bên y như cũ. Xoay một khối ở tâm không phá gì.
  //   (2) Bản thứ hai chỉ canh khối LỆCH TÂM → đỏ ở kỷ 15 với `ry = π/4`. Đó là vòng xuyến Dubai:
  //       tám tấm kính quanh một vòng tròn, mỗi tấm quay để quay mặt ra ngoài. Cả vòng đối xứng
  //       hoàn hảo — cấm xoay ở đây là cấm luôn hình vòng.
  //   (3) Bản thứ ba đòi mỗi khối lệch tâm có bạn ĐỐI XỨNG QUA TÂM → đỏ ở kỷ 3 với một khối `dark`
  //       ở (0 · +0,684). Đó là CỬA RA VÀO. Mặt tiền nào cũng có cửa ở phía trước và không có cửa
  //       ở phía sau — đòi đối xứng trước–sau là đòi một thứ chính kiến trúc thật không có.
  // ⇒ Bất biến ĐÚNG là **đối xứng TRÁI–PHẢI qua mặt phẳng x = 0**: đó mới là thứ mắt đọc ra khi
  // nhìn một cung điện, và cũng là thứ cầu thang ziggurat / hiên Panthéon / cửa ra vào đều tôn
  // trọng. Khối ở `(x, z)` quay `ry` phải có bạn ở `(−x, z)` quay `−ry` (so theo modulo π vì hộp
  // quay `ry` và `ry + π` trông y hệt). Phép này bắt đúng lỗi thật vừa tìm ra — bốn tháp góc kỷ 5
  // có bạn đúng vị trí nhưng nóc mái lệch nhau π/2 — mà không kết tội oan cái vòng lẫn cái cửa.
  const EPS = 1e-6;
  const modPi = (a) => {
    const m = a % Math.PI;
    return m < 0 ? m + Math.PI : m;
  };
  for (const bp of ALL_BLUEPRINTS.filter((b) => b.type === 'wonder')) {
    const spec = buildBuildingSpec({ ...bp, level: 1 });
    const structural = spec.parts.filter((q) => !q.deco);
    const offAxis = structural.filter((p) => Math.abs(p.x) > EPS);

    for (const p of offAxis) {
      const twin = structural.find((q) => q !== p
        && Math.abs(q.x + p.x) < 1e-9 && Math.abs(q.z - p.z) < 1e-9
        && q.role === p.role && q.shape === p.shape
        && Math.abs(modPi(q.ry) - modPi(-p.ry)) < 1e-9);
      assert.ok(twin,
        `kỷ ${bp.era}: khối kết cấu ${p.shape}/${p.role} ở (${p.x.toFixed(3)}, ${p.z.toFixed(3)}) `
        + `xoay ${p.ry.toFixed(4)} KHÔNG có khối đối xứng trái–phải — kỳ quan đứng giữa thành phố `
        + 'mà lệch thì cả bố cục mất điểm tựa');
    }

    // Và tổng lệch tâm phải bằng 0 — phép canh tổng thể, rẻ, bắt được ca "thừa một khối lẻ".
    const sumX = structural.reduce((s, p) => s + p.x, 0);
    assert.ok(Math.abs(sumX) < 1e-9,
      `kỷ ${bp.era}: kỳ quan lệch ${sumX.toFixed(4)} theo trục X sau khi thêm chữ ký`);
    // Trục Z cố ý KHÔNG canh tổng: cầu thang ziggurat và hiên Panthéon đều nằm ở mặt TRƯỚC — đó là
    // đối xứng trái–phải của một mặt tiền, đúng như công trình thật, không phải lỗi.
  }
});

test('CHỮ KÝ: tên lạ thì công trình vẫn dựng bình thường, không nổ', () => {
  // Dữ liệu hỏng từ cloud có thể mang một `era` lạ; `getEraStyle` đã lo phần đó, nhưng nếu ai đó
  // đổi tên một chữ ký mà quên sửa bảng kỷ thì màn Thành Phố không được trắng.
  const out = [];
  assert.equal(emitSignature(out, 'khong-co-that', { bpId: 'x', w: 1, d: 1, x: 0, z: 0, base: 0, top: 1 }), false);
  assert.equal(out.length, 0);
  assert.equal(emitSignature(out, 'tstone', null), false);
});

test('BỀ NGANG: không công trình nào phình ra quá khu đất của nó (bánh cóc, không được tệ thêm)', () => {
  // ⚠️ SỐ ĐO, KHÔNG PHẢI ƯỚC ĐOÁN (2026-08-14): đo cả 75 bản vẽ ở cấp 3 thì công trình rộng nhất
  // là `bp_thanh_quan_viet` (kỷ 6, kỳ quan epic) — **3,687 ô** trên một khu đất rộng 3 ô. Thủ phạm
  // là chi tiết `courtyard` (`w * 1.1` đặt lệch `d * 0.82`), và nó **đã có từ trước Phase 6A** —
  // đo lại trên đúng commit trước đó ra cùng con số. Phân bố: 5/75 vượt 2,6 · 2/75 vượt 3,0.
  //
  // ⚠️ VÌ SAO KHOÁ Ở 3,7 CHỨ KHÔNG PHẢI Ở CON SỐ "ĐÚNG": chưa ai NHÌN xem 3,687 có thật sự làm hai
  // công trình cắm vào nhau trên màn hình không — và luật của dự án này là *nhìn rồi mới kết luận*,
  // không suy từ số. Nên đây là một cái BÁNH CÓC: nó không nói "3,687 là đúng", nó chỉ bảo đảm con
  // số ấy KHÔNG ÂM THẦM PHÌNH THÊM trong khi chờ soi bằng mắt. Xem `TECH_DEBT.md` #21.
  const SPAN_RATCHET = 3.7;
  let worst = { span: 0 };
  for (const bp of ALL_BLUEPRINTS) {
    const spec = buildBuildingSpec({ ...bp, level: 3 });
    if (spec.span > worst.span) worst = { ...bp, span: spec.span };
    assert.ok(spec.span <= SPAN_RATCHET,
      `kỷ ${bp.era} · "${bp.bpId}" rộng ${spec.span.toFixed(3)} ô, vượt bánh cóc ${SPAN_RATCHET} `
      + '— một thay đổi vừa rồi làm công trình phình thêm; xem TECH_DEBT #21 trước khi nới số này');
  }
  console.log(`   [bề ngang] rộng nhất: ${worst.bpId} kỷ ${worst.era} — ${worst.span.toFixed(3)} / ${SPAN_RATCHET} ô`);
});

// ─────────────────────────────────────────────────────────────────────────────
// KHỐI KIẾN TRÚC (Phase 8A) — tường thôi là một mảng phẳng
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cắt lấy một công trình có ĐÚNG MỘT mảng thân, rồi nhận diện từng đường ngang bằng BỀ NGANG của
 * nó — chân tường là thân nở thêm `PLINTH_SPREAD`, gờ mái là thân nở thêm `CORNICE_SPREAD`…
 *
 * ⚠️ VÌ SAO PHẢI NHẬN DIỆN KIỂU NÀY chứ không đếm theo `role`: chân tường mang `role:'stone'`,
 * mà `stone` cũng là vai của tường bao sân ở nguyên mẫu kinh tế; gờ mái mang `role:'trim'`, mà
 * `trim` cũng là vai của bệ cửa sổ, lanh tô và gờ khối thấp. Hỏi `some(role === 'trim')` thì bài
 * test xanh kể cả khi gờ mái đã bị gỡ sạch — đúng cái bẫy "assert 'có ít nhất một chỗ' là cái
 * phễu, không phải hàng rào" ở Phase 7A.
 */
function mộtMảng(era, opts = {}) {
  const spec = buildBuildingSpec({
    bpId: 'bp_mot_mang', era, type: 'infrastructure', rarity: 'common', level: 1, ...opts,
  });
  const thân = spec.parts.filter((p) => !p.deco && p.role === 'wall');
  assert.equal(thân.length, 1, `kỷ ${era}: hạ tầng common phải đúng 1 mảng thân`);
  const rộng = (spread) => spec.parts.filter((p) => !p.deco && gần(p.w, thân[0].w * (1 + spread)));
  return { spec, thân: thân[0], rộng };
}

test('THÂN NHÀ KHÔNG CÒN LÀ MỘT CÁI HỘP TRƠN — đủ 15 kỷ', () => {
  // ⚠️ BÀI ĐỐI CHỨNG NHỐT SỐ ĐO CŨ. Trước Phase 8A, nhà dân nhỏ nhất là **12 khối, trong đó thân
  // nhà đúng MỘT hộp** (`wall:1`) + 1 mái + 8 mảnh kính. Đàm nhìn ảnh cận cảnh rồi nói thành phố
  // "quá pixel, hình hộp, vật liệu phẳng" — và số đo cho thấy anh đúng theo nghĩa đen.
  // Không có gì đỏ lên nếu ba đường ngang này biến mất: nhà vẫn dựng được, vẫn đúng ngân sách,
  // chỉ là mặt tường phẳng trở lại như bìa các-tông.
  for (const era of ERAS) {
    const { thân, rộng } = mộtMảng(era);
    const chânTường = rộng(PLINTH_SPREAD);
    const gờMái = rộng(CORNICE_SPREAD);
    assert.equal(chânTường.length, 1, `kỷ ${era}: phải có đúng 1 chân tường`);
    assert.equal(gờMái.length, 1, `kỷ ${era}: phải có đúng 1 gờ mái`);
    // Và chúng phải nằm ĐÚNG hai đầu thân nhà — một cái gờ đặt lửng giữa tường thì vô nghĩa.
    assert.ok(gần(chânTường[0].y, thân.y), `kỷ ${era}: chân tường không nằm ở chân thân nhà`);
    assert.ok(gờMái[0].y + gờMái[0].h > thân.y + thân.h - 1e-9,
      `kỷ ${era}: gờ mái không chạm tới đỉnh thân nhà`);
  }
});

test('GỜ MÁI PHẢI THÒ RA XA HƠN CHÂN TƯỜNG — nếu không nó không có bóng để mà nhìn thấy', () => {
  // ⚠️ Đây là luật QUAN HỆ, không phải hai con số rời — đúng bài học Phase 7D. Cả công dụng của
  // gờ mái là hắt một vệt tối xuống mặt tường; thò ít hơn chân tường thì nó thành một đường kẻ
  // vô nghĩa và cái tường lại phẳng như cũ. Viết thành assert để không ai "cân đối" hai số cho đẹp.
  assert.ok(CORNICE_SPREAD > PLINTH_SPREAD,
    `gờ mái (${CORNICE_SPREAD}) phải thò xa hơn chân tường (${PLINTH_SPREAD})`);
  assert.ok(PLINTH_SPREAD > COURSE_SPREAD,
    `chân tường (${PLINTH_SPREAD}) phải dày hơn gờ tầng (${COURSE_SPREAD})`);
  // Và bệ cửa sổ phải thò xa hơn chính ô kính — cùng lý do, ở cỡ nhỏ hơn.
  assert.ok(SILL_RELIEF > WINDOW_RELIEF,
    `bệ cửa sổ (${SILL_RELIEF}) phải thò xa hơn ô kính (${WINDOW_RELIEF}), nếu không không có bóng`);
});

test('CỬA SỔ CÓ BỆ — và cửa VÒM thì không có lanh tô, vì vòm CHÍNH LÀ lanh tô', () => {
  // Kỷ 7 (`arch`) và kỷ 10 (`grid`) là hai cách xây khác hẳn nhau; bài này canh rằng chúng ra hai
  // kết quả khác nhau chứ không phải cùng một bộ chi tiết dán lên.
  const đếm = (era, windows) => {
    const spec = buildBuildingSpec({ bpId: `dw|${era}|3|4`, era, type: 'house', rarity: 'rare', level: 1 });
    const glass = spec.parts.filter((p) => p.role === 'glass' && !p.deco).length;
    const trim = spec.parts.filter((p) => p.role === 'trim' && !p.deco).length;
    return { glass, trim, windows };
  };
  // Kỷ 7 dựng mỗi ô cửa THÀNH HAI khối kính (thân + nửa vòm) nên số kính gấp đôi số ô thật.
  const vòm = đếm(7, 'arch');
  assert.ok(vòm.glass > 0 && vòm.trim > 0, 'kỷ 7 phải có cả kính lẫn bệ cửa');

  // ⚠️ Canh ĐÍCH DANH: không khối `trim` nào của kỷ vòm được nằm ĐÚNG đỉnh ô kính — đó sẽ là một
  // lanh tô cắm vào giữa cái vòm. Hỏi tổng số khối thì không bắt được, vì gờ mái cũng là `trim`.
  const spec7 = buildBuildingSpec({ bpId: 'dw|7|3|4', era: 7, type: 'house', rarity: 'rare', level: 1 });
  const kính = spec7.parts.filter((p) => p.role === 'glass' && !p.deco);
  const trims = spec7.parts.filter((p) => p.role === 'trim' && !p.deco);
  for (const g of kính) {
    const đỉnh = g.y + g.h;
    const đè = trims.find((t) => Math.abs(t.y - đỉnh) < 1e-9
      && Math.abs(t.x - g.x) < 1e-9 && Math.abs(t.z - g.z) < 1e-9);
    assert.equal(đè, undefined,
      `kỷ 7: có lanh tô cắm đúng đỉnh ô vòm tại (${g.x.toFixed(2)}, ${g.z.toFixed(2)})`);
  }
});

/**
 * Đếm gờ tầng của TỪNG mảng nhà, trả về mảng số đếm.
 *
 * ⚠️ NHẬN DIỆN BẰNG HÌNH HỌC, KHÔNG BẰNG `role` — và đây là một cái bẫy tôi đã sập đúng một lần
 * trong lúc viết bài này. Phép đo đầu tiên hỏi `role === 'wall' || role === 'wall2'` rồi kết luận
 * *"thành luỹ không có gờ tầng nào ở cả 15 kỷ"*. Sai: nguyên mẫu phòng thủ khai mảng nhà là
 * `role:'stone'` (thành luỹ xây bằng đá) và xưởng khai `role:'wood'`, nên hai nguyên mẫu ấy **tàng
 * hình với phép đo** chứ không phải thiếu gờ. Đo lại cho đúng thì thành luỹ có tới 15 dải.
 * Lần thứ n công cụ đo nói dối; luật cũ vẫn đúng — **số đo nào gây bất ngờ thì kiểm CÔNG CỤ trước.**
 *
 * ⚠️ Phải khớp CẢ `x`/`z` chứ không chỉ `w`/`d`: hạ tầng epic có hai mảng phụ RỘNG BẰNG NHAU đặt
 * đối xứng hai bên, nên khớp mỗi bề ngang thì mỗi mảng "nhận vơ" luôn gờ của mảng kia và số đếm
 * nhân đôi — cái trần sẽ báo vượt trong khi mã hoàn toàn đúng.
 */
function gờTầngTheoMảng(spec) {
  const kết = spec.parts.filter((p) => !p.deco);
  return kết.map((mass) => kết.filter((p) => p !== mass
    && gần(p.x, mass.x) && gần(p.z, mass.z)
    && gần(p.w, mass.w * (1 + COURSE_SPREAD)) && gần(p.d, mass.d * (1 + COURSE_SPREAD))).length);
}

test('GỜ TẦNG MỌC THEO CHIỀU CAO THẬT, và không mảng nào quá trần', () => {
  // Nhà một tầng không có ranh giới tầng nào để mà đánh dấu; tháp 8 tầng kẻ đủ 7 dải thì thành sọc
  // ngựa vằn. Bài này canh CẢ HAI ĐẦU của cái luật.
  //
  // ⚠️ CỐ Ý KHÔNG chép lại công thức `Math.min(MAX_COURSES, stories - 1)` vào đây. Chép lại thì
  // đổi trần từ 3 lên 5 mà bài test vẫn xanh, tức nó canh phép tính chứ không canh cái luật.
  const TYPES = ['infrastructure', 'economy', 'defense', 'wonder', 'house', 'shop', 'workshop'];
  let tổngKỷ1 = 0;
  let tổngKỷ15 = 0;
  let chạmTrần = 0;
  for (const era of ERAS) {
    for (const type of TYPES) {
      const đếm = gờTầngTheoMảng(
        buildBuildingSpec({ bpId: 'bp_go_tang', era, type, rarity: 'epic', level: 3 }),
      );
      const nhiềuNhất = Math.max(0, ...đếm);
      assert.ok(nhiềuNhất <= MAX_COURSES,
        `kỷ ${era}/${type}: một mảng nhà có ${nhiềuNhất} gờ tầng, vượt trần ${MAX_COURSES}`);
      if (nhiềuNhất === MAX_COURSES) chạmTrần += 1;
      const tổng = đếm.reduce((a, b) => a + b, 0);
      if (era === 1) tổngKỷ1 += tổng;
      if (era === 15) tổngKỷ15 += tổng;
    }
  }
  // Bất đẳng thức ở trên vẫn xanh nếu KHÔNG có gờ tầng nào tồn tại (0 ≤ 3). Nên phải đòi thêm rằng
  // cả hai đầu của luật đều THẬT SỰ xảy ra: lều kỷ 1 một tầng thì không có dải nào, còn kỷ 15 —
  // tháp kính Dubai — thì phải có. Nhốt luôn số đo hiện tại: kỷ 1 = 0, kỷ 15 = 50.
  assert.equal(tổngKỷ1, 0, `kỷ 1 toàn lều một tầng mà có ${tổngKỷ1} gờ tầng`);
  assert.ok(tổngKỷ15 >= 20, `kỷ 15 chỉ có ${tổngKỷ15} gờ tầng — luật gần như không chạy`);
  assert.ok(chạmTrần >= 1, 'không công trình nào chạm trần gờ tầng — cái trần chưa từng được kiểm');

  // ⚠️ VÀ MỘT TRẦN CHO CHÍNH CÁI TRẦN. Ba assert trên đều ĐỌC `MAX_COURSES`, nên nâng hằng số ấy
  // lên 8 thì cả ba di chuyển theo và bài test vẫn xanh — đã thử ngược và thấy đúng như vậy. Nhưng
  // 8 dải chính là "sọc ngựa vằn" mà cả cái trần sinh ra để ngăn. Con số này khoá một QUYẾT ĐỊNH
  // mỹ thuật có lý do đo được (trên cỡ hiển thị thật, dải thứ tư trở đi chỉ còn rộng ~2 điểm ảnh),
  // không phải khoá một phép làm tròn — nên khoá nó là đúng việc.
  assert.ok(MAX_COURSES <= 4, `trần gờ tầng ${MAX_COURSES} quá cao — mặt tường sẽ thành sọc ngựa vằn`);
});


// ─── 9. TỪ VỰNG MÁI: KIM TỰ THÁP VÀ ZIGGURAT LÀ HAI THỨ, KHÔNG PHẢI MỘT ──────
//
// Đàm nhìn thành phố ngày 2026-08-21 và nói: *"kim tự tháp không có khối hình chóp"*. Đúng, và
// nguyên nhân không phải một con số sai mà là **từ vựng nghèo**: kỷ 2 (Ai Cập) khai `cone` — lăng
// trụ TÁM cạnh thóp về một điểm, tức một cái lều rạp xiếc — còn kỷ 3 (ziggurat thành Ur) dùng
// CHUNG một nhánh mã với kỷ 11 (cao ốc giật cấp Manhattan), hai thứ ngược nhau về kiến trúc.
//
// Ba bài dưới đây khoá lại cả ba vế: hình kỷ 2 phải là chóp BỐN mặt · hình kỷ 3 phải là chồng
// thềm XIÊN thu vào từ mép thân nhà · và bảng từ vựng không được có giá trị chết hoặc giá trị
// dựng ra hư không.

/** Kỳ quan của một kỷ, dựng ở cấp cao nhất — công trình mà Đàm nhìn vào khi phàn nàn. */
function kyQuan(era) {
  const bp = BLUEPRINT_CATALOG[era].find((b) => BUILDING_EFFECTS[b.id]?.type === 'wonder');
  assert.ok(bp, `kỷ ${era} không có kỳ quan — bảng bản vẽ hỏng`);
  return buildBuildingSpec({ bpId: bp.id, era, type: 'wonder', rarity: bp.rarity, level: 3 });
}

/** Thân nhà chính = khối `wall` RỘNG NHẤT, tức mảng nhà mà mái chính đội lên. */
function thanNhaChinh(spec) {
  return [...spec.parts].filter((p) => p.role === 'wall' && !p.deco).sort((a, b) => b.w - a.w)[0];
}

test('KỶ 2 — AI CẬP PHẢI CÓ MỘT KHỐI CHÓP BỐN MẶT THẬT, KHÔNG PHẢI CÁI LỀU TÁM CẠNH', () => {
  // ⚠️ Bài này KHÔNG hỏi `getEraStyle(2).roof === 'pyramid'` — đó là hỏi lại chính cái bảng vừa
  // điền, đúng bẫy `TECH_DEBT #42` ("assert con số đã KHAI thay vì con số đã DỰNG"). Nó hỏi HÌNH:
  // khối đội lên thân nhà chính có đúng BỐN mặt và có thóp gần về một điểm không.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): trả kỷ 2 về `roof: 'cone'` ⇒ đỏ ở assert `sides === 4`
  // (dựng ra `sides: 8`).
  const spec = kyQuan(2);
  const than = thanNhaChinh(spec);
  const dinhThan = than.y + than.h;

  // Khối mái đội lên đúng thân nhà ấy: cùng chỗ đứng, chân nằm ở đỉnh thân.
  const mai = spec.parts.filter((p) => p.role === 'roof' && !p.deco && !p.rooftop
    && Math.abs(p.y - dinhThan) < 1e-6 && Math.abs(p.x - than.x) < 1e-6);
  assert.equal(mai.length, 1, `kỳ quan kỷ 2 phải có đúng một khối mái đội lên thân chính, đếm được ${mai.length}`);

  const chop = mai[0];
  assert.equal(chop.shape, 'prism', 'chóp phải là lăng trụ');
  assert.equal(chop.sides, 4, `kim tự tháp phải có BỐN mặt, đang dựng ${chop.sides} cạnh`);
  assert.ok(chop.taper <= 0.1, `chóp phải thóp gần về một điểm, taper đang là ${chop.taper}`);

  // Và nó phải là một KHỐI, không phải một cái mũ. Hai quan hệ, không phải hai mức:
  //   · đáy chóp RỘNG HƠN thân nhà nó đứng lên (đo 2026-08-21: 1,537 / 1,137 = **135%**)
  //   · chóp cao ÍT NHẤT một nửa thân nhà      (đo 2026-08-21: 0,818 / 1,079 = **76%**)
  // Ngưỡng đặt ở 100% và 50% — cách số đo thật 35% và 52%, đủ chỗ cho việc chỉnh mỹ thuật mà vẫn
  // đỏ ngay nếu chóp co lại thành một chỏm trang trí.
  assert.ok(chop.w >= than.w,
    `đáy chóp ${chop.w.toFixed(3)} hẹp hơn thân nhà ${than.w.toFixed(3)} — đó là cái mũ, không phải kim tự tháp`);
  assert.ok(chop.h >= than.h * 0.5,
    `chóp cao ${chop.h.toFixed(3)} so với thân ${than.h.toFixed(3)} — dưới một nửa thì mắt đọc ra "nhà có mái nhọn"`);

  // Tỉ lệ thật của Đại Kim Tự Tháp Giza: 146,6 m trên đáy 230,3 m = 0,637. Ở đây đo được 0,533
  // (mái phủ `rw = w + 2·eaves` nên đáy rộng hơn thân). Dải [0,40 ; 0,90] bao lấy cả tỉ lệ thật
  // lẫn số đang dựng, và loại cả hai đầu hỏng: bẹt như cái mâm, hoặc nhọn hoắt như cái nón.
  const doc = chop.h / chop.w;
  assert.ok(doc >= 0.4 && doc <= 0.9, `dốc chóp ${doc.toFixed(3)} nằm ngoài dải [0,40 ; 0,90]`);
});

test('KỶ 3 — ZIGGURAT PHẢI CÓ THỀM THẬT: THU VÀO TỪ MÉP THÂN NHÀ, MẶT TƯỜNG NGHIÊNG', () => {
  // ⚠️ ĐÂY LÀ CHỖ `stepped` HỎNG, VÀ NÓ HỎNG KHÔNG PHẢI VÌ SỐ TẦNG. `stepped` mở đầu ở `rw`
  // (= thân nhà + 2·eaves, tức RỘNG HƠN thân) nên bậc thứ nhất không tạo ra một cái thềm nào —
  // nó chỉ nối tiếp mặt tường đi lên. Mắt vì thế chỉ đọc được bậc thứ hai trở đi.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): trả kỷ 3 về `roof: 'stepped'` ⇒ ĐỎ với thông báo *"ziggurat
  // phải có ít nhất 3 thềm, đếm được 2"*. Con số 2 chứ không phải 3 là một chi tiết đáng giữ:
  // `stepped` dựng ĐÚNG 3 bậc nhưng bậc đầu mang vai `trim` chứ không phải `roof` — tức ngay ở
  // tầng vai màu, bậc dưới cùng của setback Manhattan đã KHÔNG được coi là mái.
  const spec = kyQuan(3);
  const than = thanNhaChinh(spec);
  const dinhThan = than.y + than.h;

  const chong = spec.parts
    .filter((p) => p.role === 'roof' && !p.deco && !p.rooftop
      && Math.abs(p.x - than.x) < 1e-6 && Math.abs(p.z - than.z) < 1e-6 && p.y >= dinhThan - 1e-6)
    .sort((a, b) => a.y - b.y);

  assert.ok(chong.length >= 3, `ziggurat phải có ít nhất 3 thềm, đếm được ${chong.length}`);

  // (a) THỀM THẬT: thềm dưới cùng phải HẸP HƠN thân nhà đỡ nó. Đo 2026-08-21: 1,095 / 1,369 = 80%.
  assert.ok(chong[0].w < than.w,
    `thềm dưới cùng rộng ${chong[0].w.toFixed(3)} ≥ thân nhà ${than.w.toFixed(3)} — không có thềm nào để mắt đọc`);

  // (b) THU DẦN: mỗi thềm hẹp hơn thềm dưới nó. Quan hệ, không phải mức — nên nó không già đi khi
  //     ai đó chỉnh tỉ lệ.
  for (let i = 1; i < chong.length; i += 1) {
    assert.ok(chong[i].w < chong[i - 1].w,
      `thềm ${i + 1} rộng ${chong[i].w.toFixed(3)} không hẹp hơn thềm ${i} (${chong[i - 1].w.toFixed(3)})`);
  }

  // (c) MẶT TƯỜNG NGHIÊNG VÀO (batter) — dấu hiệu nhận dạng số một của ziggurat, và là thứ luật
  //     giật cấp New York 1916 KHÔNG có (mặt cao ốc setback dựng đứng).
  for (const [i, p] of chong.entries()) {
    assert.ok(p.taper > 0 && p.taper < 1,
      `thềm ${i + 1} có taper ${p.taper} — mặt tường dựng đứng thì đó là setback Manhattan, không phải ziggurat Ur`);
  }

  // (d) ĐỀN NHỎ TRÊN ĐỈNH. Ở Ur nó lợp gạch men khác hẳn thân ziggurat ⇒ vai màu khác.
  const dinhChong = chong[chong.length - 1].y + chong[chong.length - 1].h;
  const den = spec.parts.filter((p) => !p.deco && !p.rooftop && p.role !== 'roof'
    && Math.abs(p.x - than.x) < 1e-6 && Math.abs(p.y - dinhChong) < 1e-6);
  assert.equal(den.length, 1, `phải có đúng một đền nhỏ trên đỉnh ziggurat, đếm được ${den.length}`);
  assert.ok(den[0].w < chong[chong.length - 1].w, 'đền trên đỉnh phải hẹp hơn thềm cao nhất');
});

/**
 * Một chỗ đứng giả để hỏi THẲNG nhà máy mái. Mọi trường giữ nguyên qua các kiểu mái, chỉ đổi đúng
 * `roof` — nếu lấy công trình thật thì bề ngang, số mảng nhà và chữ ký kiến trúc cùng đổi theo kỷ,
 * và phép đo hết nói được về cái biến mình đang hỏi.
 */
function loMai(kind) {
  const out = [];
  const style = { ...getEraStyle(1), roof: kind, roofPitch: 0.4, eaves: 0.08 };
  const neo = emitRoof(out, { w: 1, d: 1, top: 2, x: 0, z: 0 }, style, {
    bpId: 'bp_do_mai', era: 1, rarity: 'epic', level: 3,
    w: 1, d: 1, x: 0, z: 0, base: 0, top: 2, style, symmetric: true,
  });
  return { out, neo };
}

test('TỪ VỰNG MÁI (a) — không giá trị chết: mọi kiểu trong `ROOF_KINDS` phải có kỷ khai nó', () => {
  // Thêm một giá trị vào `ROOF_KINDS` mà không kỷ nào khai thì nó là mã chết mang hình dạng một
  // tính năng. Đây là lý do `mastaba` (ghế đá mộ Ai Cập) đã được cân nhắc rồi BỎ ngày 2026-08-21:
  // nó không có chủ — kỷ 2 lấy kim tự tháp, và không kỷ nào khác nói về Ai Cập.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): thêm `'mastaba'` vào `ROOF_KINDS` ⇒ đỏ đúng ở đây.
  const dungBoi = new Set();
  for (const era of ERAS) {
    dungBoi.add(getEraStyle(era).roof);
    dungBoi.add(getVernacularStyle(era).roof);
  }
  for (const kind of ROOF_KINDS) {
    assert.ok(dungBoi.has(kind), `kiểu mái "${kind}" không kỷ nào dùng — từ vựng chết`);
  }
});

test('TỪ VỰNG MÁI (b) — mọi kiểu phải dựng ra hình RIÊNG, không rơi về tấm mặc định', () => {
  // ⚠️ BẢN ĐẦU CỦA BÀI NÀY DỰA TRÊN MỘT CÂU KHẲNG ĐỊNH SAI VỀ MÃ, VÀ PHÉP THỬ NGƯỢC ĐÃ BẮT ĐƯỢC.
  // Tôi viết: *"`switch` trong `emitRoof` không có nhánh `default`, nên một kiểu mái thiếu `case`
  // sẽ không dựng ra gì cả"* rồi assert `out.length >= 1`. Xoá hẳn `case 'ziggurat'` thì bài test
  // **VẪN XANH** — vì `emitRoof` CÓ `default`, và nó đẩy ra một tấm phiến trơn (`role: 'trim'`,
  // cao `pitch × 0.5`).
  //
  // Nghĩa là rủi ro thật NGƯỢC với điều tôi tưởng, và tệ hơn: một giá trị mái thiếu `case` không
  // biến mất — nó **lặng lẽ hoá thành một tấm phiến trơn**, tức kỷ ấy mất căn cước mái mà vẫn
  // "có mái". Không có gì đỏ lên, và trên ảnh nó trông như một quyết định mỹ thuật.
  //
  // Nên câu hỏi đúng không phải *"có dựng ra khối nào không"* mà là *"có dựng ra hình KHÁC tấm mặc
  // định không"*. Đối chứng nằm ngay trong bài: dựng một kiểu mái KHÔNG TỒN TẠI để lấy đúng hình
  // của nhánh `default`, rồi đòi mọi kiểu thật phải khác nó.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): đổi tên `case 'ziggurat'` thành một tên không ai dùng ⇒ đỏ
  // đúng ở đây, nêu đích danh `ziggurat`.
  const vanTay = (parts) => parts
    .map((p) => `${p.shape}|${p.sides ?? '-'}|${(p.taper ?? 1).toFixed(2)}|${p.role}|${p.h.toFixed(4)}|${p.w.toFixed(4)}|${p.y.toFixed(4)}`)
    .join(' , ');

  const macDinh = loMai('__KHONG_PHAI_MOT_KIEU_MAI__');
  assert.equal(macDinh.out.length, 1, 'nhánh `default` của emitRoof phải đẩy đúng một tấm phiến — đối chứng hỏng');
  const vanTayMacDinh = vanTay(macDinh.out);

  for (const kind of ROOF_KINDS) {
    const { out, neo } = loMai(kind);
    assert.ok(out.length >= 1, `kiểu mái "${kind}" không dựng ra khối nào`);
    assert.ok(neo.apexY > 2,
      `kiểu mái "${kind}" có đỉnh ${neo.apexY} không cao hơn đỉnh tường 2 — mái phải nhô lên trên tường`);
    for (const p of out) {
      assert.ok(ROLE_SET.has(p.role), `kiểu mái "${kind}" dựng khối mang vai lạ "${p.role}"`);
    }
    assert.notEqual(vanTay(out), vanTayMacDinh,
      `kiểu mái "${kind}" dựng ra ĐÚNG tấm phiến của nhánh \`default\` — nhiều khả năng thiếu \`case\` cho nó`);
  }
});

test('TỪ VỰNG MÁI (c) — bảng không được dẹt: 15 kỷ phải còn ít nhất 10 kiểu mái kỳ quan', () => {
  // Đo 2026-08-21, SAU khi tách `ziggurat` khỏi `stepped` và đổi kỷ 2 sang `pyramid`:
  //   cone:1 · pyramid:2 · ziggurat:1 · tiered:2 · gable:2 · dome:1 · sawtooth:1 · stepped:1 ·
  //   flat:3 · blade:1  →  **10 kiểu, đông nhất là `flat` với 3 kỷ (12·13·14)**.
  // Trước bản này: 9 kiểu. Hai con số, không phải một — đúng bài học Bước 2 Phase 10: số kiểu nói
  // bảng có RỘNG không, còn "đông nhất" nói bảng có DỒN CỤC không, và một con số không thay được
  // con số kia.
  //
  // ⚠️ Con số 3 là một CÁI CHỐT, không phải một cái trần rộng rãi: kiểu nào chạm 4 thì đỏ, và lúc
  // đó câu hỏi đúng là *"kỷ ấy thật sự lợp mái gì?"* chứ không phải *"nới cái chốt"*.
  //
  // THỬ-CHO-ĐỎ (đã chạy 2026-08-21): đổi kỷ 11 từ `stepped` sang `flat` ⇒ `flat` lên 4 kỷ, đỏ ở
  // assert "dồn cục"; và số kiểu tụt còn 9, đỏ luôn ở assert "nghèo đi".
  const dem = new Map();
  for (const era of ERAS) {
    const r = getEraStyle(era).roof;
    dem.set(r, (dem.get(r) ?? 0) + 1);
  }
  const dongNhat = Math.max(...dem.values());
  assert.ok(dem.size >= 10,
    `chỉ ${dem.size} kiểu mái kỳ quan cho 15 kỷ — nghèo đi so với mốc 10 của 2026-08-21`);
  assert.ok(dongNhat <= 3,
    `${dongNhat} kỷ cùng dùng một kiểu mái kỳ quan — bảng đang dồn cục, xem lại kỷ mới thêm`);
});
