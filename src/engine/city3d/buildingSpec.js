/**
 * buildingSpec.js — nơi ba trục gặp nhau: KỶ (nét vẽ) × LOẠI (khối tích) × ĐỘ HIẾM (quy mô)
 * → một danh sách khối mô tả đúng một công trình.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ BẤT BIẾN CỐT LÕI — "công trình không bao giờ đổi hình":
 * mọi biến thể (số cửa sổ, độ lệch khối, hướng xoay) đều suy từ `hashId(bpId + khoá)`, tái dùng
 * đúng hàm băm của `cityLayout.js`. Vì vậy một công trình xây từ năm ngoái, sau khi kỷ đã bị niêm
 * phong vào bảo tàng, vẫn dựng lại y hệt từng chi tiết — kể cả khi mất localStorage hay đổi máy.
 * Đây là cùng một lời hứa mà ADR-007 đã đưa ra cho VỊ TRÍ, nay mở rộng sang HÌNH DÁNG.
 * Dùng `Math.random` ở đây sẽ phá vỡ lời hứa đó một cách âm thầm: thành phố vẫn chạy, chỉ là mỗi
 * lần mở lại trông một khác.
 */

import { hashId } from '../cityLayout';
import { gable, prism, countSpecTriangles, specHeight, specSpan } from './parts';
import { getEraStyle } from './eraStyle';
import { getArchetype, getMassing, getMotifBudget, getRarityScale } from './archetypes';
import { emitSignature } from './signature';

/** Bề dày mảng tường phụ / gờ / diềm. Đủ để bắt sáng, đủ mỏng để không ăn vào khối chính. */
const TRIM_THICKNESS = 0.055;
/** Cửa sổ nhô ra khỏi mặt tường một chút — chính vệt lồi này tạo bóng đổ nhỏ làm mặt tiền có nhịp. */
const WINDOW_RELIEF = 0.035;

/** Băm → số thực trong [0,1). Tất định tuyệt đối. */
function unit(key) {
  return (hashId(key) % 10000) / 10000;
}

/** Băm → số thực trong [-1,1). Dùng cho độ lệch "tay làm". */
function signed(key) {
  return unit(key) * 2 - 1;
}

/**
 * Chiều cao một mảng nhà. Nâng cấp công trình PHẢI nhìn thấy được là cao lên — đây là phần thưởng
 * hình ảnh cho việc Đàm nâng cấp, nếu không thì cấp 3 chỉ là một con số trong bảng.
 */
function massHeight(mass, style, archetype, rarity, level) {
  // ⚠️ Nâng cấp là HỆ SỐ NHÂN, không phải "cộng thêm một tầng cho mọi mảng nhà". Bản đầu cộng
  // tầng, và với kỳ quan epic (7 mảng, mảng cao nhất 4 tầng) thì cấp 3 làm công trình vọt lên gấp
  // rưỡi rồi đâm ra khỏi khung hình. Nhân thì mọi mảng lớn lên CÙNG tỉ lệ — công trình cao lên
  // thật mà vẫn giữ nguyên dáng.
  // 0,15 chứ không phải 0,2: hệ số này nhân chồng lên hệ số loại VÀ hệ số độ hiếm, nên mỗi phần
  // trăm ở đây bị khuếch đại ba lần. Vẫn đủ để cấp 3 cao hơn cấp 1 khoảng một phần ba — nhìn ra
  // ngay bằng mắt, mà không làm công trình vống lên thành tháp.
  const levelBoost = 1 + (Math.max(1, level) - 1) * 0.15;
  // ⚠️ `massScale` là hệ số "nền văn minh này xây cao tới đâu" — xem chú thích dài ở đầu
  // `eraStyle.js`. Trước ngày 2026-08-14 hệ số này KHÔNG tồn tại, và hậu quả đo được là kỷ 1 (lều
  // da thú) cao trung bình 1,81 còn kỷ 14 (tháp kính) cao 2,05 — chênh đúng 13%, tức là hai thứ ấy
  // gần như cùng một chiều cao. `?? 1` để một kỷ thiếu trường vẫn dựng được như cũ.
  return mass.s * style.storyHeight * (style.massScale ?? 1) * archetype.heightScale
    * getRarityScale(rarity) * levelBoost * (mass.low ? 0.34 : 1);
}

// ─── MÁI ─────────────────────────────────────────────────────────────────────

/**
 * Lợp mái cho một mảng nhà. Đây là chi tiết PHÂN BIỆT KỶ mạnh nhất: cùng một khối hộp, đội mái nón
 * rơm thì ra túp lều, đội phiến kính mỏng thì ra kiến trúc tương lai.
 */
