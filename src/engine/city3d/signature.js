/**
 * signature.js — CHỮ KÝ KIẾN TRÚC. Mỗi kỷ một bộ phận lấy thẳng từ một công trình CÓ THẬT.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO CẦN TẦNG NÀY DÙ ĐÃ CÓ `eraStyle.js` VÀ `motifs`:
 * Phase 5B cho 15 kỷ 15 tỉ lệ khác nhau (`massScale`/`spread`) và điều đó sửa được hình BÓNG —
 * mắt phân biệt được lều với tháp từ xa. Nhưng lại gần thì mọi thứ vẫn là hộp đội mái, vì hai
 * tầng chi tiết hiện có đều không lấp được khoảng đó:
 *   - `roof`/`windows` chỉ có 9 và 7 giá trị cho 15 kỷ ⇒ **buộc phải dùng lại**: `cone` dùng chung
 *     cho kỷ 1 và 2, `flat` cho 12/13/14, `tiered` cho 4 và 6. Hai kỷ dùng chung một mái thì không
 *     có cách nào phân biệt bằng mái.
 *   - `motifs` chỉ dựng ở hạng `rare`/`epic` (`RARITY_MOTIF_BUDGET.common = 0`) ⇒ **2 trong 5 công
 *     trình mỗi kỷ hiện KHÔNG có lấy một chi tiết đặc trưng nào**, tức 30 trong 75 căn nhà của cả
 *     game là hộp trơn. Đó chính là chỗ Đàm nói "sơ sài".
 *
 * ⇒ Chữ ký là tầng thứ ba, và nó khác hai tầng kia ở đúng hai điểm:
 *   (a) **MỖI KỶ MỘT CÁI, không kỷ nào dùng chung** — 15 giá trị cho 15 kỷ;
 *   (b) **hiện ở MỌI hạng**, kể cả `common`, vì đây là căn cước của kỷ chứ không phải phần thưởng
 *       cho độ hiếm.
 *
 * ⚠️ MỖI CHỮ KÝ PHẢI TRẢ LỜI ĐƯỢC "CÔNG TRÌNH NÀO Ở NƯỚC ẤY TRÔNG NHƯ VẬY?"
 * Đây là luật đã ghi ở `eraStyle.js` cho `country`/`landmark`, nay áp thẳng vào hình học. Không có
 * câu trả lời thì khối ấy là tuỳ hứng — mà tuỳ hứng chính là thứ đã sinh ra 15 kỷ cao bằng nhau
 * trước Phase 5B. Vì vậy mỗi hàm dưới đây mở đầu bằng một dòng nói rõ nó đang chép lại cái gì.
 *
 * ⚠️ KỲ QUAN ĐỐI XỨNG TRÁI–PHẢI — và luật này thắng mọi thứ khác ở file này.
 * `archetypes.js` đặt kỳ quan ở khu đất TRUNG TÂM; một chữ ký lệch sang bên sẽ làm cả thành phố
 * mất điểm tựa thị giác. `buildingSpec.test.js` khoá điều đó lại bằng phép đo **đối xứng qua mặt
 * phẳng x = 0**: mỗi khối kết cấu ở `(x, z)` quay `ry` phải có bạn ở `(−x, z)` quay `−ry`.
 * ⚠️ Cố ý KHÔNG phải "cấm xoay" và cũng KHÔNG phải "đối xứng qua tâm" — hai phép đó đều đã thử và
 * đều SAI: cấm xoay thì giết luôn vòng xuyến kỷ 15 (tám tấm kính quay quanh vòng, cả vòng vẫn cân
 * hoàn hảo); đối xứng qua tâm thì kết tội oan CỬA RA VÀO (mặt tiền nào cũng có cửa phía trước và
 * không có cửa phía sau). Nên: dùng `flanks()` để lấy danh sách bên đặt, và khi `ctx.symmetric` thì
 * đặt đủ cả hai bên với `ry` đối nhau — hoặc `ry: 0` cho gọn.
 */

import { unit } from '../hashId';
import { prism, gable } from './parts';
import { roofRise, eaveOverhang } from './eraStyle';

