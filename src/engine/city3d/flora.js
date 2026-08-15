/**
 * flora.js — bộ chữ cái của thảm thực vật. Bảy loài cây, mỗi loài 2–4 biến thể hình học thật.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Chỉ MÔ TẢ hình học bằng dữ
 * liệu; việc biến mô tả thành đối tượng GPU là của `components/city/render3d/`.
 *
 * ═══ VÌ SAO MỘT HÌNH NÓN TRÊN MỘT CÁI QUE ĐỌC RA "ĐỒ HOẠ MẪU", VÀ CÁCH THOÁT ═══
 *
 * Bản cũ dựng cây bằng đúng 2–3 khối: một trụ thóp làm thân, một (hoặc hai) khối nón làm tán. Nó
 * KHÔNG hỏng vì thiếu tam giác — nó hỏng vì bốn tính chất, và cả bốn đều là hệ quả của việc tán
 * là **MỘT khối lồi duy nhất**:
 *
 *   1. **Đường viền quá đều.** Một khối lồi luôn cho một hình bóng trơn tru, đối xứng — thứ mà
 *      ngoài thiên nhiên không có. Mắt người nhận ra "hình học" trước khi kịp nhận ra "cây".
 *   2. **Không có bóng đổ bên trong.** Một khối lồi thì mọi mặt của nó cùng nhận một hướng sáng,
 *      nên cả tán chỉ có ĐÚNG MỘT dải chuyển sáng-tối. Tán cây thật tối ở dưới, sáng ở trên, và có
 *      những mảng tối lọt giữa các chùm lá — đó chính là thứ nói cho mắt biết nó DÀY.
 *   3. **Đối xứng xoay hoàn hảo.** Xoay khối đó bao nhiêu độ cũng ra cùng một hình bóng, nên mười
 *      cái cây đặt cạnh nhau đọc ra thành mười bản sao dù đã xoay khác nhau.
 *   4. **Chỗ nối thân–tán là một giao tuyến sắc lẻm**, không có cành nào bắc cầu giữa hai khối.
 *
 * ⇒ Cách chữa KHÔNG phải là tăng `sides` cho tán mượt hơn (mượt hơn thì càng giống hình học), mà
 * là **thay một khối lồi bằng NHIỀU THUỲ chồng lấn, lệch tâm, khác cỡ, khác cao độ**. Ba thuỳ đè
 * lên nhau tự sinh ra cả bốn thứ còn thiếu ở trên: viền lồi lõm, mặt này đổ bóng lên mặt kia, xoay
 * một góc là ra hình bóng khác, và chỗ nối bị chính các thuỳ che đi. Giá phải trả rất rẻ: một tán
 * ba thuỳ tốn 132 tam giác thay vì 44 — vẫn kém xa một hình cầu thật (hàng trăm), mà đọc ra tự
 * nhiên hơn hẳn.
 *
 * ⚠️ MỘT GIỚI HẠN CỦA `parts.js` PHẢI BIẾT TRƯỚC KHI ĐỌC MÃ DƯỚI ĐÂY: khối chỉ XOAY QUANH TRỤC
 * ĐỨNG (`ry`), KHÔNG nghiêng được. Nên ở đây không có cành nào chĩa xiên, và mọi "cong", "nghiêng",
 * "toả" đều làm bằng cách xếp nhiều khối LỆCH TÂM nhau theo chiều cao. Đây là lựa chọn có cân nhắc:
 * thêm một trục xoay vào `parts.js` sẽ kéo theo nhà máy hình học, phép đếm tam giác và phép tính
 * cạnh vát — tức chạm vào nền móng của cả 75 công trình để đổi lấy một thứ mà ở cỡ 40 điểm ảnh
 * (kích thước thật của một cái cây trên màn hình) gần như không đọc ra được. Hình bóng thì đọc ra
 * được; góc nghiêng của một cái cành thì không.
 *
 * ⚠️ VÀ ĐÂY LÀ CHỖ MỘT BIẾN TỪNG NÓI DỐI SUỐT NHIỀU THÁNG. Bản cũ có `const lean = signed(...)` rồi
 * truyền vào `prism({ ry: lean })` — cái tên nói "nghiêng", nhưng `ry` là XOAY QUANH TRỤC ĐỨNG.
 * Xoay một khối gần đối xứng quanh trục của chính nó thì không có gì đổi. Cây chưa bao giờ nghiêng
 * một độ nào, và không có gì đỏ lên vì mã vẫn chạy đúng — chỉ là nó làm một việc khác với cái tên
 * của nó. Cùng họ với bài học "một chú thích chứng minh Ý ĐỊNH, không chứng minh KẾT QUẢ".
 */

