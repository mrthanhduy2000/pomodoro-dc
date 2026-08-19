/**
 * Khoá hai cái bẫy của `city-preview.mjs` mà **không có gì khác bắt được**, và cả hai đều đã cắn
 * thật trong CÙNG MỘT phiên (Performance Gate vòng 2, 2026-08-17).
 *
 * ⚠️ BẪY 1 — DẤU HUYỀN (`) TRONG CHÚ THÍCH LÀM CHẾT CẢ FILE.
 * Toàn bộ mã của trang xem thử nằm trong MỘT template literal khổng lồ (`return \`` … `\`;`, hơn
 * 300 dòng). Viết một chú thích kiểu ``// `renderer.info` đếm sau khi cắt`` là **đóng chuỗi giữa
 * chừng** ⇒ `SyntaxError`, và file chết ngay lúc nạp. Cắn HAI lần liên tiếp trong một phiên, vì
 * viết chú thích kỹ thuật bằng dấu huyền là phản xạ của cả dự án này (mọi file khác đều làm vậy).
 * ⚠️ ESLint KHÔNG bắt được (nó chỉ thấy một chuỗi hợp lệ ngắn hơn + rác phía sau đôi khi vẫn
 * parse), `npm run build` KHÔNG bắt (file này không nằm trong bundle), và bản thân bài test nào
 * không nạp file cũng không thấy. Triệu chứng duy nhất là công cụ đo chết lúc chạy — tức lúc
 * Đàm đang chạy nó trên MacBook, sau khi AI đã đi ngủ.
 *
 * ⚠️ BẪY 2 — NHÁY KÉP ASCII (") TRONG DÒNG `console.log` LÀM CỤT DÒNG KẾT LUẬN.
 * `bench-macbook.sh` lọc đầu ra bằng `[^"]*` (bắt buộc, vì Chromium bọc mỗi dòng console vào nháy
 * kép rồi dán thêm `", source: http://…/preview.js (42867)`). Dòng nào chứa " sẽ bị **cắt ngang**
 * tại đúng chỗ đó. Đã thấy tận mắt: dòng kết luận quan trọng nhất của Bước 1 in ra thành đúng
 * `[stats] ✓ ` rồi hết — một dòng trống rỗng trông y hệt "chẳng có gì đáng nói".
 * Cách viết đúng: dùng nháy kép cong “ ” (U+201C/201D), mắt đọc y như nhau.
 *
 * ⇒ Đây đúng tinh thần "một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn
 * được" (bài học của chính vòng 1). Cả hai bài dưới đây đã thử-cho-đỏ.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import {
  BYTE_MOI_DIEM_XAU_NHAT, chiaBang, HAN_TIN_CDP, kiemKhungNhin, SO_DIEM_MOI_BANG,
  hangCauTrucBangQuet, soiVetRach, VET_RACH_HE_SO, VET_RACH_SAN,
  dongNhatKyVetRach, NGUONG_TRUY_VET_RACH,
} from './city-preview.mjs';

const GỐC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ĐƯỜNG_DẪN = path.join(GỐC, 'scripts/city-preview.mjs');
const NGUỒN = readFileSync(ĐƯỜNG_DẪN, 'utf8');

/**
 * Cắt lấy đúng phần thân template literal dựng trang xem thử.
 * Mốc mở là dòng kết thúc bằng `return \``, mốc đóng là dòng chỉ có `\`;`.
 */
