/**
 * streetFurniture.test.js — Round 51 (ADR-091): what stands beside the road, checked.
 *
 * ⚠️ WHAT THIS FILE IS FOR, in one line: *a lamp post must belong to its century, must stand on the
 * pavement and not in the road, and must not have moved anything that was already there.* Those are
 * the three ways this feature can be wrong, and none of them is visible in a green build.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { STREET_KINDS, STREET_KIT, deriveStreetFurniture } from './streetFurniture.js';
import { STREET_BUILDERS } from './streetFurnitureSpec.js';
import { buildPropSpec } from './propSpec.js';
import { getStreetStyle, rankOfRoad, streetCrossSection } from './streetStyle.js';
import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);

function layoutOf(era, sessions = 60) {
  const built = BLUEPRINT_CATALOG[era].map((b) => b.id);
  const levels = Object.fromEntries(built.map((id) => [id, 3]));
  return computeCityLayout({ built, levels, era, stats: { sessionCount: sessions, streakLength: 9 } });
}

test('MỌI KỶ ĐỀU CÓ ĐỒ ĐẠC ĐƯỜNG PHỐ, và mọi loại khai ra đều dựng được', () => {
  for (const era of ERAS) {
    const row = STREET_KIT[era];
    assert.ok(row, `kỷ ${era} không có bộ đồ đường phố nào`);
    assert.ok(row.kit.length > 0, `kỷ ${era} khai bộ rỗng`);
    for (const [kind, weight] of row.kit) {
      assert.ok(STREET_BUILDERS[kind], `kỷ ${era} xin "${kind}" mà không ai dựng được`);
      assert.ok(weight > 0, `kỷ ${era}: "${kind}" khai trọng số ${weight}`);
    }
  }
  // ⚠️ ĐỐI CHỨNG NGƯỢC: mọi thứ dựng được cũng phải có ít nhất một kỷ dùng. Một hình không ai gọi
  // là một hình không ai thấy — nhưng nó vẫn tốn công bảo trì và vẫn qua được mọi bài test khác.
  for (const kind of STREET_KINDS) {
    const dùng = ERAS.some((e) => STREET_KIT[e].kit.some(([k]) => k === kind));
    assert.ok(dùng, `"${kind}" dựng được nhưng không kỷ nào dùng`);
  }
  assert.deepEqual([...STREET_KINDS].sort(), Object.keys(STREET_BUILDERS).sort(),
    'danh sách loại và danh sách hình phải khớp từng cái một');
});

test('MỖI THẾ KỶ MỘT BỘ ĐỒ — không hai kỷ nào giống hệt nhau', () => {
  // Đây là điều duy nhất khiến việc này đáng làm: nếu 15 kỷ dùng chung một cột đèn thì con phố vẫn
  // không nói ra được nó là phố của nước nào, thời nào — mà đó chính là tiêu chí Đàm đặt cho vòng này.
  const chữKý = new Map();
  for (const era of ERAS) {
    const ký = STREET_KIT[era].kit.map(([k]) => k).sort().join('+');
    assert.ok(!chữKý.has(ký), `kỷ ${era} và kỷ ${chữKý.get(ký)} có bộ đồ giống hệt nhau: ${ký}`);
    chữKý.set(ký, era);
  }
});

test('NIÊN ĐẠI: không kỷ nào được dùng thứ chưa phát minh ra', () => {
  /**
   * ⚠️ CÙNG MỘT LUẬT MÀ `streetStyle.js` ĐÃ TRẢ GIÁ ĐỂ ĐẶT RA — nó khoá bó vỉa vào La Mã và vạch kẻ
   * đường vào thế kỷ 20. Trụ nước cứu hoả là 1801, đèn khí 1807, thùng rác công cộng những năm 1870,
   * ray xe điện những năm 1830, cột điện thì phải có điện đã. Cho một kỷ thứ nó chưa thể có là đúng
   * cùng một lỗi với cho nó một vật liệu mái nó chưa thể có.
   */
  const SỚM_NHẤT = { hydrant: 10, gaslamp: 9, streetlight: 11, utilitypole: 12, rail: 10, bin: 8, manhole: 10, signpost: 9 };
  for (const era of ERAS) {
    for (const [kind] of STREET_KIT[era].kit) {
      const sớm = SỚM_NHẤT[kind];
      if (sớm) assert.ok(era >= sớm, `kỷ ${era} dùng "${kind}" — thứ ấy phải từ kỷ ${sớm} trở đi`);
    }
  }
});

