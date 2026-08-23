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

import { unit, signed } from '../hashId.js';
import { getNetworkStyle } from './networkStyle.js';
import { SIDE_STEPS, carriagewayShape, getStreetStyle, streetCrossSection } from './streetStyle.js';

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

export function rankBendScale(era, isLane) {
  const style = getNetworkStyle(era);
  const cross = streetCrossSection(getStreetStyle(era), isLane);
  /**
   * ⚠️ TRỪ THEO BỀ RỘNG **RỘNG NHẤT CÓ THỂ**, KHÔNG THEO BỀ RỘNG KHAI TRONG BẢNG — và đây là một
   * lỗi thật, do chính bài test `LƯỢN KHÔNG ĐƯỢC ĐẨY LÒNG ĐƯỜNG RA KHỎI Ô` bắt được.
   *
   * Bề rộng thật của một ô đã được nhân `widthJitter` (chỗ thắt chỗ phình), tối đa `1 + MAX_PINCH`
   * lần bề rộng khai. Tính biên độ lượn theo bề rộng KHAI thì ở ô nào rơi vào lúc phình to nhất,
   * `độ lệch + nửa bề rộng` vượt quá nửa ô ⇒ mặt đường lấn sang thửa đất bên cạnh. Đo được ở kỷ 1:
   * 0,25 + 0,3105 = **0,5605 > 0,5**.
   *
   * ⚠️ NGUY HIỂM Ở CHỖ NÓ KHÔNG NỔ NGAY. Hai đại lượng đều theo băm, nên phải ĐÚNG ô nào vừa phình
   * to nhất vừa lượn xa nhất mới lòi ra — tức bản vá "đúng nhờ may mắn" sẽ sống cho tới ngày có ai
   * chỉnh một con số trong bảng. Trừ sẵn ở đây thì `độ lệch + nửa bề rộng ≤ 0,5 − EDGE_KEEP` là
   * một bất đẳng thức ĐÚNG THEO CẤU TẠO, không phụ thuộc hạt băm.
   */
  const rộngNhất = Math.min(cross.half * (1 + MAX_PINCH * style.ragged), 0.5 - cross.walk);
  const usable = Math.max(0, 0.5 - rộngNhất - cross.walk - EDGE_KEEP);
  return usable * style.bend;
}

/** Ô này thuộc hạng nào. `variant` 0 = đại lộ/ngã tư · 1,2 = ngõ phố. Một chỗ duy nhất định nghĩa. */
export function isLaneVariant(variant) {
  return variant === 1 || variant === 2;
}

/**
 * ⚠️ MỘT SỐ NGUYÊN CHIA CHO BƯỚC SÓNG PHẢI RA MỘT PHA **KHÔNG TUẦN HOÀN THEO Ô**, nếu không cả
 * mạng đường hiện ra một hoạ tiết lặp đúng bằng một ô — tức lại là cái lưới, chỉ là cái lưới gợn
 * sóng. Cùng lý do `stoneNoise` trong `terrainMesh.js` lấy hạt theo toạ độ TUYỆT ĐỐI.
 * Số vô tỉ ở đây làm đúng việc đó: nó bảo đảm pha không bao giờ khớp lại với lưới số nguyên.
 */
const PHI = 1.618033988749895;

/**
 * Độ lệch tim đường tại MỘT RANH GIỚI Ô, chuẩn hoá về [−1, 1].
 *
 * ⚠️ ĐỌC KỸ Ý NGHĨA THAM SỐ — ĐÂY LÀ CHỖ DUY NHẤT ĐỐI XỨNG ĐƯỢC BẢO ĐẢM, VÀ NÓ DỰA VÀO VIỆC BÊN
 * GỌI TRUYỀN ĐÚNG TOẠ ĐỘ RANH GIỚI:
 *   · `axis 'u'` — con đường chạy ngang (theo x), lệch theo y. Ranh giới nằm tại `x = i − 0,5`,
 *     trên hàng `j`. Ô (i−1, j) gọi nó là ranh giới ĐÔNG của mình; ô (i, j) gọi nó là ranh giới
 *     TÂY. Hai ô truyền CÙNG `(i, j)` ⇒ cùng kết quả.
 *   · `axis 'v'` — con đường chạy dọc (theo y), lệch theo x. Ranh giới nằm tại `y = j − 0,5`,
 *     trên cột `i`.
 *
 * @param {number} era
 * @param {'u'|'v'} axis   con đường chạy theo trục nào
 * @param {number} i       toạ độ x của ranh giới (axis 'u') hoặc cột (axis 'v')
 * @param {number} j       hàng (axis 'u') hoặc toạ độ y của ranh giới (axis 'v')
 * @param {number} [mid]   tâm lưới, chỉ dùng cho kiểu `radial`
 * @returns {number} trong [−1, 1]
 */
