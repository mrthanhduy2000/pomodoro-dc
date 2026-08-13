/**
 * shot.mjs — CHỤP MÀN HÌNH APP MỘT CÁCH ĐÁNG TIN.
 *
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 * VÌ SAO FILE NÀY TỒN TẠI: hai công cụ chụp trước đó ĐỀU NÓI DỐI, theo hai cách khác nhau
 * ══════════════════════════════════════════════════════════════════════════════════════════════
 *
 * **Lời nói dối 1 — `--window-size` KHÔNG cho ra khung điện thoại.** Chromium headless có SÀN
 * 500px: đặt `--window-size=390,844` thì ảnh ra đúng 390 điểm ảnh, **nhưng `window.innerWidth`
 * thật là 500** — trang dàn ở 500 rồi bị CẮT còn 390. Nhìn y hệt một lỗi tràn ngang nghiêm trọng
 * (chữ cụt giữa câu, thanh dưới mất nút) trong khi app hoàn toàn không tràn.
 *
 * **Lời nói dối 2 — `--virtual-time-budget` làm ĐÓNG BĂNG mọi hoạt hoạ chạy bằng rAF.** Đây là cái
 * nguy hiểm hơn nhiều vì nó âm thầm: framer-motion dựng phần tử ở trạng thái `initial` rồi mới
 * chạy tới `animate` bằng requestAnimationFrame. Tua nhanh thời gian ảo thì rAF không nhích, phần
 * tử **kẹt vĩnh viễn ở `initial`**. Một `motion.section` khai `initial={{opacity:0}}` sẽ ra ảnh là
 * MỘT MẢNG TRẮNG — và mọi phần tử KHÔNG hoạt hoạ xung quanh vẫn vẽ bình thường, nên tấm ảnh trông
 * hoàn toàn hợp lý, chỉ thiếu mất một khối. Đã suýt báo cáo đúng một "lỗi" như vậy ở tab Thành
 * Tích (`Achievements.jsx:488`), nơi cả trang chỉ có DUY NHẤT một phần tử hoạt hoạ và đúng nó biến
 * mất. ⚠️ Hệ quả: **mọi lần soi giao diện bằng công cụ cũ đều có thể đã bỏ sót nội dung** — không
 * có gì báo động, chỉ là thiếu.
 *
 * ⇒ Công cụ này dùng CDP (giao thức điều khiển Chrome) thay cho hai cờ dòng lệnh kia:
 *   • `Emulation.setDeviceMetricsOverride` → bề ngang THẬT, kể cả 390px, không phải ảnh bị cắt.
 *   • Đợi bằng THỜI GIAN THẬT (không có thời gian ảo) → rAF chạy đúng nhịp, hoạt hoạ hoàn tất.
 *   • Luôn in `window.innerWidth` thật kèm mỗi lần chụp, để không bao giờ kết luận về bố cục dựa
 *     trên một bề ngang bịa.
 *
 * ⚠️ AN TOÀN — KHÔNG ĐƯỢC GỠ: Supabase bị chặn ở tầng phân giải tên miền
 * (`--host-resolver-rules`), nên phiên chụp KHÔNG có đường nào ghi đè dữ liệu thật của Đàm. Và
 * công cụ này TUYỆT ĐỐI không bấm nút "Bắt đầu" — dev/localhost dùng chung một dòng Supabase với
 * production (xem `CLAUDE.md` mục "KHÔNG làm những thứ này").
 *
 * Dùng:
 *   node scripts/shot.mjs --out a.png                       # trang chủ, máy bàn 1280
 *   node scripts/shot.mjs --tab "Thành tích" --out b.png
 *   node scripts/shot.mjs --phone --out c.png               # 390px THẬT
 *   node scripts/shot.mjs --dark --hour 22 --out d.png
 *   node scripts/shot.mjs --tab "Thống kê" --full --out e.png   # chụp trọn chiều dài trang
 */
import { createServer } from 'node:http';
import { get as httpGet } from 'node:http';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';
import { spawn } from 'node:child_process';

const argv = process.argv;
const has = (f) => argv.includes(f);
const arg = (f, d) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : d; };

