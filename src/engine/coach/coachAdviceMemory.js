/**
 * coachAdviceMemory.js — BỘ NHỚ LỜI KHUYÊN (cá nhân hoá). Ghi lại lời khuyên ĐÁNG KỂ Coach đã
 * đưa — hiện tại: gợi ý chỉnh MỤC TIÊU NGÀY (lời khuyên cụ thể, có số, lặp lại theo thời gian) —
 * kèm số liệu LÚC ĐÓ, để sau này Coach "nhớ" và theo dõi: "khoảng N ngày trước gợi ý X, đối
 * chiếu với hiện tại…". Biến Coach từ công cụ phân-tích-một-lần thành mối quan hệ theo thời gian.
 *
 * ⚠️ TRUNG THỰC (giữ tài sản quý): chỉ lưu số THẬT (parse từ chính dòng context người dùng thấy);
 * dòng nhắc-nhớ phát biểu THUẦN TƯƠNG QUAN ("đối chiếu", "theo thời gian"), KHÔNG nhân-quả (prompt
 * đã cấm vì/nên/do…). Mọi con số trong dòng đều NẰM trong context nên lưới chống-bịa không báo nhầm.
 *
 * Phần CỐT LÕI thuần (test được); load/save chạm localStorage (gói riêng, an toàn khi thiếu).
 */

export const ADVICE_KEY = 'dc-coach-advice-v1';
const MAX_RECORDS = 10;
const DEFAULT_COOLDOWN_DAYS = 2; // trong 2 ngày + cùng giá trị gợi ý → không ghi lại (khỏi trùng)
const DAY_MS = 86400000;

function pickStorage(storage) {
  if (storage) return storage;
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function loadAdviceMemory(storage) {
  try {
    const s = pickStorage(storage);
    if (!s) return [];
    const arr = JSON.parse(s.getItem(ADVICE_KEY) || '[]');
    return Array.isArray(arr) ? arr.filter((r) => r && typeof r === 'object' && Number.isFinite(r.at)) : [];
  } catch { return []; }
}

export function saveAdviceMemory(list, storage) {
  try {
    const s = pickStorage(storage);
    if (!s) return;
    s.setItem(ADVICE_KEY, JSON.stringify((Array.isArray(list) ? list : []).slice(-MAX_RECORDS)));
  } catch { /* đầy/chặn → bỏ qua */ }
}

/**
 * parseGoalAdviceFromContext — THUẦN. Rút lời khuyên chỉnh-mục-tiêu từ dòng context (định dạng
 * do coachContext sinh: "Mục tiêu ngày hơi quá sức: đạt X% trên Y ngày, … thử chỉnh về Z phiên/ngày").
 * ⚠️ Đổi định dạng dòng đó ở coachContext PHẢI sửa regex này. Trả {verdict,goalRate,daysCounted,suggested,unit}|null.
 */
export function parseGoalAdviceFromContext(context) {
  const m = String(context ?? '').match(
    /Mục tiêu ngày (hơi quá sức|hơi nhẹ): đạt (\d+)% trên (\d+) ngày,[^\n]*?thử chỉnh về ([\d.,]+) (phiên|phút)\/ngày/u,
  );
  if (!m) return null;
  return {
    verdict: m[1] === 'hơi quá sức' ? 'too-hard' : 'too-easy',
    goalRate: Number(m[2]),
    daysCounted: Number(m[3]),
    suggested: m[4], // giữ NGUYÊN chuỗi ("2"/"2.5") để khớp hiển thị
    unit: m[5],
  };
}

/**
 * recordGoalAdvice — THUẦN. Thêm bản ghi nếu ĐÁNG (chưa có bản ghi cùng loại trong cooldown,
 * HOẶC giá trị gợi ý đã đổi). Trả { list, changed } (changed=false → khỏi ghi localStorage).
 */
export function recordGoalAdvice(list, advice, now, opts = {}) {
  const base = Array.isArray(list) ? list : [];
  if (!advice || !Number.isFinite(now)) return { list: base, changed: false };
  const cooldownMs = (opts.cooldownDays ?? DEFAULT_COOLDOWN_DAYS) * DAY_MS;
  const lastSame = [...base].reverse().find((r) => r.type === 'goalCalibration');
  if (lastSame && (now - lastSame.at) < cooldownMs && String(lastSame.suggested) === String(advice.suggested)) {
    return { list: base, changed: false }; // gần đây + cùng gợi ý → khỏi ghi
  }
  const rec = {
    at: now,
    type: 'goalCalibration',
    suggested: String(advice.suggested),
    unit: advice.unit,
    goalRate: advice.goalRate,
    daysCounted: advice.daysCounted,
    verdict: advice.verdict,
  };
  return { list: [...base, rec].slice(-MAX_RECORDS), changed: true };
}

/**
 * pickGoalFollowup — THUẦN. Chọn bản ghi chỉnh-mục-tiêu ĐỦ CŨ để có "câu chuyện từ đó tới nay"
 * (tuổi trong [minAgeDays, maxAgeDays]), MỚI NHẤT trong cửa sổ đó. null nếu không có.
 */
export function pickGoalFollowup(list, now, opts = {}) {
  const base = Array.isArray(list) ? list : [];
  if (!Number.isFinite(now)) return null;
  const minMs = (opts.minAgeDays ?? 3) * DAY_MS;
  const maxMs = (opts.maxAgeDays ?? 21) * DAY_MS;
  return base
    .filter((r) => r.type === 'goalCalibration' && Number.isFinite(r.at))
    .filter((r) => { const age = now - r.at; return age >= minMs && age <= maxMs; })
    .sort((a, b) => b.at - a.at)[0] ?? null;
}

/**
 * buildAdviceMemoryLine — THUẦN. Dòng "Ghi nhớ" nhắc lại lời khuyên cũ + số liệu LÚC ĐÓ, mời đối
 * chiếu với hiện tại (THUẦN tương quan, không nhân-quả). '' nếu không có followup. Mọi số nằm
 * trong dòng → guard-safe.
 */
export function buildAdviceMemoryLine(followup, now) {
  if (!followup || !Number.isFinite(now)) return '';
  const days = Math.max(1, Math.round((now - followup.at) / DAY_MS));
  const unit = followup.unit || 'phiên';
  return `Ghi nhớ: khoảng ${days} ngày trước Coach từng gợi ý chỉnh mục tiêu ngày về ${followup.suggested} ${unit}/ngày (khi đó tỉ lệ đạt mục tiêu là ${followup.goalRate}% trên ${followup.daysCounted} ngày). Có thể đối chiếu với tỉ lệ đạt mục tiêu hiện tại để xem thay đổi theo thời gian. Đây là tương quan, không phải kết luận.`;
}
