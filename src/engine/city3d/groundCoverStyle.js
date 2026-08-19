/**
 * groundCoverStyle.js — 15 kỷ, 15 cách CON NGƯỜI DÙNG PHẦN ĐẤT KHÔNG XÂY NHÀ.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ⚠️ VÌ SAO CÓ FILE NÀY — nó trả lời một câu hỏi mà cả cây cối lẫn nhà cửa đều không trả lời được.
 * Đo ngày 2026-08-19 trên khung hình đã sửa (`TECH_DEBT #49`): **"đất trống" chiếm 46,2% khung hình
 * ở 20 phiên và vẫn còn 35,9% ở 80 phiên** — nghĩa là gần một nửa thứ Đàm nhìn thấy là mặt đất
 * trơn. Thêm cây không chữa được: một cái cây là một vật thể NHỎ đứng giữa một ô rộng, nó che vài
 * phần trăm ô ấy rồi thôi (và Phase 8D đã đo ra rằng ở thành phố trưởng thành lưới cảnh vật kín
 * 144/144 ô mà đất vẫn trống — vì "có một cái cây trong ô" ≠ "ô ấy được dùng vào việc gì").
 *
 * Thứ lấp được đất trống là thứ con người LÀM VỚI ĐẤT: sân, vườn có rào, sân phơi, bãi quây, đống
 * rơm, giếng, quảng trường lát đá. Chúng RỘNG (gần trọn một ô) và THẤP — đúng ngược với cây.
 *
 * ⚠️ VÀ ĐÂY LÀ THỨ PHỤC VỤ KHUNG **TOÀN CẢNH**, KHÔNG PHẢI CẬN CẢNH — trả lời trước khi viết mã,
 * đúng luật Đàm ra sau Phase 11 (`CLAUDE.md`, HỆ QUẢ 2b). Lý do đo được: ở khung mặc định một Ô
 * LƯỚI rộng khoảng 60–90 điểm ảnh, tức **gấp 5–7 lần ngưỡng mắt 12** — trong khi một cái ống khói
 * Phase 11 chỉ còn 3–5 điểm ảnh. Một mảng phủ cỡ gần trọn ô là thứ DUY NHẤT trong ba phase gần đây
 * chắc chắn sống sót ở thang toàn cảnh. (Chi tiết nhỏ bên trong mỗi mảng — cọc rào, thành giếng —
 * là phần thưởng khi bay tới gần, và KHÔNG được dùng để biện minh cho cả phase.)
 *
 * ⚠️ VÌ SAO MỖI DÒNG BÁM VÀO `country` CHỨ KHÔNG CHỌN CHO ĐẸP — y hệt luật đã áp cho thảm thực vật
 * (`floraStyle.js`), mặt đường (`streetStyle.js`), tầng trệt (`groundFloorStyle.js`) và mái
 * (`roofStyle.js`). Mỗi dòng phải trả lời được: *"ở nước ấy, mảnh đất cạnh nhà được dùng làm gì?"*
 * Có test bắt `note` phải nhắc đúng tên nước mà `eraStyle.js` khai — không có ràng buộc đó thì 15
 * dòng là 15 lần chọn bừa, và chọn bừa chính là thứ đã sinh ra 15 kỷ cây giống hệt nhau.
 *
 * ⚠️ VÀ NÓ KHÔNG ĐƯỢC TỐN THÊM MỘT LỆNH VẼ NÀO. Mọi hình ở `groundCover.js` chỉ dùng bốn vai màu:
 * `stone` · `wood` · `leaf` ánh xạ THẲNG (`ROLE_FAMILY` ở `materials.js`) sang
 * `stone`/`wood`/`foliage` — ba họ có mặt ở **15/15 kỷ** (đã đếm) — còn `wall` là vai KHÔNG có
 * trong `ROLE_FAMILY` nên nó rơi về `style.wallMaterial`, tức vật liệu tường của CHÍNH kỷ đó:
 * miễn phí theo định nghĩa. `water` thì CHỈ có ở 7/15 kỷ ⇒ **cấm dùng `water` ở đây**, dù một cái
 * ao hay bể nước nghe rất hợp. Muốn nước thì phải mở một mục nợ và trả bằng một lệnh vẽ, chứ không
 * lén thêm.
 */

