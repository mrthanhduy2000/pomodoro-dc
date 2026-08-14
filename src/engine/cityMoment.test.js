import test from 'node:test';
import assert from 'node:assert/strict';

import { buildFocusTease, buildGrowthMoment } from './cityMoment.js';
import { computeCityLayout } from './cityLayout.js';
import { BLUEPRINT_CATALOG, BUILDING_EFFECTS } from './constants.js';

const ERA6 = BLUEPRINT_CATALOG[6].map((bp) => bp.id);
const scaffoldsFor = (pending) => computeCityLayout({ built: [], era: 6, pending }).scaffolds;

test('KHÔNG có gì đang xây ⇒ KHÔNG có khoảnh khắc nào — thà im lặng còn hơn khen rỗng', () => {
  // ⚠️ Đây là bài quan trọng nhất của cả file. Một lời chúc mừng sai MỘT lần thì mọi lời chúc mừng
  // sau đó đều mất giá — cùng nguyên tắc chống-bịa mà AI Coach đang sống bằng nó. Phiên nào thành
  // phố thật sự không nhúc nhích thì đi thẳng vào hộp thoại phần thưởng, không diễn.
  assert.equal(buildGrowthMoment({}), null);
  assert.equal(buildGrowthMoment({ newlyBuilt: [], scaffolds: [] }), null);
  assert.equal(buildGrowthMoment(), null, 'gọi không tham số cũng không được ném lỗi');
});

test('CÔNG TRÌNH VỪA XONG là tin lớn nhất — luôn thắng giàn giáo', () => {
  const moment = buildGrowthMoment({
    newlyBuilt: [ERA6[1]],
    scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 1 }]),
  });
  assert.equal(moment.kind, 'built');
  assert.equal(moment.bpId, ERA6[1]);
  assert.equal(moment.progress, 1);
  assert.ok(moment.detail.length > 0, 'thiếu tên công trình vừa xong');
  assert.ok(moment.icon, 'thiếu biểu tượng');
});

test('NHIỀU công trình cùng xong thì ghép tên đọc được, không phải một mảng thô', () => {
  const two = buildGrowthMoment({ newlyBuilt: [ERA6[0], ERA6[1]] });
  assert.match(two.detail, / và /, 'hai công trình phải nối bằng "và"');
  assert.match(two.headline, /Nhiều/);

  const three = buildGrowthMoment({ newlyBuilt: [ERA6[0], ERA6[1], ERA6[2]] });
  assert.match(three.detail, /, .* và /, 'ba công trình phải là "A, B và C"');
});

test('GIÀN GIÁO: chọn cái GẦN XONG NHẤT, cùng thứ tự với bảng "Đang xây"', () => {
  // Hai màn hình phải nói về CÙNG một công trình. Nếu khoảnh khắc khoe cái này còn bảng liệt kê
  // cái kia lên đầu thì Đàm sẽ tưởng app đang đếm hai thứ khác nhau.
  const moment = buildGrowthMoment({
    scaffolds: scaffoldsFor([
      { bpId: ERA6[0], sessionsRemaining: 5 },
      { bpId: ERA6[1], sessionsRemaining: 1 },
    ]),
  });
  assert.equal(moment.kind, 'scaffold');
  assert.equal(moment.bpId, ERA6[1]);
  assert.match(moment.detail, /còn 1 phiên/);
});

test('GIÀN GIÁO sắp xong (còn 0 phiên) KHÔNG được viết "còn 0 phiên"', () => {
  const moment = buildGrowthMoment({
    scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 0 }]),
  });
  assert.match(moment.detail, /sắp xong/);
  assert.doesNotMatch(moment.detail, /còn 0/);
});

// ─── Cột mốc: màn thưởng KHÔNG được là một hằng số ───────────────────────────

