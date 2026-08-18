/**
 * drawCallBudget.test.js — MỐC LỆNH VẼ RIÊNG CHO TỪNG KỶ.
 *
 * ⚠️ VÌ SAO KHÔNG CÓ MỘT CÁI TRẦN CHUNG (Đàm chốt 2026-08-18)
 *
 * Tài liệu từng ghi *"không quá 13 lệnh vẽ"*. Con số ấy đo trên đúng BA kỷ (6 · 9 · 13) rồi được
 * viết ra như luật của cả 15 kỷ; đo đủ 15 kỷ thì kỷ 10 ra 14 — và ra 14 **từ trước Phase 10**.
 * Cách sửa hiển nhiên là nâng trần lên 14. Đàm bác, vì lý do đúng:
 *
 *   *"14 kỷ khác đang ở 11–13, nên trần chung 14 cho chúng ba lệnh vẽ trống để trôi vào trong im
 *   lặng. Cổng chỉ bắt được kỷ tệ nhất."*
 *
 * Đây đúng bẫy Phase 7D — **một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ**. Lời
 * hứa thật không phải "≤ 13"; nó là *"kỷ này không được tốn hơn chính nó hôm nay"*. Nên mốc phải là
 * MỘT BẢNG 15 DÒNG, và mỗi dòng là một SỰ THẬT ĐO ĐƯỢC chứ không phải một con số ai đó chọn.
 *
 * ⚠️ PHÉP ĐO SINH RA BẢNG NÀY — chép lại để phiên sau tái lập được, đừng sửa số mà không chạy lại:
 *
 *     node scripts/city-preview.mjs --era N --hour 12 --bench 1 --no-shadow
 *
 * chạy N = 1..15, ngày **2026-08-18**, trên cây làm việc sau Phase 10 Bước 2. Cột đọc là cột đầu
 * ("thành phố") của dòng `[stats] | lệnh vẽ | …`, tức KHÔNG gồm 2 lệnh vẽ của vòm trời + rặng núi.
 *
 * ⚠️ VÀ VÌ SAO BÀI TEST NÀY CHẠY ĐƯỢC BẰNG `node --test`, KHÔNG CẦN CHROMIUM
 *
 * Cả thành phố gộp thành **một khối hình học có nhóm vật liệu**, mỗi họ vật liệu một nhóm, và three
 * vẽ mỗi nhóm bằng một lệnh vẽ (`mergeSinks` ở `geometryFactory.js` duyệt theo `MATERIAL_ORDER`).
 * Ngoài khối gộp ấy, cảnh còn đúng bốn tấm cố định. Đem đối chiếu với phép đo thật ở cả 15 kỷ:
 *
 *     lệnh vẽ thành phố = (số họ vật liệu) + 4      ← đúng 15/15 kỷ, KHÔNG một ngoại lệ
 *
 * Đây **không phải một xấp xỉ** — hiệu số ra đúng 4 ở cả mười lăm kỷ, nên số họ vật liệu là một
 * phép tính CHÍNH XÁC cho số lệnh vẽ, không phải một thứ đại diện cho nó (`TECH_DEBT #22` là bài
 * học về việc nhầm hai chuyện đó). Vì `collectCitySpecs` thuần nên bài test này rẻ, chạy trong
 * `npm test`, và tự đỏ ngay lần đầu có ai kéo thêm một họ vật liệu vào một kỷ.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import { collectCitySpecs } from './cityParts.js';
import { getEraStyle, ERA_STYLES } from './eraStyle.js';
import { materialFamilyFor, MATERIAL_ORDER } from './materials.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);

/**
 * Bốn tấm cố định nằm NGOÀI khối gộp, có ở mọi kỷ và không phụ thuộc kỷ nào:
 * nền ô lưới · mặt đường · thân cư dân · đầu cư dân.
 *
 * ⚠️ Con số 4 KHÔNG được viết ra từ việc đếm bằng mắt trong `sceneGraph.js` — nó là hiệu số đo
 * được giữa phép đo thật và số họ vật liệu, và nó ra ĐÚNG 4 ở cả 15 kỷ. Nếu một phase sau thêm một
 * tấm cố định (ví dụ tách mặt nước ra khối riêng) thì con số này phải đổi, và cách biết là bài test
 * dưới đây sẽ đỏ ĐỒNG LOẠT ở cả 15 kỷ — một hình dạng đỏ rất dễ đọc, khác hẳn với "một kỷ đỏ".
 */
