/**
 * guardedGenerate.js — pipeline "gọi Gemini → sanitize → chống chữ-lạ → chống bịa số →
 * cứu-câu/cứu-dòng" dùng CHUNG cho CoachChat.jsx, CoachOffline.jsx, CoachNudge.jsx (trước đây
 * mỗi nơi tự viết lại y hệt nhau, chỉ khác vài tham số). Tham số hoá đúng những khác biệt THẬT
 * đang tồn tại giữa 3 nơi gọi (allowGuidedRetry, stripGranularity, generateOptions) — KHÔNG đổi
 * hành vi ở bất kỳ nơi nào đang dùng.
 */
import { sanitizeLLMOutput } from './prompt';
import {
  hasForeignScript,
  hasFabricatedNumbers,
  findFabricatedNumbers,
  findMismatchedPairs,
  findFabricatedFractions,
  buildCorrectionNote,
  appendCorrectionTurn,
  stripFabricatedSentences,
  scrubFabricatedLines,
} from './guard';
import { generateCloud } from './cloudEngine';

/**
 * @param {object} opts
 * @param {string} opts.system
 * @param {Array} opts.messages
 * @param {string} opts.ctxStr - context "DỮ LIỆU THẬT" dùng để soi guard (đã dựng cùng lúc build prompt)
 * @param {object} [opts.generateOptions] - tham số thêm truyền vào generateCloud (maxTokens, tier...)
 * @param {boolean} [opts.allowGuidedRetry] - CoachChat/CoachOffline=true (có thử lại 1 lần); CoachNudge=false (không thử lại, sai thì bỏ qua)
 * @param {'sentence'|'line'} [opts.stripGranularity] - 'sentence' (CoachChat/CoachNudge) hay 'line' (CoachOffline, giữ khung 4 phần)
 * @param {() => void} [opts.onBeforeRetry] - side-effect UI trước mỗi lần thử lại (xoá bong bóng đang gõ...)
 * @returns {Promise<{ text: string|null, foreignScriptError: boolean }>}
 */
export async function runGuardedCoachGeneration({
  system,
  messages,
  ctxStr,
  generateOptions = {},
  allowGuidedRetry = true,
  stripGranularity = 'sentence',
  onBeforeRetry,
}) {
  const run = (msgsToUse) => generateCloud({ system, messages: msgsToUse, temperature: 0.2, ...generateOptions });

  let clean = sanitizeLLMOutput(await run(messages));

  if (hasForeignScript(clean)) {
    if (allowGuidedRetry) {
      onBeforeRetry?.();
      clean = sanitizeLLMOutput(await run(messages));
    }
  } else if (allowGuidedRetry) {
    const bad = findFabricatedNumbers(clean, ctxStr);
    if (bad.length) {
      onBeforeRetry?.();
      const msgs2 = appendCorrectionTurn(messages, clean, buildCorrectionNote(bad));
      clean = sanitizeLLMOutput(await run(msgs2));
    }
  }

  if (hasForeignScript(clean)) {
    return { text: null, foreignScriptError: true };
  }

  if (
    hasFabricatedNumbers(clean, ctxStr) ||
    findMismatchedPairs(clean, ctxStr).length > 0 ||
    findFabricatedFractions(clean, ctxStr).length > 0
  ) {
    clean = stripGranularity === 'line'
      ? scrubFabricatedLines(clean, ctxStr).clean
      : stripFabricatedSentences(clean, ctxStr).clean;
  }

  return { text: clean, foreignScriptError: false };
}