/** Băm → số thực trong [0,1). Tất định tuyệt đối, cùng hàm băm với phần còn lại của thành phố. */
/**
 * Các bên được phép đặt một khối lệch tâm.
 *
 * Kỳ quan → LUÔN cả hai bên (đối xứng là luật cứng). Công trình thường → chọn MỘT bên, tất định
 * theo id: đó là thứ làm năm căn nhà cùng kỷ không xếp hàng giống hệt nhau, mà vẫn dựng lại y hệt
 * sau nhiều năm (bất biến "bảo tàng bất động").
 */
function flanks(ctx, key) {
  if (ctx.symmetric) return [-1, 1];
  return [unit(`${ctx.bpId}|sig|${key}`) > 0.5 ? 1 : -1];
}

/** Đỉnh mái — mốc để đặt những thứ NẰM TRÊN mái. Dùng chung công thức với `emitRoof`. */
function roofTop(ctx) {
  return ctx.top + roofRise(ctx.style, ctx.w, ctx.d);
}

// ─── 15 CHỮ KÝ ───────────────────────────────────────────────────────────────

/**
 * Kỷ 1 · Thổ Nhĩ Kỳ · cự thạch Göbekli Tepe.
 * Chép lại: cột đá hình chữ T — trụ đứng mỏng đội một phiến ngang. Đây là hình ảnh duy nhất mà
 * ai từng thấy ảnh Göbekli Tepe cũng nhớ, và nó cổ hơn mọi thứ khác trong game tới bảy nghìn năm.
 */
function tstone(out, ctx) {
  const { x, z, w, base, top } = ctx;
  // Cột PHẢI cao hơn hẳn túp lều: ngoài đời trụ Göbekli Tepe cao tới 5,5 m trong khi lều thì thấp.
  // Đây cũng là thứ cứu hình bóng kỷ 1 khỏi tội "chỉ là một chấm trên bãi cỏ".
  const h = Math.max(0.34, (top - base) * 1.45);
  for (const s of [-1, 1]) {
    const px = x + s * (w * 0.5 + 0.17);
    out.push(prism({ x: px, z, y: base, w: 0.075, d: 0.16, h, sides: 4, role: 'stone' }));
    out.push(prism({ x: px, z, y: base + h, w: 0.26, d: 0.16, h: 0.07, sides: 4, role: 'stone' }));
  }
}

/**
 * Kỷ 2 · Ai Cập · làng ven sông Nin.
 * Chép lại: tường TALUD (nghiêng vào trong) và gờ CAVETTO loe ra dưới mái — hai nét có mặt trên
 * gần như mọi công trình đất/đá Ai Cập, từ nhà ở tới đền đài.
 */
function batter(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const h = (top - base) * 0.34;
  // Bệ nghiêng ốp quanh chân tường.
  out.push(prism({ x, z, y: base, w: w * 1.2, d: d * 1.2, h, sides: 4, taper: 0.8, role: 'stone' }));
  // Gờ loe: một phiến RỘNG HƠN tường đặt sát dưới mái. `taper` chỉ thóp vào được, không loe ra —
  // nên phải diễn tả bằng một khối rộng hơn chồng lên khối hẹp, không phải bằng một tham số.
  out.push(prism({ x, z, y: top - 0.075, w: w * 1.02, d: d * 1.02, h: 0.05, sides: 4, role: 'trim' }));
  out.push(prism({ x, z, y: top - 0.025, w: w * 1.18, d: d * 1.18, h: 0.035, sides: 4, role: 'trim' }));
}

/**
 * Kỷ 3 · Iraq · ziggurat thành Ur.
 * Chép lại: CẦU THANG CHÍNH DIỆN chạy thẳng lên đỉnh, kèm hai thang phụ áp tường. Mái `stepped`
 * đã lo phần giật cấp; thứ còn thiếu để một khối giật cấp đọc ra "ziggurat" chính là cái thang.
 */
