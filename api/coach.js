/**
 * api/coach.js — CỔNG tới Google Gemini (đám mây) cho AI Coach. Giữ GEMINI_API_KEY ở
 * server (Vercel env), KHÔNG lộ ra trình duyệt. Client gửi { system, messages } (đúng định
 * dạng buildLLMChatPrompt/buildLLMPrompt sinh ra) → đây map sang định dạng Gemini + gọi API.
 * MỌI prompt + lưới chống-bịa vẫn ở client (model-agnostic), file này chỉ là ống dẫn.
 */
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';

const DEFAULT_MODEL = 'gemini-2.5-flash'; // free tier; đổi qua env GEMINI_MODEL nếu cần

/** toGeminiBody — THUẦN: { system, messages:[{role,content}] } → body Gemini generateContent. */
export function toGeminiBody(system, messages, opts = {}) {
  const contents = (Array.isArray(messages) ? messages : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: String(m.content) }] }));
  const body = {
    contents,
    generationConfig: {
      temperature: typeof opts.temperature === 'number' ? opts.temperature : 0.3,
      topP: typeof opts.topP === 'number' ? opts.topP : 0.9,
      maxOutputTokens: typeof opts.maxTokens === 'number' ? opts.maxTokens : 800,
    },
  };
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
    const model = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toGeminiBody(system, messages, { temperature, maxTokens })),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => '');
      return sendJson(res, 502, { ok: false, error: `gemini-${r.status}`, detail: detail.slice(0, 300) });
    }
    const data = await r.json();
    const text = extractGeminiText(data);
    if (!text) {
      return sendJson(res, 502, { ok: false, error: 'empty', detail: JSON.stringify(data?.promptFeedback ?? {}).slice(0, 300) });
    }
    return sendJson(res, 200, { ok: true, text, model });
  } catch (error) {
    return sendJson(res, 500, { ok: false, error: error instanceof Error ? error.message : 'cloud-failed' });
  }
}
