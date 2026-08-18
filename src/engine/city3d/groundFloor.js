/**
 * groundFloor.js — TẦNG TRỆT: cái cửa để bước vào, và MỘT đặc trưng mặt phố của mỗi kỷ.
 *
 * THUẦN: không three, không DOM, không `Date`, không `Math.random`. Đây chỉ là MÔ TẢ hình học ở
 * dạng dữ liệu, đúng kỷ luật của `parts.js`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO PHẢI CÓ FILE NÀY — HAI LỖI THẬT, ĐO ĐƯỢC, ĐÃ CHẠY TRÊN PRODUCTION NHIỀU THÁNG
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Trước Phase 10, toàn bộ "lối vào" của cả 75 công trình là **một dòng lệnh duy nhất** nằm lọt
 * thỏm ở cuối `emitWindows` — một tấm phẳng `role:'dark'` rộng đúng **0,14** dán lên mặt tường.
 * Hai hậu quả, không cái nào làm đỏ một bài test nào:
 *
 * **(1) HAI KỶ ĐẦU KHÔNG HỀ CÓ CỬA.** Dòng ấy nằm SAU câu `if (style.windows === 'none') return;`
 * ở đầu `emitWindows`. Kỷ 1 (Thổ Nhĩ Kỳ) và kỷ 2 (Ai Cập) khai `windows: 'none'` — hoàn toàn đúng
 * về lịch sử, lều da thú và nhà bùn thì không có cửa sổ kính — nên hàm thoát ra trước khi tới
 * dòng cửa. Đo được: `buildBuildingSpec` ở hai kỷ ấy trả về **0 khối mang vai `dark`**. Một công
 * trình không có lối vào là một khối đặc, không phải một toà nhà. Đây là hình dạng sai kinh điển
 * của dự án: *"một luật (cửa sổ) vô tình quyết định số phận của một luật khác (cửa ra vào)"* —
 * hai thứ chẳng liên quan gì nhau bị buộc vào cùng một câu `return`.
 *
 * **(2) MỘT SỐ TUYỆT ĐỐI ÁP LÊN NHỮNG KHỐI CHÊNH NHAU BA LẦN.** `w: 0.14` là cùng một cái cửa cho
 * kỳ quan rộng 1,4 lẫn căn nhà dân rộng 0,45. Trên kỳ quan nó là một khe hẹp 10% mặt tiền (đọc ra
 * là một vết nứt); trên nhà dân nó chiếm 31% (đọc ra là một cái cổng). Đúng cái bẫy `eaves` đã
 * cắn ở Phase 7C và `roadColor` ở Phase 7D, lần thứ ba trong cùng một cây mã. ⇒ Ở file này **mọi
 * kích thước là TỈ LỆ của bề ngang khối, có TRẦN**, không có một con số tuyệt đối nào mô tả cửa.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO TÁCH KHỎI `buildingSpec.js`
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * `buildingSpec.js` đã 821 dòng và đang gánh: chiều cao khối · mái · cửa sổ · mô-típ · chữ ký ·
 * giàn giáo. Nhét thêm tầng trệt vào đó là đẩy nó qua 1.100 dòng — đúng thứ mục "God File" của
 * Roadmap A đang muốn giảm. Dự án ĐÃ có khuôn cho việc này và đã dùng ba lần: bảng khai ở một nơi
 * (`floraStyle.js`, `streetStyle.js`), hình học ở nơi khác (`flora.js`, `terrainMesh.js`), chỗ
 * ghép chỉ ĐỌC. File này là vế "hình học"; vế "bảng khai" là trường `groundFloor` trong
 * `eraStyle.js` — cố ý nằm CÙNG DÒNG với `country`/`landmark`, vì mỗi dòng phải trả lời được
 * *"công trình có thật nào ở nước ấy trông như vậy?"* và câu trả lời nên nằm trong tầm mắt.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÀ TÁCH KỲ QUAN KHỎI NHÀ DÂN — LẦN THỨ NĂM CỦA CÙNG MỘT CÂU HỎI
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Câu hỏi đã cứu dự án bốn lần (`storyHeight` 5B · `roofColor` 7A · `roof`→`vernacularRoof` 7C ·
 * bảng cây 8D): *"ngoài đời hai thứ này có luôn đi cùng nhau không?"*
 * Áp vào đây: **đình làng** và **nhà ống phố cổ** ở cùng một Hà Nội, cùng thời, cùng thợ mộc — mà
 * mặt trước khác hẳn nhau: đình có hàng hiên cột gỗ sâu, nhà ống chỉ có mái đua thấp che mặt hàng.
 * Chúng KHÔNG đi cùng nhau ⇒ bảng phải khai riêng (`feature` cho công trình chính,
 * `vernacularFeature` cho nhà dân). Trường thứ hai là **bắt buộc**, không phải tuỳ chọn: một
 * trường tuỳ chọn sẽ lặng lẽ rơi về `feature` và 30 căn nhà dân lại đội đúng bộ mặt của kỳ quan —
 * đúng lỗi "25 căn nhà nhỏ đội mái vòm Duomo" mà Phase 7C đã trả giá.
 *
 * Ba thứ KHÔNG tách, và đây là lý do: **kiểu cửa, khung cửa, số bậc** là hằng số VĂN HOÁ chứ không
 * phải dấu hiệu địa vị. Cửa bức bàn là cửa của cả đình lẫn nhà ống; cửa hai cánh cao là cửa của cả
 * hôtel particulier lẫn chung cư Haussmann; cửa lùa là cửa của cả Nakagin lẫn quán mì. Thứ khác
 * nhau giữa hai hạng là **CỠ và ĐỘ RƯỜM RÀ**, và hai thứ ấy suy được từ cờ `plain` đã có sẵn
 * (`archetypes.js`) — khai thêm một trường nữa để nói lại điều mã đã biết là tự tạo chỗ để hai bên
 * trôi khỏi nhau.
 */

import { prism, gable } from './parts';
import { unit } from '../hashId';

