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
import { getGroundCoverStyle, pickCoverKind } from './city3d/groundCoverStyle';
import { hashId } from './hashId';
import { CITY_GRID_SIZE } from './cityGrid';
import { planIsRoad, planRoadCellCount, planRoadCells, planWonderZone } from './city3d/cityPlan';
import { describeCraftProgress } from './craftProgress';

// ─── HẰNG SỐ LƯỚI ────────────────────────────────────────────────────────────
// ⚠️ TÁI XUẤT từ `cityGrid.js`, KHÔNG phải bản sao — xem chú thích đầu file đó.
export { CITY_GRID_SIZE };
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
 * ─── MẠNG ĐƯỜNG: NAY SINH THEO KỶ, KHÔNG CÒN LÀ BỐN TRỤC CỐ ĐỊNH (Phase 20, ADR-060) ──────────
 *
 * Trước 2026-08-24, file này tự dựng mạng đường từ bốn hằng số ở `cityGrid.js`
 * (`ROAD_LINES = {0, 4, 8, 11}`) — **giống hệt nhau ở cả 15 kỷ**, đối xứng bốn chiều hoàn hảo.
 * Đàm nhìn bản quét rồi gọi đúng tên nó: *"rất bài bản và xếp chồng lên nhau"*, *"không phải cứ
 * 3x3 được"*. Nay đường là RANH GIỚI GIỮA CÁC THỬA ĐẤT, và thửa thì sinh theo kỷ ở
 * `city3d/cityPlan.js`. Hệ quả đo được: số ô đường đi từ **34** (kỷ 1, vài mảng nhà rất lớn) tới
 * **92** (kỷ 11, Manhattan) thay vì đúng 80 ở mọi kỷ.
 *
 * ⚠️ BA LỜI HỨA CŨ ĐƯỢC GIỮ NGUYÊN, và chúng là lý do bộ sinh mới phải bắt chước bộ cũ chứ không
 * được tự do:
 *   (1) **`variant` vẫn là ba vai** mà bộ vẽ 3D đọc để quyết bề rộng mặt đường: `0` đại lộ / ngã tư
 *       (rộng hết ô) · `1` phố DỌC (hẹp bề ngang) · `2` phố NGANG (hẹp bề sâu). Không có thứ bậc
 *       bề rộng thì thêm bao nhiêu ô cũng chỉ ra một tấm lưới đều.
 *   (2) **Ngã tư luôn mang vai đại lộ.** Để nó rơi vào một bề hẹp thì mặt đường THẮT LẠI đúng chỗ
 *       giao nhau, trông như đường cụt (luật từ Phase 6C).
 *   (3) **Thứ tự mở là `tier` → khoảng cách tới tâm → vai → y → x**, tức thành phố mọc từ TRONG ra
 *       NGOÀI và vành đai mở SAU toàn bộ mạng trong. Mỗi phiên mở đúng một ô, nên thứ tự này chính
 *       là thứ Đàm nhìn thấy lớn lên — nó là một lời hứa, không phải chi tiết cài đặt.
 *
 * ⚠️ VÀ LÝ DO SÂU HƠN ĐỂ KHÔNG BỎ MẠNG ĐƯỜNG ĐI: nó là ĐỘNG CƠ của cảm giác "có gì đó mọc lên".
 * Đo `buildGrowthMoment` qua 200 phiên × 5 kỷ × 3 mức công trình, nhánh "xưởng trống" (~85% số
 * phiên thật): phiên 1–44 nói được điều gì đó **100%** số lần, 45–60 còn 38%, 61–88 còn 6%, từ 121
 * trở đi **0%**. Mạng đường tắt ở đâu thì cảm giác lớn lên tắt ở đó. Vì vậy kỷ nào nhiều thửa hơn
 * thì cũng có nhiều phiên "có thứ để chỉ vào" hơn — một hệ quả, không phải một cái núm riêng.
 */

