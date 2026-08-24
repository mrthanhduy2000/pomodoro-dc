/**
 * roadPlan.js — **BỘ KHUNG MẠNG ĐƯỜNG CỦA MỘT KỶ**: ô nào là đường, và vì sao lại là ô đó.
 *
 * THUẦN tuyệt đối: không three, không DOM, không `Date`, không `Math.random`.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ VÌ SAO FILE NÀY RA ĐỜI — MỘT KẾT LUẬN SAI CỦA CHÍNH TÔI, ĐÃ ĐƯỢC ĐÀM BÁC
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Đàm: *"hiện tại ở thời nguyên thuỷ hay các thời trước làm gì có đường dạng bàn cờ"*, và *"không
 * phải kiểu đường lồi lõm, mà là dạng đường cong hay không cong, như thể là có giao lộ, đường uốn
 * quanh ấy"*.
 *
 * Lần trước tôi đã đo được rằng **không thêm được ô đường** (80/144 ô đã là đường, 30 ô còn lại
 * đúng bằng toàn bộ nhà dân), rồi từ đó suy ra rằng **không đổi được mạng đường** — nên tôi chỉ cho
 * tim đường lượn nhẹ BÊN TRONG ô của nó. Hai mệnh đề ấy KHÔNG tương đương, và cái suy luận ấy là
 * chỗ hỏng: *giữ nguyên SỐ ô mà đổi ô NÀO là đường* thì không có ràng buộc nào cấm cả.
 *
 * Hậu quả của kết luận sai: nhìn từ trên xuống, cả 15 kỷ vẫn là **4 hàng × 4 cột cắt nhau vuông
 * góc** — tức vẫn nguyên cái bàn cờ mà Đàm chỉ vào ngay từ đầu. Lượn vài phần trăm ô bên trong một
 * ô không đổi được điều đó, vì thứ mắt đọc ra là **HÌNH DẠNG CỦA CẢ MẠNG**, không phải mép của một
 * đoạn.
 *
 * ⇒ **Bài học, và nó là bài học về cách hỏi chứ không phải về mã**: khi một phép đo chặn đường,
 * hãy hỏi *"nó chặn ĐÚNG cái gì?"* trước khi để nó chặn luôn cả những hướng nó không nói tới. Phép
 * đo kia chặn cơ chế THÊM; nó không hề nói một chữ nào về cơ chế SẮP XẾP LẠI.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ BA RÀNG BUỘC ĐÃ KIỂM, KHÔNG PHẢI ĐOÁN
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * **(1) ADR-007 KHÔNG bị đụng.** Vị trí 5 kỳ quan suy từ `placeBuilding(bpId)` — chỉ phụ thuộc
 * `bpId`, KHÔNG phụ thuộc mạng đường. Đổi đường thì công trình đứng yên. Đã kiểm bằng cách in vị
 * trí 5 kỳ quan ở kỷ 1/6/11 trước khi viết dòng mã nào.
 *
 * **(2) Mạng đường VỐN ĐÃ chấp nhận bị công trình chọc thủng.** `deriveProps` bỏ qua ô đường nào
 * đã bị chiếm (`if (taken.has(key)) continue`), và đo ra ở kỷ 1 có 2/5 kỳ quan đứng ngay trên một ô
 * đường của mạng cũ. Nên "đường phải né công trình" không phải một yêu cầu mới.
 *
 * **(3) Bất biến THẬT SỰ phải giữ** là: mạng đường của một kỷ **không được đổi theo tiến độ**
 * (`sessionCount`/`built`), vì `city3d/terrain.js` san cao độ mặt đất theo nó — cao độ mà nhúc
 * nhích thì nhà đã xây sẽ lún hoặc nhô. Đổi theo KỶ thì hoàn toàn được: `buildTerrain` vốn đã nhận
 * `era`. File này vì vậy là hàm THUẦN của DUY NHẤT `era`, và có test khoá bằng cách gọi kèm dữ
 * liệu rác.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * CÁCH DỰNG: NỐI CÁC ĐIỂM MỐC BẰNG NHỮNG ĐƯỜNG **CONG**, KHÔNG KẺ HÀNG VÀ CỘT
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * Một mạng đường thật không sinh ra từ việc kẻ ô. Nó sinh ra từ việc **người ta cần đi từ chỗ này
 * tới chỗ kia** — từ cổng làng tới chợ, từ chợ tới đền, từ đền ra bến sông. Đường là VẾT của những
 * chuyến đi ấy, nên nó cong theo địa thế và nó gặp nhau ở những chỗ bất kỳ.
 *
 * Nên bộ sinh ở đây làm đúng thế: mỗi kỷ khai một danh sách **đường nối** giữa các ĐIỂM MỐC (5 khu
 * kỳ quan · tâm · các cửa ngõ ở mép lưới), và mỗi đường nối được rasterise thành một **cung cong**
 * chứ không phải một đoạn thẳng. Hai cung cắt nhau ở đâu thì ở đó có **giao lộ** — chữ T, chữ Y,
 * ngã năm — thay vì 16 ngã tư vuông góc đều tăm tắp.
 *
 * ⚠️ **CUNG CONG, KHÔNG PHẢI BẬC THANG NGẪU NHIÊN.** Cách dễ nhất là mỗi bước bốc ngẫu nhiên "đi
 * ngang hay đi dọc". Nó cho ra một đường **răng cưa**, và mắt đọc răng cưa thành *nhiễu*, không
 * thành *đường cong* — đúng thứ Đàm vừa bác ("không phải kiểu lồi lõm"). Nên đường đi ở đây được
 * dựng bằng cách **uốn cong cái đường thẳng trước** (một cung có độ vồng `bow`), rồi mới bám lưới:
 * hình dạng do hình học quyết định, phần bám lưới chỉ là hệ quả.
 */

