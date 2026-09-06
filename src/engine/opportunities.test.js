import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { BLUEPRINT_CATALOG, CRAFT_QUEUE_SLOTS, RELIC_ELITE_RESONANCE } from './constants.js';
import { getEffectiveSkillCost } from './gameMath.js';
import {
  ALL_SKILLS,
  hasReadyOpportunity,
  listAvailableSkills,
  listBuildableBlueprints,
  nextReachableSkill,
  pickNextAction,
} from './opportunities.js';

const HERE = dirname(fileURLToPath(import.meta.url));

test('MỘT LUẬT MỘT CÔNG THỨC: `NotificationCenter` không được giữ bản sao của hai phép đếm', () => {
  // ⚠️ Từ lúc điều hướng gộp ba màn vào tab "Hành trang", có HAI chỗ hỏi cùng một câu: cái chuông
  // thông báo và cái chấm trên tab ấy. Chép công thức về lại `NotificationCenter` cho "gần chỗ
  // dùng" là cách hai bản sao trôi khỏi nhau ở BIÊN — rồi cái chuông báo có việc trong khi cái
  // chấm im (hoặc ngược lại), và không có gì đỏ lên vì mỗi bên vẫn tự nhất quán với chính nó.
  const source = readFileSync(join(HERE, '..', 'components', 'NotificationCenter.jsx'), 'utf8');

  assert.ok(
    /from '\.\.\/engine\/opportunities'/.test(source),
    '`NotificationCenter` không còn đọc `engine/opportunities` — nó đã có công thức riêng ở đâu đó.',
  );

  for (const dauHieu of ['ALL_SKILLS', 'BLUEPRINT_META', 'getEffectiveResearchCost', 'countActiveCrafting', 'listResearchableBlueprints']) {
    assert.ok(
      !source.includes(dauHieu),
      `\`${dauHieu}\` quay lại \`NotificationCenter.jsx\` — dấu hiệu phép đếm đang được dựng lại lần thứ hai ở đó (hoặc cổng nghiên cứu đã bỏ mọc lại).`,
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

test('`nextReachableSkill` chỉ vào kỹ năng RẺ NHẤT đã đủ tiên quyết mà chưa đủ SP', () => {
  const goc = ALL_SKILLS.filter((skill) => skill.requires.length === 0);
  const reNhat = Math.min(...goc.map((s) => s.spCost));
  const dich = nextReachableSkill({ sp: 0, unlockedSkills: {} });
  assert.ok(dich, 'ván trắng phải có một đích để với tới');
  assert.equal(dich.cost, reNhat, 'đích phải là nút rẻ nhất trong số mở được về tiên quyết');
  assert.equal(dich.spNeeded, reNhat, 'còn thiếu đúng bằng giá khi trong tay có 0 SP');
  // Đủ tiền cho mọi nút gốc ⇒ đích nhảy sang nút SÂU hơn (chưa đủ tiên quyết thì không được chỉ).
  const duGoc = nextReachableSkill({ sp: reNhat, unlockedSkills: {} });
  assert.ok(!duGoc || duGoc.cost > reNhat, 'có đủ SP cho nút rẻ nhất thì nó không còn là "đích kế tiếp"');
  assert.equal(nextReachableSkill({ sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {} }), null, 'đủ tiền mọi thứ thì không còn đích');
});

/**
 * ─── XÂY (ADR-069) ────────────────────────────────────────────────────────────
 * Không còn RP, không còn nguyên liệu: "xây được" = có ô hàng chờ trống + còn công trình chưa xây
 * ở kỷ này. Một ô trống LÀ một việc, vì mỗi phiên chỉ đẩy những gì đang nằm trong hàng chờ.
 */

test('ván chơi trắng tinh: chưa xây gì, hàng chờ trống ⇒ có việc — chọn công trình đầu tiên', () => {
  // ⚠️ Đây là chỗ ADR-069 cố ý ĐẢO một bài cũ ("ván trắng tinh thì không có cơ hội nào"). Trước
  // đây ván trắng không có RP nên không có việc; nay ô trống là việc, và với người mới thì "chọn
  // công trình đầu tiên" chính là lời dẫn vào vòng lặp mà không cần hướng dẫn nào.
  const trang = { sp: 0, unlockedSkills: {}, activeBook: 1, buildings: [], craftingQueue: [] };
  const co = listBuildableBlueprints(trang);
  assert.equal(co.length, BLUEPRINT_CATALOG[1].length, 'mọi bản vẽ kỷ 1 đều chọn được khi chưa xây gì');
  assert.equal(hasReadyOpportunity(trang), true);
});

test('hàng chờ ĐẦY ⇒ không còn "xây được", dù còn bản vẽ chưa xây', () => {
  const ids = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
  const day = {
    activeBook: 1,
    buildings: [],
    craftingQueue: ids.slice(0, CRAFT_QUEUE_SLOTS).map((bpId) => ({ bpId, sessionsRemaining: 3 })),
  };
  assert.equal(listBuildableBlueprints(day).length, 0, 'ô đầy mà vẫn báo xây được là mời bấm một nút khoá');
  assert.equal(hasReadyOpportunity({ ...day, sp: 0, unlockedSkills: {} }), false);
});

test('đã xây hết / đã vào hàng chờ thì không được đếm lại', () => {
  const ids = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
  const het = { activeBook: 1, buildings: ids, craftingQueue: [] };
  assert.equal(listBuildableBlueprints(het).length, 0, 'xây trọn kỷ mà cái chấm vẫn sáng là sáng vĩnh viễn');

  const motCai = { activeBook: 1, buildings: [], craftingQueue: [{ bpId: ids[0], sessionsRemaining: 2 }] };
  const con = listBuildableBlueprints(motCai).map((bp) => bp.id);
  assert.ok(!con.includes(ids[0]), 'bản vẽ đang xây không được mời xây lần nữa');
  assert.equal(con.length, ids.length - 1);
});

test('di sản kỷ cũ đang xây dở KHÔNG chiếm ô của kỷ này', () => {
  // Từ Phase 4D hàng đợi có thể chứa công trình của kỷ đã đóng — nó có ô riêng (ADR-012).
  const ids7 = BLUEPRINT_CATALOG[7].map((bp) => bp.id);
  const ids5 = BLUEPRINT_CATALOG[5].map((bp) => bp.id);
  const snapshot = {
    activeBook: 7,
    buildings: [],
    craftingQueue: [
      { bpId: ids5[0], sessionsRemaining: 2 },
      { bpId: ids7[0], sessionsRemaining: 2 },
    ],
  };
  assert.equal(listBuildableBlueprints(snapshot).length, ids7.length - 1, 'một di sản + một công trình kỷ này ⇒ vẫn còn một ô trống');
});

test('`hasReadyOpportunity` nói ĐÚNG điều hai danh sách nói — không phải một phép đếm thứ ba', () => {
  const ids = BLUEPRINT_CATALOG[15].map((bp) => bp.id);
  const nen = {
    sp: 0,
    unlockedSkills: {},
    activeBook: 15,
    buildings: ids,       // xây trọn ⇒ không còn gì để chọn
    craftingQueue: [],
  };
  const chiKyNang = { ...nen, sp: Number.MAX_SAFE_INTEGER };
  const chiXay = { ...nen, buildings: [] };
  const caHai = { ...chiXay, sp: Number.MAX_SAFE_INTEGER };

  for (const anh of [nen, chiKyNang, chiXay, caHai]) {
    const coThat = listAvailableSkills(anh).length + listBuildableBlueprints(anh).length;
    assert.equal(hasReadyOpportunity(anh), coThat > 0);
  }
  // Gác chạy-rỗng: bốn ảnh chụp phải ra hai câu trả lời khác nhau, nếu không bài này chỉ so true với true.
  assert.equal(hasReadyOpportunity(nen), false);
  assert.equal(hasReadyOpportunity(chiKyNang), true);
  assert.equal(hasReadyOpportunity(chiXay), true);
});

/**
 * ─── "VIỆC TIẾP THEO" ────────────────────────────────────────────────────────
 * Dòng ở màn Tập trung. Ba bài dưới đây canh ba cách nó có thể nói dối, và cả ba đều IM LẶNG:
 * hiện việc sai thứ tự · nói có việc khi không có · giấu mất phần việc còn lại.
 */

test('không có việc gì ⇒ trả `null`, KHÔNG trả một mục rỗng', () => {
  const ids = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
  assert.equal(pickNextAction({ sp: 0, unlockedSkills: {}, activeBook: 1, buildings: ids, craftingQueue: [] }), null);
});

test('XÂY được thì việc hiện ra phải là XÂY, dù cùng lúc có kỹ năng đang chờ', () => {
  // ⚠️ Bài canh chính cái QUYẾT ĐỊNH ưu tiên, không canh một chuỗi chữ. Một ô hàng chờ trống là một
  // phiên sắp bị bỏ phí — thứ hết hạn sớm hơn một điểm kỹ năng chưa tiêu.
  const ids = BLUEPRINT_CATALOG[1].map((bp) => bp.id);
  const chiKyNang = pickNextAction({ sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {}, activeBook: 1, buildings: ids, craftingQueue: [] });
  assert.ok(chiKyNang, 'với SP vô hạn phải có ít nhất một việc — bài test đang chạy rỗng');
  assert.equal(chiKyNang.id, 'skills', 'chỉ có kỹ năng sẵn sàng thì việc hiện ra phải là kỹ năng');

  const caHai = pickNextAction({ sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {}, activeBook: 1, buildings: [], craftingQueue: [] });
  assert.equal(caHai.id, 'workshop', `ô trống mà việc hiện ra lại là "${caHai.id}"`);
  assert.equal(caHai.action.tab, 'collection');
  assert.equal(caHai.action.collectionTab, 'workshop');
  assert.match(caHai.text, /trống/, 'dòng phải nói ra LÝ DO — hàng chờ trống — chứ không chỉ tên công trình');
});

test('`othersCount` đếm phần việc KHÁC LOẠI còn lại — một ô trống là MỘT việc dù có 5 bản vẽ để chọn', () => {
  // Không có con số này thì một dòng nói về công trình sẽ im lặng nuốt mất 5 kỹ năng đang chờ, và
  // Đàm tưởng đã hết việc. Nhưng 5 bản vẽ chọn được cho MỘT ô trống không phải 5 việc: chọn xong
  // một cái là hết ô — đếm cả 5 là nói dối theo chiều ngược lại.
  const kho = { sp: Number.MAX_SAFE_INTEGER, unlockedSkills: {}, activeBook: 1, buildings: [], craftingQueue: [] };
  const soKyNang = listAvailableSkills(kho).length;
  assert.ok(soKyNang >= 1, 'cần ít nhất 1 kỹ năng để kiểm phép đếm — bài test đang chạy rỗng');
  assert.equal(pickNextAction(kho).othersCount, soKyNang);
});

// ─── Cộng hưởng di vật: giá THỰC, không phải giá gốc (2026-09-02) ──────────────
test('KỸ NĂNG GIẢM GIÁ NHỜ DI VẬT PHẢI ĐƯỢC ĐẾM LÀ "MỞ ĐƯỢC NGAY"', () => {
  // ⚠️ Ca đã cắn thật: `unlockSkill` trong store TRỪ giá đã giảm, còn danh sách cơ hội lại so với
  // giá GỐC. Với đúng số SP nằm giữa hai giá, người chơi mua được thật trong khi cái chuông ·
  // cái chấm · dòng "việc tiếp theo" đều bảo không có việc gì — và không có gì đỏ lên.
  const map = Object.values(RELIC_ELITE_RESONANCE)[0];
  assert.ok(map, 'phải có ít nhất một cặp cộng hưởng để thử');
  const elite = ALL_SKILLS.find((s) => s.id === map.elite);
  assert.ok(elite, `không tìm thấy kỹ năng tinh hoa ${map.elite}`);

  // mở sẵn mọi nút tiên quyết để chỉ còn GIÁ là biến
  const unlockedSkills = {};
  const moTienQuyet = (id) => {
    const n = ALL_SKILLS.find((s) => s.id === id);
    for (const r of n?.requires ?? []) { moTienQuyet(r); unlockedSkills[r] = true; }
  };
  moTienQuyet(elite.id);

  const giaGoc = elite.spCost;
  const giaGiam = getEffectiveSkillCost(elite.id, giaGoc, [{ id: map.relicId }], { [map.relicId]: 99 });
  assert.ok(giaGiam < giaGoc, 'cặp cộng hưởng này phải thật sự giảm giá');

  const sp = giaGiam; // đủ cho giá ĐÃ GIẢM, chưa đủ cho giá gốc
  const khongDiVat = listAvailableSkills({ sp, unlockedSkills });
  assert.equal(khongDiVat.some((s) => s.id === elite.id), false, 'chưa có di vật thì đúng là chưa mở được');

  const coDiVat = listAvailableSkills({
    sp, unlockedSkills, relics: [{ id: map.relicId }], relicEvolutions: { [map.relicId]: 99 },
  });
  assert.equal(coDiVat.some((s) => s.id === elite.id), true,
    'có di vật ⇒ mua được thật ⇒ danh sách cơ hội PHẢI thấy');
});
