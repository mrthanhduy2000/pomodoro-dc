/**
 * groundCover.test.js — khoá HÌNH của bảy kiểu dùng đất.
 *
 * Bảng ở `groundCoverStyle.js` nói *"kỷ này dùng mảnh đất bên nhà làm gì"*; file này canh những
 * lời hứa mà chỉ HÌNH mới giữ được: nằm gọn trong ô, đủ thấp, đủ biến thể, và không lén mua thêm
 * một lệnh vẽ.
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import { buildGroundCover } from './groundCover.js';
import { COVER_KINDS, GROUND_COVER_STYLES } from './groundCoverStyle.js';

/**
 * Khối này vươn xa nhất bao nhiêu tính từ tâm CHÍNH NÓ, theo trục xa nhất.
 *
 * ⚠️ HAI NHÁNH, VÀ SỰ KHÁC BIỆT GIỮA CHÚNG TỪNG LÀM CHÍNH BÀI TEST NÀY ĐỎ OAN. Bản đầu dùng bán
 * kính đường tròn ngoại tiếp `(w/2)/cos(π/n)` cho MỌI khối, và nó tố cáo một cái sân hoàn toàn
 * lành là "vươn tới 1,100" — vì với `sides = 4` thì đường tròn ngoại tiếp lớn hơn hình thật `√2`
 * lần: đáy một lăng trụ 4 cạnh **TRÙNG KHÍT hình chữ nhật `w × d`** (đỉnh nằm ở 45°/135°/… nên
 * `rx·cos 45° = w/2` đúng bằng nửa bề rộng). Đây đúng là sự thật đã cắn ở `planCoverage.test.js`,
 * chỉ khác dấu: ở đó nó làm một phép phá KHÔNG đỏ, ở đây nó làm một bài test đỏ nhầm.
 *   · `sides === 4` → hình chữ nhật xoay `ry`: bề vươn theo trục là `(w/2)|cos ry| + (d/2)|sin ry|`
 *     — công thức KHÍT, không phải chặn trên.
 *   · `sides > 4`   → dùng đường tròn ngoại tiếp làm CHẶN TRÊN. Chặn trên là đủ cho câu hỏi ở đây
 *     ("có chắc chắn nằm trong ô không"), và nó không phụ thuộc `ry` nên đúng cho cả bốn góc quay
 *     mà `gridAligned` cho phép.
 */
function vuonToi(part) {
  const nuaW = (part.w ?? 0) / 2;
  const nuaD = (part.d ?? part.w ?? 0) / 2;
  const n = Math.max(3, Math.round(part.sides ?? 4));
  if (n === 4) {
    const c = Math.abs(Math.cos(part.ry ?? 0));
    const sn = Math.abs(Math.sin(part.ry ?? 0));
    return { ex: nuaW * c + nuaD * sn, ez: nuaD * c + nuaW * sn };
  }
  const r = Math.max(nuaW, nuaD) / Math.cos(Math.PI / n);
  return { ex: r, ez: r };
}

/**
 * Khoảng cách xa nhất mà một mô tả với tới, tính từ tâm ô.
 *
 * ⚠️ CỘNG THEO TỪNG TRỤC, đừng cộng một con số chung. Bản đầu lấy "bề vươn lớn nhất" rồi cộng vào
 * CẢ `|x|` lẫn `|z|`, và nó tố oan một hàng rào lành: thanh rào dài theo trục X (nửa bề `0,456`)
 * nhưng lệch theo trục Z, mà theo trục Z nó chỉ dày `0,05`. Ghép nhầm hai trục làm con số phồng
 * lên gấp đôi. Cùng họ với bài học "gộp 6 chặng thành một vector rồi mới so" (`TECH_DEBT #22`):
 * một đại lượng có nhiều chiều thì phải hỏi TỪNG chiều.
 *
 * Quay một phần tư vòng quanh tâm ô làm hai cặp `(|x|, ex)` và `(|z|, ez)` ĐỔI CHỖ cho nhau, nên
 * lấy `max` của hai vế là con số đúng cho cả bốn góc mà `gridAligned` cho phép.
 */
