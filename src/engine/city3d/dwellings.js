/**
 * dwellings.js — NHÀ DÂN: 30 ô đất trống giữa năm khu landmark biến thành một thành phố có người ở.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ── VẤN ĐỀ NÀY SINH RA TỪ ĐÂU ────────────────────────────────────────────────────────────────
 * Đàm: *"Bổ sung nhiều nhà dân, cửa hàng, xưởng, kho và công trình phụ… Không để công trình rải
 * rác ngẫu nhiên hoặc quá nhiều đất trống."* Trước file này, một kỷ ĐÃ HOÀN THÀNH có đúng **5**
 * công trình trên lưới 144 ô. Kể cả khi mạng đường đã mở hết 80 ô, phần còn lại vẫn là cỏ — nên
 * thành phố đọc ra là *"năm cái nhà đứng giữa đồng"*, không phải một nền văn minh.
 *
 * ── VÌ SAO KHÔNG CẦN BỊA MỘT BỐ CỤC MỚI ──────────────────────────────────────────────────────
 * Đàm yêu cầu thứ tự **ngoại vi → khu dân cư → trung tâm → landmark**. Lưới hiện có ĐÃ SẴN đúng
 * hình dạng ấy, chỉ là chưa ai gọi tên nó ra: `BUILDING_ZONES` chiếm bốn góc + tâm, `ROAD_CELLS`
 * chiếm hàng/cột 0, 4, 8, 11, và phần còn lại rơi thành **bốn dải** nằm giữa vành đai và tâm.
 * Trong mỗi dải, khoảng cách tới tâm chia đúng ba nấc:
 *
 *      · · · · · · · · · · · ·      ·  đường
 *      · ▓ ▓ ▓ · o o o · ▓ ▓ ·      ▓  khu đất landmark (không đụng vào)
 *      · ▓ ▓ ▓ · n n n · ▓ ▓ ·      o  ngoại vi   — xưởng, kho
 *      · ▓ ▓ ▓ · C C C · ▓ ▓ ·      n  khu dân cư — nhà ở
 *      · · · · · · · · · · · ·      C  trung tâm  — cửa hàng, quán
 *      · o n C · ▓ ▓ ▓ · n o ·
 *      · o n C · ▓ ▓ ▓ · n o ·      12 ô ngoại vi · 12 ô dân cư · 6 ô trung tâm
 *      · o n C · ▓ ▓ ▓ · n o ·
 *      · · · · · · · · · · · ·
 *      · ▓ ▓ ▓ · n n n · ▓ ▓ ·
 *      · ▓ ▓ ▓ · o o o · ▓ ▓ ·
 *      · · · · · · · · · · · ·
 *
 * ⚠️ CHỪA TRỌN Ô 3×3 CỦA LANDMARK, không chỉ ô tâm của nó. `placeBuilding` chỉ trả về MỘT ô, nhưng
 * kỳ quan `epic` trải tới ~1,72 đơn vị (gần 2 ô) và còn nhân `spread` của kỷ. Chừa đúng một ô thì
 * nhà dân sẽ cắm vào sườn kỳ quan ở những kỷ bè ngang — và nó sẽ trông y hệt một lỗi dựng hình.
 */

import { hashId } from '../hashId';
// ⚠️ Ba sự thật về mảnh đất (lưới rộng bao nhiêu · ô nào đã hứa cho kỳ quan · ô nào là đường) đọc
// THẲNG từ `cityGrid.js`, KHÔNG chép lại. Bản đầu của file này chép chúng vào đây kèm một đoạn
// chú thích tự trấn an rằng "đã khoá bằng test đối chiếu" — xem đầu `cityGrid.js` để biết vì sao
// lý lẽ đó sai và vì sao tách file lá mới là cách chặn tận gốc.
import { CITY_GRID_SIZE as GRID, isRoadLine, isBuildingZone } from '../cityGrid';

/** Ranh giới ba khu, đo bằng khoảng cách Chebyshev tới tâm lưới (5,5 / 5,5). */
const CIVIC_MAX = 2.5;
const RESIDENTIAL_MAX = 3.5;

/**
 * Công năng cho phép ở mỗi khu, kèm CỠ NHÀ được phép.
 *
 * ⚠️ CỠ NHÀ ĐI THEO KHU, KHÔNG RẢI ĐỀU. Thành phố thật cao dần và dày dần về phía trung tâm —
 * ngoại vi là kho một tầng, mặt phố trung tâm là nhà hai tầng có cửa hàng. Cho cả ba cỡ xuất hiện
 * ở mọi khu thì mắt không đọc ra được cấu trúc nào cả, và cả 30 căn lại thành "rải rác ngẫu nhiên"
 * — đúng thứ Đàm bảo đừng làm.
 */
