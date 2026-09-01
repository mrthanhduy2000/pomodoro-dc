import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * MÀN THỐNG KÊ CHỈ ĐƯỢC CÓ **MỘT** BỘ LỌC THỜI GIAN — canh bằng cách đọc mã nguồn.
 *
 * ⚠️ Vì sao phải canh ở tầng mã nguồn chứ không ở tầng hành vi: cái hỏng ở đây KHÔNG làm gì đỏ
 * lên cả. Trước 2026-08-30 ba tab giữ ba trạng thái kỳ riêng với ba mặc định khác nhau, nên bấm
 * từ tab này sang tab kia là cửa sổ thời gian âm thầm đổi. Build xanh, lint sạch, mọi bài test
 * xanh, màn hình vẫn vẽ ra số — chỉ là hai con số cạnh nhau đang nói về hai khoảng thời gian
 * khác nhau, và không có gì trên màn hình nói ra điều đó.
 *
 * ⚠️ Cách hỏng lại RẤT dễ xảy ra: phiên sau muốn thêm một bộ lọc riêng cho một tab thì chỉ cần
 * gõ `useState('all')` trong tab ấy là xong — hoàn toàn hợp lý khi đọc một mình, và nó dựng lại
 * đúng cái bẫy vừa gỡ. Ba bài dưới đây làm cho thao tác ấy ĐỎ NGAY.
 *
 * ⚠️ Và một lý do thứ hai, cũng đã cắn thật: `no-unused-vars` đang **TẮT** cho mọi file `.jsx`
 * (`eslint.config.js`), nên hằng số chết trong tầng giao diện là VÔ HÌNH với lint. Đó là cách
 * ba bảng kỳ chết (`PERIODS`, `METRIC_OPTIONS`, `PERIOD_UNITS`) sống sót nhiều tháng. Rule ấy
 * tắt KHÔNG phải do cẩu thả: dự án không có `eslint-plugin-react`, nên luật gốc không hiểu
 * `<motion.div>` và sẽ báo nhầm "motion không dùng" ở hơn hai chục file. Xem `TECH_DEBT.md`.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = readFileSync(join(HERE, 'StatsDashboard.jsx'), 'utf8');

/** Bỏ dòng `import` ra khỏi phép tìm, để tên nhập vào không bị đếm nhầm là khai báo mới. */
const THAN_FILE = SRC.split('\n').filter((l) => !/^\s*(import|export)\s/.test(l)).join('\n');

test('KỲ THỜI GIAN chỉ có MỘT trạng thái, và nó nằm ở component cha', () => {
  const khai = SRC.match(/useState\(DEFAULT_STATS_PERIOD\)/g) ?? [];
  assert.equal(khai.length, 1, `phải có đúng 1 trạng thái kỳ, đếm được ${khai.length}`);
});

// ⚠️ THỬ-CHO-ĐỎ: thêm `const [p, setP] = useState('all');` vào một tab ⇒ bài này đỏ.
test('KHÔNG TAB NÀO được tự giữ trạng thái kỳ riêng', () => {
  const nghiVan = THAN_FILE.match(/useState\(\s*'(all|today|week|month|quarter|year)'\s*\)/g) ?? [];
  assert.deepEqual(
    nghiVan, [],
    `một tab đang tự giữ kỳ riêng (${nghiVan.join(', ')}) — kỳ phải đến từ props, nếu không ba tab sẽ lệch nhau lại`,
  );
});

test('BA TAB dùng CHUNG một bộ chọn `PeriodPicker`', () => {
  const dung = SRC.match(/<PeriodPicker\b/g) ?? [];
  assert.equal(dung.length, 3, `Tổng Quan · Tập Trung · Phân Loại phải cùng dùng PeriodPicker, đếm được ${dung.length}`);
});

