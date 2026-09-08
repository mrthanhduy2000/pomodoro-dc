/**
 * cityViewShellWiring.test.js — khoá một khoảng trống mà **551 bài test không hề thấy**.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ CHUYỆN ĐÃ XẢY RA (2026-08-13, Phase 4H). `summarizeMuseum` trong `engine/cityCompletion.js`
 * được viết ở Phase 4B: có ghi chú đầy đủ, có xử lý đúng ca "kỷ thất truyền", **có bài test riêng**,
 * và docstring của nó tự giới thiệu là *"con số duy nhất trả lời 'tôi đã đi được bao xa'"*. Nó nằm
 * đó suốt từ đó tới nay mà **không màn hình nào từng gọi tới**. `grep` cả cây `src/` ra đúng hai
 * chỗ: dòng định nghĩa, và bài test của chính nó.
 *
 * ⚠️ BÀI HỌC — VÀ NÓ TỔNG QUÁT HƠN MỘT HÀM: **bài test tầng engine chứng minh hàm CHẠY ĐÚNG; nó
 * không chứng minh hàm CÓ AI GỌI.** Một tính năng làm xong 90% rồi thiếu đúng một dòng nối thì:
 * build xanh · lint sạch · toàn bộ test xanh · không có cảnh báo "unused" nào (vì hàm CÓ được dùng
 * — bởi bài test của nó). Triệu chứng duy nhất là màn hình thiếu một thứ mà không ai nhớ là đáng lẽ
 * phải có. Đây cùng họ với bài học "một bài test xanh không cho biết có BAO NHIÊU thứ đang giữ nó
 * xanh" (Phase 4D): cả hai đều là chuyện bài test đo một thứ hẹp hơn điều ta tưởng nó đo.
 *
 * Cách canh: đọc thẳng mã nguồn, giống `cityRenderers.test.js` và `actionButtonSizing.test.js` —
 * vì đây đúng là loại vi phạm mà lint/build không thể bắt.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SHELL = await readFile(new URL('./CityViewShell.jsx', import.meta.url), 'utf8');
const APP = await readFile(new URL('../../App.jsx', import.meta.url), 'utf8');

/** Bỏ chú thích, để không đọc trúng chính đoạn giải thích ở trên rồi tưởng là mã. */
function codeOnly(source) {
  return source
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}

test('Màn hình Thành Phố THẬT SỰ gọi `summarizeMuseum` — không để nó chết trong engine lần nữa', () => {
  const code = codeOnly(SHELL);

  assert.match(code, /import\s*\{[^}]*\bsummarizeMuseum\b[^}]*\}\s*from\s*'\.\.\/\.\.\/engine\/cityCompletion'/,
    'CityViewShell.jsx không còn import `summarizeMuseum` từ engine.');

  // Import thôi chưa đủ: import mà không gọi thì màn hình vẫn không hiện gì, và ESLint cũng không
  // kêu (biến CÓ được dùng nếu ai đó chỉ gán nó đi chỗ khác).
  assert.match(code, /summarizeMuseum\s*\(/,
    'CityViewShell.jsx có import `summarizeMuseum` nhưng KHÔNG gọi — đúng cái bẫy mà bài test này sinh ra để chặn.');
});

test('Ô số liệu thứ ba KHÔNG quay lại nói lại con số chuỗi mà thanh tiêu đề đã hiện', () => {
  const code = codeOnly(SHELL);

  // `App.jsx` hiện `TinyStat label="Chuỗi"` ở đầu MỌI tab. Nhãn "Chuỗi ngày" ở đây nghĩa là cùng
  // một con số xuất hiện hai lần trên một màn hình, chiếm mất 1 trong 4 ô số liệu.
  // ⚠️ Vẫn CHO PHÉP `stats.streakLength` xuất hiện trong file: nó là đầu vào thật của
  // `deriveResidentCount` (dân số) và là đường lùi cho ca mọi-kỷ-đều-thất-truyền.
  assert.doesNotMatch(code, /label:\s*isCurrent\s*\?\s*'Chuỗi ngày'/,
    'Ô số liệu đã quay lại nhãn "Chuỗi ngày" — trùng với "Chuỗi" trên thanh tiêu đề của App.jsx.\n'
    + 'Luật đã có sẵn ngay trong file này (ô "Cư dân"): hai chỗ nói cùng một chuyện thì chỗ nói ít hơn phải nhường.');
});

// ─── ROUND 46 (ADR-086): THE CITY SAYS WHAT IT PAYS ──────────────────────────────────────────
// RED WHEN: the SP cell is dropped, the rate is typed instead of read, or the museum's raw-EP cell
// returns. An engine test on `skillPointEconomy.js` proves the arithmetic; only this proves the one
// screen that EARNS the money prints it.
test('the City tab reads the skill-point economy and spends a stat cell on it', () => {
  const code = codeOnly(SHELL);
  assert.match(code, /import\s*\{[^}]*\bcityEarnedSP\b[^}]*\}\s*from\s*'\.\.\/\.\.\/engine\/skillPointEconomy'/,
    'CityViewShell.jsx no longer imports `cityEarnedSP` — the SP number is typed or gone.');
  assert.match(code, /cityEarnedSP\(/, 'imported but never called — the exact trap this file exists for.');
  assert.match(code, /label:\s*'Điểm kỹ năng'/, 'the SP stat cell is gone from the city stat grid.');
  assert.match(code, /import\s*\{[^}]*\bSP_TAG\b[^}]*\bslotNote\b[^}]*\}\s*from\s*'\.\/cityCopy'/,
    'the slot notes / SP tag are no longer read from cityCopy.js.');
  assert.match(code, /slotNote\(slot\.state,\s*\{\s*sealed:\s*!isCurrent\s*\}\)/,
    'unbuilt slots no longer say their price and, in the museum, their path.');
  assert.match(code, /\{SP_TAG\}/, 'the «Đang xây» card no longer names the pay.');
  assert.doesNotMatch(code, /\+1 SP|1 SP/, 'a typed "+1 SP" — the rate must come from the engine.');
});

test('the museum no longer prints raw EP, and no cell counts sessions Đàm can do nothing with', () => {
  const code = codeOnly(SHELL);
  assert.doesNotMatch(code, /EP lúc niêm phong/, '«EP lúc niêm phong» is back — raw EP against ADR-082, and nothing to do with it.');
  assert.doesNotMatch(code, /epAtSeal/, 'the shell reads `epAtSeal` again — the only reader of that number was the cell that was retired.');
  assert.doesNotMatch(code, /label:\s*'Phiên trong kỷ'/, 'the session-count cell is back; the count lives in the status line (eraStatusLine).');
  assert.match(code, /eraStatusLine\(\{/, 'the plaque (status · sessions) is no longer written under the picture.');
  assert.doesNotMatch(code, /'chưa xây'/, 'a bare «chưa xây» is back — the note must come from slotNote().');
});

test('the phone top rail on the City tab keeps only title · level · bell (measured 202 px before)', () => {
  const app = codeOnly(APP);
  const pane = app.slice(app.indexOf('title="Thành Phố"'), app.indexOf('title="Thành Phố"') + 700);
  assert.match(pane, /renderTopRail\(\{\s*hideStats:\s*true,\s*hideEra:\s*true\s*\}\)/,
    'the City tab renders the full phone rail again — it stood taller than the city picture.');
});
