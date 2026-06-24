/**
 * api/coach.js — CỔNG tới Google Gemini (đám mây) cho AI Coach. Giữ GEMINI_API_KEY ở
 * server (Vercel env), KHÔNG lộ ra trình duyệt. Client gửi { system, messages } (đúng định
 * dạng buildLLMChatPrompt/buildLLMPrompt sinh ra) → đây map sang định dạng Gemini + gọi API.
 * MỌI prompt + lưới chống-bịa vẫn ở client (model-agnostic), file này chỉ là ống dẫn.
 */
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';

const DEFAULT_MODEL = 'gemini-2.5-flash'; // CHÍNH (free tier; đổi qua env GEMINI_MODEL)
const FALLBACK_MODEL = 'gemini-2.5-flash-lite'; // DỰ PHÒNG khi chính quá tải/hết lượt (env GEMINI_MODEL_FALLBACK)

// Lỗi từ Gemini đáng để THỬ MODEL KHÁC: 503 (quá tải), 500 (lỗi tạm), 429 (chạm giới hạn free).
export function shouldFallback(status) {
  return status === 503 || status === 500 || status === 429;
}

/** toGeminiBody — THUẦN: { system, messages:[{role,content}] } → body Gemini generateContent. */
export function toGeminiBody(system, messages, opts = {}) {
  const contents = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] }));
  const generationConfig = {
    temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
    topP: typeof opts.topP === 'number' ? opts.topP : 0.9,
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

// Gọi 1 model; với model CHÍNH cho thử-lại 1 lần khi 503/500 (quá tải tạm thời). Trả Response.
async function callModel(model, key, system, messages, opts, retry) {
  const payload = JSON.stringify(toGeminiBody(system, messages, {
    ...opts, thinkingBudget: model.includes('2.5') ? 0 : undefined, // 2.5 bật thinking mặc định → tắt
  }));
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
  let r;
  const maxAttempts = retry ? 2 : 1;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload });
    if (r.ok || (r.status !== 503 && r.status !== 500) || attempt === maxAttempts - 1) break;
    await new Promise((ok) => setTimeout(ok, 700));
  }
  return r;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  const key = process.env.GEMINI_API_KEY;
  if (!key) return sendJson(res, 503, { ok: false, error: 'no-key' }); // chưa cấu hình → client rơi về Qwen

  try {
    const body = await readJsonBody(req);
    const { system, messages, temperature, maxTokens } = body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return sendJson(res, 400, { ok: false, error: 'no-messages' });
    }
    const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const fallback = process.env.GEMINI_MODEL_FALLBACK || FALLBACK_MODEL;
    const opts = { temperature, maxTokens };

    // CHÍNH (flash) + thử-lại 1 lần; nếu vẫn quá tải/hết-lượt → nhảy DỰ PHÒNG (flash-lite).
    let usedModel = primary;
    let r = await callModel(primary, key, system, messages, opts, true);
    if (!r.ok && shouldFallback(r.status) && fallback && fallback !== primary) {
      usedModel = fallback;
      r = await callModel(fallback, key, system, messages, opts, false);
    }
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return sendJson(res, 502, { ok: false, error: `gemini-${r.status}`, detail: detail.slice(0, 300) });
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
