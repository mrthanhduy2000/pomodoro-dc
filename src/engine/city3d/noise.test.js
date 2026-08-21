/**
 * noise.test.js — KHOÁ BỘ NHỚ ĐỆM NÚT LƯỚI (ADR-048).
 *
 * Bộ nhớ đệm ở `noise.js` có đúng một lời hứa và nó là lời hứa NẶNG NHẤT trong dự án này: **nhớ lại
 * mà KHÔNG đổi một con số nào**. Trường cao độ quyết định hình dạng của cả 15 vùng đất, nên một sai
 * lệch ở đây không "hơi khác một chút" — nó đổi vĩnh viễn thứ Đàm nhìn thấy, và đổi trong im lặng.
 *
 * ⚠️ VÌ SAO CÁC BÀI DƯỚI ĐÂY SO VỚI CÔNG THỨC THÔ CHỨ KHÔNG SO VỚI MỘT BẢNG SỐ VIẾT CỨNG. Luật của
 * dự án là *"muốn khoá 'hai bên bằng nhau' thì phải chạy CẢ HAI rồi so, không được so mỗi bên với
 * một con số thứ ba"* (Phase 8B). Ở đây hai bên là: đường ĐI QUA bộ nhớ đệm (`valueNoise`) và đường
 * KHÔNG qua nó (công thức thô dựng lại trong bài test, dùng CHÍNH `hashId` mà sản phẩm dùng). Bảng
 * số viết cứng sẽ chỉ khoá được công thức, không khoá được sự KHỚP NHAU của hai đường.
 *
 * ⚠️ VÀ VÌ SAO HỎI Ở TOẠ ĐỘ NGUYÊN. Tại `gx` nguyên thì `smoothstep(0) = 0`, mà `lerp(a, b, 0)` là
 * `a + (b − a) × 0 = a` — ĐÚNG BẰNG `a` trong IEEE754, không phải xấp xỉ. Nên `valueNoise(s, ix, iy)`
 * tại toạ độ nguyên chính là `latticeValue(s, ix, iy)`, tức bài test chạm thẳng được vào hàm đang
 * cần canh mà không phải xuất nó ra. Chính hàng trăm phép so `===` bên dưới là bằng chứng cho câu
 * vừa nói: nếu phép đồng nhất ấy không đúng thì chúng đỏ ngay.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { valueNoise, thongKeNho, BIEN_NHO, TRAN_NUT } from './noise.js';
import { hashId } from '../hashId.js';

/** Công thức THÔ, không qua bộ nhớ đệm — bản sao có chủ đích, đóng vai người làm chứng. */
function tho(seed, ix, iy) {
  return (hashId(`t|${seed}|${ix}|${iy}`) % 4096) / 4095;
}

/** `valueNoise` dựng lại HOÀN TOÀN từ công thức thô — người làm chứng cho đường đi qua bộ nhớ đệm. */
function thoNoiSuy(seed, gx, gy) {
  const ss = (t) => t * t * (3 - 2 * t);
  const lp = (a, b, t) => a + (b - a) * t;
  const x0 = Math.floor(gx); const y0 = Math.floor(gy);
  const sx = ss(gx - x0); const sy = ss(gy - y0);
  const tren = lp(tho(seed, x0, y0), tho(seed, x0 + 1, y0), sx);
  const duoi = lp(tho(seed, x0, y0 + 1), tho(seed, x0 + 1, y0 + 1), sx);
  return lp(tren, duoi, sy);
}

/** Tập nút lưới mà `valueNoise` chạm tới khi hỏi ở đúng các toạ độ nguyên trong `oLuoi`. */
function nutBiCham(oLuoi) {
  const bo = new Set();
  for (const [ix, iy] of oLuoi) {
    bo.add(`${ix}|${iy}`);
    bo.add(`${ix + 1}|${iy}`);
    bo.add(`${ix}|${iy + 1}`);
    bo.add(`${ix + 1}|${iy + 1}`);
  }
  return bo;
}

