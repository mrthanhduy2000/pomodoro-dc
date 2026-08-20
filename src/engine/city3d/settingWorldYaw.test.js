/**
 * settingWorldYaw.test.js — KHOÁ TRƯỜNG `worldYaw` (ĐÓNG `TECH_DEBT #57`).
 *
 * Bài toán: 8/14 kỷ có nước nằm ở phía camera QUAY LƯNG LẠI — đo được, không suy ra (bảng §1 ở
 * `PERFORMANCE.md`: kỷ 13 ra 0,00% và kỷ 14 ra 0,09% khung hình). Lời giải là **xoay tờ giấy, không
 * xoay thế giới**: `side` giữ nguyên sự thật lịch sử, `DEFAULT_YAW` giữ nguyên hằng số mỹ thuật,
 * còn `worldYaw` là chỗ DUY NHẤT chịu trách nhiệm cho QUAN HỆ giữa hai thứ ấy.
 *
 * ⚠️ Bảy bài dưới đây canh bảy thứ KHÁC NHAU. Bài nào cũng đã thử-cho-đỏ, và chỗ đỏ mong đợi được
 * ghi ngay trong chú thích của nó TRƯỚC khi phá — đúng luật §6 của Đàm.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DEFAULT_VIEW_FAR_YAW, SETTING_STYLES, SIDE_YAW, getSetting, normalizeYaw, worldYaw,
} from './settingStyle.js';
import { DEFAULT_YAW } from './orbit.js';
import {
  ERAS_WITH_WATER_GEOMETRY, buildSetting, hazXuongDay, quarterTurns,
} from './setting.js';

const ERAS = Object.keys(SETTING_STYLES).map(Number).sort((a, b) => a - b);
const GRID = 12;
const VUONG = Math.PI / 2;
const DO = (r) => (r * 180) / Math.PI;

/** Góc lệch giữa hướng bờ nước TRÊN MÀN HÌNH và hướng camera nhìn ra xa. */
function lechSoVoiTamNhin(era) {
  const mat = SIDE_YAW[getSetting(era).side];
  if (mat === undefined) return null;
  return normalizeYaw(mat + worldYaw(era) - DEFAULT_VIEW_FAR_YAW);
}

test('DÂY BUỘC — `DEFAULT_VIEW_FAR_YAW` phải bằng đúng `DEFAULT_YAW + π`', () => {
  // ⚠️ `settingStyle.js` CHÉP con số này thay vì `import` từ `orbit.js`, vì import thẳng sẽ tạo
  // vòng tròn `orbit → terrain → setting → settingStyle → orbit`. Một bản chép thì phải có dây
  // buộc, nếu không nó là đúng cái bẫy "một luật hai công thức" đã cắn `daylight.test.js`.
  // Bài test là chỗ DUY NHẤT nạp được cả hai module mà không tạo vòng.
  //
  // THỬ-CHO-ĐỎ: đổi `DEFAULT_VIEW_FAR_YAW` thành `Math.PI / 4` ⇒ đỏ ngay dòng assert dưới đây.
  assert.equal(normalizeYaw(DEFAULT_VIEW_FAR_YAW), normalizeYaw(DEFAULT_YAW + Math.PI),
    'hằng số hướng nhìn trong bảng địa thế đã trôi khỏi `DEFAULT_YAW` của camera');
});

test('`worldYaw` LUÔN là bội số của 90° — ở cả 15 kỷ', () => {
  // Đây là bất biến ĐẮT NHẤT của cả trường này, và nó im lặng tuyệt đối nếu vỡ: mọi công thức mặt
  // nước lấy mốc ở nửa CẠNH hình vuông (6 ô), trong khi nửa ĐƯỜNG CHÉO là 6√2 ≈ 8,49. Xoay 45° mà
  // vẫn dùng mốc 6 thì nước cắt vào GÓC lưới 2,49 ô — ngập vào thành phố, gãy ADR-007, build/lint/
  // test đều xanh.
  //
  // THỬ-CHO-ĐỎ: cho `worldYaw` trả `Math.PI / 4` ⇒ đỏ ở đúng dòng `assert.notEqual(q, null)` này,
  // và đỏ ở CẢ bài "không ô nào trong lưới bị ướt" bên dưới (hai bài canh hai hậu quả khác nhau
  // của cùng một lỗi — đó là chủ đích, không phải trùng lặp).
  for (const era of ERAS) {
    const q = quarterTurns(worldYaw(era));
    assert.notEqual(q, null,
      `kỷ ${era}: worldYaw = ${DO(worldYaw(era)).toFixed(2)}° không phải bội số của 90°`);
    assert.ok(q >= 0 && q <= 3, `kỷ ${era}: số phần tư vòng ${q} ngoài 0..3`);
  }
});

