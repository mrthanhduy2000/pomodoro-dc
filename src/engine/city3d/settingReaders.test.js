/**
 * settingReaders.test.js — **MỘT BẢNG CÓ TÊN CHO MỌI CHỖ CHẠM VÀO DẤU CHÂN MẶT NƯỚC.**
 *
 * Đàm ra bài này ở §2-Q3 ngày 2026-08-20, và lý do anh nêu đáng chép lại nguyên văn: *"`worldYaw`
 * vừa tạo ra một bất biến cùng hình dạng: 'mọi thứ hỏi dấu chân nước phải hỏi qua một cửa'. Viết
 * test đọc mã nguồn liệt kê các chỗ chạm dấu chân thành **một bảng có tên**, đúng cách
 * `GROUND_ANCHORS` đã làm. Bảng ấy tự nó là tài liệu."*
 *
 * ⚠️ VÌ SAO CẦN. Phase 7B đã trả giá đúng hình dạng này: mệnh đề *"y của mọi thứ trên mặt đất = 0"*
 * được phát biểu lại ở **sáu** nơi trong `sceneGraph.js`, và quên một chỗ thì thứ đó lơ lửng giữa
 * trời — trong khi **build xanh · lint sạch · không một cảnh báo nào**. Dấu chân mặt nước nay cũng
 * là một mệnh đề được phát biểu lại ở nhiều nơi: tấm đất thành phố khoét theo nó, tấm chân trời
 * khoét theo nó, cây cối tránh nó, tấm lưới nước tô màu theo nó. Thêm `worldYaw` (ADR-041) thì
 * dấu chân ấy còn XOAY — nên một chỗ nào đó tự dựng lại hình dạng nước bằng công thức riêng sẽ
 * lệch 90° so với phần còn lại, và **cũng sẽ im lặng**.
 *
 * ⚠️ CÁI CỬA DUY NHẤT LÀ `insetAt`. `blendAt` và `depthAt` đều được tính TỪ `insetAt` ngay trong
 * `setting.js` (có bài test dưới đây khoá điều đó), nên xoay `insetAt` là xoay cả ba. Ai muốn biết
 * "chỗ này có nước không / sâu bao nhiêu / gần bờ tới đâu" thì hỏi qua ba hàm ấy, tuyệt đối không
 * đọc thẳng `width`/`side`/`reach` của bảng rồi tự suy ra hình.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

import { ERAS_WITH_WATER_GEOMETRY, buildSetting } from './setting.js';

/** Ba truy vấn — và CHỈ ba truy vấn này — là cách hợp lệ để hỏi về dấu chân mặt nước. */
const TRUY_VAN = ['insetAt', 'blendAt', 'depthAt'];

/**
 * ⚠️ BẢNG CÓ TÊN. Mỗi dòng: file nào chạm vào dấu chân nước, bằng truy vấn nào, ĐỂ LÀM GÌ.
 *
 * Thêm một chỗ đọc mới mà quên khai vào đây ⇒ bài `KHÔNG CÓ CỬA SAU` đỏ. Khai một dòng rồi gỡ mã
 * đi mà quên xoá dòng ⇒ bài `BẢNG KHÔNG ĐƯỢC NÓI DỐI` đỏ. Hai chiều, không chiều nào im lặng.
 */
const NGUOI_DOC_DAU_CHAN = [
  {
    file: 'src/engine/city3d/terrain.js',
    dung: ['blendAt', 'depthAt'],
    de: 'khoét lòng nước vào TẤM ĐẤT THÀNH PHỐ (`khoetLongNuoc`)',
  },
  {
    file: 'src/engine/city3d/horizon.js',
    dung: ['blendAt', 'depthAt', 'insetAt'],
    de: 'khoét lòng nước vào TẤM CHÂN TRỜI, cộng hệ số `luiNui` cho núi thấp dần về phía nước',
  },
  {
    file: 'src/engine/city3d/outskirts.js',
    dung: ['insetAt'],
    de: 'không cho cây vùng quê mọc dưới nước (`PROP_SHORE_CLEAR`)',
  },
  {
    file: 'src/components/city/render3d/terrainMesh.js',
    dung: ['blendAt', 'depthAt'],
    de: 'bỏ ô KHÔ khỏi tấm lưới nước, và tô sắc nước ĐẬM DẦN theo độ sâu',
  },
  {
    file: 'src/engine/city3d/hinterland.js',
    dung: ['insetAt'],
    de: 'tìm MÉP NƯỚC ngoài lưới để đặt bến/cầu đúng chỗ, và giữ mọi thứ KHÔ khỏi mặt nước '
      + '(cùng hạng với `outskirts.js`) — xem `timNuocNgoaiLuoi`',
  },
];

