/**
 * roadPath.js — TIM ĐƯỜNG: con đường chạy Ở ĐÂU trong ô của nó, và rộng hẹp thế nào dọc đường.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * Lớp HÌNH của bộ ba `networkStyle.js` (BẢNG) → file này (HÌNH) → `terrainMesh.js` + `residents.js`
 * (NGƯỜI ĐỌC). Xem đầu `networkStyle.js` để biết vì sao bộ ba này ra đời.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ LUẬT SỐNG CÒN CỦA CẢ FILE: ĐỘ LỆCH LÀ THUỘC TÍNH CỦA **RANH GIỚI**, KHÔNG PHẢI CỦA **Ô**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đây là điều duy nhất trong file này mà nếu làm sai thì mọi thứ khác vô nghĩa, nên nó nằm ngay đầu.
 *
 * Nếu mỗi ô tự tính lấy độ lệch tim đường của mình, thì hai ô kề nhau sẽ tính ra hai con số khác
 * nhau tại chỗ giáp ⇒ con đường bị **GÃY MỘT BẬC** ở mọi ranh giới ô. Đó đúng khuyết tật mà Phase
 * 12 đã mất cả một phase để chữa cho BỀ RỘNG (`TECH_DEBT #31`: 45% số mép đường có một bậc vuông
 * góc, bậc lớn nhất 0,380 ô), và bài học rút ra khi ấy được ghi nguyên văn trong `CLAUDE.md`:
 *
 *   > *"thứ xoá bậc là tính ĐỐI XỨNG của phép `min`, không phải giá trị nào cả — hai ô kề nhau
 *   > cùng suy ra một con số từ CÙNG một biểu thức thì không có cách nào lệch. Một cái bậc chỉ
 *   > sinh ra khi mỗi bên tự tính bề rộng của mình một cách ĐỘC LẬP."*
 *
 * ⇒ `boundaryBend` nhận **toạ độ của RANH GIỚI**, không nhận toạ độ của ô. Ô (x,y) và ô (x+1,y)
 * cùng hỏi `boundaryBend(era, 'u', x+1, y)` cho chỗ giáp của chúng, nên chúng **không thể** lệch
 * nhau — không phải "rất khó lệch", mà là **không có cách nào lệch**, giống hệt phép `min`.
 *
 * Độ lệch tại TÂM ô thì suy ra bằng trung bình hai ranh giới của chính ô ấy (`cellBend`), nên tim
 * đường là một đường gấp khúc LIÊN TỤC: ranh giới → tâm ô → ranh giới → tâm ô kế tiếp.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO TRẢ VỀ SỐ CHUẨN HOÁ [−1, 1], VÀ VÌ SAO BIÊN ĐỘ LÀ CỦA **HẠNG ĐƯỜNG** CHỨ KHÔNG PHẢI
 * CỦA CẢ KỶ — MỘT LỜI TỰ TRẤN AN ĐÃ BỊ CHÍNH SỐ ĐO BÁC BỎ NGAY TRONG PHIÊN VIẾT RA NÓ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Chỗ trống để lượn = `0,5 − nửa bề rộng − vỉa hè`, và nó KHÁC NHAU giữa đại lộ với ngõ. Nếu file
 * này trả về số ô luôn thì nó phải biết bề rộng, tức phải biết ô ấy hạng gì — và lúc đó hai ô khác
 * hạng nằm cạnh nhau lại lệch nhau tại chỗ giáp, dựng lại đúng cái bậc vừa gỡ.
 *
 * ⇒ File này chỉ trả lời *"lệch bao nhiêu PHẦN của chỗ cho phép"*; biên độ thật do bên gọi nhân vào.
 *
 * ⚠️ BẢN ĐẦU CỦA CHÍNH FILE NÀY LẤY **MỘT** BIÊN ĐỘ CHO CẢ KỶ (`min` chỗ trống trên mọi hạng), kèm
 * một đoạn chú thích dài giải thích rằng đó là "một đánh đổi CÓ CHỦ ĐÍCH: mua sự đối xứng tuyệt đối
 * bằng một chút biên độ ở những ô hẹp". Nghe rất xuôi. Đo thì nó sai, và sai to:
 *
 *   | kỷ | chỗ trống ĐẠI LỘ | chỗ trống NGÕ | biên độ `min` cho ra | đáng lẽ phải là |
 *   |---|---:|---:|---:|---:|
 *   | 13 Edo (`bend` 0,82 — lượn nhất bảng) | 0,02 | **0,19** | **0,000** | 0,139 |
 *   | 8 Alfama (0,66) | 0,00 | 0,20 | **0,000** | 0,119 |
 *   | 7 Firenze (0,46) | 0,03 | 0,23 | 0,005 | 0,097 |
 *
 * **7 trong 15 kỷ ra biên độ đúng bằng 0**, trong đó có đúng những kỷ mà cả bảng sinh ra để làm cho
 * lượn. Cái "chút biên độ" tôi viết trong chú thích thật ra là TOÀN BỘ biên độ. Nguyên nhân: ở kỷ
 * hiện đại, lòng đường CỘNG vỉa hè đã lấp gần trọn ô, nên đại lộ có quyền phủ quyết cả kỷ.
 *
 * ⇒ Vá đúng: **mỗi HẠNG một biên độ**, và tại một ranh giới thì lấy `min` của hai hạng gặp nhau ở
 * đó. `min` là một phép ĐỐI XỨNG, nên đối xứng vẫn được giữ nguyên vẹn — đây đúng là cách
 * `carriagewayShape` đã xoá bậc bề rộng ở Phase 12, áp lại cho độ lệch. Không mất gì, được lại 7 kỷ.
 *
 * ⚠️ VÀ HỆ QUẢ CỦA NÓ LÀ MỘT SỰ THẬT VỀ ĐÔ THỊ, KHÔNG PHẢI MỘT KHUYẾT TẬT: đại lộ hiện đại (lòng
 * đường + vỉa hè lấp gần trọn hành lang) **thẳng**, còn ngõ thì lượn. Ngoài đời đúng thế — trục
 * chính của một phố cổ bao giờ cũng thẳng hơn mấy con ngõ chạy sau lưng nó.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÀ MỘT ĐIỀU KHÔNG ĐƯỢC QUÊN: HÌNH HỌC TỰ ÉP ĐÚNG LỊCH SỬ
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Vì `rankBendScale` suy từ chỗ trống thật, kỷ nào đường rộng gần trọn ô thì **tự động** thẳng, không
 * cần bảng ép. Lối mòn Göbekli Tepe (0,46 ô) còn 0,27 ô để lượn; đại lộ Xô Viết (0,96 ô) còn 0,02.
 * Đó là lý do bảng `networkStyle.js` chỉ khai TỈ LỆ chứ không khai số ô.
 */

