/**
 * CoachOffline — "AI phân tích tổng thể": LLM thật CHẠY TRÊN MÁY (WebLLM/WebGPU) tự viết
 * nhận xét từ số liệu thật, KHÔNG cần mạng/khoá API. Đặt CẠNH "Hỏi Coach" (Claude),
 * KHÔNG thay thế. Tự ẩn nếu thiết bị không hợp (mobile/iOS/không WebGPU) → iPhone
 * không thấy gì. Một model duy nhất: Qwen 3B (~2.4GB tải lần đầu). Dự phòng khi lỗi =
 * chế độ ⚡Nhanh ở "Hỏi Coach" (luật, 0 byte). Trung thực: vẫn yếu hơn "Hỏi Coach" (Claude).
 */
import { useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import { useAnalystContext } from '../hooks/useCoachContext';
import { buildLLMPrompt, sanitizeLLMOutput, hasForeignScript, detectWebLLMCapable, mapInitProgress, LLM_MODELS } from '../engine/llm/coachPrompt';

const GOLD = '#d9a441';
const LOAD_TIMEOUT_MS = 300000; // 5 phút: đủ cho lần đầu tải ~2.4GB (Qwen 3B)
const MAX_LANG_RETRY = 1; // model nhỏ "trôi" sang chữ nước ngoài → viết lại tối đa 1 lần

export default function CoachOffline(goalProps) {
  const [capable] = useState(() => detectWebLLMCapable());
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|loading|generating|rewriting|ready|error|error-lang
  const [progress, setProgress] = useState(0);
  const [text, setText] = useState('');
  const buildContext = useAnalystContext(goalProps);

  if (!capable) return null; // mobile/iOS/không WebGPU → giữ UI sạch

  async function writeComment() {
    if (status === 'loading' || status === 'generating') return;
    const useModel = LLM_MODELS.default;
    setStatus('loading');
    setProgress(0);
    setText('');
    try {
      const { generateOffline } = await import('../engine/llm/webllmEngine');
      const { system, messages } = buildLLMPrompt(buildContext());
      const run = () => {
        const work = generateOffline({
          modelId: useModel, system, messages,
          onProgress: (p) => setProgress(mapInitProgress(p)),
          onToken: (t) => { setStatus('generating'); setText(sanitizeLLMOutput(t)); },
        });
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), LOAD_TIMEOUT_MS));
        return Promise.race([work, timeout]);
      };
      let clean = sanitizeLLMOutput(await run());
      // Nếu model lỡ "trôi" sang chữ nước ngoài (Hán/Trung…) → tự viết lại.
      for (let i = 0; i < MAX_LANG_RETRY && hasForeignScript(clean); i += 1) {
        setStatus('rewriting');
        setText('');
        clean = sanitizeLLMOutput(await run());
      }
      if (hasForeignScript(clean)) { setStatus('error-lang'); return; }
      setText(clean);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
        style={{ border: `1px solid ${GOLD}55`, color: GOLD, background: 'rgba(217,164,65,0.08)' }}
      >
        <SparkGlyph size={12} /> AI phân tích tổng thể (chạy trên máy)
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" style={{ background: 'rgba(15,14,13,0.55)' }} onClick={() => setOpen(false)}>
          <div className="flex max-h-[88vh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl" style={{ background: 'var(--card-bg-solid, #fff)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-1.5" style={{ color: GOLD }}>
                <SparkGlyph size={14} />
                <span className="mono text-[11px] uppercase tracking-[0.2em]">AI phân tích tổng thể</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
            </div>

            <div className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {status === 'idle' && (
                <>
                  <p className="text-[13px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                    Một AI chạy ngay trên máy bạn (offline) sẽ phân tích tổng thể số liệu tập trung của bạn: đọc số, soi mẫu hình và đưa nhận định toàn cảnh — không bịa, thiếu dữ liệu thì nói chưa đủ.
                  </p>
                  <button type="button" onClick={() => writeComment()} className="rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Phân tích tổng thể
                  </button>
                  <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    Tải mô hình ~2.4GB lần đầu (Qwen 3B, cần card đồ hoạ / WebGPU), lần sau dùng ngay. Không chạy được thì vẫn có “Hỏi Coach” (⚡ Nhanh) không cần tải gì.
                  </p>
                </>
              )}

              {status === 'loading' && (
                <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Đang tải AI về máy… {progress > 0 ? `${progress}%` : ''} (lần đầu hơi lâu)</p>
              )}

              {status === 'rewriting' && (
                <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Model lỡ chèn chữ nước ngoài — đang viết lại bằng tiếng Việt…</p>
              )}

              {(status === 'generating' || status === 'ready') && (
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                  {text}{status === 'generating' ? ' ▍' : ''}
                </p>
              )}

              {(status === 'error' || status === 'error-lang') && (
                <div className="space-y-2">
                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                    {status === 'error-lang'
                      ? 'AI trên máy lỡ trả lời lẫn chữ nước ngoài (model nhỏ đôi khi bị vậy). Bấm "Thử lại" để viết lại bằng tiếng Việt, hoặc dùng "Hỏi Coach".'
                      : 'Không chạy được AI trên máy (thiếu WebGPU hoặc tải lỗi). Bạn thử lại nhé.'}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => writeComment()} className="rounded-xl px-3 py-1.5 text-[12px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>Thử lại</button>
                  </div>
                </div>
              )}

              {(status === 'ready' || status === 'generating') && (
                <p className="text-[11px] italic leading-snug" style={{ color: 'var(--muted)' }}>
                  Đây là AI chạy trên máy bạn (offline) — phân tích từ số liệu thật, nhưng vẫn dễ sai hơn "Hỏi Coach" (Claude). Cần lời khuyên chuẩn nhất thì bấm "Hỏi Coach".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