/**
 * TÊN của đoạn đường đi qua ô này — để câu báo sau mỗi phiên nói được *cái gì* vừa mở, thay vì
 * "vừa mở thêm một đoạn đường" lặp lại 80 lần.
 *
 * ⚠️ ĐỌC THẲNG TỪ Ô MÀ BỘ SINH VỪA DỰNG, không suy lại từ toạ độ. Bản trước Phase 20 hỏi
 * `x === ROAD_MAIN_AXIS` — đúng chừng nào mạng đường còn là bốn trục cố định, và **chết lặng lẽ**
 * ngay khi bộ xương sinh theo kỷ: mọi ô sẽ rơi vào nhánh cuối và Đàm đọc đúng một câu suốt cả kỷ.
 * Đây chính là bẫy "một luật hai công thức" — nay chỉ còn một công thức, ở `cityPlan.js`, và hàm
 * này chỉ dịch nó sang tiếng Việt.
 *
 * ⚠️ Trả về một CỤM đầy đủ (đã gồm mạo từ) chứ không phải một danh từ trần, vì tiếng Việt ghép
 * khác nhau tuỳ loại: *"một đoạn đại lộ ngang"* nhưng *"một ngã tư mới"* — ghép sai thì câu đọc
 * ra rất sượng, mà đây là câu Đàm gặp lại sau mỗi phiên.
 *
 * @returns {string} cụm để nối sau chữ "Vừa mở thêm ".
 */
export function describeRoadCell(x, y, era) {
  const cell = planRoadCells(era).find((c) => c.x === x && c.y === y);
  if (!cell) return 'một đoạn đường';

  // ⚠️ "CHỖ HAI CON ĐƯỜNG GẶP NHAU" PHẢI HỎI HÀNG XÓM, KHÔNG HỎI CỜ `junction` — VÀ ĐÂY LÀ MỘT
  // NHÁNH CHẾT ĐÃ ĐO ĐƯỢC, KHÔNG PHẢI MỘT LO XA. Bản đầu của Phase 20 giữ nguyên câu cũ
  // `if (cell.junction) return 'một ngã tư mới'`, và nó **không bao giờ chạy**: `junction` nghĩa là
  // "ô này nằm trên CẢ HAI lát cắt", mà một nhát cắt BSP luôn nằm gọn TRONG vùng của nó nên nó
  // không thể đè lên một nhát cũ — hai con đường gặp nhau ở hình chữ T, tức hai ô KỀ NHAU chứ
  // không phải một ô chung. Đo đủ 15 kỷ: `junction` chỉ bật ở 4 góc vành đai, mà nhánh vành đai
  // đứng TRƯỚC nên câu "một ngã tư mới" chưa từng tới được mắt Đàm một lần nào.
  // Trong khi đó ngã tư THẬT (ô có đủ 4 hàng xóm là đường) có 0–7 ô mỗi kỷ, và ngã ba 0–12 ô.
  // ⇒ Hỏi đúng thứ mắt đọc ra: **đếm hàng xóm**. Đây là câu hỏi của tầng KỂ CHUYỆN, không đụng một
  // chữ nào tới `variant` — bề rộng chỗ nối đã do cơ chế "lõi + bốn cánh tay" của ADR-031 lo, và
  // nó lo đúng cho cả hình chữ T.
  const nb = (planIsRoad(era, x + 1, y) ? 1 : 0) + (planIsRoad(era, x - 1, y) ? 1 : 0)
    + (planIsRoad(era, x, y + 1) ? 1 : 0) + (planIsRoad(era, x, y - 1) ? 1 : 0);

  // ── VÀNH ĐAI (`tier` 1) ──
  // ⚠️ CHIA NHỎ CÓ LÝ DO ĐO ĐƯỢC, không phải cho phong phú. Vành đai chiếm tới 44 ô ở kỷ có nó,
  // nên nếu cả 44 ô dùng chung một câu thì Đàm đọc đúng một dòng chữ suốt 44 phiên liền — tái diễn
  // y hệt cái bệnh mà `cityMoment.js` đã đo và chữa một lần rồi ("82% số phiên đọc đúng 4 chữ").
  // ⚠️ KHÔNG dùng phương hướng (bắc/nam/đông/tây): camera 3D xoay được — "phía bắc" nghe hay hơn
  // nhưng nó là một điều bịa.
  if (cell.tier >= 1) {
    if (cell.junction) return 'một khúc cua vành đai';
    if (nb >= 3) return 'một lối rẽ ra vành đai';
    return cell.variant === 1 ? 'một đoạn vành đai dọc' : 'một đoạn vành đai ngang';
  }

  // Chỗ đường gặp đường. Nói "một đoạn đại lộ" ở đây thì đúng nhưng bỏ mất tin hay nhất: chỗ này
  // vừa NỐI hai con đường vào nhau, và đó là thứ mắt nhận ra ngay khi nhìn từ trên xuống.
  if (nb >= 4) return 'một ngã tư mới';
  if (nb === 3) return 'một ngã ba mới';
  if (cell.avenue) return 'một đoạn đại lộ';
  return cell.variant === 1 ? 'một đoạn phố dọc' : 'một đoạn phố ngang';
}

