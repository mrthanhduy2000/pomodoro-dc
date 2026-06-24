/**
 * CoachNudge — CÂU NHẮC CHỦ ĐỘNG sau mỗi phiên. Ngay khi một phiên focus HOÀN THÀNH GẦN ĐÂY,
 * Coach (Gemini) tự viết MỘT câu ngắn bám số thật của phiên vừa xong + thói quen của bạn, hiện
 * ngay trong thẻ AI Coach — không phải chờ bạn bấm hỏi.
 *
 * CHẠY ĐÚNG CẢ DESKTOP LẪN iPHONE: dùng localStorage `dc-coach-nudge-v1` ghi id phiên đã nhắc +
 * gác "phiên vừa xong trong ~5 phút". Nhờ vậy dù thẻ bị ẩn lúc chạy phiên rồi mới mount lại sau
 * khi xong (như trên mobile), nudge vẫn kích đúng một lần; mở lại app sau nhiều giờ thì KHÔNG nhắc
 * phiên cũ (đã quá hạn / đã nhắc rồi).
 *
 * AN TOÀN: chạy NỀN, KHÔNG chặn luồng kết thúc phiên; lỗi (mạng/quota/timeout/chữ-lạ) → IM LẶNG.
 * VẪN qua lưới chống-bịa trước khi hiện; số "phiên vừa xong" ghép vào context (buildNudgeContext)
 * nên guard cho phép nhắc đúng số phiên đó. Mỗi phiên nhắc TỐI ĐA một lần (ghi id ngay khi bắt đầu).
 */
import { useEffect, useRef, useState } from 'react';
import { SparkGlyph } from './icons/Glyph';
import useGameStore from '../store/gameStore';
import { useAnalystContext } from '../hooks/useCoachContext';
import {
  buildLLMChatPrompt, buildNudgeContext, NUDGE_INSTRUCTION, sanitizeLLMOutput,
  hasForeignScript, hasFabricatedNumbers, findMismatchedPairs, findFabricatedFractions,
  stripFabricatedSentences,
} from '../engine/llm/coachPrompt';
import { generateCloud } from '../engine/llm/cloudEngine';

const GOLD = '#d9a441';
const NUDGE_KEY = 'dc-coach-nudge-v1'; // id phiên đã nhắc (để mỗi phiên nhắc tối đa 1 lần)
const RECENT_MS = 5 * 60 * 1000; // chỉ nhắc phiên xong trong 5 phút gần đây (tránh nhắc phiên cũ khi mở lại app)

export default function CoachNudge(goalProps) {
  const buildAnalyst = useAnalystContext(goalProps);
  const buildRef = useRef(buildAnalyst);
  buildRef.current = buildAnalyst; // luôn giữ bản mới nhất, khỏi đưa vào deps

  // id phiên mới nhất nếu là phiên HỢP LỆ (hoàn thành, không huỷ, có phút) — null nếu không.
  const validId = useGameStore((s) => {
    const h = s.history?.[0];
    return h && h.completed !== false && !h.cancelled && Number(h.minutes) > 0 ? (h.id ?? null) : null;
  });

  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!validId) return;
    let lastNudged = null;
    try { lastNudged = localStorage.getItem(NUDGE_KEY); } catch { /* bỏ qua */ }
    if (String(validId) === lastNudged) return; // phiên này đã nhắc rồi

    const entry = useGameStore.getState().history?.[0];
    if (!entry || (entry.id ?? null) !== validId) return;
    const ts = new Date(entry.finishedAt ?? entry.timestamp ?? NaN).getTime();
    if (Number.isFinite(ts) && Date.now() - ts > RECENT_MS) return; // phiên cũ → không nhắc

    // Đánh dấu NGAY để mỗi phiên nhắc tối đa 1 lần (kể cả khi generate lỗi / mount lại).
    try { localStorage.setItem(NUDGE_KEY, String(validId)); } catch { /* bỏ qua */ }

    let aborted = false;
    setLoading(true); setText('');
    (async () => {
      try {
        const session = {
          minutes: Math.round(Number(entry.minutes) || 0),
          categoryLabel: entry.categorySnapshot?.label || entry.categorySnapshot?.name || entry.categorySnapshot?.title || null,
          goalAchieved: entry.goalAchieved,
        };
        const ctx = buildNudgeContext(buildRef.current(), session);
        const { system, messages } = buildLLMChatPrompt(ctx, NUDGE_INSTRUCTION, []);
        let clean = sanitizeLLMOutput(await generateCloud({ system, messages, temperature: 0.2, maxTokens: 160 }));
        if (hasForeignScript(clean)) return; // chữ lạ → bỏ qua, không nhắc
        if (hasFabricatedNumbers(clean, ctx) || findMismatchedPairs(clean, ctx).length > 0 || findFabricatedFractions(clean, ctx).length > 0) {
          clean = stripFabricatedSentences(clean, ctx).clean; // CỨU-CÂU: bỏ riêng câu bịa
        }
        if (!aborted && clean && !hasForeignScript(clean)) setText(clean);
      } catch { /* mạng/quota/timeout → im lặng, không phá trải nghiệm vừa xong phiên */ }
      finally { if (!aborted) setLoading(false); }
    })();
    return () => { aborted = true; };
  }, [validId]);

  if (!loading && !text) return null;

  return (
    <div className="mt-2 rounded-xl px-3 py-2 text-[12.5px] leading-relaxed" style={{ border: `1px solid ${GOLD}44`, background: 'rgba(217,164,65,0.07)', color: 'var(--ink)' }}>
      <div className="mono mb-0.5 flex items-center gap-1 text-[9px] uppercase tracking-[0.18em]" style={{ color: GOLD }}>
        <SparkGlyph size={11} /> Coach vừa nhận xét
      </div>
      {loading && !text ? (
        <span style={{ color: 'var(--muted)' }}>Đang xem phiên vừa xong…</span>
      ) : (
        <div className="flex items-start justify-between gap-2">
          <p className="flex-1 whitespace-pre-wrap">{text}</p>
          <button type="button" onClick={() => setText('')} className="text-[14px] leading-none" style={{ color: 'var(--muted)' }} aria-label="Đóng">×</button>
        </div>
      )}
    </div>
  );
}
