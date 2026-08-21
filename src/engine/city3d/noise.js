/**
 * noise.js — TRƯỜNG NHIỄU DÙNG CHUNG cho mọi tầng địa hình.
 *
 * ⚠️ VÌ SAO NÓ TÁCH RA THÀNH MỘT FILE RIÊNG (2026-08-19, VIỆC 2 Bước B). Hàm này sinh ra trong
 * `terrain.js` ở Phase 7B, rồi Phase 9A cho `horizon.js` dùng chung, rồi ADR-038 cho `outskirts.js`
 * dùng chung — với đúng một lý do lặp lại ba lần trong chú thích của chính nó: *"hai bản nhiễu
 * tương đương trên giấy thì mặt đất gần và mặt đất xa sẽ có hai kiểu gợn khác nhau, và chỗ giáp
 * giữa chúng sẽ lộ ra một đường"*. Nó chưa bao giờ là một hàm của `terrain`; nó là một PHÉP DÙNG
 * CHUNG mà `terrain` tình cờ là người viết ra đầu tiên.
 *
 * ⚠️ Và Bước B biến chuyện ở nhờ ấy thành một VÒNG IMPORT thật: `setting.js` (dấu chân mặt nước)
 * cần nhiễu để làm mép bờ lượn, mà `terrain.js` thì phải hỏi `setting.js` xem chỗ nào là nước để
 * hạ mặt đất xuống. `setting → terrain → setting`. ES module chịu được vòng ấy, nhưng nó là loại
 * hỏng chỉ lộ ra khi thứ tự nạp đổi — tức lộ ra ở một phiên khác, do tay một người khác. Dời hàm
 * xuống một tầng KHÔNG phụ thuộc ai là cách gỡ theo CẤU TRÚC, không phải theo kỷ luật.
 *
 * Không thêm gì mới ở đây: chính xác cùng một công thức, cùng một `hashId`, nên mọi trường cao độ
 * đã dựng ra từ trước phải ra **y hệt từng con số** (có bài test khoá điều đó ở `terrain.test.js`
 * — bảng cao độ 15 kỷ không được xê dịch).
 */

import { hashId } from '../cityLayout';

function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(t) { return t * t * (3 - 2 * t); }

