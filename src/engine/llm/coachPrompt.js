/**
 * coachPrompt.js — phần THUẦN (test được) của "Coach offline" (LLM chạy trên máy).
 * Dựng prompt từ bản tóm tắt số liệu (buildCoachContext), làm sạch output, dò khả
 * năng thiết bị, đổi tiến độ tải → %. KHÔNG chạm thư viện model (đó là webllmEngine.js).
 */

// Model prebuilt của @mlc-ai/web-llm (Qwen2.5 đa ngữ — tiếng Việt khá nhất nhóm nhỏ).
export const LLM_MODELS = {
  default: 'Qwen2.5-3B-Instruct-q4f16_1-MLC', // ~1.0GB, ~2.5GB VRAM
  light: 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC', // ~0.9GB, ~1.6GB (cho máy yếu)
};

export const COACH_OFFLINE_SYSTEM = `Bạn là "Coach offline" của app Pomodoro cá nhân (tiếng Việt). Người dùng tên Đàm. Xưng "mình", gọi người dùng là "bạn". Vai trò: huấn luyện viên năng suất NGẮN GỌN, ấm áp.
QUY TẮC CỨNG (bạn là model nhỏ, dễ sai — phải tuân thật chặt):
- CHỈ dùng số liệu trong phần DỮ LIỆU bên dưới. TUYỆT ĐỐI không bịa thêm số hay sự kiện. Thiếu dữ liệu thì nói "chưa đủ dữ liệu".
- Trả lời 3-5 câu tiếng Việt tự nhiên, KHÔNG markdown rườm rà, KHÔNG đọc lại nguyên bảng số.
- Một câu chẩn đoán + 1-2 gợi ý cụ thể (giờ nào, dài bao nhiêu phút, loại việc nào).
- Không sáo rỗng, không thuật ngữ kỹ thuật, không suy luận nhân-quả chắc nịch (dùng "có vẻ/thử").`;

const INVITE_COMMENT = 'Dựa vào dữ liệu trên, viết một nhận xét ngắn về giai đoạn tập trung gần đây của mình và 1-2 việc nên làm tiếp.';

export function buildLLMPrompt(context, question = null, history = []) {
  const ctx = String(context ?? '').slice(0, 6000) || '(chưa có dữ liệu)';
  const system = `${COACH_OFFLINE_SYSTEM}\n\n=== DỮ LIỆU THẬT ===\n${ctx}\n=== HẾT ===`;
  const q = String(question ?? '').trim();
  if (!q) return { system, messages: [{ role: 'user', content: INVITE_COMMENT }] };
  const past = (Array.isArray(history) ? history : [])
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m?.content === 'string' && m.content.trim())
    .slice(-6)
    .map((m) => ({ role: m.role, content: m.content }));
  return { system, messages: [...past, { role: 'user', content: q.slice(0, 2000) }] };
}

export function sanitizeLLMOutput(raw) {
  let s = String(raw ?? '');
  s = s.replace(/<think>[\s\S]*?<\/think>/gi, ' '); // Qwen có thể sinh reasoning
  s = s.replace(/<[^>]*>/g, ' ');
  s = s.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
  if (!s) return '(Coach offline chưa trả lời được — thử lại, hoặc bấm "Hỏi Coach").';
  return s.length > 1500 ? `${s.slice(0, 1497)}…` : s;
}

export function detectWebLLMCapable(nav, win) {
  const n = nav ?? (typeof navigator !== 'undefined' ? navigator : null);
  const w = win ?? (typeof window !== 'undefined' ? window : null);
  if (!n || !w) return false;
  if (/iP(hone|ad|od)/i.test(n.userAgent || '')) return false; // iOS WebGPU yếu → giữ bản cũ
  if (!('gpu' in n)) return false; // cần WebGPU
  return (w.innerWidth || 0) >= 1024; // chỉ desktop
}

export function mapInitProgress(p) {
  if (p && typeof p.progress === 'number') return Math.round(Math.min(1, Math.max(0, p.progress)) * 100);
  return 0;
}