/**
 * Kiểu cánh cửa. Mỗi giá trị là một cách MỞ khác nhau, không phải cùng một tấm ván đổi màu:
 *   `flap`    tấm mềm treo trên lanh tô — da thú, chiếu sậy, rèm cỏ. KHÔNG có bản lề, KHÔNG có
 *             cánh cứng: nó rủ xuống và bị vén lên. Đây là cái cửa của thời chưa có bản lề.
 *   `panel`   cửa bức bàn: nhiều tấm ván ghép trong khung, tháo rời được (Việt Nam, Đông Á)
 *   `double`  hai cánh cao có trụ giữa — porte cochère, cửa chung cư Pháp
 *   `sliding` cửa lùa: hai tấm trượt chồng mép, không có bản lề (Nhật Bản)
 *   `glazed`  bay kính cao chạy suốt tầng trệt, khung mảnh chia ô — sảnh kính thế kỷ 20
 *
 * ⚠️ DANH SÁCH NÀY CHỈ CHỨA THỨ ĐÃ DỰNG ĐƯỢC, KHÔNG CHỨA THỨ ĐỊNH LÀM. Khai một kiểu chưa có mã
 * dựng thì kỷ ấy nhận về một cái lỗ trống trong im lặng — đúng cái phễu mà `PAVING_KINDS` của
 * `streetStyle.js` tránh bằng cách để `isValidStreetStyle` từ chối thẳng. `groundFloor.test.js`
 * bắt MỌI kiểu trong danh sách này phải sinh ra khối thật.
 *
 * ⚠️ VÌ SAO BƯỚC 2 THÊM ĐÚNG HAI KIỂU, KHÔNG THÊM NỮA. Luật của Đàm là *"KHÔNG viết thêm mã hình
 * học mới trừ khi một kỷ thật sự cần hình chưa có"*. Hai kiểu này là hai ca ấy, và cả hai đều do
 * chính Đàm nêu ra:
 *   - `flap` — *"kỷ 1–2 (đồ đá): cửa phải THÔ SƠ đúng thời — khung gỗ, tấm da, rèm cỏ. Đừng bịa
 *     cho sang."* Dựng cửa bức bàn cho một cái lều da thú là nói dối lịch sử tới **tám nghìn năm**:
 *     bản lề kim loại chưa tồn tại, ván cưa phẳng cũng chưa. Không có kiểu nào trong ba kiểu cũ tả
 *     được một tấm mềm rủ xuống.
 *   - `glazed` — *"kỷ 11 Mỹ → sảnh kính cao hai tầng, bậc đá rộng."* Ba kiểu cũ đều là **cánh** có
 *     bề rộng bằng cái cửa; sảnh kính thì ngược lại, nó là một MẶT TIỀN TRONG SUỐT rộng gấp mấy
 *     lần lối đi, và thứ mắt đọc ra là các đố khung chia ô chứ không phải mấy cái cánh.
 * Mọi kỷ khác đều trả lời được bằng ba kiểu cũ, nên chúng dùng lại — thêm kiểu cho đủ mâm chính là
 * thứ luật trên cấm.
 */
export const DOOR_KINDS = ['flap', 'panel', 'double', 'sliding', 'glazed'];

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * (LỊCH SỬ) `legacy` ĐÃ CHẾT Ở BƯỚC 2 — GIỮ LẠI ĐOẠN NÀY VÌ CÁCH NÓ CHẾT MỚI LÀ BÀI HỌC
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bước 1 chỉ nghiên cứu 3 kỷ (6 · 9 · 13) theo lệnh Đàm — *"nếu hướng mỹ thuật sai thì sai ở kỷ
 * thứ 3 rẻ hơn nhiều so với sai ở kỷ thứ 15"*. Nhưng kiến trúc lại đòi trường `groundFloor` phải
 * bắt buộc đủ 15 kỷ. Hai đòi hỏi ấy gặp nhau ở một giá trị thứ ba: 12 kỷ chưa nghiên cứu khai
 * thẳng `door: 'legacy'`, nghĩa là *"giữ nguyên cửa cũ, tôi chưa trả lời được câu hỏi về nước
 * này"*, và một bài test khoá ĐÚNG con số 12.
 *
 * Điểm đáng giữ lại: **cái con số 12 ấy chính là thứ giết `legacy` đúng hạn.** Một chỗ trống hay
 * một `null` thì im lặng — nó sẽ sống thêm nhiều phase vì không ai đếm được còn bao nhiêu. Chữ
 * `legacy` thì đếm được, và bài test khoá số 12 buộc Bước 2 phải sửa chính nó mới chạy xanh trở
 * lại. Bài test ấy nay đổi vế: nó khoá **KHÔNG kỷ nào còn được để trống**, tức đúng cùng một luật
 * đọc theo chiều ngược lại.
 *
 * ⇒ Luật rút ra cho mọi trạng thái dở dang sau này: **trạng thái "chưa làm" phải TƯỜNG MINH và
 * ĐẾM ĐƯỢC**, và con số đếm được ấy phải nằm trong một bài test. Đừng để nó rơi về mặc định.
 */

/**
 * Đặc trưng tầng trệt. **Mỗi kỷ chọn ĐÚNG MỘT** cho công trình chính và ĐÚNG MỘT cho nhà dân —
 * rắc đều mọi thứ cho mọi kỷ thì 15 kỷ lại về giống nhau, chỉ là giống nhau ở mức rườm rà hơn.
 *   `none`     không có — và đây là một câu trả lời HỢP LỆ, không phải chỗ trống. Thời đồ đá thì
 *              mặt tiền không có gì cả; bịa cho đủ mâm là nói dối lịch sử.
 *   `porch`    hàng hiên cột gỗ — mái thấp đua ra trước, chống trên một hàng cột
 *   `awning`   mái hiên / mành che — tấm che thấp bám lanh tô, KHÔNG có cột đỡ
 *   `balcony`  ban công tầng hai — sàn đua ra + lan can
 *   `shutters` cửa chớp — hai cánh gỗ kẹp hai bên cửa
 *   `sign`     biển hiệu khối — tấm đứng bám mặt tiền cạnh cửa
 *   `arcade`   hàng vòm cuốn chạy suốt mặt tiền — lối đi có mái nằm TRONG lòng công trình
 *
 * ⚠️ `arcade` LÀ ĐẶC TRƯNG DUY NHẤT BƯỚC 2 THÊM VÀO, và nó khác `porch` ở một điểm không thể diễn
 * đạt lại được bằng `porch`: **hàng hiên cột thì ĐUA RA khỏi nhà, hàng vòm thì KHOÉT VÀO trong
 * nhà.** Loggia Firenze, Praça do Comércio Lisboa và five-foot way Singapore đều là lối đi công
 * cộng nằm DƯỚI thân nhà — tường ngoài lùi vào, còn cột và vòm thì đứng đúng trên ranh giới cũ.
 * Dựng nó bằng `porch` sẽ ra một cái mái đua trước một bức tường phẳng, tức mất hẳn cái bóng đổ
 * sâu vốn là toàn bộ lý do người ta xây arcade ở xứ nắng.
 */
