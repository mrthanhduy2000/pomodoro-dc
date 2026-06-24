/**
 * coachSuggest.js — GỢI Ý CÂU HỎI cho "Hỏi Coach" (THUẦN, không React, không LLM).
 * KHÔNG sinh câu trả lời — chỉ chọn 2-3 câu hỏi tiếp theo (chip bấm) theo NGỮ CẢNH:
 * (a) tín hiệu dữ liệu user thực sự có (đọc từ chuỗi buildAnalystContext), và
 * (b) chủ đề vừa hỏi (nối tiếp). Tất định, test được. Đây CHỈ là gợi ý câu hỏi nên
 * KHÔNG vi phạm "chỉ Qwen trả lời".
 */

export const CATALOG = [
  { id: 'overview', question: 'Tổng quan tập trung của mình tới giờ thế nào?' },
  { id: 'portrait', question: 'Nhìn chung mình là kiểu người tập trung thế nào?' },
  { id: 'goalRate', question: 'Tỉ lệ đạt mục tiêu của mình ra sao?' },
  { id: 'todayPace', question: 'Hôm nay mình đang đi đúng nhịp chưa?' },
  { id: 'goldenHour', question: 'Giờ vàng của mình là khung nào?' },
  { id: 'bestWindow', question: 'Giờ này mình nên làm việc khó hay việc nhẹ?' },
  { id: 'idealLength', question: 'Phiên dài bao nhiêu phút thì hợp với mình nhất?' },
  { id: 'deepWork', question: 'Mình hay làm phiên sâu (từ 45 phút) không?' },
  { id: 'abandon', question: 'Mình hay bỏ phiên giữa chừng vào lúc nào?' },
  { id: 'lateNight', question: 'Làm khuya thì chất lượng phiên của mình thế nào?' },
  { id: 'momentum', question: 'Tuần này so với tuần trước mình thế nào?' },
  { id: 'longTrend', question: 'Mấy tuần nay xu hướng tập trung của mình ra sao?' },
  { id: 'weekday', question: 'Ngày nào trong tuần mình làm năng suất nhất?' },
  { id: 'category', question: 'Mình dành nhiều thời gian cho loại việc nào nhất?' },
  { id: 'neglect', question: 'Có loại việc nào mình đang bỏ bê không?' },
  { id: 'goalCalibration', question: 'Mục tiêu mỗi ngày của mình có hợp lý không?' },
  { id: 'streak', question: 'Hôm nay mình có giữ được chuỗi không?' },
  { id: 'consistency', question: 'Mình có đều đặn không, hay làm theo đợt?' },
  { id: 'notesFollowup', question: "Mấy việc mình ghi 'định làm tiếp' thì sao rồi?" },
  { id: 'nextSession', question: 'Giờ này mình nên bắt đầu một phiên thế nào?' },
];
export const CATALOG_ORDER = CATALOG.map((c) => c.id);
const QUESTION_OF = Object.fromEntries(CATALOG.map((c) => [c.id, c.question]));

export const STRONG_SIGNALS = new Set(['abandon', 'lateNight', 'goalCalibration', 'neglect']);

// Quan hệ "nối tiếp chủ đề": nếu vừa hỏi X thì các id sau là gợi ý tiếp hợp lý.
export const RELATED = {
  overview: [],
  portrait: ['goldenHour', 'idealLength', 'category', 'overview'],
  longTrend: ['momentum', 'overview'],
  goalRate: ['overview', 'goldenHour', 'idealLength', 'category'],
  todayPace: ['overview', 'streak', 'bestWindow', 'goalCalibration'],
  goldenHour: ['todayPace', 'bestWindow', 'lateNight', 'idealLength', 'nextSession'],
  bestWindow: ['goldenHour', 'todayPace', 'lateNight', 'nextSession'],
  idealLength: ['goldenHour', 'deepWork', 'abandon', 'nextSession'],
  deepWork: ['idealLength', 'goldenHour'],
  abandon: ['idealLength', 'lateNight', 'todayPace'],
  lateNight: ['goldenHour', 'abandon', 'bestWindow'],
  momentum: ['overview', 'weekday', 'streak', 'consistency', 'longTrend'],
  weekday: ['momentum', 'streak'],
  category: ['overview', 'neglect', 'goalRate', 'notesFollowup'],
  neglect: ['category', 'overview'],
  goalCalibration: ['todayPace', 'overview', 'goalRate'],
  streak: ['todayPace', 'weekday', 'momentum'],
  consistency: ['momentum', 'streak', 'overview'],
  notesFollowup: ['category', 'neglect', 'todayPace'],
  nextSession: ['goldenHour', 'bestWindow', 'idealLength', 'todayPace'],
};

