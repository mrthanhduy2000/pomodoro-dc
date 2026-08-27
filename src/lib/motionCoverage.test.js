/**
 * motionCoverage.test.js — CỔNG CHẶN HỒI QUY cho ba nhịp chuyển động.
 * ─────────────────────────────────────────────────────────────────────────────
 * VÌ SAO CẦN: `motionPresets.test.js` canh ba nhịp có ĐÚNG không. Nó KHÔNG canh được việc cả app
 * có DÙNG chúng không — một file mới hoàn toàn có thể gõ lại `initial={{ opacity: 0, y: 20 }}` và
 * mọi cổng đều xanh. Đó chính xác là cách hơn ba mươi file trôi thành 5 thời lượng và 7 đường cong.
 * Definition of Done có ghi "tài liệu đã đồng bộ", nhưng **một câu chữ thì không đỏ lên được**.
 *
 * CÁCH CANH: đếm khai báo chuyển động RỜI RẠC ở từng file, rồi so với một BẢNG NGOẠI LỆ TƯỜNG MINH.
 * File nào không có tên trong bảng thì phải bằng 0. Đây đúng khuôn `assert.deepEqual(TRUOT, [4])`
 * mà dự án đã dùng cho địa hình: một con số trong bài test là cái hẹn giờ duy nhất tự đòi được đọc.
 *
 * ⚠️ THÊM MỘT DÒNG VÀO BẢNG NÀY LÀ MỘT QUYẾT ĐỊNH, KHÔNG PHẢI MỘT THAO TÁC DỌN DẸP. Mỗi con số ở
 * đây là một chỗ mã KHÔNG đi qua ba nhịp; nâng nó lên thì phải trả lời được *"vì sao chỗ này không
 * dùng được `enter`/`press`/`reward`?"* ngay tại chỗ, bằng một dòng chú thích trong chính file ấy.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const SRC = new URL('../', import.meta.url).pathname;

/**
 * ⚠️ `src/components/city/render3d/` ĐỨNG NGOÀI CÓ CHỦ ĐÍCH: chuyển động của thành phố 3D chạy
 * bằng three.js trong một vòng lặp render riêng, không phải framer-motion. Ba nhịp không áp được.
 */
const NGOAI_PHAM_VI = 'components/city/render3d';

/**
 * BẢNG NGOẠI LỆ — mỗi dòng là số khai báo rời rạc CÒN LẠI ở file ấy, và mỗi khai báo ấy đã có một
 * dòng chú thích nêu lý do ngay tại chỗ. Ba nhóm lý do, không có nhóm thứ tư:
 *
 *   · MANG BỐ CỤC — `animate` khai ra chính bố cục (bề dài thanh tiến độ, bề ngang cột…), và giá
 *     trị đọc từ biến vòng lặp nên không nhấc lên tầng hook được. Đi qua `useSnapMotion`.
 *   · SO LE — danh sách hiện lệch giờ nhau; chỗ nào dời được bằng `withDelay` thì đã dời rồi, chỗ
 *     còn lại có thêm `scale`/`spring` riêng.
 *   · CẢNH DIỄN — `CityGrowthMoment` là một đoạn phim 3,2 giây tự dựng nhịp của nó. Nó KHÔNG hề
 *     được dựng khi bật Giảm chuyển động (bên gọi ở `App.jsx` chặn từ đầu), nên nó không phá lời
 *     hứa nào; ép nó vào `enter` là làm hỏng một cảnh diễn đã có ba luật cứng riêng.
 */
const NGOAI_LE = {
  'components/BuildingWorkshop.jsx': 2,      // mang bố cục: thanh tiến độ xây
  'components/DailyMissions.jsx': 2,         // mang bố cục: thanh tiến độ nhiệm vụ
  'components/LevelUpModal.jsx': 3,          // pháo hoa — `ParticleField` trả `null` khi Giảm chuyển động
  'components/LootDropModal.jsx': 9,         // so le (2 chỗ) + mưa hạt (trả `null` khi Giảm chuyển động)
  'components/PomodoroEngine.jsx': 3,        // `ActionButton` (lún = chiều dày bóng) + thẻ preset đang chọn
  'components/RankDisplay.jsx': 6,           // mang bố cục: 3 thanh tiến độ
  'components/ResourceDisplay.jsx': 2,       // mang bố cục: thanh chặng
  'components/StatsDashboard.jsx': 4,        // mang bố cục: cột phân bố + thanh loại việc
  'components/WeeklyReportModal.jsx': 8,     // mang bố cục: 4 thanh so sánh tuần
  'components/city/CityGrowthMoment.jsx': 13, // cảnh diễn 3,2 giây, không dựng khi Giảm chuyển động
  'components/city/CityViewShell.jsx': 2,    // mang bố cục: thanh tiến độ giàn giáo
};

