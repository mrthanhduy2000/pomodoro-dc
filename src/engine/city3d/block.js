/**
 * block.js — DỰNG HÌNH một khu phố: lấy mặt bằng của MỘT căn nhà rồi chia nó thành 4–10 đơn vị.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * Đây là lớp HÌNH của khuôn ba lớp; lớp BẢNG là `blockStyle.js` (đọc khối chú thích ở đó để biết
 * vì sao phải CHIA NHỎ chứ không THÊM VÀO), và người đọc duy nhất là `cityParts.js`.
 *
 * ── CƠ CHẾ, GỌN TRONG BỐN BƯỚC ───────────────────────────────────────────────────────────────
 *   1. Dựng **bản tham chiếu**: đúng căn nhà mà hôm nay đang đứng ở ô ấy, không sửa gì.
 *   2. Đo hình bao CHỮ NHẬT của nó (`specFootprint`) — đó là chỗ đất khu phố được phép dùng.
 *      ⚠️ KHÔNG dùng `specSpan`: nó trả về cạnh của hình VUÔNG bao ngoài và cố ý ước lượng thừa,
 *      nên nó vừa thổi phồng bề ngang vừa không nói gì về chiều sâu. Xem chú thích của cả hai hàm.
 *   3. Hỏi `deriveBlockUnits` xem chỗ đất ấy chia được thành mấy đơn vị và mỗi đơn vị nằm đâu.
 *   4. Dựng từng đơn vị bằng CHÍNH `buildBuildingSpec` (tham số `plot`), rồi xoay + dời khối của
 *      nó về đúng chỗ và gộp tất cả vào một mô tả duy nhất.
 *
 * ── BA HỆ QUẢ CỦA VIỆC TRẢ VỀ **MỘT** MÔ TẢ CHỨ KHÔNG PHẢI N MÔ TẢ ───────────────────────────
 *   · `cityParts.js` vẫn trả về đúng 30 nhà dân như cũ ⇒ `sceneGraph.js` KHÔNG phải sửa một dòng,
 *     `addPickTarget` vẫn bám đúng chỉ số cũ, thứ tự hợp đồng (công trình → giàn giáo → nhà dân →
 *     cảnh vật) không đổi.
 *   · Mỗi khu phố vẫn chỉ có MỘT bệ kè (`groundPlacement` gọi một lần), đúng như ngoài đời: cả
 *     dãy nhà đứng trên cùng một thềm. Trả về N mô tả thì sẽ có N cái bệ chồng lên nhau.
 *   · **Không thêm một lệnh vẽ nào.** Lệnh vẽ đếm theo HỌ VẬT LIỆU của cả kỷ (xem
 *     `drawCallBudget.test.js`), mà chia nhỏ một căn nhà không đẻ ra họ vật liệu mới.
 */

import { BUILDING_SCALE, countSpecTriangles, specFootprint, specHeight, specSpan } from './parts.js';
import { buildBuildingSpec } from './buildingSpec.js';
import { deriveBlockUnits, getBlockStyle } from './blockStyle.js';

/**
 * Hệ số thu nhỏ mặt bằng danh nghĩa của khu phố.
 *
 * ⚠️ NÓ TỒN TẠI VÌ MÁI ĐUA, và con số này là số ĐO ĐƯỢC chứ không phải số chọn cho đẹp. Mỗi đơn
 * vị đội một cái mái thò ra khỏi tường (`eaveOverhang`, tối đa 0,28 bề ngang mỗi bên), nên nếu
 * chia đúng khít hình bao của bản tham chiếu thì mái của hai đơn vị ngoài cùng sẽ đẩy khu phố
 * RỘNG HƠN căn nhà cũ — tức là lặng lẽ chiếm thêm đất, đúng thứ phép đo trần đã cấm.
 *
 * `blockStyle.test.js` có một bài đo hình bao thật của cả 15 kỷ × 3 hạng và đòi nó KHÔNG vượt bản
 * tham chiếu. Bài ấy là cái canh; con số dưới đây chỉ là cách đạt nó.
 */
export const BLOCK_FIT = 0.92;

