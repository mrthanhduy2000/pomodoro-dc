import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { stripComments } from '../utils/sourceScan.js';

/**
 * MÀN THỐNG KÊ — bốn lời hứa ĐỌC ĐƯỢC TỪ MÃ NGUỒN, vì cả bốn đều gãy trong im lặng (ADR-071).
 *
 * ⚠️ (1) MỞ RA LÀ THẤY BA CÂU TRẢ LỜI, KHÔNG BẤM TAB CON. Trước 2026-09-06 nếp gấp đầu ở 390px là
 * hai hàng nút (48,6% màn hình là khung điều hướng trước khi hiện một con số), và ba câu Đàm hỏi —
 * khá lên không · mạnh nhất khi nào · làm gì tiếp — nằm rải ở ba tab khác nhau.
 * ⚠️ (2) KHÔNG GIẤU LỰA CHỌN SAU MỘT DẢI CUỘN NGANG. Trên điện thoại, một dải cuộn ngang không có
 * thanh cuộn, không mũi tên, không gì báo còn thứ bên phải (đo được 3/6 kỳ vô hình trước đây).
 * ⚠️ (3) HAI THỨ KHÁC NHAU KHÔNG ĐƯỢC MANG CÙNG MỘT TÊN — nút sổ tra cứu không được trùng nguyên
 * văn một mục điều hướng chính cách nó ~600px.
 * ⚠️ (4) "LÀM GÌ TIẾP" LÀ MỘT NÚT CHẠY ĐƯỢC, không phải một câu để đọc: bấm là đặt độ dài + loại
 * việc rồi nhảy sang màn Tập trung — và `App.jsx` phải THẬT SỰ nối `onNavigate`, nếu không nút
 * bấm im lặng (một prop tuỳ chọn thiếu thì không có gì đỏ lên).
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const NGUON = stripComments(readFileSync(join(HERE, 'StatsDashboard.jsx'), 'utf8'));
const APP = stripComments(readFileSync(join(HERE, '..', 'App.jsx'), 'utf8'));

/** Nhãn của một mảng hằng số cấp module dạng `const TÊN = [ … ];` trong một nguồn đã bỏ chú thích. */
function nhanCua(nguon, ten, truong = 'label') {
  const mo = `const ${ten} = [`;
  const i = nguon.indexOf(mo);
  assert.notEqual(i, -1, `không tìm thấy \`${ten}\` — phép đo chạy rỗng`);
  const than = nguon.slice(i + mo.length, nguon.indexOf('\n];', i));
  return [...than.matchAll(new RegExp(`${truong}:\\s*'([^']+)'`, 'g'))].map((h) => h[1]);
}

const CAU_HOI = ['Tôi có đang khá lên không?', 'Khi nào tôi mạnh nhất?', 'Làm gì tiếp?'];

