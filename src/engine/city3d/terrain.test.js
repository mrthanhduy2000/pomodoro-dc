import test from 'node:test';
import assert from 'node:assert/strict';

import {
  APRON_DROP, APRON_EDGE, ERA_TERRAIN, SMOOTHSTEP_PEAK, STREET_MAX_GRADE, TERRACE_STEP,
  buildTerrain, eraTerrainProfile,
} from './terrain.js';
import { roadCellCandidates } from '../cityLayout.js';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const GRID = 12;

/**
 * Tập khoá "x|y" của 80 ô ĐƯỜNG ứng viên — hằng số, không phụ thuộc kỷ hay tiến độ.
 *
 * ⚠️ TỪ 2026-08-18, CAO ĐỘ Ô ĐƯỜNG VÀ CAO ĐỘ Ô ĐẤT LÀ HAI CHUYỆN KHÁC NHAU, nên gần như mọi bài
 * test ở file này phải hỏi riêng từng loại. Đất giữ bậc thềm (khối đáy phẳng cần mặt đất bằng);
 * đường được san thành dốc thoải (không ai đặt nhà lên mặt phố, mà một con phố nhảy bậc thì mắt
 * đọc ra ngay). Gộp hai loại vào một phép đếm là đo một đại lượng không tồn tại.
 */
const O_DUONG = new Set(roadCellCandidates().map((c) => `${c.x}|${c.y}`));
const laDuong = (cell) => O_DUONG.has(`${cell.x}|${cell.y}`);
const oDat = (terrain) => terrain.cells.filter((c) => !laDuong(c));

/** Đếm số ô ĐẤT ở mỗi cao độ. Trả về `{levels, topShare}`. */
function levelStats(terrain) {
  const cells = oDat(terrain);
  const count = new Map();
  for (const cell of cells) {
    const key = cell.h.toFixed(6);
    count.set(key, (count.get(key) ?? 0) + 1);
  }
  return {
    levels: count.size,
    topShare: Math.max(...count.values()) / cells.length,
  };
}

test('mọi kỷ có khai bậc thì phải CÓ ĐẤT Ở BẬC 0 và có chỗ cao hơn 0', () => {
  // ⚠️ NÓI CHO ĐÚNG BÀI NÀY CANH GÌ. Tôi đã suýt ghi rằng nó "chặn lỗi hàm hình dạng gánh cả biên
  // độ" — lỗi có thật, đã đo (4 kỷ phẳng tuyệt đối, 15 kỷ chỉ còn 11 trường khác nhau). Nhưng thử
  // ngược thì bài này **KHÔNG đỏ** khi tôi cố ý tái tạo lỗi đó: bước căng trường ở `buildTerrain`
  // đã làm nó thành bất khả thi, nhân hệ số nào vào hàm hình dạng cũng ra kết quả y hệt từng con
  // số. Thứ bài này thật sự canh hẹp hơn nhiều: **trường cao độ có neo ở 0 và có vươn lên**.
  // Bài "dùng đủ số bậc" bên dưới mới là bài đỏ khi bước căng bị gỡ.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    if (profile.terraces < 2) continue;      // kỷ 14 phẳng có chủ đích
    const terrain = buildTerrain({ era, gridSize: GRID });
    const lowest = Math.min(...terrain.cells.map((c) => c.h));
    assert.equal(lowest, 0, `kỷ ${era}: bậc thấp nhất phải là 0, đang là ${lowest}`);
    assert.ok(terrain.maxHeight > 0, `kỷ ${era} (${profile.shape}) phẳng lì dù khai ${profile.terraces} bậc`);
  }
});

test('MỌI KỶ PHẢI DÙNG ĐỦ SỐ BẬC MÌNH KHAI — khai 5 mà dùng 3 là đã mất địa hình', () => {
  // Đây là hàng rào CHÍNH của cả file, và điều đáng ghi là nó canh **bước căng trường** chứ không
  // canh hai lỗi phân bố ban đầu (cả hai nay đã bất khả thi — xem chú thích ở `SHAPES`). Đã thử
  // ngược: gỡ bước căng ⇒ bài này đỏ ngay. "cao nhất > 0" thì KHÔNG bắt được gì — đó là cái phễu.
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    const { levels } = levelStats(buildTerrain({ era, gridSize: GRID }));
    assert.equal(
      levels, profile.terraces,
      `kỷ ${era} (${profile.shape}) khai ${profile.terraces} bậc nhưng chỉ dùng ${levels}`,
    );
  }
});

