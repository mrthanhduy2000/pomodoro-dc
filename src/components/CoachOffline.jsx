/**
 * CoachOffline — "AI phân tích tổng thể": Gemini (đám mây, qua api/coach.js) viết bản phân
 * tích 4 phần từ số liệu thật. Dùng CHUNG prompt + lưới chống-bịa với "Hỏi Coach". Chạy được
 * mọi thiết bị (kể cả iPhone). Đã GỠ Qwen/WebLLM on-device — mất mạng/hết quota thì báo lỗi.
 */
import { useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import { useAnalystContext } from '../hooks/useCoachContext';
import { buildLLMPrompt, sanitizeLLMOutput, hasForeignScript, hasFabricatedNumbers, findMismatchedPairs, findFabricatedFractions, scrubFabricatedLines } from '../engine/llm/coachPrompt';
import { generateCloud } from '../engine/llm/cloudEngine';

const GOLD = '#d9a441';
const MAX_LANG_RETRY = 1; // lỡ "trôi" sang chữ nước ngoài → hỏi lại tối đa 1 lần (hiếm với Gemini)

export default function CoachOffline(goalProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState('idle'); // idle|generating|rewriting|ready|error|error-lang
  const [text, setText] = useState('');
  const buildContext = useAnalystContext(goalProps);

  async function writeComment() {
    if (status === 'generating') return;
    setStatus('generating');
    setText('');
    try {
      const ctxStr = buildContext(); // gọi 1 lần, dùng chung dựng-prompt + soi-guard (tránh lệch số)
      const { system, messages } = buildLLMPrompt(ctxStr);
      // Engine = Gemini (đám mây). /api/coach đã có thử-lại + nhảy model dự phòng.
      const run = () => generateCloud({ system, messages, temperature: 0.3, maxTokens: 1200 });
      let clean = sanitizeLLMOutput(await run());
      // Trôi chữ nước ngoài HOẶC bịa số → viết lại tối đa MAX_LANG_RETRY lần.
      const dirty = (s) => hasForeignScript(s) || hasFabricatedNumbers(s, ctxStr);
      for (let i = 0; i < MAX_LANG_RETRY && dirty(clean); i += 1) {
        setStatus('rewriting');
        setText('');
        clean = sanitizeLLMOutput(await run());
      }
      if (hasForeignScript(clean)) { setStatus('error-lang'); return; }
      // Số bịa HOẶC ghép sai %↔cỡ-mẫu còn sót → CỨU-CÂU lọc-DÒNG: bỏ riêng dòng bịa, giữ khung 4 phần.
      if (hasFabricatedNumbers(clean, ctxStr) || findMismatchedPairs(clean, ctxStr).length > 0 || findFabricatedFractions(clean, ctxStr).length > 0) clean = scrubFabricatedLines(clean, ctxStr).clean;
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
        <SparkGlyph size={12} /> AI phân tích tổng thể
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
                    AI Coach sẽ phân tích tổng thể số liệu tập trung của bạn: đọc số, soi mẫu hình và đưa nhận định toàn cảnh — không bịa, thiếu dữ liệu thì nói chưa đủ.
                  </p>
                  <button type="button" onClick={() => writeComment()} className="rounded-xl px-3 py-2 text-[13px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>
                    Phân tích tổng thể
                  </button>
                  <p className="text-[11px] leading-snug" style={{ color: 'var(--muted)' }}>
                    Chạy trên đám mây (nhanh, không tốn máy, dùng được cả điện thoại). Khi mất mạng trên máy tính sẽ tự dùng AI dự phòng ngay trên máy.
                  </p>
                </>
              )}

              {status === 'rewriting' && (
                <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Vừa lỡ chen chữ nước ngoài, mình đang viết lại cho gọn bằng tiếng Việt…</p>
              )}

              {status === 'generating' && !text && (
                <p className="text-[13px]" style={{ color: 'var(--muted)' }}>Đang đọc số liệu của bạn để phân tích…</p>
              )}

              {(status === 'generating' || status === 'ready') && text && (
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                  {text}{status === 'generating' ? ' ▍' : ''}
                </p>
              )}

              {(status === 'error' || status === 'error-lang') && (
                <div className="space-y-2">
                  <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--ink)' }}>
                    {status === 'error-lang'
                      ? 'AI lỡ trả lời lẫn chữ nước ngoài. Bấm "Thử lại" nhé.'
                      : 'Chưa phân tích được (mạng trục trặc / chưa cấu hình API / hết lượt miễn phí). Bạn thử lại nhé.'}
                  </p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => writeComment()} className="rounded-xl px-3 py-1.5 text-[12px] font-semibold" style={{ background: 'var(--accent)', color: '#fff' }}>Thử lại</button>
                  </div>
                </div>
              )}

              {(status === 'ready' || status === 'generating') && (
                <p className="text-[11px] italic leading-snug" style={{ color: 'var(--muted)' }}>
                  Phân tích từ số liệu thật của bạn. Muốn hỏi sâu từng điểm thì bấm "Hỏi Coach".
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
