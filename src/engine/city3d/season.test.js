import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ERA_CLIMATE, MUSEUM_SEASON, SEASONS, SEASON_LABEL, isSeason, museumSeason, seasonForMonth, seasonLook, seasonParticle,
} from './season.js';
import { weatherAt, museumWeather, weatherParticle } from './weather.js';
import { MUSEUM_HOUR } from './daylight.js';

test('BỐN MÙA, không hơn không kém — và mỗi mùa có nhãn tiếng Việt', () => {
  assert.deepEqual(SEASONS, ['spring', 'summer', 'autumn', 'winter']);
  for (const s of SEASONS) assert.ok(SEASON_LABEL[s], `mùa ${s} không có nhãn`);
  assert.equal(isSeason('monsoon'), false);
});

test('LỊCH → MÙA là một hàm thuần: 12 tháng chia đúng 4 mùa, tháng 3–5 xuân, 12–2 đông', () => {
  assert.equal(seasonForMonth(2), 'spring');
  assert.equal(seasonForMonth(4), 'spring');
  assert.equal(seasonForMonth(5), 'summer');
  assert.equal(seasonForMonth(8), 'autumn');
  assert.equal(seasonForMonth(11), 'winter');
  assert.equal(seasonForMonth(0), 'winter');
  assert.equal(seasonForMonth(-1), 'winter', 'tháng âm vẫn phải ra một mùa');
  assert.equal(seasonForMonth(14), 'spring', 'tháng ngoài 0–11 quấn vòng');
});

test('KỶ NIÊM PHONG ĐÓNG BĂNG MÙA CỦA NÓ — đủ 15 kỷ, mùa hợp lệ, và Stalingrad là mùa đông, Tokyo là mùa xuân', () => {
  for (let era = 1; era <= 15; era += 1) {
    assert.ok(isSeason(MUSEUM_SEASON[era]), `kỷ ${era}: mùa bảo tàng lạ`);
    assert.ok(ERA_CLIMATE[era], `kỷ ${era}: chưa khai khí hậu`);
    assert.equal(museumSeason(era), MUSEUM_SEASON[era]);
  }
  assert.equal(museumSeason(12), 'winter');
  assert.equal(museumSeason(13), 'spring');
  assert.equal(museumSeason(99), 'summer', 'kỷ lạ rơi về mùa nền');
});

test('MÙA HÈ LÀ NỀN: ở mọi kỷ không khô hạn, hạ = đồng nhất (bảng vòng 47–49 được chỉnh trên nó)', () => {
  for (let era = 1; era <= 15; era += 1) {
    const l = seasonLook(era, 'summer');
    if (ERA_CLIMATE[era] === 'arid') continue;
    assert.equal(l.leafHueShift, 0); assert.equal(l.leafSatMul, 1); assert.equal(l.snow, 0); assert.equal(l.blossom, 0);
    assert.equal(seasonParticle(l), null);
  }
  // unknown season or era ⇒ the base look too (total function, never throws)
  assert.equal(seasonLook(5, 'monsoon').season, 'summer');
  assert.equal(seasonLook(undefined, 'winter').climate, 'temperate');
});

test('60 DIỆN MẠO: mỗi kỷ có ≥ 3 mùa KHÁC nền — và đông lạnh có tuyết, xuân Tokyo có hoa, thu ôn đới có lá rơi', () => {
  for (let era = 1; era <= 15; era += 1) {
    const base = JSON.stringify(seasonLook(era, 'summer'));
    const khac = SEASONS.filter((s) => JSON.stringify(seasonLook(era, s)) !== base).length;
    assert.ok(khac >= 3, `kỷ ${era}: chỉ ${khac} mùa khác nền — mùa không nhân được nội dung`);
  }
  for (const era of [5, 9, 10, 11, 12]) assert.equal(seasonLook(era, 'winter').snow, 1, `kỷ ${era}: mùa đông lạnh phải có tuyết`);
  assert.ok(seasonLook(13, 'spring').blossom >= 0.9 && seasonParticle(seasonLook(13, 'spring')) === 'petals', 'Tokyo mùa xuân: anh đào và cánh hoa rơi');
  assert.equal(seasonParticle(seasonLook(9, 'autumn')), 'leaves', 'Paris mùa thu: lá rơi');
  assert.equal(seasonLook(6, 'autumn').groundHueShift < 0, true, 'Bắc Bộ mùa thu: lúa chín vàng');
  assert.equal(seasonLook(14, 'winter').snow, 0, 'Singapore không có tuyết');
});

test('THỜI TIẾT THEO MÙA vẫn giữ luật MƯA LÀM ƯỚT ĐẤT ở cả 15 kỷ × 24 giờ × 4 mùa, và chỉ tuyết mới rơi tuyết', () => {
  for (let era = 1; era <= 15; era += 1) {
    for (const s of SEASONS) {
      for (let h = 0; h < 24; h += 1) {
        const w = weatherAt(era, h + 0.5, s);
        assert.ok(w.wet >= w.rain, `kỷ ${era} ${s} ${h}h: mưa ${w.rain} mà ướt ${w.wet}`);
        if (w.snowfall > 0) assert.equal(w.kind, 'snow', `kỷ ${era} ${s} ${h}h: rơi tuyết mà không phải tuyết`);
        assert.equal(w.season, s);
      }
    }
  }
  // a cold winter turns Paris's evening rain into snow — and the era's own snow (12) stays snow
  assert.equal(weatherAt(9, 19, 'winter').kind, 'snow');
  assert.equal(weatherParticle(weatherAt(9, 19, 'winter')), 'snow');
  assert.equal(weatherAt(12, 12, 'summer').kind, 'snow');
  // summer is the era's own row, byte for byte
  for (let era = 1; era <= 15; era += 1) {
    for (let h = 0; h < 24; h += 3) {
      const a = weatherAt(era, h + 0.5); const b = weatherAt(era, h + 0.5, 'summer');
      assert.equal(a.kind, b.kind); assert.equal(a.rain, b.rain); assert.equal(a.wet, b.wet); assert.equal(a.fog, b.fog);
    }
  }
});

test('BẢO TÀNG: thời tiết niêm phong đọc đúng giờ bảo tàng VÀ mùa bảo tàng', () => {
  for (let era = 1; era <= 15; era += 1) {
    const m = museumWeather(era);
    const w = weatherAt(era, MUSEUM_HOUR, museumSeason(era));
    assert.deepEqual(m, w, `kỷ ${era}: thời tiết bảo tàng lệch`);
  }
  assert.equal(museumWeather(12).kind, 'snow');
});
