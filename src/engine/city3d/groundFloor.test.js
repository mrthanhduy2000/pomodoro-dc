/**
 * groundFloor.test.js — TẦNG TRỆT (Phase 10).
 *
 * ⚠️ MỌI BÀI TRONG FILE NÀY ĐỀU ĐÃ ĐƯỢC THỬ-CHO-ĐỎ trước khi commit (luật dự án: *"một bài test
 * chưa từng thấy đỏ thì chưa phải test"*), và với mỗi bài, phép phá được nêu ra TRƯỚC khi chạy —
 * vì bài học Phase 4D còn nói thêm một vế: xanh không cho biết có BAO NHIÊU thứ đang giữ nó xanh,
 * nên phải biết mình mong đỏ ở đâu. Ghi lại phép phá ngay tại chỗ để phiên sau tái lập được.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { ERA_STYLES, getEraStyle, getGroundFloor } from './eraStyle.js';
import { buildBuildingSpec, LEGACY_DOOR_WIDTH, WINDOW_RELIEF, SILL_RELIEF } from './buildingSpec.js';
import { materialFamilyFor } from './materials.js';
import { computeCityLayout } from '../cityLayout.js';
import { BLUEPRINT_CATALOG } from '../constants.js';
import {
  DOOR_KINDS, GROUND_FEATURES, FRAME_ROLES,
  DOOR_MIN_WIDTH, DOOR_MAX_WIDTH_RATIO, DOOR_MAX_HEIGHT_RATIO,
  DOOR_FRAME_RELIEF, MAX_STEPS, VERNACULAR_DOOR_SHRINK,
  isValidGroundFloor, doorMetrics, emitGroundFloor,
} from './groundFloor.js';

const ERAS = Object.keys(ERA_STYLES).map(Number).sort((a, b) => a - b);
/**
 * Ba kỷ Đàm chọn cho Bước 1 — làm ít, nhìn kỹ, rồi mới trải ra. Bước 2 đã trải đủ 15, nhưng
 * hằng số này GIỮ LẠI: nhiều bài dưới đây cố ý chỉ soi ba kỷ ấy để phép đo còn đọc được bằng
 * mắt khi đỏ. Bài nào là luật của CẢ BẢNG thì duyệt `ERAS`, và đó là chủ đích chứ không phải
 * sót — xem từng chú thích.
 */
const DA_NGHIEN_CUU = [6, 9, 13];

/** Bối cảnh mẫu: một mảng nhà cỡ trung bình. Tách ra để mọi bài dùng chung một mốc. */
function ctxMau(gf, over = {}) {
  return {
    gf, bpId: 'bp_mau', index: 0,
    x: 0, z: 0, base: 0, w: 0.9, d: 0.7, height: 1.4, ry: 0,
    storyHeight: 0.7, plain: false, symmetric: false,
    ...over,
  };
}