const TAM_CO_DINH = 4;

/**
 * MỐC LỆNH VẼ THÀNH PHỐ của từng kỷ — đo ngày 2026-08-18 bằng lệnh ghi ở đầu file.
 *
 * ⚠️ ĐÂY LÀ SỐ ĐO, KHÔNG PHẢI SỐ CHỌN. Muốn sửa một dòng thì phải chạy lại phép đo và ghi lại ngày,
 * chứ không phải nới cho vừa kết quả — *"cổng KHÔNG mất tác dụng răn đe khi đặt lại cho đúng; nó
 * mất tác dụng khi giữ một con số sai rồi ai cũng học cách ngó lơ"* (Đàm, 2026-08-18).
 *
 * ⚠️ Kỷ 10 = 12 (cao nhất) vì nó là kỷ DUY NHẤT dùng cùng lúc cả `brick` lẫn `slate`. Đó là sự thật
 * về vật liệu thời công nghiệp Anh, không phải một khuyết tật — và tuyệt đối KHÔNG được gộp hai
 * vật liệu ấy lại để lấy một con số đẹp hơn (ADR-025 đã cấm đúng kiểu mua-số-bằng-cách-nói-dối này).
 */
const MOC_LENH_VE = {
  1: 9, 2: 11, 3: 11, 4: 11, 5: 10,
  6: 11, 7: 11, 8: 11, 9: 10, 10: 12,
  11: 10, 12: 10, 13: 10, 14: 10, 15: 10,
};

/** Dựng đúng thành phố mà phép đo đã chụp: cả 5 bản vẽ, cấp 1, 40 phiên, chuỗi 9. */
function thanhPhoDoDuoc(era) {
  const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
  return computeCityLayout({
    built:  ids,
    levels: Object.fromEntries(ids.map((id) => [id, 1])),
    era,
    stats:  { sessionCount: 40, streakLength: 9 },
  });
}

/**
 * Họ vật liệu của CẢ thành phố, theo đúng thứ tự `MATERIAL_ORDER` mà `mergeSinks` duyệt.
 *
 * ⚠️ `themHo` nhận một HỌ, không phải một VAI — và sự khác biệt ấy đã làm bản đầu của bài đối chứng
 * dưới đây ĐỎ OAN. `materialFamilyFor(vai, style)` là một phép ÁNH XẠ phụ thuộc kỷ: nhiều vai khác
 * nhau gộp về cùng một họ, và gộp về họ nào thì tuỳ kỷ. Nên "chọn một vai mà kỷ này chưa dùng"
 * KHÔNG bảo đảm sinh ra một họ mới — ở kỷ 2 cả tám vai thử đều rơi trúng bốn họ nó đã có. Đối
 * chứng phải nói thẳng bằng ngôn ngữ của thứ nó đang đếm.
 */
function hoVatLieu(era, themHo = null) {
  const style = getEraStyle(era);
  const ho = new Set();
  for (const item of collectCitySpecs({ layout: thanhPhoDoDuoc(era) })) {
    for (const part of item.spec.parts) ho.add(materialFamilyFor(part.role, style));
  }
  // Móng (plinth) do `sceneGraph.js` dựng, luôn mang vai `stone`. Nó nằm ngoài `collectCitySpecs`
  // vì cần cao độ địa hình, nhưng nó CÓ đi vào khối gộp nên phải tính vào đây.
  ho.add(materialFamilyFor('stone', style));
  if (themHo) ho.add(themHo);
  return MATERIAL_ORDER.filter((f) => ho.has(f));
}