function ziggurStair(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const steps = 5;
  const rise = top - base;
  for (let i = 0; i < steps; i += 1) {
    const t = (i + 1) / steps;
    out.push(prism({
      x, z: z + d / 2 + 0.32 - i * 0.075,
      y: base, w: w * 0.30, d: 0.08, h: rise * (0.16 + t * 0.74),
      sides: 4, role: 'stone',
    }));
  }
  // Hai bờ thang dày hai bên — chính hai đường xiên này làm mắt đọc ra "bậc lên" chứ không phải
  // "một cái tường mỏng cắm trước nhà".
  for (const s of [-1, 1]) {
    out.push(prism({
      x: x + s * w * 0.2, z: z + d / 2 + 0.16,
      y: base, w: 0.07, d: 0.42, h: rise * 0.5, sides: 4, taper: 0.5, role: 'stone',
    }));
  }
}

/**
 * Kỷ 4 · Trung Quốc · đấu củng (điện mái chồng).
 * Chép lại: hệ ĐẤU CỦNG — những khối gỗ vuông chồng chéo nhau đỡ diềm mái vươn xa. Đây là chi tiết
 * kỹ thuật đặc hữu của kiến trúc gỗ Đông Á và là lý do mái Á Đông thò ra được xa đến thế.
 */
function dougong(out, ctx) {
  const { x, z, w, d, top } = ctx;
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sz] of corners) {
    const cx = x + sx * w * 0.44;
    const cz = z + sz * d * 0.44;
    // Ba lớp chồng chéo: ngang → dọc → ngang. Đúng cách xếp thật của đấu củng.
    out.push(prism({ x: cx, z: cz, y: top - 0.14, w: 0.19, d: 0.05, h: 0.042, sides: 4, role: 'wood' }));
    out.push(prism({ x: cx, z: cz, y: top - 0.095, w: 0.05, d: 0.19, h: 0.042, sides: 4, role: 'wood' }));
    out.push(prism({ x: cx, z: cz, y: top - 0.05, w: 0.23, d: 0.06, h: 0.045, sides: 4, role: 'trim' }));
  }
}

/**
 * Kỷ 5 · Đức · lâu đài đá Burg Eltz.
 * Chép lại: THÁP TRỤ TRÒN dính vào tường, đội mái chóp nhọn cao — cái "mũ phù thuỷ" mà mọi lâu đài
 * sông Rhine đều có. Mái `gable` dốc đứng đã đúng; thiếu đúng cái tháp tròn thì nó chỉ là nhà đá.
 */
function turret(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const th = (top - base) * 1.06;
  for (const s of flanks(ctx, 'turret')) {
    const px = x + s * (w * 0.5 + 0.07);
    const pz = z + (ctx.symmetric ? 0 : d * 0.26);
    out.push(prism({ x: px, z: pz, y: base, w: 0.23, h: th, sides: 8, taper: 0.95, role: 'stone' }));
    // Gờ đỡ mái — cái vành mỏng này là thứ tách "tháp" khỏi "cái cột có chóp".
    out.push(prism({ x: px, z: pz, y: base + th, w: 0.27, h: 0.035, sides: 8, role: 'trim' }));
    out.push(prism({ x: px, z: pz, y: base + th + 0.035, w: 0.26, h: 0.32, sides: 8, taper: 0, role: 'roof' }));
  }
}

/**
 * Kỷ 6 · Việt Nam · đình làng Bắc Bộ.
 * Chép lại: ĐẦU ĐAO — bốn góc mái vút cong lên trời. Đây là nét nhận dạng số một của mái đình
 * Việt, và cũng chính là thứ tách kỷ 6 khỏi kỷ 4 bằng mắt: mái Hán chồng tầng và NẶNG, mái Việt
 * cong và NHẸ ở bốn góc.
 */
