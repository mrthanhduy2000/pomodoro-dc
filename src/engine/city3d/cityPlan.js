/**
 * cityPlan.js — SINH THỬA ĐẤT CHO MỘT KỶ. Đây là lớp HÌNH của bộ xương thành phố (Phase 20,
 * ADR-066); lớp BẢNG là `networkStyle.js`, và mọi nơi khác chỉ ĐỌC.
 *
 * ⚠️ ĐẦU VÀO CHỈ CÓ `era`. KHÔNG `built`, KHÔNG `sessionCount`, KHÔNG `buildings`, KHÔNG `levels`.
 * Đây là ĐIỀU KIỆN SỐNG CÒN của ADR-007 ("bảo tàng bất động"), không phải một lựa chọn cho gọn:
 * nếu bố cục biết tiến độ thì thửa thứ k sẽ dời chỗ mỗi khi Đàm xây thêm một căn nhà, và cả thành
 * phố đã niêm phong của một kỷ cũ sẽ dựng lại KHÁC ĐI sau nhiều năm. Có test gọi kèm **dữ liệu
 * rác** và đòi kết quả y hệt lần gọi sạch — cùng khuôn đã khoá `buildTerrain` ở Phase 7B.
 *
 * ── VÌ SAO CHIA ĐÔI ĐỆ QUY (BSP) CHỨ KHÔNG PHẢI VORONOI ────────────────────────────────────────
 * Chỉ thị nêu hai cách và bảo *"thử cả hai rồi nhìn ảnh"*. Đo trước khi thử thì một cách đã tự
 * loại: **Voronoi cho ranh giới XIÊN**, mà toàn bộ tầng dựng đường của dự án chỉ biết ô vuông —
 * `terrainMesh.js` dựng mặt đường theo TỪNG Ô với ba vai (`variant` 0/1/2 = đại lộ / phố dọc /
 * phố ngang), `streetStyle.streetCrossSection` phát biểu bề rộng theo MẶT CẮT NGANG của một ô, và
 * `carriagewayShape` quyết định cánh tay loe theo bốn hướng vuông góc. Một ranh giới xiên không
 * diễn đạt được bằng bộ từ vựng ấy; muốn dùng Voronoi thì phải viết lại cả tầng dựng đường, tức
 * một phase khác hẳn. BSP cho ranh giới THẲNG và trùng khít lưới ô ⇒ dùng lại được nguyên tầng
 * đường đã có, kể cả bó vỉa/vỉa hè/vạch kẻ theo kỷ mà Phase 9D dựng.
 *
 * Và BSP KHÔNG hề "đều" như tên gọi gợi ý: chỗ cắt lệch tâm theo `sizeVary`, vùng được chọn để cắt
 * cũng bốc theo hạt giống, nên hai kỷ cùng số thửa vẫn ra hai hình khác hẳn. Bàn cờ chỉ xuất hiện
 * khi `sizeVary` ≈ 0 — tức đúng ba kỷ khai `grid`, và ở đó nó ĐÚNG.
 *
 * ── ĐƯỜNG LÀ RANH GIỚI THỬA, KHÔNG PHẢI HÀNG VÀ CỘT ────────────────────────────────────────────
 * Không có bảng "kỷ này bao nhiêu ô đường" nào cả. Mỗi nhát cắt để lại một hàng/cột ô làm lối đi,
 * nên **số ô đường là HỆ QUẢ của số thửa** — nhiều thửa nhỏ thì nhiều ngõ, ít thửa lớn thì ít
 * đường. Một hệ quả thì không thể trôi khỏi thứ sinh ra nó; một bảng thứ hai thì có.
 */

import { hashId } from '../hashId';
import { CITY_GRID_SIZE as GRID } from '../cityGrid';
import { getNetworkStyle } from './networkStyle';
import { parcelRoles } from './parcelRoles';
import { getSetting } from './settingStyle';
import { parcelCapacity, canSplitRegion } from './parcelCapacity';
import { arcTrace, gom, vaLienThong, tiaMangDuong } from '../roadPlan';

/**
 * Cạnh ngắn nhất của một thửa nay ĐỌC TỪ BẢNG (`networkStyle.minSide`), không còn là hằng số chung.
 *
 * ⚠️ VÌ SAO KHÔNG ĐƯỢC LÀ HẰNG SỐ. Một con số chung cho cả 15 kỷ là đúng cái hình dạng sai mà phase
 * này sinh ra để xoá, chỉ ở quy mô nhỏ hơn: ba kỷ `grid` sẽ ra ba bộ xương gần trùng khít. Ngoài
 * đời "một khu phố sâu bao nhiêu" chênh nhau gần bảy lần giữa Manhattan (80 m) và Trường An
 * (>500 m), nên đây là một đại lượng có thật, không phải một cái núm.
 * ⚠️ VÀ NÓ LÀ MỘT CÁI TRẦN: trên cạnh dài `L`, số thửa tối đa là `k` với `(minSide+1)·k − 1 ≤ L`.
 * Khai một số thửa vượt trần thì bộ sinh chỉ có thể dựng ra ít hơn — và nó sẽ làm vậy TRONG IM
 * LẶNG. `cityPlan.test.js` đòi số thửa dựng ra BẰNG số thửa khai ở cả 15 kỷ, nên cái trần này
 * không thể bị vượt mà không ai biết.
 */
const minSideOf = (st) => st.minSide;

/**
 * ⚠️ **TRẦN VỒNG CỦA MỘT CUNG LÀ MỘT QUAN HỆ VỚI CHÍNH CHIỀU DÀI CỦA NÓ, KHÔNG PHẢI MỘT CON SỐ.**
 * Vồng 3 ô trên một nhát cắt dài 12 ô là một con phố cong; vồng 3 ô trên một nhát cắt dài 4 ô là
 * một nhát chém chéo. Bản đầu của Phase 21 viết `Math.min(..., 2)` — đúng bẫy Phase 7D, và cái
 * hằng số ấy vừa quá rộng cho nhát ngắn vừa quá chặt cho nhát dài.
 */
const BOW_MAX_SHARE = 0.25;
// ⚠️ KHÔNG thêm một hàm kiểu `minSplittable = minSide*2+1` ở đây. Câu hỏi *"vùng này còn cắt được
// không"* đã có ĐÚNG MỘT chủ sở hữu là `canSplitRegion` (`parcelCapacity.js`), và chính nó cũng là
// thứ `parcelCapacity` dùng để tính trần số thửa. Viết lại luật ấy bằng một công thức thứ hai đặt
// ngay cạnh là đúng bẫy "một luật hai công thức" — hai công thức tương đương trên giấy gần như
// luôn lệch nhau ở BIÊN, và ở đây biên chính là chỗ một kỷ khai số thửa sát trần.