const DISTRICT_RULES = {
  outskirts: {
    label: 'ngoại vi',
    // Xưởng và kho: thứ người ta đẩy ra rìa làng ở mọi thời đại vì khói, mùi và tiếng ồn.
    kinds: [
      { type: 'workshop', rarity: 'common', weight: 3 },
      { type: 'workshop', rarity: 'rare', weight: 2 },
      { type: 'house', rarity: 'common', weight: 2 },
    ],
  },
  residential: {
    label: 'khu dân cư',
    kinds: [
      { type: 'house', rarity: 'common', weight: 3 },
      { type: 'house', rarity: 'rare', weight: 3 },
      { type: 'house', rarity: 'epic', weight: 1 },
      { type: 'workshop', rarity: 'common', weight: 1 },
    ],
  },
  civic: {
    label: 'trung tâm',
    kinds: [
      { type: 'shop', rarity: 'rare', weight: 3 },
      { type: 'shop', rarity: 'epic', weight: 2 },
      { type: 'house', rarity: 'epic', weight: 2 },
      { type: 'shop', rarity: 'common', weight: 1 },
    ],
  },
};

/**
 * MẬT ĐỘ THEO KỶ — phần trăm số ô đất trống được phép xây, khi số phiên đã dư dả.
 *
 * ⚠️ ĐÂY LÀ MỘT TRỤC BẢN SẮC, KHÔNG PHẢI MỘT CÁI NÚM HIỆU NĂNG. Đàm yêu cầu mỗi kỷ có *"mật độ…
 * riêng"*. Một khu định cư đồ đá mới mà đông đúc như Manhattan thì sai về lịch sử theo cách ai
 * cũng nhận ra, kể cả người không đọc một dòng sử nào. Ngược lại, đi từ kỷ 1 tới kỷ 15 mà thành
 * phố không dày lên thì mất luôn phần thưởng lớn nhất của việc đi hết 15 kỷ.
 *
 * ⚠️ SÀN 0,55 CHỨ KHÔNG PHẢI 0,2. Về mặt lịch sử thì kỷ 1 đáng thưa hơn nhiều, NHƯNG kỷ 1 là nơi
 * Đàm bắt đầu và *"quá nhiều đất trống"* chính là lời phàn nàn mở đầu cả nhánh Phase 7. Một con số
 * đúng-lịch-sử mà làm hỏng đúng cái đang đi sửa thì không phải con số đúng.
 */
const ERA_DENSITY = {
  1: 0.55, 2: 0.62, 3: 0.68, 4: 0.72, 5: 0.75,
  6: 0.78, 7: 0.82, 8: 0.82, 9: 0.86, 10: 0.90,
  11: 0.93, 12: 0.90, 13: 0.96, 14: 1.00, 15: 1.00,
};

/**
 * Bao nhiêu phiên đổi được một căn nhà.
 *
 * ⚠️ Đàm nói *"~50 phút → thêm một nhà dân/cửa hàng"*. Một phiên tập trung mặc định là 25 phút, nên
 * ~50 phút = 2 phiên. Đặt 1 thì 30 căn hết veo trong 30 phiên và quãng sau lại im lặng; đặt 3 thì
 * chậm hơn thứ Đàm vừa nói ra. Con số này lấy thẳng từ câu của anh, không phải từ cảm giác.
 */
export const SESSIONS_PER_DWELLING = 2;

/** Khoảng cách Chebyshev tới tâm lưới. Vuông chứ không tròn — hợp với một lưới ô vuông. */
function centreDistance(x, y) {
  const c = (GRID - 1) / 2;
  return Math.max(Math.abs(x - c), Math.abs(y - c));
}

export function districtAt(x, y) {
  const d = centreDistance(x, y);
  if (d <= CIVIC_MAX) return 'civic';
  if (d <= RESIDENTIAL_MAX) return 'residential';
  return 'outskirts';
}