// ⚠️ THỬ-CHO-ĐỎ: khai lại `const CAT_PERIODS = [...]` ⇒ bài này đỏ.
test('KHÔNG khai lại bảng kỳ ở tầng giao diện — nguồn duy nhất là engine', () => {
  const bang = THAN_FILE.match(/^\s*const\s+\w*PERIODS\w*\s*=\s*\[/gm) ?? [];
  assert.deepEqual(
    bang.map((x) => x.trim()), [],
    'bảng kỳ phải nhập từ `engine/statsPeriod`, không khai lại trong file giao diện',
  );
});

test('KHÔNG dựng lại phép tính kỳ ở tầng giao diện', () => {
  for (const ten of ['getPeriodStartTs', 'filterByPeriod', 'buildPeriodBuckets', 'getPreviousPeriodRange']) {
    const dinhNghia = new RegExp(`function\\s+${ten}\\s*\\(`);
    assert.ok(!dinhNghia.test(SRC), `"${ten}" phải nhập từ engine, không định nghĩa lại ở đây`);
  }
});

// ⚠️ Bài này canh đúng cái LỖI NHÃN đã ship: nhãn nói "tuần này" trong khi cửa sổ là 7 ngày
// gần nhất. Cấm quay lại lối tính bằng phép trừ mili-giây trên trục kỳ.
test('CỬA SỔ KỲ đọc từ engine, KHÔNG tính bằng phép trừ mili-giây', () => {
  assert.ok(!/winStart\s*=\s*now\s*-/.test(SRC), 'cửa sổ kỳ phải lấy từ `getPeriodStartTs`, không tự trừ ngày');
  assert.ok(/getPeriodStartTs\(period/.test(SRC), 'phải thật sự gọi `getPeriodStartTs` với kỳ đang chọn');
});

test('ĐƠN VỊ CỘT đọc từ chính cột, không đoán lại bằng chuỗi if', () => {
  assert.ok(/view\.bars\[0\]\?\.unit/.test(SRC), 'nhãn "Giờ tập trung theo …" phải đọc `unit` mà engine khai');
  assert.ok(
    !/period === 'year' \? 'tháng'/.test(SRC),
    'chuỗi if đoán đơn vị viết cho BA kỳ, mà nay có SÁU — nó sẽ gọi cột 2-giờ là "ngày"',
  );
});

test('DẢI "Điều đáng chú ý" phải nói rõ nó KHÔNG theo kỳ đang chọn', () => {
  assert.ok(/buildStatsInsights/.test(SRC), 'màn Thống kê phải thật sự gọi `buildStatsInsights`');
  assert.ok(
    /không theo khoảng thời gian đang chọn/.test(SRC),
    'dải insight đọc toàn bộ lịch sử — không nói ra thì người đọc mặc định nó thuộc kỳ đang chọn',
  );
});

// ⚠️ MÀU DẢI ĐỘ DÀI nằm ở HAI FILE: nhãn/nhịp ở `engine/statsFocus.js`, mã màu ở đây. Đó là
// đúng chỗ của chúng (logic ↔ mỹ thuật), nhưng nó tạo ra một cặp có thể TRÔI KHỎI NHAU: thêm một
// dải ở engine mà quên thêm màu thì dải cuối nhận `undefined` và render ra một thanh gradient
// "undefined, undefinedbb" — trình duyệt bỏ qua trong im lặng, không có gì đỏ lên.
test('MÀU DẢI ĐỘ DÀI khớp số lượng với bảng dải ở engine', async () => {
  const { FOCUS_BUCKETS } = await import('../engine/statsFocus.js');
  const m = SRC.match(/const FOCUS_BUCKET_ACCENTS = \[([^\]]*)\]/);
  assert.ok(m, 'không tìm thấy FOCUS_BUCKET_ACCENTS ở tầng giao diện');
  const mau = m[1].split(',').map((x) => x.trim()).filter(Boolean);
  assert.equal(
    mau.length, FOCUS_BUCKETS.length,
    `engine khai ${FOCUS_BUCKETS.length} dải nhưng giao diện chỉ có ${mau.length} màu`,
  );
  for (const c of mau) assert.match(c, /^'#[0-9a-fA-F]{6}'$/, `mã màu không hợp lệ: ${c}`);
});

test('PHÉP TÍNH NHỊP TẬP TRUNG đọc từ engine, không định nghĩa lại ở đây', () => {
  assert.ok(!/function\s+summarizeFocusStats\s*\(/.test(SRC), '`summarizeFocusStats` phải nhập từ engine');
  assert.ok(/from '\.\.\/engine\/statsFocus'/.test(SRC), 'phải thật sự nhập từ `engine/statsFocus`');
});
