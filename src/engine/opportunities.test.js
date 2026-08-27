import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  ALL_SKILLS,
  hasReadyOpportunity,
  listAvailableSkills,
  listBuildableBlueprints,
  listResearchableBlueprints,
} from './opportunities.js';

const HERE = dirname(fileURLToPath(import.meta.url));

test('MỘT LUẬT MỘT CÔNG THỨC: `NotificationCenter` không được giữ bản sao của ba phép đếm', () => {
  // ⚠️ Từ lúc điều hướng gộp ba màn vào tab "Hành trang", có HAI chỗ hỏi cùng một câu: cái chuông
  // thông báo và cái chấm trên tab ấy. Chép công thức về lại `NotificationCenter` cho "gần chỗ
  // dùng" là cách hai bản sao trôi khỏi nhau ở BIÊN — rồi cái chuông báo có việc trong khi cái
  // chấm im (hoặc ngược lại), và không có gì đỏ lên vì mỗi bên vẫn tự nhất quán với chính nó.
  const source = readFileSync(join(HERE, '..', 'components', 'NotificationCenter.jsx'), 'utf8');

  assert.ok(
    /from '\.\.\/engine\/opportunities'/.test(source),
    '`NotificationCenter` không còn đọc `engine/opportunities` — nó đã có công thức riêng ở đâu đó.',
  );

  for (const dauHieu of ['ALL_SKILLS', 'BLUEPRINT_META', 'getEffectiveResearchCost', 'countActiveCrafting']) {
    assert.ok(
      !source.includes(dauHieu),
      `\`${dauHieu}\` quay lại \`NotificationCenter.jsx\` — dấu hiệu ba phép đếm đang được dựng lại lần thứ hai ở đó.`,
    );
  }
});

test('không có SP thì không kỹ năng nào "sẵn sàng"', () => {
  assert.deepEqual(listAvailableSkills({ sp: 0, unlockedSkills: {} }), []);
});

test('đủ SP thì đúng những kỹ năng KHÔNG có điều kiện tiên quyết mở ra trước', () => {
  // Quan hệ, không phải con số: bảng kỹ năng đổi thì bài test này vẫn đúng.
  const goc = ALL_SKILLS.filter((skill) => skill.requires.length === 0);
  assert.ok(goc.length > 0, 'Bảng kỹ năng không còn nhánh gốc nào — bài test này đang chạy rỗng.');

  const san = listAvailableSkills({ sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {} });
  assert.deepEqual(
    san.map((skill) => skill.id).sort(),
    goc.map((skill) => skill.id).sort(),
    'Kỹ năng còn thiếu điều kiện tiên quyết mà vẫn bị tính là "sẵn sàng".',
  );

  // Đã mở rồi thì không còn là cơ hội nữa.
  const daMoHet = Object.fromEntries(goc.map((skill) => [skill.id, true]));
  const conLai = listAvailableSkills({ sp: Number.MAX_SAFE_INTEGER, unlockedSkills: daMoHet });
  assert.ok(
    conLai.every((skill) => !daMoHet[skill.id]),
    'Một kỹ năng đã mở vẫn bị đếm là cơ hội — cái chấm sẽ sáng vĩnh viễn.',
  );
});

test('ván chơi trắng tinh thì không có cơ hội nào đang chờ', () => {
  const trang = {
    sp: 0,
    unlockedSkills: {},
    activeBook: 1,
    blueprints: [],
    buildings: [],
    craftingQueue: [],
    research: { rp: 0, researched: [] },
    resources: {},
    resourcesRefined: {},
  };
  assert.equal(listResearchableBlueprints(trang).length, 0);
  assert.equal(listBuildableBlueprints(trang).length, 0);
  assert.equal(hasReadyOpportunity(trang), false);
});

test('`hasReadyOpportunity` nói ĐÚNG điều ba danh sách nói — không phải một phép đếm thứ tư', () => {
  // Nó ngắt sớm để chạy rẻ, và "ngắt sớm" là đúng chỗ một phép tối ưu lặng lẽ đổi câu trả lời.
  // Nên khoá bằng QUAN HỆ với ba danh sách, ở cả ba nhánh ngắt.
  const nen = {
    sp: 0,
    unlockedSkills: {},
    activeBook: 15,
    blueprints: [],
    buildings: [],
    craftingQueue: [],
    research: { rp: 0, researched: [] },
    resources: {},
    resourcesRefined: {},
  };
  const caCoHoi = { ...nen, sp: Number.MAX_SAFE_INTEGER, research: { rp: 10_000_000, researched: [] } };
  const chiKyNang = { ...nen, sp: Number.MAX_SAFE_INTEGER };
  const chiBanVe = { ...nen, research: { rp: 10_000_000, researched: [] } };

  for (const anh of [nen, caCoHoi, chiKyNang, chiBanVe]) {
    const coThat = listAvailableSkills(anh).length
      + listResearchableBlueprints(anh).length
      + listBuildableBlueprints(anh).length;
    assert.equal(hasReadyOpportunity(anh), coThat > 0);
  }

  // Gác chạy-rỗng: nếu ba ảnh chụp trên vô tình ra cùng một câu trả lời thì vòng lặp trên không
  // phân biệt được đúng với sai.
  assert.equal(hasReadyOpportunity(nen), false, 'Ảnh chụp "trắng tinh" phải ra false, nếu không cả bài test này chỉ đang so true với true.');
  assert.equal(hasReadyOpportunity(chiKyNang), true);
  assert.equal(hasReadyOpportunity(chiBanVe), true);
});