test('NƯỚC PHẢI LỌT VÀO TẦM NHÌN — cả 14 kỷ, và lệch sẵn một góc chứ không nằm chính giữa', () => {
  // Đây là lời hứa gốc của `TECH_DEBT #57`, viết thành một QUAN HỆ chứ không thành một con số %:
  // % khung hình còn phụ thuộc bề rộng con sông (kỷ 10 là một con kênh Amsterdam, hẹp là ĐÚNG),
  // còn "bờ nước có nằm sau lưng không" thì đúng/sai rạch ròi.
  //
  // THỬ-CHO-ĐỎ: cho `worldYaw` luôn trả 0 ⇒ đỏ ở dòng `assert.ok(Math.abs(lech) ...)` tại kỷ 2
  // (kỷ có nước đầu tiên nằm ở phía khuất).
  let soCoNuoc = 0;
  for (const era of ERAS) {
    const lech = lechSoVoiTamNhin(era);
    if (lech === null) continue;
    soCoNuoc += 1;
    assert.ok(Math.abs(lech) <= VUONG + 1e-9,
      `kỷ ${era}: bờ nước lệch ${DO(lech).toFixed(0)}° so với hướng nhìn — vẫn nằm sau lưng camera`);
    // Và KHÔNG được nằm chính giữa: nước dead-centre đọc ra là một cái hồ, không phải một bờ biển.
    assert.ok(Math.abs(lech) > Math.PI / 8,
      `kỷ ${era}: bờ nước lệch chỉ ${DO(lech).toFixed(0)}° — gần như chính diện, đọc ra là cái hồ`);
  }
  assert.equal(soCoNuoc, 14, 'bảng phải có đúng 14 kỷ có nước');
});

test('BỐ CỤC KHÔNG ĐƯỢC DỒN VỀ MỘT PHÍA — luật (3) của bảng phải sống sót qua phép xoay', () => {
  // ⚠️ BÀI NÀY BẮT ĐƯỢC MỘT LỖI THẬT TRONG CHÍNH PHIÊN VIẾT RA NÓ. Công thức `worldYaw` bản đầu ép
  // cả 14 kỷ về CÙNG một góc tương đối (−45°). Nó chạy, nó đạt cổng 5%, và nó phá đúng cái luật (3)
  // mà bảng địa thế sinh ra để giữ — *"15 kỷ không được ra cùng một bố cục lệch về một phía"* — chỉ
  // khác là lần này luật ấy chết ở tầng HÌNH chứ không ở tầng BẢNG, nơi không một bài test cũ nào
  // nhìn tới. Phát hiện bằng cách ĐO (bảng 15 kỷ × 24 góc), không bằng cách đọc mã.
  //
  // THỬ-CHO-ĐỎ: đổi `worldYaw` về công thức "chuẩn hoá tất cả về một góc"
  // (`normalizeYaw(viewFar - Math.PI / 4 - mat)`) ⇒ đỏ ở dòng `assert.ok(trai > 0 && phai > 0)`.
  let trai = 0;
  let phai = 0;
  for (const era of ERAS) {
    const lech = lechSoVoiTamNhin(era);
    if (lech === null) continue;
    if (lech > 0) phai += 1; else trai += 1;
  }
  assert.ok(trai > 0 && phai > 0,
    `cả 14 kỷ đổ về một bên khung (${trai} bên này / ${phai} bên kia) — luật (3) của bảng chết`);
  // Và không được lệch hẳn: bên ít hơn phải chiếm ít nhất một phần ba.
  assert.ok(Math.min(trai, phai) >= 14 / 3,
    `chia ${trai}/${phai} — quá lệch, phần lớn kỷ vẫn ra cùng một bố cục`);
});