import { hashId } from '../hashId';

/**
 * Các kiểu dùng đất mà `groundCover.js` dựng được. Khai ở đây (chứ không ở file hình) vì bảng dưới
 * phải kiểm được: một kỷ lỡ khai kiểu không tồn tại thì test bắt ngay, không đợi tới lúc nhìn ảnh.
 *
 * Bảy kiểu, cùng số với bảy loài cây — không phải trùng hợp cho đẹp: đó là mức mà một bảng 15 dòng
 * còn phân biệt được nhau mà không dòng nào phải khai bừa một kiểu nó không có.
 */
export const COVER_KINDS = [
  'yard',     // SÂN — mảng nền nện/lát có bó vỉa thấp, thứ phổ quát nhất
  'garden',   // VƯỜN CÓ RÀO — hàng rào quây + luống cây
  'drying',   // SÂN PHƠI — nền phẳng + giàn/sào phơi + mẻ hàng trải ra
  'pen',      // BÃI QUÂY — rào thưa quanh khoảng đất trống + máng ăn
  'stack',    // ĐỐNG RƠM / KHO NGOÀI TRỜI — đống chất cao trên bệ kê
  'well',     // GIẾNG — thành giếng tròn + khung gỗ, tim của một xóm
  'plaza',    // QUẢNG TRƯỜNG / BÃI LÁT — mảng lát rộng, bó vỉa, không rào
];

const KIND_SET = new Set(COVER_KINDS);

/**
 * `kinds`   — [kiểu, trọng số]. Chỉ những kiểu nước ấy THẬT SỰ có.
 * `share`   — phần ĐẤT CÒN TRỐNG (sau nhà, đường, cây) được dùng vào việc gì đó, 0…1.
 *             ⚠️ Đây là một PHẦN, không phải một LƯỢNG — bài học Phase 8D: một con số đếm không
 *             nhìn thấy mẫu số, nên "mật độ" viết thành số tuyệt đối thì tăng cho tới khi kín.
 * `scale`   — cỡ mảng phủ (1 = gần trọn ô). Sa mạc quây nhỏ, đồng bằng lúa nước trải rộng.
 * `enclose` — mức độ QUÂY: 0 = mở toang (quảng trường), 1 = rào kín bốn phía (vườn nhà).
 *             Đây là trục bản sắc mạnh nhất khi nhìn từ xa, vì nó đổi ĐƯỜNG VIỀN của mảng.
 */
