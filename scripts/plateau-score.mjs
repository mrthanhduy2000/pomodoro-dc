/**
 * CHỈ SỐ BỆ — đo "thành phố có nằm trên một cái mặt bàn không", bằng ĐỘ DỐC THEO BÁN KÍNH.
 *
 * ⚠️ VÌ SAO CÔNG CỤ NÀY PHẢI TỒN TẠI, VÀ VÌ SAO PHÉP ĐO CŨ VĨNH VIỄN KHÔNG THẤY.
 * Vòng trước tôi kết luận *"không phải mép tấm đất — hai bên khớp cao độ 0,0000, không có vách
 * nào"*. Con số ấy ĐÚNG, và câu hỏi thì SAI. **Một cái bệ KHÔNG cần một bậc để đọc ra là bệ.**
 * Bậc là một GIÁN ĐOẠN; bệ là một **KIỂU PHÂN BỐ ĐỘ DỐC**: gần như phẳng bên trong một bán kính,
 * rồi dốc hẳn lên ngay ngoài bán kính đó. Cả hai bên của một sườn dốc trơn tru vẫn "khớp 0,0000".
 * Đo gián đoạn để tìm bệ là đúng bài học Phase 9B — *đại lượng đang hỏi không nằm trong thứ công
 * cụ này đo* — và nó đã làm tôi báo "đã sửa" trong khi mắt Đàm vẫn thấy cái mặt bàn.
 *
 * PHÉP ĐO: chia mặt đất thành các VÀNH ĐỒNG TÂM (bước `--buoc`, mặc định 0,5 ô), lấy `|gradient|`
 * trung bình mỗi vành. Cao nguyên có một chữ ký không thể nhầm: một quãng gần 0, rồi một bước nhảy.
 *
 *   CHỈ SỐ BỆ = (dốc LỚN NHẤT ở vành 6–9 ô) ÷ (dốc TRUNG BÌNH ở vành 0–5 ô)
 *
 * Đây là một **QUAN HỆ**, không phải một mức tuyệt đối — nên nó không chết khi bảng địa hình được
 * co giãn (bẫy Phase 7D đã cắn ba bài test ở chính vòng trước).
 *
 * ⚠️ NÓ HỎI ĐÚNG HÀM MÀ MÀN HÌNH HỎI. Mặt đất do HAI tấm dựng nên: tấm thành phố
 * (`terrain.surfaceHeightAt`, toạ độ Ô) phủ tới `horizon.innerEdge`, ra ngoài đó là tấm chân trời
 * (`horizon.heightAt`, toạ độ THẾ GIỚI) — và luật chọn tấm là khoảng cách **Chebyshev**, chép đúng
 * từ `sceneGraph.js`. Hỏi nhầm tấm thì đo một thế giới khác.
 *
 * Dùng:
 *   node --import ./scripts/register-esm-loader.mjs scripts/plateau-score.mjs            # 15 kỷ
 *   node --import ./scripts/register-esm-loader.mjs scripts/plateau-score.mjs --era 5 --hoso
 *   node --import ./scripts/register-esm-loader.mjs scripts/plateau-score.mjs --selftest
 */
import { buildTerrain, terrainSurfaceReach } from '../src/engine/city3d/terrain.js';
import { buildHorizon } from '../src/engine/city3d/horizon.js';

const GRID = 12;
const HALF = (GRID - 1) / 2;
/** Bước lấy vi phân trung tâm, tính bằng ô. Nhỏ hơn nữa thì nhiễu số học lấn; lớn hơn thì nó tự
 *  làm mượt mất đúng cái bước nhảy đang đi tìm. */
const EPS = 0.05;
/** Bao nhiêu mẫu quanh mỗi vành. 96 cho ra bước góc 3,75° — đủ để một mép MÉO không lọt qua khe. */
const GOC = 96;

function docCo() {
  const a = { era: null, buoc: 0.5, toi: 12, hoso: false, selftest: false };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i += 1) {
    const [k, v] = [argv[i], argv[i + 1]];
    if (k === '--era') { a.era = Number(v); i += 1; }
    else if (k === '--buoc') { a.buoc = Number(v); i += 1; }
    else if (k === '--toi') { a.toi = Number(v); i += 1; }
    else if (k === '--hoso') a.hoso = true;
    else if (k === '--selftest') a.selftest = true;
  }
  return a;
}

/**
 * Cao độ mặt đất ở một điểm THẾ GIỚI bất kỳ — chép ĐÚNG luật chọn tấm của `sceneGraph.js`.
 * (Chebyshev, không phải Ơclit: đó là phép đo mà `horizon.heightAt` tự nó cũng dùng.)
 */