function thânTemplate() {
  const dòng = NGUỒN.split('\n');
  const mở = dòng.findIndex((d) => /return `$/.test(d));
  assert.ok(mở >= 0, 'không tìm thấy chỗ mở template của trang xem thử — file đã đổi cấu trúc?');
  const đóng = dòng.findIndex((d, i) => i > mở && d === '`;');
  assert.ok(đóng > mở, 'không tìm thấy chỗ đóng template — file đã đổi cấu trúc?');
  return { dòng: dòng.slice(mở + 1, đóng), sốDòngĐầu: mở + 2 };
}

test('city-preview.mjs PHẢI parse được — không dấu huyền lạc trong template', () => {
  // Phép kiểm THẬT: bảo chính Node parse file. Không đoán bằng regex, không đếm dấu.
  execFileSync(process.execPath, ['--check', ĐƯỜNG_DẪN], { stdio: 'pipe' });

  // Và chỉ đích danh chỗ sai, vì thông báo của `--check` chỉ ra một dòng chứ không nói vì sao.
  const { dòng, sốDòngĐầu } = thânTemplate();
  const phạm = dòng
    .map((d, i) => (d.includes('`') ? `dòng ${sốDòngĐầu + i}: ${d.trim()}` : null))
    .filter(Boolean);
  assert.deepEqual(phạm, [],
    'Có dấu huyền (`) trong thân template của trang xem thử — nó ĐÓNG CHUỖI giữa chừng và làm chết\n'
    + 'cả file. Trong vùng này hãy dùng nháy đơn cho tên hàm/biến trong chú thích:\n  '
    + phạm.join('\n  '));
});

test('mọi dòng [bench]/[stats] KHÔNG được chứa nháy kép ASCII — nó bị bộ lọc cắt cụt', () => {
  const { dòng, sốDòngĐầu } = thânTemplate();
  const phạm = [];
  dòng.forEach((d, i) => {
    // Chỉ soi các dòng THẬT SỰ in ra nhãn [bench]/[stats]; chú thích thì tuỳ ý.
    if (!/\[(bench|stats)\]/.test(d)) return;
    if (/^\s*(\/\/|\*|\/\*)/.test(d.trim())) return;
    // Chuỗi trong mã này luôn dùng nháy ĐƠN, nên mọi " còn lại là ký tự nội dung.
    if (d.includes('"')) phạm.push(`dòng ${sốDòngĐầu + i}: ${d.trim()}`);
  });
  assert.deepEqual(phạm, [],
    'Dòng in [bench]/[stats] có nháy kép ASCII ("). `bench-macbook.sh` lọc bằng [^"]* nên dòng sẽ\n'
    + 'bị CẮT NGANG tại đó và Đàm nhận được một dòng cụt. Dùng nháy cong “ ” thay thế:\n  '
    + phạm.join('\n  '));
});

/**
 * ⚠️ BẪY 3 — KHUNG NHÌN ĐOÁN BẰNG MỘT CON SỐ CỘNG THÊM (`TECH_DEBT #49`).
 *
 * Bản cũ mở cửa sổ bằng `--window-size=(width + 34),(height + 80)`. Trong hộp cát này khung nhìn
 * thật ra 1134×693, mà canvas 1100×700 đặt ở `y = 16` cần tới 716 dòng ⇒ **23 dòng cuối chưa bao
 * giờ được vẽ ra**, và ảnh vẫn cao 780 vì Chromium phủ nốt bằng nền trang. Không có gì đỏ lên:
 * ảnh vẫn ra, vẫn đẹp, vẫn đúng tên. Suốt nhiều tháng mọi ảnh đơn là một khung hình 1100×677 mang
 * tên 1100×700 (tỉ lệ thật 1,625 trong khi camera dựng theo 1,571 ⇒ kéo dãn dọc nhẹ).
 *
 * Ba bài dưới đây khoá bản vá. Chúng KHÔNG khoá "khung nhìn phải bằng bao nhiêu" — con số ấy được
 * phép đổi; chúng khoá **phép kiểm** phải còn bắt được bộ số hỏng cũ, và phải bắt ở CẢ HAI chiều.
 * Đã thử-cho-đỏ: đổi `Math.ceil` → `Math.round` làm đỏ bài thứ ba; bỏ vế `thieuNgang === 0` khỏi
 * `ok` làm đỏ bài thứ hai.
 */
test('ĐỐI CHỨNG: phép kiểm khung nhìn PHẢI còn bắt được đúng ca 23 dòng bị xén của #49', () => {
  const canvasCũ = { x: 16, y: 16, width: 1100, height: 700 };
  const kết = kiemKhungNhin(canvasCũ, { width: 1134, height: 693 });
  assert.equal(kết.ok, false, 'bộ số hỏng cũ (khung nhìn 1134×693) lọt lưới — cổng chặn mất răng');
  assert.equal(kết.thieuDoc, 23, 'phải nói ra ĐÚNG 23 dòng thiếu, không chỉ "có thiếu"');
  assert.equal(kết.thieuNgang, 0, 'ca cũ không thiếu cột nào — báo thừa là báo oan');

  // Và khung nhìn mà `shoot()` đang dùng (width + 96, height + 240) phải ĐẠT — nếu không thì công
  // cụ tự chặn chính nó ở mọi lần chạy.
  assert.equal(kiemKhungNhin(canvasCũ, { width: 1100 + 96, height: 700 + 240 }).ok, true);
});

test('phép kiểm khung nhìn phải chạm CẢ HAI chiều, không chỉ chiều đang sai', () => {
  // Chiều đang sai của #49 là DỌC, nên chiều NGANG là chiều dễ quên — đúng lỗi mà `--selftest` của
  // `frame-fit.mjs` mắc ở Phase 7B (chỉ vặn khoảng cách camera nên mù hoàn toàn với trục ngang).
  const hẹpNgang = kiemKhungNhin({ x: 16, y: 16, width: 1100, height: 700 }, { width: 1115, height: 940 });
  assert.equal(hẹpNgang.ok, false, 'thiếu 1 cột mà vẫn báo ĐẠT');
  assert.equal(hẹpNgang.thieuNgang, 1);
  assert.equal(hẹpNgang.thieuDoc, 0);
});

test('thò ra nửa điểm ảnh vẫn là thò ra — làm tròn xuống là tự nới cổng', () => {
  const nửa = kiemKhungNhin({ x: 0, y: 0, width: 100.4, height: 100 }, { width: 100, height: 100 });
  assert.equal(nửa.ok, false);
  assert.equal(nửa.thieuNgang, 1);
});

test('KHÔNG còn `--screenshot`/`--window-size`/`--virtual-time-budget` — ba cái đoán của #49', () => {
  // ⚠️ Khoá bằng cách hỏi chính mã nguồn, vì đây là loại vi phạm mà lint/build không thể bắt: ba cờ
  // ấy chạy được, ra ảnh, chỉ là ra một khung hình khác với khung được khai. Ai đó vô tình thêm lại
  // một trong ba (chẳng hạn để "cho nhanh") sẽ dựng lại đúng cái bẫy vừa gỡ.
  // ⚠️ PHẢI BỎ DÒNG CHÚ THÍCH RA TRƯỚC. Bản đầu của chính bài này ĐỎ OAN, vì đoạn giải thích ngay
  // phía trên có nhắc tên ba cờ ấy trong dấu huyền — tức nó tố cáo chính lời giải thích về việc đã
  // gỡ chúng. Đúng họ với `/tênHàm\(/` bắt trúng dòng `function tênHàm(` ở Phase 7A: hỏi trên mã
  // nguồn thì phải hỏi trên MÃ, không hỏi trên văn bản.
  const MÃ = NGUỒN.split('\n').filter((d) => !/^\s*(\/\/|\*|\/\*)/.test(d)).join('\n');
  const phạm = ['--screenshot', '--window-size', '--virtual-time-budget']
    .filter((cờ) => MÃ.includes(`'${cờ}`) || MÃ.includes(`\`${cờ}`));
  assert.deepEqual(phạm, [],
    'Ba cờ này ĐOÁN cỡ khung hình thay vì ĐO nó (TECH_DEBT #49). Chụp bằng CDP `clip` theo\n'
    + '`getBoundingClientRect()` của canvas — xem hàm `shoot()`. Cờ còn sót: ' + phạm.join(', '));
});


/* ────────────────────────────────────────────────────────────────────────────
 * CHIA DẢI CHỤP — ổ cắm CDP có trần cứng 4 MiB một tin nhắn (đo 2026-08-19).
 * ──────────────────────────────────────────────────────────────────────────── */

function kiemPhu(hop, bang) {
  assert.ok(bang.length > 0, 'phải có ít nhất một dải');
  assert.equal(bang[0].y, 0, 'dải đầu phải bắt đầu ở 0');
  let cao = 0;
  for (let i = 0; i < bang.length; i += 1) {
    assert.equal(bang[i].y, cao, `dải ${i} phải nối liền dải trước — không hở, không chồng`);
    assert.ok(bang[i].height > 0, `dải ${i} rỗng`);
    cao += bang[i].height;
  }
  assert.equal(cao, hop.height, 'tổng các dải phải bằng đúng chiều cao hộp');
}

test('chia dải phủ trọn hộp, không hở không chồng, ở đủ mọi cỡ ảnh dự án đang dùng', () => {
  // Ba cỡ THẬT: khung mặc định · cận cảnh --width 1500 · bảng quét 15 kỷ × 6 chặng.
  for (const hop of [{ width: 1100, height: 700 }, { width: 1500, height: 954 }, { width: 1864, height: 3120 }]) {
    kiemPhu(hop, chiaBang(hop));
  }
  // Cỡ lẻ, và ca chia hết đúng khớp (dải cuối KHÔNG cụt) — chỗ hay sinh một dải rỗng thừa.
  kiemPhu({ width: 1000, height: 1 }, chiaBang({ width: 1000, height: 1 }));
  const vuaKhit = chiaBang({ width: 1024, height: 1024 }, 512 * 1024);
  kiemPhu({ width: 1024, height: 1024 }, vuaKhit);
  assert.equal(vuaKhit.length, 2, 'chia hết thì ra đúng 2 dải, không kèm dải rỗng');
});

test('ĐỐI CHỨNG: mỗi dải phải lọt trần 4 MiB — mà chụp NGUYÊN ẢNH (cách cũ) thì KHÔNG', () => {
  const bangQuet = { width: 1864, height: 3120 };

  for (const b of chiaBang(bangQuet)) {
    // (a) LỜI HỨA THẬT: dưới trần cứng của ổ cắm.
    const gia = bangQuet.width * b.height * BYTE_MOI_DIEM_XAU_NHAT;
    assert.ok(gia < HAN_TIN_CDP, `dải tại y=${b.y} nặng ${gia} byte, vượt trần ${HAN_TIN_CDP}`);
    // (b) VÀ DƯỚI ĐÚNG NGÂN SÁCH ĐÃ KHAI. Thiếu vế này thì một phép làm tròn sai chiều (floor→ceil)
    //     vẫn lọt, vì nó chỉ ăn vào phần biên an toàn 2× chứ chưa chạm trần — tức bài test im lặng
    //     tiêu dần chính cái biên mà nó được lập ra để giữ.
    assert.ok(bangQuet.width * b.height <= SO_DIEM_MOI_BANG,
      `dải tại y=${b.y} rộng ${bangQuet.width * b.height} điểm, vượt ngân sách ${SO_DIEM_MOI_BANG}`);
  }

  // ⚠️ VÀ MỘT CÁI TRẦN CHO CHÍNH CÁI TRẦN. Bài test nhập hằng số của mã sản phẩm thì nó TRÔI THEO
  //    hằng số ấy (bài học `MAX_COURSES` ở Phase 8A). Khoá luôn QUYẾT ĐỊNH: ngân sách mỗi dải
  //    không được quá MỘT NỬA trần đo được — biên ấy là thứ duy nhất che cho ta khi một ảnh nào đó
  //    nén kém hơn dự tính.
  assert.ok(SO_DIEM_MOI_BANG * BYTE_MOI_DIEM_XAU_NHAT * 2 <= HAN_TIN_CDP,
    'ngân sách mỗi dải đã ăn quá nửa trần 4 MiB — biên an toàn không còn');

  // ⚠️ ĐÂY MỚI LÀ PHẦN CÓ RĂNG: nhốt lại đúng bộ số đã giết bản quét ngày 2026-08-19. Không có nó
  // thì ai đó nới ngân sách lên cả tấm ảnh vẫn thấy bài trên xanh (một dải = cả ảnh, "phủ trọn"
  // vẫn đúng), và lỗi quay lại y nguyên.
  const caCu = bangQuet.width * bangQuet.height * BYTE_MOI_DIEM_XAU_NHAT;
  assert.ok(caCu > HAN_TIN_CDP * 2,
    'bản quét 15 kỷ chụp một phát phải VƯỢT XA trần — nếu không thì đối chứng này hết ý nghĩa');
  assert.ok(chiaBang(bangQuet).length > 1, 'và vì vậy nó BẮT BUỘC phải chia hơn một dải');
});

test('ảnh rộng hơn cả ngân sách vẫn chia được — mỗi dải một hàng, không bao giờ ra dải cao 0', () => {
  const bang = chiaBang({ width: 900_000, height: 3 }, 512 * 1024);
  assert.deepEqual(bang, [{ y: 0, height: 1 }, { y: 1, height: 1 }, { y: 2, height: 1 }]);
});

test('hộp không hợp lệ thì từ chối, không đoán bừa', () => {
  assert.throws(() => chiaBang({ width: 10.5, height: 4 }), /nguyên và dương/);
  assert.throws(() => chiaBang({ width: 10, height: 0 }), /nguyên và dương/);
  assert.throws(() => chiaBang({ width: 10, height: 4 }, 0), /phải dương/);
});

/**
 * ─── ẢNH RÁCH NGANG ───────────────────────────────────────────────────────────────────────────
 *
 * Ngày 2026-08-19 một tấm ảnh nghiệm thu bị rách ngang: nó báo đất trống 37,37% trong khi sự thật
 * là 41,61%. Nó lọt qua cả ba cổng đang có (md5 khác nhau · 0 điểm màu mốc · các lớp cộng đủ 100%)
 * vì tấm ấy hợp lệ về mọi mặt. Xem `soiVetRach` trong `city-preview.mjs` để biết vì sao lời giải
 * thích đầu tiên ("một dải đến từ khung hình cũ") đã bị chính số đo bác bỏ.
 *
 * Mọi con số dưới đây là số ĐO ĐƯỢC trên 120 ảnh mặt nạ thật, không phải số chọn tay.
 */

/** Dựng một ảnh thử: mỗi hàng gồm `tỉLệLục` phần lục, phần còn lại đỏ. Chữ ký hàng = [1−f, f, 0, 0]. */
function ảnhTheoHàng(width, height, tỉLệLục) {
  const pixels = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y += 1) {
    const sốLục = Math.round(width * tỉLệLục(y));
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (x < sốLục) pixels[i + 1] = 200; else pixels[i] = 200;
      pixels[i + 3] = 255;
    }
  }
  return { pixels, width, height };
}

