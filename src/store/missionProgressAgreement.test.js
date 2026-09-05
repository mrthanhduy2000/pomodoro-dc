import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const SRC = readFileSync(new URL('./gameStore.js', import.meta.url), 'utf8');

// ⚠️ VÌ SAO BỘ NÀY TỒN TẠI. Tiến độ nhiệm vụ ngày được tính ở HAI đường trong CÙNG file
// `gameStore.js`, cách nhau ~1.300 dòng:
//   · đường SỐNG — ngay sau khi chốt một phiên (`completeFocusSession`);
//   · đường DỰNG LẠI — `getDailyMissionProgressFromSnapshot`, chạy khi nạp app / đồng bộ về.
// Trước 2026-09-05 hai đường ấy **lệch nhau ở loại `singleSession`**: đường sống ăn-cả-hoặc-không
// (`minutesFocused >= goal ? goal : progress`), đường dựng lại thì liên tục
// (`min(goal, maxSessionMinutes)`). Hậu quả trên máy Đàm: làm một phiên 22 phút thì thanh ghi
// **0/30**, tải lại app thì chính nó ghi **22/30** — cùng một ngày, cùng một dữ liệu, hai con số.
// Build xanh · lint sạch · test xanh; triệu chứng duy nhất là một con số tự đổi khi mở lại.
// Đúng luật của dự án: *một luật một công thức*.

/**
 * Cắt thân một khối theo một mốc, và ĐÒI mốc ấy chỉ xuất hiện ĐÚNG MỘT LẦN.
 *
 * ⚠️ VẾ "ĐÚNG MỘT LẦN" LÀ VẾ CỨU BÀI TEST NÀY. Bản đầu neo vào
 * `const updatedMissionList = refreshedMissions.list.map` — chuỗi ấy có **HAI** chỗ trong
 * `gameStore.js`, và chỗ ĐẦU là một khối hẹp chỉ lo `perfectBreaks`. `indexOf` từ đầu file bắt
 * đúng khối sai, nên bài test đỏ với thông báo trỏ vào một loại nhiệm vụ hoàn toàn lành. Đây là
 * cùng cái bẫy đã cắn ở `App.jsx` (`<PomodoroEngine>` dựng ở hai nhánh) — nay nó tự kêu thay vì
 * lặng lẽ đo nhầm chỗ.
 */
function block(anchor, len) {
  const n = SRC.split(anchor).length - 1;
  assert.equal(n, 1, `mốc "${anchor}" khớp ${n} chỗ — phải khớp đúng 1, nếu không đang cắt nhầm khối`);
  return SRC.slice(SRC.indexOf(anchor), SRC.indexOf(anchor) + len);
}

/** Khối cập nhật tiến độ NGAY SAU KHI CHỐT PHIÊN. Neo vào dòng chỉ nó mới có. */
const SONG = block("if (m.type === 'sessions') progress = Math.min(m.goal, progress + 1);", 2200);

// ⚠️ Bài chính, và là bài bắt được lỗi thật. `singleSession` là loại DUY NHẤT mà "tiến độ" không
// phải phép cộng dồn — nó là ĐỘ DÀI CỦA PHIÊN DÀI NHẤT trong ngày. Cả hai đường phải nói đúng
// điều đó, tức phải là một phép LẤY MAX bị kẹp bởi `goal`.
// THỬ-CHO-ĐỎ: trả nhánh ấy về `minutesFocused >= m.goal ? m.goal : progress` ⇒ bài này đỏ.
test('singleSession: đường sống dùng phép LẤY MAX, không phải ăn-cả-hoặc-không', () => {
  const dong = SONG.split('\n').find((l) => l.includes("m.type === 'singleSession'"));
  assert.ok(dong, 'không còn nhánh singleSession ở đường sống');
  assert.match(
    dong,
    /Math\.max\(progress, Math\.min\(m\.goal, minutesFocused\)\)/,
    'đường sống phải lấy MAX độ dài phiên (kẹp bởi goal) để khớp `min(goal, maxSessionMinutes)` '
    + 'của đường dựng lại — nếu không, thanh tiến độ nhảy số khi Đàm tải lại app',
  );
  assert.doesNotMatch(dong, /\?\s*m\.goal\s*:/, 'nhánh ăn-cả-hoặc-không đã quay lại');
});

// ⚠️ Gác luật HOÀN THÀNH: phép lấy max KHÔNG được biến thành phép cộng dồn. Ba phiên 25 phút phải
// vẫn là 25/30 (chưa xong), chứ không phải 75/30 (xong) — cộng dồn là đổi hẳn độ khó nhiệm vụ.
test('phép lấy MAX không được thoái hoá thành cộng dồn', () => {
  const dong = SONG.split('\n').find((l) => l.includes("m.type === 'singleSession'"));
  assert.doesNotMatch(dong, /progress \+ minutesFocused/,
    'cộng dồn thì một nhiệm vụ "một phiên đủ dài" hoàn thành được bằng nhiều phiên ngắn');
});

// ⚠️ Đường DỰNG LẠI phải giữ nguyên dạng liên tục — nó là bản mà đường sống vừa được kéo về khớp.
// Không có bài này thì ai đó "thống nhất" hai bên bằng cách sửa đường dựng lại thành ăn-cả-hoặc-
// không, và lỗi quay lại nguyên vẹn ở chiều ngược.
test('đường dựng-lại-từ-lịch-sử vẫn liên tục', () => {
  const duraLai = block('function getDailyMissionProgressFromSnapshot', 1400);
  assert.match(duraLai, /case 'singleSession':\s*\n\s*return Math\.min\(mission\.goal, snapshot\.maxSessionMinutes\);/);
});

// Mô phỏng thẳng cả hai công thức trên cùng một chuỗi phiên và đòi chúng ra CÙNG con số.
// Đây là vế duy nhất không phụ thuộc cách viết mã, nên nó sống sót qua mọi lần đổi tên biến.
test('hai công thức ra cùng kết quả trên mọi chuỗi phiên thử', () => {
  const goal = 30;
  const song = (phien) => phien.reduce((p, m) => Math.max(p, Math.min(goal, m)), 0);
  const dungLai = (phien) => Math.min(goal, Math.max(0, ...phien, 0));

  const CA = [
    [], [22], [22, 25], [25, 25, 25], [30], [22, 45], [45, 22], [10, 10, 10], [29], [31, 5],
  ];
  for (const phien of CA) {
    assert.equal(song(phien), dungLai(phien), `lệch ở chuỗi ${JSON.stringify(phien)}`);
  }
  // Và luật hoàn thành phải giữ nguyên: chỉ xong khi CÓ MỘT phiên đủ dài.
  assert.ok(song([25, 25, 25]) < goal, 'ba phiên 25 phút không được tính là xong');
  assert.equal(song([30]), goal, 'một phiên 30 phút phải xong');
});
