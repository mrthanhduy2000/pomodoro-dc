/**
 * hinterland.js — HÌNH của vùng phụ cận. Bảng nói "vùng quanh đô thị này có gì"; file này nói
 * "thứ ấy trông ra sao".
 *
 * Cùng khuôn ba lớp đã dùng bảy lần (`vernacularRoof` · `undergrowth` · `streetStyle` ·
 * `groundFloor` · `floraStyle` · `settingStyle` · `hinterlandStyle`):
 * BẢNG (`hinterlandStyle.js`) → HÌNH (file này) → `cityParts`/`sceneGraph` chỉ ĐỌC.
 *
 * ⚠️ LUẬT MỸ THUẬT CỦA FILE NÀY: **ĐƯỜNG VIỀN TRƯỚC, BỀ MẶT SAU.** Phase 11 đã trả giá cho luật
 * này: 110.076 tam giác đổ lên mái nhà, và bản quét 15 kỷ **không phân biệt nổi** với bản trước
 * (trung vị 2,2 trên ngưỡng mắt 12). Đo ra thì thứ sống sót ở xa là thứ đổi ĐƯỜNG VIỀN cắt lên nền
 * (lan can kỷ 7 đổi 8,4% điểm ảnh) chứ không phải thứ thêm BỀ MẶT (ngói bò kỷ 8 tốn nhiều hình học
 * nhất bảng mà chỉ đổi 1,2%).
 *
 * Vì vậy mọi thứ trong file này thuộc đúng một trong hai nhóm, và nhóm nào cũng có lý do:
 *
 *  · **ĐỨNG LÊN KHỎI MẶT ĐẤT** (ống khói · cối xay · tháp canh · cần cẩu · giàn khoan · cổng thành ·
 *    đá dựng · nhà xóm · cầu · đường trên cao). Chúng cắt lên nền trời hoặc lên sườn núi, nên mắt
 *    đọc được ở cỡ vài điểm ảnh. Đây là nhóm mua tín hiệu quy mô.
 *  · **NẰM BẸT NHƯNG THÀNH ĐƯỜNG NÉT DÀI** (ruộng có bờ · kênh · đê · đường ra khỏi khung · đường
 *    sắt · tường thành). Một mảng màu bẹt thì tan vào mặt đất; một ĐƯỜNG dài thì không, vì mắt
 *    người bắt đường nét mạnh hơn bắt sắc độ. Đây là lý do bờ ruộng và đường ray được dựng thành
 *    khối nổi lên vài phần trăm ô chứ không phải tô một màu khác lên đất.
 *
 * ⚠️ KHÔNG có thứ nào ở đây thuộc nhóm thứ ba ("thêm vân bề mặt cho đẹp"). Ở khung toàn cảnh mỗi
 * căn nhà chỉ cao 40–60 điểm ảnh (`TECH_DEBT #41`), nên vân bề mặt ngoài lưới là hình học vứt đi.
 *
 * ⚠️ VÀ VÌ SAO KHÔNG CÓ VAI MÀU `metal`/`concrete` DÙ CẦN CẨU VÀ ĐƯỜNG TRÊN CAO RÕ RÀNG LÀ THÉP VÀ
 * BÊ TÔNG. Thêm một vai mới thì phải sửa bốn chỗ (`PART_ROLES` · `ROLE_FAMILY` · bảng màu · và một
 * bài test đã có sẵn đòi mọi vai phải có màu), và nó kéo theo một HỌ VẬT LIỆU mới cho những kỷ
 * chưa dùng họ ấy — tức thêm lệnh vẽ. Cái giá ấy chấp nhận được sau §0, nhưng **thứ mua được thì
 * không**: khác biệt giữa `stone` (nhám 0,74) và `concrete` (0,90) ở khoảng cách mà mấy khối này
 * sống, tức mươi điểm ảnh, nằm DƯỚI ngưỡng mắt. Mua một thứ vô hình chính là thất bại đã đo được
 * của Phase 11. Nên chúng dùng `stone` (xám gần trung tính), và ghi lại ở đây để phase nào sau này
 * làm khung CẬN CẢNH cho vùng phụ cận thì biết chỗ này còn nợ một quyết định.
 *
 * ⚠️ NGƯỢC LẠI, `wall`/`roof` LÀ LỰA CHỌN CÓ CHỦ ĐÍCH, KHÔNG PHẢI CHO TIỆN. Hai vai ấy tra vật
 * liệu THEO KỶ (`materialFamilyFor`), nên ống khói kỷ 10 tự ra gạch nung (Manchester khai `brick`)
 * và lều săn kỷ 1 tự ra chất liệu mái của kỷ đồ đá — mà không cần một bảng vật liệu thứ hai ở đây.
 * Một bảng thứ hai sẽ trôi khỏi `eraStyle` đúng vào ngày có ai đổi vật liệu của một kỷ.
 *
 * ⚠️ VÀ MỘT LUẬT VỀ CỠ: mọi thứ ở đây to hơn thứ cùng loại trong lưới. Một thửa ruộng phụ cận rộng
 * gấp đôi một ô lưới, một xóm là bốn nóc nhà chứ không phải một. Lý do là hình học của phối cảnh:
 * ra xa hai lần thì cùng một vật chỉ còn một nửa số điểm ảnh, nên vật ở xa phải TO HƠN mới đọc
 * được — nếu không thì đúng lại thất bại "làm rồi mà không thấy" của Phase 11.
 */

import { prism, gable, specHeight, countSpecTriangles } from './parts';
import { PROP_SHORE_CLEAR, buildSetting, distanceOutsideGrid } from './setting';
import { getHinterlandStyle, isValidHinterland } from './hinterlandStyle';
import { hashId } from '../cityLayout';

/** 0..1 tất định từ khoá băm. */
function unit(seed) { return (hashId(String(seed)) % 1000) / 1000; }
/** −1..1 tất định. */
function signed(seed) { return unit(seed) * 2 - 1; }
/** Số nguyên 0..n-1 tất định. */
function pickIndex(seed, n) { return hashId(String(seed)) % Math.max(1, n); }

/**
 * ⚠️ MỌI HÌNH DƯỚI ĐÂY NHẬN `style` (dòng bảng của kỷ) CHỨ KHÔNG NHẬN `era`.
 *
 * Lý do: nếu nhận `era` thì mỗi hàm sẽ tự đi tra bảng, và ngày nào có ai gọi kèm một dòng bảng đã
 * sửa (thử nghiệm, test, phản biện) thì hàm vẫn lặng lẽ dựng theo bảng gốc. Đó đúng là cách một
 * bài test tưởng mình đang thử một thứ mà thật ra đang thử một thứ khác — bài học `TECH_DEBT #64`
 * (ba định nghĩa "ướt", hai cái im lặng khi bị bơm phép phá).
 */

// ── RUỘNG ───────────────────────────────────────────────────────────────────
/**
 * Một THỬA ruộng phụ cận. Hình thái quyết định BỜ chứ không quyết định màu — vì ở khoảng cách này
 * bờ đọc ra được còn sắc độ thì không.
 *
 * ⚠️ `paddy` khác `canalGrid` ở chỗ bờ CONG. Đó không phải chi tiết trang trí: bờ ruộng lúa nước
 * bám đường đồng mức nên nó cong, còn ruộng tưới kênh thì chia thẳng theo mương nên nó vuông. Hai
 * hình ấy mắt phân biệt được ngay cả khi mỗi thửa chỉ chiếm chục điểm ảnh, và chúng là lý do trục
 * `fields` tồn tại thay vì một con số "độ phì nhiêu".
 */