function vuonToiXaNhat(parts) {
  let xa = 0;
  for (const p of parts) {
    const { ex, ez } = vuonToi(p);
    xa = Math.max(xa, Math.abs(p.x ?? 0) + ex, Math.abs(p.z ?? 0) + ez);
  }
  return xa;
}

/** Chữ ký HÌNH HỌC — cố tình KHÔNG có vai màu, vì luật là "hai biến thể HÌNH, không phải hai màu". */
function chuKyHinh(parts) {
  return parts
    .map((p) => [
      (p.w ?? 0).toFixed(3), (p.d ?? 0).toFixed(3), (p.h ?? 0).toFixed(3),
      (p.x ?? 0).toFixed(3), (p.z ?? 0).toFixed(3), (p.y ?? 0).toFixed(3),
      p.sides, (p.taper ?? 1).toFixed(2), (p.ry ?? 0).toFixed(2),
    ].join(','))
    .join('|');
}

/** Mọi tổ hợp (kiểu × kỷ) mà bảng thật sự sinh ra. */
function moiToHop() {
  const out = [];
  for (const kind of COVER_KINDS) {
    for (let era = 1; era <= 15; era += 1) {
      const s = GROUND_COVER_STYLES[era];
      out.push({ kind, era, scale: s.scale, enclose: s.enclose });
    }
  }
  return out;
}

test('MỌI KIỂU DỰNG RA KHỐI THẬT — không kiểu nào từ chối trong im lặng', () => {
  // ⚠️ Đây là bài học Phase 10 Bước 2, lặp lại nguyên si: `isValidGroundCoverStyle` TỪ CHỐI THẲNG
  // và `buildGroundCover` trả mảng RỖNG — cả hai đều đúng, và cộng lại chúng có thể làm cả một kỷ
  // không có mảng phủ nào mà build/lint/test đều xanh. Phải có người ĐẾM ở đầu bên kia.
  let daDuyet = 0;
  for (const { kind, era, scale, enclose } of moiToHop()) {
    const parts = buildGroundCover({ kind, scale, enclose, seed: `k${kind}|${era}` });
    assert.ok(parts.length >= 2,
      `kỷ ${era} kiểu "${kind}" chỉ dựng ra ${parts.length} khối — mảng phủ phải có ít nhất nền + một dấu hiệu`);
    daDuyet += 1;
  }
  assert.equal(daDuyet, COVER_KINDS.length * 15, 'vòng duyệt chạy hụt — bài test này đang tự lừa mình');
});

test('NẰM GỌN TRONG Ô — lời hứa mà `gridAligned` sinh ra để giữ', () => {
  // Nửa ô là 0,5. Vượt qua đó là mảng phủ của hai ô kề nhau dính vào nhau thành một mặt sàn liền,
  // xoá mất chính cái lưới mà mắt đang đọc — và tệ hơn, nó cắm vào chân nhà hàng xóm.
  for (const { kind, era, scale, enclose } of moiToHop()) {
    for (let s = 0; s < 4; s += 1) {
      const parts = buildGroundCover({ kind, scale, enclose, seed: `f${kind}|${era}|${s}` });
      const xa = vuonToiXaNhat(parts);
      assert.ok(xa <= 0.5,
        `kỷ ${era} kiểu "${kind}" (hạt ${s}) vươn tới ${xa.toFixed(3)} > 0,5 ⇒ thò sang ô bên`);
    }
  }
});

test('THẤP — mảng phủ là cách DÙNG đất, không phải một công trình nữa', () => {
  // ⚠️ Trần 0,60 không phải con số chọn cho đẹp: nhà dân thấp nhất trong cả 15 kỷ vẫn cao hơn thế
  // nhiều lần (kỷ 1 khai `massScale` thấp nhất bảng mà vẫn ra ~1,8). Một mảng phủ chạm tới chiều
  // cao nhà là nó thôi đọc ra thành "mảnh đất", và mục đích cả phase C sụp theo.
  for (const { kind, era, scale, enclose } of moiToHop()) {
    for (let s = 0; s < 3; s += 1) {
      const parts = buildGroundCover({ kind, scale, enclose, seed: `h${kind}|${era}|${s}` });
      const cao = Math.max(...parts.map((p) => (p.y ?? 0) + (p.h ?? 0)));
      assert.ok(cao <= 0.60,
        `kỷ ${era} kiểu "${kind}" cao ${cao.toFixed(3)} — quá cao cho một mảng phủ đất`);
    }
  }
});

