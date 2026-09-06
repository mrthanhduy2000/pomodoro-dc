/**
 * relicGrowth.js — DI VẬT TIẾN HOÁ THEO PHIÊN (ADR-070, 2026-09-06). THUẦN.
 * ─────────────────────────────────────────────────────────────────────────────
 * Đóng `TECH_DEBT #96`: `evolveRelic` cũ đòi tinh luyện của kỷ ĐÃ QUA, mà tinh luyện chỉ rơi vào kỷ
 * đang chơi ⇒ 3/3 nút "Tiến hóa" là "Chưa đủ tài nguyên" vĩnh viễn — một thang 1→2→3 vẽ ra một việc
 * không thể làm. Nay di vật lớn lên bằng chính thứ nó đang cộng dồn cho: PHIÊN. Cứ đủ N phiên
 * ≥RELIC_EVOLVE_MIN_MINUTES kể từ lúc nhận (`relic.earnedAt`) là lên một bậc, kể ở chuỗi thẻ thưởng.
 *
 * Cùng một phép đếm cho cả ba nơi: store (lên bậc), màn Di vật (còn bao nhiêu phiên), chuỗi thẻ.
 * ⚠️ Di vật đời cũ không có `earnedAt` ⇒ store đóng dấu lúc nạp (`normalizePersistedGameState`), tức
 * chúng bắt đầu đếm từ ngày cập nhật — không nhảy thẳng lên Huyền Thoại nhờ 500 phiên cũ.
 */
import { ERA_CRISES, RELIC_EVOLUTION, RELIC_EVOLVE_MIN_MINUTES, RELIC_EVOLVE_SESSIONS } from './constants.js';

/**
 * Bản gốc của mỗi di vật (label · icon · description) theo id — đọc từ `ERA_CRISES`, nguồn duy nhất.
 * ⚠️ Save cũ mang một BẢN CHÉP của ba trường này từ lúc nhận; ADR-069 đổi chữ ("tăng tài nguyên rớt" →
 * "tăng EP mỗi phiên") mà bản chép trong save không đổi theo — ảnh 390px (2026-09-06) vẫn in câu cũ.
 * Buff thì store đã đọc từ `RELIC_EVOLUTION[id].stages[stage]` nên không trôi; chữ phải đi cùng đường.
 */
const CANONICAL_RELIC = Object.fromEntries(
  Object.values(ERA_CRISES)
    .map((c) => c?.challengeOption?.successRelic)
    .filter((r) => r?.id)
    .map((r) => [r.id, r]),
);

/** Trả về di vật với label/icon/description lấy từ bảng (giữ mọi trường khác, kể cả `earnedAt`). */
export function withCanonicalRelicText(relic) {
  const def = CANONICAL_RELIC[relic?.id];
  if (!def) return relic;
  return { ...relic, label: def.label, icon: def.icon, description: def.description, buff: def.buff };
}
import { isCancelledHistoryEntry } from './gameMath.js';
import { entryTimestampMs } from './rankLadder.js';

/** Ngưỡng phiên của từng bậc, sau hệ số kỳ quan (làm tròn LÊN — nhanh hơn 30% không được thành 0). */
export function relicStageThresholds(factor = 1) {
  const f = Number.isFinite(factor) && factor > 0 ? factor : 1;
  return RELIC_EVOLVE_SESSIONS.map((n, i) => (i === 0 ? 0 : Math.max(1, Math.ceil(n * f))));
}

/** Đếm phiên hoàn thành, đủ dài, xảy ra SAU `sinceMs` (nghiêm ngặt — phiên nhận di vật không tính). */
export function countSessionsSince(history = [], sinceMs = 0, { minMinutes = RELIC_EVOLVE_MIN_MINUTES } = {}) {
  let n = 0;
  for (const entry of history ?? []) {
    if (!entry || isCancelledHistoryEntry(entry) || entry.completed === false) continue;
    if ((Number(entry.minutes) || 0) < minMinutes) continue;
    const t = entryTimestampMs(entry);
    if (t === null || !(t > sinceMs)) continue;
    n += 1;
  }
  return n;
}

function earnedMs(relic) {
  const raw = relic?.earnedAt;
  if (raw === undefined || raw === null) return null;
  const t = typeof raw === 'number' ? raw : Date.parse(raw);
  return Number.isFinite(t) ? t : null;
}

/** Bậc mà một số phiên đã đủ để chạm (0..maxStage). */
export function stageForSessions(sessions, thresholds) {
  let stage = 0;
  for (let i = 1; i < thresholds.length; i += 1) if (sessions >= thresholds[i]) stage = i;
  return stage;
}

/**
 * Kể về một di vật: bậc đang ở, đã đếm bao nhiêu phiên, còn bao nhiêu nữa lên bậc kế.
 * `stage` là bậc ĐÃ GHI trong store (không tự suy — bậc chỉ đổi ở `completeFocusSession`).
 */
export function describeRelicGrowth({ relic, stage = 0, history = [], factor = 1 } = {}) {
  const evo = RELIC_EVOLUTION[relic?.id];
  const maxStage = evo ? evo.stages.length - 1 : 0;
  const cur = Math.max(0, Math.min(maxStage, Math.floor(stage) || 0));
  const thresholds = relicStageThresholds(factor);
  const since = earnedMs(relic);
  const sessions = since === null ? 0 : countSessionsSince(history, since);
  const isMax = cur >= maxStage;
  const nextAt = isMax ? null : thresholds[cur + 1];
  const remaining = isMax ? 0 : Math.max(0, nextAt - sessions);
  const prevAt = thresholds[cur] ?? 0;
  const pct = isMax ? 1 : Math.max(0, Math.min(1, (sessions - prevAt) / Math.max(1, nextAt - prevAt)));
  return {
    id: relic?.id ?? null,
    stage: cur,
    maxStage,
    isMax,
    stageLabel: evo?.stages[cur]?.label ?? '',
    nextStageLabel: isMax ? null : (evo?.stages[cur + 1]?.label ?? ''),
    sessions,
    nextAt,
    remaining,
    pct,
    counting: since !== null,
  };
}

/**
 * Sau một phiên: di vật nào vừa đủ phiên để lên bậc? Trả về danh sách `{ id, from, to }`.
 * Có thể nhảy nhiều bậc một lần (bảng lịch sử dài) — `to` là bậc cao nhất đã đủ.
 */
export function evaluateRelicEvolutions({ relics = [], relicEvolutions = {}, history = [], factor = 1 } = {}) {
  const thresholds = relicStageThresholds(factor);
  const out = [];
  for (const relic of relics ?? []) {
    const evo = RELIC_EVOLUTION[relic?.id];
    if (!evo) continue;
    const from = Math.max(0, Math.min(evo.stages.length - 1, Math.floor(relicEvolutions?.[relic.id] ?? 0)));
    const since = earnedMs(relic);
    if (since === null) continue;
    const to = Math.min(evo.stages.length - 1, stageForSessions(countSessionsSince(history, since), thresholds));
    if (to > from) out.push({ id: relic.id, from, to });
  }
  return out;
}

/** Áp danh sách lên bậc vào bản đồ `relicEvolutions` (không đụng bản cũ). */
export function applyRelicEvolutions(relicEvolutions = {}, grown = []) {
  if (!grown.length) return relicEvolutions ?? {};
  const next = { ...(relicEvolutions ?? {}) };
  for (const g of grown) next[g.id] = g.to;
  return next;
}
