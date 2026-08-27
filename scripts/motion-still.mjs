/**
 * motion-still.mjs — ĐO tiêu chí nghiệm thu của ba nhịp chuyển động:
 * *"bật Giảm chuyển động thì có còn hoạt hoạ nào chạy không?"*
 *
 * Chạy:  npm run build && node scripts/motion-still.mjs
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO ĐO KIỂU NÀY
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * KHÔNG dùng thứ đại diện (đếm `style` inline, đọc `getComputedStyle`…). Hỏi thẳng câu cần hỏi:
 * bấm chuyển tab, chụp HAI khung hình cách nhau 90ms ngay sau cú bấm, rồi đếm ĐIỂM ẢNH LỆCH.
 * Đang có hoạt hoạ ⇒ hai khung khác nhau. Đứng yên ⇒ giống hệt.
 *
 * ⚠️ **CHẠY CẢ HAI CHẾ ĐỘ, VÀ ĐÓ MỚI LÀ ĐIỂM MẤU CHỐT.** Một con số "0 điểm ảnh lệch" tự nó KHÔNG
 * chứng minh gì — nó cũng đúng y hệt khi phép đo hỏng, khi cú bấm trượt, khi app chưa mọc ra. Chỉ
 * khi chế độ THƯỜNG ra một con số KHÁC 0 thì mới biết cái thước có răng. Đây đúng bài học đã ghi ở
 * `CLAUDE.md`: *"phép đo phải kèm một đối chứng, nếu không thì không biết nó còn răng hay không."*
 *
 * Số đo ngày 2026-08-27 (khung 1280×900, bấm sang tab "Thống kê"), HAI lượt liên tiếp:
 *   · chế độ THƯỜNG        : 40.385 rồi 39.370 điểm ảnh đổi (3,51% / 3,42%), lệch lớn nhất 255
 *   · bật GIẢM CHUYỂN ĐỘNG : 0 rồi 0 điểm ảnh đổi (0,00%), lệch lớn nhất 0
 * ⚠️ Cột THƯỜNG trôi vài phần trăm giữa hai lượt — đúng như phải thế, vì hai khung hình rơi vào
 * hai thời điểm hơi khác nhau của cùng một hoạt hoạ. Cột GIẢM thì **đúng 0 ở cả hai lượt**, và
 * chính sự KHÔNG trôi ấy mới là bằng chứng: một con số dao động quanh 0 là nhiễu, một con số
 * bằng 0 tuyệt đối lặp lại được là một bất biến.
 *
 * ⚠️ CỔNG "APP ĐÃ MỌC RA CHƯA" KHÔNG ĐƯỢC THAY BẰNG MỘT PHÉP ĐỢI CỐ ĐỊNH. Bảng kiểu Google Fonts
 * trong `index.html` là tài nguyên CHẶN RENDER, và trong hộp cát không có mạng ngoài thì
 * `document.readyState` kẹt ở `loading` rất lâu — đợi cố định 6 giây ra đúng 0 nút và một kết luận
 * "không có hoạt hoạ nào" hoàn toàn sai. Phải đợi tới khi ĐỦ SỐ NÚT xuất hiện.
 *
 * ⚠️ AN TOÀN: Supabase bị chặn ở tầng phân giải tên miền, và công cụ này KHÔNG bấm nút "Bắt đầu" —
 * dev dùng chung một dòng Supabase với production (xem `CLAUDE.md`).
 */
import { createServer } from 'node:http';
import { get as httpGet } from 'node:http';
import { spawn } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { inflateSync } from 'node:zlib';

const ROOT = join(process.cwd(), 'dist');
const MIME = { '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];
  const file = join(ROOT, url === '/' ? '/index.html' : url);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('x'); }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const chromePath = ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  '/opt/pw-browsers/chromium/chrome-linux/chrome', '/usr/bin/chromium'].find(existsSync);