/** Mọi câu mừng Đàm đọc khi xây trọn MỘT công trình thật, từ phiên đầu tới phiên áp chót. */
function headlinesAcrossLifecycle(bpId, era) {
  const total = BUILDING_EFFECTS[bpId]?.sessionsToComplete;
  if (!Number.isFinite(total) || total <= 0) return [];
  const out = [];
  for (let remaining = total - 1; remaining >= 1; remaining -= 1) {
    const scaffolds = computeCityLayout({ built: [], era, pending: [{ bpId, sessionsRemaining: remaining }] }).scaffolds;
    const moment = buildGrowthMoment({ scaffolds });
    if (moment) out.push(moment.headline);
  }
  // ⚠️ Phiên CUỐI là lúc công trình hoàn thành ⇒ `newlyBuilt`, không phải một giàn giáo "còn 0
  // phiên". Bỏ sót nhánh này thì phép đo đang bỏ qua đúng khoảnh khắc đáng giá nhất và báo bi quan
  // hơn sự thật — dev-tool cũng phải bị nghi ngờ như mã sản phẩm.
  const done = buildGrowthMoment({ newlyBuilt: [bpId] });
  if (done) out.push(done.headline);
  return out;
}

const ALL_BLUEPRINTS = Object.entries(BLUEPRINT_CATALOG)
  .flatMap(([era, list]) => list.map((bp) => ({ bpId: bp.id, era: Number(era) })));

test('MÀN THƯỞNG KHÔNG ĐƯỢC LÀ HẰNG SỐ — đo trên toàn bộ 75 bản vẽ', () => {
  // ⚠️ ĐÂY LÀ BÀI ĐO CHỮ "CHÁN", phần đo được của nó.
  // Trước 2026-08-12 nhánh giàn giáo trả đúng MỘT câu cứng. Đo ra: cả game chỉ có 2 câu mừng và
  // 82% số phiên đọc lại đúng 4 chữ "Thành phố vừa lớn lên" — với nhịp ~4 phiên/ngày thì Đàm gặp
  // nó hơn 3 lần MỖI NGÀY. Một phần thưởng lặp lại y hệt thì thôi làm phần thưởng.
  //
  // ⚠️ NGƯỠNG ĐẶT Ở ĐÂU VÀ VÌ SAO: 50% nằm DƯỚI giá trị hỏng đã từng chạy thật (82%). Ngưỡng đặt
  // trên giá trị hỏng thì chỉ là cái phễu — nó cho lọt qua đúng cái lỗi mà nó mang tên. Bài học
  // này phiên 2026-08-12 đã trả giá ba lần (độ sáng nền đêm, tách mái, độ lớn giàn giáo).
  const headlines = ALL_BLUEPRINTS.flatMap(({ bpId, era }) => headlinesAcrossLifecycle(bpId, era));
  assert.ok(headlines.length > 300, `chỉ dựng được ${headlines.length} phiên mẫu — bộ đo hỏng, không phải sản phẩm đạt`);

  const counts = new Map();
  headlines.forEach((h) => counts.set(h, (counts.get(h) ?? 0) + 1));
  const dominant = Math.max(...counts.values()) / headlines.length;

  assert.ok(counts.size >= 3,
    `cả game chỉ có ${counts.size} câu mừng cho ${headlines.length} phiên xây — màn thưởng là một hằng số`);
  assert.ok(dominant <= 0.5,
    `${Math.round(dominant * 100)}% số phiên đọc cùng một câu mừng (trần 50%). Ai đó vừa gộp các cột `
    + 'mốc lại làm một. Đọc lại `growthHeadline` trong cityMoment.js trước khi nới ngưỡng này.');
});

test('CỘT MỐC PHẢI ĐÚNG — không được khen một cái mốc chưa xảy ra', () => {
  // ⚠️ Bài này canh thứ NGƯỢC LẠI với bài trên, và nó quan trọng hơn.
  // Cách chữa nhàm chán rẻ nhất là rắc câu ngẫu nhiên cho đủ đa dạng — làm vậy thì bài đo ở trên
  // vẫn XANH trong khi app bắt đầu nói dối. Luật trung thực của file này (xem đầu file) đứng trên
  // luật đa dạng: mỗi câu mừng phải là một mệnh đề ĐÚNG về đúng phiên vừa xong.
  for (const { bpId, era } of ALL_BLUEPRINTS) {
    const total = BUILDING_EFFECTS[bpId]?.sessionsToComplete;
    if (!Number.isFinite(total)) continue;
    for (let remaining = total - 1; remaining >= 0; remaining -= 1) {
      const scaffolds = computeCityLayout({ built: [], era, pending: [{ bpId, sessionsRemaining: remaining }] }).scaffolds;
      const m = buildGrowthMoment({ scaffolds });
      if (!m) continue;
      const where = `${bpId} (còn ${remaining}/${total})`;

      if (m.headline === 'Chỉ còn một phiên nữa') {
        assert.equal(remaining, 1, `${where}: nói "chỉ còn một phiên" mà thật ra còn ${remaining}`);
      }
      if (m.headline === 'Vừa khởi công') {
        assert.equal(m.fromProgress, 0, `${where}: nói "vừa khởi công" mà trước đó đã có tiến độ ${m.fromProgress}`);
      }
      if (m.headline === 'Đã qua nửa chặng') {
        assert.ok(m.fromProgress < 0.5 && m.progress >= 0.5,
          `${where}: nói "qua nửa chặng" nhưng thật ra đi từ ${m.fromProgress} tới ${m.progress}`);
      }
    }
  }
});

