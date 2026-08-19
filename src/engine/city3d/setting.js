/**
 * setting.js — HÌNH của địa thế: mặt nước nằm ở đâu, và mặt đất phải hạ xuống bao nhiêu ở đó.
 *
 * ⚠️ ĐÂY LÀ BƯỚC B CỦA VIỆC 2. `settingStyle.js` là BẢNG (15 dòng chữ, viết trước, Đàm đã duyệt);
 * file này là HÌNH; `terrain.js` · `horizon.js` · `outskirts.js` · `sceneGraph.js` chỉ ĐỌC. Khuôn
 * ba lớp lần thứ bảy — xem ADR-039.
 *
 * ── MỘT TẤM NƯỚC PHẲNG KHÔNG ĐỦ: MẶT ĐẤT PHẢI HẠ XUỐNG ─────────────────────────────────────
 * Cám dỗ đầu tiên là đặt một tấm xanh phẳng lên trên mặt đất rồi gọi đó là con sông. Không được:
 * mặt đất là MỘT tấm lưới liền trải từ rìa bên này qua thành phố sang rìa bên kia (Phase 8C), nên
 * tấm nước sẽ hoặc chọi mặt với nó, hoặc nổi lều bều bên trên như một miếng giấy màu. Nước phải là
 * chỗ mặt đất **thấp hơn mực nước**, đúng như ngoài đời. Vì vậy trường cao độ BUỘC phải biết chỗ
 * nào là nước — và đó là lý do file này tồn tại ở TẦNG THUẦN chứ không ở tầng vẽ.
 *
 * Hệ quả rất đẹp: **bờ nước không cần được vẽ.** Nó là chỗ mặt đất cắt mực nước, nên nó tự lượn
 * đúng theo mọi gợn của địa hình, không bao giờ có bậc răng cưa, và tấm nước chỉ cần là MỘT hình
 * chữ nhật phẳng đủ rộng (⇒ đúng **+1 lệnh vẽ**, đúng ràng buộc Đàm ra).
 *
 * ── VÌ SAO KHÔNG IMPORT `terrain.js` (và đây không phải sạch sẽ hình thức) ──────────────────
 * `terrain.js` phải hỏi file này *"chỗ này có nước không"*, nên file này KHÔNG được hỏi ngược lại.
 * Cụ thể: mọi hằng số ở đây là **ĐỘ LỆCH**, không phải cao độ tuyệt đối — `terrain.js` (nơi giữ
 * `APRON_DROP`) là chỗ DUY NHẤT tính ra `WATER_SURFACE_Y`, và `horizon.js`/`terrainMesh.js`/
 * `sceneGraph.js` đều đọc lại đúng con số ấy. Một luật một công thức, và không có vòng import.
 * (Nhiễu dùng chung đã phải dời xuống `noise.js` vì đúng lý do này — xem chú thích ở đó.)
 *
 * ── BA BẤT BIẾN, VÀ CẢ BA ĐỀU CÓ TEST ──────────────────────────────────────────────────────
 * (1) **Nước chỉ HẠ mặt đất, không bao giờ NÂNG.** Phép trộn kết thúc bằng `Math.min`, nên đây là
 *     đúng theo CẤU TRÚC chứ không theo kỷ luật viết hàm.
 * (2) **Trong lưới 12×12 thì cao độ không đổi một phần nghìn nào.** Đây là ADR-007 ("bảo tàng bất
 *     động") và mọi lời hứa cũ của `terrain.js` (bậc thềm, độ dốc đường) — nếu nước làm nhà lún
 *     một chút thì KHÔNG có gì đỏ lên. Giữ được nhờ hai lớp: mọi kỷ khai `reach ≥ SHORE_BAND`, và
 *     mép bờ gần **chỉ được lượn RA XA thành phố, không bao giờ lượn vào**.
 * (3) **Mực nước nằm dưới MỌI cao độ mặt đất khô của cả thế giới.** Không có vế này thì tấm nước
 *     phẳng sẽ ló ra ở những hõm khô trên vành đất (vùng đó gợn ±0,21 quanh −0,62, tức có chỗ sâu
 *     tới −0,83) và ta được một vũng nước ma giữa đồng. Xem `WATER_DROP_BELOW_PLAIN`.
 *
 * ── ĐANG DỞ DANG CÓ CHỦ Ý, VÀ NÓ ĐẾM ĐƯỢC ──────────────────────────────────────────────────
 * Đàm ra lệnh dựng hình cho **ĐÚNG 3 kỷ** rồi dừng để anh xem (14 biển · 12 sông · 1 khô). Nên
 * `ERAS_WITH_WATER_GEOMETRY` là một danh sách TƯỜNG MINH, có `assert.deepEqual` khoá, chứ không
 * phải một trạng thái ngầm — đúng bài học `door: 'legacy'` ở Phase 10: *"một mục nợ trong tài liệu
 * chỉ được đọc khi có người đi tìm; một con số trong bài test thì tự đòi được đọc."*
 */

