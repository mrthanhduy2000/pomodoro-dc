/**
 * propSpec.js — cảnh vật KHÔNG phải công trình: cây, bụi, đá, đèn, mặt nước, ruộng đồng.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO ĐÂY KHÔNG PHẢI "TRANG TRÍ THÊM CHO VUI":
 * Lưới thành phố có 144 ô nhưng chỉ 5 công trình — nghĩa là 97% mặt đất trống. Nhìn từ trên xuống,
 * một mặt bàn cờ trống trải với năm khối nhà cắm rời rạc trông như mô hình chưa làm xong, chứ
 * không phải một nơi có người ở. `deriveProps` trong `cityLayout.js` đã sinh sẵn danh sách cảnh
 * vật từ nhiều phiên trước (bộ vẽ 2D dùng rồi) — bộ vẽ 3D chỉ mới đọc mỗi đường sá và bỏ qua tất
 * cả phần còn lại. File này lấp đúng khoảng trống đó.
 *
 * Cảnh vật cũng CHÍNH LÀ thước đo tiến độ nhìn thấy được: số lượng suy từ số phiên và độ dài
 * chuỗi, nên thành phố rậm rạp dần theo công sức Đàm bỏ ra, không cần thêm một byte state nào.
 *
 * ⚠️ CÂY KHÔNG CÒN Ở FILE NÀY NỮA (Phase 8D). Hình dáng cây từng nằm trong ba nhánh `if` viết cứng
 * ngay giữa file, và đo ra thì **40 hạt giống chỉ cho 1 cấu trúc khối, 15 kỷ chỉ có 3 mẫu**. Nay
 * thảm thực vật có ngữ pháp riêng ở `flora.js` + `floraStyle.js`, đúng khuôn mà nhà cửa đã dùng từ
 * Phase 3B. File này chỉ còn là chỗ NỐI: nhận `kind` rồi hỏi đúng nhà máy.
 *
 * ⚠️ VÀ MỖI LOẠI CẢNH VẬT PHẢI CÓ ÍT NHẤT HAI BIẾN THỂ HÌNH HỌC, KHÔNG PHẢI HAI MÀU. Đàm nói rõ:
 * *"mỗi asset nên có 2–4 biến thể hình học, không chỉ đổi màu"*. Một hòn đá đổi màu vẫn là đúng
 * hòn đá ấy; mắt nhận ra sự lặp lại qua HÌNH BÓNG chứ không qua sắc độ — đây chính là bài học đã
 * trả giá ở Phase 5B (15 kỷ nhà cao bằng nhau nhưng khác màu, và Đàm nhìn ra ngay).
 */

import { unit, signed, pickIndex } from '../hashId';
import { prism, countSpecTriangles, specHeight } from './parts';
import { growEraTree } from './flora';

/** Cây thân gỗ — loài do `floraStyle.js` quyết định theo kỷ. */
function tree(seed, era, detail) {
  return growEraTree({ era, seed, detail });
}

/**
 * Bụi thấp. Cùng nhà máy với cây nhưng **KHOÁ CỨNG loài** — không bốc từ bảng loài của kỷ.
 *
 * ⚠️ Bản đầu của Phase 8D để nó bốc từ bảng ấy (có `bush` trong danh sách, kèm cờ `allowBush`), và
 * đo ra thì "bụi" ở kỷ 1 ra **5 khối, 212 tam giác, cao 0,94** — tức một cái cây đủ bộ. Chi tiết
 * ở `floraStyle.js`. Vẫn nhận `era` để lấy hệ số cỡ: bụi ở rừng nguyên sinh to hơn bụi sa mạc.
 */
function bushProp(seed, era, detail) {
  return growEraTree({ era, seed: `${seed}|b`, detail, species: 'bush' });
}

