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
import { buildBuildingSpec, buildScaffoldSpec } from './buildingSpec.js';
import { ERA_STYLES, getEraStyle, ROOF_KINDS, WINDOW_KINDS } from './eraStyle.js';
import { ARCHETYPES, getMassing } from './archetypes.js';
import { MAX_SIDES, MIN_SIDES, PART_ROLES, countTriangles } from './parts.js';
import {
  MAX_TRIANGLES_PER_BUILDING,
  MAX_TRIANGLES_PER_CITY,
  describeBudget,
  specTriangles,
} from './budget.js';

const ROLE_SET = new Set(PART_ROLES);

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

test('TRỤC LOẠI: 4 loại công trình cho ra 4 khối tích khác nhau', () => {
  const seen = new Set();
  for (const type of Object.keys(ARCHETYPES)) {
    const sig = signature(buildBuildingSpec({ bpId: `bp_${type}`, era: 6, type, rarity: 'epic', level: 1 }));
    assert.ok(!seen.has(sig), `loại "${type}" trùng khối tích với loại khác`);
    seen.add(sig);
  }
  assert.equal(seen.size, 4);
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
  const towers = structural.filter((p) => Math.abs(p.x) > 0.5 && Math.abs(p.z) > 0.5 && p.role === 'trim');
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
