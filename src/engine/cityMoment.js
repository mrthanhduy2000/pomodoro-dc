/**
 * cityMoment.js — ĐIỀU ĐÁNG NÓI VỀ THÀNH PHỐ, ở hai đầu của một phiên làm việc:
 *   • `buildFocusTease`   — TRƯỚC/TRONG phiên: phiên này đang đẩy cái gì tới đâu.
 *   • `buildGrowthMoment` — NGAY SAU phiên: thành phố vừa lớn lên như thế nào.
 *
 * Hai hàm dùng CHUNG một phép chọn "công trường gần xong nhất", nên chúng nằm cùng một file thay
 * vì chép phép sắp xếp đó ra hai nơi rồi để chúng trôi khỏi nhau — hai màn hình mà nói về hai công
 * trình khác nhau thì Đàm sẽ tưởng app đang đếm hai thứ.
 *
 * ── KHOẢNH KHẮC THÀNH PHỐ LỚN LÊN, ngay sau khi một phiên hoàn thành ──
 *
 * ⚠️ VÌ SAO TỒN TẠI:
 * Sau Phase 3H–3L, thành phố đã ĐỌC ĐƯỢC (biết còn bao xa, biết được gì) và SỜ ĐƯỢC (chạm vào
 * xem). Nhưng đúng khoảnh khắc đáng giá nhất — lúc chuông báo hết phiên — Đàm vẫn chỉ thấy một
 * hộp thoại vật phẩm. Thành phố có lớn lên thật, chỉ là **anh không được nhìn thấy nó lớn lên**.
 * Vòng lặp "làm việc → thấy thành quả" đứt đúng ở mắt xích cuối cùng, và đó là nguyên nhân đo được
 * cuối cùng của chữ "chán".
 *
 * ⚠️ LUẬT TRUNG THỰC — quan trọng hơn cả hiệu ứng:
 * Hàm này trả `null` khi thành phố **không** thay đổi gì trong phiên vừa rồi. Thà không có khoảnh
 * khắc nào còn hơn có một câu chúc mừng rỗng. Một lời khen sai một lần thì mọi lời khen sau đó đều
 * mất giá — đúng nguyên tắc chống-bịa mà cả AI Coach đang sống bằng nó (`engine/coach/guard.js`).
 *
 * THUẦN: không đọc store, không đụng `Date`, không DOM. Test bằng `node --test`.
 */

import {
  BLUEPRINT_LOOKUP, deriveProps, describeRoadCell, roadCellCount,
} from './cityLayout.js';
import { deriveResidentCount } from './city3d/residents.js';

const clamp01 = (value) => (Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0);

/** Tiến độ của công trình này TRƯỚC khi lùi lại `steps` bước. Thiếu tổng số phiên ⇒ về 0. */
function stepBack(scaffold, steps) {
  const total = scaffold.total;
  if (!Number.isFinite(total) || total <= 0) return 0;
  const remainingBefore = (Number.isFinite(scaffold.remaining) ? scaffold.remaining : 0) + steps;
  return clamp01(1 - remainingBefore / total);
}

/**
 * Công trường GẦN XONG NHẤT — dùng chung cho cả hai đầu của một phiên.
 * Cùng thứ tự với bảng "Đang xây" ở tab Thành Phố: ít phiên còn lại nhất trước, hoà thì theo id
 * cho tất định (không có `Date`/`Math.random` nào ở đây).
 */
function pickNearestScaffold(scaffolds) {
  return (Array.isArray(scaffolds) ? scaffolds : [])
    .filter((item) => item && typeof item.bpId === 'string')
    .sort((a, b) => (a.remaining - b.remaining) || a.bpId.localeCompare(b.bpId))[0];
}