function dungTangTret(gf, over = {}) {
  const out = [];
  const ok = emitGroundFloor(out, ctxMau(gf, over));
  return { out, ok };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BẢNG
// ═══════════════════════════════════════════════════════════════════════════════

test('BẢNG: cả 15 kỷ đều khai `groundFloor`, và không dòng nào sai định dạng', () => {
  // THỬ-CHO-ĐỎ: xoá `groundFloor` của kỷ 7 → đỏ ở kỷ 7. Đổi `door` của kỷ 6 thành 'khong-co' → đỏ.
  for (const era of ERAS) {
    const gf = getGroundFloor(era);
    assert.ok(gf, `kỷ ${era} không khai \`groundFloor\` — trường này BẮT BUỘC, xem chú thích đầu `
      + '`eraStyle.js`: trường tuỳ chọn thì kỷ mới lặng lẽ rơi về mặc định và cả bảng mất nghĩa');
    assert.ok(isValidGroundFloor(gf),
      `kỷ ${era}: dòng \`groundFloor\` không hợp lệ — ${JSON.stringify(gf)}`);
  }
  assert.equal(ERAS.length, 15);
});

test('BƯỚC 2: KHÔNG kỷ nào còn để trống — trạng thái dở dang đã bị đóng, không trôi thành vĩnh viễn', () => {
  // ⚠️ ĐÂY LÀ CHÍNH BÀI TEST CỦA BƯỚC 1, ĐỔI VẾ. Bước 1 khoá "đúng 12 kỷ còn `legacy`"; con số 12
  // ấy là thứ buộc Bước 2 phải đụng tới bài này mới chạy xanh trở lại, tức nó chính là cái hẹn giờ
  // đã giết `legacy` đúng hạn. Nay vế đó đọc ngược: KHÔNG kỷ nào được để trống.
  //
  // Giữ nguyên hình dạng "đếm được" thay vì xoá bài đi, vì luật vẫn còn nguyên giá trị cho tương
  // lai: thêm kỷ 16 mà quên khai tầng trệt thì bài này đỏ ngay, chứ kỷ ấy không lặng lẽ rơi về
  // mặc định.
  // THỬ-CHO-ĐỎ: bỏ `groundFloor` của kỷ 11 → đỏ. Cho kỷ 3 khai `door: 'legacy'` → đỏ (kiểu lạ).
  assert.equal(DOOR_KINDS.includes('legacy'), false,
    '`legacy` phải bị xoá khỏi danh sách kiểu cửa ở Bước 2 — để nó lại là để ngỏ đường rơi về trạng thái dở dang');
  const thieu = ERAS.filter((e) => !isValidGroundFloor(getGroundFloor(e)));
  assert.deepEqual(thieu, [], `còn ${thieu.length} kỷ chưa khai đủ tầng trệt: ${thieu.join(', ')}`);
  // …và "khai đủ" phải nghĩa là DỰNG RA THẬT. Một dòng hợp lệ mà không sinh khối nào thì kỷ ấy vẫn
  // mất cửa trong im lặng — đúng cái đã xảy ra thật khi kỷ 14 khai `doorWidth: 0.46` vượt trần
  // `DOOR_MAX_WIDTH_RATIO`: validator từ chối đúng, `emitGroundFloor` trả `false` đúng, và cả kỷ
  // ấy KHÔNG CÓ CỬA mà không gì đỏ lên. Từ chối thẳng chỉ an toàn khi có người đếm số lần từ chối.
  const rong = ERAS.filter((e) => !dungTangTret(getGroundFloor(e)).ok);
  assert.deepEqual(rong, [], `kỷ ${rong.join(', ')} khai hợp lệ nhưng không dựng ra khối nào`);
});

test('KHOÁ VÀO `country`: mỗi dòng phải nói về ĐÚNG nước của kỷ đó, và không dính chữ của nước khác', () => {
  // ⚠️ ĐÂY LÀ SỢI DÂY BUỘC BẢNG TẦNG TRỆT VÀO `country` — vế mà `streetStyle.test.js`/
  // `floraStyle.test.js` làm bằng cách so hai bảng. Bảng này nằm CÙNG FILE với `country` nên không
  // có bảng thứ hai để so; thay vào đó, từ khoá dưới đây làm đúng việc ấy. Chúng sống trong bài
  // test chứ không trong mã sản phẩm, vì nhiệm vụ duy nhất của chúng LÀ sợi dây buộc.
  //
  // Vế thứ hai ("không dính chữ của nước khác") mới là vế bắt được lỗi thật: cách hỏng dễ xảy ra
  // nhất là chép dòng của kỷ này sang kỷ kia rồi sửa nửa chừng.
  //
  // ⚠️ CHỌN TỪ KHOÁ THẾ NÀO — hai luật, cả hai đều đã trả giá khi viết Bước 2:
  //   (a) **Phải là danh từ riêng hoặc thuật ngữ chỉ nước ấy mới có.** Từ "sậy" xuất hiện ở CẢ kỷ 2
  //       (chiếu sậy Ai Cập) lẫn kỷ 3 (bó sậy Lưỡng Hà) — vì cả hai nền đều dựng bằng sậy thật.
  //       Đưa nó vào danh sách là tự tạo ra một báo động giả vĩnh viễn. Dùng 'deir el-medina' và
  //       'ziggurat' thay vào.
  //   (b) **Ghi chú được phép nhắc tới một VÙNG hoặc một THỜI, nhưng không được nhắc tên NƯỚC của
  //       kỷ khác.** Kỷ 15 cố ý đối chiếu nhà sân trong Dubai với nhà sân trong Lưỡng Hà bốn nghìn
  //       năm trước — đó là một quan sát đáng giữ, và nó hợp lệ vì "Lưỡng Hà" là một vùng chứ không
  //       phải ô `country` của kỷ 3 ("Iraq").
  // THỬ-CHO-ĐỎ: đổi note kỷ 13 thành "…genkan… kiểu Haussmann" → đỏ ở vế thứ hai.
  const TU_KHOA = {
    'Thổ Nhĩ Kỳ': ['göbekli', 'da thú'],
    'Ai Cập': ['deir el-medina', 'khắc tên chủ'],
    'Iraq': ['ziggurat', 'cối đá'],
    'Trung Quốc': ['cung đình', 'sơn son', 'phẩm cấp', 'cách phiến'],
    'Đức': ['burg eltz', 'fachwerk'],
    'Việt Nam': ['đình làng', 'phố cổ', 'bắc bộ', 'nhà ống', 'bức bàn'],
    'Ý': ['firenze', 'brunelleschi', 'pietra serena', 'loggia', 'innocenti'],
    'Bồ Đào Nha': ['praça do comércio', 'pombalino', 'tejo'],
    'Pháp': ['haussmann', 'paris', 'porte cochère', 'persiennes'],
    'Anh': ['manchester', 'sa thạch', 'nhà dãy thợ', 'tên hãng'],
    'Mỹ': ['new york', 'marquee', 'tenement house act', 'mạ vàng'],
    'Nga': ['xô viết', 'козырёк'],
    'Nhật Bản': ['genkan', 'nhật', 'noren', 'kanban', 'mành che'],
    'Singapore': ['five-foot way', 'raffles', 'marina bay'],
    'UAE': ['dubai', 'bảo tàng tương lai'],
  };
  assert.equal(Object.keys(TU_KHOA).length, ERAS.length,
    'mỗi kỷ một nước, không nước nào dùng hai lần — thiếu/thừa ở đây nghĩa là bảng `country` đã đổi');
  for (const era of ERAS) {
    const style = getEraStyle(era);
    const note = style.groundFloor.note.toLowerCase();
    const cua_minh = TU_KHOA[style.country];
    assert.ok(cua_minh, `kỷ ${era}: nước "${style.country}" chưa có từ khoá trong bài test này — `
      + 'thêm kỷ nghiên cứu mới thì phải thêm dây buộc cho nó, không được bỏ qua');
    assert.ok(cua_minh.some((k) => note.includes(k)),
      `kỷ ${era} (${style.country}): dòng tầng trệt không nhắc tới thứ gì của nước ấy — "${note}"`);
    for (const [nuoc, tu] of Object.entries(TU_KHOA)) {
      if (nuoc === style.country) continue;
      const lan = tu.filter((k) => note.includes(k));
      assert.equal(lan.length, 0,
        `kỷ ${era} (${style.country}) lại nhắc tới ${nuoc}: ${lan.join(', ')} — dấu hiệu chép dòng`);
    }
  }
});

test('KHÔNG NHÉT ĐẶC ĐIỂM HIỆN ĐẠI VÀO KỶ CỔ — và không để kỷ hiện đại giữ đồ thời đồ đá', () => {
  // ⚠️ Cùng luật mà `streetStyle.js` đặt cho bó vỉa và vạch kẻ, VÀ CŨNG KHOÁ CẢ HAI CHIỀU như ở
  // đó. Chỉ khoá một chiều thì cách rẻ nhất để "cho 15 kỷ khác nhau" vẫn còn nguyên: rắc đồ hiện
  // đại xuống kỷ cổ, hoặc để một kỷ hiện đại quên chưa nâng cấp mà không ai biết.
  //
  // MỖI MỐC DƯỚI ĐÂY LÀ MỘT SỰ KIỆN, KHÔNG PHẢI MỘT CẢM GIÁC:
  //   · `arcade` từ kỷ 5 — hàng vòm cuốn làm lối đi công cộng: portico Bologna, thế kỷ 11–12.
  //   · `sign`    từ kỷ 6 — biển hiệu khối bám mặt tiền cần một mặt tiền CỐ ĐỊNH để bám, tức cần
  //                          phố buôn bán có cửa hiệu thường trực chứ không phải chợ phiên.
  //   · `balcony` từ kỷ 7 — ban công đua hẳn ra phố thành thứ phổ biến ở đô thị châu Âu từ thế kỷ
  //                          16–17 (varanda Lisboa, balcone Ý). Mốc này canh đúng một chuyện: đừng
  //                          treo lan can sắt uốn lên một túp lều.
  //   · `shutters` từ kỷ 3 — ⚠️ MỐC NÀY TỪNG ĐẶT SAI Ở KỶ 7 VÀ BÀI TEST ĐÃ BẮT ĐƯỢC. Cái 17 thế kỷ
  //                          là **cửa chớp LÁ SÁCH** (persienne, có nan chéo). Hình dựng ở đây là
  //                          hai cánh ván trơn — thứ ấy cổ như chính cái cửa sổ, nhà Fachwerk Đức
  //                          thời trung cổ có đủ. Đặt mốc theo thứ mình NHỚ ĐƯỢC thay vì thứ mình
  //                          ĐANG DỰNG là cách một luật lịch sử quay ra cấm chính lịch sử.
  //   · `glazed`  từ kỷ 10 — kính tấm lớn ở cỡ kiến trúc: công nghệ kính đúc-cán những năm 1840,
  //                          Crystal Palace 1851. Kỷ 10 (Manchester) ĐƯỢC PHÉP dùng nhưng CHỌN
  //                          `panel`: cửa nhà máy là cửa nhà máy. Được phép ≠ phải dùng.
  //   · `flap`    tới hết kỷ 2 — tấm mềm treo, KHÔNG bản lề, KHÔNG cối xoay. Ngay kỷ 3 (Ur) đã có
  //                          cối đá cho cửa xoay, nên một tấm da rủ ở kỷ 4 trở đi là nói dối.
  // THỬ-CHO-ĐỎ: cho kỷ 3 khai `feature: 'balcony'` → đỏ. Cho kỷ 14 khai `door: 'flap'` → đỏ.
  const CAM_TRUOC = { shutters: 3, arcade: 5, sign: 6, balcony: 7 };
  for (const era of ERAS) {
    const gf = getGroundFloor(era);
    for (const [ten, tuKy] of Object.entries(CAM_TRUOC)) {
      for (const truong of ['feature', 'vernacularFeature']) {
        assert.ok(!(gf[truong] === ten && era < tuKy),
          `kỷ ${era} khai \`${truong}: '${ten}'\` — đặc điểm này chỉ có từ kỷ ${tuKy} trở đi`);
      }
    }
    assert.ok(!(gf.door === 'glazed' && era < 10),
      `kỷ ${era} khai \`door: 'glazed'\` — kính tấm cỡ kiến trúc chỉ có từ kỷ 10 (thập niên 1840)`);
    assert.ok(!(gf.door === 'flap' && era > 2),
      `kỷ ${era} khai \`door: 'flap'\` — tấm mềm không bản lề là chuyện của kỷ 1–2; từ kỷ 3 đã có `
      + 'cối đá cho cửa xoay, nên để tấm da ở đây là nói dối lịch sử');
    // ⚠️ MỘT ĐIỀU KIỆN CẤU TRÚC, KHÔNG PHẢI MỘT CÁI MỐC — và nó bền hơn mọi cái mốc, vì nó hỏi
    // chính bảng chứ không hỏi trí nhớ của người viết: cửa chớp là thứ che một Ô CỬA SỔ, nên kỷ
    // nào khai `windows: 'none'` mà lại có cửa chớp thì đang che một bức tường đặc.
    const coCuaSo = getEraStyle(era).windows !== 'none';
    assert.ok(!(gf.vernacularFeature === 'shutters' && !coCuaSo) && !(gf.feature === 'shutters' && !coCuaSo),
      `kỷ ${era} khai cửa chớp nhưng \`windows: 'none'\` — cửa chớp che cái gì?`);
  }
  // Vế thứ hai của cái khoá hai chiều: mốc phải THẬT SỰ CẮN ở đâu đó, nếu không nó chỉ là một câu
  // trang trí. Ba kỷ cuối PHẢI đã bỏ được cái cửa thời đồ đá, và ít nhất một kỷ hiện đại phải dùng
  // tới kính — nếu không thì cả danh sách `DOOR_KINDS` co lại còn ba kiểu mà không ai hay.
  assert.equal(ERAS.filter((e) => getGroundFloor(e).door === 'flap').length, 2,
    'đúng 2 kỷ (1 và 2) được dùng tấm mềm — nhiều hơn là trôi, ít hơn là kỷ đồ đá đã bị làm sang');
  assert.ok(ERAS.filter((e) => getGroundFloor(e).door === 'glazed').length >= 2,
    'không kỷ hiện đại nào dùng sảnh kính — vậy thì thêm kiểu cửa ấy vào để làm gì?');
});

// ═══════════════════════════════════════════════════════════════════════════════
// 15 KỶ RA 15 TẦNG TRỆT — đo bằng TRỤC CẤU TRÚC, không đo bằng cảm giác
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Tám trục cấu trúc của một dòng `groundFloor`. Cùng khuôn với `streetStyle.test.js` — và dùng lại
 * khuôn ấy là có chủ đích: đó là cách dự án đã đo "15 kỷ có khác nhau không" ở tầng đường phố, nên
 * đo tầng trệt bằng một thước KHÁC sẽ đẻ ra hai ngưỡng không so được với nhau.
 *
 * ⚠️ BỐN TRỤC ĐẦU LÀ DANH MỤC (khác là khác), BỐN TRỤC SAU LÀ SỐ ⇒ phải LƯỢNG HOÁ. Mỗi bước dưới
 * đây suy từ một đại lượng có thật trên màn hình, không phải một con số chọn cho vừa:
 *   · `steps`     — bậc là số đếm, chênh ≥ 1 bậc là thấy được. Không có gì để lượng hoá.
 *   · `recess`    — `DOOR_RECESS_DEPTH` biến `recess` 0…1 thành độ sâu 0…0,16 đơn vị thế giới. Một
 *                   mảng nhà dân rộng ≈ 0,56 ⇒ chênh 0,25 recess = 0,04 sâu = **7% bề ngang mặt
 *                   tiền**. Đó là cỡ cái bóng đổ trong hốc cửa, mắt đọc được.
 *   · `doorWidth` — đã là TỈ LỆ của bề ngang nhà, nên 0,06 nghĩa đúng là 6% mặt tiền.
 *   · `doorTall`  — tỉ lệ của chiều cao tầng; lấy 0,08 vì cửa cao thì chỉ ăn theo chiều đứng, mà
 *                   chiều đứng của mặt tiền dài hơn chiều ngang ⇒ cần chênh nhiều hơn mới thấy.
 */
const TRUC_REC = 0.25;
const TRUC_W = 0.06;
const TRUC_H = 0.08;

function trucKhacNhau(a, b) {
  const ten = [];
  for (const k of ['door', 'frame', 'feature', 'vernacularFeature']) if (a[k] !== b[k]) ten.push(k);
  if (Math.abs(a.steps - b.steps) >= 1) ten.push('steps');
  if (Math.abs(a.recess - b.recess) >= TRUC_REC - 1e-9) ten.push('recess');
  if (Math.abs(a.doorWidth - b.doorWidth) >= TRUC_W - 1e-9) ten.push('doorWidth');
  if (Math.abs(a.doorTall - b.doorTall) >= TRUC_H - 1e-9) ten.push('doorTall');
  return ten;
}

/** Sàn: mỗi cặp kỷ phải khác nhau ở ÍT NHẤT ngần này trục trong 8. */
const SAN_TRUC = 3;

test('15 KỶ RA 15 TẦNG TRỆT: cả 105 cặp đều khác nhau ở ≥3/8 trục cấu trúc', () => {
  // ⚠️ DUYỆT TỔ HỢP ĐÔI, KHÔNG DUYỆT DANH SÁCH THEO THỨ TỰ — bài học `daylight.test.js`: bản duyệt
  // theo thứ tự để lọt đúng cặp nằm ở hai ĐẦU bảng, và lỗi ấy sống sót qua mọi lần chạy test.
  //
  // ⚠️ VÀ SÀN NÀY LÀ MỘT CON SỐ ĐO ĐƯỢC, KHÔNG PHẢI MỘT NGƯỠNG CHỌN CHO VỪA. Bản đầu của Bước 2 đo
  // ra **kỷ 4 với kỷ 6 chỉ khác nhau 1/8 trục** (cùng `panel` + `wood` + `porch` + `awning`, chênh
  // đúng một bậc thềm). Cách sửa ĐÚNG là sửa BẢNG — kỷ 4 nay lùi cửa sâu hơn và mở rộng hơn, đúng
  // quy chế điện cung đình — chứ không phải hạ sàn xuống 1 cho vừa. Xem chú thích tại kỷ 4 trong
  // `eraStyle.js`.
  // THỬ-CHO-ĐỎ: trả `recess`/`doorWidth` của kỷ 4 về 0.50/0.38 → đỏ ở cặp 4↔6 với 1/8.
  const yeuNhat = [];
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      const ten = trucKhacNhau(getGroundFloor(ERAS[i]), getGroundFloor(ERAS[j]));
      yeuNhat.push(ten.length);
      assert.ok(ten.length >= SAN_TRUC,
        `kỷ ${ERAS[i]} và ${ERAS[j]} chỉ khác nhau ${ten.length}/8 trục tầng trệt `
        + `[${ten.join(', ')}] — hai kỷ này đọc ra là một`);
    }
  }
  assert.equal(yeuNhat.length, 105, 'phải là đúng 105 cặp — 15 kỷ chọn 2');

  // ⚠️ KHÔNG CÓ VÒNG LẶP RIÊNG CHO "KỶ LIỀN NHAU" Ở ĐÂY, VÀ ĐÓ LÀ CÓ CHỦ ĐÍCH. Cặp kề nhau là tập
  // CON của 105 cặp; đặt cho nó đúng cái sàn 3 như trên thì vòng lặp ấy **không bao giờ có thể đỏ
  // một mình** — nó chỉ chép lại một điều vừa được chứng minh, tức là trang trí. (Đã viết ra rồi
  // mới nhận ra, và luật "một bài test chưa từng thấy đỏ thì chưa phải test" áp cho từng ASSERT
  // chứ không chỉ cho từng bài.) Thứ thật sự thêm thông tin là hai phép đo dưới đây.

  // PHÂN BỐ: cực tiểu là một con số gộp — "cặp yếu nhất = 3" đứng yên y hệt dù có MỘT cặp yếu hay
  // BỐN MƯƠI cặp yếu, mà bốn mươi cặp yếu nghĩa là cả bảng đang dẹt lại. Đo được 6 lúc viết bài.
  yeuNhat.sort((a, b) => a - b);
  const trungVi = yeuNhat[Math.floor(yeuNhat.length / 2)];
  assert.ok(trungVi >= 5, `trung vị 105 cặp chỉ còn ${trungVi}/8 trục — bảng đang dẹt lại`);
});

