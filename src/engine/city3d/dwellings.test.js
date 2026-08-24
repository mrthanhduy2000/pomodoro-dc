/**
 * dwellings.test.js — khoá lời hứa "mỗi ~2 phiên thành phố mọc thêm một căn nhà, và nó mọc ĐÚNG CHỖ".
 *
 * ⚠️ Loại lỗi mà file này canh đều im lặng: nhà mọc đè lên ô đã hứa cho kỳ quan, nhà mọc giữa lòng
 * đường, hay nhà mọc trước cả công trình đầu tiên. Không cái nào làm đỏ build hay lint — bố cục vẫn
 * hợp lệ, chỉ là sai. Chúng chỉ lộ ra khi có người ngồi nhìn ảnh chụp, mà ảnh chụp thì không chạy
 * trong CI.
 *
 * ── VÌ SAO CẢ FILE NÀY ĐÃ ĐỔI SANG "THEO KỶ" (2026-08-24, Phase 20) ──────────────────────────────
 * Trước Phase 20, danh sách ô đất trống là MỘT hằng số 30 ô dùng chung cho cả 15 kỷ, vì bộ xương
 * đường sá cũng là một hằng số. Nay bộ xương được SINH RA theo kỷ (`cityPlan.js`), nên số ô xây
 * được đi từ 22 tới 49 tuỳ kỷ. Mọi bài dưới đây vì thế phải hỏi TỪNG KỶ MỘT — hỏi một kỷ rồi suy ra
 * cho 14 kỷ kia đúng là cái bẫy đã sinh ra `TECH_DEBT #38` (một trần đo trên ba kỷ được đọc thành
 * luật của cả mười lăm).
 */

import test from 'node:test';
import assert from 'node:assert/strict';

import {
  SESSIONS_PER_DWELLING, dwellingPlots, dwellingPlotCount,
  districtAt, densityCap, deriveDwellings, sessionsToNextDwelling,
} from './dwellings';
import { planIsRoad, planIsWonderZone, planIsPlaza } from './cityPlan';
import { CITY_GRID_SIZE } from '../cityGrid';
import { computeCityLayout } from '../cityLayout';
import { BLUEPRINT_CATALOG } from '../constants';

const ERAS = Array.from({ length: 15 }, (_, i) => i + 1);
const key = (c) => `${c.x},${c.y}`;

