/**
 * streetFurniture.js — Round 51 (ADR-091): WHAT STANDS BESIDE THE ROAD.
 *
 * Round 50 put the eye on the street, and the street answered with a flat coloured strip. The paving,
 * the kerb, the pavement and the markings were already there (`streetStyle.js`, drawn into the ground
 * mesh) — what was missing is everything that STANDS ON it: the lamp that lights it, the post you tie
 * a horse to, the bin, the bench, the milestone, the hydrant, the bollard, the rail. Those are what
 * make a street belong to a century; two cities with the same paving and different lamps read as two
 * different centuries, and two cities with the same lamps and different paving do not.
 *
 * ⚠️ WHY THIS IS A SEPARATE FILE FROM `lifeProps.js`, WHICH ALSO PUTS THINGS IN THE STREET.
 * They answer two different questions and they compete for nothing:
 *   · `lifeProps` fills a FREE CELL with a sign of life — a stall, a well, a cart. It needs a whole
 *     cell and it takes one out of circulation.
 *   · this file hangs a small thing on the EDGE of a road cell, at the kerb line, using the road's
 *     own cross-section to know where that edge is. It consumes no cell at all, so a street can be
 *     furnished and still have every one of its free cells available for life.
 * Merging them would force the second kind through the first one's cell budget, and a lamp post that
 * has to win a cell against a market stall will simply never appear.
 *
 * ⚠️ AND WHY IT DOES NOT MOVE ANYTHING (ADR-007). Every piece is derived from a road cell that
 * already exists, placed at a fractional offset from that cell's centre, and appended to `props`
 * after everything else — exactly the shape round 49 used for signs of life. A sealed era gains its
 * lamps without one building shifting.
 */
import { hashId } from '../hashId';
import { getStreetStyle, rankOfRoad, streetCrossSection } from './streetStyle';

/**
 * The kit each century has to furnish a street with.
 *
 * ⚠️ EVERY ROW IS A DATE, NOT A TASTE. A hydrant is 1801 (Philadelphia), a cast-iron gas lamp 1807
 * (Pall Mall), a public litter bin the 1870s, a tram rail the 1830s, a painted street-name plate
 * the 18th century, a Roman milestone the 3rd century BC, a hitching post as old as the ridden
 * horse. Giving an era a piece it could not have had is the same error as giving it a roof material
 * it could not have had, and this project has already paid for that one (`streetStyle.js` locks the
 * kerb to Rome and road markings to the 20th century for exactly this reason).
 *
 * `weight` is how many of that piece a street of this century wants, per ten road cells.
 */