test('kỷ khai TỪ 3 BẬC TRỞ LÊN thì không bậc nào được nuốt quá 60% mặt đất', () => {
  // ⚠️ VÌ SAO NGƯỠNG NÀY CHỈ ÁP CHO KỶ ≥3 BẬC, và vì sao đó KHÔNG phải nới tay cho tiện:
  // bản đầu tôi áp 70% cho cả 15 kỷ, và hai kỷ "trượt" là kỷ 3 (Ur, Lưỡng Hà) với kỷ 12 (thảo
  // nguyên Nga) — đúng hai nơi mà chính bảng `ERA_TERRAIN` mô tả là "phẳng tuyệt đối" và "phẳng
  // đến mức thành biểu tượng". Ngưỡng ấy đang ĐÒI BỊA RA ĐỒI Ở NƠI KHÔNG CÓ ĐỒI — cùng hình dạng
  // sai với phép đếm "15 mái phải phủ 6 múi màu" mà Phase 6B đã phải hạ xuống. Một kỷ khai 2 bậc
  // là một kỷ đồng bằng: nó chỉ cần có GỢN (bài trên đã canh), không cần cân bằng.
  //
  // ⚠️ TỪ 2026-08-18 PHÉP ĐẾM CHỈ TÍNH Ô ĐẤT, VÀ VIỆC ĐỔI PHẠM VI ẤY ĐÃ LÀM LỘ RA MỘT SỰ THẬT CŨ.
  // Trước đây nó đếm cả 144 ô, tức 80 ô ĐƯỜNG (56% mặt lưới) cũng được tính vào "mặt đất" — mà
  // đường thì rải đều khắp lưới nên nó PHA LOÃNG mọi mất cân bằng. Đo lại ở đúng commit be261ef,
  // chỉ trên 64 ô đất: kỷ 4 đã là **64%** từ trước, không phải do phép san đường sinh ra (phép san
  // không chạm một ô đất nào). Nói cách khác: hàng rào này xưa nay xanh một phần **nhờ những ô
  // không phải mặt đất** — đúng hình dạng "một lời hứa đúng nhờ một thứ chẳng liên quan" ở Phase 7D.
  //
  // Cách xử lý ĐÚNG là giữ nguyên ngưỡng 60% (nới cho vừa kết quả là mua một con số đẹp) và ĐẾM
  // TƯỜNG MINH kỷ nào đang trượt.
  //
  // ⚠️ 2026-08-18 — KỶ 4 NAY LÀ MỘT NGOẠI LỆ ĐÃ KHAI, KHÔNG PHẢI MỘT KHUYẾT TẬT CHỜ SỬA (ADR-032
  // bổ sung (b), đóng `TECH_DEBT #44`). Ba bằng chứng: `ERA_TERRAIN[4]` khai thẳng *"kinh thành
  // Trung Hoa trên ĐỒNG BẰNG, đồi thấp vây bốn phía"* · kỷ 4 **dùng đủ 3 bậc** đã khai (20% đáy /
  // 64% đồng bằng / 16% vành đồi — dải đông nhất nằm ở GIỮA, không dồn về một đầu như địa hình bị
  // sập) · kỷ 9 khai CÙNG một thứ (*"lòng chảo sông Seine, gần phẳng"*) và đo ra 58%, tức vạch 60%
  // đang cắt ngang giữa hai kỷ mô tả cùng một loại địa hình. **Nợ là thứ mình MẮC; cái này là thứ
  // mình CHỌN.**
  //
  // Bài test giữ NGUYÊN hình dạng — nó vẫn là hàng rào, chỉ đổi vai. Đỏ theo HAI chiều: dài ra ⇒
  // địa hình vừa sập ở một kỷ nữa; ngắn lại ⇒ ai đó vừa làm kỷ 4 gồ ghề lên, và đó là một quyết
  // định mỹ thuật phải làm có ý thức (sửa cả đây lẫn ADR-032).
  //
  // ⚠️ Và nói thật về chính ngưỡng 60%: nó là con số CHỌN TAY, không phải con số đo được, và kỷ 9
  // chỉ cách vạch 2 điểm. Thứ thật sự canh "địa hình có sập không" là bài "MỌI KỶ PHẢI DÙNG ĐỦ SỐ
  // BẬC MÌNH KHAI" ở trên — nó hỏi thẳng vào khuyết tật thay vì hỏi qua một tỉ lệ.
  const TRUOT = [];
  for (const era of ERAS) {
    const profile = eraTerrainProfile(era);
    if (profile.terraces < 3) continue;
    const { topShare } = levelStats(buildTerrain({ era, gridSize: GRID }));
    if (topShare > 0.60) TRUOT.push(era);
  }
  assert.deepEqual(
    TRUOT, [4],
    `danh sách kỷ có một bậc nuốt quá 60% mặt ĐẤT đã đổi: ${JSON.stringify(TRUOT)}. Dài ra ⇒ địa `
    + 'hình vừa sập ở một kỷ nữa. Ngắn lại ⇒ kỷ 4 vừa hoá gồ ghề, mà đồng bằng của nó là một LỰA '
    + 'CHỌN đã khai (ADR-032 bổ sung (b)) — sửa cả hai nơi cho khớp.',
  );
});

