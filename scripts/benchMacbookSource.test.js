/**
 * benchMacbookSource.test.js — KHOÁ HAI LỜI HỨA CỦA BỘ ĐO, bằng TEST chứ không bằng chú thích.
 *
 * ⚠️ VÌ SAO FILE NÀY TỒN TẠI (TECH_DEBT #34 + #35, vòng 4 của Performance Gate). Để lấy được bộ số
 * trên MacBook, Đàm — người KHÔNG biết code — đã phải qua lại 5 vòng vì bộ đo hỏng ở những chỗ
 * chẳng liên quan gì tới hiệu năng: nhánh chưa `git fetch`, `package.json` bẩn chặn checkout,
 * `three` chưa cài (đổ ra 20 dòng ngăn xếp Vite), và một đường dẫn đầy dấu tiếng Việt mà bộ đo
 * chưa từng được thử. `CLAUDE.md` đã có sẵn bài học "BẪY 2" về NFC/NFD ở ĐÚNG đường dẫn đó — bài
 * học nằm sẵn trong nhà mà công cụ mới vẫn không được thử ở điều kiện ấy. Đúng kết luận dự án đã
 * rút ra nhiều lần: **một bài học được ghi ra KHÔNG chặn được gì; chỉ một bài TEST mới chặn được.**
 *
 * ⚠️ GIỚI HẠN PHẢI ĐỌC TRƯỚC KHI TIN FILE NÀY — ĐỪNG ĐỂ PHIÊN SAU TƯỞNG ĐÃ BẢO CHỨNG XONG:
 * Linux (nơi các bài này chạy) lưu tên file NGUYÊN BYTE, không chuẩn hoá gì cả. macOS thì lưu ở
 * dạng **NFD** (dấu tách rời khỏi chữ cái) và một số tầng lại trả về NFC. Nên bài test dưới đây
 * chứng minh được rằng đường dẫn có **dấu cách + ký tự nhiều byte** đi trọn vẹn qua mọi lệnh của
 * bộ đo — nhưng nó **KHÔNG** chứng minh được hành vi chuẩn-hoá thật của macOS. Phần ấy chỉ máy Đàm
 * mới kiểm được, và nó nằm thành một dòng trong runbook ở `PERFORMANCE.md`.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import {
  mkdtempSync, mkdirSync, rmSync, cpSync, symlinkSync, writeFileSync, readFileSync, readdirSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const GOC = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KICH_BAN = join(GOC, 'scripts', 'bench-macbook.sh');

/**
 * Dựng một dự án giả ở `thuMuc`: scripts thật + package.json thật + node_modules nối mềm.
 *
 * `coThree: false` dựng ca ĐÃ CẮN ĐÀM THẬT — có `node_modules` đầy đủ nhưng THIẾU đúng `three`
 * (xảy ra khi `npm install` chạy lúc `package.json` còn là bản cũ, npm báo "up to date" rồi đi).
 * ⚠️ Phải nối mềm từng gói một chứ không thể chỉ bỏ `node_modules` đi: bỏ cả thư mục thì mục kiểm
 * số 1 bắt trước, và mục kiểm số 2 KHÔNG BAO GIỜ ĐƯỢC CHẠY. Chính phép thử ngược đã lộ ra điều đó
 * — gỡ hẳn mục 2 khỏi script mà bài test vẫn xanh, vì nó chưa từng với tới mục 2.
 */
function dungDuAn(thuMuc, { coNodeModules = true, coThree = true } = {}) {
  mkdirSync(thuMuc, { recursive: true });
  cpSync(join(GOC, 'scripts'), join(thuMuc, 'scripts'), { recursive: true });
  cpSync(join(GOC, 'package.json'), join(thuMuc, 'package.json'));
  if (coNodeModules && coThree) {
    symlinkSync(join(GOC, 'node_modules'), join(thuMuc, 'node_modules'), 'dir');
  } else if (coNodeModules) {
    const dich = join(thuMuc, 'node_modules');
    mkdirSync(dich, { recursive: true });
    for (const goi of readdirSync(join(GOC, 'node_modules'))) {
      if (goi === 'three') continue;
      symlinkSync(join(GOC, 'node_modules', goi), join(dich, goi), 'dir');
    }
  }
  return thuMuc;
}

