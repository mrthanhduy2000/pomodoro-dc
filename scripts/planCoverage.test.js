/**
 * planCoverage.test.js — KHOÁ PHÉP ĐO "NHÀ CHE BAO NHIÊU PHẦN ĐẤT".
 *
 * Vì sao có file này (2026-08-19): phép đo cũ nói quá **11,10 điểm phần trăm trung bình, tới
 * 24,12 đpt**, và nó nói quá suốt nhiều ngày mà không gì đỏ lên — vì nó chỉ được so với chính nó.
 * Con số ấy đã đi thẳng vào một bảng Đàm dùng để ra quyết định mật độ ("nhà che 72,4% mặt đất ở 80
 * phiên" — sự thật là 55,8%).
 *
 * ⚠️ Cả bốn đối chứng dưới đây từng nằm trong cờ `--sai-so` của `plan-coverage.mjs`, tức chỉ chạy
 * khi có người nhớ gõ. Đúng bài học đã ghi ở `CLAUDE.md`: *một bài học được ghi ra KHÔNG chặn được
 * gì; chỉ một bài TEST mới chặn được* — nên chúng phải nằm trong `npm test`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  daysGiacDay, planCoverage, planCoverageCu, planCoverageTheoCach,
} from './plan-coverage.mjs';

/** Diện tích đa giác (công thức dây giày). Dùng để hỏi hình học, không hỏi phép tô. */
function dienTich(poly) {
  let a = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i, i += 1) {
    a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]);
  }
  return Math.abs(a) / 2;
}

test('ĐA GIÁC ĐÁY — mỗi ca chạm ĐÚNG MỘT chiều mà phép đo tuyên bố nhìn thấy', () => {
  // (1) Hộp vuông: đa giác phải TRÙNG KHÍT hộp bao. Đây là chỗ hai cách đo buộc phải bằng nhau —
  //     nếu ca này sai thì mọi hiệu số A→D bên dưới là rác, vì nền của phép so đã lệch.
  assert.ok(
    Math.abs(dienTich(daysGiacDay({ shape: 'prism', x: 0, z: 0, w: 1, d: 1, sides: 4, ry: 0 })) - 1) < 1e-9,
    'hộp vuông 1×1 phải ra diện tích đúng 1',
  );
  // (2) Trụ tròn: π/4 — chiều "hình của khối", thứ hộp bao không thấy được.
  const tron = dienTich(daysGiacDay({ shape: 'prism', x: 0, z: 0, w: 1, d: 1, sides: 64, ry: 0 }));
  assert.ok(Math.abs(tron - Math.PI / 4) < 0.002, `trụ tròn phải ≈ π/4, đo được ${tron}`);
  // (3) Khối XOAY: chiều thứ ba, và là chiều duy nhất mà `specBounds` cố ý bỏ qua (xem `pick.js`).
  //     Hình vuông xoay 45° có hộp bao gấp ĐÔI diện tích thật.
  const xoay = daysGiacDay({ shape: 'prism', x: 0, z: 0, w: 1, d: 1, sides: 4, ry: Math.PI / 4 });
  const canhHopBao = Math.max(...xoay.map((p) => p[0])) - Math.min(...xoay.map((p) => p[0]));
  assert.ok(Math.abs(canhHopBao ** 2 - 2) < 1e-6, `hộp bao của vuông xoay 45° phải gấp 2 lần, ra ${canhHopBao ** 2}`);
  // (4) `gable` (mái dốc hai phía) chiếm TRỌN hình chữ nhật khi nhìn từ trên xuống, BẤT KỂ các
  //     trường của `prism` có mặt hay không.
  //     ⚠️ Ca này phải gài `sides: 8` mới có răng. Bản đầu viết `{shape:'gable', w:2, d:3}` rồi
  //     đòi diện tích 6 — và phép phá "cho gable rơi vào nhánh prism" KHÔNG đỏ, vì lăng trụ 4 cạnh
  //     có đáy TRÙNG KHÍT hình chữ nhật (`rx = (w/2)/cos(π/4)`, đỉnh ở 45° ⇒ đúng ±w/2). Hai nhánh
  //     ra cùng kết quả nên bài test không phân biệt được chúng. Cùng họ với bài học "ba dải bằng
  //     nhau làm lỗi bước-nhảy-cố-định tàng hình" — LỖI NẰM Ở DỮ LIỆU THỬ, không ở phép phá.
  assert.ok(
    Math.abs(dienTich(daysGiacDay({ shape: 'gable', x: 0, z: 0, w: 2, d: 3, sides: 8, ry: 0 })) - 6) < 1e-9,
    'gable 2×3 phải ra diện tích đúng 6 kể cả khi khối có trường `sides`',
  );
});

test('HAI CÁCH TÔ HÌNH phải ra lưới GIỐNG HỆT ở chỗ chúng buộc phải giống', () => {
  // Ép mọi khối thành hộp vuông không xoay ⇒ "hộp bao từng khối" và "đa giác đáy" là CÙNG một hình.
  // Không có vế này thì hai đường đo chỉ là hai công cụ khác nhau tình cờ ra số gần nhau — chưa
  // chứng minh được cái nào đúng (đúng bài học "đối chiếu chéo" của Phase 12).
  for (const era of [1, 6, 11, 15]) {
    const a = planCoverageTheoCach(era, 50, { hinh: 'khoi', epVuong: true }).luoi;
    const b = planCoverageTheoCach(era, 50, { hinh: 'daGiac', epVuong: true }).luoi;
    let lech = 0;
    for (let i = 0; i < a.length; i += 1) if (a[i] !== b[i]) lech += 1;
    assert.equal(lech, 0, `kỷ ${era}: ép-vuông mà hai bộ tô vẫn lệch ${lech} ô mẫu`);
  }
});