function parcel(seed, style, detail) {
  const parts = [];
  const form = style.fields;
  const ry = pickIndex(`${seed}|dir`, 2) ? Math.PI / 2 : 0;
  const along = (t) => (ry ? { x: 0, z: t } : { x: t, z: 0 });
  const cong = form === 'paddy';   // bờ uốn theo đường đồng mức — chữ ký của ruộng lúa nước
  const R = 1.0;                   // bán kính thửa, theo Ô

  // BỜ THỬA — bốn thanh đất viền quanh. Đây là thứ biến "một mảng màu" thành "một thửa ruộng".
  // Bờ cong thì cắt thành nhiều đoạn ngắn lệch nhau; bờ thẳng thì một thanh liền.
  const doan = cong ? (detail === 'low' ? 3 : 5) : 1;
  for (let canh = 0; canh < 4; canh += 1) {
    const ben = canh % 2 === 0 ? 1 : -1;
    const ngang = canh < 2;
    for (let i = 0; i < doan; i += 1) {
      const t = doan === 1 ? 0 : ((i / (doan - 1)) - 0.5) * 1.86 * R;
      const uon = cong ? signed(`${seed}|u${canh}${i}`) * 0.13 * R : 0;
      parts.push(prism({
        x: ngang ? ben * 0.95 * R + uon : t,
        z: ngang ? t : ben * 0.95 * R + uon,
        y: -0.01,
        w: ngang ? 0.10 : (1.9 * R) / doan + 0.06,
        d: ngang ? (1.9 * R) / doan + 0.06 : 0.10,
        h: 0.06 + unit(`${seed}|bh${canh}${i}`) * 0.03,
        sides: 4, role: 'stone',
      }));
    }
  }

  // RUỘNG NƯỚC — mặt nước nông trong khung bờ. Chỉ `paddy` ngập, vì chỉ lúa nước mới ngâm chân
  // suốt vụ; ruộng tưới kênh của Lưỡng Hà thì dẫn nước vào rồi tháo ra, mặt ruộng khô phần lớn năm.
  const ngap = form === 'paddy';
  if (ngap) {
    parts.push(prism({ y: 0, w: 1.74 * R, d: 1.74 * R, h: 0.035, sides: 4, role: 'water' }));
  }

  // LUỐNG / HÀNG CÂY — số hàng theo mật độ khai trong bảng, nên kỷ khai 0,88 thật sự rậm hơn kỷ
  // khai 0,18 thay vì chỉ khác nhau trong tài liệu.
  const dayNhat = detail === 'low' ? 4 : 7;
  const soHang = Math.max(2, Math.round(2 + style.fieldDensity * (dayNhat - 2)));
  const hangCay = form === 'vineyard';
  for (let i = 0; i < soHang; i += 1) {
    const p = along(((i / Math.max(1, soHang - 1)) - 0.5) * 1.55 * R);
    const uon = cong ? signed(`${seed}|lu${i}`) * 0.08 * R : 0;
    parts.push(prism({
      x: p.x + (ry ? uon : 0), z: p.z + (ry ? 0 : uon), y: ngap ? 0.02 : 0,
      w: ry ? 1.66 * R : 0.13, d: ry ? 0.13 : 1.66 * R,
      h: 0.05 + unit(`${seed}|lh${i}`) * 0.06,
      sides: 4, role: i % 2 === 0 ? 'leaf' : 'leaf2',
    }));
    // Cọc giàn / thân cọ: hai cột đầu hàng. Nét nhận dạng của vườn nho Địa Trung Hải và của
    // hàng chà là tưới giữa sa mạc — cả hai đều là HÀNG CÂY CÓ THÂN, không phải luống rau.
    if (hangCay && detail !== 'low' && i % 2 === 0) {
      for (const dau of [-1, 1]) {
        parts.push(prism({
          x: p.x + (ry ? dau * 0.78 * R : uon), z: p.z + (ry ? uon : dau * 0.78 * R), y: 0,
          w: 0.05, h: 0.19, sides: 4, taper: 0.8, role: 'wood',
        }));
      }
    }
  }

  return parts;
}

// ── XÓM VỆ TINH ─────────────────────────────────────────────────────────────
/**
 * MỘT NÓC NHÀ của xóm vệ tinh. Xóm là nhiều item cùng loại đứng gần nhau (xem `deriveHinterland`),
 * không phải một khối "xóm" — vì mỗi nóc phải tự ngồi lên đúng cao độ mặt đất chỗ nó đứng.
 *
 * ⚠️ NHÀ XÓM DÙNG `wall`/`roof` — ĐÚNG hai vai mà nhà trong phố dùng, nên nó tự mang vật liệu của
 * kỷ (nhà Nhật lợp ngói, nhà Ai Cập gạch bùn) mà không cần một bảng vật liệu thứ hai. Đây là chỗ
 * duy nhất trong file mà việc KHÔNG tự quyết định là điều đúng.
 */
function hamlet(seed, style, detail) {
  const parts = [];
  const w = 0.34 + unit(`${seed}|w`) * 0.16;
  const d = w * (0.8 + unit(`${seed}|d`) * 0.5);
  const h = 0.26 + unit(`${seed}|h`) * 0.18;
  parts.push(prism({ y: 0, w, d, h, sides: 4, role: 'wall' }));
  parts.push(gable({ y: h, w, d, h: 0.10 + unit(`${seed}|rh`) * 0.09, role: 'roof' }));
  // Nhà phụ / chuồng: một khối thấp kề bên. Hai nóc cạnh nhau đọc ra là "chỗ có người ở"
  // rõ hơn hẳn một nóc đơn độc — và đó là toàn bộ việc của xóm vệ tinh.
  if (detail !== 'low' && unit(`${seed}|phu`) > 0.42) {
    const pw = w * 0.6;
    parts.push(prism({
      x: (w + pw) * 0.55 * (unit(`${seed}|ben`) > 0.5 ? 1 : -1),
      y: 0, w: pw, d: pw, h: h * 0.62, sides: 4, role: 'wall2',
    }));
  }
  // Luỹ tre bao làng (kỷ 6): một vòng cây thấp quanh xóm — chữ ký của làng Bắc Bộ, và là lý do
  // `wall: 'bamboo'` không dựng ra tường thành mà dựng ra cái này.
  if (style.wall === 'bamboo') {
    const n = detail === 'low' ? 4 : 7;
    for (let i = 0; i < n; i += 1) {
      const g = (i / n) * Math.PI * 2;
      parts.push(prism({
        x: Math.cos(g) * (w * 1.5), z: Math.sin(g) * (w * 1.5), y: 0,
        w: 0.09, h: 0.34 + unit(`${seed}|t${i}`) * 0.16,
        sides: 5, taper: 0.55, role: 'leaf',
      }));
    }
  }
  return parts;
}

// ── ĐƯỜNG RỜI KHUNG HÌNH ────────────────────────────────────────────────────
/**
 * MỘT ĐOẠN của con đường đi khỏi khung. Cắt thành đoạn ngắn (chứ không một khối dài) vì mặt đất
 * ngoài lưới có cao độ: một khối dài sẽ chui vào sườn đồi ở đầu này và treo giữa trời ở đầu kia,
 * mà **không có gì đỏ lên** — `sceneGraph` đặt mỗi khối theo cao độ TẠI TÂM nó.
 */
function roadway(seed, style, detail) {
  const parts = [];
  const rong = { track: 0.30, road: 0.44, boulevard: 0.62, highway: 0.78 }[style.outboundRoad] ?? 0.4;
  const vai = style.outboundRoad === 'track' ? 'dat' : 'da';
  parts.push(prism({ y: -0.02, w: rong, d: 0.86, h: 0.05, sides: 4, role: vai === 'dat' ? 'trim' : 'stone' }));
  // Đại lộ có cây hai bên — chính chữ "trồng cây" trong định nghĩa `boulevard`, và là thứ làm nó
  // khác `road` ở khoảng cách xa (hai hàng chấm thẳng tắp, không phải một dải rộng hơn).
  if (style.outboundRoad === 'boulevard' && detail !== 'low') {
    for (const ben of [-1, 1]) {
      parts.push(prism({ x: ben * rong * 0.72, y: 0, w: 0.07, h: 0.30, sides: 4, taper: 0.8, role: 'wood' }));
      parts.push(prism({ x: ben * rong * 0.72, y: 0.28, w: 0.26, h: 0.22, sides: 6, taper: 0.4, role: 'leaf' }));
    }
  }
  // Cao tốc: dải phân cách + vạch. Ở xa nó đọc ra là MỘT ĐƯỜNG KÉP, khác hẳn một đường đơn.
  if (style.outboundRoad === 'highway') {
    parts.push(prism({ y: 0.02, w: 0.05, d: 0.86, h: 0.06, sides: 4, role: 'trim' }));
  }
  return parts;
}

