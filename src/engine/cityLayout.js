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

// ─── HẰNG SỐ LƯỚI ────────────────────────────────────────────────────────────
export const CITY_GRID_SIZE = 12;      // lưới 12×12 = 144 ô
export const TILE_W = 64;              // bề rộng ô isometric (px)
export const TILE_H = 32;              // bề cao ô isometric (px) — tỉ lệ 2:1
export const MAX_PROPS = 48;           // trần cảnh vật, chống rớt khung hình

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
const BLUEPRINT_LOOKUP = {};
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
 * Khu đất riêng cho từng thứ hạng bản vẽ trong kỷ. Các ô vuông này KHÔNG giao nhau — đó chính là
 * thứ bảo đảm "bảo tàng bất động". Hạng 4 (luôn là công trình `epic` của kỷ) đứng giữa thành phố.
 */
const BUILDING_ZONES = [
  { x: 1, y: 1, w: 3, h: 3 },   // hạng 0 — góc trên-trái
  { x: 8, y: 1, w: 3, h: 3 },   // hạng 1 — góc trên-phải
  { x: 1, y: 8, w: 3, h: 3 },   // hạng 2 — góc dưới-trái
  { x: 8, y: 8, w: 3, h: 3 },   // hạng 3 — góc dưới-phải
  { x: 5, y: 5, w: 3, h: 3 },   // hạng 4 — trung tâm (kỳ quan)
];

/** Trục đường: cột x=4 và hàng y=4 — hai đường này không cắt qua zone công trình nào. */
const ROAD_AXIS = 4;

/**
 * Các ô đường, sắp xếp từ TRUNG TÂM ra NGOÀI. Đường được "mở" dần theo số phiên, nên thành phố
 * trông như đang lớn lên thay vì hiện ra trọn vẹn ngay từ phiên đầu.
 */
const ROAD_CELLS = (() => {
  const cells = [];
  for (let i = 0; i < CITY_GRID_SIZE; i += 1) {
    cells.push({ x: ROAD_AXIS, y: i });
    if (i !== ROAD_AXIS) cells.push({ x: i, y: ROAD_AXIS });
  }
  const mid = (CITY_GRID_SIZE - 1) / 2;
  return cells.sort((a, b) => {
    const da = Math.abs(a.x - mid) + Math.abs(a.y - mid);
    const db = Math.abs(b.x - mid) + Math.abs(b.y - mid);
    if (da !== db) return da - db;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });
})();

/** Bảng loại cảnh vật rải rác + trọng số (tổng = 20). Thứ tự cố định → tất định. */
const SCATTER_KINDS = [
  { kind: 'tree',  weight: 8 },
  { kind: 'field', weight: 4 },
  { kind: 'rock',  weight: 3 },
  { kind: 'lamp',  weight: 3 },
  { kind: 'water', weight: 2 },
];
const SCATTER_WEIGHT_TOTAL = SCATTER_KINDS.reduce((sum, item) => sum + item.weight, 0);

// ─── BĂM TẤT ĐỊNH ────────────────────────────────────────────────────────────

/**
 * Băm tất định chuỗi → số nguyên KHÔNG ÂM 32-bit (FNV-1a). Không dùng `Math.random`.
 * Mọi giá trị đầu vào (kể cả `null`/`undefined`/số) đều cho ra một số hợp lệ, không bao giờ `NaN`.
 */
export function hashId(str) {
  const text = typeof str === 'string' ? str : String(str ?? '');
  let hash = 0x811c9dc5;                    // FNV offset basis
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);     // FNV prime
  }
  return hash >>> 0;                        // ép về không dấu
}

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
  for (const cell of ROAD_CELLS) {
    if (props.length >= roadBudget) break;
    const key = cellKey(cell.x, cell.y);
    if (taken.has(key)) continue;
    taken.add(key);
    props.push({ kind: 'road', x: cell.x, y: cell.y, variant: cell.x === ROAD_AXIS ? 0 : 1 });
  }

  // (2) Cây cối / ruộng / đá / đèn / nước — rải theo băm, không bao giờ vượt trần MAX_PROPS.
  const scatterBudget = Math.min(
    MAX_PROPS - props.length,
    2 * nBuild + Math.floor(nSession / 2) + Math.floor(nStreak / 2),
  );
  for (let i = 0; props.length < roadBudget + scatterBudget; i += 1) {
    // chặn vòng lặp vô hạn khi lưới gần kín
    if (i > CITY_GRID_SIZE * CITY_GRID_SIZE) break;
    const seed = `p|${eraNum}|${i}`;
    const anchorX = hashPick(`${seed}|x`, CITY_GRID_SIZE);
    const anchorY = hashPick(`${seed}|y`, CITY_GRID_SIZE);
    const cell = taken.has(cellKey(anchorX, anchorY))
      ? findFreeCell(anchorX, anchorY, taken)
      : { x: anchorX, y: anchorY };
    if (!cell) break;
    taken.add(cellKey(cell.x, cell.y));
    props.push({
      kind:    pickScatterKind(`${seed}|k`),
      x:       cell.x,
      y:       cell.y,
      variant: hashPick(`${seed}|v`, PROP_VARIANTS),
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
      const total = BUILDING_EFFECTS[item.bpId]?.sessionsToComplete;
      const remaining = safeCount(item.sessionsRemaining);
      // Thiếu `sessionsToComplete` (dữ liệu lạ) ⇒ tiến độ 0, tức một cọc mốc thấp — vẫn thấy là
      // "chỗ này sắp có nhà", chỉ là không biết sắp xong tới đâu. KHÔNG đoán bừa một tỉ lệ.
      const progress = Number.isFinite(total) && total > 0
        ? Math.min(1, Math.max(0, 1 - remaining / total))
        : 0;
      const meta = BLUEPRINT_LOOKUP[item.bpId];
      return {
        bpId: item.bpId, x, y, progress,
        label: meta.label,
        icon: meta.icon,
        // ⚠️ Đem theo cả SỐ PHIÊN CÒN LẠI, không chỉ tỉ lệ. Màn hình cần nói được "còn 2 phiên nữa"
        // — một con số Đàm hành động được ngay hôm nay — chứ không phải "đã xong 67%", thứ nghe thì
        // chính xác mà chẳng bảo anh phải làm gì. Tính ở đây để mọi màn hình nói cùng một con số.
        remaining: Math.max(0, Number.isFinite(total) ? Math.min(remaining, total) : remaining),
        total: Number.isFinite(total) && total > 0 ? total : null,
        // PHẦN THƯỞNG — nhãn ngắn của đặc quyền công trình sẽ mở khoá ("Cả xưởng tăng tốc",
        // "-25% RP bản vẽ kỷ 6-10"). Thiếu số phiên còn lại thì Đàm biết CÒN BAO XA; thiếu dòng này
        // thì anh vẫn không biết ĐI TỚI ĐÓ ĐỂ LÀM GÌ. Lấy `label` chứ không lấy `summary` vì summary
        // dài cả câu, nhét vào một dòng danh sách sẽ tràn — chỗ đọc summary là màn Kho báu.
        reward: BUILDING_EFFECTS[item.bpId]?.perk?.label ?? null,
      };
    });

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