test('XOAY ÍT NHẤT CÓ THỂ — 6 kỷ có nước KHÔNG xoay một độ nào (và con số ấy đếm được)', () => {
  // Mỗi độ xoay là một tấm ảnh mốc bị vứt đi. Công thức chỉ động vào kỷ có bờ nước nằm SAU LƯNG;
  // sáu kỷ vốn đã nhìn thấy nước thì `worldYaw = 0` và ảnh của chúng phải trùng TỪNG BYTE.
  //
  // ⚠️ Con số 6 viết cứng là CHỦ ĐÍCH — nó là cái hẹn giờ duy nhất chạy được (bài học Phase 10
  // Bước 1). Ai đổi công thức thành "xoay tất cho đều" sẽ thấy nó đỏ ngay, kèm câu giải thích.
  //
  // THỬ-CHO-ĐỎ: bỏ nhánh `if (Math.abs(lech) <= π/2) return 0` ⇒ `soKhongXoay` tụt còn 0 ⇒ đỏ.
  let soKhongXoay = 0;
  for (const era of ERAS) {
    if (getSetting(era).side === 'none') continue;
    if (Math.abs(worldYaw(era)) < 1e-9) soKhongXoay += 1;
  }
  assert.equal(soKhongXoay, 6,
    `${soKhongXoay}/14 kỷ có nước giữ nguyên góc — công thức đang xoay nhiều hơn mức cần`);

  // Kỷ khô cũng phải bằng 0, và đây là nhân chứng rẻ nhất cho "trường mới không đụng gì ngoài nước".
  assert.equal(worldYaw(1), 0, 'kỷ khô không có bờ nào để quay ra, phải là 0');
});

test('ADR-007 — xoay xong KHÔNG một ô nào trong lưới 12×12 bị ướt', () => {
  // Bất biến "chỉ thêm, không bao giờ dời": nhà đã xây không được lún xuống nước. Bài này hỏi
  // thẳng 144 ô của MỌI kỷ đã dựng hình, chứ không tin vào `reach ≥ SHORE_BAND` — vì phép xoay là
  // đúng thứ có thể phá quan hệ ấy mà bảng không hề biết.
  //
  // THỬ-CHO-ĐỎ: thay `xoayNguoc(...)` trong `insetAt` bằng một phép xoay 45° THẬT
  // (`x = x₀·√½ − z₀·√½`, `z = x₀·√½ + z₀·√½`) ⇒ kỷ 12 ướt 4/144 ô ⇒ đỏ ở `assert.equal(uot, 0)`.
  // ⚠️ PHÉP PHÁ ĐẦU TIÊN TÔI VIẾT KHÔNG NỔ, VÀ HỎNG NẰM Ở PHÉP PHÁ: nó cho `worldYaw` trả π/4 rồi
  // nới `quarterTurns` thành `Math.round(q * 2) % 4` — nhưng `q = 0,5` thì `round(1) = 1`, tức
  // vẫn là một phần tư vòng CHẴN, thế giới vẫn xoay đúng 90° và mã vẫn đúng. Bài test xanh vì mã
  // đúng, không vì bài test mù. Đúng luật Phase 8A: *khi phá mà không nổ, nghi CHÍNH PHÉP PHÁ
  // trước* — và cách vá là làm cho khối cần phá BIẾN MẤT khỏi kết quả, chứ không sửa một biểu
  // thức trông-như-vô-hiệu-hoá.
  let soKyDaDung = 0;
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const s = buildSetting({ era, gridSize: GRID });
    // ⚠️ GÁC CHẠY-RỖNG: không có vế này thì bài test vẫn XANH khi `buildSetting` từ chối sạch mọi
    // kỷ — đúng cái bẫy "từ chối thẳng mà không ai đếm số lần từ chối" (Phase 10 Bước 2).
    assert.equal(s.built, true, `kỷ ${era} nằm trong ERAS_WITH_WATER_GEOMETRY mà không dựng ra nước`);
    soKyDaDung += 1;
    let uot = 0;
    for (let u = 0; u < GRID; u += 1) {
      for (let v = 0; v < GRID; v += 1) if (s.blendAt(u, v) > 0) uot += 1;
    }
    assert.equal(uot, 0, `kỷ ${era}: ${uot}/144 ô trong lưới bị ướt sau khi xoay`);
  }
  assert.ok(soKyDaDung > 0, 'không kỷ nào được duyệt — bài test chạy rỗng');
});

test('TỪ CHỐI THẲNG — góc không phải bội số 90° thì KHÔNG dựng nước, không tự kẹp', () => {
  // Tự chữa (kẹp về bội số gần nhất) là cách một trường lặng lẽ mất tác dụng — bẫy `MIN_STONE`
  // Phase 9D. Ở đây `quarterTurns` trả `null` và `buildSetting` coi như kỷ ấy chưa dựng nước.
  //
  // THỬ-CHO-ĐỎ: đổi `quarterTurns` thành `return ((Math.round(q) % 4) + 4) % 4` (bỏ phép kiểm
  // sai số) ⇒ đỏ ở dòng `assert.equal(quarterTurns(Math.PI / 4), null)`.
  assert.equal(quarterTurns(Math.PI / 4), null, '45° phải bị từ chối');
  assert.equal(quarterTurns(Math.PI / 3), null, '60° phải bị từ chối');
  assert.equal(quarterTurns(Number.NaN), null, 'NaN phải bị từ chối');
  assert.equal(quarterTurns(0), 0);
  assert.equal(quarterTurns(Math.PI / 2), 1);
  assert.equal(quarterTurns(Math.PI), 2);
  assert.equal(quarterTurns(-Math.PI / 2), 3);
  assert.equal(quarterTurns(2 * Math.PI), 0, 'một vòng trọn phải quy về 0');
});