const ROOT = resolve(process.env.DIST ?? 'dist');
const OUT = arg('--out', 'shot.png');
const TAB = arg('--tab', null);
const THEME = has('--dark') ? 'dark' : 'light';
const PHONE = has('--phone');
const FULL = has('--full');
const WIDTH = Number(arg('--width', PHONE ? 390 : 1280));
const HEIGHT = Number(arg('--height', PHONE ? 844 : 900));
const DPR = Number(arg('--dpr', 2));
const HOUR = argv.indexOf('--hour') >= 0 ? Number(arg('--hour')) : null;
const SETTLE = Number(arg('--settle', 3500));

// Giờ VN = UTC+7 ⇒ đặt đồng hồ ở UTC tương ứng để `Intl` (Asia/Ho_Chi_Minh) đọc ra giờ mong muốn.
const FAKE_EPOCH = HOUR === null ? null : Date.UTC(2026, 7, 13, (HOUR - 7 + 24) % 24, 30, 0);

const GAME = {
  state: {
    buildings: ['bp_xuong_hoa', 'bp_truong_dai_hoc', 'bp_nha_bao_tang', 'bp_thu_vien_kh', 'bp_cung_dien_ph'],
    buildingLevels: { bp_xuong_hoa: 2, bp_truong_dai_hoc: 3, bp_nha_bao_tang: 1, bp_thu_vien_kh: 2, bp_cung_dien_ph: 3 },
    progress: { activeBook: 7 },
    eraTracking: { sessionsInCurrentEra: 40 },
    streak: { currentStreak: 9 },
  },
  version: 4,
};
const SETTINGS = {
  state: {
    uiTheme: THEME, uiSkin: 'editorial', cityHomeBackdrop: true,
    cityRenderMode: '3d', hasViewedInitialOnboarding: true,
  },
  version: 8,
};

const clockPatch = FAKE_EPOCH === null ? '' : `<script>(function(){
  var FIXED=${FAKE_EPOCH}, Real=Date;
  function Fake(){ return arguments.length ? new (Function.prototype.bind.apply(Real,[null].concat([].slice.call(arguments)))) : new Real(FIXED); }
  Fake.prototype=Real.prototype; Fake.now=function(){return FIXED;};
  Fake.UTC=Real.UTC; Fake.parse=Real.parse; window.Date=Fake;
})();</script>`;

const MIME = {
  '.html': 'text/html;charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
  '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2',
};

const seedPage = `<!doctype html><meta charset="utf-8"><body><script>
localStorage.setItem('dc-pomodoro-v1', ${JSON.stringify(JSON.stringify(GAME))});
localStorage.setItem('dc-pomodoro-settings-v2', ${JSON.stringify(JSON.stringify(SETTINGS))});
location.replace('/index.html');
</script></body>`;

const server = createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/seed') { res.writeHead(200, { 'content-type': 'text/html;charset=utf-8' }); return res.end(seedPage); }
  const file = join(ROOT, url === '/' ? '/index.html' : url);
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('x'); }
  if (clockPatch && (url === '/' || url === '/index.html')) {
    res.writeHead(200, { 'content-type': MIME['.html'] });
    return res.end(readFileSync(file, 'utf8').replace('<head>', '<head>' + clockPatch));
  }
  res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const chromePath = process.env.CHROME_PATH
  ?? ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium/chrome-linux/chrome',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(existsSync);
if (!chromePath) { console.error('Không tìm thấy Chromium'); process.exit(1); }

const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu-sandbox', '--no-sandbox',
  '--use-angle=swiftshader', '--enable-unsafe-swiftshader',
  // ⚠️ CHẶN SUPABASE — không có đường nào ghi vào dữ liệu thật của Đàm.
  '--host-resolver-rules=MAP *.supabase.co 127.0.0.1:1, MAP *.supabase.in 127.0.0.1:1',
  '--remote-debugging-port=0', '--hide-scrollbars', 'about:blank',
], { stdio: ['ignore', 'ignore', 'pipe'] });

// Chrome in dòng "DevTools listening on ws://127.0.0.1:PORT/..." ra stderr.
const devtoolsPort = await new Promise((done, fail) => {
  let buf = '';
  const t = setTimeout(() => fail(new Error('Chrome không báo cổng DevTools')), 20000);
  chrome.stderr.on('data', (b) => {
    buf += b;
    const m = /ws:\/\/127\.0\.0\.1:(\d+)\//.exec(buf);
    if (m) { clearTimeout(t); done(Number(m[1])); }
  });
});