import { CITY_GRID_SIZE as GRID, BUILDING_ZONES } from './cityGrid';
import { hashId, unit, signed } from './hashId';
import { BLUEPRINT_CATALOG } from './constants';

/** Tâm lưới, theo toạ độ ô thực (11/2 = 5,5 — nằm giữa bốn ô, đúng như một quảng trường). */
export const CENTRE = (GRID - 1) / 2;

/** Kẹp một toạ độ vào trong lưới. */
const kep = (v) => Math.max(0, Math.min(GRID - 1, Math.round(v)));

/**
 * Ô NEO của một kỳ quan — chỗ nó đứng khi chưa có gì chiếm mất.
 *
 * ⚠️ **MỘT LUẬT MỘT CÔNG THỨC.** Công thức này trước nằm trong `placeBuilding` (`cityLayout.js`),
 * và bộ sinh đường thì cần biết công trình đứng đâu để chừa mặt tiền cho nó. Chép lại vào đây là
 * hai bản của cùng một luật, mà hậu quả khi chúng trôi khỏi nhau thì im lặng và khó chịu đúng kiểu
 * dự án này hay gặp: đường được kéo tới một chỗ trống, còn công trình thì đứng ở chỗ khác không có
 * lối vào. Nên nó nằm ở ĐÂY (file lá, không import ngược lên `cityLayout`) và `placeBuilding` GỌI nó.
 *
 * ⚠️ Chỉ phụ thuộc `bpId` và `rank` — KHÔNG phụ thuộc mạng đường, tiến độ, hay bất cứ thứ gì đổi
 * theo lượt chơi. Đó chính là ADR-007: công trình không bao giờ đổi chỗ.
 */
export function wonderAnchor(bpId, rank) {
  const zone = BUILDING_ZONES[rank];
  const pick = (k, range) => (range > 0 ? hashId(k) % range : 0);
  if (!zone) {
    return { x: pick(`x|${bpId}`, GRID), y: pick(`y|${bpId}`, GRID) };
  }
  return {
    x: zone.x + pick(`x|${bpId}`, zone.w),
    y: zone.y + pick(`y|${bpId}`, zone.h),
  };
}

