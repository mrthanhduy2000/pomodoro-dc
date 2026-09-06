/**
 * rankLadder.js — BẬC DANH XƯNG TỰ THĂNG, và THỬ THÁCH KỶ NGUYÊN không còn chặn, không còn phạt
 * (2026-09-06, ADR-069).
 *
 * VÌ SAO. Trước vòng này, lên bậc là một nghi thức bốn bước: đủ EP → bấm "Bắt đầu thử thách" →
 * làm N phiên ≥M phút trong 48 giờ → nếu trễ thì **mất 5% tài nguyên** kèm một hộp thoại đỏ. Khủng
 * hoảng kỷ nguyên còn nặng tay hơn: nó **chặn nút Bắt đầu** cho tới khi Đàm chọn giữa hiến tế 40%
 * tài nguyên hay một thử thách có hạn; trễ hạn thì phạt tiếp 20%. Hai hệ ấy là hai bộ luật riêng,
 * hai hộp thoại riêng, hai chỗ để trễ hạn — và cả hai đều trả lời cùng một câu: *"gần đây anh có
 * làm được vài phiên tử tế không?"*
 *
 * LUẬT MỚI: câu ấy được hỏi THẲNG VÀO LỊCH SỬ, sau mỗi phiên, không cần ai bấm gì.
 *   · Bậc: đủ EP gác + đủ N phiên ≥M phút trong `windowHours` giờ gần nhất ⇒ thăng bậc ngay
 *     trong chuỗi thẻ thưởng. Không có hạn, không có phạt: chưa đủ thì cứ đợi phiên sau.
 *   · Khủng hoảng kỷ: khi EP chạm mốc, nó thành một NHIỆM VỤ MỀM (cùng công thức đếm), xong thì
 *     nhận di vật; chưa xong thì không mất gì. Nút Bắt đầu không bao giờ bị khoá vì nó nữa.
 *
 * ⚠️ MỘT LUẬT MỘT CÔNG THỨC: `countQualifyingSessions` là công thức DUY NHẤT đếm "phiên đủ dài
 * trong cửa sổ gần đây" — bậc, khủng hoảng, và màn Tiến trình đều đọc nó. Cách đọc mốc thời gian
 * (`timestamp ?? finishedAt ?? startedAt`) và cách nhận ra phiên đã huỷ khớp với store
 * (`getHistoryEntryTimestampMs` / `isCancelledHistoryEntry`), vì lịch sử là của store.
 *
 * THUẦN: không đọc store, không đọc `Date` (nhận `now`), không DOM.
 */
import { ERA_THRESHOLDS, RANK_SYSTEM, RANK_XP_RATIOS } from './constants.js';
import { isCancelledHistoryEntry } from './gameMath.js';

const HOUR_MS = 3_600_000;

function entryTimestampMs(entry) {
  const raw = entry?.timestamp ?? entry?.finishedAt ?? entry?.startedAt;
  const t = typeof raw === 'string' ? new Date(raw).getTime() : Number(raw);
  return Number.isFinite(t) ? t : null;
}

/** Khoảng EP của một kỷ: bắt đầu ở cuối kỷ trước, kết thúc ở cuối kỷ này. */
export function eraEpRange(bookNumber) {
  const start = ERA_THRESHOLDS[`ERA_${bookNumber - 1}_END`] ?? 0;
  const end = ERA_THRESHOLDS[`ERA_${bookNumber}_END`] ?? ERA_THRESHOLDS.ERA_15_END;
  return { start, end, gap: Math.max(1, end - start) };
}

/**
 * Đếm phiên HOÀN THÀNH dài ít nhất `minMinutes` trong `windowHours` giờ tính ngược từ `now`.
 * Phiên huỷ và phiên `completed === false` không tính; mốc thời gian đọc không được cũng không tính.
 */
export function countQualifyingSessions(history = [], { minMinutes = 0, windowHours = 48, now = 0 } = {}) {
  const since = now - (Math.max(0, windowHours) * HOUR_MS);
  let count = 0;
  for (const entry of Array.isArray(history) ? history : []) {
    if (!entry || isCancelledHistoryEntry(entry) || entry.completed === false) continue;
    const t = entryTimestampMs(entry);
    if (t === null || t < since || t > now) continue;
    if ((Number(entry.minutes) || 0) >= minMinutes) count += 1;
  }
  return count;
}

/**
 * Bậc hiện tại + bậc kế + hai điều kiện để lên — cho cả store (quyết thăng) lẫn màn hình (kể).
 *
 * @returns {{
 *   current: object|null, next: object|null, isMax: boolean,
 *   epInEra: number, epRequired: number, epGateMet: boolean,
 *   sessionsDone: number, sessionsRequired: number, minMinutes: number, windowHours: number,
 *   sessionsMet: boolean, ready: boolean,
 * }}
 */