const getJson = (path) => new Promise((done, fail) => {
  // Dùng http của Node (KHÔNG dùng fetch): fetch đi qua biến môi trường proxy, mà đây là 127.0.0.1.
  httpGet({ host: '127.0.0.1', port: devtoolsPort, path }, (res) => {
    let s = ''; res.on('data', (d) => { s += d; }); res.on('end', () => done(JSON.parse(s)));
  }).on('error', fail);
});

const targets = await getJson('/json/list');
const page = targets.find((t) => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });

let msgId = 0;
const pending = new Map();
ws.onmessage = (ev) => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
function cdp(method, params = {}) {
  const id = ++msgId;
  return new Promise((done, fail) => {
    pending.set(id, (m) => (m.error ? fail(new Error(method + ': ' + m.error.message)) : done(m.result)));
    ws.send(JSON.stringify({ id, method, params }));
  });
}
const evaluate = async (expr) => (await cdp('Runtime.evaluate', {
  expression: expr, returnByValue: true, awaitPromise: true,
})).result.value;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

await cdp('Page.enable');
await cdp('Runtime.enable');
// ⚠️ ĐÂY là thứ `--window-size` không làm được: đặt bề ngang bố cục THẬT.
await cdp('Emulation.setDeviceMetricsOverride', {
  width: WIDTH, height: HEIGHT, deviceScaleFactor: DPR, mobile: PHONE,
});

await cdp('Page.navigate', { url: `http://127.0.0.1:${port}/seed` });
// Đợi bằng THỜI GIAN THẬT — không có thời gian ảo, nên rAF chạy và hoạt hoạ hoàn tất.
await sleep(SETTLE);

if (TAB) {
  // ⚠️ PHẢI THỬ LẠI, không bấm một phát. App còn phải nạp chunk + hydrate; bấm sớm một nhịp thì
  // nút chưa tồn tại, mà lần chụp vẫn "thành công" — ra ảnh MÀN HÌNH KHÁC mà trông vẫn hợp lý.
  // Đúng họ với những lời nói dối ở đầu file: hỏng im lặng, không có gì báo động.
  let clicked = false;
  for (let i = 0; i < 24 && !clicked; i += 1) {
    clicked = await evaluate(`(function(){
      var want=${JSON.stringify(TAB)}, hit=null;
      document.querySelectorAll('button,a,[role="tab"]').forEach(function(el){
        if(hit) return;
        if((el.textContent||'').replace(/\\s+/g,' ').trim()===want) hit=el;
      });
      if(hit){ hit.click(); return true; }
      return false;
    })()`);
    if (!clicked) await sleep(500);
  }
  if (!clicked) {
    const seen = await evaluate(`JSON.stringify(Array.from(document.querySelectorAll('button,a,[role="tab"]'))
      .map(function(e){return (e.textContent||'').replace(/\\s+/g,' ').trim();})
      .filter(function(t){return t && t.length<24;}).slice(0,25))`);
    console.error(`✗ KHÔNG tìm thấy nút tab "${TAB}". Các nhãn nút đang có: ${seen}`);
    ws.close(); chrome.kill(); server.close();
    process.exit(1);   // thà hỏng to còn hơn giao một tấm ảnh sai màn hình
  }
  await sleep(SETTLE);
}

// LUÔN in bề ngang thật: mọi kết luận về bố cục phải dựa trên số này, không phải cỡ ảnh.
const info = await evaluate(`JSON.stringify({
  iw: window.innerWidth, ih: window.innerHeight,
  sw: document.documentElement.scrollWidth, sh: document.documentElement.scrollHeight
})`);
const { iw, ih, sw, sh } = JSON.parse(info);

let clip;
if (FULL) {
  clip = { x: 0, y: 0, width: iw, height: Math.min(sh, 20000), scale: 1 };
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: Math.min(sh, 20000), deviceScaleFactor: DPR, mobile: PHONE,
  });
  await sleep(600);
}

const shot = await cdp('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));

ws.close();
chrome.kill();
server.close();

console.log(`✓ ${OUT}`);
console.log(`  bề ngang THẬT innerWidth=${iw} (ảnh ${iw * DPR}px vì dpr=${DPR}) · innerHeight=${ih}`);
console.log(`  scrollWidth=${sw} ${sw > iw ? '⚠️ TRÀN NGANG' : '· không tràn'} · scrollHeight=${sh}`);