/**
 * Những file được phép nhắc tới ba truy vấn ấy mà KHÔNG phải "người đọc": nơi định nghĩa chúng, và
 * nơi chỉ nhắc tên trong một câu chú thích.
 */
const MIEN_TRU = [
  'src/engine/city3d/setting.js',        // nơi ĐỊNH NGHĨA cả ba
  'src/engine/city3d/settingStyle.js',   // chỉ nhắc tên trong chú thích kiến trúc
];

// Gốc kho suy từ vị trí CHÍNH FILE NÀY (`src/engine/city3d/` → lùi 3 cấp), không từ thư mục đang
// đứng — bài test phải cho ra cùng kết quả dù `npm test` chạy từ đâu.
const GOC = fileURLToPath(new URL('../../../', import.meta.url)).replace(/\/$/, '');
const doc = (f) => readFileSync(`${GOC}/${f}`, 'utf8');

/** Bỏ chú thích khối và chú thích dòng — hỏi về MÃ thì đừng để chú thích trả lời thay. */
function chiLayMa(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
}

test('BẢNG KHÔNG ĐƯỢC NÓI DỐI — mỗi dòng phải dùng ĐÚNG những truy vấn nó khai', () => {
  // THỬ-CHO-ĐỎ (đã chạy thật, không phải dự đoán):
  //   · thêm `'insetAt'` vào `dung` của `terrain.js` (bảng khai THỪA) ⇒ đỏ ở đây;
  //   · thêm một lời gọi `s.blendAt(0, 0)` vào `outskirts.js` (mã dùng THÊM) ⇒ cũng đỏ ở đây.
  //
  // ⚠️ Chỗ đáng nhớ: một "cửa sau" mở trong file ĐÃ NẰM TRONG BẢNG thì đỏ ở bài NÀY, còn mở trong
  // file ngoài bảng thì đỏ ở bài KẾ TIẾP. Hai bài chia nhau hai nửa của cùng một lời hứa — nên
  // đừng gộp chúng lại, và đừng thử ngược một bài bằng phép phá thuộc về bài kia (tôi đã làm đúng
  // thế ở lần thử đầu và suýt ghi nhầm chỗ đỏ vào chú thích).
  assert.ok(NGUOI_DOC_DAU_CHAN.length > 0, 'bảng rỗng — bài test này đang chạy rỗng');
  for (const { file, dung, de } of NGUOI_DOC_DAU_CHAN) {
    assert.ok(typeof de === 'string' && de.length > 20,
      `${file}: thiếu câu "để làm gì" — một bảng không giải thích thì không phải tài liệu`);
    const ma = chiLayMa(doc(file));
    for (const tv of TRUY_VAN) {
      const co = ma.includes(`.${tv}(`) || ma.includes(`${tv}(`);
      const khai = dung.includes(tv);
      assert.equal(co, khai,
        `${file}: bảng khai ${khai ? 'CÓ' : 'KHÔNG'} dùng \`${tv}\` nhưng mã ${co ? 'CÓ' : 'KHÔNG'} `
        + 'dùng. Sửa bảng cho khớp mã, rồi hỏi vì sao chỗ đọc ấy xuất hiện/biến mất.');
    }
  }
});

