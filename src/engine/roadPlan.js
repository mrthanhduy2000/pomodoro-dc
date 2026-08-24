/**
 * roadPlan.js — **HỘP ĐỒ NGHỀ CUNG CONG**: biến một đoạn nối hai điểm thành một dãy ô đường.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ FILE NÀY TỪNG LÀ CẢ BỘ SINH MẠNG ĐƯỜNG — NAY CHỈ CÒN LÀ TẦNG HÌNH DẠNG (Phase 21, ADR-064)
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Nó ra đời ở Phase 19 (ADR-059) để trả lời chữ của Đàm: *"không phải kiểu đường lồi lõm, mà là
 * dạng đường cong hay không cong, như thể là có giao lộ, đường uốn quanh ấy"*. Khi ấy nó làm CẢ
 * HAI việc: quyết định **ô nào là đường** (năm kiểu khung `khungBanCo`/`khungTrucChinh`/… nối các
 * điểm mốc lại) và quyết định **con đường ấy có hình gì** (cung cong bám lưới).
 *
 * Phase 21 tách đôi hai việc ấy, vì chúng là hai câu hỏi khác nhau và chỉ có việc thứ hai là đúng:
 *
 * · *"đất được chia thế nào?"* → **`city3d/cityPlan.js`** (chia thửa đệ quy, ADR-060). Năm kiểu
 *   khung cũ dựng đường từ **các điểm mốc cố định** — 5 khu 3×3 ở bốn góc + tâm — nên dù đường có
 *   cong, bộ xương của nó vẫn là cái bố cục ấy ở cả 15 kỷ. Đó chính là "vẻ quy hoạch" mà Đàm chỉ
 *   vào lần thứ hai. Chia thửa thì mỗi kỷ ra một tập thửa khác cỡ khác hình, không có điểm mốc nào
 *   viết cứng.
 * · *"một ranh giới thửa có hình gì?"* → **file này**. `arcTrace` vẫn nguyên vẹn và vẫn là thứ làm
 *   con đường ĐỌC RA LÀ CONG.
 *
 * ⇒ Những gì đã XOÁ: `wonderAnchor`/`eraWonderAnchors`/`landmarks` (điểm mốc suy từ `BUILDING_ZONES`
 * — bảng ấy đã chết từ Phase 20), năm hàm `khung*`, `KHUNG`, `PLAN_BUILDERS`, và `buildRoadPlan`.
 * Những gì GIỮ: `arcTrace` (cung cong), `gom` (nhập nhiều đoạn, hạng cao thắng), `vaLienThong`
 * (lưới an toàn cho cư dân), `tiaMangDuong` (bỏ ô làm mặt đường phình thành mảng), `gates`.
 * `cityPlan.js` gọi cả năm.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ RÀNG BUỘC VẪN NGUYÊN — không phải đoán, đã kiểm
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * **Mạng đường của một kỷ không được đổi theo tiến độ** (`sessionCount`/`built`), vì
 * `city3d/terrain.js` san cao độ mặt đất theo nó — cao độ mà nhúc nhích thì nhà đã xây sẽ lún hoặc
 * nhô. Đổi theo KỶ thì được: `buildTerrain` vốn đã nhận `era`. Mọi hàm ở đây là hàm THUẦN của tham
 * số nó nhận, không đọc gì bên ngoài; `cityPlan.js` giữ test khoá bằng cách gọi kèm dữ liệu rác.
 *
 * ⚠️ **CUNG CONG, KHÔNG PHẢI BẬC THANG NGẪU NHIÊN.** Cách dễ nhất là mỗi bước bốc ngẫu nhiên "đi
 * ngang hay đi dọc". Nó cho ra một đường **răng cưa**, và mắt đọc răng cưa thành *nhiễu*, không
 * thành *đường cong* — đúng thứ Đàm đã bác ("không phải kiểu lồi lõm"). Nên đường đi ở đây được
 * dựng bằng cách **uốn cong cái đường thẳng trước** (một cung có độ vồng `bow`), rồi mới bám lưới:
 * hình dạng do hình học quyết định, phần bám lưới chỉ là hệ quả.
 */

import { CITY_GRID_SIZE as GRID } from './cityGrid';
import { unit, signed } from './hashId';

/** Tâm lưới, theo toạ độ ô thực (11/2 = 5,5 — nằm giữa bốn ô, đúng như một quảng trường). */
export const CENTRE = (GRID - 1) / 2;

