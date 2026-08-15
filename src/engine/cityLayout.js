/**
 * cityLayout.js — Suy ra bố cục "Thành Phố Pixel" từ danh sách công trình đã xây.
 *
 * THUẦN tuyệt đối: không `Date`, không `Math.random`, không I/O, không import store/React.
 *
 * ⚠️ BẤT BIẾN CỐT LÕI (lý do tồn tại của cả file này):
 *   cùng đầu vào → cùng đầu ra, VĨNH VIỄN.
 * Nhờ vậy toạ độ KHÔNG cần lưu vào state: một thành phố kỷ cũ đã niêm phong sẽ được dựng lại
 * y hệt sau nhiều năm, kể cả khi mất localStorage hay đổi máy (xem quyết định 0.3 của SPEC
 * "Thành Phố Pixel" và ADR tương ứng trong ARCHITECTURE_DECISIONS.md).
 *
 * ⚠️ BẤT BIẾN THỨ HAI — "bảo tàng phải bất động":
 *   xây thêm công trình mới KHÔNG được làm xê dịch công trình cũ.
 * Cách bảo đảm: mỗi bản vẽ có một "khu đất" (zone) riêng suy từ THỨ HẠNG CỐ ĐỊNH của nó trong
 * `BLUEPRINT_CATALOG` của kỷ đó (mỗi kỷ đúng 5 bản vẽ → 5 zone rời nhau). Vì các zone không giao
 * nhau, hai công trình cùng một kỷ KHÔNG BAO GIỜ tranh nhau một ô → vị trí của mỗi công trình chỉ
 * phụ thuộc CHÍNH ID CỦA NÓ, không phụ thuộc việc có bao nhiêu công trình khác đang đứng cạnh.
 * (Nếu chỉ dò xoắn ốc theo danh sách đã sắp xếp thì bất biến này chỉ đúng khi không va chạm —
 * ~7% bộ 5 công trình sẽ va chạm trên lưới 144 ô, tức bảo tàng có thể "động đậy". Không chấp nhận
 * được.)
 */

import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from './constants';
import { deriveDwellings } from './city3d/dwellings';
import { getFloraStyle } from './city3d/floraStyle';
import { hashId } from './hashId';
import {
  CITY_GRID_SIZE, BUILDING_ZONES,
  ROAD_MAIN_AXIS, ROAD_CROSS_AXIS, RING_LOW, RING_HIGH,
} from './cityGrid';
import { describeCraftProgress } from './craftProgress';

// ─── HẰNG SỐ LƯỚI ────────────────────────────────────────────────────────────
// ⚠️ TÁI XUẤT từ `cityGrid.js`, KHÔNG phải bản sao — xem chú thích đầu file đó.
export { CITY_GRID_SIZE, BUILDING_ZONES };
export const TILE_W = 64;              // bề rộng ô isometric (px)
export const TILE_H = 32;              // bề cao ô isometric (px) — tỉ lệ 2:1
/**
 * Trần CẢNH VẬT KHỐI (cây, ruộng, đá, đèn, nước) — thứ trần này sinh ra để bảo vệ.
 * ⚠️ KHÔNG tính ô đường vào đây: đường là ô nền PHẲNG, gom hết vào một `InstancedMesh` duy nhất,
 * cùng lớp chi phí với 144 ô nền vốn đã luôn được vẽ. Gộp chung hai thứ khác hẳn nhau về chi phí
 * là cách chắc chắn nhất để một thay đổi ở bên này bóp nghẹt bên kia trong im lặng — đúng chuyện
 * đã suýt xảy ra khi mạng đường tăng từ 23 lên 44 ô (2026-08-14).
 *
 * ⚠️ ĐÂY LÀ TRẦN CỨNG, KHÔNG PHẢI SỐ LƯỢNG THẬT (đổi ở Phase 8D). Số cảnh vật thật của mỗi kỷ nay
 * là `SCATTER_BASE × density` của kỷ đó (`floraStyle.js`): sa mạc UAE thưa 22, thành phố vườn
 * Singapore rậm 48. Trần này chỉ còn là cái chặn trên để một dòng khai sai trong bảng thực vật
 * không thể làm phình cảnh vô hạn.
 */
export const MAX_SCATTER_PROPS = 48;
/** Số cảnh vật của một kỷ có `density = 1`. Trần trên là `MAX_SCATTER_PROPS`. */
const SCATTER_BASE = 34;

/** Số biến thể hình ảnh cho mỗi loại ô nền / cảnh vật. */
const GROUND_VARIANTS = 4;
const PROP_VARIANTS = 3;

// ─── TRA CỨU BẢN VẼ (dựng 1 lần lúc nạp module, thuần) ──────────────────────
/**
 * bpId → { era, rank, label, icon, rarity, type } — `rank` là thứ tự cố định trong kỷ (0..4).
 *
 * `type` (`infrastructure` | `economy` | `defense` | `wonder`) lấy từ `BUILDING_EFFECTS`. Nó nằm ở
 * đây vì đó là thuộc tính BẢN CHẤT của bản vẽ, giống `rarity` — và vì bộ vẽ 3D cần cả ba trục
 * (kỷ × loại × độ hiếm) để chọn hình khối. Để bộ vẽ tự tra `BUILDING_EFFECTS` một lần nữa là nhân
 * đôi cùng một phép tra cứu ở hai tầng khác nhau.
 */
// ⚠️ XUẤT RA (2026-08-12) để `cityMoment.js` tra cứu tên/biểu tượng công trình mà không phải dựng
// bảng thứ hai từ `BLUEPRINT_CATALOG` — đúng lý do bảng này tồn tại ngay từ đầu (xem ghi chú trên).
export const BLUEPRINT_LOOKUP = {};
for (const [eraKey, list] of Object.entries(BLUEPRINT_CATALOG)) {
  const era = Number(eraKey);
  list.forEach((bp, rank) => {
    BLUEPRINT_LOOKUP[bp.id] = {
      era,
      rank,
      label:  bp.label,
      icon:   bp.icon,
      rarity: bp.rarity,
      type:   BUILDING_EFFECTS[bp.id]?.type ?? 'infrastructure',
    };
  });
}