import { valueNoise } from './noise';
import { getSetting, hasWater } from './settingStyle';

/**
 * Quãng (tính bằng ô) mà mặt đất hạ từ bờ xuống tới đáy.
 *
 * ⚠️ NÓ BỊ CHẶN TRÊN BỞI `reach` NHỎ NHẤT TRONG BẢNG (hiện là 1, ở 5 kỷ). Dải chuyển tiếp trải vào
 * phía ĐẤT LIỀN kể từ mép nước, nên `SHORE_BAND > reach` nghĩa là nó liếm vào lưới 12×12 và bất
 * biến (2) vỡ. Có test đòi `mọi kỷ: reach ≥ SHORE_BAND` — **quan hệ**, không phải một con số.
 */
export const SHORE_BAND = 0.9;

/**
 * ⚠️ MẶT NƯỚC THẤP HƠN ĐỒNG BẰNG NGOÀI BAO NHIÊU — VÀ CON SỐ NÀY LÀ MỘT PHÉP ĐO, KHÔNG PHẢI MỘT
 * SỞ THÍCH. Vành đất ngoài lưới KHÔNG phẳng: `surfaceHeightAt` cộng một gợn `roll` biên độ ±0,21
 * quanh `−APRON_DROP` (= −0,62), nên chỗ trũng nhất của mặt đất KHÔ chạm **−0,83**. Đặt mực nước
 * cao hơn con số ấy thì tấm nước phẳng sẽ ló lên ở những hõm khô nằm cách con sông hàng chục ô —
 * một vũng nước ma, và nó sẽ được đọc thành "lỗi vẽ" chứ không thành "lỗi hằng số".
 *
 * 0,30 ⇒ mực nước −0,92, thấp hơn chỗ trũng nhất **0,09**. Bài test đo lại khoảng hở ấy trên toàn
 * thế giới ở cả 15 kỷ chứ không tin vào phép suy tay ở đây (đúng luật *"đừng DỰ ĐOÁN thứ có thể
 * ĐO"* của Performance Gate 2026-08-17).
 */
export const WATER_DROP_BELOW_PLAIN = 0.30;

/** Đáy sâu nhất, tính từ MẶT nước xuống. */
export const WATER_BED_DEPTH = 0.55;

/**
 * Đáy tụt xuống ngay lập tức bấy nhiêu khi vừa chạm mép nước.
 *
 * ⚠️ KHÔNG PHẢI MỘT CHI TIẾT THẨM MỸ — thiếu nó thì ở đúng mép nước cả hai số hạng (độ trộn và độ
 * sâu) đều có ĐẠO HÀM BẰNG 0 (smoothstep), nên mặt đất **tiếp tuyến** với mặt nước trên một dải
 * rộng vài phần mười ô ⇒ hai mặt gần như đồng phẳng ⇒ nhấp nháy z-fighting chạy dọc bờ. Một bậc
 * nhỏ biến chỗ tiếp xúc thành một chỗ CẮT NGANG, và một chỗ cắt ngang thì cho ra một ĐƯỜNG bờ sắc
 * nét thay vì một vệt lấp lánh.
 */
export const WATER_BED_LIP = 0.08;

/** Quãng (ô) từ mép nước vào tới chỗ sâu nhất. */
export const BED_RAMP = 1.6;

