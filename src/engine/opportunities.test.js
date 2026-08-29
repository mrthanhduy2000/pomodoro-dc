import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLUEPRINT_META, BUILDING_SPECS, normalizeRawCost } from './constants.js';
import {
  ALL_SKILLS,
  hasReadyOpportunity,
  listAvailableSkills,
  listBuildableBlueprints,
  listResearchableBlueprints,
  pickNextAction,
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

/**
 * ─── "VIỆC TIẾP THEO" ────────────────────────────────────────────────────────
 * Dòng ở màn Tập trung. Ba bài dưới đây canh ba cách nó có thể nói dối, và cả ba đều IM LẶNG:
 * hiện việc sai thứ tự · nói có việc khi không có · giấu mất phần việc còn lại.
 */

test('không có việc gì ⇒ trả `null`, KHÔNG trả một mục rỗng', () => {
  // Nơi gọi dựa vào `null` để không render gì cả. Trả về một object "trống" thì màn Tập trung sẽ
  // mọc ra một dòng trống chừa chỗ sẵn — thứ phá sự yên tĩnh hơn cả việc không có dòng nào.
  assert.equal(pickNextAction({ sp: 0, unlockedSkills: {} }), null);
  assert.equal(pickNextAction({}), null);
});

test('XÂY được thì việc hiện ra phải là XÂY, dù cùng lúc có cả kỹ năng lẫn bản vẽ đang chờ', () => {
  // ⚠️ Bài canh chính cái QUYẾT ĐỊNH ưu tiên, không canh một chuỗi chữ. Xây là việc duy nhất cho
  // kết quả nhìn thấy được trong thành phố ở phiên sau; để kỹ năng (thưởng mấy phần trăm, không
  // nhìn thấy ở đâu) chen lên trước là dùng chỗ đắt nhất màn hình cho thứ mờ nhạt nhất.
  const kho = { sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {} };
  const coSan = pickNextAction(kho);
  assert.ok(coSan, 'với SP vô hạn phải có ít nhất một việc — bài test đang chạy rỗng');
  assert.equal(coSan.id, 'skills', 'chỉ có kỹ năng sẵn sàng thì việc hiện ra phải là kỹ năng');

  // Dựng một ván có ĐỦ CẢ BA loại việc, rồi đòi "xây" thắng.
  const daySpec = Object.entries(BUILDING_SPECS);
  assert.ok(daySpec.length > 0, 'không có BUILDING_SPECS — bài test đang chạy rỗng');
  const [bpId, spec] = daySpec.find(([id]) => BLUEPRINT_META[id]?.era === 1) ?? daySpec[0];
  const meta = BLUEPRINT_META[bpId];

  const bag = {};
  for (const [res, amount] of Object.entries(normalizeRawCost(spec.cost ?? {}))) bag[res] = amount * 10;

  const banVe = pickNextAction({
    ...kho,
    activeBook: meta.era,
    blueprints: [{ id: bpId }],
    resources: { [`book${meta.era}`]: bag },
    resourcesRefined: { [meta.era]: { t2: 999 } },
    research: { rp: 999_999, researched: [] },
  });
  assert.equal(banVe.id, 'workshop', `xây được «${bpId}» mà việc hiện ra lại là "${banVe.id}"`);
  assert.equal(banVe.action.tab, 'collection');
  assert.equal(banVe.action.collectionTab, 'workshop');
});

test('`othersCount` đếm ĐÚNG phần việc còn lại, không phải tổng', () => {
  // Không có con số này thì một dòng nói về công trình sẽ im lặng nuốt mất 5 kỹ năng đang chờ, và
  // Đàm tưởng đã hết việc. Đây là chỗ dòng ấy dễ nói dối nhất — bằng cách bỏ sót, không bằng sai.
  const kho = { sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {} };
  const soViec = listAvailableSkills(kho).length
    + listResearchableBlueprints(kho).length
    + listBuildableBlueprints(kho).length;
  assert.ok(soViec >= 2, 'cần ít nhất 2 việc thì mới kiểm được phép trừ — bài test đang chạy rỗng');
  assert.equal(pickNextAction(kho).othersCount, soViec - 1);
});
