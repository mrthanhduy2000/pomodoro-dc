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

import { unit, signed } from '../hashId';
import { emitGroundFloor } from './groundFloor';
import { emitRooftop } from './rooftop';
import { getGroundFloor } from './groundFloorStyle';
import { getRoofStyle } from './roofStyle';
import { gable, prism, countSpecTriangles, specHeight, specSpan } from './parts';
import { getEraStyle, getVernacularStyle, eaveOverhang } from './eraStyle';
import { getArchetype, getMassing, getMotifBudget, getRarityScale } from './archetypes';
import { emitSignature } from './signature';

/** Bề dày mảng tường phụ / gờ / diềm. Đủ để bắt sáng, đủ mỏng để không ăn vào khối chính. */
const TRIM_THICKNESS = 0.055;
/**
 * Cửa sổ nhô ra khỏi mặt tường một chút — chính vệt lồi này tạo bóng đổ nhỏ làm mặt tiền có nhịp.
 * ⚠️ XUẤT RA vì `SILL_RELIEF` phải LỚN HƠN nó, và luật đó được khoá bằng test. Xem `SILL_RELIEF`.
 */
export const WINDOW_RELIEF = 0.035;

/**
 * Bề ngang cái cửa ĐỜI CŨ — **không còn được dựng ở đâu nữa** từ Phase 10 Bước 2.
 *
 * ⚠️ GIỮ LẠI CÓ CHỦ ĐÍCH, VÀ KHÔNG PHẢI VÌ LƯỜI XOÁ. Đây là **đối chứng** của bài
 * `CỬA LÀ TỈ LỆ, KHÔNG PHẢI SỐ TUYỆT ĐỐI` trong `groundFloor.test.js`: bài ấy nhốt sẵn bộ số hỏng
 * cũ và bắt phép đo phải còn bắt được nó (0,14 trên nhà dân rộng 0,45 = 31% mặt tiền, đọc ra là
 * một cái cổng; trên kỳ quan rộng 1,35 = 10%, đọc ra là một vết nứt). Bài học Phase 9A: *"kèm một
 * ĐỐI CHỨNG nhốt bộ số hỏng cũ, bắt phép đo phải còn bắt được nó, nếu không ngưỡng sẽ bị nới dần
 * cho tiện."* Xoá hằng số này đi thì bài test phải chép con số 0,14 vào chính nó — tức tự tạo
 * "một luật hai công thức", đúng thứ đã cắn dự án nhiều lần.
 */
export const LEGACY_DOOR_WIDTH = 0.14;

/**
 * ─── KHỐI KIẾN TRÚC (Phase 8A) ───────────────────────────────────────────────
 *
 * ⚠️ VÌ SAO NHỮNG CON SỐ NÀY RA ĐỜI. Đàm nhìn ảnh cận cảnh và nói thành phố *"quá pixel, hình hộp,
 * vật liệu phẳng"*. Đo ra thì anh đúng đến mức khó chối: **nhà dân là 12 khối, trong đó thân nhà
 * đúng MỘT cái hộp** (`wall:1`), cộng một khối mái và 8 mảnh kính. Đúng nghĩa đen "cube + mái".
 *
 * Nhưng con số thứ hai mới là con số đáng xấu hổ: cả cảnh dùng **5% (kỷ 1) đến 23% (kỷ 7)** ngân
 * sách tam giác. Tức là suốt nhiều phase, chỗ này tiết kiệm tam giác ở một nơi KHÔNG cần tiết kiệm,
 * rồi đi chỉnh màu để bù cho cảm giác phẳng — chữa triệu chứng của một bệnh do chính mình gây ra.
 *
 * Hai thứ mắt người dùng để đọc ra "đây là một khối đặc" chứ không phải "một hình chữ nhật tô màu":
 *   1. **Đường ngang cắt mặt tường.** Một mảng tường cao 2 đơn vị không có gì trên đó thì đọc ra
 *      như bìa các-tông. Chân tường + gờ mái + gờ tầng chia nó thành các dải có tỉ lệ.
 *   2. **Bóng do CHÍNH công trình đổ lên chính nó.** Muốn có bóng thì phải có thứ THÒ RA. Bệ cửa
 *      sổ thò xa hơn ô kính nên nó hắt một vệt tối xuống mặt tường ngay dưới nó — đó là chi tiết
 *      rẻ nhất trong cả file này mà lại đọc ra rõ nhất.
 *
 * ⚠️ VÀ ĐÂY LÀ LÝ DO CỬA SỔ CŨ TRÔNG NHƯ MIẾNG DÁN: chúng **thò RA** khỏi tường 0,035 chứ không
 * lõm vào. Một ô kính nhô lên trên mặt tường thì mắt đọc ra "cái nhãn dán", không đọc ra "cái lỗ".
 * Không sửa được bằng cách cho nó lõm vào (thân nhà là khối ĐẶC, lõm vào là biến mất), nên cách
 * đúng là dựng KHUNG quanh nó thò ra XA HƠN — mắt suy ra chiều sâu từ bóng của khung, y hệt cách
 * một bức phù điêu gợi ra chiều sâu trên một mặt phẳng.
 */

/**
 * ⚠️ BỐN CON SỐ DƯỚI ĐÂY XUẤT RA KHÔNG PHẢI ĐỂ AI DÙNG LẠI — chúng xuất ra vì **quan hệ thứ tự
 * giữa chúng mới là cái luật**, và bài test phải hỏi chính chúng chứ không được chép lại giá trị
 * (đúng bài học "một luật một công thức"). Thứ tự bắt buộc, đọc từ thò xa nhất tới ít nhất:
 *
 *     CORNICE_SPREAD  >  PLINTH_SPREAD  >  COURSE_SPREAD          và   SILL_RELIEF > WINDOW_RELIEF
 *
 * Đảo bất kỳ dấu nào trong đó là hỏng ngay, mà **không có gì đỏ lên**: nhà vẫn dựng được, chỉ là
 * cái gờ mất bóng và mặt tường phẳng trở lại — đúng loại lỗi im lặng đã cắn ở Phase 7D.
 */

/** Chân tường thò ra bao nhiêu phần thân nhà (mỗi bên). Trước Phase 8A là 0,025 — quá mảnh để đọc. */
export const PLINTH_SPREAD = 0.055;
/** Chiều cao chân tường, tính theo phần chiều cao thân — nhà cao thì bệ cũng phải cao theo. */
const PLINTH_HEIGHT = 0.055;
/** Gờ mái (cornice) — dải ngang ngay dưới mái. Thò ra XA HƠN chân tường: nó phải hắt bóng xuống tường. */
export const CORNICE_SPREAD = 0.075;
const CORNICE_HEIGHT = 0.05;
/** Gờ tầng (string course) — dải mảnh ở mỗi ranh giới tầng. Mảnh hơn hẳn hai cái trên. */
export const COURSE_SPREAD = 0.028;
const COURSE_HEIGHT = 0.022;
/** Trần số dải gờ tầng mỗi mảng nhà. Tháp 8 tầng kẻ đủ 7 dải thì thành sọc ngựa vằn. */
export const MAX_COURSES = 3;
/** Bệ cửa sổ thò ra xa hơn ô kính — chênh lệch này CHÍNH LÀ thứ sinh ra vệt bóng. */
export const SILL_RELIEF = 0.085;
const SILL_HEIGHT = 0.035;
/** Bệ/lanh tô rộng hơn ô kính mỗi bên bao nhiêu. */
const SILL_OVERHANG = 0.035;

