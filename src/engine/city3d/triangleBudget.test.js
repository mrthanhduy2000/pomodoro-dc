/**
 * triangleBudget.test.js — MỐC TAM GIÁC RIÊNG CHO TỪNG KỶ. Đóng `TECH_DEBT #43`.
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI. Mục nợ #43 nói thẳng nguyên nhân, và nó là một câu đáng đọc lại:
 *
 *   *"cột lệnh vẽ có một bài test canh (`drawCallBudget.test.js`, bảng 15 mốc), cột tam giác thì
 *   không có gì cả. Chỗ có test không trôi, chỗ không có test trôi — ngay trong cùng một bảng,
 *   cùng một phase."*
 *
 * `e95cdf1` (Phase 11-B) sửa `roofStyle.js` — hình học THẬT — và không đụng `PERFORMANCE.md`, để
 * **6/15 dòng sai suốt một phase** (tổng lệch +14.360, và sai theo hướng TRẤN AN: bảng ghi kỷ 11 =
 * 50.114 trong khi thật là 53.890). Definition of Done có ghi *"tài liệu đã đồng bộ"*, nhưng một
 * câu chữ thì không đỏ lên được.
 *
 * ⚠️ ĐÂY LÀ MỘT CÁI CÂN, KHÔNG PHẢI MỘT CÁI CỔNG — cùng luật Đàm đã chốt cho `drawCallBudget`
 * (2026-08-21): *"Tôi cần thành phố rộng hơn, quy mô hơn nữa … không quan trọng hiệu năng."* Cái
 * vẫn bị cấm không phải việc TĂNG, mà là việc tăng **không ai biết**. Một dòng đi lên thì đo lại,
 * ghi ngày, và nói ra nó đến từ đâu.
 *
 * ⚠️ VÌ SAO CHẠY ĐƯỢC BẰNG `node --test`, KHÔNG CẦN CHROMIUM VÀ KHÔNG CẦN `three`.
 * `collectCitySpecs` (danh sách khối) và `countTriangles` (`parts.js`) đều THUẦN, và bệ kè nay
 * cũng thuần (`plinthParts`). Ba thứ ấy cộng lại là **đúng** nội dung khối `city` mà
 * `sceneGraph.js` gộp — không phải một thứ đại diện cho nó (`TECH_DEBT #22` là bài học về việc
 * nhầm hai chuyện đó).
 *
 * ⚠️ VÀ NÓ ĐÃ ĐƯỢC NEO VÀO MỘT ĐƯỜNG ĐO ĐỘC LẬP, nếu không thì nó chỉ là một công thức tự soi
 * gương — đúng cái bẫy `drawCallBudget` đã sập ngày 2026-08-23. Lệnh neo (2026-09-05):
 *
 *     node --import ./scripts/register-esm-loader.mjs scripts/scene-tri.mjs --era N --sessions 40 --level 1
 *
 * đọc dòng `… lệnh  city      city`. Bốn kỷ đã đối chiếu — **1 · 6 · 8 · 15 → 100.876 · 198.388 ·
 * 124.348 · 108.660**, khớp TỪNG ĐƠN VỊ với bảng dưới. Chính phép đối chiếu ấy lộ ra rằng chú thích
 * *"bệ kè chỉ tốn 12 tam giác"* ở `sceneGraph.js` đã sai từ Phase 8B: nó tốn **28**.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { collectCitySpecs } from './cityParts.js';
import { buildingSpanCells, countSpecTriangles, plinthParts } from './parts.js';
import { buildTerrain } from './terrain.js';
import { ERA_STYLES } from './eraStyle.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

/** Chỉ ba loại này đứng trên đất nên mới có thể cần bệ kè (cảnh vật thì không). */
const CO_BE = new Set(['building', 'scaffold', 'dwelling']);

/**
 * MỐC TAM GIÁC KHỐI `city` của từng kỷ — đo ngày **2026-09-05** ở `40 phiên · cấp 1 · chuỗi 9`,
 * đúng quần thể mà hàm `thanhPhoDoDuoc` dưới đây dựng.
 *
 * ⚠️ ĐÂY LÀ SỐ ĐO, KHÔNG PHẢI SỐ CHỌN. Muốn sửa một dòng thì chạy lại phép đo, ghi ngày, và nói ra
 * thứ gì đã kéo nó đi — chứ không nới cho vừa kết quả.
 * ⚠️ VÀ KHÔNG CÓ TRẦN CHUNG. Một con số tuyệt đối cho cả 15 kỷ thì cho 14 kỷ còn lại một khoảng
 * trống để trôi vào trong im lặng; cổng ấy chỉ bắt được kỷ tệ nhất (Đàm, 2026-08-18, `#38`).
 */