test('MẠCH CỦA MỘT CÔNG TRÌNH: khởi công → qua nửa → còn một phiên', () => {
  // Cái làm người ta quay lại không phải sự đa dạng, mà là cảm giác ĐANG ĐI TỚI ĐÂU ĐÓ. Ba cột mốc
  // này phải xuất hiện đúng MỘT lần mỗi công trình và đúng thứ tự — nếu không thì chúng chỉ là ba
  // câu khác nhau chứ không thành một mạch.
  const six = ALL_BLUEPRINTS.find(({ bpId }) => BUILDING_EFFECTS[bpId]?.sessionsToComplete === 6);
  const arc = headlinesAcrossLifecycle(six.bpId, six.era);

  assert.equal(arc.filter((h) => h === 'Vừa khởi công').length, 1, 'khởi công phải đúng một lần');
  assert.equal(arc.filter((h) => h === 'Đã qua nửa chặng').length, 1, 'qua nửa chặng phải đúng một lần');
  assert.equal(arc.filter((h) => h === 'Chỉ còn một phiên nữa').length, 1, 'còn-một-phiên phải đúng một lần');
  assert.equal(arc[0], 'Vừa khởi công', 'phiên đầu tiên phải là khởi công');
  assert.ok(arc.indexOf('Vừa khởi công') < arc.indexOf('Đã qua nửa chặng'), 'qua nửa chặng phải sau khởi công');
  assert.ok(arc.indexOf('Đã qua nửa chặng') < arc.indexOf('Chỉ còn một phiên nữa'), 'còn-một-phiên phải là cột mốc cuối');
});

test('HAI PHIÊN CUỐI phải PHÂN BIỆT ĐƯỢC — "gần xong" không được đọc giống "đã xong"', () => {
  // ⚠️ Tìm ra bằng MẮT, không phải bằng phép đo: bản đầu của Phase 3R đặt câu 'Sắp hoàn thành'
  // cho trạng thái hàng đợi về 0. Nó rơi vào phiên NGAY TRƯỚC câu 'Công trình đã hoàn thành', mà
  // đọc lướt thì hai câu này gần như một. Đàm không biết được là công trình đã xong hay chưa —
  // đúng thứ mà cả màn hình này sinh ra để trả lời.
  const [zero] = scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 0 }]);
  const nearly = buildGrowthMoment({ scaffolds: [zero] }).headline;
  const done = buildGrowthMoment({ newlyBuilt: [ERA6[0]] }).headline;

  assert.notEqual(nearly, done);
  assert.ok(!nearly.includes('hoàn thành'),
    `câu lúc CHƯA xong ("${nearly}") dùng lại đúng chữ "hoàn thành" của câu lúc ĐÃ xong ("${done}") `
    + '⇒ đọc lướt là lẫn. Chọn chữ khác, đừng chỉ thêm/bớt một từ.');
});

test('TĂNG TỐC phải được NÓI RA — đặc quyền chạy im lặng thì như không có', () => {
  // Đặc quyền này xưa nay chỉ đổi vạch xuất phát của thanh tiến độ. Đàm thấy cú nhảy dài hơn nhưng
  // không có gì nói cho anh biết vì sao — một sự thật đang bị giấu, không phải lời khen thêm.
  const [s] = scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 3 }]);
  const plain = buildGrowthMoment({ scaffolds: [s] });
  const fast = buildGrowthMoment({ scaffolds: [s], acceleratedIds: [ERA6[0]] });

  assert.doesNotMatch(plain.detail, /Tăng tốc/, 'phiên thường KHÔNG được nhận công của Tăng tốc');
  assert.match(fast.detail, /Tăng tốc/, 'Tăng tốc đẩy thêm một bước mà không nói gì');
  assert.ok(fast.detail.startsWith(plain.detail), 'phần tin gốc (còn bao nhiêu phiên) không được mất đi');

  // Đẩy nhanh công trình KHÁC thì không được ăn theo.
  const other = buildGrowthMoment({ scaffolds: [s], acceleratedIds: [ERA6[1]] });
  assert.doesNotMatch(other.detail, /Tăng tốc/);
});