/**
 * Cỡ TỐI ĐA của khu đất giữ cho một kỳ quan, tính bằng ô.
 *
 * ⚠️ VÌ SAO KỲ QUAN KHÔNG CHIẾM TRỌN THỬA. Chỉ thị viết *"kỳ quan nhận năm thửa lớn nhất"*, và làm
 * đúng chữ ấy thì 5 thửa lớn nhất nuốt gần hết bản đồ: đo thử trên kỷ 1 (6 thửa) thì 5 thửa lớn
 * nhất chiếm 87% đất xây được, tức nhà dân gần như không còn chỗ — mà nhà dân mới là thứ Đàm thấy
 * NHIỀU NHẤT trên màn hình. Ngoài đời cũng không ai làm vậy: nhà thờ Firenze không chiếm cả khu
 * phố, nó đứng trong một khu phố và phần còn lại của khu ấy là nhà ở vây quanh.
 * ⇒ Kỳ quan nhận một MẢNH của thửa (tối đa 3×3, neo theo hạt giống), phần còn lại của thửa là phố
 * xá quanh nó. Cỡ mảnh vẫn khác nhau theo kỷ vì thửa nhỏ thì mảnh bị thửa kẹp lại.
 */
const WONDER_MAX = 3;

const key = (x, y) => `${x},${y}`;

/** Số trong [0,1) từ một khoá băm — tất định, không `Math.random`. */
function unit(seed) {
  return (hashId(seed) % 10000) / 10000;
}

/** Số nguyên trong [0, range) từ một khoá băm. */
function pick(seed, range) {
  return range > 0 ? hashId(seed) % range : 0;
}

function regionW(r) { return r.x1 - r.x0 + 1; }
function regionH(r) { return r.y1 - r.y0 + 1; }
function regionArea(r) { return regionW(r) * regionH(r); }
function canSplit(r, st) {
  return canSplitRegion(regionW(r), regionH(r), st.minSide);
}
/** Số thửa NHIỀU NHẤT còn moi ra được từ vùng này. */
function capOf(r, st) {
  return parcelCapacity(regionW(r), regionH(r), st.minSide);
}

/**
 * Mọi vị trí cắt trên trục `axis` mà cắt xong VẪN còn đủ chỗ cho `st.parcels` thửa.
 *
 * ⚠️ ĐÂY LÀ TOÀN BỘ BẢN VÁ CỦA KỶ 5, và nó là một BẤT BIẾN chứ không phải một phép chỉnh khéo.
 * Gọi `slack` = (tổng sức chứa hiện có) − (số thửa cần). Một nhát cắt làm sức chứa hụt đi
 * `cap(r) − cap(trái) − cap(phải)` ô; giữ số hụt ấy ≤ `slack` thì tổng sức chứa KHÔNG BAO GIỜ tụt
 * xuống dưới mục tiêu. Mà `cap` được định nghĩa là GIÁ TRỊ LỚN NHẤT trên mọi nhát cắt, nên luôn tồn
 * tại ít nhất một nhát hụt đúng 0 ⇒ danh sách này không bao giờ rỗng ở một vùng còn cắt được.
 * ⇒ Vòng lặp dừng ĐÚNG ở `st.parcels`, chứng minh được, không phải hy vọng: chừng nào tổng sức chứa
 * ≥ mục tiêu > số vùng hiện có thì phải có một vùng còn cắt được, nên không thể kẹt giữa chừng.
 */
function legalCuts(r, axis, st, slack) {
  const lo = axis === 'v' ? r.x0 : r.y0;
  const len = axis === 'v' ? regionW(r) : regionH(r);
  const first = lo + minSideOf(st);
  const last = lo + len - 1 - minSideOf(st);
  if (last < first) return [];
  const whole = capOf(r, st);
  const out = [];
  for (let posn = first; posn <= last; posn += 1) {
    const a = axis === 'v'
      ? { x0: r.x0, y0: r.y0, x1: posn - 1, y1: r.y1 }
      : { x0: r.x0, y0: r.y0, x1: r.x1, y1: posn - 1 };
    const b = axis === 'v'
      ? { x0: posn + 1, y0: r.y0, x1: r.x1, y1: r.y1 }
      : { x0: r.x0, y0: posn + 1, x1: r.x1, y1: r.y1 };
    if (whole - capOf(a, st) - capOf(b, st) <= slack) out.push(posn);
  }
  return out;
}

/**
 * Trục của con đường CHÍNH ở kỷ `axial`, suy từ phía có nước mà `settingStyle.side` đã khai.
 *
 * ⚠️ SUY RA, KHÔNG KHAI THÊM MỘT TRỤC MỚI — chỉ thị nói rõ *"đừng thêm trục mới"*, và nó đúng: hai
 * bảng cùng nói về một sự thật vật lý thì sớm muộn trôi khỏi nhau (bài học `drain` ↔ `side` ở
 * §1(B), nơi 9/14 kỷ có nước chảy lên dốc vì đúng lý do đó).
 * Phố chính chạy SONG SONG với bờ nước, vì đó là điều thành phố thật luôn làm: Stalingrad bám bờ
 * Volga, Dubai bám trục song song bờ vịnh, Paris có quai chạy dọc sông Seine.
 * Nước ở đông/tây ⇒ bờ là một cạnh DỌC ⇒ phố chính chạy dọc ⇒ nhát cắt là một CỘT (`'v'`).
 */
function spineAxis(era) {
  const side = getSetting(era).side;
  if (side === 'dong' || side === 'tay') return 'v';
  if (side === 'bac' || side === 'nam') return 'h';
  return 'v';
}