const MOC_TAM_GIAC = {
  1: 100876, 2: 107666, 3: 109464, 4: 158140, 5: 100250,
  6: 198388, 7: 159068, 8: 124348, 9: 139160, 10: 109756,
  11: 131008, 12: 108992, 13: 126648, 14: 143484, 15: 108660,
};

/** Số BỆ KÈ của từng kỷ — tách riêng vì nó là hàm của ĐỊA HÌNH, không của kiến trúc. */
const MOC_SO_BE = {
  1: 0, 2: 0, 3: 2, 4: 5, 5: 0, 6: 4, 7: 4, 8: 1,
  9: 5, 10: 3, 11: 3, 12: 0, 13: 0, 14: 0, 15: 0,
};

/**
 * Bệ kè CÓ VÁT là lăng trụ 4 cạnh 3 vành ⇒ 3×2×4 + 2×(4−2) = 28; KHÔNG vát thì 1 vành ⇒ 12.
 * ⚠️ HAI CON SỐ, KHÔNG PHẢI MỘT — và đây đúng là chỗ tôi suýt sai theo hướng ngược với chú thích
 * cũ: bắt được "28" rồi tuyên bố "12 đã chết". Đếm đủ 27 bệ của 15 kỷ thì **đúng MỘT bệ vẫn ăn
 * 12** (nó mỏng tới mức `bevelWidth` trả 0). Ngoại lệ ấy được ĐẾM TƯỜNG MINH ở bài dưới, vì một
 * ngoại lệ bị làm tròn đi là một ngoại lệ không ai biết khi nó thành hai.
 */
const BE_CO_VAT = 28;
const BE_KHONG_VAT = 12;
/** Phân bố ĐO ĐƯỢC 2026-09-05 trên cả 15 kỷ: `{tam giác mỗi bệ: số bệ}`. */
const PHAN_BO_BE = { 12: 1, 28: 26 };

function thanhPhoDoDuoc(era) {
  const built = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  return computeCityLayout({
    built,
    levels: Object.fromEntries(built.map((id) => [id, 1])),
    era,
    stats: { sessionCount: 40, streakLength: 9 },
  });
}

/** Đếm đúng thứ `sceneGraph.js` gộp vào khối `city`: mọi khối + bệ kè dưới chân chúng. */
function demTamGiac(era) {
  const layout = thanhPhoDoDuoc(era);
  const terrain = buildTerrain({ era, gridSize: layout.gridSize });
  let tamGiac = 0;
  let soBe = 0;
  let duyet = 0;
  const phanBo = {};
  for (const item of collectCitySpecs({ layout, detail: 'high' })) {
    duyet += 1;
    tamGiac += countSpecTriangles(item.spec?.parts ?? []);
    if (!CO_BE.has(item.kind)) continue;
    const span = buildingSpanCells(item.spec.parts);
    const { drop } = terrain.footprint(item.source.x, item.source.y, span);
    const be = plinthParts(span, drop);
    if (!be) continue;
    soBe += 1;
    const n = countSpecTriangles(be);
    phanBo[n] = (phanBo[n] ?? 0) + 1;
    tamGiac += n;
  }
  return { tamGiac, soBe, duyet, phanBo };
}

test('MỖI KỶ GIỮ ĐÚNG MỐC TAM GIÁC CỦA CHÍNH NÓ', () => {
  const lech = [];
  for (const era of ERAS) {
    const { tamGiac, duyet } = demTamGiac(era);
    // ⚠️ GÁC CHẠY-RỖNG: một vòng lặp duyệt 0 khối cũng "không lệch mốc nào".
    assert.ok(duyet >= 30, `kỷ ${era} chỉ duyệt ${duyet} khối — quần thể sai hình dạng`);
    if (tamGiac !== MOC_TAM_GIAC[era]) lech.push(`kỷ ${era}: ${tamGiac} (mốc ${MOC_TAM_GIAC[era]})`);
  }
  assert.deepEqual(lech, [], `tam giác đã trôi:\n  ${lech.join('\n  ')}`);
});