test('Ô ĐẤT TRỐNG: không ô nào nằm trên đường, trong khu đất kỳ quan, hay giữa quảng trường', () => {
  let soKy = 0;
  for (const era of ERAS) {
    const plots = dwellingPlots(era);
    assert.ok(dwellingPlotCount(era) > 0, `kỷ ${era} không có ô đất nào`);
    for (const plot of plots) {
      assert.ok(!planIsRoad(era, plot.x, plot.y), `kỷ ${era}: ô (${key(plot)}) nằm trên đường`);
      assert.ok(!planIsWonderZone(era, plot.x, plot.y), `kỷ ${era}: ô (${key(plot)}) lấn đất kỳ quan`);
      assert.ok(!planIsPlaza(era, plot.x, plot.y), `kỷ ${era}: ô (${key(plot)}) lấn quảng trường`);
      assert.ok(plot.x >= 0 && plot.x < CITY_GRID_SIZE && plot.y >= 0 && plot.y < CITY_GRID_SIZE);
    }
    // Không ô nào trùng ô nào — hai căn nhà chồng lên nhau là lỗi im lặng nhất trong cả file này.
    assert.equal(new Set(plots.map(key)).size, dwellingPlotCount(era));
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');
});

test('BA KHU ĐỀU CÓ THẬT ở MỌI KỶ — không kỷ nào mất hẳn một khu', () => {
  // ⚠️ Đàm yêu cầu đích danh "ngoại vi → khu dân cư → trung tâm → landmark". Nếu một ngưỡng bị
  // chỉnh lệch thì một khu có thể biến mất sạch mà mọi bài test khác vẫn xanh, và thành phố lại
  // thành "rải rác ngẫu nhiên" — đúng thứ anh nói là KHÔNG được.
  //
  // ⚠️ Nay phải hỏi TỪNG KỶ, vì mỗi kỷ có một bộ xương đường riêng: một bố cục lỡ trải đường phủ
  // kín vành trong sẽ xoá sạch khu "civic" của ĐÚNG kỷ ấy, còn 14 kỷ kia vẫn đủ ba khu. Biên hiện
  // hẹp nhất là 1 ô (kỷ 6 và kỷ 9 chỉ có đúng một ô "civic") — nên bài này thật sự có răng.
  let soKy = 0;
  for (const era of ERAS) {
    const byDistrict = new Map();
    for (const plot of dwellingPlots(era)) {
      byDistrict.set(plot.district, (byDistrict.get(plot.district) ?? 0) + 1);
    }
    for (const d of ['outskirts', 'residential', 'civic']) {
      assert.ok(byDistrict.get(d) > 0, `kỷ ${era}: khu "${d}" không có ô nào`);
    }
    assert.equal([...byDistrict.values()].reduce((a, b) => a + b, 0), dwellingPlotCount(era));
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');
});

test('KHU ĐI THEO KHOẢNG CÁCH TỚI TÂM, không đảo lộn', () => {
  assert.equal(districtAt(5, 5), 'civic');        // sát tâm
  assert.equal(districtAt(6, 6), 'civic');
  assert.equal(districtAt(2, 5), 'residential');
  assert.equal(districtAt(1, 1), 'outskirts');    // góc xa nhất
  assert.equal(districtAt(0, 0), 'outskirts');
});

test('CHƯA CÓ CÔNG TRÌNH NÀO THÌ CHƯA CÓ NHÀ DÂN', () => {
  // Công trình đầu tiên là thứ Đàm đổi 4–11 phiên để có. Nếu nó mọc lên giữa một thị trấn có sẵn
  // thì mất trọn ý nghĩa — cùng luật đang áp cho đường sá.
  assert.deepEqual(deriveDwellings({ era: 3, buildingCount: 0, sessionCount: 500 }), []);
  assert.equal(sessionsToNextDwelling({ era: 3, buildingCount: 0, sessionCount: 500 }), null);
  assert.ok(deriveDwellings({ era: 3, buildingCount: 1, sessionCount: 500 }).length > 0);
});

test('MỖI 2 PHIÊN THÊM MỘT CĂN — và câu đếm ngược khớp với chính phép đếm đó', () => {
  const base = { era: 8, buildingCount: 1 };
  assert.equal(deriveDwellings({ ...base, sessionCount: 0 }).length, 0);
  assert.equal(deriveDwellings({ ...base, sessionCount: 1 }).length, 0);
  assert.equal(deriveDwellings({ ...base, sessionCount: 2 }).length, 1);
  assert.equal(deriveDwellings({ ...base, sessionCount: 3 }).length, 1);
  assert.equal(deriveDwellings({ ...base, sessionCount: 4 }).length, 2);

  // ⚠️ Câu đếm ngược phải SUY TỪ cùng một phép chia, không phải viết cứng "còn 2 phiên nữa". Lệch
  // nhau thì màn hình hứa một đằng, thành phố mọc một nẻo — và không có gì đỏ lên.
  for (let s = 0; s < 10; s += 1) {
    const now = deriveDwellings({ ...base, sessionCount: s }).length;
    const wait = sessionsToNextDwelling({ ...base, sessionCount: s });
    assert.equal(deriveDwellings({ ...base, sessionCount: s + wait }).length, now + 1,
      `sau ${wait} phiên nữa (từ mốc ${s}) phải có đúng thêm 1 căn`);
  }
  assert.ok(SESSIONS_PER_DWELLING >= 1);
});

test('TRẦN MẬT ĐỘ: đo bằng TỈ LỆ lấp đầy, không bằng số ô đếm được', () => {
  // ⚠️ BÀI NÀY ĐÃ ĐỔI CÁCH HỎI Ở PHASE 20, và lý do chính là bài học đã ghi trong `CLAUDE.md`:
  // *"một con số tuyệt đối không diễn đạt được MẬT ĐỘ trong một không gian hữu hạn"*. Trước đây
  // mọi kỷ có chung 30 ô đất nên số ô đếm được VÀ tỉ lệ lấp đầy là một; nay mẫu số đi từ 22 (kỷ 15,
  // nhiều đường + vành đai) tới 49 (kỷ 14), nên kỷ 15 dày ĐẶC (lấp 100% đất trống) mà vẫn ra ÍT ô
  // hơn kỷ 1 thưa thoáng (lấp 56%). Hỏi bằng số ô là hỏi nhầm đại lượng.
  let prevRatio = 0;
  let soKy = 0;
  for (const era of ERAS) {
    const cap = densityCap(era);
    const plots = dwellingPlotCount(era);
    assert.ok(cap > 0 && cap <= plots, `kỷ ${era} trần ${cap} vô lý trên ${plots} ô đất`);
    assert.equal(deriveDwellings({ era, buildingCount: 5, sessionCount: 100000 }).length, cap,
      `kỷ ${era} không dừng ở trần mật độ`);
    const ratio = cap / plots;
    if (era > 1) {
      // Không đòi tăng nghiêm ngặt (kỷ 12 thời chiến thưa hơn kỷ 11 là có chủ đích), chỉ đòi
      // đầu và cuối hành trình phải khác nhau rõ.
      assert.ok(ratio >= prevRatio - 0.05,
        `kỷ ${era} lấp ${(ratio * 100).toFixed(0)}% — thưa hụt hẳn so với kỷ trước ${(prevRatio * 100).toFixed(0)}%`);
    }
    prevRatio = ratio;
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');

  const r1 = densityCap(1) / dwellingPlotCount(1);
  const r15 = densityCap(15) / dwellingPlotCount(15);
  assert.ok(r15 > r1 * 1.4,
    `kỷ 15 lấp ${(r15 * 100).toFixed(0)}% còn kỷ 1 lấp ${(r1 * 100).toFixed(0)}% — phải khác nhau rõ rệt, nếu không thì 15 kỷ đọc ra cùng một mật độ`);
});

test('TẤT ĐỊNH: cùng đầu vào cho ra cùng thành phố, mãi mãi', () => {
  // Cùng lời hứa ADR-007 đã đưa cho VỊ TRÍ công trình, nay áp cho nhà dân. Dùng `Math.random` ở
  // tầng này sẽ phá nó âm thầm: thành phố vẫn chạy, chỉ là mỗi lần mở lại trông một khác.
  for (const era of [1, 7, 15]) {
    const a = deriveDwellings({ era, buildingCount: 3, sessionCount: 60 });
    const b = deriveDwellings({ era, buildingCount: 3, sessionCount: 60 });
    assert.deepEqual(a, b);
  }
  // Và nhà đã mọc thì KHÔNG được dời chỗ khi có thêm phiên — thành phố lớn thêm, không xáo lại.
  const early = deriveDwellings({ era: 9, buildingCount: 2, sessionCount: 20 });
  const later = deriveDwellings({ era: 9, buildingCount: 2, sessionCount: 40 });
  assert.ok(later.length > early.length);
  assert.deepEqual(later.slice(0, early.length), early, 'nhà cũ bị xáo chỗ khi thành phố lớn lên');
});

test('DANH SÁCH Ô ĐẤT KHÔNG BIẾT TIẾN ĐỘ — gọi kèm dữ liệu rác vẫn ra y hệt (ADR-007)', () => {
  // ⚠️ `dwellingPlots` nhận `era` và CHỈ `era`. "Hàm hiện không nhận tham số đó" là một sự thật rất
  // dễ mất: người sau chỉ cần thêm một tham số tuỳ chọn là bất biến chết mà mọi test vẫn xanh. Cách
  // khoá rẻ nhất (Phase 7B) là gọi kèm dữ liệu rác rồi đòi kết quả Y HỆT lần gọi sạch.
  let soKy = 0;
  for (const era of ERAS) {
    const sach = JSON.stringify(dwellingPlots(era));
    const rac = JSON.stringify(dwellingPlots(era, { built: ['a', 'b'], sessionCount: 999, buildings: [1, 2, 3] }));
    assert.equal(rac, sach, `kỷ ${era}: danh sách ô đất đổi khi có dữ liệu tiến độ`);
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');
});

test('ĐỐI CHỨNG TOÀN LƯỚI: nhà dân · công trình · giàn giáo · cảnh vật không ai đứng đè ai', () => {
  // ⚠️ Bài quan trọng nhất file. Sáu bài trên canh `dwellings.js` một mình; bài này dựng cả bố cục
  // thật qua `computeCityLayout` và đếm ô — đúng bài học "test tầng engine chứng minh hàm chạy
  // đúng, không chứng minh hàm được nối đúng" (Phase 4H).
  let soKy = 0;
  for (const era of ERAS) {
    const ids = (BLUEPRINT_CATALOG[era] ?? []).map((b) => b.id);
    const layout = computeCityLayout({
      built: ids.slice(0, 3),
      era,
      stats: { sessionCount: 400 },
      pending: [{ bpId: ids[3], sessionsRemaining: 2 }],
    });

    const seen = new Map();
    const claim = (cell, what) => {
      const k = key(cell);
      assert.equal(seen.get(k), undefined,
        `kỷ ${era} ô (${k}): "${what}" đứng đè lên "${seen.get(k)}"`);
      seen.set(k, what);
    };
    for (const b of layout.buildings) claim(b, 'công trình');
    for (const s of layout.scaffolds) claim(s, 'giàn giáo');
    for (const h of layout.dwellings) claim(h, 'nhà dân');
    for (const p of layout.props) claim(p, 'cảnh vật');

    assert.ok(layout.dwellings.length > 0, `kỷ ${era} không có nhà dân nào`);
    for (const h of layout.dwellings) {
      assert.ok(!planIsRoad(era, h.x, h.y), `kỷ ${era}: nhà dân (${key(h)}) nằm giữa đường`);
      assert.ok(!planIsWonderZone(era, h.x, h.y), `kỷ ${era}: nhà dân (${key(h)}) lấn đất kỳ quan`);
    }
    soKy += 1;
  }
  assert.equal(soKy, 15, 'gác chạy-rỗng: vòng lặp phải duyệt đủ 15 kỷ');
});