/** Băm → số thực trong [0,1). Tất định tuyệt đối. */
/**
 * Chiều cao một mảng nhà. Nâng cấp công trình PHẢI nhìn thấy được là cao lên — đây là phần thưởng
 * hình ảnh cho việc Đàm nâng cấp, nếu không thì cấp 3 chỉ là một con số trong bảng.
 */
function massHeight(mass, style, archetype, rarity, level, storeyScale = 1) {
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
    * getRarityScale(rarity) * levelBoost * (mass.low ? 0.34 : 1) * storeyScale;
}

// ─── MÁI ─────────────────────────────────────────────────────────────────────

/**
 * Lợp mái cho một mảng nhà. Đây là chi tiết PHÂN BIỆT KỶ mạnh nhất: cùng một khối hộp, đội mái nón
 * rơm thì ra túp lều, đội phiến kính mỏng thì ra kiến trúc tương lai.
 *
 * ⚠️ HÀM NÀY **TRẢ VỀ CHỖ ĐỨNG CỦA MÁI** (`RoofAnchors`) — và đó không phải một tiện ích, nó là
 * cách duy nhất đúng để `rooftop.js` biết đặt cái ống khói/bồn nước ở đâu (Phase 11). Cách sai là
 * để `rooftop.js` chép lại công thức `eaves → rw → pitch → cộng dồn chiều cao từng tầng`; dự án đã
 * trả giá cho đúng hình dạng ấy hai lần (`sweep-score.mjs` chép công thức của `city-preview.mjs`
 * kèm một mặc định `--cell` khác — Phase 4G; `sceneGraph.js` DỰ ĐOÁN số tam giác trong khi three
 * biết chính xác — Performance Gate). Một luật, một công thức: **chỉ chỗ nào DỰNG ra hình mới được
 * phát biểu hình ấy nằm ở đâu.**
 *
 * @returns {{x:number, z:number, eaveY:number, apexY:number, rw:number, rd:number, pitch:number,
 *            deck:{x:number,z:number,y:number,w:number,d:number}|null,
 *            ridges:Array<{x:number,z:number,y:number,w:number,ry:number}>}}
 *   `eaveY` đỉnh tường (chân mái) · `apexY` điểm cao nhất · `deck` mặt bằng ĐỨNG ĐƯỢC (`null` khi
 *   mái dốc — và `null` phải được tôn trọng, không được xấp xỉ) · `ridges` các sống mái.
 */