test('MỖI KIỂU ÍT NHẤT HAI BIẾN THỂ HÌNH HỌC, không phải hai màu', () => {
  // Luật của Đàm từ Phase 5B: mắt nhận ra sự lặp lại qua HÌNH BÓNG chứ không qua sắc độ. Chữ ký ở
  // đây cố tình bỏ `role` ra ngoài, nên đổi màu mà giữ nguyên hình thì bài này KHÔNG cứu được.
  for (const kind of COVER_KINDS) {
    const chuKy = new Set();
    for (let s = 0; s < 24; s += 1) {
      chuKy.add(chuKyHinh(buildGroundCover({ kind, scale: 1, enclose: 0.5, seed: `v${kind}|${s}` })));
    }
    assert.ok(chuKy.size >= 2,
      `kiểu "${kind}" chỉ ra ${chuKy.size} dáng trên 24 hạt giống ⇒ nó là một cái khuôn, không phải một kiểu`);
  }
});

test('CÙNG HẠT GIỐNG → CÙNG MỘT HÌNH, vĩnh viễn (ADR-007)', () => {
  for (const { kind, era, scale, enclose } of moiToHop()) {
    const a = chuKyHinh(buildGroundCover({ kind, scale, enclose, seed: `d${kind}|${era}` }));
    const b = chuKyHinh(buildGroundCover({ kind, scale, enclose, seed: `d${kind}|${era}` }));
    assert.equal(a, b, `kỷ ${era} kiểu "${kind}" ra hai hình khác nhau cho cùng một hạt giống`);
  }
});

test('KHÔNG DÙNG `water`, và không dùng vai màu lạ — 0 lệnh vẽ mới theo CẤU TRÚC', () => {
  // ⚠️ `water` chỉ có ở 7/15 kỷ, nên dùng nó ở đây là âm thầm mua 8 lệnh vẽ. `drawCallBudget.test.js`
  // canh con số cuối cùng; bài này canh NGUYÊN NHÂN, nên nó đỏ ngay tại chỗ gõ sai chứ không đỏ ở
  // một file khác với một thông báo về "họ vật liệu".
  const CHO_PHEP = new Set(['stone', 'wood', 'leaf', 'wall']);
  for (const { kind, era, scale, enclose } of moiToHop()) {
    for (const p of buildGroundCover({ kind, scale, enclose, seed: `r${kind}|${era}` })) {
      assert.ok(CHO_PHEP.has(p.role),
        `kỷ ${era} kiểu "${kind}" dùng vai "${p.role}" — ngoài bốn vai miễn phí về lệnh vẽ`);
    }
  }
});

test('KIỂU LẠ → MẢNG RỖNG, không rơi về một kiểu mặc định', () => {
  // Rơi về mặc định là cách một bảng 15 dòng lặng lẽ thoái hoá về 1 dòng (bẫy `MIN_STONE`, Phase
  // 9D): một kỷ khai sai sẽ mọc đầy sân kiểu kỷ khác mà không gì đỏ lên.
  for (const kind of [undefined, null, '', 'lake', 'yard ', 'Yard', 123]) {
    assert.deepEqual(buildGroundCover({ kind }), [], `kiểu lạ ${JSON.stringify(kind)} vẫn dựng ra khối`);
  }
});

test('`detail:"low"` không bao giờ đắt hơn `high`', () => {
  for (const { kind, era, scale, enclose } of moiToHop()) {
    const cao = buildGroundCover({ kind, scale, enclose, seed: `l${kind}|${era}`, detail: 'high' });
    const thap = buildGroundCover({ kind, scale, enclose, seed: `l${kind}|${era}`, detail: 'low' });
    assert.ok(thap.length <= cao.length,
      `kỷ ${era} kiểu "${kind}": mức thấp ${thap.length} khối > mức cao ${cao.length}`);
  }
});