// Từ khoá (KHÔNG dấu) để suy "chủ đề vừa hỏi". Thứ tự = ưu tiên match đầu tiên.
export const KEYWORD_MAP = [
  ['lateNight', ['khuya', 'lam dem', 'ban dem', 'toi muon', 'sau 22', 'muon']],
  ['goldenHour', ['gio vang', 'khung gio', 'buoi nao', 'khung nao', 'gio nao manh']],
  ['bestWindow', ['viec kho', 'viec nhe', 'gio nay nen', 'nen lam gi', 'luc nay nen']],
  ['abandon', ['bo giua chung', 'bo phien', 'huy phien', 'bo do']],
  ['idealLength', ['bao nhieu phut', 'do dai', 'dai bao', 'phien dai', 'may phut']],
  ['deepWork', ['phien sau', '45 phut', 'tap trung sau', 'deep']],
  ['todayPace', ['hom nay', 'dung nhip', 'nhip hom nay', 'tien do hom nay']],
  ['streak', ['chuoi', 'streak', 'giu chuoi']],
  ['portrait', ['kieu nguoi', 'nhin chung minh', 'minh la nguoi', 'diem manh', 'hieu minh']],
  ['longTrend', ['may tuan nay', 'dao nay', 'xu huong dai', 'thang truoc', 'dang len khong']],
  ['momentum', ['tuan nay', 'tuan truoc', 'so voi tuan', 'xu huong']],
  ['weekday', ['ngay nao', 'thu may', 'nang suat nhat', 'ngay trong tuan']],
  ['goalCalibration', ['muc tieu ngay', 'muc tieu moi ngay', 'muc tieu hop ly', 'dat muc tieu bao']],
  ['goalRate', ['ti le dat', 'dat muc tieu', 'ty le hoan thanh']],
  ['consistency', ['deu dan', 'theo dot', 'deu khong', 'lien tuc']],
  ['category', ['loai viec', 'loai nao', 'danh thoi gian', 'nhom viec', 'danh muc']],
  ['neglect', ['bo be', 'lau chua', 'bo quen']],
  ['notesFollowup', ['dinh lam tiep', 'ghi chu', 'note', 'viec con do']],
  ['nextSession', ['nen bat dau', 'phien the nao', 'bat dau phien']],
  ['overview', ['tong quan', 'the nao', 'tinh hinh', 'tong the', 'noi chung']],
];