// ⚠️ `export` KHÔNG phải để tiện dùng lại — không ai ngoài file này gọi nó. Nó để BÀI TEST hỏi
// thẳng nhà máy mái *"kiểu mái này có dựng ra khối nào không?"*. Hỏi qua công trình đã lắp
// xong thì không trả lời được: `emitSignature` dựng khối ở ĐÚNG chỗ mái đứng (cùng `x`/`z`,
// cùng cao độ đỉnh tường), nên một nhánh mái đã bị xoá vẫn 'có khối ở đó' — đã đo và thấy
// đúng như vậy ở kỷ 3 (2026-08-21), suýt ship một cái gác không thể đỏ.
export function emitRoof(out, { w, d, top, x, z }, style, ctx) {
  // ⚠️ NHÁNH KHỐI ĐẶC (Phase 19, ADR-062). Khi `ctx.monolith` có mặt thì cả công trình LÀ cái
  // mái, dựng thẳng từ mặt đất lên — xem `emitMonolith` ngay dưới.
  const mono = ctx?.monolith ?? null;
  // Kim tự tháp không có diềm mái. Diềm ở đây nới đáy ra thành hình nấm, đúng bệnh `eaves` đã cắn
  // ở Phase 7C — nên nhánh khối đặc ép về 0 thay vì bắt bảng kỷ phải khai 0 (nhà dân kỷ 2 vẫn cần
  // diềm của nó).
  const eaves = mono ? 0 : eaveOverhang(style, w, d);
  const rw = w + eaves * 2;
  const rd = d + eaves * 2;
  // ⚠️ Khối đặc truyền THẲNG `pitch` và cố ý KHÔNG đi qua cái kẹp 0,08: `emitMonolith` đã tính sẵn
  // con số cho ra ĐÚNG chiều cao đích, cái kẹp sẽ lặng lẽ kéo nó cao lên mà không có gì đỏ —
  // đúng hình dạng bẫy `MIN_STONE` và `walk` đã ghi ở `streetStyle.js`.
  const pitch = mono ? mono.pitch : Math.max(0.08, style.roofPitch) * Math.max(w, d);
  const anchors = { x, z, eaveY: top, apexY: top, rw, rd, pitch, deck: null, ridges: [] };

  switch (style.roof) {
    case 'cone':
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: pitch, sides: 8, taper: 0, role: 'roof' }));
      anchors.apexY = top + pitch;
      break;

    case 'gable': {
      // Xoay 90° cho một phần công trình để dãy nhà không cùng quay một hướng như xếp hàng.
      //
      // ⚠️ TRỪ KỲ QUAN — lỗi thật, phát hiện 2026-08-14 khi bài test đối xứng được mở rộng ra cả
      // 15 kỷ. Hàm băm ở đây lấy khoá theo `x|z` của TỪNG MẢNG NHÀ, mà kỳ quan epic có bốn tháp
      // góc ở bốn toạ độ khác nhau ⇒ bốn cái mái quay bốn hướng độc lập nhau. Trên màn hình đó là
      // một toà cung điện đối xứng hoàn hảo đội bốn cái mái lệch pha. Bài test cũ không bắt được
      // vì nó chỉ soi kỷ 1 (mái `cone`, không có nóc để mà quay); chỉ hai kỷ mái `gable` (5 và 8)
      // dính, và cả hai đều đã chạy như vậy nhiều tháng mà không có gì đỏ lên.
      //
      // ⚠️ Và góc xoay ấy nay phải ĐI RA NGOÀI cùng `anchors.ridges`: sống mái quay hướng nào thì
      // cuộn nóc và thanh nóc của `rooftop.js` phải nằm đúng hướng đó. Đây chính là thứ sẽ lệch
      // trong im lặng nếu file kia tự đoán lại.
      const ridgeRy = !ctx.symmetric && unit(`${ctx.bpId}|ridge|${x}|${z}`) > 0.55 ? Math.PI / 2 : 0;
      out.push(gable({ x, z, y: top, w: rw, d: rd, h: pitch, role: 'roof', ry: ridgeRy }));
      anchors.apexY = top + pitch;
      anchors.ridges.push({ x, z, y: top + pitch, w: rw, ry: ridgeRy });
      break;
    }

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
      const capH = Math.max(0.05, pitch * 0.34);
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: lip, sides: 4, role: 'trim' }));
      out.push(prism({ x, z, y: top + lip, w: rw * 0.94, d: rd * 0.94, h: capH, sides: 4, role: 'roof' }));
      anchors.apexY = top + lip + capH;
      // Mặt sàn mái — đây mới là chỗ ĐỨNG ĐƯỢC, và nó là mặt trên của TẤM PHỦ chứ không phải của
      // cái gờ: đặt đồ lên mặt gờ thì bồn nước sẽ lún nửa thân vào tấm phủ.
      anchors.deck = { x, z, y: anchors.apexY, w: rw * 0.94, d: rd * 0.94 };
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
        // ⚠️ Mặt bằng đứng được là mặt trên của bậc CUỐI, nên phải chốt trước khi thu tiếp — chốt
        // sau vòng lặp thì được bề ngang của một bậc thứ tư không tồn tại (nhỏ hơn thật 28%).
        anchors.deck = { x, z, y: cy, w: cw, d: cd };
        cw *= 0.72;
        cd *= 0.72;
      }
      anchors.apexY = cy;
      break;
    }

    // ⚠️ `ziggurat` KHÔNG PHẢI `stepped` VIẾT KHÁC ĐI — hai kỷ kề nhau về mặt từ vựng nhưng ngược
    // nhau về mặt kiến trúc, và trước 2026-08-21 chúng dùng chung MỘT nhánh mã.
    //
    //   `stepped`  = luật giật cấp (setback) cao ốc New York 1916 → mặt tường **ĐỨNG**, thềm thu
    //                vào từ mép mái, số tầng ít, mỗi thềm chỉ là một cái mũ trên đỉnh toà nhà.
    //   `ziggurat` = đền thờ Lưỡng Hà → mặt tường **XIÊN VÀO** (batter), thềm thu vào từ mép
    //                THÂN NHÀ chứ không từ mép mái, và trên đỉnh có một ngôi đền nhỏ.
    //
    // Ba khác biệt ấy đều đo được, và cái thứ hai mới là cái quyết định mắt có đọc ra "giật cấp"
    // hay không: `stepped` mở đầu ở `rw` — tức RỘNG HƠN thân nhà — nên bậc đầu tiên KHÔNG tạo ra
    // một cái thềm nào cả, nó chỉ nối tiếp mặt tường. Đàm nhìn kỷ 3 và nói *"kim tự tháp không có
    // khối hình chóp"*: đúng, vì bậc duy nhất mắt thấy được là bậc thứ hai, cao 0,32 trên một
    // thân nhà cao 1,87.
    //
    // Công trình có thật: **ziggurat thành Ur** (Nasiriyah, Iraq) — 3 thềm chồng, đáy 64×45 m,
    // tường thềm 1 nghiêng vào rõ rệt, đền thờ nhỏ trên đỉnh. Tỉ lệ ở đây là tỉ lệ ĐỌC ĐƯỢC ở cỡ
    // hiển thị thật chứ không phải tỉ lệ đo đạc khảo cổ (Ur thật có thềm 1 cao 11 m trên đáy 64 m
    // = 0,17 lần bề ngang; ở cỡ một ô lưới thì một thềm mảnh như vậy còn chưa tới hai điểm ảnh).
    case 'ziggurat': {
      // Thu vào theo TỈ LỆ THÂN NHÀ, không theo bề ngang mái — đó là chỗ tạo ra cái thềm.
      const PLAN = [0.8, 0.58, 0.42];
      const CAO = [0.62, 0.46, 0.32];
      const BATTER = 0.88;   // mặt tường nghiêng vào — dấu hiệu nhận dạng số một của ziggurat
      let cy = top;
      for (let i = 0; i < PLAN.length; i += 1) {
        const tw = w * PLAN[i];
        const td = d * PLAN[i];
        const h = pitch * CAO[i];
        out.push(prism({ x, z, y: cy, w: tw, d: td, h, sides: 4, taper: BATTER, role: 'roof' }));
        cy += h;
        anchors.deck = { x, z, y: cy, w: tw * BATTER, d: td * BATTER };
      }
      // Đền thờ trên đỉnh (cella). Vai `trim` chứ không phải `roof`: ở Ur nó lợp gạch men khác hẳn
      // thân ziggurat. `trim` đã có mặt ở kỷ này rồi nên KHÔNG thêm họ vật liệu nào — luật lệnh vẽ
      // ở `drawCallBudget.test.js` không bị đụng tới.
      const dw = w * 0.24;
      out.push(prism({ x, z, y: cy, w: dw, d: d * 0.24, h: pitch * 0.4, sides: 4, taper: 0.94, role: 'trim' }));
      anchors.apexY = cy + pitch * 0.4;
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
        // Sống mái của bộ mái chồng tầng nằm trên MẶT ĐỈNH của tầng trên cùng — mà mặt ấy hẹp,
        // vì mỗi tầng là một chóp thoải (`taper` 0,34). Đúng như mái điện thật: bờ nóc rất ngắn so
        // với bề ngang mái, và chính sự tương phản ấy làm bộ mái đọc ra là "chồng tầng".
        anchors.ridges = [{ x, z, y: cy - pitch * 0.1, w: rw * shrink * 0.34, ry: 0 }];
      }
      anchors.apexY = cy;
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
      anchors.apexY = top + cornice * 1.5 + pitch * 1.18;
      break;
    }

    case 'pyramid':
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: pitch, sides: 4, taper: 0.06, role: 'roof' }));
      anchors.apexY = top + pitch;
      break;

    case 'sawtooth': {
      // Mái răng cưa nhà xưởng: ba dải mái nhỏ song song, đúng nét kỷ Công Nghiệp.
      const teeth = 3;
      const step = rd / teeth;
      for (let i = 0; i < teeth; i += 1) {
        const tz = z - rd / 2 + step * (i + 0.5);
        out.push(gable({ x, z: tz, y: top, w: rw, d: step * 0.92, h: pitch * 0.7, role: 'roof' }));
        // ⚠️ BA sống mái, không phải một. Mái răng cưa có bao nhiêu răng thì có bấy nhiêu nóc, và
        // đó chính là thứ làm nó đọc ra là mái nhà máy. Trả về một cái là mất hai phần ba đường nét.
        anchors.ridges.push({ x, z: tz, y: top + pitch * 0.7, w: rw, ry: 0 });
      }
      anchors.apexY = top + pitch * 0.7;
      break;
    }

    case 'blade': {
      // Phiến mỏng lơ lửng, tách khỏi thân bằng một khe hở — khe hở mới là thứ tạo cảm giác bay.
      const bladeH = pitch * 0.34;
      out.push(prism({
        x, z, y: top + pitch * 0.5, w: rw * 1.12, d: rd * 1.12, h: bladeH, sides: 4, role: 'roof',
      }));
      anchors.apexY = top + pitch * 0.5 + bladeH;
      anchors.deck = { x, z, y: anchors.apexY, w: rw * 1.12, d: rd * 1.12 };
      break;
    }

    default: {
      const slabH = pitch * 0.5;
      out.push(prism({ x, z, y: top, w: rw, d: rd, h: slabH, sides: 4, role: 'trim' }));
      anchors.apexY = top + slabH;
      anchors.deck = { x, z, y: anchors.apexY, w: rw, d: rd };
    }
  }

  return anchors;
}