export const GROUND_COVER_STYLES = {
  1: {
    note: 'Thổ Nhĩ Kỳ — Göbekli Tepe thời săn bắt: chưa có ruộng vườn nên chưa có gì để rào; đất quanh nhà là bãi quây thú bằng cành gai, sân phơi da và đống củi',
    kinds: [['pen', 6], ['drying', 3], ['stack', 2]],
    share: 0.24, scale: 1.08, enclose: 0.15,
  },
  2: {
    note: 'Ai Cập — làng ven sông Nin: mỗi năm nước lũ nuốt hết mặt đất nên RÀO LÀ VÔ NGHĨA; đất dùng vào sân đập lúa, kho thóc chất đống và giếng. Làng chen chúc trên gò cao hơn mức lũ nên mảnh nào cũng nhỏ',
    kinds: [['drying', 6], ['stack', 4], ['yard', 3], ['well', 2]],
    share: 0.40, scale: 0.86, enclose: 0.10,
  },
  3: {
    note: 'Iraq — thành Ur: NƠI SINH RA nhà có sân trong, phòng ốc quây kín bốn phía quanh một khoảng trời; phố xá chật như mê cung nên cái sân nào cũng BÉ NHẤT bảng — chỉ vài mét ngang',
    kinds: [['yard', 7], ['well', 3], ['stack', 2]],
    share: 0.46, scale: 0.72, enclose: 0.92,
  },
  4: {
    note: 'Trung Quốc — tứ hợp viện: SÂN TRONG là hạt nhân của ngôi nhà chứ không phải phần thừa, bốn dãy nhà vây lấy nó; sân NÔNG mà RỘNG vì cả gia tộc sinh hoạt ngoài trời ở đó',
    kinds: [['yard', 7], ['garden', 3], ['drying', 2], ['well', 1]],
    share: 0.52, scale: 1.06, enclose: 0.88,
  },
  5: {
    note: 'Đức — quanh Burg Eltz: tường thành đã quây sẵn cả khu nên trong sân chỉ cần rào hờ; đống rơm, đống củi và chuồng gia súc chiếm gần hết khoảng đất chật giữa các dãy nhà',
    kinds: [['stack', 5], ['pen', 4], ['yard', 3], ['garden', 2]],
    share: 0.44, scale: 0.84, enclose: 0.60,
  },
  6: {
    note: 'Việt Nam — nhà vườn ao chuồng Bắc Bộ: LUỸ TRE quây từng nhà rồi quây cả làng, vườn rau rào tre là gian bếp thứ hai, cái CHUỒNG là chữ C trong "nhà - vườn - ao - chuồng"; thêm sân phơi lúa lát gạch và giếng làng, đồng bằng rộng nên mảnh nào cũng trải ra được',
    kinds: [['garden', 6], ['drying', 5], ['well', 3], ['pen', 2], ['yard', 2]],
    share: 0.60, scale: 1.10, enclose: 0.70,
  },
  7: {
    note: 'Ý — Firenze: cortile kín cổng cao tường ở trong, mà piazza thì CỐ Ý mở toang ra ngoài — hai thái cực trong cùng một thành phố nên rào rất vừa phải',
    kinds: [['plaza', 6], ['yard', 4], ['well', 2]],
    share: 0.42, scale: 0.92, enclose: 0.55,
  },
  8: {
    note: 'Bồ Đào Nha — bến cảng Lisboa: sân phơi cá và muối phải ĐÓN GIÓ ĐÓN NẮNG nên tuyệt đối không quây; kho hàng chất ngoài trời, sân lát đá calçada trải rộng ra tận mép nước',
    kinds: [['drying', 7], ['stack', 4], ['yard', 2]],
    share: 0.50, scale: 1.06, enclose: 0.20,
  },
  9: {
    note: 'Pháp — Paris: vườn cắt tỉa hình học viền hàng rào thấp ngang gối, cour lát đá sau cổng, quảng trường và giếng công cộng; quy hoạch rộng tay nên mảnh nào cũng đàng hoàng',
    kinds: [['garden', 7], ['yard', 3], ['plaza', 2], ['well', 1]],
    share: 0.54, scale: 1.00, enclose: 0.48,
  },
  10: {
    note: 'Anh — Manchester công nghiệp: sân sau nhà liền kề là một CÁI HỘP GẠCH kín mít, hẹp đến nổi tiếng; bãi than chất đống, bãi quây ngựa kéo và chỗ phơi chen nhau trong đó',
    kinds: [['stack', 6], ['yard', 5], ['pen', 3], ['drying', 2]],
    share: 0.48, scale: 0.72, enclose: 0.82,
  },
  11: {
    note: 'Mỹ — New York thời Mạ Vàng: bãi trống lát đá giữa các khối nhà, KHÔNG AI RÀO vì chờ bán chờ xây; lô đất hẹp kẹp giữa hai bức tường cao, gần như không có vườn',
    kinds: [['plaza', 6], ['yard', 5], ['stack', 2]],
    share: 0.30, scale: 0.76, enclose: 0.08,
  },
  12: {
    note: 'Nga — Stalingrad: sân chung giữa các khối nhà rất rộng, và thứ quây nó là CHÍNH CÁC TOÀ NHÀ chứ không phải tường rào; đống củi xếp cao chống mùa đông, vườn rau nhỏ, chuồng thưa',
    kinds: [['yard', 6], ['stack', 4], ['garden', 3], ['pen', 1]],
    share: 0.38, scale: 1.04, enclose: 0.35,
  },
  13: {
    note: 'Nhật Bản — quanh tháp Nakagin: tsuboniwa nghĩa đen là "vườn một tsubo" (3,3 m²) — mảnh vườn khô sỏi đá bé xíu, và thứ viền nó là hàng rào "tay áo" (sode-gaki) chỉ che một hai phía chứ không quây kín; thêm sân trong hẹp và chỗ phơi futon',
    kinds: [['garden', 7], ['yard', 3], ['drying', 2], ['well', 1]],
    share: 0.34, scale: 0.70, enclose: 0.55,
  },
  14: {
    note: 'Singapore — thành phố vườn: mảng cây quy hoạch có bó vỉa trải khắp nơi, RỘNG mà KHÔNG RÀO — chủ trương là cây đi liền mạch qua cả thành phố; quảng trường lát đá dưới tháp kính',
    kinds: [['garden', 7], ['plaza', 4], ['yard', 2]],
    share: 0.66, scale: 1.08, enclose: 0.25,
  },
  15: {
    note: 'UAE — Dubai: giữa sa mạc thì SÂN TRONG TƯỜNG CAO lấy bóng râm là cách DUY NHẤT dùng được đất, nên quây kín tuyệt đối; và nó HẸP mà SÂU chứ không rộng — sân càng hẹp thì tường càng che kín nắng cho nó. Ngoài ra chỉ còn quảng trường lát đá và giếng',
    kinds: [['yard', 6], ['plaza', 4], ['well', 1]],
    share: 0.26, scale: 0.84, enclose: 1.00,
  },
};