export function boundaryBend(era, axis, i, j, mid = 5.5) {
  const style = getNetworkStyle(era);
  if (style.bend <= 0) return 0;

  // `t` = vị trí DỌC con đường (nó lượn theo chiều đi); `lane` = con đường thứ mấy (mỗi con đường
  // song song phải lượn khác nhau, nếu không cả mạng lượn đồng pha thành một tấm vải gợn sóng).
  const t = axis === 'u' ? i : j;
  const lane = axis === 'u' ? j : i;
  const seed = `bend|${era}|${axis}|${lane}`;
  const pha = unit(seed) * 2 * Math.PI;
  const w = (2 * Math.PI) / Math.max(2, style.coil);

  switch (style.plan) {
    // Bàn cờ có chủ ý: gần như thẳng. Vẫn để một sóng rất dài, rất nhỏ — một tấm lưới THẬT cũng
    // không bao giờ hoàn hảo tuyệt đối, và nếu kỷ muốn thẳng tuyệt đối thì nó khai `bend: 0`.
    case 'grid':
      return 0.35 * Math.sin(t * w * 0.5 + pha);

    // Một cung dài duy nhất: nửa chu kỳ trải trên cả chiều dài con đường. Đường nghi lễ thẳng về ý
    // đồ nhưng cong nhẹ theo địa thế vì nó có trước máy trắc địa.
    case 'axial':
      return Math.sin((t / 12) * Math.PI + pha * 0.15);

    // Lượn tự do: BA tần số chồng nhau. Một tần số thôi thì ra một sóng sin đều tăm tắp — mắt đọc
    // ra "hoạ tiết", không đọc ra "tự nhiên". Ba tần số lệch pha vô tỉ thì không lặp lại.
    case 'organic': {
      const a = Math.sin(t * w + pha);
      const b = 0.5 * Math.sin(t * w * PHI * 2 + pha * 1.7);
      const c = 0.25 * Math.sin(t * w * PHI * 3.3 + pha * 2.3);
      /**
       * ⚠️ CHIA CHO 1,25 RỒI KẸP, KHÔNG CHIA CHO 1,75 (= tổng biên độ ba tần số).
       *
       * Chia cho tổng biên độ thì bảo đảm không bao giờ vượt ±1 — nhưng ba sóng lệch pha vô tỉ gần
       * như KHÔNG BAO GIỜ cùng đạt đỉnh một lúc, nên giá trị thật chỉ quanh quẩn ±0,46 (RMS). Tức
       * con đường chỉ dùng chưa tới một nửa chỗ mà nó được phép lượn — đo được: kỷ 7 chỉ đạt 24%
       * cái trần của chính nó. Đó là một cái kẹp âm thầm nuốt mất một trục, đúng họ `MIN_STONE`.
       *
       * Chia cho 1,25 rồi KẸP về [−1, 1] thì giữ nguyên lời hứa "không bao giờ vượt ±1" (phép kẹp
       * lo việc đó, và mọi phép tính chỗ trống phía sau dựa vào đúng lời hứa ấy), mà tận dụng được
       * gần gấp rưỡi. Phần bị kẹp (~13% số điểm) cho ra một đoạn tim đường THẲNG ở chỗ lẽ ra là
       * đỉnh sóng — và điều đó ĐÚNG về mặt đô thị: một con ngõ tự phát chạy men theo ranh thửa đất
       * rồi mới bẻ, chứ không lượn tròn như một dòng sông.
       */
      return Math.max(-1, Math.min(1, (a + b + c) / 1.25));
    }

    // Gấp khúc ngắn rồi GIỮ: phố bám đường đồng mức. `floor` tạo ra thềm, phần lẻ làm chỗ bẻ góc.
    case 'terrace': {
      const step = Math.max(2, Math.round(style.coil));
      const k = Math.floor((t + pha) / step);
      return signed(`${seed}|them|${k}`);
    }

    // Lệch TĂNG DẦN theo khoảng cách tới tâm: đại lộ toả ra từ quảng trường, càng xa càng doãng.
    case 'radial': {
      // ⚠️ HỆ SỐ NỀN 0,75 CHỨ KHÔNG PHẢI 0,6 — bản đầu cho biên độ mỗi con đường dao động trong
      // [0,2 · 1,0], nên phân nửa số đại lộ gần như thẳng và cả kỷ chỉ dùng 13% cái trần của nó.
      // Dải [0,5 · 1,0] vẫn giữ được sự khác nhau giữa các nhánh toả ra (đó là điểm của `radial`)
      // mà không để nhánh nào chết hẳn.
      const d = (t - mid) / mid;
      return Math.max(-1, Math.min(1, d)) * (0.75 + 0.25 * Math.sin(pha));
    }

    default:
      return 0;
  }
}

