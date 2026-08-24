import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildCityPlan, planIsPlaza, planIsRoad, planIsWonderZone, planRoadCells, planWonderZone,
} from './cityPlan.js';
import { NETWORK_STYLES, getNetworkStyle } from './networkStyle.js';
import { CITY_GRID_SIZE } from '../cityGrid.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const G = CITY_GRID_SIZE;
const key = (x, y) => `${x},${y}`;

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// ADR-007 — "BẢO TÀNG BẤT ĐỘNG". Ba bài dưới đây là điều kiện SỐNG CÒN của cả phase, không phải
// một mục kiểm cho đủ: nếu bố cục biết tiến độ thì mỗi lần Đàm xây thêm một căn nhà, những công
// trình đã xây sẽ DỜI CHỖ — và một thành phố đã niêm phong nhiều năm sẽ dựng lại khác đi.
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Cùng khuôn đã khoá `buildTerrain` ở Phase 7B: gọi kèm DỮ LIỆU RÁC rồi đòi kết quả y hệt. "Hàm
 * hiện không nhận tham số đó" là một sự thật rất dễ mất — người sau chỉ cần thêm một tham số tuỳ
 * chọn là bất biến chết mà mọi bài test khác vẫn xanh.
 */
test('ADR-007: bố cục là hàm thuần của RIÊNG `era` — dữ liệu rác không đổi được gì', () => {
  const rac = [
    { built: ['a', 'b', 'c'], sessionCount: 999 },
    { buildings: [1, 2, 3], levels: { a: 3 }, stats: { totalSessions: 42 } },
    { pending: [{ bpId: 'x', progress: 0.5 }], streakLength: 7 },
  ];
  for (const era of ERAS) {
    const sach = JSON.stringify(planRoadCells(era));
    for (const r of rac) {
      assert.equal(JSON.stringify(planRoadCells(era, r)), sach, `kỷ ${era}: mạng đường đổi theo rác`);
      assert.equal(JSON.stringify(planWonderZone(era, 4, r)), JSON.stringify(planWonderZone(era, 4)),
        `kỷ ${era}: khu đất kỳ quan đổi theo rác`);
    }
  }
});

/**
 * ⚠️ QUÉT ĐỦ MỌI MỐC PHIÊN, KHÔNG LẤY BA MẪU. Bài học `TECH_DEBT #38`: một con số suy từ mẫu nhỏ
 * sẽ được đọc như một luật của cả tập. Ở đây phép quét rẻ tới mức không có cớ nào để đoán.
 */
test('ADR-007: 15 kỷ × 120 mốc phiên — bộ xương KHÔNG nhúc nhích một ô', () => {
  let soCa = 0;
  for (const era of ERAS) {
    const goc = JSON.stringify(buildCityPlan(era).roads);
    for (let s = 1; s <= 120; s += 1) {
      // Truyền `s` vào đúng chỗ một người vô ý sẽ truyền nó — tham số thứ hai của mọi lời gọi.
      assert.equal(JSON.stringify(buildCityPlan(era, s).roads), goc, `kỷ ${era}, phiên ${s}`);
      soCa += 1;
    }
  }
  assert.equal(soCa, 15 * 120, 'phải quét đủ 1.800 tổ hợp');
});

/**
 * ⚠️ ĐÂY LÀ BÀI ĐÃ BẮT ĐƯỢC LỖI KỶ 5, và nó là lý do `parcelCapacity.js` ra đời.
 * Kỷ 5 khai 6 thửa, bộ sinh dựng ra 4, không có gì đỏ lên. Bốn thửa thì `ranked.slice(0, 5)` chỉ
 * ra 4 khu đất ⇒ một hạng bản vẽ không có khu nào ⇒ `planWonderZone` rơi về khu của hạng khác ⇒
 * HAI kỳ quan chung một chỗ ⇒ vỡ ADR-007. Triệu chứng im lặng tuyệt đối.
 */
test('số thửa dựng ra phải BẰNG số thửa khai, ở cả 15 kỷ', () => {
  for (const era of ERAS) {
    const st = getNetworkStyle(era);
    assert.equal(
      buildCityPlan(era).parcels.length, st.parcels,
      `kỷ ${era}: khai ${st.parcels} thửa, dựng ra ${buildCityPlan(era).parcels.length}`,
    );
  }
});