/**
 * Đếm khai báo chuyển động RỜI RẠC — thuần, để bài đối chứng bên dưới đo được chính nó.
 *
 * ⚠️ KHÔNG neo vào ĐẦU DÒNG. Bản đầu viết `/^\s*(initial|…)=\{/gm` và phép thử ngược cho thấy
 * nó **mù với khai báo viết chung dòng với thẻ** (`<motion.div initial={{opacity:0}} animate=…>`)
 * — một lối viết CÓ THẬT trong chính kho này. Một cổng chỉ bắt được lối viết dễ thấy nhất thì
 * lối viết còn lại thành cửa sau, và nó sẽ mở đúng lúc có người viết gọn một dòng cho nhanh.
 *
 * Bỏ chú thích trước khi đếm: chú thích của chính file này (và của `motionPresets.js`) có nêu ví
 * dụ, mà một ví dụ trong lời giải thích không phải một khai báo thật.
 *
 * `initial={false}` được MIỄN TRỪ có chủ ý: nó không mang nhịp nào — nó là cách nói "đừng chạy
 * hoạt hoạ lúc gắn vào", và `AnimatePresence` cũng dùng đúng chữ ấy làm một prop bình thường.
 */
export function demKhaiBaoRoiRac(source) {
  const maThuan = source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/^\s*\/\/.*$/gm, ' ')
    .replace(/\binitial=\{false\}/g, ' ');
  return (maThuan.match(/\b(?:initial|animate|transition|exit|whileHover|whileTap)=\{/g) ?? []).length;
}

async function moiFileJsx(dir) {
  const ra = [];
  for (const muc of await readdir(dir, { withFileTypes: true })) {
    const duong = join(dir, muc.name);
    if (muc.isDirectory()) ra.push(...await moiFileJsx(duong));
    else if (muc.name.endsWith('.jsx')) ra.push(duong);
  }
  return ra;
}

test('MỌI FILE NGOÀI BẢNG NGOẠI LỆ PHẢI ĐI QUA BA NHỊP', async () => {
  const files = (await moiFileJsx(SRC))
    .map((f) => relative(SRC, f))
    .filter((f) => !f.startsWith(NGOAI_PHAM_VI))
    .sort();

  // Gác chạy-rỗng: đường dẫn sai thì mọi phép so bên dưới thành vô nghĩa và bài test xanh vĩnh viễn.
  assert.ok(files.length >= 30, `Chỉ quét được ${files.length} file .jsx — đường dẫn có thể đã sai.`);

  const thua = [];
  const daDem = {};
  for (const f of files) {
    const n = demKhaiBaoRoiRac(await readFile(join(SRC, f), 'utf8'));
    if (n > 0) daDem[f] = n;
    const cho = NGOAI_LE[f] ?? 0;
    if (n > cho) thua.push(`${f}: ${n} (bảng cho ${cho})`);
  }

  assert.deepEqual(thua, [],
    'Có file khai chuyển động RỜI RẠC nhiều hơn bảng ngoại lệ cho phép:\n  ' + thua.join('\n  ')
    + '\n\nDùng ba nhịp ở `src/lib/motionPresets.js` (`enter`/`press`/`reward`). Thật sự không vừa\n'
    + 'nhịp nào thì đi qua `useCustomMotion`/`useSnapMotion`, kèm một dòng chú thích nêu lý do, RỒI\n'
    + 'mới nâng con số trong bảng `NGOAI_LE` — theo đúng thứ tự đó.');

  // ⚠️ Vế NGƯỢC LẠI, và nó mới là vế giữ cho bảng không phình: một dòng ngoại lệ đã được dọn xong
  // thì phải BIẾN MẤT khỏi bảng. Không có vế này thì bảng chỉ có thể to ra, và những con số cũ sẽ
  // lặng lẽ thành chỗ trống cho khai báo rời rạc MỚI chui vào.
  const thuaTrongBang = Object.keys(NGOAI_LE).filter((f) => (daDem[f] ?? 0) < NGOAI_LE[f]);
  assert.deepEqual(thuaTrongBang, [],
    'Những file này nay ÍT khai báo rời rạc hơn bảng ghi — tin tốt, nhưng phải hạ con số trong\n'
    + '`NGOAI_LE` xuống cho khớp, nếu không phần dư sẽ thành chỗ trống miễn phí cho lần trôi sau:\n  '
    + thuaTrongBang.map((f) => `${f}: thật ${daDem[f] ?? 0}, bảng ${NGOAI_LE[f]}`).join('\n  '));
});