test('ĐỐI CHỨNG: một trường cao độ PHẲNG LÌ phải bị hai hàng rào trên bắt', () => {
  // Không có bài này thì hai ngưỡng trên chỉ là hai con số ai cũng hạ được cho tiện.
  const flat = { cells: Array.from({ length: 144 }, (_, i) => ({ x: i % 12, y: (i / 12) | 0, h: 0 })) };
  const { levels, topShare } = levelStats(flat);
  assert.equal(levels, 1, 'trường phẳng phải chỉ có 1 mức');
  assert.ok(topShare > 0.60, 'trường phẳng phải vượt ngưỡng 60%');
});

test('15 KỶ RA 15 ĐỊA HÌNH KHÁC NHAU — không dùng chung một quả đồi rồi đổi độ cao', () => {
  // Yêu cầu gốc của Đàm: "không dùng cùng một thành phố rồi đổi màu". Địa hình là một trong những
  // trục nói lên điều đó. So bằng CHỮ KÝ (toàn bộ 144 cao độ), không phải bằng maxHeight — hai
  // quả đồi hình khác hẳn nhau vẫn có thể cùng đỉnh.
  const signatures = new Set(ERAS.map((era) => (
    buildTerrain({ era, gridSize: GRID }).cells.map((c) => Math.round(c.h * 1000)).join(',')
  )));
  assert.equal(signatures.size, 15, `chỉ có ${signatures.size} địa hình khác nhau trên 15 kỷ`);
});

test('ĐẤT KHÔNG ĐƯỢC XÊ DỊCH: cùng một kỷ thì địa hình y hệt nhau, mãi mãi', () => {
  // ⚠️ Bất biến quan trọng nhất của file. Nếu cao độ phụ thuộc vào việc Đàm đã xây gì thì mỗi lần
  // xây xong một căn nhà cả quả đồi sẽ nhích, nhà cũ lún hoặc nhô mà không có gì báo. Cùng luật đã
  // giữ cho VỊ TRÍ (ADR-007) và THỨ TỰ MỞ ĐƯỜNG (`tier`, Phase 6C).
  for (const era of ERAS) {
    const a = buildTerrain({ era, gridSize: GRID });
    const b = buildTerrain({ era, gridSize: GRID });
    assert.deepEqual(a.cells, b.cells, `kỷ ${era} dựng hai lần ra hai địa hình`);
  }
  // Và chữ ký hàm KHÔNG được nhận danh sách công trình — nếu ai đó thêm tham số đó vào thì bất
  // biến trên chết ngay. Kiểm bằng cách gọi với rác: kết quả phải không đổi.
  const clean = buildTerrain({ era: 7, gridSize: GRID });
  const noisy = buildTerrain({ era: 7, gridSize: GRID, built: ['a', 'b'], buildings: [1, 2, 3] });
  assert.deepEqual(noisy.cells, clean.cells, 'địa hình đổi theo dữ liệu công trình — đất đang xê dịch');
});

