/**
 * CỔNG "ẢNH CŨ HƠN MÃ" của `sweep-score.mjs` — bài test HÀNH VI, không phải bài test đọc mã.
 *
 * ⚠️ VÌ SAO BÀI NÀY TỒN TẠI. Dự án đã ba lần suýt (hoặc thật sự) rút ra một kết luận mỹ thuật từ
 * một tấm ảnh dựng TRƯỚC lần sửa mã gần nhất:
 *   • Phase 13 VIỆC B — cổng cache `[ -f "$png" ] ||` biến sự tồn tại của một TÊN FILE thành bằng
 *     chứng về NỘI DUNG file; bảng số ra "kỷ 1 đổi 74,2% khung hình", sự thật là 0,30%.
 *   • Phase 14 §1(3) — suýt chấm một bản quét chưa dựng xong.
 *   • Phase 23 — ảnh dựng 21:02, `residents.js` sửa 21:33, và một lời "không trôi" ĐÃ được viết ra
 *     dựa trên tấm ảnh cũ ấy. Chỉ phép kiểm `mtime` thủ công mới lôi nó ra.
 * CLAUDE.md đã ghi luật này thành CHỮ từ Phase 14. Chữ không chặn được gì — bài này là cái răng.
 *
 * ⚠️ HAI VẾ, VÀ VẾ THỨ HAI MỚI LÀ VẾ HAY BỊ QUÊN:
 *   (1) ảnh CŨ hơn mã ⇒ PHẢI từ chối (mã thoát 2);
 *   (2) ảnh MỚI hơn mã ⇒ PHẢI cho qua. Thiếu vế này thì một cổng luôn-luôn-kêu vẫn xanh, mà một
 *       cảnh báo kêu oan còn tệ hơn không có cảnh báo (bài học `.city-preview/` ở Performance Gate).
 *
 * ⚠️ Bài chạy được mà KHÔNG cần một tấm PNG thật, vì cổng nằm TRƯỚC `decodePng` — cố ý: một phép
 * kiểm rẻ thì mới được chạy, và nó phải từ chối trước khi tốn công giải mã 8 MB.
 *
 * THỬ-CHO-ĐỎ (đã chạy thật, không chép lại từ bài khác):
 *   • gỡ khối `if (tNguon > 0 && tNguon > tAnh)` ⇒ vế (1) đỏ;
 *   • đổi `tNguon > tAnh` thành `tNguon >= 0` ⇒ vế (2) đỏ.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'sweep-score.mjs');

const GEOM = {
  png: 'sweep-light-ky1-15.png',
  pad: 0, xLabel: 60, yHeader: 30, cellW: 300, cellH: 186, labelH: 22,
  eras: [1, 2, 3], hours: [6, 8, 12, 15, 18, 22],
  theme: 'light', level: 3, sessions: 40, t: 17.5,
};

/** Dựng một cây mã giả tối thiểu + một tấm ảnh, rồi ĐẶT TAY mốc thời gian của cả hai. */
function dungCay({ anhTre }) {
  const goc = mkdtempSync(join(tmpdir(), 'sweep-gate-'));
  mkdirSync(join(goc, 'src/engine/city3d'), { recursive: true });
  mkdirSync(join(goc, 'src/components/city/render3d'), { recursive: true });
  mkdirSync(join(goc, 'scripts'), { recursive: true });
  mkdirSync(join(goc, '.city-preview'), { recursive: true });

  const nguon = join(goc, 'src/engine/city3d/residents.js');
  writeFileSync(nguon, '// nguồn giả\n');
  writeFileSync(join(goc, 'src/components/city/render3d/sceneGraph.js'), '// nguồn giả\n');
  writeFileSync(join(goc, 'scripts/city-preview.mjs'), '// nguồn giả\n');

  const png = join(goc, '.city-preview/sweep-light-ky1-15.png');
  writeFileSync(png, '');                       // cổng nằm TRƯỚC decodePng ⇒ file rỗng là đủ
  writeFileSync(join(goc, '.city-preview/sweep-light-ky1-15.geom.json'), JSON.stringify(GEOM));

  // Mốc thời gian đặt TAY, không dựa vào thứ tự ghi file — thứ tự ghi có độ phân giải quá thô.
  const nay = Date.now() / 1000;
  utimesSync(nguon, nay, nay);
  utimesSync(png, nay + (anhTre ? -600 : 600), nay + (anhTre ? -600 : 600));
  return { goc, png };
}

function chay(png) {
  try {
    execFileSync('node', [SCRIPT, png], { encoding: 'utf8', stdio: 'pipe' });
    return { ma: 0, ra: '' };
  } catch (e) {
    return { ma: e.status, ra: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

test('CỔNG ẢNH CŨ: ảnh dựng TRƯỚC lần sửa mã gần nhất ⇒ TỪ CHỐI, không in bảng số', () => {
  const { goc, png } = dungCay({ anhTre: true });
  try {
    const { ma, ra } = chay(png);
    assert.equal(ma, 2, 'phải thoát mã 2 (từ chối), không phải chấm rồi in số');
    assert.match(ra, /ẢNH CŨ HƠN MÃ/, 'thông báo phải nói rõ ảnh cũ hơn mã');
    // ⚠️ Một thông báo lỗi mà người nhận không biết phải gõ gì thì bằng không có thông báo
    //    (bài học bộ đo MacBook, vòng 4). Phải kèm ĐÚNG MỘT lệnh copy-paste được.
    assert.match(ra, /city-preview\.mjs --sweep/, 'phải in ra lệnh dựng lại');
    assert.ok(!/cặp gần nhất/.test(ra), 'TUYỆT ĐỐI không được in bảng số của một ảnh cũ');
  } finally { rmSync(goc, { recursive: true, force: true }); }
});

test('⚠️ ĐỐI CHỨNG: ảnh MỚI hơn mã thì cổng phải IM — nó không được kêu oan', () => {
  const { goc, png } = dungCay({ anhTre: false });
  try {
    const { ma, ra } = chay(png);
    // Ảnh rỗng nên `decodePng` sẽ ném — nhưng cái ném ấy phải đến SAU cổng, tức thông báo
    // KHÔNG được là "ẢNH CŨ HƠN MÃ". Đó chính là điều cần chứng minh.
    assert.ok(!/ẢNH CŨ HƠN MÃ/.test(ra),
      `cổng kêu oan trên một tấm ảnh mới hơn mã:\n${ra.slice(0, 400)}`);
    assert.notEqual(ma, undefined);
  } finally { rmSync(goc, { recursive: true, force: true }); }
});