test('BỘ TÔ MỚI TÁI LẬP ĐÚNG con số bản cũ ở đúng tổ hợp nó mô phỏng', () => {
  // Nếu không khoá vế này thì con số "nói quá 11,10 đpt" có thể chỉ là chênh lệch giữa hai chương
  // trình khác nhau, chứ không phải chênh lệch do luật tô + hộp bao gây ra.
  for (const era of [1, 7, 15]) {
    for (const m of [20, 50, 80]) {
      const cu = planCoverageCu(era, m).phuNha;
      const moi = planCoverageTheoCach(era, m, { hinh: 'toaNha', luat: 'bao' }).phuNha;
      assert.ok(Math.abs(cu - moi) < 1e-12, `kỷ ${era} @ ${m}p: bản cũ ${cu} ≠ mô phỏng ${moi}`);
    }
  }
});

test('ĐỐI CHỨNG NHỐT BỘ SỐ HỎNG CŨ — phép đo phải CÒN BẮT ĐƯỢC sai số đã tìm ra', () => {
  // ⚠️ Đây là bài giữ cho `planCoverage` không lặng lẽ trôi ngược về bản cũ (hoặc về một bản
  // "gần đúng" nào đó). Nó khoá một QUAN HỆ, không khoá một con số: bản cũ phải LỚN HƠN bản đúng
  // ở MỌI kỷ và MỌI mốc — vì cả hai nguồn nói quá đều chỉ có thể cộng thêm, không bao giờ trừ đi.
  let nhoNhat = Infinity, lonNhat = -Infinity;
  for (let era = 1; era <= 15; era += 1) {
    for (const m of [20, 50, 80]) {
      const lech = (planCoverageCu(era, m).phuNha - planCoverage(era, m).phuNha) * 100;
      assert.ok(lech > 0, `kỷ ${era} @ ${m}p: bản cũ phải nói quá, nhưng lệch ${lech.toFixed(2)} đpt`);
      if (lech < nhoNhat) nhoNhat = lech;
      if (lech > lonNhat) lonNhat = lech;
    }
  }
  // Và sai số phải còn ĐỦ LỚN để đáng gọi là sai số — nếu ai đó "sửa" bằng cách nới bản đúng lên
  // cho gần bản cũ thì bài này đỏ.
  // ⚠️ HAI NGƯỠNG NÀY LẤY TỪ PHÉP ĐO, KHÔNG ĐOÁN. Số đo được lúc viết (lưới 16 mẫu/ô):
  //    nhỏ nhất **3,65 đpt** (kỷ 11 @ 20 phiên) · lớn nhất **24,47 đpt** (kỷ 6 @ 80 phiên).
  //    Bản đầu của chính bài test này viết sàn 4 vì chép nhầm con số của lưới 8 mẫu/ô — và nó ĐỎ,
  //    đúng như một ngưỡng đoán bừa phải bị đỏ. Khoảng cách giữa giá trị thật và ngưỡng chính là
  //    phần đang không được bảo vệ (bài học Phase 9A), nên để sát: 3,0 và 20,0.
  assert.ok(lonNhat > 20, `sai số lớn nhất phải còn > 20 đpt, đo được ${lonNhat.toFixed(2)}`);
  assert.ok(nhoNhat > 3, `sai số nhỏ nhất phải còn > 3 đpt, đo được ${nhoNhat.toFixed(2)}`);
});

/*
 * ⚠️ MỘT CHIỀU KHÔNG ĐƯỢC KHOÁ, VÀ ĐÓ LÀ CÓ LÝ — ghi ra để phiên sau khỏi tưởng là lỗ hổng.
 * Phép phá "lấy mẫu ở GÓC ô thay vì TÂM ô" (`trongDaGiac(x, y, …)`) KHÔNG làm đỏ bài nào. Đã đo
 * thật thay vì suy đoán: kỷ 1/6/11/15 @ 50 phiên đi từ 12,296 · 52,963 · 37,837 · 29,168 sang
 * 12,147 · 53,158 · 37,396 · 29,604 — lệch 0,15–0,44 đpt và lệch theo **CẢ HAI CHIỀU**. Đó đúng
 * là dấu vân tay của một phép TỊNH TIẾN lưới lấy mẫu, không phải một phép PHÓNG TO: nó đổi xem ô
 * mẫu nào rơi vào đâu, chứ không thổi hình to ra. Khác hẳn luật `bao` — thứ chỉ có thể cộng thêm,
 * ở cả bốn cạnh, nên nói quá 6,11 đpt một chiều. Viết thêm một bài để bắt M7 là mua một hàng rào
 * cho thứ không chạy mất.
 */

test('PHÉP ĐO ĐÚNG vẫn giữ hai lời hứa nền của bản cũ', () => {
  // (a) Thành phố càng nhiều phiên càng đông — không có vế này thì một hàm trả hằng số cũng "xanh".
  for (const era of [1, 7, 15]) {
    const tre = planCoverage(era, 20).phuNha;
    const gia = planCoverage(era, 80).phuNha;
    assert.ok(gia > tre, `kỷ ${era}: 80 phiên (${gia}) phải đông hơn 20 phiên (${tre})`);
  }
  // (b) Phép lấy HỢP không được vượt 100% — chính con số 109,9% của bản cộng-dồn đời đầu là thứ
  //     đã lộ ra rằng bản ấy sai.
  for (let era = 1; era <= 15; era += 1) {
    for (const m of [20, 50, 80, 200]) {
      const v = planCoverage(era, m).phuNha;
      assert.ok(v <= 1.0000001, `kỷ ${era} @ ${m}p phủ ${(v * 100).toFixed(1)}% — đang cộng chồng`);
    }
  }
});
