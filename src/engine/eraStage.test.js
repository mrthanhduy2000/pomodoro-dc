import test from 'node:test';
import assert from 'node:assert/strict';

import { ERA_METADATA, ERA_THRESHOLDS } from './constants.js';
import {
  describeStageCountdown,
  getEraStage,
  medianSessionEP,
  pickStageCelebration,
  sessionsToStageEnd,
  STAGE_COUNTDOWN_MAX_SESSIONS,
  stageMilestoneKey,
} from './eraStage.js';

test('mọi kỷ đều chia được chặng, và các chặng phủ KÍN quãng của kỷ', () => {
  // Quan hệ, không phải con số: bảng ngưỡng đổi thì bài test này vẫn đúng.
  for (let era = 1; era <= 15; era += 1) {
    const stages = ERA_METADATA[era]?.stages;
    assert.ok(Array.isArray(stages) && stages.length > 0, `kỷ ${era} không khai chặng nào`);

    const eraStart = ERA_THRESHOLDS[`ERA_${era - 1}_END`] ?? 0;
    const eraEnd = ERA_THRESHOLDS[`ERA_${era}_END`];
    assert.equal(stages[0].epStart, eraStart, `kỷ ${era}: chặng đầu không bắt đầu ở đầu kỷ`);
    assert.equal(stages[stages.length - 1].epEnd, eraEnd, `kỷ ${era}: chặng cuối không kết thúc ở cuối kỷ`);

    // Không có khe hở giữa hai chặng — một khe hở nghĩa là có vùng EP không thuộc chặng nào.
    for (let i = 1; i < stages.length; i += 1) {
      assert.equal(stages[i].epStart, stages[i - 1].epEnd, `kỷ ${era}: hở giữa chặng ${i} và ${i + 1}`);
    }
  }
});

test('EP ở ĐÚNG mốc đầu một chặng thì đã thuộc chặng đó', () => {
  // ⚠️ Biên. `>=` hay `>` ở đây quyết định người chơi vừa đủ EP thấy "chặng 2" hay vẫn "chặng 1",
  // và sai một nấc thì thanh tiến độ nhảy về 100% thay vì 0% — trông y hệt một lỗi hiển thị.
  const stages = ERA_METADATA[2].stages;
  const s = getEraStage(2, stages[1].epStart);
  assert.equal(s.index, 1);
  assert.equal(s.epInStage, 0, 'vừa vào chặng mới thì tiến độ phải là 0, không phải đầy');
  assert.equal(s.progress, 0);
});

test('tiến độ tính theo mốc TUYỆT ĐỐI, không trừ nhầm gốc kỷ', () => {
  // ⚠️ `epStart` của chặng đã tính từ EP tổng cả ván. Trừ thêm `eraStart` lần nữa ra số ÂM ở mọi
  // kỷ trừ kỷ 1 — mà kỷ 1 lại là kỷ duy nhất tài khoản mới đi qua, nên lỗi ấy sẽ không lộ ra khi thử.
  for (let era = 1; era <= 15; era += 1) {
    const stages = ERA_METADATA[era].stages;
    const giua = Math.round((stages[0].epStart + stages[0].epEnd) / 2);
    const s = getEraStage(era, giua);
    assert.ok(s.progress > 0.3 && s.progress < 0.7, `kỷ ${era}: giữa chặng mà tiến độ ra ${s.progress}`);
    assert.ok(s.epInStage > 0, `kỷ ${era}: EP trong chặng ra ${s.epInStage}`);
  }
});

test('CHẶNG NGẮN HƠN KỶ ĐÁNG KỂ — đây là toàn bộ lý do file này tồn tại', () => {
  // Nếu một ngày ai đó đổi `makeEraStages` thành một chặng duy nhất thì thanh chặng lại dài đúng
  // bằng thanh kỷ, và cả thay đổi này thành vô nghĩa mà không có gì báo.
  for (let era = 1; era <= 15; era += 1) {
    const eraStart = ERA_THRESHOLDS[`ERA_${era - 1}_END`] ?? 0;
    const eraGap = ERA_THRESHOLDS[`ERA_${era}_END`] - eraStart;
    const s = getEraStage(era, eraStart);
    assert.ok(s.epRange <= eraGap / 2, `kỷ ${era}: chặng dài ${s.epRange} trên quãng kỷ ${eraGap} — không ngắn hơn đáng kể`);
  }
});

