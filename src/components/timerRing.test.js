/**
 * timerRing.test.js — khoá hai lời hứa của vòng đồng hồ mà KHÔNG cổng nào khác canh.
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ VÌ SAO PHẢI LÀ TEST ĐỌC-MÃ chứ không đo bằng trình duyệt: màu vòng lúc **đang chạy** và lúc
 * **đang nghỉ** chỉ xuất hiện khi có một phiên thật đang chạy, mà luật số 4 của dự án CẤM start
 * phiên focus trên dev/localhost (dev dùng chung dòng Supabase với bản thật của Đàm — xem
 * `START_HERE.md`). Nên hai trạng thái quan trọng nhất của vòng là hai trạng thái không đo được
 * bằng ảnh chụp. Chúng được khoá ở đây, chỗ chúng thật sự có thể trôi.
 *
 * Trạng thái đo ĐƯỢC bằng trình duyệt (nghỉ/IDLE) đã đo rồi và khớp: track `--timer-track`, vòng
 * chính nét 14 bo tròn, vòng ngoài r=145 nét 4 màu `--warn`, số 72px weight 800 `tabular-nums`.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const SOURCE = await readFile(new URL('./PomodoroEngine.jsx', import.meta.url), 'utf8');

/** Bỏ chú thích — nếu không, bài test đọc trúng chính phản ví dụ nêu trong lời giải thích. */
function codeOnly(src) {
  return src
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ');
}
const CODE = codeOnly(SOURCE);

/** Đọc một hằng số dạng `const TÊN = <biểu thức>;` rồi TÍNH nó, thay vì chép lại giá trị. */
function evalConst(name) {
  const re = new RegExp(`const ${name} = ([^;]+);`);
  const m = re.exec(CODE);
  assert.ok(m, `Không tìm thấy hằng số \`${name}\``);
  // Các hằng vòng chỉ tham chiếu lẫn nhau và Math — dựng lại đúng bằng biểu thức trong mã nguồn.
  const deps = ['RING_RADIUS', 'RING_STROKE', 'GOAL_RING_GAP', 'GOAL_RING_STROKE', 'GOAL_RING_RADIUS'];
  const scope = {};
  for (const d of deps) {
    if (d === name) break;
    const mm = new RegExp(`const ${d} = ([^;]+);`).exec(CODE);
    if (mm) scope[d] = Function(...Object.keys(scope), `return (${mm[1]});`)(...Object.values(scope));
  }
  return Function(...Object.keys(scope), `return (${m[1]});`)(...Object.values(scope));
}

test('HÌNH HỌC: vòng mục tiêu nằm NGOÀI vòng chính, cách đúng khoảng đã khai, và khung SVG ôm hết', () => {
  const R = evalConst('RING_RADIUS');
  const S = evalConst('RING_STROKE');
  const GAP = evalConst('GOAL_RING_GAP');
  const GS = evalConst('GOAL_RING_STROKE');
  const GR = evalConst('GOAL_RING_RADIUS');
  const SIZE = evalConst('SVG_SIZE');

  assert.ok(S >= 10, `Vòng chính phải DÀY để thành trung tâm thị giác — đang là ${S}px.`);
  assert.ok(GS < S, `Vòng mục tiêu (${GS}px) phải MẢNH hơn vòng chính (${S}px), nếu không mắt không\n`
    + 'đọc ra đâu là "phiên này" đâu là "cả ngày".');

  // Khoảng trống THẬT giữa mép ngoài vòng chính và mép trong vòng mục tiêu.
  const khoangTrong = (GR - GS / 2) - (R + S / 2);
  assert.equal(khoangTrong, GAP,
    `Khoảng trống đo được ${khoangTrong}px nhưng khai ${GAP}px. Bán kính vòng ngoài phải SUY RA từ\n`
    + 'hình học, đừng viết cứng — viết cứng thì đổi độ dày vòng chính là hai vòng dính vào nhau.');

  // ⚠️ Phép so ngay trên KHÔNG canh được giá trị của chính `GAP`: `GOAL_RING_RADIUS` được suy ra
  // TỪ `GAP`, nên hạ `GAP` xuống 0 thì cả hai vế cùng về 0 và nó vẫn xanh — một hằng đẳng thức đội
  // lốt một cái gác (phép thử ngược đã chứng minh, 2026-08-27). Nó chỉ bắt được ca "viết cứng bán
  // kính". Cái sàn dưới đây mới canh giá trị, và nó là một QUAN HỆ chứ không phải một mức chọn
  // tay: khoảng trống phải rộng ít nhất bằng chính nét vòng mảnh, nếu không mắt đọc hai vòng
  // thành một vòng dày có sọc.
  assert.ok(GAP >= GS,
    `Khoảng trống ${GAP}px hẹp hơn nét vòng mục tiêu ${GS}px ⇒ hai vòng dính thành một khối.`);

  // Khung SVG phải ôm được vòng NGOÀI CÙNG, nếu không mép vòng mục tiêu bị cắt cụt.
  const banKinhNgoaiCung = GR + GS / 2;
  assert.ok(SIZE >= banKinhNgoaiCung * 2,
    `SVG_SIZE = ${SIZE} nhưng vòng ngoài cùng cần ${banKinhNgoaiCung * 2}px ⇒ bị cắt mép.`);
});