/**
 * Tổng số ô đường của MỘT KỶ — MẪU SỐ để nói "đã mở được bao nhiêu".
 *
 * ⚠️ TỪ PHASE 20 NÓ LÀ MỘT HÀM THEO KỶ, KHÔNG CÒN LÀ MỘT HẰNG SỐ CHUNG. Số ô đường là HỆ QUẢ của
 * số thửa, mà số thửa khác nhau ở cả 15 kỷ — đo được 34…92 ô. Giữ một hằng số chung thì thanh tiến
 * độ sau mỗi phiên sẽ nói dối ở 14 kỷ, và nói dối lặng lẽ: mẫu số sai vẫn ra một phân số hợp lý.
 * ⚠️ Vẫn suy ra từ chính bộ sinh, KHÔNG viết cứng — cùng lý do như trước: một cái tên viết ở xa
 * nguồn của nó là một lời nói dối đang chờ ngày tới.
 */
export function roadCellCount(era) {
  return planRoadCellCount(era);
}

/**
 * DANH SÁCH ỨNG VIÊN của mạng đường ở một kỷ — suy ra DUY NHẤT từ `era`, qua `cityPlan.js`.
 * Không phụ thuộc `built`, `levels`, hay `sessionCount` — có bài test khoá lại (`roadCells.test.js`
 * và `cityPlan.test.js`).
 *
 * ⚠️ **ĐÂY LÀ DANH SÁCH ỨNG VIÊN, KHÔNG PHẢI MẠNG ĐƯỜNG ĐANG HIỆN TRÊN MÀN HÌNH.** Hai thứ đó
 * KHÁC NHAU, và nhầm chúng là nhầm ở chỗ nguy hiểm nhất: `deriveProps` mở dần theo `sessionCount`
 * (`roadBudget`) **và bỏ qua ô nào đã bị một công trình chiếm** (`if (taken.has(key)) continue`).
 * Đo thật trên 15 kỷ × 151 mốc phiên (bộ xương cũ): **1.818 trong 2.265 tổ hợp cho ra một tập ô
 * đường KHÔNG phải tiền tố của danh sách này**. Tập hiện trên màn hình là con thật sự, nhưng nó
 * KHÔNG bất biến.
 *
 * ⇒ Ai cần một mạng đường **KHÔNG ĐỔI THEO TIẾN ĐỘ** — cụ thể là `city3d/terrain.js`, vì cao độ
 * mặt đất tuyệt đối không được nhúc nhích khi Đàm xây thêm một căn nhà (ADR-007) — thì phải dùng
 * ĐÚNG danh sách này, không được đi hỏi `layout.props`. Nó là **tập cha thực sự** của mọi tập đã
 * hiện, nên đặt luật lên nó là một lời hứa CHẶT HƠN, không phải lỏng hơn.
 *
 * Trả về BẢN SAO NÔNG mỗi lần gọi (`planRoadCells` đã lo): mảng gốc là trạng thái dùng chung của
 * module, để lọt ra ngoài thì một dòng `.sort()` vô ý ở nơi khác sẽ sắp xếp lại thứ tự mở đường
 * của cả thành phố.
 */
export function roadCellCandidates(era) {
  return planRoadCells(era);
}