/**
 * Bề ngang TỐI THIỂU của một khu phố, đo bằng ô lưới.
 *
 * ⚠️ ĐÂY KHÔNG PHẢI "CHIẾM THÊM ĐẤT". Một ô lưới rộng đúng 1,0 ô và nó đã thuộc về khu phố ấy từ
 * đầu — chỉ là ở vài kỷ căn nhà đứng trên nó nhỏ hơn cả ô (đo được: kỷ 1 rộng 0,725 ô, còn trống
 * 0,361 ô²; kỷ 14 rộng 0,850; kỷ 15 rộng 0,909). Ép khu phố nhỏ theo căn nhà cũ ở những kỷ ấy là
 * bỏ phí đúng phần đất mình đang đứng.
 *
 * 0,92 chứ không phải 1,0: chừa lại 0,08 ô làm khe giữa hai ô kề nhau, để hai khu phố cạnh nhau
 * còn đọc ra là HAI khu chứ không dính thành một tảng.
 *
 * ⚠️ Nó là một cái SÀN, không phải một cái trần: 12/15 kỷ có căn nhà RỘNG HƠN một ô (tới 1,35 ô ở
 * kỷ 6) và những kỷ ấy giữ nguyên bề ngang cũ. Đây đúng luật *"trần luôn thắng sàn"* ở chiều
 * ngược lại — sàn không bao giờ được phép co thứ đang lớn hơn nó.
 */
export const BLOCK_MIN_CELLS = 0.92;

/** Xoay một mô tả khối quanh gốc của chính nó — CÙNG công thức mà `geometryFactory` dùng cho
 *  `placement.ry`: tâm khối quay theo góc, còn góc riêng của khối thì CỘNG thêm. Dùng hai công
 *  thức khác nhau ở hai nơi là lỗi kinh điển "khối tự xoay đúng nhưng bị văng khỏi vị trí". */
function xoayVaDoi(parts, goc, ox, oz) {
  const c = Math.cos(goc);
  const s = Math.sin(goc);
  return parts.map((part) => {
    const x = part.x ?? 0;
    const z = part.z ?? 0;
    return {
      ...part,
      x: x * c - z * s + ox,
      z: x * s + z * c + oz,
      ry: (part.ry ?? 0) + goc,
    };
  });
}

/**
 * Mô tả hình học đầy đủ của MỘT KHU PHỐ nhà dân.
 *
 * @param {object} input
 * @param {string} input.bpId    khoá hình dáng của ô ấy (`dwellingBpId`)
 * @param {number} input.era     1..15
 * @param {string} input.type    'house' | 'shop' | 'workshop'
 * @param {string} input.rarity  'common' | 'rare' | 'epic' — ở nhà dân nghĩa là CỠ nhà
 * @returns {{parts:Array, height:number, span:number, triangles:number, units:number}}
 */