/**
 * Đá. Ba dáng khác nhau — không phải ba cỡ của cùng một dáng.
 *
 * ⚠️ Bản cũ là 1–2 lăng trụ 5 cạnh đặt cạnh nhau, tức một cục sỏi to phóng đại. Đá ngoài đời đọc ra
 * được là nhờ **mặt gãy**: nhiều mảng phẳng nghiêng khác hướng bắt sáng khác nhau. Xếp 2–4 khối
 * lệch tâm, lệch cao độ, XOAY MỖI KHỐI MỘT GÓC KHÁC là cách rẻ nhất có được điều đó — mỗi khối
 * đóng góp một bộ mặt phẳng theo hướng riêng.
 */
function rock(seed, _era, detail) {
  const parts = [];
  const shape = pickIndex(`${seed}|shape`, 3);
  const budget = detail === 'low' ? 2 : 4;

  if (shape === 0) {
    // Một tảng lớn có mặt gãy + vài viên vụn dưới chân.
    const w = 0.26 + unit(`${seed}|w`) * 0.10;
    parts.push(prism({
      y: -0.02, w, h: 0.15 + unit(`${seed}|h`) * 0.09,
      sides: 6, taper: 0.42, ry: unit(`${seed}|r`) * 3, role: 'stone',
    }));
    parts.push(prism({
      x: signed(`${seed}|cx`) * 0.07, z: signed(`${seed}|cz`) * 0.07,
      y: 0.09, w: w * 0.62, h: 0.08 + unit(`${seed}|ch`) * 0.06,
      sides: 5, taper: 0.30, ry: unit(`${seed}|cr`) * 3, role: 'stone',
    }));
    const chips = Math.min(budget - 2, 1 + pickIndex(`${seed}|nc`, 2));
    for (let i = 0; i < chips; i += 1) {
      parts.push(prism({
        x: signed(`${seed}|px${i}`) * 0.22, z: signed(`${seed}|pz${i}`) * 0.22, y: -0.01,
        w: 0.06 + unit(`${seed}|pw${i}`) * 0.05, h: 0.035 + unit(`${seed}|ph${i}`) * 0.03,
        sides: 5, taper: 0.5, ry: unit(`${seed}|pr${i}`) * 3, role: 'stone',
      }));
    }
    return parts;
  }

  if (shape === 1) {
    // Cụm ba tảng chụm nhau, cao thấp rõ rệt.
    const count = Math.min(budget, 3);
    for (let i = 0; i < count; i += 1) {
      const ang = (i / count) * Math.PI * 2 + unit(`${seed}|a`) * 3;
      const reach = 0.09 + unit(`${seed}|d${i}`) * 0.08;
      parts.push(prism({
        x: Math.cos(ang) * reach, z: Math.sin(ang) * reach, y: -0.02,
        w: 0.13 + unit(`${seed}|w${i}`) * 0.11,
        h: 0.08 + unit(`${seed}|h${i}`) * 0.14,
        sides: 5, taper: 0.44 + unit(`${seed}|t${i}`) * 0.24,
        ry: unit(`${seed}|r${i}`) * 3, role: 'stone',
      }));
    }
    return parts;
  }

  // Gờ đá dài nhô lên khỏi mặt đất — đọc ra "mạch đá lộ thiên", không phải hòn cuội.
  const ry = unit(`${seed}|ry`) * Math.PI;
  const count = Math.min(budget, 2 + pickIndex(`${seed}|n`, 2));
  for (let i = 0; i < count; i += 1) {
    const t = count === 1 ? 0 : (i / (count - 1)) - 0.5;
    parts.push(prism({
      x: Math.cos(ry) * t * 0.36, z: Math.sin(ry) * t * 0.36, y: -0.03,
      w: 0.20 + unit(`${seed}|w${i}`) * 0.09, d: 0.11 + unit(`${seed}|d${i}`) * 0.05,
      h: 0.07 + unit(`${seed}|h${i}`) * 0.08,
      sides: 4, taper: 0.55, ry: ry + signed(`${seed}|rr${i}`) * 0.3, role: 'stone',
    }));
  }
  return parts;
}

