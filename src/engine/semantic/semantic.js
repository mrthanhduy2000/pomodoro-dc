/**
 * semantic.js — "đọc-nghĩa" ghi chú CHẠY TRÊN MÁY (local, miễn phí, offline, 0 tải).
 *
 * Biến mỗi ghi chú thành một vector ngữ nghĩa bằng TF-IDF trên char-3gram (xử lý
 * được dấu & biến thể chính tả tiếng Việt ở mức cơ bản), rồi gom cụm theo nghĩa +
 * tìm ghi chú tương tự. Đây KHÔNG phải chatbot, KHÔNG sinh câu trả lời — chỉ hiểu
 * "ghi chú nào cùng chủ đề". (Bản nơ-ron 118MB để dành làm tuỳ chọn desktop sau —
 * mọi hàm toán ở đây DÙNG CHUNG được khi cắm nguồn vector nơ-ron.)
 *
 * Toàn bộ THUẦN & tất định → test bằng vector/chuỗi dựng sẵn, không phụ thuộc model.
 * Module ĐỘC LẬP: KHÔNG được coachIntel/useCoachInsight import (giữ đường báo cáo nhẹ).
 */

export function stripHtmlToText(value) {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

export function l2normalize(vec) {
  let n = 0;
  for (let i = 0; i < vec.length; i += 1) n += vec[i] * vec[i];
  n = Math.sqrt(n);
  if (n === 0) return vec.slice();
  return vec.map((x) => x / n);
}

export function cosineSimilarity(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0; let na = 0; let nb = 0;
  for (let i = 0; i < a.length; i += 1) { dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

function normalizeForGrams(text) {
  return String(text ?? '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
}

// FNV-1a 32-bit → [0, dims)
function hashToDim(str, dims) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) % dims;
}

function charNgrams(text, n) {
  const s = normalizeForGrams(text);
  if (s.length < n) return s ? [s] : [];
  const grams = [];
  for (let i = 0; i + n <= s.length; i += 1) grams.push(s.slice(i, i + n));
  return grams;
}

/**
 * buildTfidfVectors — vector hoá ghi chú bằng TF-IDF char-n-gram + hashing trick.
 * idf tính trên CHÍNH tập ghi chú của người dùng. Trả mảng vector đã L2-normalize.
 */
export function buildTfidfVectors(texts, opts = {}) {
  const { ngram = 3, dims = 512 } = opts;
  const list = Array.isArray(texts) ? texts : [];
  const tfRows = list.map((t) => {
    const counts = new Map();
    for (const g of charNgrams(t, ngram)) counts.set(hashToDim(g, dims), (counts.get(hashToDim(g, dims)) ?? 0) + 1);
    return counts;
  });
  const df = new Array(dims).fill(0);
  for (const counts of tfRows) for (const d of counts.keys()) df[d] += 1;
  const N = list.length || 1;
  return tfRows.map((counts) => {
    const vec = new Array(dims).fill(0);
    for (const [d, c] of counts) vec[d] = c * Math.log((N + 1) / (df[d] + 1));
    return l2normalize(vec);
  });
}

/**
 * clusterByThreshold — gom cụm kết-tụ (average-link) theo ngưỡng cosine. Tất định
 * (tie-break theo index nhỏ nhất). Trả mảng clusterId cùng độ dài input.
 */
export function clusterByThreshold(vectors, opts = {}) {
  const { threshold = 0.5 } = opts;
  const n = vectors.length;
  if (n === 0) return [];
  const sim = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i += 1) for (let j = i + 1; j < n; j += 1) { const s = cosineSimilarity(vectors[i], vectors[j]); sim[i][j] = s; sim[j][i] = s; }

  let clusters = Array.from({ length: n }, (_, i) => [i]);
  for (;;) {
    let bestAvg = -1; let bi = -1; let bj = -1;
    for (let i = 0; i < clusters.length; i += 1) {
      for (let j = i + 1; j < clusters.length; j += 1) {
        let sum = 0;
        for (const a of clusters[i]) for (const b of clusters[j]) sum += sim[a][b];
        const avg = sum / (clusters[i].length * clusters[j].length);
        if (avg > bestAvg + 1e-12) { bestAvg = avg; bi = i; bj = j; }
      }
    }
    if (bi < 0 || bestAvg < threshold) break;
    clusters[bi] = clusters[bi].concat(clusters[bj]);
    clusters = clusters.filter((_, idx) => idx !== bj);
  }

  const labels = new Array(n).fill(0);
  clusters.sort((a, b) => Math.min(...a) - Math.min(...b));
  clusters.forEach((members, id) => members.forEach((idx) => { labels[idx] = id; }));
  return labels;
}

/** labelCluster — chọn ghi chú gần TÂM cụm nhất làm nhãn đại diện. */
export function labelCluster(memberIndices, vectors, texts) {
  if (!memberIndices.length) return { label: '', representativeIndex: -1, size: 0 };
  const dims = vectors[memberIndices[0]].length;
  const centroid = new Array(dims).fill(0);
  for (const i of memberIndices) for (let d = 0; d < dims; d += 1) centroid[d] += vectors[i][d];
  const c = l2normalize(centroid);
  let best = memberIndices[0]; let bestSim = -1;
  for (const i of memberIndices) { const s = cosineSimilarity(vectors[i], c); if (s > bestSim) { bestSim = s; best = i; } }
  const raw = String(texts[best] ?? '').trim();
  return { label: raw.length > 70 ? `${raw.slice(0, 67)}…` : raw, representativeIndex: best, size: memberIndices.length };
}

/** findSimilar — top-K vector gần nghĩa nhất với query (cosine). */
export function findSimilar(queryVec, vectors, opts = {}) {
  const { topK = 5, minScore = 0.2, excludeIndex = -1 } = opts;
  const scored = [];
  for (let i = 0; i < vectors.length; i += 1) {
    if (i === excludeIndex) continue;
    const s = cosineSimilarity(queryVec, vectors[i]);
    if (s >= minScore) scored.push({ index: i, score: s });
  }
  scored.sort((a, b) => (b.score - a.score) || (a.index - b.index));
  return scored.slice(0, topK);
}

function isUsableSession(e) {
  return e && e.completed !== false && e.status !== 'cancelled' && e.cancelled !== true;
}

/**
 * collectNoteItems — rút các ghi chú dùng được (đã strip HTML) từ lịch sử, kèm
 * minutes & goalAchieved. Trả {ready, items, texts}. Dùng chung cho cả TF-IDF lẫn
 * tầng nơ-ron (nơ-ron nhúng đúng `texts` này rồi gọi themesFromVectors).
 */
export function collectNoteItems(history = [], opts = {}) {
  const {
    getText = (e) => stripHtmlToText(e?.nextNote) || stripHtmlToText(e?.note),
    maxNotes = 300, minNotes = 6,
  } = opts;
  const items = [];
  for (const e of (Array.isArray(history) ? history : [])) {
    if (!isUsableSession(e)) continue;
    const text = getText(e);
    if (!text || text.length < 3) continue;
    items.push({ text, minutes: Number(e.minutes) || 0, goal: typeof e.goalAchieved === 'boolean' ? e.goalAchieved : null });
  }
  const recent = items.slice(-maxNotes);
  return { ready: recent.length >= minNotes, items: recent, texts: recent.map((i) => i.text) };
}

/** themesFromVectors — gom cụm các vector (TF-IDF hoặc nơ-ron) thành chủ đề. */
export function themesFromVectors(items, vectors, opts = {}) {
  const { threshold = 0.2 } = opts;
  const labels = clusterByThreshold(vectors, { threshold });
  const texts = items.map((i) => i.text);
  const groups = new Map();
  labels.forEach((cid, i) => { const g = groups.get(cid) ?? []; g.push(i); groups.set(cid, g); });

  const themes = [];
  for (const members of groups.values()) {
    if (members.length < 2) continue; // chỉ tính là "chủ đề" khi có ≥2 phiên cùng nghĩa
    const { label } = labelCluster(members, vectors, texts);
    if (!label) continue;
    const minutes = members.reduce((s, i) => s + items[i].minutes, 0);
    const withGoal = members.filter((i) => items[i].goal !== null);
    const goalRate = withGoal.length >= 3 ? withGoal.filter((i) => items[i].goal === true).length / withGoal.length : null;
    themes.push({ label, size: members.length, minutes, goalRate });
  }
  themes.sort((a, b) => (b.size - a.size) || (b.minutes - a.minutes));
  return { ready: true, noteCount: items.length, themes: themes.slice(0, 6) };
}

/**
 * analyzeNoteThemes — mặt tiền TF-IDF (mặc định, chạy ngay trên iPhone, 0 tải).
 * @returns {{ready, noteCount, themes:[{label,size,minutes,goalRate}]}}
 */
export function analyzeNoteThemes(history = [], opts = {}) {
  const { threshold = 0.2 } = opts;
  const collected = collectNoteItems(history, opts);
  if (!collected.ready) return { ready: false, noteCount: collected.items.length, themes: [] };
  const vectors = buildTfidfVectors(collected.texts);
  return themesFromVectors(collected.items, vectors, { threshold });
}