export const GROUND_FEATURES = ['none', 'porch', 'awning', 'balcony', 'shutters', 'sign', 'arcade'];

/** Vai màu được phép dùng cho khung cửa. `none` = không có khung, cửa là một lỗ trên tường. */
export const FRAME_ROLES = ['none', 'wood', 'stone', 'trim'];

const DOOR_SET = new Set(DOOR_KINDS);
const FEATURE_SET = new Set(GROUND_FEATURES);
const FRAME_SET = new Set(FRAME_ROLES);

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * CÁC HẰNG SỐ — ĐỌC KỸ CHỮ "TỈ LỆ" VÀ CHỮ "TRẦN"
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ TRẦN LUÔN THẮNG SÀN. Thứ tự phép kẹp là `min(trần, max(sàn, mong muốn))` — trần đứng NGOÀI
 * CÙNG, nên không tồn tại trường hợp cái cửa rộng hơn bức tường nó nằm trên. Viết ngược lại
 * (`max(sàn, min(trần, …))`) thì một mảng nhà rất hẹp sẽ nhận cái cửa rộng hơn chính nó, và trên
 * màn hình nó đọc ra là một khối lạ thò ra hai bên chứ không phải một cái cửa.
 *
 * ⚠️ VÀ MẢNG NHÀ QUÁ HẸP THÌ KHÔNG CÓ CỬA, CHỨ KHÔNG PHẢI CÓ CỬA TÍ HON. Bài học "KẸP thì phá thứ
 * tự" của Phase 7D: nếu cứ kẹp thì mọi mảng hẹp đều ra đúng một cỡ cửa và bốn kỷ khai bốn con số
 * sẽ dựng ra một kết quả — cái kẹp nuốt mất cả một trục trong im lặng. Nên ở đây, hẹp dưới ngưỡng
 * thì **không dựng gì cả** (`emitGroundFloor` thoát sớm): một bức tường hông không có cửa là
 * chuyện bình thường ngoài đời, còn một cái cửa 4cm thì không.
 */

/** Cửa hẹp nhất còn đọc ra được là cái cửa — hẹp hơn nữa thì nó chỉ là một vệt tối. */
export const DOOR_MIN_WIDTH = 0.085;
/** Cửa rộng nhất so với bề ngang mảng nhà. Quá mức này thì mặt tiền thành cái cổng. */
export const DOOR_MAX_WIDTH_RATIO = 0.42;
/** Cửa cao nhất so với chiều cao mảng nhà. */
export const DOOR_MAX_HEIGHT_RATIO = 0.72;

/**
 * Khung cửa nhô ra khỏi mặt tường bao xa.
 *
 * ⚠️ PHẢI LỚN HƠN `WINDOW_RELIEF` (0,035) và `SILL_RELIEF` (0,085) của `buildingSpec.js`, và luật
 * đó được khoá bằng test import CẢ HAI bên. Lý do là thứ tự thị giác, không phải thẩm mỹ: cửa ra
 * vào là **cái neo tỉ lệ** — thứ nói cho mắt biết công trình này to cỡ nào. Nếu khung cửa nhô ra
 * ít hơn cái bệ cửa sổ thì cửa chìm xuống dưới cửa sổ trong thứ bậc thị giác, và cái neo ấy mất.
 */
export const DOOR_FRAME_RELIEF = 0.1;
/** Bề dày cánh cửa. Mỏng hơn khung để cánh luôn nằm THỤT so với khung, kể cả khi `recess` = 0. */
export const DOOR_LEAF_RELIEF = 0.045;
/** Chiều sâu tối đa của hốc cửa khi `recess` = 1 (genkan Nhật là ca sâu nhất). */
export const DOOR_RECESS_DEPTH = 0.16;
/** Từ mức `recess` này trở lên mới dựng má cửa hai bên — nông hơn thì má cửa không thấy. */
export const RECESS_REVEAL_MIN = 0.5;

/** Số bậc thềm tối đa. */
export const MAX_STEPS = 3;
/** Chiều cao một bậc, theo TỈ LỆ chiều cao cửa. */
const STEP_HEIGHT_RATIO = 0.085;
/** Mỗi bậc dưới rộng hơn bậc trên bao nhiêu, theo tỉ lệ bề rộng cửa. */
const STEP_SPREAD_RATIO = 0.22;

/**
 * ⚠️ NGÂN SÁCH CHI TIẾT CHO NHÀ DÂN — VÀ NÓ PHẢI THẬT SỰ CẮN.
 *
 * Bài học Phase 8D: *"ngân sách LOD phải thật sự cắn — đặt trần mức thấp bằng đúng khoảng mà mức
 * cao có thể ra thì một nửa số hạt cho hai mức y hệt nhau"*. Ở đây "mức thấp" là nhà dân (30 căn
 * mỗi thành phố, gấp sáu lần số kỳ quan) nên nó mới là chỗ quyết định ngân sách.
 *
 * Ba khoản cắt, mỗi khoản có lý do NGOÀI ĐỜI chứ không phải "cho rẻ":
 *   - cửa hẹp hơn `VERNACULAR_DOOR_SHRINK` lần: cửa nhà là cửa cho MỘT người, cửa đình là cửa cho
 *     một đám rước.
 *   - bậc thềm tối đa 1: nhà mặt phố bước thẳng từ vỉa hè vào; bậc nhiều là dấu hiệu công trình
 *     được nâng lên khỏi mặt đất, tức là công trình quan trọng.
 *   - không có má cửa: hốc sâu là thứ tốn tường, chỉ công trình dày tường mới làm được.
 * `groundFloor.test.js` đo thẳng: cùng một kỷ, nhà dân PHẢI ra ít khối hơn công trình chính.
 */
export const VERNACULAR_DOOR_SHRINK = 0.78;
const VERNACULAR_MAX_STEPS = 1;

function finite(value, fallback) {
  return Number.isFinite(value) ? value : fallback;
}

/**
 * Bảng tầng trệt có dùng được không. Từ chối THẲNG thay vì lặng lẽ rơi về mặc định — xem lý do ở
 * `DOOR_KINDS`.
 */
