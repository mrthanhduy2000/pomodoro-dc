/**
 * guard.js — LƯỚI CHỐNG-BỊA tất định cho AI Coach (tuyến phòng thủ chính chống fake số).
 * Tách ra từ coachPrompt.js (2026-07-12): phần dựng prompt nằm ở prompt.js cùng thư mục.
 * "NIỀM TIN = TÀI SẢN QUÝ NHẤT" — mọi thay đổi ở đây PHẢI giữ điểm số coachEval.test.js
 * (BẮT ≥90%, BÁO NHẦM = 0) không tụt.
 */

/**
 * hasForeignScript — model nhỏ (Qwen) đôi khi "trôi" sang chữ Hán/Trung (小时, 约…),
 * Hàn, Nhật. Tiếng Việt chỉ dùng Latinh + dấu (đều nằm trong Latin/Latin-Extended),
 * nên các dải CJK/Hangul/Kana dưới đây KHÔNG bao giờ xuất hiện trong câu Việt hợp lệ.
 * Dùng để phát hiện rồi tự viết lại (CoachOffline.jsx). Trả true nếu có ký tự lạ.
 */
export function hasForeignScript(s) {
  return /[\u3000-\u303f\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af\uf900-\ufaff\uff00-\uffef]/.test(String(s ?? ''));
}

// === L\u01af\u1edaI CH\u1eb6N-B\u1ecaA-S\u1ed0 (t\u1ea5t \u0111\u1ecbnh) ===========================================
// Tuy\u1ebfn ph\u00f2ng th\u1ee7 CH\u00cdNH ch\u1ed1ng "H\u1ecfi Coach" b\u1ecba s\u1ed1. Nguy\u00ean t\u1eafc: m\u1ecdi con s\u1ed1 mang
// \u0110\u01a0N V\u1eca-D\u1eee-LI\u1ec6U (gi\u1edd/ph\u00fat/phi\u00ean/ng\u00e0y/tu\u1ea7n/l\u1ea7n/%/h) m\u00e0 model vi\u1ebft ra PH\u1ea2I xu\u1ea5t
// hi\u1ec7n trong b\u1ea3ng s\u1ed1 li\u1ec7u ("=== D\u1eee LI\u1ec6U TH\u1eacT ==="). S\u1ed1 kh\u00f4ng t\u00ecm th\u1ea5y \u2192 coi l\u00e0 B\u1ecaA.
// S\u1ed1 tr\u1ea7n (kh\u00f4ng \u0111\u01a1n v\u1ecb) \u0111\u01b0\u1ee3c MI\u1ec4N TR\u1eea \u0111\u1ec3 kh\u1ecfi b\u00e1o nh\u1ea7m v\u0103n n\u00f3i ("3 nh\u1ecbp", "1 l\u1eddi khuy\u00ean").
// Ch\u1ea1y \u0111\u01b0\u1ee3c \u1edf CI kh\u00f4ng-WebGPU (kh\u00f4ng c\u1ea7n model). KH\u00d4NG b\u1eaft "\u0111\u1ecdc nh\u1ea7m nh\u00e3n" (s\u1ed1 c\u00f3 th\u1eadt)
// \u2014 c\u00e1i \u0111\u00f3 do prompt "\u0110\u1eccC \u0110\u00daNG GI\u00c1 TR\u1eca" + \u0111\u1ecbnh d\u1ea1ng b\u1ea3ng lo.
const GUARD_UNIT = '(?:%|h(?![a-z\u00e0-\u1ef9])|\\s?(?:gi\u1edd|ti\u1ebfng|ph\u00fat|phi\u00ean|ng\u00e0y|tu\u1ea7n|l\u1ea7n))';
const GUARD_NUM_UNIT = new RegExp(`(\\d[\\d.,]*)\\s*${GUARD_UNIT}`, 'giu');