/**
 * Trần TỔNG (đường + cảnh vật) — hàng rào tuyệt đối để một lỗi ở tầng nào cũng không sinh ra hàng
 * trăm ô.
 *
 * ⚠️ NAY LÀ TỔNG SUY RA, KHÔNG PHẢI SỐ VIẾT CỨNG — và đây là lý do, không phải nới cho tiện.
 * Trước 2026-08-14 nó là `96`, chọn hồi mạng đường có 44 ô (44 + 34 = 78, dư 18). Vành đai đưa
 * đường lên 80 ⇒ 80 + 34 = 114, tức con số 96 **đã lặng lẽ hết đúng** và bài test trần sẽ đỏ.
 * Đó chính xác là kiểu số cũ đi trong im lặng mà cả file này đã gặp nhiều lần.
 * ⚠️ TỪ PHASE 20 SỐ Ô ĐƯỜNG KHÁC NHAU THEO KỶ (34…92), nên trần này lấy kỷ NHIỀU ĐƯỜNG NHẤT —
 * nó là một cái trần cho MỌI kỷ, và một cái trần thì phải bao được trường hợp xấu nhất. Quét cả 15
 * kỷ ngay lúc nạp module, KHÔNG viết cứng số 92: viết cứng thì ngày ai đó sửa một dòng
 * `networkStyle` là con số này lặng lẽ hết đúng.
 * ⚠️ ĐỌC CHO ĐÚNG NÓ CÒN BẮT ĐƯỢC GÌ: vì là tổng đúng bằng hai trần thành phần, nó **không** còn
 * bắt được lỗi "một tầng vượt trần của chính tầng đó" — hai trần kia mới làm việc ấy. Việc nó còn
 * làm được: chặn ca hai danh sách bị nối nhầm, và cho bên gọi một con số để cấp phát bộ đệm.
 */
export const MAX_PROPS = Math.max(
  ...Array.from({ length: 15 }, (_, i) => roadCellCount(i + 1)),
) + MAX_SCATTER_PROPS;

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
 * @param {number} [era]          kỷ — quyết khu đất nằm ở đâu (Phase 20)
 * @returns {{x:number,y:number}} toạ độ ô, luôn nằm trong [0, CITY_GRID_SIZE)
 *
 * Bản vẽ có trong `BLUEPRINT_CATALOG` → neo vào khu đất riêng theo thứ hạng (không bao giờ va chạm
 * với công trình cùng kỷ). ⚠️ Khu đất ấy nay do `cityPlan.js` sinh THEO KỶ, không còn là năm ô 3×3
 * cố định — nhưng lời hứa thì y nguyên: năm khu KHÔNG giao nhau, và với một kỷ đã cho thì chúng
 * đứng im vĩnh viễn (ADR-007, có test khoá cả hai vế ở `cityPlan.test.js`). Id lạ (dữ liệu hỏng từ cloud) → neo bằng băm trên toàn lưới rồi dò xoắn
 * ốc. Dò xoắn ốc chỉ là lưới an toàn: với dữ liệu hợp lệ nó không bao giờ phải chạy.
 */