export function isValidGroundFloor(gf) {
  if (!gf || typeof gf !== 'object') return false;
  if (!DOOR_SET.has(gf.door)) return false;
  if (!FEATURE_SET.has(gf.feature)) return false;
  if (!FEATURE_SET.has(gf.vernacularFeature)) return false;
  if (typeof gf.note !== 'string' || gf.note.length < 8) return false;
  // ⚠️ TỪ BƯỚC 2 KHÔNG CÒN ĐƯỜNG THOÁT NÀO. Bước 1 có một nhánh cho `legacy` được miễn khai số đo;
  // nhánh ấy đã bị xoá cùng với chính giá trị `legacy`. Nay MỌI dòng phải khai đủ, và khai sai thì
  // bị từ chối thẳng chứ không tự chữa — tự chữa là cách một bảng 15 dòng lặng lẽ thoái hoá về 1
  // dòng (bẫy `MIN_STONE` của `streetStyle.js`, Phase 9D).
  if (!FRAME_SET.has(gf.frame)) return false;
  if (!Number.isFinite(gf.doorWidth) || gf.doorWidth <= 0 || gf.doorWidth > DOOR_MAX_WIDTH_RATIO) return false;
  if (!Number.isFinite(gf.doorTall) || gf.doorTall <= 0 || gf.doorTall > 1.4) return false;
  if (!Number.isFinite(gf.recess) || gf.recess < -1 || gf.recess > 1) return false;
  if (!Number.isInteger(gf.steps) || gf.steps < 0 || gf.steps > MAX_STEPS) return false;
  return true;
}

/**
 * Số đo cái cửa, suy từ bảng + kích thước THẬT của mảng nhà.
 * Tách ra khỏi phần dựng khối để `groundFloor.test.js` hỏi thẳng được các quan hệ tỉ lệ mà không
 * phải đi đo lại từ danh sách khối — đo lại là tự viết công thức thứ hai cho cùng một luật.
 */
export function doorMetrics(gf, { w, height, storyHeight, plain = false } = {}) {
  const mass = Math.max(0, finite(w, 0));
  const tall = Math.max(0, finite(height, 0));
  const storey = Math.max(0.2, finite(storyHeight, 0.7));
  const ceiling = mass * DOOR_MAX_WIDTH_RATIO;
  // Mảng nhà hẹp tới mức cái trần của nó còn chưa đạt bề rộng tối thiểu ⇒ chỗ này không có cửa.
  if (ceiling < DOOR_MIN_WIDTH || tall <= 0) return null;

  const wanted = mass * gf.doorWidth * (plain ? VERNACULAR_DOOR_SHRINK : 1);
  const doorW = Math.min(ceiling, Math.max(DOOR_MIN_WIDTH, wanted));

  const steps = Math.min(plain ? VERNACULAR_MAX_STEPS : MAX_STEPS, gf.steps);
  const rawHeight = Math.min(tall * DOOR_MAX_HEIGHT_RATIO, storey * gf.doorTall);
  const stepH = rawHeight * STEP_HEIGHT_RATIO;
  const rise = steps * stepH;
  // Bậc thềm nâng ngưỡng cửa lên, nên phải trừ vào chiều cao còn lại — nếu không thì ở mảng nhà
  // thấp, đỉnh cửa sẽ chọc qua gờ mái.
  const doorH = Math.max(rawHeight * 0.5, Math.min(rawHeight, tall * DOOR_MAX_HEIGHT_RATIO - rise));

  return { doorW, doorH, steps, stepH, rise };
}

/**
 * Dựng tầng trệt cho MỘT mảng nhà.
 *
 * @param {Array}  out    danh sách khối, ghi thêm vào
 * @param {object} ctx
 * @param {object} ctx.gf         một dòng `groundFloor` của `eraStyle.js`
 * @param {string} ctx.bpId       hạt giống — mọi biến thể suy từ đây, không có `Math.random`
 * @param {number} ctx.index      thứ tự mảng nhà trong công trình (hạt giống phụ)
 * @param {number} ctx.x,z,base   gốc mảng nhà
 * @param {number} ctx.w,d,height kích thước mảng nhà (ĐÃ nhân `spread` của kỷ)
 * @param {number} ctx.ry         độ nghiêng "tay làm" của thân nhà — cửa PHẢI nghiêng theo
 * @param {number} ctx.storyHeight  chiều cao một tầng của kỷ
 * @param {boolean} ctx.plain     true = nhà dân
 * @param {boolean} ctx.symmetric true = kỳ quan: cửa nằm chính giữa, tuyệt đối không lệch
 * @returns {boolean} có dựng được cửa không (false = mảng nhà quá hẹp)
 */
export function emitGroundFloor(out, ctx) {
  const { gf } = ctx;
  if (!isValidGroundFloor(gf)) return false;

  const { bpId = 'bp', index = 0, x = 0, z = 0, base = 0, w = 1, d = 1, height = 1, ry = 0,
    storyHeight = 0.7, plain = false, symmetric = false } = ctx;

  const m = doorMetrics(gf, { w, height, storyHeight, plain });
  if (!m) return false;

  const seed = (k) => unit(`${bpId}|gf${index}|${k}`);
  const face = z + d / 2;
  // ⚠️ Cửa lệch tâm ở nhà thường, CHÍNH GIỮA ở kỳ quan. Một dãy phố mà mọi cửa đều đúng giữa mặt
  // tiền thì đọc ra là dãy đồ chơi; còn kỳ quan lệch cửa thì cả thành phố mất điểm tựa thị giác
  // (đúng luật `archetype.symmetric` đã đặt cho thân nhà).
  const room = Math.max(0, (w - m.doorW) / 2 - DOOR_FRAME_RELIEF);
  const dx = symmetric ? 0 : (seed('shift') - 0.5) * room * 0.9;
  const cx = x + dx;

  emitSteps(out, { ...ctx, cx, face, m, ry });
  const sill = base + m.rise;
  emitDoorway(out, { ...ctx, cx, face, m, sill, ry, seed });

  const feature = plain ? gf.vernacularFeature : gf.feature;
  emitFeature(out, feature, { ...ctx, cx, face, m, sill, ry, seed });
  return true;
}

/** Bậc thềm / ngưỡng cửa — mỗi bậc dưới rộng hơn bậc trên, nên nó đọc ra là bậc chứ là một cái bệ. */
function emitSteps(out, { cx, face, base, m, ry }) {
  for (let i = 0; i < m.steps; i += 1) {
    const grow = (m.steps - i) * STEP_SPREAD_RATIO;
    out.push(prism({
      x: cx, z: face + DOOR_FRAME_RELIEF * 0.5, y: base + i * m.stepH,
      w: m.doorW * (1 + grow), d: DOOR_FRAME_RELIEF * (1 + grow * 0.6),
      h: m.stepH, sides: 4, ry, role: 'stone',
    }));
  }
}