// ── CÔNG TRÌNH NƯỚC ─────────────────────────────────────────────────────────
/** Một đoạn kênh / mương / đê / cầu dẫn nước. Cũng cắt đoạn, cùng lý do với `roadway`. */
function waterwork(seed, style, detail) {
  const parts = [];
  const kieu = style.waterworks;
  if (kieu === 'dyke') {
    // ĐÊ: một gờ đất cao, KHÔNG có nước. Đê là thứ chắn nước chứ không phải thứ chứa nước — vẽ
    // nước lên đê là hiểu ngược chức năng của nó.
    parts.push(prism({ y: 0, w: 0.46, d: 0.9, h: 0.20 + unit(`${seed}|h`) * 0.06, sides: 4, taper: 0.62, role: 'trim' }));
    return parts;
  }
  if (kieu === 'aqueduct') {
    // CẦU DẪN NƯỚC: hàng cột + máng trên cao. Đây là hình có đường viền mạnh nhất trong nhóm nước.
    const cao = 0.55 + unit(`${seed}|c`) * 0.25;
    for (const t of detail === 'low' ? [-0.28, 0.28] : [-0.34, 0, 0.34]) {
      parts.push(prism({ z: t, y: 0, w: 0.16, d: 0.16, h: cao, sides: 4, taper: 0.86, role: 'stone' }));
    }
    parts.push(prism({ y: cao, w: 0.30, d: 0.9, h: 0.14, sides: 4, role: 'stone' }));
    parts.push(prism({ y: cao + 0.10, w: 0.16, d: 0.9, h: 0.05, sides: 4, role: 'water' }));
    return parts;
  }
  // KÊNH ĐÀO / MƯƠNG ĐẤT: lòng nước có hai bờ. Kênh có bờ XÂY (`canal`) thì bờ là đá và thẳng;
  // mương đất (`ditch`) thì bờ thấp và hẹp hơn.
  const xay = kieu === 'canal';
  const rong = xay ? 0.34 : 0.20;
  parts.push(prism({ y: -0.01, w: rong, d: 0.9, h: 0.05, sides: 4, role: 'water' }));
  for (const ben of [-1, 1]) {
    parts.push(prism({
      x: ben * (rong * 0.5 + 0.07), y: 0,
      w: 0.14, d: 0.9, h: xay ? 0.13 : 0.08,
      sides: 4, role: xay ? 'stone' : 'trim',
    }));
  }
  return parts;
}

// ── TƯỜNG THÀNH + CỔNG ──────────────────────────────────────────────────────
/**
 * Một đoạn TƯỜNG BAO. Đây là hình mua được nhiều tín hiệu quy mô nhất trên mỗi tam giác bỏ ra:
 * một đường ngang liên tục cắt qua khung hình nói "bên trong kia là một nơi có tổ chức" mạnh hơn
 * bất cứ mảng màu nào.
 *
 * ⚠️ `wall: 'bamboo'` KHÔNG đi qua đây — luỹ tre là vòng cây quanh XÓM, dựng trong `hamlet`. Hai
 * thứ ấy cùng tên trường nhưng là hai vật khác nhau, và gộp chúng vào một hàm sẽ đẻ ra một hàng
 * rào tre thẳng tắp dài hàng trăm mét, thứ không tồn tại ở làng Bắc Bộ.
 */
function rampart(seed, style, detail) {
  const parts = [];
  const da = style.wall === 'stone';
  const cao = (da ? 0.44 : 0.30) + unit(`${seed}|h`) * 0.10;
  parts.push(prism({
    y: 0, w: 0.26, d: 0.9, h: cao,
    sides: 4, taper: da ? 0.92 : 0.74,
    role: da ? 'stone' : 'wall2',
  }));
  // Lỗ châu mai: răng cưa trên đỉnh tường đá. Nó đổi ĐƯỜNG VIỀN trên nền trời — đúng nhóm chi tiết
  // sống sót được ở xa, khác hẳn việc tô vân đá lên mặt tường.
  if (da && detail !== 'low') {
    for (const t of [-0.3, 0, 0.3]) {
      parts.push(prism({ z: t, y: cao, w: 0.24, d: 0.16, h: 0.09, sides: 4, role: 'stone' }));
    }
  }
  return parts;
}

/** CỔNG THÀNH: hai tháp kẹp một lối đi. Bắt buộc phải cao hơn tường, nếu không nó chỉ là tường. */
function gatehouse(seed, style, detail) {
  const parts = [];
  const da = style.wall === 'stone';
  const cao = (da ? 0.78 : 0.56) + unit(`${seed}|h`) * 0.14;
  for (const ben of [-1, 1]) {
    parts.push(prism({
      z: ben * 0.30, y: 0, w: 0.30, d: 0.30, h: cao,
      sides: 4, taper: 0.9,
      role: da ? 'stone' : 'wall2',
    }));
    if (detail !== 'low') {
      parts.push(prism({ z: ben * 0.30, y: cao, w: 0.36, d: 0.36, h: 0.07, sides: 4, role: 'trim' }));
    }
  }
  // Lối đi giữa hai tháp: một khối tối. Cái LỖ mới là thứ đọc ra "đây là cổng"; hai cái tháp không
  // có lỗ giữa chỉ là hai cái tháp.
  parts.push(prism({ y: 0, w: 0.22, d: 0.30, h: cao * 0.62, sides: 4, role: 'dark' }));
  parts.push(prism({ y: cao * 0.62, w: 0.30, d: 0.34, h: 0.14, sides: 4, role: da ? 'stone' : 'wall2' }));
  return parts;
}

// ── BẾN / CẢNG ──────────────────────────────────────────────────────────────
/**
 * BẾN. Ba mức, và chúng khác nhau về CHẤT chứ không về cỡ:
 *  · `landing` — vài bậc và một cầu gỗ nhỏ. Thuyền tay chèo.
 *  · `wharf`   — sàn kho hàng trên cọc + một cần trục gỗ. Buôn bán đường dài.
 *  · `container` — cần cẩu giàn khung chữ П + chồng thùng. Sau 1956.
 */
function dock(seed, style, detail) {
  const parts = [];
  const kieu = style.dock;
  if (kieu === 'landing') {
    const rong = 0.42 + unit(`${seed}|r`) * 0.20;
    const bac = 2 + (hashId(`${seed}|bac`) % 3);            // bến sông có 2–4 bậc xuống nước
    for (let i = 0; i < bac; i += 1) {
      parts.push(prism({ x: i * 0.16 - 0.16, y: -0.02 - i * 0.03, w: rong, d: 0.16, h: 0.06, sides: 4, role: 'stone' }));
    }
    parts.push(prism({ x: 0.36, y: 0, w: 0.24 + unit(`${seed}|san`) * 0.14, d: 0.10, h: 0.04, sides: 4, role: 'wood' }));
    parts.push(prism({ x: 0.50, y: 0, w: 0.06, h: 0.20 + unit(`${seed}|coc`) * 0.14, sides: 4, role: 'wood' }));
    return parts;
  }
  if (kieu === 'wharf') {
    // Sàn trên cọc — nhìn từ xa nó là một đường ngang NỔI trên mặt nước, khác hẳn bờ đất.
    const dai = 0.74 + unit(`${seed}|dai`) * 0.30;
    const soCoc = 3 + (hashId(`${seed}|coc`) % 2);
    for (let i = 0; i < soCoc; i += 1) {
      parts.push(prism({ z: ((i + 0.5) / soCoc - 0.5) * dai, y: -0.18, w: 0.08, h: 0.24, sides: 4, role: 'wood' }));
    }
    parts.push(prism({ y: 0.04, w: 0.38 + unit(`${seed}|san`) * 0.12, d: dai, h: 0.06, sides: 4, role: 'wood' }));
    // Kho hàng + cần trục gỗ: hai thứ làm nên chữ "wharf".
    parts.push(prism({ x: -0.16, z: -0.22, y: 0.10, w: 0.30, d: 0.34, h: 0.32, sides: 4, role: 'wall' }));
    parts.push(gable({ x: -0.16, z: -0.22, y: 0.42, w: 0.30, d: 0.34, h: 0.10, role: 'roof' }));
    if (detail !== 'low') {
      parts.push(prism({ x: 0.16, z: 0.24, y: 0.10, w: 0.07, h: 0.44, sides: 4, role: 'wood' }));
      parts.push(prism({ x: 0.28, z: 0.24, y: 0.50, w: 0.32, d: 0.06, h: 0.05, sides: 4, role: 'wood' }));
    }
    return parts;
  }
  if (kieu === 'container') {
    // Cần cẩu giàn: hai chân + dầm ngang vươn ra mặt nước. Đây là hình có đường viền đặc trưng
    // nhất của cả bảng — nhìn thấy nó là biết ngay đang ở thế kỷ 20 trở đi.
    const cao = 0.80 + unit(`${seed}|cao`) * 0.26;
    for (const ben of [-1, 1]) {
      parts.push(prism({ z: ben * 0.26, y: 0, w: 0.08, d: 0.08, h: cao, sides: 4, role: 'stone' }));
    }
    parts.push(prism({ y: cao, w: 0.10, d: 0.96, h: 0.09, sides: 4, role: 'stone' }));
    parts.push(prism({ x: 0.34, y: cao - 0.02, w: 0.62, d: 0.07, h: 0.06, sides: 4, role: 'stone' }));
    if (detail !== 'low') {
      for (let i = 0; i < 3; i += 1) {
        parts.push(prism({
          x: -0.30, z: (i - 1) * 0.24, y: i % 2 === 0 ? 0 : 0.15,
          w: 0.26, d: 0.18, h: 0.15, sides: 4, role: i % 2 === 0 ? 'wall' : 'wall2',
        }));
      }
    }
    return parts;
  }
  return parts;
}