/**
 * CÂU MỪNG cho một phiên đẩy giàn giáo lên một nấc — nói ĐÚNG cột mốc vừa đi qua.
 *
 * ⚠️ VÌ SAO TỒN TẠI (đo được, không phải cảm tính):
 * Trước 2026-08-12, nhánh này trả đúng MỘT câu cứng "Thành phố vừa lớn lên". Đo trên toàn bộ 75
 * bản vẽ = 420 phiên xây: cả game chỉ có **2 câu mừng**, và **82% số phiên đọc đúng 4 chữ đó**.
 * Với nhịp ~4 phiên/ngày thì Đàm gặp lại nó hơn 3 lần MỖI NGÀY. Màn thưởng mà là hằng số thì nó
 * thôi làm phần thưởng — đó chính là chữ "chán" ở dạng đo được.
 *
 * ⚠️ RÀNG BUỘC KHÔNG ĐƯỢC PHÁ: luật trung thực của cả file này (xem đầu file). Cách chữa nhàm
 * chán RẺ nhất là rắc lời khen ngẫu nhiên ("Tuyệt vời!", "Bạn giỏi quá!") — TUYỆT ĐỐI KHÔNG.
 * Một lời khen rỗng làm mọi lời khen sau đó mất giá, đúng nguyên tắc chống-bịa mà AI Coach đang
 * sống bằng nó. Vì vậy mọi câu ở đây đều là **mệnh đề ĐÚNG suy ra từ số liệu đã có**, không thêm
 * một dữ kiện nào mới: vừa khởi công · vừa qua nửa chặng · còn đúng một phiên. Không có gì để nói
 * khác thì quay về câu cũ, chứ không bịa ra một cái mốc không tồn tại.
 *
 * ⚠️ THỨ TỰ ƯU TIÊN là thứ tự "tin nào đáng nói nhất", không phải thứ tự thời gian:
 * "còn đúng một phiên" thắng tất cả vì đó là lúc đáng bấm Bắt đầu lần nữa nhất. Với công trình
 * 2 phiên thì phiên 1 vừa là khởi công vừa là "còn một phiên" — nói cái sau mới có ích.
 *
 * @param {number} remaining  số phiên còn lại SAU phiên vừa xong
 * @param {number} from       tiến độ TRƯỚC phiên này (đã tính cả đặc quyền Tăng tốc)
 * @param {number} to         tiến độ SAU phiên này
 * @param {boolean} knowsTotal  có biết tổng số phiên không — thiếu thì mọi cột mốc đều vô nghĩa
 */
function growthHeadline(remaining, from, to, knowsTotal) {
  if (remaining === 1) return 'Chỉ còn một phiên nữa';
  // Hàng đợi đã về 0 mà công trình chưa được báo là vừa xong — trạng thái chuyển tiếp, nhưng Đàm
  // vẫn đọc được nó. Dòng phụ đã nói "sắp xong" từ lâu; câu mừng thì bấy lâu vẫn chung chung.
  // ⚠️ CHỌN CHỮ CÓ CHỦ Ý: KHÔNG dùng "Sắp hoàn thành" — đọc lướt thì nó lẫn với câu của nhánh
  // hoàn thành thật ("Công trình đã hoàn thành"), mà hai câu này rơi vào hai phiên LIỀN NHAU nên
  // lẫn là chuyện chắc chắn xảy ra. "Đã làm đủ số phiên" vừa đúng nguyên văn điều đang xảy ra
  // (remaining = 0), vừa không thể nhầm với "công trình đã xong".
  if (remaining === 0) return 'Đã làm đủ số phiên';
  if (!knowsTotal) return 'Thành phố vừa lớn lên';
  // Vạch xuất phát bằng 0 ⇒ trước phiên này công trình chưa nhích một nấc nào: đây là phiên đầu.
  if (from <= 0) return 'Vừa khởi công';
  if (from < 0.5 && to >= 0.5) return 'Đã qua nửa chặng';
  return 'Thành phố vừa lớn lên';
}

/** Ghép danh sách tên thành một cụm đọc được: "A", "A và B", "A, B và C". */
function joinNames(names) {
  if (names.length <= 1) return names[0] ?? '';
  if (names.length === 2) return `${names[0]} và ${names[1]}`;
  return `${names.slice(0, -1).join(', ')} và ${names[names.length - 1]}`;
}