test('ẢNH RÁCH — ĐỐI CHỨNG nhốt đúng ca đã cắn: chỗ đứt KHÔNG nằm ở mốc chia dải', () => {
  // 0,36 và nhịp nhiễu 0,0027 là hai con số đo được từ ảnh đối chứng thật (nửa dưới lấy từ kỷ khác).
  const RÁCH_TẠI = 441;
  const ảnh = ảnhTheoHàng(1100, 700, (y) => (y < RÁCH_TẠI ? 0.80 : 0.44) + (y % 2 ? 0.0027 : 0));
  const mốcDải = chiaBang({ width: 1100, height: 700 }).map((b) => b.y).filter((y) => y > 0);

  const kết = soiVetRach(ảnh, mốcDải);
  assert.equal(kết.hong, true, 'một vết rách 36% bề ngang PHẢI bị bắt');
  assert.deepEqual(kết.xau.map((m) => m.y), [RÁCH_TẠI], 'và phải chỉ đúng hàng bị rách, không kêu bừa');

  // ⚠️ ĐÂY LÀ PHẦN QUAN TRỌNG NHẤT CỦA BÀI NÀY. Chỗ rách thật nằm ở hàng 441, mốc chia dải là 476.
  // Nếu phép quét chỉ soi mốc dải (đúng như lời giải thích đầu tiên đề nghị) thì nó sẽ MÙ với
  // chính ca đã cắn. Bài test khoá cả hai vế: mốc dải KHÔNG phải 441, và phép quét vẫn bắt được.
  assert.ok(!mốcDải.includes(RÁCH_TẠI),
    'giả định của bài test đã hỏng: mốc chia dải nay trùng chỗ rách, phải chọn chỗ khác');
  assert.equal(kết.xau[0].trungMocDai, false, 'và phải NÓI RA rằng chỗ rách không trùng mốc dải nào');
});