/**
 * KHỐI ĐẶC — công trình LÀ cái khối, không phải một căn nhà đội mái (Phase 19, ADR-062).
 *
 * ⚠️ VÌ SAO PHẢI CÓ HÀM NÀY, CHỨ KHÔNG PHẢI "KHAI `roof: 'pyramid'` LÀ XONG". Kỷ 2 đã khai đúng
 * `pyramid` từ lâu, và kim tự tháp Giza vẫn ra một cái HỘP GẠCH ĐỘI NÓN: bảy nguyên mẫu trong
 * `archetypes.js` đều theo cùng một khuôn THÂN + MÁI, nên `emitRoof` chỉ được gọi ở đỉnh thân
 * tường. Bệnh không nằm ở hình cái mái — nó nằm cao hơn một tầng, ở chỗ *cái gì đỡ cái mái*.
 * Kim tự tháp không có tường, không có cửa, không có diềm; nó là một khối liền từ mặt đất lên đỉnh.
 *
 * ⚠️ CHIỀU CAO ĐO ĐƯỢC, KHÔNG DỰ ĐOÁN. `pitch` không phải chiều cao: mỗi hình mái cộng dồn nó theo
 * một công thức riêng (chóp cộng đúng một lần `pitch`, ziggurat cộng ba thềm rồi cộng thêm cái đền
 * trên đỉnh ⇒ 1,8 lần). Chép lại mấy công thức ấy ở đây là dựng công thức thứ hai cho cùng một
 * luật — đúng cái bẫy đã cắn dự án ở `sweep-score.mjs` và ở ngân sách tam giác. Nên: dựng THỬ một
 * lần ở `pitch = 1`, ĐỌC `apexY` mà chính `emitRoof` trả về, rồi mới chia. Chiều cao TUYẾN TÍNH
 * theo `pitch` ở mọi nhánh nên một lần thử là đủ, không cần lặp.
 *
 * ⚠️ VÀ NÓ ĐO CẢ BỀ NGANG, KHÔNG CHỈ CHIỀU CAO — đây là chỗ dễ ship một con số nói dối nhất.
 * `emitRoof` nhận bề ngang của THÂN NHÀ rồi từ đó dựng ra hình mái, mà mỗi hình thu vào một kiểu:
 * chóp giữ nguyên đáy (hệ số 1) còn ziggurat thu thềm dưới cùng về `0,8`. Nếu cứ truyền thẳng
 * `base` vào làm bề ngang thân thì bảng kỷ KHAI đáy 2,9 mà màn hình DỰNG ra 2,32 — tỉ lệ cao:đáy
 * thật hoá 0,59 trong khi bảng ghi 0,47, và không có gì đỏ lên. Đúng `TECH_DEBT #42`. Nên: đo
 * luôn bề ngang của khối thử rồi chia ngược, để `base`/`rise` khai ra là `base`/`rise` DỰNG ra.
 *
 * @param {number} base  cạnh đáy ĐÍCH của khối đã dựng (đơn vị mô tả).
 * @param {number} rise  tỉ lệ cao : đáy của công trình có thật.
 * @returns {false|object} `anchors` của khối đã dựng, hoặc `false` nếu hình mái này không cao lên
 *   theo `pitch` (không có nhánh nào như vậy hôm nay — nhưng trả `false` thì lỗi ĐẾM ĐƯỢC ở đầu
 *   bên kia, thay vì lặng lẽ chia cho 0 rồi đẩy một khối `NaN` vào cảnh).
 */
export function emitMonolith(out, { x, z, y, base, rise }, style, ctx) {
  const thu = [];
  const doThu = emitRoof(thu, { w: 1, d: 1, top: 0, x: 0, z: 0 }, style, {
    ...ctx, monolith: { pitch: 1 },
  });
  const caoMoiDonVi = doThu.apexY;          // chiều cao trên mỗi đơn vị `pitch`
  const rongMoiDonVi = specSpan(thu);       // bề ngang trên mỗi đơn vị bề ngang thân
  if (!(caoMoiDonVi > 1e-6) || !(rongMoiDonVi > 1e-6)) return false;

  const than = base / rongMoiDonVi;         // bề ngang thân cần truyền để DỰNG ra đúng `base`
  const cao = rise * base;
  return emitRoof(out, { w: than, d: than, top: y, x, z }, style, {
    ...ctx, monolith: { pitch: cao / caoMoiDonVi },
  });
}

// ─── CỬA SỔ ──────────────────────────────────────────────────────────────────

/**
 * Nhịp cửa sổ trên bốn mặt tường. Đây là thứ làm mặt tiền có "nhịp điệu" — mắt người nhận ra một
 * toà nhà trước hết qua nhịp cửa sổ, kể cả khi nó chỉ to bằng đầu ngón tay trên màn hình.
 *
 * Vẽ đủ bốn mặt vì camera xoay được 360°: bỏ mặt sau sẽ lộ ra ngay lần đầu Đàm kéo xoay.
 */
