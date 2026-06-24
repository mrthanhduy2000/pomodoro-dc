/**
 * cloudEngine.js — gọi AI Coach trên ĐÁM MÂY (Gemini) qua cổng /api/coach. Key nằm ở
 * server (Vercel env), client KHÔNG giữ key. Nhận { system, messages } từ buildLLMChatPrompt/
 * buildLLMPrompt để dùng CHUNG prompt + lưới chống-bịa. Chạy được cả iPhone (không cần WebGPU).
 * Lỗi (chưa cấu hình key / hết quota / mất mạng / quá lâu) → ném Error có .code để lớp UI báo
 * lỗi + cho "Thử lại". (Đã GỠ Qwen on-device — KHÔNG còn lưới dự phòng trên máy.)
 *
 * GIỚI HẠN THỜI GIAN: nếu lời gọi không kèm signal riêng, tự đặt AbortController hết hạn sau
 * timeoutMs (mặc định 28 giây) — tránh treo vô tận khi mạng/đám mây đứng; quá hạn → code 'timeout'.
 * (Server /api/coach đặt maxDuration 30s trong vercel.json, nên client chờ ngắn hơn một nhịp để
 * báo lỗi sạch trước khi Vercel cắt hàm.)
 */
export async function generateCloud({ system, messages, temperature, maxTokens, signal, timeoutMs = 28000 } = {}) {
  // Không có signal ngoài → tự dựng controller để áp timeout (vẫn dọn timer ở finally).
  const ctrl = signal ? null : (typeof AbortController !== 'undefined' ? new AbortController() : null);
  const timer = ctrl ? setTimeout(() => ctrl.abort(), Math.max(1000, timeoutMs)) : null;
  try {
    const res = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system, messages, temperature, maxTokens }),
      signal: signal || ctrl?.signal,
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
  } catch (err) {
    // Quá hạn (controller TỰ ngắt, không phải signal của caller) → 'timeout' để UI báo đúng.
    if (!signal && err && (err.name === 'AbortError' || err.code === 'ABORT_ERR')) {
      const e = new Error('timeout'); e.code = 'timeout'; throw e;
    }
    throw err;
  } finally {
    if (timer) clearTimeout(timer);
  }
}
