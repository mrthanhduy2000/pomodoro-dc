import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * THANH TIÊU ĐỀ PHẢI ĐO **CHẶNG**, KHÔNG ĐO CẢ KỶ — canh bằng cách đọc mã nguồn.
 *
 * ⚠️ Đây là thứ hỏng theo kiểu im lặng nhất có thể: đổi `eraStage.progress` về `eraProgress` thì
 * build xanh, lint sạch, mọi bài test khác xanh, thanh vẫn chạy — chỉ là nó chậm lại 3 lần và đầy
 * một lần mỗi 1–6 tháng thay vì ba lần mỗi kỷ. Không ai nhận ra trong nhiều tuần.
 *
 * ⚠️ Và bài thứ hai về VỊ TRÍ, cùng lý do đã ghi ở `focusNextActionWiring.test.js`: thanh chặng
 * ĐÃ tồn tại ở `ResourceDisplay` từ lâu, nhưng thẻ đó nằm trong cột `hidden … lg:flex` nên trên
 * iPhone Đàm chưa bao giờ nhìn thấy nó. Cả thay đổi này chỉ có nghĩa nếu nó ở chỗ CẢ HAI nền tảng
 * đều thấy.
 */

const HERE = dirname(fileURLToPath(import.meta.url));
const APP = readFileSync(join(HERE, '..', 'App.jsx'), 'utf8');
const RESOURCE = readFileSync(join(HERE, 'ResourceDisplay.jsx'), 'utf8');

function codeOnly(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*)/.test(line))
    .join('\n');
}

const APP_CODE = codeOnly(APP);

test('thanh tiêu đề dựng bề rộng từ tiến độ CHẶNG', () => {
  assert.ok(
    /width:\s*`\$\{\(eraStage \? eraStage\.progress : eraProgress\)/.test(APP_CODE),
    'thanh tiêu đề không còn đo chặng — nó đã quay về đo cả kỷ (~1%/phiên, đầy 1 lần mỗi 1–6 tháng)',
  );
});

test('thanh tiêu đề nằm NGOÀI mọi khối chỉ-desktop', () => {
  // Neo bằng quan hệ chứ không bằng số dòng: `TopRail` là thanh chung của mọi khổ màn hình, còn
  // `lg:hidden` ngay dưới nó là khối thống kê riêng cho điện thoại — tức TopRail chắc chắn hiện
  // ở cả hai. Đòi thanh chặng nằm trong TopRail là đòi đúng điều đó.
  const topRail = APP_CODE.indexOf('function TopRail(');
  const stageBar = APP_CODE.indexOf('eraStage ? eraStage.progress');
  assert.ok(topRail > 0 && stageBar > topRail, 'thanh chặng không nằm trong `TopRail`');

  const sau = APP_CODE.slice(topRail, stageBar);
  assert.ok(
    !/hidden[^"'`]*\blg:flex\b/.test(sau),
    'thanh chặng lọt vào một khối `hidden … lg:flex` — iPhone sẽ không thấy, đúng cái đã xảy ra với '
    + '`ResourceDisplay` suốt thời gian qua',
  );
});

test('MỘT LUẬT MỘT CÔNG THỨC: không nơi nào dựng lại phép chia chặng', () => {
  // `ResourceDisplay` từng giữ bản sao riêng (`getCurrentStage`). Hai bản sao trôi khỏi nhau ở
  // BIÊN rồi thanh trên nói "chặng 2" trong khi thẻ dưới nói "chặng 1", và không có gì đỏ lên.
  assert.ok(
    /from '\.\.\/engine\/eraStage'/.test(RESOURCE),
    '`ResourceDisplay` không còn đọc `engine/eraStage` — nó đã có công thức riêng ở đâu đó',
  );
  for (const source of [APP, RESOURCE]) {
    assert.ok(
      !/function getCurrentStage\b/.test(source),
      'phép chia chặng được dựng lại lần thứ hai ở tầng giao diện',
    );
  }
});