test('tiến độ luôn nằm trong [0,1] kể cả khi dữ liệu vào hỏng', () => {
  // Tiến độ chảy thẳng vào chiều rộng một thanh CSS. Số âm hoặc >1 sẽ vẽ ra một thanh tràn khỏi
  // thẻ — hỏng theo kiểu nhìn thấy được, ngay giữa khoảnh khắc đáng lẽ phải đẹp nhất.
  for (const progress of [-3, 5, NaN, undefined, 'x']) {
    const moment = buildGrowthMoment({
      scaffolds: [{ bpId: ERA6[0], label: 'X', icon: '🏗️', remaining: 2, progress }],
    });
    assert.ok(moment.progress >= 0 && moment.progress <= 1, `tiến độ ${progress} lọt ra ngoài [0,1]`);
  }
});

test('VẠCH XUẤT PHÁT của thanh tiến độ là con số THẬT của phiên trước, không phải đoán', () => {
  // Cái thanh này sinh ra để khoe "vừa nhích thêm một nấc". Vẽ sai vạch xuất phát thì nó đang nói
  // dối về đúng thứ nó tồn tại để nói.
  const [s] = scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 2 }]);
  const total = s.total;

  const plain = buildGrowthMoment({ scaffolds: [s] });
  assert.equal(plain.progress, 1 - 2 / total);
  assert.equal(plain.fromProgress, 1 - 3 / total, 'một phiên thường = lùi đúng 1 bước');

  // Đặc quyền "Tăng tốc" đẩy THÊM 1 bước ⇒ vạch xuất phát phải lùi 2 bước.
  const fast = buildGrowthMoment({ scaffolds: [s], acceleratedIds: [ERA6[0]] });
  assert.equal(fast.fromProgress, 1 - 4 / total);
  assert.ok(fast.fromProgress < plain.fromProgress, 'tăng tốc phải cho cú nhảy DÀI hơn');

  // Đẩy nhanh công trình KHÁC thì không được ăn theo.
  const other = buildGrowthMoment({ scaffolds: [s], acceleratedIds: [ERA6[1]] });
  assert.equal(other.fromProgress, plain.fromProgress);
});

test('vạch xuất phát không bao giờ âm, và luôn ≤ vạch đích', () => {
  for (const remaining of [0, 1, 5, 99]) {
    const [s] = scaffoldsFor([{ bpId: ERA6[3], sessionsRemaining: remaining }]);
    for (const ids of [[], [ERA6[3]]]) {
      const m = buildGrowthMoment({ scaffolds: [s], acceleratedIds: ids });
      assert.ok(m.fromProgress >= 0 && m.fromProgress <= 1, 'vạch xuất phát lọt ngoài [0,1]');
      assert.ok(m.fromProgress <= m.progress, 'thanh tiến độ chạy LÙI — nhìn như vừa mất tiến độ');
    }
  }
  // Thiếu tổng số phiên (dữ liệu lạ) ⇒ chạy từ 0, không ném lỗi, không ra NaN.
  const odd = buildGrowthMoment({ scaffolds: [{ bpId: 'x', label: 'X', remaining: 1, progress: 0.5 }] });
  assert.equal(odd.fromProgress, 0);
});

test('bpId lạ bị BỎ QUA chứ không dựng một khoảnh khắc rỗng', () => {
  assert.equal(buildGrowthMoment({ newlyBuilt: ['bp_khong_ton_tai'] }), null);
  // Lẫn lộn thật/giả thì vẫn phải khoe cái thật.
  const mixed = buildGrowthMoment({ newlyBuilt: ['bp_khong_ton_tai', ERA6[2]] });
  assert.equal(mixed.bpId, ERA6[2]);
});

test('dữ liệu rác không được ném lỗi — đây là màn hình chạy NGAY SAU khi phiên xong', () => {
  // Ném lỗi ở đây là chặn mất hộp thoại phần thưởng của một phiên làm việc thật.
  for (const bad of [{ newlyBuilt: 'x', scaffolds: 'y' }, { newlyBuilt: null, scaffolds: null },
    { scaffolds: [null, undefined, {}] }]) {
    assert.doesNotThrow(() => buildGrowthMoment(bad));
  }
});

