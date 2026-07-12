/**
 * api/_lib/gemini.js — hàm THUẦN cho việc gọi Google Gemini (chọn chuỗi model dự
 * phòng, dựng body request, đọc chữ ra khỏi phản hồi). Tách khỏi api/coach.js
 * (route handler, có I/O thật) theo đúng quy ước "_lib" đã dùng cho coachDigest.js.
 */

// CHUỖI MODEL: thử lần lượt, lỗi quá-tải/hết-lượt thì NHẢY sang model kế (dung lượng riêng).
// 2.5-flash (khôn nhất) → 2.5-flash-lite (nhẹ) → 2.0-flash (đời cũ, RẤT ổn định, ít 503).
const DEFAULT_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';
const FALLBACK_MODEL_2 = 'gemini-2.0-flash';
// Tầng "deep" cho bài PHÂN TÍCH 4 PHẦN (việc khó nhất): model MẠNH hơn, suy luận tốt hơn.
// Đứng ĐẦU chuỗi nhưng vẫn rơi về flash nếu pro quá tải → vừa khôn vừa có lưới an toàn.
const DEEP_MODEL = 'gemini-2.5-pro';

// Lỗi từ Gemini đáng để THỬ MODEL KHÁC: 503 (quá tải), 500 (lỗi tạm), 429 (chạm giới hạn free).
export function shouldFallback(status) {
  return status === 503 || status === 500 || status === 429;
}

/**
 * buildModelChain — THUẦN: dựng CHUỖI model theo tầng. 'deep' (bài phân tích 4 phần) thử
 * pro TRƯỚC rồi rơi về flash; mặc định (chat/nhắc) chỉ dùng chuỗi flash nhanh+rẻ. Bỏ trùng,
 * giữ thứ tự. Env ghi đè: GEMINI_MODEL(_FALLBACK/_FALLBACK2/_DEEP).
 */
export function buildModelChain(tier, env = {}) {
  const fast = [
    env.GEMINI_MODEL || DEFAULT_MODEL,
    env.GEMINI_MODEL_FALLBACK || FALLBACK_MODEL,
    env.GEMINI_MODEL_FALLBACK2 || FALLBACK_MODEL_2,
  ];
  const chain = tier === 'deep' ? [env.GEMINI_MODEL_DEEP || DEEP_MODEL, ...fast] : fast;
  return chain.filter((m, i, a) => m && a.indexOf(m) === i); // bỏ trùng, giữ thứ tự
}

/** toGeminiBody — THUẦN: { system, messages:[{role,content}] } → body Gemini generateContent. */
export function toGeminiBody(system, messages, opts = {}) {
  const contents = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] }));
  const generationConfig = {
    // Tác vụ CHÉP-LẠI-SỐ → nhiệt độ THẤP (0.2/0.8) để model ít chế số/trôi. Khớp chủ trương
    // tài liệu; callers (CoachChat/CoachOffline) cũng truyền 0.2. Nới lên chỉ ở commit riêng.
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.2,
    topP: typeof opts.topP === 'number' ? opts.topP : 0.8,
    maxOutputTokens: typeof opts.maxTokens === 'number' ? opts.maxTokens : 800,
  };
  // Tắt "thinking" của Gemini 2.5 Flash: đây là tác vụ CHÉP-LẠI-SỐ, không cần suy luận dài;
  // nếu để thinking ON nó ăn hết maxOutputTokens → câu trả lời bị cụt/rỗng. (0 = tắt hẳn.)
  if (typeof opts.thinkingBudget === 'number') {
    generationConfig.thinkingConfig = { thinkingBudget: opts.thinkingBudget };
  }
  const body = { contents, generationConfig };
  const sys = String(system ?? '').trim();
  if (sys) body.system_instruction = { parts: [{ text: sys }] };
  return body;
}

/** extractGeminiText — THUẦN: lấy chữ ra khỏi phản hồi Gemini (chịu được thiếu/bị chặn). */
export function extractGeminiText(data) {
  const parts = data?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) return parts.map((p) => p?.text || '').join('').trim();
  return '';
}
