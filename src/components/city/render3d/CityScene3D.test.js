import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * BẦU TRỜI PHẢI ĐI THEO ĐỒNG HỒ KHI ĐÀM MỞ LẠI APP.
 *
 * ⚠️ Vì sao cần test cho một dòng danh sách phụ thuộc: lỗi này **không làm gì đỏ cả**. App chạy,
 * test xanh, build xanh, ảnh chụp đẹp — chỉ có bầu trời đứng im ở chặng lúc mở app đầu tiên. Trên
 * iPhone (PWA) tab chỉ bị ĐÓNG BĂNG chứ không đóng hẳn, nên mở app buổi sáng rồi mở lại lúc tối sẽ
 * thấy bầu trời buổi sáng giữa đêm — đúng cách Đàm dùng app nhiều nhất, và đúng thứ làm hỏng cả
 * công sức của Phase 3V (`TECH_DEBT.md` #15) lẫn lời hứa "mỗi lần mở app là một cảnh khác" mà
 * `daylight.js` tự nhận.
 *
 * Cùng họ lỗi với "BẢN VÁ C1" ở `syncService.js` (timer debounce KHÔNG BAO GIỜ nổ trên iOS vì tab
 * bị đóng băng) — cùng nền tảng, cùng nguyên nhân, cùng cách vá: `visibilitychange`.
 *
 * Test đọc THẲNG mã nguồn vì đây là quan hệ giữa một `useState` và một mảng phụ thuộc — không có
 * đường nào quan sát được lúc chạy mà không dựng cả trình duyệt lẫn WebGL.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const SOURCE = readFileSync(join(HERE, 'CityScene3D.jsx'), 'utf8');

/**
 * Bỏ chú thích, chỉ giữ phần MÃ.
 *
 * ⚠️ BẮT BUỘC, không phải cho gọn: chính khối chú thích dài giải thích `dayPhase` ở file kia có
 * chứa đủ mọi chữ mà bài test này đi tìm. Không lọc thì test XANH nhờ đọc trúng lời giải thích của
 * chính nó, kể cả khi mã đã bị gỡ sạch — một bài test phát tín hiệu an toàn giả.
 */
function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

const CODE = codeOnly(SOURCE);

test('BẦU TRỜI ĐI THEO ĐỒNG HỒ: cảnh phải dựng lại khi sang chặng ngày mới', () => {
  // Lấy mảng phụ thuộc của effect DỰNG CẢNH — nhận ra nó bằng việc chứa `layout` và `interactive`,
  // hai thứ chỉ effect đó mới có, thay vì bám vào số dòng (số dòng trôi sau mỗi lần sửa file).
  const depsArrays = [...CODE.matchAll(/\}, \[([^\]]*)\]\);/g)].map((m) => m[1]);
  const sceneDeps = depsArrays.find((d) => d.includes('layout') && d.includes('interactive'));

  assert.ok(
    sceneDeps,
    'Không tìm thấy mảng phụ thuộc của effect dựng cảnh (mảng chứa cả `layout` lẫn `interactive`). '
    + 'Nếu effect vừa được đổi tên/cấu trúc thì sửa cách nhận diện ở đây — ĐỪNG xoá bài test.',
  );

  assert.ok(
    /\bdayPhase\b/.test(sceneDeps),
    'Mảng phụ thuộc của effect dựng cảnh KHÔNG còn `dayPhase`. Bỏ nó ra nghĩa là cảnh chỉ đọc đồng '
    + 'hồ đúng một lần lúc mount: trên iPhone (PWA đóng băng tab, không mount lại) bầu trời sẽ đứng '
    + 'im ở chặng lúc mở app đầu tiên — buổi sáng giữa đêm.',
  );
});

test('BẦU TRỜI ĐI THEO ĐỒNG HỒ: phải nghe `visibilitychange`, vì iOS đóng băng chứ không đóng tab', () => {
  // ⚠️ PHẢI BÁM ĐÚNG TÊN HÀM XỬ LÝ, không phải chỉ bám chuỗi `'visibilitychange'`.
  // Bản đầu của bài test này viết `/addEventListener\(\s*'visibilitychange'/` và **KHÔNG hề đỏ**
  // khi tôi thử gỡ sạch bộ nghe của `dayPhase` — vì trong cùng file còn một bộ nghe
  // `visibilitychange` KHÁC (dòng ~398, để dừng vòng lặp vẽ khi rời tab) làm nó xanh oan. Đúng bẫy
  // "ngưỡng một phía là cái phễu, không phải hàng rào": test chỉ có giá trị sau khi đã thử NGƯỢC
  // với mã hỏng và thấy nó đỏ thật.
  assert.ok(
    /addEventListener\(\s*'visibilitychange',\s*recheck\s*\)/.test(CODE),
    'Không còn bộ nghe `visibilitychange` nào gắn với `recheck` (bộ tính lại chặng ngày). Lưu ý '
    + 'trong file còn một bộ nghe `visibilitychange` KHÁC lo việc dừng vòng lặp vẽ — cái đó không '
    + 'thay thế được cái này. Không có `recheck` thì `dayPhase` không bao giờ được tính lại, và '
    + 'việc nó nằm trong mảng phụ thuộc trở thành vô nghĩa.',
  );
  assert.ok(
    /const recheck = \(\) => \{[\s\S]{0,400}?setDayPhase\(/.test(CODE),
    '`recheck` không còn gọi `setDayPhase`. Nó là mắt xích giữa tín hiệu mở-lại-app và việc dựng '
    + 'lại cảnh; đứt mắt xích này thì hai bài kiểm còn lại vẫn xanh mà bầu trời vẫn đứng im.',
  );

  assert.ok(
    /setDayPhase\(\(prev\) => \(prev === now \? prev : now\)\)/.test(CODE),
    'Phải cập nhật `dayPhase` bằng dạng SO SÁNH rồi trả lại giá trị cũ khi không đổi. Gán thẳng '
    + '`setDayPhase(now)` cũng "chạy đúng", nhưng mỗi lần chuyển tab lại sinh một lượt render — và '
    + 'vì `dayPhase` nằm trong mảng phụ thuộc, mỗi lượt đó DỰNG LẠI CẢ CẢNH WebGL.',
  );
});

test('GIỜ VIỆT NAM, KHÔNG PHẢI GIỜ MÁY — kể cả ở lớp vỏ React', () => {
  // Luật toàn dự án (`engine/time.js`): một cái máy để nhầm múi giờ không được biến buổi chiều của
  // Đàm thành nửa đêm. Lớp vỏ này là NƠI DUY NHẤT trong nhánh 3D được phép đọc đồng hồ, nên cũng là
  // nơi duy nhất có thể phá luật đó.
  assert.ok(
    /getVietnamHour\(\)/.test(CODE),
    'Cảnh phải lấy giờ qua `getVietnamHour()`.',
  );
  assert.ok(
    !/new Date\(|Date\.now\(/.test(CODE),
    'Cảnh đang đọc đồng hồ máy trực tiếp (`new Date` / `Date.now`) thay vì `getVietnamHour()`. '
    + 'Máy để nhầm múi giờ sẽ cho Đàm bầu trời sai chặng.',
  );
});