import { prism } from './parts';
import { unit, signed, pickIndex } from '../hashId';
import { getFloraStyle, pickFloraSpecies } from './floraStyle';

/**
 * Hai vai màu lá thay vì một. `leaf` là mặt lá ăn nắng, `leaf2` là mặt lá trong bóng — chênh nhau
 * một quãng đậm nhạt cố định do bảng màu quyết định.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI "cho có hai màu cho vui": vật liệu trong cảnh này tô màu THEO VAI, một vai một
 * màu, nên nếu cả tán cùng vai thì mọi thuỳ ra đúng một màu và ba thuỳ chồng lên nhau chỉ còn phân
 * biệt được bằng bóng đổ — mà bóng đổ ở cỡ vài chục điểm ảnh thì rất yếu. Chia hai vai là cách rẻ
 * nhất để tán có CHIỀU SÂU ngay cả khi đứng trong bóng râm. Đúng khuôn `wall`/`wall2` mà tường nhà
 * đã dùng từ Phase 3B vì y hệt lý do ấy.
 */
const SUN = 'leaf';
const SHADE = 'leaf2';

/** Cây tán rộng: sồi, bàng, cây đầu làng. Loài phổ thông nhất, tán tròn lồi lõm. */
function broadleaf(seed, size, lobeBudget) {
  const parts = [];
  const trunkH = (0.30 + unit(`${seed}|th`) * 0.15) * size;
  parts.push(prism({
    w: 0.075 * size, h: trunkH * 1.28, sides: 5, taper: 0.58, role: 'wood',
  }));

  const lobes = Math.max(2, Math.min(lobeBudget, 3 + pickIndex(`${seed}|n`, 2)));
  const crown = (0.42 + unit(`${seed}|cw`) * 0.16) * size;
  for (let i = 0; i < lobes; i += 1) {
    const t = i / lobes;
    const ang = unit(`${seed}|a${i}`) * Math.PI * 2;
    // Thuỳ đầu tiên ôm sát thân (nó là phần lõi của tán); các thuỳ sau mới toả ra.
    const reach = (0.05 + unit(`${seed}|r${i}`) * 0.10) * size * (i === 0 ? 0.3 : 1);
    parts.push(prism({
      x: Math.cos(ang) * reach,
      z: Math.sin(ang) * reach,
      y: trunkH * 0.90 + t * crown * 0.52 + signed(`${seed}|dy${i}`) * 0.035 * size,
      w: crown * (0.60 + unit(`${seed}|w${i}`) * 0.44) * (1 - t * 0.20),
      h: (0.17 + unit(`${seed}|h${i}`) * 0.12) * size,
      sides: 6,
      taper: 0.46 + unit(`${seed}|tp${i}`) * 0.38,
      ry: ang,
      role: t < 0.5 ? SHADE : SUN,
    }));
  }
  return parts;
}