// Chu\u1ea9n ho\u00e1 \u0111\u1ec3 so kh\u1edbp b\u1ea5t ch\u1ea5p kh\u00e1c bi\u1ec7t v\u1eb7t (d\u1ea5u c\u00e1ch, 'h' vs ' gi\u1edd', d\u1ea5u ph\u1ea9y th\u1eadp ph\u00e2n).
function normNumUnit(numRaw, unitRaw) {
  const num = String(numRaw).replace(/,/g, '.').replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
  let unit = String(unitRaw).trim().toLowerCase();
  if (unit === 'h' || unit === 'ti\u1ebfng') unit = 'gi\u1edd'; // "13.3 ti\u1ebfng" == "13.3 gi\u1edd" == "13.3h"
  return `${num} ${unit}`;
}

// Tr\u00edch m\u1ecdi c\u1eb7p (s\u1ed1 + \u0111\u01a1n v\u1ecb-d\u1eef-li\u1ec7u) trong m\u1ed9t \u0111o\u1ea1n \u2192 m\u1ea3ng chu\u1ed7i \u0111\u00e3 chu\u1ea9n ho\u00e1.
function extractDataNumbers(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(GUARD_NUM_UNIT)) {
    const num = m[1];
    const unit = m[0].slice(m[0].indexOf(num) + num.length);
    out.push(normNumUnit(num, unit));
  }
  return out;
}

/**
 * findFabricatedNumbers \u2014 T\u1ea4T \u0110\u1ecaNH. Tr\u1ea3 v\u1ec1 m\u1ea3ng con s\u1ed1 (\u0111\u00e3 chu\u1ea9n ho\u00e1) m\u00e0 c\u00e2u tr\u1ea3 l\u1eddi n\u00eau
 * K\u00c8M \u0111\u01a1n v\u1ecb-d\u1eef-li\u1ec7u nh\u01b0ng KH\u00d4NG c\u00f3 trong context. M\u1ea3ng r\u1ed7ng = s\u1ea1ch.
 * @param {string} answer  c\u00e2u tr\u1ea3 l\u1eddi c\u1ee7a Coach
 * @param {string} context chu\u1ed7i buildAnalystContext
 */
export function findFabricatedNumbers(answer, context) {
  const ctx = String(context ?? '');
  if (!ctx.trim()) return []; // kh\u00f4ng c\u00f3 d\u1eef li\u1ec7u n\u1ec1n \u0111\u1ec3 \u0111\u1ed1i chi\u1ebfu \u2192 kh\u00f4ng k\u1ebft t\u1ed9i
  const ctxSet = new Set(extractDataNumbers(ctx));
  const bad = [];
  const seen = new Set();
  for (const tok of extractDataNumbers(answer)) {
    if (ctxSet.has(tok) || seen.has(tok)) continue;
    seen.add(tok);
    bad.push(tok);
  }
  return bad;
}

/** hasFabricatedNumbers \u2014 ti\u1ec7n \u00edch boolean cho l\u1edbp UI. */
export function hasFabricatedNumbers(answer, context) {
  return findFabricatedNumbers(answer, context).length > 0;
}

// Tr\u00edch c\u1eb7p (ph\u1ea7n-tr\u0103m, c\u1ee1-m\u1eabu) tr\u00ean C\u00d9NG c\u1ee5m \u2014 HAI CHI\u1ec0U, cho ph\u00e9p ngo\u1eb7c/ph\u1ea9y/v\u00e0i ch\u1eef ch\u00e8n.
// CH\u1ec8 b\u1eaft khi % \u0110\u1ee8NG C\u1ea0NH m\u1ed9t c\u1ee1 m\u1eabu "tr\u00ean N <\u0111v>" (chi\u1ec1u A) ho\u1eb7c "N <\u0111v> \u2026 (\u2026X%)" (chi\u1ec1u B).
// % so-s\u00e1nh kh\u00f4ng c\u1ee1 m\u1eabu (91%/37%) v\u00e0 m\u1eabu ph\u00e2n s\u1ed1 (11/38) KH\u00d4NG kh\u1edbp \u2192 KH\u00d4NG \u00e9p c\u1eb7p (nghi th\u00ec tha).
function extractPctSamplePairs(text) {
  const out = [];
  const norm = (s) => String(s).replace(/,/g, '.').replace(/\.0+$/, '');
  const reA = /(\d[\d.,]*)\s*%[^\d%]{0,12}?tr\u00ean\s+(\d[\d.,]*)\s*(phi\u00ean|ng\u00e0y|tu\u1ea7n|l\u1ea7n)/giu;
  const reB = /(\d[\d.,]*)\s*(phi\u00ean|ng\u00e0y|tu\u1ea7n|l\u1ea7n)[^\d%]{0,20}?\([^)]*?(\d[\d.,]*)\s*%\)/giu;
  // Chuẩn hoá HAI CHIỀU (áp cho cả answer lẫn ctx) "… phần trăm" → "%" để paraphrase chữ vẫn khớp.
  const s = String(text ?? '').replace(/\s*phần\s*trăm/giu, '%');
  for (const m of s.matchAll(reA)) out.push(`${norm(m[1])}%|${norm(m[2])} ${m[3].toLowerCase()}`);
  for (const m of s.matchAll(reB)) out.push(`${norm(m[3])}%|${norm(m[1])} ${m[2].toLowerCase()}`);
  return out;
}