/**
 * Đèn / cột mốc — BỐN dáng theo thời đại, không phải một cái cột đổi màu.
 *
 * ⚠️ Bản cũ chia đúng hai nhánh (`era >= 10` hay không) và cả hai đều là "một que + một khối trên
 * đỉnh". Chiếu sáng đô thị là một trong những thứ đổi hình dáng rõ nhất qua các thời đại — chậu
 * lửa trên cột đá, lồng đèn treo khung gỗ, đèn khí có tay đưa ngang, đèn phố cần cong — nên nó là
 * chỗ rẻ tiền nhất để nói "đây là thời nào".
 *
 * Không dùng `seed` cho HÌNH DÁNG (chỉ dùng cho vài lệch nhỏ): đèn đường phải ĐỀU NHAU — chỗ này
 * lệch lạc thì mất luôn cảm giác quy hoạch, và đó lại đúng là thứ phân biệt phố với rừng.
 */
function lamp(seed, era, detail) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const parts = [];
  const skew = signed(`${seed}|k`) * 0.012;   // xiêu vẹo rất nhẹ — đủ để không như in hàng loạt

  if (eraNum <= 3) {
    // Chậu lửa trên bệ đá: bệ loe, thân cột hẹp, MIỆNG CHẬU loe ra rồi mới tới ngọn lửa.
    // ⚠️ `taper` chỉ thóp LÊN được (`parts.js` kẹp về 0…1) — không có cách nào khai một khối loe
    // rộng dần lên trên. Nên cái miệng chậu phải làm bằng một khối RỘNG HƠN đặt chồng lên thân
    // hẹp: chính cái bậc thò ra ấy mới là thứ mắt đọc ra thành vành chậu.
    parts.push(prism({ y: 0, w: 0.19, h: 0.07, sides: 6, taper: 0.78, role: 'stone' }));
    parts.push(prism({ y: 0.07, w: 0.10, h: 0.15, sides: 6, taper: 1, role: 'stone' }));
    parts.push(prism({ x: skew, y: 0.21, w: 0.17, h: 0.06, sides: 6, taper: 0.84, role: 'stone' }));
    parts.push(prism({ x: skew, y: 0.26, w: 0.11, h: 0.14, sides: 5, taper: 0, role: 'gold' }));
    return parts;
  }

  if (eraNum <= 7) {
    // Lồng đèn treo trên khung gỗ: cột + thanh ngang + đèn treo lệch khỏi trục cột.
    parts.push(prism({ y: 0, w: 0.05, h: 0.40, sides: 4, taper: 0.86, role: 'wood' }));
    parts.push(prism({ x: 0.06 + skew, y: 0.38, w: 0.17, d: 0.04, h: 0.035, sides: 4, role: 'wood' }));
    parts.push(prism({ x: 0.12 + skew, y: 0.28, w: 0.10, h: 0.11, sides: 6, taper: 0.9, role: 'gold' }));
    if (detail !== 'low') {
      parts.push(prism({ x: 0.12 + skew, y: 0.385, w: 0.11, h: 0.035, sides: 6, taper: 0.5, role: 'wood' }));
    }
    return parts;
  }

  if (eraNum <= 11) {
    // Đèn khí thời công nghiệp: cột gang có đốt, tay đưa ngang, bóng hình chuông.
    parts.push(prism({ y: 0, w: 0.075, h: 0.06, sides: 6, taper: 0.80, role: 'stone' }));
    parts.push(prism({ y: 0.06, w: 0.045, h: 0.34, sides: 6, taper: 0.90, role: 'stone' }));
    parts.push(prism({ x: 0.05 + skew, y: 0.39, w: 0.13, d: 0.035, h: 0.03, sides: 4, role: 'stone' }));
    // Bóng đèn khí hình chuông: rộng ở dưới, thóp lên trên — đúng chiều `taper` diễn tả được.
    parts.push(prism({ x: 0.10 + skew, y: 0.30, w: 0.10, h: 0.10, sides: 6, taper: 0.52, role: 'gold' }));
    if (detail !== 'low') {
      parts.push(prism({ x: 0.10 + skew, y: 0.40, w: 0.06, h: 0.05, sides: 6, taper: 0.2, role: 'stone' }));
    }
    return parts;
  }

  // Đèn phố hiện đại: cột trơn cao, cần vươn ngang, chao đèn dẹt hướng xuống.
  parts.push(prism({ y: 0, w: 0.065, h: 0.045, sides: 8, taper: 0.75, role: 'stone' }));
  parts.push(prism({ y: 0.04, w: 0.036, h: 0.46, sides: 8, taper: 0.92, role: 'stone' }));
  parts.push(prism({ x: 0.08 + skew, y: 0.48, w: 0.19, d: 0.03, h: 0.028, sides: 4, role: 'stone' }));
  parts.push(prism({ x: 0.16 + skew, y: 0.445, w: 0.11, d: 0.06, h: 0.035, sides: 4, taper: 0.7, role: 'gold' }));
  return parts;
}