/** Thông/vân sam: tán chia TẦNG. Nón thì đúng với loài này — cái sai là nón LIỀN MỘT KHỐI. */
function conifer(seed, size, lobeBudget) {
  const parts = [];
  const trunkH = (0.19 + unit(`${seed}|th`) * 0.10) * size;
  parts.push(prism({
    w: 0.062 * size, h: trunkH * 1.7, sides: 5, taper: 0.5, role: 'wood',
  }));

  const tiers = Math.max(2, Math.min(lobeBudget, 3 + pickIndex(`${seed}|n`, 2)));
  let y = trunkH;
  let w = (0.44 + unit(`${seed}|w`) * 0.12) * size;
  for (let i = 0; i < tiers; i += 1) {
    const h = (0.27 + unit(`${seed}|h${i}`) * 0.11) * size;
    const top = i === tiers - 1;
    parts.push(prism({
      x: signed(`${seed}|x${i}`) * 0.028 * size,
      z: signed(`${seed}|z${i}`) * 0.028 * size,
      y,
      w,
      h,
      // Xem ghi chú ở `cypress`: `sides` viết cứng thì cả một kỷ chỉ có vài dáng cây. Kỷ 12 (taiga
      // Nga) là kỷ ĐỘC CANH — chỉ khai `conifer` — nên nó không có loài thứ hai nào để bù, và số
      // dáng của cả kỷ đúng bằng số dáng của riêng loài này.
      sides: 5 + pickIndex(`${seed}|sd${i}`, 3),
      // Chỉ tầng NGỌN thóp về một điểm. Các tầng dưới giữ một mặt trên bẹt → mép tầng dưới thò ra
      // khỏi tầng trên, và chính cái mép ấy bắt sáng thành đường viền chia tầng.
      taper: top ? 0 : 0.26 + unit(`${seed}|t${i}`) * 0.34,
      ry: unit(`${seed}|r${i}`) * 1.6,
      role: i % 2 === 0 ? SHADE : SUN,
    }));
    y += h * 0.70;     // chồng lấn 30% — hở ra thì thành một chồng nón rời, không thành cái cây
    w *= 0.74;
  }
  return parts;
}

/** Cọ / dừa / chà là: thân CONG nhiều đốt + tàu lá toả tròn. */
function palm(seed, size, lobeBudget) {
  const parts = [];
  const segs = 2 + pickIndex(`${seed}|s`, 2);
  const total = (0.66 + unit(`${seed}|h`) * 0.30) * size;
  const segH = total / segs;
  // Thân cọ cong VỀ MỘT PHÍA (không phải zíc-zắc): mỗi đốt lệch thêm cùng dấu với đốt trước.
  const bend = signed(`${seed}|bend`) * 0.045 * size;
  let y = 0;
  let shift = 0;
  for (let i = 0; i < segs; i += 1) {
    shift += bend * (0.5 + unit(`${seed}|b${i}`) * 0.9);
    parts.push(prism({
      x: shift, z: shift * 0.42, y,
      w: (0.072 - i * 0.009) * size, h: segH * 1.06,
      sides: 5, taper: 0.84, role: 'wood',
    }));
    y += segH;
  }

  // ⚠️ NGÂN SÁCH PHẢI THẬT SỰ CẮN. Bản đầu viết `min(lobeBudget + 3, 5 + pickIndex(…))`, tức mức
  // thấp cho trần 5 trong khi hạt chỉ đòi 5–7 ⇒ **một nửa số hạt ra ĐÚNG BẰNG mức cao**, và cái núm
  // LOD chỉ có tác dụng trong 5/10 trường hợp. Đúng hình dạng sai của Phase 7A: một cái núm không
  // nối vào đâu vẫn "chạy" bình thường và chỉ lộ ra khi đo. Nay mức thấp luôn ra 3 tàu lá, thấp
  // hơn MỌI giá trị mà mức cao có thể ra (5–7).
  const fronds = Math.max(3, Math.min(5 + pickIndex(`${seed}|f`, 3), lobeBudget + 2));
  const reach = (0.30 + unit(`${seed}|fr`) * 0.12) * size;
  const spin = unit(`${seed}|fa`) * Math.PI * 2;
  for (let i = 0; i < fronds; i += 1) {
    const ang = (i / fronds) * Math.PI * 2 + spin;
    const len = 0.78 + unit(`${seed}|fl${i}`) * 0.32;   // tàu lá dài ngắn khác nhau
    parts.push(prism({
      x: shift + Math.cos(ang) * reach * 0.5,
      z: shift * 0.42 + Math.sin(ang) * reach * 0.5,
      // ⚠️ TÀU LÁ CÀNG DÀI CÀNG RỦ THẤP — và đây là bản vá của một thứ chỉ ảnh chụp mới thấy.
      // `parts.js` không nghiêng được khối, nên tàu lá là những tấm NẰM NGANG. Nhìn từ bên hông thì
      // đúng là một cây cọ; nhưng camera của màn Thành Phố nhìn CHÉO TỪ TRÊN XUỐNG, và ở góc đó cả
      // vòng lá dẹt lại thành một dấu hoa thị "✳" phẳng lì. Cọ thật thì tàu càng dài càng oằn
      // xuống, nên buộc độ rủ vào chính chiều dài (chứ không rắc ngẫu nhiên như bản cũ) sẽ dựng lại
      // được cái phễu lá — tốn 0 tam giác, vì chỉ đổi toạ độ của những khối vốn đã có.
      y: y - (0.02 + (len - 0.78) * 0.42) * size - unit(`${seed}|fd${i}`) * 0.05 * size,
      w: reach * len, d: 0.09 * size, h: 0.036 * size,
      sides: 4, taper: 0.18 + unit(`${seed}|ft${i}`) * 0.26, ry: ang,
      role: i % 2 === 0 ? SUN : SHADE,
    }));
  }
  // Búp ngọn — chỗ mọi tàu lá chụm lại. Thiếu nó thì giữa vòng lá hở ra một lỗ.
  parts.push(prism({
    x: shift, z: shift * 0.42, y: y - 0.03 * size,
    w: 0.11 * size, h: 0.10 * size, sides: 5, taper: 0.34, role: SUN,
  }));
  return parts;
}

