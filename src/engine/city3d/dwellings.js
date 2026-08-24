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
import { CITY_GRID_SIZE as GRID, isBuildingZone } from '../cityGrid';
import { buildRoadPlan } from '../roadPlan';
import { getNetworkStyle } from './networkStyle';

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

/**
 * Khu của một ô theo KHOẢNG CÁCH TUYỆT ĐỐI tới tâm.
 *
 * ⚠️ **KHÔNG CÒN LÀ THỨ QUYẾT ĐỊNH KHU CỦA MỘT Ô ĐẤT** kể từ 2026-08-24 — xem `PHAN_KHU` bên dưới.
 * Giữ lại vì nó vẫn là câu trả lời đúng cho câu hỏi *"ô này nằm ở vành nào của lưới"*, và có bài
 * test khoá ý nghĩa ấy.
 */
export function districtAt(x, y) {
  const d = centreDistance(x, y);
  if (d <= CIVIC_MAX) return 'civic';
  if (d <= RESIDENTIAL_MAX) return 'residential';
  return 'outskirts';
}

/**
 * ⚠️ **KHU ĐẤT CHIA THEO THỨ HẠNG, KHÔNG THEO KHOẢNG CÁCH TUYỆT ĐỐI — và đây là một hồi quy đã đo.**
 *
 * Mạng bàn cờ cũ chạy xuyên qua giữa lưới (hàng/cột 4 và 8), nên số ô trống SÁT TÂM rất ít; 30 ô
 * đất chia ra **6 civic / 12 residential / 12 outskirts** (20 / 40 / 40 %), và toàn bộ `DISTRICT_RULES`
 * cùng bảng khu phố của Phase 14 §1(3) được hiệu chuẩn trên tỉ lệ ấy.
 *
 * Mạng theo kỷ mở lại phần giữa lưới ⇒ ô trống dồn về gần tâm. Đo được ở kỷ 1: **cả 17 căn nhà rơi
 * vào `civic`**, tức thành phố mất sạch dải chuyển ngoại-vi → khu-ở → trung-tâm, và vì `civic` toàn
 * `shop` nên phép chia khu phố dựng ra một thành phố **THẤP ĐI 0,945 lần** — đúng cái hỏng mà cả
 * ADR-052 sinh ra để ngăn. Một thay đổi về ĐƯỜNG đang lặng lẽ xoá một trục bản sắc của NHÀ.
 *
 * ⇒ Chia theo THỨ HẠNG trong danh sách đã sắp từ tâm ra ngoài, với đúng tỉ lệ 20/40/40 mà mạng cũ
 * cho ra. Nhờ vậy ba khu LUÔN tồn tại và LUÔN đúng tỉ lệ, dù mạng đường của kỷ ấy chừa lại 27 ô hay
 * 77 ô. Thứ tự "mọc từ trong ra ngoài" giữ nguyên; chỉ có cái nhãn khu là thôi phụ thuộc vào việc
 * hôm nay con đường tình cờ đi qua đâu.
 */
/**
 * ⚠️ MỐC CHIA TÍNH BẰNG **SỐ Ô TUYỆT ĐỐI**, KHÔNG BẰNG PHẦN TRĂM DANH SÁCH — và bản đầu của chính
 * đoạn này đã sai đúng ở đó. Lấy 20% của cả danh sách nghe hợp lý, nhưng danh sách nay dài 27…77 ô
 * tuỳ kỷ trong khi **nhiều nhất chỉ 30 căn nhà được xây** (xem `LEGACY_PLOT_COUNT`). Kết quả ở kỷ
 * 1: 20% của 70 ô = 14 ô đầu là `civic`, nên 17 căn nhà ra **14 civic / 3 residential** — vẫn dồn
 * cục, chỉ là dồn kiểu khác. Đo lại thì lời hứa "thành phố không thấp đi" vẫn đỏ (0,9586).
 *
 * Mạng bàn cờ cũ cho ra đúng **6 civic · 12 residential · 12 outskirts** trên 30 ô, tức 17 căn đầu
 * là 6 civic + 11 residential. Ghim thẳng hai con số 6 và 18 thì mọi kỷ tái lập ĐÚNG cách chia ấy,
 * bất kể mạng đường của nó chừa lại bao nhiêu đất.
 */
export const CIVIC_PLOTS = 6;
export const RESIDENTIAL_PLOTS = 18;