/**
 * Mạng đường. Đàm 2026-08-14: *"đường đi cũng nên phức tạp hơn"* — và anh đúng: trước đó cả thành
 * phố chỉ có **một dấu cộng** (cột x=4 + hàng y=4), tức 23 ô đường trên lưới 144 ô. Một dấu cộng
 * thì không đọc ra là thành phố; nó đọc ra là hai con đường mòn cắt nhau giữa đồng.
 *
 * ⚠️ VÌ SAO CHỌN ĐÚNG BỐN TRỤC NÀY, KHÔNG PHẢI VẼ ĐƯỜNG NGOẰN NGOÈO CHO "TỰ NHIÊN":
 * Năm khu đất công trình nằm ở `BUILDING_ZONES` — bốn góc (x/y trong 1–3 và 8–10) và trung tâm
 * (5–7). Bốn đường thẳng x ∈ {4, 8} và y ∈ {4, 8} là bộ trục DUY NHẤT vừa chia lưới thành các ô
 * phố đều nhau, vừa **chạy sát mép mọi khu đất** — nghĩa là mỗi công trình đều có mặt tiền quay ra
 * đường, đúng như một thành phố thật. Đường ngoằn ngoèo sinh bằng băm thì "tự nhiên" hơn nhưng sẽ
 * cắt qua giữa các khu đất và biến mặt tiền thành ngõ cụt.
 *
 * `ROAD_MAIN_AXIS` (4) là trục CHÍNH — hai đại lộ xuyên suốt; `ROAD_CROSS_AXIS` (8) là trục PHỤ.
 *
 * `variant` KHÔNG phải nhãn trang trí — bộ vẽ 3D đọc nó để quyết bề rộng mặt đường:
 *   `0` đại lộ / ngã tư — rộng hết ô
 *   `1` phố DỌC (chạy theo trục y) — hẹp bề ngang, chừa hai mép cỏ
 *   `2` phố NGANG (chạy theo trục x) — hẹp bề sâu
 * Nhờ hai bề rộng khác nhau mà mắt đọc ra thứ bậc *đại lộ ↔ ngõ phố*; nếu mọi đường cùng một bề
 * rộng thì thêm bao nhiêu ô cũng chỉ ra một tấm lưới đều tăm tắp, không ra một thành phố.
 *
 * ── ĐƯỜNG VÀNH ĐAI (thêm 2026-08-14, Phase 6C) ────────────────────────────────────────────────
 * Đàm: *"mở rộng thêm, làm cầu kỳ lên"*. Nhưng lý do làm việc này KHÔNG phải mỹ thuật — nó là
 * **con số đo được**. Đo `buildGrowthMoment` qua 200 phiên × 5 kỷ × 3 mức công trình, nhánh
 * "xưởng trống" (ca chiếm ~85% số phiên thật):
 *
 *   | mốc phiên | nói được điều gì đó | tin gì            |
 *   |---|---|---|
 *   | 1–44      | **100 %**           | 🛣️ mở đường       |
 *   | 45–60     | 38 %                | 🌳 cảnh vật, 👥 cư dân |
 *   | 61–88     | 6 %                 | 👥 cư dân          |
 *   | 89–120    | 3 %                 | 👥 cư dân          |
 *   | 121+      | **0 %**             | — im lặng hoàn toàn |
 *
 * ⇒ **Mạng đường LÀ động cơ của cảm giác "có gì đó mọc lên"**, và nó tắt đúng ở phiên 44. Mọi thứ
 * còn lại (cư dân, cảnh vật) chỉ đủ kéo lê thêm vài chục phiên rồi cũng hết. Vành đai kéo mốc
 * 100% từ phiên 44 lên phiên 80 — nhân đôi quãng đường mà mỗi phiên đều có thứ để chỉ vào.
 *
 * ⚠️ VÌ SAO ĐẶT VÀNH ĐAI Ở ĐÚNG VIỀN NGOÀI (x/y ∈ {0, 11}), KHÔNG PHẢI VÒNG TRONG:
 * `BUILDING_ZONES` chiếm x/y ∈ 1–3 và 8–10 (bốn góc) + 5–7 (trung tâm). Hàng/cột 0 và 11 là dải
 * DUY NHẤT không chạm khu đất nào — mọi vòng khác sẽ cắt ngang qua giữa các lô và biến mặt tiền
 * thành ngõ cụt, đúng lý do đã loại "đường ngoằn ngoèo cho tự nhiên" ở đoạn trên.
 *
 * ⚠️ VÀNH ĐAI MỞ SAU TOÀN BỘ MẠNG CŨ (`tier`), KHÔNG trộn lẫn theo khoảng cách. Nếu chỉ xếp theo
 * khoảng cách tới tâm thì ô giữa cạnh viền (`(0,5)` — cách tâm 6) sẽ chen lên trước đoạn cuối của
 * đại lộ (`(4,11)` — cách tâm 7), tức vành đai mọc lỗ chỗ khi lưới trong còn dang dở. Thành phố
 * thật lớn từ trong ra ngoài, và **quan trọng hơn**: giữ `tier` nghĩa là **44 ô đầu tiên vẫn y
 * nguyên thứ tự cũ**, nên thành phố Đàm đang có KHÔNG bị sắp xếp lại. Bất biến này có bài test
 * riêng khoá lại.
 */
/** Viền ngoài cùng của lưới — nơi duy nhất không chạm khu đất công trình nào. */

/**
 * Các ô đường, sắp xếp từ TRUNG TÂM ra NGOÀI. Đường được "mở" dần theo số phiên, nên thành phố
 * trông như đang lớn lên thay vì hiện ra trọn vẹn ngay từ phiên đầu.
 *
 * ⚠️ Thứ tự này KHÔNG chỉ để đẹp — nó là một phần của lời hứa "mỗi phiên thấy thành phố lớn thêm":
 * mỗi phiên mở thêm ĐÚNG MỘT ô đường (xem `roadBudget` bên dưới). Mạng cũ có 23 ô nên hết chuyện
 * để mở sau 23 phiên; mạng mới có 44 ô, tức gần gấp đôi số phiên có thứ nhúc nhích.
 */
