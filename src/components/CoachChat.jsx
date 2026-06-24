/**
 * CoachChat — "Hỏi Coach" = CHAT với AI Coach (Gemini, đám mây qua /api/coach + cloudEngine).
 * MỘT engine duy nhất cho cả "Hỏi Coach" lẫn "AI phân tích tổng thể"; dùng CHUNG prompt +
 * lưới chống-bịa (coachPrompt.js). Chạy được MỌI thiết bị, kể cả iPhone (không cần WebGPU).
 * Mất mạng / hết quota / chưa-có-key → báo lỗi + nút "Thử lại" (KHÔNG còn dự phòng on-device).
 * Có câu hỏi mẫu (lúc trống) + "Đề xuất tiếp theo" theo ngữ cảnh sau mỗi câu trả lời
 * (engine coachSuggest.js, thuần luật — chỉ GỢI Ý câu hỏi, không phải câu trả lời).
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import { useAnalystContext } from '../hooks/useCoachContext';
import { buildLLMChatPrompt, sanitizeLLMOutput, hasForeignScript, hasFabricatedNumbers, findFabricatedNumbers, findMismatchedPairs, findFabricatedFractions, buildCorrectionNote, appendCorrectionTurn, stripFabricatedSentences } from '../engine/llm/coachPrompt';
import { generateCloud } from '../engine/llm/cloudEngine';
import { pickSuggestions, detectTopics } from '../engine/coachSuggest';

const GOLD = '#d9a441';
const CHAT_STORE_KEY = 'dc-coach-chat-v1'; // lưu hội thoại. KHÔNG nạp số cũ vào prompt.
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
  const [lastQuestion, setLastQuestion] = useState('');
  const [lastError, setLastError] = useState(false);
  const listRef = useRef(null);
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
    try {
      const ctxStr = buildAnalyst(); // dùng CHUNG cho cả dựng prompt LẪN soi guard (đừng gọi 2 lần — tránh lệch)
      const { system, messages: msgs } = buildLLMChatPrompt(ctxStr, q, history);
      // Engine = Gemini (đám mây). Bản thân /api/coach đã có thử-lại + nhảy model dự phòng.
      const run = async (messagesToUse) => {
        return generateCloud({ system, messages: messagesToUse, temperature: 0.2 });
      };
      let clean = sanitizeLLMOutput(await run(msgs));
      if (hasForeignScript(clean)) {
        // Lỗi NGÔN NGỮ (lỡ chen chữ nước ngoài) → hỏi lại 1 lần (hiếm với Gemini).
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
        clean = 'Lần này AI lỡ chen vài chữ nước ngoài. Bạn hỏi lại giúp mình một câu nhé.';
      } else if (hasFabricatedNumbers(clean, ctxStr) || findMismatchedPairs(clean, ctxStr).length > 0 || findFabricatedFractions(clean, ctxStr).length > 0) {
        // VẪN bịa số / ghép sai %↔cỡ-mẫu / phân số bịa → CỨU-CÂU: bỏ riêng câu bịa, giữ câu sạch.
        clean = stripFabricatedSentences(clean, ctxStr).clean;
      }
      updateLastAssistant(clean);
    } catch (err) {
      const code = err?.code || err?.message || '';
      let msg;
      if (code === 'no-key') {
        msg = 'AI Coach chưa được bật (chưa cấu hình API key). Khi đã thêm key trên Vercel là dùng được ngay.';
      } else if (String(code).startsWith('gemini-4') || String(code).startsWith('http-4')) {
        msg = 'Có thể đã hết lượt miễn phí hôm nay, hoặc API key chưa đúng. Thử lại sau hoặc kiểm tra key trên Vercel nhé.';
      } else if (String(code).startsWith('gemini-5') || code === 'empty') {
        msg = 'Bên Gemini đang quá tải (không phải lỗi mạng của bạn). Đợi một chút rồi bấm "Thử lại" nhé.';
      } else {
        msg = 'Chưa hỏi được Coach (mạng hoặc dịch vụ đang trục trặc). Bạn bấm "Thử lại" nhé.';
      }
      setLastError(true);
      updateLastAssistant(msg);
    } finally {
      setThinking(false);
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
  const placeholder = 'Đang xem số liệu của bạn…';

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
  const chipLabel = messages.length === 0 ? 'Bạn có thể hỏi mình' : 'Đề xuất tiếp theo';

  // Coach chạy Gemini (đám mây) → hiện trên MỌI thiết bị (kể cả iPhone).

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
                <span className="mono text-[11px] uppercase tracking-[0.2em]">Hỏi Coach</span>
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
                  Chat với AI Coach — nó đọc số liệu tập trung thật của bạn để trả lời. Chạy trên đám mây (nhanh, không tốn máy, dùng được cả điện thoại); cần mạng để hoạt động.
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

            <div className="flex items-end gap-2 px-3 py-3" style={{ borderTop: '1px solid var(--line)' }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1} placeholder="Chat với AI Coach…" className="max-h-[120px] min-h-[40px] flex-1 resize-none rounded-xl px-3 py-2 text-[13px] outline-none" style={{ background: 'var(--panel, rgba(0,0,0,0.04))', color: 'var(--ink)', border: '1px solid var(--line)' }} />
              <button type="button" onClick={() => send()} disabled={!input.trim() || busy} className="rounded-xl px-3 py-2 text-[13px] font-semibold disabled:opacity-40" style={{ background: 'var(--accent)', color: '#fff' }}>Gửi</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