export function stripDiacritics(s) {
  return String(s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D');
}

/** detectSignals — đọc chuỗi buildAnalystContext → Set các tín hiệu user thực sự có. */
export function detectSignals(contextString) {
  const raw = String(contextString ?? '');
  const s = raw.toLowerCase().replace(/\s+/g, ' ');
  const lines = raw.toLowerCase().split('\n').map((l) => l.trim());
  const has = (sub) => s.includes(sub);
  const lineStarts = (p) => lines.some((l) => l.startsWith(p));
  const set = new Set();
  if (!raw.trim() || has('chưa có phiên nào')) return set; // rỗng / chưa có dữ liệu → không gợi ý
  set.add('overview');
  if (lines.some((l) => l.startsWith('tổng quan') && l.includes('đạt mục tiêu'))) set.add('goalRate');
  if (lineStarts('hôm nay:')) set.add('todayPace');
  if (lineStarts('giờ vàng:')) set.add('goldenHour');
  if (lineStarts('độ dài hợp nhất:')) set.add('idealLength');
  if (lines.some((l) => l.startsWith('đều đặn:') && !l.includes('chưa đủ'))) set.add('consistency');
  if (lineStarts('phiên sâu:')) set.add('deepWork');
  if (lineStarts('xu hướng tuần:')) set.add('momentum');
  if (lineStarts('xu hướng dài hạn')) set.add('longTrend');
  if (lineStarts('chân dung của bạn')) set.add('portrait');
  if (lineStarts('loại việc')) set.add('category'); // "Loại việc dành nhiều..." / "Loại việc "X":"
  if (has('hay bỏ giữa chừng vào')) set.add('abandon');
  if (has('phiên làm sau') && has('so với ban ngày')) set.add('lateNight');
  if (has('mục tiêu ngày') && (has('hơi quá sức') || has('hơi nhẹ'))) set.add('goalCalibration');
  if (has('ngày năng suất nhất:')) set.add('weekday');
  if (has('loại bị bỏ bê:')) set.add('neglect');
  if (has('khung giờ vàng còn lại hôm nay:')) set.add('bestWindow');
  if (has('giữ chuỗi:') || set.has('todayPace')) set.add('streak');
  if (has('ghi chú gần đây:')) set.add('notes');
  return set;
}

/** detectTopic — câu hỏi vừa gõ thuộc chủ đề nào (id) hay null. So cả có dấu + bỏ dấu. */
export function detectTopic(text) {
  const t = String(text ?? '').trim();
  if (!t) return null;
  const hay = `${t.toLowerCase()} ${stripDiacritics(t.toLowerCase())}`;
  for (const [id, kws] of KEYWORD_MAP) {
    if (kws.some((k) => hay.includes(k))) return id;
  }
  return null;
}

// Từ khoá QUÁ CHUNG: dùng cho detectTopic (match đơn) nhưng BỎ khi gom askedIds đa-ý,
// để câu gộp nhiều ý không bị 1 từ chung kéo nhầm cả chủ đề.
const LOOSE_KW = new Set(['the nao', 'tinh hinh', 'tong the', 'noi chung', 'muon', 'deu khong', 'note']);

/** detectTopics — TẤT CẢ chủ đề một câu (đa-ý) chạm tới, BỎ từ-khoá quá chung. Mảng id. */
export function detectTopics(text) {
  const t = String(text ?? '').trim();
  if (!t) return [];
  const hay = `${t.toLowerCase()} ${stripDiacritics(t.toLowerCase())}`;
  const ids = [];
  for (const [id, kws] of KEYWORD_MAP) {
    if (kws.some((k) => !LOOSE_KW.has(k) && hay.includes(k))) ids.push(id);
  }
  return ids;
}

// Cổng: id chỉ được gợi ý nếu tín hiệu nền có trong dữ liệu.
export const GATE = {
  overview: () => true,
  portrait: (g) => g.has('portrait'),
  longTrend: (g) => g.has('longTrend'),
  goalRate: (g) => g.has('goalRate'),
  todayPace: (g) => g.has('todayPace'),
  goldenHour: (g) => g.has('goldenHour'),
  bestWindow: (g) => g.has('bestWindow') || g.has('goldenHour'),
  idealLength: (g) => g.has('idealLength'),
  deepWork: (g) => g.has('deepWork'),
  abandon: (g) => g.has('abandon'),
  lateNight: (g) => g.has('lateNight'),
  momentum: (g) => g.has('momentum'),
  weekday: (g) => g.has('weekday'),
  category: (g) => g.has('category'),
  neglect: (g) => g.has('neglect'),
  goalCalibration: (g) => g.has('goalCalibration'),
  streak: (g) => g.has('streak') || g.has('todayPace'),
  consistency: (g) => g.has('consistency'),
  notesFollowup: (g) => g.has('notes'),
  nextSession: (g) => g.has('goldenHour') || g.has('bestWindow') || g.has('idealLength'),
};

const N = CATALOG_ORDER.length;
const priorityBonus = (id) => 0.001 * (N - CATALOG_ORDER.indexOf(id));

/**
 * pickSuggestions — chọn 2-3 câu hỏi gợi ý tiếp theo (tất định, không LLM).
 * @returns {string[]} danh sách câu hỏi (0..3)
 */
export function pickSuggestions({ contextString = '', lastQuestionText = '', askedIds = [], limit = 3 } = {}) {
  const sig = detectSignals(contextString);
  if (sig.size === 0) return []; // chưa có dữ liệu → ẩn phần đề xuất
  const asked = new Set(askedIds || []);
  const lastTopic = detectTopic(lastQuestionText);
  const lowCtx = String(contextString ?? '').toLowerCase();
  const todayUrgent = /hôm nay:[^\n]*(đang chậm|sắp đạt)/.test(lowCtx);

  const scoreOf = (id) => {
    let score = 0;
    if (lastTopic && (RELATED[id] || []).includes(lastTopic)) score += 100;
    if (STRONG_SIGNALS.has(id) || (id === 'todayPace' && todayUrgent)) score += 40;
    if (id !== 'overview' && id !== 'nextSession') score += 10;
    score += priorityBonus(id);
    return score;
  };

  const candidates = CATALOG_ORDER
    .filter((id) => !asked.has(id) && GATE[id](sig))
    .map((id) => ({ id, score: scoreOf(id) }))
    .sort((a, b) => (b.score - a.score) || (CATALOG_ORDER.indexOf(a.id) - CATALOG_ORDER.indexOf(b.id)));

  const chosen = candidates.slice(0, Math.max(1, limit)).map((c) => c.id);

  // Dự phòng cho đủ 2-3 nếu lọc còn quá ít.
  if (chosen.length < 2) {
    for (const id of ['overview', 'nextSession', 'todayPace', 'goldenHour']) {
      if (chosen.length >= 2) break;
      if (!asked.has(id) && GATE[id](sig) && !chosen.includes(id)) chosen.push(id);
    }
  }
  return chosen.map((id) => QUESTION_OF[id]);
}