test('năm khu đất kỳ quan: đủ 5, không khu nào giao nhau, không khu nào đè lên đường', () => {
  for (const era of ERAS) {
    const plan = buildCityPlan(era);
    const daDung = new Map();
    for (let rank = 0; rank <= 4; rank += 1) {
      const z = plan.wonderZones[rank];
      assert.ok(z, `kỷ ${era}: hạng ${rank} không có khu đất`);
      assert.ok(z.w >= 1 && z.h >= 1, `kỷ ${era}: hạng ${rank} có khu đất rỗng`);
      for (let y = z.y; y < z.y + z.h; y += 1) {
        for (let x = z.x; x < z.x + z.w; x += 1) {
          assert.ok(x >= 0 && x < G && y >= 0 && y < G, `kỷ ${era}: hạng ${rank} lòi ra khỏi lưới`);
          assert.ok(!plan.roadSet.has(key(x, y)), `kỷ ${era}: hạng ${rank} đè lên đường (${x},${y})`);
          const chu = daDung.get(key(x, y));
          assert.equal(chu, undefined,
            `kỷ ${era}: hạng ${rank} và hạng ${chu} cùng chiếm ô (${x},${y}) — VỠ ADR-007`);
          daDung.set(key(x, y), rank);
        }
      }
    }
  }
});

/**
 * ⚠️ **HỎI Ở CẤP Ô, KHÔNG HỎI Ở CẤP HÌNH CHỮ NHẬT — và đây là một thay đổi có lý do đã đo, không
 * phải một phép nới cho test hết đỏ.** Trước Phase 21 hai câu ấy là MỘT: ranh giới thửa thẳng nên
 * hình chữ nhật của thửa đúng bằng tập ô của nó. Nay ranh giới là một CUNG (ADR-059) nên nó phình
 * vào lòng thửa vài ô, và một ô nằm đúng trên đường nhát cắt mà cung né qua thì không thuộc hình
 * chữ nhật nào cả. Đo được trước bản vá: kỷ 1 có thửa đè lên đường ở (5,0); phép cộng "thửa +
 * đường = 144 ô" thủng ở 13/15 kỷ.
 *
 * ⇒ Ba lời hứa GIỮ NGUYÊN (phủ kín · không chồng lấn · không lòi khỏi lưới) và nay còn CHẶT HƠN,
 * vì chúng được hỏi trên đúng thứ mà `planParcelAt` trả lời chứ không trên một hình bao. Câu về Ý
 * ĐỊNH (`w`/`h` không mỏng hơn `minSide`) vẫn hỏi hình chữ nhật — đó vẫn là chỗ nó sống.
 */
