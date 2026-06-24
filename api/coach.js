/**
 * api/coach.js — CỔNG tới Google Gemini (đám mây) cho AI Coach. Giữ GEMINI_API_KEY ở
 * server (Vercel env), KHÔNG lộ ra trình duyệt. Client gửi { system, messages } (đúng định
 * dạng buildLLMChatPrompt/buildLLMPrompt sinh ra) → đây map sang định dạng Gemini + gọi API.
 * MỌI prompt + lưới chống-bịa vẫn ở client (model-agnostic), file này chỉ là ống dẫn.
 */
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';

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

// Gọi MỘT model một lần. Trả Response (không retry — đổi model nhanh hơn là thử lại model đang sập).
function callModelOnce(model, key, system, messages, opts) {
  const payload = JSON.stringify(toGeminiBody(system, messages, {
    ...opts, thinkingBudget: model.includes('2.5') ? 0 : undefined, // chỉ 2.5 có "thinking" → tắt
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return sendJson(res, 503, { ok: false, error: 'no-key' }); // chưa cấu hình

  try {
    const body = await readJsonBody(req);
    const { system, messages, temperature, maxTokens, tier } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return sendJson(res, 400, { ok: false, error: 'no-messages' });
    }
    const opts = { temperature, maxTokens };
    // CHUỖI model theo tầng: 'deep' (phân tích 4 phần) thử pro trước; mặc định = flash nhanh.
    // Thử lần lượt, gặp lỗi quá-tải/hết-lượt → nhảy model kế. Lỗi khác (key/400) → dừng.
    const chain = buildModelChain(tier, process.env);

    let r; let usedModel = chain[0];
    for (const m of chain) {
      usedModel = m;
      r = await callModelOnce(m, key, system, messages, opts);
      if (r.ok || !shouldFallback(r.status)) break; // thành công, hoặc lỗi không-phải-quá-tải → dừng
    }
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return sendJson(res, 502, { ok: false, error: `gemini-${r.status}`, model: usedModel, detail: detail.slice(0, 1200) });
    }
    const data = await r.json();
    const text = extractGeminiText(data);
    if (!text) {
      return sendJson(res, 502, { ok: false, error: 'empty', detail: JSON.stringify(data?.promptFeedback ?? {}).slice(0, 300) });
    }
    return sendJson(res, 200, { ok: true, text, model: usedModel });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'cloud-failed' });
  }
}
