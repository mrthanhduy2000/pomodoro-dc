/**
 * groundCover.js — HÌNH của bảy kiểu dùng đất khai ở `groundCoverStyle.js`.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ LUẬT SỐ 1 — RỘNG VÀ THẤP, NGƯỢC HẲN VỚI CÂY. Một mảng phủ phải chiếm gần trọn ô lưới, vì
 * mục đích duy nhất của cả phase này là **lấp đất trống ở khung TOÀN CẢNH** (46,2% khung hình ở 20
 * phiên — xem `groundCoverStyle.js`). Một vật thể nhỏ giữa ô thì che vài phần trăm ô ấy rồi thôi,
 * đúng thứ Phase 8D đã chứng minh là không lấp được đất. Cao thì ngược lại: cao quá sẽ che nhà và
 * biến "mảnh đất được dùng" thành "một công trình nữa", tức đi lạc sang việc của `buildingSpec`.
 *
 * ⚠️ LUẬT SỐ 2 — CHỈ BỐN VAI MÀU, VÀ CẢ BỐN ĐỀU MIỄN PHÍ VỀ LỆNH VẼ:
 *   `stone` · `wood` · `leaf` → ba vai ánh xạ THẲNG (`ROLE_FAMILY` ở `materials.js`) sang
 *      `stone`/`wood`/`foliage`, và cả ba họ ấy có mặt ở **15/15 kỷ** (đã đếm).
 *   `wall`  → rơi vào `style.wallMaterial`, tức **vật liệu tường của CHÍNH kỷ đó** — theo định
 *      nghĩa thì họ ấy đã có sẵn trong kỷ, nên nó cũng không thể đẻ ra lệnh vẽ mới. Và nó đúng về
 *      mặt kể chuyện: bức tường quây sân được xây bằng đúng thứ xây nhà.
 * ⚠️ **CẤM `water`** dù ao/bể nghe rất hợp: `water` chỉ có ở 7/15 kỷ, thêm nó vào 8 kỷ còn lại là
 * âm thầm mua 8 lệnh vẽ. `drawCallBudget.test.js` sẽ đỏ, nhưng đừng để nó phải đỏ.
 *
 * ⚠️ LUẬT SỐ 3 — MỖI KIỂU PHẢI CÓ ÍT NHẤT HAI BIẾN THỂ HÌNH HỌC, KHÔNG PHẢI HAI MÀU. Luật cũ của
 * Đàm, đã trả giá ở Phase 5B: mắt nhận ra sự lặp lại qua HÌNH BÓNG chứ không qua sắc độ.
 */

import { unit, signed, pickIndex } from '../hashId';
import { prism } from './parts';

/** Bề dày của một mảng nền. Đủ dày để mắt đọc ra một mặt phẳng KHÁC mặt đất, không thành cái bục. */
const SAN_DAY = 0.045;

/**
 * `enclose` (0…1) → bao nhiêu cạnh được quây, và quây cao bao nhiêu.
 *
 * ⚠️ TÁCH LÀM HAI CHỨ KHÔNG MỘT — vì "quây mấy phía" và "tường cao bao nhiêu" là hai câu hỏi khác
 * nhau mà ngoài đời không đi cùng nhau: piazza Ý mở toang bốn phía nhưng có bó vỉa đá cao; sân tứ
 * hợp viện quây kín bốn phía bằng tường thấp ngang vai. Gộp vào một con số là đúng cái bẫy "một
 * trường gánh hai việc" đã cắn dự án năm lần.
 */
function quay(enclose) {
  const soCanh = Math.max(0, Math.min(4, Math.round(enclose * 4)));
  // Quây kín thì tường cao hơn (0,26), quây hờ thì chỉ là bó vỉa (0,08).
  const cao = 0.07 + enclose * 0.20;
  return { soCanh, cao };
}

