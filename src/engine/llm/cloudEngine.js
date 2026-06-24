/**
 * cloudEngine.js — gọi AI Coach trên ĐÁM MÂY (Gemini) qua cổng /api/coach. Key nằm ở
 * server (Vercel env), client KHÔNG giữ key. Nhận { system, messages } y như webllmEngine
 * để dùng CHUNG prompt + lưới chống-bịa. Chạy được cả iPhone (không cần WebGPU).
 * Lỗi (chưa cấu hình key / hết quota / mất mạng) → ném Error có .code để lớp UI rơi về Qwen.
 */
export async function generateCloud({ system, messages, temperature, maxTokens, signal } = {}) {
  const res = await fetch('/api/coach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ system, messages, temperature, maxTokens }),
    signal,
  });
  let data = null;
  try { data = await res.json(); } catch { /* không parse được → coi như lỗi bên dưới */ }
  if (!res.ok || !data?.ok || !data.text) {
    const err = new Error(data?.error || `cloud-${res.status}`);
    err.code = data?.error || `http-${res.status}`;
    err.status = res.status;
    throw err;
  }
  return data.text;
}