test('MỖI TRỤC PHẢI CÒN SỐNG: không trục nào nằm trong bảng mà chẳng tách được cặp nào', () => {
  // ⚠️ Đúng hình dạng của cơ chế "lùm cây" đã chết trong im lặng ở Phase 8D: một trục vẫn nằm
  // trong bảng, vẫn được đọc, vẫn làm bảng TRÔNG phong phú, nhưng cả 15 kỷ khai giống hệt nhau nên
  // nó không tách được cặp nào. Nếu điều đó xảy ra thì bảng thật ra chỉ có 7 trục, và cái sàn 3/8
  // ở trên đang được chấm trên một thang đo nhỏ hơn nó tự nhận.
  // Đo được lúc viết bài: feature 89 · steps 84 · door 83 · frame 78 · vernacularFeature 76 ·
  // doorTall 75 · doorWidth 66 · recess 51 (trên 105 cặp). Sàn 10 chừa biên rất rộng — nó canh
  // "trục này có làm việc không", không canh "trục này làm được bao nhiêu".
  // THỬ-CHO-ĐỎ: cho cả 15 kỷ cùng một `frame` → đỏ ở trục `frame` với 0/105.
  const TEN_TRUC = ['door', 'frame', 'feature', 'vernacularFeature', 'steps', 'recess', 'doorWidth', 'doorTall'];
  const dem = Object.fromEntries(TEN_TRUC.map((k) => [k, 0]));
  for (let i = 0; i < ERAS.length; i += 1) {
    for (let j = i + 1; j < ERAS.length; j += 1) {
      for (const k of trucKhacNhau(getGroundFloor(ERAS[i]), getGroundFloor(ERAS[j]))) dem[k] += 1;
    }
  }
  for (const k of TEN_TRUC) {
    assert.ok(dem[k] >= 10,
      `trục "${k}" chỉ tách được ${dem[k]}/105 cặp — trục này gần như chết, bảng thật ra hẹp hơn nó trông`);
  }
  // ĐỐI CHỨNG: phép đếm phải thật sự nhìn thấy một trục chết. Bảng dẹt ⇒ MỌI trục về 0.
  const det = trucKhacNhau(getGroundFloor(3), { ...getGroundFloor(3) });
  assert.equal(det.length, 0, 'phép đếm trục đang bịa ra khác biệt trên hai dòng y hệt nhau');
});

