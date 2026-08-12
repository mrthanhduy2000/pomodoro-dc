/**
 * cityArchive.js — Kho lưu trữ thành phố của các kỷ đã đi qua ("bảo tàng").
 *
 * THUẦN tuyệt đối: không `Date`, không `Math.random`, không phụ thuộc store/React.
 * Mọi thông tin thời gian (`sealedAt`) phải do phía gọi truyền vào qua `sealContext`.
 *
 * BỐI CẢNH: khi lên kỷ mới, `pruneEraScopedBlueprintState` (gameStore) CẮT BỎ toàn bộ công trình
 * của kỷ cũ khỏi state đang chơi — đó là luật cân bằng game, KHÔNG được đổi. File này chỉ làm một
 * việc: GHI LẠI thứ vừa bị cắt trước khi nó biến mất, để Đàm ghé thăm lại sau này.
 *
 * Hình dạng dữ liệu:
 *   {
 *     [eraNumber 1..15]: {
 *       built:        string[],            // bpId đã xây trong kỷ đó
 *       levels:       { [bpId]: 1|2|3 },   // cấp công trình lúc niêm phong
 *       sealedAt:     'YYYY-MM-DD',        // ngày VN niêm phong
 *       epAtSeal:     number,              // tổng EP tại thời điểm niêm phong
 *       sessionCount: number,              // số phiên đã làm trong kỷ đó
 *     }
 *   }
 *
 * ⚠️ `sessionCount` BẮT BUỘC phải chụp lại lúc niêm phong: `eraTracking` trong store chỉ giữ số
 * liệu của kỷ ĐANG chơi (`sessionsInCurrentEra`), không có lịch sử theo từng kỷ. Bỏ sót trường này
 * thì mọi thành phố cũ đều trơ trụi như nhau vì `computeCityLayout` không còn nguồn nào để biết
 * mật độ cảnh vật.
 */

import { BLUEPRINT_META, BUILDING_EFFECTS, ERA_METADATA } from './constants';

const MIN_ERA = 1;
const MAX_ERA = 15;

function isRecord(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Kỷ của một bản vẽ — giống hệt `getEraScopedBlueprintEra` trong gameStore, giữ 2 nguồn tra cứu. */
function getBlueprintEra(bpId) {
  const era = BLUEPRINT_META[bpId]?.era ?? BUILDING_EFFECTS[bpId]?.era;
  return Number.isFinite(era) ? era : null;
}

function isValidEra(era) {
  return Number.isInteger(era) && era >= MIN_ERA && era <= MAX_ERA;
}

function normalizeLevel(value) {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(3, Math.floor(value)));
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : 0;
}

/**
 * Gộp các công trình vừa bị cắt vào bảo tàng.
 *
 * @param {object|undefined} prevArchive   bảo tàng hiện có
 * @param {string[]} removedIds            id bị `pruneEraScopedBlueprintState` cắt bỏ
 * @param {Record<string, number>} buildingLevels  cấp công trình TRƯỚC khi cắt
 * @param {{epAtSeal:number, sealedAt:string, sessionCount:number}} sealContext
 * @returns {object} bảo tàng mới
 *
 * Idempotent: gọi lại với cùng đầu vào cho cùng kết quả.
 * `removedIds` rỗng → trả về CHÍNH `prevArchive` (không tạo object mới, để React/Zustand nhận ra
 * "không có gì đổi").
 */
