/**
 * cityCompletion.js — "TRỌN VẸN KỶ": mỗi kỷ có đúng 5 công trình, và đây là chỗ trả lời câu
 * **đã xây mấy trên mấy, còn thiếu cái nào**.
 *
 * THUẦN tuyệt đối: không `Date`, không `Math.random`, không DOM, không store. Toàn bộ file là hàm
 * của (kỷ, danh sách đã xây) — nghĩa là suy ra được, không lưu, **không tốn một byte nào** trong
 * JSONB đang tranh chấp CAS trên Supabase. Cùng nguyên tắc đã dùng cho cảnh vật (`deriveProps`) và
 * cư dân (`residents.js`).
 *
 * ⚠️ VÌ SAO ĐÂY LÀ TÍNH NĂNG CHỨ KHÔNG PHẢI MỘT DÒNG CHỮ ĐẸP:
 * Trước file này, cả app không có chỗ nào nói ra con số **5**. Màn hình Thành Phố hiện "Công
 * trình: 3" — 3 trên mấy thì không ai biết, kể cả Đàm. Một con số không có mẫu số thì không phải
 * mục tiêu, nó chỉ là một con số; và không có mục tiêu thì chẳng có lý do gì để làm thêm phiên nữa
 * ngoài thói quen. Có mẫu số thì cùng màn hình đó đọc ra "**còn 2 công trình nữa là trọn vẹn kỷ
 * này**" — một câu Đàm hành động được ngay hôm nay.
 *
 * Và vì kỷ cũ bị niêm phong VĨNH VIỄN (`pruneEraScopedBlueprintState` cắt sạch, `cityArchive` chụp
 * lại — xem ADR-007), con số đó còn tạo ra thứ mà bảo tàng đang thiếu: **một điểm số không sửa
 * được nữa**. Kỷ xây trọn vẹn 5/5 được gắn sao vĩnh viễn; kỷ bỏ dở thì mãi mãi 3/5. Đó là khác
 * biệt giữa một album ảnh và một bảng thành tích.
 *
 * ⚠️ TỰ ĐẾM `BLUEPRINT_CATALOG`, KHÔNG HARDCODE SỐ 5. Hôm nay cả 15 kỷ đều đúng 5 bản vẽ
 * (2 common + 2 rare + 1 epic), nhưng viết cứng con số đó vào đây là gài một quả mìn: ngày nào
 * thêm bản vẽ thứ 6 cho một kỷ thì màn hình sẽ báo "5/5 trọn vẹn" trong khi còn thiếu một cái, mà
 * **không có gì đỏ lên cả**. Có bài test khoá riêng chuyện này.
 */

import { BLUEPRINT_CATALOG } from './constants';

/**
 * kỷ → danh sách bản vẽ của kỷ đó, GIỮ NGUYÊN thứ tự catalog.
 *
 * ⚠️ Thứ tự catalog KHÔNG phải chuyện thẩm mỹ: nó chính là `rank` mà `cityLayout` dùng để chia khu
 * đất (hạng 4 = kỳ quan = khu trung tâm). Danh sách trên màn hình đi theo đúng thứ tự đó thì hàng
 * thứ n trong bảng và căn nhà ở khu thứ n là cùng một thứ; sắp lại theo alphabet hay theo "đã xây
 * trước" sẽ cắt đứt mối liên hệ đó.
 */
const ERA_BLUEPRINTS = {};
for (const [eraKey, list] of Object.entries(BLUEPRINT_CATALOG)) {
  ERA_BLUEPRINTS[Number(eraKey)] = list.map((bp) => ({
    bpId:   bp.id,
    label:  bp.label,
    icon:   bp.icon,
    rarity: bp.rarity,
  }));
}

/** Toàn bộ bản vẽ của một kỷ. Kỷ lạ → mảng rỗng (không ném lỗi: đây là đường vẽ màn hình). */
export function listEraBlueprints(era) {
  return ERA_BLUEPRINTS[era] ?? [];
}

/**
 * Bảng sưu tập của MỘT kỷ.
 *
 * @param {object}   args
 * @param {number}   args.era        kỷ đang xét
 * @param {string[]} [args.built]    bpId đã xây (state sống nếu là kỷ hiện tại, ảnh chụp nếu là
 *                                   kỷ đã niêm phong)
 * @param {Array}    [args.pending]  hàng đợi đang xây — `[{ bpId }]`, shape của `craftingQueue`.
 *                                   CHỈ có ở kỷ hiện tại; bảo tàng thì không còn ai đang xây gì.
 * @returns {{
 *   era:number, total:number, done:number, ratio:number, isComplete:boolean,
 *   slots: Array<{bpId,label,icon,rarity,state:'built'|'building'|'empty'}>,
 *   missing: Array<{bpId,label,icon,rarity}>
 * }}
 *
 * ⚠️ `done` chỉ đếm công trình ĐÃ XONG, tuyệt đối không cộng cái đang xây vào. "4/5" trong khi cái
 * thứ tư mới dựng được nửa giàn giáo là một lời nói dối nhỏ, và nó phá đúng thứ khiến con số này
 * đáng tin: khoảnh khắc nó nhảy lên phải TRÙNG với khoảnh khắc căn nhà hiện ra trong cảnh 3D.
 * Trạng thái `'building'` tồn tại để màn hình vẫn phân biệt được "đang tới" và "chưa đụng vào".
 *
 * ⚠️ `built` có thể chứa id của kỷ KHÁC (dữ liệu lệch từ cloud, hoặc file import cũ). Ở đây lọc
 * theo danh sách bản vẽ của chính kỷ này chứ không tin đầu vào — nếu không, `done` có thể vượt quá
 * `total` và cho ra "6/5".
 */
