/**
 * CoachChat — "Hỏi Coach" = CHAT với AI Qwen 3B chạy ngay trên máy (offline, miễn phí).
 * MỘT AI duy nhất: mọi câu đều do Qwen trả lời (đã bỏ ⚡Nhanh theo luật + Hỏi Claude).
 * Qwen cần WebGPU → CHỈ chạy trên máy tính; iPhone (không WebGPU) ẩn hẳn (return null).
 * Dùng chung engine 3B singleton với "AI phân tích tổng thể" → đã tải thì xài lại ngay.
 * Có câu hỏi mẫu (lúc trống) + "Đề xuất tiếp theo" theo ngữ cảnh sau mỗi câu trả lời
 * (engine coachSuggest.js, thuần luật — chỉ GỢI Ý câu hỏi, không phải câu trả lời).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import { useAnalystContext } from '../hooks/useCoachContext';
import { buildLLMChatPrompt, sanitizeLLMOutput, hasForeignScript, detectWebLLMCapable, mapInitProgress, LLM_MODELS } from '../engine/llm/coachPrompt';
import { pickSuggestions, detectTopic } from '../engine/coachSuggest';

const GOLD = '#d9a441';
const LOAD_TIMEOUT_MS = 300000; // 5 phút: đủ cho lần đầu tải ~2.4GB (Qwen 3B)
const STARTER_CHIPS = [
  'Tổng quan tập trung của mình tới giờ thế nào?',
  'Giờ vàng của mình là khung nào?',
  'Giờ này mình nên làm việc khó hay việc nhẹ?',
  'Mình hay bỏ phiên giữa chừng vào lúc nào?',
  'Phiên dài bao nhiêu phút thì hợp với mình nhất?',
  'Làm khuya thì chất lượng phiên của mình thế nào?',
  'Mục tiêu mỗi ngày của mình có hợp lý không?',
  'Có loại việc nào mình đang bỏ bê không?',
  'Mình có đều đặn không, hay làm theo đợt?',
  'Hôm nay mình đang đi đúng nhịp chưa?',
];

export default function CoachChat(goalProps) {
  const [capable] = useState(() => detectWebLLMCapable());
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, viaLocal? }
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const listRef = useRef(null);
  const buildAnalyst = useAnalystContext(goalProps);
  const busy = thinking;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking, open]);

  // Cập nhật nội dung bong bóng assistant cuối (cho streaming).
  function updateLastAssistant(content) {
    setMessages((m) => {
      const c = [...m];
      for (let i = c.length - 1; i >= 0; i -= 1) {
        if (c[i].role === 'assistant') { c[i] = { ...c[i], content }; break; }
      }
      return c;
    });
  }

  async function send(textArg) {
    const q = (typeof textArg === 'string' ? textArg : input).trim();
    if (!q || busy) return;
    setInput('');
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '', viaLocal: true }]);
    setThinking(true);
    setProgress(0);
    try {
      const { generateOffline } = await import('../engine/llm/webllmEngine');
      const { system, messages: msgs } = buildLLMChatPrompt(buildAnalyst(), q, history);
      const run = () => {
        const work = generateOffline({
          modelId: LLM_MODELS.default, system, messages: msgs,
          onProgress: (p) => setProgress(mapInitProgress(p)),
          onToken: (t) => updateLastAssistant(sanitizeLLMOutput(t)),
        });
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), LOAD_TIMEOUT_MS));
        return Promise.race([work, timeout]);
      };
      let clean = sanitizeLLMOutput(await run());
      if (hasForeignScript(clean)) { updateLastAssistant(''); clean = sanitizeLLMOutput(await run()); }
      if (hasForeignScript(clean)) clean = 'AI trên máy lỡ trả lời lẫn chữ nước ngoài — bạn thử hỏi lại nhé.';
      updateLastAssistant(clean);
    } catch {
      updateLastAssistant('Chưa chạy được AI trên máy (cần card đồ hoạ/WebGPU, hoặc đang tải mô hình ~2.4GB lần đầu). Bạn thử lại nhé.');
    } finally {
      setThinking(false);
      setProgress(0);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const placeholder = progress > 0 && progress < 100 ? `Đang tải AI về máy… ${progress}%` : 'Đang nghĩ…';

  // Chips: lúc trống = câu hỏi mẫu; sau khi Qwen trả lời xong = "Đề xuất tiếp theo"
  // theo ngữ cảnh (chủ đề vừa hỏi + dữ liệu user có). Chỉ là gợi ý câu hỏi để bấm.
  const answerReady = !thinking && lastAssistant && (lastAssistant.content ?? '').trim().length > 0;
  const suggestions = useMemo(() => {
    if (messages.length === 0 || !answerReady) return [];
    const userMsgs = messages.filter((m) => m.role === 'user');
    const askedIds = [...new Set(userMsgs.map((m) => detectTopic(m.content)).filter(Boolean))];
    const lastQuestionText = userMsgs.length ? userMsgs[userMsgs.length - 1].content : '';
    return pickSuggestions({ contextString: buildAnalyst(), lastQuestionText, askedIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, answerReady]);
  const chips = messages.length === 0 ? STARTER_CHIPS : suggestions;
  const chipLabel = messages.length === 0 ? 'Câu hỏi gợi ý' : 'Đề xuất tiếp theo';

  if (!capable) return null; // iPhone/không WebGPU → ẩn Coach (đã có dòng "mở trên máy tính" ở chỗ khác)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-opacity hover:opacity-80"
        style={{ border: `1px solid ${GOLD}55`, color: GOLD, background: 'rgba(217,164,65,0.08)' }}
      >
        <SparkGlyph size={12} /> Hỏi Coach
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" style={{ background: 'rgba(15,14,13,0.55)' }} onClick={() => setOpen(false)}>
          <div className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl" style={{ background: 'var(--card-bg-solid, #fff)', border: '1px solid var(--line)' }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-1.5" style={{ color: GOLD }}>
                <SparkGlyph size={14} />
                <span className="mono text-[11px] uppercase tracking-[0.2em]">Hỏi Coach · AI trên máy</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
            </div>

            <div ref={listRef} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Chat với AI Qwen 3B chạy ngay trên máy bạn (offline). Nó đọc số liệu thật của bạn để trả lời. Lần đầu hơi lâu nếu chưa tải mô hình (~2.4GB).
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed" style={m.role === 'user' ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)' }}>
                    {m.viaLocal && <span className="mono mr-1 text-[9px] uppercase tracking-wider" style={{ color: GOLD }}>AI · </span>}
                    {m.content ? `${m.content}${thinking && m === lastAssistant ? ' ▍' : ''}` : (m.role === 'assistant' && busy ? placeholder : '')}
                  </div>
                </div>
              ))}
            </div>

            {chips.length > 0 && (
              <div className="px-3 pb-1">
                <div className="mono mb-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: 'var(--muted)' }}>{chipLabel}</div>
                <div className="flex flex-wrap gap-1.5">
                  {chips.map((c, i) => (
                    <button key={i} type="button" onClick={() => send(c)} disabled={busy} className="rounded-full px-2.5 py-1 text-[11px] disabled:opacity-40" style={{ border: '1px solid var(--line)', color: 'var(--ink-2,var(--ink))' }}>{c}</button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-end gap-2 px-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1} placeholder="Chat với AI trên máy…" className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)', border: '1px solid var(--line)' }} />
              <button type="button" onClick={() => send()} disabled={!input.trim() || busy} className="rounded-xl px-3 py-2 text-[13px] font-semibold disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>Gửi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
