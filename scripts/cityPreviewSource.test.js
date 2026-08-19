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
