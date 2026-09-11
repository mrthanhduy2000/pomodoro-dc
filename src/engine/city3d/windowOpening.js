/**
 * windowOpening.js — MỘT Ô CỬA SỔ LÀ MỘT CÁI HỐC, KHÔNG PHẢI MỘT MIẾNG DÁN.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI (round 53) — VÀ CHÍNH `buildingSpec.js` ĐÃ CHẨN ĐOÁN ĐÚNG TỪ LÂU
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Khối chú thích "KHỐI KIẾN TRÚC" ở đầu `buildingSpec.js` viết nguyên văn:
 *
 *   *"cửa sổ cũ trông như miếng dán: chúng thò RA khỏi tường 0,035 chứ không lõm vào. Một ô kính
 *   nhô lên trên mặt tường thì mắt đọc ra 'cái nhãn dán', không đọc ra 'cái lỗ'. […] cách đúng là
 *   dựng KHUNG quanh nó thò ra XA HƠN — mắt suy ra chiều sâu từ bóng của khung."*
 *
 * Chẩn đoán đúng, và bản vá chỉ làm được MỘT NỬA: nó dựng bệ (dưới) và lanh tô (trên), nhưng
 * **không bao giờ dựng hai MÁ CỬA hai bên**. Mà má cửa mới là vế quan trọng nhất, vì lý do hình
 * học chứ không phải thẩm mỹ: **mặt trời đứng ở MỘT BÊN**. Một cái gờ ngang cho ô cửa một vệt tối
 * mỏng ở trên và một ở dưới — cùng độ đậm trên mọi ô cửa của mọi mặt tường. Hai má cửa đứng thì
 * má bên này ăn nắng, má bên kia đổ bóng vào lòng hốc, và **cặp sáng–tối ấy đổi theo hướng mặt
 * tường**. Đó chính là thứ làm bốn mặt của một khối hộp đọc ra khác nhau.
 *
 * ⚠️ KHÔNG ĐỤC LỖ ĐƯỢC, VÀ KHÔNG CẦN ĐỤC. Thân nhà là một khối ĐẶC trong một lưới đã gộp; không
 * có phép trừ khối nào ở đây. Nhưng mắt không đo chiều sâu — nó đọc BÓNG. Một cái khung bốn cạnh
 * thò ra `reveal`, với ô kính nằm gần sát mặt tường, cho ra đúng cùng một bộ bóng như một cái lỗ
 * khoét sâu `reveal` vào tường. Đây không phải mẹo vặt: đó là nguyên lý của phù điêu, và nó đúng
 * ở mọi góc trừ góc nhìn gần như song song với mặt tường.
 *
 * ⚠️ HAI CÁI BẪY ĐO ĐẠC PHẢI NHỚ (luật vòng 53, và cả hai đã cắn dự án thật):
 *   1. `specSpan` lấy `max(w/2, d/2)` — KHÔNG lấy chiều sâu. Một chi tiết thò ra theo trục z sẽ
 *      được đo như thể nó cũng rộng bằng chừng ấy theo x. Nên mọi thứ ở đây thò ra bằng `reveal`
 *      (≤ 0,1), nhỏ hơn hẳn bề ngang ô cửa, và KHÔNG có chi tiết nào thò xa hơn `SILL_RELIEF` cũ
 *      cộng biên — xem `TOTAL_RELIEF_CAP` và bài test khoá nó.
 *   2. Bài học 110: một chi tiết thò ra 0,022 đã từng đổi SỐ BỆ KÈ của một kỷ, vì móng được sinh
 *      ra ở chỗ dấu chân công trình cắt qua nền dốc và dấu chân ấy đi qua một phép `round()`.
 *      ⇒ Thò ra là chỗ NGUY HIỂM; lõm vào thì an toàn. Ở đây ta thò ra rất ít và có trần.
 */

import { prism } from './parts';

/** Nhãn của mọi khối thuộc bộ cửa sổ — xem lý do ở `faceBlock`. */
export const OPENING_TAG = 'opening';