function emitRoof(out, { w, d, top, x, z }, style, ctx) {
  const eaves = style.eaves;
  const rw = w + eaves * 2;
  const rd = d + eaves * 2;
  const pitch = Math.max(0.08, style.roofPitch) * Math.max(w, d);

  switch (style.roof) {
    case 'cone':
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: pitch, sides: 8, taper: 0, role: 'roof' }));
      break;

    case 'gable':
      out.push(gable({
        x, z, y: top, w: rw, d: rd, h: pitch, role: 'roof',
        // Xoay 90° cho một phần công trình để dãy nhà không cùng quay một hướng như xếp hàng.
        //
        // ⚠️ TRỪ KỲ QUAN — lỗi thật, phát hiện 2026-08-14 khi bài test đối xứng được mở rộng ra cả
        // 15 kỷ. Hàm băm ở đây lấy khoá theo `x|z` của TỪNG MẢNG NHÀ, mà kỳ quan epic có bốn tháp
        // góc ở bốn toạ độ khác nhau ⇒ bốn cái mái quay bốn hướng độc lập nhau. Trên màn hình đó là
        // một toà cung điện đối xứng hoàn hảo đội bốn cái mái lệch pha. Bài test cũ không bắt được
        // vì nó chỉ soi kỷ 1 (mái `cone`, không có nóc để mà quay); chỉ hai kỷ mái `gable` (5 và 8)
        // dính, và cả hai đều đã chạy như vậy nhiều tháng mà không có gì đỏ lên.
        ry: !ctx.symmetric && unit(`${ctx.bpId}|ridge|${x}|${z}`) > 0.55 ? Math.PI / 2 : 0,
      }));
      break;

    case 'flat': {
      // Mái bằng vẫn phải có GỜ CHẮN MÁI, nếu không khối hộp cụt ngọn trông như bị cắt dở.
      //
      // ⚠️ VÀ NÓ PHẢI CÓ MỘT TẤM PHỦ MANG MÀU KỶ — sửa 2026-08-13, `TECH_DEBT.md` #18.
      // Bản cũ chỉ đẩy ĐÚNG MỘT khối với `role: 'trim'`, mà `trim` là vai TRUNG TÍNH (họ tường,
      // chỉ ngấm 0,18 sắc kỷ). Nghĩa là ba kỷ 12/13/14 — cả ba đều `roof: 'flat'` — **chưa bao giờ
      // hiện lấy một milimét vuông màu mái nào**. Bản sắc kỷ nằm ở vai `roof`, mà mấy kỷ ấy không
      // có chỗ nào dùng vai `roof` cả.
      // Hệ quả đo được trên bản quét 15 kỷ × 6 chặng: kỷ 12 ↔ 13 chỉ cách nhau 6,4/255 (ngưỡng mắt
      // ~12) dù MÀU mái của hai kỷ ở tầng thuần đã tách bạch thừa sức. Đây là ví dụ sạch của bài
      // học *"màu đúng ở bảng màu không có nghĩa là màu ĐẾN ĐƯỢC mắt người xem"*: lỗi không nằm ở
      // bảng màu, không nằm ở ánh sáng, mà ở chỗ **không có bề mặt nào để màu ấy nói ra**.
      //
      // Cách sửa đúng với kiến trúc hiện đại thật: nhà mái bằng có **diềm mái (parapet) bằng bê
      // tông/đá ốp** bao quanh, còn mặt sàn mái bên trong thì phủ vật liệu chống thấm — hai vật
      // liệu khác nhau, và nhìn từ trên cao xuống (đúng góc camera của thành phố này) thì mặt sàn
      // mái là một mảng RẤT to. Nên: giữ nguyên gờ trung tính ở vành ngoài, đặt thêm một tấm phủ
      // hẹp hơn một chút mang vai `roof` nằm trong lòng nó.
      // ⚠️ Tấm phủ phải HẸP HƠN gờ (0,94) — bằng hoặc rộng hơn thì nó nuốt mất cái gờ và khối lại
      // trông như bị cắt cụt, đúng cái bệnh mà gờ chắn mái sinh ra để chữa.
      const lip = Math.max(0.05, pitch * 0.28);
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: lip, sides: 4, role: 'trim' }));
      out.push(prism({
        x, z, y: top + lip, w: rw * 0.94, d: rd * 0.94,
        h: Math.max(0.05, pitch * 0.34), sides: 4, role: 'roof',
      }));
      break;
    }

    case 'stepped': {
      let cw = rw;
      let cd = rd;
      let cy = top;
      for (let i = 0; i < 3; i += 1) {
        const h = pitch * (0.5 - i * 0.12);
        out.push(prism({ x, z, y: cy, w: cw, d: cd, h, sides: 4, role: i === 0 ? 'trim' : 'roof' }));
        cy += h;
        cw *= 0.72;
        cd *= 0.72;
      }
      break;
    }

    case 'tiered': {
      // Mái chồng nhiều tầng, diềm thò rất xa — đường nét Á Đông. Mỗi tầng là một chóp RẤT THOẢI
      // (taper cao, chiều cao thấp): đó là cách rẻ nhất diễn tả mái cong mà không cần mặt cong.
      const tiers = ctx.rarity === 'common' ? 1 : ctx.rarity === 'rare' ? 2 : 3;
      let cy = top;
      for (let i = 0; i < tiers; i += 1) {
        const shrink = 1 - i * 0.2;
        const h = pitch * (0.62 - i * 0.06);
        out.push(prism({
          x, z, y: cy, w: rw * shrink, d: rd * shrink, h,
          sides: 4, taper: 0.34, role: 'roof',
        }));
        // gờ diềm mỏng dưới mỗi tầng mái — chỗ bắt sáng làm mái "dày" lên
        out.push(prism({
          x, z, y: cy - TRIM_THICKNESS, w: rw * shrink * 1.04, d: rd * shrink * 1.04,
          h: TRIM_THICKNESS, sides: 4, role: 'trim',
        }));
        cy += h + pitch * 0.1;
      }
      break;
    }

    case 'dome': {
      // Tang trống + vòm + chóp. Hình bóng đặc trưng nhất của kỷ Phục Hưng — chính cái Đàm lấy
      // làm chuẩn thẩm mỹ, nên nó đáng bốn khối thay vì ba.
      // ⚠️ Vòm phải dựng bằng HAI đoạn chồng nhau (thóp ít rồi thóp nhiều). Bản đầu dùng một đoạn
      // `taper: 0.28` và ra một cái nón nhọn trông như mũ sinh nhật — đường cong của mái vòm nằm ở
      // chỗ nó phình ra ở dưới rồi mới thu lại ở trên, một đoạn thẳng không diễn tả nổi.
      const drum = Math.min(w, d) * 0.78;
      const cornice = pitch * 0.26;
      out.push(prism({ x, z, y: top, w: drum * 1.12, d: drum * 1.12, h: cornice * 0.5, sides: 8, role: 'trim' }));
      out.push(prism({ x, z, y: top + cornice * 0.5, w: drum, d: drum, h: cornice, sides: 8, role: 'trim' }));
      out.push(prism({
        x, z, y: top + cornice * 1.5, w: drum * 1.04, d: drum * 1.04, h: pitch * 0.42,
        sides: 8, taper: 0.82, role: 'roof',
      }));
      out.push(prism({
        x, z, y: top + cornice * 1.5 + pitch * 0.42, w: drum * 0.85, d: drum * 0.85, h: pitch * 0.46,
        sides: 8, taper: 0.24, role: 'roof',
      }));
      out.push(prism({
        x, z, y: top + cornice * 1.5 + pitch * 0.88, w: drum * 0.2, d: drum * 0.2, h: pitch * 0.3,
        sides: 6, taper: 0.2, role: 'gold',
      }));
      break;
    }

    case 'pyramid':
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: pitch, sides: 4, taper: 0.06, role: 'roof' }));
      break;

    case 'sawtooth': {
      // Mái răng cưa nhà xưởng: ba dải mái nhỏ song song, đúng nét kỷ Công Nghiệp.
      const teeth = 3;
      const step = rd / teeth;
      for (let i = 0; i < teeth; i += 1) {
        out.push(gable({
          x, z: z - rd / 2 + step * (i + 0.5), y: top,
          w: rw, d: step * 0.92, h: pitch * 0.7, role: 'roof',
        }));
      }
      break;
    }

    case 'blade':
      // Phiến mỏng lơ lửng, tách khỏi thân bằng một khe hở — khe hở mới là thứ tạo cảm giác bay.
      out.push(prism({
        x, z, y: top + pitch * 0.5, w: rw * 1.12, d: rd * 1.12, h: pitch * 0.34,
        sides: 4, role: 'roof',
      }));
      break;

    default:
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: pitch * 0.5, sides: 4, role: 'trim' }));
  }
}