function emitWindows(out, { w, d, base, height, x, z }, style, matNa) {
  if (style.windows === 'none' || height < 0.3) return;

  const stories = Math.max(1, Math.round(height / style.storyHeight));
  // `sideways` = mặt tường nằm trên hai cạnh trái/phải; cửa sổ ở đó chạy dọc trục Z, còn ở mặt
  // trước/sau thì chạy dọc trục X. Một cờ boolean gọn hơn nhiều so với xoay từng khối một.
  const faces = [
    { nx: 0, nz: 1, span: w, sideways: false, ten: 'zp' },
    { nx: 0, nz: -1, span: w, sideways: false, ten: 'zm' },
    { nx: 1, nz: 0, span: d, sideways: true, ten: 'xp' },
    { nx: -1, nz: 0, span: d, sideways: true, ten: 'xm' },
  ];

  for (const face of faces) {
    // ⚠️ TƯỜNG CHUNG THÌ KHÔNG CÓ CỬA SỔ (Phase 14 §1(3)). Mặt nạ VẮNG MẶT ⇒ bốn mặt đều mở, tức
    // mọi lời gọi cũ (năm kỳ quan, nhà dân đứng một mình) chạy y hệt như trước. Chỉ đơn vị nằm
    // trong một dãy chung tường mới truyền mặt nạ xuống, và khi ấy mặt bị hàng xóm áp vào sẽ
    // không được đục cửa — vừa đúng kiến trúc (nhà đấu lưng chỉ có cửa trước và sau), vừa là
    // khoản tiết kiệm tam giác lớn nhất của cả phase.
    if (matNa && matNa[face.ten] === false) continue;
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

        // ⚠️ DẢI CHE SÀN (spandrel) — vế hiện đại của cái bệ cửa sổ ở nhánh dưới, và nó là thứ
        // KHÁC hẳn chứ không phải bản rẻ tiền của cùng một chi tiết. Nhà kính không có bệ đá: cái
        // ngăn giữa hai tầng kính là một dải nhôm/bê tông che mép sàn, chạy LIỀN hết mặt tiền.
        // Nó thò ra xa hơn mặt kính nên vẫn sinh đúng vệt bóng cần có — cùng một nguyên lý, hai
        // cách xây khác nhau, đúng như hai thời đại ấy thật sự khác nhau.
        out.push(prism({
          x: wallOffset.x, z: wallOffset.z, y: y - SILL_HEIGHT,
          w: face.sideways ? SILL_RELIEF : face.span * 0.94,
          d: face.sideways ? face.span * 0.94 : SILL_RELIEF,
          h: SILL_HEIGHT, sides: 4, role: 'trim',
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

        // ── BỆ CỬA SỔ + LANH TÔ ────────────────────────────────────────────
        // ⚠️ CHỈ Ở KỶ XÂY BẰNG ĐÁ/GẠCH, và đó không phải để tiết kiệm tam giác — đó là sự thật về
        // kết cấu. Tường đá muốn có lỗ thì BẮT BUỘC phải có một thanh đá bắc ngang bên trên (lanh
        // tô) để đỡ phần tường phía trên cái lỗ ấy; nhà kính hiện đại treo cả mặt tiền lên khung
        // thép nên không có lanh tô, và cho nó lanh tô là dựng sai cách nhà đó đứng được.
        // Kỷ `grid`/`curtain`/`neon` đi đường khác ở nhánh trên (dải ngang liền mạch).
        const sillW = ww + SILL_OVERHANG * 2;
        out.push(prism({
          x: px, z: pz, y: y - SILL_HEIGHT,
          w: face.sideways ? SILL_RELIEF : sillW,
          d: face.sideways ? sillW : SILL_RELIEF,
          h: SILL_HEIGHT, sides: 4, role: 'trim',
        }));
        // Lanh tô chỉ dựng khi ô cửa đủ cao để mắt còn tách được hai thanh — ô khe hẹp (`slit`)
        // của kỷ phòng thủ vốn là một rãnh chém xuyên tường, nó KHÔNG có lanh tô lộ ra ngoài.
        // ⚠️ VÀ KHÔNG DỰNG Ở KỶ CỬA VÒM: **vòm CHÍNH LÀ lanh tô**. Cả lý do vòm được phát minh ra
        // là để bắc qua một ô cửa rộng hơn thứ mà một thanh đá thẳng chịu nổi. Chồng cả hai lên
        // nhau vừa sai kết cấu vừa cắm hai khối vào đúng một chỗ (`y + wh`).
        if (!isSlit && style.windows !== 'arch') {
          out.push(prism({
            x: px, z: pz, y: y + wh,
            w: face.sideways ? SILL_RELIEF * 0.8 : sillW,
            d: face.sideways ? sillW : SILL_RELIEF * 0.8,
            h: SILL_HEIGHT * 0.8, sides: 4, role: 'trim',
          }));
        }

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

  // ⚠️ HÀM NÀY KHÔNG CÒN DỰNG CỬA RA VÀO NỮA, VÀ ĐÓ LÀ CẢ ĐIỂM CỦA PHASE 10.
  //
  // Trước đây dòng cuối của hàm này dựng một tấm `dark` rộng 0,14 gọi là "cửa". Hai hậu quả:
  // (a) hàm thoát ngay ở dòng đầu khi `windows === 'none'`, nên **kỷ 1 và kỷ 2 chưa bao giờ chạy
  // tới dòng ấy** — hai kỷ đầu không hề có cửa suốt nhiều tháng; (b) một con số tuyệt đối áp cho
  // mọi cỡ khối. Nay cửa do `emitGroundFloor` dựng, gọi từ `buildBuildingSpec` chứ KHÔNG từ đây —
  // vì "kỷ này có cửa sổ không" và "kỷ này có cửa ra vào thế nào" là HAI luật chẳng liên quan gì
  // nhau, mà xưa nay chúng chung một câu `return`.
  //
  // ⚠️ ĐỪNG THÊM LẠI MỘT CÁI CỬA VÀO ĐÂY. Nếu một kỷ trông như thiếu lối vào thì chỗ phải sửa là
  // dòng `groundFloor` của kỷ ấy trong `eraStyle.js`, không phải chỗ này.
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
 * @param {{fx:number, fz:number, storey:number}} [input.plot]  MỘT ĐƠN VỊ TRONG KHU PHỐ
 *   ⚠️ THÊM 2026-08-21 (Phase 14 §1(3)), MẶC ĐỊNH LÀ ĐỒNG NHẤT (1, 1, 1) — nghĩa là mọi lời gọi
 *   cũ cho ra kết quả BYTE-IDENTICAL. Có bài test khoá điều đó, vì năm kỳ quan của cả 15 kỷ đi qua
 *   đúng hàm này và ADR-007 cấm chúng đổi hình vì một tham số chúng không dùng tới.
 *   · `fx`/`fz` co mặt bằng theo TỪNG TRỤC — phải là hai số, không phải một. Một dãy nhà phố hẹp
 *     ngang mà sâu hun hút thì `fz/fx` tới 3–4 lần; ép một hệ số chung là dựng ra nhà vuông, tức
 *     xoá đúng thứ làm nên hình dáng nhà phố.
 *   · `storey` nâng chiều cao. Chia nhỏ mặt bằng mà không nâng chiều cao thì sáu căn nhà thấp chỉ
 *     là sáu cái lều — xem khối chú thích đầu `blockStyle.js`.
 * @returns {{parts:Array, height:number, span:number, triangles:number}}
 */
export function buildBuildingSpec({
  bpId, era, type, rarity = 'common', level = 1, plot,
} = {}) {
  const id = typeof bpId === 'string' && bpId ? bpId : 'bp_unknown';
  // ⚠️ NGUYÊN MẪU CÓ THỂ BỊ BẢNG KỶ THAY (Phase 19, ADR-062). Kỷ 2 và kỷ 3 khai
  // `monument: { form: 'monolith' }`, nghĩa là KỲ QUAN của hai kỷ ấy không phải một căn nhà —
  // nó là một khối liền. Chỗ rẽ nhánh phải nằm ĐÚNG Ở ĐÂY, trước khi `getMassing` và
  // `archetype.heightScale` được đọc, vì cả hai thứ đó khác hẳn giữa nhà và khối đặc.
  //
  // ⚠️ VÀ CHỈ ÁP CHO `wonder`. Bảng khai một hình cho CÔNG TRÌNH BIỂU TƯỢNG của nền văn minh, chứ
  // không phải cho mọi thứ mọc lên ở kỷ ấy — cho cả 5 bản vẽ thành khối đặc là dựng ra một thành
  // phố toàn kim tự tháp, đúng cái bẫy `roof` ↔ `vernacularRoof` đã cắn ở Phase 7C.
  const eraStyleRaw = getEraStyle(era);
  const monoForm = eraStyleRaw.monument?.form === 'monolith' && type === 'wonder';
  const effType = monoForm ? 'monolith' : type;
  const archetype = getArchetype(effType);
  // ⚠️ ĐÂY LÀ CHỖ DUY NHẤT quyết định "công trình này lợp mái kỳ đài hay mái nhà thường", và nó
  // phải nằm ở đây chứ không phải trong `emitRoof`. Xem `getVernacularStyle` (`eraStyle.js`): thay
  // ở NGUỒN thì mọi chỗ đọc `style.roof` về sau tự khớp; thay ở chỗ dựng mái thì `roofRise` vẫn
  // tính theo mái cũ và chi tiết trên nóc sẽ lơ lửng hoặc chôn nửa trong mái.
  const style = archetype.plain ? getVernacularStyle(era) : eraStyleRaw;
  const masses = getMassing(effType, rarity);
  const safeLevel = Number.isFinite(level) ? Math.max(1, Math.min(3, Math.floor(level))) : 1;

  // Bề ngang theo kỷ. Đi CẶP với `massScale`: một mình chiều cao chưa tách được túp lều khỏi tháp
  // kính, vì cái quyết định hình bóng là TỈ LỆ cao/rộng. Lều thì vừa thấp vừa nhỏ (0,42 × 0,80),
  // tháp kính vừa cao vừa mảnh (1,30 × 0,80) — cùng bề ngang mà chiều cao gấp ba.
  // ⚠️ Nhân vào cả `w`/`d` của thân nhà LẪN toạ độ lệch tâm `x`/`z`: chỉ phóng to khối mà giữ
  // nguyên khoảng cách giữa chúng thì các mảng nhà chồng lên nhau (kỷ 3 `spread` 1,18 là ca nặng
  // nhất, hai mảng phụ của hạ tầng epic sẽ ăn vào thân chính).
  const spread = Number.isFinite(style.spread) && style.spread > 0 ? style.spread : 1;
  // ⚠️ MỘT ĐƠN VỊ KHU PHỐ CO THEO **HAI** TRỤC RIÊNG (Phase 14 §1(3)). Kẹp dương tường minh, và
  // rơi về 1 khi tham số vắng mặt — nhờ đó mọi lời gọi cũ (năm kỳ quan của 15 kỷ) chạy y hệt cũ.
  const fx = Number.isFinite(plot?.fx) && plot.fx > 0 ? plot.fx : 1;
  const fz = Number.isFinite(plot?.fz) && plot.fz > 0 ? plot.fz : 1;
  const storeyScale = Number.isFinite(plot?.storey) && plot.storey > 0 ? plot.storey : 1;
  const spreadX = spread * fx;
  const spreadZ = spread * fz;

  const parts = [];
  // Độ lệch "tay làm": kỷ tiền sử để khối xiêu vẹo tự nhiên, kỷ hiện đại thẳng băng.
  // ⚠️ Kỳ quan luôn ĐỐI XỨNG tuyệt đối dù ở kỷ nào — công trình trung tâm mà xiêu vẹo thì cả
  // thành phố mất điểm tựa thị giác.
  const rough = archetype.symmetric ? 0 : style.rough;

  // Đỉnh của từng khối đặc đã dựng. Dùng để CHỮ KÝ KIẾN TRÚC biết leo tới đâu — xem `mainCtx`.
  const monoTops = [];

  masses.forEach((mass, index) => {
    // ⚠️ `rough === 0` thì BỎ HẲN phép tính lệch, không nhân với 0. Nhân số âm với 0 trong
    // JavaScript ra `-0`, mà `-0` không bằng `0` theo `Object.is` — nghĩa là bài test đối xứng
    // của kỳ quan sẽ đỏ vì một khối xoay đúng 0 độ. Rẽ nhánh sớm vừa đúng vừa đỡ băm vô ích.
    // ⚠️ Độ lệch "tay làm" cũng phải CO THEO TRỤC. Nó là một số tuyệt đối trong đơn vị khối, nên
    // giữ nguyên nó trên một đơn vị khu phố hẹp bằng một phần tư căn nhà gốc là nhân độ xiêu vẹo
    // lên bốn lần — cả dãy nhà phố sẽ trông như bị gió thổi.
    const jitterX = rough ? signed(`${id}|jx|${index}`) * rough * 0.06 * fx : 0;
    const jitterZ = rough ? signed(`${id}|jz|${index}`) * rough * 0.06 * fz : 0;
    const jitterR = rough ? signed(`${id}|jr|${index}`) * rough * 0.14 : 0;

    const x = mass.x * spreadX + jitterX;
    const z = mass.z * spreadZ + jitterZ;
    const w = mass.w * spreadX * (rough ? 1 + signed(`${id}|jw|${index}`) * rough * 0.08 : 1);
    const d = mass.d * spreadZ * (rough ? 1 + signed(`${id}|jd|${index}`) * rough * 0.08 : 1);
    const height = massHeight(mass, style, archetype, rarity, safeLevel, storeyScale);
    const base = 0;
    const top = base + height;

    // ── KHỐI ĐẶC: CẢ CÔNG TRÌNH LÀ MỘT KHỐI, DỪNG Ở ĐÂY (Phase 19, ADR-062) ──────────────────
    //
    // ⚠️ NHÁNH NÀY BỎ NĂM THỨ, VÀ PHẢI BỎ ĐỦ CẢ NĂM: thân tường · chân tường · cửa sổ + tầng trệt ·
    // gờ mái/gờ tầng · chi tiết trên nóc. Bỏ thiếu một thứ là hỏng ngay theo kiểu nhìn thấy được —
    // một cái cửa gắn giữa sườn dốc kim tự tháp, hay một cái ống khói cắm trên đỉnh chóp. Đó là lý
    // do nó `return` sớm thay vì rải `if (!monolith)` xuống khắp phần dưới: rải ra thì chỗ thứ sáu
    // viết sau này sẽ quên, đúng bài học đã ghi ở `emitRooftop`.
    //
    // ⚠️ CHIỀU CAO KHÔNG LẤY TỪ `massHeight` — nó lấy từ TỈ LỆ CAO:ĐÁY mà bảng kỷ khai, vì đó mới
    // là thứ định nghĩa một kim tự tháp. Giza cao 146,6 m trên đáy 230,3 m ⇒ 0,637; ziggurat Ur
    // khoảng 30 m trên 64 m ⇒ 0,47. Đo bằng `max(w, d)` (cạnh đáy) chứ không phải số tầng: khối
    // đặc không có tầng nào.
    //
    // ⚠️ CẤP NÂNG CẤP NHÂN ĐỀU CẢ BA CHIỀU, không chỉ chiều cao. Chỉ kéo cao lên thì kim tự tháp
    // cấp 3 thành một cái chóp nhọn hoắt — tức đúng cái tỉ lệ vừa cất công lấy từ Giza lại bị chính
    // phép nâng cấp phá đi. Nở đều thì nó vẫn là Giza, chỉ to hơn.
    if (archetype.monolith) {
      const grow = 1 + (safeLevel - 1) * 0.15;
      // ⚠️ BỀ NGANG LẤY TỪ `monument.base`, KHÔNG dùng `w`/`d` đã nhân `spread` ở trên: `mass.w` ở
      // nguyên mẫu khối đặc chỉ là HỆ SỐ TƯƠNG ĐỐI (epic = 1). Lý do không cho `spread` chạm vào
      // nằm ở chú thích `archetypes.js` — tóm tắt: `spread` là tham số NHÀ Ở, để nó quyết cạnh đáy
      // kim tự tháp thì Ur (spread 1,18) bè hơn Giza (0,98), tức lật ngược lịch sử.
      const canhDay = (Number.isFinite(style.monument?.base) && style.monument.base > 0
        ? style.monument.base : 1.3) * mass.w * grow;
      const rise = Number.isFinite(style.monument?.rise) && style.monument.rise > 0
        ? style.monument.rise : 0.6;
      const anchorsMono = emitMonolith(
        parts, { x, z, y: base, base: canhDay, rise }, style,
        { bpId: id, era, rarity, level: safeLevel, style, symmetric: true },
      );
      // `false` = hình mái này không cao lên theo `pitch`. Không có nhánh nào như vậy hôm nay; nếu
      // có thì thà dựng ra khối rỗng còn hơn đẩy `NaN` vào cảnh, và bài test đếm sẽ bắt được.
      if (anchorsMono) monoTops.push(anchorsMono.apexY);
      return;
    }

    // Thân nhà. Tháp góc thì thóp mạnh hơn cho ra dáng tháp canh.
    parts.push(prism({
      x, z, y: base, w, d, h: height,
      sides: mass.tower ? Math.max(4, style.bodySides) : style.bodySides,
      taper: mass.tower ? Math.min(style.bodyTaper, 0.82) : style.bodyTaper,
      ry: jitterR,
      role: mass.role ?? 'wall',
    }));

    // ── BA ĐƯỜNG NGANG CẮT MẶT TƯỜNG (Phase 8A) ─────────────────────────────
    // Xem khối chú thích ở đầu file. Tóm tắt: một mảng tường không có gì trên đó đọc ra như bìa
    // các-tông, và trước bản này thân nhà đúng là MỘT cái hộp trơn.
    //
    // ⚠️ BA CÁI NÀY THÒ RA BA MỨC KHÁC NHAU, VÀ THỨ TỰ ẤY KHÔNG ĐƯỢC ĐẢO. Gờ mái thò xa nhất
    // (0,075) vì nhiệm vụ của nó là HẮT BÓNG xuống mặt tường — thò ít hơn chân tường thì nó không
    // có bóng và thành một đường kẻ vô nghĩa. Gờ tầng mảnh nhất (0,028) vì nó lặp lại nhiều lần;
    // để nó dày bằng hai cái kia thì mặt tường thành ra một chồng bánh kem.

    // (1) Chân tường — nơi nhà chạm đất. Thiếu nó, nhà trông như bị CẮM xuống đất thay vì ĐỨNG trên.
    parts.push(prism({
      x, z, y: base,
      w: w * (1 + PLINTH_SPREAD), d: d * (1 + PLINTH_SPREAD),
      h: Math.max(TRIM_THICKNESS, height * PLINTH_HEIGHT),
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
      // ⚠️ TẦNG TRỆT ĐI TRƯỚC CỬA SỔ TRONG THỨ TỰ ĐỌC, NHƯNG DỰNG SAU — và nó được gọi TỪ ĐÂY
      // chứ không từ trong `emitWindows`. Đó là cả điểm của Phase 10: cái cửa thôi phụ thuộc vào
      // chuyện kỷ này có cửa sổ hay không (kỷ 1 và 2 khai `windows: 'none'` nên xưa nay không hề
      // có cửa nào). Hai luật khác nhau thì phải có hai đường đi khác nhau.
      // ⚠️ Bảng tầng trệt tra theo SỐ KỶ, không đọc từ `style` — từ 2026-08-18 nó là một bảng
      // riêng (`groundFloorStyle.js`, ADR-029). `getGroundFloor` dùng CHUNG phép chuẩn hoá số
      // kỷ với `getEraStyle` (`normalizeEraKey`), nên kỷ lạ rơi về cùng một chỗ ở cả hai bảng.
      const gf = getGroundFloor(era);
      const hasGroundFloor = Boolean(gf);

      if (!mass.tower) emitWindows(parts, { w, d, base, height, x, z }, style, plot?.faces);

      // ⚠️ THÁP GÓC KHÔNG CÓ CỬA, cùng lý do với cửa sổ: chúng chỉ rộng ~0,2 ô, và một công trình
      // phòng thủ hạng epic có tới bốn cái — bốn cái cửa tí hon trên bốn cái tháp canh đọc ra là
      // lỗi dựng hình chứ không phải chi tiết. Mảng nhà thường mà quá hẹp thì `doorMetrics` tự trả
      // về `null` (một phép ĐO, không phải một luật phải nhớ), nên ở đây chỉ cần chặn tháp.
      if (hasGroundFloor && !mass.tower) {
        // ⚠️ ĐÁNH DẤU `ground: true`, cùng lý do với cờ `deco` ở cuối hàm: nó KHÔNG phục vụ mã
        // dựng, nó phục vụ câu hỏi *"phần này thêm vào những gì?"*. Không có cờ ấy thì bài test
        // "tầng trệt không được thêm họ vật liệu nào" buộc phải tự dựng lại một công trình
        // không-có-tầng-trệt để so — tức viết công thức thứ hai cho cùng một luật, đúng cái bẫy
        // đã cắn dự án nhiều lần.
        const beforeGround = parts.length;
        emitGroundFloor(parts, {
          gf,
          bpId: id, index,
          x, z, base, w, d, height,
          // Cửa phải nghiêng ĐÚNG BẰNG thân nhà, nếu không nó rời khỏi mặt tường ở những kỷ có
          // nét vẽ thô. (Cửa sổ hiện KHÔNG nhận `ry` — sai số dưới một điểm ảnh nên chưa đáng
          // sửa trong phase này; đã ghi `TECH_DEBT`.)
          ry: jitterR,
          storyHeight: style.storyHeight,
          plain: Boolean(archetype.plain),
          symmetric: Boolean(archetype.symmetric),
        });
        for (let i = beforeGround; i < parts.length; i += 1) parts[i].ground = true;
      }

      // (2) Gờ mái (cornice) — dải ngang ngay dưới mái, thò ra XA NHẤT trong ba đường.
      // ⚠️ Đây là chỗ trống lớn nhất của bản cũ: khối `low` đã có gờ trên từ lâu (xem nhánh
      // `else` bên dưới) còn thân nhà THẬT thì đi thẳng từ tường lên mái, không có gì phân cách.
      // Ngoài đời không có toà nhà nào như vậy — chỗ tường gặp mái luôn có một đường bo, vì nếu
      // không thì nước mưa chảy thẳng xuống mặt tường.
      parts.push(prism({
        x, z, y: Math.max(base, top - height * CORNICE_HEIGHT),
        w: w * (1 + CORNICE_SPREAD), d: d * (1 + CORNICE_SPREAD),
        h: Math.max(TRIM_THICKNESS, height * CORNICE_HEIGHT),
        sides: style.bodySides, ry: jitterR, role: 'trim',
      }));

      // (3) Gờ tầng (string course) — một dải mảnh ở mỗi ranh giới tầng.
      // ⚠️ CHỈ DỰNG TỪ TẦNG 2 TRỞ LÊN và tối đa 3 dải. Nhà một tầng không có ranh giới tầng nào để
      // mà đánh dấu; còn tháp kính 8 tầng mà kẻ đủ 7 dải thì vừa tốn vừa thành sọc ngựa vằn.
      // Cắt ở 3 là đủ để mắt đọc ra nhịp mà không đếm — trên cỡ hiển thị thật, dải thứ tư trở đi
      // chỉ còn rộng ~2 điểm ảnh.
      const stories = Math.max(1, Math.round(height / style.storyHeight));
      const courses = Math.min(MAX_COURSES, stories - 1);
      for (let s = 1; s <= courses; s += 1) {
        parts.push(prism({
          x, z, y: base + (height * s) / stories,
          w: w * (1 + COURSE_SPREAD), d: d * (1 + COURSE_SPREAD),
          h: Math.max(0.012, height * COURSE_HEIGHT),
          sides: style.bodySides, ry: jitterR, role: 'trim',
        }));
      }

      const anchors = emitRoof(parts, { w, d, top, x, z }, style, ctx);

      // ── PHẦN TRÊN MÁI (Phase 11) ─────────────────────────────────────────
      // ⚠️ Camera nhìn TỪ TRÊN XUỐNG ⇒ mái là mặt lớn nhất trong khung hình của mỗi công trình.
      // Bước 2 của Phase 10 đã đo được mặt kia của cùng sự thật: tầng trệt gần như không nhìn thấy
      // trên bản quét, dù nó đúng và dù test xanh.
      // ⚠️ `anchors` là thứ `emitRoof` VỪA TRẢ VỀ, không phải thứ `rooftop.js` tự tính lại — xem
      // chú thích ở `emitRoof`. Và KHÔNG có luật "bỏ qua tháp góc" ở đây: `ROOFTOP_MIN_SPAN` là
      // một phép ĐO trên bề ngang thật, nên tháp canh tự rụng mà không cần ai nhớ, đúng cách
      // `doorMetrics` trả `null` thay vì để `emitGroundFloor` phải biết trước cái gì là tháp.
      const beforeRooftop = parts.length;
      emitRooftop(parts, getRoofStyle(era), anchors, {
        bpId: id, index,
        plain: Boolean(archetype.plain),
        // ⚠️ Kỳ quan phải cân TUYỆT ĐỐI, kể cả phần trên mái — hai bài test đối xứng có sẵn đã bắt
        // đúng chỗ này ngay lần chạy đầu của Phase 11. Xem `emitRooftop`.
        symmetric: Boolean(archetype.symmetric),
      });
      for (let i = beforeRooftop; i < parts.length; i += 1) parts[i].rooftop = true;
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
  //
  // ⚠️ …TRỪ NHÀ DÂN (`plain`, Phase 7C). Đàm yêu cầu *"5 landmark phải có silhouette đặc trưng,
  // detail cao hơn nhà dân và nhận ra được từ xa"*. Chữ ký kiến trúc là thứ ĐẮT NHẤT và cũng là
  // thứ MANG CĂN CƯỚC của kỷ; gắn nó lên cả 30 căn nhà dân thì hai điều xảy ra cùng lúc, cả hai
  // đều hỏng: (a) ngân sách tam giác vỡ, (b) kỳ quan chìm nghỉm giữa một đám đông bản sao của
  // chính nó — thứ đáng lẽ phải nhận ra từ xa lại thành thứ khó tìm nhất. Nhà dân vẫn giữ NÉT VẼ
  // của kỷ (mái, cửa sổ, vật liệu, tỉ lệ) qua `eraStyle`, chỉ không mang CĂN CƯỚC.
  const mainMass = masses.find((m) => !m.low) ?? masses[0];
  // ⚠️ KHỐI ĐẶC KHÔNG CÓ THÂN TƯỜNG, nên `massHeight` ở đây trả về chiều cao của một cái thân
  // KHÔNG TỒN TẠI. Chữ ký kiến trúc của kỷ 3 là CẦU THANG CHÍNH DIỆN, và nó lấy `top` để biết leo
  // tới đâu: đưa nhầm con số thì cái thang của ziggurat dừng lại lưng chừng sườn — một khuyết tật
  // nhìn thấy được ngay, mà không có gì đỏ lên. Hỏi thẳng ĐỈNH THẬT mà `emitMonolith` vừa trả về,
  // đừng tính lại (một luật, một công thức).
  const mainMassHeight = monoTops.length
    ? Math.max(...monoTops)
    : massHeight(mainMass, style, archetype, rarity, safeLevel, storeyScale);
  const mainCtx = {
    bpId: id, era, rarity, style,
    w: mainMass.w * spreadX, d: mainMass.d * spreadZ,
    x: mainMass.x * spreadX, z: mainMass.z * spreadZ,
    base: 0, top: mainMassHeight,
    // Kỳ quan đứng giữa thành phố ⇒ chữ ký phải cân hai bên và tuyệt đối không xoay.
    symmetric: Boolean(archetype.symmetric),
  };
  // ⚠️ KHỐI ĐẶC HỎI MỘT TRƯỜNG KHÁC. `style.signature` trả lời *"nhà cửa kỷ này có nét kiến trúc
  // gì"* — với kỷ 2 đó là tường talud + gờ cavetto, hai thứ chỉ có nghĩa khi CÓ tường. Đặt chúng
  // lên một kim tự tháp thì cái gờ rộng 1,18× thân đậu ngay trên đỉnh nhọn. Nên bảng kỷ khai riêng
  // `monument.signature`: kỷ 3 giữ cầu thang ziggurat, kỷ 2 cố ý để trống (Giza mặt ốp TRƠN).
  const sigName = archetype.monolith ? (style.monument?.signature ?? null) : style.signature;
  if (!archetype.plain) emitSignature(parts, sigName, mainCtx);

  // ── Chi tiết đặc trưng của kỷ, số lượng theo độ hiếm ──────────────────────
  // ⚠️ Mọi khối sinh ra từ đây trở xuống được đánh dấu `deco: true`. Đó KHÔNG phải cờ phục vụ
  // test: nó tách "kết cấu" (thân, mái, tháp — bỏ đi là công trình biến dạng) khỏi "trang trí"
  // (tảng đá, thùng hàng, cờ — bỏ đi vẫn còn nguyên công trình). Ranh giới này là thứ cho phép
  // hạ chi tiết trên máy yếu mà không phá hình bóng, và nó cũng giải thích vì sao đá thờ quanh
  // kỳ quan kỷ 1 được phép xoay lệch trong khi bản thân kỳ quan thì tuyệt đối đối xứng.
  const structuralCount = parts.length;
  // Nhà dân: `rarity` ở đây mang nghĩa CỠ NHÀ (nhỏ/vừa/lớn), không phải độ quý — nên tra ngân sách
  // chi tiết theo nó sẽ cho nhà "lớn" 3 mô-típ của kỷ, tức một căn nhà dân bề thế hơn kỳ quan.
  const budget = archetype.plain ? 0 : getMotifBudget(rarity);
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