test('cao độ Ô ĐẤT luôn là BỘI SỐ NGUYÊN của một bậc thềm — không có dốc liên tục', () => {
  // ⚠️ LÝ DO CỦA BÀI NÀY ĐÃ ĐỔI Ở PHASE 8C, DÙ LUẬT THÌ KHÔNG. Lý do CŨ là "nền là 144 ô hộp, cao
  // độ lẻ sẽ cho ô nền xuyên nhau hoặc hở khe" — vế ấy chết rồi, mặt đất nay là một tấm lưới liền
  // và nó dốc được tuỳ ý. Nhưng CÔNG TRÌNH vẫn là khối đáy phẳng, và chúng vẫn đứng theo bảng cao
  // độ này; thềm bậc là thứ cho một toà nhà rộng 3 ô có mặt đất bằng phẳng để đặt xuống. Giữ bài
  // test, sửa lời giải thích — một lời giải thích sai là thứ phiên sau kế thừa rồi dựa vào.
  // ⚠️ VÀ TỪ 2026-08-18 NÓ CHỈ CÒN ĐÚNG VỚI Ô ĐẤT — có chủ đích, không phải sơ suất. Ô ĐƯỜNG được
  // san thành dốc thoải nên cao độ của chúng là số lẻ. Lý do của bất biến này (mặt đất bằng cho
  // khối đáy phẳng) **không áp cho mặt phố**: không ai đặt nhà lên đó. Vế thứ hai của bài đếm
  // đúng bao nhiêu ô lẻ và chúng nằm ở đâu, để trạng thái ấy TƯỜNG MINH chứ không lặng lẽ.
  let soODuongLe = 0;
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const unit = TERRACE_STEP * eraTerrainProfile(era).relief;
    if (unit <= 0) continue;
    for (const cell of terrain.cells) {
      const steps = cell.h / unit;
      const chan = Math.abs(steps - Math.round(steps)) < 1e-9;
      if (laDuong(cell)) { if (!chan) soODuongLe += 1; continue; }
      assert.ok(
        chan,
        `kỷ ${era} ô ĐẤT (${cell.x},${cell.y}) cao ${cell.h} — không phải bội số của bậc ${unit}`,
      );
    }
  }
  // Gác chạy-rỗng KIÊM bằng chứng phép san có làm việc thật: nếu KHÔNG ô đường nào lẻ thì phép san
  // đã chết trong im lặng và bài trên chỉ đang canh một trường chưa ai đụng tới.
  assert.ok(soODuongLe > 200,
    `chỉ có ${soODuongLe} ô đường mang cao độ lẻ — phép san đường gần như không chạy`);
});

test('PHỐ KHÔNG BAO GIỜ DỐC HƠN CON PHỐ DỐC NHẤT THẾ GIỚI (34,8% — Baldwin Street)', () => {
  // ⚠️ ĐO TRÊN 80 Ô ỨNG VIÊN, KHÔNG TRÊN MẠNG ĐANG HIỆN. Mạng đang hiện đổi theo kỷ và theo số
  // phiên (công trình chiếm chỗ thì ô đường bị bỏ), nên một lời hứa phát biểu trên nó sẽ đúng hôm
  // nay và sai vào một buổi sáng nào đó — xem `cityLayout.test.js`.
  //
  // ⚠️ ĐỘ DỐC ≠ CHÊNH CAO ĐỘ. Mặt đất nội suy bằng `smoothstep`, đạo hàm cực đại 1,5 ở giữa quãng,
  // nên chỗ dốc nhất dốc gấp rưỡi mức trung bình. Quên hệ số ấy là tự cho mình dốc hơn 50%.
  const oDuong = [...O_DUONG].map((k) => k.split('|').map(Number));
  let soCap = 0;
  for (const era of ERAS) {
    const { heightAt } = buildTerrain({ era, gridSize: GRID });
    for (const [x, y] of oDuong) {
      for (const [dx, dy] of [[1, 0], [0, 1]]) {
        if (!O_DUONG.has(`${x + dx}|${y + dy}`)) continue;
        soCap += 1;
        const doc = SMOOTHSTEP_PEAK * Math.abs(heightAt(x, y) - heightAt(x + dx, y + dy));
        assert.ok(doc <= STREET_MAX_GRADE + 1e-9,
          `kỷ ${era}: phố giữa (${x},${y}) và (${x + dx},${y + dy}) dốc ${(doc * 100).toFixed(0)}% `
          + `— quá trần ${(STREET_MAX_GRADE * 100).toFixed(1)}%`);
      }
    }
  }
  assert.equal(soCap, 15 * 88, 'phép quét không duyệt đủ số cặp ô đường kề nhau đã hứa');
});

