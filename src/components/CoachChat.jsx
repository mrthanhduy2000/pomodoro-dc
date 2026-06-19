/**
 * CoachChat — nút "Hỏi Coach" + hộp thoại hỏi–đáp với AI Coach thật (Claude API qua
 * /api/coach). Gửi kèm bản tóm tắt số liệu thật để Coach trả lời sát người dùng.
 * Tự lo trạng thái mở/đóng, danh sách tin nhắn, loading, lỗi. Dùng chung desktop + mobile.
 */
import { useEffect, useRef, useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import useCoachContext from '../hooks/useCoachContext';

const GOLD = '#d9a441';

export default function CoachChat(goalProps) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]); // { role: 'user'|'assistant', content }
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef(null);
  const buildContext = useCoachContext(goalProps);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, loading, open]);

  async function send() {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    setError('');
    const history = messages.slice(-8);
    setMessages((m) => [...m, { role: 'user', content: q }]);
    setLoading(true);
    try {
      const res = await fetch('/api/coach', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question: q, context: buildContext(), messages: history }),
      });
      const data = await res.json().catch(() => null);
      if (!data || !data.ok) {
        setError(data?.error || 'AI Coach chưa sẵn sàng (cần bật khoá trên máy chủ).');
      } else {
        setMessages((m) => [...m, { role: 'assistant', content: data.answer || '(không có nội dung)' }]);
      }
    } catch {
      setError('Không kết nối được tới AI Coach. Thử lại sau nhé.');
    } finally {
      setLoading(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
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
        <SparkGlyph size={12} /> Hỏi Coach
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center"
          style={{ background: 'rgba(15,14,13,0.55)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-2xl sm:rounded-2xl"
            style={{ background: 'var(--card-bg-solid, #fff)', border: '1px solid var(--line)' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--line)' }}>
              <div className="flex items-center gap-1.5" style={{ color: GOLD }}>
                <SparkGlyph size={14} />
                <span className="mono text-[11px] uppercase tracking-[0.2em]">AI Coach</span>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
            </div>

            {/* Messages */}
            <div ref={listRef} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && !error && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Hỏi mình bất cứ điều gì về việc tập trung của bạn — ví dụ: “Tuần này mình thế nào?”, “Chiều nay nên làm gì?”, “Vì sao mình hay bỏ phiên buổi tối?”.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className="max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed"
                    style={m.role === 'user'
                      ? { background: 'var(--accent)', color: '#fff' }
                      : { background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)' }}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl px-3 py-2 text-[13px]" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--muted)' }}>
                    Coach đang nghĩ…
                  </div>
                </div>
              )}
              {error && (
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--bad, #ef4444)' }}>{error}</p>
              )}
            </div>

            {/* Input */}
            <div className="flex items-end gap-2 px-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                rows={1}
                placeholder="Hỏi Coach…"
                className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none"
                style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)', border: '1px solid var(--line)' }}
              />
              <button
                type="button"
                onClick={send}
                disabled={loading || !input.trim()}
                className="rounded-xl px-3 py-2 text-[13px] font-semibold disabled:opacity-40"
                style={{ background: 'var(--accent)', color: '#fff' }}
              >
                Gửi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