import { buildRoadPlan } from '../roadPlan.js';
import { getNetworkStyle } from './networkStyle.js';
import {
  SIDE_STEPS, carriagewayShape, getStreetStyle, rankOfRoad, streetCrossSection,
} from './streetStyle.js';

/** Hai trục của mạng đường. `u` = đường chạy theo x (lệch theo y); `v` = chạy theo y (lệch theo x). */
export const ROAD_AXES = ['u', 'v'];

/**
 * Biên độ lượn LỚN NHẤT của một kỷ, tính bằng PHẦN CỦA MỘT Ô.
 *
 * ⚠️ SUY TỪ CON ĐƯỜNG CHẬT NHẤT CỦA KỶ, KHÔNG PHẢI MỘT HẰNG SỐ CHỌN TAY. Đây là chỗ "hình học ép
 * đúng lịch sử" thành mã: chỗ trống của một hạng đường là `0,5 − nửa bề rộng − vỉa hè`, và ta lấy
 * `min` trên mọi hạng để bảo đảm KHÔNG hạng nào bị đẩy lòi ra khỏi ô của nó.
 *
 * ⚠️ TRỪ THÊM MỘT KHE AN TOÀN (`EDGE_KEEP`). Không có nó thì ở biên độ tối đa, mép lòng đường chạm
 * ĐÚNG ranh giới ô — và lúc ấy vỉa hè bên ngoài bị ép về bề rộng 0, tức một trục bản sắc bị nuốt
 * trong im lặng. Đúng cái bẫy `avenue: 1.00` mà `MAX_AVENUE` đã nhốt một lần ở Phase 12: con số
 * và câu `note` giải thích nó cùng bị vứt đi mà không có gì đỏ lên.
 */
export const EDGE_KEEP = 0.02;