/**
 * Toàn bộ ô đất xây được, **đã sắp thứ tự MỌC**: từ trung tâm ra ngoài.
 *
 * ⚠️ THỨ TỰ NÀY LÀ MỘT LỜI HỨA, KHÔNG PHẢI CHI TIẾT CÀI ĐẶT — cùng loại với `ROAD_CELLS`. Thành
 * phố thật lớn từ trong ra ngoài: mặt phố trung tâm kín trước, rồi tới khu ở, rồi mới tới xưởng ở
 * rìa. Quan trọng hơn: thứ tự cố định nghĩa là **căn nhà thứ 7 của Đàm mãi mãi là căn nhà thứ 7**,
 * không bị sắp lại khi anh chơi tiếp — đúng bất biến mà ADR-007 đặt ra cho vị trí công trình và
 * Phase 6C đặt ra cho thứ tự mở đường.
 *
 * Phá hoà (hai ô cùng khoảng cách) bằng `y` rồi `x` — TẤT ĐỊNH, không băm. Băm ở đây sẽ làm thành
 * phố mọc lỗ chỗ như da beo thay vì loang đều ra.
 */
export const DWELLING_PLOTS = (() => {
  const plots = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (isRoadLine(x, y) || isBuildingZone(x, y)) continue;
      plots.push({ x, y, district: districtAt(x, y), distance: centreDistance(x, y) });
    }
  }
  plots.sort((a, b) => (
    a.distance !== b.distance ? a.distance - b.distance
      : a.y !== b.y ? a.y - b.y
        : a.x - b.x
  ));
  return plots;
})();

export const DWELLING_PLOT_COUNT = DWELLING_PLOTS.length;

/** Chọn công năng + cỡ nhà cho một ô. Tất định theo `(kỷ, ô)` — nhà không bao giờ đổi kiểu. */
function pickKind(era, plot) {
  const rules = DISTRICT_RULES[plot.district] ?? DISTRICT_RULES.residential;
  const total = rules.kinds.reduce((sum, k) => sum + k.weight, 0);
  let roll = hashId(`dw|${era}|${plot.x}|${plot.y}`) % total;
  for (const kind of rules.kinds) {
    roll -= kind.weight;
    if (roll < 0) return kind;
  }
  return rules.kinds[rules.kinds.length - 1];
}

/** Trần mật độ của một kỷ, tính ra SỐ Ô. */
export function densityCap(era) {
  const ratio = ERA_DENSITY[era] ?? ERA_DENSITY[1];
  return Math.round(DWELLING_PLOT_COUNT * ratio);
}

/**
 * Danh sách nhà dân của một kỷ tại một mốc số phiên.
 *
 * ⚠️ CHỈ MỌC KHI ĐÃ CÓ ÍT NHẤT MỘT CÔNG TRÌNH THẬT (`buildingCount > 0`). Một bãi đất mới khai
 * hoang mà đã có sẵn 15 căn nhà dân thì công trình đầu tiên Đàm xây — thứ anh đổi 4–11 phiên để
 * có — sẽ mọc lên giữa một thị trấn có sẵn, và mất trọn ý nghĩa. Cùng luật đang áp cho đường sá.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {number} input.buildingCount   số công trình THẬT đã xây trong kỷ
 * @param {number} input.sessionCount
 * @returns {Array<{x:number,y:number,district:string,type:string,rarity:string,index:number}>}
 */
export function deriveDwellings({ era, buildingCount, sessionCount } = {}) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const built = Number.isFinite(buildingCount) ? Math.max(0, Math.floor(buildingCount)) : 0;
  const sessions = Number.isFinite(sessionCount) ? Math.max(0, Math.floor(sessionCount)) : 0;
  if (built <= 0) return [];

  const earned = Math.floor(sessions / SESSIONS_PER_DWELLING);
  const count = Math.min(densityCap(eraNum), earned);

  const out = [];
  for (let i = 0; i < count; i += 1) {
    const plot = DWELLING_PLOTS[i];
    const kind = pickKind(eraNum, plot);
    out.push({
      x: plot.x,
      y: plot.y,
      district: plot.district,
      type: kind.type,
      rarity: kind.rarity,
      index: i,
    });
  }
  return out;
}

/**
 * Còn bao nhiêu phiên nữa thì mọc thêm một căn — để câu báo sau mỗi phiên nói được điều gì đó thật.
 * Trả `null` khi kỷ đã kín (không còn gì để hứa thì đừng hứa).
 */
export function sessionsToNextDwelling({ era, buildingCount, sessionCount } = {}) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const built = Number.isFinite(buildingCount) ? Math.max(0, Math.floor(buildingCount)) : 0;
  const sessions = Number.isFinite(sessionCount) ? Math.max(0, Math.floor(sessionCount)) : 0;
  if (built <= 0) return null;
  if (Math.floor(sessions / SESSIONS_PER_DWELLING) >= densityCap(eraNum)) return null;
  return SESSIONS_PER_DWELLING - (sessions % SESSIONS_PER_DWELLING);
}