test('ẢNH RÁCH — mức khắc nghiệt NHẤT từng đo trên ảnh lành vẫn phải được THA', () => {
  // Trên 120 ảnh mặt nạ thật (~83.000 mép hàng): mép lớn nhất 0,0582 · tỉ số lớn nhất 14,5×.
  // Ảnh thử này gộp CẢ HAI kỷ lục vào một tấm — khắc nghiệt hơn thực tế, vì ngoài đời chúng nằm ở
  // hai tấm khác nhau. Không có bài này thì ai đó siết ngưỡng cho "chắc ăn" và biến phép kiểm
  // thành một cỗ máy báo động giả, mà một cảnh báo kêu oan còn tệ hơn không có cảnh báo.
  const MÉP_LÀNH_LỚN_NHẤT = 0.0582;
  const NHIỄU = MÉP_LÀNH_LỚN_NHẤT / 14.5; // để tỉ số tại chỗ ấy ra đúng 14,5×
  const ảnh = ảnhTheoHàng(1100, 700, (y) => (
    0.30 + (y >= 330 ? MÉP_LÀNH_LỚN_NHẤT : 0) + (y % 2 ? NHIỄU : 0)
  ));
  const kết = soiVetRach(ảnh, []);
  assert.equal(kết.hong, false,
    `ảnh lành bị kêu oan tại ${JSON.stringify(kết.xau)} — ngưỡng đã bị siết quá tay`);
});