// ─── CỬA SỔ ──────────────────────────────────────────────────────────────────

/**
 * Nhịp cửa sổ trên bốn mặt tường. Đây là thứ làm mặt tiền có "nhịp điệu" — mắt người nhận ra một
 * toà nhà trước hết qua nhịp cửa sổ, kể cả khi nó chỉ to bằng đầu ngón tay trên màn hình.
 *
 * Vẽ đủ bốn mặt vì camera xoay được 360°: bỏ mặt sau sẽ lộ ra ngay lần đầu Đàm kéo xoay.
 */
function emitWindows(out, { w, d, base, height, x, z }, style) {
  if (style.windows === 'none' || height < 0.3) return;

  const stories = Math.max(1, Math.round(height / style.storyHeight));
  // `sideways` = mặt tường nằm trên hai cạnh trái/phải; cửa sổ ở đó chạy dọc trục Z, còn ở mặt
  // trước/sau thì chạy dọc trục X. Một cờ boolean gọn hơn nhiều so với xoay từng khối một.
  const faces = [
    { nx: 0, nz: 1, span: w, sideways: false },
    { nx: 0, nz: -1, span: w, sideways: false },
    { nx: 1, nz: 0, span: d, sideways: true },
    { nx: -1, nz: 0, span: d, sideways: true },
  ];

  for (const face of faces) {
    const wallOffset = face.sideways
      ? { x: x + face.nx * (w / 2), z }
      : { x, z: z + face.nz * (d / 2) };

    if (style.windows === 'curtain' || style.windows === 'neon') {
      // Dải kính liền mạch: một băng ngang mỗi tầng, rẻ hơn nhiều so với hàng chục ô rời mà
      // lại đúng hình ảnh nhà kính hiện đại hơn.
      for (let s = 0; s < stories; s += 1) {
        const y = base + (s + 0.42) * (height / stories);
        out.push(prism({
          x: wallOffset.x, z: wallOffset.z, y,
          w: face.sideways ? WINDOW_RELIEF : face.span * 0.9,
          d: face.sideways ? face.span * 0.9 : WINDOW_RELIEF,
          h: (height / stories) * (style.windows === 'neon' ? 0.16 : 0.42),
          sides: 4, role: 'glass',
        }));
      }
      continue;
    }

    const cols = style.windows === 'grid'
      ? Math.max(2, Math.min(4, Math.round(face.span / 0.26)))
      : Math.max(1, Math.min(3, Math.round(face.span / 0.34)));

    for (let s = 0; s < stories; s += 1) {
      for (let c = 0; c < cols; c += 1) {
        const t = cols === 1 ? 0 : (c / (cols - 1)) - 0.5;
        const along = t * face.span * 0.62;
        const y = base + (s + 0.38) * (height / stories);
        const isSlit = style.windows === 'slit';
        const ww = isSlit ? 0.055 : 0.1;
        const wh = isSlit ? (height / stories) * 0.44 : (height / stories) * 0.3;

        const px = face.sideways ? wallOffset.x : wallOffset.x + along;
        const pz = face.sideways ? wallOffset.z + along : wallOffset.z;

        out.push(prism({
          x: px, z: pz, y,
          w: face.sideways ? WINDOW_RELIEF : ww,
          d: face.sideways ? ww : WINDOW_RELIEF,
          h: wh, sides: 4, role: 'glass',
        }));

        // Cửa vòm: thêm nửa vòm phía trên. Chỉ ở kỷ có `arch` — đây là dấu hiệu nhận dạng
        // mạnh nhất của kiến trúc Phục Hưng / Tân cổ điển.
        if (style.windows === 'arch') {
          out.push(prism({
            x: px, z: pz, y: y + wh,
            w: face.sideways ? WINDOW_RELIEF : ww,
            d: face.sideways ? ww : WINDOW_RELIEF,
            h: ww * 0.85, sides: 6, taper: 0.2, role: 'glass',
          }));
        }
      }
    }
  }

  // Cửa ra vào ở mặt trước — cái neo tỉ lệ, giúp mắt ước lượng công trình to cỡ nào.
  out.push(prism({
    x, z: z + d / 2, y: base,
    w: 0.14, d: WINDOW_RELIEF, h: Math.min(0.3, height * 0.32),
    sides: 4, role: 'dark',
  }));
}