function daoDinh(out, ctx) {
  const { x, z, w, d, style, top } = ctx;
  // ⚠️ QUA `eaveOverhang`, KHÔNG đọc thẳng `style.eaves` — xem chú thích hàm đó ở `eraStyle.js`.
  // Đầu đao phải đậu đúng mép mái; đọc số thô ở đây trong khi `emitRoof` đã kẹp nghĩa là bốn cái
  // đầu đao treo lơ lửng ngoài không khí ở mọi công trình nhỏ. Một luật thì chỉ được có một công thức.
  const eaves = eaveOverhang(style, w, d);
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const [sx, sz] of corners) {
    const cx = x + sx * (w / 2 + eaves) * 0.96;
    const cz = z + sz * (d / 2 + eaves) * 0.96;
    // Đầu đao dựng bằng HAI đoạn: đoạn dưới thoải, đoạn trên dốc và mảnh — đó là cách rẻ nhất
    // diễn tả một đường cong bằng khối thẳng, cùng thủ pháp mái vòm đã dùng ở kỷ 7.
    out.push(prism({
      x: cx, z: cz, y: top, w: 0.14, d: 0.055, h: 0.085,
      sides: 4, taper: 0.55, ry: ctx.symmetric ? 0 : Math.atan2(sz, sx), role: 'roof',
    }));
    out.push(prism({
      x: cx + sx * 0.035, z: cz + sz * 0.035, y: top + 0.085, w: 0.06, d: 0.04, h: 0.15,
      sides: 4, taper: 0.25, ry: ctx.symmetric ? 0 : Math.atan2(sz, sx), role: 'gold',
    }));
  }
}

/**
 * Kỷ 7 · Ý · quảng trường Duomo Firenze.
 * Chép lại: THÁP CHUÔNG Giotto đứng tách khỏi nhà thờ, thân vuông mảnh có các dải đá ngang, đỉnh
 * bằng có lan can. Chọn tháp chuông chứ không thêm sườn vòm vì mái `dome` đã dựng vòm rồi — và
 * quảng trường Duomo thật cũng đúng là ba khối rời: nhà thờ + tháp chuông + nhà rửa tội.
 */
function campanile(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const th = (top - base) * 1.55;
  for (const s of flanks(ctx, 'campanile')) {
    const px = x + s * (w * 0.5 + 0.19);
    const pz = z + (ctx.symmetric ? 0 : -d * 0.2);
    out.push(prism({ x: px, z: pz, y: base, w: 0.24, h: th, sides: 4, taper: 0.97, role: 'wall2' }));
    // Ba dải đá ngang — chính các dải trắng/xanh này làm tháp Giotto không lẫn với tháp nào khác.
    for (let i = 1; i <= 3; i += 1) {
      out.push(prism({
        x: px, z: pz, y: base + th * (i / 4), w: 0.26, h: 0.028, sides: 4, role: 'trim',
      }));
    }
    // Lan can đỉnh: một phiến rộng hơn thân, đỉnh BẰNG (tháp Giotto không có chóp nhọn).
    out.push(prism({ x: px, z: pz, y: base + th, w: 0.3, h: 0.05, sides: 4, role: 'trim' }));
  }
  // Nhà rửa tội: khối BÁT GIÁC thấp — hình bát giác là thứ duy nhất trên quảng trường ấy có
  // tám cạnh, nên nó tự nhận diện.
  out.push(prism({
    x, z: z + d * 0.78, y: base, w: 0.34, h: (top - base) * 0.44, sides: 8, taper: 0.98, role: 'wall2',
  }));
  out.push(prism({
    x, z: z + d * 0.78, y: base + (top - base) * 0.44, w: 0.36, h: 0.14, sides: 8, taper: 0.2, role: 'roof',
  }));
}

/**
 * Kỷ 8 · Bồ Đào Nha · tháp Belém, bến cảng Lisboa.
 * Chép lại: THÁP CANH VUÔNG có lan can nhô ra và bốn VỌNG LÂU nhỏ ở góc (bartizan) — dáng tháp
 * canh Manueline gác cửa sông Tejo, thứ mọi đoàn tàu rời Lisboa đều đi qua.
 */