test('ẢNH RÁCH — HAI VẾ của ngưỡng, hỏi TỪNG vế một', () => {
  // ⚠️ Hỏi tổng thì một vế hỏng vẫn xanh nhờ vế kia (bẫy "cái phễu nằm trong thứ sinh ra để chống
  // phễu", Phase 10 Bước 2). Nên hai ca dưới đây tách hẳn: mỗi ca chỉ vi phạm MỘT vế.

  // (a) BƯỚC NHẢY TO nhưng KHÔNG nổi bật: cả tấm vốn đã lộn xộn ⇒ tỉ số chỉ 15×, dưới 30×.
  const ồnÀo = ảnhTheoHàng(1100, 700, (y) => 0.40 + (y % 2 ? 0.02 : 0) + (y >= 300 ? 0.30 : 0));
  assert.equal(soiVetRach(ồnÀo, []).hong, false,
    'một bước nhảy to trong một tấm vốn lộn xộn KHÔNG phải vết rách — bỏ vế TỈ SỐ thì ca này kêu oan');

  // (b) NỔI BẬT nhưng NHỎ: tấm phẳng lì nên trung vị = 0 ⇒ tỉ số vô cùng, mà bước nhảy chỉ 0,05.
  const phẳngLì = ảnhTheoHàng(1100, 700, (y) => (y < 350 ? 0.40 : 0.45));
  const b = soiVetRach(phẳngLì, []);
  assert.equal(b.trungVi, 0, 'giả định của ca (b) đã hỏng: tấm này phải phẳng lì');
  assert.equal(b.hong, false,
    'một chênh lệch 5% trong một tấm phẳng KHÔNG phải vết rách — bỏ vế SÀN thì ca này kêu oan');

  // Và hai ngưỡng phải giữ đúng khoảng cách với số đo thật, kẻo chúng trôi dần cho tiện.
  assert.ok(VET_RACH_SAN > 0.0582 && VET_RACH_SAN < 0.180,
    'sàn phải nằm giữa mép lành lớn nhất (0,0582) và ca rách nhẹ nhất đo được (0,180)');
  assert.ok(VET_RACH_HE_SO > 14.5 && VET_RACH_HE_SO < 66,
    'hệ số phải nằm giữa tỉ số lành lớn nhất (14,5×) và ca rách nhẹ nhất đo được (66×)');
});