/**
 * Khung thò ra khỏi mặt tường bao xa. Đây là con số quyết định cả vòng 53: nó CHÍNH LÀ chiều sâu
 * nhìn thấy của cái hốc, vì ô kính nằm gần như sát mặt tường.
 *
 * ⚠️ ĐỌC THEO QUAN HỆ, KHÔNG THEO GIÁ TRỊ: phải LỚN HƠN `SILL_RELIEF` cũ (0,085) thì cái khung mới
 * đứng trước cái bệ trong thứ bậc thị giác, và phải NHỎ HƠN `DOOR_FRAME_RELIEF` (0,1) — không,
 * chính xác là phải nhỏ hơn HOẶC BẰNG, vì cửa ra vào là cái neo tỉ lệ và không được bị cửa sổ lấn.
 * Bài test khoá cả hai vế.
 */
export const REVEAL_RELIEF = 0.085;

/** Ô kính nằm cách mặt tường bao xa. Gần như sát — chênh lệch với `REVEAL_RELIEF` là chiều sâu hốc. */
export const GLASS_SET_BACK = 0.012;

/**
 * Trần tuyệt đối cho MỌI thứ file này thò ra khỏi mặt tường.
 *
 * ⚠️ KHÔNG PHẢI MỘT NGÂN SÁCH HIỆU NĂNG — vòng 53 bỏ hết trần hiệu năng. Đây là một **trần HÌNH
 * HỌC**, và con số của nó KHÔNG được chọn cho đẹp: nó bằng đúng `SILL_RELIEF` cũ (0,085), tức đúng
 * mức thò xa nhất mà mặt tường ĐÃ CÓ trước vòng 53.
 *
 * ⚠️ VÌ SAO PHẢI BẰNG ĐÚNG CHỨ KHÔNG ĐƯỢC LỚN HƠN, dù Đàm đã gỡ mọi trần: bởi thứ bị chặn ở đây
 * không phải tam giác mà là **HÌNH BAO**, và hình bao thì có một người dùng ở rất xa đây —
 * `block.js` bóp mỗi đơn vị nhỏ lại cho vừa ô của nó theo đúng hình bao ấy. Bản đầu để 0,16 và
 * chuỗi hậu quả đi qua ba chặng, không chặng nào kêu lên:
 *     hình bao kỷ 6 rộng ra 10% (0,7197 → 0,7917)
 *     ⇒ đơn vị bị bóp nhỏ hơn ⇒ `min(rw, rd)` tụt dưới `ROOFTOP_MIN_SPAN`
 *     ⇒ **11 căn của kỷ 6 mất SẠCH chi tiết mái**.
 * ⇒ Chiều sâu hốc nhìn thấy nay là 0,085 − 0,012 = **0,073**, tức gấp 2,1 lần bề thò của ô kính
 * cũ. Và thứ tạo ra bóng KHÔNG phải hai centimet ấy: nó là **hai má cửa ĐỨNG**, thứ trước nay
 * chưa từng tồn tại. Thêm chiều sâu mà mất chi tiết mái là đổi một cái bóng lấy một cái bóng khác.
 */
export const TOTAL_RELIEF_CAP = 0.085;

/** Bề dày má cửa / lanh tô, theo TỈ LỆ bề ngang ô cửa. Tuyệt đối thì ô cửa hẹp sẽ bị khung nuốt. */
const JAMB_RATIO = 0.26;
/** Má cửa mảnh nhất còn đọc ra được. Dưới mức này thì nó là một đường kẻ, không phải một cái má. */
const JAMB_MIN = 0.016;
/** Bệ thò ra XA HƠN khung — nó phải hắt bóng xuống tường, và nước mưa phải nhỏ khỏi mặt tường. */
const SILL_EXTRA = 0.023;

/**
 * BỘ HỐC CỦA TỪNG KIỂU CỬA SỔ. Bảy kiểu là bảy cách xây có thật, không phải bảy mức trang trí:
 * tường dày thì hốc sâu má rộng; khung thép thì hốc nông má mảnh.
 *
 * ⚠️ MỖI TRƯỜNG TRẢ LỜI MỘT CÂU, ĐỪNG GỘP:
 *   `reveal`  — hốc sâu bao nhiêu (phần của `REVEAL_RELIEF`). Tường đá dày ⇒ gần 1.
 *   `jamb`    — má cửa rộng bao nhiêu (phần của `JAMB_RATIO`).
 *   `mullion` — chia ô kính: 'none' · 'vert' (một nan đứng) · 'cross' (một đứng một ngang) ·
 *               'sash' (hai ngang một đứng — cửa sổ lùa Anh) · 'grille' (lưới dày, cửa lùa giấy).
 *   `hood`    — có mái hắt nhỏ trên đầu ô cửa không.
 *   `shutter` — có cánh chớp hai bên không.
 *   `bars`    — có song sắt không.
 */