/**
 * Chạy preflight (dừng trước khi gói bundle) và trả về { ma, ra }.
 *
 * `duongDanTuyetDoi` dùng cho ca "đứng nhầm thư mục": ở đó `scripts/bench-macbook.sh` không tồn
 * tại nên chính `bash` sẽ kêu "No such file or directory" trước khi script kịp chạy — tức mục kiểm
 * 0b chỉ với tới được khi người dùng gọi bằng đường dẫn tuyệt đối, hoặc khi có thư mục `scripts/`
 * mà thiếu `package.json`. (Ca gọi tương đối thì câu bash tự in ra cũng đã đủ rõ.)
 */
function chayPreflight(thuMuc, moiTruong = {}, duongDanTuyetDoi = false) {
  try {
    const ra = execFileSync('bash', [duongDanTuyetDoi ? KICH_BAN : 'scripts/bench-macbook.sh', '--thu'], {
      cwd: thuMuc,
      encoding: 'utf8',
      env: { ...process.env, BENCH_CHI_KIEM: '1', ...moiTruong },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { ma: 0, ra };
  } catch (e) {
    return { ma: e.status ?? -1, ra: `${e.stdout ?? ''}${e.stderr ?? ''}` };
  }
}

// ══════════════════════════════════════════════════════════════════════════════════════════
//  1. ĐƯỜNG DẪN CÓ DẤU TIẾNG VIỆT + DẤU CÁCH (TECH_DEBT #35)
// ══════════════════════════════════════════════════════════════════════════════════════════

// Đúng hình dạng thư mục thật trên máy Đàm: `Bản sao Pomodoro Game - USING` — vừa có dấu, vừa có
// dấu cách, vừa có dấu gạch nối. Chạy CẢ HAI dạng chuẩn hoá vì macOS và Linux không đồng ý với
// nhau về chuyện dấu nằm rời hay dính vào chữ cái.
const TEN_GOC = 'Bản sao Test - CÓ DẤU';
for (const dang of ['NFC', 'NFD']) {
  test(`preflight chạy trọn vẹn ở đường dẫn có dấu + dấu cách (${dang})`, () => {
    const cha = mkdtempSync(join(tmpdir(), 'bench-dau-'));
    const duAn = join(cha, TEN_GOC.normalize(dang));
    try {
      dungDuAn(duAn);
      const { ma, ra } = chayPreflight(duAn);

      // Mọi mục kiểm phải ĐẠT — tức đường dẫn đi qua được `cd`, `$PWD`, hai lần gọi `node`
      // (đọc phiên bản three + hỏi Chromium), `mkdir`, ghi file thử, và `df`.
      assert.equal(ma, 0, `preflight phải qua ở đường dẫn có dấu, nhưng thoát mã ${ma}.\n${ra}`);
      assert.match(ra, /✅ Thư mục dự án/, `không nhận ra thư mục dự án.\n${ra}`);
      assert.match(ra, /✅ node_modules\/three/, `không thấy three.\n${ra}`);
      assert.match(ra, /✅ Phiên bản three/, `không đọc được phiên bản — `
        + `dấu hiệu lệnh node bị đứt vì đường dẫn.\n${ra}`);
      assert.match(ra, /✅ Chromium/, `không hỏi được Chromium.\n${ra}`);
      assert.match(ra, /✅ Ghi được vào \.city-preview\//, `không ghi được.\n${ra}`);

      // Và đường dẫn phải hiện ra NGUYÊN VẸN, không bị cắt ở dấu cách đầu tiên.
      assert.ok(
        ra.includes(TEN_GOC.normalize(dang)) || ra.includes(TEN_GOC),
        `dòng "đang đứng ở" phải in đủ tên thư mục có dấu.\n${ra}`,
      );
    } finally {
      rmSync(cha, { recursive: true, force: true });
    }
  });
}

test('KHÔNG có node_modules ở đường dẫn có dấu → ĐÚNG một câu tiếng Việt + ĐÚNG một lệnh', () => {
  const cha = mkdtempSync(join(tmpdir(), 'bench-dau-'));
  const duAn = join(cha, TEN_GOC.normalize('NFD'));
  try {
    dungDuAn(duAn, { coNodeModules: false });
    const { ma, ra } = chayPreflight(duAn);

    assert.notEqual(ma, 0, 'thiếu thư viện thì phải thoát khác 0');
    assert.match(ra, /Chưa cài thư viện/, `\n${ra}`);
    assert.match(ra, /npm install --legacy-peer-deps/,
      `phải nói ĐÚNG lệnh cần gõ, không phải đổ lỗi kỹ thuật.\n${ra}`);
    assert.doesNotMatch(ra, /Rolldown|vite|viteLog/i,
      `preflight phải bắt được TRƯỚC khi Vite kịp nói gì.\n${ra}`);
  } finally {
    rmSync(cha, { recursive: true, force: true });
  }
});

test('CÓ node_modules nhưng THIẾU three → vẫn bắt được TRƯỚC khi Vite kịp nói gì', () => {
  // ⚠️ ĐÂY LÀ CA ĐÃ CẮN ĐÀM THẬT, và là lời hứa cốt lõi của `TECH_DEBT #34`. Nó KHÁC hẳn ca trên:
  // ở đó thiếu cả `node_modules` nên mục kiểm số 1 bắt; ở đây `node_modules` đầy đủ, chỉ khuyết
  // đúng `three`, nên chỉ mục kiểm số 2 mới cứu được. Trước vòng 4, tới đây script im lặng chạy
  // tiếp rồi để Vite đổ ra ~20 dòng ngăn xếp.
  const cha = mkdtempSync(join(tmpdir(), 'bench-three-'));
  const duAn = join(cha, TEN_GOC.normalize('NFC'));
  try {
    dungDuAn(duAn, { coThree: false });
    const { ma, ra } = chayPreflight(duAn);

    assert.notEqual(ma, 0, 'thiếu three thì phải thoát khác 0');
    assert.match(ra, /✅ node_modules\/ — có/,
      `mục kiểm số 1 phải ĐẠT — nếu không thì bài này lại đang thử nhầm ca.\n${ra}`);
    assert.match(ra, /Thiếu thư viện 3D/, `\n${ra}`);
    assert.match(ra, /npm install --legacy-peer-deps/, `\n${ra}`);
    assert.doesNotMatch(ra, /Rolldown|viteLog/i,
      `phải bắt TRƯỚC khi gói bundle — đây chính là lỗi #34.\n${ra}`);
  } finally {
    rmSync(cha, { recursive: true, force: true });
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
//  2. MỌI BIẾN ĐƯỜNG DẪN PHẢI ĐƯỢC BỌC NHÁY KÉP (TECH_DEBT #35, vế "dấu cách")
// ══════════════════════════════════════════════════════════════════════════════════════════

/**
 * Những biến CHẮC CHẮN chỉ chứa số hoặc một từ không dấu cách ⇒ để trần cũng không vỡ.
 *
 * ⚠️ DANH SÁCH NÀY LÀ *CHO PHÉP*, KHÔNG PHẢI *CẤM* — tức mặc định là CẤM. Thêm một biến mới mà
 * quên bọc nháy thì bài test ĐỎ ngay, chứ không im lặng cho qua. Đó là chiều fail-closed: một danh
 * sách cấm sẽ luôn lạc hậu so với biến mới, còn danh sách cho phép thì không.
 */
const BIEN_SO_AN_TOAN = new Set([
  'THU', 'CHI_KIEM', 'SO_LOI', 'SO_CANH_BAO', 'DAT', 'TONG', 'DAU_TIEN', 'LON_DAT',
  'KHUNG', 'KHUNG_THU', 'RONG', 'CAO', 'RONG_LON', 'CAO_LON', 'DIA_TOI_THIEU_MB',
  'e', 'h', 'z', 'ma', 'con_mb', 'tong_dong', 'chrome_ma', 'khung', 'rong', 'cao',
  '?', '#', '$', '!', '0',
]);

/**
 * Tìm mọi `$BIEN` nằm NGOÀI dấu nháy kép trong mã (bỏ qua chú thích).
 *
 * ⚠️ Phải đi từng ký tự chứ không thể dùng một regex: `"$(grep -c . $tam)"` trông như đã được bọc
 * nháy, nhưng `$tam` bên trong `$( )` KHÔNG được lớp nháy ngoài che — thay-thế-lệnh mở một ngữ
 * cảnh mới. Một phép kiểm bằng regex sẽ báo an toàn ở đúng chỗ nguy hiểm nhất.
 */
function timBienKhongNhay(nguon) {
  const viPham = [];
  nguon.split('\n').forEach((dong, i) => {
    if (/^\s*#/.test(dong)) return;                 // chú thích cả dòng
    const nhay = [];                                 // ngăn xếp ngữ cảnh: '"' | "'" | '$('
    let trongNhayDon = false;
    for (let k = 0; k < dong.length; k += 1) {
      const c = dong[k];
      if (c === '\\') { k += 1; continue; }
      if (trongNhayDon) { if (c === "'") trongNhayDon = false; continue; }
      if (c === "'") { trongNhayDon = true; continue; }
      if (c === '"') {
        if (nhay[nhay.length - 1] === '"') nhay.pop();
        else nhay.push('"');
        continue;
      }
      if (c === '$' && dong[k + 1] === '(' && dong[k + 2] === '(') {
        // Số học `$(( … ))`: biến ở trong không cần `$`, và không có dấu cách nào để mà vỡ.
        const het = dong.indexOf('))', k);
        k = het === -1 ? dong.length : het + 1;
        continue;
      }
      if (c === '$' && dong[k + 1] === '(') { nhay.push('$('); k += 1; continue; }
      if (c === ')' && nhay[nhay.length - 1] === '$(') { nhay.pop(); continue; }
      if (c === '#' && (k === 0 || /\s/.test(dong[k - 1])) && nhay.length === 0) break; // chú thích cuối dòng
      if (c !== '$') continue;

      const con = dong.slice(k + 1);
      const m = /^\{?([A-Za-z_][A-Za-z0-9_]*|[?#$!0-9])/.exec(con);
      if (!m) continue;
      const ten = m[1];
      // Được che khi lớp TRÊN CÙNG của ngăn xếp là nháy kép. Nếu trên cùng là `$(` thì lớp nháy
      // ngoài không với tới đây được.
      const duocChe = nhay[nhay.length - 1] === '"';
      if (!duocChe && !BIEN_SO_AN_TOAN.has(ten)) {
        viPham.push(`dòng ${i + 1}: $${ten} — ${dong.trim()}`);
      }
    }
  });
  return viPham;
}

test('mọi biến đường dẫn trong bench-macbook.sh đều được bọc nháy kép', () => {
  const nguon = readFileSync(KICH_BAN, 'utf8');
  const viPham = timBienKhongNhay(nguon);
  assert.deepEqual(viPham, [],
    'Biến để trần sẽ bị TÁCH ở dấu cách — thư mục của Đàm là `Bản sao Pomodoro Game - USING`.\n'
    + `Bọc lại bằng nháy kép:\n  ${viPham.join('\n  ')}`);
});

test('phép kiểm nháy kép THẬT SỰ bắt được lỗi (đối chứng)', () => {
  // ⚠️ Đối chứng nhốt đúng hai hình dạng sai đã biết. Không có nó thì bài trên có thể xanh vì phép
  // đo hỏng chứ không vì mã sạch — đúng bài học "một phép tự kiểm chứng minh bộ lọc CÓ chạy, không
  // chứng minh nó chạy ĐÚNG" (Phase 4C/4G).
  assert.equal(timBienKhongNhay('cat $RA\n').length, 1, 'phải bắt được biến để trần');
  assert.equal(
    timBienKhongNhay('X="$(grep -c . $tam)"\n').length, 1,
    'phải bắt được biến để trần NẰM TRONG $( ) dù cả cụm đã bị bọc nháy ngoài',
  );
  assert.equal(timBienKhongNhay('cat "$RA"\n').length, 0, 'biến đã bọc nháy thì không được kêu');
  assert.equal(timBienKhongNhay('# cat $RA\n').length, 0, 'chú thích thì không được kêu');
  assert.equal(timBienKhongNhay('X=$((TONG + 1))\n').length, 0, 'số học thì không được kêu');
});

// ══════════════════════════════════════════════════════════════════════════════════════════
//  3. THỨ TỰ PREFLIGHT: RẺ TRƯỚC, ĐẮT SAU
// ══════════════════════════════════════════════════════════════════════════════════════════

test('đứng nhầm thư mục thì báo "sai thư mục", KHÔNG báo "chạy npm install"', () => {
  // ⚠️ Hai triệu chứng này giống hệt nhau (không có `node_modules`) nhưng cách sửa NGƯỢC NHAU.
  // Bảo một người đang đứng nhầm chỗ chạy `npm install` là làm họ mất vài phút cài vào một thư mục
  // chẳng liên quan, rồi hỏng y như cũ. Vì vậy mục "đúng thư mục" PHẢI đứng trước.
  const trong = mkdtempSync(join(tmpdir(), 'bench-trong-'));
  try {
    const { ma, ra } = chayPreflight(trong, {}, true);
    assert.notEqual(ma, 0);
    assert.match(ra, /KHÔNG đứng trong thư mục dự án/, `\n${ra}`);
    assert.doesNotMatch(ra, /npm install/, `đây là lời khuyên SAI cho ca này.\n${ra}`);
  } finally {
    rmSync(trong, { recursive: true, force: true });
  }
});

test('phiên bản three lệch thì CẢNH BÁO chứ không chặn', () => {
  // "npm nói up to date" không có nghĩa là đúng thư viện đang nằm đó — ca đã xảy ra thật ngày
  // 2026-08-17 (npm chạy lúc `package.json` còn là bản cũ). Nhưng lệch phiên bản vẫn đo được, nên
  // nó là cảnh báo: một bộ đo từ chối chạy vì chuyện này là một bộ đo không ai dùng.
  const cha = mkdtempSync(join(tmpdir(), 'bench-ver-'));
  const duAn = join(cha, 'du-an');
  try {
    dungDuAn(duAn);
    const pkg = JSON.parse(readFileSync(join(duAn, 'package.json'), 'utf8'));
    pkg.dependencies.three = '0.99.9';
    writeFileSync(join(duAn, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);

    const { ma, ra } = chayPreflight(duAn);
    assert.equal(ma, 0, `lệch phiên bản KHÔNG được chặn.\n${ra}`);
    assert.match(ra, /Phiên bản three LỆCH/, `\n${ra}`);
    assert.match(ra, /0\.99\.9/, 'phải nói rõ package.json đang cần bản nào');
  } finally {
    rmSync(cha, { recursive: true, force: true });
  }
});

// ══════════════════════════════════════════════════════════════════════════════════════════
//  4. MA TRẬN PHẢI CHỨA *CẢNH NẶNG NHẤT*, VÀ KỶ NẶNG NHẤT PHẢI ĐƯỢC **HỎI**, KHÔNG VIẾT CỨNG
// ══════════════════════════════════════════════════════════════════════════════════════════
/**
 * ⚠️ VÌ SAO BA BÀI NÀY TỒN TẠI (§3 BƯỚC 1, lệnh Đàm 2026-08-20). Mặt trận nâng chất lượng hình
 * ảnh là mặt trận ĐẦU TIÊN tiêu vào trục ĐIỂM ẢNH — trục chiếm 80% chi phí theo `PERFORMANCE.md`.
 * Câu hỏi duy nhất đáng hỏi trước khi tiêu là *"còn bao nhiêu ms?"*, và nó phải được trả lời ở
 * chỗ ngân sách cạn TRƯỚC, không phải ở mức trung bình.
 *
 * Ba trục đắt: ĐIỂM ẢNH (cửa sổ lớn) · ÁNH SÁNG (22 giờ là chặng DUY NHẤT bật đèn, đo được +19%)
 * · hình học (gần như miễn phí). Ma trận cũ chạy 24 cảnh ở cửa sổ thường, rồi đúng MỘT cảnh ở cửa
 * sổ lớn — và cảnh ấy là kỷ 7 · 12 giờ, tức góc NHẸ NHẤT của cả bộ. Nghĩa là chỗ đắt nhất chưa
 * bao giờ được đo, trong khi bảng số trông đã đầy đủ.
 */
const NGUON_BENCH = readFileSync(KICH_BAN, 'utf8');

/** Mọi lời gọi `chay_canh …` (một dòng), đã bỏ chú thích. */
function cacLoiGoiCanh(nguon) {
  return nguon.split('\n')
    .filter((d) => !/^\s*#/.test(d))
    .filter((d) => /\bchay_canh\b/.test(d));
}

test('ma trận PHẢI có cảnh NẶNG NHẤT: 22 giờ (đèn bật) × cửa sổ LỚN', () => {
  // THỬ-CHO-ĐỎ: bỏ dòng `chay_canh "$nhan_nang" ... --hour 22` ⇒ bài này ĐỎ.
  const nang = cacLoiGoiCanh(NGUON_BENCH).filter(
    (d) => /\$RONG_LON/.test(d) && /\$CAO_LON/.test(d) && /--hour\s+22/.test(d),
  );
  assert.equal(nang.length, 1,
    'Phải có ĐÚNG một cảnh ở cửa sổ LỚN chạy lúc 22 giờ — đó là chỗ cả ba trục đắt cùng ở mức cao\n'
    + 'nhất, tức chỗ ngân sách cạn trước. Không có nó thì bảng số trông đầy đủ mà thiếu đúng con\n'
    + `số cần dùng để quyết. Hiện tìm thấy ${nang.length} dòng như vậy.`);
});

test('kỷ nặng nhất phải được HỎI lúc chạy, KHÔNG viết cứng một con số', () => {
  // THỬ-CHO-ĐỎ: đổi `--era "$KY_NANG"` thành `--era 14` ⇒ bài này ĐỎ ở vế thứ nhất.
  //             bỏ lời gọi `scene-count.mjs` trong `tim_ky_nang` ⇒ ĐỎ ở vế thứ hai.
  //
  // ⚠️ "Kỷ nhiều tam giác nhất" là một QUAN HỆ, không phải một con số. Hôm nay là kỷ 14 (179.182
  // tam giác), và MỌI phase thêm chi tiết đều có thể đổi nó — Phase 11 một mình đã thêm 110.076
  // tam giác lên mái. Một hằng số viết cứng ở đây sẽ lặng lẽ trỏ vào một kỷ đã thôi là kỷ nặng
  // nhất, và bộ đo vẫn in ra một bảng trông hoàn toàn hợp lý. Đúng bẫy Phase 7D.
  const nang = cacLoiGoiCanh(NGUON_BENCH).find(
    (d) => /\$RONG_LON/.test(d) && /--hour\s+22/.test(d),
  );
  assert.ok(nang, 'không tìm thấy cảnh nặng nhất — xem bài test ngay trên');
  assert.match(nang, /--era\s+"\$KY_NANG"/,
    'Kỷ của cảnh nặng nhất phải đọc từ biến tính lúc chạy, không phải một số viết cứng:\n'
    + `  ${nang.trim()}`);

  // ⚠️ Phải hỏi trên THÂN HÀM ĐÃ BỎ CHÚ THÍCH, không hỏi trên cả file. Chính phép thử ngược lộ
  // ra chỗ này: chuỗi `scene-count.mjs` xuất hiện 4 lần trong kịch bản (1 chú thích + 1 lời gọi
  // thật + 2 dòng echo), nên một phép khớp lỏng sẽ vẫn XANH sau khi lời gọi thật đã bị gỡ, chỉ
  // cần còn một chú thích nhắc tới cái tên. Đúng bài học "assert 'có ít nhất một chỗ' là cái
  // phễu, không phải hàng rào" (Phase 7A).
  const than = /tim_ky_nang\(\)\s*\{([\s\S]*?)\n\}/.exec(NGUON_BENCH);
  assert.ok(than, 'không tìm thấy thân hàm `tim_ky_nang`');
  const thanSach = than[1].split('\n').filter((d) => !/^\s*#/.test(d)).join('\n');
  assert.match(thanSach, /\bnode\b[^\n]*scene-count\.mjs/,
    '`tim_ky_nang` phải thật sự CHẠY `scene-count.mjs` (không chỉ nhắc tên nó trong chú thích).\n'
    + 'Nó là hàm THUẦN (duyệt scene graph, không cần Chromium, ~10 giây) nên hỏi là rẻ — không có\n'
    + 'cớ để đoán.');
});

test('không hỏi được kỷ nặng nhất thì phải KÊU TO, không im lặng dùng số dự phòng', () => {
  // THỬ-CHO-ĐỎ: bỏ dòng cảnh báo trong nhánh `else` của `if tim_ky_nang` ⇒ bài này ĐỎ.
  //
  // ⚠️ Một số dự phòng im lặng là cách tệ nhất để hỏng: bảng số vẫn ra đủ 26 cảnh, dòng "CẢNH
  // NẶNG NHẤT" vẫn có, và không gì cho biết nó đang trỏ vào một kỷ đoán bừa. Cùng bài học với
  // "một cơ chế từ chối thẳng phải có người ĐẾM số lần từ chối" (Phase 10 Bước 2).
  const m = /if tim_ky_nang; then([\s\S]*?)\nfi\n/.exec(NGUON_BENCH);
  assert.ok(m, 'không tìm thấy khối `if tim_ky_nang`');
  const duPhong = m[1].split('else')[1] ?? '';
  assert.match(duPhong, /⚠/,
    'Nhánh dự phòng phải in một cảnh báo nhìn thấy được, để Đàm biết dòng "CẢNH NẶNG NHẤT" bên\n'
    + 'dưới có thể không phải kỷ nặng nhất thật.');
  assert.match(duPhong, /CÓ THỂ|có thể/,
    'Cảnh báo phải nói rõ con số ấy CÓ THỂ sai, chứ không chỉ ghi "dùng tạm".');
});