/**
 * Điều đáng nói nhất về thành phố NGAY SAU phiên vừa xong.
 *
 * @param {object} input
 * @param {string[]} [input.newlyBuilt]  bpId của công trình VỪA hoàn thành trong phiên này
 * @param {Array}    [input.scaffolds]   `layout.scaffolds` — công trình đang xây (đã có tiến độ)
 * @param {string[]} [input.acceleratedIds] bpId được đặc quyền đẩy nhanh THÊM 1 bước phiên này
 * @returns {{kind:'built'|'scaffold', icon:string, headline:string, detail:string,
 *            progress:number, fromProgress:number, bpId:string}|null}
 *          `null` = không có gì thật để khoe
 */
/**
 * Lễ mừng "thành phố lớn lên" chạy bao lâu (mili-giây).
 *
 * ⚠️ VÌ SAO CON SỐ NÀY NẰM Ở TẦNG ENGINE THUẦN chứ không nằm trong component vẽ nó.
 * Nó không chỉ là tham số hoạt hoạ — nó là một mốc trong NHỊP của một phiên, và nó có quan hệ với
 * một con số ở tận `timerSession.js` (`BREAK_START_DELAY_MS`, độ trễ trước khi phiên nghỉ bắt đầu
 * đếm). Chừng nào hai số đó còn nằm ở hai tầng không nói chuyện được với nhau thì không bài test
 * nào canh nổi quan hệ giữa chúng — mà chính khoảng lệch đó đang khiến lễ mừng bị tính vào giờ
 * nghỉ (xem `TECH_DEBT.md` #12). Đưa cả hai về tầng thuần là điều kiện để có hàng rào.
 */
export const GROWTH_MOMENT_MS = 3200;

export function buildGrowthMoment({
  newlyBuilt = [], scaffolds = [], acceleratedIds = [],
  // Bốn tham số dưới đây chỉ phục vụ nhánh 3 (xưởng trống). Thiếu chúng thì nhánh đó im lặng đúng
  // như hành vi cũ — nên mọi chỗ gọi cũ không phải sửa gì.
  era, buildingCount, sessionCount, streakLength,
} = {}) {
  // ── 1. Có công trình VỪA XONG — tin lớn nhất có thể có ────────────────────
  const built = (Array.isArray(newlyBuilt) ? newlyBuilt : [])
    .map((bpId) => ({ bpId, meta: BLUEPRINT_LOOKUP[bpId] }))
    .filter((entry) => entry.meta);

  if (built.length > 0) {
    return {
      kind: 'built',
      bpId: built[0].bpId,
      icon: built[0].meta.icon,
      headline: built.length > 1 ? 'Nhiều công trình đã hoàn thành' : 'Công trình đã hoàn thành',
      detail: joinNames(built.map((entry) => entry.meta.label)),
      progress: 1,
      // Chạy đầy từ 0: đây là một sự kiện "xong rồi", không phải một lời khẳng định về con số
      // trước đó — mà con số trước đó thì ta KHÔNG có (hàng đợi đã dọn cái này đi rồi).
      fromProgress: 0,
    };
  }

  // ── 2. Không thì: giàn giáo vừa cao thêm một nấc ──────────────────────────
  // Lấy cái GẦN XONG NHẤT, cùng thứ tự với bảng "Đang xây" ở tab Thành Phố — hai màn hình phải
  // nói về cùng một công trình, nếu không Đàm sẽ tưởng app đang đếm hai thứ khác nhau.
  const nearest = pickNearestScaffold(scaffolds);

  if (nearest) {
    // Đặc quyền "Tăng tốc" đẩy công trình này thêm 1 bước trong phiên vừa rồi hay không.
    const accelerated = (Array.isArray(acceleratedIds) ? acceleratedIds : []).includes(nearest.bpId);
    // ⚠️ Vạch XUẤT PHÁT của thanh tiến độ phải là con số THẬT của phiên trước, không phải đoán.
    // Bình thường một phiên = một bước; Tăng tốc thì lùi 2 bước. Vẽ nhảy sai một bước thì cái
    // thanh này đang nói dối về đúng thứ nó sinh ra để khoe.
    const fromProgress = stepBack(nearest, accelerated ? 2 : 1);
    const progress = clamp01(nearest.progress);
    const knowsTotal = Number.isFinite(nearest.total) && nearest.total > 0;
    const base = nearest.remaining > 0
      ? `${nearest.label} · còn ${nearest.remaining} phiên`
      : `${nearest.label} · sắp xong`;

    return {
      kind: 'scaffold',
      bpId: nearest.bpId,
      icon: nearest.icon ?? '🏗️',
      headline: growthHeadline(nearest.remaining, fromProgress, progress, knowsTotal),
      // Nói ra khi Tăng tốc VỪA có tác dụng. Đặc quyền này xưa nay chạy hoàn toàn im lặng — Đàm
      // trả giá cho nó mà không lần nào thấy nó làm việc; cú nhảy dài trên thanh tiến độ thì có
      // thấy nhưng không biết vì sao. Đây là một sự thật đang bị giấu, không phải lời khen thêm.
      detail: accelerated ? `${base} · Tăng tốc đẩy thêm 1 bước` : base,
      progress,
      fromProgress,
    };
  }

  // ── 3. Xưởng trống — nhưng thành phố VẪN nhúc nhích, và đó là sự thật bị bỏ quên ─────
  const tick = buildTickMoment({ era, buildingCount, sessionCount, streakLength });
  if (tick) return tick;

  // ── 4. Thành phố KHÔNG đổi gì ⇒ im lặng ──────────────────────────────────
  // Hiện một câu chúc mừng ở đây là nói dối, và chỉ cần nói dối một lần là mọi khoảnh khắc sau
  // đều rỗng.
  return null;
}