export const OPENING_KIT = Object.freeze({
  // Khe chém xuyên tường dày: hốc SÂU NHẤT bộ, má cửa rộng nhất — đó là cả điểm của một lỗ châu mai.
  slit:    { reveal: 1.00, jamb: 1.60, mullion: 'none',   hood: false, shutter: false, bars: false },
  square:  { reveal: 0.85, jamb: 1.00, mullion: 'cross',  hood: true,  shutter: true,  bars: false },
  // Vòm: lanh tô CHÍNH LÀ cái vòm (xem `buildingSpec.js`), nên bộ này không khai lanh tô phẳng.
  arch:    { reveal: 0.90, jamb: 0.90, mullion: 'vert',   hood: false, shutter: false, bars: false },
  grid:    { reveal: 0.86, jamb: 0.72, mullion: 'sash',   hood: false, shutter: true,  bars: false },
  // Mặt kính treo trên khung thép: tường không dày, nên hốc NÔNG — và đó là sự thật về kết cấu.
  curtain: { reveal: 0.34, jamb: 0.34, mullion: 'vert',   hood: false, shutter: false, bars: false },
  neon:    { reveal: 0.28, jamb: 0.28, mullion: 'none',   hood: false, shutter: false, bars: false },
});

/**
 * BẢNG RIÊNG CỦA TỪNG KỶ — chỉ khai chỗ kỷ ấy KHÁC bộ chung của kiểu cửa sổ nó dùng.
 *
 * ⚠️ BẢNG PHỦ ĐỊNH, KHÔNG PHẢI BẢNG ĐẦY ĐỦ, VÀ ĐÓ LÀ CHỦ Ý. Khai đủ 15 dòng thì 15 dòng ấy sẽ
 * trôi khỏi `OPENING_KIT` từng chút một và không ai biết dòng nào còn là mặc định, dòng nào là
 * quyết định. Ở đây, có mặt trong bảng = "kỷ này CỐ Ý khác", và lý do nằm ngay trên dòng.
 */
const ERA_OPENING = Object.freeze({
  // Trường An & Tokyo: cửa lùa giấy — khung gỗ chia ô dày, không có cánh chớp, hốc nông vì vách mỏng.
  4:  { mullion: 'grille', reveal: 0.55, shutter: false },
  13: { mullion: 'grille', reveal: 0.50, shutter: false },
  // Đức trung cổ & Bồ Đào Nha: song sắt ở tầng thấp là chuyện thường của phố buôn có hàng hoá.
  5:  { bars: true },
  8:  { bars: true, shutter: true },
  // Bắc Bộ: chớp gỗ che nắng xiên, không kính.
  6:  { shutter: true, hood: true },
  // Paris & Manchester: cửa sổ đứng có cánh chớp — dấu hiệu nhận dạng mạnh nhất của hai phố ấy.
  9:  { shutter: true, hood: true },
  10: { shutter: true },
  // Dubai: mành che nắng thay vì chớp gỗ; hốc SÂU hẳn vì nắng sa mạc, đó là kiến trúc khí hậu.
  15: { reveal: 0.62, hood: true, shutter: false },
});

/** Bộ hốc thật sự dùng cho một kỷ = bộ chung của kiểu cửa sổ, phủ lên bởi dòng riêng của kỷ (nếu có). */
export function openingKit(windowKind, era) {
  const base = OPENING_KIT[windowKind] ?? OPENING_KIT.square;
  const over = ERA_OPENING[era];
  return over ? { ...base, ...over } : base;
}

/**
 * ⚠️ MỘT CHỖ DUY NHẤT BIẾT VỀ `sideways`, VÀ ĐÓ LÀ CẢ LÝ DO HÀM NÀY TỒN TẠI.
 *
 * Bản cũ trong `emitWindows` viết `face.sideways ? A : B` **mười bốn lần** cho bảy khối. Mỗi lần
 * viết là một lần có thể đảo nhầm w với d, và hình học vẫn hợp lệ nên **không có gì đỏ lên** — chỉ
 * là ô cửa mọc ngang ra khỏi tường. Nay hệ toạ độ của một mặt tường được khai đúng một lần:
 *
 *   `along` = chạy DỌC mặt tường (trái–phải khi ta đứng nhìn vào nó)
 *   `out`   = thò RA khỏi mặt tường (theo pháp tuyến)
 *   `up`    = lên trời
 *
 * và mọi khối ở dưới nói bằng ba từ ấy, không bao giờ nói bằng x/z.
 */