const ROAD_CELLS = (() => {
  const seen = new Set();
  const cells = [];
  const add = (x, y, variant, tier) => {
    const key = cellKey(x, y);
    if (seen.has(key)) return;
    seen.add(key);
    cells.push({ x, y, variant, tier });
  };
  // ⚠️ NGÃ TƯ CỦA HAI PHỐ PHỤ PHẢI ĐẶT TRƯỚC, và phải mang vai đại lộ (rộng hết ô). Nếu để nó rơi
  // vào một trong hai phố hẹp thì mặt đường bị THẮT LẠI đúng chỗ giao nhau, trông như đường cụt.
  add(ROAD_CROSS_AXIS, ROAD_CROSS_AXIS, 0, 0);
  for (let i = 0; i < CITY_GRID_SIZE; i += 1) {
    add(ROAD_MAIN_AXIS, i, 0, 0);       // đại lộ dọc
    add(i, ROAD_MAIN_AXIS, 0, 0);       // đại lộ ngang
    add(ROAD_CROSS_AXIS, i, 1, 0);      // phố dọc  — hẹp bề ngang
    add(i, ROAD_CROSS_AXIS, 2, 0);      // phố ngang — hẹp bề sâu
  }
  // ── VÀNH ĐAI (tier 1) ──
  // Bốn góc đặt TRƯỚC và mang vai đại lộ, đúng cùng lý do với ngã tư hai phố phụ ở trên: góc là
  // chỗ đoạn dọc gặp đoạn ngang, để nó rơi vào một trong hai bề hẹp thì mặt đường thắt lại ngay
  // khúc cua — trông như đường cụt chứ không như một vành đai chạy vòng.
  for (const cx of [RING_LOW, RING_HIGH]) {
    for (const cy of [RING_LOW, RING_HIGH]) add(cx, cy, 0, 1);
  }
  for (let i = 0; i < CITY_GRID_SIZE; i += 1) {
    add(RING_LOW, i, 1, 1);             // vành đai cạnh trái  — đoạn dọc
    add(RING_HIGH, i, 1, 1);            // vành đai cạnh phải  — đoạn dọc
    add(i, RING_LOW, 2, 1);             // vành đai cạnh trên  — đoạn ngang
    add(i, RING_HIGH, 2, 1);            // vành đai cạnh dưới  — đoạn ngang
  }
  const mid = (CITY_GRID_SIZE - 1) / 2;
  return cells.sort((a, b) => {
    // ⚠️ `tier` XẾP TRƯỚC khoảng cách — xem giải thích ở khối chú thích của mạng đường. Đây cũng
    // chính là thứ giữ cho 44 ô của mạng cũ y nguyên thứ tự, nên thành phố Đàm đang có không bị
    // sắp xếp lại khi vành đai ra đời.
    if (a.tier !== b.tier) return a.tier - b.tier;
    const da = Math.abs(a.x - mid) + Math.abs(a.y - mid);
    const db = Math.abs(b.x - mid) + Math.abs(b.y - mid);
    if (da !== db) return da - db;
    // Đại lộ mở trước phố nhánh ở cùng khoảng cách — thành phố mọc ra từ trục chính, không phải
    // từ mấy mẩu vỉa hè rời rạc.
    if (a.variant !== b.variant) return a.variant - b.variant;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
})();

/**
 * TÊN của đoạn đường đi qua ô này — để câu báo sau mỗi phiên nói được *cái gì* vừa mở, thay vì
 * "vừa mở thêm một đoạn đường" lặp lại 80 lần.
 *
 * ⚠️ THUẦN SUY RA TỪ TOẠ ĐỘ, không có bảng tên nào chép tay. Nếu ai đó đổi `ROAD_MAIN_AXIS` hay
 * thêm một trục mới mà quên sửa hàm này, tên sẽ sai — nên hàm nằm NGAY CẠNH chỗ dựng mạng đường,
 * không nằm ở `cityMoment.js`. Cùng lý do `ROAD_CELL_COUNT` suy ra từ `ROAD_CELLS` chứ không viết
 * cứng: một cái tên viết ở xa nguồn của nó là một lời nói dối đang chờ ngày tới.
 *
 * ⚠️ Trả về một CỤM đầy đủ (đã gồm mạo từ) chứ không phải một danh từ trần, vì tiếng Việt ghép
 * khác nhau tuỳ loại: *"một đoạn đại lộ ngang"* nhưng *"một ngã tư mới"* — ghép sai thì câu đọc
 * ra rất sượng, mà đây là câu Đàm gặp lại sau mỗi phiên.
 *
 * @returns {string} cụm để nối sau chữ "Vừa mở thêm ".
 */
export function describeRoadCell(x, y) {
  const onMainV  = x === ROAD_MAIN_AXIS;
  const onMainH  = y === ROAD_MAIN_AXIS;
  const onCrossV = x === ROAD_CROSS_AXIS;
  const onCrossH = y === ROAD_CROSS_AXIS;

  // Giao của hai trục bất kỳ ⇒ ngã tư. Nói "một đoạn đại lộ" ở đây thì đúng nhưng bỏ mất tin hay
  // nhất: chỗ này vừa NỐI hai con đường vào nhau.
  if ((onMainV || onCrossV) && (onMainH || onCrossH)) return 'một ngã tư mới';
  if (onMainV) return 'một đoạn đại lộ dọc';
  if (onMainH) return 'một đoạn đại lộ ngang';
  if (onCrossV) return 'một đoạn phố dọc';
  if (onCrossH) return 'một đoạn phố ngang';

  // ── VÀNH ĐAI ──
  // ⚠️ CHIA NHỎ CÓ LÝ DO ĐO ĐƯỢC, không phải cho phong phú. Vành đai chiếm 36/80 ô, nên nếu cả 36
  // ô dùng chung một câu thì Đàm đọc đúng một dòng chữ suốt 36 phiên liền — tái diễn y hệt cái
  // bệnh mà `cityMoment.js` đã đo và chữa một lần rồi ("82% số phiên đọc đúng 4 chữ"). Ba cách gọi
  // dưới đây đều SUY TỪ TOẠ ĐỘ, không thêm một dữ kiện nào không có thật.
  // ⚠️ KHÔNG dùng phương hướng (bắc/nam/đông/tây): lưới thành phố không có hướng nào cả, và camera
  // 3D thì xoay được — "phía bắc" nghe hay hơn nhưng nó là một điều bịa.
  const vertical = x === RING_LOW || x === RING_HIGH;
  const horizontal = y === RING_LOW || y === RING_HIGH;
  if (vertical && horizontal) return 'một khúc cua vành đai';
  return vertical ? 'một đoạn vành đai dọc' : 'một đoạn vành đai ngang';
}

/**
 * Tổng số ô đường của mạng lưới — MẪU SỐ để nói "đã mở được bao nhiêu".
 * ⚠️ Suy ra từ chính `ROAD_CELLS`, KHÔNG viết cứng: `cityMoment.js` dùng số này làm mẫu số cho
 * thanh tiến độ sau mỗi phiên, và một mẫu số viết cứng sẽ nói dối ngay lần đầu ai đó thêm một
 * trục đường mới.
 */
export const ROAD_CELL_COUNT = ROAD_CELLS.length;

/**
 * Trần TỔNG (đường + cảnh vật) — hàng rào tuyệt đối để một lỗi ở tầng nào cũng không sinh ra hàng
 * trăm ô.
 *
 * ⚠️ NAY LÀ TỔNG SUY RA, KHÔNG PHẢI SỐ VIẾT CỨNG — và đây là lý do, không phải nới cho tiện.
 * Trước 2026-08-14 nó là `96`, chọn hồi mạng đường có 44 ô (44 + 34 = 78, dư 18). Vành đai đưa
 * đường lên 80 ⇒ 80 + 34 = 114, tức con số 96 **đã lặng lẽ hết đúng** và bài test trần sẽ đỏ.
 * Đó chính xác là kiểu số cũ đi trong im lặng mà cả file này đã gặp nhiều lần (`ROAD_CELL_COUNT`
 * cũng từng phải chuyển sang suy-ra vì lý do y hệt).
 * ⚠️ ĐỌC CHO ĐÚNG NÓ CÒN BẮT ĐƯỢC GÌ: vì là tổng đúng bằng hai trần thành phần, nó **không** còn
 * bắt được lỗi "một tầng vượt trần của chính tầng đó" — hai trần kia mới làm việc ấy. Việc nó còn
 * làm được: chặn ca hai danh sách bị nối nhầm, và cho bên gọi một con số để cấp phát bộ đệm.
 */
export const MAX_PROPS = ROAD_CELL_COUNT + MAX_SCATTER_PROPS;

/** Bảng loại cảnh vật rải rác + trọng số (tổng = 20). Thứ tự cố định → tất định. */
const SCATTER_KINDS = [
  { kind: 'tree',  weight: 8 },
  // ⚠️ `bush` là loại MỚI (Phase 8D) và nó không phải "thêm cho đủ món". Trước đó cảnh vật nhỏ
  // nhất là hòn đá, nên giữa các cây luôn là mặt đất trống trơn — mà tầng cây bụi dưới tán mới là
  // thứ làm một đám cây đọc ra thành mảng rừng thay vì mấy cái cây đứng cạnh nhau. Nó cũng là
  // cảnh vật RẺ NHẤT (2–3 khối, không thân), nên nó là cách tăng độ rậm ít tốn nhất.
  { kind: 'bush',  weight: 5 },
  { kind: 'field', weight: 4 },
  { kind: 'rock',  weight: 3 },
  { kind: 'lamp',  weight: 3 },
  { kind: 'water', weight: 2 },
];
const SCATTER_WEIGHT_TOTAL = SCATTER_KINDS.reduce((sum, item) => sum + item.weight, 0);

// ─── BĂM TẤT ĐỊNH ────────────────────────────────────────────────────────────

/**
 * ⚠️ TÁI XUẤT, KHÔNG PHẢI BẢN SAO. Hàm thật nay ở `src/engine/hashId.js` — phải tách ra vì Phase 7C
 * làm `cityLayout` phụ thuộc ngược vào `city3d/dwellings.js`, tạo một VÒNG import. Xem lý do đầy đủ
 * ở đầu file đó. Dòng này giữ cho sáu module đang `import { hashId } from '../cityLayout'` chạy y
 * nguyên; **tuyệt đối không được** chép lại thân hàm về đây, vì hai bản băm trôi khỏi nhau nghĩa là
 * cùng một `bpId` cho ra hai hình dáng khác nhau ở hai chỗ — sập ADR-007 mà không có gì báo.
 */
export { hashId };

/** Lấy số trong khoảng [0, range) từ một khoá băm — tiện ích nội bộ. */
function hashPick(key, range) {
  return range > 0 ? hashId(key) % range : 0;
}

// ─── ĐẶT VẬT THỂ LÊN LƯỚI ────────────────────────────────────────────────────

function cellKey(x, y) {
  return `${x},${y}`;
}

function isInsideGrid(x, y) {
  return x >= 0 && y >= 0 && x < CITY_GRID_SIZE && y < CITY_GRID_SIZE;
}

/** Kéo một chỉ số ô về trong lưới. Dùng khi một lùm mọc lan ra sát mép bản đồ. */
function clampCell(value) {
  return Math.min(CITY_GRID_SIZE - 1, Math.max(0, value));
}

/**
 * Dò xoắn ốc từ ô gốc ra ngoài cho tới khi gặp ô trống. Thứ tự dò cố định → tất định.
 * Trả về `null` nếu lưới đã kín hoàn toàn (không xảy ra ở quy mô thật, chỉ để phòng thủ).
 */
function findFreeCell(startX, startY, occupied) {
  for (let radius = 0; radius < CITY_GRID_SIZE; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        // chỉ xét viền của vòng hiện tại, phần bên trong đã dò ở vòng trước
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== radius) continue;
        const x = startX + dx;
        const y = startY + dy;
        if (!isInsideGrid(x, y)) continue;
        if (!occupied.has(cellKey(x, y))) return { x, y };
      }
    }
  }
  return null;
}