/**
 * ⇒ **MỘT LUẬT MỘT CÔNG THỨC.** Cả `terrainMesh.js` (dựng mặt đường) lẫn `residents.js` (cư dân đi
 * bộ) đều phải biết tim đường nằm ở đâu, và nếu mỗi bên tự tính lấy thì đúng một ngày nào đó cư
 * dân sẽ đi lơ lửng bên cạnh mặt đường — không có gì đỏ lên, vì cả hai bên đều "đúng" theo công
 * thức của riêng mình. Nên chỉ có ĐÚNG MỘT hàm dựng ra tim đường, và cả hai bên gọi nó.
 *
 * @param {number} era
 * @param {Array<{x:number,y:number,variant:number}>} roadCells các ô đường ĐANG HIỆN
 * @param {number} [mid] tâm lưới (cho kiểu `radial`)
 * @returns {{centreOf:Function, edgeOf:Function, scaleOf:Function}}
 *   · `centreOf(x, y)` → `{du, dv}` độ lệch tim đường tại TÂM ô, đơn vị: phần của một ô.
 *   · `edgeOf(x, y, side)` → số, độ lệch tại RANH GIỚI phía ấy của ô (đã lấy `min` với hàng xóm).
 *   · `scaleOf(x, y)` → biên độ của riêng ô ấy (dùng cho test/công cụ đo).
 */
export function buildRoadPaths(era, roadCells, mid = 5.5) {
  const scaleAt = new Map();
  const halfAt = new Map();
  for (const cell of roadCells ?? []) {
    const key = `${cell.x}|${cell.y}`;
    const isLane = isLaneVariant(cell.variant);
    scaleAt.set(key, rankBendScale(era, isLane));
    halfAt.set(key, roadHalfWidth(era, cell.x, cell.y, isLane));
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
      case 'west':  return boundaryBend(era, 'u', x, y, mid) * scaleEdge(x, y, x - 1, y);
      case 'east':  return boundaryBend(era, 'u', x + 1, y, mid) * scaleEdge(x, y, x + 1, y);
      case 'north': return boundaryBend(era, 'v', x, y, mid) * scaleEdge(x, y, x, y - 1);
      case 'south': return boundaryBend(era, 'v', x, y + 1, mid) * scaleEdge(x, y, x, y + 1);
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
 * NỬA BỀ RỘNG THẬT của lòng đường ở một ô — đã nhân biến thiên "chỗ thắt chỗ phình".
 *
 * ⚠️ ĐẶT Ở ĐÂY, KHÔNG ĐẶT TRONG `terrainMesh.js`, VÌ NÓ CÓ **BA** NGƯỜI ĐỌC: bên dựng hình, bảng
 * tra hàng xóm của chính bên ấy, và bài test hình học. Ba bản chép tay của cùng một công thức là
 * ba cơ hội để chúng trôi khỏi nhau, mà triệu chứng thì im lặng: hàng xóm đọc một bề rộng còn ô
 * đang dựng dùng một bề rộng khác ⇒ bậc ở mép đường quay lại đúng như trước Phase 12.
 *
 * ⚠️ KẸP THEO VỈA HÈ (`0,5 − walk`), KHÔNG KẸP THEO 0,5. Phình quá chỗ trống thì vỉa hè của hai ô
 * kề nhau chồng lên nhau và sinh một dải chọi mặt (z-fight) chạy dọc cả thành phố.
 */
export function roadHalfWidth(era, x, y, isLane) {
  const cross = streetCrossSection(getStreetStyle(era), isLane);
  return Math.max(0.04, Math.min(cross.half * widthJitter(era, x, y), 0.5 - cross.walk));
}

/**
 * Trần biến thiên bề rộng. Một con đường thắt lại quá nửa thì nó thôi là một con đường và thành
 * hai cái sân nối nhau bằng một khe — đúng khuyết tật "mấy cái sân đỗ xe rời rạc" mà bản đầu của
 * Phase 9D đã dựng ra và phải vá. 0,35 là mức còn đọc ra một con đường liên tục.
 */
export const MAX_PINCH = 0.35;

/**
 * Hệ số nhân BỀ RỘNG của một ô đường — chỗ thắt chỗ phình.
 *
 * ⚠️ KHÔNG CẦN ĐỐI XỨNG Ở RANH GIỚI, VÀ ĐÓ KHÔNG PHẢI SƠ SUẤT: `carriagewayShape` đã đặt bề rộng
 * chỗ giáp là `min(nửa của tôi, nửa của hàng xóm)` — một biểu thức đối xứng — nên dù hai ô kề nhau
 * khai hai bề rộng khác nhau thì chỗ GIÁP vẫn khớp khít, và phần chênh biến thành một đoạn LOE.
 * Tức luật sẵn có của Phase 12 đã lo hộ; thêm một phép đối xứng nữa ở đây là dựng hai công thức
 * cho cùng một luật, thứ mà `CLAUDE.md` cấm.
 *
 * @returns {number} quanh 1, trong `[1 − MAX_PINCH, 1 + MAX_PINCH]`
 */
export function widthJitter(era, x, y) {
  const ragged = getNetworkStyle(era).ragged;
  if (ragged <= 0) return 1;
  return 1 + signed(`rag|${era}|${x}|${y}`) * ragged * MAX_PINCH;
}