/** Kẹp một toạ độ vào trong lưới. */
const kep = (v) => Math.max(0, Math.min(GRID - 1, Math.round(v)));

/** Cửa ngõ ở mép lưới — nơi con đường ra khỏi thành phố. */
export function gates() {
  const m = Math.round(CENTRE);
  return [
    { x: m, y: 0 }, { x: m, y: GRID - 1 },
    { x: 0, y: m }, { x: GRID - 1, y: m },
  ];
}

/**
 * MỘT CUNG CONG NỐI HAI ĐIỂM, đã bám lưới.
 *
 * `bow` = độ vồng, tính theo phần của khoảng cách giữa hai đầu. 0 = thẳng băng.
 * `wiggle` = biên độ sóng phụ chồng lên cung chính (cho đường tự phát), 0 = cung trơn.
 *
 * ⚠️ TRẢ VỀ CÁC Ô **KỀ NHAU THEO CẠNH** (4 hướng), không có bước chéo. Đi chéo thì hai ô chỉ chạm
 * nhau ở một GÓC, mà mặt đường dựng theo ô nên chỗ ấy hở ra một khe — và cư dân (đi theo quan hệ
 * kề cạnh) sẽ không đi qua được. Đây là ràng buộc của tầng dựng hình, không phải sở thích.
 */
export function arcTrace(from, to, { bow = 0, wiggle = 0, seed = 'a' } = {}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 1e-9) return { cells: [{ x: kep(from.x), y: kep(from.y) }], crossings: new Map() };
  // Pháp tuyến của đoạn thẳng — hướng mà cung phình ra.
  const nx = -dy / dist;
  const ny = dx / dist;
  const huong = signed(`${seed}|bow`) >= 0 ? 1 : -1;
  const pha = unit(`${seed}|pha`) * Math.PI * 2;

  const buoc = Math.max(2, Math.ceil(dist * 3));
  const diem = [];
  for (let i = 0; i <= buoc; i += 1) {
    const t = i / buoc;
    // Cung chính: nửa sóng sin ⇒ hai đầu neo đúng chỗ, giữa phình ra.
    const vong = Math.sin(Math.PI * t) * bow * dist * huong;
    // Sóng phụ: cho đường tự phát cái nhịp "rẽ rồi lại rẽ" của ranh thửa đất.
    const song = wiggle > 0 ? Math.sin(t * Math.PI * 3 + pha) * wiggle * dist * 0.25 : 0;
    const off = vong + song;
    diem.push({ x: from.x + dx * t + nx * off, y: from.y + dy * t + ny * off });
  }

  // Bám lưới: đi từng bước MỘT Ô theo cạnh, bám sát dãy điểm trên.
  const cells = [];
  const daCo = new Set();
  const them = (x, y) => {
    const k = `${x}|${y}`;
    if (daCo.has(k)) return;
    daCo.add(k);
    cells.push({ x, y });
  };

  /**
   * ⚠️ **CHỖ CUNG CẮT QUA MỘT RANH GIỚI Ô — ĐÂY LÀ THỨ BIẾN MỘT BẬC THANG THÀNH MỘT ĐƯỜNG CONG.**
   *
   * Bám lưới xong thì cung chỉ còn là một dãy ô, và dựng mặt đường qua tâm từng ô sẽ cho ra một
   * **bậc thang** vuông góc — mắt đọc ra răng cưa, không đọc ra đường cong. Nhưng ở đây ta vẫn
   * còn giữ vị trí THẬT của cung (`p`), nên ghi lại nó: tim đường sau này đi qua đúng những điểm
   * này chứ không đi qua tâm ô.
   *
   * ⚠️ VÀ VÌ KHOÁ LÀ **RANH GIỚI** CHỨ KHÔNG PHẢI Ô, hai ô kề nhau đọc cùng một con số ⇒ không
   * thể lệch. Đó đúng phép đối xứng đã xoá bậc bề rộng ở Phase 12, dùng lại cho độ lệch.
   *
   * ⚠️ KHÔNG DÙNG BĂM. Bản trước sinh độ lệch bằng nhiễu băm nhiều tần số — nó cho ra một con
   * đường **lồi lõm** (đúng chữ Đàm dùng để bác), vì cái lượn ấy không đến từ hình dạng con
   * đường mà đến từ một dãy số ngẫu nhiên. Con số ghi ở đây thì ĐẾN TỪ CHÍNH CUNG, nên chỗ nào
   * cung cong nhiều thì đường lượn nhiều, cung thẳng thì đường thẳng.
   */
  const crossings = new Map();
  const ghiCat = (truc, i, j, lech) => {
    const k = `${truc}|${i}|${j}`;
    if (crossings.has(k)) return;
    // Chuẩn hoá về [−1, 1]: ±1 = mép ô. Bên đọc nhân với chỗ trống thật của hạng đường ở đó.
    crossings.set(k, Math.max(-1, Math.min(1, lech / 0.5)));
  };
  let cx = kep(diem[0].x);
  let cy = kep(diem[0].y);
  them(cx, cy);
  for (const p of diem) {
    const tx = kep(p.x);
    const ty = kep(p.y);
    // ⚠️ ĐI TỪNG BƯỚC MỘT Ô, KHÔNG NHẢY. Nhảy thẳng tới `(tx,ty)` sẽ để lại lỗ hổng khi hai điểm
    // lấy mẫu cách nhau hơn một ô — con đường đứt đoạn mà nhìn ảnh thì rất khó thấy.
    let bao = 0;
    while ((cx !== tx || cy !== ty) && bao < 64) {
      bao += 1;
      // Đi theo trục còn xa hơn ⇒ đường bám sát cung nhất.
      if (Math.abs(tx - cx) >= Math.abs(ty - cy)) {
        const buocX = Math.sign(tx - cx);
        // Ranh giới vừa vượt qua nằm tại `x = max(cũ, mới) − 0,5`; con đường ở đó chạy theo x
        // ⇒ trục 'u', và độ lệch của nó là vị trí y THẬT của cung tại đúng khoảnh khắc ấy.
        ghiCat('u', Math.max(cx, cx + buocX), cy, p.y - cy);
        cx += buocX;
      } else {
        const buocY = Math.sign(ty - cy);
        ghiCat('v', cx, Math.max(cy, cy + buocY), p.x - cx);
        cy += buocY;
      }
      them(cx, cy);
    }
  }
  return { cells, crossings };
}

