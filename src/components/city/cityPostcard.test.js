import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { bandHeight, composePostcard, postcardFileName, postcardLines } from './cityPostcard.js';

const STAGE = await readFile(new URL('./CityStage.jsx', import.meta.url), 'utf8');
const SCENE = await readFile(new URL('./render3d/CityScene3D.jsx', import.meta.url), 'utf8');

test('ROUND 50 (ADR-090): TẤM BƯU THIẾP mang đủ danh tính thành phố — kỷ, nước, số công trình, số phiên, mùa, giờ', () => {
  const t = postcardLines({ era: 8, country: 'Bồ Đào Nha', landmark: 'bến cảng Lisboa', buildings: 5, sessions: 140, season: 'Xuân', hour: '18h · Hoàng hôn' });
  assert.equal(t.top, 'Kỷ 8 · Bồ Đào Nha');
  assert.equal(t.bottom, '5 công trình · 140 phiên · Xuân · 18h · Hoàng hôn');
  assert.equal(t.note, 'bến cảng Lisboa');
  // a city with nothing yet still gets a caption, never `undefined` on the picture
  const empty = postcardLines({ era: 1, buildings: 0, sessions: 0 });
  assert.equal(empty.top, 'Kỷ 1');
  assert.equal(empty.bottom, '0 công trình · 0 phiên');
  assert.equal(postcardFileName({ era: 8, season: 'spring', hour: '18h · Hoàng hôn' }), 'thanh-pho-ky08-spring-18h.png');
  assert.ok(bandHeight(200) >= 56 && bandHeight(2000) > bandHeight(700), 'dải chú thích co theo khung nhưng không bao giờ bé hơn 56 px');
});

test('ROUND 50: khung 3D được ĐỌC NGAY TRONG LƯỢT VẼ — nếu không tấm ảnh ra đen', () => {
  // A WebGL drawing buffer is cleared at composite time; `toDataURL` a frame later returns black.
  assert.match(SCENE, /capture\(\) \{\s*\n\s*renderFrame\(\);\s*\n\s*return \{ url: canvas\.toDataURL\('image\/png'\)/,
    'phải vẽ rồi đọc trong cùng một lượt, không tách ra hai lần gọi');
  assert.ok(!/preserveDrawingBuffer:\s*true/.test(SCENE), 'không được bật `preserveDrawingBuffer` — nó tốn bộ nhớ ở MỌI khung hình của MỌI phiên');
  assert.match(STAGE, /data-city-postcard="save"/, 'phải có nút chụp ảnh dưới tranh');
  assert.match(STAGE, /cameraApiRef=\{cameraApi\}/, 'nút chụp phải nối tới đúng cảnh đang sống');
});

test('composePostcard vẽ khung + dải chú thích, và trả về một tấm PNG', async () => {
  const calls = [];
  const ctx = new Proxy({}, {
    get: (_, k) => (k === 'fillStyle' || k === 'font' || k === 'textBaseline' || k === 'textAlign' ? '' : (...args) => calls.push([k, ...args])),
    set: () => true,
  });
  const canvas = { width: 0, height: 0, getContext: () => ctx, toDataURL: () => 'data:image/png;base64,OK' };
  const documentRef = { createElement: () => canvas };
  class FakeImage {
    set src(v) { this._src = v; setTimeout(() => this.onload?.(), 0); }
    get src() { return this._src; }
  }
  const url = await composePostcard({ url: 'data:image/png;base64,AAA', width: 800, height: 400 }, postcardLines({ era: 3, country: 'Iraq', buildings: 2, sessions: 40, season: 'Hạ', hour: '12h · Trưa' }), { documentRef, ImageCtor: FakeImage });
  assert.equal(url, 'data:image/png;base64,OK');
  assert.equal(canvas.width, 800);
  assert.equal(canvas.height, 400 + bandHeight(400), 'chiều cao = khung + dải chú thích');
  assert.ok(calls.some(([k]) => k === 'drawImage'), 'phải vẽ khung 3D vào');
  const texts = calls.filter(([k]) => k === 'fillText').map(([, s]) => s);
  assert.ok(texts.includes('Kỷ 3 · Iraq'), 'phải in dòng danh tính');
  assert.ok(texts.some((s) => s.includes('2 công trình')), 'phải in dòng số liệu');
});