/**
 * ⚠️ MÉP BỜ LƯỢN BAO NHIÊU — THEO `ground`, VÀ ĐÂY LÀ CHỖ CÁI BẢNG KIẾM SỐNG.
 *
 * `reclaimed` (đất lấn: Marina Bay, bến Hudson, vịnh Tokyo, kênh Manchester) là bờ **NGƯỜI LÀM** —
 * kè đá, tường chắn, thước thẳng. Cho nó lượn là nói dối về chính thứ làm nên nơi ấy. Còn bờ tự
 * nhiên mà thẳng băng thì đọc ra ngay là "một dải nhựa", không phải một con sông.
 *
 * ⚠️ VÀ NÓ CHỈ ĐƯỢC LƯỢN **RA XA** THÀNH PHỐ. Nhiễu ở đây trả 0..1 (không phải −1..1) và luôn được
 * CỘNG, nên `reach` hiệu dụng ≥ `reach` khai. Đây là thứ giữ bất biến (2) theo cấu trúc: một mép bờ
 * lượn được cả hai chiều thì ngày nào đó nó sẽ liếm vào lưới 12×12 ở đúng một kỷ, một hạt giống, và
 * hậu quả là một căn nhà lún xuống mà không có bài test nào đỏ.
 */
export const BANK_WOBBLE = {
  ridge: 0.55,
  flat: 0.45,
  bank: 0.35,
  bluff: 0.50,
  reclaimed: 0,
};

/** Cỡ ô của trường nhiễu làm lượn mép bờ, tính bằng ô. Lớn ⇒ khúc uốn dài, không phải răng cưa. */
const WOBBLE_CELL = 3.6;

/**
 * Nửa bề rộng dải yên ngựa KHÔ của kiểu `meander`, tính bằng ô.
 *
 * ⚠️ ĐÂY LÀ THỨ LÀM `meander` KHÁC `river` VỀ TOPO, chứ không phải bề rộng dải nước. Nước ôm quanh
 * cả bốn phía rồi bị cắt một khe ở phía ĐỐI DIỆN `side` — cái khe ấy là lối vào duy nhất, và nó
 * chính là câu trả lời cho *"vì sao lâu đài Burg Eltz nằm trên mỏm đá đó"*. 1,6 ô ⇒ lối vào rộng
 * 3,2 ô trên một mặt dài 12 ô: đọc ra là một dải yên ngựa, không phải một mặt hở.
 *
 * ⚠️ CHƯA AI NHÌN KIỂU NÀY BẰNG MẮT — kỷ 5 KHÔNG nằm trong ba kỷ của Bước B. Đừng đọc con số này
 * như một quyết định mỹ thuật đã nghiệm thu.
 */
export const MEANDER_NECK = 1.6;

/** Tấm nước phẳng nới ra ngoài hộp bao mặt nước bấy nhiêu ô, để luôn chui xuống dưới bờ. */
export const PLANE_MARGIN = 1.4;

/** Cảnh vật vùng quê phải đứng cách mép nước ít nhất bấy nhiêu ô — không có cây mọc dưới nước. */
export const PROP_SHORE_CLEAR = 0.35;

/**
 * ⚠️ MÀU NƯỚC THEO **KIỂU**, VÀ VÌ SAO NÓ KHÔNG NẰM Ở `palette3d.js`.
 *
 * Cùng đúng lý lẽ mà ADR-020 đã dùng cho màu lá: *"nó là thuộc tính của LOÀI (cọ sa mạc bạc phếch,
 * thông taiga ngả lam) chứ không phải một lựa chọn hoà sắc"*. Ở đây cũng vậy — một con kênh đào tù
 * đọng thì đen kịt, một cửa sông chịu triều thì đục ngầu phù sa, biển khơi thì lam sâu. Ba thứ đó
 * là SỰ THẬT VẬT LÝ về nước, không phải một quyết định phối màu của kỷ; nhét chúng vào bảng màu
 * theo kỷ là bắt 15 dòng trả lời một câu hỏi mà chúng không biết.
 *
 * `sau` = màu chỗ sâu · `can` = màu chỗ cạn sát bờ. Chênh lệch ấy là tín hiệu "cạn dần vào bờ" —
 * cùng với việc mặt nước PHẲNG tuyệt đối giữa một mặt đất gợn, đây là hai cái mà mắt dùng để đọc
 * ra "đây là nước" mà không cần một hạt sóng nào (Đàm CẤM shader nước động).
 *
 * ⚠️ Trị số chọn quanh độ sáng của `palette.ground` (V ≈ 0,286) chứ không chọn theo cảm giác trên
 * bảng màu: nắng nhân hơn hai lần rồi tone mapping nén lại, nên "xanh biển đẹp" trên giấy sẽ ra
 * trắng bệch trên màn hình — bài học *"BẢNG MÀU ≠ MÀU TRÊN MÀN HÌNH"*. Con số cuối phải ĐO trên
 * ảnh chụp (`png-probe.mjs`), không đọc ở đây.
 */