// ─── CHI TIẾT ĐẶC TRƯNG ──────────────────────────────────────────────────────

/**
 * Các chi tiết làm nên "chất" của kỷ. Chỉ hạng `rare`/`epic` mới có (xem `RARITY_MOTIF_BUDGET`) —
 * đó chính là cách để độ hiếm cảm nhận được bằng mắt chứ không chỉ là một chữ trong danh sách.
 */
function emitMotif(out, name, ctx) {
  const { w, d, top, base, x, z, bpId } = ctx;
  const r = (k) => unit(`${bpId}|${name}|${k}`);

  switch (name) {
    case 'columns': {
      const count = 4;
      for (let i = 0; i < count; i += 1) {
        const t = (i / (count - 1)) - 0.5;
        out.push(prism({
          x: x + t * w * 0.82, z: z + d / 2 + 0.06, y: base,
          w: 0.075, h: (top - base) * 0.86, sides: 8, taper: 0.86, role: 'trim',
        }));
      }
      break;
    }
    case 'arcade': {
      // Dãy vòm cuốn dưới chân nhà — nhịp ngang mềm, rất "quảng trường Ý".
      for (let i = 0; i < 3; i += 1) {
        const t = (i / 2) - 0.5;
        out.push(prism({
          x: x + t * w * 0.62, z: z + d / 2 + 0.05, y: base + 0.02,
          w: 0.15, d: 0.06, h: (top - base) * 0.3, sides: 6, taper: 0.3, role: 'dark',
        }));
      }
      break;
    }
    case 'statue':
      out.push(prism({
        x: x + w * 0.4, z: z + d * 0.42, y: top, w: 0.09, h: 0.2,
        sides: 6, taper: 0.5, role: 'gold',
      }));
      break;
    case 'pediment':
      out.push(gable({ x, z: z + d / 2 - 0.02, y: top, w: w * 0.9, d: 0.14, h: w * 0.2, role: 'trim' }));
      break;
    case 'chimney': {
      const count = 2;
      for (let i = 0; i < count; i += 1) {
        out.push(prism({
          x: x + (i - 0.5) * w * 0.5, z: z - d * 0.24, y: top,
          w: 0.1, h: 0.42 + r(i) * 0.22, sides: 6, role: 'stone',
        }));
      }
      break;
    }
    case 'truss':
      out.push(prism({ x, z, y: top, w: w * 0.9, d: 0.05, h: 0.1, sides: 4, role: 'dark' }));
      break;
    case 'antenna':
      out.push(prism({ x: x + w * 0.28, z: z - d * 0.28, y: top, w: 0.028, h: 0.55, sides: 4, role: 'dark' }));
      break;
    case 'dish':
      out.push(prism({
        x: x - w * 0.26, z: z + d * 0.2, y: top, w: 0.18, h: 0.07,
        sides: 8, taper: 0.35, ry: r('a') * Math.PI, role: 'trim',
      }));
      break;
    case 'spire':
      out.push(prism({ x, z, y: top, w: w * 0.22, h: (top - base) * 0.72, sides: 6, taper: 0, role: 'gold' }));
      break;
    case 'banner': {
      for (let i = 0; i < 2; i += 1) {
        out.push(prism({
          x: x + (i - 0.5) * w * 0.72, z: z + d / 2 + 0.04, y: base + (top - base) * 0.35,
          w: 0.05, d: 0.02, h: (top - base) * 0.5, sides: 4, role: 'gold',
        }));
      }
      break;
    }
    case 'mast':
      out.push(prism({ x: x + w * 0.34, z: z + d * 0.3, y: top, w: 0.03, h: 0.75, sides: 4, role: 'wood' }));
      out.push(prism({ x: x + w * 0.34, z: z + d * 0.3, y: top + 0.4, w: 0.28, d: 0.02, h: 0.02, sides: 4, role: 'wood' }));
      break;
    case 'crate':
      for (let i = 0; i < 3; i += 1) {
        out.push(prism({
          x: x - w * 0.5 + r(i) * 0.14, z: z + d * 0.52 + r(`${i}b`) * 0.1, y: base,
          w: 0.12, h: 0.12, sides: 4, ry: r(`${i}c`) * 0.8, role: 'wood',
        }));
      }
      break;
    case 'crenel': {
      const count = 4;
      for (let i = 0; i < count; i += 1) {
        const t = (i / (count - 1)) - 0.5;
        out.push(prism({ x: x + t * w * 0.84, z: z + d * 0.44, y: top, w: 0.1, d: 0.08, h: 0.11, sides: 4, role: 'stone' }));
        out.push(prism({ x: x + t * w * 0.84, z: z - d * 0.44, y: top, w: 0.1, d: 0.08, h: 0.11, sides: 4, role: 'stone' }));
      }
      break;
    }
    case 'buttress':
      for (let i = 0; i < 2; i += 1) {
        out.push(prism({
          x: x + (i - 0.5) * w * 1.02, z, y: base,
          w: 0.09, d: d * 0.5, h: (top - base) * 0.66, sides: 4, taper: 0.45, role: 'stone',
        }));
      }
      break;
    case 'bunker':
      out.push(prism({ x, z: z + d * 0.56, y: base, w: w * 0.7, d: 0.16, h: 0.14, sides: 4, taper: 0.7, role: 'stone' }));
      break;
    case 'fence':
      for (let i = 0; i < 5; i += 1) {
        const t = (i / 4) - 0.5;
        out.push(prism({ x: x + t * w * 1.3, z: z + d * 0.75, y: base, w: 0.035, h: 0.18, sides: 4, role: 'wood' }));
      }
      break;
    case 'granary':
      out.push(prism({ x: x - w * 0.62, z: z + d * 0.3, y: base, w: 0.2, h: 0.26, sides: 8, role: 'wood' }));
      out.push(prism({ x: x - w * 0.62, z: z + d * 0.3, y: base + 0.26, w: 0.24, h: 0.16, sides: 8, taper: 0, role: 'roof' }));
      break;
    case 'boulder':
      for (let i = 0; i < 3; i += 1) {
        out.push(prism({
          x: x + signed(`${bpId}|bo|${i}`) * w * 0.7, z: z + signed(`${bpId}|bo|${i}z`) * d * 0.7,
          y: base, w: 0.1 + r(i) * 0.08, h: 0.09 + r(`${i}h`) * 0.07,
          sides: 6, taper: 0.6, ry: r(`${i}r`) * 2, role: 'stone',
        }));
      }
      break;
    case 'firepit':
      out.push(prism({ x: x + w * 0.6, z: z + d * 0.5, y: base, w: 0.16, h: 0.05, sides: 8, role: 'stone' }));
      out.push(prism({ x: x + w * 0.6, z: z + d * 0.5, y: base + 0.05, w: 0.08, h: 0.09, sides: 4, taper: 0, role: 'gold' }));
      break;
    case 'pillar':
      for (let i = 0; i < 2; i += 1) {
        out.push(prism({
          x: x + (i - 0.5) * w * 0.9, z: z + d * 0.6, y: base,
          w: 0.09, h: (top - base) * 0.8, sides: 4, taper: 0.8, role: 'stone',
        }));
      }
      break;
    case 'ramp':
      out.push(prism({ x, z: z + d * 0.72, y: base, w: w * 0.4, d: d * 0.4, h: 0.09, sides: 4, taper: 0.55, role: 'stone' }));
      break;
    case 'courtyard':
      out.push(prism({ x, z: z + d * 0.82, y: base, w: w * 1.1, d: 0.05, h: 0.12, sides: 4, role: 'stone' }));
      break;
    case 'sign':
      out.push(prism({ x, z: z + d / 2 + 0.03, y: top - 0.18, w: w * 0.42, d: 0.03, h: 0.12, sides: 4, role: 'glass' }));
      break;
    case 'solar':
      out.push(prism({ x, z, y: top + 0.02, w: w * 0.5, d: d * 0.5, h: 0.03, sides: 4, ry: 0.3, role: 'glass' }));
      break;
    case 'halo':
      // Vòng sáng lơ lửng trên nóc — hình bóng nhận ra ngay là "kỷ AI" dù nhìn từ xa.
      out.push(prism({ x, z, y: top + 0.22, w: w * 1.05, d: d * 1.05, h: 0.035, sides: 12, role: 'glass' }));
      break;
    case 'float':
      out.push(prism({ x, z, y: base - 0.16, w: w * 0.55, d: d * 0.55, h: 0.1, sides: 8, taper: 0.3, role: 'glass' }));
      break;
    default:
      break;
  }
}