function faceBlock(face, o, { along = 0, up = 0, out = 0, sizeAlong, sizeUp, sizeOut, sides = 4, taper = 1, role }) {
  const s = face.sideways;
  /*
    ⚠️ `tag: OPENING_TAG` TRÊN MỌI KHỐI FILE NÀY DỰNG — bài học 112, nguyên văn: *"bên BUILDS một thứ
    thì biết nó là gì, nên nó phải NÓI RA"*. Không có nhãn thì phép đo duy nhất còn lại là đoán
    theo vai (`role: 'trim'`) — mà `trim` cũng là gờ tầng, là bậc thềm, là diềm mái. Vòng 51 đã trả
    giá đúng chuyện này: một phép dò theo vai trả lời "2" cho cả công trình CÓ lối vào lẫn công
    trình KHÔNG có.
    Người dùng đầu tiên là bài *"không chi tiết nào đẩy hình bao ra"*: nó cần đo hình bao CÓ và
    KHÔNG có bộ cửa sổ, mà không có nhãn thì không tách ra được.
    ⚠️ DÙNG LẠI KÊNH `tag` CÓ SẴN CỦA `prism`, không khai một trường thứ hai: `wonderEntrance.js`
    đã dùng đúng kênh ấy cho `'portal'`/`'entrance'` từ vòng 51. Hai kênh song song cho cùng một
    việc là đúng thứ *Composition over Duplication* cấm.
  */
  /*
    ⚠️ `y` CỦA `prism` LÀ ĐÁY KHỐI, KHÔNG PHẢI TÂM (`parts.js` nói thẳng ở dòng đầu). Mọi khối ở đây
    được mô tả bằng TÂM của nó theo chiều đứng (`up`), vì đó là cách tự nhiên để nói "giữa ô cửa",
    nên chỗ này phải trừ đi nửa chiều cao — đúng một lần, ở đúng một chỗ.
    ⚠️ BẢN ĐẦU QUÊN PHÉP TRỪ ẤY, và hậu quả KHÔNG phải "ô cửa bị lệch lên nửa ô" như ta tưởng:
    `spec.height` của một công trình được suy ra từ khối CAO NHẤT, nên những khối đứng (má cửa, trụ
    áp tường) bị đẩy lên làm **chiều cao khai báo của cả công trình vống lên 29%** — kỳ quan kỷ 15
    đi từ 4,665 lên 6,011 và bài *"không công trình nào cao vống thành ống khói"* đỏ. Một lỗi về
    TOẠ ĐỘ hiện ra thành một lỗi về TỈ LỆ, cách đó hai tầng.
  */
  return prism({
    tag: OPENING_TAG,
    x: o.x + (s ? face.nx * out : along),
    z: o.z + (s ? along : face.nz * out),
    y: o.y + up - sizeUp / 2,
    w: s ? sizeOut : sizeAlong,
    d: s ? sizeAlong : sizeOut,
    h: sizeUp,
    sides,
    taper,
    role,
  });
}

/**
 * Dựng MỘT ô cửa sổ có chiều sâu, trả về số khối đã thêm.
 *
 * @param {Array}  out   mảng khối của công trình
 * @param {object} face  `{ nx, nz, sideways }` — mặt tường đang xét
 * @param {object} o     `{ x, z, y }` — tâm ĐÁY ô cửa, đã nằm trên mặt tường
 * @param {object} m     `{ ww, wh }` — bề ngang và chiều cao lòng ô cửa
 * @param {object} kit   kết quả của `openingKit`
 * @param {object} opts  `{ lit, arch }`
 */