/** Trắc bách diệp: cột hẹp cao. Nét Địa Trung Hải — một hàng cypress là đọc ra ngay Toscana. */
function cypress(seed, size, lobeBudget) {
  const parts = [];
  const total = (0.90 + unit(`${seed}|h`) * 0.50) * size;
  const width = (0.20 + unit(`${seed}|w`) * 0.07) * size;
  parts.push(prism({
    w: 0.052 * size, h: 0.17 * size, sides: 5, taper: 0.72, role: 'wood',
  }));

  // ⚠️ Dải 3–4 chứ không phải 2–3: ở mức chi tiết THẤP ngân sách kẹp về 2, nên nếu mức cao cũng có
  // thể ra 2 thì một nửa số hạt cho ra hai mức Y HỆT NHAU và cái núm LOD chỉ nối được một nửa.
  const segs = Math.max(2, Math.min(lobeBudget, 3 + pickIndex(`${seed}|s`, 2)));
  let y = 0.10 * size;
  for (let i = 0; i < segs; i += 1) {
    const segH = (total / segs) * (0.92 + unit(`${seed}|sh${i}`) * 0.20);
    const top = i === segs - 1;
    parts.push(prism({
      x: signed(`${seed}|x${i}`) * 0.026 * size,
      z: signed(`${seed}|z${i}`) * 0.026 * size,
      y,
      w: width * (1 - i * 0.13), h: segH,
      // ⚠️ `sides` VÀ `taper` đổi theo hạt, không phải hằng số. Đo lần đầu: kỷ 9 (chỉ có
      // `streetTree` + `cypress`, cả hai đều khai cứng hai giá trị này) ra **4 cấu trúc trên 40
      // hạt** — tức bốn cái khuôn cho cả một thành phố. Kích thước có đổi, nhưng kích thước không
      // đổi được HÌNH BÓNG; góc thóp thì có (0,62 ra cây hình búp măng, 0,92 ra cây hình cột).
      sides: 5 + pickIndex(`${seed}|sd${i}`, 2),
      taper: top ? 0.12 + unit(`${seed}|tt`) * 0.22 : 0.62 + unit(`${seed}|tb${i}`) * 0.30,
      ry: unit(`${seed}|r${i}`) * 1.2,
      role: i % 2 === 0 ? SUN : SHADE,
    }));
    y += segH * 0.86;
  }
  return parts;
}

