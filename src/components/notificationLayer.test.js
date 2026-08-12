import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * THỨ TỰ LỚP: chuông thông báo PHẢI nằm DƯỚI mọi hộp thoại.
 *
 * ⚠️ Vì sao cần một bài test cho một con số CSS: lỗi này **không làm gì đỏ cả**. App vẫn chạy,
 * test vẫn xanh, build vẫn xanh — chỉ có một cái chuông sáng trưng nổi trên lớp mờ của mọi hộp
 * thoại, và bấm vào được. Nó đã sống như vậy rất lâu mà không ai thấy, cho tới khi có một ảnh chụp
 * khung iPhone. Mắt người không soi lại thứ tự lớp sau mỗi lần thêm hộp thoại; máy thì có.
 *
 * Bài test đọc THẲNG mã nguồn vì đây là con số nằm trong chuỗi class Tailwind — không có đường nào
 * lấy ra lúc chạy mà không cần cả trình duyệt.
 */

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * Đọc mọi giá trị z-index Tailwind trong một file: `z-50`, `z-[60]`, `z-[75]`…
 *
 * ⚠️ Ranh giới từ `\b` CHỈ đặt sau dạng số trần. Đặt nó sau `]` thì không bao giờ khớp (cả `]`
 * lẫn dấu cách đứng sau đều không phải ký tự từ) — nghĩa là mọi lớp dạng `z-[70]` lặng lẽ biến
 * mất, và bài quét dưới đây sẽ XANH trong khi thực ra nó chẳng đo gì cả. Đúng kiểu bài test còn
 * tệ hơn không có test: nó phát ra tín hiệu an toàn giả.
 */
function readZLayers(source) {
  const layers = [];
  for (const match of source.matchAll(/\bz-(?:\[(\d+)\]|(\d+)\b)/g)) {
    layers.push(Number(match[1] ?? match[2]));
  }
  return layers;
}

/** Chỉ lấy phần MÃ, bỏ chú thích — nếu không thì chính đoạn ghi chú giải thích bài test này sẽ
 *  bị đếm như một lớp thật, và người sửa sẽ đi xoá chú thích thay vì sửa lỗi. */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

const MODAL_FILES = readdirSync(HERE)
  .filter((name) => /Modal\.jsx$/.test(name));

test('chuông thông báo nằm DƯỚI sàn của dải hộp thoại', () => {
  const source = codeOnly(readFileSync(join(HERE, 'NotificationCenter.jsx'), 'utf8'));
  const bell = Math.max(...readZLayers(source));

  assert.ok(Number.isFinite(bell), 'không đọc được lớp của chuông');
  assert.ok(
    bell < 50,
    `chuông đang ở z-${bell}. Từ 50 trở lên là dải HỘP THOẠI — chuông sẽ nổi lên trên lớp mờ và `
    + 'bấm được ngay giữa lúc một hộp thoại đang chặn màn hình.',
  );
});

test('MỌI hộp thoại đều nằm TRÊN chuông — kể cả hộp thoại thêm sau này', () => {
  // Đây mới là phần giữ cho lỗi không mọc lại: bài trên khoá cái chuông, bài này quét cả thư mục
  // nên một `SomethingModal.jsx` mới ra đời với z-30 sẽ bị bắt ngay, không cần ai nhớ sửa test.
  const bell = Math.max(...readZLayers(codeOnly(readFileSync(join(HERE, 'NotificationCenter.jsx'), 'utf8'))));
  assert.ok(MODAL_FILES.length >= 5, 'không tìm thấy hộp thoại nào — có phải thư mục đã đổi chỗ?');

  for (const file of MODAL_FILES) {
    const layers = readZLayers(codeOnly(readFileSync(join(HERE, file), 'utf8')));
    if (layers.length === 0) continue;   // hộp thoại lồng trong file khác, không tự đặt lớp
    assert.ok(
      Math.max(...layers) > bell,
      `${file} đặt lớp cao nhất là z-${Math.max(...layers)}, KHÔNG cao hơn chuông (z-${bell}).`,
    );
  }
});

test('lễ mừng thành phố cũng phải trên chuông', () => {
  // Lễ mừng không có đuôi `Modal.jsx` nên bài quét ở trên không thấy nó — mà nó lại là màn hình
  // duy nhất chen vào ĐÚNG khoảnh khắc một phiên vừa xong.
  const bell = Math.max(...readZLayers(codeOnly(readFileSync(join(HERE, 'NotificationCenter.jsx'), 'utf8'))));
  const moment = Math.max(...readZLayers(codeOnly(
    readFileSync(join(HERE, 'city', 'CityGrowthMoment.jsx'), 'utf8'),
  )));
  assert.ok(moment > bell, `lễ mừng ở z-${moment}, chuông ở z-${bell}`);
});