test('`SMOOTHSTEP_PEAK` PHẢI LÀ ĐẠO HÀM ĐỈNH THẬT CỦA MẶT ĐẤT, không phải một con số chép từ sách', () => {
  // ⚠️ VÌ SAO BÀI NÀY TỒN TẠI. Bài "PHỐ KHÔNG BAO GIỜ DỐC HƠN…" ở trên tính độ dốc bằng
  // `SMOOTHSTEP_PEAK * |Δh|`. Cái hệ số 1,5 ấy là một LỜI KHẲNG ĐỊNH VỀ HÀM NỘI SUY đang dùng
  // (`smoothstep`, đạo hàm cực đại 1,5 ở giữa quãng) — và cho tới hôm nay nó chỉ sống trong một
  // dòng CHÚ THÍCH. Đổi `smoothstep` thành `smootherstep` (đạo hàm đỉnh 1,875) thì mặt đất dốc
  // thêm 25% mà **cả bài cap lẫn đối chứng của nó vẫn xanh**, vì cả hai đều nhân với chính cái
  // hằng số đã lạc hậu. Cả cái trần Baldwin Street lúc ấy thành một lời nói dối có cấu trúc.
  // ⇒ Bài này ĐO đạo hàm thay vì tin nó — đúng luật "đừng DỰ ĐOÁN thứ có thể ĐO", và đúng bài học
  // "một câu tự trấn an trong chú thích cũng phải được kiểm như một con số" (Phase 8B).
  //
  // Cách đo: đi dọc MỘT quãng giữa hai tâm ô (giữ `y` ở đúng tâm ô nên thành phần nội suy theo `y`
  // triệt tiêu, còn lại đúng đường cong 1 chiều), lấy sai phân trên lưới mịn, rồi so ĐỈNH với
  // TRUNG BÌNH. Tỉ số ấy chính là hằng số đang xét, và nó không phụ thuộc quãng dốc bao nhiêu.
  const N = 1000;                      // sai phân trên lưới mịn; đỉnh đo được luôn ≤ đỉnh thật
  const SAN = 0.05;                    // quãng phẳng hơn mức này thì tỉ số vô nghĩa (0/0)
  let soQuang = 0;
  let toiDa = 0;
  for (const era of [1, 5, 7, 13]) {
    const { smoothHeightAt } = buildTerrain({ era, gridSize: GRID });
    for (let x = 0; x < GRID - 1; x += 1) {
      for (let y = 0; y < GRID; y += 1) {
        const trungBinh = Math.abs(smoothHeightAt(x + 1, y) - smoothHeightAt(x, y));
        if (trungBinh < SAN) continue;
        soQuang += 1;
        let dinh = 0;
        for (let i = 0; i < N; i += 1) {
          const a = smoothHeightAt(x + i / N, y);
          const b = smoothHeightAt(x + (i + 1) / N, y);
          dinh = Math.max(dinh, Math.abs(b - a) * N);
        }
        toiDa = Math.max(toiDa, dinh / trungBinh);
      }
    }
  }
  // ⚠️ GÁC CHẠY-RỖNG. Không có nó thì một `buildTerrain` trả mặt phẳng sẽ làm `soQuang = 0`, vòng
  // lặp không chạy lần nào, và bài test xanh mà chưa đo gì cả.
  assert.ok(soQuang >= 40,
    `chỉ tìm được ${soQuang} quãng đủ dốc để đo — phép đo gần như không chạy, con số dưới vô nghĩa`);

  // TRẦN: hàm nội suy không được dốc hơn thứ hằng số đang khai. Vượt ⇒ mọi con số độ dốc trong
  // file này đang bị khai THẤP đi, kể cả cái trần Baldwin Street.
  assert.ok(toiDa <= SMOOTHSTEP_PEAK + 1e-6,
    `đạo hàm đỉnh của mặt đất là ${toiDa.toFixed(4)} lần độ dốc trung bình, trong khi `
    + `SMOOTHSTEP_PEAK khai ${SMOOTHSTEP_PEAK} — hàm nội suy đã đổi, hằng số chưa đổi theo. `
    + 'Mọi phép tính độ dốc trong file này đang khai thấp hơn sự thật.');

  // SÀN: và nó cũng KHÔNG được thấp hơn nhiều — nếu không, một hàm nội suy TUYẾN TÍNH (đỉnh = 1,0)
  // sẽ qua được cái trần trên một cách thoải mái, và bài test này thành một cái phễu chứ không
  // phải hàng rào. Đây đúng là bài học Phase 9A: một ngưỡng chỉ chặn MỘT phía thì phía kia trôi tự
  // do. Sàn 0,9 chừa chỗ cho sai số sai phân (sai phân cho TRUNG BÌNH trên mỗi quãng con nên luôn
  // hụt so với đỉnh thật một chút), nhưng vẫn bắt được cả `linear` (1,0) lẫn `smootherstep` (1,875).
  assert.ok(toiDa >= 0.9 * SMOOTHSTEP_PEAK,
    `đạo hàm đỉnh chỉ ${toiDa.toFixed(4)} lần độ dốc trung bình, thấp hơn hẳn ${SMOOTHSTEP_PEAK} — `
    + 'hoặc hàm nội suy đã thành tuyến tính (thềm hết là thềm), hoặc phép đo đang không chạm mặt đất.');
});