/** Hốc cửa + má cửa + khung + cánh. */
function emitDoorway(out, ctx) {
  const { gf, cx, face, sill, m, ry, plain } = ctx;
  const inset = Math.max(0, gf.recess) * DOOR_RECESS_DEPTH;

  // Khối cổng nhô ra: `recess` âm nghĩa là lối vào ĐẨY RA khỏi mặt tường thay vì thụt vào.
  if (gf.recess < 0) {
    out.push(prism({
      x: cx, z: face + DOOR_RECESS_DEPTH * -gf.recess * 0.5, y: sill,
      w: m.doorW * 1.5, d: DOOR_RECESS_DEPTH * -gf.recess,
      h: m.doorH * 1.08, sides: 4, ry, role: 'wall2',
    }));
  }

  // Lòng cửa: mảng tối nằm LÙI vào so với mặt tường. Đây là thứ tạo ra chiều sâu — cái khung ở
  // dưới chỉ viền quanh nó.
  out.push(prism({
    x: cx, z: face - inset, y: sill,
    w: m.doorW, d: DOOR_LEAF_RELIEF, h: m.doorH, sides: 4, ry, role: 'dark',
  }));

  // Má cửa: hai mảng tường hai bên hốc. Chỉ có ở hốc sâu, và chỉ ở công trình chính — xem
  // `VERNACULAR_DOOR_SHRINK` để biết vì sao nhà dân không có.
  if (!plain && gf.recess >= RECESS_REVEAL_MIN) {
    for (const s of [-1, 1]) {
      out.push(prism({
        x: cx + s * (m.doorW / 2), z: face - inset / 2, y: sill,
        w: DOOR_LEAF_RELIEF, d: inset, h: m.doorH, sides: 4, ry, role: 'wall2',
      }));
    }
  }

  // Khung: hai trụ đứng + lanh tô, nhô ra xa hơn mọi chi tiết cửa sổ (xem `DOOR_FRAME_RELIEF`).
  if (gf.frame !== 'none') {
    const jamb = Math.max(0.02, m.doorW * 0.16);
    for (const s of [-1, 1]) {
      out.push(prism({
        x: cx + s * (m.doorW / 2 + jamb / 2), z: face, y: sill,
        w: jamb, d: DOOR_FRAME_RELIEF, h: m.doorH + jamb, sides: 4, ry, role: gf.frame,
      }));
    }
    out.push(prism({
      x: cx, z: face, y: sill + m.doorH,
      w: m.doorW + jamb * 2, d: DOOR_FRAME_RELIEF, h: jamb, sides: 4, ry, role: gf.frame,
    }));
  }

  emitLeaf(out, ctx);
}

