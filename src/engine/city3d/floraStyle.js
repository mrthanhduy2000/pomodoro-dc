/**
 * floraStyle.js — 15 kỷ, 15 thảm thực vật. Bảng này là nguồn DUY NHẤT trả lời "ở thời đại này thì
 * mọc cây gì, to cỡ nào, rậm tới đâu, lá màu gì".
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — nó là bản sửa của một lỗi THIẾT KẾ, không phải lỗi mã.
 * Trước Phase 8D, hình dáng cây nằm trong ba nhánh `if` viết cứng giữa hàm `tree()` của
 * `propSpec.js`: `era >= 10` → một mẫu, `style.rough > 0.5` → mẫu thứ hai, còn lại → mẫu thứ ba.
 * Hậu quả đo được: **qua 40 hạt giống khác nhau chỉ ra ĐÚNG MỘT cấu trúc khối** (hạt chỉ đổi được
 * chiều cao, trong dải 1,32 lần), và **cả 15 kỷ chỉ có 3 mẫu cây**. Nhà cửa từ Phase 3B đã có hẳn
 * một ngữ pháp ba trục (kỷ × loại × độ hiếm) để thoát khỏi đúng cái bẫy này; thảm thực vật thì
 * chưa bao giờ được cho một ngữ pháp nào cả. File này là cái ngữ pháp còn thiếu ấy.
 *
 * ⚠️ VÌ SAO LOÀI CÂY BÁM VÀO `country` CHỨ KHÔNG PHẢI CHỌN CHO ĐẸP.
 * `eraStyle.js` đã khai mỗi kỷ một đất nước biểu tượng, kèm luật: muốn đổi một con số của kỷ thì
 * phải trả lời được *"công trình có thật nào ở nước ấy trông như vậy?"*. Thảm thực vật chịu đúng
 * luật đó — mỗi dòng dưới đây phải trả lời được *"đi bộ ở nước ấy thì thấy cây gì?"*. Không có
 * ràng buộc ấy thì 15 dòng sẽ là 15 lần chọn bừa, và chọn bừa chính là thứ đã sinh ra 15 kỷ cây
 * giống hệt nhau.
 *
 * ⚠️ VÌ SAO MÀU LÁ Ở ĐÂY MÀ KHÔNG Ở `palette3d.js`. Vì màu lá là một THUỘC TÍNH CỦA THẢM THỰC VẬT,
 * không phải một lựa chọn hoà sắc: cọ sa mạc bạc phếch, thông taiga ngả lam, cây cảnh Nhật xanh
 * đậm — đó là chuyện sinh học của chính những loài đã khai ngay dòng trên. Để màu ở bảng màu thì
 * ngày nào có người đổi danh sách loài, màu sẽ đứng yên và không có gì đỏ lên. `palette3d.js` đọc
 * hai con số này y như cách nó đã đọc `roofColor` từ `eraStyle.js` — một luật, một chỗ khai.
 */

import { hashId } from '../hashId';

/**
 * Danh sách loài mà `flora.js` dựng được. Khai ở đây (chứ không ở `flora.js`) vì bảng dưới phải
 * kiểm được: một kỷ lỡ khai loài không tồn tại thì test bắt ngay, không đợi tới lúc nhìn ảnh.
 */
export const FLORA_SPECIES = [
  'broadleaf',   // tán rộng nhiều thuỳ — sồi, bàng, cây làng
  'conifer',     // thông/tùng — tán tầng hình nón chồng
  'palm',        // cọ, dừa, chà là — thân cong nhiều đốt + tàu lá toả
  'cypress',     // trắc bách diệp — cột hẹp cao, nét Địa Trung Hải
  'banyan',      // đa, si — tán rất rộng thấp + rễ phụ buông
  'streetTree',  // cây phố cắt tỉa — thân cao thẳng, tán gọn
  'bush',        // bụi thấp, không thân
];

const SPECIES_SET = new Set(FLORA_SPECIES);