/**
 * Bốn cạnh của một ô vuông cạnh `w`, lấy `soCanh` cạnh đầu theo thứ tự xoay được bởi hạt giống.
 * Trả về mô tả để bên gọi tự chọn vai màu và bề dày.
 *
 * ⚠️ `day` LÀ BẮT BUỘC PHẢI TRUYỀN ĐÚNG, và đây là lý do. Bản đầu đặt hàng rào ở đúng `±w/2`, tức
 * nó NẰM VẮT QUA mép mảng: một nửa bề dày thò ra ngoài. Với kỷ có `scale` lớn nhất (1,1) thì mảng
 * đã rộng `0,946` ô, cộng nửa bề rào `0,05` thành `0,523` — **vượt nửa ô**, tức hàng rào cắm sang
 * ô hàng xóm. Con số nhỏ (một phần trăm ô) nên nhìn ảnh không thấy, và nó chỉ lộ ra khi bài
 * `NẰM GỌN TRONG Ô` (`groundCover.test.js`) hỏi thẳng bằng số. Nay hàng rào lùi vào `w/2 − day/2`
 * ⇒ mép NGOÀI của rào trùng đúng mép mảng, và cả mảng phủ nằm trọn trong ô ở mọi kỷ.
 */
function canhVien(w, soCanh, batDau, day = 0) {
  const nua = w / 2 - day / 2;
  const canh = [
    { x: 0, z: -nua, doc: true },
    { x: nua, z: 0, doc: false },
    { x: 0, z: nua, doc: true },
    { x: -nua, z: 0, doc: false },
  ];
  const out = [];
  for (let i = 0; i < soCanh; i += 1) out.push(canh[(batDau + i) % 4]);
  return out;
}

/** Mảng nền — thứ làm nên phần lớn diện tích bị che. Luôn là khối đầu tiên của mọi kiểu. */
function nen(w, role, y = -0.005, day = SAN_DAY) {
  return prism({ y, w, d: w, h: day, sides: 4, role });
}

/**
 * SÂN — mảng nền có bó vỉa/tường quây. Kiểu phổ quát nhất, và cũng là kiểu "nền" của bảng: kỷ nào
 * không có gì đặc biệt để nói về mảnh đất bên nhà thì nó vẫn có một cái sân.
 */
function yard(seed, w, enc, detail) {
  const parts = [];
  const { soCanh, cao } = quay(enc);
  const bien = pickIndex(`${seed}|v`, 2);

  if (bien === 0) {
    // Sân lát phẳng có tường quây — tứ hợp viện, cortile, sân trong Ả Rập.
    parts.push(nen(w, 'stone'));
    for (const c of canhVien(w, soCanh, pickIndex(`${seed}|r`, 4), 0.10)) {
      parts.push(prism({
        x: c.x, z: c.z, y: 0,
        w: c.doc ? w : 0.10, d: c.doc ? 0.10 : w,
        h: cao * (0.85 + unit(`${seed}|h${c.x}${c.z}`) * 0.3),
        sides: 4, role: 'wall',
      }));
    }
    if (detail !== 'low') {
      // Một chậu/bồn ở góc — thứ nói cho mắt biết đây là chỗ có người dùng, không phải sân bỏ hoang.
      const g = w * 0.30;
      parts.push(prism({
        x: signed(`${seed}|px`) * g, z: signed(`${seed}|pz`) * g, y: SAN_DAY,
        w: 0.14, h: 0.11, sides: 6, taper: 0.82, role: 'stone',
      }));
      parts.push(prism({
        x: signed(`${seed}|px`) * g, z: signed(`${seed}|pz`) * g, y: SAN_DAY + 0.10,
        w: 0.15, h: 0.09, sides: 6, taper: 0.7, role: 'leaf',
      }));
    }
  } else {
    // Sân có ô trũng giữa (bể cạn cạn/ô thoát nước) — mặt nền chia thành viền và lòng, nên nhìn
    // từ trên xuống nó ĐỌC RA HAI MẢNG chứ không phải một mặt phẳng trơn.
    parts.push(nen(w, 'stone'));
    parts.push(prism({ y: SAN_DAY - 0.012, w: w * 0.52, d: w * 0.52, h: 0.03, sides: 4, role: 'wall' }));
    for (const c of canhVien(w, Math.min(2, soCanh), pickIndex(`${seed}|r`, 4), 0.09)) {
      parts.push(prism({
        x: c.x, z: c.z, y: 0,
        w: c.doc ? w : 0.09, d: c.doc ? 0.09 : w,
        h: cao, sides: 4, role: 'wall',
      }));
    }
  }
  return parts;
}