// ─── buildFocusTease — điều đáng nói TRƯỚC/TRONG phiên ───────────────────────

test('TRƯỚC PHIÊN: sắp xong thì phải nói TO — đó mới là lúc đáng bấm Bắt đầu', () => {
  // Cả nội dung cảm xúc của tính năng này nằm ở đây. "Còn 4 phiên" là thông tin; "phiên tới là
  // xong" là một lý do để bắt đầu ngay bây giờ. Gộp hai thứ vào cùng một câu là mất phần thứ hai.
  const one = buildFocusTease({ scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 1 }]) });
  assert.equal(one.tone, 'imminent');
  assert.match(one.text, /Phiên tới hoàn thành/);
  assert.doesNotMatch(one.text, /còn 1 phiên/);

  const far = buildFocusTease({ scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 4 }]) });
  assert.equal(far.tone, 'progress');
  assert.match(far.text, /còn 4 phiên/);
});

test('TRƯỚC PHIÊN: "còn 0 phiên" cũng là sắp xong, không phải một câu cụt', () => {
  const zero = buildFocusTease({ scaffolds: scaffoldsFor([{ bpId: ERA6[0], sessionsRemaining: 0 }]) });
  assert.equal(zero.tone, 'imminent');
  assert.doesNotMatch(zero.text, /còn 0/);
});

test('TRƯỚC PHIÊN: nói về ĐÚNG công trình mà bảng "Đang xây" xếp đầu', () => {
  // Hai màn hình nói về hai công trình khác nhau thì Đàm sẽ tưởng app đang đếm hai thứ.
  const scaffolds = scaffoldsFor([
    { bpId: ERA6[0], sessionsRemaining: 5 },
    { bpId: ERA6[1], sessionsRemaining: 2 },
  ]);
  const tease = buildFocusTease({ scaffolds });
  const moment = buildGrowthMoment({ scaffolds });
  assert.equal(tease.bpId, ERA6[1]);
  assert.equal(tease.bpId, moment.bpId, 'hai đầu của một phiên đang nói về hai công trình khác nhau');
});

test('XƯỞNG TRỐNG: người ĐÃ từng xây thì được nghe sự thật; người MỚI thì được yên', () => {
  // ⚠️ Đây là bài giữ cho tính năng này không biến thành cằn nhằn. Người mới chưa có xưởng để mà
  // trống — nhắc lúc đó là trách móc một việc họ còn chưa biết là có.
  const veteran = buildFocusTease({ scaffolds: [], hasBuilt: true });
  assert.equal(veteran.tone, 'idle');
  assert.match(veteran.text, /không đẩy công trình nào tiến thêm/);

  assert.equal(buildFocusTease({ scaffolds: [], hasBuilt: false }), null);
  assert.equal(buildFocusTease({}), null);
  assert.equal(buildFocusTease(), null, 'gọi không tham số cũng không được ném lỗi');
});

test('TRƯỚC PHIÊN: KHÔNG hứa hẹn gì về nguyên liệu', () => {
  // Luật "bản vẽ nào khởi công được" là của BuildingWorkshop (unlock · đúng kỷ · chưa xây · đủ
  // tài nguyên). Một lời mời "xây đi" mà bấm vào thì không đủ nguyên liệu còn tệ hơn im lặng.
  const idle = buildFocusTease({ scaffolds: [], hasBuilt: true });
  for (const word of [/nguyên liệu/i, /đủ/i, /hãy /i, /xây ngay/i]) {
    assert.doesNotMatch(idle.text, word, `câu xưởng-trống đang hứa hẹn điều nó không kiểm được: ${word}`);
  }
});

test('TRƯỚC PHIÊN: tiến độ nằm trong [0,1] và dữ liệu rác không ném lỗi', () => {
  for (const bad of [{ scaffolds: 'x' }, { scaffolds: [null, undefined, {}] },
    { scaffolds: [{ bpId: 'x', label: 'X', remaining: NaN, progress: 9 }] }]) {
    assert.doesNotThrow(() => buildFocusTease(bad));
  }
  const odd = buildFocusTease({ scaffolds: [{ bpId: 'x', label: 'X', remaining: 3, progress: 9 }] });
  assert.ok(odd.progress >= 0 && odd.progress <= 1);
});