// Trích cặp PHÂN SỐ N/M (số nguyên trần, vd "11/38", "25/28"). Lookbehind/lookahead loại số
// thập phân ("13.3" không thành "13/3") để khỏi bắt nhầm. Trả mảng "N/M" đã bỏ khoảng trắng.
function extractFractions(text) {
  const out = [];
  for (const m of String(text ?? '').matchAll(/(?<!\d[.,])(\d{1,4})\s*\/\s*(\d{1,4})(?![.,]?\d)/g)) {
    out.push(`${m[1]}/${m[2]}`);
  }
  return out;
}

/**
 * findFabricatedFractions — bắt cặp PHÂN SỐ N/M model bịa (vd "phiên sâu 7/18" khi bảng ghi
 * "4/18"). Cả N lẫn M có thể đều có trong bảng ở chỗ khác nhưng GHÉP thành phân số SAI →
 * findFabricatedNumbers (kiểm số rời) bỏ sót. Trả mảng "N/M" có trong answer mà KHÔNG có trong
 * context. Bảo thủ: ctx rỗng → []. Mảng rỗng = sạch.
 */
export function findFabricatedFractions(answer, context) {
  const ctx = String(context ?? '');
  if (!ctx.trim()) return [];
  const ok = new Set(extractFractions(ctx));
  const bad = [];
  const seen = new Set();
  for (const f of extractFractions(answer)) {
    if (ok.has(f) || seen.has(f)) continue;
    seen.add(f);
    bad.push(f);
  }
  return bad;
}

/**
 * findMismatchedPairs \u2014 b\u1eaft ki\u1ec3u b\u1ecba tinh vi: % GH\u00c9P SAI c\u1ee1 m\u1eabu (c\u1ea3 hai s\u1ed1 \u0111\u1ec1u C\u00d3 trong b\u1ea3ng
 * nh\u01b0ng \u1edf hai d\u00f2ng kh\u00e1c nhau, vd "\u0111\u1ea1t 79% tr\u00ean 18 phi\u00ean" khi 79% l\u00e0 t\u1ed5ng c\u00f2n 18 phi\u00ean l\u00e0 c\u1ee7a
 * "H\u1ecdc"). Tr\u1ea3 m\u1ea3ng c\u1eb7p (chu\u1ea9n ho\u00e1) c\u00f3 trong answer m\u00e0 KH\u00d4NG c\u00f3 trong context. M\u1ea3ng r\u1ed7ng = s\u1ea1ch.
 * C\u1ed1 t\u00ecnh B\u1ea2O TH\u1ee6 (ch\u1ec9 b\u1eaft c\u1eb7p k\u1ec1-nhau r\u00f5 r\u00e0ng) \u0111\u1ec3 tr\u00e1nh xo\u00e1 nh\u1ea7m c\u00e2u th\u1eadt.
 */