function belem(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const th = (top - base) * 1.2;
  for (const s of flanks(ctx, 'belem')) {
    const px = x + s * (w * 0.5 + 0.2);
    const pz = z + (ctx.symmetric ? 0 : -d * 0.24);
    out.push(prism({ x: px, z: pz, y: base, w: 0.27, h: th, sides: 4, taper: 0.96, role: 'stone' }));
    // Lan can NHÔ RA khỏi thân — đường gờ đưa ra này là nét Manueline rõ nhất nhìn từ xa.
    out.push(prism({ x: px, z: pz, y: base + th, w: 0.35, h: 0.05, sides: 4, role: 'trim' }));
    // Bốn vọng lâu góc, mỗi cái một chóp con.
    for (const [bx, bz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const vx = px + bx * 0.145;
      const vz = pz + bz * 0.145;
      out.push(prism({ x: vx, z: vz, y: base + th + 0.05, w: 0.085, h: 0.09, sides: 8, taper: 0.9, role: 'stone' }));
      out.push(prism({ x: vx, z: vz, y: base + th + 0.14, w: 0.09, h: 0.08, sides: 8, taper: 0, role: 'roof' }));
    }
  }
}

/**
 * Kỷ 9 · Pháp · điện Panthéon Paris.
 * Chép lại: HIÊN CỘT NHÔ HẲN RA phía trước, đội fronton tam giác — mặt tiền Tân cổ điển kinh điển.
 * Khác `motifs: ['columns']` đang có ở chỗ quan trọng nhất: hàng cột kia DÁN vào tường, còn hiên
 * Panthéon ĐỨNG RỜI phía trước và có mái riêng, nên nó đổ bóng lên chính mặt tiền.
 */
function portico(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const ph = (top - base) * 0.88;
  const pz = z + d / 2 + 0.17;
  const count = 6;
  for (let i = 0; i < count; i += 1) {
    const t = (i / (count - 1)) - 0.5;
    out.push(prism({
      x: x + t * w * 0.88, z: pz, y: base,
      w: 0.078, h: ph, sides: 8, taper: 0.9, role: 'trim',
    }));
  }
  // Kiến ngang (entablature) gác trên đầu cột, rồi mới tới fronton.
  out.push(prism({ x, z: pz, y: base + ph, w: w * 1.0, d: 0.22, h: 0.055, sides: 4, role: 'trim' }));
  out.push(gable({ x, z: pz, y: base + ph + 0.055, w: w * 1.0, d: 0.22, h: w * 0.22, role: 'trim' }));
  // Bậc thềm — Panthéon ngồi trên một bệ bậc cao, và cái bệ ấy là thứ làm nó trông "quốc gia".
  out.push(prism({ x, z: pz + 0.11, y: base, w: w * 1.12, d: 0.2, h: 0.05, sides: 4, role: 'stone' }));
}

/**
 * Kỷ 10 · Anh · nhà máy gạch đỏ Manchester.
 * Chép lại: ỐNG KHÓI GẠCH duy nhất, rất cao, thóp dần, có vành loe ở miệng. Khác `motifs:
 * ['chimney']` (hai ống ngắn 0,42–0,64) ở chỗ ống khói nhà máy thật CAO HƠN CẢ NHÀ MÁY — đó là
 * hình bóng của cả một thế kỷ, và cũng là thứ duy nhất trong thành phố cao vống mà vẫn đúng.
 */
function stack(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const sh = Math.max(0.62, (top - base) * 1.6);
  for (const s of flanks(ctx, 'stack')) {
    const px = x + s * (w * 0.5 + 0.13);
    const pz = z + (ctx.symmetric ? 0 : -d * 0.3);
    out.push(prism({ x: px, z: pz, y: base, w: 0.18, h: 0.07, sides: 8, role: 'stone' }));
    out.push(prism({ x: px, z: pz, y: base + 0.07, w: 0.155, h: sh, sides: 8, taper: 0.62, role: 'stone' }));
    // Vành loe ở miệng ống — rộng hơn thân, nên phải là khối riêng (xem lý do ở `batter`).
    out.push(prism({ x: px, z: pz, y: base + 0.07 + sh, w: 0.13, h: 0.05, sides: 8, role: 'dark' }));
  }
}

/**
 * Kỷ 11 · Mỹ · New York thời Mạ Vàng.
 * Chép lại: BỒN NƯỚC GỖ trên khung thép nằm chỏng chơ trên nóc nhà — thứ có mặt trên hàng nghìn
 * mái nhà Manhattan và không có ở bất kỳ đâu khác trong game. Chọn nó thay vì "bậc giật lùi" vì
 * mái kỷ 11 đã là `stepped`, thêm bậc nữa là nói lại đúng một điều hai lần.
 */
function watertower(out, ctx) {
  const { x, z } = ctx;
  const rt = roofTop(ctx);
  const legH = 0.13;
  const legR = 0.085;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    out.push(prism({
      x: x + sx * legR, z: z + sz * legR, y: rt,
      w: 0.026, h: legH, sides: 4, role: 'dark',
    }));
  }
  out.push(prism({ x, z, y: rt + legH, w: 0.24, h: 0.21, sides: 8, taper: 0.93, role: 'wood' }));
  out.push(prism({ x, z, y: rt + legH + 0.21, w: 0.26, h: 0.1, sides: 8, taper: 0, role: 'dark' }));
}