export function emitOpening(out, face, o, m, kit, opts = {}) {
  const before = out.length;
  const { ww, wh } = m;
  const reveal = REVEAL_RELIEF * kit.reveal;
  const jamb = Math.max(JAMB_MIN, ww * JAMB_RATIO * kit.jamb);

  // ── Ô KÍNH: gần sát mặt tường, tức NẰM SÂU trong lòng khung ─────────────────────────────────
  // ⚠️ Không đặt nó ở `out = 0` chẵn: hai mặt phẳng trùng nhau thì hai điểm ảnh tranh nhau một độ
  // sâu và mặt kính lấm tấm (z-fighting). `GLASS_SET_BACK` là khoảng hở nhỏ nhất còn sạch.
  out.push(faceBlock(face, o, {
    up: wh / 2, out: GLASS_SET_BACK,
    sizeAlong: ww, sizeUp: wh, sizeOut: GLASS_SET_BACK * 2,
    role: opts.lit ? 'glassLit' : 'glass',
  }));

  // ── HAI MÁ CỬA: vế bị bỏ quên suốt 5 vòng, và là vế đắt giá nhất ────────────────────────────
  // Mặt trời đứng một bên ⇒ má này sáng, má kia đổ bóng vào lòng hốc. Cặp sáng–tối ấy đổi theo
  // hướng mặt tường, nên bốn mặt của một khối hộp thôi đọc ra giống nhau.
  for (const s of [-1, 1]) {
    out.push(faceBlock(face, o, {
      along: s * (ww / 2 + jamb / 2), up: wh / 2, out: reveal / 2,
      sizeAlong: jamb, sizeUp: wh + jamb, sizeOut: reveal,
      role: 'trim',
    }));
  }

  // ── LANH TÔ ────────────────────────────────────────────────────────────────────────────────
  // ⚠️ KHÔNG DỰNG Ở KỶ CỬA VÒM: **vòm CHÍNH LÀ lanh tô** — cả lý do vòm được phát minh là để bắc
  // qua một ô rộng hơn thứ một thanh đá thẳng chịu nổi. Chồng cả hai là sai kết cấu và cắm hai khối
  // vào đúng một chỗ. (Luật này giữ nguyên từ `buildingSpec.js`, chỉ chuyển chỗ ở.)
  if (!opts.arch) {
    out.push(faceBlock(face, o, {
      up: wh + jamb / 2, out: reveal / 2,
      sizeAlong: ww + jamb * 2, sizeUp: jamb, sizeOut: reveal,
      role: 'trim',
    }));
  }

  // ── BỆ: thò xa hơn khung, và có GIỌT NƯỚC ──────────────────────────────────────────────────
  // Bệ phải thò xa hơn mọi thứ khác của ô cửa vì ngoài đời nó làm đúng một việc: đẩy nước mưa RỜI
  // khỏi mặt tường. Cái thò thêm ấy cũng chính là thứ hắt vệt bóng đậm nhất của cả ô cửa xuống
  // mảng tường ngay dưới — vòng 53 gọi đó là "vệt bẩn dưới bệ" ở Việc 10, và nó bắt đầu từ đây.
  out.push(faceBlock(face, o, {
    up: -jamb / 2, out: Math.min(TOTAL_RELIEF_CAP, reveal + SILL_EXTRA) / 2,
    sizeAlong: ww + jamb * 2.4, sizeUp: jamb, sizeOut: Math.min(TOTAL_RELIEF_CAP, reveal + SILL_EXTRA),
    role: 'trim',
  }));

  // ── CHIA Ô KÍNH ────────────────────────────────────────────────────────────────────────────
  // Nan chia nằm NGOÀI mặt kính nên nó cũng đổ bóng lên kính — ở tầm mắt đây là thứ biến một ô
  // kính phẳng thành một cái cửa sổ thật.
  const bar = Math.max(0.008, jamb * 0.34);
  const barOut = GLASS_SET_BACK + bar;
  const vert = (n) => {
    for (let i = 1; i <= n; i += 1) {
      const t = (i / (n + 1)) - 0.5;
      out.push(faceBlock(face, o, {
        along: t * ww, up: wh / 2, out: barOut / 2,
        sizeAlong: bar, sizeUp: wh, sizeOut: barOut, role: 'trim',
      }));
    }
  };
  const horiz = (n) => {
    for (let i = 1; i <= n; i += 1) {
      const t = i / (n + 1);
      out.push(faceBlock(face, o, {
        up: wh * t, out: barOut / 2,
        sizeAlong: ww, sizeUp: bar, sizeOut: barOut, role: 'trim',
      }));
    }
  };
  if (kit.mullion === 'vert') vert(1);
  else if (kit.mullion === 'cross') { vert(1); horiz(1); }
  else if (kit.mullion === 'sash') { vert(1); horiz(2); }
  else if (kit.mullion === 'grille') { vert(2); horiz(3); }

  // ── SONG SẮT ───────────────────────────────────────────────────────────────────────────────
  // Vai `iron` (vòng 51): sắt trông NHƯ NHAU ở mọi kỷ, nên nó không được mượn màu của kỷ.
  if (kit.bars) {
    for (let i = 0; i < 3; i += 1) {
      const t = ((i + 1) / 4) - 0.5;
      out.push(faceBlock(face, o, {
        along: t * ww, up: wh / 2, out: (reveal * 0.62) / 2,
        sizeAlong: bar * 0.9, sizeUp: wh, sizeOut: reveal * 0.62, sides: 6, role: 'iron',
      }));
    }
  }

  // ── CÁNH CHỚP ──────────────────────────────────────────────────────────────────────────────
  // Đứng NGOÀI khung, dày hơn khung ⇒ chúng đổ bóng lên chính cái khung, tức thêm một tầng bóng
  // nữa trên cùng một ô cửa. Đây là chi tiết làm phố Paris và phố Manchester đọc ra khác nhau.
  //
  /*
    ⚠️ CHỖ NÀY ĐÃ GIẾT CHI TIẾT MÁI CỦA MỘT KỶ, VÀ NÓ LÀ LẦN THỨ BA CỦA CÙNG MỘT BÀI HỌC.
    Bản đầu dựng cánh chớp ở `along = ±(ww/2 + jamb + leaf/2)` mà KHÔNG hỏi mặt tường còn bao nhiêu
    chỗ. Ô cửa ngoài cùng vốn đã nằm ở `0,31 × span`, nên cặp chớp của nó THÒ RA NGOÀI mép nhà.
    Hậu quả đi vòng ba chặng và không chặng nào kêu lên:
      hình bao rộng ra 10% (kỷ 6: 0,7197 → 0,7917)
      ⇒ `block.js` bóp đơn vị nhỏ lại cho vừa ô
      ⇒ `min(rw, rd)` tụt xuống dưới `ROOFTOP_MIN_SPAN`
      ⇒ **11 căn của kỷ 6 mất SẠCH chi tiết mái**, và bài *"chi tiết mái không được chết"* đỏ.
    Cùng hình dạng với bài học 110 (một ornament thò ra 0,022 đổi SỐ BỆ KÈ) và 114 (`specSpan` lấy
    `max(w/2, d/2)`). ⇒ Luật: **một chi tiết trang trí không bao giờ được đẩy hình bao của công
    trình ra**, vì hình bao là thứ quyết định công trình bị bóp bao nhiêu để vừa ô của nó.
    Cách vá KHÔNG phải thu nhỏ cánh chớp bằng một hệ số chọn tay, mà là hỏi mặt tường còn bao nhiêu
    chỗ (`opts.room`) và **không dựng gì nếu không đủ** — đúng cách `emitGroundFloor` từ chối dựng
    một cái cửa 4cm thay vì kẹp nó về một cỡ tối thiểu.
  */
  const room = Number.isFinite(opts.room) ? opts.room : Infinity;
  if (kit.shutter && ww / 2 + jamb + ww * 0.46 <= room) {
    const leaf = ww * 0.46;
    for (const s of [-1, 1]) {
      out.push(faceBlock(face, o, {
        along: s * (ww / 2 + jamb + leaf / 2), up: wh / 2,
        out: Math.min(TOTAL_RELIEF_CAP, reveal * 1.1) / 2,
        sizeAlong: leaf, sizeUp: wh * 0.98,
        sizeOut: Math.min(TOTAL_RELIEF_CAP, reveal * 1.1), role: 'wood',
      }));
    }
  }

  // ── MÁI HẮT ────────────────────────────────────────────────────────────────────────────────
  // Thò xa nhất trong cả bộ, nên nó là thứ hắt vệt bóng dài nhất xuống mặt tường — và cũng là thứ
  // phải canh `TOTAL_RELIEF_CAP` kỹ nhất (xem bẫy số 1 ở đầu file).
  // ⚠️ Mái hắt cũng phải hỏi `room` — cùng lý do cánh chớp, xem khối cảnh báo ngay trên.
  if (kit.hood && ww / 2 + jamb * 1.5 <= room) {
    const hoodOut = Math.min(TOTAL_RELIEF_CAP, reveal + SILL_EXTRA * 1.6);
    out.push(faceBlock(face, o, {
      up: wh + jamb * 1.6, out: hoodOut / 2,
      sizeAlong: ww + jamb * 3, sizeUp: jamb * 0.7, sizeOut: hoodOut, role: 'trim',
    }));
  }

  return out.length - before;
}