export function findMismatchedPairs(answer, context) {
  const ctx = String(context ?? '');
  if (!ctx.trim()) return [];
  const ok = new Set(extractPctSamplePairs(ctx));
  const bad = [];
  const seen = new Set();
  for (const p of extractPctSamplePairs(answer)) {
    if (ok.has(p) || seen.has(p)) continue;
    seen.add(p);
    bad.push(p);
  }
  return bad;
}

// \u0110\u1ed5i token chu\u1ea9n-ho\u00e1 c\u1ee7a guard v\u1ec1 d\u1ea1ng \u0111\u1ecdc-\u0111\u01b0\u1ee3c cho c\u00e2u nh\u1eafc: "88 %" \u2192 "88%" (b\u1ecf space tr\u01b0\u1edbc %).
function prettyGuardToken(tok) {
  return String(tok).replace(/\s+%$/, '%');
}

/**
 * buildCorrectionNote \u2014 VI\u1ebeT-L\u1ea0I-C\u00d3-H\u01af\u1edaNG-D\u1eaaN: d\u1ef1ng c\u00e2u user-turn LI\u1ec6T K\u00ca \u0110\u00cdCH DANH s\u1ed1 b\u1ecba
 * \u0111\u1ec3 ch\u00e8n v\u00e0o l\u01b0\u1ee3t ch\u1ea1y th\u1ee9 2 (model bi\u1ebft ch\u00ednh x\u00e1c token n\u00e0o n\u00f3 v\u1eeba b\u1ecba). KH\u00d4NG n\u1edbi guard \u2014
 * ch\u1ec9 t\u0103ng t\u1ec9 l\u1ec7 l\u1ea7n-2-\u0111\u00fang; tuy\u1ebfn ch\u00f3t v\u1eabn l\u00e0 findFabricatedNumbers. Tr\u1ea3 '' n\u1ebfu kh\u00f4ng c\u00f3 s\u1ed1 b\u1ecba.
 */
export function buildCorrectionNote(badNums) {
  const list = (Array.isArray(badNums) ? badNums : []).map(prettyGuardToken).filter(Boolean);
  if (!list.length) return '';
  const quoted = list.map((n) => `"${n}"`).join(', ');
  return `C\u00e2u tr\u1ea3 l\u1eddi v\u1eeba r\u1ed3i c\u1ee7a b\u1ea1n c\u00f3 ch\u1ee9a c\u00e1c con s\u1ed1 KH\u00d4NG c\u00f3 trong b\u1ea3ng "=== D\u1eee LI\u1ec6U TH\u1eacT ===": ${quoted}. \u0110\u00e2y l\u00e0 s\u1ed1 b\u1ecba \u2014 kh\u00f4ng \u0111\u01b0\u1ee3c ph\u00e9p. H\u00e3y tr\u1ea3 l\u1eddi L\u1ea0I c\u00e2u h\u1ecfi c\u0169: ch\u1ec9 d\u00f9ng s\u1ed1 xu\u1ea5t hi\u1ec7n nguy\u00ean v\u0103n trong b\u1ea3ng (ch\u00e9p \u0111\u00fang t\u1eebng ch\u1eef s\u1ed1, kh\u00f4ng t\u1ef1 t\u00ednh, kh\u00f4ng l\u00e0m tr\u00f2n kh\u00e1c); con s\u1ed1 n\u00e0o b\u1ea3ng KH\u00d4NG c\u00f3 th\u00ec n\u00f3i th\u1eb3ng "m\u00ecnh ch\u01b0a c\u00f3 s\u1ed1 n\u00e0y trong d\u1eef li\u1ec7u" thay v\u00ec b\u1ecba s\u1ed1 kh\u00e1c; m\u1ed7i % v\u1eabn k\u00e8m c\u1ee1 m\u1eabu c\u1ea1nh n\u00f3 trong b\u1ea3ng; v\u1eabn 100% ti\u1ebfng Vi\u1ec7t, kh\u00f4ng d\u00f9ng t\u1eeb nh\u00e2n-qu\u1ea3. B\u1ea3ng kh\u00f4ng \u0111\u1ee7 s\u1ed1 \u0111\u1ec3 tr\u1ea3 l\u1eddi th\u00ec n\u00f3i th\u1eb3ng l\u00e0 ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u.`;
}