const chrome = spawn(chromePath, ['--headless=new', '--no-sandbox', '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--host-resolver-rules=MAP *.supabase.co 127.0.0.1:1, MAP *.supabase.in 127.0.0.1:1',
  '--remote-debugging-port=0', '--hide-scrollbars', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const devtoolsPort = await new Promise((done, fail) => {
  let buf = ''; const t = setTimeout(() => fail(new Error('no devtools')), 20000);
  chrome.stderr.on('data', (b) => { buf += b;
    const m = /ws:\/\/127\.0\.0\.1:(\d+)\//.exec(buf); if (m) { clearTimeout(t); done(Number(m[1])); } });
});
const getJson = (p) => new Promise((done, fail) => {
  httpGet({ host: '127.0.0.1', port: devtoolsPort, path: p }, (res) => {
    let s = ''; res.on('data', (d) => { s += d; }); res.on('end', () => done(JSON.parse(s))); }).on('error', fail);
});
const page = (await getJson('/json/list')).find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });
let id = 0; const pending = new Map();
ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } };
const cdp = (method, params = {}) => new Promise((done, fail) => {
  const i = ++id; pending.set(i, (m) => (m.error ? fail(new Error(method + ': ' + m.error.message)) : done(m.result)));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const evaluate = async (e) => (await cdp('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Giải nén PNG thành mảng byte thô để so từng điểm ảnh (không thêm thư viện). */
function pngPixels(b64) {
  const buf = Buffer.from(b64, 'base64');
  let off = 8, w = 0, h = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('ascii', off + 4, off + 8);
    if (type === 'IHDR') { w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12); }
    if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len));
    off += 12 + len;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = w * bpp; const out = Buffer.alloc(h * stride); let p = 0;
  for (let y = 0; y < h; y++) {
    const f = raw[p++]; const line = raw.subarray(p, p + stride); p += stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const b = y > 0 ? out[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const q = a + b - c; const pa = Math.abs(q - a), pb = Math.abs(q - b), pc = Math.abs(q - c);
        v += (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c); }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, out };
}

async function doMotChe(reduce) {
  await cdp('Page.enable'); await cdp('Runtime.enable');
  await cdp('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false });
  await cdp('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }],
  });
  await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/index.html` });
  // ⚠️ CỔNG "APP ĐÃ MỌC RA CHƯA" — đợi cố định là cách phép đo nói dối. Bảng kiểu Google Fonts là
  // tài nguyên CHẶN RENDER và trong hộp cát này nó không tải được, nên `readyState` kẹt ở `loading`
  // rất lâu; chờ đủ số nút xuất hiện mới là điều kiện đúng.
  let san = 0;
  for (let i = 0; i < 60; i++) {
    san = await evaluate("document.querySelectorAll('button').length");
    if (san >= 5) break;
    await sleep(1000);
  }
  if (san < 5) throw new Error(`App không mọc ra: chỉ có ${san} nút sau 60 giây.`);
  const nut = await evaluate(`(() => { const b = [...document.querySelectorAll('button')]
    .find(x => x.textContent.trim().startsWith('Thống kê')); if (!b) return null;
    const r = b.getBoundingClientRect(); return { x: r.x + r.width/2, y: r.y + r.height/2 }; })()`);
  if (!nut) {
    const co = await evaluate(`[...document.querySelectorAll('button')].map(b => b.textContent.trim()).slice(0,25)`);
    throw new Error('Không thấy nút "Thống kê". Các nút đang có: ' + JSON.stringify(co));
  }

  for (const type of ['mousePressed', 'mouseReleased']) {
    await cdp('Input.dispatchMouseEvent', { type, x: nut.x, y: nut.y, button: 'left', clickCount: 1 });
  }
  await sleep(25);
  const a = pngPixels((await cdp('Page.captureScreenshot', { format: 'png' })).data);
  await sleep(90);
  const b = pngPixels((await cdp('Page.captureScreenshot', { format: 'png' })).data);

  let lech = 0, max = 0;
  for (let i = 0; i < a.out.length; i += 4) {
    const d = Math.max(Math.abs(a.out[i] - b.out[i]), Math.abs(a.out[i+1] - b.out[i+1]), Math.abs(a.out[i+2] - b.out[i+2]));
    if (d > 2) lech++;
    if (d > max) max = d;
  }
  return { lech, max, tong: a.out.length / 4 };
}

const thuong = await doMotChe(false);
const giam = await doMotChe(true);
const pct = (r) => (100 * r.lech / r.tong).toFixed(2);
console.log('');
console.log('  Đo hai khung hình cách nhau 90ms ngay sau cú bấm chuyển tab:');
console.log(`  ┌ chế độ THƯỜNG          : ${thuong.lech.toLocaleString()} điểm ảnh đổi (${pct(thuong)}%), lệch lớn nhất ${thuong.max}`);
console.log(`  └ bật GIẢM CHUYỂN ĐỘNG   : ${giam.lech.toLocaleString()} điểm ảnh đổi (${pct(giam)}%), lệch lớn nhất ${giam.max}`);
console.log('');
console.log(giam.lech === 0 && thuong.lech > 0
  ? '  ✓ ĐẠT — chế độ thường CÓ hoạt hoạ (nên phép đo có răng), bật Giảm chuyển động thì ĐỨNG YÊN TUYỆT ĐỐI.'
  : `  ⚠️ XEM LẠI — thường=${thuong.lech}, giảm=${giam.lech}`);

ws.close(); chrome.kill(); server.close();
process.exit(0);