/** Ô neo của cả 5 kỳ quan trong một kỷ. Thứ tự trong `BLUEPRINT_CATALOG` chính là `rank`. */
export function eraWonderAnchors(era) {
  return (BLUEPRINT_CATALOG[era] ?? []).map((bp, rank) => wonderAnchor(bp.id, rank));
}

/**
 * ĐIỂM MỐC — những chỗ mà con đường CÓ LÝ DO đi tới.
 *
 * ⚠️ SUY TỪ `BUILDING_ZONES`, KHÔNG VIẾT CỨNG. Đường phải chạy tới mặt tiền công trình; nếu bảng
 * khu đất đổi mà danh sách này viết cứng thì đường sẽ dẫn tới chỗ trống và công trình thành ngõ cụt.
 */
export function landmarks() {
  return BUILDING_ZONES.map((z) => ({
    x: z.x + (z.w - 1) / 2,
    y: z.y + (z.h - 1) / 2,
  }));
}

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

/**
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * NĂM KIỂU KHUNG — mỗi kiểu trả lời *"ở nước ấy thời ấy, con đường mọc ra từ ĐÂU?"*
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * ⚠️ MỖI KIỂU PHẢI CÓ ÍT NHẤT MỘT KỶ DÙNG — có test đếm. Một kiểu không kỷ nào khai là một nhánh
 * mã chưa từng chạy (bài học "trục CHẾT", Phase 11).
 */