/**
 * appendCorrectionTurn \u2014 gh\u00e9p l\u01b0\u1ee3t s\u1eeda l\u1ed7i v\u00e0o CU\u1ed0I m\u1ea3ng messages (system gi\u1eef ri\u00eang, kh\u00f4ng \u0111\u1ee5ng).
 * Tr\u1ea3 m\u1ea3ng M\u1edaI, KH\u00d4NG mutate prev. correctionNote r\u1ed7ng \u2192 tr\u1ea3 nguy\u00ean prev (g\u1ecdi an to\u00e0n).
 */
export function appendCorrectionTurn(prevMessages, lastAnswer, correctionNote) {
  const base = Array.isArray(prevMessages) ? prevMessages : [];
  const note = String(correctionNote ?? '').trim();
  if (!note) return base;
  return [...base, { role: 'assistant', content: String(lastAnswer ?? '') }, { role: 'user', content: note }];
}

const FABRICATION_FALLBACK =
  'Ch\u1ed7 n\u00e0y m\u00ecnh ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u ch\u1eafc ch\u1eafn \u0111\u1ec3 tr\u1ea3 l\u1eddi b\u1eb1ng con s\u1ed1, n\u00ean m\u00ecnh kh\u00f4ng \u0111o\u00e1n b\u1eeba \u0111\u00e2u. B\u1ea1n th\u1eed h\u1ecfi m\u00ecnh m\u1ed9t g\u00f3c kh\u00e1c nh\u00e9 \u2014 gi\u1edd v\u00e0ng, lo\u1ea1i vi\u1ec7c b\u1ea1n hay l\u00e0m, hay nh\u1ecbp h\u00f4m nay ch\u1eb3ng h\u1ea1n.';

/**
 * stripFabricatedSentences \u2014 C\u1ee8U-C\u00c2U cho CHAT (CoachChat). B\u1ecf RI\u00caNG c\u00e2u ch\u1ee9a s\u1ed1-b\u1ecba, gi\u1eef c\u00e2u
 * s\u1ea1ch nguy\u00ean v\u0103n (\u0111\u1ee1 ph\u0169 h\u01a1n nuke c\u1ea3 c\u00e2u tr\u1ea3 l\u1eddi). B\u1ecf h\u1ebft \u2192 fallback. T\u1ea5t \u0111\u1ecbnh, ti\u1ebfng-Vi\u1ec7t-safe
 * (kh\u00f4ng c\u1eaft "13.3"). Ca x\u1ea5u nh\u1ea5t (c\u00e2u d\u00e0i n\u1ed1i d\u1ea5u ph\u1ea9y) = \u0111\u00fang b\u1eb1ng nuke c\u0169, KH\u00d4NG t\u1ec7 h\u01a1n.
 * @returns {{clean: string, removed: string[]}}
 */
export function stripFabricatedSentences(answer, context, opts = {}) {
  const fallback = (opts && typeof opts.fallback === 'string' && opts.fallback.trim()) || FABRICATION_FALLBACK;
  const text = String(answer ?? '');
  if (!text.trim()) return { clean: fallback, removed: [] };
  const ctx = String(context ?? '');
  if (!ctx.trim()) return { clean: text, removed: [] }; // kh\u00f4ng b\u1ea3ng n\u1ec1n \u2192 kh\u00f4ng k\u1ebft t\u1ed9i
  // V\u00e1ch c\u00e2u = xu\u1ed1ng d\u00f2ng, ho\u1eb7c . ! ? \u2026 KH\u00d4NG \u0111\u1ee9ng tr\u01b0\u1edbc ch\u1eef s\u1ed1 (gi\u1eef "13.3") v\u00e0 c\u00f3 kho\u1ea3ng tr\u1eafng sau.
  const parts = text.split(/(\n+|(?<=[.!?\u2026])(?!\d)(?=\s))/u);
  const removed = [];
  const kept = [];
  let buf = '';
  const flush = () => {
    if (!buf) return;
    const core = buf.trim();
    if (core && (findFabricatedNumbers(core, ctx).length > 0 || findMismatchedPairs(core, ctx).length > 0 || findFabricatedFractions(core, ctx).length > 0)) removed.push(core);
    else kept.push(buf);
    buf = '';
  };
  for (const seg of parts) {
    if (seg === undefined) continue;
    if (/^\n+$/.test(seg)) { flush(); kept.push(seg); continue; }
    buf += seg;
    if (/[.!?\u2026]\s*$/u.test(seg) && !/\d[.!?\u2026]\d*\s*$/.test(seg)) flush();
  }
  flush();
  let clean = kept.join('').replace(/[ \t]+/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!clean) clean = fallback;
  return { clean, removed };
}