/**
 * Mặt nước: một mảng thấp hơn mặt đất, viền đá LÔ NHÔ.
 *
 * ⚠️ Bản cũ là hai hình vuông hoàn hảo lồng nhau, và một hình vuông hoàn hảo giữa cánh đồng thì
 * đọc ra "ô lưới bị tô màu khác", không đọc ra "cái ao". Viền nay là 4–6 khối đá rời quanh mép,
 * mỗi khối một cỡ và một góc xoay — đó là thứ phá vỡ đường thẳng.
 *
 * Vẫn KHÔNG gợn sóng và mặt nước vẫn vuông theo ô lưới: ao méo mó ngẫu nhiên trông như lỗi dựng
 * hình, còn tĩnh lặng thì mới ra cảm giác yên.
 */
function water(seed, _era, detail) {
  const parts = [
    prism({ y: -0.02, w: 0.86, d: 0.86, h: 0.06, sides: 4, role: 'water' }),
    prism({ y: -0.035, w: 0.95, d: 0.95, h: 0.04, sides: 4, role: 'stone' }),
  ];
  if (detail === 'low') return parts;

  const stones = 4 + pickIndex(`${seed}|n`, 3);
  for (let i = 0; i < stones; i += 1) {
    const ang = (i / stones) * Math.PI * 2 + unit(`${seed}|a`) * 2;
    parts.push(prism({
      x: Math.cos(ang) * 0.47, z: Math.sin(ang) * 0.47, y: -0.02,
      w: 0.11 + unit(`${seed}|w${i}`) * 0.09,
      h: 0.045 + unit(`${seed}|h${i}`) * 0.05,
      sides: 5, taper: 0.5, ry: unit(`${seed}|r${i}`) * 3, role: 'stone',
    }));
  }
  return parts;
}

/**
 * Ruộng / vườn — BA kiểu canh tác theo vùng khí hậu của kỷ, không phải bốn thanh giống hệt nhau.
 *
 * ⚠️ Bản cũ là 4 khối chữ nhật song song cao bằng nhau, và trong ảnh chụp nó đọc ra thành "mấy cái
 * ghế băng xanh" chứ không ra thửa ruộng. Ba thứ đang thiếu, và cả ba đều rẻ: (a) luống KHÔNG cao
 * bằng nhau — ruộng thật gợn lên xuống; (b) có BỜ RUỘNG viền quanh — cái khung mới nói "đây là một
 * thửa, có người trông"; (c) luống phải chạm nhau ở gốc, hở ra thì thành vật thể rời.
 */