test('ĐỐI CHỨNG: trường CHƯA SAN (bậc thềm thô) phải bị chính phép đo trên bắt', () => {
  // Không có bài này thì bài trên có thể xanh vì một lý do chẳng liên quan (vd `heightAt` trả 0).
  // Dựng lại đúng bộ số hỏng cũ: mặt đường bám thẳng lưới bậc thềm, chưa qua phép san. Đo được
  // ngày 2026-08-18 trước bản vá: 205/1320 cặp quá trần, chỗ dốc nhất 173% (kỷ 7).
  const buoc = TERRACE_STEP * eraTerrainProfile(7).relief;
  const tho = (x, y) => (x + y >= 8 ? 2 * buoc : 0);      // một ranh thềm HAI bậc cắt ngang phố
  let batDuoc = 0;
  const oDuong = [...O_DUONG].map((k) => k.split('|').map(Number));
  for (const [x, y] of oDuong) {
    for (const [dx, dy] of [[1, 0], [0, 1]]) {
      if (!O_DUONG.has(`${x + dx}|${y + dy}`)) continue;
      if (SMOOTHSTEP_PEAK * Math.abs(tho(x, y) - tho(x + dx, y + dy)) > STREET_MAX_GRADE) batDuoc += 1;
    }
  }
  assert.ok(batDuoc > 0, 'phép đo không còn nhìn thấy một ranh thềm cắt ngang phố — con số 0 kia vô nghĩa');
  assert.ok(SMOOTHSTEP_PEAK * 2 * buoc > 1.7,
    'bộ số hỏng cũ dựng lại không còn dốc như bản gốc (173%) — đối chứng đã trôi khỏi thứ nó nhốt');
});

test('SAN ĐƯỜNG KHÔNG ĐƯỢC ĐẨY ĐỘ DỐC SANG NGANG: bờ đất bên lề rộng hơn một bậc ở TỐI ĐA 5 chỗ', () => {
  // ⚠️ ĐÂY LÀ MỐC KHÔNG-ĐƯỢC-TỆ-HƠN, và nó tồn tại vì bản vá ĐẦU TIÊN đã phạm đúng lỗi này: san
  // dọc xong thì độ dốc NGANG (đường ↔ đất kề bên) xấu đi — kỷ 5 từ 101% lên 184%. Trước bản vá,
  // chênh đường↔đất chưa bao giờ quá MỘT bậc thềm (cả hai cùng nằm trên lưới bậc). Sau bản vá,
  // 5/2160 chỗ vượt — và chúng vượt vì một lý do HÌNH HỌC không gỡ được: ở đó đất hai bên phố
  // chênh nhau hơn hai bậc, nên không có cao độ nào vừa giữ phố dưới 34,8% vừa nằm trong một bậc
  // của cả hai bên. Khi buộc phải chọn, PHỐ thắng — cái giá trả trên BỜ ĐẤT, không trên mặt phố.
  let vuot = 0;
  let tongCap = 0;
  for (const era of ERAS) {
    const { heightAt } = buildTerrain({ era, gridSize: GRID });
    const buoc = TERRACE_STEP * eraTerrainProfile(era).relief;
    if (buoc <= 0) continue;
    for (const k of O_DUONG) {
      const [x, y] = k.split('|').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (O_DUONG.has(`${x + dx}|${y + dy}`)) continue;
        tongCap += 1;
        if (Math.abs(heightAt(x, y) - heightAt(x + dx, y + dy)) > buoc + 1e-9) vuot += 1;
      }
    }
  }
  assert.ok(tongCap > 2000, `chỉ duyệt ${tongCap} cặp đường↔đất — phép quét đang chạy rỗng`);
  assert.ok(vuot <= 5,
    `${vuot}/${tongCap} chỗ bờ đất rộng hơn một bậc thềm (mốc: 5). Phép san đang đẩy độ dốc sang `
    + 'ngang — đổi lòi lõm dọc lấy lòi lõm ngang thì không phải một bản vá.');
});

test('`footprint` trả cao độ CAO NHẤT dưới bóng công trình, và phần hụt để làm móng', () => {
  // Đứng ở cao độ cao nhất ⇒ KHÔNG BAO GIỜ có góc treo lơ lửng. Phần hụt (`drop`) là chiều cao
  // khối móng phải lấp xuống — bệ kè, đúng như nhà trên sườn đồi ngoài đời.
  const terrain = buildTerrain({ era: 5, gridSize: GRID });   // kỷ dốc nhất
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const fp = terrain.footprint(x, y, 3);
      assert.ok(fp.drop >= 0, `drop âm tại (${x},${y})`);
      let top = -Infinity;
      let bottom = Infinity;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const h = terrain.heightAt(x + dx, y + dy);
          if (h > top) top = h;
          if (h < bottom) bottom = h;
        }
      }
      assert.equal(fp.top, top, `(${x},${y}): phải đứng ở cao độ CAO NHẤT dưới bóng mình`);
      assert.equal(fp.drop, top - bottom, `(${x},${y}): drop phải bằng phần hụt`);
    }
  }
  // Công trình rộng 1 ô không bao giờ cần móng.
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      assert.equal(terrain.footprint(x, y, 1).drop, 0, `ô đơn (${x},${y}) không được cần móng`);
    }
  }
});

