/**
 * CoachChat — "Hỏi Coach" trả lời OFFLINE tức thì (engine nội bộ, không cần mạng/LLM).
 * Chỉ khi câu ngoài tầm / người dùng muốn hỏi sâu mới bấm "Hỏi Claude" (gọi /api/coach).
 * Dùng chung desktop + mobile; chạy được trên iPhone offline.
 */
import { useEffect, useRef, useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import useCoachContext from '../hooks/useCoachContext';
import useCoachQA from '../hooks/useCoachQA';

const GOLD = '#d9a441';

export default function CoachChat(goalProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role, content, suggestions?, action?, viaClaude? }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);
  const buildContext = useCoachContext(goalProps);
  const ask = useCoachQA(goalProps);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading, open]);

  // Trả lời LOCAL, đồng bộ, offline — 0ms, không tốn tiền.
  function send(textArg) {
    const q = (typeof textArg === 'string' ? textArg : input).trim();
    if (!q) return;
    setInput('');
    const res = ask(q);
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: res.answer, suggestions: res.suggestions, action: res.action }]);
  }

  // Chỉ gọi Claude khi người dùng chủ động bấm (câu khó/ngoài tầm).
  async function askClaude(q) {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, context: buildContext(), messages: messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-6).map((m) => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json().catch(() => null);
      const content = (!data || !data.ok) ? `Chưa hỏi Claude được: ${data?.error || 'cần bật khoá trên máy chủ hoặc cần mạng'}.` : (data.answer || '(không có nội dung)');
      setMessages((m) => [...m, { role: 'assistant', content, viaClaude: true }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Không kết nối được tới Claude (cần mạng). Bản offline vẫn trả lời được các câu về số liệu của bạn nhé.', viaClaude: true }]);
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const chips = messages.length === 0 ? ['Tuần này mình thế nào?', 'Giờ vàng của mình?', 'Giờ này nên làm gì?'] : (lastAssistant?.suggestions ?? []);

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
                <span className="mono text-[11px] uppercase tracking-[0.2em]">Hỏi Coach · offline</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
            </div>

            <div ref={listRef} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Hỏi mình về việc tập trung của bạn — trả lời ngay trên máy, không cần mạng. Ví dụ: “Tuần này mình thế nào?”, “Giờ vàng của mình?”, “Giờ này nên làm gì?”.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i}>
                  <div className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                    <div className="max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed" style={m.role === 'user' ? { background: 'var(--accent)', color: '#fff' } : { background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)' }}>
                      {m.viaClaude && <span className="mono mr-1 text-[9px] uppercase tracking-wider" style={{ color: GOLD }}>Claude · </span>}
                      {m.content}
                    </div>
                  </div>
                  {m.role === 'assistant' && m.action?.type === 'suggest_claude' && (
                    <div className="mt-1.5 flex justify-start">
                      <button type="button" onClick={() => askClaude(m.action.question)} disabled={loading} className="rounded-full px-3 py-1 text-[11px] font-semibold disabled:opacity-40" style={{ border: `1px solid ${GOLD}66`, color: GOLD }}>
                        Hỏi Claude (cần mạng)
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex justify-start"><div className="rounded-2xl px-3 py-2 text-[13px]" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--muted)' }}>Claude đang nghĩ…</div></div>
              )}
            </div>

            {chips.length > 0 && (
              <div className="flex flex-wrap gap-1.5 px-3 pb-1">
                {chips.slice(0, 3).map((c, i) => (
                  <button key={i} type="button" onClick={() => send(c)} className="rounded-full px-2.5 py-1 text-[11px]" style={{ border: '1px solid var(--line)', color: 'var(--ink-2,var(--ink))' }}>{c}</button>
                ))}
              </div>
            )}

            <div className="flex items-end gap-2 px-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1} placeholder="Hỏi Coach…" className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)', border: '1px solid var(--line)' }} />
              <button type="button" onClick={() => send()} disabled={!input.trim()} className="rounded-xl px-3 py-2 text-[13px] font-semibold disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>Gửi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