export function rankBendScale(era, rank) {
  const cross = streetCrossSection(getStreetStyle(era), rank);
  /**
   * ⚠️ **KHÔNG NHÂN THÊM `style.bend` Ở ĐÂY NỮA — ĐÓ SẼ LÀ ĐẾM HAI LẦN.**
   *
   * Trước ADR-059, độ lệch tim đường sinh ra bằng nhiễu băm, nên nó cần một hệ số nói *"kỷ này
   * lượn nhiều hay ít"*. Nay độ lệch đến THẲNG từ cung cong đã dựng ra mạng đường
   * (`arcTrace.crossings`), mà độ vồng của cung ấy vốn đã tính theo `bend` rồi. Nhân lần nữa ở
   * đây thì kỷ nào cong sẽ bị bóp lại đúng bình phương hệ số của chính nó — một cái kẹp âm thầm,
   * đúng họ `MIN_STONE` (Phase 9D).
   *
   * ⇒ Hàm này nay trả lời ĐÚNG MỘT câu: *"hạng đường này còn bao nhiêu chỗ để xê dịch ngang mà
   * không lòi ra khỏi ô?"* — thuần hình học, không mang ý đồ mỹ thuật nào.
   */
  const usable = Math.max(0, 0.5 - cross.half - cross.walk - EDGE_KEEP);
  return usable;
}

/**
 * ⚠️ TÊN CŨ, GIỮ LẠI LÀM CẦU NỐI CHO MÃ CHỈ CẦN BIẾT "CÓ PHẢI NGÕ KHÔNG".
 * Từ 2026-08-24 hạng đường là BA giá trị (`rankOfRoad`), không còn là một boolean — hàm này chỉ
 * còn đúng khi ô ấy KHÔNG phải vành đai, nên đừng dùng nó để quyết bề rộng.
 */
export function isLaneVariant(variant) {
  return variant === 1 || variant === 2;
}

/**
 * ⚠️ MỘT SỐ NGUYÊN CHIA CHO BƯỚC SÓNG PHẢI RA MỘT PHA **KHÔNG TUẦN HOÀN THEO Ô**, nếu không cả
 * mạng đường hiện ra một hoạ tiết lặp đúng bằng một ô — tức lại là cái lưới, chỉ là cái lưới gợn
 * sóng. Cùng lý do `stoneNoise` trong `terrainMesh.js` lấy hạt theo toạ độ TUYỆT ĐỐI.
 * Số vô tỉ ở đây làm đúng việc đó: nó bảo đảm pha không bao giờ khớp lại với lưới số nguyên.
 */
/**
 * Độ lệch tim đường tại MỘT RANH GIỚI Ô, chuẩn hoá về [−1, 1] (±1 = mép ô).
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ NÓ ĐỌC THẲNG CHỖ CUNG CẮT QUA RANH GIỚI ẤY — KHÔNG SINH RA MỘT ĐƯỜNG LƯỢN NÀO CỦA RIÊNG MÌNH
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Bản trước dựng độ lệch bằng **nhiễu băm nhiều tần số** (mỗi `plan` một công thức sóng riêng).
 * Đàm bác thẳng: *"không phải kiểu đường lồi lõm, mà là dạng đường cong hay không cong"*. Và anh
 * đúng về mặt cơ chế chứ không chỉ về mặt thẩm mỹ: một dãy số ngẫu nhiên **không mang thông tin
 * về con đường**, nên nó chỉ có thể làm mép đường gợn lên gợn xuống. Mắt đọc cái gợn ấy ra
 * *nhiễu*, không ra *đường cong* — y hệt bài học "bậc thang ngẫu nhiên ≠ cung cong" ở đầu
 * `roadPlan.js`.
 *
 * Nay hình dạng đến từ ĐÚNG một nguồn: cung cong đã sinh ra mạng đường. Lúc rasterise, `arcTrace`
 * ghi lại vị trí THẬT của cung tại mỗi ranh giới nó đi qua; hàm này chỉ tra bảng ấy. Hệ quả:
 *   · chỗ nào cung cong nhiều thì đường lượn nhiều, cung thẳng thì đường thẳng — **không có
 *     lượn nào không có lý do**;
 *   · kỷ khai `bend: 0` (Chang'an, Manhattan) ra bảng rỗng ⇒ đường thẳng băng, tự nhiên, không
 *     cần một nhánh `if` riêng;
 *   · và một mạng CONG thôi đọc ra như bậc thang, vì tim đường đi qua đúng chỗ cung đi qua.
 *
 * ⚠️ ĐỐI XỨNG VẪN ĐƯỢC BẢO ĐẢM THEO CẤU TẠO, và nay còn chặt hơn trước: khoá của bảng là **RANH
 * GIỚI**, nên hai ô kề nhau không tra hai chỗ khác nhau mà tra ĐÚNG MỘT Ô NHỚ. Không còn cả khả
 * năng hai công thức tương đương lệch nhau ở biên.
 *
 * @param {number} era
 * @param {'u'|'v'} axis   con đường chạy theo trục nào ('u' = theo x, lệch theo y)
 * @param {number} i       toạ độ x của ranh giới (axis 'u') hoặc cột (axis 'v')
 * @param {number} j       hàng (axis 'u') hoặc toạ độ y của ranh giới (axis 'v')
 * @returns {number} trong [−1, 1]
 */
