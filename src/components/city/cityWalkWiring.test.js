import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const STAGE = await readFile(new URL('./CityStage.jsx', import.meta.url), 'utf8');
const SCENE = await readFile(new URL('./render3d/CityScene3D.jsx', import.meta.url), 'utf8');

test('ROUND 50 (ADR-090): XUỐNG PHỐ là một chế độ của CHÍNH cần cẩu `orbit` — không có hệ camera thứ hai', () => {
  assert.match(SCENE, /import \{[^}]*\bcreateWalker\b[^}]*\} from '\.\.\/\.\.\/\.\.\/engine\/city3d\/walk'/, 'cảnh phải đọc người đi bộ từ `walk.js`');
  assert.match(SCENE, /orbit\.setWalk\(true, \{ pitchMin: WALK_PITCH_MIN, pitchMax: WALK_PITCH_MAX \}\)/, 'vào phố = mở khoá cần cẩu, không tạo camera mới');
  assert.match(SCENE, /orbit\.set\(walker\.orbitState\(\)\)/, 'vị trí người đi bộ phải đi qua `orbit.set` — một luật một công thức');
  assert.ok(!/new PerspectiveCamera\([^)]*\)[\s\S]*new PerspectiveCamera\(/.test(SCENE), 'chỉ được có MỘT camera trong cảnh');
  // the lens: wider and nearer on the street, restored above — one place, read from the engine
  assert.match(SCENE, /const fov = walking \? WALK_FOV : CITY_CAMERA_FOV;/, 'tầm nhìn phải đổi theo chế độ, hằng số đọc từ engine');
  assert.match(SCENE, /const near = walking \? WALK_NEAR : OVERVIEW_NEAR;/, 'mặt cắt gần phải sát lại khi xuống phố, nếu không mọi mặt tiền bị cắt');
  // leaving flies home the way a focus flight does — no second return path
  assert.match(SCENE, /beginFlight\(walkHome, \{ minPitch: MIN_PITCH, minDistance: orbit\.getHome\(\)\.minDistance \}\)/, 'lên cao = bay về toàn cảnh bằng đúng cơ chế bay của cận cảnh');
  // the keys and the wheel walk; drag looks around
  assert.match(SCENE, /if \(walking\) \{ walkStep\(event\.deltaY > 0 \? -1 : 1\); return; \}/, 'bánh xe chuột phải ĐI, không phóng to, khi đang ở dưới phố');
  assert.match(SCENE, /walker\.look\(/, 'kéo phải là NGOẢNH NHÌN khi đang đi bộ');
});

test('ROUND 50: nút "Xuống phố" dưới tranh, bàn phím ◀ ▲ ▶ trên tranh, Esc và "Lên cao" đưa về toàn cảnh', () => {
  assert.match(STAGE, /data-city-walk="enter"/, 'phải có nút vào phố');
  assert.match(STAGE, /data-city-walk="pad"/, 'phải có bàn phím đi bộ trên tranh');
  assert.match(STAGE, /walk=\{walking\}\s+walkApiRef=\{walkApi\}/, 'cờ đi bộ và tay cầm phải xuống tới cảnh');
  assert.match(STAGE, /if \(walking\) setWalking\(false\); else onPick\?\.\(null\);/, 'Esc phải rời phố trước khi rời cận cảnh');
  assert.match(STAGE, /\{walking \? '⤴ Lên cao' : '⤺ Toàn cảnh'\}/, 'nút thoát phải đổi chữ theo chế độ');
  assert.ok(!/className="[^"]*\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)\b/.test(STAGE), 'nút tự tô màu (ADR-078)');
});