/** Kỷ lạ / thiếu → dùng kỷ 1. Không bao giờ ném lỗi: dữ liệu cloud có thể hỏng. */
export function getGroundCoverStyle(era) {
  return GROUND_COVER_STYLES[era] ?? GROUND_COVER_STYLES[1];
}

/**
 * ⚠️ TỪ CHỐI THẲNG một dòng sai, KHÔNG TỰ CHỮA — đúng luật đã ghi ở ADR-026 cho bảng tầng trệt:
 * tự chữa là cách một bảng 15 dòng lặng lẽ thoái hoá về 1 dòng.
 *
 * ⚠️ VÀ PHẢI CÓ NGƯỜI ĐẾM SỐ LẦN TỪ CHỐI Ở ĐẦU BÊN KIA (bài học Phase 10 Bước 2: kỷ 14 khai
 * `doorWidth` vượt trần, validator từ chối ĐÚNG, hàm dựng trả `false` ĐÚNG, và cả kỷ ấy không có
 * cửa trong im lặng). Bài `groundCoverStyle.test.js` vừa kiểm bảng hợp lệ vừa kiểm mỗi kỷ THẬT SỰ
 * dựng ra khối.
 */
export function isValidGroundCoverStyle(style) {
  if (!style || typeof style !== 'object') return false;
  if (typeof style.note !== 'string' || style.note.length < 12) return false;
  if (!Array.isArray(style.kinds) || style.kinds.length === 0) return false;
  for (const entry of style.kinds) {
    if (!Array.isArray(entry) || entry.length !== 2) return false;
    const [kind, weight] = entry;
    if (!KIND_SET.has(kind)) return false;
    if (!Number.isFinite(weight) || weight <= 0) return false;
  }
  // Trùng kiểu trong một dòng là một cách viết trọng số vòng vo, và nó làm bảng khó đọc sai lệch.
  if (new Set(style.kinds.map(([k]) => k)).size !== style.kinds.length) return false;
  const trong01 = (v) => Number.isFinite(v) && v >= 0 && v <= 1;
  if (!trong01(style.share) || style.share <= 0) return false;
  if (!trong01(style.enclose)) return false;
  // Cỡ mảng phủ: dưới 0,7 thì nó thôi là "mảng phủ" mà thành một vật thể nhỏ giữa ô — tức rơi
  // xuống dưới ngưỡng mắt ở khung toàn cảnh, đúng thứ cả phase này sinh ra để tránh. Trên 1,1 thì
  // mảng của hai ô kề nhau dính vào nhau và cả lưới đọc thành một mặt sàn liền.
  if (!Number.isFinite(style.scale) || style.scale < 0.7 || style.scale > 1.1) return false;
  return true;
}

/**
 * Chọn kiểu dùng đất cho MỘT ô, theo trọng số của kỷ. Tất định tuyệt đối: cùng hạt giống → mãi mãi
 * cùng một kiểu (bất biến "bảo tàng bất động", ADR-007).
 */
export function pickCoverKind(era, seed) {
  const list = getGroundCoverStyle(era).kinds;
  let total = 0;
  for (const [, weight] of list) total += weight;
  let roll = hashId(`${seed}|gc`) % Math.max(1, total);
  for (const [kind, weight] of list) {
    roll -= weight;
    if (roll < 0) return kind;
  }
  return list[0][0];
}