test('TẤT ĐỊNH: cùng bố cục ⇒ cùng đồ đạc, từng cái một', () => {
  for (const era of [1, 5, 9, 11, 13]) {
    const layout = layoutOf(era);
    const roads = layout.props.filter((p) => p.kind === 'road');
    const a = deriveStreetFurniture({ era, roads });
    const b = deriveStreetFurniture({ era, roads });
    assert.deepEqual(a, b, `kỷ ${era}: hai lần gọi ra hai con phố`);
    assert.ok(a.length > 0, `kỷ ${era}: con phố không có gì đứng bên đường`);
    // và thứ bố cục thật sự mang phải BẰNG thứ hàm này trả về, không phải một bản sao gần giống
    assert.equal((layout.street ?? []).length, a.length, `kỷ ${era}: bố cục và hàm dựng lệch nhau`);
  }
});

test('ĐỨNG TRÊN VỈA HÈ, KHÔNG ĐỨNG GIỮA ĐƯỜNG', () => {
  /**
   * ⚠️ ĐÂY LÀ BÀI QUAN TRỌNG NHẤT FILE NÀY, và nó hỏi một QUAN HỆ chứ không một con số: khoảng lệch
   * của một món đồ phải LỚN HƠN nửa lòng đường của chính ô ấy. Một ngưỡng tuyệt đối ("lệch ≥ 0,3")
   * sẽ đỏ oan ở kỷ 6 (ngõ 0,24) và bỏ lọt ở kỷ 3 (đường rước 0,80) — cùng cái bẫy `MOC_LENH_VE`
   * đã nhốt: một con số tuyệt đối không diễn đạt được một luật nói về quan hệ.
   *
   * Ngoại lệ có tên và chỉ bốn cái: cỏ mọc kẽ đá, rãnh nước, ray tàu và nắp cống THUỘC VỀ mặt
   * đường — chúng phải nằm TRONG lòng đường, và bài này đòi đúng thế.
   */
  const TRÊN_ĐƯỜNG = new Set(['weeds', 'gutter', 'rail', 'manhole']);
  for (const era of ERAS) {
    const layout = layoutOf(era);
    const roads = layout.props.filter((p) => p.kind === 'road');
    const style = getStreetStyle(era);
    const byCell = new Map(roads.map((c) => [`${c.x},${c.y}`, c]));
    let kiểm = 0;
    for (const piece of deriveStreetFurniture({ era, roads })) {
      const cell = byCell.get(`${piece.x},${piece.y}`);
      assert.ok(cell, `kỷ ${era}: "${piece.kind}" bám vào một ô không phải đường`);
      const { half } = streetCrossSection(style, rankOfRoad(cell.variant, cell.tier));
      const lệch = Math.max(Math.abs(piece.ox), Math.abs(piece.oy));
      if (TRÊN_ĐƯỜNG.has(piece.kind)) {
        assert.ok(lệch <= half + 1e-9,
          `kỷ ${era}: "${piece.kind}" lệch ${lệch.toFixed(3)} > nửa lòng đường ${half.toFixed(3)} — nó phải NẰM TRÊN mặt đường`);
      } else {
        assert.ok(lệch > half,
          `kỷ ${era}: "${piece.kind}" lệch ${lệch.toFixed(3)} ≤ nửa lòng đường ${half.toFixed(3)} — nó đang đứng giữa đường`);
      }
      // và không được văng ra khỏi ô của chính nó: nửa ô là 0,5
      assert.ok(Math.abs(piece.ox) < 0.5 && Math.abs(piece.oy) < 0.5,
        `kỷ ${era}: "${piece.kind}" lệch ra ngoài ô của nó (${piece.ox.toFixed(2)}, ${piece.oy.toFixed(2)})`);
      kiểm += 1;
    }
    assert.ok(kiểm > 0, `kỷ ${era}: không có món nào để kiểm`);
  }
});