export const WATER_TINT = {
  river:   { sau: 0x243d3c, can: 0x3d5b4e },
  meander: { sau: 0x223c30, can: 0x3f5c42 },
  canal:   { sau: 0x1c2a2c, can: 0x2f4441 },
  estuary: { sau: 0x2a3a3c, can: 0x48584f },
  sea:     { sau: 0x16323f, can: 0x27545c },
};

/**
 * ⚠️ ĐANG DỞ DANG, VÀ ĐẾM ĐƯỢC. Bước B dựng hình cho ĐÚNG hai kỷ có nước (14 biển · 12 sông) cộng
 * kỷ 1 làm chứng cho vế khô. Mười hai kỷ còn lại vẫn khai nước trong bảng nhưng CHƯA được dựng —
 * đó là lệnh của Đàm (*"Đừng trải 12 kỷ còn lại"*), không phải một thiếu sót.
 *
 * ⚠️ `hasWater(era)` (BẢNG khai có nước) và `waterIsBuilt(era)` (HÌNH đã dựng) là HAI câu hỏi khác
 * nhau và phải giữ hai cái tên khác nhau. Gộp chúng là đúng cái bẫy "một trường gánh hai việc" đã
 * cắn năm lần trong dự án này.
 */
export const ERAS_WITH_WATER_GEOMETRY = [12, 14];

export function waterIsBuilt(era) {
  return ERAS_WITH_WATER_GEOMETRY.includes(Number(era)) && hasWater(era);
}

/**
 * ⚠️ PHÉP KHOÉT — VIẾT MỘT LẦN, DÙNG CHUNG CHO CẢ HAI TẤM ĐẤT.
 *
 * `terrain.surfaceHeightAt` (tấm trong) và `horizon.heightAt` (tấm ngoài) gặp nhau khít ở
 * `innerEdge`; hai tấm mà khoét bằng hai công thức "tương đương" là cách chắc chắn nhất để mở lại
 * đúng cái khe chạy vòng quanh thành phố mà Phase 9A đã trả giá để vá. Nên phép khoét chỉ có MỘT
 * bản, ở đây, và hai bên chỉ khác nhau ở chỗ đổi toạ độ.
 *
 * ⚠️ KẾT THÚC BẰNG `Math.min` CHỨ KHÔNG PHẢI BẰNG `lerp` — và đó là một BẤT BIẾN, không phải một
 * phép phòng xa. Nước chỉ được HẠ mặt đất, không bao giờ NÂNG: chỗ nào mặt đất vốn đã thấp hơn đáy
 * sông thì `lerp` sẽ kéo nó LÊN, tức con sông tự đắp cho mình một cái gờ giữa đồng. Với `min` thì
 * chuyện ấy không thể xảy ra do CẤU TRÚC — và vì hàm này THUẦN và được export, bài test bơm thẳng
 * một cao độ âm sâu vào để chứng minh phép kiểm còn răng, thay vì phải tin vào một câu chú thích.
 *
 * @param {number} dat cao độ mặt đất khô tại điểm đó
 * @param {number} day cao độ đáy nước tại điểm đó
 * @param {number} tron 0..1 — độ trộn, 0 là trên cạn hẳn
 */
export function hazXuongDay(dat, day, tron) {
  if (!(tron > 0)) return dat;
  const t = tron > 1 ? 1 : tron;
  return Math.min(dat, dat + (day - dat) * t);
}