export function mergeCityArchive(prevArchive, removedIds, buildingLevels, sealContext) {
  const base = isRecord(prevArchive) ? prevArchive : {};
  if (!Array.isArray(removedIds) || removedIds.length === 0) return base;

  const levels = isRecord(buildingLevels) ? buildingLevels : {};
  const seal = isRecord(sealContext) ? sealContext : {};
  const sealedAt = typeof seal.sealedAt === 'string' ? seal.sealedAt : null;
  const epAtSeal = safeNumber(seal.epAtSeal);
  const sessionCount = safeNumber(seal.sessionCount);

  // Một phiên hiếm hoi có thể nhảy nhiều kỷ cùng lúc → nhóm id theo kỷ trước khi ghi.
  const byEra = new Map();
  for (const bpId of removedIds) {
    const era = getBlueprintEra(bpId);
    if (!isValidEra(era)) continue;                 // id lạ/hỏng → bỏ qua, không ném lỗi
    if (!byEra.has(era)) byEra.set(era, []);
    byEra.get(era).push(bpId);
  }
  if (byEra.size === 0) return base;

  const next = { ...base };
  for (const [era, ids] of byEra) {
    const existing = isRecord(next[era]) ? next[era] : null;
    const existingBuilt = Array.isArray(existing?.built) ? existing.built : [];

    // Gộp, giữ thứ tự cũ trước — niêm phong lại một kỷ KHÔNG được làm mất công trình đã ghi.
    const merged = [...existingBuilt];
    for (const bpId of ids) {
      if (!merged.includes(bpId)) merged.push(bpId);
    }

    const mergedLevels = { ...(isRecord(existing?.levels) ? existing.levels : {}) };
    for (const bpId of ids) {
      mergedLevels[bpId] = normalizeLevel(levels[bpId]);
    }

    next[era] = {
      built:        merged,
      levels:       mergedLevels,
      sealedAt:     sealedAt ?? existing?.sealedAt ?? null,
      epAtSeal:     sealedAt ? epAtSeal : safeNumber(existing?.epAtSeal),
      sessionCount: Math.max(sessionCount, safeNumber(existing?.sessionCount)),
    };
  }

  return next;
}

/**
 * Chuẩn hoá dữ liệu bảo tàng đọc từ localStorage/Supabase/file import.
 * Entry hỏng hoặc thiếu trường bắt buộc → BỎ QUA, tuyệt đối không ném lỗi (đây là đường nạp
 * load-bearing, một bản ghi hỏng không được phép làm chết cả app).
 */
export function normalizeCityArchive(raw) {
  if (!isRecord(raw)) return {};

  const clean = {};
  for (const [eraKey, entry] of Object.entries(raw)) {
    const era = Number(eraKey);
    if (!isValidEra(era)) continue;
    if (!isRecord(entry)) continue;

    const built = Array.isArray(entry.built)
      ? entry.built.filter((bpId) => typeof bpId === 'string' && bpId.length > 0)
      : [];
    if (built.length === 0) continue;               // thành phố rỗng thì không đáng lưu

    const rawLevels = isRecord(entry.levels) ? entry.levels : {};
    const levels = {};
    for (const bpId of built) {
      if (Number.isFinite(rawLevels[bpId])) levels[bpId] = normalizeLevel(rawLevels[bpId]);
    }

    clean[era] = {
      built,
      levels,
      sealedAt:     typeof entry.sealedAt === 'string' ? entry.sealedAt : null,
      epAtSeal:     safeNumber(entry.epAtSeal),
      sessionCount: safeNumber(entry.sessionCount),
    };
  }

  return clean;
}

/**
 * Danh sách kỷ có thể ghé thăm trong bảo tàng, sắp xếp tăng dần theo số kỷ.
 *
 * @param {object} cityArchive
 * @param {number} currentEra  kỷ Đàm đang chơi
 * @returns {Array<{era, label, built, levels, sealedAt, epAtSeal, sessionCount, isCurrent, isLost}>}
 *
 * `isLost = true` khi kỷ đó nằm trong quá khứ nhưng KHÔNG có bản ghi — tức thành phố đã đi qua
 * trước khi bảo tàng được dựng (2026-08-12). Đây là trạng thái rỗng CÓ CHỦ Ý ("Thành phố thất
 * truyền"), không phải bug.
 */
export function listVisitableEras(cityArchive, currentEra) {
  const archive = isRecord(cityArchive) ? cityArchive : {};
  const current = isValidEra(currentEra) ? currentEra : MIN_ERA;

  const eras = new Set();
  for (let era = MIN_ERA; era <= current; era += 1) eras.add(era);
  for (const eraKey of Object.keys(archive)) {
    const era = Number(eraKey);
    if (isValidEra(era)) eras.add(era);            // phòng dữ liệu lệch: kỷ tương lai vẫn hiện ra
  }

  return [...eras]
    .sort((a, b) => a - b)
    .map((era) => {
      const entry = isRecord(archive[era]) ? archive[era] : null;
      const built = Array.isArray(entry?.built) ? entry.built : [];
      return {
        era,
        label:        ERA_METADATA[era]?.label ?? `Kỷ ${era}`,
        built,
        levels:       isRecord(entry?.levels) ? entry.levels : {},
        sealedAt:     entry?.sealedAt ?? null,
        epAtSeal:     safeNumber(entry?.epAtSeal),
        sessionCount: safeNumber(entry?.sessionCount),
        isCurrent:    era === current,
        isLost:       era < current && built.length === 0,
      };
    });
}