test('ẢNH RÁCH — phép soi phải được GỌI trong shoot, và ảnh chỉ được ghi SAU khi soi', () => {
  // ⚠️ `/soiVetRach\(/` trên mã nguồn thì chính dòng ĐỊNH NGHĨA cũng là một match (bẫy đã cắn ba
  // lần liên tiếp ở Phase 7A) ⇒ lọc bỏ mọi dòng định nghĩa trước khi hỏi.
  const dòng = NGUỒN.split('\n');
  const gọi = dòng
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => /soiVetRach\s*\(/.test(d) && !/^\s*export function /.test(d));
  assert.ok(gọi.length >= 1, 'hàm dò vết rách được định nghĩa nhưng KHÔNG ai gọi — đúng loại lỗi'
    + ' mà lint/build không bao giờ bắt (bài học `summarizeMuseum`, Phase 4H)');

  const ghiẢnh = dòng.findIndex((d) => /writeFileSync\(pngPath/.test(d));
  assert.ok(ghiẢnh >= 0, 'không tìm thấy chỗ ghi ảnh — file đã đổi cấu trúc?');
  assert.ok(gọi.some(({ i }) => i < ghiẢnh),
    'phép soi phải chạy TRƯỚC khi ghi ảnh — soi sau thì tấm rách đã nằm trên đĩa rồi');
});

/**
 * ─── DẢI NHÃN CỦA BẢNG QUÉT ───────────────────────────────────────────────────────────────────
 *
 * Phép kiểm vết rách ở trên hiệu chuẩn hoàn toàn trên **ảnh một-cảnh** (120 tấm mặt nạ). Lần đầu
 * đem áp cho **bảng quét 15 kỷ** nó kêu oan đúng 30 chỗ — vì một tấm bảng dán ảnh thì CÓ mép sắc
 * lẹm, ở mọi dải nhãn. Đúng bài học `TECH_DEBT #38`: một ngưỡng đo trên MỘT quần thể đã được đem
 * áp cho CẢ TẬP mà không ai hỏi tập kia có cùng hình dạng không.
 */

/** Đúng 30 hàng mà bản quét 15 kỷ đã kêu oan ngày 2026-08-19 — chép từ log, không tính lại. */
const KÊU_OAN_THẬT = [
  30, 216, 238, 424, 446, 632, 654, 840, 862, 1048, 1070, 1256, 1278, 1464, 1486,
  1672, 1694, 1880, 1902, 2088, 2110, 2296, 2318, 2504, 2526, 2712, 2734, 2920, 2942, 3128,
];

test('DẢI NHÃN — công thức phải tái lập ĐÚNG 30 hàng đã kêu oan, không thừa không thiếu', () => {
  // ⚠️ Đây là chỗ phân biệt một BẢN VÁ với một cái CHĂN TRÙM. Nếu danh sách miễn trừ chỉ "bao gồm"
  // 30 hàng ấy thì nó có thể đang miễn trừ cả nghìn hàng khác và phép kiểm chết lặng. Đòi BẰNG
  // NHAU, và đòi công thức suy ra từ bố cục (`yHeader + row × (cellH + labelH)`), không phải chép
  // lại 30 con số vào mã sản phẩm.
  const tính = hangCauTrucBangQuet({ soKy: 15, cellH: Math.round(300 * 0.62) });
  assert.deepEqual([...tính].sort((a, b) => a - b), KÊU_OAN_THẬT);
});

test('DẢI NHÃN — miễn trừ phải NHỎ: không được biến thành cách tắt phép kiểm', () => {
  const cao = 15 * (Math.round(300 * 0.62) + 22) + 34;
  const tính = hangCauTrucBangQuet({ soKy: 15, cellH: Math.round(300 * 0.62) });
  assert.ok(tính.length / cao < 0.05,
    `miễn trừ ${tính.length}/${cao} hàng (${((tính.length / cao) * 100).toFixed(1)}%) — quá nhiều`);

  // Và nó phải còn bắt được vết rách ở chỗ KHÔNG phải dải nhãn. Không có vế này thì bản vá "miễn
  // trừ" có thể vô hiệu hoá phép kiểm trên bảng quét mà mọi bài trên vẫn xanh.
  const cellH = Math.round(300 * 0.62);
  const RÁCH = 300; // nằm giữa hai dải nhãn (238 và 424), không phải hàng cấu trúc nào
  assert.ok(!tính.includes(RÁCH), 'giả định hỏng: hàng thử nghiệm lại trùng một dải nhãn');
  const w = 200; const h = 15 * (cellH + 22) + 34;
  const pixels = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y += 1) {
    const sốLục = Math.round(w * ((y < RÁCH ? 0.80 : 0.44) + (y % 2 ? 0.0027 : 0)));
    for (let x = 0; x < w; x += 1) {
      const i = (y * w + x) * 4;
      if (x < sốLục) pixels[i + 1] = 200; else pixels[i] = 200;
      pixels[i + 3] = 255;
    }
  }
  const kết = soiVetRach({ pixels, width: w, height: h }, [], tính);
  assert.equal(kết.hong, true, 'vết rách ngoài dải nhãn KHÔNG được miễn trừ theo');
  assert.deepEqual(kết.xau.map((m) => m.y), [RÁCH]);
});