export function boundaryBend(era, axis, i, j) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const { crossings } = buildRoadPlan(eraNum, getNetworkStyle(eraNum));
  return crossings.get(`${axis}|${i}|${j}`) ?? 0;
}

/**
 * ⇒ **MỘT LUẬT MỘT CÔNG THỨC.** Cả `terrainMesh.js` (dựng mặt đường) lẫn `residents.js` (cư dân đi
 * bộ) đều phải biết tim đường nằm ở đâu, và nếu mỗi bên tự tính lấy thì đúng một ngày nào đó cư
 * dân sẽ đi lơ lửng bên cạnh mặt đường — không có gì đỏ lên, vì cả hai bên đều "đúng" theo công
 * thức của riêng mình. Nên chỉ có ĐÚNG MỘT hàm dựng ra tim đường, và cả hai bên gọi nó.
 *
 * @param {number} era
 * @param {Array<{x:number,y:number,variant:number}>} roadCells các ô đường ĐANG HIỆN
 * @returns {{centreOf:Function, edgeOf:Function, scaleOf:Function}}
 *   · `centreOf(x, y)` → `{du, dv}` độ lệch tim đường tại TÂM ô, đơn vị: phần của một ô.
 *   · `edgeOf(x, y, side)` → số, độ lệch tại RANH GIỚI phía ấy của ô (đã lấy `min` với hàng xóm).
 *   · `scaleOf(x, y)` → biên độ của riêng ô ấy (dùng cho test/công cụ đo).
 */