function lenhVe(era, themHo = null) {
  return hoVatLieu(era, themHo).length + TAM_CO_DINH;
}

/**
 * Tổng số khối của cả thành phố — chỉ dùng làm GÁC CHẠY-RỖNG.
 *
 * ⚠️ Không thể gác bằng chính số lệnh vẽ: `hoVatLieu` luôn cộng thêm họ của móng, nên kể cả khi
 * `collectCitySpecs` trả về RỖNG thì số lệnh vẽ vẫn ra 5 — lớn hơn `TAM_CO_DINH`, tức cái gác cũ
 * không thể đỏ. Phải hỏi thẳng thứ có thể biến mất.
 */
function soKhoiThanhPho(era) {
  let n = 0;
  for (const item of collectCitySpecs({ layout: thanhPhoDoDuoc(era) })) n += item.spec.parts.length;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════════

test('MỖI KỶ KHÔNG ĐƯỢC TỐN HƠN MỐC CỦA CHÍNH KỶ ĐÓ', () => {
  // THỬ-CHO-ĐỎ: đổi một vai bất kỳ trong `groundFloor.js`/`buildingSpec.js` sang một họ mà kỷ ấy
  // chưa có (ví dụ `'water'` ở kỷ 1) → chỉ kỷ đó đỏ, kèm tên họ vừa bị kéo vào.
  const bang = [];
  for (const era of ERAS) {
    const moc = MOC_LENH_VE[era];
    assert.ok(Number.isFinite(moc), `kỷ ${era} không có mốc — bảng phải đủ 15 dòng`);
    const thuc = lenhVe(era);
    bang.push({ era, thuc, moc });
    assert.ok(thuc <= moc,
      `kỷ ${era} tốn ${thuc} lệnh vẽ, vượt mốc ${moc} đo được ngày 2026-08-18. `
      + `Họ vật liệu hiện tại: ${hoVatLieu(era).join(', ')}. `
      + 'Đây KHÔNG phải chỗ để nới mốc — hoặc dùng lại một họ đã có, hoặc đo lại rồi ghi ngày mới.');
  }
  // Gác chạy-rỗng: phải duyệt đủ 15 kỷ và mọi kỷ phải thật sự sinh ra khối. Ngưỡng 100 khối lấy
  // rất thấp so với thực tế (kỷ mỏng nhất đo được 1.400+) — nó ở đây để bắt ca `collectCitySpecs`
  // trả rỗng, không phải để canh một ngân sách.
  assert.equal(bang.length, 15, 'không duyệt đủ 15 kỷ');
  for (const { era } of bang) {
    assert.ok(soKhoiThanhPho(era) > 100,
      `kỷ ${era}: thành phố chỉ có ${soKhoiThanhPho(era)} khối — \`collectCitySpecs\` gần như `
      + 'trả rỗng, cả bài test này đang đếm một thành phố không tồn tại');
  }
});

test('ĐỐI CHỨNG: kéo thêm MỘT họ vật liệu vào một kỷ thì mốc của kỷ ấy phải ĐỎ', () => {
  // ⚠️ Không có bài này thì bài trên có thể xanh vì nó chẳng đo gì. Luật Phase 9A: mỗi ngưỡng phải
  // kèm một đối chứng nhốt sẵn ca hỏng, nếu không nó sẽ bị nới dần cho tiện.
  //
  // Hỏi TỪNG KỶ MỘT, không hỏi tổng: một họ lạ ở đúng một kỷ phải làm ĐÚNG kỷ ấy vượt mốc. Hỏi
  // tổng thì một kỷ dư chỗ có thể bù cho một kỷ vượt — đúng cái phễu mà bảng-15-dòng sinh ra để gỡ.
  let soCaDoiChung = 0;
  for (const era of ERAS) {
    const dangCo = new Set(hoVatLieu(era));
    // Lấy một HỌ mà kỷ này chưa dùng, ngay từ `MATERIAL_ORDER`. Kỷ dày nhất mới dùng 8/16 họ nên
    // luôn còn — và nếu hết thì chính điều đó là một phát hiện, phải đỏ chứ không được bỏ qua.
    const hoLa = MATERIAL_ORDER.find((f) => !dangCo.has(f));
    assert.ok(hoLa, `kỷ ${era} đã dùng hết ${MATERIAL_ORDER.length} họ — đối chứng mất tác dụng`);
    const sauKhiThem = lenhVe(era, hoLa);
    assert.equal(sauKhiThem, MOC_LENH_VE[era] + 1,
      `kỷ ${era}: thêm họ "${hoLa}" mà số lệnh vẽ không nhích lên đúng 1 — phép đo đã hỏng`);
    assert.ok(sauKhiThem > MOC_LENH_VE[era],
      `kỷ ${era}: thêm họ "${hoLa}" mà vẫn lọt mốc ⇒ mốc của kỷ này đang rộng, không phải hàng rào`);
    soCaDoiChung += 1;
  }
  assert.equal(soCaDoiChung, 15, 'đối chứng không chạy đủ 15 kỷ');
});

test('BẢNG MỐC PHẢI LÀ 15 MỐC RIÊNG, KHÔNG PHẢI MỘT TRẦN CHUNG ĐỘI LỐT', () => {
  // ⚠️ ĐÂY LÀ BÀI CANH CHÍNH CÁI LÝ DO Đàm CHỌN CÁCH NÀY. Không có nó thì cách rẻ nhất để làm bài
  // đầu tiên hết đỏ là điền cả 15 dòng bằng cùng một số — bảng vẫn "có 15 dòng", vẫn xanh, và ta
  // quay lại đúng cái trần chung đã bị bác: 14 kỷ được tặng chỗ trống để trôi trong im lặng.
  const moc = ERAS.map((e) => MOC_LENH_VE[e]);
  const cao = Math.max(...moc);
  const thap = Math.min(...moc);
  assert.ok(cao - thap >= 2,
    `mọi mốc nằm trong ${thap}–${cao}: bảng này đang hành xử như một trần chung. Mốc phải bám sát `
    + 'phép đo của TỪNG kỷ, nếu không cổng chỉ bắt được kỷ tệ nhất.');
  // Và phần lớn các kỷ phải nằm THẤP HƠN mốc cao nhất — đó chính là phần mà một trần chung sẽ cho
  // không. Đo được 14/15 kỷ dưới mốc của kỷ 10 lúc viết bài này.
  const duoiDinh = moc.filter((m) => m < cao).length;
  assert.ok(duoiDinh >= 10,
    `chỉ ${duoiDinh}/15 kỷ nằm dưới mốc cao nhất — một trần chung sẽ gần như không cho không gì cả, `
    + 'tức bảng riêng từng kỷ mất lý do tồn tại. Xem lại phép đo.');
});

test('QUAN HỆ "lệnh vẽ = số họ + 4" phải còn đúng với phép đo thật ngày 2026-08-18', () => {
  // ⚠️ Đây là bài giữ cho ba bài trên còn Ý NGHĨA. Chúng đếm HỌ VẬT LIỆU; điều biến phép đếm ấy
  // thành một phát biểu về LỆNH VẼ là hằng số 4. Nếu một phase sau tách thêm một tấm cố định ra
  // khỏi khối gộp thì hằng số đổi, và lúc đó ba bài trên vẫn xanh trong khi chúng đang nói sai —
  // đúng bẫy "phép đo đúng nhưng đo sai đại lượng". Bài này nhốt sẵn bộ số đã đo để chuyện đó
  // không thể xảy ra trong im lặng.
  for (const era of ERAS) {
    assert.equal(hoVatLieu(era).length + TAM_CO_DINH, MOC_LENH_VE[era],
      `kỷ ${era}: số họ + ${TAM_CO_DINH} không còn khớp mốc đo được. Hoặc có tấm cố định mới (thì `
      + 'sửa `TAM_CO_DINH` và đo lại cả bảng), hoặc thành phố đã đổi họ vật liệu.');
  }
});