test('DẢI NHÃN — bản quét phải THẬT SỰ truyền danh sách miễn trừ vào, không để mặc định rỗng', () => {
  // Nếu chỗ gọi quên truyền thì bản quét sẽ chết mỗi lần chạy — một hỏng hóc rất ồn, nhưng nó chỉ
  // lộ ra sau 6 phút dựng ảnh. Bắt ở đây rẻ hơn nhiều.
  const dòng = NGUỒN.split('\n');
  const gọi = dòng.filter((d) => /hangCauTrucBangQuet\s*\(/.test(d) && !/^\s*export function /.test(d));
  assert.ok(gọi.some((d) => /hangCauTruc:/.test(d)),
    'không thấy chỗ nào truyền `hangCauTruc:` bằng `hangCauTrucBangQuet(...)` — bản quét sẽ đỏ oan');
});

/**
 * ─── NHẬT KÝ CỔNG CHỐNG-RÁCH ──────────────────────────────────────────────────────────────────
 *
 * `TECH_DEBT #52` nói rõ: nguyên nhân gốc CHƯA biết, và lời giải thích đầu tiên đã bị số đo bác
 * bỏ. Đàm chốt cách xử lý: đừng dừng lại truy ngay, nhưng cũng đừng để nó thành nợ vĩnh viễn —
 * ghi lại mỗi lần kích hoạt để sau này truy bằng cách ĐỌC BẢNG, và đặt một điều kiện xem lại
 * TƯỜNG MINH ("quá 5 lần thì dừng lại truy") do chính công cụ tự đếm và tự nhắc.
 */

test('NHẬT KÝ — dòng ghi phải mang ĐỦ thứ cần để truy sau này, nhất là cột trùng-mốc-dải', () => {
  const d = dongNhatKyVetRach({
    khi: '2026-08-19T09:00:00.000Z',
    anh: 'city-era09-light-h12.png',
    rong: 1100,
    cao: 700,
    soDai: 2,
    luot: 1,
    soLuot: 3,
    xau: [
      { y: 441, buoc: 0.180, tiSo: 66, trungMocDai: false },
      { y: 476, buoc: 0.361, tiSo: 132, trungMocDai: true },
    ],
  });
  const cot = d.split('\t');

  // ⚠️ HỎI TỪNG CỘT MỘT, không hỏi "chuỗi có chứa mấy chữ này". Một dòng nhật ký thiếu đúng một
  // cột trông y hệt một dòng đầy đủ, và cột thiếu ấy chính là cột ta sẽ cần.
  assert.equal(cot[0], '2026-08-19T09:00:00.000Z', 'thiếu thời điểm — không xếp được theo thứ tự');
  assert.equal(cot[1], 'city-era09-light-h12.png', 'thiếu tên ảnh — không biết kỷ nào, chặng nào');
  assert.equal(cot[2], '1100x700', 'thiếu kích thước — không đối chiếu được với ngân sách dải');
  assert.equal(cot[3], 'dai=2', 'thiếu số dải — đây là biến nghi can số một');
  assert.equal(cot[4], 'luot=1/3', 'thiếu số lượt — không biết chụp lại có cứu được không');
  assert.equal(cot[5], 'soVet=2');
  // Cột QUAN TRỌNG NHẤT: chính nó đã bác bỏ giả thuyết "một dải đến từ khung hình cũ".
  assert.equal(cot[6], 'trungMocDai=1/2',
    'thiếu cột trùng-mốc-dải — đây là cột duy nhất phân biệt được hai giả thuyết về nguyên nhân');
  assert.equal(cot[7], 'buocMax=0.3610');
  assert.equal(cot[8], 'tiSoMax=132.0');
  assert.equal(cot[9], 'hang=441,476', 'thiếu vị trí các vết — không tìm lại được chỗ rách');
  assert.equal(cot.length, 10, 'số cột đổi — sửa cả phần đọc bảng, đừng để hai bên lệch nhau');
});

test('NHẬT KÝ — phải ghi TRƯỚC khi ném lỗi, nếu không lượt cuối cùng mất dấu', () => {
  // ⚠️ CÁI BẪY ĐÃ CẮN LẦN THỨ NĂM, và lần này nó cắn bài test tôi vừa viết ra: dòng ĐỊNH NGHĨA
  // `export function dongNhatKyVetRach({` tự nó khớp `/dongNhatKyVetRach\(\{/`, mà định nghĩa nằm
  // TRƯỚC `shoot` trong file ⇒ `findIndex` trỏ vào định nghĩa và mọi so sánh thứ tự sau đó đều nói
  // về một chỗ khác. Lọc bỏ dòng định nghĩa, đúng như bài `soiVetRach` ở trên đã phải làm.
  const dòng = NGUỒN.split('\n');
  const ghiNhậtKý = dòng.findIndex(
    (d) => /dongNhatKyVetRach\(\{/.test(d) && !/^\s*export function /.test(d));
  assert.ok(ghiNhậtKý >= 0, 'không ai GỌI hàm dựng dòng nhật ký — đúng loại lỗi lint/build bỏ qua');

  const némLỗi = dòng.findIndex((d) => /ảnh vẫn RÁCH NGANG sau/.test(d));
  assert.ok(némLỗi >= 0, 'không tìm thấy chỗ ném lỗi — file đã đổi cấu trúc?');
  assert.ok(ghiNhậtKý < némLỗi,
    'ghi nhật ký nằm SAU chỗ ném lỗi ⇒ lượt cuối cùng — lượt thất bại hẳn, lượt đáng ghi nhất —'
    + ' sẽ không để lại dòng nào');

  // Và nó phải nằm TRONG nhánh "đã hỏng", không phải chạy mọi lượt: mốc là dòng `if (!soi.hong)`.
  const sauKhiSoi = dòng.findIndex((d) => /if \(!soi\.hong\) break;/.test(d));
  assert.ok(sauKhiSoi >= 0 && sauKhiSoi < ghiNhậtKý,
    'ghi nhật ký phải nằm sau `if (!soi.hong) break` — ghi cả lượt LÀNH thì bảng đầy rác'
    + ' và điều kiện xem lại 5 lần sẽ nổ ngay lần chạy đầu tiên');
});

test('NHẬT KÝ — điều kiện xem lại phải ĐẾM ĐƯỢC và tự nhắc, không chỉ nằm trong tài liệu', () => {
  // Một `Review Trigger` viết trong TECH_DEBT.md chỉ được đọc khi có người đi tìm. Một con số
  // trong mã thì tự đòi được đọc — cùng bài học "một con số trong bài test là cái hẹn giờ duy
  // nhất chạy được" (Phase 10 Bước 1).
  assert.equal(NGUONG_TRUY_VET_RACH, 5, 'ngưỡng Đàm chốt là 5 lần');
  assert.ok(/soLanDaGhi >= NGUONG_TRUY_VET_RACH/.test(NGUỒN),
    'ngưỡng được khai nhưng KHÔNG ai so với nó — một hằng số không được đọc thì bằng không có');
  assert.ok(/TECH_DEBT #52/.test(NGUỒN),
    'lời nhắc phải trỏ đích danh mục nợ, nếu không người đọc log không biết đi đâu tiếp');
});