/** Đa / si: tán RẤT rộng so với chiều cao, cộng rễ phụ buông xuống — chữ ký của cây làng Á Đông. */
function banyan(seed, size, lobeBudget) {
  const parts = [];
  const trunkH = (0.21 + unit(`${seed}|th`) * 0.09) * size;
  parts.push(prism({
    w: 0.135 * size, h: trunkH * 1.3, sides: 6, taper: 0.66, role: 'wood',
  }));

  const lobes = Math.max(3, Math.min(lobeBudget + 1, 4 + pickIndex(`${seed}|n`, 2)));
  const spread = (0.30 + unit(`${seed}|s`) * 0.11) * size;
  const spin = unit(`${seed}|a`) * Math.PI * 2;
  for (let i = 0; i < lobes; i += 1) {
    const ang = (i / lobes) * Math.PI * 2 + spin;
    const reach = spread * (0.48 + unit(`${seed}|r${i}`) * 0.52);
    parts.push(prism({
      x: Math.cos(ang) * reach, z: Math.sin(ang) * reach,
      y: trunkH + signed(`${seed}|y${i}`) * 0.045 * size,
      w: (0.30 + unit(`${seed}|w${i}`) * 0.15) * size,
      h: (0.14 + unit(`${seed}|h${i}`) * 0.09) * size,
      // ⚠️ Lần thứ BA cùng một lỗi trong cùng một file: `sides`/`taper` viết cứng thì hạt giống chỉ
      // đổi được kích thước, mà kích thước không đổi được HÌNH BÓNG. `cypress` và `streetTree` đã
      // được vá; `banyan` thì tôi bỏ sót, và phép đo bắt ngay: **40 hạt ra đúng 2 dáng**. Bài học
      // "đổi một luật thì grep chính cái luật ấy trên toàn cây, đừng sửa chỗ đầu tiên nghĩ ra".
      sides: 5 + pickIndex(`${seed}|sd${i}`, 2),
      taper: 0.44 + unit(`${seed}|tp${i}`) * 0.34,
      ry: ang,
      role: i % 2 === 0 ? SHADE : SUN,
    }));
  }
  // Mũ giữa cao hơn vành ngoài — thiếu nó thì tán bẹt như cái đĩa úp.
  parts.push(prism({
    y: trunkH + 0.09 * size,
    w: (0.29 + unit(`${seed}|cw`) * 0.07) * size, h: 0.16 * size,
    sides: 5 + pickIndex(`${seed}|cs`, 3),
    taper: 0.34 + unit(`${seed}|ct`) * 0.30,
    ry: spin * 0.5, role: SUN,
  }));

  const roots = Math.max(1, Math.min(lobeBudget, 2 + pickIndex(`${seed}|rt`, 2)));
  for (let i = 0; i < roots; i += 1) {
    const ang = unit(`${seed}|ra${i}`) * Math.PI * 2;
    const reach = spread * (0.55 + unit(`${seed}|rr${i}`) * 0.35);
    parts.push(prism({
      x: Math.cos(ang) * reach, z: Math.sin(ang) * reach, y: 0,
      w: 0.030 * size, h: trunkH * (0.85 + unit(`${seed}|rh${i}`) * 0.55),
      sides: 4, taper: 0.88, role: 'wood',
    }));
  }
  return parts;
}

/** Cây phố cắt tỉa: thân cao THẲNG, gốc thoáng để người đi bộ lọt qua, tán gọn hai tầng. */
function streetTree(seed, size, lobeBudget) {
  const parts = [];
  const trunkH = (0.44 + unit(`${seed}|th`) * 0.18) * size;
  parts.push(prism({
    w: 0.056 * size, h: trunkH * 1.10, sides: 6, taper: 0.80, role: 'wood',
  }));

  const lobes = Math.max(1, Math.min(lobeBudget, 2 + pickIndex(`${seed}|n`, 2)));
  const crown = (0.28 + unit(`${seed}|c`) * 0.09) * size;
  let y = trunkH;
  for (let i = 0; i < lobes; i += 1) {
    const h = (0.17 + unit(`${seed}|h${i}`) * 0.08) * size;
    parts.push(prism({
      x: signed(`${seed}|x${i}`) * 0.032 * size,
      z: signed(`${seed}|z${i}`) * 0.032 * size,
      y,
      w: crown * (1 - i * 0.18), h,
      sides: 5 + pickIndex(`${seed}|sd${i}`, 2),
      // Xem ghi chú ở `cypress`: hai giá trị này từng viết cứng và kỷ 9 chỉ ra 4 dáng cây.
      taper: i === lobes - 1
        ? 0.24 + unit(`${seed}|tt${i}`) * 0.26
        : 0.78 + unit(`${seed}|tb${i}`) * 0.20,
      ry: unit(`${seed}|r${i}`) * 1.1,
      role: i === 0 ? SHADE : SUN,
    }));
    y += h * 0.76;
  }
  return parts;
}