function lamMatDat(terrain, horizon) {
  return (x, z) => (Math.max(Math.abs(x), Math.abs(z)) <= horizon.innerEdge
    ? terrain.surfaceHeightAt(x + HALF, z + HALF)
    : horizon.heightAt(x, z));
}

/** |gradient| tại một điểm, bằng vi phân trung tâm trên CHÍNH hàm mặt đất. */
function doDoc(mat, x, z) {
  const gx = (mat(x + EPS, z) - mat(x - EPS, z)) / (2 * EPS);
  const gz = (mat(x, z + EPS) - mat(x, z - EPS)) / (2 * EPS);
  return Math.hypot(gx, gz);
}

/**
 * Hồ sơ dốc theo bán kính: trả về `[{r, doc, cao}]` — dốc trung bình và cao độ trung bình mỗi vành.
 * @param {(x:number,z:number)=>number} mat hàm cao độ mặt đất
 */
export function hoSoDocTheoBanKinh(mat, { buoc = 0.5, toi = 12 } = {}) {
  const vanh = [];
  for (let r = buoc / 2; r <= toi; r += buoc) {
    let tongDoc = 0;
    let tongCao = 0;
    for (let i = 0; i < GOC; i += 1) {
      const a = (i / GOC) * Math.PI * 2;
      const x = Math.cos(a) * r;
      const z = Math.sin(a) * r;
      tongDoc += doDoc(mat, x, z);
      tongCao += mat(x, z);
    }
    vanh.push({ r, doc: tongDoc / GOC, cao: tongCao / GOC });
  }
  return vanh;
}

/**
 * CHỈ SỐ BỆ + vị trí bước nhảy.
 *
 * ⚠️ `trong`/`ngoai` là hai khoảng BÁN KÍNH tính bằng Ô, không phải chỉ số mảng — viết bằng chỉ số
 * thì đổi `--buoc` là cả phép đo trỏ sang chỗ khác mà không có gì kêu.
 */
export function chiSoBe(vanh, { trong = [0, 5], ngoai = [6, 9] } = {}) {
  const trg = vanh.filter((v) => v.r >= trong[0] && v.r <= trong[1]);
  const ngo = vanh.filter((v) => v.r >= ngoai[0] && v.r <= ngoai[1]);
  if (!trg.length || !ngo.length) return { chiSo: NaN, docTrong: NaN, docNgoai: NaN, rNhay: NaN };
  const docTrong = trg.reduce((s, v) => s + v.doc, 0) / trg.length;
  let docNgoai = -Infinity;
  let rNhay = NaN;
  for (const v of ngo) if (v.doc > docNgoai) { docNgoai = v.doc; rNhay = v.r; }
  // ⚠️ SÀN Ở MẪU SỐ, không phải một phép chia trần trụi: một trường PHẲNG LÌ cho `docTrong = 0` và
  // phép chia ra `Infinity`, tức "bệ vô hạn" — trong khi phẳng lì thì KHÔNG có bệ nào cả. Sàn này
  // là mức dốc mà mắt còn không đọc ra được (0,01 đơn vị cao độ trên một ô ≈ 0,6°).
  const SAN = 0.01;
  return { chiSo: docNgoai / Math.max(SAN, docTrong), docTrong, docNgoai, rNhay };
}

function trungBinh(a) { return a.reduce((s, v) => s + v, 0) / a.length; }