export function buildRoadPaths(era, roadCells) {
  const scaleAt = new Map();
  const halfAt = new Map();
  for (const cell of roadCells ?? []) {
    const key = `${cell.x}|${cell.y}`;
    const hạng = rankOfRoad(cell.variant, cell.tier);
    scaleAt.set(key, rankBendScale(era, hạng));
    halfAt.set(key, roadHalfWidth(era, cell.x, cell.y, hạng));
  }
  const scaleOf = (x, y) => scaleAt.get(`${x}|${y}`) ?? 0;

  /**
   * HÌNH DẠNG lòng đường ở một ô — lõi + bốn cánh tay, đúng thứ `carriagewayShape` khai.
   *
   * ⚠️ ĐẶT Ở ĐÂY ĐỂ **XOÁ MỘT BẢN CHÉP**, KHÔNG PHẢI ĐỂ THÊM MỘT LỚP. Trước đó `terrainMesh.js`
   * tự dựng lấy bảng nửa bề rộng của hàng xóm rồi tự gọi `carriagewayShape`, còn `residents.js`
   * thì không có cách nào biết lòng đường rộng hẹp ra sao. Nay cả hai hỏi cùng một chỗ, nên câu
   * *"mặt đường ở đâu"* và câu *"cư dân đi ở đâu"* không thể trả lời lệch nhau.
   */
  const shapeOf = (x, y) => {
    const nb = {};
    for (const [phía, [dx, dy]] of Object.entries(SIDE_STEPS)) {
      const k = `${x + dx}|${y + dy}`;
      nb[phía] = halfAt.has(k) ? halfAt.get(k) : null;
    }
    return carriagewayShape(halfAt.get(`${x}|${y}`) ?? 0.25, nb);
  };

  /**
   * Biên độ TẠI MỘT RANH GIỚI = `min` biên độ hai ô gặp nhau ở đó.
   * ⚠️ `min` ĐỐI XỨNG ⇒ hai ô kề nhau không thể tính ra hai con số khác nhau. Đây chính là phép
   * đã xoá bậc bề rộng ở Phase 12, dùng lại nguyên vẹn cho độ lệch. Phía không có đường thì lấy
   * biên độ của chính mình — chỗ ấy không có ai để mà phải khớp.
   */
  const scaleEdge = (x, y, nx, ny) => {
    const nb = scaleAt.get(`${nx}|${ny}`);
    const me = scaleOf(x, y);
    return nb === undefined ? me : Math.min(me, nb);
  };

  const edgeOf = (x, y, side) => {
    switch (side) {
      // Ranh giới TÂY của ô (x,y) nằm tại `x − 0,5`; ô (x−1,y) gọi đúng ranh giới ấy là ĐÔNG của
      // nó và truyền cùng bộ `(x, y)` vào `boundaryBend` ⇒ hai bên trùng khít theo cấu tạo.
      case 'west':  return boundaryBend(era, 'u', x, y) * scaleEdge(x, y, x - 1, y);
      case 'east':  return boundaryBend(era, 'u', x + 1, y) * scaleEdge(x, y, x + 1, y);
      case 'north': return boundaryBend(era, 'v', x, y) * scaleEdge(x, y, x, y - 1);
      case 'south': return boundaryBend(era, 'v', x, y + 1) * scaleEdge(x, y, x, y + 1);
      default:      return 0;
    }
  };

  // Tâm ô = trung bình hai ranh giới của chính trục ấy ⇒ tim đường là một đường gấp khúc LIÊN TỤC:
  // ranh giới → tâm ô → ranh giới → tâm ô kế tiếp.
  const centreOf = (x, y) => ({
    du: (edgeOf(x, y, 'north') + edgeOf(x, y, 'south')) / 2,
    dv: (edgeOf(x, y, 'west') + edgeOf(x, y, 'east')) / 2,
  });

  /**
   * Tâm LÕI của một ô — tức chỗ tim đường thật sự đi qua, đã CHẶN theo trục mà ô ấy có đường.
   *
   * ⚠️ VÌ SAO PHẢI CHẶN: một ô chỉ có đường NGANG mà cũng nhận độ lệch `du` thì cái lõi bị đẩy dọc
   * theo chính hướng con đường — vô nghĩa (đường có lượn theo chiều đi của nó đâu), và nó làm hai
   * cánh tay dài ngắn lệch nhau không vì lý do gì.
   *
   * ⚠️ VÀ NÓ PHẢI NẰM Ở ĐÂY, KHÔNG PHẢI Ở MỖI BÊN GỌI. `terrainMesh.js` đặt mặt đường theo con số
   * này, còn `residents.js` đặt BÀN CHÂN CƯ DÂN theo nó. Hai bản chép tay của cùng một phép chặn
   * là cách chắc chắn nhất để một ngày nào đó cư dân đi lơ lửng bên cạnh mặt đường — mà triệu
   * chứng ấy thì không cổng nào bắt được, vì cả hai bên đều "đúng" theo công thức của riêng mình.
   */
  const coreOf = (x, y) => {
    const c = centreOf(x, y);
    const coNgang = scaleAt.has(`${x - 1}|${y}`) || scaleAt.has(`${x + 1}|${y}`);
    const coDoc = scaleAt.has(`${x}|${y - 1}`) || scaleAt.has(`${x}|${y + 1}`);
    return { du: coDoc ? c.du : 0, dv: coNgang ? c.dv : 0 };
  };

  /**
   * TIM ĐƯỜNG ĐI QUA MỘT Ô, dưới dạng dãy điểm — đúng dãy mà mặt đường được dựng quanh nó.
   *
   * ⚠️ VÌ SAO PHẢI CÓ ĐIỂM Ở **MÉP LÕI**, KHÔNG CHỈ TÂM Ô VÀ RANH GIỚI. Mặt đường giữ tim đường
   * PHẲNG suốt bề ngang cái lõi rồi mới bắt đầu nghiêng ra ranh giới (xem `dai()` trong
   * `terrainMesh.js`: cánh tay nội suy từ mép lõi, không từ tâm ô). Nối thẳng tâm-ô → ranh-giới
   * thì cư dân bắt đầu rẽ SỚM HƠN con đường, và ở khúc cua gấp họ lòi ra ngoài mép.
   * Đo được trước khi vá: kỷ 1, cư dân cách tim đường **0,132 ô** trong khi lòng ngõ chỉ rộng
   * **0,131 ô** mỗi bên — đi trên cỏ, sát mép đường.
   *
   * @param {number} x @param {number} y
   * @param {?string} vào  phía cư dân ĐI VÀO ô này (null nếu đây là điểm bắt đầu)
   * @param {?string} ra   phía cư dân ĐI RA khỏi ô này
   * @returns {Array<{x:number, y:number}>}
   */
  const walkThrough = (x, y, vào, ra) => {
    const lõi = coreOf(x, y);
    const cx = x + lõi.du; const cy = y + lõi.dv;
    const shape = shapeOf(x, y);
    // Điểm nằm trên mép lõi về phía `phía` — chỗ con đường thôi phẳng và bắt đầu nghiêng ra biên.
    const mépLõi = (phía) => {
      switch (phía) {
        case 'west':  return { x: cx - shape.coreU, y: cy };
        case 'east':  return { x: cx + shape.coreU, y: cy };
        case 'north': return { x: cx, y: cy - shape.coreV };
        default:      return { x: cx, y: cy + shape.coreV };
      }
    };
    // Điểm nằm đúng trên ranh giới ô phía `phía`, ở độ lệch mà CẢ HAI ô đã thoả thuận.
    const điểmBiên = (phía) => {
      const lệch = edgeOf(x, y, phía);
      switch (phía) {
        case 'west':  return { x: x - 0.5, y: y + lệch };
        case 'east':  return { x: x + 0.5, y: y + lệch };
        case 'north': return { x: x + lệch, y: y - 0.5 };
        default:      return { x: x + lệch, y: y + 0.5 };
      }
    };
    const ra_ = [];
    if (vào) { ra_.push(điểmBiên(vào)); ra_.push(mépLõi(vào)); }
    ra_.push({ x: cx, y: cy });
    if (ra) ra_.push(mépLõi(ra));
    return ra_;
  };

  return {
    centreOf, coreOf, edgeOf, scaleOf, shapeOf, walkThrough,
  };
}