/** Bụi: không thân, hai ba khối sát đất. Rẻ nhất, và là thứ lấp chân tường / mép ruộng. */
function bush(seed, size, lobeBudget) {
  const parts = [];
  const lobes = Math.max(1, Math.min(lobeBudget, 2 + pickIndex(`${seed}|n`, 2)));
  const spin = unit(`${seed}|a`) * Math.PI * 2;
  for (let i = 0; i < lobes; i += 1) {
    const ang = (i / lobes) * Math.PI * 2 + spin;
    const reach = (0.045 + unit(`${seed}|r${i}`) * 0.065) * size;
    parts.push(prism({
      x: Math.cos(ang) * reach, z: Math.sin(ang) * reach,
      // Lún nhẹ xuống đất: bụi mọc TỪ đất, không đặt LÊN đất. Một khe sáng dưới gốc là dấu hiệu
      // "vật thể được thả xuống" rõ nhất, và nó tốn 0 tam giác để bỏ đi.
      y: -0.015 * size,
      w: (0.18 + unit(`${seed}|w${i}`) * 0.10) * size,
      h: (0.14 + unit(`${seed}|h${i}`) * 0.09) * size,
      // Lần thứ TƯ của cùng một lỗi trong file này (xem `cypress`, `streetTree`, `banyan`): viết
      // cứng `sides`/`taper` thì 40 hạt ra đúng 2 dáng. Bụi là loại cảnh vật ĐÔNG NHẤT ở những kỷ
      // có tầng cây bụi dày, nên hai dáng bụi lặp lại chính là "pattern lặp lại dễ thấy".
      sides: 4 + pickIndex(`${seed}|sd${i}`, 3),
      taper: 0.34 + unit(`${seed}|tp${i}`) * 0.36,
      ry: ang,
      role: i % 2 === 0 ? SUN : SHADE,
    }));
  }
  return parts;
}

const BUILDERS = { broadleaf, conifer, palm, cypress, banyan, streetTree, bush };

/**
 * Số thuỳ tối đa cho mỗi mức chi tiết.
 *
 * ⚠️ ĐÂY LÀ CÁI NÚM LOD DUY NHẤT, VÀ NÓ CỐ Ý KHÔNG PHẢI "LOD THEO KHOẢNG CÁCH CAMERA".
 * Cả thành phố gộp vào MỘT khối hình học để chỉ tốn một lệnh vẽ; muốn đổi chi tiết theo khoảng
 * cách tới camera thì phải dựng lại khối ấy mỗi lần camera nhích — tức phá tan cả cơ chế
 * "chỉ vẽ khi có gì đổi" (render-on-demand) lẫn cái lợi một-lệnh-vẽ, để đổi lấy vài trăm tam giác.
 * Ở quy mô này đó là một cuộc đổi chác lỗ. Cái đúng là hạ chi tiết theo MÁY (máy yếu → `low`),
 * và đó chính là công tắc `lowDetail` cảnh đã có sẵn từ Phase 3A.
 */
const LOBE_BUDGET = { high: 5, low: 1 };

/**
 * Dựng mô tả hình học cho MỘT cây.
 *
 * @param {object} input
 * @param {string} input.species  một giá trị của `FLORA_SPECIES` (loài lạ → `broadleaf`)
 * @param {string} input.seed     khoá băm — ổn định theo ô lưới để cây không đổi hình
 * @param {number} [input.size]   hệ số cỡ của kỷ (`FLORA_STYLES[era].scale`)
 * @param {'high'|'low'} [input.detail]
 * @returns {Array} danh sách khối
 */
export function growTree({ species, seed = 't', size = 1, detail = 'high' } = {}) {
  const build = BUILDERS[species] ?? BUILDERS.broadleaf;
  const scale = Number.isFinite(size) && size > 0 ? size : 1;
  return build(seed, scale, LOBE_BUDGET[detail] ?? LOBE_BUDGET.high);
}

/**
 * Dựng cây HỢP VỚI KỶ — đường vào mà `propSpec.js` dùng. Gộp việc chọn loài với việc dựng khối để
 * bên gọi không phải biết bảng loài, và để chỉ có MỘT chỗ quyết định "kỷ này thì cây trông ra sao".
 */
export function growEraTree({ era, seed = 't', detail = 'high', species = null } = {}) {
  const style = getFloraStyle(era);
  return growTree({
    // `species` truyền thẳng dùng cho BỤI (loại cảnh vật riêng, không được bốc từ bảng loài cây).
    species: species ?? pickFloraSpecies(era, seed),
    seed,
    size: style.scale,
    detail,
  });
}
