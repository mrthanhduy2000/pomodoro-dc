/**
 * windowOpening.test.js — ROUND 53 (ADR-093), Việc 1.
 *
 * Bốn lời hứa, và ba trong bốn là QUAN HỆ chứ không phải con số, vì cả ba đều nói "…hơn…":
 *   1. **MỖI Ô CỬA CÓ HAI MÁ ĐỨNG** — vế bị bỏ quên suốt năm vòng, và là vế duy nhất cho ra một
 *      cặp sáng–tối ĐỔI THEO HƯỚNG MẶT TƯỜNG. Không có nó thì bốn mặt một khối hộp đọc y hệt nhau.
 *   2. **KHÔNG CHI TIẾT NÀO ĐẨY HÌNH BAO RA** — cái bẫy đã giết 11 mái của kỷ 6 trong chính vòng này.
 *   3. **Ô KÍNH NẰM SÂU TRONG LÒNG KHUNG** — nếu nó thò ra bằng hoặc hơn khung thì ta quay về đúng
 *      miếng dán cũ, và không có gì khác đỏ lên.
 *   4. **CẢ 15 KỶ ĐỀU ĐƯỢC**, kể cả hai kỷ đi nhánh dải kính — vì lần đầu chạy, đúng hai kỷ ấy bị
 *      bỏ sót và chỉ một chữ ký KHÔNG đổi mới chỉ ra điều đó.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  GLASS_SET_BACK, OPENING_KIT, OPENING_TAG, REVEAL_RELIEF, TOTAL_RELIEF_CAP,
  emitGlassBand, emitOpening, openingKit,
} from './windowOpening.js';
import { buildBuildingSpec, SILL_RELIEF } from './buildingSpec.js';
import { DOOR_FRAME_RELIEF } from './groundFloor.js';
import { WINDOW_KINDS } from './eraStyle.js';
import { specFootprint } from './parts.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const FACE = { nx: 0, nz: 1, sideways: false };
const ORIGIN = { x: 0, z: 0, y: 0 };
const M = { ww: 0.1, wh: 0.16 };

test('MỖI Ô CỬA CÓ HAI MÁ ĐỨNG — và chúng đứng ở HAI BÊN, không chồng lên nhau', () => {
  for (const kind of WINDOW_KINDS) {
    if (kind === 'none') continue;
    const out = [];
    emitOpening(out, FACE, ORIGIN, M, openingKit(kind, 7), {});
    // Má cửa = khối CAO hơn rộng, nằm lệch khỏi trục giữa. Hỏi bằng HÌNH HỌC chứ không bằng tên:
    // một bài hỏi theo `id` sẽ xanh cả khi ai đó đổi má cửa thành hai cái gờ nằm ngang.
    const dung = out.filter((p) => p.h > p.w * 1.2 && Math.abs(p.x) > 1e-6);
    assert.ok(dung.length >= 2,
      `kiểu "${kind}": chỉ ${dung.length} khối đứng lệch trục — không có má cửa thì mặt trời đứng`
      + ' bên nào bốn mặt tường cũng nhận đúng một bộ bóng như nhau');
    const trai = dung.filter((p) => p.x < 0).length;
    const phai = dung.filter((p) => p.x > 0).length;
    assert.ok(trai > 0 && phai > 0, `kiểu "${kind}": má cửa chỉ có một bên (${trai}/${phai})`);
  }
});

test('Ô KÍNH NẰM SÂU TRONG LÒNG KHUNG — nếu không thì nó lại là miếng dán', () => {
  for (const kind of WINDOW_KINDS) {
    if (kind === 'none') continue;
    // ⚠️ HAI KIỂU DẢI KÍNH ĐỨNG NGOÀI BÀI NÀY, VÀ NGOẠI LỆ KỂ TÊN BẰNG CHỨ KHÔNG "bao gồm":
    // `curtain` và `neon` KHÔNG đi qua `emitOpening` (chúng đi `emitGlassBand`), và một mặt kính
    // treo trên khung thép thì ĐÚNG là không có hốc — nó có NAN. Bắt chúng đạt ngưỡng hốc là bắt
    // một sự thật về kết cấu phải giống một sự thật khác. Vế của chúng nằm ở bài cuối file.
    if (kind === 'curtain' || kind === 'neon') continue;
    const kit = openingKit(kind, 7);
    const reveal = REVEAL_RELIEF * kit.reveal;
    assert.ok(GLASS_SET_BACK < reveal * 0.5,
      `kiểu "${kind}": kính thò ${GLASS_SET_BACK} mà khung chỉ ${reveal.toFixed(4)} — chiều sâu hốc`
      + ' nhìn thấy gần bằng 0, tức quay về đúng miếng dán của vòng 52');
    // ⚠️ ĐỐI CHỨNG NHỐT BỘ SỐ HỎNG CŨ: ô kính vòng 52 thò RA 0,035. Hốc nay phải sâu hơn thế.
    assert.ok(reveal - GLASS_SET_BACK > 0.035,
      `kiểu "${kind}": hốc sâu ${(reveal - GLASS_SET_BACK).toFixed(4)} — không hơn nổi bề THÒ RA`
      + ' 0,035 của ô kính cũ, tức vòng 53 chưa mua được gì');
  }
});

test('THỨ TỰ THỊ GIÁC: cửa ra vào > khung cửa sổ ≥ bệ cũ — cái neo tỉ lệ không được bị lấn', () => {
  // Ba con số này nằm ở ba file khác nhau và bài này là chỗ DUY NHẤT chúng gặp nhau. Đảo bất kỳ
  // dấu nào là hỏng trong im lặng: nhà vẫn dựng được, chỉ là mắt hết biết công trình to cỡ nào.
  assert.ok(TOTAL_RELIEF_CAP <= DOOR_FRAME_RELIEF,
    `khung cửa sổ thò ${TOTAL_RELIEF_CAP} mà cửa ra vào chỉ ${DOOR_FRAME_RELIEF} — cửa ra vào là`
    + ' CÁI NEO TỈ LỆ, nó không được chìm xuống dưới cửa sổ');
  assert.equal(TOTAL_RELIEF_CAP, SILL_RELIEF,
    'trần thò của bộ cửa sổ PHẢI bằng đúng `SILL_RELIEF` cũ — bằng nhau thì hình bao công trình'
    + ' không đổi một chút nào, và 11 mái của kỷ 6 không chết. Xem khối cảnh báo của `TOTAL_RELIEF_CAP`.');
});

test('KHÔNG CHI TIẾT NÀO CHÌA RA NGOÀI MÉP NHÀ — đo trên cả 15 kỷ', () => {
  /*
    ⚠️ ĐÂY LÀ BÀI CÓ RĂNG NHẤT FILE, và nó tồn tại vì một vết thật trong chính vòng 53: bản đầu để
    cánh chớp thò ra ngoài mép nhà ⇒ hình bao kỷ 6 rộng thêm 10% ⇒ `block.js` bóp đơn vị nhỏ lại ⇒
    `min(rw, rd)` tụt dưới `ROOFTOP_MIN_SPAN` ⇒ **11 căn của kỷ 6 mất sạch chi tiết mái**.
    Ba chặng, không chặng nào kêu lên; thứ bắt được là `block.test.js`, cách đó ba file.

    ⚠️ VÀ HAI BẢN ĐẦU CỦA CHÍNH BÀI NÀY ĐỀU ĐO SAI. Ghi lại cả hai, vì mỗi cái sai một kiểu:
      (a) *"hình bao ≤ thân + 2 × trần thò"* — một lời khẳng định về CẢ CÔNG TRÌNH, mà công trình
          còn có bậc thềm, cột hiên, khối chữ ký. Kỷ 1 đỏ, và đỏ ĐÚNG — chỉ là thủ phạm không phải
          bộ cửa sổ (kỷ 1 khai `windows: 'none'`, nó không có ô cửa nào). Một phép đo trỏ nhầm thủ
          phạm còn tệ hơn không đo.
      (b) *"hình bao CÓ cửa sổ = hình bao KHÔNG cửa sổ"* — đòi một thứ THÒ RA phải thò ra 0. Mọi
          gờ trang trí đều đẩy hình bao ra một chút; đó là cả công dụng của nó.
    ⇒ Luật THẬT không nói về tổng, nó nói về TỪNG KHỐI, và nó nói theo một trục: **không khối nào
    của bộ cửa sổ được nằm ngoài mép thân nhà THEO CHIỀU DỌC MẶT TƯỜNG.** Thò RA (theo pháp tuyến)
    thì được, có trần `TOTAL_RELIEF_CAP`; chìa NGANG thì không, vì đó là cái làm hình bao rộng ra
    theo đúng trục mà `block.js` dùng để bóp. Đó chính xác là hình dạng của lỗi cánh chớp.
  */
  for (const era of ERAS) {
    for (const type of ['house', 'shop', 'workshop']) {
      const spec = buildBuildingSpec({ bpId: `dw-${era}-0-${type}`, era, type, rarity: 'common', level: 1 });
      const oCua = spec.parts.filter((p) => p.tag === OPENING_TAG);
      if (oCua.length === 0) continue;
      /*
        ⚠️ HỆ QUY CHIẾU LÀ HÌNH BAO CỦA PHẦN CÒN LẠI, KHÔNG PHẢI KHỐI THÂN TO NHẤT — và đây là lần
        thứ ba bài này đo sai, nên ghi luôn. Bản trước lấy `max(p.w)` trên các khối vai `wall` làm
        nửa bề ngang. Sai, vì **các khối thân KHÔNG cùng tâm**: `getMassing` đặt chúng lệch nhau
        (một cánh nhà thò về một phía). Một ô cửa trên cánh lệch ấy có `|p.z|` lớn hơn nửa bề dày
        của khối thân to nhất mà vẫn nằm gọn trong nhà. Kỷ 3 đỏ oan đúng vì thế.
        Hình bao của PHẦN KHÔNG PHẢI CỬA SỔ đã gộp sẵn mọi độ lệch ấy — nó là thứ duy nhất trả lời
        đúng câu *"nhà này rộng tới đâu"*. Lại là bài học "nghi cái THƯỚC trước khi nghi cái máy".
      */
      const khung = specFootprint(spec.parts.filter((p) => p.tag !== OPENING_TAG));
      const halfW = khung.w / 2;
      const halfD = khung.d / 2;
      for (const p of oCua) {
        const reachX = Math.abs(p.x) + p.w / 2;
        const reachZ = Math.abs(p.z) + p.d / 2;
        assert.ok(reachX <= halfW + TOTAL_RELIEF_CAP + 1e-9,
          `kỷ ${era} · ${type}: một khối cửa sổ với tới ${reachX.toFixed(4)} theo trục x, mà nửa`
          + ` hình bao chỉ ${halfW.toFixed(4)} (+ trần thò ${TOTAL_RELIEF_CAP}) — nó đang chìa ra`
          + ' ngoài mép nhà, và sẽ giết chi tiết mái ở đâu đó (xem `block.test.js`)');
        assert.ok(reachZ <= halfD + TOTAL_RELIEF_CAP + 1e-9,
          `kỷ ${era} · ${type}: một khối cửa sổ với tới ${reachZ.toFixed(4)} theo trục z, mà nửa`
          + ` hình bao chỉ ${halfD.toFixed(4)} (+ trần thò ${TOTAL_RELIEF_CAP})`);
      }
    }
  }
});

