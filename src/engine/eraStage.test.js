import test from 'node:test';
import assert from 'node:assert/strict';

import { ERA_METADATA, ERA_THRESHOLDS } from './constants.js';
import {
  describeStageCountdown,
  getEraStage,
  medianSessionEP,
  sessionsToStageEnd,
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