// ── HẠ TẦNG RIÊNG TỪNG KỶ ───────────────────────────────────────────────────
/**
 * ⚠️ MỖI HÌNH DƯỚI ĐÂY PHẢI ĐỌC RA ĐƯỢC Ở CỠ MƯỜI ĐIỂM ẢNH, nên chúng đều CAO và MẢNH hoặc có
 * một nét ngang dứt khoát. Một cái nhà máy vẽ đúng tỉ lệ thật (dài, thấp, mái răng cưa nhỏ) sẽ
 * biến mất; một cái nhà máy có ống khói cao gấp ba thân nó thì không. Đây là chỗ mỹ thuật được
 * phép nói to hơn tỉ lệ thật, và nó có lý do đo được (`TECH_DEBT #41`).
 */
const INFRA_BUILDERS = {
  // Cột chữ T Göbekli Tepe: vài phiến đá dựng nghiêng nhau. Tín hiệu quy mô của kỷ 1 nằm ở ĐÂY,
  // không nằm ở ruộng — vì kỷ ấy chưa có cây trồng thuần hoá.
  standingStones: (seed, _style, detail) => {
    const parts = [];
    const n = detail === 'low' ? 3 : 5;
    for (let i = 0; i < n; i += 1) {
      const g = (i / n) * Math.PI * 2 + unit(`${seed}|g${i}`);
      parts.push(prism({
        x: Math.cos(g) * 0.34, z: Math.sin(g) * 0.34, y: 0,
        w: 0.14, d: 0.07, h: 0.42 + unit(`${seed}|h${i}`) * 0.30,
        sides: 4, ry: g, taper: 0.88, role: 'stone',
      }));
    }
    return parts;
  },
  // Lều da thú căng trên khung: trại săn. Thấp, nhưng cụm ba cái thì đọc ra.
  huntingCamp: (seed, _style, detail) => {
    const parts = [];
    const n = detail === 'low' ? 2 : 3;
    for (let i = 0; i < n; i += 1) {
      parts.push(prism({
        x: signed(`${seed}|x${i}`) * 0.3, z: signed(`${seed}|z${i}`) * 0.3, y: 0,
        w: 0.30, h: 0.28 + unit(`${seed}|h${i}`) * 0.08,
        sides: 6, taper: 0.12, role: 'roof',
      }));
    }
    return parts;
  },
  // Kho thóc: khối tròn nắp nón. Ai Cập, Lưỡng Hà, Trung Hoa đều có, hình gần như không đổi.
  granary: (seed) => [
    prism({ y: 0, w: 0.34, h: 0.36 + unit(`${seed}|h`) * 0.12, sides: 8, taper: 0.9, role: 'wall' }),
    prism({ y: 0.40, w: 0.36, h: 0.18, sides: 8, taper: 0.1, role: 'roof' }),
  ],
  // Tháp canh: cao, mảnh, có sàn nhô. Đường viền dứt khoát nhất trong nhóm tiền công nghiệp.
  watchtower: (seed, _style, detail) => {
    const cao = 0.72 + unit(`${seed}|h`) * 0.24;
    const parts = [prism({ y: 0, w: 0.26, h: cao, sides: 4, taper: 0.82, role: 'stone' })];
    if (detail !== 'low') {
      parts.push(prism({ y: cao, w: 0.34, h: 0.09, sides: 4, role: 'trim' }));
      parts.push(prism({ y: cao + 0.08, w: 0.24, h: 0.14, sides: 4, taper: 0.3, role: 'roof' }));
    }
    return parts;
  },
  // Cối xay gió: tháp + BỐN CÁNH. Cánh là toàn bộ giá trị của hình này — bỏ cánh đi thì nó là
  // một cái tháp canh mập.
  windmill: (seed, _style, detail) => {
    const cao = 0.58 + unit(`${seed}|h`) * 0.16;
    const parts = [
      prism({ y: 0, w: 0.32, h: cao, sides: 8, taper: 0.66, role: 'wall' }),
      prism({ y: cao, w: 0.26, h: 0.12, sides: 8, taper: 0.35, role: 'roof' }),
    ];
    const n = detail === 'low' ? 2 : 4;
    for (let i = 0; i < n; i += 1) {
      const g = (i / n) * Math.PI * 2 + 0.4;
      parts.push(prism({
        x: Math.cos(g) * 0.26, y: cao * 0.86 + Math.sin(g) * 0.26,
        z: 0.14, w: 0.44, d: 0.04, h: 0.05,
        sides: 4, ry: 0, role: 'wood',
      }));
    }
    return parts;
  },
  // ỐNG KHÓI: thứ cao nhất và mảnh nhất trong cả file. Chữ ký của Manchester và của mọi ngoại ô
  // công nghiệp — và là hình rẻ nhất mà mắt bắt được từ xa nhất.
  chimney: (seed) => [
    prism({ y: 0, w: 0.26, h: 0.14, sides: 4, role: 'wall' }),
    prism({ y: 0.12, w: 0.17, h: 0.98 + unit(`${seed}|h`) * 0.34, sides: 8, taper: 0.62, role: 'wall' }),
  ],
  // Đường sắt: tà vẹt + hai ray. Ở xa nó là một ĐƯỜNG KẺ SỌC, khác hẳn đường bộ (dải liền).
  railway: (seed, _style, detail) => {
    const parts = [];
    const n = detail === 'low' ? 4 : 7;
    for (let i = 0; i < n; i += 1) {
      parts.push(prism({
        z: ((i / (n - 1)) - 0.5) * 0.84, y: -0.01,
        w: 0.34, d: 0.05, h: 0.04, sides: 4, role: 'wood',
      }));
    }
    for (const ben of [-1, 1]) {
      parts.push(prism({ x: ben * 0.12, y: 0.03, w: 0.035, d: 0.9, h: 0.035, sides: 4, role: 'stone' }));
    }
    return parts;
  },
  // Cầu: sàn trên hai mố. Chỉ có nghĩa khi có nước, nên `deriveHinterland` đặt nó BẮC QUA lòng
  // nước chứ không rắc bừa — xem chỗ đặt.
  bridge: (seed, _style, detail) => {
    const dai = 0.86 + unit(`${seed}|dai`) * 0.34;          // cầu ngắn hay cầu dài
    const caoMo = 0.18 + unit(`${seed}|mo`) * 0.14;         // mố cầu cao thấp theo bờ
    const soMo = 2 + (hashId(`${seed}|nhip`) % 2);          // hai hoặc ba nhịp
    const parts = [prism({ y: caoMo + 0.04, w: 0.34, d: dai, h: 0.07, sides: 4, role: 'stone' })];
    for (let i = 0; i < soMo; i += 1) {
      const t = soMo === 2 ? (i === 0 ? -0.36 : 0.36) : (i - 1) * 0.34;
      parts.push(prism({ z: t * (dai / 1.0), y: 0, w: 0.20, d: 0.16, h: caoMo + 0.04, sides: 4, role: 'stone' }));
    }
    if (detail !== 'low') {
      for (const ben of [-1, 1]) {
        parts.push(prism({ x: ben * 0.15, y: caoMo + 0.10, w: 0.05, d: dai, h: 0.09, sides: 4, role: 'trim' }));
      }
    }
    return parts;
  },
  // Cần cẩu bến (không phải cẩu giàn container): cột + tay vươn chéo.
  crane: (seed) => [
    prism({ y: 0, w: 0.10, h: 0.86 + unit(`${seed}|h`) * 0.2, sides: 4, taper: 0.7, role: 'stone' }),
    prism({ x: 0.26, y: 0.80, w: 0.58, d: 0.06, h: 0.06, sides: 4, role: 'stone' }),
    prism({ x: 0.50, y: 0.58, w: 0.04, h: 0.22, sides: 4, role: 'dark' }),
  ],
  // Đường trên cao: sàn trên cột. Nó cắt ngang khung hình ở ĐỘ CAO khác mặt đất — chính vì thế
  // nó đọc ra ngay cả khi mặt đất phía dưới đã kín nhà.
  elevatedRoad: (seed, _style, detail) => {
    const cao = 0.46 + unit(`${seed}|h`) * 0.12;
    const parts = [prism({ y: cao, w: 0.42, d: 1.0, h: 0.08, sides: 4, role: 'stone' })];
    for (const t of detail === 'low' ? [0] : [-0.34, 0.34]) {
      parts.push(prism({ z: t, y: 0, w: 0.14, h: cao, sides: 4, taper: 0.9, role: 'stone' }));
    }
    return parts;
  },
  // Nhà máy: xưởng dài mái RĂNG CƯA. Răng cưa là chữ ký kiến trúc công nghiệp thế kỷ 19–20 (mái
  // lấy sáng bắc), và nó là một đường viền gãy khúc nên đọc ra ở xa.
  factory: (seed, _style, detail) => {
    const rong = 0.70 + unit(`${seed}|rong`) * 0.34;
    const sau = 0.44 + unit(`${seed}|sau`) * 0.20;
    const cao = 0.28 + unit(`${seed}|cao`) * 0.14;
    const parts = [prism({ y: 0, w: rong, d: sau, h: cao, sides: 4, role: 'wall' })];
    // Mái RĂNG CƯA — số răng theo hạt giống, vì một xưởng 3 gian và một xưởng 5 gian là hai xưởng.
    const n = detail === 'low' ? 2 : 3 + (hashId(`${seed}|rang`) % 3);
    for (let i = 0; i < n; i += 1) {
      parts.push(gable({
        x: ((i / n) - 0.5 + 0.5 / n) * rong, y: cao,
        w: rong / n, d: sau, h: 0.11 + unit(`${seed}|dốc`) * 0.05, ry: Math.PI / 2, role: 'roof',
      }));
    }
    return parts;
  },
  // Mỏ đá: hố bậc + đống đất thải. Đây là hình DUY NHẤT trong file đi XUỐNG, và nó vẫn đọc ra
  // được vì các bậc tạo ra một loạt đường ngang song song.
  quarry: (seed, _style, detail) => {
    const parts = [];
    const mieng = 0.72 + unit(`${seed}|mieng`) * 0.30;
    const canh = 5 + (hashId(`${seed}|canh`) % 3);          // hố đá không phải hình lục giác đều
    const n = detail === 'low' ? 2 : 3 + (hashId(`${seed}|bac`) % 2);
    for (let i = 0; i < n; i += 1) {
      const r = mieng - i * (mieng / (n + 1.4));
      parts.push(prism({ y: -i * 0.09 - 0.02, w: r, d: r, h: 0.09, sides: canh, ry: unit(`${seed}|ry`) * 1.0, role: 'stone' }));
    }
    // Đống đá thải bên miệng hố — thứ duy nhất nhô LÊN của một cái hố.
    parts.push(prism({
      x: mieng * 0.68, y: 0, w: 0.24 + unit(`${seed}|thai`) * 0.14,
      h: 0.14 + unit(`${seed}|dong`) * 0.12, sides: 5, taper: 0.2, role: 'trim',
    }));
    return parts;
  },
  // Lò nung (vôi / gạch / gốm): khối nón cụt có miệng tối. Bồ Đào Nha, Ý, Đức đều có.
  kiln: (seed) => [
    prism({ y: 0, w: 0.40, h: 0.42 + unit(`${seed}|h`) * 0.12, sides: 8, taper: 0.52, role: 'wall' }),
    prism({ y: 0.40, w: 0.13, h: 0.10, sides: 8, role: 'dark' }),
  ],
  // Dãy nhà thợ dính liền: một khối DÀI chia nhịp bằng ống khói nhỏ. Chữ ký của ngoại ô Manchester
  // — và nó khác nhà xóm ở chỗ nó LIỀN NHAU, tức đọc ra là "ở đây đông người".
  terracedHousing: (seed, _style, detail) => {
    // Dãy nhà thợ: cái làm nên nó là ĐỘ DÀI và hàng ống khói đều tăm tắp trên nóc.
    const dai = 0.80 + unit(`${seed}|dai`) * 0.44;
    const cao = 0.30 + unit(`${seed}|cao`) * 0.10;
    const parts = [
      prism({ y: 0, w: dai, d: 0.34, h: cao, sides: 4, role: 'wall' }),
      gable({ y: cao, w: dai, d: 0.34, h: 0.11, ry: Math.PI / 2, role: 'roof' }),
    ];
    const n = detail === 'low' ? 2 : 3 + (hashId(`${seed}|so`) % 4);
    for (let i = 0; i < n; i += 1) {
      parts.push(prism({
        x: ((i + 0.5) / n - 0.5) * (dai * 0.94), y: cao + 0.08,
        w: 0.06, h: 0.14 + unit(`${seed}|ong${i}`) * 0.08, sides: 4, role: 'wall',
      }));
    }
    return parts;
  },
};