/** Trục nào để cắt vùng này, theo tính cách bộ xương. */
function chooseAxis(r, st, step, spine, canV, canH) {
  const w = regionW(r);
  const h = regionH(r);
  if (!canV) return 'h';
  if (!canH) return 'v';

  if (st.plan === 'grid') {
    // Bàn cờ: luôn bổ cạnh DÀI hơn ⇒ ô ra vuông vắn và đều nhau. Hoà thì so le theo bước để không
    // ra một dãy lát cắt cùng chiều.
    if (w !== h) return w > h ? 'v' : 'h';
    return step % 2 === 0 ? 'v' : 'h';
  }
  if (st.plan === 'axial') {
    // Nhát ĐẦU dựng trục chính. Những nhát sau phần lớn VUÔNG GÓC với trục ấy — đó là cái làm ra
    // hình "xương cá": một trục dài với các nhánh đâm ngang, chứ không phải bàn cờ.
    if (step === 0) return spine;
    const perpendicular = spine === 'v' ? 'h' : 'v';
    const wantPerp = unit(`ax|${st.country}|${step}`) < 0.72;
    const want = wantPerp ? perpendicular : spine;
    return want === 'v' ? (canV ? 'v' : 'h') : (canH ? 'h' : 'v');
  }
  if (st.plan === 'terrace') {
    /**
     * DÃY NHÀ LIỀN KỀ — Amsterdam, London, Liverpool. Đặc trưng của nó là những dải đất DÀI VÀ
     * HẸP song song nhau: mặt tiền hẹp (thuế đánh theo bề ngang mặt phố) mà thửa thì sâu hút vào
     * trong. Nên gần như MỌI nhát cắt cùng một chiều; chỉ thỉnh thoảng mới có một nhát cắt ngang
     * để chia dãy thành từng khối, đúng như một con phố ngang cắt qua hàng nhà.
     */
    const cross = step > 0 && step % 4 === 3;
    const want = cross ? (spine === 'v' ? 'h' : 'v') : spine;
    return want === 'v' ? (canV ? 'v' : 'h') : (canH ? 'h' : 'v');
  }
  if (st.plan === 'radial') {
    /**
     * NAN QUẠT — Karlsruhe, Moskva, và mọi thành phố mọc quanh một điểm (cung điện, điện Kremlin,
     * một ngã sông). Con đường ở đây chạy THEO BÁN KÍNH: đứng ở rìa phía đông thì con phố dẫn
     * mình về tâm là một phố chạy đông-tây. Nên vùng nào lệch tâm chủ yếu theo trục x thì nhát cắt
     * của nó là một hàng NGANG (`'h'`), và ngược lại — cộng lại thành hình nan chụm về giữa.
     */
    const mid = (GRID - 1) / 2;
    const dx = Math.abs((r.x0 + r.x1) / 2 - mid);
    const dy = Math.abs((r.y0 + r.y1) / 2 - mid);
    if (dx === dy) return step % 2 === 0 ? 'v' : 'h';
    const want = dx > dy ? 'h' : 'v';
    return want === 'v' ? (canV ? 'v' : 'h') : (canH ? 'h' : 'v');
  }
  // Hữu cơ: nghiêng về cạnh dài (đất thật thì người ta cũng chia cạnh dài), nhưng để hạt giống
  // lật ngược khoảng một phần ba số lần ⇒ thửa ra méo, không ra một dãy hình chữ nhật cùng tỉ lệ.
  const longer = w >= h ? 'v' : 'h';
  const flip = unit(`or|${st.country}|${step}|${r.x0}|${r.y0}`) < 0.34;
  const want = flip ? (longer === 'v' ? 'h' : 'v') : longer;
  return want === 'v' ? (canV ? 'v' : 'h') : (canH ? 'h' : 'v');
}

/**
 * Vị trí nhát cắt MONG MUỐN trên trục đã chọn — thuần mỹ thuật, chưa xét tới chuyện còn chỗ hay
 * không. `snapTo` lo phần ấy: nó kéo về vị trí HỢP LỆ gần nhất. Khi còn rộng chỗ thì mọi vị trí
 * đều hợp lệ ⇒ không kéo gì cả ⇒ hình dạng y hệt như trước bản vá; chỉ lúc sát trần nó mới ghì lại.
 */
function desiredPos(r, axis, st, step) {
  const lo = axis === 'v' ? r.x0 : r.y0;
  const len = axis === 'v' ? regionW(r) : regionH(r);
  const first = lo + minSideOf(st);         // vị trí cắt nhỏ nhất còn chừa đủ hai bên
  const last = lo + len - 1 - minSideOf(st);
  if (last <= first) return first;
  const mid = Math.round((first + last) / 2);
  // `sizeVary` = 0 ⇒ luôn cắt giữa ⇒ hai nửa bằng nhau ⇒ bàn cờ. = 1 ⇒ chạy tới sát mép cho phép.
  const room = Math.max(first === last ? 0 : (last - first) / 2, 0);
  const signed = unit(`cut|${st.country}|${step}|${axis}|${r.x0}|${r.y0}`) * 2 - 1;
  if (st.plan === 'radial') {
    // Nan quạt: mọi nhát cắt NGẮM VỀ TÂM lưới, chứ không ngắm về tâm của vùng đang cắt. Đó chính
    // là thứ làm các con phố chụm lại; `snapTo` kéo về vị trí hợp lệ gần nhất khi vùng không với
    // tới tâm. `sizeVary` vẫn còn tác dụng — nó là biên độ lệch quanh cái ngắm ấy.
    const tam = (GRID - 1) / 2;
    return Math.min(last, Math.max(first, Math.round(tam + signed * room * st.sizeVary)));
  }
  const posn = Math.round(mid + signed * room * st.sizeVary);
  return Math.min(last, Math.max(first, posn));
}

/** Vị trí hợp lệ gần `want` nhất. Hoà thì lấy vị trí NHỎ hơn — tất định, không phụ thuộc thứ tự. */
function snapTo(want, legal) {
  let best = legal[0];
  let bestD = Math.abs(legal[0] - want);
  for (const posn of legal) {
    const d = Math.abs(posn - want);
    if (d < bestD) { best = posn; bestD = d; }
  }
  return best;
}