test('dữ liệu rác KHÔNG làm nổ, và ngoài lưới thì kẹp về mép', () => {
  const terrain = buildTerrain({ era: 999, gridSize: GRID });
  assert.ok(Number.isFinite(terrain.maxHeight));
  assert.equal(terrain.cells.length, GRID * GRID);
  assert.equal(terrain.heightAt(-5, -5), terrain.heightAt(0, 0), 'ngoài lưới phải kẹp về ô mép');
  assert.equal(terrain.heightAt(99, 99), terrain.heightAt(GRID - 1, GRID - 1));
  assert.ok(Number.isFinite(buildTerrain({}).maxHeight), 'gọi không tham số vẫn phải chạy');
  assert.equal(buildTerrain({ era: 1, gridSize: 0 }).cells.length, 1, 'lưới suy biến vẫn phải hợp lệ');
});

test('mỗi kỷ phải GIẢI THÍCH ĐƯỢC địa hình của mình bằng một nơi có thật', () => {
  // ⚠️ Cùng luật với `country`/`landmark` ở `eraStyle.js` (`CLAUDE.md`): con số không có lời giải
  // thích là con số tuỳ hứng, và tuỳ hứng chính là thứ đã sinh ra "15 kỷ cao bằng nhau" ở Phase 5B.
  for (const era of ERAS) {
    const profile = ERA_TERRAIN[era];
    assert.ok(profile, `kỷ ${era} thiếu hồ sơ địa hình`);
    assert.ok(
      typeof profile.note === 'string' && profile.note.length >= 20,
      `kỷ ${era} thiếu lời giải thích địa hình (đang là ${JSON.stringify(profile.note)})`,
    );
    assert.ok(profile.terraces >= 1 && profile.relief >= 0, `kỷ ${era} có tham số vô lý`);
  }
});

test('MẶT ĐẤT MƯỢT PHẢI ĐI QUA ĐÚNG TÂM Ô — nếu không, cả thành phố lơ lửng hoặc lún', () => {
  // ⚠️ ĐÂY LÀ BẤT BIẾN ĐẮT NHẤT CỦA PHASE 8C, và nó hỏng trong im lặng tuyệt đối.
  // Nhà, giàn giáo, cây, cư dân đều đứng ở `heightAt` của ô mình. Mặt đất thì nay được vẽ bằng
  // `smoothHeightAt`. Hai hàm ấy PHẢI bằng nhau tại toạ độ nguyên — không phải "gần bằng", mà
  // bằng đúng: lệch 2% thôi là mỗi căn nhà trong thành phố hụt hoặc lún vài phân, và không có gì
  // đỏ lên, không có cảnh báo nào, chỉ có một tấm ảnh trông hơi sai mà không ai chỉ ra được sai ở
  // đâu. Đúng hình dạng lỗi "sáu chỗ bám đất" của Phase 7B, lần này nhỏ hơn nên khó thấy hơn.
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (const cell of terrain.cells) {
      assert.equal(
        terrain.smoothHeightAt(cell.x, cell.y), terrain.heightAt(cell.x, cell.y),
        `kỷ ${era} ô (${cell.x},${cell.y}): mặt đất mượt lệch khỏi cao độ mà mọi vật đang đứng`,
      );
    }
  }
});

test('MẶT ĐẤT PHẢI THẬT SỰ DỐC GIỮA HAI TÂM Ô — không được lén quay về bậc thang', () => {
  // Bài trên đòi hai hàm khớp nhau ở tâm ô. Chỉ mình nó thì `smoothHeightAt = heightAt` (làm tròn
  // về ô gần nhất) cũng qua cửa — mà đó CHÍNH LÀ bậc thang, tức cả Phase 8C bị hoàn tác mà test
  // vẫn xanh. Nên phải hỏi thêm: giữa hai ô chênh nhau một bậc, điểm chính giữa có nằm ở KHOẢNG
  // GIỮA không.
  let checked = 0;
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (let y = 0; y < GRID; y += 1) {
      for (let x = 0; x < GRID - 1; x += 1) {
        const a = terrain.heightAt(x, y); const b = terrain.heightAt(x + 1, y);
        if (a === b) continue;
        const mid = terrain.smoothHeightAt(x + 0.5, y);
        assert.ok(
          Math.abs(mid - (a + b) / 2) < 1e-9,
          `kỷ ${era} giữa ô (${x},${y}) và (${x + 1},${y}): điểm giữa ở ${mid}, đáng lẽ ${(a + b) / 2}`,
        );
        checked += 1;
      }
    }
  }
  assert.ok(checked >= 50, `chỉ kiểm được ${checked} chỗ chênh bậc — bài test này đang chạy không`);
});

