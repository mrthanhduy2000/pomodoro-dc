/**
 * renderMode.js — quyết định vẽ Thành Phố bằng 3D hay 2D.
 *
 * THUẦN 100%: không import three, không đụng DOM, không đọc store. Mọi thứ thuộc về trình duyệt
 * (có WebGL2 không, máy mấy nhân, đang tiết kiệm dữ liệu không) được TRUYỀN VÀO dưới dạng dữ liệu
 * đã đo sẵn. Nhờ vậy toàn bộ luật quyết định test được bằng `node --test` mà không cần trình duyệt.
 * Cùng khuôn với `detectWebLLMCapable(nav, win)` mà dự án từng dùng trước khi gỡ WebLLM.
 *
 * ⚠️ FAIL-CLOSED: không đo được, không chắc chắn, hay có bất kỳ dấu hiệu rủi ro nào → trả về `'2d'`.
 * Đường lui 2D luôn chạy được; đoán bừa rồi màn hình đen thì không cứu được. Đây là lý do hàm này
 * bắt buộc nhận đủ ngữ cảnh thay vì tự mò `globalThis` bên trong.
 */

/** Ngưỡng "máy quá yếu" — dưới mức này thì 3D không đáng, 2D vẫn đẹp. */
export const MIN_CORES = 2;
export const MIN_DEVICE_MEMORY_GB = 2;

/** Ba chế độ Đàm chọn được trong Cài đặt. */
export const RENDER_MODES = ['auto', '3d', '2d'];

export function normalizeRenderMode(value) {
  return RENDER_MODES.includes(value) ? value : 'auto';
}

/**
 * Đọc các dấu hiệu về máy từ `navigator`. Trả về DỮ LIỆU THUẦN để `decideRenderMode` chấm.
 * Tách riêng khỏi phần quyết định vì đây là chỗ duy nhất chạm vào API trình duyệt.
 *
 * @param {object} [nav] `navigator` (hoặc bản giả trong test)
 * @returns {{cores:number|null, memoryGb:number|null, saveData:boolean}}
 */
export function readDeviceHints(nav) {
  const n = nav ?? (typeof navigator !== 'undefined' ? navigator : null);
  if (!n) return { cores: null, memoryGb: null, saveData: false };

  // ⚠️ Safari KHÔNG có `deviceMemory` và (tới nay) cũng không có `connection` — cả hai sẽ là null.
  // Vì vậy hai dấu hiệu này chỉ dùng để LOẠI khi biết chắc là yếu, không dùng để cho phép.
  // Nếu coi "thiếu thông tin" là "máy yếu" thì mọi iPhone đều rớt, tức là giết luôn mục tiêu.
  const cores = Number.isFinite(n.hardwareConcurrency) ? n.hardwareConcurrency : null;
  const memoryGb = Number.isFinite(n.deviceMemory) ? n.deviceMemory : null;
  const saveData = n.connection?.saveData === true;

  return { cores, memoryGb, saveData };
}

/**
 * Chấm điểm: có nên thử 3D không?
 *
 * @param {object} input
 * @param {'auto'|'3d'|'2d'} input.preference    lựa chọn của Đàm trong Cài đặt
 * @param {boolean|null} input.hasWebGL2         kết quả dò THẬT (đã tạo thử context), null = chưa đo
 * @param {{cores:number|null, memoryGb:number|null, saveData:boolean}} [input.hints]
 * @returns {{mode:'3d'|'2d', reason:string}} `reason` là mã ngắn để hiện trong HUD/Cài đặt
 */
export function decideRenderMode({ preference, hasWebGL2, hints } = {}) {
  const pref = normalizeRenderMode(preference);

  // Đàm ép 2D → tôn trọng tuyệt đối, không bàn thêm.
  if (pref === '2d') return { mode: '2d', reason: 'user-2d' };

  // Chưa dò xong thì CHƯA được dựng WebGL — hiện 2D trước, đổi sau khi có kết quả.
  if (hasWebGL2 !== true) {
    return { mode: '2d', reason: hasWebGL2 === false ? 'no-webgl2' : 'probing' };
  }

  // Đàm ép 3D → chỉ cần máy thật sự có WebGL2, bỏ qua các dấu hiệu "yếu" ở dưới.
  if (pref === '3d') return { mode: '3d', reason: 'user-3d' };

  const { cores = null, memoryGb = null, saveData = false } = hints ?? {};

  // Người dùng đã bật "tiết kiệm dữ liệu" ở mức hệ điều hành/trình duyệt: tải thêm ~130 KB cho
  // một tab trang trí là đi ngược lại điều họ vừa yêu cầu.
  if (saveData) return { mode: '2d', reason: 'save-data' };

  // Chỉ LOẠI khi biết CHẮC là yếu (giá trị có thật và thấp). Thiếu thông tin ⇒ không loại.
  if (cores !== null && cores < MIN_CORES) return { mode: '2d', reason: 'low-cores' };
  if (memoryGb !== null && memoryGb < MIN_DEVICE_MEMORY_GB) return { mode: '2d', reason: 'low-memory' };

  return { mode: '3d', reason: 'auto-ok' };
}

/** Câu giải thích ngắn cho HUD/Cài đặt — để Đàm biết vì sao đang thấy 2D. */
export const RENDER_MODE_REASON_LABEL = {
  'user-2d':    'bạn đã chọn 2D trong Cài đặt',
  'user-3d':    'bạn đã chọn 3D trong Cài đặt',
  'auto-ok':    'máy chạy được 3D',
  'probing':    'đang kiểm tra khả năng của máy',
  'no-webgl2':  'máy hoặc trình duyệt này không có WebGL2',
  'save-data':  'đang bật chế độ tiết kiệm dữ liệu',
  'low-cores':  'máy quá ít nhân xử lý',
  'low-memory': 'máy quá ít bộ nhớ',
  // ⚠️ Bảng này CHỈ nói về quyết định TRƯỚC khi dựng cảnh. Lý do 3D hỏng GIỮA CHỪNG (mất context,
  // dựng thất bại, chạy quá chậm) nằm ở `components/city/CityStage.jsx` — hai bảng cố ý tách rời
  // để không ai phải đoán xem một mã lý do thuộc giai đoạn nào.
};

export function describeRenderMode(reason) {
  return RENDER_MODE_REASON_LABEL[reason] ?? 'không rõ lý do';
}