/** Dựng bộ xương của một kỷ. Nội bộ — bên ngoài gọi `buildCityPlan` (có nhớ kết quả). */
function generate(era) {
  const st = getNetworkStyle(era);
  const spine = spineAxis(era);

  // ── ĐƯỜNG ────────────────────────────────────────────────────────────────────────────────────
  // `axisOf` ghi mỗi ô đường nằm trên lát cắt DỌC hay NGANG. Ô nằm trên cả hai là NGÃ TƯ và bắt
  // buộc mang vai đại lộ (rộng hết ô): để nó rơi vào một bề hẹp thì mặt đường THẮT LẠI đúng chỗ
  // giao nhau, trông như đường cụt. Luật này có từ Phase 6C, giữ nguyên.
  const axisOf = new Map();
  const tierOf = new Map();
  const avenue = new Set();
  /** Các đoạn thô, để `gom` (`roadPlan.js`) nhập lại theo luật "hạng cao thắng". */
  const doan = [];

  /**
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * MỘT NHÁT CẮT LÀ MỘT **CUNG CONG**, KHÔNG PHẢI MỘT ĐƯỜNG KẺ (Phase 21, ADR-064)
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * Đây chính là chỗ hai nhánh gặp nhau. Chia thửa đệ quy trả lời *"đất chia thế nào"* — nó cho ra
   * thửa khác cỡ khác hình, thứ mà bộ sinh nan-quạt/bàn-cờ của Phase 19 không có. Còn `arcTrace`
   * (ADR-059) trả lời *"một ranh giới có hình gì"* — nó cho ra đường lượn và giao lộ chữ T/Y, thứ
   * mà chia thửa thuần không có (mọi ranh giới BSP đều thẳng băng). Hai câu hỏi khác nhau, hai câu
   * trả lời ghép được vào nhau: **BSP quyết cắt Ở ĐÂU, `arcTrace` quyết cắt theo HÌNH GÌ.**
   *
   * ⚠️ **ĐỘ VỒNG PHẢI CÓ TRẦN, VÀ TRẦN ẤY LÀ MỘT QUAN HỆ CHỨ KHÔNG PHẢI MỘT CON SỐ.** Cung phình
   * ra bao nhiêu thì thửa bên ấy hụt đi bấy nhiêu. Nếu để tự do, một cung có thể ăn hết chiều
   * ngang của thửa hẹp nhất và bảng `minSide` — thứ nói *"khu phố ở nước này sâu bao nhiêu"* — trở
   * thành một lời khai không ai giữ. Nên `maxDev` = phần đất DƯ của bên hẹp hơn sau khi đã chừa
   * đủ `minSide`. Dư 0 ⇒ cắt thẳng, không có ngoại lệ. Đây đúng bài học Phase 7D: câu hứa có chữ
   * "đủ rộng" là một QUAN HỆ với thứ bên cạnh, nên nó phải đo thứ bên cạnh lúc chạy.
   */
  const themDoan = (cells, crossings, axis, tier, rank, isAvenue) => {
    doan.push({ cells, crossings, rank, tier });
    for (const c of cells) {
      if (c.x < 0 || c.x >= GRID || c.y < 0 || c.y >= GRID) continue;
      const k = key(c.x, c.y);
      const prev = axisOf.get(k);
      axisOf.set(k, prev && prev !== axis ? 'both' : axis);
      if (!tierOf.has(k) || tier < tierOf.get(k)) tierOf.set(k, tier);
      if (isAvenue) avenue.add(k);
    }
  };

  const markLine = (axis, posn, from, to, tier, isAvenue) => {
    const cells = [];
    for (let i = from; i <= to; i += 1) {
      cells.push(axis === 'v' ? { x: posn, y: i } : { x: i, y: posn });
    }
    themDoan(cells, new Map(), axis, tier, tier === 0 ? 0 : 1, isAvenue);
  };

  const markArc = (axis, posn, from, to, tier, isAvenue, maxDev, seed) => {
    const dist = to - from;
    if (dist <= 1 || maxDev <= 0) { markLine(axis, posn, from, to, tier, isAvenue); return; }
    // Chia ngân sách lệch: phần lớn cho CUNG (hình dạng có chủ đích), phần nhỏ cho SÓNG PHỤ (nhịp
    // rẽ-rồi-lại-rẽ của ranh thửa tự phát). `arcTrace` nhân `bow` với chiều dài, còn sóng phụ thì
    // nhân thêm 0,25 — nên hai con số dưới đây quy đổi ngược lại để tổng không vượt `maxDev`.
    const phanCung = Math.min(1, st.bend);
    const phanSong = Math.min(1, st.tangle) * 0.5;
    const chuanHoa = phanCung + phanSong > 1 ? phanCung + phanSong : 1;
    const bow = (maxDev * phanCung / chuanHoa) / dist;
    const wiggle = (maxDev * phanSong / chuanHoa) * 4 / dist;
    const A = axis === 'v' ? { x: posn, y: from } : { x: from, y: posn };
    const B = axis === 'v' ? { x: posn, y: to } : { x: to, y: posn };
    const { cells, crossings } = arcTrace(A, B, { bow, wiggle, seed });
    themDoan(cells, crossings, axis, tier, tier === 0 ? 0 : 1, isAvenue);
  };

  const giuVanhDai = new Set();
  let region = { x0: 0, y0: 0, x1: GRID - 1, y1: GRID - 1 };
  if (st.loops > 0) {
    // Vành đai chạy đúng viền ngoài — dải DUY NHẤT không cắt qua giữa một thửa nào, nên nó cũng là
    // dải DUY NHẤT phải THẲNG: uốn cong nó thì nó thò ra ngoài lưới và bị `gom` cắt cụt.
    // ⚠️ `loops` là số nguyên (bảng khai 0/1/2), không phải một cờ bật-tắt. Nay chỉ vòng NGOÀI
    // được dựng; vòng thứ hai của kỷ khai `loops: 2` là việc còn nợ, ghi ở `TECH_DEBT`.
    markLine('v', 0, 0, GRID - 1, 1, false);
    markLine('v', GRID - 1, 0, GRID - 1, 1, false);
    markLine('h', 0, 0, GRID - 1, 1, false);
    markLine('h', GRID - 1, 0, GRID - 1, 1, false);
    // ⚠️ **MỘT BỨC TƯỜNG THÀNH CÓ LỖ THÌ KHÔNG CÒN LÀ TƯỜNG THÀNH — và cái lỗ ấy do CHÍNH ta đục.**
    // `tiaMangDuong` tha mọi ô `tier === 1`, nhưng một ô vành đai bị một nhát cắt đâm vào thì `gom`
    // hạ nó xuống `tier 0` (tier nhỏ hơn thắng), nên nó thôi được tha và bị dọn cùng đám 2×2 ở ngã
    // ba. Đo được: 5/7 kỷ có vành đai bị thủng đúng một ô ở chỗ nhát cắt chạm viền. Nhớ lại ô vành
    // đai NGAY LÚC VẼ là cách duy nhất không phụ thuộc `tier` còn lại là bao nhiêu sau khi gộp.
    for (let i = 0; i < GRID; i += 1) {
      giuVanhDai.add(`0|${i}`); giuVanhDai.add(`${GRID - 1}|${i}`);
      giuVanhDai.add(`${i}|0`); giuVanhDai.add(`${i}|${GRID - 1}`);
    }
    region = { x0: 1, y0: 1, x1: GRID - 2, y1: GRID - 2 };
  }

  // ── CHIA ĐÔI ĐỆ QUY ──────────────────────────────────────────────────────────────────────────
  // `totalCap` = tổng số thửa NHIỀU NHẤT còn moi ra được từ tất cả các vùng hiện có. Bất biến giữ
  // suốt vòng lặp: `totalCap >= st.parcels`. Xem chứng minh ở chú thích `legalCuts`.
  const regions = [region];
  let totalCap = capOf(region, st);
  let step = 0;
  /**
   * ⚠️ **VÙNG BẾ TẮC — VÀ ĐÂY LÀ MỘT CHỖ HỎNG IM LẶNG ĐÃ CÓ TỪ PHASE 20, CHỈ LỘ RA Ở PHASE 21.**
   * `canSplit` hỏi *"vùng này còn đủ chỗ cho hai thửa không"*; `legalCuts` hỏi thêm *"cắt ra thì
   * tổng sức chứa còn đủ số thửa đã khai không"*. Câu thứ hai CHẶT HƠN, nên có vùng qua được câu
   * đầu mà không còn một vị trí cắt nào hợp lệ. Khi ấy `snapTo` nhận danh sách RỖNG và trả về
   * `undefined` — bản trước lấy con số đó làm toạ độ rồi vẽ một đường toàn `undefined` vào bản đồ,
   * **không một lỗi nào nổ ra**. Nó chỉ nổ khi Phase 21 cho `arcTrace` đọc con số ấy.
   * ⇒ Nay bế tắc là một trạng thái CÓ TÊN: bỏ vùng ấy ra rồi thử vùng khác. Và vì `slack` chỉ có
   * thể hẹp dần qua từng bước, một vùng đã bế tắc thì bế tắc vĩnh viễn ⇒ nhớ lại được.
   */
  const beTac = new Set();
  while (regions.length < st.parcels) {
    const slack = totalCap - st.parcels;
    const splittable = regions
      .map((r, i) => ({ r, i }))
      .filter((o) => canSplit(o.r, st) && !beTac.has(o.r))
      .sort((a, b) => (
        regionArea(b.r) - regionArea(a.r)
        || a.r.y0 - b.r.y0
        || a.r.x0 - b.r.x0
      ));
    // ⚠️ KHÔNG THỂ XẢY RA (xem chứng minh ở `legalCuts`), giữ lại làm lưới an toàn cuối cùng. Có
    // cổng đếm ở `cityPlan.test.js` đòi số thửa dựng ra BẰNG số thửa khai, nên nếu dòng này có
    // ngày nào đó chạy thật thì nó đỏ ngay chứ không im lặng như bản trước.
    if (splittable.length === 0) break;

    // ⚠️ "BỐC TRONG MẤY VÙNG TO NHẤT" LÀ CHỖ `sizeVary` THẬT SỰ CẮN. Luôn bổ vùng to nhất thì mọi
    // thửa dần bằng nhau (đó là điều `grid` muốn, `spread` = 1). Cho phép bốc cả vùng to thứ hai,
    // thứ ba thì có vùng bị bổ hai lần liền còn vùng khác không bị đụng tới ⇒ thửa to nhỏ lẫn lộn.
    const spread = Math.min(splittable.length, 1 + Math.round(st.sizeVary * 3));
    const chosen = splittable[pick(`reg|${st.country}|${step}`, spread)];
    const r = chosen.r;

    const legalV = legalCuts(r, 'v', st, slack);
    const legalH = legalCuts(r, 'h', st, slack);
    if (legalV.length === 0 && legalH.length === 0) { beTac.add(r); continue; }
    const axis = chooseAxis(r, st, step, spine, legalV.length > 0, legalH.length > 0);
    const legal = axis === 'v' ? legalV : legalH;
    const posn = snapTo(desiredPos(r, axis, st, step), legal);
    /**
     * ⚠️ **HAI ĐẦU VƯƠN THÊM MỘT Ô — VÌ MỘT CUNG KHÔNG NEO ĐƯỢC VÀO MỘT CUNG KHÁC.** Khi mọi nhát
     * cắt còn THẲNG, một nhát cắt trong vùng con luôn kết thúc ngay sát nhát cắt của vùng cha, nên
     * mạng liền theo cấu tạo. Cung thì không: nhát cắt cha đã uốn đi chỗ khác ở đúng hàng ấy, và
     * hai đầu hụt nhau một ô ⇒ một mảnh đường rời ⇒ cư dân đi quẩn. Vươn thêm một ô (kẹp trong
     * lưới) thì đầu cung nằm ĐÈ LÊN hàng/cột chứa nhát cắt cha, và nó chạm được dù cha uốn thế nào.
     * `vaLienThong` vẫn giữ nguyên làm lưới đỡ cuối, nhưng nay nó gần như không phải làm gì.
     */
    const from = Math.max(0, (axis === 'v' ? r.y0 : r.x0) - 1);
    const to = Math.min(GRID - 1, (axis === 'v' ? r.y1 : r.x1) + 1);
    // ⚠️ NGÂN SÁCH LỆCH — ĐO, KHÔNG ĐOÁN. Bên nào hẹp hơn quyết định cung được phình bao nhiêu:
    // cắt ở `posn` thì bên trái rộng `posn − lo` ô, bên phải rộng `hi − posn` ô, và mỗi bên phải
    // còn ít nhất `minSide`. Cung lệch `d` ô về một bên thì đúng bên ấy hụt `d` ⇒ `d` không được
    // vượt phần dư của bên hẹp hơn. Thêm một trần cứng 2 ô: lệch hơn thế thì không còn đọc ra là
    // "một con phố hơi cong" mà đọc ra là một con phố khác hẳn nằm nhầm chỗ.
    const lo = axis === 'v' ? r.x0 : r.y0;
    const hi = axis === 'v' ? r.x1 : r.y1;
    const beTrai = posn - lo;
    const bePhai = hi - posn;
    const maxDev = Math.max(0, Math.min(beTrai - 1, bePhai - 1, (to - from) * BOW_MAX_SHARE));
    // Nhát đầu là TRỤC CHÍNH của thành phố ⇒ mang vai đại lộ suốt chiều dài. Với `axial` đó là cả
    // câu chuyện của kỷ ấy; với hai tính cách kia nó vẫn là con phố xương sống, mở ra trước tiên.
    markArc(axis, posn, from, to, 0, step === 0, maxDev, `cong|${st.country}|${step}|${axis}|${posn}`);

    const a = axis === 'v'
      ? { x0: r.x0, y0: r.y0, x1: posn - 1, y1: r.y1 }
      : { x0: r.x0, y0: r.y0, x1: r.x1, y1: posn - 1 };
    const b = axis === 'v'
      ? { x0: posn + 1, y0: r.y0, x1: r.x1, y1: r.y1 }
      : { x0: r.x0, y0: posn + 1, x1: r.x1, y1: r.y1 };
    regions.splice(chosen.i, 1, a, b);
    totalCap += capOf(a, st) + capOf(b, st) - capOf(r, st);
    step += 1;
  }

  /**
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * ĐƯỜNG CHÉO — MỘT CON ĐƯỜNG CÓ TRƯỚC CÁI LƯỚI, VÀ KHÔNG CHỊU THEO NÓ
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * Broadway có trước Commissioners' Plan 1811 gần hai thế kỷ: nó là lối mòn Wickquasgeck của người
   * Lenape, và khi cái lưới được kẻ chồng lên thì nó vẫn ở đó, cắt chéo qua từng ô phố. Đó là lý do
   * Times Square và Herald Square tồn tại — chúng là những mảnh đất thừa hình tam giác nơi con
   * đường cũ cắt qua lưới mới.
   * ⚠️ Nó KHÔNG đi qua bộ chia thửa: một đường chéo không phải một ranh giới thửa, nó là một vết
   * cắt ĐÈ LÊN bố cục đã có. Và nó vào `canGiu` để phép tỉa mảng không ăn mất từng khúc của nó —
   * một Broadway đứt quãng thì không còn là Broadway.
   */
  const giuLai = new Set(giuVanhDai);
  if (st.diagonal) {
    const { cells, crossings } = arcTrace(
      { x: GRID - 2, y: GRID - 1 }, { x: 1, y: 0 },
      { bow: 0.10, wiggle: 0, seed: `cheo|${st.country}` },
    );
    themDoan(cells, crossings, 'both', 0, 0, true);
    for (const c of cells) giuLai.add(`${c.x}|${c.y}`);
  }

  // ── NHẬP CÁC ĐOẠN, TỈA MẢNG, VÁ LIÊN THÔNG ───────────────────────────────────────────────────
  // Ba bước này của ADR-059, giữ nguyên vì cả ba đều là hệ quả của việc đường CONG:
  //   · `gom`          — hai cung phủ chung một ô thì hạng cao thắng (đại lộ không bị ngõ bẻ gãy).
  //   · `tiaMangDuong` — hai cung chạy sát nhau tô kín dải giữa ⇒ một cái sân lát, không phải phố.
  //   · `vaLienThong`  — cung bám lưới có thể làm hai nhánh hụt nhau đúng một ô; cư dân đi theo
  //                      quan hệ kề cạnh nên một mảnh rời là một cư dân đi quẩn.
  const { cells: tho, crossings: catTho } = gom(doan);
  const { cells: daTia, daBo } = tiaMangDuong(tho, giuLai);
  const { cells: dayDu, crossings: catVa, soVa } = vaLienThong(daTia, era);
  const crossings = new Map(catTho);
  for (const [k, off] of catVa) if (!crossings.has(k)) crossings.set(k, off);

  // ── VAI CỦA TỪNG Ô ĐƯỜNG ─────────────────────────────────────────────────────────────────────
  const co = new Set(dayDu.map((c) => key(c.x, c.y)));
  const roads = [];
  for (const c of dayDu) {
    const { x, y } = c;
    const k = key(x, y);
    const junction = axisOf.get(k) === 'both';
    const isAvenue = avenue.has(k);
    /**
     * ⚠️ **HƯỚNG SUY TỪ HÀNG XÓM THẬT, KHÔNG SUY TỪ TRỤC CỦA NHÁT CẮT.** Một nhát cắt DỌC bị uốn
     * cong vẫn có những ô mà con đường đi qua theo chiều NGANG (đúng chỗ cung bước sang bên), và
     * ô vá liên thông thì không thuộc nhát cắt nào cả. Hỏi hàng xóm thì cả hai ca đều đúng.
     * ⚠️ Và **một khúc cua KHÔNG phải một ngã tư**: `junction` vẫn đọc từ `axisOf`, tức chỉ ô nào
     * thật sự bị HAI nhát cắt khác trục phủ lên mới mang vai đại lộ. Suy junction từ hàng xóm thì
     * trong một mạng cong gần như ô nào cũng là khúc cua ⇒ cả mạng thành đại lộ (đo được ở bản
     * nháp Phase 19: kỷ 5 có 105 ô thì gần hết mang vai đại lộ).
     */
    const doc = co.has(key(x, y - 1)) || co.has(key(x, y + 1));
    const variant = (junction || isAvenue) ? 0 : (doc ? 1 : 2);
    // ⚠️ `junction` và `avenue` GIỮ RIÊNG, không gộp vào `variant`. Cả ba trường hợp đều cho
    // `variant` 0 (rộng hết ô) nên tầng DỰNG HÌNH không cần phân biệt — nhưng tầng KỂ CHUYỆN thì
    // có: *"một ngã tư mới"* và *"một đoạn đại lộ"* là hai tin khác nhau, và đó là câu Đàm đọc lại
    // sau mỗi phiên. Trước Phase 20 `describeRoadCell` suy tên từ toạ độ (`x === ROAD_MAIN_AXIS`),
    // cách ấy chết theo bộ xương cứng; nay nó ĐỌC THẲNG từ chính ô mà bộ sinh vừa dựng.
    roads.push({ x, y, variant, tier: tierOf.get(k) ?? 0, junction, avenue: isAvenue });
  }
  const mid = (GRID - 1) / 2;
  roads.sort((p, q) => {
    // ⚠️ THỨ TỰ NÀY LÀ MỘT LỜI HỨA, KHÔNG PHẢI CHI TIẾT CÀI ĐẶT: mỗi phiên mở thêm ĐÚNG MỘT ô
    // đường, nên thứ tự chính là thứ Đàm nhìn thấy lớn lên. Giữ nguyên bộ so sánh của Phase 6C
    // (tier → khoảng cách tới tâm → vai → y → x): thành phố mọc từ trong ra ngoài, đại lộ trước
    // ngõ nhỏ, và vành đai luôn mở SAU toàn bộ mạng trong.
    if (p.tier !== q.tier) return p.tier - q.tier;
    const dp = Math.abs(p.x - mid) + Math.abs(p.y - mid);
    const dq = Math.abs(q.x - mid) + Math.abs(q.y - mid);
    if (dp !== dq) return dp - dq;
    if (p.variant !== q.variant) return p.variant - q.variant;
    if (p.y !== q.y) return p.y - q.y;
    return p.x - q.x;
  });

  const roadSet = new Set(roads.map((c) => key(c.x, c.y)));

  /**
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * MỘT THỬA LÀ MỘT TẬP Ô, KHÔNG PHẢI MỘT HÌNH CHỮ NHẬT — ĐÂY LÀ CHỖ HAI NHÁNH THẬT SỰ GẶP NHAU
   * ══════════════════════════════════════════════════════════════════════════════════════════════
   * ⚠️ Phase 20 (chia thửa) và ADR-059 (cung cong) mỗi bên đúng một nửa, và cái nửa còn thiếu chỉ
   * lộ ra khi ghép: bộ chia thửa quyết ranh giới bằng một **con số vị trí** (`posn`), còn cung thì
   * đi lệch khỏi con số ấy tới `BOW_MAX_SHARE` lần chiều dài nhát cắt. Vì vậy một ô nằm gọn trong
   * hình chữ nhật của thửa VẪN CÓ THỂ là ô đường, và một ô nằm đúng trên đường nhát cắt nhưng bị
   * cung né qua thì **KHÔNG thuộc hình chữ nhật nào cả** (nhát cắt tại `posn` cho thửa trái
   * `x0…posn−1` và thửa phải `posn+1…x1`, nên cột `posn` bị bỏ trống khi cung đi chỗ khác).
   *
   * Đo được trước bản vá: kỷ 1 có thửa đè lên đường ở (5,0) và khu kỳ quan đè lên đường ở (9,5);
   * phép cộng "thửa + đường = 144 ô" thủng ở 13/15 kỷ. Ba bài test của `cityPlan.test.js` đỏ.
   *
   * ⇒ **Con đường CONG là sự thật; hình chữ nhật chỉ là ý định.** Hình chữ nhật ở lại vì nó vẫn
   * trả lời đúng ba câu ("thửa này sâu bao nhiêu", "tâm nó ở đâu", "nó có mỏng hơn `minSide`
   * không" — ba câu về Ý ĐỊNH), còn mọi câu hỏi ở cấp Ô thì hỏi `cells`. Mỗi ô KHÔNG phải đường
   * được giao cho hình chữ nhật GẦN NHẤT (ô nằm trong một hình thì khoảng cách 0 — các hình rời
   * nhau nên không có tranh chấp; ô mồ côi ở cột `posn` thì về hình gần nhất, hoà thì về chỉ số
   * nhỏ hơn). Phép giao ấy PHỦ KÍN và KHÔNG CHỒNG LẤN theo cấu tạo, nên bài "thửa + đường = 144"
   * không thể thủng nữa vì một lý do hình học.
   *
   * ⚠️ VÀ ĐÂY CHÍNH LÀ THỨ ĐÀM ĐÒI, KHÔNG PHẢI MỘT PHÉP VÁ CHO TEST HẾT ĐỎ: một thửa có mép cong
   * thì khu nhà bên trong nó thôi là một hình chữ nhật đều đặn. Ranh giới thửa thẳng tắp chính là
   * một nửa của cái vẻ "quy hoạch" mà phase này sinh ra để xoá.
   */
  const parcels = regions.map((r, i) => ({
    x0: r.x0, y0: r.y0, x1: r.x1, y1: r.y1,
    w: regionW(r), h: regionH(r),
    cx: (r.x0 + r.x1) / 2, cy: (r.y0 + r.y1) / 2,
    index: i, use: 'dwelling', cells: [], cellSet: new Set(), area: 0,
  }));
  const chuO = new Map();
  for (let y = 0; y < GRID; y += 1) {
    for (let x = 0; x < GRID; x += 1) {
      const k = key(x, y);
      if (roadSet.has(k)) continue;
      let best = 0;
      let bestD = Infinity;
      for (let i = 0; i < parcels.length; i += 1) {
        const p = parcels[i];
        const dx = x < p.x0 ? p.x0 - x : x > p.x1 ? x - p.x1 : 0;
        const dy = y < p.y0 ? p.y0 - y : y > p.y1 ? y - p.y1 : 0;
        const d = dx + dy;
        if (d < bestD) { bestD = d; best = i; if (d === 0) break; }
      }
      parcels[best].cells.push({ x, y });
      parcels[best].cellSet.add(k);
      chuO.set(k, best);
    }
  }
  for (const p of parcels) p.area = p.cells.length;

  // Thửa nào được kỳ quan, quyết theo TÍNH CÁCH — và mỗi cách đều là một câu có thật:
  //   grid   → 5 thửa gần TÂM nhất (kinh đô quy hoạch đặt điện lớn ở trung tâm)
  //   axial  → 5 thửa gần TRỤC CHÍNH nhất (mọi thứ quan trọng bám mặt tiền đại lộ)
  //   organic→ 5 thửa gần PHÍA CÓ NƯỚC nhất (thành phố hữu cơ tụ về bến, chợ, sông)
  const setting = getSetting(era);
  const shoreScore = (p) => {
    switch (setting.side) {
      case 'dong': return GRID - 1 - p.cx;
      case 'tay': return p.cx;
      case 'bac': return p.cy;
      case 'nam': return GRID - 1 - p.cy;
      default: return null;
    }
  };
  const priority = (p) => {
    if (st.plan === 'grid') return Math.abs(p.cx - mid) + Math.abs(p.cy - mid);
    if (st.plan === 'axial') {
      const spineLine = roads.find((c) => avenue.has(key(c.x, c.y)));
      if (!spineLine) return Math.abs(p.cx - mid) + Math.abs(p.cy - mid);
      return spine === 'v' ? Math.abs(p.cx - spineLine.x) : Math.abs(p.cy - spineLine.y);
    }
    const s = shoreScore(p);
    // Kỷ 1 không có nước (Göbekli Tepe dựng trên sống núi khô — `settingStyle` ghi rõ đó là sự
    // thật gây bối rối nhất về nơi ấy, không phải một chỗ trống trong bảng). Không có bờ để tụ về
    // thì tụ quanh một điểm neo bốc theo hạt giống — vẫn lệch, vẫn tất định, và vẫn không đối xứng.
    if (s === null) {
      const ax = pick(`anchor|x|${st.country}`, GRID);
      const ay = pick(`anchor|y|${st.country}`, GRID);
      return Math.abs(p.cx - ax) + Math.abs(p.cy - ay);
    }
    return s;
  };
  const ranked = [...parcels].sort((a, b) => (
    priority(a) - priority(b) || b.area - a.area || a.index - b.index
  ));

  // ⚠️ HẠNG 4 (kỳ quan `epic` của kỷ) NHẬN THỬA TỐT NHẤT. Thứ hạng là một hợp đồng có sẵn trong
  // `BLUEPRINT_CATALOG` — hạng 4 LUÔN là `wonder` ở cả 15/15 kỷ — nên nó phải đứng ở chỗ đẹp nhất,
  // không phải chỗ thứ năm còn lại.
  const wonderOrder = [4, 0, 1, 2, 3];
  const wonderZones = [];
  ranked.slice(0, 5).forEach((p, i) => {
    p.use = 'wonder';
    const rank = wonderOrder[i];
    /**
     * ⚠️ **KHU KỲ QUAN PHẢI NẰM TRỌN TRÊN ĐẤT CỦA CHÍNH THỬA ẤY — và trước Phase 21 điều đó là
     * hiển nhiên nên không ai viết ra.** Ranh giới thửa THẲNG thì không ô đường nào lọt vào lòng
     * thửa, nên "chọn một hình chữ nhật con bất kỳ" là đủ. Nay ranh giới là một CUNG, nó phình
     * vào trong vài ô, và một kỳ quan đặt đè lên đó là một toà nhà đứng giữa lối đi.
     *
     * ⚠️ **TRẦN LUÔN THẮNG SÀN** — cùng luật đã dùng cho cửa (ADR-026) và cho khu phố (ADR-052):
     * thửa chật thì khu kỳ quan NHỎ LẠI, tuyệt đối không tràn sang ô của người khác. Thử từ cỡ
     * lớn nhất xuống 1×1; cỡ 1×1 chắc chắn tìm được vì mọi thửa đều có ít nhất một ô (có
     * `assert` ngay dưới đây canh điều đó).
     *
     * Trong mỗi cỡ, duyệt mọi chỗ neo theo thứ tự XOAY VÒNG bắt đầu từ chỗ bốc theo hạt giống ⇒
     * khi thửa rộng rãi thì kết quả y hệt trước. Tất định tuyệt đối, không `Math.random`, không
     * phụ thuộc thứ tự duyệt.
     */
    const sach = (x0, y0, zw, zh) => {
      for (let yy = 0; yy < zh; yy += 1) {
        for (let xx = 0; xx < zw; xx += 1) {
          if (!p.cellSet.has(key(x0 + xx, y0 + yy))) return false;
        }
      }
      return true;
    };
    let z = null;
    for (let c = Math.min(WONDER_MAX, p.w, p.h); c >= 1 && !z; c -= 1) {
      const zw = Math.min(c, p.w);
      const zh = Math.min(c, p.h);
      const soX = p.w - zw + 1;
      const soY = p.h - zh + 1;
      const ox0 = pick(`wz|x|${st.country}|${rank}`, soX);
      const oy0 = pick(`wz|y|${st.country}|${rank}`, soY);
      for (let j = 0; j < soX * soY; j += 1) {
        const cx = (ox0 + (j % soX)) % soX;
        const cy = (oy0 + Math.floor(j / soX)) % soY;
        if (sach(p.x0 + cx, p.y0 + cy, zw, zh)) {
          z = { x: p.x0 + cx, y: p.y0 + cy, w: zw, h: zh };
          break;
        }
      }
    }
    // Lưới cứu hộ: thửa quá vụn để chứa nổi một hình chữ nhật nào ⇒ lấy đúng MỘT ô của nó. Ô đầu
    // trong `cells` là tất định (duyệt theo `y` rồi `x`), nên ADR-007 vẫn nguyên.
    if (!z) {
      const o = p.cells[0];
      z = { x: o.x, y: o.y, w: 1, h: 1 };
    }
    wonderZones[rank] = z;
    p.wonderRank = rank;
  });

  // Một vài thửa cố ý ĐỂ TRỐNG làm quảng trường / bãi chợ. Không phải trang trí: một thành phố mà
  // mọi mảnh đất đều có nhà thì đọc ra là một khối đặc, và Đàm đã gọi đúng tên nó — "xếp chồng lên
  // nhau". Chỗ trống mới là thứ cho mắt biết đâu là ranh giới giữa các khu.
  const spare = ranked.slice(5);
  // ⚠️ Số quảng trường hỏi `parcelRoles` — CÙNG một hàm mà `isValidNetworkStyle` dùng để từ
  // chối một dòng bảng khai ít thửa tới mức không còn thửa đất ở nào. Phát biểu lại công thức
  // ở đây là "một luật hai công thức", và hai bên sẽ lệch nhau ở đúng chỗ biên.
  const plazaCount = parcelRoles(parcels.length).plaza;
  const plazaSet = new Set();
  spare.slice(0, plazaCount).forEach((p) => {
    p.use = 'plaza';
    // Ô THẬT của thửa, không phải hình chữ nhật — nếu không thì quảng trường sẽ nhận vơ cả những
    // ô đường mà cung vừa uốn vào lòng nó, và ba nhóm (đường / kỳ quan / quảng trường) thôi rời
    // nhau.
    for (const o of p.cells) plazaSet.add(key(o.x, o.y));
  });

  const zoneSet = new Set();
  for (const z of wonderZones) {
    if (!z) continue;
    for (let y = z.y; y < z.y + z.h; y += 1) {
      for (let x = z.x; x < z.x + z.w; x += 1) zoneSet.add(key(x, y));
    }
  }

  return {
    era, style: st, parcels, roads, roadSet, wonderZones, zoneSet, plazaSet, chuO,
    // `crossings` — tim đường cắt qua mỗi RANH GIỚI ô ở đâu, chuẩn hoá [−1, 1], khoá `'u|i|j'` /
    // `'v|i|j'`. Đây là thứ `roadPath.boundaryBend` đọc để mặt đường ĐỌC RA LÀ CONG thay vì một
    // bậc thang. Xem `ghiCat` trong `arcTrace` (`roadPlan.js`).
    crossings,
    // Hai con số này KHÔNG trang trí: `soVa` = số lần phải vá liên thông, `daBo` = số ô bị tỉa vì
    // nằm trong mảng 2×2. Có test đòi chúng nhỏ — một con số phình lên nghĩa là bộ sinh đang dựng
    // ra thứ gì đó sai mà ảnh thì vẫn trông bình thường.
    soVa, daBo,
  };
}