/**
 * Kỷ 12 · Nga · lô cốt Stalingrad.
 * Chép lại: Ụ SÚNG BÊ TÔNG úp thấp phía trước, có KHE CHÂU MAI NGANG tối om, hai bên đắp bao cát.
 * Cửa sổ `slit` đã cho khe đứng trên tường; thứ làm nên lô cốt là cái vòm bê tông thấp tè sát đất.
 */
function pillbox(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const ph = (top - base) * 0.34;
  const pz = z + d * 0.62;
  out.push(prism({ x, z: pz, y: base, w: w * 0.56, d: 0.36, h: ph, sides: 8, taper: 0.52, role: 'stone' }));
  // Khe châu mai: một khối TỐI mảnh nằm ngang, nhô ra khỏi mặt vòm.
  out.push(prism({
    x, z: pz + 0.15, y: base + ph * 0.52, w: w * 0.42, d: 0.05, h: 0.045, sides: 4, role: 'dark',
  }));
  // Bao cát hai bên — luôn đủ cặp, kể cả ở công trình thường: một bên thì trông như xếp dở.
  for (const s of [-1, 1]) {
    for (let i = 0; i < 2; i += 1) {
      out.push(prism({
        x: x + s * (w * 0.34 + i * 0.05), z: pz - i * 0.07, y: base + i * 0.055,
        w: 0.13, d: 0.09, h: 0.055, sides: 6, taper: 0.8, role: 'wall2',
      }));
    }
  }
}

/**
 * Kỷ 13 · Nhật Bản · tháp nang Nakagin.
 * Chép lại: những VIÊN NANG hộp gắn lệch nhau quanh một lõi, mỗi viên đúng MỘT cửa sổ TRÒN. Cửa
 * tròn là chi tiết nhận dạng số một của Nakagin, và trong cả thành phố này không có gì khác tròn.
 */
function capsule(out, ctx) {
  const { x, z, w, d, base, top, bpId } = ctx;
  const rise = top - base;
  const n = 5;
  for (let i = 0; i < n; i += 1) {
    // Kỳ quan: hai viên đối nhau mỗi tầng. Nhà thường: so le trái–phải, đúng kiểu Nakagin thật.
    const sides = ctx.symmetric ? [-1, 1] : [i % 2 === 0 ? 1 : -1];
    const y = base + rise * (0.14 + i * (0.62 / n));
    for (const s of sides) {
      const cx = x + s * (w / 2 + 0.11);
      const cz = z + (ctx.symmetric ? 0 : (unit(`${bpId}|cap|${i}`) - 0.5) * d * 0.4);
      out.push(prism({ x: cx, z: cz, y, w: 0.23, d: 0.2, h: 0.16, sides: 4, role: 'wall2' }));
      out.push(prism({
        x: cx + s * 0.1, z: cz, y: y + 0.035,
        w: 0.03, d: 0.105, h: 0.105, sides: 8, role: 'glass',
      }));
    }
  }
}

/**
 * Kỷ 14 · Singapore · tháp kính Marina Bay.
 * Chép lại: SÀN TRỜI nằm vắt ngang trên đỉnh, dài hơn hẳn thân nhà, có mảng cây trên đó. Cái sàn
 * bắc ngang ấy là hình bóng dễ nhận nhất của Singapore hiện đại, và nó cũng chữa đúng điểm yếu
 * của kỷ 14: mái `flat` thì đỉnh nhà chẳng có gì để nhìn.
 */