/** Chỉ lấy danh sách ô — cho những chỗ không cần biết tim đường đi qua ranh giới ở đâu. */
export function arcCells(from, to, opts) {
  return arcTrace(from, to, opts).cells;
}

/** Gom nhiều đoạn thành một danh sách ô, khử trùng, giữ nhãn hạng của đoạn đầu tiên phủ ô đó. */
export function gom(doan) {
  const thay = new Map();
  /**
   * Tim đường tại mỗi ranh giới, kèm hạng của đoạn đã ghi ra nó.
   * ⚠️ CÙNG LUẬT "HẠNG CAO HƠN THẮNG" như với ô. Nếu để đoạn ghi sau thắng thì chỗ một con ngõ
   * cắt ngang một đại lộ, cái đại lộ sẽ bị bẻ theo tim của con ngõ — một khúc gãy ngay giữa trục
   * chính, và nó chỉ lộ ra khi nhìn ảnh.
   */
  const catThay = new Map();
  for (const { cells, crossings, rank, tier } of doan) {
    for (const c of cells) {
      if (c.x < 0 || c.x >= GRID || c.y < 0 || c.y >= GRID) continue;
      const k = `${c.x}|${c.y}`;
      const cu = thay.get(k);
      // Hạng CAO hơn thắng: một ô vừa thuộc đại lộ vừa thuộc ngõ thì nó là đại lộ. Nếu để ngõ
      // thắng thì mặt đường bị THẮT LẠI đúng chỗ giao nhau — trông như đường cụt.
      if (!cu || rank < cu.rank) thay.set(k, { x: c.x, y: c.y, rank, tier });
    }
    for (const [k, off] of crossings ?? []) {
      const cu = catThay.get(k);
      if (!cu || rank < cu.rank) catThay.set(k, { off, rank });
    }
  }
  const crossings = new Map();
  for (const [k, v] of catThay) crossings.set(k, v.off);
  return { cells: [...thay.values()], crossings };
}