// ─── HÀM CHÍNH ───────────────────────────────────────────────────────────────

/**
 * Mô tả hình học đầy đủ của MỘT công trình.
 *
 * @param {object} input
 * @param {string} input.bpId    id bản vẽ — hạt giống cho mọi biến thể tất định
 * @param {number} input.era     1..15
 * @param {string} input.type    'infrastructure' | 'economy' | 'defense' | 'wonder'
 * @param {string} input.rarity  'common' | 'rare' | 'epic'
 * @param {number} [input.level] 1..3 — cấp nâng cấp, làm công trình cao thêm THẬT
 * @returns {{parts:Array, height:number, span:number, triangles:number}}
 */
export function buildBuildingSpec({ bpId, era, type, rarity = 'common', level = 1 } = {}) {
  const id = typeof bpId === 'string' && bpId ? bpId : 'bp_unknown';
  const style = getEraStyle(era);
  const archetype = getArchetype(type);
  const masses = getMassing(type, rarity);
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.min(3, Math.floor(level))) : 1;

  // Bề ngang theo kỷ. Đi CẶP với `massScale`: một mình chiều cao chưa tách được túp lều khỏi tháp
  // kính, vì cái quyết định hình bóng là TỈ LỆ cao/rộng. Lều thì vừa thấp vừa nhỏ (0,42 × 0,80),
  // tháp kính vừa cao vừa mảnh (1,30 × 0,80) — cùng bề ngang mà chiều cao gấp ba.
  // ⚠️ Nhân vào cả `w`/`d` của thân nhà LẪN toạ độ lệch tâm `x`/`z`: chỉ phóng to khối mà giữ
  // nguyên khoảng cách giữa chúng thì các mảng nhà chồng lên nhau (kỷ 3 `spread` 1,18 là ca nặng
  // nhất, hai mảng phụ của hạ tầng epic sẽ ăn vào thân chính).
  const spread = Number.isFinite(style.spread) && style.spread > 0 ? style.spread : 1;

  const parts = [];
  // Độ lệch "tay làm": kỷ tiền sử để khối xiêu vẹo tự nhiên, kỷ hiện đại thẳng băng.
  // ⚠️ Kỳ quan luôn ĐỐI XỨNG tuyệt đối dù ở kỷ nào — công trình trung tâm mà xiêu vẹo thì cả
  // thành phố mất điểm tựa thị giác.
  const rough = archetype.symmetric ? 0 : style.rough;

  masses.forEach((mass, index) => {
    // ⚠️ `rough === 0` thì BỎ HẲN phép tính lệch, không nhân với 0. Nhân số âm với 0 trong
    // JavaScript ra `-0`, mà `-0` không bằng `0` theo `Object.is` — nghĩa là bài test đối xứng
    // của kỳ quan sẽ đỏ vì một khối xoay đúng 0 độ. Rẽ nhánh sớm vừa đúng vừa đỡ băm vô ích.
    const jitterX = rough ? signed(`${id}|jx|${index}`) * rough * 0.06 : 0;
    const jitterZ = rough ? signed(`${id}|jz|${index}`) * rough * 0.06 : 0;
    const jitterR = rough ? signed(`${id}|jr|${index}`) * rough * 0.14 : 0;

    const x = mass.x * spread + jitterX;
    const z = mass.z * spread + jitterZ;
    const w = mass.w * spread * (rough ? 1 + signed(`${id}|jw|${index}`) * rough * 0.08 : 1);
    const d = mass.d * spread * (rough ? 1 + signed(`${id}|jd|${index}`) * rough * 0.08 : 1);
    const height = massHeight(mass, style, archetype, rarity, safeLevel);
    const base = 0;
    const top = base + height;

    // Thân nhà. Tháp góc thì thóp mạnh hơn cho ra dáng tháp canh.
    parts.push(prism({
      x, z, y: base, w, d, h: height,
      sides: mass.tower ? Math.max(4, style.bodySides) : style.bodySides,
      taper: mass.tower ? Math.min(style.bodyTaper, 0.82) : style.bodyTaper,
      ry: jitterR,
      role: mass.role ?? 'wall',
    }));

    // Gờ chân tường — đường ngang mảnh nơi nhà chạm đất. Thiếu nó, nhà trông như bị cắm vào đất.
    parts.push(prism({
      x, z, y: base, w: w * 1.05, d: d * 1.05, h: TRIM_THICKNESS,
      sides: style.bodySides, ry: jitterR, role: 'stone',
    }));

    const ctx = {
      bpId: id, era, rarity, level: safeLevel, w, d, x, z, base, top, style,
      // ⚠️ `emitRoof` cần biết đây có phải kỳ quan không — xem lý do ở nhánh `gable`.
      symmetric: Boolean(archetype.symmetric),
    };

    if (!mass.low) {
      // ⚠️ Tháp góc KHÔNG gắn cửa sổ. Chúng chỉ rộng ~0.2 ô: nhồi cửa sổ vào đó vừa không nhìn ra
      // hình gì, vừa ngốn phần lớn ngân sách tam giác của cả công trình (đo được: kỳ quan kỷ 7 rơi
      // từ ~12.500 xuống ~5.000 tam giác chỉ nhờ bỏ chi tiết này). Dáng thóp + mái nhọn của tháp
      // đã đủ để mắt nhận ra nó là tháp.
      if (!mass.tower) emitWindows(parts, { w, d, base, height, x, z }, style);
      emitRoof(parts, { w, d, top, x, z }, style, ctx);
    } else {
      // Khối thấp (sân, bệ, tường bao): chỉ có gờ trên, không lợp mái.
      parts.push(prism({
        x, z, y: top, w: w * 1.02, d: d * 1.02, h: TRIM_THICKNESS, sides: 4, role: 'trim',
      }));
    }
  });

  // ── CHỮ KÝ KIẾN TRÚC — bộ phận lấy từ một công trình CÓ THẬT của nước biểu tượng ──────────
  //
  // ⚠️ ĐẶT TRƯỚC KHỐI `deco` VÀ KHÔNG ĐƯỢC ĐÁNH DẤU `deco`: chữ ký là CĂN CƯỚC của kỷ, không phải
  // trang trí. Bỏ nó đi thì kỷ 5 hết là lâu đài Đức và kỷ 13 hết là Nakagin — tức công trình đổi
  // danh tính, đúng ranh giới "kết cấu vs trang trí" mà chú thích dưới đây định nghĩa.
  //
  // ⚠️ VÀ NÓ DỰNG Ở MỌI HẠNG, KỂ CẢ `common`. Đây là điểm khác quan trọng nhất so với `motifs`:
  // `RARITY_MOTIF_BUDGET.common = 0` nghĩa là 2 trong 5 công trình mỗi kỷ (30 trong 75 căn của cả
  // game) hiện KHÔNG có lấy một chi tiết đặc trưng nào — chúng là hộp trơn đội mái. Độ hiếm nên
  // quyết định công trình BỀ THẾ tới đâu, không nên quyết định nó có thuộc về kỷ nào hay không.
  const mainMass = masses.find((m) => !m.low) ?? masses[0];
  const mainMassHeight = massHeight(mainMass, style, archetype, rarity, safeLevel);
  const mainCtx = {
    bpId: id, era, rarity, style,
    w: mainMass.w * spread, d: mainMass.d * spread,
    x: mainMass.x * spread, z: mainMass.z * spread,
    base: 0, top: mainMassHeight,
    // Kỳ quan đứng giữa thành phố ⇒ chữ ký phải cân hai bên và tuyệt đối không xoay.
    symmetric: Boolean(archetype.symmetric),
  };
  emitSignature(parts, style.signature, mainCtx);

  // ── Chi tiết đặc trưng của kỷ, số lượng theo độ hiếm ──────────────────────
  // ⚠️ Mọi khối sinh ra từ đây trở xuống được đánh dấu `deco: true`. Đó KHÔNG phải cờ phục vụ
  // test: nó tách "kết cấu" (thân, mái, tháp — bỏ đi là công trình biến dạng) khỏi "trang trí"
  // (tảng đá, thùng hàng, cờ — bỏ đi vẫn còn nguyên công trình). Ranh giới này là thứ cho phép
  // hạ chi tiết trên máy yếu mà không phá hình bóng, và nó cũng giải thích vì sao đá thờ quanh
  // kỳ quan kỷ 1 được phép xoay lệch trong khi bản thân kỳ quan thì tuyệt đối đối xứng.
  const structuralCount = parts.length;
  const budget = getMotifBudget(rarity);
  if (budget > 0) {
    // ⚠️ Chi tiết đặc trưng cũng phải nhân `spread` — đã lo sẵn trong `mainCtx` ở trên. Bỏ sót chỗ
    // này thì hàng cột của kỷ 3 (bè 1,18) đứng thụt vào giữa mặt tiền, còn cột buồm của kỷ 14
    // (mảnh 0,80) chọc ra ngoài tường.
    for (const name of style.motifs.slice(0, budget)) {
      emitMotif(parts, name, mainCtx);
    }
  }
  for (let i = structuralCount; i < parts.length; i += 1) parts[i].deco = true;

  return {
    parts,
    height: specHeight(parts),
    span: specSpan(parts),
    triangles: countSpecTriangles(parts),
  };
}