/**
 * ⚠️ BỘ NHỚ ĐỆM NÚT LƯỚI — VÌ SAO NÓ Ở ĐÂY (2026-08-21, ADR-048).
 *
 * ADR-046 cho `horizon.heightAt` gọi `terrain.nenKho(...)` ở **mỗi đỉnh** của lưới chân trời —
 * lưới lớn nhất cảnh. Đó là một quyết định ĐÚNG (hai tấm khớp nhau THEO CẤU TẠO thay vì khớp nhờ
 * một hằng số chép hai nơi), nhưng nó nhân số lần lấy mẫu nhiễu lên nhiều lần, và giá của một lần
 * lấy mẫu thì chưa ai từng đo: `valueNoise` gọi `latticeValue` **4 lần**, mỗi lần dựng một chuỗi
 * `t|seed|ix|iy` (~20 ký tự) rồi băm FNV-1a chạy hết chuỗi ấy. Đo được (dựng lưới cho đủ 15 kỷ, ba
 * cây mã chạy **TUẦN TỰ** trên cùng một máy — đo song song thì hai bên giành CPU của nhau):
 *
 *   | phần            | TRƯỚC ADR-046 (`dfd2b15`) | SAU ADR-046 (`19305ab`) | có bộ nhớ đệm |
 *   |-----------------|--------------------------:|------------------------:|--------------:|
 *   | lưới chân trời  |                33,52 giây |              66,41 giây |    20,18 giây |
 *   | lưới mặt đất    |                 2,26 giây |               3,02 giây |     1,30 giây |
 *
 * Tức bản vá không chỉ trả lại chỗ ADR-046 đã tiêu, nó còn **nhanh hơn cả trước ADR-046 1,66 lần** —
 * vì cái giá 4-lần-băm-chuỗi ấy vốn đã có sẵn, chỉ là chưa ai đặt nó lên cân.
 *
 * ⚠️ **KHÔNG ĐỔI MỘT CON SỐ NÀO.** Đây là phép nhớ lại kết quả của **đúng một công thức cũ**, không
 * phải một công thức nhanh hơn — nên mọi trường cao độ đã dựng phải ra y hệt. Đã chứng minh bằng
 * cách băm MD5 toàn bộ mảng đỉnh của lưới mặt đất + lưới chân trời ở cả 15 kỷ và so với bản đã ship
 * (`19305ab`): **trùng từng byte, 15/15 kỷ**. Đổi hàm băm (dù chỉ để "nhanh hơn") thì cả 15 vùng đất
 * đổi hình vĩnh viễn — đó là một việc khác hẳn và phải là một quyết định có chủ đích.
 *
 * HAI CÁI GÁC, TRẢ LỜI HAI CÂU KHÁC NHAU — đừng gộp chúng lại:
 *
 * · `BO` trả lời *"có gói được (ix, iy) vào MỘT số nguyên mà không đụng nhau không?"*. Khoá là
 *   `(ix + BO) × HANG + (iy + BO)` với `HANG = BO × 2` — một song ánh, và `HANG` viết theo `BO` chứ
 *   không viết cứng 8192, vì đó là một QUAN HỆ: nới `BO` mà quên nới `HANG` là sinh ra đụng khoá
 *   trong im lặng. ⚠️ **Ra ngoài `BO` KHÔNG SAI, chỉ CHẬM**: nhánh ấy tính đúng cùng công thức, chỉ
 *   là không nhớ lại. Biên thật đo được ở một lượt quét đủ 15 kỷ là **ix, iy ∈ [−21, 27]** với **0
 *   lần rơi ra ngoài** — tức `BO = 4096` đang rộng gấp ~150 lần. Rộng như vậy là cố ý và vô hại,
 *   chính vì cái gác này không phải cổng ĐÚNG-SAI mà chỉ là cổng NHANH-CHẬM.
 *
 * · `TRAN_NUT` trả lời *"bộ nhớ đệm này được phép chiếm bao nhiêu?"*. Đây mới là cái gác bộ nhớ
 *   thật — `BO` thì không, vì trong biên ±4096 vẫn có tới 67 triệu ô. Một lượt quét đủ 15 kỷ ghi
 *   **21.343 nút / 112 hạt giống**, nên trần đặt ở 200.000 (≈ 9,4 lần) đủ chỗ cho mọi cách dùng
 *   hôm nay mà vẫn chặn được trường hợp một phase sau lấy mẫu ở ô nhiễu rất mịn. Chạm trần thì
 *   **thôi ghi, vẫn trả đúng giá trị** — hỏng về tốc độ, không bao giờ hỏng về kết quả — và kêu
 *   MỘT lần qua `console.warn`, vì một cái trần chạm trong im lặng là đúng thứ dự án này đã bị cắn
 *   nhiều lần (tính năng không HỎNG, tính năng thành VÔ HÌNH).
 *
 * Hạt giống bị chặn TỪ CẤU TRÚC nên số hạt không thể phình: mọi lời gọi đều dựng hạt từ `era`
 * (1..15) cộng một hậu tố VIẾT SẴN — `terrain.js` (`|roll` `|roll2` `|dongbang` `|tint`) ·
 * `horizon.js` (`|o0..|o4` chặn bởi `MAX_OCTAVES`, `|b`) · `setting.js` (`|rim` `|bo`) ·
 * `outskirts.js` (`|lum`). Không có đường nào để một hạt giống phụ thuộc toạ độ lọt vào đây.
 */
export const BIEN_NHO = 4096;             // xuất ra để `noise.test.js` dò được CẢ HAI PHÍA của biên
export const TRAN_NUT = 200000;
const BO = BIEN_NHO;
const HANG = BO * 2;

const nho = new Map();
let soNut = 0;                              // số lần GHI thành công (con số đã KHAI)
let daKeu = false;