/**
 * Vị trí cố định của MỘT công trình trong lưới.
 *
 * @param {string} bpId          id bản vẽ
 * @param {Set<string>} [occupiedSet]  các ô đã bị chiếm, dạng `"x,y"`
 * @returns {{x:number,y:number}} toạ độ ô, luôn nằm trong [0, CITY_GRID_SIZE)
 *
 * Bản vẽ có trong `BLUEPRINT_CATALOG` → neo vào khu đất riêng theo thứ hạng (không bao giờ va chạm
 * với công trình cùng kỷ). Id lạ (dữ liệu hỏng từ cloud) → neo bằng băm trên toàn lưới rồi dò xoắn
 * ốc. Dò xoắn ốc chỉ là lưới an toàn: với dữ liệu hợp lệ nó không bao giờ phải chạy.
 */
export function placeBuilding(bpId, occupiedSet = new Set()) {
  const occupied = occupiedSet instanceof Set ? occupiedSet : new Set();
  const meta = BLUEPRINT_LOOKUP[bpId];
  const zone = meta ? BUILDING_ZONES[meta.rank] : null;

  const anchorX = zone
    ? zone.x + hashPick(`x|${bpId}`, zone.w)
    : hashPick(`x|${bpId}`, CITY_GRID_SIZE);
  const anchorY = zone
    ? zone.y + hashPick(`y|${bpId}`, zone.h)
    : hashPick(`y|${bpId}`, CITY_GRID_SIZE);

  if (!occupied.has(cellKey(anchorX, anchorY))) return { x: anchorX, y: anchorY };
  return findFreeCell(anchorX, anchorY, occupied) ?? { x: anchorX, y: anchorY };
}

// ─── CẢNH VẬT ────────────────────────────────────────────────────────────────

function pickScatterKind(seed) {
  let roll = hashPick(seed, SCATTER_WEIGHT_TOTAL);
  for (const item of SCATTER_KINDS) {
    if (roll < item.weight) return item.kind;
    roll -= item.weight;
  }
  return SCATTER_KINDS[0].kind;
}