test('nhớ lại KHÔNG đổi một con số nào — lượt đầu (chưa nhớ) và lượt sau (đã nhớ) đều bằng công thức thô', () => {
  const seed = 'noise-test|bitidentity';
  let soLan = 0;
  for (let ix = -30; ix <= 30; ix += 1) {
    for (let iy = -30; iy <= 30; iy += 3) {
      const mong = tho(seed, ix, iy);
      const lan1 = valueNoise(seed, ix, iy);          // trượt bộ nhớ ⇒ đi đường tính
      const lan2 = valueNoise(seed, ix, iy);          // trúng bộ nhớ ⇒ đi đường nhớ lại
      assert.ok(Object.is(lan1, mong), `lượt đầu lệch tại (${ix}, ${iy}): ${lan1} ≠ ${mong}`);
      assert.ok(Object.is(lan2, mong), `lượt sau lệch tại (${ix}, ${iy}): ${lan2} ≠ ${mong}`);
      soLan += 1;
    }
  }
  assert.ok(soLan > 600, `GÁC CHẠY-RỖNG: chỉ so được ${soLan} nút, vòng lặp không chạy như ý`);
});

test('giữa hai nút lưới cũng không đổi — nội suy vẫn ra y hệt khi bộ nhớ đã nóng', () => {
  const seed = 'noise-test|noisuy';
  const mau = [];
  for (let i = 0; i < 200; i += 1) {
    const gx = -12 + i * 0.137;
    const gy = 9 - i * 0.211;
    mau.push([gx, gy, valueNoise(seed, gx, gy)]);     // lượt này phần lớn là trượt
  }
  for (const [gx, gy, truoc] of mau) {
    assert.ok(Object.is(valueNoise(seed, gx, gy), truoc), `nội suy lệch tại (${gx}, ${gy})`);
  }
  // Và kết quả nội suy phải khớp với phép nội suy dựng lại từ CÔNG THỨC THÔ — tức bộ nhớ đệm không
  // hề chen vào giữa bốn góc và phép trộn, nó chỉ thay chỗ lấy bốn góc ấy ra.
  for (const [gx, gy, co] of mau) {
    assert.ok(Object.is(co, thoNoiSuy(seed, gx, gy)), `nội suy không khớp công thức thô tại (${gx}, ${gy})`);
  }
});

test('ĐỐI CHỨNG — bộ nhớ đệm THẬT SỰ ghi, đúng số nút đã chạm, không nút nào đụng khoá', () => {
  // ⚠️ GÁC THỨ TỰ: bài "chạm trần" ở cuối file làm bộ nhớ thôi ghi, nên nếu nó chạy trước thì con số
  // dưới đây sẽ ra 0 và người đọc sẽ tưởng bộ nhớ đệm hỏng. Bắt nó nói ra thành một câu rõ ràng.
  assert.ok(!thongKeNho().day, 'bài này PHẢI chạy trước bài "chạm trần" — xem thứ tự trong file');

  const seed = 'noise-test|doichung';
  const oLuoi = [];
  for (let ix = 0; ix < 9; ix += 1) for (let iy = 0; iy < 9; iy += 1) oLuoi.push([ix, iy]);
  const mong = nutBiCham(oLuoi).size;                 // 10 × 10 = 100 nút cho lưới ô 9 × 9

  const truoc = thongKeNho();
  for (const [ix, iy] of oLuoi) valueNoise(seed, ix, iy);
  for (const [ix, iy] of oLuoi) valueNoise(seed, ix, iy);   // lượt hai KHÔNG được ghi thêm gì
  const sau = thongKeNho();

  assert.equal(sau.nut - truoc.nut, mong, `phải ghi đúng ${mong} nút, ghi ${sau.nut - truoc.nut}`);
  assert.equal(sau.hat - truoc.hat, 1, 'một hạt giống mới ⇒ đúng một bảng mới');
});