test('ĐỐI CHỨNG §4-Q3 — một TẤM THỨ BA cũng phải đi qua đúng `hazXuongDay` và khớp ở chỗ giáp', () => {
  // Đàm ra bài này (§4, câu 3): *"dựng một tấm thứ ba giả trong test, bắt nó đi qua đúng hàm ấy và
  // ra cùng kết quả ở chỗ giáp. Không có đối chứng thì 'một luật một công thức' chỉ là lời hứa
  // trong chú thích — Phase 8B (`countTriangles`) đã trả giá cho đúng loại lời hứa đó."*
  //
  // Hai tấm THẬT (`terrain.surfaceHeightAt` trong lưới, `horizon.heightAt` ngoài lưới) gặp nhau ở
  // `innerEdge`. Tấm thứ ba dưới đây là một tấm GIẢ: nó tự tính cao độ khô bằng công thức riêng,
  // rồi khoét bằng CHÍNH `hazXuongDay`. Lời hứa được kiểm: với cùng `(dat, day, tron)` thì kết quả
  // phải giống hệt tấm nào cũng vậy — tức phép khoét không mang trạng thái ẩn nào của người gọi.
  //
  // THỬ-CHO-ĐỎ: trong tấm giả, thay `hazXuongDay(dat, day, tron)` bằng
  // `dat + (day - dat) * tron` (phép `lerp` "tương đương" mà chú thích của `hazXuongDay` cấm)
  // ⇒ đỏ ở dòng `assert.equal(baGiaBang, true)` tại ca `dat` thấp hơn `day`.
  const s = buildSetting({ era: 12, gridSize: GRID });
  assert.equal(s.built, true);

  /** Tấm thứ BA: cao độ khô tuỳ ý, khoét bằng đúng hàm dùng chung. */
  const tamGia = (u, v, datKho) => {
    const tron = s.blendAt(u, v);
    if (tron <= 0) return datKho;
    return hazXuongDay(datKho, -0.92 - s.depthAt(u, v), tron);
  };

  let soDiemGiap = 0;
  let baGiaBang = true;
  // Quét một dải cắt ngang mép nước, gồm cả chỗ khô, chỗ giáp, và chỗ ngập hẳn.
  for (let t = -3; t <= 6; t += 0.25) {
    for (const datKho of [0.5, 0, -0.62, -2.5]) {
      // Đi theo hướng bờ THẬT (đã tính `worldYaw`) để chắc chắn cắt qua mép nước.
      const mat = SIDE_YAW[s.style.side] + worldYaw(12);
      const tam = (GRID - 1) / 2;
      const r = tam + 0.5 + s.style.reach + t;
      const u = tam + Math.sin(mat) * r;
      const v = tam + Math.cos(mat) * r;
      const tron = s.blendAt(u, v);
      if (tron > 0) soDiemGiap += 1;
      const chuan = tron <= 0 ? datKho : hazXuongDay(datKho, -0.92 - s.depthAt(u, v), tron);
      if (tamGia(u, v, datKho) !== chuan) baGiaBang = false;
      // ⚠️ VẾ QUAN TRỌNG NHẤT: nước chỉ được HẠ, không bao giờ NÂNG. `datKho = -2.5` nằm SÂU dưới
      // đáy sông, nên một phép `lerp` sẽ kéo nó LÊN và con sông tự đắp gờ giữa đồng.
      assert.ok(tamGia(u, v, datKho) <= datKho + 1e-12,
        `tấm thứ ba NÂNG mặt đất lên tại (${u.toFixed(2)}, ${v.toFixed(2)}), datKho=${datKho}`);
    }
  }
  assert.ok(soDiemGiap > 20, `chỉ ${soDiemGiap} điểm thật sự chạm nước — dải quét chưa cắt qua mép`);
  assert.equal(baGiaBang, true, 'tấm thứ ba ra kết quả khác hai tấm thật ở chỗ giáp');
});