/**
 * `scale`   — cỡ cây của kỷ (1 = cỡ chuẩn). Rừng nguyên sinh to, cây phố công nghiệp còi.
 * `density` — nhân vào ngân sách cảnh vật: sa mạc thưa, thành phố vườn rậm.
 * `undergrowth` — phần ô "cây" bị hạ xuống thành BỤI (0…1). Đây là trường trả lời câu hỏi thứ hai
 *   mà bảng `species` từng bị bắt gánh chung (xem `pickFloraSpecies`): Manchester công nghiệp đầy
 *   đất hoang mọc bụi hoang (0,45); vườn ô-liu Toscana thì đất giữa các hàng bị cày sạch (0,18).
 * `leafHue` — góc màu lá (độ). 70 = ô-liu ám vàng · 90 = xanh lá · 130 = xanh ngả lam.
 * `leafSat` — độ tươi của lá. Thấp = bạc phếch/ám khói; cao = nhiệt đới mọng.
 */
export const FLORA_STYLES = {
  1: {
    note: 'Thổ Nhĩ Kỳ — cao nguyên Anatolia quanh Göbekli Tepe: sồi và hồ trăn mọc thành lùm',
    species: [['broadleaf', 6], ['conifer', 1]],
    scale: 1.14, density: 1.30, undergrowth: 0.38, leafHue: 92, leafSat: 0.40,
  },
  2: {
    note: 'Ai Cập — chà là ven sông Nin; ra khỏi dải phù sa là sa mạc, nên cây bám thành dải thưa',
    species: [['palm', 7], ['broadleaf', 1]],
    scale: 1.02, density: 0.74, undergrowth: 0.2, leafHue: 76, leafSat: 0.34,
  },
  3: {
    note: 'Iraq — Lưỡng Hà: chà là dọc kênh dẫn nước, xen vài hàng cây cột hẹp',
    species: [['palm', 6], ['cypress', 2]],
    scale: 1.00, density: 0.82, undergrowth: 0.2, leafHue: 72, leafSat: 0.32,
  },
  4: {
    note: 'Trung Quốc — đa và liễu che sân điện, tán xoè rộng hơn cả mái',
    species: [['banyan', 5], ['broadleaf', 3]],
    scale: 1.10, density: 1.10, undergrowth: 0.2, leafHue: 104, leafSat: 0.40,
  },
  5: {
    note: 'Đức — rừng vân sam ôn đới bao quanh lâu đài đá, tán nhọn chen nhau',
    species: [['conifer', 6], ['broadleaf', 3]],
    scale: 1.16, density: 1.30, undergrowth: 0.2, leafHue: 118, leafSat: 0.34,
  },
  6: {
    note: 'Việt Nam — cây đa đầu làng, hàng cau bên đình, bụi tre men bờ ao',
    species: [['banyan', 5], ['palm', 3]],
    scale: 1.06, density: 1.20, undergrowth: 0.3, leafHue: 108, leafSat: 0.46,
  },
  7: {
    note: 'Ý — Toscana: hàng trắc bách diệp dựng đứng dọc lối, xen ô-liu tán thấp',
    species: [['cypress', 6], ['broadleaf', 3]],
    scale: 1.02, density: 1.00, undergrowth: 0.18, leafHue: 96, leafSat: 0.30,
  },
  8: {
    note: 'Bồ Đào Nha — bến cảng Lisboa: cây tán rộng chắn gió biển, xen cọ cảnh',
    species: [['broadleaf', 4], ['palm', 3]],
    scale: 0.96, density: 0.92, undergrowth: 0.3, leafHue: 84, leafSat: 0.32,
  },
  9: {
    note: 'Pháp — vườn kiểu Versailles: cây cắt tỉa thẳng hàng, tán vuông vức có chủ ý',
    species: [['streetTree', 5], ['cypress', 3]],
    scale: 1.00, density: 1.10, undergrowth: 0.3, leafHue: 100, leafSat: 0.34,
  },
  10: {
    note: 'Anh — Manchester thời than đá: cây còi cọc, lá ám bồ hóng, đất bỏ hoang nhiều bụi',
    species: [['broadleaf', 4], ['streetTree', 2]],
    scale: 0.82, density: 0.68, undergrowth: 0.45, leafHue: 80, leafSat: 0.20,
  },
  11: {
    note: 'Mỹ — New York thời Mạ Vàng: cây phố trồng đều dọc vỉa hè, thân cao gốc thoáng',
    species: [['streetTree', 6], ['broadleaf', 3]],
    scale: 1.06, density: 1.00, undergrowth: 0.18, leafHue: 98, leafSat: 0.36,
  },
  12: {
    note: 'Nga — taiga: vân sam và thông tuyết, gần như không có loài lá rộng nào',
    species: [['conifer', 8]],
    scale: 1.20, density: 1.10, undergrowth: 0.2, leafHue: 132, leafSat: 0.28,
  },
  13: {
    note: 'Nhật Bản — cây cảnh cắt tỉa thấp quanh khối bê tông, tán tròn nhỏ',
    species: [['broadleaf', 4], ['conifer', 3]],
    scale: 0.86, density: 1.16, undergrowth: 0.36, leafHue: 106, leafSat: 0.38,
  },
  14: {
    note: 'Singapore — thành phố vườn: cọ dọc đại lộ, cây phố phủ kín, xanh dày nhất trong 15 kỷ',
    species: [['palm', 5], ['streetTree', 3], ['banyan', 2]],
    scale: 1.06, density: 1.42, undergrowth: 0.23, leafHue: 112, leafSat: 0.48,
  },
  15: {
    note: 'UAE — cọ sa mạc trồng thưa trên cát, bụi chịu hạn bạc phếch',
    species: [['palm', 6]],
    scale: 1.02, density: 0.66, undergrowth: 0.33, leafHue: 70, leafSat: 0.26,
  },
};