// ─── ĐỐI CHỨNG: ba trường có câu trả lời BIẾT TRƯỚC ────────────────────────────
// ⚠️ Không có mục này thì chỉ số bệ chỉ là một con số không ai kiểm được. Nó phải phân biệt được
// BA ca, chứ không phải "có phản ứng" — một phép tự kiểm chứng minh bộ lọc CÓ chạy thì không
// chứng minh nó chạy ĐÚNG (bài học Phase 4C/4G).
function selftest() {
  const cases = [
    { ten: 'PHẲNG LÌ', mat: () => 0.4, moiCho: 'chỉ số ≈ 0 (không có dốc nào ở đâu cả)' },
    {
      ten: 'DỐC ĐỀU',
      mat: (x, z) => 0.12 * (x + z),
      moiCho: 'chỉ số ≈ 1 (dốc trong = dốc ngoài)',
    },
    {
      ten: 'CAO NGUYÊN',
      // phẳng tới r = 5,5 rồi tụt 0,62 trong 2,6 ô — đúng hình dạng `APRON_*` hiện tại
      mat: (x, z) => {
        const d = Math.max(Math.abs(x), Math.abs(z));
        const t = Math.min(1, Math.max(0, (d - 5.5) / 2.6));
        return -0.62 * (t * t * (3 - 2 * t));
      },
      moiCho: 'chỉ số CAO (phẳng trong, dốc hẳn ngoài)',
    },
  ];
  console.log('ĐỐI CHỨNG — chỉ số bệ phải phân biệt được BA ca:\n');
  const ra = [];
  for (const c of cases) {
    const vanh = hoSoDocTheoBanKinh(c.mat, { buoc: 0.5, toi: 12 });
    const k = chiSoBe(vanh);
    ra.push({ ...c, k });
    console.log(`  ${c.ten.padEnd(12)} chỉ số ${k.chiSo.toFixed(2).padStart(8)}`
      + `   dốc trong ${k.docTrong.toFixed(4)}  dốc ngoài ${k.docNgoai.toFixed(4)}`
      + `  (mong: ${c.moiCho})`);
  }
  const [phang, deu, cao] = ra.map((r) => r.k.chiSo);
  const loi = [];
  if (!(phang < 0.5)) loi.push(`PHẲNG LÌ phải ra gần 0, ra ${phang.toFixed(2)}`);
  if (!(deu > 0.7 && deu < 1.4)) loi.push(`DỐC ĐỀU phải ra ≈1, ra ${deu.toFixed(2)}`);
  if (!(cao > 5)) loi.push(`CAO NGUYÊN phải ra CAO, ra ${cao.toFixed(2)}`);
  if (!(cao > deu * 4)) loi.push(`CAO NGUYÊN phải cao hơn hẳn DỐC ĐỀU (${cao.toFixed(2)} vs ${deu.toFixed(2)})`);
  console.log('');
  if (loi.length) { console.error('❌ ĐỐI CHỨNG TRƯỢT:\n  - ' + loi.join('\n  - ')); process.exit(1); }
  console.log('✓ Phân biệt được cả ba. Ngưỡng đọc: chỉ số ≥ 5 ⇒ có bệ; ≈ 1 ⇒ một sườn liên tục.');
}

// ─── CHẠY ──────────────────────────────────────────────────────────────────────
const arg = docCo();
if (arg.selftest) { selftest(); process.exit(0); }

const eras = arg.era ? [arg.era] : Array.from({ length: 15 }, (_, i) => i + 1);
const bang = [];
for (const era of eras) {
  const terrain = buildTerrain({ era, gridSize: GRID });
  const horizon = buildHorizon({ era, gridSize: GRID });
  const mat = lamMatDat(terrain, horizon);
  const vanh = hoSoDocTheoBanKinh(mat, { buoc: arg.buoc, toi: arg.toi });
  const k = chiSoBe(vanh);
  bang.push({ era, vanh, ...k });
  if (arg.hoso) {
    console.log(`\n── KỶ ${era} — hồ sơ dốc theo bán kính `
      + `(mép tấm thành phố ở ${terrainSurfaceReach(GRID).toFixed(2)}) ──`);
    for (const v of vanh) {
      const bar = '█'.repeat(Math.round(v.doc * 60));
      console.log(`  r=${v.r.toFixed(2).padStart(5)}  dốc ${v.doc.toFixed(4)}  `
        + `cao ${v.cao.toFixed(3).padStart(7)}  ${bar}`);
    }
  }
}

console.log('\nkỷ\tchỉ số bệ\tdốc trong(0–5)\tdốc ngoài(6–9)\tr bước nhảy');
for (const b of bang) {
  console.log(`${b.era}\t${b.chiSo.toFixed(2).padStart(8)}\t${b.docTrong.toFixed(4).padStart(10)}`
    + `\t${b.docNgoai.toFixed(4).padStart(10)}\t${b.rNhay.toFixed(2).padStart(6)}`);
}
if (bang.length > 1) {
  const chiSos = bang.map((b) => b.chiSo);
  const rs = bang.map((b) => b.rNhay);
  const rDuyNhat = [...new Set(rs.map((r) => r.toFixed(2)))];
  console.log(`\nTRUNG BÌNH chỉ số bệ: ${trungBinh(chiSos).toFixed(2)}`
    + `  ·  tệ nhất: kỷ ${bang[chiSos.indexOf(Math.max(...chiSos))].era} = ${Math.max(...chiSos).toFixed(2)}`
    + `  ·  tốt nhất: kỷ ${bang[chiSos.indexOf(Math.min(...chiSos))].era} = ${Math.min(...chiSos).toFixed(2)}`);
  console.log(`SỐ KỶ có chỉ số ≥ 5 (đọc ra là bệ): ${chiSos.filter((c) => c >= 5).length}/15`);
  console.log(`BƯỚC NHẢY rơi ở ${rDuyNhat.length} bán kính khác nhau: ${rDuyNhat.join(' · ')}`);
  if (rDuyNhat.length <= 2) {
    console.log('⚠️  CẢ 15 KỶ NHẢY Ở (GẦN) CÙNG MỘT BÁN KÍNH ⇒ đây KHÔNG phải địa hình,'
      + ' đây là một hình dạng do LƯỚI quy định.');
  }
}
