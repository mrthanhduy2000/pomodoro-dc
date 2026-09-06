/**
 * buildChoices.test.js — luật của màn Công trình sau ADR-069 ("đồng tiền duy nhất là PHIÊN").
 */
import test from 'node:test';
import assert from 'node:assert/strict';

import { BLUEPRINT_CATALOG, BLUEPRINT_META, CRAFT_QUEUE_SLOTS, LEGACY_QUEUE_SLOTS } from './constants.js';
import {
  describeProject,
  describeQueue,
  eraBuildProgress,
  legacySlotState,
  listNextProjects,
  listRestorationChoices,
  projectPerkLine,
  slotState,
} from './buildChoices.js';

const ids = (era) => BLUEPRINT_CATALOG[era].map((bp) => bp.id);

test('describeProject đọc tên ở `label`, số phiên ở BLUEPRINT_META, và trả null cho id lạ', () => {
  const [bpId] = ids(8);
  const p = describeProject(bpId);
  assert.equal(p.label, BLUEPRINT_CATALOG[8][0].label);
  assert.equal(p.sessions, BLUEPRINT_META[bpId].sessionsToComplete, 'số phiên phải là con số đi vào hàng chờ');
  assert.equal(p.era, 8);
  assert.equal(describeProject('bp_khong_ton_tai'), null);
});

test('listNextProjects: chưa xây · chưa vào hàng chờ · xếp rẻ-phiên trước (phổ thông → hiếm → sử thi)', () => {
  const all = ids(8);
  const chon = listNextProjects({ activeBook: 8, buildings: [all[4]], craftingQueue: [{ bpId: all[0], sessionsRemaining: 2 }] });
  const conLai = chon.map((p) => p.bpId);
  assert.ok(!conLai.includes(all[4]), 'đã xây thì không mời');
  assert.ok(!conLai.includes(all[0]), 'đang xây thì không mời');
  assert.equal(conLai.length, all.length - 2);
  const rar = chon.map((p) => ['common', 'rare', 'epic'].indexOf(p.rarity));
  assert.deepEqual(rar, [...rar].sort((a, b) => a - b), 'phải xếp theo độ hiếm tăng dần');
  // Gác chạy-rỗng: kỷ 8 thật sự có đủ ba độ hiếm, nếu không phép sắp xếp không được kiểm gì.
  assert.ok(new Set(BLUEPRINT_CATALOG[8].map((bp) => bp.rarity)).size >= 2);
});

test('slotState đếm ô của KỶ ĐANG CHƠI — di sản có ô riêng', () => {
  const [ky7] = ids(7);
  const [ky5] = ids(5);
  const queue = [{ bpId: ky5, sessionsRemaining: 1 }, { bpId: ky7, sessionsRemaining: 1 }];
  assert.deepEqual(slotState({ craftingQueue: queue, activeBook: 7 }), { used: 1, total: CRAFT_QUEUE_SLOTS, free: CRAFT_QUEUE_SLOTS - 1 });
  assert.deepEqual(legacySlotState({ craftingQueue: queue, activeBook: 7 }), { used: 1, total: LEGACY_QUEUE_SLOTS, free: LEGACY_QUEUE_SLOTS - 1 });
  assert.equal(slotState({ craftingQueue: [], activeBook: 7 }).free, CRAFT_QUEUE_SLOTS);
});

test('describeQueue kể tiến độ qua CÙNG công thức với giàn giáo, và đánh dấu di sản', () => {
  const [ky7] = ids(7);
  const [ky5] = ids(5);
  const total7 = BLUEPRINT_META[ky7].sessionsToComplete;
  const q = describeQueue({ craftingQueue: [{ bpId: ky7, sessionsRemaining: total7 - 1 }, { bpId: ky5, sessionsRemaining: 1 }], activeBook: 7 });
  assert.equal(q.length, 2);
  assert.equal(q[0].done, 1);
  assert.equal(q[0].total, total7);
  assert.equal(q[0].restoration, false);
  assert.equal(q[1].restoration, true, 'công trình kỷ 5 khi đang ở kỷ 7 là di sản');
  // Mục lạ biến mất thay vì làm hỏng cả danh sách.
  assert.equal(describeQueue({ craftingQueue: [{ bpId: 'bp_la', sessionsRemaining: 1 }], activeBook: 7 }).length, 0);
});

test('eraBuildProgress lấy mẫu số từ catalog, KHÔNG viết cứng, và chỉ đếm công trình ĐÚNG KỶ', () => {
  const all = ids(3);
  const khac = ids(2)[0];
  const p = eraBuildProgress({ activeBook: 3, buildings: [all[0], all[1], khac] });
  assert.equal(p.total, all.length);
  assert.equal(p.built, 2, 'công trình kỷ khác không được đếm vào kỷ này');
  assert.equal(p.complete, false);
  assert.equal(eraBuildProgress({ activeBook: 3, buildings: all }).complete, true);
});

test('listRestorationChoices: kỷ gần trọn vẹn nhất lên đầu, cắt còn `limit`', () => {
  const ids5 = ids(5);
  const ids6 = ids(6);
  // ⚠️ MỌI kỷ trước kỷ đang chơi đều được xét (kỷ không có mục lưu trữ = chưa xây gì), nên bốn kỷ
  // đầu phải khai đủ để bài này chỉ đo đúng hai kỷ đang thử.
  const archive = {
    1: { built: ids(1) }, 2: { built: ids(2) }, 3: { built: ids(3) }, 4: { built: ids(4) },
    5: { built: ids5.slice(0, ids5.length - 1) }, // thiếu đúng 1
    6: { built: [] },                             // thiếu tất cả
  };
  const r = listRestorationChoices({ activeBook: 7, cityArchive: archive, craftingQueue: [], limit: 3 });
  assert.equal(r.total, 1 + ids6.length);
  assert.equal(r.choices.length, 3);
  assert.equal(r.choices[0].era, 5, 'kỷ chỉ còn thiếu một công trình phải đứng đầu');
  assert.equal(listRestorationChoices({ activeBook: 1, cityArchive: {}, craftingQueue: [] }).total, 0, 'kỷ 1 không có di sản');
});

test('projectPerkLine: có đặc quyền thì kể đặc quyền, không có thì kể chuyện bản vẽ', () => {
  const coPerk = { perk: { label: 'Rương phiên dài', summary: 'Phiên từ 60 phút tặng 140 XP.' }, description: 'x' };
  assert.equal(projectPerkLine(coPerk), 'Rương phiên dài — Phiên từ 60 phút tặng 140 XP.');
  assert.equal(projectPerkLine({ perk: null, description: 'Chuyện.' }), 'Chuyện.');
  assert.equal(projectPerkLine(null), '');
});