/**
 * NỬA BỀ RỘNG lòng đường ở một ô.
 *
 * ⚠️ ĐẶT Ở ĐÂY, KHÔNG ĐẶT TRONG `terrainMesh.js`, VÌ NÓ CÓ **BA** NGƯỜI ĐỌC: bên dựng hình, bảng
 * tra hàng xóm của chính bên ấy, và bài test hình học. Ba bản chép tay của cùng một công thức là
 * ba cơ hội để chúng trôi khỏi nhau, mà triệu chứng thì im lặng: hàng xóm đọc một bề rộng còn ô
 * đang dựng dùng một bề rộng khác ⇒ bậc ở mép đường quay lại đúng như trước Phase 12.
 *
 * ⚠️ **ĐỀU TUYỆT ĐỐI DỌC MỘT HẠNG ĐƯỜNG — ĐÃ TỪNG CÓ MỘT HỆ SỐ "CHỖ THẮT CHỖ PHÌNH" Ở ĐÂY VÀ NÓ
 * ĐÃ BỊ GỠ.** Hệ số ấy (`widthJitter`, biên độ tới ±35%) nhân bề rộng theo băm từng ô, nên cùng
 * một con đường chỗ nở chỗ tóp — đúng chữ **"lồi lõm"** mà Đàm dùng để bác cả bản trước. Nó cũng
 * là thứ đã đẻ ra một lỗi hình học thật (ô vừa phình to nhất vừa lượn xa nhất thì
 * `độ lệch + nửa bề rộng = 0,5605 > 0,5` ⇒ mặt đường lấn sang thửa đất bên cạnh), và cách "vá"
 * khi ấy là trừ hao sẵn cái biên độ phình — tức trả bằng chính chỗ để lượn.
 *
 * ⇒ Bề rộng nay chỉ đến từ BẢNG (`streetStyle.js`), và mọi bản sắc "đường này rộng đường kia hẹp"
 * nằm ở HẠNG ĐƯỜNG chứ không ở nhiễu. Bất đẳng thức `độ lệch + nửa bề rộng ≤ 0,5 − EDGE_KEEP`
 * nhờ đó đúng THEO CẤU TẠO (xem `rankBendScale`), không còn phụ thuộc hạt băm nào.
 *
 * ⚠️ KẸP THEO VỈA HÈ (`0,5 − walk`), KHÔNG KẸP THEO 0,5: bề rộng cộng vỉa hè mà vượt chỗ trống thì
 * vỉa hè của hai ô kề nhau chồng lên nhau và sinh một dải chọi mặt (z-fight) chạy dọc cả thành phố.
 */
export function roadHalfWidth(era, x, y, rank) {
  const cross = streetCrossSection(getStreetStyle(era), rank);
  return Math.max(0.04, Math.min(cross.half, 0.5 - cross.walk));
}