test('dòng đếm ngược ở CỘT GIỮA, cạnh hai dòng kia', () => {
  assert.ok(/<FocusStageCountdown\b/.test(APP_CODE), '`FocusStageCountdown` không được dựng ở đâu cả');
  const tease = APP_CODE.indexOf('<FocusCityTease');
  const countdown = APP_CODE.indexOf('<FocusStageCountdown');
  assert.ok(tease > 0 && countdown > tease, 'không đứng sau `FocusCityTease` — bố cục đã đổi, đọc lại');
  // ⚠️ Tìm đồng hồ SAU mốc neo: `App.jsx` dựng `<PomodoroEngine>` ở HAI nhánh (toàn màn hình và
  // cột giữa), `indexOf` từ đầu file sẽ bắt nhánh của màn hình KHÁC.
  const dongHo = APP_CODE.indexOf('<PomodoroEngine', tease);
  assert.ok(dongHo > countdown, 'dòng bị đẩy xuống dưới đồng hồ, tức dưới nếp gấp trên iPhone');
});

/* ─── PHẦN THƯỞNG KHI TỚI ĐÍCH, VÀ CHUỖI ĐANG TREO ──────────────────────────── */

test('lời chúc mừng vượt mốc phải BẤM ĐƯỢC để tắt', () => {
  const src = readFileSync(join(HERE, 'FocusStageCountdown.jsx'), 'utf8');
  assert.ok(/tone === 'celebrate'/.test(src), 'dòng không còn biết tới trạng thái vừa-vượt-mốc');
  // ⚠️ Nó CHIẾM CHỖ của dòng đếm ngược, nên phải có đường trả lại chỗ ấy. Không có `dismiss` thì
  // lời chúc mừng ở lại vĩnh viễn và Đàm mất luôn dòng "còn ~N phiên nữa" của chặng kế tiếp.
  assert.ok(/onClick=\{countdown\.dismiss\}/.test(src), 'lời chúc mừng không tắt được');
});

test('dấu "đã ăn mừng" ở localStorage, KHÔNG ở state đồng bộ', () => {
  const hook = readFileSync(join(HERE, '..', 'hooks', 'useStageCountdown.js'), 'utf8');
  assert.ok(/dc-stage-seen-v1/.test(hook), 'không còn khoá localStorage — dấu đã đi đâu?');
  // ⚠️ Đẩy dấu này vào `gameStore` thì xem trên iPhone sẽ tắt mất lời chúc mừng trên Mac, VÀ nó
  // thêm một trường nữa vào khối JSONB đang chịu cơ chế CAS "First Action Wins".
  assert.ok(
    !/setStageSeen|stageSeenKey:/.test(readFileSync(join(HERE, '..', 'store', 'gameStore.js'), 'utf8')),
    'dấu "đã ăn mừng" lọt vào gameStore — nó là chuyện của TỪNG MÁY',
  );
});

test('ô Chuỗi báo treo bằng CẢ chữ lẫn màu, không chỉ màu', () => {
  // Chỉ đổi màu thì người không phân biệt được màu sẽ không nhận ra gì — cùng luật ADR-060 đã áp
  // cho thẻ phần thưởng (độ hiếm phải đọc được KHI KHÔNG NHÌN MÀU).
  assert.ok(/streakRisk\?\.atRisk \? 'Chuỗi ⚠' : 'Chuỗi'/.test(APP_CODE),
    'nhãn ô Chuỗi không còn đổi theo trạng thái treo');
  assert.ok(/atRisk \? 'var\(--accent2\)' : 'var\(--line\)'/.test(APP_CODE),
    'viền ô Chuỗi không còn đổi theo trạng thái treo');
});

test('ô Chuỗi nằm ở thanh tiêu đề — chỗ CẢ HAI nền tảng đều thấy', () => {
  // Thẻ "Chuỗi" đầy đủ đã có ở `FocusRail`, nhưng cột đó là `hidden … lg:flex`. Nếu cảnh báo treo
  // chỉ nằm ở đó thì nó chỉ tới được Đàm khi anh ngồi máy bàn — tức gần như không bao giờ.
  const topRail = APP_CODE.indexOf('function TopRail(');
  const canhBao = APP_CODE.indexOf("'Chuỗi ⚠'");
  assert.ok(topRail > 0 && canhBao > topRail, 'cảnh báo treo không nằm trong `TopRail`');
});