/**
 * scrubFabricatedLines \u2014 C\u1ee8U-C\u00c2U cho b\u1ea3n PH\u00c2N T\u00cdCH 4 ph\u1ea7n (CoachOffline). L\u1ecdc T\u1eeaNG D\u00d2NG: d\u00f2ng
 * ch\u1ee9a s\u1ed1-b\u1ecba \u2192 b\u1ecf; gi\u1eef d\u00f2ng s\u1ea1ch + nh\u00e3n [1][2][3][4]. Ph\u1ea7n [n] r\u1ed7ng sau l\u1ecdc \u2192 ch\u00e8n "ch\u01b0a \u0111\u1ee7
 * d\u1eef li\u1ec7u" (gi\u1eef nh\u00e3n). L\u1ecdc s\u1ea1ch to\u00e0n b\u00e0i \u2192 fallback. H\u1ee3p c\u1ea5u tr\u00fac 4 ph\u1ea7n h\u01a1n l\u00e0 t\u00e1ch-c\u00e2u.
 * @returns {{clean: string, removed: string[]}}
 */
export function scrubFabricatedLines(answer, context, opts = {}) {
  const fallback = (opts && typeof opts.fallback === 'string' && opts.fallback.trim()) ||
    'L\u1ea7n n\u00e0y AI tr\u00ean m\u00e1y ch\u01b0a b\u00e1m ch\u1eafc \u0111\u01b0\u1ee3c v\u00e0o s\u1ed1 li\u1ec7u, n\u00ean m\u00ecnh t\u1ea1m d\u1eebng \u1edf \u0111\u00e2y cho an to\u00e0n. B\u1ea1n th\u1eed l\u1ea1i nh\u00e9, ho\u1eb7c m\u1edf "H\u1ecfi Coach" \u0111\u1ec3 h\u1ecfi c\u1ee5 th\u1ec3 h\u01a1n.';
  const text = String(answer ?? '');
  if (!text.trim()) return { clean: fallback, removed: [] };
  const ctx = String(context ?? '');
  if (!ctx.trim()) return { clean: text, removed: [] };
  const isLabel = (l) => /^\s*\[[1-4]\]/.test(l);
  const removed = [];
  const out = [];
  for (const line of text.split('\n')) {
    if (isLabel(line) || !line.trim()) { out.push(line); continue; } // gi\u1eef nh\u00e3n + d\u00f2ng tr\u1ed1ng
    if (findFabricatedNumbers(line, ctx).length > 0 || findMismatchedPairs(line, ctx).length > 0 || findFabricatedFractions(line, ctx).length > 0) { removed.push(line.trim()); continue; }
    out.push(line);
  }
  const filled = [];
  for (let i = 0; i < out.length; i += 1) {
    filled.push(out[i]);
    if (isLabel(out[i])) {
      let j = i + 1, hasBody = false;
      while (j < out.length && !isLabel(out[j])) { if (out[j].trim()) hasBody = true; j += 1; }
      if (!hasBody) filled.push('ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u');
    }
  }
  let clean = filled.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  const anyBody = filled.some((l) => l.trim() && !isLabel(l) && l.trim() !== 'ch\u01b0a \u0111\u1ee7 d\u1eef li\u1ec7u');
  if (!clean || !anyBody) clean = fallback;
  return { clean, removed };
}