function field(seed, era, detail) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const flooded = eraNum === 4 || eraNum === 6 || eraNum === 13;   // ruộng nước Á Đông
  const vineyard = eraNum === 7 || eraNum === 8 || eraNum === 9;   // vườn nho có cọc chống
  const parts = [];
  const ry = unit(`${seed}|dir`) > 0.5 ? Math.PI / 2 : 0;
  const along = (t) => (ry ? { x: 0, z: t } : { x: t, z: 0 });

  // Bờ ruộng: bốn thanh đất thấp viền quanh. Đây là thứ biến "mấy cái thanh" thành "một thửa".
  for (let i = 0; i < 4; i += 1) {
    const side = i % 2 === 0 ? 1 : -1;
    const cross = i < 2;
    parts.push(prism({
      x: cross ? side * 0.44 : 0, z: cross ? 0 : side * 0.44, y: -0.01,
      w: cross ? 0.09 : 0.94, d: cross ? 0.94 : 0.09,
      h: 0.055 + unit(`${seed}|e${i}`) * 0.02,
      sides: 4, role: 'stone',
    }));
  }

  if (flooded) {
    // Ruộng nước: mặt nước nông trong khung bờ, vài chòm mạ nhô lên.
    parts.push(prism({ y: 0, w: 0.80, d: 0.80, h: 0.035, sides: 4, role: 'water' }));
    const clumps = detail === 'low' ? 3 : 6;
    for (let i = 0; i < clumps; i += 1) {
      const p = along(((i / (clumps - 1)) - 0.5) * 0.64);
      parts.push(prism({
        x: p.x + (ry ? signed(`${seed}|o${i}`) * 0.22 : 0),
        z: p.z + (ry ? 0 : signed(`${seed}|o${i}`) * 0.22),
        y: 0.02,
        w: ry ? 0.62 : 0.07, d: ry ? 0.07 : 0.62,
        h: 0.045 + unit(`${seed}|h${i}`) * 0.03,
        sides: 4, role: 'leaf',
      }));
    }
    return parts;
  }

  const rows = detail === 'low' ? 3 : 4 + pickIndex(`${seed}|n`, 2);
  for (let i = 0; i < rows; i += 1) {
    const p = along(((i / (rows - 1)) - 0.5) * 0.70);
    parts.push(prism({
      x: p.x, z: p.z, y: 0,
      w: ry ? 0.82 : 0.12, d: ry ? 0.12 : 0.82,
      // Luống cao thấp KHÁC NHAU — đây là điểm khác quan trọng nhất so với bản cũ.
      h: 0.045 + unit(`${seed}|h${i}`) * 0.055,
      sides: 4,
      role: i % 2 === 0 ? 'leaf' : 'leaf2',
    }));
    if (vineyard && detail !== 'low' && i % 2 === 0) {
      // Cọc chống giàn nho: hai cột gỗ đầu luống. Nét nhận dạng của vườn nho Địa Trung Hải.
      for (const end of [-1, 1]) {
        parts.push(prism({
          x: p.x + (ry ? end * 0.38 : 0), z: p.z + (ry ? 0 : end * 0.38), y: 0,
          w: 0.03, h: 0.17 + unit(`${seed}|p${i}${end}`) * 0.05,
          sides: 4, taper: 0.85, role: 'wood',
        }));
      }
    }
  }
  return parts;
}

const BUILDERS = { tree, bush: bushProp, rock, lamp, water, field };

/**
 * Mô tả hình học cho MỘT cảnh vật.
 *
 * @param {object} input
 * @param {string} input.kind  một giá trị của `PROP_KINDS` (loại lạ → cây)
 * @param {number} input.era
 * @param {string} input.seed  khoá băm — phải ổn định theo ô lưới để cây không nhảy chỗ
 * @param {'high'|'low'} [input.detail]  máy yếu → `low` (ít thuỳ, bỏ chi tiết phụ)
 * @returns {{parts:Array, height:number, triangles:number}}
 */
export function buildPropSpec({ kind, era, seed = 'p', detail = 'high' } = {}) {
  const build = BUILDERS[kind] ?? BUILDERS.tree;
  const parts = build(seed, Number.isFinite(era) ? era : 1, detail);
  return { parts, height: specHeight(parts), triangles: countSpecTriangles(parts) };
}

/** Các loại cảnh vật mà bộ vẽ 3D dựng được — dùng cho test và cho việc bỏ sót kiểu mới. */
export const PROP_KINDS = Object.keys(BUILDERS);