test('KHÔNG CÓ CỬA SAU — không file nào ngoài bảng được hỏi về dấu chân mặt nước', () => {
  // ⚠️ Đây là vế bắt được "chỗ thứ mười sáu" mà Phase 11 đã trả giá: một nút bịt đặt ở chỗ trung
  // tâm chỉ bịt được đường nào ĐI QUA NÓ. Bảng trên chỉ có nghĩa nếu không ai đi vòng.
  //
  // THỬ-CHO-ĐỎ (đã chạy thật): thêm `s.insetAt(u, v)` vào `floraStyle.js` — một file NGOÀI bảng —
  // ⇒ đỏ ở đây. (Thêm vào một file TRONG bảng thì đỏ ở bài trên, xem chú thích của nó.)
  const daBiet = new Set([...NGUOI_DOC_DAU_CHAN.map((r) => r.file), ...MIEN_TRU]);
  const ra = spawnSyncGrep();
  const laFileTest = (f) => /\.test\.(js|jsx)$/.test(f);
  const lac = ra.filter((f) => !daBiet.has(f) && !laFileTest(f));
  assert.deepEqual(lac, [],
    'có file hỏi về dấu chân mặt nước mà không nằm trong `NGUOI_DOC_DAU_CHAN`. Nếu chỗ đọc ấy đúng '
    + 'thì khai nó vào bảng (kèm câu "để làm gì"); nếu không thì gỡ đi và hỏi qua `terrain`/`setting`.');
  // Gác chạy-rỗng: phép quét phải THẬT SỰ tìm thấy các file trong bảng. Không có vế này thì một
  // lệnh grep hỏng (sai đường dẫn, sai mẫu) sẽ trả về rỗng và bài test xanh trơn tru.
  for (const { file } of NGUOI_DOC_DAU_CHAN) {
    assert.ok(ra.includes(file), `phép quét không tìm thấy ${file} — chính công cụ đo đang hỏng`);
  }
});

test('MỘT CỬA DUY NHẤT — `blendAt` và `depthAt` phải suy TỪ `insetAt`, không tự dựng lại hình', () => {
  // ⚠️ Nếu hai hàm kia tự tính hình dạng nước bằng công thức riêng thì `worldYaw` xoay `insetAt`
  // mà chúng đứng yên ⇒ mặt nước lệch 90° so với lòng sông. Đúng bẫy "một luật hai công thức".
  //
  // THỬ-CHO-ĐỎ: trong `setting.js`, đổi `const s = insetAt(u, v)` của `depthAt` thành một công
  // thức chép lại ⇒ đỏ ở vế đọc mã nguồn dưới đây.
  const ma = chiLayMa(doc('src/engine/city3d/setting.js'));
  for (const tv of ['blendAt', 'depthAt']) {
    const than = ma.slice(ma.indexOf(`function ${tv}(u, v) {`));
    const het = than.indexOf('\n  }');
    assert.ok(het > 0, `không tìm thấy thân hàm \`${tv}\` trong setting.js`);
    assert.match(than.slice(0, het), /insetAt\(u, v\)/,
      `\`${tv}\` không còn hỏi \`insetAt\` — nó đang tự dựng lại hình dạng mặt nước.`);
  }

  // ĐỐI CHỨNG BẰNG HÀNH VI, không chỉ bằng chữ trong file: chỗ nào `insetAt` nói là khô hẳn (ngoài
  // dải bờ) thì cả `blendAt` lẫn `depthAt` PHẢI trả 0, ở cả 14 kỷ. Một bài đọc mã nguồn đơn độc có
  // thể xanh trong khi hàm đã đổi ruột.
  let soDiemKho = 0;
  for (const era of ERAS_WITH_WATER_GEOMETRY) {
    const s = buildSetting({ era, gridSize: 12 });
    for (let u = -20; u <= 32; u += 1.5) {
      for (let v = -20; v <= 32; v += 1.5) {
        if (s.insetAt(u, v) > -1.0) continue;   // −1,0 nằm ngoài `SHORE_BAND` = 0,9
        soDiemKho += 1;
        assert.equal(s.blendAt(u, v), 0, `kỷ ${era} tại (${u},${v}): khô hẳn mà \`blendAt\` khác 0`);
        assert.equal(s.depthAt(u, v), 0, `kỷ ${era} tại (${u},${v}): khô hẳn mà \`depthAt\` khác 0`);
      }
    }
  }
  assert.ok(soDiemKho > 1000, `chỉ kiểm được ${soDiemKho} điểm khô — đối chứng chạy gần như rỗng`);
});

/** Quét cả cây `src/` tìm file có nhắc tới một trong ba truy vấn. Trả về đường dẫn tương đối. */
function spawnSyncGrep() {
  const mau = TRUY_VAN.join('\\|');
  const out = execFileSync('grep', ['-rl', mau, '--include=*.js', '--include=*.jsx', 'src'],
    { cwd: GOC, encoding: 'utf8' });
  return out.split('\n').filter(Boolean).sort();
}