function skydeck(out, ctx) {
  const { x, z, w, d } = ctx;
  const rt = roofTop(ctx);
  // Cột đỡ ngắn nâng sàn khỏi mái — chính KHE HỞ này tạo cảm giác "bắc ngang", không có nó thì
  // sàn chỉ là một cái nắp dày.
  for (const s of [-1, 1]) {
    out.push(prism({ x: x + s * w * 0.3, z, y: rt, w: 0.06, d: d * 0.3, h: 0.07, sides: 4, role: 'dark' }));
  }
  out.push(prism({ x, z, y: rt + 0.07, w: w * 2.05, d: d * 0.44, h: 0.075, sides: 4, role: 'trim' }));
  // Vườn trên sàn + lan can kính.
  out.push(prism({ x: x + w * 0.62, z, y: rt + 0.145, w: 0.26, d: d * 0.3, h: 0.075, sides: 6, taper: 0.5, role: 'leaf' }));
  out.push(prism({ x: x - w * 0.62, z, y: rt + 0.145, w: 0.26, d: d * 0.3, h: 0.075, sides: 6, taper: 0.5, role: 'leaf' }));
  out.push(prism({ x, z, y: rt + 0.145, w: w * 1.9, d: 0.03, h: 0.055, sides: 4, role: 'glass' }));
}

/**
 * Kỷ 15 · UAE · Bảo tàng Tương Lai Dubai.
 * Chép lại: VÒNG XUYẾN kính bao quanh một khoảng rỗng. Bộ vẽ chỉ xoay được quanh trục đứng nên
 * không dựng nổi một vòng NGHIÊNG như ngoài đời; nhưng một vành tám cạnh dựng đứng bao quanh nhà
 * vẫn đọc ra "cái vòng", và đó là thứ duy nhất trong 15 kỷ có hình vòng.
 *
 * ⚠️ Khác `motifs: ['halo']` (một đĩa phẳng lơ lửng trên nóc): đĩa nằm ngang nhìn từ camera chếch
 * xuống chỉ ra một cái gạch ngang, còn vành dựng đứng thì luôn thấy được hai cạnh bên — hình vòng
 * chỉ đọc được khi mắt thấy phần RỖNG ở giữa.
 */
function torus(out, ctx) {
  const { x, z, w, d, base, top } = ctx;
  const rise = top - base;
  const n = 8;
  const R = Math.max(w, d) * 0.82;
  for (let i = 0; i < n; i += 1) {
    const a = (i / n) * Math.PI * 2;
    out.push(prism({
      x: x + Math.cos(a) * R, z: z + Math.sin(a) * R,
      y: base + rise * 0.18,
      w: 0.085, d: R * 0.82, h: rise * 0.78,
      sides: 4, ry: a, role: 'glass',
    }));
  }
  // Vành đai trên và dưới khép vòng lại — thiếu chúng thì tám tấm kính đọc ra "hàng rào", không
  // phải "vòng xuyến".
  for (const y of [base + rise * 0.16, base + rise * 0.96]) {
    out.push(prism({ x, z, y, w: R * 2.16, d: R * 2.16, h: 0.05, sides: 8, taper: 0.97, role: 'trim' }));
  }
}

const SIGNATURES = {
  tstone,
  batter,
  ziggurStair,
  dougong,
  turret,
  daoDinh,
  campanile,
  belem,
  portico,
  stack,
  watertower,
  pillbox,
  capsule,
  skydeck,
  torus,
};

/** Tên các chữ ký dựng được — dùng cho test "mỗi kỷ một chữ ký, không kỷ nào trùng". */
export const SIGNATURE_KINDS = Object.keys(SIGNATURES);

/**
 * Dựng chữ ký kiến trúc của một kỷ lên danh sách khối.
 *
 * @param {Array} out    danh sách khối đang dựng — hàm ghi THÊM vào đây
 * @param {string} name  tên chữ ký (`style.signature`)
 * @param {object} ctx   `{ bpId, style, w, d, x, z, base, top, symmetric }`
 * @returns {boolean}    có dựng được gì không (tên lạ → `false`, và công trình vẫn đứng bình thường)
 */
export function emitSignature(out, name, ctx) {
  const build = SIGNATURES[name];
  if (!build || !ctx) return false;
  build(out, ctx);
  return true;
}
