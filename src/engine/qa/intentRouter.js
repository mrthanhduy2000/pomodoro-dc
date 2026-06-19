/**
 * intentRouter.js — hiểu câu hỏi tiếng Việt KHÔNG cần LLM: so khớp ngữ nghĩa với
 * câu mẫu của từng ý định bằng char-3gram TF-IDF + cosine (tái dùng semantic.js).
 * THUẦN & tất định. Trả {intent, status, confidence, alternatives, suggestEscalate}.
 */
import { buildTfidfVectors, cosineSimilarity } from '../semantic/semantic';

export const ACCEPT = 0.40;
export const MARGIN = 0.05;
export const CLARIFY_FLOOR = 0.25;
const EPS = 1e-6;

const CONTRACTIONS = {
  ko: 'không', k: 'không', kg: 'không', khong: 'không', dc: 'được', 'đc': 'được',
  ntn: 'như thế nào', h: 'giờ', ms: 'mình', t: 'tôi', vs: 'với', vói: 'với',
  ad: 'admin', bn: 'bao nhiêu', tl: 'trả lời', hqua: 'hôm qua', bme: 'buổi',
};

export function stripDiacritics(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

export function normalizeVi(text) {
  const lo = String(text ?? '').toLowerCase().trim();
  const expanded = lo.split(/\s+/).map((w) => CONTRACTIONS[w] ?? w).join(' ');
  const noacc = stripDiacritics(expanded);
  return `${expanded} ${noacc}`.replace(/\s+/g, ' ').trim();
}

// Cụm định danh mạnh → nâng điểm ý định để char-3gram khỏi nhầm mặt chữ.
const KEYWORD_BOOST = [
  ['chuoi', 'streak', 0.12], ['streak', 'streak', 0.12],
  ['tuan truoc', 'this-week', 0.12], ['tuan nay', 'this-week', 0.08],
  ['gio vang', 'best-time', 0.14], ['khuya', 'late-night', 0.12], ['toi muon', 'late-night', 0.1],
  ['bao nhieu phut', 'session-length', 0.12], ['may phut', 'session-length', 0.1], ['bao lau', 'session-length', 0.08],
  ['hom nay', 'today', 0.1], ['muc tieu ngay', 'today', 0.08],
  ['gio nen lam gi', 'recommendation', 0.12], ['lam gi bay gio', 'recommendation', 0.12], ['phien ke', 'recommendation', 0.1],
  ['bo phien', 'abandon', 0.12], ['bo giua chung', 'abandon', 0.12], ['hay bo', 'abandon', 0.08],
  ['muc tieu', 'goal-calibration', 0.06],
  ['loai viec', 'category', 0.1], ['loai nao', 'category', 0.08],
  ['chu de', 'note-topics', 0.12], ['hay lam gi', 'note-topics', 0.08],
  ['ky luc', 'records', 0.14], ['dai nhat', 'records', 0.08],
  ['deu dan', 'consistency', 0.12], ['deu khong', 'consistency', 0.08],
  ['tong quan', 'overview', 0.12], ['tom tat', 'overview', 0.12],
  ['lam duoc gi', 'capabilities', 0.12], ['hoi duoc gi', 'capabilities', 0.12], ['giup gi', 'capabilities', 0.1],
  ['tien bo', 'trend', 0.1], ['di xuong', 'trend', 0.08],
];

// 5-9 câu mẫu / ý định (có dấu — normalizeVi tự thêm bản không dấu khi index).
export const INTENT_CATALOG = [
  { id: 'today', samples: ['hôm nay thế nào', 'nay sao rồi', 'tiến độ hôm nay ra sao', 'còn bao nhiêu nữa là đạt mục tiêu ngày', 'còn thiếu mấy phiên nữa', 'hôm nay làm được bao nhiêu rồi', 'nay đạt mục tiêu chưa'] },
  { id: 'this-week', samples: ['tuần này tôi tập trung thế nào', 'tuần này so với tuần trước sao', 'tuần này hơn hay kém tuần trước', 'tuần này có tiến bộ không', 'so tuần này với tuần trước', 'tuần này tăng hay giảm'] },
  { id: 'trend', samples: ['tôi đang tiến bộ không', 'dạo này tôi khá lên hay đi xuống', 'tôi có đang tốt dần lên không', 'phong độ của tôi thế nào', 'gần đây tôi tệ đi à'] },
  { id: 'best-time', samples: ['giờ vàng của tôi là khi nào', 'buổi nào tôi tập trung tốt nhất', 'khi nào tôi đạt mục tiêu nhiều nhất', 'tôi làm việc khó vào lúc nào hợp', 'lúc nào trong ngày tôi mạnh nhất', 'giờ nào hiệu quả nhất'] },
  { id: 'session-length', samples: ['nên làm phiên bao nhiêu phút', 'tôi nên đặt timer mấy phút', 'làm bao lâu mỗi phiên là vừa', 'phiên dài bao nhiêu là tốt cho tôi', 'bây giờ focus mấy phút', 'độ dài phiên hợp với tôi'] },
  { id: 'streak', samples: ['chuỗi của mình bao nhiêu ngày rồi', 'streak mình đang mấy ngày', 'làm sao giữ chuỗi', 'kỷ lục chuỗi dài nhất của mình', 'còn mấy ngày tới mốc chuỗi', 'hôm nay giữ được chuỗi chưa'] },
  { id: 'goal-calibration', samples: ['mục tiêu ngày của tôi có hợp lý không', 'tôi nên đặt mục tiêu bao nhiêu', 'mục tiêu có quá sức không', 'mục tiêu ngày dễ hay khó', 'nên hạ hay nâng mục tiêu'] },
  { id: 'category', samples: ['loại việc nào tôi làm nhiều nhất', 'tôi dành nhiều thời gian cho việc gì', 'loại nào hiệu quả nhất với tôi', 'loại việc nào đang bị bỏ bê', 'tôi nên ưu tiên loại việc nào', 'top loại việc của tôi'] },
  { id: 'abandon', samples: ['sao tôi hay bỏ phiên giữa chừng', 'khi nào tôi hay bỏ phiên', 'tôi có hay dừng giữa chừng không', 'buổi nào tôi hay huỷ phiên'] },
  { id: 'late-night', samples: ['làm khuya có ổn không', 'phiên đêm khuya của tôi thế nào', 'tôi làm buổi tối muộn có tốt không', 'khuya tôi tập trung kém à'] },
  { id: 'recommendation', samples: ['giờ nên làm gì', 'bây giờ làm gì hợp lý', 'phiên kế tiếp nên thế nào', 'gợi ý cho tôi việc tiếp theo', 'tối nay làm gì hợp', 'giờ này làm gì tốt'] },
  { id: 'note-topics', samples: ['dạo này tôi hay làm việc gì', 'chủ đề ghi chú của tôi là gì', 'gần đây tôi xoay quanh việc gì', 'tôi hay ghi chú về cái gì'] },
  { id: 'consistency', samples: ['tôi có đều đặn không', 'tôi hoạt động bao nhiêu ngày gần đây', 'tôi có chăm chỉ đều không', 'mức đều đặn của tôi thế nào'] },
  { id: 'overview', samples: ['tổng quan tình hình tập trung của tôi', 'tóm tắt giúp tôi đi', 'dạo này tôi tập trung ra sao', 'cho xem bức tranh chung', 'review tổng thể giúp tôi'] },
  { id: 'records', samples: ['kỷ lục của tôi là gì', 'phiên dài nhất của tôi', 'ngày nào tôi làm nhiều phiên nhất', 'chuỗi dài nhất của tôi'] },
  { id: 'capabilities', samples: ['bạn làm được gì', 'coach giúp tôi được gì', 'tôi hỏi được những gì', 'bạn biết gì về tôi', 'gợi ý vài câu hỏi đi'] },
];

const ID_ORDER = INTENT_CATALOG.map((c) => c.id);

export function buildIntentIndex(catalog = INTENT_CATALOG) {
  const samplesNorm = [];
  const ids = [];
  for (const { id, samples } of catalog) for (const s of samples) { samplesNorm.push(normalizeVi(s)); ids.push(id); }
  return { samplesNorm, ids };
}

export function routeIntent(text, index = buildIntentIndex()) {
  const qn = normalizeVi(text);
  if (qn.length < 2) return { intent: null, status: 'empty', confidence: null, alternatives: [], suggestEscalate: false };

  const vecs = buildTfidfVectors([...index.samplesNorm, qn]);
  const qv = vecs[vecs.length - 1];
  const score = new Map();
  for (let i = 0; i < index.samplesNorm.length; i += 1) {
    const s = cosineSimilarity(qv, vecs[i]);
    const id = index.ids[i];
    if (s > (score.get(id) ?? -1)) score.set(id, s);
  }
  for (const [kw, id, boost] of KEYWORD_BOOST) if (qn.includes(kw)) score.set(id, (score.get(id) ?? 0) + boost);

  const ranked = [...score.entries()].sort((a, b) => (b[1] - a[1]) || (ID_ORDER.indexOf(a[0]) - ID_ORDER.indexOf(b[0])));
  const top = ranked[0] ?? [null, 0];
  const s1 = top[1];
  const s2 = ranked[1]?.[1] ?? 0;

  if (s1 >= ACCEPT && (s1 - s2) >= MARGIN - EPS) {
    return { intent: top[0], status: 'ok', confidence: s1 >= 0.45 ? 'cao' : 'vừa', score: s1, alternatives: [], suggestEscalate: false };
  }
  if (s1 >= ACCEPT) {
    return { intent: top[0], status: 'ambiguous', confidence: 'thấp', score: s1, alternatives: [ranked[0][0], ranked[1][0]], suggestEscalate: false };
  }
  if (s1 >= CLARIFY_FLOOR) {
    return { intent: top[0], status: 'low', confidence: 'thấp', score: s1, alternatives: [top[0]], suggestEscalate: true };
  }
  return { intent: null, status: 'unknown', confidence: null, score: s1, alternatives: [], suggestEscalate: true };
}