test('song ánh khoá — nút ở HAI GÓC ĐỐI của biên không được nhận nhầm giá trị của nhau', () => {
  // ⚠️ ĐÂY LÀ BÀI CANH QUAN HỆ `HANG = BO × 2`. Nếu ai đó hạ `HANG` xuống còn `BO` thì khoá
  // `(ix + BO) × HANG + (iy + BO)` sẽ ĐỤNG NHAU ở đúng cặp dưới đây: (−BO, 0) và (−BO + 1, −BO)
  // cùng ra khoá `BO`. Cặp ấy nằm ở hai góc đối của miền, tức không có phép "so hai ô kề nhau" nào
  // bắt được — đúng bài học `sweep-score` (lỗi nặng nhất luôn nằm ở HAI ĐẦU bảng).
  const seed = 'noise-test|songanh';
  const cap = [
    [-BIEN_NHO, 0], [-BIEN_NHO + 1, -BIEN_NHO],
    [BIEN_NHO - 1, BIEN_NHO - 1], [-BIEN_NHO, BIEN_NHO - 1], [BIEN_NHO - 1, -BIEN_NHO],
    [0, 0], [0, -1], [-1, 0], [-1, -1],
  ];
  const thay = new Map();
  for (const [ix, iy] of cap) {
    const v = valueNoise(seed, ix, iy);
    assert.ok(Object.is(v, tho(seed, ix, iy)), `giá trị sai tại (${ix}, ${iy})`);
    thay.set(`${ix}|${iy}`, v);
  }
  // Hỏi lại lần hai, lúc này CHẮC CHẮN đi đường nhớ lại: không nút nào được trả về giá trị của nút khác.
  for (const [ix, iy] of cap) {
    assert.ok(Object.is(valueNoise(seed, ix, iy), thay.get(`${ix}|${iy}`)), `đụng khoá tại (${ix}, ${iy})`);
  }
});

test('ngoài biên thì ĐÚNG nhưng KHÔNG nhớ — cái gác này là cổng nhanh-chậm, không phải cổng đúng-sai', () => {
  const seed = 'noise-test|ngoaibien';
  // ⚠️ MỌI GÓC phải nằm ngoài biên. `valueNoise` chạm BỐN nút (x0, x0+1) × (y0, y0+1), nên ở phía
  // âm phải lùi tới `−BO − 2` mới chắc: hỏi tại `−BO − 1` thì góc `x0 + 1` rơi đúng vào `−BO`, tức
  // VẪN trong biên. (Bài ngay dưới đây khoá chính hành vi ấy — nó ĐÚNG, đừng đi "sửa".)
  const ngoai = [
    [BIEN_NHO, 0], [0, BIEN_NHO], [-BIEN_NHO - 2, 0], [0, -BIEN_NHO - 2],
    [BIEN_NHO + 5000, BIEN_NHO + 5000], [-BIEN_NHO - 5000, -BIEN_NHO - 5000],
  ];
  const truoc = thongKeNho();
  for (const [ix, iy] of ngoai) {
    assert.ok(Object.is(valueNoise(seed, ix, iy), thoNoiSuy(seed, ix, iy)), `giá trị ngoài biên sai tại (${ix}, ${iy})`);
  }
  const sau = thongKeNho();
  assert.equal(sau.nut, truoc.nut, 'nút ngoài biên KHÔNG được ghi vào bộ nhớ đệm');
  assert.equal(sau.hat, truoc.hat, 'nút ngoài biên KHÔNG được tạo bảng cho hạt giống mới');

  // ⚠️ ĐỐI CHỨNG cho chính bài này: nếu `BIEN_NHO` không hề được dùng để lọc thì đoạn trên vẫn xanh
  // (giá trị luôn đúng ở cả hai nhánh). Thứ phân biệt được hai thế giới là một nút NGAY BÊN TRONG
  // biên — nó BẮT BUỘC phải làm bộ nhớ lớn thêm.
  const trong = thongKeNho();
  valueNoise(seed, BIEN_NHO - 1, BIEN_NHO - 1);
  assert.ok(thongKeNho().nut > trong.nut, 'nút ngay bên trong biên phải được ghi — cái lọc đang chặn nhầm');
});

test('mẫu nằm ngay SÁT ngoài biên vẫn nhớ đúng những góc còn nằm TRONG biên', () => {
  // Đây không phải một khe hở: bốn góc của một ô lưới là bốn nút ĐỘC LẬP, nút nào trong biên thì
  // nút ấy được nhớ, hoàn toàn đúng. Viết thành bài test để phiên sau khỏi đọc nhầm thành lỗi rồi
  // đi "vá" bằng cách loại cả ô — làm thế là bỏ nhớ oan một vùng hợp lệ.
  const seed = 'noise-test|satbien';
  const truoc = thongKeNho();
  valueNoise(seed, -BIEN_NHO - 1, 0);         // góc (−BO, 0) và (−BO, 1) nằm trong biên
  const sau = thongKeNho();
  assert.equal(sau.nut - truoc.nut, 2, `phải nhớ đúng 2 góc trong biên, nhớ ${sau.nut - truoc.nut}`);
});