/**
 * ⚠️ **VÁ LIÊN THÔNG — MỘT LƯỚI AN TOÀN, KHÔNG PHẢI MỘT CƠ CHẾ TRANG TRÍ.**
 *
 * Cư dân đi bộ theo quan hệ KỀ CẠNH giữa các ô đường (`buildResidentRoute`). Một mảnh đường rời
 * khỏi phần còn lại thì hoặc không ai đi tới, hoặc tệ hơn: một cư dân sinh ra trên mảnh ấy sẽ đi
 * quẩn trong vài ô rồi lặp lại — trông như bị kẹt.
 *
 * Bộ sinh của từng kiểu khung ĐÃ liên thông theo cấu tạo (cây khung, nan chụm ở tâm, lưới cắt
 * nhau). Hàm này là lưới đỡ cho ca mà phép bám lưới làm hai đoạn hụt nhau đúng một ô. Nó KHÔNG
 * được im lặng: có test đếm số lần phải vá, và con số ấy phải nhỏ.
 */
export function vaLienThong(cells, era) {
  const key = (c) => `${c.x}|${c.y}`;
  const map = new Map(cells.map((c) => [key(c), c]));
  const chuaXet = new Set(map.keys());
  const cum = [];
  while (chuaXet.size > 0) {
    const dau = chuaXet.values().next().value;
    const hangDoi = [dau];
    chuaXet.delete(dau);
    const c = [dau];
    while (hangDoi.length > 0) {
      const k = hangDoi.pop();
      const [x, y] = k.split('|').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = `${x + dx}|${y + dy}`;
        if (chuaXet.has(nk)) { chuaXet.delete(nk); hangDoi.push(nk); c.push(nk); }
      }
    }
    cum.push(c);
  }
  if (cum.length <= 1) return { cells, crossings: new Map(), soVa: 0 };

  cum.sort((a, b) => b.length - a.length);
  const chinh = cum[0].map((k) => map.get(k));
  const them = [];
  const catThem = new Map();
  let soVa = 0;
  for (let i = 1; i < cum.length; i += 1) {
    // Nối cụm lẻ vào cụm chính bằng đoạn NGẮN NHẤT tìm được giữa hai bên.
    let A = null; let B = null; let d = Infinity;
    for (const ka of cum[i]) {
      const a = map.get(ka);
      for (const b of chinh) {
        const dd = Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
        if (dd < d) { d = dd; A = a; B = b; }
      }
    }
    if (!A || !B) continue;
    const noi = arcTrace(A, B, { bow: 0, seed: `${era}|va${i}` });
    for (const c of noi.cells) {
      if (!map.has(key(c))) them.push({ x: c.x, y: c.y, rank: 1, tier: 0 });
    }
    // Nhánh vá cũng phải khai tim đường của nó, nếu không đoạn vừa nối vào sẽ chạy qua tâm ô
    // trong khi hai đầu của nó đã lệch — một khúc gãy ngay chỗ mối nối.
    for (const [k, off] of noi.crossings) if (!catThem.has(k)) catThem.set(k, off);
    soVa += 1;
  }
  return { cells: [...cells, ...them], crossings: catThem, soVa };
}

/**
 * TỈA CHO ĐƯỜNG THÀNH ĐƯỜNG — bỏ những ô làm mặt đường **PHÌNH RA THÀNH MẢNG**.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ MỘT KHỐI 2×2 TOÀN ĐƯỜNG KHÔNG PHẢI MỘT CON ĐƯỜNG — NÓ LÀ MỘT CÁI SÂN LÁT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Mỗi đường nối được rasterise ĐỘC LẬP, nên hai cung chạy gần song song cách nhau một ô sẽ tô kín
 * cả dải giữa chúng. Đo trên bản nháp: **13/15 kỷ** có mảng 2×2, và ở kỷ 13 thì **92% số ô đường
 * nằm trong một mảng như thế** — nhìn từ trên xuống nửa dưới thành phố là một vũng bê tông liền,
 * không đọc ra một con phố nào.
 *
 * ⚠️ VÀ ĐÂY LÀ **CÙNG HỌ VỚI THỨ ĐÀM ĐÃ BÁC**, chỉ ở một cấp khác. Anh bác cái bàn cờ vì nó không
 * đọc ra là đường; một cái sân lát cũng không đọc ra là đường. Thứ làm cho mắt đọc ra "phố" không
 * phải bản thân mặt đường mà là **ĐẤT HAI BÊN NÓ** — bỏ đất đi thì còn lại một mặt phẳng.
 *
 * ⇒ Tỉa: bỏ dần những ô vừa nằm trong một mảng 2×2 vừa **bỏ đi được mà mạng vẫn liền**.
 *
 * ⚠️ BA ĐIỀU KHÔNG ĐƯỢC LÀM SAI, và cả ba đều là bài học đã trả giá của dự án:
 *   · **TẤT ĐỊNH** — duyệt theo một thứ tự CỐ ĐỊNH (hạng thấp trước, rồi y, rồi x), không theo thứ
 *     tự mảng. Một phép quét có nhiều điểm bất động thì mạng đường đổi tuỳ thứ tự duyệt, tức phá
 *     ADR-007 một cách rất khó truy.
 *   · **NGÕ CHẾT TRƯỚC, ĐẠI LỘ CHẾT SAU** — ưu tiên bỏ ô hạng thấp. Nếu không thì phép tỉa có thể
 *     ăn mất một đoạn trục chính chỉ vì nó tình cờ đứng cạnh hai con ngõ.
 *   · **KIỂM LIÊN THÔNG BẰNG CÁCH BỎ THẬT RỒI DUYỆT LẠI**, không suy bằng một luật cục bộ. Luật
 *     cục bộ ("ô này có ≥2 hàng xóm nên bỏ được") sai ở đúng những chỗ hiểm — một ô cầu nối giữa
 *     hai cụm cũng có 2 hàng xóm.
 */