test('MÀU VÒNG ĐỌC TỪ TOKEN — không mã màu cứng, kể cả ở nhánh chế độ tối', () => {
  // ⚠️ Bản trước chốt cứng `#60a5fa`/`#38bdf8` cho vòng lúc nghỉ ở chế độ tối. Hai mã xanh lam ấy
  // không thuộc bảng màu nào của 5 skin, nên vòng đồng hồ là thứ DUY NHẤT trên màn hình không đổi
  // theo skin — và không có gì đỏ lên.
  const mapMatch = /const RING_COLORS = \{([\s\S]*?)\n\};/.exec(CODE);
  assert.ok(mapMatch, 'Không tìm thấy `RING_COLORS`.');
  const cứng = [...mapMatch[1].matchAll(/#[0-9a-fA-F]{3,8}|rgba?\(/g)].map((m) => m[0]);
  assert.deepEqual(cứng, [], `RING_COLORS còn mã màu cứng: ${cứng.join(', ')}`);

  const breakLine = /const breakRingColor = ([^;]+);/.exec(CODE);
  assert.ok(breakLine, 'Không tìm thấy `breakRingColor`.');
  assert.match(breakLine[1], /var\(--good\)/,
    'Nghỉ ngắn và nghỉ dài đều phải dùng `var(--good)`.');
  assert.ok(!/#[0-9a-fA-F]{3,8}/.test(breakLine[1]),
    `\`breakRingColor\` còn mã màu cứng: ${breakLine[1].trim()}`);
  assert.ok(!/lightTheme/.test(breakLine[1]),
    'Màu vòng không được rẽ theo `lightTheme`: token đã tự đổi theo cả skin lẫn chế độ sáng/tối.');

  assert.match(CODE, /\[TIMER_STATES\.RUNNING\]: 'var\(--accent\)'/,
    'Đang tập trung phải dùng `var(--accent)`.');
});

test('VÒNG NỀN và VÒNG MỤC TIÊU dùng đúng token đã chốt', () => {
  assert.match(CODE, /stroke: 'var\(--timer-track/, 'Vòng nền phải dùng `var(--timer-track)`.');
  assert.match(CODE, /stroke: 'var\(--warn\)'/, 'Vòng mục tiêu ngày phải dùng `var(--warn)`.');
});

test('HAI ĐẦU VÒNG BO TRÒN — cả vòng chính lẫn vòng mục tiêu', () => {
  const caps = [...CODE.matchAll(/strokeLinecap="(\w+)"/g)].map((m) => m[1]);
  assert.ok(caps.length >= 3, `Chỉ thấy ${caps.length} khai báo strokeLinecap — bộ trích đã hỏng.`);
  assert.deepEqual([...new Set(caps)], ['round'], `Có đầu vòng không bo tròn: ${caps.join(', ')}`);
});

test('KHÔNG VẼ VÒNG MỤC TIÊU KHI CHƯA ĐẶT MỤC TIÊU — một vòng rỗng đọc ra thành "chưa làm gì"', () => {
  assert.match(CODE, /\{dailyGoal\.hasGoal && \(/,
    'Vòng mục tiêu phải nằm sau một cổng `dailyGoal.hasGoal`.');
  // Và dòng chữ cũng vậy — hai thứ cùng nói về mục tiêu thì phải cùng ẩn/hiện.
  assert.equal((CODE.match(/dailyGoal\.hasGoal && \(/g) ?? []).length, 2,
    'Cả VÒNG lẫn DÒNG CHỮ tiến độ ngày đều phải được gác bởi `hasGoal` — thiếu một cái thì màn hình\n'
    + 'sẽ hiện "Phiên 0/0 hôm nay" hoặc một vòng rỗng.');
});

test('TIẾN ĐỘ NGÀY LẤY TỪ NGUỒN CHUNG, không tự tính lại', () => {
  // ⚠️ Nếu file này tự tính, con số quanh đồng hồ sẽ trôi khỏi thẻ "Hôm nay" ở cột bên phải —
  // hai con số khác nhau, cách nhau vài phân, trên cùng một màn hình.
  assert.match(CODE, /getDailyGoalProgress\(\{/,
    'Phải gọi `getDailyGoalProgress` từ `engine/gameMath` chứ không tự cộng lại.');
  assert.ok(!/dailyTracking\?\.date === /.test(CODE),
    'Đang tự đếm phiên hôm nay tại chỗ — dùng helper chung ở `gameMath.js`.');
});

test('VÒNG TRÒN kẹp 100% nhưng DÒNG CHỮ thì nói thật con số đã vượt', () => {
  // Vẽ quá một vòng là vẽ đè lên chính nó ⇒ 120% trông y hệt 20%.
  assert.match(CODE, /goalRingDashoffset[\s\S]{0,160}Math\.min\(100/,
    'Độ lệch nét của vòng mục tiêu phải kẹp ở 100%.');
  const line = /`Phiên \$\{dailyGoal\.currentValue\}\/\$\{dailyGoal\.goalValue\} hôm nay`/.exec(CODE);
  assert.ok(line, 'Không tìm thấy dòng "Phiên N/M hôm nay".');
  assert.ok(!/Math\.min[^`]*Phiên \$\{/.test(CODE),
    'Dòng chữ KHÔNG được kẹp — vượt mục tiêu thì phải nói thật là "Phiên 6/4".');
});