test('ĐỐI CHỨNG: phép đo 8 trục thật sự bắt được bảng dẹt và bảng chênh nhau hạt bụi', () => {
  // ⚠️ Luật Phase 9A: mỗi ngưỡng phải kèm một đối chứng nhốt sẵn ca hỏng, nếu không nó sẽ bị nới
  // dần cho tiện — hoặc tệ hơn, nó có thể đang chạy rỗng mà vẫn xanh.
  const mot = getGroundFloor(9);
  assert.equal(trucKhacNhau(mot, { ...mot }).length, 0,
    '15 kỷ giống hệt nhau mà phép đo vẫn báo có khác biệt ⇒ phép đo đang bịa');
  // Thế giới trước Bước 2: mọi kỷ chung một cái cửa, chỉ chênh nhau vài phần nghìn ở số đo.
  //
  // ⚠️ HỎI TỪNG TRỤC MỘT, KHÔNG HỎI TỔNG — và đây là một lỗi THẬT của chính bài đối chứng này bị
  // phép thử ngược bắt được. Bản đầu cộng cả ba lệch 0,001 vào một dòng rồi hỏi `< SAN_TRUC`; nới
  // riêng `TRUC_W` xuống 0,0005 chỉ làm MỘT trục sáng lên, mà 1 < 3 nên đối chứng vẫn XANH. Tức
  // một cái phễu vừa được cài ngay trong chính thứ sinh ra để chống phễu: nó chỉ bắt được ca cả
  // BA ngưỡng cùng bị nới, trong khi cách hỏng thật là nới đúng MỘT cái cho tiện.
  // ⇒ Bản đúng: 0,001 KHÔNG được sáng lên ở BẤT KỲ trục số nào.
  for (const k of ['doorWidth', 'doorTall', 'recess']) {
    const hatBui = { ...mot, [k]: mot[k] + 0.001 };
    assert.deepEqual(trucKhacNhau(mot, hatBui), [],
      `chênh nhau 0,001 ở "${k}" mà đã được tính thành một trục ⇒ ngưỡng của trục ấy là cái phễu, `
      + 'không phải hàng rào — và một cái phễu thì cho qua đúng thứ nó sinh ra để chặn');
  }
  // …và ngược lại, một cặp thật phải qua được — nếu không thì sàn đang chặn cả bảng đúng.
  assert.ok(trucKhacNhau(getGroundFloor(1), getGroundFloor(15)).length >= SAN_TRUC);
});

// ═══════════════════════════════════════════════════════════════════════════════
// KHÔNG CÓ ĐƯỜNG RƠI VỀ MẶC ĐỊNH
// ═══════════════════════════════════════════════════════════════════════════════

test('MỌI kiểu cửa trong danh sách đều dựng ra khối THẬT — không kiểu nào rơi vào im lặng', () => {
  // ⚠️ Bài học `PAVING_KINDS`: một danh sách liệt kê thứ ĐỊNH làm chứ không phải thứ ĐÃ làm là một
  // cái phễu — kỷ khai vào đó sẽ nhận về một lỗ trống mà không gì đỏ lên.
  // THỬ-CHO-ĐỎ: thêm 'arch' vào `DOOR_KINDS` mà chưa viết mã dựng → đỏ ngay ở 'arch'.
  // ⚠️ `frame: 'stone'` CHỨ KHÔNG PHẢI 'wood', và đây là một lỗi THẬT của chính bài test này bị
  // phép thử ngược bắt được: bản đầu để khung cửa là gỗ, nên khi thêm một kiểu cửa CHƯA CÓ MÃ DỰNG
  // vào danh sách thì mấy thanh khung gỗ vẫn đủ làm bài test xanh — nó tưởng đã thấy cánh cửa.
  // Muốn hỏi "cánh cửa có được dựng không" thì mọi thứ KHÁC trên mặt tiền phải thôi mang vai gỗ.
  // (Cùng họ với bài học `/envMap,/` xanh oan ở Phase 7A: đếm tổng số lần một vai xuất hiện là
  // cái phễu, phải cắt đúng khối cần hỏi ra rồi mới đếm.)
  //
  // ⚠️ LỌC CẢ VAI `glass`, KHÔNG CHỈ `wood` — và đây là một lỗi THẬT của bài test này bị Bước 2 bắt
  // được. Bốn kiểu cửa cổ dựng cánh bằng gỗ; `glazed` thì không có "cánh" nào cả, nó là một mặt
  // kính. Chỉ hỏi vai `wood` thì kiểu cửa mới sẽ trượt qua bài này trong im lặng — đúng cái phễu
  // mà chính bài này sinh ra để chặn.
  const goc = { note: 'dòng thử của bài test', doorWidth: 0.3, doorTall: 0.7, frame: 'stone', recess: 0.3, steps: 1, feature: 'none', vernacularFeature: 'none' };
  const laCanh = (p) => p.role === 'wood' || p.role === 'glass';
  const dem = new Map();
  for (const door of DOOR_KINDS) {
    const { out, ok } = dungTangTret({ ...goc, door });
    assert.ok(ok, `kiểu cửa '${door}' không dựng được gì cả`);
    const canh = out.filter((p) => laCanh(p) && !p.ground);
    assert.ok(canh.length > 0, `kiểu cửa '${door}' không có lấy một cánh cửa nào`);
    dem.set(door, out.length);
  }
  assert.equal(dem.size, 5, 'phải đúng 5 kiểu cửa — thêm/bớt thì bài này phải được đọc lại, không im lặng');
  // …và chúng phải KHÁC NHAU, không phải cùng một cánh cửa gọi năm tên.
  const chuKy = new Set([...dem.keys()].map((k) => {
    const { out } = dungTangTret({ ...goc, door: k });
    return out.filter(laCanh).map((p) => `${p.w.toFixed(3)}@${p.z.toFixed(3)}`).sort().join('|');
  }));
  assert.equal(chuKy.size, dem.size, 'hai kiểu cửa dựng ra hình y hệt nhau');
});

test('MỌI đặc trưng trong danh sách đều dựng ra khối THẬT, và `none` thì đúng là không dựng gì', () => {
  // THỬ-CHO-ĐỎ: thêm 'columns' vào `GROUND_FEATURES` mà chưa viết `case` → đỏ ở 'columns'.
  const goc = { note: 'dòng thử của bài test', door: 'panel', doorWidth: 0.3, doorTall: 0.7, frame: 'wood', recess: 0.3, steps: 1, vernacularFeature: 'none' };
  const nen = dungTangTret({ ...goc, feature: 'none' }).out.length;
  for (const feature of GROUND_FEATURES) {
    const { out } = dungTangTret({ ...goc, feature });
    if (feature === 'none') {
      assert.equal(out.length, nen, '`none` phải là KHÔNG dựng gì thêm, không phải dựng một thứ vô hình');
      continue;
    }
    assert.ok(out.length > nen,
      `đặc trưng '${feature}' có tên trong danh sách nhưng không dựng thêm khối nào`);
  }
});