export const STREET_KIT = Object.freeze({
  1:  { country: 'Thổ Nhĩ Kỳ', note: 'Göbekli Tepe — chưa có phố: chỉ cọc buộc thú, đá đánh dấu lối, cỏ mọc lại trên vệt mòn', kit: [['post', 3], ['marker', 2], ['weeds', 4]] },
  // ⚠️ KHÁC KỶ 1 BẰNG MỘT SỰ THẬT, KHÔNG BẰNG MỘT CON SỐ. Hai kỷ đầu suýt nhận cùng một bộ đồ, và
  // một bộ đồ dùng chung thì con phố hết nói ra được nó thuộc về đâu. Cái tách chúng có thật: lối
  // Göbekli Tepe là VỆT CỎ BỊ GIẪM (`streetStyle` khai `wear` 0,36 — cao gần nhất bộ) nên cỏ mọc
  // lại ở mọi kẽ; lối làng sông Nin là PHÙ SA MỊN được chân người và gió san đều liên tục (`wear`
  // 0,12 — thấp nhất bộ) nên không có kẽ nào cho cỏ, mà có CHUM NƯỚC cho lừa uống ở đầu lối.
  2:  { country: 'Ai Cập',     note: 'làng sông Nin — cọc buộc lừa, cột ranh giới ruộng, chum nước đầu lối; lối cát mịn không có kẽ cho cỏ', kit: [['post', 4], ['marker', 3], ['trough', 2]] },
  3:  { country: 'Iraq',       note: 'Ur — đường rước có trụ đá thấp hai bên và giá đuốc ở ngã tư', kit: [['bollard', 3], ['torchpost', 2], ['marker', 2]] },
  4:  { country: 'Trung Quốc', note: "Chang'an — cột đèn lồng, cột mốc dặm khắc chữ, rãnh thoát nước hai bên ngự đạo", kit: [['lamppost', 3], ['milestone', 2], ['gutter', 3], ['post', 2]] },
  5:  { country: 'Đức',        note: 'phố cổ trung cổ — cột đuốc gắn tường, cọc buộc ngựa, cỏ mọc kẽ đá cuội', kit: [['torchpost', 2], ['post', 3], ['weeds', 4], ['trough', 1]] },
  6:  { country: 'Việt Nam',   note: 'phố cổ Hà Nội — đèn lồng treo, chum nước đầu ngõ, rãnh nước hẹp', kit: [['lamppost', 3], ['trough', 2], ['gutter', 3], ['weeds', 2]] },
  7:  { country: 'Ý',          note: 'phố Ý Phục Hưng — trụ đá chắn xe, cột mốc dặm La Mã, bậc lên vỉa hè', kit: [['bollard', 4], ['milestone', 2], ['step', 3], ['torchpost', 1]] },
  8:  { country: 'Bồ Đào Nha', note: 'Lisboa hàng hải — cọc neo dây, thùng rác gỗ, trụ đá góc phố', kit: [['bollard', 3], ['bin', 2], ['post', 2], ['step', 2]] },
  9:  { country: 'Pháp',       note: 'Paris đèn khí — cột đèn gang, trụ quảng cáo, biển tên phố men, rãnh giữa phố', kit: [['gaslamp', 4], ['signpost', 2], ['bin', 2], ['gutter', 3], ['bollard', 1]] },
  10: { country: 'Anh',        note: 'Manchester công nghiệp — cột đèn gang, nắp cống, cột bơm nước, ray xe goòng', kit: [['gaslamp', 3], ['manhole', 3], ['hydrant', 2], ['rail', 3], ['bin', 1]] },
  11: { country: 'Mỹ',         note: 'New York Mạ Vàng — cột đèn điện, trụ nước cứu hoả, nắp cống, ray xe điện, ghế băng', kit: [['streetlight', 4], ['hydrant', 3], ['manhole', 3], ['rail', 3], ['streetbench', 2]] },
  12: { country: 'Nga',        note: 'Stalingrad — cột đèn cong, cột điện gỗ, thùng rác sắt, nắp cống', kit: [['streetlight', 3], ['utilitypole', 3], ['bin', 2], ['manhole', 2]] },
  13: { country: 'Nhật Bản',   note: 'Tokyo — cột điện dày dây, đèn đường mảnh, biển hiệu dọc, cột chắn nhỏ', kit: [['utilitypole', 4], ['streetlight', 3], ['signpost', 3], ['bollard', 2]] },
  14: { country: 'Singapore',  note: 'Marina Bay — đèn kép, ghế băng, thùng rác kim loại, cột chắn thấp, nắp cống', kit: [['streetlight', 3], ['streetbench', 3], ['bin', 3], ['bollard', 3], ['manhole', 2]] },
  15: { country: 'UAE',        note: 'Dubai — đèn cao đại lộ, cột chắn, biển chỉ đường, nắp cống', kit: [['streetlight', 4], ['bollard', 3], ['signpost', 2], ['manhole', 2]] },
});

/** Every furniture kind any era declares — the list `propSpec.js` must be able to build. */
export const STREET_KINDS = Object.freeze(
  [...new Set(Object.values(STREET_KIT).flatMap((row) => row.kit.map(([kind]) => kind)))].sort(),
);

/**
 * How far OUT of the carriageway a piece stands, as a share of the pavement it stands on.
 *
 * ⚠️ 0,62 AND NOT 1,0, AND THIS IS THE NUMBER THAT DECIDES WHETHER THE STREET READS AS A STREET.
 * At 1,0 every lamp sits on the property line, i.e. inside the wall of the house behind it; at 0
 * it stands in the middle of the road. Real street furniture stands on the OUTER THIRD of the
 * pavement, clear of the door and clear of the traffic — so the offset is measured from the kerb
 * outward, not from the cell centre.
 */
const STAND_OUT = 0.62;

/**
 * A verge for the centuries that have no pavement at all.
 *
 * ⚠️ WITHOUT THIS, TEN OF FIFTEEN ERAS GET NOTHING. `walk` is 0 for every era before Chang'an and
 * for most after — a medieval alley has no kerb and no pavement, it has a wall and a gutter. But a
 * hitching post still stands somewhere, and that somewhere is just outside the worn strip. So when
 * there is no pavement, the piece stands a fixed sliver beyond the carriageway edge.
 */
const VERGE = 0.09;

const cellKey = (x, y) => `${x},${y}`;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

/** 0…1 from a string, the same hash the rest of the layout uses. */
function unit(seed) {
  return (hashId(seed) % 10000) / 10000;
}

/**
 * Furnish the streets of one era.
 *
 * @param {object} input
 * @param {number} input.era
 * @param {Array<{x:number,y:number,variant:number,tier?:number}>} input.roads  the road cells, as laid
 * ⚠️ IT TAKES NO `blocked` SET, AND THAT IS DELIBERATE. The first draft passed one in and used it to
 * refuse a utility pole whose neighbour cell was occupied — which is backwards: a pole stands in
 * front of buildings, that is where the wires go. Worse, it made the answer depend on a set the
 * caller assembles, so the layout's own list and a fresh call disagreed (62 against 72 in era 13)
 * and there was no way to check one against the other. The furniture of a street is a function of
 * the STREET, and of nothing else.
 * @returns {Array<{kind:string,x:number,y:number,ox:number,oy:number,ry:number,variant:number}>}
 */