/**
 * Giàn giáo cho công trình ĐANG XÂY — thành phố lớn lên sau MỖI phiên, không phải chỉ lúc công
 * trình hoàn thành. `progress` 0..1 lấy từ `craftingQueue`.
 */
export function buildScaffoldSpec({ bpId, era, progress = 0 } = {}) {
  const id = typeof bpId === 'string' && bpId ? bpId : 'bp_unknown';
  const style = getEraStyle(era);
  const t = Math.min(1, Math.max(0, Number.isFinite(progress) ? progress : 0));
  const parts = [];

  // Giàn giáo mang ĐÚNG tỉ lệ của kỷ: công trường kỷ 1 là một cái khung con con, công trường kỷ 15
  // là một cái lồng cao vống. Nếu bỏ qua hai hệ số này thì mọi kỷ có chung một cái khung, và lúc
  // công trình dựng xong nó sẽ "nhảy" đột ngột sang một kích cỡ khác hẳn.
  const spread = Number.isFinite(style.spread) && style.spread > 0 ? style.spread : 1;
  const w = 0.66 * spread;
  const post = w * 0.42;
  const fullHeight = style.storyHeight * 2 * (style.massScale ?? 1);
  // ⚠️ CỘT GIÀN GIÁO LUÔN CAO HƠN PHẦN ĐÃ XÂY, kể cả lúc mới khởi công — đó là điều khiến mắt đọc
  // ra "công trường" thay vì "cái nhà lùn". Ngoài đời giàn giáo bao giờ cũng vượt lên trên chỗ thợ
  // đang làm; và ở đây nó còn kiêm một việc nữa: cho thấy công trình này SẼ CAO TỚI ĐÂU, tức là
  // biến giàn giáo thành một lời hứa nhìn thấy được chứ không chỉ là một thanh tiến độ.
  // ⚠️ Sàn tối thiểu phải là TỈ LỆ, không phải một con số tuyệt đối. Bản cũ ghi cứng `0.10`, đúng
  // 7,6% chiều cao của kỷ 6 — con số duy nhất bài test đo tới. Khi `massScale` ra đời, cùng cái sàn
  // ấy thành 24% chiều cao của kỷ 1 (lều thấp), làm giàn giáo kỷ đó gần như không lớn lên nữa, mà
  // "nhìn thấy thành phố lớn lên sau mỗi phiên" mới là lời hứa game hoá cốt lõi. Để tỉ lệ thì mọi
  // kỷ đều lớn lên đúng 3,38 lần, không phụ thuộc kỷ nào đang chơi.
  const built = Math.max(fullHeight * 0.076, fullHeight * t);
  const height = Math.min(fullHeight, built + fullHeight * 0.22);

  // Bốn cột góc.
  for (let i = 0; i < 4; i += 1) {
    parts.push(prism({
      x: (i % 2 === 0 ? -1 : 1) * post, z: (i < 2 ? -1 : 1) * post,
      y: 0, w: 0.045, h: height, sides: 4, role: 'wood',
    }));
  }

  // ⚠️ GIẰNG PHẢI KHÉP KÍN BỐN MẶT, KHÔNG PHẢI HAI. Bản đầu chỉ đặt giằng ở hai mặt đối nhau, và
  // ảnh chụp thử cho ra thứ trông y như một CÁI CỔNG dựng giữa đồng: từ góc nhìn của app, hai mặt
  // còn lại trống hoác nên mắt không khép được khối, và cả cụm đọc ra hình phẳng. Thêm hai thanh
  // xoay 90° (`ry`) là đủ để nó thành cái lồng — rẻ, và đây đúng là chỗ chi tiết đổi được ý nghĩa
  // chứ không chỉ làm đẹp thêm.
  const rungs = Math.max(1, Math.round(t * 3));
  for (let i = 0; i < rungs; i += 1) {
    const y = height * ((i + 1) / (rungs + 0.5));
    for (let side = 0; side < 4; side += 1) {
      const along = side < 2;                     // 2 thanh dọc trục X, 2 thanh dọc trục Z
      const sign = side % 2 === 0 ? -1 : 1;
      parts.push(prism({
        x: along ? 0 : sign * post,
        z: along ? sign * post : 0,
        y,
        w: w * 0.92, d: 0.035, h: 0.035, sides: 4,
        ry: along ? 0 : Math.PI / 2,
        role: 'wood',
      }));
    }
  }

  // Phần tường đã xây xong, nhô lên trong lòng giàn giáo. Dùng ĐÚNG hình khối thân của kỷ (số cạnh,
  // độ thóp) — nên ngay từ lúc còn là công trường, Đàm đã nhận ra được đây sắp là nhà kiểu gì.
  if (t > 0.12) {
    parts.push(prism({
      x: 0, z: 0, y: 0, w: w * 0.66, d: w * 0.66, h: built,
      sides: style.bodySides, taper: style.bodyTaper, role: 'stone',
    }));
  }

  // Đống vật liệu tập kết dưới chân — chi tiết nhỏ nhất mà lại là thứ nói to nhất rằng "chỗ này CÓ
  // NGƯỜI ĐANG LÀM". Vơi dần khi công trình gần xong: sắp hoàn thành thì vật liệu đã lên tường hết.
  const piles = t < 0.85 ? 2 : 1;
  for (let i = 0; i < piles; i += 1) {
    parts.push(prism({
      x: (i === 0 ? -1 : 1) * post * 1.34, z: post * (i === 0 ? 1.24 : -0.9),
      y: 0, w: 0.11 - i * 0.02, d: 0.09, h: 0.05 + (1 - t) * 0.05,
      sides: 4, role: 'wood',
    }));
  }

  void id;

  return {
    parts,
    height: specHeight(parts),
    span: specSpan(parts),
    triangles: countSpecTriangles(parts),
  };
}