test('đích của phép đếm ngược là chặng KẾ TIẾP, không phải chặng đang đứng', () => {
  // ⚠️ Bản đầu viết "còn 3 phiên nữa tới «{label}»" — tức hứa hẹn thứ người chơi ĐANG ĐỨNG TRONG.
  const stages = ERA_METADATA[2].stages;
  const dau = getEraStage(2, stages[0].epStart + 10);
  assert.equal(dau.nextLabel, stages[1].label);
  assert.ok(describeStageCountdown(dau, 50).text.includes(stages[1].label));
  assert.ok(!describeStageCountdown(dau, 50).text.includes(stages[0].label),
    'câu đếm ngược đang nhắc tên chặng HIỆN TẠI');

  // Chặng cuối: đích là cả một kỷ mới, và phải gọi đúng tên đó.
  const cuoi = getEraStage(2, stages[2].epStart + 10);
  assert.equal(cuoi.nextLabel, null);
  assert.ok(describeStageCountdown(cuoi, 50).text.includes('KỶ MỚI'));
});

test('nhịp lấy TRUNG VỊ, và chưa đủ mẫu thì trả null chứ không bịa', () => {
  assert.equal(medianSessionEP([]), null);
  assert.equal(medianSessionEP(null), null);
  assert.equal(medianSessionEP([{ epEarned: 0 }, { epEarned: -5 }]), null, 'phiên 0 EP không phải một nhịp');

  // ⚠️ Một phiên 90 phút lẫn giữa mấy phiên 25 phút: TRUNG BÌNH ra 118 và biến "còn 3 phiên"
  // thành "còn 1 phiên" — một lời hứa hụt. Trung vị chịu được ngoại lệ.
  const lichSu = [30, 30, 500, 30, 30].map((ep) => ({ epEarned: ep }));
  assert.equal(medianSessionEP(lichSu), 30);
});

test('đếm ngược LÀM TRÒN LÊN, và 0 EP còn lại không phải "null"', () => {
  // Làm tròn xuống là hứa một thứ sẽ không xảy ra.
  assert.equal(sessionsToStageEnd(101, 50), 3);
  assert.equal(sessionsToStageEnd(100, 50), 2);
  // ⚠️ Hai ca "không có gì để đếm" KHÁC NHAU: đã tới đích (0) vs không biết nhịp (null).
  assert.equal(sessionsToStageEnd(0, 50), 0, 'đã tới đích ⇒ 0, không phải null');
  assert.equal(sessionsToStageEnd(100, null), null, 'không biết nhịp ⇒ null, không phải một con số bịa');
});

test('còn ≤1 phiên thì đổi giọng — chỗ dopamine mạnh nhất là NGAY TRƯỚC đích', () => {
  const stages = ERA_METADATA[2].stages;
  const sapToi = getEraStage(2, stages[0].epEnd - 40);
  assert.equal(describeStageCountdown(sapToi, 50).tone, 'imminent');

  const conXa = getEraStage(2, stages[0].epStart + 10);
  assert.equal(describeStageCountdown(conXa, 50).tone, 'normal',
    'mọi lúc đều "imminent" thì chẳng còn gì để nổi bật khi đáng');

  assert.equal(describeStageCountdown(null, 50), null, 'không có chặng ⇒ không render gì');
});

/* ─── KHOẢNH KHẮC VỪA VƯỢT CHẶNG ─────────────────────────────────────────────── */

test('mốc LUÔN tăng khi đi tới, kể cả lúc sang kỷ mới', () => {
  // ⚠️ Lên kỷ thì chỉ số chặng quay về 0. So riêng chỉ số sẽ đọc bước tiến LỚN NHẤT game thành
  // một bước LÙI — và hậu quả là đúng cái mốc đáng ăn mừng nhất thì im lặng.
  assert.ok(stageMilestoneKey(9, 0) > stageMilestoneKey(8, 2), 'sang kỷ mới mà mốc lại tụt');

  // Duyệt cả 15 kỷ × mọi chặng: dãy mốc phải đơn điệu tăng, không một chỗ nào hụt.
  let truoc = -1;
  for (let era = 1; era <= 15; era += 1) {
    const total = ERA_METADATA[era].stages.length;
    assert.ok(total < 10, `kỷ ${era} có ${total} chặng — phép nhân 10 của stageMilestoneKey hết đúng`);
    for (let i = 0; i < total; i += 1) {
      const key = stageMilestoneKey(era, i);
      assert.ok(key > truoc, `mốc không tăng ở kỷ ${era} chặng ${i}`);
      truoc = key;
    }
  }
});