// ─── XƯỞNG TRỐNG: thành phố vẫn nhúc nhích, và nay nó nói ra ─────────────────

test('XƯỞNG TRỐNG mà vẫn có tin thật: mỗi phiên mở thêm một đoạn đường', () => {
  // Đàm 2026-08-14: *"mỗi phiên hoàn thành thì phải có nhà xây lên hay gì đó"*.
  // Trước bản này, nhánh 3 trả `null` — tức 95% số phiên (con số đo được ở `TECH_DEBT #14`) kết
  // thúc trong im lặng hoàn toàn. Cách chữa RẺ là in một câu động viên chung chung, và luật trung
  // thực ở đầu `cityMoment.js` cấm đúng điều đó. Cách chữa ĐÚNG là hỏi lại câu chưa ai hỏi:
  // *phiên vừa rồi có thật sự không đổi gì không?* — không hề, mạng đường vẫn mở thêm một ô.
  const moment = buildGrowthMoment({
    newlyBuilt: [], scaffolds: [], acceleratedIds: [],
    era: 1, buildingCount: 5, sessionCount: 12, streakLength: 6,
  });
  assert.ok(moment, 'xưởng trống ⇒ vẫn im lặng, yêu cầu của Đàm chưa được đáp ứng');
  assert.equal(moment.kind, 'tick');
  assert.ok(moment.detail.includes('đường'), `câu nói không nhắc tới thứ vừa đổi: "${moment.detail}"`);
  // Thanh tiến độ phải NHÍCH — đó là toàn bộ nội dung cảm xúc của màn này.
  assert.ok(moment.progress > moment.fromProgress,
    'thanh tiến độ đứng yên ⇒ màn hình khoe một thứ không nhúc nhích');
});

test('KHÔNG KHOE THỨ KHÔNG XẢY RA: mạng đường mở hết thì nhánh đường tự tắt', () => {
  // ⚠️ Đây là vế giữ cho nhánh mới không thành một lời khen rỗng. Nó KHÔNG dựa vào ai đó nhớ sửa
  // một hằng số: hàm đo lại bằng chính `deriveProps` đang dựng thành phố, nên ngày mạng đường mở
  // hết là ngày nhánh ấy tự im.
  const late = buildGrowthMoment({
    newlyBuilt: [], scaffolds: [], acceleratedIds: [],
    era: 1, buildingCount: 5, sessionCount: 500, streakLength: 200,
  });
  assert.ok(!late || !late.detail.includes('đường'),
    `phiên thứ 500 vẫn khoe "mở thêm đường" trong khi mạng đã kín: "${late?.detail}"`);

  // Và chưa có công trình nào thì tuyệt đối im lặng — chưa có đường, chưa có cư dân, chưa có gì.
  assert.equal(buildGrowthMoment({
    newlyBuilt: [], scaffolds: [], acceleratedIds: [],
    era: 1, buildingCount: 0, sessionCount: 9, streakLength: 3,
  }), null);
});

test('CÔNG TRƯỜNG VẪN THẮNG ĐƯỜNG SÁ — tin lớn hơn phải nói trước', () => {
  const withScaffold = buildGrowthMoment({
    newlyBuilt: [],
    scaffolds: [{ bpId: 'bp_x', label: 'Lều Đá', icon: '🛖', remaining: 2, total: 5, progress: 0.6 }],
    era: 1, buildingCount: 5, sessionCount: 12, streakLength: 6,
  });
  assert.equal(withScaffold.kind, 'scaffold', 'đường sá chen lên trước công trường đang xây');

  const withBuilt = buildGrowthMoment({
    newlyBuilt: [ERA6[0]], scaffolds: [], acceleratedIds: [],
    era: 1, buildingCount: 5, sessionCount: 12, streakLength: 6,
  });
  assert.equal(withBuilt.kind, 'built', 'công trình vừa xong mà lại đi khoe một đoạn đường');
});

test('CHỖ GỌI CŨ KHÔNG PHẢI SỬA GÌ: thiếu số liệu ⇒ im lặng như hành vi cũ', () => {
  assert.equal(buildGrowthMoment({ newlyBuilt: [], scaffolds: [], acceleratedIds: [] }), null);
  assert.equal(buildGrowthMoment(), null);
});
