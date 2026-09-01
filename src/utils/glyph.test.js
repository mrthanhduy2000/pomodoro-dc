/**
 * glyph.test.js — canh lời hứa "513 biểu tượng đã vẽ tay phải LÊN ĐƯỢC màn hình".
 *
 * Vì sao cần: dữ liệu có `icon`, giao diện có `getGlyph`, nhưng giữa hai đầu ấy không có gì
 * đỏ lên nếu một bảng nào đó ship thiếu biểu tượng, hoặc nếu ai đó lại nối `getLabelMark`
 * thẳng vào một màn sưu tập. Ba bài dưới đây hỏi CẢ HAI ĐẦU: bảng dữ liệu có đủ không, và
 * nơi gọi có hỏi đúng hàm không.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { getGlyph, hasGlyphIcon, getLabelMark } from './labelMark.js';
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_TIERS,
  ACHIEVEMENT_CATEGORIES,
  BLUEPRINT_CATALOG,
  DEFAULT_SESSION_CATEGORIES,
  ERA_CRISES,
  SKILL_SYNERGIES,
  SKILL_TREE,
} from '../engine/constants.js';

// THỬ-CHO-ĐỎ: đổi `glyph || getLabelMark(...)` thành `glyph ?? getLabelMark(...)` ⇒ bài 1 đỏ
// (loại việc Đàm tự tạo ghi `icon: ''`, và `?? ` sẽ trả về chuỗi rỗng ⇒ ô trắng).
test('getGlyph: có biểu tượng thì dùng, chuỗi rỗng phải rơi về ký hiệu tắt', () => {
  assert.equal(getGlyph('🔥', 'Khởi Đầu Bùng Cháy', 'DG'), '🔥');
  assert.equal(getGlyph('', 'Khởi Đầu Bùng Cháy', 'DG'), 'KĐ');
  assert.equal(getGlyph('   ', 'Khởi Đầu Bùng Cháy', 'DG'), 'KĐ');
  assert.equal(getGlyph(undefined, 'Khởi Đầu Bùng Cháy', 'DG'), 'KĐ');
  // ⚠️ Không phải 'DG'. `getLabelMark` chạy phép lấy chữ đầu LÊN CHÍNH chuỗi rơi về, nên
  // 'DG' (một từ) ra 'D'. Đó là hành vi có từ trước, `getGlyph` cố ý KHÔNG sửa — sửa ở đây là
  // đổi hành vi của mọi nơi gọi cũ trong một task chỉ nói về biểu tượng.
  assert.equal(getGlyph(null, null, 'DG'), 'D');
  assert.equal(getGlyph(null, null, 'DG'), getLabelMark(null, 'DG'));
  // Rơi về đúng hành vi CŨ — đây là phép cộng thêm thuần, không đổi gì ở đường rơi về.
  assert.equal(getGlyph('', 'Vua Cuối Tuần', 'TT'), getLabelMark('Vua Cuối Tuần', 'TT'));

  assert.equal(hasGlyphIcon('🔥'), true);
  assert.equal(hasGlyphIcon(''), false);
  assert.equal(hasGlyphIcon('  '), false);
  assert.equal(hasGlyphIcon(undefined), false);
});

// THỬ-CHO-ĐỎ: xoá `icon: '🥉'` khỏi ACHIEVEMENT_TIERS.bronze ⇒ bài 2 đỏ, kể đích danh bảng nào.
test('mọi bảng sưu tập phải khai ĐỦ biểu tượng — không bảng nào được bỏ trống', () => {
  const bang = {
    'Thành tích': ACHIEVEMENTS,
    'Hạng thành tích': Object.values(ACHIEVEMENT_TIERS),
    'Nhóm thành tích': Object.values(ACHIEVEMENT_CATEGORIES),
    'Bản vẽ công trình': Object.values(BLUEPRINT_CATALOG).flat(),
    'Loại việc mặc định': DEFAULT_SESSION_CATEGORIES,
    'Di vật': Object.values(ERA_CRISES).map((c) => c.challengeOption.successRelic),
    'Cộng hưởng': Object.values(SKILL_SYNERGIES),
    'Nút kỹ năng': Object.values(SKILL_TREE).flatMap((b) => b.nodes),
  };

  let tong = 0;
  for (const [ten, muc] of Object.entries(bang)) {
    assert.ok(muc.length > 0, `bảng "${ten}" rỗng — phép đo đang chạy rỗng`);
    const thieu = muc.filter((m) => !hasGlyphIcon(m?.icon));
    assert.equal(
      thieu.length, 0,
      `bảng "${ten}" có ${thieu.length}/${muc.length} mục thiếu biểu tượng: ${thieu.slice(0, 3).map((m) => m?.label ?? m?.id).join(', ')}`,
    );
    tong += muc.length;
  }
  // Gác chạy-rỗng: con số này chỉ được ĐI LÊN. Tụt xuống nghĩa là một bảng vừa biến mất
  // khỏi phép đo mà vẫn xanh — đúng kiểu hỏng im lặng.
  assert.ok(tong >= 513, `mới đếm ${tong} biểu tượng, ít hơn mốc 513 đo ngày 2026-09-01`);
});

// THỬ-CHO-ĐỎ: đổi một chỗ gọi bất kỳ về `getLabelMark(x.label, ...)` ⇒ bài 3 đỏ.
//
// ⚠️ CẤM CẢ `initialsFromLabel`, KHÔNG CHỈ `getLabelMark` — và đây là bài học đắt nhất của vòng
// này. Lần đổi đầu tiên `grep getLabelMark` ra 7 chỗ gọi, đổi hết, tưởng xong; ảnh chụp thì
// `BlueprintInventory.jsx` VẪN hiện "XĐ" · "TĐ", vì nó gọi thẳng `initialsFromLabel` — cùng một
// LUẬT, một CÁI TÊN KHÁC. Ba ô bản vẽ suýt bị bỏ lại. Vì vậy bài test hỏi chính CÁI LUẬT
// ("sinh ký hiệu tắt từ nhãn") ở MỌI cái tên nó mang, chứ không hỏi một cái tên.
test('màn sưu tập phải hỏi getGlyph, KHÔNG được nối thẳng ký hiệu tắt', () => {
  const man = [
    'src/components/Achievements.jsx',
    'src/components/SkillTree.jsx',
    'src/components/BuildingWorkshop.jsx',
    'src/components/BlueprintInventory.jsx',
    'src/components/RelicInventory.jsx',
    'src/components/StatsDashboard.jsx',
  ];
  for (const duongDan of man) {
    const ma = readFileSync(duongDan, 'utf8');
    // Bỏ dòng chú thích ra trước khi phán xét — một cái tên nằm trong lời kể lịch sử
    // không phải một lời gọi (bài học `/tênHàm\(/` bắt trúng cả dòng định nghĩa).
    const loiGoi = ma
      .split('\n')
      .filter((d) => !d.trimStart().startsWith('//') && !d.trimStart().startsWith('*'))
      .join('\n');
    assert.ok(
      !/(getLabelMark|initialsFromLabel)\s*\(/.test(loiGoi),
      `${duongDan} còn sinh ký hiệu tắt thẳng từ nhãn — 513 biểu tượng đã vẽ tay sẽ không lên được màn hình`,
    );
    assert.ok(
      /getGlyph\s*\(/.test(loiGoi),
      `${duongDan} không còn chỗ nào gọi getGlyph — phép đo này đang chạy rỗng`,
    );
  }
});
