import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { STATS_PERIODS } from '../engine/statsPeriod.js';
import { stripComments } from '../utils/sourceScan.js';

/**
 * MÀN THỐNG KÊ — hai lời hứa về ĐIỀU HƯỚNG, cả hai đều gãy trong im lặng.
 *
 * ⚠️ (1) KHÔNG ĐƯỢC GIẤU LỰA CHỌN SAU MỘT DẢI CUỘN NGANG. Đo ở khung 390px thật trước bản vá:
 * hàng kỳ rộng THẬT 547px trên 348px nhìn thấy (**3/6 kỳ vô hình**), hàng tab rộng thật 499px
 * trên 358px (**tab "Ghi Chú" với 99 mục gần như không ai biết là có**). Trên điện thoại, một
 * dải cuộn ngang không có thanh cuộn, không mũi tên, không gì báo còn thứ bên phải.
 *
 * ⚠️ (2) HAI THỨ KHÁC NHAU KHÔNG ĐƯỢC MANG CÙNG MỘT TÊN. Tab "Tập Trung" của Thống kê trùng
 * nguyên văn nút "Tập trung" ở thanh điều hướng dưới — hai màn hoàn toàn khác nhau, cách nhau
 * ~600px trên cùng một màn hình.
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

test('mỗi kỳ thời gian có nhãn NÚT riêng, tách khỏi nhãn dùng trong câu văn', () => {
  // ⚠️ Khuôn "một trường gánh hai việc" — dự án đã bị cắn bảy lần. Một nút và một mảnh câu đòi hỏi
  // NGƯỢC NHAU: câu cần đủ chữ ("Anh mới có N phiên trong tuần này"), nút cần ngắn để vừa màn hình.
  for (const p of STATS_PERIODS) {
    assert.equal(typeof p.short, 'string', `kỳ "${p.key}" thiếu nhãn nút \`short\``);
    assert.ok(p.short.length > 0 && p.short.length <= 7, `nhãn nút "${p.short}" quá dài — sẽ đẩy hàng tràn ngang trở lại`);
    assert.ok(p.short.length <= p.label.length, `\`short\` phải NGẮN HƠN hoặc bằng \`label\` (${p.short} vs ${p.label})`);
  }
  const tong = STATS_PERIODS.reduce((n, p) => n + p.short.length, 0);
  assert.ok(tong <= 30, `tổng ${tong} ký tự cho 6 nút — quá dài cho một hàng 348px`);
});

test('nút kỳ hiển thị `short`, không hiển thị `label`', () => {
  assert.match(NGUON, /\{p\.short \?\? p\.label\}/, 'nút kỳ lại in `label` — hàng sẽ tràn ngang như cũ.');
});

test('không hàng điều hướng nào của Thống kê dùng cuộn ngang', () => {
  // Cuộn ngang trên điện thoại = giấu lựa chọn. Hai hàng này phải xuống dòng hoặc vừa khít.
  const iPeriod = NGUON.indexOf('aria-label="Khoảng thời gian"');
  assert.notEqual(iPeriod, -1, 'phép đo chạy rỗng — không tìm thấy hàng kỳ');
  const quanhPeriod = NGUON.slice(Math.max(0, iPeriod - 900), iPeriod);
  assert.ok(!/overflow-x-auto/.test(quanhPeriod), 'hàng kỳ lại cuộn ngang — 3/6 kỳ sẽ vô hình.');

  const iTabs = NGUON.indexOf('{TABS.map(');
  assert.notEqual(iTabs, -1, 'phép đo chạy rỗng — không tìm thấy hàng tab');
  const quanhTabs = NGUON.slice(Math.max(0, iTabs - 700), iTabs);
  assert.ok(!/overflow-x-auto/.test(quanhTabs), 'hàng tab lại cuộn ngang — tab "Ghi Chú" sẽ vô hình.');
});

test('không nhãn tab nào của Thống kê trùng tên với một mục điều hướng chính', () => {
  const tabThongKe = nhanCua(NGUON, 'TABS');
  assert.equal(tabThongKe.length, 5, `quét ra ${tabThongKe.length} tab — regex đã lạc`);
  const dieuHuong = [...nhanCua(APP, 'MOBILE_TABS'), ...nhanCua(APP, 'INVENTORY_TABS')];
  assert.ok(dieuHuong.length >= 8, `quét ra ${dieuHuong.length} mục điều hướng — regex đã lạc`);

  const chuan = (s) => s.toLowerCase().normalize('NFC');
  const va = tabThongKe.filter((t) => dieuHuong.some((d) => chuan(d) === chuan(t)));
  assert.deepEqual(va, [], `tab Thống kê trùng tên mục điều hướng: ${va.join(' · ')}`);
});

test('năm tab Thống kê không trùng tên NHAU', () => {
  const tab = nhanCua(NGUON, 'TABS');
  assert.equal(new Set(tab.map((t) => t.toLowerCase())).size, tab.length, 'có hai tab cùng tên');
});