/** Tên mọi loại vật thể vùng phụ cận mà file này dựng được. */
export const HINTERLAND_KINDS = [
  'parcel', 'hamlet', 'roadway', 'waterwork', 'rampart', 'gatehouse', 'dock',
  ...Object.keys(INFRA_BUILDERS),
];

const BASE_BUILDERS = { parcel, hamlet, roadway, waterwork, rampart, gatehouse, dock };

/**
 * Mô tả hình học cho MỘT vật thể vùng phụ cận.
 *
 * ⚠️ LOẠI LẠ → TRẢ VỀ MẢNG RỖNG, KHÔNG rơi về một hình mặc định. `buildPropSpec` rơi về `tree` và
 * điều đó đúng cho nó (một cảnh vật lạ vẫn là một cảnh vật). Ở đây thì không: một `kind` lạ nghĩa
 * là bảng khai một thứ mà file này chưa dựng, và dựng đại một cái nhà vào chỗ ấy sẽ giấu mất lỗi.
 * Có test đòi mọi giá trị trong `INFRA_KINDS` phải dựng ra ít nhất một khối — đó là phép đếm ở đầu
 * bên kia của luật "từ chối thẳng".
 */
export function buildHinterlandSpec({ kind, style, seed = 'h', detail = 'high' } = {}) {
  const build = BASE_BUILDERS[kind] ?? INFRA_BUILDERS[kind] ?? null;
  const parts = build ? build(seed, style, detail) : [];
  return { parts, height: specHeight(parts), triangles: countSpecTriangles(parts) };
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * ĐẶT CHỖ — thứ gì đứng ở đâu ngoài lưới thành phố.
 *
 * ⚠️ BA BẤT BIẾN, VÀ CẢ BA ĐỀU CÓ TEST KHOÁ:
 *
 *  1. **CHỈ NHẬN `era` + `gridSize`.** Vùng phụ cận là ĐỊA LÝ, không phải TIẾN ĐỘ — cùng lý lẽ đã
 *     viết thành luật cứng nhất của `terrain.js` và của `outskirts.js`. Nếu nó đổi theo số phiên
 *     thì mỗi lần Đàm xây xong một căn nhà, cả cánh đồng quanh thành phố sẽ xê dịch, và **không có
 *     gì đỏ lên** — chỉ là một buổi sáng vùng quê khác đi. Có test gọi kèm DỮ LIỆU RÁC
 *     (`{built: [...], buildings: [...], sessionCount: 999}`) và đòi kết quả y hệt lần gọi sạch.
 *  2. **KHÔNG BAO GIỜ chạm vào toạ độ trong lưới** (`distanceOutsideGrid > 0` cho mọi vật). Đây là
 *     ADR-007 "bảo tàng bất động": một công trình Đàm đã xây thì vĩnh viễn đứng nguyên chỗ ấy, và
 *     cách chắc chắn nhất để giữ lời hứa đó là tầng này KHÔNG có quyền đặt gì trong lưới.
 *  3. **KHÔNG đặt gì xuống nước.** Trừ đúng ba thứ mà bản chất là ở-trên-nước: bến (`dock`), cầu
 *     (`bridge`), và cầu dẫn nước (`aqueduct`). Mọi thứ khác phải hỏi `insetAt` như `outskirts.js`.
 */

/**
 * Bốn hướng chính, theo toạ độ Ô. Dùng cho con đường ra khỏi khung và cho tuyến tường thành —
 * hai thứ DUY NHẤT trong file này có HƯỚNG thay vì có VỊ TRÍ.
 *
 * ⚠️ TÊN TRÙNG VỚI `settingStyle.side` LÀ CỐ Ý: cùng một hệ hướng, một bộ chữ. Bài học §1(B):
 * hai bảng cùng nói về một sự thật vật lý (hướng) mà dùng hai bộ từ vựng thì chúng sẽ trôi khỏi
 * nhau và **không bài test nào biết cả hai cùng tồn tại**.
 */
const HUONG = {
  bac: { dx: 0, dy: -1 },
  nam: { dx: 0, dy: 1 },
  dong: { dx: 1, dy: 0 },
  tay: { dx: -1, dy: 0 },
};

/** Vùng phụ cận trải ra bao xa, tính bằng Ô kể từ MÉP lưới. Đúng bằng `OUTSKIRT_REACH`. */
export const HINTERLAND_REACH = 8;

/**
 * Vành TRỐNG sát mép lưới — không đặt gì trong này.
 *
 * ⚠️ CON SỐ NÀY KHÔNG PHẢI THẨM MỸ. Công trình trong lưới nở ra tới `BUILDING_SCALE = 1,3` lần ô
 * của nó, và **225/225 công trình đều tràn khỏi ô neo** (đo ở §1, kỷ tệ nhất 1,271 ô). Một thửa
 * ruộng đặt sát mép lưới sẽ chui vào dưới một mái nhà ở hàng ngoài cùng. 1,4 ô là con số nhỏ nhất
 * lớn hơn cái tràn đo được, cộng một chút biên.
 */
export const HINTERLAND_CLEAR = 1.4;

/**
 * TÌM MẶT NƯỚC NGOÀI LƯỚI — bằng cách QUÉT, không bằng cách đoán hướng.
 *
 * ⚠️ HÀM NÀY LÀ BẢN VÁ THỨ HAI CỦA CÙNG MỘT LỖI, VÀ BẢN VÁ THỨ NHẤT CŨNG "ĐÚNG" NHƯNG VẪN SAI.
 *
 * Bản đầu viết `setting.side ?? 'nam'`. `buildSetting` KHÔNG có trường `side` (nó nằm ở
 * `setting.style.side`), nên biểu thức ấy rơi về `'nam'` ở CẢ 15 KỶ ⇒ **13 kỷ khai có bến thì 0 kỷ
 * dựng ra bến, 4 kỷ khai có cầu thì 0 kỷ dựng ra cầu.** Không một dòng nào đỏ.
 *
 * Bản vá thứ nhất đọc đúng `setting.style.side` — và vẫn hụt 7/13 bến. Vì `side` KHÔNG phải hướng
 * mà hình học nước nằm; nó là hướng CAMERA (`SIDE_YAW`/`worldYaw` ở `settingStyle.js` xoay cả thế
 * giới để mặt nước quay về phía người xem). Đo ra: kỷ 2 khai `side: 'dong'` trong khi lòng nước
 * thật nằm ở góc tây-bắc của lưới toạ độ. Hai trường cùng nói về "phía nào", một cái nói về
 * CAMERA, một cái nói về ĐỊA HÌNH — đúng hình dạng *"một trường gánh hai việc"* nhìn từ phía người
 * ĐỌC bảng (lần thứ sáu dự án trả giá cho nó).
 *
 * ⇒ Bản đúng KHÔNG hỏi hướng nào cả. Nó **quét cả vành ngoài lưới rồi hỏi chính `insetAt`** — đúng
 * hàm mà `terrainMesh.js` dùng để khoét lòng nước (`TECH_DEBT #64`: ba định nghĩa "ướt" cho ba con
 * số khác nhau, chỉ `insetAt`/`blendAt` khớp thứ được vẽ ra). Một phép quét thì không có giả định
 * nào để mà sai, và nó tự đúng ở cả 14 kỷ có nước lẫn kỷ 1 khô.
 *
 * @returns {{sau:{x,y}, bo:{x,y}, ry:number}|null} `sau` = chỗ nước sâu nhất trong tầm (để bắc
 *   cầu), `bo` = mép bờ khô sát nó (để dựng bến), `ry` = góc quay để vật hướng ra nước.
 */
function timNuocNgoaiLuoi(setting, gridSize) {
  if (!setting?.hasWater || typeof setting.insetAt !== 'function') return null;
  const lo = -0.5 - HINTERLAND_REACH;
  const hi = gridSize - 0.5 + HINTERLAND_REACH;
  let sau = null;
  for (let u = lo; u <= hi; u += 0.25) {
    for (let v = lo; v <= hi; v += 0.25) {
      const d = distanceOutsideGrid(u, v, gridSize);
      if (d < HINTERLAND_CLEAR || d > HINTERLAND_REACH) continue;
      const ins = setting.insetAt(u, v);
      if (ins <= 0) continue;
      // Chọn chỗ SÂU NHẤT chứ không phải chỗ GẦN NHẤT: gần nhất luôn rơi vào một góc lưới (khoảng
      // cách Chebyshev bằng nhau trên cả một cạnh), mà một cái bến nép ở góc thì đọc ra là tình cờ.
      if (!sau || ins > sau.ins) sau = { x: u, y: v, ins };
    }
  }
  if (!sau) return null;

  // Đi từ chỗ sâu về phía tâm thành phố cho tới khi lên cạn — đó là MÉP BỜ.
  const giua = (gridSize - 1) / 2;
  const dx = giua - sau.x;
  const dy = giua - sau.y;
  const len = Math.hypot(dx, dy) || 1;
  /**
   * ⚠️ PHẢI DÒ CẢ HAI CHIỀU. Bản trước chỉ đi VÀO phía thành phố rồi bỏ cuộc — và ở kỷ 7 (Arno ôm
   * sát Firenze) lẫn kỷ 12, lòng nước chạm tận vành trống nên bờ trong không tồn tại ⇒ 2/13 bến
   * biến mất trong im lặng. Bờ BÊN KIA cũng là một cái bờ có thật, và một cái bến ở bờ đối diện
   * là hình ảnh đúng của mọi khúc sông chảy sát chân thành.
   */
  const doBo = (huong) => {
    for (let t = 0; t <= HINTERLAND_REACH * 2; t += 0.2) {
      const x = sau.x + (dx / len) * t * huong;
      const y = sau.y + (dy / len) * t * huong;
      const d = distanceOutsideGrid(x, y, gridSize);
      if (d < HINTERLAND_CLEAR || d > HINTERLAND_REACH) return null;
      if (setting.insetAt(x, y) > 0) continue;
      return { x, y };
    }
    return null;
  };
  const bo = doBo(+1) ?? doBo(-1);
  if (!bo) return null;
  // Quay mặt RA nước: trục dài của bến nằm dọc bờ, tức vuông góc với hướng bờ→nước.
  const ry = Math.atan2(sau.x - bo.x, sau.y - bo.y);
  return { sau: { x: sau.x, y: sau.y }, bo, ry };
}

function trongTamHuong(side, gridSize) {
  const giua = (gridSize - 1) / 2;
  const h = HUONG[side] ?? HUONG.nam;
  return { giua, h };
}

/**
 * Vùng phụ cận của một kỷ.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {number} [input.gridSize]
 * @param {object} input.style      dòng bảng `hinterlandStyle` của kỷ ấy
 * @param {object} input.setting    kết quả `buildSetting` — để không đặt gì xuống nước
 * @returns {Array<{x:number,y:number,kind:string,scale:number,seed:string,ry:number,
 *   detail:'high'|'low', onWater?:boolean}>} toạ độ theo Ô, giống `deriveOutskirts`
 */
export function planHinterland({ era, gridSize = 12, style, setting } = {}) {
  // Thiếu bảng ⇒ KHÔNG dựng gì, và không ném lỗi. Ném lỗi ở đây sẽ làm sập cả cảnh vì một dòng
  // bảng hỏng; trả rỗng thì phép đếm ở `hinterland.test.js` bắt được ngay mà cảnh vẫn dựng được.
  if (!style || typeof style !== 'object') return [];
  const key = Number.isFinite(era) ? era : 1;
  const out = [];
  const lo = -0.5 - HINTERLAND_REACH;
  const hi = gridSize - 0.5 + HINTERLAND_REACH;

  /** Có được đặt một vật KHÔ ở đây không: ngoài lưới, ngoài vành trống, và không dưới nước. */
  const khoRao = (u, v) => {
    const d = distanceOutsideGrid(u, v, gridSize);
    if (d < HINTERLAND_CLEAR) return false;
    if (u < lo || u > hi || v < lo || v > hi) return false;
    return setting ? setting.insetAt(u, v) <= -PROP_SHORE_CLEAR : true;
  };

  const dat = (x, y, kind, opts = {}) => {
    out.push({
      x, y, kind,
      scale: opts.scale ?? 1,
      seed: opts.seed ?? `${key}|hl|${kind}|${x.toFixed(2)}|${y.toFixed(2)}`,
      ry: opts.ry ?? 0,
      detail: distanceOutsideGrid(x, y, gridSize) <= HINTERLAND_REACH * 0.5 ? 'high' : 'low',
      ...(opts.onWater ? { onWater: true } : {}),
    });
  };

  // ── 1. CON ĐƯỜNG RỜI KHUNG HÌNH ──────────────────────────────────────────
  /**
   * ⚠️ TÍN HIỆU RẺ NHẤT VÀ MẠNH NHẤT CHO CỔNG (G2), nên nó được đặt TRƯỚC MỌI THỨ KHÁC: mọi thứ
   * sau đó phải tránh nó chứ không phải ngược lại.
   *
   * Đường đi ra theo hai hướng ĐỐI NHAU, không phải một — một con đường cụt ở mép khung đọc ra là
   * "đường tới đây thì hết", đúng cái khay mà VIỆC 1 phải gỡ. Hai đầu nối nhau thì mắt đọc ra là
   * "thành phố nằm TRÊN một tuyến đường", tức nó thuộc về một thế giới lớn hơn.
   */
  const truc = (hashId(`${key}|truc`) % 2) === 0 ? ['bac', 'nam'] : ['dong', 'tay'];
  // ⚠️ `lechTruc` nằm ở phạm vi HÀM chứ không trong vòng lặp, vì mục 2 (cổng) phải đọc CHÍNH nó.
  // Chép lại biểu thức ở mục 2 là "một luật hai công thức", và hai công thức tương đương trên giấy
  // gần như luôn lệch nhau ở biên — đúng bài học `daylight.test.js`.
  const lechTruc = ((hashId(`${key}|lech`) % 5) - 2) * 0.9;   // đường không nhất thiết ra giữa
  for (const side of truc) {
    const { giua, h } = trongTamHuong(side, gridSize);
    for (let b = HINTERLAND_CLEAR; b <= HINTERLAND_REACH; b += 0.9) {
      const u = h.dx ? (h.dx > 0 ? gridSize - 0.5 + b : -0.5 - b) : giua + lechTruc;
      const v = h.dy ? (h.dy > 0 ? gridSize - 0.5 + b : -0.5 - b) : giua + lechTruc;
      if (!khoRao(u, v)) continue;
      dat(u, v, 'roadway', { ry: h.dx ? Math.PI / 2 : 0, seed: `${key}|road|${side}|${b.toFixed(1)}` });
    }
  }

  // ── 2. TƯỜNG THÀNH + CỔNG ────────────────────────────────────────────────
  /**
   * ⚠️ TƯỜNG BAO CHẠY Ở KHOẢNG CÁCH CỐ ĐỊNH QUANH LƯỚI, VÀ CỔNG ĐẶT ĐÚNG CHỖ CON ĐƯỜNG ĐI QUA.
   * Đó là toàn bộ điểm của cái cổng: một cổng thành không nối vào đường nào là một khung cửa dựng
   * giữa đồng. Chỉ thị của Đàm ghi thẳng điều này, và ở đây nó thành CẤU TRÚC chứ không thành một
   * lời dặn — vị trí cổng ĐƯỢC SUY RA từ chính `truc` và `lechTruc` ở mục 1, không chọn riêng.
   *
   * ⚠️ HAI LỖI ĐÃ TRẢ GIÁ Ở ĐÂY, cả hai đều im lặng và cả hai đều do phép ĐẾM ở đầu bên kia bắt:
   *
   *  (a) **Tường tre không dựng ra gì.** Bản đầu viết `wall !== 'none' && wall !== 'bamboo'` với
   *      lý do "luỹ tre đã vẽ trong `hamlet`". Nhưng bảng khai kỷ 6 `wall: 'bamboo'` + `gate: true`
   *      và validator NHẬN — nên kỷ ấy khai có tường, có cổng, mà màn hình không có cả hai. Đúng
   *      bẫy Phase 10 Bước 2: "hợp lệ" và "dựng ra thật" là HAI câu hỏi. Luỹ tre làng là một vòng
   *      thành có thật ở Bắc Bộ, nên nay nó dựng như mọi vòng thành khác, chỉ khác vật liệu.
   *
   *  (b) **Cổng bị chính phép lọc khô ráo nuốt mất.** Bản đầu duyệt vòng thành rồi hỏi "đoạn này
   *      có nằm trên trục đường không". Kỷ 5 (khúc uốn Elzbach ôm quanh mỏm đá) có 84/104 vị trí
   *      vòng thành nằm dưới nước, và đúng hai vị trí cổng rơi vào đó ⇒ 0 cổng. Cách sửa KHÔNG
   *      phải nới phép lọc: cổng nay được đặt TRƯỚC, suy thẳng từ trục đường, rồi TRƯỢT dọc vòng
   *      thành tới điểm khô gần nhất. Con đường đã chứng minh hướng ấy đi được, nên một cái cổng
   *      trên hướng ấy phải tồn tại; chỉ vị trí chính xác của nó mới là thứ cần dò.
   */
  if (style.wall !== 'none') {
    const banKinh = HINTERLAND_CLEAR + 0.5;
    const buoc = 0.62;
    const canhVong = (t) => [
      [t, -0.5 - banKinh, false], [t, gridSize - 0.5 + banKinh, false],
      [-0.5 - banKinh, t, true], [gridSize - 0.5 + banKinh, t, true],
    ];
    const tMin = -0.5 - banKinh;
    const tMax = gridSize - 0.5 + banKinh;

    // (1) CỔNG TRƯỚC — mỗi hướng đường một cổng, trượt tới điểm khô gần nhất trên vòng thành.
    const oCong = new Set();
    if (style.gate) {
      for (const side of truc) {
        const { giua, h } = trongTamHuong(side, gridSize);
        const tam = giua + lechTruc;
        for (let n = 0; n <= 12; n += 1) {
          const t = tam + (n % 2 === 0 ? 1 : -1) * Math.ceil(n / 2) * buoc;
          if (t < tMin || t > tMax) continue;
          // Cổng nằm trên CẠNH mà con đường xuyên qua: đường chạy theo `h`, nên cạnh vuông góc.
          const [u, v, ngang] = h.dx
            ? [h.dx > 0 ? tMax : tMin, t, true]
            : [t, h.dy > 0 ? tMax : tMin, false];
          if (!khoRao(u, v)) continue;
          oCong.add(`${u.toFixed(2)}|${v.toFixed(2)}`);
          dat(u, v, 'gatehouse', { ry: ngang ? Math.PI / 2 : 0, seed: `${key}|cong|${side}` });
          break;
        }
      }
    }

    // (2) RỒI MỚI TỚI TƯỜNG — bỏ qua đúng những ô đã thành cổng.
    for (let i = 0; ; i += 1) {
      const t = tMin + i * buoc;
      if (t > tMax) break;
      for (const [u, v, ngang] of canhVong(t)) {
        if (oCong.has(`${u.toFixed(2)}|${v.toFixed(2)}`)) continue;
        if (!khoRao(u, v)) continue;
        dat(u, v, 'rampart', {
          ry: ngang ? Math.PI / 2 : 0,
          seed: `${key}|tuong|${u.toFixed(1)}|${v.toFixed(1)}`,
        });
      }
    }
  }

  // ── 3. RUỘNG ─────────────────────────────────────────────────────────────
  /**
   * ⚠️ RUỘNG RẢI THEO LƯỚI THÔ CHỨ KHÔNG RẢI NGẪU NHIÊN, và đó là điểm khác căn bản so với
   * `outskirts.js`. Cây mọc lộn xộn là đúng; ruộng thì KHÔNG — thửa nọ kề thửa kia thành mảng, và
   * chính cái mảng ấy mới đọc ra là "đất canh tác" thay vì "vài đám cỏ". Một cánh đồng rải ngẫu
   * nhiên trông y hệt cỏ dại, tức tiêu hình học vào một thứ vô hình.
   *
   * ⚠️ `fieldDensity` quyết định BAO NHIÊU PHẦN số ô lưới thô ấy có ruộng — nó là một PHẦN, không
   * phải một LƯỢNG. Bài học Phase 8D: một con số tuyệt đối trong một không gian hữu hạn chỉ diễn
   * đạt được "tỉ lệ lấp đầy", và nó tăng cho tới khi kín.
   */
  if (style.fields !== 'none') {
    const oRuong = 2.2;
    for (let v = lo + oRuong / 2; v <= hi; v += oRuong) {
      for (let u = lo + oRuong / 2; u <= hi; u += oRuong) {
        if (!khoRao(u, v)) continue;
        const nut = `${key}|ruong|${u.toFixed(2)}|${v.toFixed(2)}`;
        if ((hashId(`${nut}|co`) % 1000) / 1000 >= style.fieldDensity) continue;
        dat(u, v, 'parcel', { seed: nut, ry: (hashId(`${nut}|ry`) % 2) * (Math.PI / 2) });
      }
    }
  }

  // ── 4. XÓM VỆ TINH ───────────────────────────────────────────────────────
  /**
   * ⚠️ XÓM LÀ MỘT CỤM, KHÔNG PHẢI MỘT NHÀ — và đó là toàn bộ tín hiệu. Một nóc nhà lẻ giữa đồng
   * đọc ra là "có ai đó ở đây"; bốn nóc chụm lại đọc ra là "có một CỘNG ĐỒNG khác nữa ở đây", tức
   * thành phố không phải nơi duy nhất có người. `hamletCount` là số cụm, `hamletSize` là số nóc
   * mỗi cụm — hai trục riêng, vì ngoài đời chúng độc lập (nước Nga có ít làng nhưng làng to; nước
   * Ý có nhiều làng nhỏ).
   */
  for (let c = 0; c < style.hamletCount; c += 1) {
    // Cụm đặt trên một vòng quanh thành phố, góc tất định theo kỷ — không rơi vào một góc phần tư.
    const goc = ((hashId(`${key}|xom|${c}`) % 1000) / 1000) * Math.PI * 2;
    const banKinh = HINTERLAND_CLEAR + 1.6 + ((hashId(`${key}|xr|${c}`) % 1000) / 1000) * (HINTERLAND_REACH - HINTERLAND_CLEAR - 2.2);
    const giua = (gridSize - 1) / 2;
    const cu = giua + Math.cos(goc) * (giua + banKinh);
    const cv = giua + Math.sin(goc) * (giua + banKinh);
    for (let i = 0; i < style.hamletSize; i += 1) {
      const nut = `${key}|nha|${c}|${i}`;
      const u = cu + signed(`${nut}|x`) * 0.85;
      const v = cv + signed(`${nut}|z`) * 0.85;
      if (!khoRao(u, v)) continue;
      dat(u, v, 'hamlet', { seed: nut, ry: (hashId(`${nut}|ry`) % 4) * (Math.PI / 2) });
    }
  }

  // ── 5. CÔNG TRÌNH NƯỚC ───────────────────────────────────────────────────
  /**
   * ⚠️ KÊNH/MƯƠNG/ĐÊ CHẠY VUÔNG GÓC VỚI CON ĐƯỜNG, không song song. Hai đường thẳng song song sát
   * nhau ở khoảng cách này đọc ra là MỘT đường dày hơn — tức một trong hai thứ biến mất mà bảng
   * vẫn khai có cả hai. Vuông góc thì chúng cắt nhau và mắt đọc ra hai hệ thống.
   */
  if (style.waterworks !== 'none') {
    const doc = truc[0] === 'bac' || truc[0] === 'nam';   // đường chạy dọc ⇒ kênh chạy ngang
    const giua = (gridSize - 1) / 2;
    for (const ben of [-1, 1]) {
      const lech = ben * (HINTERLAND_CLEAR + 1.1 + ((hashId(`${key}|kenh|${ben}`) % 4) * 0.7));
      for (let t = lo; t <= hi; t += 0.9) {
        const u = doc ? t : giua + lech;
        const v = doc ? giua + lech : t;
        if (!khoRao(u, v)) continue;
        dat(u, v, 'waterwork', { ry: doc ? Math.PI / 2 : 0, seed: `${key}|nuoc|${ben}|${t.toFixed(1)}` });
      }
    }
  }

  // ── 6. BẾN / CẢNG ────────────────────────────────────────────────────────
  /**
   * ⚠️ BẾN PHẢI ĐỨNG TRÊN MÉP NƯỚC, nên nó là thứ DUY NHẤT trong file này được phép bỏ qua
   * `khoRao`. Tìm mép bằng cách đi từ tâm ra theo đúng hướng `settingStyle.side` cho tới khi
   * `insetAt` đổi dấu — hỏi CHÍNH cái hàm mà tầng vẽ dùng để khoét lòng nước, không dựng lại một
   * phép dò riêng (bài học `TECH_DEBT #64`: ba định nghĩa "ướt" cho ba con số khác nhau).
   */
  const mepNuoc = timNuocNgoaiLuoi(setting, gridSize);
  if (style.dock !== 'none' && mepNuoc) {
    // Bến ngồi ở MÉP: một chân trên cạn, một chân dưới nước — nên nó là thứ DUY NHẤT trong file
    // này được phép bỏ qua `khoRao` (hàm ấy đòi khô ráo, mà một cái bến khô ráo là một cái sàn gỗ).
    dat(mepNuoc.bo.x, mepNuoc.bo.y, 'dock', { ry: mepNuoc.ry, seed: `${key}|ben`, onWater: true });
  }

  // ── 7. HẠ TẦNG RIÊNG CỦA KỶ ──────────────────────────────────────────────
  /**
   * ⚠️ HẠ TẦNG ĐẶT THEO KIỂU, KHÔNG RẢI ĐỀU — vì mỗi loại có một chỗ đứng ĐÚNG ngoài đời, và đặt
   * sai chỗ thì nó thành đồ trang trí. Đường sắt và đường trên cao là TUYẾN (chạy dọc một trục);
   * cầu bắc QUA nước; mọi thứ còn lại là ĐIỂM đứng rải quanh thành phố.
   */
  const tuyen = new Set(['railway', 'elevatedRoad']);
  let chiSo = 0;
  for (const loai of style.infra) {
    chiSo += 1;
    if (tuyen.has(loai)) {
      // Tuyến chạy SONG SONG con đường nhưng lệch sang một bên — đường sắt cạnh quốc lộ là hình
      // ảnh có thật của mọi ngoại ô công nghiệp, và hai đường song song CÁCH XA nhau thì đọc ra
      // là hai tuyến (khác hẳn hai đường sát nhau, xem mục 5).
      const side = truc[0];
      const { giua, h } = trongTamHuong(side, gridSize);
      const lech = (chiSo % 2 === 0 ? 1 : -1) * (HINTERLAND_CLEAR + 2.4);
      for (let b = HINTERLAND_CLEAR; b <= HINTERLAND_REACH; b += 0.9) {
        const u = h.dx ? (h.dx > 0 ? gridSize - 0.5 + b : -0.5 - b) : giua + lech;
        const v = h.dy ? (h.dy > 0 ? gridSize - 0.5 + b : -0.5 - b) : giua + lech;
        if (!khoRao(u, v)) continue;
        dat(u, v, loai, { ry: h.dx ? Math.PI / 2 : 0, seed: `${key}|${loai}|${b.toFixed(1)}` });
      }
      continue;
    }

    if (loai === 'bridge') {
      /**
       * Cầu bắc qua chỗ nước SÂU NHẤT trong tầm — dùng CHUNG phép quét với bến, không dựng lại
       * một phép dò thứ hai.
       *
       * ⚠️ Không tìm được lòng nước thì cầu RƠI XUỐNG nhánh ĐIỂM bên dưới (bắc qua một con lạch
       * nhỏ trong vùng), chứ KHÔNG bị bỏ qua. Bản trước `continue` ở đây kèm một câu tự trấn an
       * — *"im lặng bỏ qua ở đây là đúng"* — và chính cái `continue` ấy đã nuốt mất 4/4 cây cầu.
       * Xem `timNuocNgoaiLuoi`.
       */
      if (mepNuoc) {
        dat(mepNuoc.sau.x, mepNuoc.sau.y, 'bridge', {
          ry: mepNuoc.ry + Math.PI / 2, seed: `${key}|cau`, onWater: true,
        });
        continue;
      }
    }

    // ĐIỂM: hai bản sao đặt đối nhau qua thành phố, để hạ tầng không dồn về một phía.
    for (const lan of [0, 1]) {
      const nut = `${key}|ht|${loai}|${lan}`;
      const goc = ((hashId(nut) % 1000) / 1000) * Math.PI * 2;
      const banKinh = HINTERLAND_CLEAR + 1.0 + ((hashId(`${nut}|r`) % 1000) / 1000) * (HINTERLAND_REACH - HINTERLAND_CLEAR - 1.6);
      const giua = (gridSize - 1) / 2;
      const u = giua + Math.cos(goc) * (giua + banKinh);
      const v = giua + Math.sin(goc) * (giua + banKinh);
      if (!khoRao(u, v)) continue;
      dat(u, v, loai, { seed: nut, ry: ((hashId(`${nut}|ry`) % 1000) / 1000) * Math.PI * 2 });
    }
  }

  return out;
}

/**
 * Vùng phụ cận của một kỷ, đã kèm mô tả hình học — đây là hàm mà `cityParts.js` gọi.
 *
 * ⚠️ CHỮ KÝ CHỈ CÓ `era` + `gridSize`, ĐÚNG NHƯ `deriveOutskirts`. Bảng và địa thế được tra Ở ĐÂY
 * chứ không do bên gọi truyền vào: nếu để bên gọi truyền thì sớm muộn sẽ có một chỗ gọi quên
 * truyền và rơi về mặc định, tức kỷ ấy lặng lẽ mất vùng phụ cận — đúng thứ mà cả
 * `isValidHinterland` lẫn phép đếm ở đầu bên kia sinh ra để chặn.
 */
export function deriveHinterland({ era, gridSize = 12 } = {}) {
  const key = Number.isFinite(era) ? era : 1;
  const style = getHinterlandStyle(key);
  if (!isValidHinterland(style)) return [];
  const setting = buildSetting({ era: key, gridSize });
  return planHinterland({ era: key, gridSize, style, setting }).map((item) => ({
    ...item,
    spec: buildHinterlandSpec({ kind: item.kind, style, seed: item.seed, detail: item.detail }),
  }));
}