/**
 * ─── PHÂN BỐ: VÌ SAO RẢI ĐỀU LÀ SAI (Phase 8D) ──────────────────────────────
 *
 * Bản cũ bốc cho mỗi cảnh vật một ô hoàn toàn độc lập với mọi cảnh vật khác. Nghe thì "ngẫu nhiên",
 * nhưng kết quả trên màn hình lại đọc ra rất máy móc, vì hai lý do khác nhau:
 *
 *   (a) **Mọi thứ nằm ĐÚNG tâm ô.** Đo trước khi sửa: 34/34 cảnh vật ở toạ độ nguyên. Mắt người
 *       cực giỏi bắt lưới — chỉ cần vài vật thẳng hàng là cả cảnh lộ ra cái bàn cờ bên dưới, đúng
 *       thứ Phase 8C vừa tốn công xoá khỏi mặt đất. Lệch mỗi vật một chút là xong, tốn 0 tam giác.
 *   (b) **Ngẫu nhiên đều KHÔNG giống thiên nhiên.** Cây ngoài đời mọc thành lùm: hạt rơi gần cây
 *       mẹ, bóng râm giữ ẩm cho cây con. Nên rừng thật là "chỗ dày, chỗ trống", còn rải đều là
 *       "chỗ nào cũng lưng lửng" — và cái lưng lửng ấy chính là dấu vân tay của máy móc.
 *
 * ⇒ Cảnh vật nay mọc theo LÙM: bốn ô đầu tiên rơi vào chỗ mới trở thành "tâm lùm"; những vật sau có
 *   7/10 khả năng bám vào một lùm đã có thay vì bốc ô mới. Nước và ruộng KHÔNG bám lùm (một cái ao
 *   ở giữa ba cái ao khác là chuyện lạ), đèn cũng không (đèn thuộc về phố, không thuộc về đám).
 *
 * ⚠️ CON SỐ NGHIỆM THU, đo bằng chỉ số Clark–Evans (khoảng cách trung bình tới hàng xóm gần nhất
 *   chia cho kỳ vọng nếu rải ngẫu nhiên; R < 1 = tụ, R > 1 = rải đều). Bật/tắt cơ chế ở 7 kỷ:
 *   34 phiên **1,051 → 0,923** · 80 phiên **0,914 → 0,782**. Hai cỡ thành phố, cùng một chiều,
 *   cùng độ lớn ≈ 0,13 — đó mới là thứ phân biệt tín hiệu với nhiễu, chứ một lần đo thì không.
 *   Ghi lại vì phiên sau chỉnh `GROVE_*` mà không đo lại thì không có cách nào biết đã làm hỏng.
 */
const GROVE_JOIN_CHANCE = 7;      // trên 10
const GROVE_RADIUS = 2;           // ô, tính từ tâm lùm
/**
 * ⚠️ SỐ LÙM PHẢI CÓ TRẦN, VÀ CHỈ HẠT ĐẦU MỚI ĐƯỢC LÀM TÂM LÙM — bản đầu của Phase 8D thiếu cả hai
 * và **phép thử ngược chứng minh cả cơ chế lùm chẳng làm gì cả**: bật/tắt nó thì chỉ số phân tán
 * đứng yên tới hai chữ số thập phân ở cả bốn kỷ đo thử. Lý do: mỗi cảnh vật vừa đặt lại được ghi
 * thành một tâm lùm mới, nên sau chục ô thì "bám vào một lùm" ≈ "bám vào một cảnh vật bất kỳ đã
 * có", tức đúng bằng rải đều. Một cơ chế tụ tập mà tâm tụ tập nhiều bằng số vật thì không tụ được.
 *
 * Đây cũng là lời nhắc vì sao luật "một bài test chưa từng thấy đỏ thì chưa phải test" phải áp cho
 * cả PHÉP ĐO: nhìn ảnh thì thấy có lùm cây thật, và nếu dừng ở đó thì tôi đã tin một cơ chế chết.
 */
const MAX_GROVES = 4;

/**
 * Vào một lùm loại `X` thì được mọc thêm những loại nào. Bụi len vào lùm cây và lùm đá — đó là
 * tầng cây bụi dưới tán, thứ làm cho một đám cây trông như một mảng rừng chứ không như mấy cái cây
 * đứng cạnh nhau.
 */
const GROVE_COMPANIONS = {
  tree: ['tree', 'tree', 'bush'],
  bush: ['bush', 'tree'],
  rock: ['rock', 'bush'],
};

/**
 * Cảnh vật được phép lệch khỏi tâm ô bao nhiêu (đơn vị ô).
 *
 * ⚠️ NƯỚC VÀ RUỘNG PHẢI BẰNG 0, VÀ ĐÓ KHÔNG PHẢI SỰ THẬN TRỌNG THỪA: hai thứ này rộng gần trọn ô
 * (0,94–0,95), nên lệch đi một chút là chúng thò sang ô bên và cắm vào chân nhà hàng xóm. Chỉ
 * những vật NHỎ HƠN ô mới có chỗ mà lệch. Đèn lệch ít hơn cây vì đèn là vật do người dựng — xiêu
 * vẹo quá thì mất luôn cảm giác có quy hoạch, mà đó lại đúng là thứ phân biệt phố với rừng.
 */
const PROP_JITTER = { tree: 0.34, bush: 0.38, rock: 0.32, lamp: 0.13, water: 0, field: 0 };

/**
 * Phần đất trống TỐI ĐA được phủ cảnh vật. Phần còn lại phải là mặt đất trần.
 *
 * ⚠️ CON SỐ NÀY TỒN TẠI VÌ MỘT PHÉP ĐO ĐÃ LẬT NGƯỢC MỘT KẾT LUẬN. Sau khi cơ chế lùm chứng minh
 * được là có tác dụng ở 34 phiên, tôi đếm thử ô trống của một thành phố TRƯỞNG THÀNH (80 phiên) và
 * kết quả là **10/15 kỷ có ĐÚNG 0 ô đất trống** — cả lưới 12×12 kín đặc, không sót một mảng đất
 * nào. Ở trạng thái ấy thì mọi cơ chế phân bố đều vô nghĩa: khi mọi ô trống đều bị lấp thì không
 * còn "chỗ dày, chỗ trống" nào để mà tụ, và cảnh quay về đúng cái "rải đều trên lưới" mà cả Phase
 * 8D sinh ra để xoá. Cơ chế lùm vẫn chạy, chỉ là nó không còn gì để sắp xếp.
 *
 * Và một nửa lỗi ấy là do CHÍNH Phase 8D: trần cảnh vật vốn là 34, tôi nâng lên 48 để mật độ theo
 * kỷ có chỗ mà khác nhau — nhưng nâng trần trong một cái lưới hữu hạn thì thứ tăng thêm không phải
 * "mật độ", mà là "tỉ lệ lấp đầy", và nó tăng cho tới khi chạm trần cứng 144 ô. Bài học cũ của dự
 * án dưới một hình dạng mới: **một con số tuyệt đối không diễn đạt được một luật nói về QUAN HỆ.**
 * "Rậm hơn kỷ khác" là quan hệ giữa các kỷ; "còn chừa đất trống" là quan hệ với chỗ đất còn lại.
 * Trần tuyệt đối 48 không nhìn thấy cái nào trong hai thứ đó.
 *
 * ⚠️ VÀ CHÍNH TỈ LỆ NÀY PHẢI MANG MẬT ĐỘ CỦA KỶ, chứ không được là một con số chung. Bản vá đầu để
 * nó cố định 0,72 và đo lại thì kỷ 14 (Singapore, mật độ 1,42 — rậm nhất) và kỷ 15 (UAE, 0,66 —
 * thưa nhất) **ra cùng 21 cảnh vật**: ở thành phố trưởng thành thì nhà dân ăn hết đất, chỉ còn 30 ô
 * trống, nên cái trần chung đè bẹp cả hai đầu và xoá sạch thứ mà `density` sinh ra để nói. Sửa
 * xong: 23 với 10 — đọc ra được ngay bằng mắt.
 *
 * Hai cái trần, hai việc KHÁC nhau, và cần cả hai vì chỗ thắt cổ chai đổi theo tuổi thành phố:
 *   · `SCATTER_BASE × density` — SỐ CÂY của kỷ. Trói lúc thành phố còn TRẺ (đất mênh mông).
 *   · `freeGround × coverShare` — PHẦN ĐẤT được phủ. Trói lúc thành phố đã ĐÔNG (đất hiếm).
 * Bỏ vế nào cũng có một quãng đời thành phố mất hẳn mật độ theo kỷ.
 *
 * Dải 0,28–0,80 chọn bằng phép đo chứ không bằng cảm giác: nó để lại 7–21 ô đất trần ở mọi kỷ
 * (bảng đầy đủ trong `BAN_GIAO.md`), đủ để mắt đọc ra khoảng thở giữa các lùm mà chưa làm sa mạc
 * UAE trông hoang tàn.
 */