/** Kỷ lạ / thiếu → dùng kỷ 1. Không bao giờ ném lỗi: dữ liệu cloud có thể hỏng. */
export function getFloraStyle(era) {
  return FLORA_STYLES[era] ?? FLORA_STYLES[1];
}

/**
 * Chọn loài cây THÂN GỖ cho MỘT ô, theo trọng số của kỷ. Tất định tuyệt đối: cùng hạt giống → mãi
 * mãi cùng một loài (bất biến "bảo tàng bất động", ADR-007).
 *
 * ⚠️ `bush` KHÔNG BAO GIỜ nằm trong bảng `species` ở trên, và đây là một lỗi đã trả giá ngay trong
 * chính phiên làm Phase 8D. Bản đầu để `bush` chung bảng với cây rồi lọc bằng một cờ `allowBush`.
 * Hậu quả đo được: cảnh vật loại `bush` ở kỷ 1 ra **5 khối, 212 tam giác, CAO 0,94** — tức một cái
 * cây hoàn chỉnh đứng ở chỗ đáng lẽ là bụi thấp, vì bảng kỷ 1 khai `broadleaf` nặng hơn `bush` nên
 * 6/10 lần "bụi" bốc trúng cây. Cái cờ ấy chỉ che được một nửa: nó chặn bụi lọt vào rổ cây, nhưng
 * không chặn CÂY lọt vào rổ bụi. Bài học cũ của dự án, lần thứ tư: **một bảng gánh hai việc**
 * (vừa "cây gì mọc ở đây" vừa "tầng cây bụi dày bao nhiêu") thì không bao giờ tách sạch được hai
 * thứ nó đang trộn. Nay bảng chỉ trả lời câu thứ nhất; câu thứ hai là trường `undergrowth` riêng.
 */
export function pickFloraSpecies(era, seed) {
  const pool = getFloraStyle(era).species;
  const list = pool.length > 0 ? pool : [['broadleaf', 1]];
  let total = 0;
  for (const [, weight] of list) total += weight;
  let roll = hashId(`${seed}|sp`) % Math.max(1, total);
  for (const [kind, weight] of list) {
    roll -= weight;
    if (roll < 0) return SPECIES_SET.has(kind) && kind !== 'bush' ? kind : 'broadleaf';
  }
  return list[0][0];
}