test('ĐỐI CHỨNG — phép đếm phải THẬT SỰ bắt được một khai báo rời rạc', () => {
  // Không có bài này thì một regex hỏng sẽ làm bài trên xanh vĩnh viễn về một thế giới không tồn tại.
  const sach = '    <Motion.div {...enterMotion} className="x">\n';
  const ban = '    <Motion.div\n      initial={{ opacity: 0, y: 20 }}\n      animate={{ opacity: 1, y: 0 }}\n';

  assert.equal(demKhaiBaoRoiRac(sach), 0, 'Mã đã dùng preset thì phải đếm ra 0.');
  assert.equal(demKhaiBaoRoiRac(ban), 2, 'Hai dòng khai rời rạc thì phải đếm ra 2.');
  assert.equal(demKhaiBaoRoiRac(sach + ban), 2, 'Trộn lẫn thì chỉ đếm phần rời rạc.');

  // ⚠️ CA NÀY NHỐT ĐÚNG LỖI ĐÃ TÌM RA (2026-08-27). Bản đầu của `demKhaiBaoRoiRac` neo vào ĐẦU
  // DÒNG nên nó đếm ra 0 ở đây, và cả cổng lặng lẽ mù với lối viết gọn một dòng — thứ có thật
  // trong kho này (`FocusRail.jsx` có 3 dòng như vậy, `BuildingWorkshop.jsx` có 2). Bốn phép thử
  // ngược khác đều ĐỎ mà ca này thì không, vì sau khi dọn xong thì mọi khai báo CÒN LẠI đều tình
  // cờ nằm ở đầu dòng ⇒ phép quét file không phân biệt được hai bản regex. Chỉ ca tổng hợp này
  // mới phân biệt được, nên nó là thứ DUY NHẤT chặn được hồi quy của chính phép đếm.
  const gonMotDong = '    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />\n';
  assert.equal(demKhaiBaoRoiRac(gonMotDong), 2,
    'Phép đếm đang MÙ với khai báo viết chung dòng với thẻ. Đừng neo regex vào đầu dòng.');

  // Chú thích không phải mã: một ví dụ nêu trong lời giải thích không được tính là khai báo thật.
  assert.equal(demKhaiBaoRoiRac('  // vd: initial={{ opacity: 0 }}\n'), 0, 'Chú thích một dòng phải được bỏ qua.');
  assert.equal(demKhaiBaoRoiRac('  /* animate={{ x: 1 }} */\n'), 0, 'Chú thích khối phải được bỏ qua.');

  // `initial={false}` không mang nhịp nào — nó nói "đừng chạy hoạt hoạ lúc gắn vào".
  assert.equal(demKhaiBaoRoiRac('  <motion.div initial={false} animate={{ y: 0 }} />\n'), 1,
    '`initial={false}` phải được miễn trừ, còn `animate` bên cạnh thì vẫn phải đếm.');

  // Và phải bắt đủ SÁU thuộc tính, không chỉ hai cái dễ nghĩ tới nhất.
  for (const prop of ['initial', 'animate', 'transition', 'exit', 'whileHover', 'whileTap']) {
    assert.equal(demKhaiBaoRoiRac(`      ${prop}={{ x: 1 }}\n`), 1, `Bỏ sót thuộc tính \`${prop}\`.`);
  }
});
