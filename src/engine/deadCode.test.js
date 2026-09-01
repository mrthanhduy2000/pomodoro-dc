/**
 * deadCode.test.js — canh những khối mã CHẾT vừa xoá không quay lại, và canh chính cái LUẬT đã
 * dùng để kết tội chúng.
 *
 * Vòng 23 xoá ~860 dòng không bao giờ chạy được. Chúng chết theo BA cách khác nhau, và chỉ một
 * cách trong đó là "không ai tham chiếu" — hai cách kia thì `grep` không thấy:
 *   (a) KHÔNG AI THAM CHIẾU — 3 hành động store (`setSurgeChoice`, `addBuildingPassiveResources`,
 *       `craftTier`) có 0 nơi gọi trên toàn repo, kể cả trong test.
 *   (b) CHẾT VÌ MỘT `return null` ĐỨNG TRƯỚC — `FocusIntro` trả `null` khi phiên đang chạy, mà
 *       nó là nơi gọi DUY NHẤT của `getFocusIntroCopy`, nên cả nhánh "phiên đang chạy" bên trong
 *       hàm ấy chưa từng chạy. Lint không thể thấy: mã vẫn được tham chiếu, chỉ là không tới nơi.
 *   (c) CHẾT VÌ MỘT TRƯỜNG VĨNH VIỄN `null` — `surgeOverride` chỉ được ghi trong `setSurgeChoice`,
 *       nên nhánh đọc nó ở `gameMath.js` là mã không đi tới được.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { stripComments } from '../utils/sourceScan.js';

const doc = (p) => stripComments(readFileSync(new URL(p, import.meta.url), 'utf8'));

// THỬ-CHO-ĐỎ: dán lại `craftTier: () => {}` vào gameStore ⇒ bài 1 đỏ.
test('ba hành động store đã xoá không được sống lại mà vẫn không có ai gọi', () => {
  const store = doc('../store/gameStore.js');
  for (const ten of ['setSurgeChoice', 'addBuildingPassiveResources', 'craftTier']) {
    assert.ok(
      !new RegExp(`\\b${ten}\\b`).test(store),
      `"${ten}" quay lại gameStore.js — nó từng có 0 nơi gọi trên toàn repo`,
    );
  }
  // `surgeOverride` chỉ sống được nhờ `setSurgeChoice`; cả hai phải cùng biến mất.
  assert.ok(!/surgeOverride/.test(store), 'surgeOverride quay lại — nó vĩnh viễn null');
  assert.ok(!/surgeOverride/.test(doc('./gameMath.js')), 'nhánh surgeOverride quay lại gameMath');
  // Gác chạy-rỗng: file phải thật sự được đọc.
  assert.ok(store.length > 100_000, 'không đọc được gameStore.js — phép đo chạy rỗng');
});

// THỬ-CHO-ĐỎ: bỏ `if (hasFocusSessionInProgress) return null` khỏi FocusIntro ⇒ bài 2 đỏ.
test('lời chào màn Tập trung: nơi gọi và hàm dựng phải NHẤT QUÁN về ca "đang chạy"', () => {
  const app = doc('../App.jsx');
  const anLoiChao = /if \(hasFocusSessionInProgress\) return null;/.test(app);
  const dungLoiChaoDangChay = /getLiveSessionIntroCopy|titleSessionRunning|sessionLiveStatus/.test(app);
  assert.ok(anLoiChao, 'FocusIntro thôi ẩn lời chào khi phiên đang chạy');
  assert.ok(
    !dungLoiChaoDangChay,
    'App.jsx lại dựng câu chào cho ca "phiên đang chạy" trong khi FocusIntro trả null trước đó '
    + '⇒ mã ấy KHÔNG đi tới được. Muốn dựng lại tính năng thì phải bỏ `return null` cùng lượt.',
  );
});

// THỬ-CHO-ĐỎ: thêm lại một bank không ai dùng vào FOCUS_INTRO_COPY ⇒ bài 3 đỏ, kể tên bank.
test('mọi kho câu chào phải có ít nhất một nơi dùng', () => {
  const nguyenVan = readFileSync(new URL('../App.jsx', import.meta.url), 'utf8');
  const L = nguyenVan.split('\n');
  const bd = L.findIndex((l) => l.startsWith('const FOCUS_INTRO_COPY'));
  assert.ok(bd >= 0, 'không tìm thấy FOCUS_INTRO_COPY — phép đo chạy rỗng');
  let sau = 0;
  let end = -1;
  for (let i = bd; i < L.length; i += 1) {
    sau += (L[i].match(/\{/g) ?? []).length - (L[i].match(/\}/g) ?? []).length;
    if (sau === 0 && i > bd) { end = i; break; }
  }
  assert.ok(end > bd, 'không đóng được khối FOCUS_INTRO_COPY');

  const khoi = L.slice(bd, end + 1).join('\n');
  const banks = [...khoi.matchAll(/^ {2}([A-Za-z0-9_]+):/gm)].map((m) => m[1]);
  // ⚠️ Gác chạy-rỗng hỏi TÊN, không hỏi số lượng. Bản đầu viết `length >= 5` và nó ĐỎ OAN ngay
  // trong cùng phiên, khi khối co từ 7 xuống 3 bank một cách hoàn toàn đúng — một cái sàn theo
  // số đếm sẽ kêu mỗi lần dọn dẹp thành công. Ba bank tiêu đề là thứ màn Tập trung THẬT SỰ vẽ
  // ra; mất một trong ba mới là mất tính năng.
  for (const phai of ['titleStart', 'titleContinue', 'titleAfter']) {
    assert.ok(banks.includes(phai), `mất bank tiêu đề "${phai}" — lời chào sẽ rỗng`);
  }

  const ngoai = L.slice(0, bd).join('\n') + '\n' + L.slice(end + 1).join('\n');
  const chet = banks.filter((b) => !new RegExp(`FOCUS_INTRO_COPY\\.${b}\\b`).test(ngoai));
  assert.deepEqual(
    chet, [],
    `kho câu chào có ${chet.length} bank không ai dùng: ${chet.join(', ')}. `
    + 'Trước vòng 23 con số này là 36/39 bank (~656 câu) — đừng để nó phình lại.',
  );

  // ⚠️ Không có đường vào bằng khoá chuỗi: nếu có thì phép đếm trên VÔ NGHĨA.
  assert.ok(!/FOCUS_INTRO_COPY\[/.test(nguyenVan), 'có truy cập động — phép đếm bank hết đáng tin');
});