test('RA KHỎI `APRON_EDGE` THÌ MẶT ĐẤT PHẲNG ĐÚNG `-APRON_DROP`', () => {
  // ⚠️ Đây là LỜI HỨA VỚI `sceneGraph.js`: tấm ván vùng ngoài ngồi ở đúng cao độ ấy, nên nếu rìa
  // tấm địa hình còn gợn thì chỗ giáp sẽ là một đường răng cưa hở cả gầm — vòng quanh thành phố,
  // và im lặng. Kiểm ở NHIỀU hướng vì bán kính chuyển tiếp bị nhiễu nhân vào: chỗ nào nhiễu lớn
  // nhất mới là chỗ chạm trần, và đúng chỗ đó mới lộ lỗi.
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    for (let t = 0; t <= 24; t += 1) {
      const along = -0.5 + (GRID * t) / 24;
      const out = GRID - 0.5 + APRON_EDGE + 0.01;
      for (const [u, v] of [[-0.5 - APRON_EDGE - 0.01, along], [out, along],
        [along, -0.5 - APRON_EDGE - 0.01], [along, out]]) {
        assert.ok(
          Math.abs(terrain.surfaceHeightAt(u, v) + APRON_DROP) < 1e-9,
          `kỷ ${era} tại (${u.toFixed(2)},${v.toFixed(2)}): rìa ở ${terrain.surfaceHeightAt(u, v)}, `
          + `đáng lẽ ${-APRON_DROP} — sẽ hở một khe giữa địa hình và tấm ván vùng ngoài`,
        );
      }
    }
  }
});

test('VÙNG ĐẤT NGOÀI PHẢI THẤP HƠN CAO NGUYÊN, và ranh giới phải LƯỢN chứ không vuông', () => {
  // Hai nửa của cùng một điều Đàm yêu cầu ("irregular silhouettes"). Nửa (a): thành phố phải nằm
  // TRÊN một cao nguyên, không phải trên một cái khay. Nửa (b): bán kính chuyển tiếp bị nhiễu nhân
  // vào, nên nếu nó ra một hằng số thì mép lại vuông vức — và một mép vuông hoàn hảo chính là dấu
  // hiệu số một để mắt đọc ra "bàn cờ".
  for (const era of ERAS) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const rim = [];
    for (let t = 0; t <= 40; t += 1) {
      const along = -0.5 + (GRID * t) / 40;
      // Đi ra ngoài đúng 1 ô rồi đo tụt bao nhiêu — số này chính là "ranh giới nằm ở đâu".
      rim.push(terrain.smoothHeightAt(0, Math.min(GRID - 1, Math.max(0, along)))
        - terrain.surfaceHeightAt(-1.5, along));
    }
    const lo = Math.min(...rim); const hi = Math.max(...rim);
    assert.ok(hi > 0.02, `kỷ ${era}: vùng ngoài không hề thấp hơn cao nguyên`);
    assert.ok(
      hi - lo > 0.05,
      `kỷ ${era}: mức tụt ở rìa gần như không đổi (${lo.toFixed(3)}..${hi.toFixed(3)}) — ranh giới `
      + 'đang là một hình vuông đều tăm tắp, đúng thứ làm cảnh đọc ra bàn cờ',
    );
  }
});

test('`tintAt` phải TẤT ĐỊNH, nằm trong 0..1, và đổi theo cả hai trục', () => {
  // Vết loang là thứ giữ cho mặt đất KHÔNG phẳng lì ở 5 kỷ đồng bằng (nơi độ dốc bằng 0 nên tầng
  // "sườn dốc lộ đất" không đóng góp gì). Nó trả một hằng số thì 5 kỷ ấy về lại một mảng màu chết.
  for (const era of [1, 7, 12, 15]) {
    const terrain = buildTerrain({ era, gridSize: GRID });
    const seen = new Set();
    for (let j = 0; j <= 12; j += 1) {
      for (let i = 0; i <= 12; i += 1) {
        const v = terrain.tintAt(i, j);
        assert.ok(v >= 0 && v <= 1, `kỷ ${era} tintAt(${i},${j}) = ${v} — ngoài 0..1`);
        assert.equal(v, terrain.tintAt(i, j), 'không tất định');
        seen.add(v.toFixed(4));
      }
    }
    assert.ok(seen.size >= 30, `kỷ ${era}: vết loang chỉ có ${seen.size} giá trị — gần như phẳng`);
  }
});