/**
 * Nhớ kết quả theo kỷ. An toàn vì hàm THUẦN theo đúng một tham số — và cần thiết vì `dwellings`,
 * `terrain`, `cityLayout` đều hỏi lại nhiều lần trong một lượt dựng.
 * ⚠️ Bên ngoài KHÔNG được sửa vật trả về. Có test khoá bằng cách gọi hai lần rồi so sâu.
 */
const CACHE = new Map();

/** Bộ xương của một kỷ. Đầu vào chỉ `era` — xem cảnh báo ADR-007 ở đầu file. */
export function buildCityPlan(era) {
  const k = Number.isFinite(era) ? Math.min(15, Math.max(1, Math.round(era))) : 1;
  if (!CACHE.has(k)) CACHE.set(k, generate(k));
  return CACHE.get(k);
}

/** Ô này có phải đường ở kỷ đó không. */
export function planIsRoad(era, x, y) {
  return buildCityPlan(era).roadSet.has(key(x, y));
}

/** Ô này có nằm trong khu đất đã hứa cho một kỳ quan không. */
export function planIsWonderZone(era, x, y) {
  return buildCityPlan(era).zoneSet.has(key(x, y));
}

/** Ô này có thuộc một thửa cố ý để trống (quảng trường / bãi chợ) không. */
export function planIsPlaza(era, x, y) {
  return buildCityPlan(era).plazaSet.has(key(x, y));
}