test('toạ độ NaN / vô hạn: kết quả y như trước khi có bộ nhớ đệm, và không làm bẩn bộ nhớ', () => {
  // ⚠️ `valueNoise(seed, NaN, 0)` trả về **NaN**, và nó đã như vậy TỪ TRƯỚC bản vá này: `hashId`
  // không bao giờ ra NaN, nhưng `smoothstep(NaN)` thì có, và `lerp(a, b, NaN)` kéo NaN ra kết quả.
  // Bài test đầu tiên tôi viết ở đây đòi "phải ra số hữu hạn" và ĐỎ — hỏng ở phép đo, không ở mã.
  // Điều đáng khoá là bộ nhớ đệm KHÔNG đổi hành vi ấy và KHÔNG nhận `NaN` làm khoá.
  const seed = 'noise-test|nan';
  const truoc = thongKeNho();
  for (const [gx, gy] of [[NaN, 0], [0, NaN], [Infinity, 0], [-Infinity, 3], [NaN, NaN]]) {
    const v = valueNoise(seed, gx, gy);
    assert.ok(Number.isNaN(v), `(${gx}, ${gy}) ra ${v} — trước bản vá nó là NaN`);
  }
  const sau = thongKeNho();
  assert.equal(sau.nut, truoc.nut, 'toạ độ NaN/vô hạn không được ghi gì vào bộ nhớ đệm');
  assert.equal(sau.hat, truoc.hat, 'toạ độ NaN/vô hạn không được tạo bảng hạt giống mới');
});

/**
 * ⚠️ BÀI NÀY PHẢI ĐỨNG CUỐI FILE. Nó đổ đầy bộ nhớ đệm tới trần, và sau đó không lời gọi nào ghi
 * thêm được nữa — nên mọi bài đo "bộ nhớ có lớn lên không" chạy sau nó sẽ ra 0. Bài đối chứng ở
 * trên có một câu `assert` nói thẳng điều đó, để nếu thứ tự đổi thì nó đỏ kèm lý do chứ không im.
 */
test('chạm trần thì THÔI GHI nhưng vẫn trả đúng giá trị — hỏng tốc độ, không bao giờ hỏng kết quả', () => {
  const seed = 'noise-test|tran';
  const conCho = TRAN_NUT - thongKeNho().nut;
  assert.ok(conCho > 0, 'bộ nhớ đã đầy trước khi bài này chạy — thứ tự bài test đã đổi');

  // Đổ cho vượt trần. Mỗi ô lưới chạm 4 nút, nhưng các ô kề nhau dùng chung nút nên số nút mới xấp
  // xỉ số ô — cứ đi cho tới khi `thongKeNho().day` bật lên, có chặn số vòng để không treo.
  let ix = 0; let iy = 0; let vong = 0;
  while (!thongKeNho().day && vong < TRAN_NUT * 2) {
    valueNoise(seed, ix, iy);
    ix += 1; if (ix > 1200) { ix = 0; iy += 1; }
    vong += 1;
  }
  const dat = thongKeNho();
  assert.ok(dat.day, `không chạm được trần sau ${vong} lời gọi`);
  assert.ok(dat.nut <= TRAN_NUT, `vượt trần: ${dat.nut} > ${TRAN_NUT}`);

  // Quá trần rồi thì bộ nhớ đứng yên, mà giá trị vẫn phải đúng từng con số.
  const dung = thongKeNho().nut;
  for (let k = 0; k < 50; k += 1) {
    const gx = 9000 + k; const gy = -9000 - k;   // chắc chắn chưa ai hỏi, mà vẫn trong biên
    assert.ok(Object.is(valueNoise(seed, gx, gy), tho(seed, gx, gy)), `giá trị sai sau khi chạm trần tại (${gx}, ${gy})`);
  }
  assert.equal(thongKeNho().nut, dung, 'chạm trần rồi mà bộ nhớ vẫn lớn thêm');
});