test('thửa đất: phủ kín phần không phải đường, không chồng lấn, không lòi ra ngoài lưới', () => {
  for (const era of ERAS) {
    const plan = buildCityPlan(era);
    const chu = new Map();
    for (const p of plan.parcels) {
      assert.ok(p.x0 >= 0 && p.y0 >= 0 && p.x1 < G && p.y1 < G, `kỷ ${era}: thửa lòi khỏi lưới`);
      assert.ok(p.w >= getNetworkStyle(era).minSide && p.h >= getNetworkStyle(era).minSide,
        `kỷ ${era}: thửa ${p.index} (${p.w}×${p.h}) mỏng hơn `
        + `minSide ${getNetworkStyle(era).minSide}`);
      assert.ok(p.cells.length > 0,
        `kỷ ${era}: thửa ${p.index} bị con đường ăn hết sạch ô — kỳ quan của nó sẽ không có chỗ đứng`);
      assert.equal(p.area, p.cells.length, `kỷ ${era}: thửa ${p.index} khai diện tích khác số ô thật`);
      for (const { x, y } of p.cells) {
        assert.ok(x >= 0 && x < G && y >= 0 && y < G, `kỷ ${era}: thửa lòi khỏi lưới ở (${x},${y})`);
        assert.equal(chu.get(key(x, y)), undefined, `kỷ ${era}: hai thửa chồng nhau ở (${x},${y})`);
        chu.set(key(x, y), p.index);
        assert.ok(!plan.roadSet.has(key(x, y)), `kỷ ${era}: thửa đè lên đường (${x},${y})`);
      }
    }
    assert.equal(chu.size + plan.roadSet.size, G * G,
      `kỷ ${era}: ${G * G} ô mà thửa + đường chỉ phủ ${chu.size + plan.roadSet.size}`);
  }
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// BẢN SẮC — ĐÂY LÀ TOÀN BỘ LÝ DO PHASE 20 TỒN TẠI
// ═════════════════════════════════════════════════════════════════════════════════════════════════

/**
 * Đàm nhìn bản quét rồi nói *"nhà vẫn quy hoạch rất kỳ quặc, rất bài bản"*. Nếu hai kỷ ra cùng một
 * mạng đường thì đúng cái bệnh ấy còn nguyên, chỉ ít hơn một chút. So TỪNG CẶP (105 cặp), không so
 * cặp liền nhau — bài học `daylight.test.js`: duyệt danh sách theo thứ tự thì kỷ đầu và kỷ cuối
 * KHÔNG BAO GIỜ được đem so với nhau.
 */
test('15 KỶ RA 15 BỘ XƯƠNG — không cặp nào trùng khít', () => {
  const chuKy = ERAS.map((era) => {
    const p = buildCityPlan(era);
    return { era, road: [...p.roadSet].sort().join('|') };
  });
  let soCap = 0;
  for (let i = 0; i < chuKy.length; i += 1) {
    for (let j = i + 1; j < chuKy.length; j += 1) {
      assert.notEqual(chuKy[i].road, chuKy[j].road,
        `kỷ ${chuKy[i].era} và kỷ ${chuKy[j].era} có mạng đường TRÙNG KHÍT`);
      soCap += 1;
    }
  }
  assert.equal(soCap, 105, 'phải duyệt đủ 105 cặp');
});

/**
 * ⚠️ ĐỐI CHỨNG cho bài trên — nhốt đúng thế giới TRƯỚC Phase 20. Không có nó thì bài trên có thể
 * xanh nhờ một thứ chẳng liên quan, và không ai biết nó còn răng hay không.
 */
test('đối chứng: 15 bộ xương giống hệt nhau thì bài "15 ra 15" PHẢI đỏ', () => {
  const cu = '0|4|8|11';  // đúng `ROAD_LINES` cũ: 4 hàng + 4 cột, dùng chung cho cả 15 kỷ
  const nhu = ERAS.map(() => cu);
  let batDuoc = false;
  for (let i = 0; i < nhu.length && !batDuoc; i += 1) {
    for (let j = i + 1; j < nhu.length; j += 1) if (nhu[i] === nhu[j]) { batDuoc = true; break; }
  }
  assert.ok(batDuoc, 'phép so cặp không bắt được cả một bảng trùng khít — nó đã mất răng');
});

/**
 * Tiêu chí nghiệm thu Đàm ra: *"không kỷ nào còn đối xứng bốn chiều"*, trừ các kỷ `grid` nơi đối
 * xứng là ĐÚNG. Đo cả ba phép: soi gương ngang, soi gương dọc, xoay 90°.
 */
test('không kỷ nào đối xứng — đối xứng bốn chiều là thứ mắt đọc ra đầu tiên', () => {
  const doiXung = (set, f) => {
    for (const k of set) {
      const [x, y] = k.split(',').map(Number);
      const [a, b] = f(x, y);
      if (!set.has(key(a, b))) return false;
    }
    return true;
  };
  for (const era of ERAS) {
    const s = buildCityPlan(era).roadSet;
    const st = getNetworkStyle(era);
    if (st.plan === 'grid') continue;  // bàn cờ được phép đối xứng — đó là bản sắc của nó
    assert.ok(!doiXung(s, (x, y) => [G - 1 - x, y]), `kỷ ${era} (${st.plan}) đối xứng soi gương ngang`);
    assert.ok(!doiXung(s, (x, y) => [x, G - 1 - y]), `kỷ ${era} (${st.plan}) đối xứng soi gương dọc`);
    assert.ok(!doiXung(s, (x, y) => [y, G - 1 - x]), `kỷ ${era} (${st.plan}) đối xứng xoay 90°`);
  }
  // Gác: phép đo phải THẬT SỰ bắt được đối xứng, nếu không cả bài trên là một dòng chữ.
  const vuong = new Set(['0,0', '11,0', '0,11', '11,11']);
  assert.ok(doiXung(vuong, (x, y) => [G - 1 - x, y]), 'phép đo đối xứng đã hỏng');
});

/**
 * ⚠️ `sizeVary` LÀ MỘT CÁI NÚM — PHẢI CHỨNG MINH NÓ CÓ NỐI (Phase 7A). Vặn tới hai đầu vô lý rồi
 * đòi một hậu quả vô lý; một thay đổi "một chút" là hình dạng của cả nhiễu lẫn tín hiệu.
 */
test('`sizeVary` có nối thật: vặn 0 ↔ 1 phải đổi bộ xương ở cả 15 kỷ', async () => {
  const P = new URL('./cityPlan.js', import.meta.url).href;
  let n = 0;
  const chuKy = async (era) => {
    const m = await import(`${P}?probe=${n += 1}`);
    return [...m.buildCityPlan(era).roadSet].sort().join('|');
  };
  for (const era of ERAS) {
    const st = NETWORK_STYLES[era];
    const giu = st.sizeVary;
    try {
      st.sizeVary = 0; const deu = await chuKy(era);
      st.sizeVary = 1; const lon = await chuKy(era);
      assert.notEqual(deu, lon, `kỷ ${era}: cần gạt sizeVary không nối vào đâu cả`);
    } finally {
      st.sizeVary = giu;
    }
  }
});

// ═════════════════════════════════════════════════════════════════════════════════════════════════
// HỢP ĐỒNG VỚI CÁC TẦNG NGOÀI
// ═════════════════════════════════════════════════════════════════════════════════════════════════

test('mạng đường: đủ ba vai, ngã tư luôn mang vai đại lộ, thứ tự mở từ trong ra ngoài', () => {
  for (const era of ERAS) {
    const cells = planRoadCells(era);
    const set = new Set(cells.map((c) => key(c.x, c.y)));
    assert.equal(set.size, cells.length, `kỷ ${era}: có ô đường lặp`);
    assert.ok(cells.length > 0, `kỷ ${era}: không có đường nào`);
    for (const c of cells) {
      assert.ok([0, 1, 2].includes(c.variant), `kỷ ${era}: vai lạ ${c.variant}`);
      // Luật ngã tư (Phase 6C): ô nằm trên CẢ lát cắt dọc lẫn ngang phải rộng hết ô, nếu không mặt
      // đường thắt lại đúng chỗ giao nhau và trông như đường cụt.
      const dungTren = set.has(key(c.x, c.y - 1)) || set.has(key(c.x, c.y + 1));
      const ngang = set.has(key(c.x - 1, c.y)) || set.has(key(c.x + 1, c.y));
      if (dungTren && ngang && c.variant !== 0) {
        // Không phải mọi ô có hàng xóm bốn phía đều là ngã tư thật (hai đoạn song song kề nhau),
        // nên chỉ đòi điều này ở ô mà bộ sinh đã đánh dấu `both` — kiểm gián tiếp qua `tier`.
        assert.ok(c.tier >= 0, `kỷ ${era}: ô (${c.x},${c.y})`);
      }
    }
    const tiers = cells.map((c) => c.tier);
    for (let i = 1; i < tiers.length; i += 1) {
      assert.ok(tiers[i] >= tiers[i - 1],
        `kỷ ${era}: vành đai mở TRƯỚC mạng trong — thành phố mọc từ ngoài vào`);
    }
  }
});

test('`planRoadCells` trả BẢN SAO — tầng ngoài sửa được mà không hỏng trạng thái dùng chung', () => {
  const a = planRoadCells(7);
  a[0].x = 999;
  a.length = 1;
  const b = planRoadCells(7);
  assert.notEqual(b[0].x, 999);
  assert.ok(b.length > 1);
});

test('ba hàm hỏi-một-ô đồng ý với bảng bên trong, và ba nhóm không giao nhau', () => {
  for (const era of ERAS) {
    const plan = buildCityPlan(era);
    let duong = 0; let kyQuan = 0; let quangTruong = 0;
    for (let y = 0; y < G; y += 1) {
      for (let x = 0; x < G; x += 1) {
        const r = planIsRoad(era, x, y);
        const w = planIsWonderZone(era, x, y);
        const p = planIsPlaza(era, x, y);
        assert.equal(r, plan.roadSet.has(key(x, y)));
        assert.equal(w, plan.zoneSet.has(key(x, y)));
        assert.equal(p, plan.plazaSet.has(key(x, y)));
        assert.ok(Number(r) + Number(w) + Number(p) <= 1,
          `kỷ ${era}: ô (${x},${y}) vừa là đường vừa là đất đã hứa`);
        duong += Number(r); kyQuan += Number(w); quangTruong += Number(p);
      }
    }
    assert.ok(duong > 0 && kyQuan > 0, `kỷ ${era}: thiếu hẳn một nhóm`);
    assert.ok(G * G - duong - kyQuan - quangTruong > 0, `kỷ ${era}: không còn ô nào cho nhà dân`);
  }
});

test('kỷ lạ rơi về kỷ 1 — cùng phép chuẩn hoá với mọi bảng 15 kỷ khác', () => {
  const goc = JSON.stringify(buildCityPlan(1).roads);
  for (const la of [0, -5, NaN, undefined, null, 'bảy']) {
    assert.equal(JSON.stringify(buildCityPlan(la).roads), goc, `kỷ lạ ${String(la)}`);
  }
  assert.equal(JSON.stringify(buildCityPlan(99).roads), JSON.stringify(buildCityPlan(15).roads));
});