export function describeRankStep({ bookNumber = 1, rankIdx = 0, totalEP = 0, history = [], now = 0 } = {}) {
  const ranks = RANK_SYSTEM[bookNumber]?.ranks ?? [];
  const idx = Math.max(0, Math.min(ranks.length - 1, Math.floor(rankIdx) || 0));
  const current = ranks[idx] ?? null;
  const next = ranks[idx + 1] ?? null;
  const { start, gap } = eraEpRange(bookNumber);
  const epInEra = Math.max(0, totalEP - start);
  const epRequired = next ? Math.floor(gap * (RANK_XP_RATIOS[idx + 1] ?? 1)) : 0;
  const epGateMet = Boolean(next) && epInEra >= epRequired;
  const req = next?.challengeRequirement ?? null;
  const sessionsRequired = req?.sessions ?? 0;
  const minMinutes = req?.minMinutes ?? 0;
  const windowHours = req?.windowHours ?? 48;
  const sessionsDone = req
    ? Math.min(sessionsRequired, countQualifyingSessions(history, { minMinutes, windowHours, now }))
    : 0;
  const sessionsMet = !req || sessionsDone >= sessionsRequired;
  return {
    current,
    next,
    isMax: !next,
    epInEra,
    epRequired,
    epGateMet,
    sessionsDone,
    sessionsRequired,
    minMinutes,
    windowHours,
    sessionsMet,
    ready: Boolean(next) && epGateMet && sessionsMet,
  };
}

/**
 * Có lên bậc sau phiên này không? MỖI PHIÊN NHIỀU NHẤT MỘT BẬC — lên hai bậc một lúc thì lễ mừng
 * bậc thứ nhất bị nuốt, và cái nhịp "mỗi phiên một tin vui" mới là thứ đáng giữ.
 */
export function evaluateRankPromotion(input = {}) {
  const step = describeRankStep(input);
  if (!step.ready || !step.next) return { promoted: false, targetIdx: null, rank: null };
  const targetIdx = Math.max(0, Math.floor(input.rankIdx) || 0) + 1;
  return { promoted: true, targetIdx, rank: step.next };
}

/**
 * Thử thách kỷ nguyên (khủng hoảng cũ) dưới dạng NHIỆM VỤ MỀM: đủ phiên trong cửa sổ ⇒ qua, nhận
 * di vật. Không có hạn ⇒ không có "trễ". Trạng thái cũ còn `choiceMade: null` hay có `deadline`
 * được đọc y như một nhiệm vụ đang mở — không ai bị phạt vì dữ liệu đời trước.
 */
export function describeCrisisQuest({ eraCrisis = null, history = [], now = 0 } = {}) {
  if (!eraCrisis?.active) return null;
  const option = eraCrisis.challengeOption ?? {};
  const sessionsRequired = Math.max(1, Math.floor(eraCrisis.challengeSessionsRequired ?? option.sessions ?? 1));
  const minMinutes = Math.max(0, Math.floor(eraCrisis.challengeMinMinutes ?? option.minMinutes ?? 0));
  const windowHours = Math.max(1, Math.floor(option.windowHours ?? 48));
  const sessionsDone = Math.min(
    sessionsRequired,
    countQualifyingSessions(history, { minMinutes, windowHours, now }),
  );
  return {
    id: eraCrisis.crisisId ?? null,
    name: eraCrisis.name ?? 'Thử thách kỷ nguyên',
    icon: eraCrisis.icon ?? '⚔️',
    description: eraCrisis.description ?? '',
    relic: option.successRelic ?? null,
    sessionsDone,
    sessionsRequired,
    minMinutes,
    windowHours,
    passed: sessionsDone >= sessionsRequired,
  };
}

/** Bản ghi khủng hoảng mới: tự vào chế độ nhiệm vụ mềm, KHÔNG deadline. */
export function openCrisisQuest(crisisState) {
  if (!crisisState) return crisisState;
  return { ...crisisState, choiceMade: 'challenge', challengeDeadline: null };
}

/** Kết thúc nhiệm vụ mềm sau khi qua: tắt, đánh dấu qua, ghi di vật. */
export function settleCrisisQuest(crisisState, quest) {
  if (!crisisState || !quest?.passed) return crisisState;
  return {
    ...crisisState,
    active: false,
    passed: true,
    choiceMade: 'challenge',
    challengeDeadline: null,
    challengeSessionsDone: quest.sessionsDone,
    relicEarned: quest.relic ?? null,
  };
}