/** VƯỜN CÓ RÀO — luống cây trong một vòng rào. Trục bản sắc: rào gỗ hay bó vỉa đá, luống hay cụm. */
function garden(seed, w, enc, detail) {
  const parts = [];
  const { soCanh, cao } = quay(enc);
  const bien = pickIndex(`${seed}|v`, 2);
  const raoGo = unit(`${seed}|f`) > 0.45;
  parts.push(nen(w, 'stone'));

  // Rào: cọc rời (gỗ) hay dải liền (đá). Hai hình bóng khác hẳn nhau khi nhìn nghiêng.
  for (const c of canhVien(w, soCanh, pickIndex(`${seed}|r`, 4), raoGo ? 0.045 : 0.08)) {
    if (raoGo) {
      const soCoc = detail === 'low' ? 3 : 5;
      for (let i = 0; i < soCoc; i += 1) {
        const t = ((i / (soCoc - 1)) - 0.5) * w * 0.92;
        parts.push(prism({
          x: c.doc ? t : c.x, z: c.doc ? c.z : t, y: 0,
          w: 0.045, h: cao * 1.25, sides: 4, role: 'wood',
        }));
      }
      parts.push(prism({
        x: c.x, z: c.z, y: cao * 0.85,
        w: c.doc ? w * 0.94 : 0.035, d: c.doc ? 0.035 : w * 0.94,
        h: 0.035, sides: 4, role: 'wood',
      }));
    } else {
      parts.push(prism({
        x: c.x, z: c.z, y: 0,
        w: c.doc ? w : 0.08, d: c.doc ? 0.08 : w,
        h: cao * 0.6, sides: 4, role: 'stone',
      }));
    }
  }

  if (bien === 0) {
    // Luống thẳng hàng — vườn rau, vườn cắt tỉa kiểu Pháp.
    const doc = unit(`${seed}|d`) > 0.5;
    const soLuong = detail === 'low' ? 2 : 4;
    for (let i = 0; i < soLuong; i += 1) {
      const t = ((i + 0.5) / soLuong - 0.5) * w * 0.78;
      parts.push(prism({
        x: doc ? t : 0, z: doc ? 0 : t, y: SAN_DAY,
        w: doc ? w * 0.13 : w * 0.80, d: doc ? w * 0.80 : w * 0.13,
        h: 0.06 + unit(`${seed}|lh${i}`) * 0.05, sides: 4, role: 'leaf',
      }));
    }
  } else {
    // Cụm rời trên nền sỏi — vườn khô Nhật, vườn đá.
    const soCum = detail === 'low' ? 2 : 4;
    for (let i = 0; i < soCum; i += 1) {
      parts.push(prism({
        x: signed(`${seed}|cx${i}`) * w * 0.30, z: signed(`${seed}|cz${i}`) * w * 0.30,
        y: SAN_DAY, w: 0.16 + unit(`${seed}|cw${i}`) * 0.12,
        h: 0.07 + unit(`${seed}|ch${i}`) * 0.07,
        sides: 5 + pickIndex(`${seed}|cs${i}`, 3), taper: 0.6, role: 'leaf',
      }));
    }
  }
  return parts;
}