/** Khu đất của bản vẽ hạng `rank` (0…4) trong kỷ đó. */
export function planWonderZone(era, rank) {
  const zones = buildCityPlan(era).wonderZones;
  return zones[rank] ?? zones.find(Boolean) ?? { x: 0, y: 0, w: 1, h: 1 };
}

/** Danh sách ô đường đã sắp thứ tự MỞ. Trả BẢN SAO — mảng gốc là trạng thái dùng chung. */
export function planRoadCells(era) {
  return buildCityPlan(era).roads.map((c) => ({
    x: c.x, y: c.y, variant: c.variant, tier: c.tier, junction: c.junction, avenue: c.avenue,
  }));
}

/**
 * Tổng số ô đường của một kỷ — MẪU SỐ cho câu *"đã mở được bao nhiêu"* sau mỗi phiên.
 * ⚠️ Nay là HÀM THEO KỶ chứ không còn một hằng số chung: số ô đường là HỆ QUẢ của số thửa, mà số
 * thửa thì khác nhau ở cả 15 kỷ (đo được: từ 34 ô ở kỷ 1 tới 92 ô ở kỷ 11). Giữ một hằng số chung
 * thì thanh tiến độ sẽ nói dối ở 14 kỷ.
 */
export function planRoadCellCount(era) {
  return buildCityPlan(era).roads.length;
}