function smoothstep(t) { return t * t * (3 - 2 * t); }
function clamp01(t) { return t < 0 ? 0 : (t > 1 ? 1 : t); }

/**
 * Bốn khoảng cách RA NGOÀI hình chữ nhật lưới, tính bằng ô. Âm nghĩa là còn ở trong theo trục đó.
 *
 * ⚠️ ĐÂY LÀ NHÀ MỚI CỦA MỘT CÔNG THỨC ĐÃ CÓ BỐN BẢN SAO. `outskirts.distanceOutsideGrid`,
 * `terrain.surfaceHeightAt` và tầng màu của `terrainMesh.js` đều hỏi cùng một câu *"ra khỏi lưới
 * chưa, và bao xa"*. Bước B cần thêm vế *"ra khỏi lưới về HƯỚNG NÀO"*, mà hướng thì không suy
 * ngược được từ một con số `max`. Nên phép gốc dời về đây, và `distanceOutsideGrid` nay được định
 * nghĩa BẰNG nó thay vì viết song song — một luật một công thức.
 */
export function outwardDistances(u, v, gridSize = 12) {
  const hi = gridSize - 0.5;
  return { bac: -0.5 - v, nam: v - hi, tay: -0.5 - u, dong: u - hi };
}

/** Khoảng cách từ một điểm tới HÌNH CHỮ NHẬT lưới thành phố, tính bằng ô. Trong lưới ⇒ 0. */
export function distanceOutsideGrid(u, v, gridSize = 12) {
  const d = outwardDistances(u, v, gridSize);
  return Math.max(0, d.bac, d.nam, d.tay, d.dong);
}

/** Hướng đối diện. Dùng cho dải yên ngựa khô của `meander`. */
const DOI_DIEN = { bac: 'nam', nam: 'bac', dong: 'tay', tay: 'dong' };

/**
 * Toạ độ CHẠY DỌC bờ của một mép nước thẳng: bờ phía đông/tây chạy theo `v`, bờ bắc/nam theo `u`.
 * Lấy nhiễu theo đúng trục ấy ⇒ cả dải nước dịch RIGID, nên **bề rộng sông không đổi một chút nào**
 * dù bờ lượn. Lấy nhiễu 2 chiều thì hai mép lượn lệch pha và con sông phình ra thắt lại — nghe thì
 * "tự nhiên hơn", nhưng nó có thể làm hai mép CẮT NHAU và con sông biến mất từng đoạn.
 */
function docBo(side, u, v) {
  return (side === 'dong' || side === 'tay') ? v : u;
}

/**
 * Dựng lớp địa thế của một kỷ.
 *
 * Mọi hàm trả về đều THUẦN và nhận toạ độ Ô (nhận số lẻ, số âm), cùng hệ với `terrain.surfaceHeightAt`
 * và `outskirts.deriveOutskirts`.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {number} [input.gridSize]
 * @returns {{
 *   style: object, hasWater: boolean, built: boolean,
 *   insetAt: (u:number, v:number) => number,
 *   blendAt: (u:number, v:number) => number,
 *   depthAt: (u:number, v:number) => number,
 *   bounds: {u0:number, u1:number, v0:number, v1:number} | null,
 * }}
 */
