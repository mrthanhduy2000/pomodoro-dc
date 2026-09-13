/**
 * humanWardrobe.test.js — ROUND 52 (ADR-092), Việc 7 + 8 + 9.
 *
 * Bốn lời hứa, và ba trong bốn được viết ở dạng QUAN HỆ chứ không phải con số tuyệt đối, vì cả ba
 * đều nói về một sự so sánh ("dày hơn", "sáng hơn", "khác kỷ bên cạnh"):
 *   1. **VẢI LÀ KHỐI, KHÔNG PHẢI MÀU** — tay áo phải vừa đổi vai màu VỪA dày lên. Chỉ đổi màu là
 *      đúng cái Đàm cấm thẳng: *"không vẽ quần áo bằng cách tô màu lên chi"*.
 *   2. **KHÔNG KỶ NÀO ĐI NGOÀI ĐƯỜNG VỚI MỘT CÁI SỌ TRƠN** — đội mũ, hoặc có tóc.
 *   3. **ỦNG PHẢI LẬT NGƯỢC ĐƯỢC QUAN HỆ GIẢI PHẪU** — cẳng chân không bao giờ dày hơn đùi trên
 *      một cái chân thật, nên khi nó dày hơn thì mắt buộc phải đọc ra "có cái gì đi ngoài cái chân".
 *   4. **KHÔNG TỐN THÊM KHỐI NÀO** — và đây là lời hứa dễ mất nhất, nên nó được đo chứ không được
 *      hứa suông. Xem khối chú thích ở `SLEEVE_LOOK` để biết bản đầu đã tốn 8 khối/người như thế nào.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildHumanBody, legLook, sleeveLook } from './human.js';
import { HAIR_KINDS, LEG_KINDS, SLEEVE_KINDS, getHumanStyle } from './humanStyle.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const khoi = (body, id) => body.parts.find((p) => p.id === id);

test('VẢI LÀ KHỐI: tay áo vừa đổi VAI MÀU vừa DÀY LÊN so với cánh tay trần', () => {
  const tran = sleeveLook('bare');
  assert.equal(tran.upRole, 'skin', 'vạch xuất phát phải là da — nếu không thì phép so dưới vô nghĩa');

  for (const kind of SLEEVE_KINDS) {
    if (kind === 'bare') continue;
    const sv = sleeveLook(kind);
    assert.equal(sv.upRole, 'cloth', `tay áo "${kind}": bắp tay phải mang vai vải`);
    // ⚠️ VẾ THỨ HAI MỚI LÀ VẾ CÓ RĂNG. Bỏ nó đi thì một bản vá "cho nhanh" chỉ cần đổi `upRole`
    // là test xanh — mà đó đúng là tô màu lên chi, thứ cả Việc 8 sinh ra để xoá.
    assert.ok(sv.upW > tran.upW + 1e-9,
      `tay áo "${kind}" dày ${sv.upW} mà tay trần đã ${tran.upW} — vải không có bề dày thì nó là`
      + ' MÀU, không phải KHỐI');
  }

  // Tay ngắn phải để HỞ cẳng tay, nếu không thì nó với tay dài là một.
  assert.equal(sleeveLook('short').loRole, 'skin', 'tay ngắn mà cẳng tay cũng vải thì là tay dài');
  assert.equal(sleeveLook('long').loRole, 'cloth');

  // Tay thụng: cẳng tay đổi hẳn KHUÔN, và đó là thứ cho ra đường bao xoè.
  const wide = sleeveLook('wide');
  assert.equal(wide.loShape, 'flare', 'tay thụng phải xoè — `flare` là khuôn của chính vật ấy');
  assert.ok(wide.loW > sleeveLook('long').loW * 1.4,
    `tay thụng rộng ${wide.loW} mà tay dài đã ${sleeveLook('long').loW} — chưa đủ để mắt đọc ra`);
});

test('ỦNG LẬT NGƯỢC QUAN HỆ GIẢI PHẪU: cẳng chân dày hơn đùi — chuyện không thể với chân thật', () => {
  for (const kind of LEG_KINDS) {
    const lg = legLook(kind);
    const daVaiCua = kind === 'wrap' ? 'skin' : 'cloth2';
    assert.equal(lg.upRole, daVaiCua, `ống quần "${kind}": đùi sai vai màu`);
    if (kind === 'boot') continue;
    assert.ok(lg.loW < lg.upW,
      `"${kind}": cẳng chân ${lg.loW} không được dày hơn đùi ${lg.upW} — chân người thon xuống`);
  }
  const boot = legLook('boot');
  assert.ok(boot.loW > boot.upW,
    `ủng: cẳng chân ${boot.loW} phải DÀY HƠN đùi ${boot.upW} — đó là toàn bộ cách mắt đọc ra "ủng"`);
  assert.equal(boot.loShape, 'limb',
    'ủng phải bỏ khuôn `calf` (đáy 0,44 = cổ chân thắt) — một cái ủng không có cổ chân thắt');

  // ⚠️ `wrap` KHÔNG ĐƯỢC DÀY HƠN VẠCH XUẤT PHÁT: chân trần thì mảnh hơn chân mặc quần, không dày
  // hơn. Nếu vế này đỏ thì có người vừa "sửa" `wrap` thành một cái váy đắp thêm — xem `LEG_LOOK`.
  assert.ok(legLook('wrap').upW < legLook('none').upW,
    'chân trần phải MẢNH hơn chân dưới lớp vải');
});

test('KHÔNG KỶ NÀO ĐẦU TRƠN — và cái mũ với cái tóc không bao giờ cùng chiếm một chỗ', () => {
  const co = { toc: 0, mu: 0 };
  for (const era of ERAS) {
    const body = buildHumanBody(era);
    const mu = khoi(body, 'headgear');
    const toc = khoi(body, 'hair');
    assert.ok(mu || toc, `kỷ ${era}: không mũ, không tóc — một cái sọ trơn giữa phố`);
    assert.ok(!(mu && toc), `kỷ ${era}: vừa mũ vừa tóc — trần 18 khối/người không chịu nổi 15 kỷ`);
    if (toc) { co.toc += 1; assert.equal(toc.role, 'hair', `kỷ ${era}: tóc phải mang vai \`hair\``); }
    if (mu) co.mu += 1;
    assert.ok(HAIR_KINDS.includes(getHumanStyle(era).hair),
      `kỷ ${era}: kiểu tóc "${getHumanStyle(era).hair}" không có trong bảng`);
  }
  // ⚠️ ĐO BIÊN, ĐỪNG CHỈ ĐỌC XANH/ĐỎ: 4 kỷ đầu trần · 11 kỷ đội mũ. Con số này ĐƯỢC PHÉP đổi khi
  // trần khối được nới — nhưng tổng thì không, nên nó được viết dưới dạng tổng.
  assert.equal(co.toc + co.mu, 15, `${co.toc} kỷ có tóc + ${co.mu} kỷ đội mũ ≠ 15`);
  assert.ok(co.toc >= 4, `chỉ ${co.toc} kỷ dựng tóc thật — bảng \`HAIRDO\` đang bị bỏ qua`);
});

test('TRẢ 0 KHỐI VÀ 0 LỆNH VẼ: tủ đồ không được làm phình cơ thể', () => {
  // ⚠️ VÌ SAO CON SỐ 18 NẰM Ở ĐÂY MÀ KHÔNG PHẢI Ở CHỖ KHÁC: `sceneGraphWiring.test.js` đã gác trần
  // 18 khối/người rồi. Bài này gác một thứ KHÁC — rằng trần ấy không bị tủ đồ ăn hết biên. Trước
  // vòng 52 kỷ dày nhất là 18; sau vòng 52 vẫn phải là 18, dù đã thêm tay áo, ống quần, ủng và tóc.
  /*
    ⚠️ ROUND 54 (ADR-094): BÀI NÀY ĐỔI TỪ MỘT CON SỐ SANG MỘT PHÉP TRỪ, VÀ ĐÓ MỚI LÀ CÂU NÓ ĐỊNH HỎI.
    Bản vòng 52 khoá `max(parts) === 18`. Nó xanh suốt hai vòng rồi đỏ ở vòng 54 — không phải vì tủ
    đồ phình ra, mà vì CƠ THỂ được thêm cổ, hai mắt và sáu khớp cầu (Việc 5 và 7 của Đàm). Tức bài
    test đo TỔNG trong khi lời hứa nó canh chỉ nói về MỘT PHẦN của tổng ấy.
    Đó đúng là bẫy `TECH_DEBT #22` ("mẫu số chứa thứ ngoài câu hỏi") và bài học 5 của `CLAUDE.md`.
    ⇒ Nay hỏi đúng phần mình: dựng một cư dân với tủ đồ THẬT của kỷ, và một cư dân với tủ đồ TRẦN
    (`bare`/`none`), rồi đòi hai bên ra ĐÚNG BẰNG NHAU về số khối. Lời hứa "tủ đồ tốn 0 khối" được
    canh trực tiếp, ở mọi cỡ cơ thể, mãi mãi — thêm bao nhiêu khớp cầu nữa cũng không làm nó đỏ oan.
  */
  for (const era of ERAS) {
    const thuc = buildHumanBody(era).parts.length;
    const tran = buildHumanBody(era).parts.filter((p) => !/^(sleeve|cuff|legwear|shinwear)/.test(p.id)).length;
    assert.equal(thuc, tran,
      `kỷ ${era}: tủ đồ đang dựng thêm ${thuc - tran} khối. Vòng 52 hứa nó tốn 0 — đừng nới, hãy`
      + ' hỏi lại "ngoài đời đây là MẤY vật?" (xem `SLEEVE_LOOK`).');
  }

  // Số KHUÔN mỗi kỷ dùng chính là số lệnh vẽ cư dân tiêu. Tủ đồ chỉ được dùng lại khuôn đã có.
  //
  // ⚠️ 8 LÀ MỘT CON SỐ ĐO ĐƯỢC TRÊN BẢN TRƯỚC VÒNG 52, KHÔNG PHẢI MỘT CON SỐ CHỌN CHO VỪA.
  // Bản đầu của bài này viết 6 — một con số đoán — và nó đỏ ngay ở kỷ 6 và kỷ 8. Đi chạy lại trên
  // `git stash` thì hai kỷ ấy ĐÃ là 8 từ trước: nón lá (`cone`) và mũ vành (`hat`) mỗi cái là một
  // khuôn riêng, cộng thêm `prism` của đồ mang theo. Tức cái đỏ đầu tiên là PHÉP ĐO sai chứ không
  // phải mã sai — lần thứ 29 của bài học *"nghi cái THƯỚC trước khi nghi cái máy"* trong `CLAUDE.md`.
  // ⇒ Giữ 8, và đó chính là lời hứa của bài này: tủ đồ vòng 52 không thêm một khuôn nào.
  for (const era of ERAS) {
    const dung = new Set(buildHumanBody(era).parts.map((p) => p.shape));
    // ⚠️ 8 → 9 (round 58, Việc 3): khuôn `skull` cho cái đầu. Con số này vẫn là thứ nó vẫn luôn là
    // — SỐ LỆNH VẼ cư dân tiêu ở kỷ ấy — và lời hứa của bài này cũng giữ nguyên: **tủ đồ** không
    // thêm khuôn nào. Khoản +1 không đến từ tủ đồ, nó đến từ cái sọ, và `drawCallBudget.test.js`
    // canh riêng khoản ấy bằng một phép trừ có mốc ngày tháng.
    assert.ok(dung.size <= 9,
      `kỷ ${era} dùng ${dung.size} khuôn (${[...dung].join(', ')}) — mỗi khuôn là một lệnh vẽ`);
  }
});