/** SÂN PHƠI — nền phẳng + giàn/sào + mẻ hàng trải ra. Kiểu "đang có người làm việc ở đây". */
function drying(seed, w, enc, detail) {
  const parts = [];
  const { soCanh, cao } = quay(enc * 0.6);       // sân phơi ít khi quây kín — phải đón nắng
  const bien = pickIndex(`${seed}|v`, 2);
  const doc = unit(`${seed}|d`) > 0.5;
  parts.push(nen(w, 'stone'));

  for (const c of canhVien(w, Math.min(2, soCanh), pickIndex(`${seed}|r`, 4), 0.07)) {
    parts.push(prism({
      x: c.x, z: c.z, y: 0,
      w: c.doc ? w : 0.07, d: c.doc ? 0.07 : w,
      h: cao * 0.7, sides: 4, role: 'stone',
    }));
  }

  if (bien === 0) {
    // Mẻ hàng trải thành dải trên nền — lúa, cá, muối, thóc.
    const soDai = detail === 'low' ? 2 : 4;
    for (let i = 0; i < soDai; i += 1) {
      const t = ((i + 0.5) / soDai - 0.5) * w * 0.74;
      parts.push(prism({
        x: doc ? t : 0, z: doc ? 0 : t, y: SAN_DAY,
        w: doc ? w * 0.12 : w * 0.76, d: doc ? w * 0.76 : w * 0.12,
        h: 0.035, sides: 4, role: 'wood',
      }));
    }
  } else {
    // Giàn phơi: hai cột + sào ngang, hàng vải/lưới rủ xuống. Đây là biến thể có CHIỀU CAO, nên
    // nó phá đường viền phẳng của mảng — thứ duy nhất trong kiểu này đọc được từ xa khi nhìn nghiêng.
    const soGian = detail === 'low' ? 1 : 2;
    for (let g = 0; g < soGian; g += 1) {
      const off = (g - (soGian - 1) / 2) * w * 0.42;
      const caoGian = 0.30 + unit(`${seed}|gh${g}`) * 0.10;
      for (const s of [-1, 1]) {
        parts.push(prism({
          x: doc ? off : s * w * 0.36, z: doc ? s * w * 0.36 : off, y: 0,
          w: 0.05, h: caoGian, sides: 4, role: 'wood',
        }));
      }
      parts.push(prism({
        x: doc ? off : 0, z: doc ? 0 : off, y: caoGian,
        w: doc ? 0.04 : w * 0.78, d: doc ? w * 0.78 : 0.04,
        h: 0.04, sides: 4, role: 'wood',
      }));
      if (detail !== 'low') {
        parts.push(prism({
          x: doc ? off : 0, z: doc ? 0 : off, y: caoGian - 0.16,
          w: doc ? 0.03 : w * 0.52, d: doc ? w * 0.52 : 0.03,
          h: 0.16, sides: 4, role: 'wall',
        }));
      }
    }
  }
  return parts;
}

/** BÃI QUÂY — khoảng đất bị giẫm nát, rào thưa, máng ăn. Rỗng ở giữa: đó CHÍNH LÀ hình của nó. */
function pen(seed, w, enc, detail) {
  const parts = [];
  const { cao } = quay(Math.max(0.4, enc));
  const bien = pickIndex(`${seed}|v`, 2);
  // Nền thấp hơn mặt đất một chút — đất bị giẫm lún, và nó cho mảng một cái viền tối đọc được.
  parts.push(nen(w, 'stone', -0.02, 0.05));

  const soCanh = bien === 0 ? 4 : 3;             // quây kín hay chừa một lối vào
  const soCoc = detail === 'low' ? 3 : 4;
  for (const c of canhVien(w, soCanh, pickIndex(`${seed}|r`, 4), 0.05)) {
    for (let i = 0; i < soCoc; i += 1) {
      const t = ((i / (soCoc - 1)) - 0.5) * w * 0.9;
      parts.push(prism({
        x: c.doc ? t : c.x, z: c.doc ? c.z : t, y: 0,
        w: 0.05, h: cao * 1.5, sides: 4, role: 'wood',
      }));
    }
    parts.push(prism({
      x: c.x, z: c.z, y: cao,
      w: c.doc ? w * 0.92 : 0.03, d: c.doc ? 0.03 : w * 0.92,
      h: 0.035, sides: 4, role: 'wood',
    }));
  }
  if (detail !== 'low') {
    // Máng ăn dựa vào một cạnh — chi tiết duy nhất nói đây là bãi NUÔI chứ không phải bãi bỏ hoang.
    parts.push(prism({
      x: signed(`${seed}|mx`) * w * 0.28, z: signed(`${seed}|mz`) * w * 0.28, y: SAN_DAY,
      w: w * 0.34, d: 0.11, h: 0.08, sides: 4,
      ry: unit(`${seed}|mr`) > 0.5 ? Math.PI / 2 : 0, role: 'wood',
    }));
  }
  return parts;
}