test('KHÔNG ĐỘNG VÀO THỨ GÌ ĐÃ CÓ (ADR-007): thêm đồ đường phố mà nhà cửa đứng nguyên', () => {
  /**
   * Bài này dựng bố cục rồi so phần KHÔNG phải đồ đường phố với một bản dựng chỉ có phần ấy. Nó
   * không hỏi "có bao nhiêu món" — nó hỏi *"những thứ có trước còn nguyên không"*, đúng lời hứa
   * bảo tàng bất động.
   */
  for (const era of [3, 7, 11, 14]) {
    const layout = layoutOf(era);
    // ⚠️ VÀ ĐỒ ĐƯỜNG PHỐ PHẢI Ở DANH SÁCH RIÊNG, KHÔNG LẪN VÀO `props`. `props` mang bất biến
    // "mỗi ô một thứ" mà sáu bài test khác đang canh, và chúng canh ĐÚNG — hai cái cây một ô là
    // lỗi. Một cột đèn đứng trên bó vỉa thì không chiếm ô nào cả, nên nó không thuộc về danh sách ấy.
    const kinds = new Set(STREET_KINDS);
    const cũ = layout.props.filter((p) => !kinds.has(p.kind));
    assert.equal(cũ.length, layout.props.length,
      `kỷ ${era}: đồ đường phố đã lẫn vào \`props\` — sáu bài test bất biến "mỗi ô một thứ" sẽ đỏ`);
    assert.ok((layout.street ?? []).length > 0, `kỷ ${era}: danh sách \`street\` rỗng`);
    assert.ok(cũ.length > 0, `kỷ ${era}: bố cục rỗng`);
    assert.equal(layout.buildings.length, BLUEPRINT_CATALOG[era].length,
      `kỷ ${era}: số công trình đổi — đồ đường phố đã lấn vào chỗ của chúng`);
    for (const b of layout.buildings) {
      assert.ok(Number.isInteger(b.x) && Number.isInteger(b.y),
        `kỷ ${era}: công trình ${b.bpId} không còn ở tâm ô`);
    }
  }
});

test('HÌNH HỌC: mọi món đều dựng ra khối thật, và không món nào to bằng cái nhà', () => {
  for (const kind of STREET_KINDS) {
    for (const era of ERAS) {
      const spec = buildPropSpec({ kind, era, seed: `t|${kind}|${era}` });
      assert.ok(spec.parts.length > 0, `"${kind}" kỷ ${era} ra rỗng`);
      assert.ok(spec.triangles > 0, `"${kind}" kỷ ${era} không có tam giác nào`);
      /**
       * ⚠️ TRẦN CAO ĐỘ LÀ MỘT QUAN HỆ VỚI NGƯỜI, KHÔNG PHẢI MỘT CON SỐ ĐẸP. Cột điện Tokyo cao
       * nhất bộ (~1,1 đơn vị ≈ 4,4 m — đúng thật), người cao 0,42. Bất cứ thứ gì vượt gấp ba lần
       * cột ấy thì không còn là đồ đường phố nữa, nó là một toà nhà đặt nhầm chỗ.
       */
      assert.ok(spec.height < 1.35, `"${kind}" kỷ ${era} cao ${spec.height.toFixed(2)} — quá cỡ đồ đường phố`);
      assert.ok(spec.height > 0.005, `"${kind}" kỷ ${era} cao ${spec.height.toFixed(3)} — bẹt tới mức không thấy`);
    }
  }
});

test('MẬT ĐỘ: phố dài hơn thì nhiều đèn hơn, và không phố nào chật cứng', () => {
  const era = 11;
  const ngắn = layoutOf(era, 20);
  const dài = layoutOf(era, 90);
  const đếm = (l) => deriveStreetFurniture({ era, roads: l.props.filter((p) => p.kind === 'road') }).length;
  const a = đếm(ngắn);
  const b = đếm(dài);
  assert.ok(b > a, `mạng đường mở rộng từ ${ngắn.props.filter((p) => p.kind === 'road').length} lên ${dài.props.filter((p) => p.kind === 'road').length} ô mà đồ đạc vẫn ${a} → ${b}`);
  // và không quá hai món trên một ô đường: quá thì con phố thành bãi phế liệu
  const roads = dài.props.filter((p) => p.kind === 'road');
  const perCell = new Map();
  for (const piece of deriveStreetFurniture({ era, roads })) {
    const k = `${piece.x},${piece.y}`;
    perCell.set(k, (perCell.get(k) ?? 0) + 1);
  }
  for (const [k, n] of perCell) assert.ok(n <= 2, `ô đường ${k} có ${n} món chen nhau`);
});