test('SỐ BỆ KÈ GIỮ NGUYÊN — nó là hàm của ĐỊA HÌNH, đổi tức là địa hình đã đổi', () => {
  // ⚠️ Tách khỏi bài trên vì hai đại lượng có hai nguyên nhân khác nhau: mốc tam giác trôi khi ai
  // đó sửa kiến trúc, số bệ trôi khi ai đó sửa `terrain.js`. Gộp lại thì thông báo lỗi trỏ nhầm
  // tầng — đúng lỗi NHÃN đã cắn ở `frame-fit.mjs` (số đúng, tên sai).
  const thuc = Object.fromEntries(ERAS.map((era) => [era, demTamGiac(era).soBe]));
  assert.deepEqual(thuc, MOC_SO_BE);
});

test('BỆ KÈ TỐN 28 KHI CÓ VÁT, 12 KHI KHÔNG — con số cũ nêu một ca như thể là cả hai', () => {
  // ⚠️ Chú thích ở `sceneGraph.js` ghi "chỉ tốn 12 tam giác" nhiều tháng, và nó đúng ở thời một
  // lăng trụ 4 cạnh = 2×4 + 2×(4−2). Phase 8B làm bề rộng vát phụ thuộc KÍCH THƯỚC khối ⇒ bệ đủ
  // lớn thì có vát ⇒ mặt bên chia làm BA vành. Bài này khoá con số ĐO ĐƯỢC, không khoá con số nhớ.
  assert.equal(countSpecTriangles(plinthParts(3, 0.4)), BE_CO_VAT);
  assert.ok(BE_KHONG_VAT < BE_CO_VAT, 'không vát thì phải RẺ hơn có vát');
  // …và "không hụt" phải trả về `null` (không có bệ), chứ không phải một cái bệ cao 0.
  assert.equal(plinthParts(3, 0), null);
  assert.equal(plinthParts(3, -1), null);
});

test('PHÂN BỐ TAM GIÁC MỖI BỆ — ngoại lệ được ĐẾM, không bị làm tròn đi', () => {
  // ⚠️ Bài này thay cho một phép cộng TỰ ĐÚNG. Bản đầu của nó viết
  //     const khongBe = tamGiac − soBe × 28;  assert.equal(tamGiac, khongBe + soBe × 28);
  // — một hằng đẳng thức `x === x`, tức một cái gác KHÔNG THỂ đỏ (cùng bẫy đã ghi ở ADR-048). Nay
  // nó đếm TỪNG bệ một và đòi đúng phân bố đã đo: 26 bệ ăn 28, một bệ ăn 12. Thêm một bệ mỏng thứ
  // hai là đỏ, và đó chính là lúc cần biết.
  const gop = {};
  for (const era of ERAS) {
    for (const [n, so] of Object.entries(demTamGiac(era).phanBo)) {
      gop[n] = (gop[n] ?? 0) + so;
    }
  }
  assert.deepEqual(gop, PHAN_BO_BE);
  // Đối chứng: tổng phải khớp bảng `MOC_SO_BE` — hai đường đếm độc lập về cùng một đại lượng.
  const tongPhanBo = Object.values(gop).reduce((a, b) => a + b, 0);
  const tongMoc = Object.values(MOC_SO_BE).reduce((a, b) => a + b, 0);
  assert.equal(tongPhanBo, tongMoc);
  assert.ok(tongMoc > 0, 'không kỷ nào có bệ — bài test mất răng');
});

test('BẢNG KHÔNG ĐƯỢC THOÁI HOÁ VỀ MỘT TRẦN CHUNG', () => {
  // ⚠️ Cách rẻ nhất để một bảng 15 dòng hết đỏ là điền cả 15 dòng bằng cùng một số — lúc ấy nó
  // trông y hệt một bảng nhiều mốc mà thật ra là một trần chung (`TECH_DEBT #38`).
  const so = ERAS.map((era) => MOC_TAM_GIAC[era]);
  assert.equal(new Set(so).size, so.length, 'không hai kỷ nào được trùng mốc');
  const min = Math.min(...so);
  const max = Math.max(...so);
  assert.ok(max / min >= 1.5, `khoảng trải chỉ ${(max / min).toFixed(2)} lần — bảng quá dẹt`);
});