/** ĐỐNG RƠM / KHO NGOÀI TRỜI — vật chất chất cao trên bệ kê. Kiểu "cao" nhất trong bảy kiểu. */
function stack(seed, w, _enc, detail) {
  const parts = [];
  const bien = pickIndex(`${seed}|v`, 2);
  parts.push(nen(w * 0.86, 'stone'));
  // Bệ kê bằng gỗ — thứ giữ đống hàng khỏi đất ẩm, và cũng là thứ cho mảng một mặt phẳng thứ hai.
  parts.push(prism({ y: SAN_DAY, w: w * 0.68, d: w * 0.68, h: 0.05, sides: 4, role: 'wood' }));

  if (bien === 0) {
    // Đống chóp: rơm, cỏ khô, than. Một đến ba chóp cao thấp khác nhau.
    const soDong = detail === 'low' ? 1 : 2 + pickIndex(`${seed}|n`, 2);
    for (let i = 0; i < soDong; i += 1) {
      const r = w * (0.34 - i * 0.05);
      parts.push(prism({
        x: signed(`${seed}|dx${i}`) * w * 0.18, z: signed(`${seed}|dz${i}`) * w * 0.18,
        y: SAN_DAY + 0.05, w: r, h: 0.22 + unit(`${seed}|dh${i}`) * 0.16,
        sides: 6 + pickIndex(`${seed}|ds${i}`, 3), taper: 0.18, role: 'wood',
      }));
    }
  } else {
    // Xếp khối: củi bổ, thùng, kiện hàng. Đường viền GÃY KHÚC, khác hẳn chóp tròn ở biến thể trên.
    const soTang = detail === 'low' ? 1 : 2;
    for (let t = 0; t < soTang; t += 1) {
      const so = 2 + pickIndex(`${seed}|k${t}`, 2);
      for (let i = 0; i < so; i += 1) {
        const b = w * 0.60 / so;
        parts.push(prism({
          x: ((i + 0.5) / so - 0.5) * w * 0.60,
          z: signed(`${seed}|kz${t}${i}`) * w * 0.10,
          y: SAN_DAY + 0.05 + t * 0.17,
          w: b * 0.9, d: b * (1.1 + unit(`${seed}|kd${t}${i}`) * 0.5),
          h: 0.16, sides: 4,
          ry: signed(`${seed}|kr${t}${i}`) * 0.18, role: 'wood',
        }));
      }
    }
  }
  return parts;
}

/**
 * GIẾNG — thành giếng tròn + khung kéo nước. Kiểu NHỎ nhất trong bảy kiểu, và điều đó là có chủ ý:
 * một cái giếng ngoài đời cũng nhỏ. Nó bù lại bằng cái sân lát quanh miệng giếng, thứ mới thật sự
 * lấp đất — nếu không có cái sân ấy thì kiểu này không đủ tư cách nằm trong một phase toàn cảnh.
 */
function well(seed, w, enc, detail) {
  const parts = [];
  const bien = pickIndex(`${seed}|v`, 2);
  parts.push(nen(w * 0.94, 'stone'));
  // Vành sân quanh giếng, lát khác nền — hai vòng đồng tâm đọc rất rõ khi nhìn từ trên xuống.
  parts.push(prism({ y: SAN_DAY - 0.01, w: w * 0.60, h: 0.03, sides: 10, role: 'wall' }));
  // Thành giếng.
  parts.push(prism({
    y: SAN_DAY, w: w * 0.30, h: 0.13 + enc * 0.06,
    sides: 9 + pickIndex(`${seed}|s`, 3), taper: 0.94, role: 'stone',
  }));

  if (detail === 'low') return parts;
  if (bien === 0) {
    // Khung kéo nước hai cột + xà ngang.
    const cao = 0.34 + unit(`${seed}|h`) * 0.08;
    for (const s of [-1, 1]) {
      parts.push(prism({ x: s * w * 0.20, y: SAN_DAY, w: 0.05, h: cao, sides: 4, role: 'wood' }));
    }
    parts.push(prism({ y: SAN_DAY + cao, w: w * 0.50, d: 0.05, h: 0.05, sides: 4, role: 'wood' }));
  } else {
    // Cần vọt: một cột nghiêng dài — hình bóng hoàn toàn khác khung hai cột.
    parts.push(prism({ x: w * 0.26, y: SAN_DAY, w: 0.06, h: 0.40, sides: 4, role: 'wood' }));
    parts.push(prism({
      x: w * 0.06, y: SAN_DAY + 0.36, w: w * 0.66, d: 0.05, h: 0.05,
      sides: 4, ry: signed(`${seed}|r`) * 0.28, role: 'wood',
    }));
  }
  return parts;
}