/**
 * ĐIỀU ĐÃ THẬT SỰ ĐỔI TRÊN BẢN ĐỒ khi xưởng trống — nhánh trả lời cho yêu cầu của Đàm ngày
 * 2026-08-14: *"mỗi phiên hoàn thành thì phải có nhà xây lên hay gì đó"*.
 *
 * ⚠️ VÌ SAO NHÁNH NÀY TRƯỚC ĐÂY KHÔNG THỂ TỒN TẠI, VÀ VÌ SAO NAY THÌ ĐƯỢC:
 * `TECH_DEBT #14` đo được **95% số phiên không có lễ mừng nào** — vì cả game chỉ có 420 bước xây,
 * còn lại là những phiên xưởng trống. Cách chữa RẺ là in một câu động viên chung chung, và luật
 * trung thực ở đầu file cấm đúng điều đó. Nhưng câu hỏi thật ra chưa bao giờ được hỏi cho tới hôm
 * nay: *phiên vừa rồi có thật sự không đổi gì không?* Không hề — mỗi phiên vẫn mở thêm **một ô
 * đường**, và cứ vài phiên lại thêm cư dân hoặc cảnh vật. Những thứ đó luôn có thật, chỉ là chưa
 * ai nói ra.
 *
 * ⚠️ KHÔNG TỰ SUY LUẬN "chắc là có thêm đường" — ĐO. Hàm gọi lại đúng `deriveProps` và
 * `deriveResidentCount` mà thành phố đang dùng để dựng hình, với `sessionCount` và
 * `sessionCount − 1`, rồi so hai kết quả. Nhờ vậy nó KHÔNG THỂ khoe một thứ không xảy ra: ngày
 * mạng đường mở hết 44 ô, nhánh đường tự tắt mà không cần ai nhớ sửa. Đây chính là luật
 * "một luật một công thức" áp cho lời khen.
 *
 * Thứ tự ưu tiên = thứ tự dễ nhìn thấy trên bản đồ: đường (đổi hình dạng thành phố) → cư dân
 * (người biết đi) → cảnh vật (cây cối).
 */
