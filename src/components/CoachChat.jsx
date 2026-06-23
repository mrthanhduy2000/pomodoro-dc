/**
 * CoachChat — "Hỏi Coach" có 2 chế độ:
 *  - ⚡ Nhanh (số liệu): engine nội bộ trả lời OFFLINE tức thì, 0ms, chạy cả iPhone.
 *  - 🧠 AI 7B (trên máy): chat tự do với LLM Qwen 7B đã tải (CHỈ desktop có WebGPU).
 *    Dùng chung engine singleton với "Coach offline" → đã tải thì xài lại ngay.
 * Câu ngoài tầm engine nhanh: gợi ý hỏi lại bằng AI 7B (desktop) hoặc Claude (cần mạng).
 */
import { useEffect, useRef, useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import useCoachContext, { useAnalystContext } from '../hooks/useCoachContext';
import useCoachQA from '../hooks/useCoachQA';
import { buildLLMChatPrompt, sanitizeLLMOutput, hasForeignScript, detectWebLLMCapable, mapInitProgress, LLM_MODELS } from '../engine/llm/coachPrompt';

const GOLD = '#d9a441';
const LOAD_TIMEOUT_MS = 900000; // 15 phút: đủ cho lần đầu tải ~4.5GB (Qwen 7B)

export default function CoachChat(goalProps) {
  const [capable] = useState(() => detectWebLLMCapable());
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, suggestions?, action?, viaClaude?, viaLocal? }
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('fast'); // 'fast' (số liệu) | 'llm' (AI 7B trên máy)
  const [thinking, setThinking] = useState(null); // null | 'claude' | 'local'
  const [progress, setProgress] = useState(0);
  const listRef = useRef(null);
  const buildContext = useCoachContext(goalProps);    // bản gọn → Claude
  const buildAnalyst = useAnalystContext(goalProps);  // bản giàu → AI 7B
  const ask = useCoachQA(goalProps);
  const busy = thinking !== null;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking, open]);

  // Cập nhật nội dung của bong bóng assistant cuối cùng (cho streaming).
  function updateLastAssistant(content) {
    setMessages((m) => {
      const c = [...m];
      for (let i = c.length - 1; i >= 0; i -= 1) {
        if (c[i].role === 'assistant') { c[i] = { ...c[i], content }; break; }
      }
      return c;
    });
  }

  function send(textArg) {
    const q = (typeof textArg === 'string' ? textArg : input).trim();
    if (!q || busy) return;
    setInput('');
    if (mode === 'llm' && capable) { askLocalLLM(q); return; }
    // ⚡ Nhanh: trả lời local đồng bộ, offline.
    const res = ask(q);
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: res.answer, suggestions: res.suggestions, action: res.action }]);
  }

  // Chat với AI 7B chạy trên máy (offline, miễn phí). Có lưới chống "trôi" tiếng nước ngoài.
  async function askLocalLLM(q) {
    if (busy) return;
    const history = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '', viaLocal: true }]);
    setThinking('local');
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
      if (hasForeignScript(clean)) clean = 'AI trên máy lỡ trả lời lẫn chữ nước ngoài — bạn thử hỏi lại, hoặc chuyển sang chế độ Nhanh nhé.';
      updateLastAssistant(clean);
    } catch {
      updateLastAssistant('Chưa chạy được AI trên máy (cần card đồ hoạ/WebGPU, hoặc đang tải mô hình ~4.5GB lần đầu). Bạn thử lại, hoặc dùng chế độ Nhanh.');
    } finally {
      setThinking(null);
      setProgress(0);
    }
  }

  // Claude chỉ chạy khi người dùng chủ động bấm (câu khó/ngoài tầm) + cần mạng/khoá.
  async function askClaude(q) {
    if (busy) return;
    setMessages((m) => [...m, { role: 'assistant', content: '', viaClaude: true }]);
    setThinking('claude');
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, context: buildContext(), messages: messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-6).map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json().catch(() => null);
      const content = (!data || !data.ok) ? `Chưa hỏi Claude được: ${data?.error || 'cần bật khoá trên máy chủ hoặc cần mạng'}.` : (data.answer || '(không có nội dung)');
      updateLastAssistant(content);
    } catch {
      updateLastAssistant('Không kết nối được tới Claude (cần mạng). Bản offline vẫn trả lời được các câu về số liệu của bạn nhé.');
    } finally {
      setThinking(null);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const chips = messages.length === 0 ? ['Tuần này mình thế nào?', 'Giờ vàng của mình?', 'Giờ này nên làm gì?'] : (lastAssistant?.suggestions ?? []);
  // Chữ chờ hiển thị trong bong bóng rỗng đang sinh (chỉ bong bóng cuối mới rỗng khi busy).
  const bubblePlaceholder = (m) => {
    if (m.viaClaude) return 'Claude đang nghĩ…';
    if (m.viaLocal && progress > 0 && progress < 100) return `Đang tải AI về máy… ${progress}%`;
    return 'Đang nghĩ…';
  };
  const modeBtn = (m, label) => (
    <button
      type="button"
      onClick={() => setMode(m)}
      aria-pressed={mode === m}
      className="rounded-full px-2.5 py-0.5 text-[11px] leading-none transition"
      style={{
        border: `1px solid ${mode === m ? GOLD : 'var(--line)'}`,
        background: mode === m ? 'rgba(217,164,65,0.14)' : 'transparent',
        color: mode === m ? GOLD : 'var(--muted)',
      }}
    >{label}</button>
  );

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
                <span className="mono text-[11px] uppercase tracking-[0.2em]">Hỏi Coach{mode === 'llm' ? ' · AI 7B' : ' · offline'}</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
            </div>

            {capable && (
              <div className="flex items-center gap-1.5 px-4 pt-2.5">
                <span className="mono text-[9px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Chế độ</span>
                {modeBtn('fast', 'Nhanh (số liệu)')}
                {modeBtn('llm', 'AI 7B (trên máy)')}
              </div>
            )}

            <div ref={listRef} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  {mode === 'llm'
                    ? 'Chat tự do với AI 7B chạy ngay trên máy bạn (offline). Nó đọc số liệu thật của bạn để trả lời. Lần đầu hơi lâu nếu chưa tải mô hình.'
                    : 'Hỏi mình về việc tập trung của bạn — trả lời ngay trên máy, không cần mạng. Ví dụ: “Tuần này mình thế nào?”, “Giờ vàng của mình?”, “Giờ này nên làm gì?”.'}
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i}>
                  <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed" style={m.role === 'user' ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)' }}>
                      {m.viaClaude && <span className="mono mr-1 text-[9px] uppercase tracking-wider" style={{ color: GOLD }}>Claude · </span>}
                      {m.viaLocal && <span className="mono mr-1 text-[9px] uppercase tracking-wider" style={{ color: GOLD }}>AI 7B · </span>}
                      {m.content ? `${m.content}${thinking && m === lastAssistant ? ' ▍' : ''}` : (m.role === 'assistant' && busy ? bubblePlaceholder(m) : '')}
                    </div>
                  </div>
                  {m.role === 'assistant' && m.action?.type === 'suggest_claude' && (
                    <div className="mt-1.5 flex flex-wrap justify-start gap-2">
                      {capable && (
                        <button type="button" onClick={() => askLocalLLM(m.action.question)} disabled={busy} className="rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-40" style={{ border: `1px solid ${GOLD}`, background: 'rgba(217,164,65,0.14)', color: GOLD }}>
                          Hỏi AI trên máy (7B)
                        </button>
                      )}
                      <button type="button" onClick={() => askClaude(m.action.question)} disabled={busy} className="rounded-full px-3 py-1 text-[11px] disabled:opacity-40" style={{ border: '1px solid var(--line)', color: 'var(--muted)' }}>
                        Hỏi Claude (cần mạng)
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1">
                {chips.slice(0, 3).map((c, i) => (
                  <button key={i} type="button" onClick={() => send(c)} disabled={busy} className="rounded-full px-2.5 py-1 text-[11px] disabled:opacity-40" style={{ border: '1px solid var(--line)', color: 'var(--ink-2,var(--ink))' }}>{c}</button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 px-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1} placeholder={mode === 'llm' ? 'Chat với AI 7B trên máy…' : 'Hỏi Coach…'} className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)', border: '1px solid var(--line)' }} />
              <button type="button" onClick={() => send()} disabled={!input.trim() || busy} className="rounded-xl px-3 py-2 text-[13px] font-semibold disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>Gửi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