export function placeBuilding(bpId, occupiedSet = new Set(), era = 1) {
  const occupied = occupiedSet instanceof Set ? occupiedSet : new Set();
  const meta = BLUEPRINT_LOOKUP[bpId];
  const zone = meta ? planWonderZone(era, meta.rank) : null;

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
  const roadCells = roadCellCandidates(eraNum);
  const roadBudget = nBuild > 0 ? Math.min(roadCells.length, nSession) : 0;
  let roadsPlaced = 0;
  for (const cell of roadCells) {
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

// ─── MẢNG PHỦ ĐẤT ────────────────────────────────────────────────────────────

/**
 * Trần cứng cho mảng phủ đất. Không phải số lượng thật — số thật do `share` của kỷ quyết định
 * (`groundCoverStyle.js`), y hệt cách `MAX_SCATTER_PROPS` chỉ chặn trên cho cảnh vật.
 *
 * 48 = một phần ba lưới 144 ô. Chọn bằng phép đo chứ không bằng cảm giác: ở 20 phiên lưới còn 96 ô
 * trống, nên một trần thấp hơn sẽ cắt đúng cái đầu mà cả phase này sinh ra để chữa; một trần cao
 * hơn thì vô nghĩa, vì `share` cao nhất trong bảng (0,58 ở kỷ 14) nhân với số ứng viên thực tế
 * không bao giờ chạm tới.
 */
export const MAX_GROUND_COVER = 48;

/**
 * Loại cảnh vật mà một mảng phủ được phép NẰM DƯỚI.
 *
 * ⚠️ HAI CÁI TÊN NÀY LÀ KẾT QUẢ ĐO, KHÔNG PHẢI Ý THÍCH. Mảng phủ là một tấm nền dày `0,045` nằm
 * sát mặt đất, còn hàng rào của nó đứng ở mép `±0,43` ô. Đo đáy và bề rộng tầng thấp của cả bốn
 * loại cảnh vật nhỏ, trên 15 kỷ × 8 hạt giống:
 *   · `tree` — đáy `0,000`, rộng nhất dưới cao độ 0,08 là `0,149`; lệch tâm tối đa `0,34`
 *     ⇒ với tới `0,415` < `0,43`: thân cây nằm GỌN trong sân. ✓
 *   · `lamp` — đáy `0,000`, rộng `0,190`, lệch tối đa `0,13` ⇒ `0,225`. ✓
 *   · `bush` — đáy **`−0,018`** (thụt xuống DƯỚI mặt tấm nền), rộng `0,329`, lệch `0,38`
 *     ⇒ với tới `0,545` > `0,43`: bụi vừa lún vào tấm nền vừa chọc thủng hàng rào. ✗
 *   · `rock` — đáy **`−0,030`**, rộng `0,359`, lệch `0,32` ⇒ `0,50`. ✗
 * Hai loại bị loại đều **NẰM TRÊN mặt đất**; hai loại được nhận đều **MỌC LÊN từ một điểm**. Đó
 * mới là ranh giới thật, không phải "cây thì đẹp còn đá thì xấu".
 */
const COVER_CAN_SHARE = new Set(['tree', 'lamp']);

/**
 * Mảng phủ đất — "mảnh đất cạnh nhà được dùng làm gì".
 *
 * ⚠️ VÌ SAO NÓ LÀ MỘT LỚP RIÊNG CHỨ KHÔNG PHẢI MỘT LOẠI `prop` NỮA (quyết định gốc của Phase C).
 * Bản đầu định nhét bảy kiểu này vào `SCATTER_KINDS` cho gọn. Làm vậy là bắt MỘT ô lưới trả lời
 * hai câu hỏi khác hẳn nhau — *"cái gì ĐỨNG ở đây?"* và *"mảnh đất này được DÙNG làm gì?"* — đúng
 * cái bẫy "một trường gánh hai việc" đã cắn dự án năm lần (`storyHeight` · `roof` · bảng loài cây ·
 * `avenue`). Ngoài đời hai câu ấy độc lập: một cái cây đứng giữa sân là chuyện bình thường nhất
 * trần đời. Tách thành lớp riêng thì cả hai cùng trả lời được, và ta được thêm ba thứ miễn phí:
 *   (a) `deriveProps` KHÔNG BỊ ĐỘNG TỚI MỘT DÒNG NÀO ⇒ mọi cây/đá/đèn/đường của mọi thành phố đã
 *       niêm phong giữ nguyên từng byte. "Chỉ thêm, không bao giờ dời" trở thành đúng **theo cấu
 *       trúc**, không phải nhờ cẩn thận.
 *   (b) Bộ vẽ 2D vẽ được nó như một lớp PHẲNG dưới mọi vật thể nổi — đúng thứ tự chồng lớp, không
 *       cần đụng vào hàm sắp xếp theo chiều sâu dùng chung.
 *   (c) Trần riêng, không tranh chỗ với trần cảnh vật.
 *
 * ⚠️ ƯU TIÊN Ô KỀ NHÀ. Một cái sân thuộc về một ngôi nhà; rải sân ra giữa đồng thì nó thành nhiễu
 * chứ không thành câu chuyện. `nhaCua` là ảnh chụp `occupied` LÚC VÀO HÀM — tức công trình + nhà
 * dân + giàn giáo, trước khi đường và cảnh vật kịp chen vào.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {number} input.buildingCount
 * @param {number} input.sessionCount
 * @param {Set<string>} input.blocked   ô đã bị chiếm bởi thứ KHÔNG cho phủ (nhà, đường, ao, ruộng…)
 * @param {Set<string>} input.nhaCua    ô có công trình/nhà dân — dùng để ưu tiên đất kề nhà
 * @param {Array} [input.shareable]     cảnh vật mà mảng phủ được phép nằm dưới, dạng `{kind,x,y}`
 * @returns {Array<{kind:string,x:number,y:number,variant:number}>} tối đa `MAX_GROUND_COVER` phần tử
 */
export function deriveGroundCover({
  era, buildingCount, sessionCount, blocked, nhaCua, shareable,
} = {}) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const nBuild = safeCount(buildingCount);
  const nSession = safeCount(sessionCount);
  if (nBuild === 0) return [];          // chưa có nhà thì chưa có ai dùng mảnh đất nào

  const chan = blocked instanceof Set ? blocked : new Set();
  const nha = nhaCua instanceof Set ? nhaCua : new Set();
  const style = getGroundCoverStyle(eraNum);

  // Ứng viên: ô trống hẳn, CỘNG những ô chỉ có cây/đèn đứng (mảng phủ nằm dưới, xem
  // `COVER_CAN_SHARE`). Duyệt theo thứ tự cố định ⇒ tất định.
  const ungVien = [];
  for (let y = 0; y < CITY_GRID_SIZE; y += 1) {
    for (let x = 0; x < CITY_GRID_SIZE; x += 1) {
      if (!chan.has(cellKey(x, y))) ungVien.push({ x, y });
    }
  }
  for (const prop of Array.isArray(shareable) ? shareable : []) {
    if (COVER_CAN_SHARE.has(prop.kind)) ungVien.push({ x: prop.x, y: prop.y });
  }
  if (ungVien.length === 0) return [];

  // Kề một ngôi nhà (8 hướng) thì được ưu tiên; trong cùng nhóm thì xáo bằng băm để mảng phủ không
  // dồn về góc trên-trái của lưới.
  const keNha = ({ x, y }) => {
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        if (nha.has(cellKey(x + dx, y + dy))) return 0;
      }
    }
    return 1;
  };
  const xepHang = ungVien
    .map((c, i) => ({ ...c, uu: keNha(c), khoa: hashId(`gc|${eraNum}|${c.x}|${c.y}`), thuTu: i }))
    .sort((a, b) => (a.uu - b.uu) || (a.khoa - b.khoa) || (a.thuTu - b.thuTu));

  /**
   * NGÂN SÁCH — hai điều kiện, nhưng phải nói CÙNG MỘT ĐƠN VỊ.
   *
   * ⚠️ BẢN ĐẦU CỦA CHÍNH CHỖ NÀY ĐÃ SAI, và nó sai theo đúng cái kiểu dự án đã trả giá ba lần
   * (`MIN_STONE` Phase 9D · trường nhiễu Phase 7B · trần cây Phase 8D). Nó viết:
   *     min(MAX, floor(ungVien × share), 4 × nhà + phiên)
   * — tức đặt một PHẦN (`share`) cạnh một LƯỢNG (`4 × nhà + phiên`) trong cùng một `Math.min`.
   * Lý lẽ nghe rất xuôi ("một cái trói lúc đông, một cái trói lúc trẻ") nhưng ĐO RA thì ở mốc **20
   * phiên — đúng mốc đất trống tệ nhất (46%)** — vế lượng ăn trọn vế phần ở **8/15 kỷ**: tám kỷ
   * khai tám con số `share` khác nhau và cùng dựng ra ĐÚNG 40 mảng. Trục bản sắc bị nuốt trong im
   * lặng, y hệt cái bẫy mà `isValidGroundCoverStyle` sinh ra để chặn ở đầu kia.
   *
   * ⇒ Giữ nguyên Ý ĐỊNH (chưa bỏ công thì chưa được thưởng), đổi ĐƠN VỊ: công sức thành một HỆ SỐ
   * nhân lên chính `share`, nên nó làm cả 15 kỷ CÙNG chậm lại mà không kỷ nào mất thứ hạng của
   * mình. Thành phố 1 công trình + 2 phiên: nhịp ≈ 0,05 ⇒ kỷ rộng tay nhất cũng chỉ 3 mảng.
   */
  const nhipCongSuc = Math.min(1, (4 * nBuild + nSession) / Math.max(1, ungVien.length));
  const soLuong = Math.min(
    MAX_GROUND_COVER,
    Math.floor(ungVien.length * style.share * nhipCongSuc),
  );

  const out = [];
  for (let i = 0; i < soLuong && i < xepHang.length; i += 1) {
    const cell = xepHang[i];
    const seed = `gc|${eraNum}|${cell.x}|${cell.y}`;
    out.push({
      kind:    pickCoverKind(eraNum, seed),
      x:       cell.x,
      y:       cell.y,
      variant: hashPick(`${seed}|v`, PROP_VARIANTS),
      // ⚠️ BÁM LƯỚI — KHÔNG ĐƯỢC XOAY TỰ DO, và đây là chỗ duy nhất nói ra điều đó.
      // Cảnh vật thường (cây, đá) được xoay một góc BẤT KỲ, vì cây thẳng hàng theo lưới thì lộ ngay
      // ra là máy đặt. Mảng phủ thì ngược hẳn: nó là một hình VUÔNG rộng gần trọn ô, nên xoay 37°
      // là nó thò ra tới `0,61` tính từ tâm — tức đè lên ô bên cạnh và xoá mất chính cái lưới mà
      // mắt đang đọc. Chỉ được xoay theo bội số 90°, và bốn góc ấy vẫn đủ biến thể cho những kiểu
      // không đối xứng (giàn phơi, cần vọt, dải lát chéo).
      gridAligned: true,
    });
  }
  return out;
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
 * @returns {{era:number, gridSize:number, buildings:Array, dwellings:Array, props:Array,
 *            covers:Array, scaffolds:Array, ground:Array, isEmpty:boolean}}
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
    const { x, y } = placeBuilding(bpId, occupied, eraNum);
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
      const { x, y } = placeBuilding(item.bpId, occupied, eraNum);
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

  // ⚠️ ẢNH CHỤP TRƯỚC KHI `deriveProps` CHẠY. `occupied` lúc này đúng bằng "chỗ có người ở" —
  // công trình + giàn giáo + nhà dân — và đó là thứ mảng phủ cần để biết ô nào là đất KỀ NHÀ.
  // Đọc sau khi `deriveProps` xong thì trong đó đã lẫn 80 ô đường và mấy chục gốc cây, tức câu
  // hỏi "kề nhà không" sẽ trả lời cho một câu khác hẳn.
  const nhaCua = new Set(occupied);

  const props = deriveProps({
    era: eraNum,
    buildingCount: buildings.length,
    sessionCount,
    streakLength,
    occupied,
  });

  // ── MẢNG PHỦ ĐẤT (Phase C) ────────────────────────────────────────────────
  //
  // ⚠️ ĐẶT SAU `deriveProps` VÀ KHÔNG TRUYỀN GÌ NGƯỢC LẠI — đó chính là lời hứa "chỉ thêm, không
  // bao giờ dời" viết thành cấu trúc: `deriveProps` không biết lớp này tồn tại, nên mọi thành phố
  // đã niêm phong giữ nguyên từng cây, từng hòn đá, từng ô đường.
  const chan = new Set(occupied);
  const chiaDuoc = [];
  for (const prop of props) {
    // Ao và ruộng đã là hai cách xử lý mặt đất chiếm TRỌN ô; chồng một cái sân lên đó vừa vô nghĩa
    // vừa chọi nhau về mặt hình học. Đường thì đã là mặt lát rồi.
    if (prop.kind === 'tree' || prop.kind === 'lamp') chiaDuoc.push(prop);
    chan.add(cellKey(prop.x, prop.y));
  }
  const covers = deriveGroundCover({
    era: eraNum,
    buildingCount: buildings.length,
    sessionCount,
    blocked: chan,
    nhaCua,
    shareable: chiaDuoc,
  });

  return {
    era:       eraNum,
    gridSize:  CITY_GRID_SIZE,
    buildings: buildings.sort(byIsometricDepth),
    dwellings: dwellings.sort(byIsometricDepth),
    props:     props.sort(byIsometricDepth),
    covers:    covers.sort(byIsometricDepth),
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