export function summarizeEraCompletion({ era, built, pending } = {}) {
  const blueprints = listEraBlueprints(era);
  const builtSet   = new Set(Array.isArray(built) ? built : []);
  const pendingSet = new Set(
    (Array.isArray(pending) ? pending : [])
      .map((item) => (typeof item === 'string' ? item : item?.bpId))
      .filter(Boolean),
  );

  const slots = blueprints.map((bp) => ({
    ...bp,
    state: builtSet.has(bp.bpId)
      ? 'built'
      : (pendingSet.has(bp.bpId) ? 'building' : 'empty'),
  }));

  const done  = slots.filter((slot) => slot.state === 'built').length;
  const total = slots.length;

  return {
    era,
    total,
    done,
    // Kỷ lạ (total = 0) → 0 chứ không phải NaN hay 1. Một kỷ không có bản vẽ nào thì không thể nói
    // là "đã trọn vẹn" — nói thế là gắn sao cho dữ liệu hỏng.
    ratio: total > 0 ? done / total : 0,
    isComplete: total > 0 && done === total,
    slots,
    missing: slots.filter((slot) => slot.state !== 'built'),
  };
}

/**
 * Gắn bảng sưu tập vào danh sách kỷ của `listVisitableEras`.
 *
 * ⚠️ VÌ SAO LÀ MỘT LỚP RIÊNG CHỨ KHÔNG SỬA THẲNG `listVisitableEras`: hàm đó thuộc `cityArchive.js`
 * và chỉ biết về BẢO TÀNG, tức là ảnh chụp của quá khứ. Kỷ ĐANG chơi không có mặt trong bảo tàng
 * (chưa niêm phong), nên `era.built` của nó luôn là mảng rỗng. Nhét state sống vào `cityArchive.js`
 * là kéo một tầng biết-hiện-tại vào một tầng cố ý chỉ biết-quá-khứ. Ghép ở ngoài thì mỗi tầng giữ
 * đúng một trách nhiệm — và đây chính là "Composition over Duplication" trong Playbook.
 *
 * @param {Array}    eras         kết quả `listVisitableEras(...)`
 * @param {object}   [live]
 * @param {string[]} [live.built]    công trình của kỷ HIỆN TẠI, lấy từ state sống
 * @param {Array}    [live.pending]  hàng đợi đang xây của kỷ hiện tại
 * @returns {Array} cùng mảng đó, mỗi phần tử thêm khoá `completion`
 */
export function withEraCompletion(eras, live = {}) {
  if (!Array.isArray(eras)) return [];
  return eras.map((entry) => {
    const isCurrent = !!entry?.isCurrent;
    return {
      ...entry,
      completion: summarizeEraCompletion({
        era:     entry?.era,
        built:   isCurrent ? live.built   : entry?.built,
        pending: isCurrent ? live.pending : null,
      }),
    };
  });
}

/**
 * Điểm tổng của cả bảo tàng — con số duy nhất trả lời "tôi đã đi được bao xa".
 *
 * ⚠️ KHÔNG đếm kỷ THẤT TRUYỀN vào mẫu số. Những kỷ đó Đàm đã đi qua TRƯỚC khi bảo tàng được dựng
 * (2026-08-12), nên chúng rỗng vì lý do kỹ thuật chứ không phải vì anh bỏ dở. Tính chúng là "0/5"
 * thì màn hình sẽ trách anh về một chuyện anh không hề làm — và tệ hơn, con số đó KHÔNG BAO GIỜ
 * sửa được nữa, nên nó sẽ đứng đó vĩnh viễn. Xem `MIGRATION.md` schema 3→4.
 */
export function summarizeMuseum(erasWithCompletion) {
  const list = (Array.isArray(erasWithCompletion) ? erasWithCompletion : [])
    .filter((entry) => entry?.completion && !entry.isLost);

  return {
    countedEras:   list.length,
    completeEras:  list.filter((entry) => entry.completion.isComplete).length,
    builtTotal:    list.reduce((sum, entry) => sum + entry.completion.done, 0),
    possibleTotal: list.reduce((sum, entry) => sum + entry.completion.total, 0),
  };
}