function buildTickMoment({ era, buildingCount, sessionCount, streakLength } = {}) {
  const n = Number.isFinite(sessionCount) ? Math.floor(sessionCount) : 0;
  const built = Number.isFinite(buildingCount) ? Math.floor(buildingCount) : 0;
  // Chưa có công trình nào thì chưa có đường, chưa có cư dân — và cũng chưa có gì để khoe.
  if (n < 1 || built < 1) return null;

  const shared = { era, buildingCount: built, streakLength };
  const before = deriveProps({ ...shared, sessionCount: n - 1 });
  const after = deriveProps({ ...shared, sessionCount: n });
  const roadsBefore = before.filter((p) => p.kind === 'road').length;
  const roadsAfter = after.filter((p) => p.kind === 'road').length;

  // ⚠️ MẪU SỐ THEO KỶ, KHÔNG PHẢI MỘT HẰNG SỐ CHUNG. Từ 2026-08-24 mỗi kỷ có một mạng đường riêng
  // (42…93 ô), nên một mẫu số chung sẽ nói dối ở 14/15 kỷ — và nói dối theo hướng tệ nhất cho một
  // thanh tiến độ: nó không bao giờ đầy, hoặc đầy từ lúc chưa xong.
  const tongO = roadCellCount(era);
  if (roadsAfter > roadsBefore && tongO > 0) {
    // ⚠️ TÌM ĐÚNG Ô VỪA MỞ, KHÔNG SUY RA TỪ SỐ ĐẾM. Cám dỗ là viết `ROAD_CELLS[roadsAfter - 1]` —
    // ngắn hơn và *gần như* luôn đúng. Nhưng `deriveProps` BỎ QUA những ô đường trùng chỗ với một
    // công trình đã đặt (`taken`), nên chỉ số trong danh sách và số ô thật sự đặt được lệch nhau
    // ngay khi thành phố có nhà — tức nó sai đúng ở mọi ca thực tế, và sai một cách im lặng: vẫn
    // ra một cái tên hợp lý, chỉ là tên của con đường khác.
    const seenBefore = new Set(before.filter((p) => p.kind === 'road').map((p) => `${p.x},${p.y}`));
    const opened = after.find((p) => p.kind === 'road' && !seenBefore.has(`${p.x},${p.y}`));
    const what = opened ? describeRoadCell(opened.x, opened.y, era) : 'một đoạn đường';
    // CỘT MỐC: ô đường CUỐI CÙNG của cả mạng lưới. Đây là dòng chữ cuối cùng về đường mà Đàm còn
    // được đọc trong kỷ này — sau đó nhánh đường tắt hẳn. Nói thẳng ra thì nó là một cái đích vừa
    // chạm tới; để nguyên câu "vừa mở thêm một đoạn…" thì cái đích ấy trôi qua không ai biết.
    // ⚠️ Vẫn là mệnh đề ĐÚNG suy từ số liệu (`roadsAfter === tongO`), không phải lời khen rỗng —
    // đúng luật trung thực ở đầu file.
    const complete = roadsAfter >= tongO;
    return {
      kind: 'tick',
      bpId: null,
      icon: '🛣️',
      headline: complete ? 'Mạng đường đã hoàn chỉnh' : 'Thành phố mở rộng',
      detail: complete
        ? `Mạng đường vừa khép kín · đủ ${tongO}/${tongO} ô đường`
        : `Vừa mở thêm ${what} · ${roadsAfter}/${tongO} ô đường`,
      progress: roadsAfter / tongO,
      fromProgress: roadsBefore / tongO,
    };
  }

  const peopleBefore = deriveResidentCount({ buildingCount: built, sessionCount: n - 1, streakLength });
  const peopleAfter = deriveResidentCount({ buildingCount: built, sessionCount: n, streakLength });
  if (peopleAfter > peopleBefore) {
    return {
      kind: 'tick',
      bpId: null,
      icon: '👥',
      headline: 'Thành phố đông thêm',
      // ⚠️ `progress` = `fromProgress` ⇒ component GIẤU thanh tiến độ. Cố ý: dân số không có mẫu
      // số nào cả, nên một cái thanh ở đây sẽ ngụ ý "sắp đầy" — một điều không ai từng nói.
      detail: peopleAfter - peopleBefore > 1
        ? `Thêm ${peopleAfter - peopleBefore} cư dân · tổng ${peopleAfter} người`
        : `Thêm một cư dân · tổng ${peopleAfter} người`,
      progress: 0,
      fromProgress: 0,
    };
  }

  const scatterBefore = before.length - roadsBefore;
  const scatterAfter = after.length - roadsAfter;
  if (scatterAfter > scatterBefore) {
    return {
      kind: 'tick',
      bpId: null,
      icon: '🌳',
      headline: 'Thành phố xanh thêm',
      detail: `Vừa mọc thêm ${scatterAfter - scatterBefore} mảng cảnh vật quanh phố`,
      progress: 0,
      fromProgress: 0,
    };
  }

  return null;
}