test('ba câu trả lời đứng TRƯỚC sổ tra cứu, theo đúng thứ tự, và không nằm sau một tab con nào', () => {
  const viTri = CAU_HOI.map((q) => NGUON.indexOf(`question="${q}"`));
  for (const [i, v] of viTri.entries()) assert.notEqual(v, -1, `thiếu thẻ trả lời "${CAU_HOI[i]}"`);
  assert.ok(viTri[0] < viTri[1] && viTri[1] < viTri[2], 'ba câu phải theo đúng thứ tự khá-lên · mạnh-nhất · làm-gì-tiếp');
  const iSo = NGUON.indexOf('aria-label="Sổ tra cứu"');
  assert.notEqual(iSo, -1, 'không tìm thấy sổ tra cứu');
  assert.ok(viTri[2] < iSo, 'sổ tra cứu phải nằm SAU ba câu trả lời');
  assert.ok(!/useState\('overview'\)/.test(NGUON) && !/<PeriodPicker/.test(NGUON) && !/\bTABS\b/.test(NGUON), 'tab con / bộ chọn kỳ đã quay lại');
  assert.ok(/buildStatsAnswers\(/.test(NGUON), 'ba câu trả lời phải đến từ engine `statsAnswers`, không tính lại ở giao diện');
});

test('sổ tra cứu GẤP mặc định và mở theo từng cuốn — không giấu, chỉ gấp', () => {
  assert.match(NGUON, /useState\(null\)/, 'trạng thái sổ tra cứu phải mặc định ĐÓNG');
  assert.match(NGUON, /lookup === 'journal' && <StatsJournal/, 'Nhật ký phải được dựng khi mở cuốn ấy');
  assert.match(NGUON, /lookup === 'notes' && <StatsNotes/, 'Ghi chú phải được dựng khi mở cuốn ấy');
  // Số mục hiện NGAY TRÊN NÚT — người đọc biết trong sổ có gì trước khi mở.
  assert.match(NGUON, /fmtCount\(lookupCount\[tab\.key\]\)/, 'nút sổ phải in số mục');
});

test('không hàng nào của màn Thống kê dùng cuộn ngang — kể cả trong hai cuốn sổ tra cứu', () => {
  for (const f of ['StatsDashboard.jsx', 'StatsJournal.jsx', 'StatsNotes.jsx']) {
    const ma = stripComments(readFileSync(join(HERE, f), 'utf8'));
    assert.ok(!/overflow-x-auto/.test(ma), `${f} có một hàng cuộn ngang — lựa chọn sẽ vô hình trên điện thoại`);
  }
});

test('nhãn sổ tra cứu không trùng tên một mục điều hướng chính, và không trùng nhau', () => {
  const so = nhanCua(NGUON, 'LOOKUP');
  assert.equal(so.length, 2, `quét ra ${so.length} cuốn sổ — regex đã lạc`);
  const dieuHuong = [...nhanCua(APP, 'MOBILE_TABS'), ...nhanCua(APP, 'INVENTORY_TABS')];
  assert.ok(dieuHuong.length >= 8, `quét ra ${dieuHuong.length} mục điều hướng — regex đã lạc`);
  const chuan = (s) => s.toLowerCase().normalize('NFC');
  const va = so.filter((t) => dieuHuong.some((d) => chuan(d) === chuan(t)));
  assert.deepEqual(va, [], `sổ tra cứu trùng tên mục điều hướng: ${va.join(' · ')}`);
  assert.equal(new Set(so.map(chuan)).size, so.length, 'hai cuốn sổ cùng tên');
});

test('"làm gì tiếp" là một NÚT: đặt độ dài + loại việc rồi nhảy sang màn Tập trung, và App nối dây thật', () => {
  assert.match(NGUON, /setTimerConfig\(\{ focusMinutes: answers\.next\.minutes \}\)/, 'nút phải đặt độ dài phiên theo gợi ý');
  assert.match(NGUON, /setPendingCategory\(answers\.next\.categoryId\)/, 'nút phải chọn sẵn loại việc theo gợi ý');
  assert.match(NGUON, /onNavigate\?\.\(\{ tab: 'focus' \}\)/, 'nút phải nhảy sang màn Tập trung');
  // Đang có phiên chạy thì không được đổi cấu hình đồng hồ — đổi giữa chừng là phá phiên đang chạy.
  assert.match(NGUON, /if \(!timerRunning\) \{/, 'phải gác "đang có phiên chạy" trước khi đổi cấu hình');
  assert.match(APP, /<StatsDashboard onNavigate=\{handleNotificationNavigate\} \/>/, 'App.jsx chưa truyền `onNavigate` — nút sẽ bấm im lặng');
});

test('mọi tỉ lệ trên màn đi kèm cỡ mẫu — một con số không có mẫu số thì không phải mục tiêu', () => {
  assert.match(NGUON, /\{b\.note\} · trên \{b\.sample\}/, 'dòng "mạnh nhất" phải in cỡ mẫu cạnh tỉ lệ');
  // Câu lý do của "làm gì tiếp" TỰ mang mẫu số (engine, có test) — giao diện chỉ in nó, không ghép thêm
  // "Dựa trên …" lần hai (ảnh nghiệm thu đầu tiên đã in hai lần).
  assert.match(NGUON, /\{answers\.next\.reason\}/, 'gợi ý "làm gì tiếp" phải in câu lý do (đã có mẫu số)');
  assert.ok(!/Dựa trên \{answers\.next/.test(NGUON), 'đừng ghép "Dựa trên" lần hai — câu lý do đã có');
  assert.match(NGUON, /Dựa trên \{x\.sample\}/, 'dải "Điều đáng chú ý" phải in cỡ mẫu');
  assert.match(NGUON, /Đọc trên toàn bộ lịch sử/, 'dải insight đọc toàn bộ lịch sử — phải nói ra, kẻo bị đọc như "tuần này"');
});
