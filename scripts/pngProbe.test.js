/**
 * pngProbe.test.js — khoá phép GHI PNG và phép GHÉP DẢI.
 *
 * ⚠️ VÌ SAO PHẢI CÓ: từ 2026-08-19 `city-preview.mjs` chụp ảnh thành nhiều DẢI NGANG rồi ghép lại
 * (ổ cắm CDP có trần cứng 4 MiB một tin nhắn — đo được: 4.194.264 byte base64 thì chạy, hơn nữa là
 * đứt ổ cắm). Nghĩa là MỌI ảnh nghiệm thu của dự án nay đi qua phép ghi ở đây. Một lỗi lệch một
 * hàng trong phép ghép sẽ không làm gì đỏ lên — ảnh vẫn mở được, vẫn "trông như thành phố", chỉ là
 * mọi con số đo từ nó đều sai.
 *
 * Bài quan trọng nhất là bài SO HAI ĐƯỜNG: cùng một ảnh, chụp một dải và chụp ba dải, phải ra
 * BYTE GIỐNG HỆT. Nó chạy CẢ HAI bên rồi so với nhau, không so bên nào với một hằng số thứ ba.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { decodePng, encodePng, ghepDoc } from './png-probe.mjs';

/** Ảnh mẫu: dải chuyển màu mượt (chỗ lọc Paeth ăn tiền) + một mảng nhiễu (chỗ nó bó tay). */
function anhMau(width, height, alpha = 255) {
  const pixels = Buffer.alloc(width * height * 4);
  let h = 12345;
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      h = (h * 1103515245 + 12345) & 0x7fffffff;
      const nhieu = x > width / 2 ? (h >> 8) & 63 : 0;
      pixels[i] = (x * 3 + nhieu) & 255;
      pixels[i + 1] = (y * 5 + nhieu) & 255;
      pixels[i + 2] = ((x + y) * 2 + nhieu) & 255;
      pixels[i + 3] = alpha;
    }
  }
  return { width, height, pixels };
}

test('ghi rồi đọc lại ra ĐÚNG từng byte điểm ảnh', () => {
  const goc = anhMau(53, 37);
  const doc = decodePng(encodePng(goc));
  assert.equal(doc.width, 53);
  assert.equal(doc.height, 37);
  assert.deepEqual(Buffer.from(doc.pixels), goc.pixels);
});

test('ảnh đục hoàn toàn ghi 3 kênh; chỉ cần MỘT điểm trong suốt là phải chuyển sang 4 kênh', () => {
  const duc = anhMau(9, 7);
  assert.equal(decodeColorType(encodePng(duc)), 2, 'ảnh đục phải là RGB — giữ alpha 255 là phình file vô ích');

  // Đối chứng: đổi ĐÚNG MỘT byte alpha. Nếu phép chọn kênh đọc nhầm (vd chỉ xem điểm đầu tiên)
  // thì bài này XANH OAN mà ảnh mất kênh trong suốt.
  const co = anhMau(9, 7);
  co.pixels[(3 * 9 + 4) * 4 + 3] = 254;
  const bytes = encodePng(co);
  assert.equal(decodeColorType(bytes), 6, 'có điểm trong suốt thì phải là RGBA');
  assert.deepEqual(Buffer.from(decodePng(bytes).pixels), co.pixels, 'và alpha phải sống sót nguyên vẹn');
});

function decodeColorType(png) {
  // IHDR bắt đầu ở byte 8: 4 độ dài + 4 kiểu + (w4, h4, depth1, colorType1…)
  return png[8 + 8 + 9];
}

test('CHỤP MỘT DẢI và CHỤP BA DẢI phải ra ảnh BYTE GIỐNG HỆT', () => {
  const goc = anhMau(64, 30);
  const motDai = encodePng(goc);

  // ⚠️ BA DẢI CỐ Ý KHÔNG DẢI NÀO BẰNG DẢI NÀO (7 · 18 · 5). Bản đầu chia 13 · 13 · 4 — nghe hợp
  // lý hơn vì đó đúng hình dạng thật của phép chia bảng (các dải bằng nhau, dải cuối cụt) — nhưng
  // hai dải đầu BẰNG NHAU thì một lỗi "dồn theo bước cố định" cho ra ĐÚNG cùng kết quả, nên phép
  // thử ngược không nổ. Dải cuối cụt vẫn được giữ, chỉ thêm điều kiện các dải đầu khác nhau.
  const cat = (y, h) => ({
    width: goc.width,
    height: h,
    pixels: goc.pixels.subarray(y * goc.width * 4, (y + h) * goc.width * 4),
  });
  const baDai = encodePng(ghepDoc([cat(0, 7), cat(7, 18), cat(25, 5)]));
  assert.deepEqual(baDai, motDai);

  // Đối chứng: bỏ đúng MỘT hàng ở giữa. Nếu phép so trên chỉ nhìn cỡ ảnh thì bài này xanh oan.
  const thieuMotHang = encodePng(ghepDoc([cat(0, 7), cat(7, 17), cat(25, 5)]));
  assert.notDeepEqual(thieuMotHang, motDai);
});

test('ghép dải lệch bề ngang phải NÓI RA, không được ghép bừa', () => {
  const a = anhMau(10, 4);
  const b = anhMau(11, 4);
  assert.throws(() => ghepDoc([a, b]), /rộng 11.*khác dải đầu \(10\)/s);
  assert.throws(() => ghepDoc([]), /không có dải nào/);
});

test('số byte điểm ảnh không khớp cỡ thì từ chối ghi', () => {
  assert.throws(() => encodePng({ width: 4, height: 4, pixels: Buffer.alloc(4 * 3 * 4) }), /không khớp cỡ/);
  assert.throws(() => encodePng({ width: 4.5, height: 4, pixels: Buffer.alloc(80) }), /số nguyên dương/);
});
