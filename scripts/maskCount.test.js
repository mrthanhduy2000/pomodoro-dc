/**
 * Khoá phép chia DẢI NGANG của `mask-count.mjs` — nền của phép đo (M2) "dấu vết con người trải
 * tới mấy tầng chiều sâu".
 *
 * ⚠️ VÌ SAO PHẢI LÀ MỘT BÀI TEST CHỨ KHÔNG PHẢI `--selftest`. `mask-count.mjs` đã có `--selftest`
 * từ lâu, và nó chưa bao giờ nằm trong `npm test` — tức nó chỉ chạy khi có người NHỚ gõ. Dự án đã
 * trả giá đúng chỗ này ba lần với bẫy dấu nháy ngược trong `city-preview.mjs`: lưới an toàn còn
 * nguyên vẹn, chỉ là không ai chạy nó đúng lúc. "Một bài học được ghi ra KHÔNG chặn được gì; chỉ
 * một bài TEST mới chặn được."
 *
 * ⚠️ RANH GIỚI CỦA BÀI NÀY: nó khoá SỐ HỌC của phép chia dải (phủ kín khung · không đếm hai lần ·
 * một điểm ảnh ở hàng đã biết rơi đúng dải đã biết). Nó KHÔNG chứng minh "dải trên màn hình tương
 * ứng chiều sâu thế giới" — đại lượng ấy chỉ đo được trên ảnh render thật, và số đo hiện hành nằm
 * ở `PERFORMANCE.md` mục (M2). Ghi rõ ranh giới ra đây vì một bài test xanh rất dễ bị đọc thành
 * "cả phép đo đã được bảo chứng" (bài học `--selftest` Phase 4C/4G: một phép tự kiểm chứng minh
 * bộ lọc CÓ tác dụng, không chứng minh nó có tác dụng ĐÚNG).
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { countChannels, countBands } from './mask-count.mjs';

/** Ảnh W×H đen tuyền, alpha đủ; `cham` là danh sách [hàng, cột] tô đỏ. */
function anh(W, H, cham = []) {
  const px = new Uint8Array(W * H * 4);
  for (let i = 0; i < W * H; i += 1) px[i * 4 + 3] = 255;
  for (const [y, x] of cham) px[(y * W + x) * 4] = 255;
  return px;
}

test('điểm ảnh ở hàng đã biết rơi vào ĐÚNG dải đã biết', () => {
  // 6 hàng chia 6 dải ⇒ hàng k rơi vào dải k. Thử CẢ SÁU, không thử mỗi một hàng: một phép chia
  // lệch nửa dải vẫn có thể đúng ở một hàng nào đó rồi sai ở các hàng còn lại.
  for (let hang = 0; hang < 6; hang += 1) {
    const bs = countBands(anh(2, 6, [[hang, 0]]), 2, 6, 6);
    const dai = bs.map((b) => b.do);
    const mong = [0, 0, 0, 0, 0, 0]; mong[hang] = 1;
    assert.deepEqual(dai, mong, `hàng ${hang} rơi nhầm dải: ${JSON.stringify(dai)}`);
  }
});

test('các dải PHỦ KÍN khung, kể cả khi số dải không chia hết chiều cao', () => {
  // ⚠️ 6 hàng / 4 dải là ca đã bắt được lỗi thật: một phép chia dùng chiều cao dải CỐ ĐỊNH
  // (`floor(H/N)`) bỏ rơi hai hàng cuối mà không có gì đỏ lên.
  for (const [H, N] of [[6, 6], [6, 4], [700, 6], [700, 7], [13, 5], [1, 1]]) {
    const px = anh(3, H);
    const bs = countBands(px, 3, H, N);
    assert.equal(bs.length, N, `sai số dải ở ${H} hàng / ${N} dải`);
    const tongDai = bs.reduce((s, b) => s + b.tong, 0);
    assert.equal(tongDai, countChannels(px).tong, `${H} hàng / ${N} dải: các dải không phủ kín khung`);
  }
});

test('mỗi hàng chỉ thuộc ĐÚNG MỘT dải — không hàng nào bị đếm hai lần', () => {
  // Tô đỏ TOÀN BỘ ảnh rồi đòi tổng số điểm đỏ của các dải bằng đúng số điểm ảnh. Trùng lặp sẽ
  // làm tổng vượt lên; bỏ sót sẽ làm tổng hụt xuống. Một phép kiểm bắt được CẢ HAI chiều.
  const W = 4, H = 700;
  const cham = []; for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) cham.push([y, x]);
  const bs = countBands(anh(W, H, cham), W, H, 6);
  assert.equal(bs.reduce((s, b) => s + b.do, 0), W * H);
});

test('màu mốc ngoài khung bị loại khỏi mẫu số của TỪNG dải, không chỉ của cả khung', () => {
  // Mẫu số là chỗ đã sai hai lần (xem chú thích `NGOAI_KHUNG`). Chia dải tạo thêm 6 mẫu số mới,
  // nên phải hỏi lại đúng câu ấy một lần nữa cho từng dải.
  const W = 2, H = 6;
  const px = anh(W, H, [[0, 0]]);
  for (let y = 0; y < H; y += 1) { const i = (y * W + 1) * 4; px[i] = 1; px[i + 1] = 2; px[i + 2] = 3; }
  const bs = countBands(px, W, H, 6);
  for (const b of bs) assert.equal(b.tong, 1, 'điểm mốc ngoài khung vẫn nằm trong mẫu số của dải');
  assert.equal(bs[0].do, 1);
});

test('số dải không hợp lệ thì TỪ CHỐI THẲNG, không tự chữa', () => {
  // Tự chữa (kẹp về 1, làm tròn…) là cách một tham số sai đi thẳng vào bảng số mà không ai biết.
  for (const n of [0, -1, 1.5, NaN, undefined, '6']) {
    assert.throws(() => countBands(anh(2, 6), 2, 6, n), /số dải/, `chấp nhận oan số dải ${String(n)}`);
  }
});