/**
 * ĐIỀU ĐÁNG NÓI TRƯỚC/TRONG PHIÊN: 25 phút sắp tới đang đẩy cái gì tới đâu.
 *
 * ⚠️ VÌ SAO TỒN TẠI: `buildGrowthMoment` khép được đuôi vòng lặp (xong phiên → thấy thành quả),
 * nhưng ĐẦU vòng lặp vẫn phẳng — lúc bấm "Bắt đầu", màn hình không nói gì về việc phiên này để
 * làm gì cho thành phố. Thẻ "Chuỗi" đã làm đúng việc này cho streak từ lâu ("Còn N ngày → mốc"),
 * còn thành phố thì chưa có gì tương đương. Đó là chỗ phẳng cuối cùng của chữ "chán".
 *
 * ⚠️ CÙNG LUẬT TRUNG THỰC với `buildGrowthMoment`: chỉ nói điều ĐANG đúng.
 *   • Có công trường ⇒ nói còn bao xa; sắp xong thì nói to hơn (đó mới là lúc đáng bấm Bắt đầu).
 *   • Xưởng trống mà Đàm ĐÃ từng xây ⇒ nói thẳng cái giá: phiên xong lúc này không đẩy công
 *     trình nào tiến thêm. Đây là sự thật, không phải lời hối thúc.
 *   • Chưa từng xây gì ⇒ IM LẶNG. Người mới chưa có xưởng để mà trống; nhắc lúc này là cằn nhằn.
 *
 * ⚠️ KHÔNG hứa hẹn gì về NGUYÊN LIỆU. Việc bản vẽ nào đủ nguyên liệu để khởi công là luật riêng
 * của `BuildingWorkshop` (đã unlock · đúng kỷ · chưa xây · đủ tài nguyên). Chép luật đó sang đây
 * là tạo ra một bản sao sẽ trôi khỏi bản gốc — và một lời mời "xây đi" mà bấm vào thì không đủ
 * nguyên liệu còn tệ hơn im lặng.
 *
 * @param {object} input
 * @param {Array}   [input.scaffolds] `layout.scaffolds` — công trình đang xây
 * @param {boolean} [input.hasBuilt]  Đàm đã từng hoàn thành ít nhất một công trình chưa
 * @returns {{tone:'imminent'|'progress'|'idle', icon:string, text:string, bpId:string|null,
 *            progress:number}|null}  `null` = không có gì đáng nói
 */
export function buildFocusTease({ scaffolds = [], hasBuilt = false } = {}) {
  const nearest = pickNearestScaffold(scaffolds);

  if (nearest) {
    const remaining = Number.isFinite(nearest.remaining) ? nearest.remaining : 0;
    // `remaining <= 1` gộp cả 0: hàng đợi có thể đã về 0 mà chưa kịp dọn, và với người dùng thì
    // "còn 0 phiên" với "còn 1 phiên" đều có nghĩa là PHIÊN TỚI LÀ XONG.
    if (remaining <= 1) {
      return {
        tone: 'imminent',
        icon: nearest.icon ?? '🏗️',
        text: `Phiên tới hoàn thành ${nearest.label}`,
        bpId: nearest.bpId,
        progress: clamp01(nearest.progress),
      };
    }
    return {
      tone: 'progress',
      icon: nearest.icon ?? '🏗️',
      text: `Đang xây ${nearest.label} · còn ${remaining} phiên`,
      bpId: nearest.bpId,
      progress: clamp01(nearest.progress),
    };
  }

  if (hasBuilt) {
    return {
      tone: 'idle',
      icon: '🏚️',
      text: 'Xưởng đang trống — phiên xong lúc này không đẩy công trình nào tiến thêm',
      bpId: null,
      progress: 0,
    };
  }

  return null;
}
