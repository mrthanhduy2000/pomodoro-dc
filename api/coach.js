/**
 * api/coach.js — CỔNG tới Google Gemini (đám mây) cho AI Coach. Giữ GEMINI_API_KEY ở
 * server (Vercel env), KHÔNG lộ ra trình duyệt. Client gửi { system, messages } (đúng định
 * dạng buildLLMChatPrompt/buildLLMPrompt sinh ra) → đây map sang định dạng Gemini + gọi API.
 * MỌI prompt + lưới chống-bịa vẫn ở client (model-agnostic), file này chỉ là ống dẫn.
 */
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';
import { shouldFallback, buildModelChain, toGeminiBody, extractGeminiText } from './_lib/gemini.js';

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
