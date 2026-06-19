/**
 * api/coach.js — "Cầu nối" AI Coach hỏi–đáp.
 * Nhận câu hỏi + bản tóm tắt SỐ LIỆU THẬT của người dùng (tính ở trình duyệt) rồi
 * gọi Claude trả lời như một huấn luyện viên năng suất. Khoá API nằm ở biến môi
 * trường ANTHROPIC_API_KEY trên Vercel — KHÔNG bao giờ lộ ra trình duyệt.
 *
 * Bật tính năng: đặt ANTHROPIC_API_KEY trong Vercel → Settings → Environment Variables.
 */
import Anthropic from '@anthropic-ai/sdk';
import { methodNotAllowed, readJsonBody, sendJson } from './_lib/http.js';

// Đổi sang 'claude-sonnet-4-6' nếu muốn lời văn hay hơn (đắt hơn ~3 lần).
const COACH_MODEL = 'claude-haiku-4-5';
const MAX_TOKENS = 1024;
const MAX_HISTORY = 8; // số lượt chat gần nhất gửi kèm để giữ mạch

const SYSTEM_PROMPT = `Bạn là "AI Coach" của một app Pomodoro cá nhân (tiếng Việt). Người dùng tên Đàm.
Vai trò: huấn luyện viên năng suất ấm áp, thẳng thắn, NGẮN GỌN. Xưng "mình", gọi người dùng là "bạn".
Nguyên tắc:
- Chỉ dựa vào DỮ LIỆU THẬT được cung cấp; KHÔNG bịa số. Nếu dữ liệu chưa đủ để kết luận, nói thẳng là chưa đủ.
- Chẩn đoán ngắn (1-2 câu) rồi đưa 1-3 gợi ý CỤ THỂ, hành động được ngay (giờ nào, dài bao nhiêu, loại việc nào).
- Tránh sáo rỗng và jargon. Trả lời thường 3-6 câu, trừ khi người dùng hỏi sâu.
- Đừng đọc lại nguyên văn bảng dữ liệu; hãy diễn giải thành lời khuyên.
- Tôn trọng: đây là app miễn phí cá nhân, đừng đề xuất công cụ trả phí trừ khi được hỏi.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  if (!process.env.ANTHROPIC_API_KEY) {
    return sendJson(res, 503, {
      ok: false,
      error: 'AI Coach chưa được bật: thiếu khoá ANTHROPIC_API_KEY trên máy chủ.',
    });
  }

  try {
    const body = await readJsonBody(req);
    const question = String(body?.question ?? '').trim().slice(0, 2000);
    const context = String(body?.context ?? '').slice(0, 12000);
    if (!question) return sendJson(res, 400, { ok: false, error: 'Thiếu câu hỏi.' });

    const history = (Array.isArray(body?.messages) ? body.messages : [])
      .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
      .slice(-MAX_HISTORY)
      .map((m) => ({ role: m.role, content: m.content }));

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const message = await client.messages.create({
      model: COACH_MODEL,
      max_tokens: MAX_TOKENS,
      system: `${SYSTEM_PROMPT}\n\n=== DỮ LIỆU NGƯỜI DÙNG (tới thời điểm hỏi) ===\n${context || '(chưa có dữ liệu)'}\n=== HẾT DỮ LIỆU ===`,
      messages: [...history, { role: 'user', content: question }],
    });

    const answer = (message.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    return sendJson(res, 200, { ok: true, answer, model: message.model });
  } catch (error) {
    const status = Number.isInteger(error?.status) ? error.status : 500;
    return sendJson(res, status, {
      ok: false,
      error: error instanceof Error ? error.message : 'AI Coach gặp lỗi.',
    });
  }
}