test('CẢ 15 KỶ ĐỀU CÓ CHIỀU SÂU — kể cả hai kỷ đi nhánh dải kính', () => {
  // ⚠️ Kỷ 1 và 2 khai `windows: 'none'`, nên chúng KHÔNG được tính vào đây — và sự vắng mặt ấy
  // phải được nói ra chứ không được lặng lẽ bỏ qua, nếu không thì ngày nào một kỷ khác mất cửa sổ
  // bài này sẽ vẫn xanh. Hai kỷ, đúng hai, kể tên BẰNG chứ không "bao gồm".
  const khongCua = ERAS.filter((era) => {
    const out = [];
    emitOpening(out, FACE, ORIGIN, M, openingKit('square', era), {});
    return out.length === 0;
  });
  assert.deepEqual(khongCua, [], 'mọi kỷ phải dựng được bộ hốc khi được yêu cầu');

  // Nhánh dải kính (kỷ 14, 15) phải có NAN ĐỨNG — thứ đóng vai má cửa trên một mặt kính.
  for (const kind of ['curtain', 'neon']) {
    const out = [];
    emitGlassBand(out, FACE, ORIGIN, { span: 0.6, bandH: 0.12 }, openingKit(kind, 14));
    const nan = out.filter((p) => p.h > p.w * 2 && p.role === 'trim');
    assert.ok(nan.length >= 2,
      `dải kính "${kind}": chỉ ${nan.length} nan đứng — một mặt kính không nan là một mặt phẳng lì`);
  }
});

test('BẢNG BỘ HỐC KHÔNG CÓ DÒNG CHẾT — mọi kiểu cửa sổ phải có một dòng, và mọi dòng phải có người dùng', () => {
  for (const kind of WINDOW_KINDS) {
    if (kind === 'none') continue;
    assert.ok(OPENING_KIT[kind], `kiểu cửa sổ "${kind}" không có dòng trong \`OPENING_KIT\``);
  }
  const dung = new Set(ERAS.map((era) => {
    // Tra đúng kiểu cửa sổ thật của kỷ — không đoán.
    const spec = buildBuildingSpec({ bpId: `dw-${era}-0-house`, era, type: 'house', rarity: 'common', level: 1 });
    return spec.parts.some((p) => p.role === 'glass' || p.role === 'glassLit');
  }));
  assert.ok(dung.has(true), 'không kỷ nào dựng ra một ô kính — phép đo sai hình dạng');
});