/**
 * DẢI KÍNH LIỀN MẠCH CÓ CHIỀU SÂU — kỷ 14 (Singapore) và kỷ 15 (Dubai).
 *
 * ⚠️ HAI KỶ NÀY SUÝT BỊ BỎ QUÊN, VÀ PHÉP ĐO LÀ THỨ BẮT ĐƯỢC. Sau khi `emitOpening` chạy, chữ ký
 * GOLDEN của 13 kỷ đổi — nhưng kỷ 1, 2 (không có cửa sổ) VÀ kỷ 14, 15 thì đứng yên. Kỷ 1–2 đứng
 * yên là ĐÚNG; kỷ 14–15 đứng yên là một lỗ hổng: hai kỷ ấy đi nhánh "dải kính liền" nên chưa bao
 * giờ chạy qua `emitOpening`. Đàm đặt hàng đích danh *"kính liền dải thụt trong khung (kỷ 14, 15)"*.
 * ⇒ Một chữ ký KHÔNG đổi cũng là dữ liệu, y như một chữ ký đổi. Đọc cả hai chiều.
 *
 * ⚠️ NHƯNG KHÔNG DỰNG LẠI CÁI HỐC Ở ĐÂY — mặt kính hiện đại **không có hốc**, nó treo cả mặt tiền
 * lên khung thép. Thứ nó có là **NAN ĐỨNG (mullion fin)**: những thanh nhôm chạy suốt chiều cao,
 * thò ra khỏi mặt kính vài phân. Đúng chúng mới là thứ vạch ra những vệt bóng dọc trên một mặt
 * kính phẳng lì — cùng công dụng với má cửa ở nhà xây gạch, khác hẳn về cách xây.
 */