export function buildSetting({ era, gridSize = 12 } = {}) {
  const style = getSetting(era);
  const size = Number.isFinite(gridSize) && gridSize > 0 ? gridSize : 12;
  const built = waterIsBuilt(era);
  const seed = `w|${era}`;
  const amp = BANK_WOBBLE[style.ground] ?? 0;

  // Kỷ khô — hoặc kỷ chưa tới lượt dựng hình — trả về một lớp RỖNG chứ không phải `null`. Người gọi
  // khỏi phải rắc `if` khắp nơi, và cái `if` không viết ra là cái `if` không quên được.
  if (!built) {
    return {
      style,
      hasWater: hasWater(era),
      built: false,
      insetAt: () => -Infinity,
      blendAt: () => 0,
      depthAt: () => 0,
      bounds: null,
    };
  }

  const hi = size - 0.5;

  /**
   * Khoảng cách LÙI VÀO trong mặt nước, tính bằng ô: dương ở dưới nước, âm trên cạn, và độ lớn
   * xấp xỉ khoảng cách tới mép nước gần nhất. Đây là đại lượng gốc — cả độ trộn lẫn độ sâu đều
   * suy từ nó, nên chỉ có MỘT chỗ định nghĩa hình dạng mặt nước.
   */
  function insetAt(u, v) {
    if (!Number.isFinite(u) || !Number.isFinite(v)) return -Infinity;

    if (style.water === 'meander') {
      // Vành khăn quanh cả bốn phía, rồi KHOÉT một khe ở phía đối diện `side`.
      const da = distanceOutsideGrid(u, v, size);
      const shift = amp * valueNoise(`${seed}|rim`, u / WOBBLE_CELL, v / WOBBLE_CELL);
      const gan = style.reach + shift;
      const xa = style.reach + style.width + shift;
      const vanh = Math.min(da - gan, xa - da);

      // Dải yên ngựa: một hành lang chạy ra khỏi mặt đối diện, nửa rộng `MEANDER_NECK`. Trong hành
      // lang ⇒ KHÔ. `min` của hai trường có dấu = phép GIAO, nên khe luôn liền mạch, không vá.
      const doi = DOI_DIEN[style.side] ?? 'tay';
      const d = outwardDistances(u, v, size);
      const doc = (doi === 'dong' || doi === 'tay') ? v : u;
      const trongKhe = Math.min(d[doi], MEANDER_NECK - Math.abs(doc - (size - 1) / 2));
      return Math.min(vanh, -trongKhe);
    }

    const d = outwardDistances(u, v, size)[style.side];
    if (d === undefined) return -Infinity;
    const shift = amp * valueNoise(`${seed}|bo`, docBo(style.side, u, v) / WOBBLE_CELL, 0);
    const gan = style.reach + shift;
    // `width === null` ⇒ ra tới chân trời, không có bờ bên kia (chỉ `sea` được phép, xem bảng).
    if (style.width === null) return d - gan;
    return Math.min(d - gan, (style.reach + style.width + shift) - d);
  }

  /** 0 trên cạn hẳn · 1 từ mép nước trở vào. Đây là hệ số kéo mặt đất xuống. */
  function blendAt(u, v) {
    const s = insetAt(u, v);
    if (s <= -SHORE_BAND) return 0;
    return smoothstep(clamp01((s + SHORE_BAND) / SHORE_BAND));
  }

  /** Đáy sâu bao nhiêu DƯỚI mặt nước tại điểm này. Luôn ≥ `WATER_BED_LIP` khi đã chạm nước. */
  function depthAt(u, v) {
    const s = insetAt(u, v);
    if (s <= -SHORE_BAND) return 0;
    const t = smoothstep(clamp01(Math.max(0, s) / BED_RAMP));
    return WATER_BED_LIP + (WATER_BED_DEPTH - WATER_BED_LIP) * t;
  }

  // Hộp bao của mặt nước, theo ô, đã nới `PLANE_MARGIN`. Tấm nước phẳng chỉ cần phủ chừng này —
  // ra ngoài đó mặt đất luôn cao hơn mực nước nên có phủ cũng vô hình (bất biến (3)).
  const xaNhat = style.width === null
    ? Infinity
    : style.reach + style.width + amp + PLANE_MARGIN;
  const gonNhat = style.reach - PLANE_MARGIN;
  const bounds = style.water === 'meander'
    ? { u0: -0.5 - xaNhat, u1: hi + xaNhat, v0: -0.5 - xaNhat, v1: hi + xaNhat }
    : {
      u0: style.side === 'tay' ? -0.5 - xaNhat : (style.side === 'dong' ? hi + gonNhat : -Infinity),
      u1: style.side === 'tay' ? -0.5 - gonNhat : (style.side === 'dong' ? hi + xaNhat : Infinity),
      v0: style.side === 'bac' ? -0.5 - xaNhat : (style.side === 'nam' ? hi + gonNhat : -Infinity),
      v1: style.side === 'bac' ? -0.5 - gonNhat : (style.side === 'nam' ? hi + xaNhat : Infinity),
    };

  return { style, hasWater: true, built: true, insetAt, blendAt, depthAt, bounds };
}