/** Cánh cửa — chỗ DUY NHẤT ba kiểu cửa khác nhau về hình học, không phải về màu. */
function emitLeaf(out, { gf, cx, face, sill, m, ry, plain, symmetric, seed }) {
  const z = face - Math.max(0, gf.recess) * DOOR_RECESS_DEPTH + DOOR_LEAF_RELIEF * 0.4;

  switch (gf.door) {
    case 'flap': {
      // Tấm mềm treo trên lanh tô: da thú căng, chiếu sậy, rèm cỏ bện. KHÔNG có bản lề — thời này
      // chưa có bản lề — nên nó không phải một cánh cứng mà là một tấm RỦ XUỐNG, và thứ mắt đọc ra
      // là các NẾP GẤP dọc cùng cái mép dưới không thẳng.
      //
      // ⚠️ SỐ NẾP VÀ ĐỘ VÉN ĐỀU THEO HẠT GIỐNG. Một khu lều mà tấm nào cũng vén đúng một kiểu thì
      // đọc ra là hàng công nghiệp — mà cả điểm của kỷ 1–2 là chúng KHÔNG phải hàng công nghiệp.
      // ⚠️ NHÀ DÂN ÍT NẾP HƠN, và đây là chuyện thật chứ không phải một khoản cắt cho rẻ: tấm che
      // cửa một túp lều là một hai mảnh da khâu lại, còn tấm của gian lớn là bộ da lớn xếp nếp —
      // ở thời chưa dệt được vải khổ rộng thì SỐ MẢNH chính là thước đo của cải.
      const folds = plain ? 2 + Math.floor(seed('folds') * 2) : 3 + Math.floor(seed('folds') * 3);
      const gap = m.doorW * 0.02;
      const fw = (m.doorW - gap * (folds - 1)) / folds;
      if (fw <= 0) break;
      // Tấm bị vén lên một góc: mép dưới của mỗi nếp cao thấp khác nhau, và cả tấm hở ra ở chân.
      const lift = 0.1 + seed('lift') * 0.22;
      for (let i = 0; i < folds; i += 1) {
        const t = (i + 0.5) / folds - 0.5;
        // Nếp giữa rủ dài nhất, nếp mép bị vén cao hơn — đó là hình một tấm mềm bị vén sang bên.
        const edge = Math.abs(t) * 2;
        const drop = m.doorH * (1 - lift * edge);
        out.push(prism({
          x: cx + t * m.doorW, z: z + (i % 2) * DOOR_LEAF_RELIEF * 0.3,
          y: sill + m.doorH - drop,
          w: fw, d: DOOR_LEAF_RELIEF * 0.7, h: drop, sides: 4, ry, role: 'wood',
        }));
      }
      break;
    }
    case 'panel': {
      // Cửa bức bàn: các tấm ván ĐỨNG ghép trong khung, tháo rời được từng tấm.
      // ⚠️ SỐ TẤM THEO HẠT GIỐNG, không viết cứng. Bài học Phase 8D: viết cứng thì "40 hạt chỉ ra
      // 2–4 dáng", và lỗi ấy cắn BỐN lần trong `flora.js` trước khi có ai đo.
      const panels = plain ? 2 + Math.floor(seed('panels') * 2) : 3 + Math.floor(seed('panels') * 3);
      const gap = m.doorW * 0.035;
      const pw = (m.doorW - gap * (panels + 1)) / panels;
      if (pw <= 0) break;
      for (let i = 0; i < panels; i += 1) {
        const t = (i + 0.5) / panels - 0.5;
        out.push(prism({
          x: cx + t * m.doorW, z, y: sill + m.doorH * 0.05,
          w: pw, d: DOOR_LEAF_RELIEF, h: m.doorH * 0.9, sides: 4, ry, role: 'wood',
        }));
      }
      break;
    }
    case 'double': {
      // Hai cánh cao + trụ giữa. Trụ giữa là thứ mắt đọc ra "hai cánh" ở cỡ hiển thị thật —
      // thiếu nó thì hai cánh sát nhau chỉ còn là một tấm.
      const leaf = m.doorW * 0.46;
      for (const s of [-1, 1]) {
        out.push(prism({
          x: cx + s * (m.doorW * 0.24), z, y: sill,
          w: leaf, d: DOOR_LEAF_RELIEF, h: m.doorH * 0.97, sides: 4, ry, role: 'wood',
        }));
      }
      out.push(prism({
        x: cx, z: z + DOOR_LEAF_RELIEF * 0.5, y: sill,
        w: m.doorW * 0.06, d: DOOR_LEAF_RELIEF, h: m.doorH, sides: 4, ry, role: gf.frame === 'none' ? 'wood' : gf.frame,
      }));
      break;
    }
    case 'sliding': {
      // Cửa lùa: các tấm TRƯỢT CHỒNG MÉP, nên chúng nằm ở hai ĐỘ SÂU (hai đường ray) khác nhau và
      // tấm ngoài che một phần tấm trong. Đó chính là dấu hiệu phân biệt cửa lùa với cửa hai cánh
      // — không phải bề rộng, mà là chuyện chúng không nằm cùng một mặt phẳng.
      //
      // ⚠️ SỐ TẤM PHỤ THUỘC `symmetric`, VÀ ĐÂY KHÔNG PHẢI MỘT MẸO ĐỂ QUA BÀI TEST ĐỐI XỨNG — nó
      // là sự thật về cái cửa lùa. HAI tấm thì bắt buộc lệch (tấm này trước tấm kia), nên một cửa
      // hai tấm không thể cân trái–phải; muốn cân thì phải BỐN tấm, hai đường ray, mỗi ray một cặp
      // mở ra hai bên — và đó đúng là cách cửa chính của chùa/công trình lớn Nhật được làm, vì lối
      // vào nghi lễ phải mở ĐƯỢC HẾT chứ không chỉ mở một nửa. Nhà thường chỉ đủ chỗ cho hai tấm.
      // (Bài "kỳ quan đối xứng tuyệt đối" của `buildingSpec.test.js` đã bắt đúng ca này ngay lần
      // chạy đầu — một bài test canh mỹ thuật lại chỉ ra một sự thật kiến trúc.)
      const pairs = symmetric ? 2 : 1;
      const leaf = m.doorW * (symmetric ? 0.32 : 0.58);
      const lead = seed('lead') > 0.5 ? 1 : -1;
      for (let rail = 0; rail < 2; rail += 1) {
        for (let k = 0; k < pairs; k += 1) {
          // Cửa cân: mỗi ray một CẶP đối xứng qua tâm. Cửa lệch: mỗi ray đúng một tấm, tấm nào
          // nằm ngoài thì do hạt giống quyết định.
          const s = symmetric ? (k === 0 ? 1 : -1) * (rail === 0 ? 1 : -1) : (rail === 0 ? lead : -lead);
          out.push(prism({
            x: cx + s * (m.doorW * (symmetric ? 0.17 : 0.21)),
            z: z + rail * DOOR_LEAF_RELIEF * 0.9, y: sill,
            w: leaf, d: DOOR_LEAF_RELIEF * 0.8, h: m.doorH * 0.96, sides: 4, ry, role: 'wood',
          }));
        }
      }
      break;
    }
    case 'glazed': {
      // Sảnh kính: KHÔNG phải một cánh cửa mà là một MẶT TIỀN TRONG SUỐT. Ba kiểu cửa cổ đều rộng
      // bằng lối đi; cái này rộng gấp mấy lần, và thứ mắt đọc ra không phải cánh mà là các ĐỐ
      // KHUNG chia ô kính — cùng nhịp chia với `windows: 'curtain'`/`'grid'` của các kỷ này.
      //
      // ⚠️ DÙNG VAI `glass` — vai này BAN ĐÊM TỰ PHÁT SÁNG (xem `parts.js`), và đó chính là điều
      // đúng: một sảnh kính tối om lúc 22h là một sảnh chưa xây xong. Đây cũng là lý do KHÔNG dựng
      // nó bằng vai `dark` như lòng cửa của bốn kiểu kia.
      const bays = 2 + Math.floor(seed('bays') * 3);
      const mullion = Math.max(0.012, m.doorW * 0.045);
      out.push(prism({
        x: cx, z, y: sill,
        w: m.doorW * 0.98, d: DOOR_LEAF_RELIEF * 0.6, h: m.doorH * 0.98,
        sides: 4, ry, role: 'glass',
      }));
      // Đố đứng chia ô. `bays` ô ⇒ `bays - 1` đố ở giữa.
      for (let i = 1; i < bays; i += 1) {
        const t = i / bays - 0.5;
        out.push(prism({
          x: cx + t * m.doorW, z: z + DOOR_LEAF_RELIEF * 0.35, y: sill,
          w: mullion, d: DOOR_LEAF_RELIEF * 0.7, h: m.doorH * 0.98,
          sides: 4, ry, role: gf.frame === 'none' ? 'trim' : gf.frame,
        }));
      }
      // Đố ngang ở tầm tay — cái vạch này là thứ nói cho mắt biết đây là cửa cho NGƯỜI đi vào chứ
      // không phải một ô kính suốt trần, và nó đặt theo tỉ lệ chiều cao cửa nên đúng ở mọi cỡ nhà.
      out.push(prism({
        x: cx, z: z + DOOR_LEAF_RELIEF * 0.35, y: sill + m.doorH * 0.62,
        w: m.doorW * 0.98, d: DOOR_LEAF_RELIEF * 0.7, h: mullion,
        sides: 4, ry, role: gf.frame === 'none' ? 'trim' : gf.frame,
      }));
      break;
    }
    default:
      break;
  }
}