/**
 * Ô này thuộc thửa nào, và thửa ấy dùng làm gì (`wonder` | `plaza` | `dwelling`). Trả `null` nếu ô
 * là đường. Tầng ngoài KHÔNG được sửa vật trả về.
 */
export function planParcelAt(era, x, y) {
  const plan = buildCityPlan(era);
  const i = plan.chuO.get(key(x, y));
  return i === undefined ? null : plan.parcels[i];
}

/**
 * Tim đường tại mỗi RANH GIỚI ô, chuẩn hoá [−1, 1]; khoá `'u|i|j'` / `'v|i|j'`.
 *
 * ⚠️ Đây là thứ làm con đường ĐỌC RA LÀ CONG. Bám lưới xong thì cung chỉ còn là một dãy ô, và
 * dựng mặt đường qua tâm từng ô sẽ cho ra một BẬC THANG vuông góc — mắt đọc ra răng cưa, không đọc
 * ra đường cong. Bảng này giữ vị trí THẬT của cung tại chỗ nó vượt qua từng ranh giới; nó do
 * `arcTrace` (`roadPlan.js`) ghi ra và `roadPath.boundaryBend` đọc.
 * Trả BẢN SAO — `Map` gốc là trạng thái dùng chung của bộ nhớ đệm.
 */
export function planCrossings(era) {
  return new Map(buildCityPlan(era).crossings);
}