const COVER_BASE = 0.55;
const COVER_MIN = 0.28;
const COVER_MAX = 0.80;

function jitterFor(kind, seed) {
  const range = PROP_JITTER[kind] ?? 0;
  if (range === 0) return { ox: 0, oy: 0 };
  // 0..200 → −1..1, rồi nhân biên độ. Dùng `hashPick` để cùng một ô luôn ra cùng một độ lệch.
  return {
    ox: ((hashPick(`${seed}|ox`, 201) - 100) / 100) * range,
    oy: ((hashPick(`${seed}|oy`, 201) - 100) / 100) * range,
  };
}

function safeCount(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * Cảnh vật trang trí suy ra từ SỐ LIỆU — làm thành phố trông đông đúc dần mà không tốn một byte
 * state nào.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {number} input.buildingCount
 * @param {number} input.sessionCount   số phiên đã làm trong kỷ đó
 * @param {number} input.streakLength
 * @param {Set<string>} [input.occupied] ô đã bị công trình chiếm (để cảnh vật không đè lên nhà)
 * @returns {Array<{kind:string,x:number,y:number,variant:number}>} tối đa `MAX_PROPS` phần tử
 */
export function deriveProps({ era, buildingCount, sessionCount, streakLength, occupied } = {}) {
  const eraNum   = Number.isFinite(era) ? era : 1;
  const nBuild   = safeCount(buildingCount);
  const nSession = safeCount(sessionCount);
  const nStreak  = safeCount(streakLength);

  const taken = occupied instanceof Set ? new Set(occupied) : new Set();
  const props = [];

  // (1) Đường sá — mở dần từ trung tâm ra ngoài theo số phiên. Chưa có công trình nào thì chưa có
  //     đường (bãi đất trống mới khai hoang).
  const roadBudget = nBuild > 0 ? Math.min(ROAD_CELLS.length, nSession) : 0;
  let roadsPlaced = 0;
  for (const cell of ROAD_CELLS) {
    if (roadsPlaced >= roadBudget) break;
    const key = cellKey(cell.x, cell.y);
    if (taken.has(key)) continue;
    taken.add(key);
    props.push({ kind: 'road', x: cell.x, y: cell.y, variant: cell.variant });
    roadsPlaced += 1;
  }

  // (2) Cây cối / ruộng / đá / đèn / nước — rải theo băm, không bao giờ vượt trần riêng của mình.
  // ⚠️ TRẦN CỦA CẢNH VẬT ĐẾM RIÊNG, KHÔNG TRỪ PHẦN ĐƯỜNG.
  // Bản cũ trừ chung một trần `MAX_PROPS` cho cả hai, và nó ổn khi mạng đường chỉ có 23 ô. Mạng
  // mới có 44 ô ⇒ nếu vẫn trừ chung thì tới phiên thứ 44 đường ăn gần hết trần và **cây cối biến
  // mất dần** đúng lúc thành phố đông đúc nhất — một cái bẫy im lặng, không có gì đỏ lên.
  // Tách trần là ĐÚNG với chi phí thật chứ không phải nới cho tiện: đường là ô nền PHẲNG, gom vào
  // một `InstancedMesh` duy nhất cùng lớp chi phí với 144 ô nền vốn đã luôn vẽ; còn cây/đá/đèn mới
  // là vật thể khối, và chính chúng là thứ trần `MAX_PROPS` sinh ra để bảo vệ.
  //
  // ⚠️ MẬT ĐỘ THEO KỶ (Phase 8D): sa mạc UAE thưa, thành phố vườn Singapore rậm. Con số nằm ở
  // `floraStyle.js` cùng chỗ với danh sách loài cây — vì "ở đây mọc cây gì" và "mọc dày tới đâu"
  // là hai vế của cùng một câu trả lời, tách ra hai file thì sớm muộn chúng nói ngược nhau.
  const flora = getFloraStyle(eraNum);
  const density = flora.density ?? 1;
  const undergrowth = flora.undergrowth ?? 0;
  // Đất còn trống NGAY LÚC NÀY (sau nhà, nhà dân và đường) — phải đọc ở đây chứ không phải đầu hàm,
  // vì `taken` vừa nuốt thêm 78–80 ô đường ở bước (1) ngay phía trên.
  const freeGround = CITY_GRID_SIZE * CITY_GRID_SIZE - taken.size;
  const coverShare = Math.min(COVER_MAX, Math.max(COVER_MIN, COVER_BASE * density));
  const scatterBudget = Math.min(
    MAX_SCATTER_PROPS,
    Math.round(SCATTER_BASE * density),
    Math.floor(freeGround * coverShare),
    2 * nBuild + Math.floor(nSession / 2) + Math.floor(nStreak / 2),
  );

  const groves = [];
  for (let i = 0; props.length < roadsPlaced + scatterBudget; i += 1) {
    // chặn vòng lặp vô hạn khi lưới gần kín
    if (i > CITY_GRID_SIZE * CITY_GRID_SIZE) break;
    const seed = `p|${eraNum}|${i}`;

    // Bám vào một lùm đã có, hay khai một chỗ mới? (Xem ghi chú dài ở `GROVE_JOIN_CHANCE`.)
    const joinGrove = groves.length > 0 && hashPick(`${seed}|g`, 10) < GROVE_JOIN_CHANCE;
    let anchorX;
    let anchorY;
    let kind;
    if (joinGrove) {
      const grove = groves[hashPick(`${seed}|gi`, groves.length)];
      const span = GROVE_RADIUS * 2 + 1;
      anchorX = clampCell(grove.x + hashPick(`${seed}|gx`, span) - GROVE_RADIUS);
      anchorY = clampCell(grove.y + hashPick(`${seed}|gy`, span) - GROVE_RADIUS);
      const companions = GROVE_COMPANIONS[grove.kind];
      kind = companions[hashPick(`${seed}|gk`, companions.length)];
    } else {
      anchorX = hashPick(`${seed}|x`, CITY_GRID_SIZE);
      anchorY = hashPick(`${seed}|y`, CITY_GRID_SIZE);
      kind = pickScatterKind(`${seed}|k`);
    }
    // TẦNG CÂY BỤI theo kỷ: một phần ô "cây" hạ xuống thành bụi. Manchester công nghiệp đầy đất
    // hoang mọc bụi hoang; vườn ô-liu Toscana thì đất giữa các hàng bị cày sạch.
    if (kind === 'tree' && hashPick(`${seed}|u`, 100) < Math.round(undergrowth * 100)) {
      kind = 'bush';
    }

    const cell = taken.has(cellKey(anchorX, anchorY))
      ? findFreeCell(anchorX, anchorY, taken)
      : { x: anchorX, y: anchorY };
    if (!cell) break;
    taken.add(cellKey(cell.x, cell.y));
    // CHỈ hạt gieo ở chỗ mới mới thành tâm lùm — vật bám vào lùm thì không được đẻ ra lùm nữa.
    if (!joinGrove && GROVE_COMPANIONS[kind] && groves.length < MAX_GROVES) {
      groves.push({ x: cell.x, y: cell.y, kind });
    }
    props.push({
      kind,
      x:       cell.x,
      y:       cell.y,
      variant: hashPick(`${seed}|v`, PROP_VARIANTS),
      // Lệch khỏi tâm ô. Bộ vẽ 2D bỏ qua hai trường này — nó vẽ theo ô, và một ô isometric thì
      // lệch nửa ô cũng không đọc ra; bộ vẽ 3D thì dùng, vì ở đó cái lưới nhìn thấy được.
      ...jitterFor(kind, seed),
    });
  }

  return props;
}

// ─── NỀN ─────────────────────────────────────────────────────────────────────

/** 144 ô nền, biến thể suy từ băm để mặt đất không phẳng lì một màu. */
function buildGround(era) {
  const ground = [];
  for (let y = 0; y < CITY_GRID_SIZE; y += 1) {
    for (let x = 0; x < CITY_GRID_SIZE; x += 1) {
      ground.push({ x, y, variant: hashPick(`g|${era}|${x}|${y}`, GROUND_VARIANTS) });
    }
  }
  return ground;
}

// ─── HÀM CHÍNH ───────────────────────────────────────────────────────────────

/**
 * Thứ tự vẽ isometric: vật có `(x + y)` nhỏ hơn nằm PHÍA SAU, phải vẽ trước để vật phía trước đè
 * lên đúng cách. Đây là lỗi kinh điển của render isometric — có test khoá lại.
 */
function byIsometricDepth(a, b) {
  const da = a.x + a.y;
  const db = b.x + b.y;
  if (da !== db) return da - db;
  if (a.x !== b.x) return a.x - b.x;
  return a.y - b.y;
}

/**
 * Suy ra toàn bộ bố cục một thành phố.
 *
 * @param {object} input
 * @param {string[]} input.built            bpId đã xây trong kỷ này (id lạ/khác kỷ sẽ bị bỏ qua)
 * @param {Record<string, number>} [input.levels]  { [bpId]: 1|2|3 } — thiếu thì mặc định 1
 * @param {number} input.era                1..15
 * @param {object} [input.stats]            { sessionCount, streakLength } — thiếu vẫn chạy
 * @param {Array}  [input.pending]          hàng đợi xây dựng, ĐÚNG shape của `craftingQueue` trong
 *                                          store: `{ bpId, sessionsRemaining }`. Thiếu ⇒ không có
 *                                          giàn giáo nào, và kết quả GIỐNG HỆT bản cũ từng byte.
 * @returns {{era:number, gridSize:number, buildings:Array, props:Array, scaffolds:Array,
 *            ground:Array, isEmpty:boolean}}
 */
export function computeCityLayout({ built, levels, era, stats, pending } = {}) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const levelMap = levels && typeof levels === 'object' ? levels : {};
  const sessionCount = safeCount(stats?.sessionCount);
  const streakLength = safeCount(stats?.streakLength);

  // Chỉ giữ bản vẽ CÓ THẬT và ĐÚNG kỷ đang xem; khử trùng lặp. Sắp xếp theo thứ hạng catalog để
  // thứ tự mảng đầu vào không ảnh hưởng kết quả.
  const seen = new Set();
  const validIds = (Array.isArray(built) ? built : [])
    .filter((bpId) => {
      const meta = BLUEPRINT_LOOKUP[bpId];
      if (!meta || meta.era !== eraNum) return false;
      if (seen.has(bpId)) return false;
      seen.add(bpId);
      return true;
    })
    .sort((a, b) => BLUEPRINT_LOOKUP[a].rank - BLUEPRINT_LOOKUP[b].rank);

  const occupied = new Set();
  const buildings = validIds.map((bpId) => {
    const meta = BLUEPRINT_LOOKUP[bpId];
    const { x, y } = placeBuilding(bpId, occupied);
    occupied.add(cellKey(x, y));
    const rawLevel = levelMap[bpId];
    return {
      bpId,
      x,
      y,
      level:  Number.isFinite(rawLevel) ? Math.max(1, Math.min(3, Math.floor(rawLevel))) : 1,
      label:  meta.label,
      icon:   meta.icon,
      rarity: meta.rarity,
      type:   meta.type,
      // ĐẶC QUYỀN công trình này đang mang lại. Cùng nguồn với `reward` của giàn giáo, chỉ khác:
      // giàn giáo hứa (`label` ngắn cho một dòng danh sách), còn công trình đã xây thì đang TRẢ
      // thật, nên kèm luôn `summary` để thẻ thông tin nói được nó làm gì.
      perk:   BUILDING_EFFECTS[bpId]?.perk
        ? {
          label: BUILDING_EFFECTS[bpId].perk.label ?? null,
          summary: BUILDING_EFFECTS[bpId].perk.summary ?? null,
        }
        : null,
    };
  });

  // ── Công trình ĐANG XÂY → giàn giáo ───────────────────────────────────────
  //
  // ⚠️ VÌ SAO ĐÂY LÀ THỨ ĐÁNG GIÁ NHẤT MÀ BỐ CỤC NÀY CÓ THỂ THÊM, DÙ CHỈ LÀ MẤY CÁI CỘT GỖ:
  // trước nó, thành phố chỉ đổi khi một công trình HOÀN THÀNH — mà công trình rẻ nhất cũng ngốn 4
  // phiên, đắt nhất 11 phiên. Nghĩa là Đàm có thể làm việc cả tuần liền và thành phố **không hề
  // nhúc nhích một pixel nào**. Vòng lặp "làm việc → thấy thành phố lớn lên" đứt đúng ở quãng dài
  // nhất, tức là đúng lúc cần nó nhất. Giàn giáo mọc cao thêm một nấc sau MỖI phiên thì phần
  // thưởng nhìn thấy được xuất hiện ở mỗi phiên, chứ không phải mỗi tuần.
  //
  // ⚠️ ĐẶT GIÀN GIÁO TRƯỚC KHI GỌI `deriveProps`, và thứ tự này là bắt buộc: `deriveProps` né các ô
  // trong `occupied`, nên nếu đặt sau thì cây cối sẽ mọc ngay giữa công trường.
  //
  // ⚠️ NHẬN THẲNG SHAPE CỦA `craftingQueue` (`sessionsRemaining`), KHÔNG bắt bên gọi tự tính sẵn
  // `progress`. Tri thức "còn mấy phiên nữa trên tổng bao nhiêu" chỉ nên nằm ở MỘT chỗ; để hai
  // màn hình (tab Thành Phố và lớp nền trang chủ) tự tính thì sớm muộn chúng sẽ tính lệch nhau và
  // cùng một công trình hiện hai độ cao khác nhau ở hai chỗ.
  const pendingSeen = new Set();
  const scaffolds = (Array.isArray(pending) ? pending : [])
    .filter((item) => {
      const bpId = item?.bpId;
      const meta = BLUEPRINT_LOOKUP[bpId];
      if (!meta || meta.era !== eraNum) return false;
      // Đã xây xong rồi thì công trình thật đứng đó, không thể còn giàn giáo. Ca này xảy ra thật
      // khi state hơi lệch nhau một nhịp (phiên vừa xong, hàng đợi chưa kịp dọn).
      if (seen.has(bpId) || pendingSeen.has(bpId)) return false;
      pendingSeen.add(bpId);
      return true;
    })
    .map((item) => {
      const { x, y } = placeBuilding(item.bpId, occupied);
      occupied.add(cellKey(x, y));
      // ⚠️ TIẾN ĐỘ TÍNH Ở `craftProgress.js`, KHÔNG tính tại chỗ nữa (Phase 4E). Trước đây chính
      // con số này được tính ở đây MỘT KIỂU (kẹp đủ mọi biên) và ở `BuildingWorkshop.jsx` một kiểu
      // KHÁC (không kẹp gì) — nên cùng một công trình lệch dữ liệu hiện "-4/2 phiên" ở Xưởng trong
      // khi ở đây vẫn vẽ đúng. Một luật chỉ được có một công thức.
      const { total, remaining, ratio: progress } = describeCraftProgress(item.bpId, item.sessionsRemaining);
      const meta = BLUEPRINT_LOOKUP[item.bpId];
      return {
        bpId: item.bpId, x, y, progress,
        label: meta.label,
        icon: meta.icon,
        // ⚠️ Đem theo cả SỐ PHIÊN CÒN LẠI, không chỉ tỉ lệ. Màn hình cần nói được "còn 2 phiên nữa"
        // — một con số Đàm hành động được ngay hôm nay — chứ không phải "đã xong 67%", thứ nghe thì
        // chính xác mà chẳng bảo anh phải làm gì. Tính ở đây để mọi màn hình nói cùng một con số.
        remaining,
        total,
        // PHẦN THƯỞNG — nhãn ngắn của đặc quyền công trình sẽ mở khoá ("Cả xưởng tăng tốc",
        // "-25% RP bản vẽ kỷ 6-10"). Thiếu số phiên còn lại thì Đàm biết CÒN BAO XA; thiếu dòng này
        // thì anh vẫn không biết ĐI TỚI ĐÓ ĐỂ LÀM GÌ. Lấy `label` chứ không lấy `summary` vì summary
        // dài cả câu, nhét vào một dòng danh sách sẽ tràn — chỗ đọc summary là màn Kho báu.
        reward: BUILDING_EFFECTS[item.bpId]?.perk?.label ?? null,
      };
    });

  // ── NHÀ DÂN (Phase 7C) ────────────────────────────────────────────────────
  //
  // ⚠️ ĐẶT TRƯỚC `deriveProps`, VÀ THỨ TỰ NÀY BẮT BUỘC — cùng lý do đã buộc giàn giáo phải đứng
  // trước nó: `deriveProps` né mọi ô trong `occupied`, nên đặt sau thì cây cối sẽ mọc xuyên qua
  // giữa nhà dân. Đây là chỗ dễ sai mà **không có gì đỏ lên**: bố cục vẫn hợp lệ, chỉ là một cái
  // cây mọc trong phòng khách.
  const dwellings = deriveDwellings({
    era: eraNum,
    buildingCount: buildings.length,
    sessionCount,
  });
  for (const home of dwellings) occupied.add(cellKey(home.x, home.y));

  const props = deriveProps({
    era: eraNum,
    buildingCount: buildings.length,
    sessionCount,
    streakLength,
    occupied,
  });

  return {
    era:       eraNum,
    gridSize:  CITY_GRID_SIZE,
    buildings: buildings.sort(byIsometricDepth),
    dwellings: dwellings.sort(byIsometricDepth),
    props:     props.sort(byIsometricDepth),
    scaffolds: scaffolds.sort(byIsometricDepth),
    ground:    buildGround(eraNum),
    // ⚠️ "Trống" vẫn CHỈ tính công trình đã xây. Một bãi đất chỉ có giàn giáo thì đúng là chưa có
    // gì để khoe — và `CityBackdrop` dựa vào cờ này để quyết định có vẽ lớp nền ở trang chủ không.
    isEmpty:   buildings.length === 0,
  };
}

/**
 * Đổi toạ độ ô → toạ độ pixel trên màn hình (isometric 2:1).
 * Dùng chung cho mọi lớp vẽ để nền/nhà/cảnh vật không bao giờ lệch nhau.
 */
export function cellToScreen(x, y) {
  return {
    screenX: (x - y) * (TILE_W / 2),
    screenY: (x + y) * (TILE_H / 2),
  };
}