export function buildBlockSpec({ bpId, era, type, rarity = 'common' } = {}) {
  // BƯỚC 1 — bản tham chiếu: đúng căn nhà hôm nay, dựng bằng đúng lời gọi cũ.
  const ref = buildBuildingSpec({ bpId, era, type, rarity, level: 1 });
  const style = getBlockStyle(era);

  // BƯỚC 2 — đo chỗ đất, quy sang Ô LƯỚI (hệ đơn vị mà `MIN_UNIT_CELLS` và mắt Đàm cùng dùng).
  const goc = specFootprint(ref.parts);
  const blockW = Math.max(goc.w * BUILDING_SCALE * BLOCK_FIT, BLOCK_MIN_CELLS);
  const blockD = Math.max(goc.d * BUILDING_SCALE * BLOCK_FIT, BLOCK_MIN_CELLS);

  // BƯỚC 3 — chia.
  const units = deriveBlockUnits({ style, seed: bpId, blockW, blockD });
  if (units.length === 0 || !(goc.w > 0) || !(goc.d > 0)) return { ...ref, units: 1 };

  // BƯỚC 4 — dựng từng đơn vị.
  const parts = [];
  for (const u of units) {
    // Đơn vị quay đầu hồi ra phố thì hình bao của nó ĐỔI TRỤC: chỗ đất rộng `u.w` sẽ đón chiều
    // SÂU của căn nhà. Hỏi sai vế ở đây thì nhà quay ngang rồi thò ra khỏi khu phố.
    const quay = Math.abs(Math.sin(u.ry)) > 0.5;
    const doiW = (quay ? u.d : u.w) / BUILDING_SCALE;
    const doiD = (quay ? u.w : u.d) / BUILDING_SCALE;
    // ⚠️ TƯỜNG CHUNG THÌ KHÔNG CÓ CỬA SỔ — và đây vừa là sự thật kiến trúc vừa là khoản tiết kiệm
    // lớn nhất của cả phase. Một dãy 4×2 có 8 đơn vị × 4 mặt = 32 mặt tường, mà chỉ ~12 mặt thật
    // sự nhìn ra ngoài; 20 mặt kia bị chôn trong lòng nhà hàng xóm. Không có mặt nạ này thì cửa sổ
    // vẫn được dựng đủ trên cả 32 mặt: tốn tam giác cho thứ không ai nhìn thấy, VÀ sai — nhà phố
    // đấu lưng ngoài đời chỉ có cửa trước và cửa sau, đó chính là lý do nó gọi là "back-to-back".
    //
    // ⚠️ Mặt nạ tính theo LƯỚI KHU PHỐ, mà `emitWindows` thì làm việc trong hệ TOẠ ĐỘ RIÊNG của
    // căn nhà. Đơn vị nào quay 90° thì hai hệ ấy lệch nhau, nên phải đổi trục — quên chỗ này thì
    // cửa sổ biến mất ở mặt tiền và mọc ra trong bức tường chung.
    const mn = u.faces;
    const faces = quay ? { xm: mn.zp, xp: mn.zm, zm: mn.xm, zp: mn.xp } : mn;
    // ⚠️ ĐO HÌNH BAO CỦA CHÍNH ĐƠN VỊ, ĐỪNG SUY NÓ TỪ HÌNH BAO CỦA BẢN THAM CHIẾU. Bản đầu tính
    // `fx = doiW / goc.w` với `goc` là hình bao của bản THAM CHIẾU, và nó sai một cách có hệ
    // thống: hình bao gồm cả MÁI ĐUA, mà mái đua thì KHÔNG co theo `fx` (nó là một tỉ lệ của
    // chính khối thân, cộng thêm phần tuyệt đối). Nhân một hệ số nhỏ vào cả cụm ⇒ khối thân teo
    // đi nhiều hơn hình bao, và đo ra thì khối thân chỉ còn ~0,12–0,16 (đơn vị mô tả) trong khi
    // suất đất của nó rộng 0,25–0,35 — tức mỗi căn nhà bỏ hoang gần nửa mảnh đất của mình, VÀ
    // rơi xuống dưới `ROOFTOP_MIN_SPAN` nên mất luôn chi tiết mái.
    //
    // Sửa bằng đúng luật đã trả giá nhiều lần: *"đừng DỰ ĐOÁN thứ có thể ĐO"*. Dựng thử một lần ở
    // tỉ lệ 1, ĐO hình bao thật của chính nó, rồi mới dựng lần thật với tỉ lệ đã biết. Hai lượt
    // dựng cho mỗi đơn vị — cái giá ấy có thật, và nó được canh bởi cổng thời gian dựng cảnh
    // (`TECH_DEBT #70`, `npm run test:cross`).
    const thu = buildBuildingSpec({
      bpId: `${bpId}#${u.col},${u.row}`,
      era,
      type,
      rarity,
      level: 1,
      plot: { fx: 1, fz: 1, storey: u.storey, faces },
    });
    const gocU = specFootprint(thu.parts);
    const spec = buildBuildingSpec({
      bpId: `${bpId}#${u.col},${u.row}`,
      era,
      type,
      rarity,
      level: 1,
      plot: {
        fx: gocU.w > 0 ? doiW / gocU.w : 1,
        fz: gocU.d > 0 ? doiD / gocU.d : 1,
        storey: u.storey,
        faces,
      },
    });
    parts.push(...xoayVaDoi(spec.parts, u.ry, u.ox / BUILDING_SCALE, u.oz / BUILDING_SCALE));
  }

  return {
    parts,
    height: specHeight(parts),
    span: specSpan(parts),
    triangles: countSpecTriangles(parts),
    units: units.length,
  };
}
