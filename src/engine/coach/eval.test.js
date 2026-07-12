/**
 * coachEval.test.js — BỘ CHẤM ĐIỂM lưới chống-bịa (tài sản quý nhất của Coach).
 *
 * Đưa ~30 câu mẫu (sạch + cố tình bịa) qua TOÀN BỘ lưới guard tất định rồi đo:
 *   - tỉ lệ BẮT (recall): trong các câu bịa, lưới chặn được bao nhiêu %.
 *   - tỉ lệ BÁO NHẦM (false positive): trong các câu sạch, lưới chặn nhầm bao nhiêu %.
 *
 * NGƯỠNG:
 *   - BÁO NHẦM phải = 0. Báo nhầm = xoá oan câu thật → hỏng niềm tin; siết chặt hướng này.
 *   - BẮT phải ≥ 90%. Sót một ít chấp nhận được (còn 3 lượt model + cứu-câu lo phần đuôi),
 *     nhưng tụt nhiều = lưới bị nới tay → phải xem lại.
 *
 * In ra một dòng tóm tắt điểm số để Đàm thấy "lưới đang khoẻ tới đâu" mỗi lần chạy test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  hasFabricatedNumbers, findMismatchedPairs, findFabricatedFractions, hasForeignScript,
} from './guard.js';
import { EVAL_CONTEXT, CLEAN_CASES, FABRICATION_CASES, FOREIGN_CASES } from './coachEvalFixtures.js';

// "Bị lưới chặn" = đúng tổ hợp guard mà CoachChat/CoachOffline dùng ở tuyến chót.
function isFlagged(answer, ctx) {
  return hasFabricatedNumbers(answer, ctx)
    || findMismatchedPairs(answer, ctx).length > 0
    || findFabricatedFractions(answer, ctx).length > 0;
}

const cleanFlagged = CLEAN_CASES.filter((c) => isFlagged(c.answer, EVAL_CONTEXT));
const fabFlagged = FABRICATION_CASES.filter((c) => isFlagged(c.answer, EVAL_CONTEXT));
const recall = fabFlagged.length / FABRICATION_CASES.length;
const fpr = cleanFlagged.length / CLEAN_CASES.length;

test('[điểm số] in tóm tắt chống-bịa', () => {
  const pct = (x) => `${Math.round(x * 1000) / 10}%`;
  console.log(
    `\n[coach-eval] lưới chống-bịa: BẮT ${fabFlagged.length}/${FABRICATION_CASES.length} (${pct(recall)}) · ` +
    `BÁO NHẦM ${cleanFlagged.length}/${CLEAN_CASES.length} (${pct(fpr)})\n`,
  );
  assert.ok(true);
});

test('BÁO NHẦM phải = 0 (không xoá oan câu thật)', () => {
  assert.deepEqual(
    cleanFlagged.map((c) => c.name),
    [],
    `Lưới báo nhầm các câu SẠCH sau (đang xoá oan câu thật): ${cleanFlagged.map((c) => c.name).join('; ')}`,
  );
});

test('Tỉ lệ BẮT câu bịa phải ≥ 90%', () => {
  const missed = FABRICATION_CASES.filter((c) => !isFlagged(c.answer, EVAL_CONTEXT));
  assert.ok(
    recall >= 0.9,
    `Tỉ lệ bắt tụt còn ${Math.round(recall * 100)}% (< 90%). Câu bịa LỌT lưới: ${missed.map((c) => c.name).join('; ')}`,
  );
});

test('hasForeignScript: bắt đúng chữ nước ngoài, không báo nhầm câu Việt', () => {
  for (const c of FOREIGN_CASES) {
    assert.equal(
      hasForeignScript(c.answer), c.foreign,
      `hasForeignScript sai ở ca "${c.name}" (mong đợi ${c.foreign})`,
    );
  }
});
