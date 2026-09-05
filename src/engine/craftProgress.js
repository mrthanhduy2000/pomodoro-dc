/**
 * craftProgress.js — MỘT công thức duy nhất cho câu "công trình này xây tới đâu rồi".
 *
 * THUẦN tuyệt đối: không `Date`, không `Math.random`, không DOM, không store.
 *
 * ⚠️ VÌ SAO TÁCH RA (2026-08-13, Phase 4E): cùng một con số đang được tính ở HAI nơi bằng HAI công
 * thức khác nhau — `cityLayout.js` (giàn giáo trong thành phố 3D) và `BuildingWorkshop.jsx` (hàng
 * chờ xây dựng). Bản trong `cityLayout` **kẹp giá trị** ở mọi biên; bản trong `BuildingWorkshop`
 * thì không kẹp gì cả. Hệ quả nhìn thấy được bằng mắt: một mục hàng đợi có `sessionsRemaining` lớn
 * hơn `sessionsToComplete` (dữ liệu lệch từ cloud, file import cũ, hoặc một bản cân bằng lại rút
 * ngắn số phiên của bản vẽ) hiện ra thành **`-4/2 phiên`** với thanh tiến độ rỗng — trong khi CÙNG
 * công trình đó ở tab Thành Phố vẫn vẽ đúng một cọc mốc thấp. Hai màn hình nói hai chuyện khác nhau
 * về một sự thật.
 *
 * Đây đúng là hình dạng sai mà `CLAUDE.md` đã ghi thành luật: **"một luật chỉ được có một công
 * thức — thấy hai chỗ cùng phát biểu một luật thì gộp lại NGAY"**. Hai công thức "tương đương trên
 * giấy" gần như luôn lệch nhau ở BIÊN, và biên chính là chỗ dữ liệu hỏng đi qua.
 *
 * ⚠️ VÀ CÓ MỘT LỆCH THỨ HAI, ÂM THẦM HƠN: hai nơi đọc `sessionsToComplete` từ **hai bảng khác
 * nhau** — `BUILDING_EFFECTS` (cityLayout) và `BLUEPRINT_META` (workshop). Hôm nay hai bảng khớp
 * nhau 75/75 (đã đo), nên **chưa** có lỗi nào đang xảy ra — đừng đọc đoạn này thành "đang hỏng".
 * Nhưng không có gì bắt chúng phải khớp mãi, và ngày chúng lệch thì hai màn hình sẽ hiện hai tiến
 * độ khác nhau cho cùng một công trình mà **không có gì đỏ lên**. File này chốt `BUILDING_EFFECTS`
 * làm nguồn duy nhất, và `craftProgress.test.js` có một bài canh hai bảng phải luôn khớp.
 */

import { BUILDING_EFFECTS, BLUEPRINT_CATALOG } from './constants';

/** Số phiên còn lại, đã làm sạch: không âm, không lẻ, đầu vào rác → 0. */
function safeRemaining(value) {
  return Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

/**
 * Tiến độ xây của MỘT mục trong `craftingQueue`.
 *
 * @param {string} bpId
 * @param {number} sessionsRemaining  số phiên còn lại (shape thật của `craftingQueue`)
 * @returns {{
 *   total: number|null,      // tổng số phiên — `null` khi KHÔNG biết (bản vẽ lạ)
 *   remaining: number,       // còn lại, đã kẹp vào [0, total]
 *   done: number,            // đã xong, đã kẹp vào [0, total]
 *   ratio: number,           // 0..1
 *   pct: number,             // 0..100, đã làm tròn
 * }}
 *
 * ⚠️ `total = null` (bản vẽ lạ) ⇒ `ratio` bằng **0**, KHÔNG phải 1 và không phải NaN. Không biết
 * tổng thì không được đoán bừa một tỉ lệ: một cọc mốc thấp nói đúng "chỗ này sắp có nhà, chưa rõ
 * còn bao xa", còn một thanh đầy sẽ hứa một công trình sắp xong mà không ai biết có thật không.
 *
 * ⚠️ MỌI GIÁ TRỊ ĐỀU ĐƯỢC KẸP, kể cả khi đầu vào vô lý (`remaining` > `total`). Đây không phải sự
 * cẩn thận thừa: `craftingQueue` đi qua Supabase và qua cả chức năng nhập file, nên nó là dữ liệu
 * NGOÀI. Và cái giá của việc không kẹp không phải một dòng log — nó là chữ "-4/2 phiên" hiện thẳng
 * lên màn hình của Đàm.
 */
export function describeCraftProgress(bpId, sessionsRemaining) {
  const rawTotal = BUILDING_EFFECTS[bpId]?.sessionsToComplete;
  const total = Number.isFinite(rawTotal) && rawTotal > 0 ? Math.floor(rawTotal) : null;
  const raw = safeRemaining(sessionsRemaining);

  const remaining = total === null ? raw : Math.min(raw, total);
  const done  = total === null ? 0 : total - remaining;
  const ratio = total === null ? 0 : done / total;

  return { total, remaining, done, ratio, pct: Math.round(ratio * 100) };
}


/**
 * Tên hiển thị của một bản vẽ. NGUỒN DUY NHẤT: `BLUEPRINT_CATALOG`.
 *
 * ⚠️ BA LẦN CHÉP, BA LẦN SAI — trong đúng MỘT phiên (2026-09-02):
 *   1. hỏi `BLUEPRINT_META[id].name` → trường `name` KHÔNG tồn tại ở bảng nào cả (tất cả dùng
 *      `label`), nên dải hero hiện "Công trình sẽ mọc lên trong thành phố." cho MỌI công trình;
 *   2. hỏi `BLUEPRINT_CATALOG.find(...)` → nó là OBJECT các mảng theo kỷ, không phải một mảng,
 *      nên `.find` trả `undefined` trong im lặng;
 *   3. hỏi `BUILDING_EFFECTS[id].label` → **0/75 mục của bảng ấy có `label`** (đã đếm). Nhánh này
 *      là mã chết ngay từ lúc viết ra, và nó "chạy được" chỉ nhờ nhánh dự phòng phía sau.
 * Cả ba đều im lặng vì `??` nuốt gọn và câu hỏng đọc lên vẫn xuôi tai. Nay chỉ còn MỘT hàm, và
 * nó KHÔNG có nhánh dự phòng nào để giấu lỗi lần thứ tư.
 */
export function blueprintLabel(bpId, fallback = 'Công trình') {
  if (!bpId) return fallback;
  for (const ds of Object.values(BLUEPRINT_CATALOG ?? {})) {
    const bp = (Array.isArray(ds) ? ds : []).find((b) => b?.id === bpId);
    if (bp?.label) return bp.label;
  }
  return fallback;
}