export function emitGlassBand(out, face, o, m, kit, opts = {}) {
  const before = out.length;
  const { span, bandH } = m;
  const reveal = REVEAL_RELIEF * kit.reveal;
  const rail = Math.max(0.012, bandH * 0.16);

  // Mặt kính: LÙI vào sau hai thanh ray, nên cả dải đọc ra là một cái rãnh chứ không phải một tấm dán.
  out.push(faceBlock(face, o, {
    up: bandH / 2, out: GLASS_SET_BACK,
    sizeAlong: span, sizeUp: bandH, sizeOut: GLASS_SET_BACK * 2,
    role: opts.lit ? 'glassLit' : 'glass',
  }));

  // Ray trên và ray dưới: hai đường ngang chạy suốt mặt tiền, thò ra xa hơn kính.
  for (const up of [bandH + rail / 2, -rail / 2]) {
    out.push(faceBlock(face, o, {
      up, out: reveal / 2, sizeAlong: span, sizeUp: rail, sizeOut: reveal, role: 'trim',
    }));
  }

  // ⚠️ SỐ NAN THEO BỀ NGANG THẬT, KHÔNG PHẢI MỘT CON SỐ CỨNG. Một mặt tiền rộng gấp đôi phải có
  // gấp đôi số nan, nếu không thì nhịp của nó thưa gấp đôi và hai công trình cạnh nhau đọc ra hai
  // cỡ khác nhau — đúng bẫy "số tuyệt đối không nhìn thấy cái thân" của Phase 7D.
  const fins = Math.max(2, Math.min(9, Math.round(span / 0.085)));
  const fin = Math.max(0.01, span / (fins * 6));
  for (let i = 0; i < fins; i += 1) {
    const t = ((i + 0.5) / fins) - 0.5;
    out.push(faceBlock(face, o, {
      along: t * span, up: bandH / 2, out: (reveal * 1.15) / 2,
      sizeAlong: fin, sizeUp: bandH + rail * 2, sizeOut: reveal * 1.15, role: 'trim',
    }));
  }

  return out.length - before;
}