export function deriveStreetFurniture({ era, roads } = {}) {
  const eraNum = Number.isFinite(era) ? era : 1;
  const row = STREET_KIT[eraNum];
  const cells = Array.isArray(roads) ? roads.filter((c) => c && c.kind !== undefined ? c.kind === 'road' : true) : [];
  if (!row || cells.length === 0) return [];

  const style = getStreetStyle(eraNum);
  const roadSet = new Set(cells.map((c) => cellKey(c.x, c.y)));

  /**
   * ⚠️ THE BUDGET IS A COUNT, NOT A PER-CELL COIN FLIP. A flip gives a street that is crowded at one
   * end and bare at the other, because a flip has no memory. Counting out `weight × cells / 10`
   * pieces and then spreading them over the ranked cell list gives every street the same density —
   * which is what a city ordinance actually produces.
   */
  const out = [];
  const used = new Set();
  const perCell = new Map();
  for (const [kind, weight] of row.kit) {
    const want = Math.max(1, Math.round((weight * cells.length) / 10));
    // rank the cells for THIS kind, so two kinds do not queue up on the same cell
    const ranked = cells
      .map((c) => ({ c, r: unit(`sf|${eraNum}|${kind}|${c.x}|${c.y}`) }))
      .sort((a, b) => a.r - b.r);
    let placed = 0;
    for (const { c } of ranked) {
      if (placed >= want) break;
      const slot = `${c.x},${c.y}|${kind}`;
      if (used.has(slot)) continue;

      // WHICH SIDE. A piece stands where the pavement is: on a side that is NOT another road cell,
      // so it never lands in the middle of a junction. `weeds` and `gutter` are the exception —
      // they belong to the road surface itself and take the road side.
      const alongRoad = kind === 'weeds' || kind === 'gutter' || kind === 'rail' || kind === 'manhole';
      const sides = N4.filter(([dx, dy]) => {
        const neighbour = roadSet.has(cellKey(c.x + dx, c.y + dy));
        return alongRoad ? neighbour : !neighbour;
      });
      if (sides.length === 0) continue;
      const pick = sides[Math.floor(unit(`sfs|${eraNum}|${kind}|${c.x}|${c.y}`) * sides.length) % sides.length];
      const [dx, dy] = pick;

      const { half, walk } = streetCrossSection(style, rankOfRoad(c.variant, c.tier));
      // ⚠️ HAI MÓN MỘT Ô LÀ PHỐ, BA MÓN LÀ BÃI PHẾ LIỆU. Mỗi loại xếp hạng ô độc lập với nhau, nên
      // không có gì ngăn năm loại của kỷ 11 cùng chọn đúng một ô — đo ra 4 món chồng lên nhau ở ô
      // (6,2). Một cái trần theo Ô là chỗ duy nhất luật này phát biểu được.
      if ((perCell.get(cellKey(c.x, c.y)) ?? 0) >= 2) continue;
      // the kerb line, then out onto the pavement (or onto the verge when there is no pavement)
      const outward = alongRoad
        ? half * (0.15 + unit(`sfo|${eraNum}|${kind}|${c.x}|${c.y}`) * 0.55)
        : half + (walk > 0.01 ? walk * STAND_OUT : VERGE);
      // a sliver along the road, so a row of lamps is not a row of soldiers
      /**
       * ⚠️ VÀ CÁI XÊ DỊCH DỌC PHỐ CŨNG PHẢI BỊ KẸP, chứ không chỉ khoảng lệch ngang. Với món nằm
       * TRÊN mặt đường, hướng "ra ngoài" chạy DỌC phố, nên chính cái xê dịch này mới là khoảng
       * cách ngang của nó — để nguyên ±0,17 thì một túm cỏ lệch 0,131 trong khi nửa lòng đường kỷ 1
       * chỉ 0,130, tức nó đứng ngoài mặt đường đúng một sợi tóc. Kẹp theo `half` là kẹp theo QUAN
       * HỆ với con đường ấy, không theo một con số chọn sẵn.
       */
      const jitterRoom = alongRoad ? half * 1.1 : 0.34;
      const jitter = (unit(`sfj|${eraNum}|${kind}|${c.x}|${c.y}`) - 0.5) * jitterRoom;
      const ox = dx * outward + (dx === 0 ? jitter : 0);
      const oy = dy * outward + (dy === 0 ? jitter : 0);
      // facing: a bench, a sign and a trough all look AT the road, so they turn with the side
      const ry = Math.atan2(-dx, -dy);

      out.push({
        kind, x: c.x, y: c.y, ox, oy, ry,
        variant: Math.floor(unit(`sfv|${eraNum}|${kind}|${c.x}|${c.y}`) * 4),
      });
      used.add(slot);
      perCell.set(cellKey(c.x, c.y), (perCell.get(cellKey(c.x, c.y)) ?? 0) + 1);
      placed += 1;
    }
  }
  return out;
}