export function tiaMangDuong(cells, canGiu) {
  const key = (c) => `${c.x}|${c.y}`;
  const con = new Map(cells.map((c) => [key(c), c]));

  const lienThong = () => {
    const keys = [...con.keys()];
    if (keys.length === 0) return true;
    const thay = new Set([keys[0]]);
    const hangDoi = [keys[0]];
    while (hangDoi.length > 0) {
      const k = hangDoi.pop();
      const [x, y] = k.split('|').map(Number);
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nk = `${x + dx}|${y + dy}`;
        if (con.has(nk) && !thay.has(nk)) { thay.add(nk); hangDoi.push(nk); }
      }
    }
    return thay.size === keys.length;
  };

  /** Ô này có đang nằm trong một khối 2×2 toàn đường không? */
  const trongMang = (c) => {
    for (const [ox, oy] of [[0, 0], [-1, 0], [0, -1], [-1, -1]]) {
      const goc = [[0, 0], [1, 0], [0, 1], [1, 1]]
        .every(([dx, dy]) => con.has(`${c.x + ox + dx}|${c.y + oy + dy}`));
      if (goc) return true;
    }
    return false;
  };

  // Thứ tự CỐ ĐỊNH: hạng thấp (ngõ) trước, rồi theo toạ độ. Lặp tới khi không bỏ được gì nữa —
  // một lượt là chưa đủ, vì bỏ một ô có thể làm ô bên cạnh thôi nằm trong mảng.
  const thuTu = cells.slice().sort((a, b) => (b.rank - a.rank) || (a.y - b.y) || (a.x - b.x));
  let doi = true;
  let daBo = 0;
  while (doi) {
    doi = false;
    for (const c of thuTu) {
      const k = key(c);
      if (!con.has(k) || canGiu.has(k)) continue;
      /**
       * ⚠️ **VÀNH ĐAI KHÔNG BAO GIỜ BỊ TỈA — VÀ ĐÂY LÀ MỘT SỐ ĐO, KHÔNG PHẢI MỘT SỞ THÍCH.**
       * Bản đầu tỉa cả tier 1, và nó ăn mất chính những cái vòng: kỷ 5 (Đức, khai `loops: 1`) đi
       * từ 5 chu trình độc lập xuống **0** — cả thành phố thành một cái CÂY, đi đâu cũng chỉ đúng
       * một lối, trong khi bảng khai rành rành là có tường thành. Đó là bẫy `MIN_STONE` (Phase
       * 9D): bảng khai một đằng, phép tỉa nuốt mất một nẻo.
       *
       * Lý lẽ: một mảng 2×2 sinh ra vì hai cung **tình cờ** chạy sát nhau, còn vành đai là một
       * cấu trúc **có chủ đích**. Tỉa cái tình cờ thì đúng; tỉa cái có chủ đích là xoá một lời
       * khai của bảng. Đo lại sau khi chừa: vòng 0→5 (kỷ 5) · 1→3 (kỷ 3) · 2→4 (kỷ 7) · 1→4
       * (kỷ 9), mà mảng 2×2 vẫn ở mức 0–4 khối mỗi kỷ (trước khi tỉa: tới 56 khối ở kỷ 13).
       */
      if (c.tier === 1) continue;
      if (!trongMang(c)) continue;
      con.delete(k);
      if (lienThong()) { doi = true; daBo += 1; } else con.set(k, c);
    }
  }
  return { cells: [...con.values()], daBo };
}