function khuTheoHang(i) {
  if (i < CIVIC_PLOTS) return 'civic';
  if (i < RESIDENTIAL_PLOTS) return 'residential';
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
const NHO_O_DAT = new Map();

/**
 * Toàn bộ ô đất xây được CỦA MỘT KỶ, **đã sắp thứ tự MỌC**: từ trung tâm ra ngoài.
 *
 * ⚠️ **NAY LÀ HÀM THEO KỶ, TRƯỚC LÀ HẰNG SỐ CẤP MODULE.** Mạng đường từ 2026-08-24 mỗi kỷ một
 * hình (`roadPlan.js`), nên "ô nào không phải đường" cũng đổi theo kỷ. Giữ nó làm hằng số thì nhà
 * dân sẽ mọc **giữa lòng đường** ở 14/15 kỷ — và không có gì đỏ lên, vì bố cục vẫn hợp lệ.
 *
 * ⚠️ THỨ TỰ VẪN LÀ MỘT LỜI HỨA, VÀ NÓ VẪN CÒN NGUYÊN: trong MỘT kỷ, thứ tự không phụ thuộc tiến
 * độ, nên **căn nhà thứ 7 của Đàm mãi mãi là căn nhà thứ 7**. Thứ đổi là giữa hai KỶ khác nhau —
 * mà hai kỷ vốn đã là hai thành phố khác nhau.
 *
 * Phá hoà (hai ô cùng khoảng cách) bằng `y` rồi `x` — TẤT ĐỊNH, không băm.
 */
export function dwellingPlots(era) {
  const eraNum = Number.isFinite(era) ? era : 1;
  if (NHO_O_DAT.has(eraNum)) return NHO_O_DAT.get(eraNum);
  const duong = new Set(
    buildRoadPlan(eraNum, getNetworkStyle(eraNum)).cells.map((c) => `${c.x}|${c.y}`),
  );
  const plots = [];
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      if (duong.has(`${x}|${y}`) || isBuildingZone(x, y)) continue;
      plots.push({ x, y, distance: centreDistance(x, y) });
    }
  }
  plots.sort((a, b) => (
    a.distance !== b.distance ? a.distance - b.distance
      : a.y !== b.y ? a.y - b.y
        : a.x - b.x
  ));
  // Nhãn khu gán SAU khi sắp — vì nó là một hàm của THỨ HẠNG, không phải của toạ độ.
  const xong = plots.map((p, i) => ({ ...p, district: khuTheoHang(i) }));
  NHO_O_DAT.set(eraNum, xong);
  return xong;
}

export function dwellingPlotCount(era) {
  return dwellingPlots(era).length;
}

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
/**
 * ⚠️ **MẪU SỐ CỦA MẬT ĐỘ BỊ GHIM Ở 30 — VÀ ĐÂY LÀ MỘT QUYẾT ĐỊNH CÓ CHỦ ĐÍCH, KHÔNG PHẢI SƠ SUẤT.**
 *
 * Mạng bàn cờ cũ chừa lại đúng **30 ô** cho nhà dân ở mọi kỷ, và toàn bộ bảng `ERA_DENSITY` (0,55…
 * 1,00) được hiệu chuẩn trên mẫu số ấy. Mạng theo kỷ (2026-08-24) chừa lại **27…77 ô** tuỳ kỷ.
 *
 * Nếu để mẫu số trôi theo thì một thay đổi về ĐƯỜNG sẽ lặng lẽ **nhân đôi số nhà** ở nửa số kỷ —
 * kỷ 1 đi từ 17 lên 39 căn. Đo được ngay: cả bộ test của Phase 14 §1(3) (chia ô thành khu phố) đỏ
 * lên, vì mọi ngưỡng ở đó hiệu chuẩn trên quần thể 371 ô của mạng cũ. Tức một phase về đường sẽ
 * kéo theo một phase về nhà mà không ai yêu cầu, và hai thay đổi trộn vào nhau thì không còn đo
 * riêng được cái nào (luật *"một commit một mục tiêu"*).
 *
 * ⇒ Giữ mẫu số ở 30. Đất dôi ra thành khoảng trống/vườn — và đó là một CƠ HỘI đã ghi lại cho phiên
 * sau (`TECH_DEBT #84`), không phải một thứ bị bỏ quên.
 * ⚠️ Vẫn kẹp theo số ô THẬT: kỷ nào chừa lại ít hơn 30 ô thì nhà phải ít đi, không thể mọc ra khỏi đất.
 */
export const LEGACY_PLOT_COUNT = 30;

export function densityCap(era) {
  const ratio = ERA_DENSITY[era] ?? ERA_DENSITY[1];
  return Math.round(Math.min(dwellingPlotCount(era), LEGACY_PLOT_COUNT) * ratio);
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

  const o = dwellingPlots(eraNum);
  const earned = Math.floor(sessions / SESSIONS_PER_DWELLING);
  const count = Math.min(densityCap(eraNum), earned, o.length);

  const out = [];
  for (let i = 0; i < count; i += 1) {
    const plot = o[i];
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