/** QUẢNG TRƯỜNG / BÃI LÁT — mảng lát RỘNG nhất, không rào. Kiểu che nhiều đất nhất trong bảy kiểu. */
function plaza(seed, w, enc, detail) {
  const parts = [];
  const bien = pickIndex(`${seed}|v`, 2);
  parts.push(nen(w, 'stone'));
  // Bó vỉa — quảng trường mở toang bốn phía nhưng vẫn có mép đá cao, đúng lý do `quay()` tách đôi.
  for (const c of canhVien(w, 4, 0, 0.07)) {
    parts.push(prism({
      x: c.x, z: c.z, y: 0,
      w: c.doc ? w : 0.07, d: c.doc ? 0.07 : w,
      h: 0.055 + enc * 0.05, sides: 4, role: 'stone',
    }));
  }
  if (detail === 'low') return parts;
  if (bien === 0) {
    // Bậc thềm giữa quảng trường — hai bậc đồng tâm.
    parts.push(prism({ y: SAN_DAY, w: w * 0.46, d: w * 0.46, h: 0.05, sides: 4, role: 'wall' }));
    parts.push(prism({ y: SAN_DAY + 0.05, w: w * 0.30, d: w * 0.30, h: 0.05, sides: 4, role: 'wall' }));
  } else {
    // Dải lát chạy chéo + hai bồn cây mép — nét quy hoạch hiện đại.
    parts.push(prism({
      y: SAN_DAY, w: w * 0.86, d: w * 0.20, h: 0.02, sides: 4,
      ry: Math.PI / 4 + signed(`${seed}|r`) * 0.2, role: 'wall',
    }));
    for (const s of [-1, 1]) {
      parts.push(prism({
        x: s * w * 0.32, z: s * w * 0.30, y: SAN_DAY, w: 0.18, d: 0.18, h: 0.09,
        sides: 4, role: 'stone',
      }));
      parts.push(prism({
        x: s * w * 0.32, z: s * w * 0.30, y: SAN_DAY + 0.09, w: 0.19, d: 0.19, h: 0.08,
        sides: 5, taper: 0.7, role: 'leaf',
      }));
    }
  }
  return parts;
}

const BUILDERS = { yard, garden, drying, pen, stack, well, plaza };

/**
 * Dựng mô tả khối cho MỘT mảng phủ đất.
 *
 * ⚠️ Kiểu lạ → trả về MẢNG RỖNG, không rơi về một kiểu mặc định. Rơi về mặc định là cách một bảng
 * 15 dòng lặng lẽ thoái hoá (bẫy `MIN_STONE` ở Phase 9D), và ở đây nó còn tệ hơn: một kỷ khai sai
 * sẽ mọc đầy sân kiểu kỷ khác mà không gì đỏ lên. Rỗng thì `groundCoverStyle.test.js` đếm được.
 *
 * @param {object} input
 * @param {string} input.kind    một trong `COVER_KINDS`
 * @param {number} input.scale   cỡ mảng (từ bảng của kỷ), 0,7…1,1
 * @param {number} input.enclose mức quây (từ bảng của kỷ), 0…1
 * @param {string} input.seed    hạt giống tất định
 * @param {string} [input.detail] 'high' | 'low'
 */
export function buildGroundCover({ kind, scale = 1, enclose = 0.5, seed = 'gc', detail = 'high' } = {}) {
  const build = BUILDERS[kind];
  if (!build) return [];
  // 0,86 là bề rộng cơ sở của một mảng phủ: chừa một vành đất hẹp quanh mép ô để hai mảng kề nhau
  // KHÔNG dính vào nhau thành một mặt sàn liền — thứ sẽ xoá mất chính cái lưới mà mắt đang đọc.
  const w = 0.86 * (Number.isFinite(scale) ? scale : 1);
  const enc = Number.isFinite(enclose) ? Math.max(0, Math.min(1, enclose)) : 0.5;
  return build(seed, w, enc, detail);
}