/** Giá trị 0..1 tất định tại một nút lưới nhiễu. */
function latticeValue(seed, ix, iy) {
  const trongBien = ix >= -BO && ix < BO && iy >= -BO && iy < BO;
  if (!trongBien) return (hashId(`t|${seed}|${ix}|${iy}`) % 4096) / 4095;

  let ban = nho.get(seed);
  if (!ban) { ban = new Map(); nho.set(seed, ban); }
  const khoa = (ix + BO) * HANG + (iy + BO);
  const co = ban.get(khoa);
  if (co !== undefined) return co;

  const v = (hashId(`t|${seed}|${ix}|${iy}`) % 4096) / 4095;
  if (soNut < TRAN_NUT) {
    ban.set(khoa, v);
    soNut += 1;
  } else if (!daKeu) {
    daKeu = true;
    console.warn(`[noise] bộ nhớ đệm nút lưới đã chạm trần ${TRAN_NUT}; từ đây tính lại mỗi lần (đúng kết quả, chậm hơn).`);
  }
  return v;
}

/**
 * Số liệu của bộ nhớ đệm. Đây là ĐỐI CHỨNG bắt buộc của `noise.test.js`, không phải một tiện ích:
 * không có nó thì mọi bài test về bộ nhớ đệm đều có thể xanh trong khi bộ nhớ đệm chưa hề chạy.
 *
 * ⚠️ `nut` ĐẾM LẠI từ chính các `Map` chứ không trả về biến đếm `soNut` — cố ý, vì `nut` là thứ bài
 * test dùng để bắt **đụng khoá** (hai nút lưới khác nhau rơi vào chung một ô), và một con số đã KHAI
 * thì mù với đúng chuyện đó (`TECH_DEBT #42`).
 *
 * ⚠️ VÀ MỘT ĐIỀU ĐÃ ĐO RA RỒI MỚI BIẾT, GHI LẠI ĐỂ PHIÊN SAU KHỎI VIẾT LẠI CÁI GÁC ĐÃ CHẾT. Bản đầu
 * của hàm này trả thêm `daGhi: soNut` kèm một câu `assert.equal(nut, daGhi)` trong bài test, với lý
 * lẽ nghe rất chặt: *"hai đường đo độc lập, lệch nhau nghĩa là đụng khoá"*. Phép thử ngược cho thấy
 * câu ấy **không bao giờ có thể đỏ**: `if (co !== undefined) return co;` làm một khoá BỊ ĐỤNG trông
 * y hệt một lần TRÚNG bộ nhớ, nên lần ghi thứ hai không bao giờ xảy ra và biến đếm không bao giờ
 * đếm thừa. Đó là một bất biến ĐÚNG THEO CẤU TẠO — mà một bất biến đúng theo cấu tạo thì **không
 * phải một cái gác**, nó chỉ trông giống một cái gác. Việc bắt đụng khoá nay do hai bài test làm
 * thật: phép đếm số nút của bài "ĐỐI CHỨNG" (bắt được ca khoá cộng thay vì nhân) và bài "song ánh
 * khoá" hỏi thẳng ở hai góc đối của biên (bắt được ca `HANG` bị hạ còn `BO`).
 */
export function thongKeNho() {
  let dem = 0;
  for (const ban of nho.values()) dem += ban.size;
  return { hat: nho.size, nut: dem, day: daKeu };
}

/**
 * Nhiễu giá trị nội suy song tuyến, làm mượt bằng smoothstep. Trả 0..1.
 *
 * ⚠️ MỌI TẦNG ĐỊA HÌNH PHẢI GỌI ĐÚNG HÀM NÀY, không chép lại một bản "tương đương": `terrain.js`
 * (mặt đất thành phố) · `horizon.js` (rặng núi xa) · `outskirts.js` (lùm cây vùng quê) ·
 * `setting.js` (mép bờ nước). Bốn tầng ấy gặp nhau ở những chỗ giáp, và chỗ giáp là nơi duy nhất
 * mà một khác biệt nhỏ trở thành một ĐƯỜNG VIỀN mắt đọc ra được.
 */
export function valueNoise(seed, gx, gy) {
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const sx = smoothstep(gx - x0);
  const sy = smoothstep(gy - y0);
  const top = lerp(latticeValue(seed, x0, y0), latticeValue(seed, x0 + 1, y0), sx);
  const bottom = lerp(latticeValue(seed, x0, y0 + 1), latticeValue(seed, x0 + 1, y0 + 1), sx);
  return lerp(top, bottom, sy);
}