test('máy chưa từng ghi dấu ⇒ IM LẶNG, không khen cho chặng đã qua từ lâu', () => {
  // ⚠️ Cái bẫy đã cắn thật ở `navAttention.js`: không có luật này thì lần đầu mở app sau bản cập
  // nhật, Đàm nhận một lời chúc mừng cho việc anh làm xong từ nhiều tuần trước.
  const stage = getEraStage(8, 20340);
  assert.equal(pickStageCelebration(stage, 8, null), null);
  assert.equal(pickStageCelebration(stage, 8, undefined), null);
  assert.equal(pickStageCelebration(null, 8, 0), null, 'không có chặng ⇒ không có gì để khen');
});

test('chỉ khen khi THẬT SỰ vượt mốc, và khen đúng MỘT lần', () => {
  const stage = getEraStage(8, 20340);            // kỷ 8, chặng 1 (index 0)
  const key = stageMilestoneKey(8, stage.index);

  // Đã thấy mốc này rồi ⇒ im.
  assert.equal(pickStageCelebration(stage, 8, key), null, 'khen lại một mốc đã khen');
  // Dấu cũ hơn ⇒ có mốc mới để khen, và nó trả về đúng key để ghi lại.
  const mung = pickStageCelebration(stage, 8, key - 1);
  assert.ok(mung && mung.key === key);
  assert.ok(mung.text.includes(stage.label), 'lời khen không nhắc tên chặng vừa mở');

  // Thăng hoa đưa về kỷ 1 ⇒ mốc TỤT ⇒ không khen.
  const dauKy = getEraStage(1, 100);
  assert.equal(pickStageCelebration(dauKy, 1, stageMilestoneKey(8, 2)), null,
    'reset tiến độ mà vẫn chúc mừng "đã mở chặng 1"');
});

test('mốc còn QUÁ XA ⇒ im lặng, không in ra một con số làm nản', () => {
  // ⚠️ Bài học đo được từ ảnh chụp: bản đầu in *"Còn ~64 phiên nữa tới «Thương Mại Toàn Cầu»"* —
  // một cái đích xa tới mức nó làm nản chứ không kéo, mà lại chiếm đúng chỗ một câu cổ vũ.
  const stages = ERA_METADATA[8].stages;
  const dauChang = getEraStage(8, stages[1].epStart + 10);
  const nhipRatCham = 5;   // 5 EP/phiên ⇒ còn hàng trăm phiên
  assert.equal(describeStageCountdown(dauChang, nhipRatCham), null);

  // Ngay tại trần thì VẪN nói — biên phải nằm đúng chỗ khai, không lệch một nấc.
  const epPerSession = dauChang.epRemaining / STAGE_COUNTDOWN_MAX_SESSIONS;
  assert.ok(describeStageCountdown(dauChang, epPerSession), `${STAGE_COUNTDOWN_MAX_SESSIONS} phiên phải còn nói`);
  const quaTran = dauChang.epRemaining / (STAGE_COUNTDOWN_MAX_SESSIONS + 1);
  assert.equal(describeStageCountdown(dauChang, quaTran), null, 'quá trần một nấc mà vẫn nói');
});

test('chưa biết nhịp thì VẪN nói bằng EP — trần chỉ áp cho con số PHIÊN', () => {
  // Trần là về "còn bao nhiêu PHIÊN", mà chưa đủ mẫu thì không có con số phiên nào để mà xa.
  // Chặn luôn cả ca này là làm người mới mất hẳn cái đích ngay lúc họ cần nó nhất.
  const stage = getEraStage(8, ERA_METADATA[8].stages[1].epStart + 10);
  const ra = describeStageCountdown(stage, null);
  assert.ok(ra && /EP nữa tới/.test(ra.text), 'chưa biết nhịp mà đã im lặng');
});
