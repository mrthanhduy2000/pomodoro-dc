import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { hourCaption } from './cityTimeCopy.js';
import { DAY_PHASE_LABEL, MUSEUM_HOUR } from '../../engine/city3d/daylight.js';

const STAGE = await readFile(new URL('./CityStage.jsx', import.meta.url), 'utf8');
const CONTROLS = await readFile(new URL('./CityTimeControls.jsx', import.meta.url), 'utf8');

test('ROUND 50 (ADR-090): THANH GIỜ VÀ NÚT MÙA nằm DƯỚI tranh, và cái tay cầm nối tới đúng cảnh', () => {
  // the stage mounts the strip once, outside the frame (the frame owns its size — ADR-086), only for 3D
  assert.match(STAGE, /chrome && mode === '3d' && \([\s\S]{0,400}?<CityTimeControls/, 'dải điều khiển phải đứng ngoài khung tranh, chỉ khi có cảnh 3D');
  // …and what it chooses reaches the scene — a slider that changes nothing is a lie
  assert.match(STAGE, /hour=\{hour\}\s+season=\{season\}/, '`CityScene3D` phải nhận `hour` và `season` từ dải điều khiển');
  // the hour is committed debounced (every commit rebuilds the WebGL scene), the caption follows at once
  assert.match(STAGE, /hourTimer\.current = window\.setTimeout\(\(\) => \{ setHour\(next\); hourTimer\.current = null; \}, 150\)/,
    'giờ phải được cam kết sau 150 ms — mỗi lần cam kết là một lần dựng lại cảnh WebGL');
});

test('ROUND 50: KỶ NIÊM PHONG KHÔNG CÓ TAY CẦM — chỉ một dòng nói nó đóng băng ở giờ và mùa nào', () => {
  assert.match(CONTROLS, /if \(dimmed\) \{[\s\S]*?data-city-time="museum"/, 'nhánh bảo tàng phải trả về chú thích, không trả về thanh trượt');
  assert.match(CONTROLS, /hourCaption\(MUSEUM_HOUR\)/, 'chú thích bảo tàng phải đọc đúng `MUSEUM_HOUR`, không viết cứng con số');
  assert.match(CONTROLS, /SEASON_LABEL\[museumSeason\(era\)\]/, 'chú thích bảo tàng phải đọc `museumSeason(era)`');
  // the live strip: a 0–23 slider and one chip per season, from the engine's list — never a hand-typed four
  assert.match(CONTROLS, /type="range"[\s\S]*?min=\{0\}[\s\S]*?max=\{HOUR_MAX\}/, 'thanh trượt phải chạy 0…23');
  assert.match(CONTROLS, /\{SEASONS\.map\(\(s\) =>/, 'nút mùa phải sinh từ `SEASONS` của engine');
  // no button paints itself (ADR-078): the chips use skin tokens only
  assert.ok(!/className="[^"]*\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/.test(CONTROLS),
    'nút mùa tự tô màu — phải dùng token da (var(--…))');
});

test('hourCaption: giờ + tên chặng, kẹp về 0…23', () => {
  assert.equal(hourCaption(MUSEUM_HOUR), `18h · ${DAY_PHASE_LABEL.dusk}`);
  assert.equal(hourCaption(0), `00h · ${DAY_PHASE_LABEL.night}`);
  assert.equal(hourCaption(99).startsWith('23h'), true);
  assert.equal(hourCaption(-5).startsWith('00h'), true);
});