/** MỘT đặc trưng mặt phố. Xem `GROUND_FEATURES` — mỗi kỷ chọn đúng một. */
function emitFeature(out, name, ctx) {
  const { cx, face, x, base, w, d, height, m, sill, ry, storyHeight, plain, symmetric, seed } = ctx;
  const storey = Math.max(0.2, storyHeight);

  switch (name) {
    case 'porch': {
      // Hàng hiên cột gỗ: mái thấp đua ra trước, chống trên một hàng cột. Đặc trưng của đình làng
      // — và nó phải chạy hết mặt tiền, không chỉ che cái cửa, nếu không nó là mái hiên (`awning`).
      const depth = Math.min(d * 0.42, w * 0.3);
      const postH = Math.min(height * 0.62, storey * 1.02);
      const posts = 3 + Math.floor(seed('posts') * 3);
      const postW = Math.max(0.028, w * 0.045);
      for (let i = 0; i < posts; i += 1) {
        const t = posts === 1 ? 0 : i / (posts - 1) - 0.5;
        out.push(prism({
          x: x + t * w * 0.88, z: face + depth, y: base,
          w: postW, h: postH, sides: 6 + (i % 2) * 2, taper: 0.88, ry, role: 'wood',
        }));
      }
      // Mái hiên đua: dùng `gable` để có đúng cái dốc đổ nước ra ngoài — một tấm phẳng đọc ra là
      // ban công chứ không phải mái.
      out.push(gable({
        x, z: face + depth / 2, y: postH,
        w: w * 1.02, d: depth * 2.1, h: Math.max(0.05, depth * 0.42), ry, role: 'roof',
      }));
      // Xà ngang gác đầu cột — thiếu nó thì mái trông như lơ lửng trên mấy que tăm.
      out.push(prism({
        x, z: face + depth, y: postH - postW * 0.9,
        w: w * 0.92, d: postW * 1.1, h: postW * 0.9, sides: 4, ry, role: 'wood',
      }));
      break;
    }
    case 'awning': {
      // Mái hiên / mành che: bám thẳng vào lanh tô, KHÔNG có cột. Đây là vế "nhà thường" của
      // `porch` — nhà ống phố cổ chỉ có mái đua thấp che mặt hàng, không đủ đất làm hiên cột.
      const reach = Math.min(d * 0.26, m.doorW * 0.9);
      const top = sill + m.doorH + Math.max(0.02, m.doorW * 0.16);
      const span = Math.min(w * 0.96, m.doorW * 2.4);
      out.push(prism({
        x: cx, z: face + reach / 2, y: top,
        w: span, d: reach, h: Math.max(0.022, reach * 0.2), sides: 4, ry, role: 'roof',
      }));
      // Diềm rủ xuống ở mép ngoài — thứ làm cái tấm che đọc ra là VẢI/mành chứ không phải bê tông.
      out.push(prism({
        x: cx, z: face + reach, y: top - reach * 0.42,
        w: span, d: Math.max(0.014, reach * 0.16), h: reach * 0.42, sides: 4, ry, role: 'roof',
      }));
      break;
    }
    case 'balcony': {
      // Ban công tầng hai: sàn đua ra + lan can.
      //
      // ⚠️ HAI CỠ, VÀ SỰ KHÁC NHAU LÀ LỊCH SỬ CHỨ KHÔNG PHẢI LOD BỊA RA. Ban công của công trình
      // chính là **ban công quy chế**: luật quy hoạch Haussmann bắt buộc nó chạy LIỀN hết mặt tiền
      // tầng hai, có sàn đá gác trên congxon chạm. Ban công của nhà dân là thứ khác hẳn — varanda
      // sắt hẹp của nhà Pombalino Lisboa, và **cầu thang thoát hiểm** của nhà cho thuê New York
      // (thứ luật Tenement House Act bắt phải có, nên nó phủ kín mặt tiền khu lao động). Cả hai
      // đều là một chiếu sắt rộng bằng MỘT ô cửa sổ, treo trên giá sắt mảnh — không phải một dải
      // đá chạy suốt nhà.
      // ⇒ Bản `plain` hẹp hơn, ít con tiện hơn, và KHÔNG có congxon đá. Nó rẻ hơn thật, nhưng cái
      // rẻ ấy là hệ quả của việc dựng đúng thứ ngoài đời, không phải mục tiêu.
      const span = plain ? Math.min(w * 0.46, m.doorW * 1.7) : w * 0.94;
      const y = base + Math.min(height * 0.62, storey * 1.05);
      const reach = Math.min(d * 0.2, w * (plain ? 0.1 : 0.14));
      const railH = Math.max(0.05, storey * (plain ? 0.16 : 0.2));
      const bx = plain ? cx : x;
      out.push(prism({
        x: bx, z: face + reach / 2, y,
        w: span, d: reach, h: Math.max(0.02, reach * 0.28), sides: 4, ry, role: 'trim',
      }));
      // Lan can: một dải mảnh + các con tiện đứng. Số con tiện theo hạt giống.
      const balusters = plain ? 3 + Math.floor(seed('bal') * 2) : 5 + Math.floor(seed('bal') * 4);
      for (let i = 0; i < balusters; i += 1) {
        const t = i / (balusters - 1) - 0.5;
        out.push(prism({
          x: bx + t * span * 0.96, z: face + reach, y: y + reach * 0.28,
          w: Math.max(0.012, w * 0.016), d: Math.max(0.012, w * 0.016),
          h: railH, sides: 4, ry, role: 'trim',
        }));
      }
      out.push(prism({
        x: bx, z: face + reach, y: y + reach * 0.28 + railH,
        w: span, d: Math.max(0.016, reach * 0.24), h: Math.max(0.016, railH * 0.18),
        sides: 4, ry, role: 'trim',
      }));
      // Congxon đá đỡ sàn — CHỈ ở công trình chính: một dải đá chạy suốt mặt tiền mà không có gì
      // đỡ thì đọc ra là tấm dán. Chiếu sắt hẹp thì treo trên giá sắt, không cần congxon.
      if (!plain) {
        for (const s of [-1, 1]) {
          out.push(prism({
            x: x + s * w * 0.36, z: face + reach * 0.45, y: y - railH * 0.42,
            w: Math.max(0.02, w * 0.035), d: reach * 0.8, h: railH * 0.42,
            sides: 4, taper: 0.4, ry, role: 'stone',
          }));
        }
      }
      break;
    }
    case 'shutters': {
      // Cửa chớp: hai cánh gỗ kẹp hai bên, mở ra áp vào tường. Chiều rộng mỗi cánh bằng NỬA ô cửa
      // — vì khi đóng lại chúng phải che kín ô ấy. Đó là ràng buộc thật của cái cửa chớp, và nó
      // giữ cho tỉ lệ đúng ở mọi cỡ nhà mà không cần một con số riêng.
      const leaf = m.doorW * 0.5;
      const jamb = Math.max(0.02, m.doorW * 0.16);
      for (const s of [-1, 1]) {
        out.push(prism({
          x: cx + s * (m.doorW / 2 + jamb + leaf / 2), z: face + DOOR_FRAME_RELIEF * 0.35,
          y: sill, w: leaf, d: DOOR_LEAF_RELIEF * 0.9, h: m.doorH * 0.94,
          sides: 4, ry, role: 'wood',
        }));
      }
      break;
    }
    case 'sign': {
      // Biển hiệu khối: tấm ĐỨNG bám mặt tiền cạnh cửa — biển dọc là thứ đọc ra "phố Nhật" ngay
      // cả ở cỡ vài chục điểm ảnh, vì nó phá thế nằm ngang của mọi thứ còn lại trên mặt tiền.
      // ⚠️ CÔNG TRÌNH CÂN THÌ BIỂN NẰM CHÍNH GIỮA, TRÊN ĐẦU CỬA — và đây cũng là sự thật chứ
      // không phải chiều theo bài test đối xứng: biển của công trình lớn là tấm ĐỀ TÊN treo đúng
      // trên lối vào (biển hoành phi/扁額, và cả cách toà nhà hiện đại gắn tên mình). Biển treo
      // LỆCH sang một bên là biển của cửa hàng — nó phải chìa ra để người đi trên phố nhìn thấy
      // trước khi tới cửa. Hai chỗ đứng khác nhau vì hai mục đích khác nhau.
      const bw = Math.max(0.045, m.doorW * 0.34);
      const bh = Math.min(height * 0.5, m.doorH * 1.5);
      const side = symmetric ? 0 : (seed('signside') > 0.5 ? 1 : -1);
      const bx = cx + side * (m.doorW * 0.5 + bw * 0.9);
      const by = symmetric ? sill + m.doorH + bh * 0.12 : sill + m.doorH * 0.18;
      out.push(prism({
        x: bx, z: face + DOOR_FRAME_RELIEF * 0.8,
        y: by, w: bw, d: Math.max(0.02, bw * 0.28), h: bh,
        sides: 4, ry, role: 'wood',
      }));
      // Giá đỡ trên cùng — biển treo mà không có gì bám thì trông như dán.
      out.push(prism({
        x: bx, z: face + DOOR_FRAME_RELIEF * 0.4,
        y: by + bh, w: bw * 1.15, d: Math.max(0.016, bw * 0.5),
        h: Math.max(0.016, bw * 0.22), sides: 4, ry, role: 'trim',
      }));
      break;
    }
    case 'arcade': {
      // Hàng vòm cuốn: lối đi có mái nằm TRONG lòng công trình, không đua ra ngoài như `porch`.
      // Loggia Firenze · Praça do Comércio Lisboa · five-foot way Singapore — cả ba đều là lối đi
      // công cộng luồn dưới thân nhà, và thứ mắt đọc ra là **nhịp lặp cột–vòm–cột** cùng cái bóng
      // sâu bên trong.
      //
      // Dựng bằng ba thành phần, mỗi thành phần một việc:
      //   1. lòng arcade — mảng tối lùi vào, chính là cái bóng
      //   2. các trụ đứng trên ranh giới mặt tiền cũ
      //   3. thanh cuốn nối đầu trụ (một khối bẹt trên mỗi nhịp) + dầm ngang gác lên tất cả
      // ⚠️ SỐ NHỊP THEO HẠT GIỐNG, và nó phải là một SỐ ĐẾM chứ không phải bề rộng cố định: một
      // dãy phố mà nhà nào cũng đúng 4 vòm đọc ra là hàng in, còn nhà nào cũng vòm rộng 0,3 thì
      // nhà to sẽ có 12 vòm và nhà nhỏ có 1 (đúng bẫy số tuyệt đối, Phase 7C).
      const depth = Math.min(d * 0.3, w * 0.22);
      const openH = Math.min(height * 0.58, storey * 0.98);
      // ⚠️ NHÀ DÂN ÍT NHỊP HƠN — cũng là sự thật, không phải khoản cắt. Praça do Comércio và loggia
      // Firenze là hàng vòm hàng chục nhịp chạy suốt một quảng trường; còn một căn nhà phố
      // Singapore rộng đúng vài mét thì five-foot way của nó chỉ có MỘT hoặc HAI nhịp. Bề rộng nhà
      // quyết định số nhịp, và nhà dân thì hẹp.
      const bays = plain ? 1 + Math.floor(seed('bays') * 2) : 3 + Math.floor(seed('bays') * 3);
      const pierW = Math.max(0.03, w * 0.06);
      // 1. lòng arcade
      out.push(prism({
        x, z: face - depth / 2, y: base,
        w: w * 0.94, d: depth, h: openH, sides: 4, ry, role: 'dark',
      }));
      // 2 + 3. trụ và thanh cuốn
      const span = (w * 0.94) / bays;
      for (let i = 0; i <= bays; i += 1) {
        const t = i / bays - 0.5;
        out.push(prism({
          x: x + t * w * 0.94, z: face, y: base,
          w: pierW, d: depth * 0.55, h: openH, sides: 4, ry, role: 'stone',
        }));
      }
      for (let i = 0; i < bays; i += 1) {
        const t = (i + 0.5) / bays - 0.5;
        // Thanh cuốn: khối bẹt hẹp hơn nhịp, đặt ngay dưới dầm. Ở cỡ hiển thị thật nó đọc ra là
        // đỉnh vòm — dựng cả cung tròn là tiêu tam giác cho thứ chưa tới hai điểm ảnh.
        out.push(prism({
          x: x + t * w * 0.94, z: face, y: base + openH - pierW * 0.9,
          w: span * 0.62, d: depth * 0.55, h: pierW * 0.9, sides: 4, ry, role: 'stone',
        }));
      }
      // Dầm ngang gác lên toàn bộ hàng trụ — thứ nói cho mắt biết tường phía trên ĐỨNG TRÊN arcade
      // chứ không lơ lửng.
      out.push(prism({
        x, z: face - depth * 0.2, y: base + openH,
        w: w * 0.98, d: depth * 0.9, h: Math.max(0.03, pierW * 0.8), sides: 4, ry, role: 'stone',
      }));
      break;
    }
    default:
      break;
  }
}