/** Gom nhiều đoạn thành một danh sách ô, khử trùng, giữ nhãn hạng của đoạn đầu tiên phủ ô đó. */
function gom(doan) {
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

/** BÀN CỜ — quy hoạch có chủ đích. Chang'an, Manhattan, Jackson Plan, siêu ô phố Xô Viết. */
function khungBanCo(era, p) {
  const doan = [];
  const truc = p.arms >= 4 ? [0, 4, 8, GRID - 1] : [0, Math.round(CENTRE), GRID - 1];
  for (let i = 0; i < truc.length; i += 1) {
    const v = truc[i];
    // Trục biên là vành đai — đúng thứ bậc của một thành phố có tường bao.
    const bien = v === 0 || v === GRID - 1;
    // ⚠️ HỆ SỐ 0,32 CHỨ KHÔNG PHẢI 0,12 — và đây là một trục CHẾT đã bị bắt tại trận. Bản đầu
    // dùng 0,12, nên kỷ 14 (Singapore, khai `bend` 0,25) dựng ra một mạng đường **trùng khít từng
    // ô** với kỷ 4 (Chang'an, khai `bend` 0,00): độ vồng 0,03 trên một đoạn dài 11 ô không đủ để
    // dịch nổi một ô nào sau khi bám lưới. Hai kỷ khai hai con số khác nhau, dựng ra một kết quả —
    // đúng cái bẫy `MIN_STONE` (Phase 9D). Có bài test đếm các kỷ trùng mạng để nó không tái diễn.
    const bow = p.bend * 0.32;
    /**
     * ⚠️ **MỘT BÀN CỜ THẬT CÓ THỨ BẬC HAI CHIỀU: ĐẠI LỘ CHẠY MỘT HƯỚNG, PHỐ NGANG CHẠY HƯỚNG KIA.**
     *
     * Bản đầu gán CÙNG hạng cho cả trục dọc lẫn trục ngang, và hậu quả đo được là **kỷ 4 và kỷ 11
     * có ĐÚNG 0 ô hạng "ngõ"** — cả thành phố chỉ gồm đại lộ và vành đai. Đó vừa là một hạng CHẾT
     * (bài học Phase 11) vừa sai lịch sử ở đúng hai kỷ nổi tiếng nhất về chuyện này: Manhattan có
     * 12 **đại lộ** bắc–nam rộng 30m và 155 **phố** đông–tây hẹp hơn hẳn; Trường An có đại lộ Chu
     * Tước rộng 150m chạy bắc–nam còn phố ngang thì hẹp hơn nhiều lần.
     *
     * ⇒ Trục DỌC = đại lộ, trục NGANG = ngõ. Đây cũng chính là thứ Đàm xin ("ít loại đường quá"):
     * nhìn từ trên xuống, một cái lưới có hai bề rộng đọc ra khác hẳn một cái lưới đều tăm tắp.
     */
    doan.push({
      ...arcTrace({ x: v, y: 0 }, { x: v, y: GRID - 1 }, { bow, seed: `${era}|gv${i}` }),
      rank: bien ? 2 : 0, tier: bien ? 1 : 0,
    });
    doan.push({
      ...arcTrace({ x: 0, y: v }, { x: GRID - 1, y: v }, { bow, seed: `${era}|gh${i}` }),
      rank: bien ? 2 : 1, tier: bien ? 1 : 0,
    });
  }
  // Một vòng cong cắt ngang cái lưới — đường ven biển Singapore, đường vành đai chạy chệch khỏi ô
  // phố. Lưới thì `loops` thường bằng 0; kỷ nào khai khác 0 là kỷ có một con đường KHÔNG theo lưới.
  for (let v = 0; v < p.loops; v += 1) {
    doan.push({
      ...arcTrace({ x: 0, y: 2 + v }, { x: GRID - 1, y: GRID - 3 - v },
        { bow: 0.30, seed: `${era}|coast${v}` }),
      rank: 2, tier: 1,
    });
  }
  if (p.diagonal) {
    // Broadway: con đường mòn của người Lenape có TRƯỚC cái lưới, và nó sống sót qua cả lưới.
    doan.push({
      ...arcTrace({ x: 1, y: GRID - 1 }, { x: GRID - 2, y: 1 }, { bow: 0.06, seed: `${era}|bway` }),
      rank: 0, tier: 0,
    });
  }
  return doan;
}

/** MỘT XƯƠNG SỐNG — làng thợ Deir el-Medina, đường rước thành Ur, trục sa mạc Dubai. */
function khungTrucChinh(era, p) {
  const doan = [];
  const m = Math.round(CENTRE);
  const bow = p.bend * 0.14;
  // Trục chính chạy suốt từ cửa bắc xuống cửa nam.
  doan.push({
    ...arcTrace({ x: m, y: 0 }, { x: m + 1, y: GRID - 1 }, { bow, seed: `${era}|spine` }),
    rank: 0, tier: 0,
  });
  // Sườn: mỗi khu công trình có một nhánh rẽ vào, dài ngắn khác nhau.
  landmarks().forEach((lm, i) => {
    const chan = { x: m + (lm.x > m ? 1 : 0), y: kep(lm.y) };
    doan.push({
      ...arcTrace(chan, lm, { bow: p.bend * 0.3, seed: `${era}|rib${i}` }),
      rank: 1, tier: 0,
    });
  });
  // Vài lối phụ ra mép — không phải trục, chỉ là chỗ dân đi tắt ra đồng.
  for (let i = 0; i < p.arms; i += 1) {
    const g = gates()[i % 4];
    const lm = landmarks()[(i + 1) % 5];
    doan.push({
      ...arcTrace(lm, g, { bow: p.bend * 0.35, wiggle: p.tangle, seed: `${era}|out${i}` }),
      rank: 1, tier: i >= 2 ? 1 : 0,
    });
  }
  return doan;
}

/** NAN QUẠT + VÒNG — phố toả từ quảng trường chợ, vòng chạy theo tường thành. Đức trung cổ, Paris. */
function khungNanQuat(era, p) {
  const doan = [];
  const tam = { x: CENTRE, y: CENTRE };
  const n = Math.max(3, p.arms);
  for (let i = 0; i < n; i += 1) {
    // ⚠️ GÓC KHÔNG ĐỀU. Chia đều 360° cho n nan thì ra một bông hoa đối xứng — thứ chỉ có trong
    // bản vẽ quy hoạch, không có trong một thành phố mọc quanh cái chợ. Lệch góc theo băm.
    const goc = (i / n) * Math.PI * 2 + signed(`${era}|goc${i}`) * (Math.PI / n) * 0.55;
    const r = GRID * 0.75;
    const dich = { x: kep(tam.x + Math.cos(goc) * r), y: kep(tam.y + Math.sin(goc) * r) };
    doan.push({
      ...arcTrace(tam, dich, { bow: p.bend * 0.28, wiggle: p.tangle * 0.6, seed: `${era}|nan${i}` }),
      rank: i % 2 === 0 ? 0 : 1, tier: 0,
    });
  }
  // Vòng thành: nối các nan lại ở một bán kính, bằng những cung ngắn.
  for (let v = 0; v < p.loops; v += 1) {
    const r = 3 + v * 2.6;
    const buoc = 8;
    for (let i = 0; i < buoc; i += 1) {
      const a0 = (i / buoc) * Math.PI * 2;
      const a1 = ((i + 1) / buoc) * Math.PI * 2;
      const P = (a) => ({ x: kep(tam.x + Math.cos(a) * r), y: kep(tam.y + Math.sin(a) * r) });
      doan.push({
        ...arcTrace(P(a0), P(a1), { bow: 0.35, seed: `${era}|vong${v}|${i}` }),
        rank: 2, tier: 1,
      });
    }
  }
  return doan;
}

/** THEO ĐƯỜNG ĐỒNG MỨC — phố leo sườn dốc: chạy ngang một đoạn rồi bẻ. Alfama, đồi Pennine. */
function khungThemDoc(era, p) {
  const doan = [];
  const soHang = Math.max(3, p.arms);
  for (let i = 0; i < soHang; i += 1) {
    const y = 1 + Math.round((i / (soHang - 1)) * (GRID - 3));
    const lech = signed(`${era}|them${i}`) * 1.6;
    doan.push({
      ...arcTrace({ x: 0, y: kep(y + lech) }, { x: GRID - 1, y: kep(y - lech) },
        { bow: p.bend * 0.22, wiggle: p.tangle * 0.5, seed: `${era}|hang${i}` }),
      rank: i === Math.floor(soHang / 2) ? 0 : 1,
      tier: i === 0 || i === soHang - 1 ? 1 : 0,
    });
  }
  // Đường nối giữa hai thềm — ngắn, dốc, so le nhau (không bao giờ thẳng hàng thành một cột).
  for (let i = 0; i < soHang - 1; i += 1) {
    const x = kep(1 + unit(`${era}|noi${i}`) * (GRID - 3));
    const y0 = 1 + Math.round((i / (soHang - 1)) * (GRID - 3));
    const y1 = 1 + Math.round(((i + 1) / (soHang - 1)) * (GRID - 3));
    doan.push({
      ...arcTrace({ x, y: y0 }, { x: kep(x + signed(`${era}|nx${i}`) * 2), y: y1 },
        { bow: p.bend * 0.4, seed: `${era}|doc${i}` }),
      rank: 1, tier: 0,
    });
  }
  return doan;
}

/** MẠNG RỐI — đường là VẾT của những chuyến đi. Çatalhöyük, phố cổ Hà Nội, Edo, Firenze. */
function khungMangRoi(era, p) {
  const doan = [];
  const moc = [...landmarks(), ...gates()];
  // (a) Cây khung: nối mỗi điểm mốc với điểm mốc GẦN NHẤT đã nằm trong mạng ⇒ liên thông theo cấu
  //     tạo, và hình dạng thì không đối xứng vì thứ tự nối phụ thuộc khoảng cách thật.
  const daNoi = [moc[0]];
  const conLai = moc.slice(1);
  let k = 0;
  while (conLai.length > 0) {
    let iTot = 0; let jTot = 0; let dTot = Infinity;
    for (let i = 0; i < conLai.length; i += 1) {
      for (let j = 0; j < daNoi.length; j += 1) {
        const d = Math.hypot(conLai[i].x - daNoi[j].x, conLai[i].y - daNoi[j].y);
        if (d < dTot) { dTot = d; iTot = i; jTot = j; }
      }
    }
    const [moi] = conLai.splice(iTot, 1);
    doan.push({
      ...arcTrace(daNoi[jTot], moi, {
        bow: p.bend * 0.5, wiggle: p.tangle, seed: `${era}|cay${k}`,
      }),
      rank: k < 3 ? 0 : 1,
      tier: 0,
    });
    daNoi.push(moi);
    k += 1;
  }
  /**
   * (a2) VÒNG THÀNH.
   *
   * ⚠️ Bản đầu để `loops` của kiểu này chỉ đẻ thêm ngõ phụ, nên **kỷ 6, 7, 13 khai `loops: 1` mà
   * không có lấy một ô vành đai nào** — một hạng chết ở 3/15 kỷ, và sai lịch sử ở cả ba: Firenze
   * có tường thành (nay là đại lộ vành đai chạy đúng trên nền tường ấy), phố cổ Hà Nội nằm gọn
   * giữa vòng thành Thăng Long và hồ, còn Edo thì có hẳn một con hào xoắn ốc.
   *
   * Vòng đi qua những cung ngắn nối tiếp nhau chứ không phải một hình tròn hoàn hảo — một bức
   * tường thành thật bám theo địa thế và bẻ góc ở mỗi tháp canh.
   */
  const tam = { x: CENTRE, y: CENTRE };
  for (let v = 0; v < p.loops; v += 1) {
    const r = 3.4 + v * 2.4;
    const buoc = 8;
    for (let i = 0; i < buoc; i += 1) {
      const P = (k) => {
        const a = (k / buoc) * Math.PI * 2 + signed(`${era}|tuong${v}|${k}`) * 0.18;
        return { x: kep(tam.x + Math.cos(a) * r), y: kep(tam.y + Math.sin(a) * r) };
      };
      doan.push({
        ...arcTrace(P(i), P(i + 1), { bow: 0.3, seed: `${era}|tuong${v}|${i}` }),
        rank: 2, tier: 1,
      });
    }
  }
  // (b) Ngõ phụ: nối thêm vài cặp mốc bất kỳ ⇒ sinh ra VÒNG và những giao lộ chữ Y bất ngờ.
  const soNgo = Math.round(p.tangle * 6) + p.loops * 2;
  for (let i = 0; i < soNgo; i += 1) {
    const a = moc[Math.floor(unit(`${era}|na${i}`) * moc.length)];
    const b = moc[Math.floor(unit(`${era}|nb${i}`) * moc.length)];
    if (a === b) continue;
    doan.push({
      ...arcTrace(a, b, { bow: p.bend * 0.45, wiggle: p.tangle * 1.2, seed: `${era}|ngo${i}` }),
      rank: 1, tier: 0,
    });
  }
  return doan;
}

const KHUNG = {
  grid: khungBanCo,
  axial: khungTrucChinh,
  radial: khungNanQuat,
  terrace: khungThemDoc,
  organic: khungMangRoi,
};

export const PLAN_BUILDERS = Object.keys(KHUNG);

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
function vaLienThong(cells, era) {
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
function tiaMangDuong(cells, canGiu) {
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

/**
 * BỘ KHUNG ĐƯỜNG CỦA MỘT KỶ — hàm THUẦN của DUY NHẤT `era`.
 *
 * ⚠️ CÓ NHỚ LẠI KẾT QUẢ (memo). `deriveProps` gọi nó mỗi lần dựng bố cục, mà bố cục thì dựng lại
 * mỗi khung hình ở màn Thành Phố. Không nhớ thì mỗi khung hình phải chạy lại cả bộ sinh cung cong.
 *
 * @returns {{cells: Array<{x,y,variant,tier}>, crossings: Map<string,number>, soVa: number}}
 *   · `cells` đã SẮP THỨ TỰ MỌC: từ trung tâm ra ngoài, giữ nguyên lời hứa "mỗi phiên mở thêm đúng
 *     một ô đường".
 *   · `crossings` — tim đường cắt qua mỗi RANH GIỚI ô ở đâu, chuẩn hoá [−1, 1]. Khoá `'u|i|j'` /
 *     `'v|i|j'` theo đúng quy ước của `roadPath.boundaryBend`. Đây là thứ làm con đường ĐỌC RA
 *     LÀ CONG thay vì một bậc thang; xem `ghiCat` trong `arcTrace`.
 */
const NHO = new Map();

export function buildRoadPlan(era, style) {
  const eraNum = Number.isFinite(era) ? era : 1;
  if (NHO.has(eraNum)) return NHO.get(eraNum);

  const p = {
    bend: style?.bend ?? 0.5,
    arms: style?.arms ?? 4,
    loops: style?.loops ?? 0,
    tangle: style?.tangle ?? 0,
    diagonal: !!style?.diagonal,
  };
  const dung = KHUNG[style?.plan] ?? khungBanCo;
  const doan = dung(eraNum, p);

  /**
   * ⚠️ **MẶT TIỀN CHO KỲ QUAN — VÀ ĐÂY LÀ MỘT HỒI QUY ĐÃ ĐO, KHÔNG PHẢI MỘT LO XA.**
   *
   * Mạng bàn cờ cũ có đúng một lý lẽ để tồn tại, ghi ngay trong `cityLayout.js`: bốn trục
   * `x,y ∈ {4, 8}` là bộ DUY NHẤT *"chạy sát mép mọi khu đất, nghĩa là mỗi công trình đều có mặt
   * tiền quay ra đường"*. Đo lại thì lời ấy gần đúng: **2/75 kỳ quan** của mạng cũ không có ô đường
   * nào kề bên. Bản nháp của mạng mới đưa con số ấy lên **5/75** — nhỏ, nhưng là đi lùi ở đúng cái
   * điểm mạnh của thứ đang bị thay thế.
   *
   * ⇒ Kéo một nhánh cụt tới ô neo nào chưa có đường kề. Nhánh này là NGÕ (`rank` 1), không phải
   * đại lộ: nó là lối vào một công trình, không phải một trục giao thông.
   */
  const daCoDuong = new Set();
  for (const d of doan) for (const c of d.cells) daCoDuong.add(`${c.x}|${c.y}`);
  const keDuong = (a) => [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]
    .some(([dx, dy]) => daCoDuong.has(`${a.x + dx}|${a.y + dy}`));
  eraWonderAnchors(eraNum).forEach((neo, i) => {
    if (keDuong(neo)) return;
    // Nối tới ô đường GẦN NHẤT — nhánh ngắn nhất có thể, để không cắt nát thửa đất bên cạnh.
    let gan = null; let d = Infinity;
    for (const k of daCoDuong) {
      const [x, y] = k.split('|').map(Number);
      const dd = Math.abs(x - neo.x) + Math.abs(y - neo.y);
      if (dd < d) { d = dd; gan = { x, y }; }
    }
    if (gan) doan.push({ ...arcTrace(gan, neo, { bow: 0, seed: `${eraNum}|ngo${i}` }), rank: 1, tier: 0 });
  });

  const { cells: tho, crossings: catTho } = gom(doan);
  /**
   * ⚠️ TỈA TRƯỚC KHI VÁ, VÀ GIỮ LẠI Ô KỀ KỲ QUAN. Nhánh cụt dẫn vào mặt tiền công trình vừa được
   * kéo ở trên; tỉa mà không chừa chúng ra thì phép tỉa sẽ ăn lại đúng thứ vừa thêm — và bài test
   * mặt tiền sẽ đỏ, nhưng chỉ ở vài kỷ, tức rất dễ bị đọc thành "bộ sinh hôm nay hơi kém may".
   */
  const canGiu = new Set();
  for (const neo of eraWonderAnchors(eraNum)) {
    for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
      canGiu.add(`${neo.x + dx}|${neo.y + dy}`);
    }
  }
  const { cells: daTia, daBo } = tiaMangDuong(tho, canGiu);
  const { cells: dayDu, crossings: catVa, soVa } = vaLienThong(daTia, eraNum);
  const crossings = new Map(catTho);
  for (const [k, off] of catVa) if (!crossings.has(k)) crossings.set(k, off);

  // ⚠️ SẮP THEO KHOẢNG CÁCH TỚI TÂM, rồi tới hạng. Đây KHÔNG chỉ để đẹp — nó là lời hứa "mỗi phiên
  // thấy thành phố lớn thêm một chút": thành phố thật lớn từ trong ra ngoài, và trục chính hiện
  // trước mấy con ngõ ở cùng khoảng cách.
  const sapXep = dayDu.slice().sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    const da = Math.abs(a.x - CENTRE) + Math.abs(a.y - CENTRE);
    const db = Math.abs(b.x - CENTRE) + Math.abs(b.y - CENTRE);
    if (da !== db) return da - db;
    if (a.rank !== b.rank) return a.rank - b.rank;
    if (a.y !== b.y) return a.y - b.y;
    return a.x - b.x;
  });

  /**
   * `variant` cho tầng vẽ: 0 = đại lộ/ngã tư · 1 = ngõ DỌC · 2 = ngõ NGANG.
   * ⚠️ HƯỚNG SUY TỪ HÀNG XÓM THẬT, không suy từ đoạn đã sinh ra ô: một ô có thể thuộc hai đoạn
   * chạy hai hướng khác nhau, và thứ tầng vẽ cần biết là "con đường qua đây chạy dọc hay ngang".
   */
  const co = new Set(sapXep.map((c) => `${c.x}|${c.y}`));
  const cells = sapXep.map((c) => {
    if (c.rank === 0) return { x: c.x, y: c.y, variant: 0, tier: c.tier };
    /**
     * ⚠️ **MỘT KHÚC CUA KHÔNG PHẢI MỘT NGÃ TƯ** — và bản đầu của chính hàm này đã nhầm hai thứ đó.
     * Nó gán vai ĐẠI LỘ cho mọi ô vừa có hàng xóm ngang vừa có hàng xóm dọc, với lý lẽ mượn từ
     * Phase 6C ("ngã tư phải rộng hết ô, không thì mặt đường thắt lại"). Lý lẽ ấy đúng cho một
     * mạng BÀN CỜ, nơi ngang-và-dọc chỉ xảy ra ở chỗ hai trục cắt nhau. Trong một mạng CONG thì
     * gần như mọi ô đều là một khúc cua, nên luật ấy biến cả mạng thành đại lộ — đo được ở bản
     * nháp: kỷ 5 có 105 ô thì gần hết mang vai đại lộ.
     *
     * Thứ bậc đường phải đến từ VAI TRÒ của con đường (`rank`, do đoạn sinh ra nó khai), không đến
     * từ hình dạng cục bộ của một ô. Còn việc "mặt đường không được thắt ở chỗ ngoặt" thì
     * `carriagewayShape` đã lo sẵn: nó lấy bề rộng theo TỪNG TRỤC từ hàng xóm, nên một khúc cua
     * của ngõ vẫn giữ đúng bề ngõ ở cả hai nhánh.
     */
    const doc = co.has(`${c.x}|${c.y - 1}`) || co.has(`${c.x}|${c.y + 1}`);
    return { x: c.x, y: c.y, variant: doc ? 1 : 2, tier: c.tier };
  });

  const ket = { cells, crossings, soVa, daBo };
  NHO.set(eraNum, ket);
  return ket;
}