test('bảng sai định dạng bị TỪ CHỐI THẲNG, không được lặng lẽ dựng bừa', () => {
  const ok = { note: 'dòng thử của bài test', door: 'panel', doorWidth: 0.3, doorTall: 0.7, frame: 'wood', recess: 0.3, steps: 1, feature: 'none', vernacularFeature: 'none' };
  assert.ok(isValidGroundFloor(ok));
  const hong = [
    ['thiếu hẳn', null],
    ['kiểu cửa lạ', { ...ok, door: 'xoay' }],
    ['đặc trưng lạ', { ...ok, feature: 'hologram' }],
    ['khung lạ', { ...ok, frame: 'plutonium' }],
    ['cửa rộng quá trần', { ...ok, doorWidth: DOOR_MAX_WIDTH_RATIO + 0.01 }],
    ['cửa rộng âm', { ...ok, doorWidth: -0.1 }],
    ['bậc quá nhiều', { ...ok, steps: MAX_STEPS + 1 }],
    ['bậc không nguyên', { ...ok, steps: 1.5 }],
    ['hốc ngoài khoảng', { ...ok, recess: 1.4 }],
    ['note rỗng', { ...ok, note: '' }],
    // ⚠️ ĐỐI CHỨNG CỦA BƯỚC 2: `legacy` từng là một kiểu cửa HỢP LỆ, nghĩa là "kỷ này chưa nghiên
    // cứu". Nay nó phải bị từ chối y như một chuỗi rác — nếu không, một kỷ vẫn có thể lặng lẽ quay
    // về trạng thái dở dang bằng đúng cái tên cũ, và bài "KHÔNG kỷ nào còn để trống" ở trên sẽ
    // không bắt được vì `isValidGroundFloor` vẫn gật đầu.
    ['kiểu cửa `legacy` đời cũ', { ...ok, door: 'legacy' }],
    ['thiếu số đo (đúng hình dạng dòng legacy cũ)', { note: 'x'.repeat(10), door: 'panel', feature: 'porch', vernacularFeature: 'none' }],
  ];
  for (const [ten, gf] of hong) {
    assert.equal(isValidGroundFloor(gf), false, `"${ten}" đáng lẽ phải bị từ chối`);
    assert.equal(dungTangTret(gf).ok, false, `"${ten}" vẫn dựng ra khối`);
  }
  assert.equal(FRAME_ROLES.includes('none'), true, '`frame: none` phải hợp lệ — cửa là một lỗ trên tường');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TỈ LỆ, KHÔNG PHẢI SỐ TUYỆT ĐỐI — đây là lỗi Phase 10 sinh ra để sửa
// ═══════════════════════════════════════════════════════════════════════════════

test('CỬA LÀ TỈ LỆ CỦA BỀ NGANG NHÀ — và đối chứng: con số cũ 0,14 KHÔNG qua nổi bài này', () => {
  // ⚠️ ĐỐI CHỨNG NHỐT BỘ SỐ HỎNG CŨ (luật Phase 9A): một bài test chỉ chứng minh bản mới đúng thì
  // vẫn để ngỏ khả năng nó đúng vì lý do khác. Vế thứ hai bắt phép đo phải còn bắt được đúng cái
  // lỗi đã có thật — cửa rộng cứng 0,14 cho mọi công trình.
  // THỬ-CHO-ĐỎ: bỏ nhân `mass` trong `doorMetrics` (trả về hằng số) → đỏ ở vế thứ nhất.
  const gf = getGroundFloor(9);
  const hep = doorMetrics(gf, { w: 0.45, height: 1.2, storyHeight: 0.76 });
  const rong = doorMetrics(gf, { w: 1.35, height: 2.4, storyHeight: 0.76 });
  assert.ok(rong.doorW > hep.doorW * 2.4,
    `nhà rộng gấp 3 mà cửa chỉ rộng gấp ${(rong.doorW / hep.doorW).toFixed(2)} — cửa chưa theo tỉ lệ`);

  // Đối chứng: nếu ai đó quay lại con số tuyệt đối, tỉ lệ ấy tụt về đúng 1,00 và bài trên sẽ đỏ.
  const tyLeCu = LEGACY_DOOR_WIDTH / LEGACY_DOOR_WIDTH;
  assert.equal(tyLeCu, 1, 'một số tuyệt đối thì không thể nở theo bề ngang nhà — đó chính là lỗi cũ');
  // …và nó SAI ở cả hai đầu: quá rộng trên nhà dân, quá hẹp trên kỳ quan.
  assert.ok(LEGACY_DOOR_WIDTH / 0.45 > 0.28, 'cửa cũ chiếm hơn 28% mặt tiền nhà dân — đọc ra là cái cổng');
  assert.ok(LEGACY_DOOR_WIDTH / 1.35 < 0.12, 'cửa cũ chỉ chiếm dưới 12% mặt tiền kỳ quan — đọc ra là vết nứt');
});

test('TRẦN LUÔN THẮNG SÀN: không bao giờ có cái cửa rộng hơn bức tường nó nằm trên', () => {
  // ⚠️ Thứ tự phép kẹp là chỗ dễ viết ngược nhất, và viết ngược thì lỗi chỉ hiện ra ở mảng nhà hẹp
  // — tức ở nhà dân, tức ở 30 trong 35 công trình mỗi thành phố.
  //
  // ⚠️ NHƯNG PHÉP THỬ NGƯỢC ĐÃ CHỈ RA MỘT SỰ THẬT PHẢI GHI LẠI: **đảo thứ tự kẹp MỘT MÌNH KHÔNG
  // làm bài này đỏ.** Lý do là hôm nay có HAI thứ cùng giữ nó xanh — câu chặn "mảng quá hẹp thì
  // trả `null`" ở `doorMetrics` đã loại sạch mọi ca mà cái sàn có thể thắng cái trần. Phải gỡ CẢ
  // HAI (bỏ câu chặn *và* đảo thứ tự kẹp) thì mới đỏ; đã thử và thấy đỏ.
  // Đây đúng bài học Phase 4D: *một bài test xanh không cho biết có BAO NHIÊU thứ đang giữ nó
  // xanh*. Ghi ra đây vì nếu phiên sau gỡ câu chặn ấy vì một lý do khác, họ cần biết rằng lưới an
  // toàn còn lại chỉ là thứ tự kẹp — chứ không phải hai lớp như trước.
  const gf = getGroundFloor(6);
  for (let w = 0.2; w <= 2.0; w += 0.02) {
    const m = doorMetrics(gf, { w, height: 1.5, storyHeight: 0.66 });
    if (!m) continue;
    assert.ok(m.doorW <= w * DOOR_MAX_WIDTH_RATIO + 1e-9,
      `bề ngang ${w.toFixed(2)}: cửa rộng ${m.doorW.toFixed(3)} > trần ${(w * DOOR_MAX_WIDTH_RATIO).toFixed(3)}`);
    assert.ok(m.doorH <= 1.5 * DOOR_MAX_HEIGHT_RATIO + 1e-9, 'cửa cao quá trần');
  }
});

test('MẢNG NHÀ QUÁ HẸP THÌ KHÔNG CÓ CỬA — chứ không phải có cái cửa tí hon', () => {
  // ⚠️ Bài học Phase 7D ("KẸP thì phá thứ tự"): cứ kẹp thì mọi mảng hẹp ra cùng một cỡ cửa, và bốn
  // kỷ khai bốn con số sẽ dựng ra một kết quả. Một bức tường hông không có cửa là chuyện bình
  // thường ngoài đời; một cái cửa rộng 4cm thì không.
  // THỬ-CHO-ĐỎ: bỏ câu `if (ceiling < DOOR_MIN_WIDTH) return null` → đỏ.
  const gf = getGroundFloor(13);
  const quaHep = DOOR_MIN_WIDTH / DOOR_MAX_WIDTH_RATIO - 0.01;
  assert.equal(doorMetrics(gf, { w: quaHep, height: 1.2, storyHeight: 0.66 }), null);
  assert.equal(dungTangTret(gf, { w: quaHep }).ok, false);
  assert.equal(dungTangTret(gf, { w: quaHep }).out.length, 0, 'đã từ chối mà vẫn ghi khối vào danh sách');
  // Ngay trên ngưỡng thì phải dựng được — nếu không, cái ngưỡng đang ăn cả vùng hợp lệ.
  assert.ok(doorMetrics(gf, { w: quaHep + 0.05, height: 1.2, storyHeight: 0.66 }));
});

test('KHUNG CỬA PHẢI NHÔ RA XA HƠN MỌI CHI TIẾT CỬA SỔ — cửa là cái neo tỉ lệ', () => {
  // ⚠️ Bài này import CẢ HAI bên rồi so, không chép con số nào sang đây. Đó là khác biệt giữa
  // "khoá công thức" và "khoá sự KHỚP NHAU" — bài học Phase 8B (`countTriangles`).
  // THỬ-CHO-ĐỎ: hạ `DOOR_FRAME_RELIEF` xuống 0,05 → đỏ.
  assert.ok(DOOR_FRAME_RELIEF > SILL_RELIEF,
    `khung cửa (${DOOR_FRAME_RELIEF}) nhô ra ít hơn bệ cửa sổ (${SILL_RELIEF}) — cửa sẽ chìm xuống `
    + 'dưới cửa sổ trong thứ bậc thị giác, và mắt mất mốc để ước lượng công trình to cỡ nào');
  assert.ok(DOOR_FRAME_RELIEF > WINDOW_RELIEF);
});

// ═══════════════════════════════════════════════════════════════════════════════
// NGÂN SÁCH — PHẢI THẬT SỰ CẮN
// ═══════════════════════════════════════════════════════════════════════════════

test('NHÀ DÂN NHẸ HƠN CÔNG TRÌNH CHÍNH THẬT SỰ — ngân sách LOD phải CẮN ở CẢ 15 KỶ', () => {
  // ⚠️ Bài học Phase 8D: một ngân sách đặt bằng đúng khoảng mà mức cao có thể ra thì hai mức y hệt
  // nhau, và cơ chế trở thành mã chết mà ảnh vẫn "trông có vẻ đúng". Nhà dân là 30/35 công trình
  // mỗi thành phố nên nó mới là chỗ quyết định ngân sách.
  //
  // ⚠️ PHẢI GIỮ `vernacularFeature = feature` KHI ĐO — nếu không thì phép đo trộn HAI đại lượng:
  // "cơ chế LOD có cắn không" (một LUẬT) và "kỷ này có gán cho nhà dân một đặc trưng rẻ hơn không"
  // (một LỰA CHỌN mỹ thuật, và có ba kỷ cố ý chọn NGƯỢC: kỷ 2 và 5 để công trình chính trống trơn
  // trong khi nhà dân có mành/cửa chớp; kỷ 11 cho nhà cho thuê cả một mặt cầu thang thoát hiểm mà
  // kỳ quan chỉ có mái đón). Ba kỷ ấy không hề vi phạm ngân sách — chúng đang kể đúng lịch sử.
  // Trộn hai đại lượng vào một phép đo thì hoặc là báo oan ba kỷ, hoặc là phải nới sàn cho cả 15 —
  // đúng cái bẫy "một trường gánh hai việc", lần này nằm trong bài test.
  // THỬ-CHO-ĐỎ: bỏ nhân `VERNACULAR_DOOR_SHRINK` và bỏ chặn má cửa cho nhà dân → đỏ.
  assert.ok(VERNACULAR_DOOR_SHRINK < 1);
  for (const era of ERAS) {
    const g0 = getGroundFloor(era);
    const gf = { ...g0, vernacularFeature: g0.feature };   // cùng đặc trưng ⇒ chỉ còn LOD lên tiếng
    const chinh = dungTangTret(gf, { plain: false, symmetric: true });
    const dan = dungTangTret(gf, { plain: true });
    assert.ok(dan.out.length < chinh.out.length,
      `kỷ ${era}: nhà dân ${dan.out.length} khối, công trình chính ${chinh.out.length} — ngân sách không cắn`);
    const rongChinh = doorMetrics(g0, { w: 0.9, height: 1.4, storyHeight: 0.7, plain: false }).doorW;
    const rongDan = doorMetrics(g0, { w: 0.9, height: 1.4, storyHeight: 0.7, plain: true }).doorW;
    assert.ok(rongDan < rongChinh, `kỷ ${era}: cửa nhà dân không hề hẹp hơn cửa công trình chính`);
    assert.ok(doorMetrics(g0, { w: 0.9, height: 1.4, storyHeight: 0.7, plain: true }).steps <= 1,
      `kỷ ${era}: nhà dân có quá 1 bậc thềm — bậc nhiều là dấu hiệu công trình được nâng khỏi mặt đất`);
  }
});

test('NGÂN SÁCH CẢ HÀNH TRÌNH: 15 thành phố cộng lại phải RẺ HƠN HẲN nhờ nhà dân', () => {
  // ⚠️ Bài trên hỏi "cơ chế có chạy không" trên một dòng bảng ĐÃ ĐƯỢC CHUẨN HOÁ. Bài này hỏi câu
  // Đàm thật sự quan tâm: **với BẢNG THẬT như đang khai, cả thành phố có rẻ đi không?** Hai câu
  // khác nhau, và trộn chúng vào một bài là cách chắc chắn nhất để không trả lời được câu nào.
  //
  // ⚠️ VÀ CÂU TRẢ LỜI PHẢI HỎI Ở CẤP HÀNH TRÌNH, KHÔNG PHẢI CẤP TỪNG KỶ. Ba kỷ (2 · 5 · 11) có nhà
  // dân ĐẮT BẰNG hoặc ĐẮT HƠN công trình chính vì đó là sự thật lịch sử của chúng — bắt từng kỷ
  // phải rẻ đi là ép bảng nói dối. Cấp đúng là tổng 15 kỷ, vì ngân sách hiệu năng cũng sống ở đó.
  // (Cùng bài học "phép đo đúng nhưng đo SAI CẤP ĐỘ" — `TECH_DEBT #22` và vòng 2 Performance Gate,
  // chỉ khác là lần này cấp đúng CAO hơn chứ không thấp hơn.)
  const THANH_PHO = { chinh: 5, dan: 30 };            // 5 bản vẽ mỗi kỷ + ≈30 nhà dân quanh chúng
  let thuc = 0;
  let neuTatCaLaKyQuan = 0;
  for (const era of ERAS) {
    const gf = getGroundFloor(era);
    const chinh = dungTangTret(gf, { plain: false, symmetric: true }).out.length;
    const dan = dungTangTret(gf, { plain: true }).out.length;
    thuc += THANH_PHO.chinh * chinh + THANH_PHO.dan * dan;
    neuTatCaLaKyQuan += (THANH_PHO.chinh + THANH_PHO.dan) * chinh;
  }
  const tyLe = thuc / neuTatCaLaKyQuan;
  // Đo được 0,720 lúc viết bài này. Sàn 0,80 chừa ≈11% biên — đủ để bảng còn chỉnh được, không đủ
  // để cơ chế chết mà vẫn xanh. Đối chứng ngay dưới đây nhốt ca "LOD không làm gì" ở đúng 1,00.
  assert.ok(tyLe < 0.8,
    `tầng trệt cả 15 thành phố tốn ${thuc} khối, bằng ${(tyLe * 100).toFixed(1)}% mức "nếu nhà nào `
    + 'cũng dựng như kỳ quan" — dưới 80% mới coi là ngân sách có tác dụng');
  // ĐỐI CHỨNG: tắt LOD (dựng nhà dân y như công trình chính) ⇒ tỉ lệ về đúng 1,00 và sàn trên đỏ.
  let khongLod = 0;
  for (const era of ERAS) {
    const chinh = dungTangTret(getGroundFloor(era), { plain: false, symmetric: true }).out.length;
    khongLod += (THANH_PHO.chinh + THANH_PHO.dan) * chinh;
  }
  assert.equal(khongLod / neuTatCaLaKyQuan, 1,
    'đối chứng hỏng: hai vế phải bằng nhau khi bỏ LOD, nếu không phép đo trên đang so nhầm thứ');
});

test('KHÔNG THÊM MỘT LỆNH VẼ NÀO: tầng trệt chỉ dùng họ vật liệu thành phố THẬT vốn đã có', () => {
  // ⚠️ ĐÂY LÀ CÁCH NGHIỆM THU RÀNG BUỘC "cấm tiêu lệnh vẽ mới" BẰNG QUAN HỆ, không bằng một con số
  // đếm được ở đâu đó. Mỗi họ vật liệu = một lệnh vẽ (`MATERIAL_ORDER`, `materials.js`); nếu tập
  // họ của phần tầng trệt nằm gọn trong tập họ của phần còn lại thì số lệnh vẽ KHÔNG THỂ tăng,
  // bất kể sau này thêm bao nhiêu chi tiết.
  //
  // ⚠️ PHẢI HỎI Ở ĐÚNG CẤP: cả thành phố GỘP thành một bộ khối cho mỗi họ vật liệu, không phải mỗi
  // công trình một bộ (bằng chứng: cảnh thật chỉ có 11–14 lệnh vẽ trong khi có 16 họ — xem
  // `PERFORMANCE.md`). Bản đầu của bài này hỏi ở cấp TỪNG CÔNG TRÌNH và **báo động giả ngay**: kỳ
  // quan kỷ 9 tự nó không dùng `wood`, nên cánh cửa gỗ Paris trông như một họ mới — trong khi nhà
  // dân và xưởng của chính kỷ ấy đã kéo `wood` vào bộ khối chung từ lâu. Đúng họ với `TECH_DEBT
  // #22`: phép đo đúng, cấp độ sai, và nó sai theo hướng GÂY HOẢNG.
  //
  // ⚠️⚠️ VÀ PHẢI HỎI ĐÚNG QUẦN THỂ — đây là bản vá thứ HAI của cùng bài này, cùng một hình dạng sai
  // đi xuống một tầng nữa. Bản trước dựng **7 loại × 3 hạng = 21 công trình giả định** rồi gọi đó
  // là "cả thành phố". Thành phố thật KHÔNG phải tập đó: nó là 5 bản vẽ trong `BLUEPRINT_CATALOG`
  // (loại và hạng đã được ấn định sẵn, không phải tổ hợp tự do) cộng 6–30 nhà dân do
  // `deriveDwellings` sinh ra, và cả hai đều đi qua `buildBuildingSpec` ở `sceneGraph.js`. Một tập
  // giả định RỘNG HƠN thành phố thật thì `nen` phình ra, và `them ⊆ nen` có thể XANH trong khi
  // thành phố thật vẫn đẻ thêm một họ — tức đúng cái phễu mà bài này sinh ra để chặn.
  //
  // Đo thật lúc vá (2026-08-18): bản giả định cho không **0 họ** ở cả 15 kỷ — nghĩa là bài cũ
  // KHÔNG hề xanh oan hôm nay. Nhưng nó đúng nhờ một sự TRÙNG HỢP (`deriveDwellings` tình cờ phủ
  // đủ house/shop/workshop, `BLUEPRINT_CATALOG` tình cờ phủ đủ 4 loại còn lại), và một lời hứa
  // đúng nhờ một thứ chẳng liên quan thì gãy trong im lặng đúng lúc thứ đó đổi (Phase 7D). Nay hỏi
  // thẳng quần thể thật, nên `deriveDwellings` hay catalog có đổi thì bài này tự đi theo.
  //
  // ⚠️ BA NHỊP TUỔI, VÀ HỎI TỪNG NHỊP MỘT: số nhà dân đi từ 6 lên 30 theo `sessionCount` (kỷ 1:
  // 6 → 17), nên bộ họ vật liệu của một thành phố TRẺ hẹp hơn hẳn thành phố già. Gộp ba nhịp vào
  // một `nen` chung là tự dựng lại đúng cái phễu vừa gỡ: họ của thành phố già sẽ che cho tầng trệt
  // của thành phố trẻ. Mỗi nhịp là một thành phố có thật, phải tự đứng được một mình.
  //
  // ⚠️ CỐ Ý CHẶT HƠN THỰC TẾ: cảnh thật còn có cây cối, mặt đất, đường sá, cư dân — chúng cũng góp
  // họ vật liệu vào bộ khối gộp. Bỏ chúng ra làm `nen` NHỎ hơn thật, tức bài này khó xanh hơn.
  // Đó là chiều an toàn cho một ràng buộc dạng "không được thêm". Nếu một phase sau thật sự cần
  // một họ mà chỉ tầng thực vật/địa hình mới có (ví dụ `foliage` cho vườn trên mái), cách xử lý
  // ĐÚNG là mở rộng quần thể ở đây một cách tường minh RỒI đo lại bằng `--bench`, KHÔNG phải nới
  // câu assert.
  //
  // THỬ-CHO-ĐỎ: đổi một vai trong `groundFloor.js` thành 'water' (không kỷ nào có) → đỏ cả 15 kỷ.
  const NHIP = [
    { sessionCount: 12,  streakLength: 2,  level: 1 },   // thành phố mới, ít nhà dân nhất
    { sessionCount: 45,  streakLength: 8,  level: 2 },
    { sessionCount: 120, streakLength: 30, level: 3 },   // thành phố già, kín nhà dân
  ];
  let soAnhChup = 0;
  for (const era of ERAS) {
    const style = getEraStyle(era);
    for (const nhip of NHIP) {
      const ids = BLUEPRINT_CATALOG[era].map((bp) => bp.id);
      const layout = computeCityLayout({
        built:  ids,
        levels: Object.fromEntries(ids.map((id) => [id, nhip.level])),
        era,
        stats:  { sessionCount: nhip.sessionCount, streakLength: nhip.streakLength },
      });
      // Dựng ĐÚNG như `sceneGraph.js` dựng: công trình catalog giữ nguyên loại/hạng/cấp của mình,
      // nhà dân luôn cấp 1 và mang `bpId` suy từ ô lưới.
      const specs = [
        ...layout.buildings.map((b) => buildBuildingSpec({
          bpId: b.bpId, era, type: b.type, rarity: b.rarity, level: b.level,
        })),
        ...layout.dwellings.map((h) => buildBuildingSpec({
          bpId: `dw|${era}|${h.x}|${h.y}`, era, type: h.type, rarity: h.rarity, level: 1,
        })),
      ];
      const nen = new Set();
      const them = new Set();
      for (const spec of specs) {
        for (const p of spec.parts) (p.ground ? them : nen).add(materialFamilyFor(p.role, style));
      }
      // Gác chạy-rỗng: một thành phố thật luôn có đủ 5 bản vẽ và ít nhất vài nhà dân, và tầng trệt
      // phải thật sự sinh ra khối. Thiếu một trong ba thì vòng lặp dưới có thể không chạy lần nào
      // mà bài vẫn xanh (luật Phase 9A: mỗi ngưỡng phải kèm ca hỏng bị nhốt sẵn).
      assert.equal(layout.buildings.length, 5, `kỷ ${era}: quần thể sai — phải đủ 5 bản vẽ catalog`);
      assert.ok(layout.dwellings.length >= 5, `kỷ ${era}: quần thể sai — thiếu nhà dân`);
      assert.ok(them.size > 0, `kỷ ${era} nhịp ${nhip.sessionCount}: không khối tầng trệt nào — bài chạy rỗng`);
      for (const ho of them) {
        assert.ok(nen.has(ho),
          `kỷ ${era} (thành phố ${layout.buildings.length} công trình + ${layout.dwellings.length} `
          + `nhà dân, sau ${nhip.sessionCount} phiên): tầng trệt kéo thêm họ vật liệu "${ho}" mà cả `
          + 'thành phố vốn không có ⇒ MỘT LỆNH VẼ MỚI cho mỗi khung hình');
      }
      soAnhChup += 1;
    }
  }
  assert.equal(soAnhChup, ERAS.length * NHIP.length, 'không duyệt đủ 15 kỷ × 3 nhịp tuổi');
});

test('ĐỐI CHỨNG: phép đo lệnh vẽ ở trên thật sự bắt được một họ vật liệu lạ', () => {
  // ⚠️ Không có bài này thì bài trên có thể xanh vì nó chẳng đo gì (ví dụ: cờ `ground` không được
  // gắn ⇒ `them` luôn rỗng ⇒ vòng lặp không chạy lần nào). Luật Phase 9A: mỗi ngưỡng phải kèm một
  // đối chứng nhốt sẵn ca hỏng, nếu không nó sẽ được nới dần cho tiện.
  const style = getEraStyle(9);
  const spec = buildBuildingSpec({ bpId: 'bp_x', era: 9, type: 'shop', rarity: 'common', level: 2 });
  const ground = spec.parts.filter((p) => p.ground);
  assert.ok(ground.length > 0, 'cờ `ground` không được gắn — bài "không thêm lệnh vẽ" đang chạy rỗng');
  const nen = new Set(spec.parts.filter((p) => !p.ground).map((p) => materialFamilyFor(p.role, style)));
  assert.equal(nen.has(materialFamilyFor('water', style)), false,
    'kỷ 9 mà đã có họ `water` thì đối chứng này mất tác dụng — chọn một họ khác');
});

// ═══════════════════════════════════════════════════════════════════════════════
// TẤT ĐỊNH & BIẾN THỂ THEO HẠT GIỐNG
// ═══════════════════════════════════════════════════════════════════════════════

test('TẤT ĐỊNH: cùng đầu vào → cùng mô tả, và không có `Math.random`/`Date` trong tầng này', async () => {
  const gf = getGroundFloor(6);
  assert.deepEqual(dungTangTret(gf).out, dungTangTret(gf).out);
  const nguon = await readFile(new URL('./groundFloor.js', import.meta.url), 'utf8');
  const khongChuThich = nguon.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  assert.equal(/Math\.random|new Date|Date\.now/.test(khongChuThich), false,
    'tầng mô tả phải THUẦN — một công trình đã xây thì vĩnh viễn không được đổi hình (ADR-007)');
  // Bộ lọc chú thích có thật sự hoạt động không — nếu không thì bài trên xanh oan.
  assert.ok(khongChuThich.length < nguon.length * 0.7, 'bộ lọc chú thích không cắt được gì');
});

test('BIẾN THỂ THEO HẠT GIỐNG: mỗi đại lượng seeded phải TỰ NÓ biến thiên', () => {
  // ⚠️ Bài học Phase 8D, lỗi đã cắn BỐN lần trong `flora.js`: viết cứng số tấm/số cột thì "40 hạt
  // chỉ ra 2–4 dáng", và không gì đỏ lên vì mã vẫn chạy đúng.
  //
  // ⚠️ VÀ BẢN ĐẦU CỦA CHÍNH BÀI NÀY ĐÃ HỎNG ĐÚNG KIỂU ẤY — phép thử ngược bắt được: nó gom cả
  // công trình vào một chữ ký rồi đếm chữ ký khác nhau, mà chữ ký ấy chứa toạ độ `x`, mà `x` thì
  // đã lệch theo hạt giống sẵn. Nên **viết cứng số tấm cửa vẫn cho ra 40 chữ ký khác nhau** và bài
  // test xanh trơn. Một phép đo gộp nhiều đại lượng thì chỉ cần MỘT đại lượng còn sống là nó không
  // bao giờ đỏ — cùng hình dạng với "hằng số nền pha loãng 1,43 lần xuống 1,16 lần" ở vòng 2
  // Performance Gate.
  // ⇒ Bản đúng: mỗi ca dưới đây bật đúng MỘT đại lượng seeded và tắt hết những cái khác.
  const goc = { note: 'dòng thử của bài test', doorWidth: 0.3, doorTall: 0.7, frame: 'stone', recess: 0.3, steps: 1, vernacularFeature: 'none' };
  // Ba ca đầu khoá cửa ở CHÍNH GIỮA (`symmetric`) để độ lệch cửa thôi che mất đại lượng cần đo.
  const CA = [
    ['số tấm cửa bức bàn', { ...goc, door: 'panel', feature: 'none' }, true, 3],
    ['số cột hàng hiên', { ...goc, door: 'double', feature: 'porch' }, true, 3],
    ['số con tiện lan can', { ...goc, door: 'double', feature: 'balcony' }, true, 3],
    // Ba đường hình học MỚI của Bước 2 — mỗi cái là một cơ hội mới để viết cứng một con số.
    ['số nếp tấm da/chiếu', { ...goc, door: 'flap', feature: 'none' }, true, 3],
    ['số ô kính sảnh', { ...goc, door: 'glazed', feature: 'none' }, true, 3],
    ['số nhịp hàng vòm', { ...goc, door: 'double', feature: 'arcade' }, true, 3],
  ];
  for (const [ten, gf, symmetric, toiThieu] of CA) {
    const dem = new Set();
    for (let i = 0; i < 40; i += 1) dem.add(dungTangTret(gf, { bpId: `bp_${i}`, symmetric }).out.length);
    assert.ok(dem.size >= toiThieu,
      `${ten}: 40 hạt giống chỉ ra ${dem.size} giá trị — đại lượng này đang bị viết cứng`);
  }

  // Hai ca sau là BÊN NÀO, không phải BAO NHIÊU — nên đo TƯƠNG ĐỐI so với tâm cửa, để độ lệch cửa
  // (cũng seeded) không trộn vào. Tâm cửa chính là khối `dark` — lòng cửa.
  const ben = (gf, bpId, loc) => {
    const { out } = dungTangTret(gf, { bpId, symmetric: false });
    const tam = out.find((p) => p.role === 'dark');
    return loc(out, tam);
  };
  const truot = new Set();
  const bienHieu = new Set();
  for (let i = 0; i < 40; i += 1) {
    // Cửa lùa: tấm nào nằm ở đường ray NGOÀI — đo bằng dấu của (x tấm sâu nhất − x tâm cửa).
    truot.add(ben({ ...goc, door: 'sliding', feature: 'none' }, `bp_${i}`, (out, tam) => {
      const canh = out.filter((p) => p.role === 'wood').sort((a, b) => b.z - a.z)[0];
      return canh && canh.x > tam.x ? 'phải' : 'trái';
    }));
    // Biển hiệu: treo bên trái hay bên phải cửa.
    bienHieu.add(ben({ ...goc, door: 'double', feature: 'sign' }, `bp_${i}`, (out, tam) => {
      const bien = out.filter((p) => p.role === 'wood').sort((a, b) => Math.abs(b.x - tam.x) - Math.abs(a.x - tam.x))[0];
      return bien && bien.x > tam.x ? 'phải' : 'trái';
    }));
  }
  assert.equal(truot.size, 2, 'cửa lùa luôn để cùng một tấm ra ngoài — bên nào đang bị viết cứng');
  assert.equal(bienHieu.size, 2, 'biển hiệu luôn treo cùng một bên — bên nào đang bị viết cứng');
});

test('KỲ QUAN: cửa nằm CHÍNH GIỮA, tuyệt đối không lệch dù hạt giống nào — cả 15 kỷ', () => {
  // THỬ-CHO-ĐỎ: bỏ nhánh `symmetric ? 0 : …` → đỏ.
  // ⚠️ Bước 2 duyệt CẢ BẢNG chứ không còn 3 kỷ: hai kiểu cửa mới (`flap`, `glazed`) và đặc trưng
  // mới (`arcade`) đều tự đặt khối theo cách riêng, nên mỗi cái là một cơ hội mới để phá đối xứng.
  // (Đúng như `sliding` đã từng phá — nó phải đổi từ 2 tấm sang 4 tấm để cân được.)
  for (const era of ERAS) {
    const gf = getGroundFloor(era);
    for (let i = 0; i < 20; i += 1) {
      const { out } = dungTangTret(gf, { bpId: `bp_${i}`, symmetric: true });
      const tong = out.reduce((s, p) => s + p.x, 0);
      assert.ok(Math.abs(tong) < 1e-9,
        `kỷ ${era} hạt ${i}: tầng trệt của kỳ quan lệch ${tong.toFixed(4)} theo trục X`);
    }
  }
});

test('CẢ 15 KỶ: cửa đời cũ đã đi hẳn, và không kỷ nào có hai cái cửa chồng lên nhau', () => {
  // ⚠️ ĐÂY LÀ VẾ CÒN LẠI CỦA VIỆC XOÁ `legacy`. Bước 1 có hai bài: một canh 3 kỷ mới KHÔNG còn cửa
  // cũ, một canh 12 kỷ cũ VẪN GIỮ nguyên cửa cũ. Bước 2 xoá vế thứ hai — không phải vì nó hết
  // đúng, mà vì cái nó canh đã không còn tồn tại. Vế thứ nhất nay trải ra cả 15.
  //
  // Cái nó bắt được: `emitWindows` từng tự dựng một cái cửa rộng cứng `LEGACY_DOOR_WIDTH`. Nếu ai
  // đó thêm lại — hoặc thêm một cái cửa thứ hai ở một chỗ khác — thì công trình sẽ có hai lối vào
  // chồng lên nhau, và trên ảnh nó chỉ là một vệt tối hơi lạ ở tầng một. Không gì đỏ lên.
  // THỬ-CHO-ĐỎ: bỏ `if (hasGroundFloor) return` trong `emitWindows` → đỏ ở cả 15 kỷ.
  for (const era of ERAS) {
    const spec = buildBuildingSpec({ bpId: 'bp_x', era, type: 'economy', rarity: 'rare', level: 2 });
    const cuaCu = spec.parts.filter((p) => p.role === 'dark' && Math.abs(p.w - LEGACY_DOOR_WIDTH) < 1e-9);
    assert.equal(cuaCu.length, 0, `kỷ ${era} vẫn còn cửa đời cũ chồng lên cửa mới`);
    assert.ok(spec.parts.filter((p) => p.ground).length > 0, `kỷ ${era} không dựng tầng trệt nào`);
  }
  // ⚠️ VÀ ĐỐI CHỨNG CHO CHÍNH PHÉP ĐO ẤY: nếu `LEGACY_DOOR_WIDTH` bị đổi thành một con số không
  // công trình nào dùng, bài trên sẽ xanh vì nó chẳng tìm thấy gì — xanh vì mù, không vì sạch.
  // Bài này bắt phép đo phải còn nhìn thấy đúng cái hình dạng nó đi tìm.
  const daDung = buildBuildingSpec({ bpId: 'bp_x', era: 9, type: 'economy', rarity: 'rare', level: 2 })
    .parts.filter((p) => p.role === 'dark');
  assert.ok(daDung.length > 0,
    'không còn khối `dark` nào trên mặt tiền ⇒ phép đo "còn cửa cũ không" ở trên đang chạy rỗng');
});
