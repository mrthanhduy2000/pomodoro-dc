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
import { buildLLMChatPrompt, sanitizeLLMOutput, hasForeignScript, hasFabricatedNumbers, findFabricatedNumbers, findMismatchedPairs, buildCorrectionNote, appendCorrectionTurn, stripFabricatedSentences, detectWebLLMCapable, mapInitProgress, LLM_MODELS } from '../engine/llm/coachPrompt';
import { pickSuggestions, detectTopics } from '../engine/coachSuggest';

const GOLD = '#d9a441';
const LOAD_TIMEOUT_MS = 300000; // 5 phút: đủ cho lần đầu tải ~2.4GB (Qwen 3B)
const CHAT_STORE_KEY = 'dc-coach-chat-v1'; // lưu hội thoại (desktop). KHÔNG nạp số cũ vào prompt.
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
  // Nạp lại hội thoại cũ (desktop). Gắn cờ restored → KHÔNG đưa số cũ vào prompt (xem send()).
  const [messages, setMessages] = useState(() => {
    try {
      const arr = JSON.parse(localStorage.getItem(CHAT_STORE_KEY) || '[]');
      if (!Array.isArray(arr)) return [];
      return arr
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content, viaLocal: m.viaLocal, restored: true }));
    } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastQuestion, setLastQuestion] = useState('');
  const [lastError, setLastError] = useState(false);
  const listRef = useRef(null);
  const warmedRef = useRef(false); // chỉ warm engine 1 lần mỗi phiên mở
  const openRef = useRef(false);   // chặn cập nhật UI sau khi đóng modal
  const buildAnalyst = useAnalystContext(goalProps);
  const busy = thinking;

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, thinking, open]);

  // Lưu hội thoại (tối đa 20 lượt gần nhất, bỏ bong bóng rỗng đang stream).
  useEffect(() => {
    try {
      const toSave = messages
        .filter((m) => (m.role === 'user' || m.role === 'assistant') && (m.role === 'user' || (m.content ?? '').trim()))
        .slice(-20)
        .map((m) => ({ role: m.role, content: m.content, viaLocal: m.viaLocal }));
      if (toSave.length) localStorage.setItem(CHAT_STORE_KEY, JSON.stringify(toSave));
      else localStorage.removeItem(CHAT_STORE_KEY);
    } catch { /* storage đầy/chặn → bỏ qua */ }
  }, [messages]);

  // Làm ấm engine khi user CHỦ ĐỘNG mở modal → câu đầu đỡ phải chờ tải ~2.4GB.
  // KHÔNG prefetch lúc khởi động app, KHÔNG tự gửi câu nào; lỗi để dành lúc gửi xử lý.
  useEffect(() => {
    openRef.current = open;
    if (!open) { setProgress(0); return; }
    if (!capable || warmedRef.current) return;
    warmedRef.current = true;
    (async () => {
      try {
        const { ensureEngine } = await import('../engine/llm/webllmEngine');
        await ensureEngine(LLM_MODELS.default, (p) => { if (openRef.current) setProgress(mapInitProgress(p)); });
      } catch { /* để send() báo lỗi đầy đủ */ }
      finally { if (openRef.current) setProgress(0); }
    })();
  }, [open, capable]);

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
    setLastQuestion(q);
    setLastError(false);
    // CHỈ đưa lượt trong-phiên vào prompt; BỎ lượt khôi phục (số cũ có thể đã trôi → không mồi Qwen).
    const history = messages
      .filter((m) => (m.role === 'user' || m.role === 'assistant') && !m.restored)
      .slice(-6)
      .map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { role: 'user', content: q }, { role: 'assistant', content: '', viaLocal: true }]);
    setThinking(true);
    setProgress(0);
    try {
      const { generateOffline } = await import('../engine/llm/webllmEngine');
      const ctxStr = buildAnalyst(); // dùng CHUNG cho cả dựng prompt LẪN soi guard (đừng gọi 2 lần — tránh lệch)
      const { system, messages: msgs } = buildLLMChatPrompt(ctxStr, q, history);
      const run = (messagesToUse) => {
        const work = generateOffline({
          modelId: LLM_MODELS.default, system, messages: messagesToUse,
          onProgress: (p) => setProgress(mapInitProgress(p)),
          onToken: (t) => updateLastAssistant(sanitizeLLMOutput(t)),
        });
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), LOAD_TIMEOUT_MS));
        return Promise.race([work, timeout]);
      };
      let clean = sanitizeLLMOutput(await run(msgs));
      if (hasForeignScript(clean)) {
        // Lỗi NGÔN NGỮ (trôi chữ Hán) → viết lại BLIND (nhiệt thấp thường tự ép lại tiếng Việt).
        updateLastAssistant(''); clean = sanitizeLLMOutput(await run(msgs));
      } else {
        // Lỗi NỘI DUNG (số bịa) → viết lại CÓ-HƯỚNG-DẪN: chèn lượt chỉ-rõ token sai.
        const bad = findFabricatedNumbers(clean, ctxStr);
        if (bad.length) {
          updateLastAssistant('');
          const msgs2 = appendCorrectionTurn(msgs, clean, buildCorrectionNote(bad));
          clean = sanitizeLLMOutput(await run(msgs2));
        }
      }
      // Tuyến phòng thủ chót — KHÔNG nới guard:
      if (hasForeignScript(clean)) {
        clean = 'AI trên máy lỡ trả lời lẫn chữ nước ngoài — bạn thử hỏi lại nhé.';
      } else if (hasFabricatedNumbers(clean, ctxStr) || findMismatchedPairs(clean, ctxStr).length > 0) {
        // VẪN bịa số HOẶC ghép sai %↔cỡ-mẫu → CỨU-CÂU: bỏ riêng câu bịa, giữ câu sạch.
        clean = stripFabricatedSentences(clean, ctxStr).clean;
      }
      updateLastAssistant(clean);
    } catch (err) {
      const code = err?.message || '';
      const msg = (code === 'no-webgpu' || code === 'no-adapter')
        ? 'Máy chưa bật được card đồ hoạ (WebGPU) nên AI trên máy không chạy được. Thử Chrome/Edge mới, hoặc bật "tăng tốc phần cứng" trong cài đặt trình duyệt.'
        : code === 'timeout'
          ? 'Tải mô hình lâu quá (~2.4GB lần đầu). Khi mạng ổn định, bấm "Thử lại" nhé.'
          : 'Chưa chạy được AI trên máy. Bạn bấm "Thử lại" nhé.';
      setLastError(true);
      updateLastAssistant(msg);
    } finally {
      setThinking(false);
      setProgress(0);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function clearChat() {
    setMessages([]);
    setLastError(false);
    setLastQuestion('');
    try { localStorage.removeItem(CHAT_STORE_KEY); } catch { /* bỏ qua */ }
  }

  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const placeholder = progress > 0 && progress < 100 ? `Đang tải AI về máy… ${progress}%` : 'Đang nghĩ…';

  // Chips: lúc trống = câu hỏi mẫu; sau khi Qwen trả lời xong = "Đề xuất tiếp theo"
  // theo ngữ cảnh (chủ đề vừa hỏi + dữ liệu user có). Chỉ là gợi ý câu hỏi để bấm.
  const answerReady = !thinking && lastAssistant && (lastAssistant.content ?? '').trim().length > 0;
  const analystStr = buildAnalyst();
  const noData = messages.length === 0 && analystStr.startsWith('Người dùng chưa có phiên nào');
  const suggestions = useMemo(() => {
    if (messages.length === 0 || !answerReady) return [];
    const userMsgs = messages.filter((m) => m.role === 'user');
    const askedIds = [...new Set(userMsgs.flatMap((m) => detectTopics(m.content)))]; // câu đa-ý → nhiều id
    const lastQuestionText = userMsgs.length ? userMsgs[userMsgs.length - 1].content : '';
    return pickSuggestions({ contextString: analystStr, lastQuestionText, askedIds });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, answerReady]);
  // Câu hỏi mẫu BÁM tín hiệu thật của user (nới 6); rỗng tín hiệu → fallback STARTER_CHIPS.
  const starterChips = useMemo(() => {
    if (messages.length !== 0 || noData) return [];
    const picked = pickSuggestions({ contextString: analystStr, limit: 6 });
    return picked.length >= 2 ? picked : STARTER_CHIPS.slice(0, 3);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, noData]);
  const chips = messages.length === 0 ? starterChips : suggestions;
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
              <div className="flex items-center gap-3">
                {messages.length > 0 && (
                  <button type="button" onClick={clearChat} className="mono text-[10px] uppercase tracking-wider hover:opacity-70" style={{ color: 'var(--muted)' }}>Xoá hội thoại</button>
                )}
                <button type="button" onClick={() => setOpen(false)} className="text-[18px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
              </div>
            </div>

            <div ref={listRef} className="min-h-[160px] flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.length === 0 && (
                <p className="text-[13px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Chat với AI Qwen 3B chạy ngay trên máy bạn (offline). Nó đọc số liệu thật của bạn để trả lời. Lần đầu hơi lâu nếu chưa tải mô hình (~2.4GB).
                </p>
              )}
              {noData && (
                <p className="text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
                  Hoàn thành vài phiên có đặt mục tiêu rồi Coach mới có số liệu để phân tích nhé.
                </p>
              )}
              {messages.some((m) => m.restored) && (
                <p className="mono text-center text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  — Lịch sử cũ · số liệu có thể đã thay đổi —
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

            {lastError && !busy && lastQuestion && (
              <div className="px-4 pb-1">
                <button type="button" onClick={() => send(lastQuestion)} className="rounded-full px-3 py-1 text-[11px] font-semibold transition-opacity hover:opacity-80" style={{ border: `1px solid ${GOLD}66`, color: GOLD, background: 'rgba(217,164,65,0.08)' }}>↻ Thử lại</button>
              </div>
            )}

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

            {progress > 0 && progress < 100 && (
              <div className="px-4 pt-1 text-[11px]" style={{ color: 'var(--muted)' }}>Đang tải AI về máy… {progress}%</div>
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
