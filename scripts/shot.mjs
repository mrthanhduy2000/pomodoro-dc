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
 *   node scripts/shot.mjs --phone --fit                     # ĐO chữ có tràn khỏi nút không
 *   node scripts/shot.mjs --phone --full --crop "@Khởi động" --out f.png   # cắt quanh một chữ
 *   node scripts/shot.mjs --full --crop "0,1860,390,300" --out g.png       # cắt theo toạ độ
 *
 * **Lời nói dối 3 — `--full` chỉ chụp MÀN HÌNH ĐẦU TIÊN** (bắt được 2026-08-13). Nó đọc
 * `document.documentElement.scrollHeight`, mà app này cuộn trong một KHUNG BÊN TRONG nên `<html>`
 * luôn cao đúng bằng màn hình. Ở khung điện thoại tab Thành Tích dài 4434px mà mọi lần chụp đều
 * chỉ ra 844px — tức **81% trang chưa từng được ai nhìn**, và dòng in ra còn ghi "scrollHeight=844"
 * nghe như khẳng định bên dưới chẳng còn gì. Nay đi tìm khung cuộn sâu nhất và in cả hai số.
 *
 * ⚠️ VÀ MỘT CÁI BẪY THỨ TƯ, HỌ KHÁC: `--fit` bản đầu báo "✓ sạch" ở 390px trong khi ảnh cho thấy
 * chữ bị xén — nó đã đo đúng **0 nút**, vì ở bề ngang đó app cần hơn 3,5 giây mới mount xong.
 * **Một phép đo có thể kết luận "sạch" từ tập RỖNG là phép đo nguy hiểm nhất**: nó trả về đúng
 * câu người đo đang mong, ở đúng lúc nó chẳng biết gì. Nay `--fit` đợi tới khi thấy ≥3 nút, in
 * ra ĐÃ SOI BAO NHIÊU nút, và thoát mã 2 nếu không thấy gì. Đã hiệu chuẩn hai đầu: bản lỗi cũ
 * (nhãn "Cần điền mục tiêu phiên", không `overflow-hidden`) → báo THỪA 25px; bản đã vá → sạch.
 *
 * **Lời nói dối 5 — `scrollWidth − clientWidth` của NÚT không phải là "chữ tràn"** (2026-08-13).
 * Nút "Pomo" bị báo THỪA 31px, nghe như một lỗi thật và suýt được ghi vào sổ nợ kỹ thuật. Thủ
 * phạm là con `motion.span` `layoutId` (`position:absolute` + transform của framer-motion): hộp
 * đã biến đổi VẪN tính vào vùng cuộn của cha, dù nó chỉ là lớp trang trí nằm ĐÈ lên và chẳng liên
 * quan gì tới chữ. Nay trừ riêng phần tràn do con out-of-flow gây ra, và IN RA dòng "bỏ qua …"
 * thay vì im lặng — bỏ mẫu mà không nói cũng là một kiểu nói dối.
 *
 * **Lời nói dối 6 — cổng "app đã mọc chưa" chỉ vá cho `--fit`, và bản thân nó cũng bị lừa hai lần
 * nữa** (cùng ngày). (a) Cổng nằm trong nhánh `--fit` nên MỌI lần chụp thường vẫn có thể ra trang
 * trắng mà báo "✓" — lộ ra khi `--crop "@Vào việc nhanh"` kêu không tìm thấy đúng chuỗi mà `--fit`
 * vừa in vài giây trước. (b) Thay bằng "đợi DOM đứng yên" thì dính bẫy ngược: `/seed` và cái vỏ
 * `index.html` là DOM TĨNH (28 phần tử, 0 nút) nên chúng "ổn định" hoàn hảo lúc React chưa chạy —
 * **điều kiện "không còn gì thay đổi" luôn đúng ở thời điểm chưa có gì**. (c) Mà chỉ đợi "≥3 nút"
 * cũng chưa đủ: cùng một bản dựng, `--fit --width 1280` chạy lần này ra "sạch", lần kia ra ba nhãn
 * bị cắt, vì bảng "Thời lượng countdown" mọc ra SAU khi đã có 3 nút. ⇒ Phải đủ CẢ HAI: có nội dung
 * (≥3 nút) RỒI mới đợi số phần tử thôi nhảy. Áp cho mọi lần chụp, không riêng `--fit`.
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
// `--click "<nhãn>"` — bấm thêm một nút SAU khi đã vào tab (lặp lại được để đi sâu nhiều cấp).
// ⚠️ Vì sao cần: nhiều màn hình chỉ hiện ra sau một cú bấm và trạng thái đó nằm trong `useState`
// của React, KHÔNG nằm trong localStorage — nên không có cách nào gieo sẵn bằng `--fixture`. Ví dụ
// tab con "Xưởng" trong Kho báu (`App.jsx` `collectionTab`). Thiếu cờ này thì mọi thứ nằm sau một
// cú bấm đều KHÔNG BAO GIỜ được soi bằng mắt — và đó đúng là chỗ lỗi hay nấp.
const CLICKS = argv.reduce((out, flag, i) => (flag === '--click' ? [...out, argv[i + 1]] : out), []);

// Giờ VN = UTC+7 ⇒ đặt đồng hồ ở UTC tương ứng để `Intl` (Asia/Ho_Chi_Minh) đọc ra giờ mong muốn.
const FAKE_EPOCH = HOUR === null ? null : Date.UTC(2026, 7, 13, (HOUR - 7 + 24) % 24, 30, 0);

/**
 * Trạng thái game để chụp.
 *
 * ⚠️ MẶC ĐỊNH LÀ MỘT TÀI KHOẢN GẦN NHƯ RỖNG — cố tình giữ để chụp nhanh, NHƯNG nó là màn hình của
 * NGÀY ĐẦU TIÊN, không phải màn hình Đàm đang dùng. Muốn soi đúng thứ Đàm thấy thì phải truyền
 * `--fixture` (sinh bằng
 * `node --import ./scripts/register-esm-loader.mjs scripts/make-fixture.mjs --out fixture.json`).
 * Kết luận "đẹp/chán/tràn" rút ra từ bản mặc định gần như luôn sai, vì phần lớn màn hình chỉ lộ
 * khuyết điểm khi có nhiều dữ liệu.
 */
const FIXTURE = arg('--fixture', null);
const GAME = FIXTURE ? JSON.parse(readFileSync(FIXTURE, 'utf8')) : {
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

// ⚠️ CỔNG "APP ĐÃ MỌC RA CHƯA" — ÁP CHO MỌI LẦN CHỤP, không riêng `--fit`.
//
// Ban đầu cổng này chỉ nằm trong nhánh `--fit`, và đó là một chỗ vá nửa vời: `SETTLE` mặc định
// 3,5 giây, mà ở khung 390px app cần LÂU HƠN thế mới mount xong. Nghĩa là mọi lần chụp thường ở
// khung điện thoại đều có thể ra một trang gần như TRẮNG mà vẫn báo "✓" — đúng họ với ba lời nói
// dối ở đầu file. Bắt được đúng như vậy khi `--crop "@Vào việc nhanh"` kêu không tìm thấy chữ mà
// chính `--fit` vừa in ra vài giây trước.
//
// ⚠️ VÀ CỔNG PHẢI ĐỢI "ĐỨNG YÊN", KHÔNG PHẢI "CÓ VÀI NÚT". Bản đầu chỉ chờ ≥3 nút rồi đo ngay,
// và đúng nó cắn lần nữa: cùng một bản dựng, cùng một lệnh `--fit --width 1280`, chạy lần này ra
// "sạch" lần kia ra ba nhãn bị cắt — vì bảng "Thời lượng countdown" mọc ra SAU khi đã có 3 nút.
// Một phép đo mà kết quả đổi theo may rủi thì lời "sạch" của nó chẳng có nghĩa gì. Nay đợi tới khi
// TỔNG SỐ PHẦN TỬ không đổi qua 2 nhịp liên tiếp (trần ~20 giây), rồi mới đo.
// ⚠️ VÀ "ĐỨNG YÊN" MỘT MÌNH THÌ CŨNG BỊ LỪA — phải kèm ĐIỀU KIỆN CÓ NỘI DUNG. Bản chỉ-đợi-đứng-yên
// vừa dính bẫy ngay lần chạy đầu: trang `/seed` và cái vỏ `index.html` đều là DOM TĨNH (28 phần
// tử, 0 nút), nên nó "ổn định" hoàn hảo trong lúc React còn chưa chạy, và cổng mở toang. Một điều
// kiện "không có gì thay đổi nữa" luôn được thoả ở thời điểm CHƯA CÓ GÌ. Nên: đợi ≥3 nút TRƯỚC
// (có nội dung), rồi mới đợi số phần tử thôi nhảy (đã dựng xong), rồi mới đo.
const BTN_SEL = 'button, a[role="button"], [role="tab"]';
const countButtons = () => evaluate(`String(document.querySelectorAll(${JSON.stringify(BTN_SEL)}).length)`)
  .then(Number);
const waitForSteadyDom = async () => {
  let n = 0;
  for (let i = 0; i < 40 && n < 3; i += 1) {
    n = await countButtons();
    if (n < 3) await sleep(500);
  }
  if (n < 3) return { buttons: n, total: 0 };
  let last = -1, stable = 0, count = 0;
  for (let i = 0; i < 40 && stable < 2; i += 1) {
    count = Number(await evaluate('String(document.querySelectorAll("*").length)'));
    stable = count === last ? stable + 1 : 0;
    last = count;
    if (stable < 2) await sleep(500);
  }
  return { buttons: await countButtons(), total: count };
};
{
  const { buttons, total } = await waitForSteadyDom();
  if (buttons < 3) {
    console.error(`✗ CHỈ THẤY ${buttons} nút sau ~20 giây (tổng ${total} phần tử)`
      + ' — app chưa mọc ra, phép đo này vô nghĩa.');
    ws.close(); chrome.kill(); server.close();
    process.exit(2);
  }
}

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

for (const label of CLICKS) {
  const ok = await evaluate(`(function(){
    var want=${JSON.stringify(label)}, hit=null;
    document.querySelectorAll('button,a,[role="tab"]').forEach(function(el){
      if(hit) return;
      if((el.textContent||'').replace(/\\s+/g,' ').trim()===want) hit=el;
    });
    if(hit){ hit.click(); return true; }
    return false;
  })()`);
  if (!ok) {
    // Hỏng TO chứ không âm thầm giao một tấm ảnh của màn hình khác — cùng lý do với nhánh tab.
    const seen = await evaluate(`JSON.stringify(Array.from(document.querySelectorAll('button,a,[role="tab"]'))
      .map(function(e){return (e.textContent||'').replace(/\\s+/g,' ').trim();})
      .filter(function(t){return t && t.length<24;}).slice(0,30))`);
    console.error(`✗ KHÔNG tìm thấy nút "${label}" để bấm. Các nhãn đang có: ${seen}`);
    ws.close(); chrome.kill(); server.close();
    process.exit(1);
  }
  await sleep(1200);
}

// LUÔN in bề ngang thật: mọi kết luận về bố cục phải dựa trên số này, không phải cỡ ảnh.
//
// ⚠️ **`document.documentElement.scrollHeight` KHÔNG PHẢI CHIỀU DÀI TRANG TRONG APP NÀY** (lời nói
// dối thứ 3 của công cụ chụp, bắt được 2026-08-13). App cuộn trong một KHUNG BÊN TRONG (khung nội
// dung có `overflow:auto`), nên `<html>` luôn cao đúng bằng màn hình. Hệ quả: `--full` đọc ra 844
// rồi chụp đúng 844 — tức **chỉ chụp màn hình ĐẦU TIÊN của mỗi tab**, và còn in ra dòng
// "scrollHeight=844" nghe như một lời khẳng định rằng bên dưới chẳng còn gì. Mọi lần soi giao diện
// điện thoại bằng `--full` trước hôm nay đều có thể đã **không hề nhìn thấy phần dưới trang**.
//
// Cách vá: đi tìm phần tử cuộn SÂU NHẤT thật sự (cao hơn khung chứa nó ≥ 40px), rồi lấy chiều dài
// của chính nó. Không có thì mới rơi về `documentElement` như cũ.
const info = await evaluate(`(function(){
  var best = null;
  var all = document.querySelectorAll('*');
  for (var i = 0; i < all.length; i++) {
    var el = all[i];
    if (el.scrollHeight - el.clientHeight < 40) continue;
    var ov = getComputedStyle(el).overflowY;
    if (ov !== 'auto' && ov !== 'scroll') continue;
    if (!best || el.scrollHeight > best.scrollHeight) best = el;
  }
  var doc = document.documentElement;
  return JSON.stringify({
    iw: window.innerWidth, ih: window.innerHeight,
    sw: doc.scrollWidth,
    sh: doc.scrollHeight,
    innerSh: best ? best.scrollHeight : null,
    innerTag: best ? (best.tagName.toLowerCase() + (best.className ? '.' + String(best.className).split(' ')[0] : '')) : null
  });
})()`);
const { iw, ih, sw, sh, innerSh, innerTag } = JSON.parse(info);
// Chiều dài THẬT để chụp trọn trang = cái nào dài hơn giữa tài liệu và khung cuộn bên trong.
const fullH = Math.max(sh, innerSh ?? 0);

// ─── `--fit` — ĐO CHỮ CÓ TRÀN RA NGOÀI NÚT KHÔNG, bằng số ────────────────────────────────────
//
// ⚠️ Vì sao ở ĐÂY chứ không phải một script riêng: cả phần dựng bên trên (chặn Supabase, bề ngang
// THẬT bằng `setDeviceMetricsOverride`, đợi bằng thời gian thật cho rAF chạy, gieo `--fixture`,
// bấm `--click`) là thứ khó và đã được kiểm chứng. Chép nó sang một file đo riêng là nhân đôi đúng
// phần dễ sai nhất — và bản chép sẽ trôi khỏi bản gốc đúng như tài liệu quy tắc đã cấm.
//
// ⚠️ `whitespace-nowrap` HỨA chữ không xuống dòng, KHÔNG hứa chữ vừa. Thiếu `overflow-hidden` thì
// phần thừa tràn ra NGOÀI nút — và vì chữ căn giữa nên nó bị xén CẢ HAI ĐẦU, trông y hệt một lỗi
// phông chữ. Con số cần nhìn là `scrollWidth` so với `clientWidth`.
//
// ⚠️ Và `scrollWidth` của CHÍNH nút vẫn CHƯA ĐỦ: nếu nút bị một tổ tiên `overflow:hidden` xén thì
// nút vẫn "vừa với chính nó" trong khi chữ đã mất trên màn hình — đúng ca đã gặp ở nút "Bắt đầu
// phiên". Nên phải tính thêm vùng NHÌN THẤY được: giao của nút với mọi khung cắt phía trên nó.
//
// ⚠️ NẰM TRONG BĂNG CUỘN NGANG THÌ KHÔNG PHẢI BỊ XÉN — chỉ là chưa cuộn tới. Bản trước gộp
// `overflow-x: auto`/`scroll` chung với `hidden`/`clip`, và báo 5 nút của thanh chuyển kỷ ở tab
// Thành Phố "BỊ XÉN MẤT 704px" cộng 2 nút của dải tab Thống kê. Bảy báo động, KHÔNG cái nào có
// thật — mà đó đúng là thứ dạy người đọc bỏ qua cảnh báo. `hidden`/`clip` mới là mất thật (Đàm
// không có cách nào lấy lại); `auto`/`scroll` thì vuốt một cái là thấy.
//
// ⚠️ MỌI CHÚ THÍCH VỀ ĐOẠN MÃ TRÌNH DUYỆT PHẢI NẰM Ở ĐÂY, NGOÀI chuỗi. Dự án này viết chú thích có
// dấu ` bao quanh tên thuộc tính; đặt một chú thích như vậy vào TRONG template literal thì chính
// dấu ` đó đóng chuỗi sớm và cả file hỏng cú pháp. ⚠️ ĐÃ TÁI PHẠM ĐÚNG LỖI NÀY hôm 2026-08-13 dù
// dòng cảnh báo đang nằm ngay đây — nên: viết chú thích XONG rồi mới dán vào file, và luôn chạy
// thử một lệnh `--fit` sau khi sửa khối này.
if (has('--fit')) {
  // ⚠️ ĐỢI APP MỌC RA ĐÃ, RỒI MỚI ĐO — và nếu không thấy gì thì phải HỎNG TO.
  //
  // Bản đầu của cờ này báo "✓ không nút nào tràn" ở khung điện thoại trong khi ảnh chụp cho thấy
  // chữ bị xén rành rành. Nó không nói dối về độ tràn: nó đã đo đúng **0 nút**. Ở 390px app cần
  // hơn 3,5 giây mới mount xong, mà nhánh này chạy ngay sau `SETTLE` nên trang còn trắng. Một phép
  // đo có thể KẾT LUẬN "sạch" từ một tập RỖNG là phép đo nguy hiểm nhất — nó cho ra đúng câu trả
  // lời mà người đo đang mong, ở đúng lúc nó chẳng biết gì.
  const { buttons: n } = await waitForSteadyDom();
  if (n < 3) {
    console.error(`✗ CHỈ THẤY ${n} nút — app chưa mọc ra, phép đo này vô nghĩa.`);
    ws.close(); chrome.kill(); server.close();
    process.exit(2);
  }
  // `--el "<chữ>"` — mổ xẻ MỘT phần tử: hình học + đúng những thuộc tính CSS hay đánh nhau.
  // ⚠️ Vì sao cần: khi `--fit` báo tràn mà mắt lại thấy chữ đủ, thủ phạm gần như luôn là hai lớp
  // tiện ích Tailwind cùng khai một thuộc tính (ví dụ `px-7` của khuôn nút gặp `px-2.5` truyền
  // thêm) — lớp nào thắng KHÔNG do thứ tự viết trong `className` mà do thứ tự trong bảng kiểu.
  // Đoán mò chỗ này rất tốn thời gian; hỏi thẳng trình duyệt thì mất một giây.
  const EL = arg('--el', null);
  if (EL) {
    const info = await evaluate(`(function(){
      var want = ${JSON.stringify(EL)}, hit = null;
      document.querySelectorAll('*').forEach(function(el){
        if (hit) return;
        if ((el.textContent||'').replace(/\\s+/g,' ').trim() === want) hit = el;
      });
      if (!hit) return '';
      var cs = getComputedStyle(hit), r = hit.getBoundingClientRect();
      return JSON.stringify({
        tag: hit.tagName.toLowerCase(), cls: String(hit.className || '').slice(0, 220),
        offsetW: hit.offsetWidth, clientW: hit.clientWidth, scrollW: hit.scrollWidth,
        rectW: Math.round(r.width), rectL: Math.round(r.left), rectR: Math.round(r.right),
        fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily.slice(0, 60),
        padL: cs.paddingLeft, padR: cs.paddingRight, overflow: cs.overflow,
        textOverflow: cs.textOverflow, whiteSpace: cs.whiteSpace, display: cs.display,
      }, null, 1);
    })()`);
    console.log(info || `✗ không có phần tử nào mang đúng chữ "${EL}"`);
    ws.close(); chrome.kill(); server.close();
    process.exit(info ? 0 : 1);
  }
  const raw = await evaluate(`(function(){
    var vw = window.innerWidth, bad = [], skipped = [];
    document.querySelectorAll('button, a[role="button"], [role="tab"]').forEach(function(b){
      var r = b.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      var over = b.scrollWidth - b.clientWidth;
      var outLeft = r.left < -0.5, outRight = r.right > vw + 0.5;
      // ⚠️ BỎ QUA NÚT KHÔNG NHÌN THẤY. Bố cục co giãn dựng SẴN cả bản máy bàn lẫn bản điện thoại
      // rồi ẩn bớt một bản; đo cả hai thì bản đang bị ẩn (dàn ở bề ngang khác) sẽ báo tràn trong
      // khi Đàm chẳng thấy gì. Một cảnh báo về thứ vô hình còn tệ hơn không cảnh báo: nó dạy người
      // đọc bỏ qua cảnh báo.
      var cs2 = getComputedStyle(b);
      if (cs2.visibility === 'hidden' || cs2.display === 'none' || parseFloat(cs2.opacity) < 0.05) return;
      var hidden = false, q = b;
      while (q && q !== document.body) {
        var qs = getComputedStyle(q);
        if (qs.display === 'none' || qs.visibility === 'hidden' || parseFloat(qs.opacity) < 0.05) { hidden = true; break; }
        q = q.parentElement;
      }
      if (hidden) return;
      var clipL = 0, clipR = vw, p = b.parentElement, inScroller = false, why = [];
      while (p && p !== document.documentElement) {
        var ov = getComputedStyle(p).overflowX;
        if (ov !== 'visible') why.push(p.tagName.toLowerCase() + '[' + ov + ' ' + p.scrollWidth + '/' + p.clientWidth + ']');
        if (ov === 'auto' || ov === 'scroll') {
          if (p.scrollWidth - p.clientWidth > 1) inScroller = true;
        } else if (ov === 'hidden' || ov === 'clip') {
          var pr = p.getBoundingClientRect();
          if (pr.left > clipL) clipL = pr.left;
          if (pr.right < clipR) clipR = pr.right;
        }
        p = p.parentElement;
      }
      var lost = Math.max(0, clipL - r.left) + Math.max(0, r.right - clipR);
      // Nằm trong băng cuộn ngang thì không phải bị xén — xem giải thích ở khối chú thích phía
      // trên (chú thích có dấu huyền bao quanh tên thuộc tính KHÔNG được đặt trong chuỗi này).
      if (inScroller) { lost = 0; outLeft = false; outRight = false; }
      var bw = parseFloat(cs2.borderLeftWidth) || 0, bwr = parseFloat(cs2.borderRightWidth) || 0;
      var padL = r.left + bw, padR = r.right - bwr, deco = 0, decoWho = '';
      for (var ci = 0; ci < b.children.length; ci += 1) {
        var kid = b.children[ci], ks = getComputedStyle(kid);
        if (ks.position !== 'absolute' && ks.position !== 'fixed') continue;
        var kr = kid.getBoundingClientRect();
        var d = Math.max(0, padL - kr.left) + Math.max(0, kr.right - padR);
        if (d > deco) { deco = d; decoWho = kid.tagName.toLowerCase() + '.' + String(kid.className || '').split(' ')[0]; }
      }
      var textOver = over - deco;
      if (textOver > 1 || outLeft || outRight || lost > 1) bad.push({
        txt: (b.textContent||'').replace(/\\s+/g,' ').trim().slice(0,42),
        w: b.offsetWidth, avail: b.clientWidth, need: b.scrollWidth,
        over: Math.round(textOver), l: Math.round(r.left), rr: Math.round(r.right),
        lost: Math.round(lost), why: why.slice(0, 4).join(' < '),
      });
      if (textOver <= 1 && deco > 1) skipped.push({
        txt: (b.textContent||'').replace(/\\s+/g,' ').trim().slice(0,42),
        deco: Math.round(deco), who: decoWho.slice(0, 28),
      });
    });
    var cut = [];
    document.querySelectorAll('*').forEach(function(el){
      var cs = getComputedStyle(el);
      if (cs.textOverflow !== 'ellipsis') return;
      if (el.scrollWidth - el.clientWidth <= 1) return;
      if (el.clientWidth === 0) return;
      var vis = true, q = el;
      while (q && q !== document.body) {
        var qs = getComputedStyle(q);
        if (qs.display === 'none' || qs.visibility === 'hidden' || parseFloat(qs.opacity) < 0.05) { vis = false; break; }
        q = q.parentElement;
      }
      if (!vis) return;
      var t = (el.textContent || '').replace(/\\s+/g,' ').trim();
      if (!t) return;
      cut.push({ txt: t.slice(0, 46), have: el.clientWidth, need: el.scrollWidth,
                 hid: Math.round(el.scrollWidth - el.clientWidth), chars: t.length });
    });
    return JSON.stringify({ vw: vw, bad: bad, skipped: skipped, cut: cut });
  })()`);
  const fit = JSON.parse(raw);
  // Nói ra thứ đã CỐ Ý bỏ qua. Một phép đo im lặng bỏ bớt mẫu thì không khác gì phép đo nói dối.
  for (const s of fit.skipped ?? []) {
    console.log(`· bỏ qua "${s.txt}" — ${s.deco}px tràn là của lớp trang trí đè lên (${s.who}), không phải chữ`);
  }
  // ⚠️ Chữ bị CẮT BẰNG DẤU … là một SỰ THẬT, không phải một LỖI — `truncate` nhiều khi đúng ý
  // (tên ghi chú do Đàm tự gõ, dài bao nhiêu cũng được). Nên phần này chỉ BÁO, không tính là
  // hỏng, không đổi mã thoát. Nhưng nó phải được báo: `--fit` cũ im lặng hoàn toàn ở đây, nên
  // nhãn cố định trong mã như "Vào việc nhanh" bị cắt thành "Vào việc …" mà không phép đo nào hé
  // một lời. Người đọc tự phân biệt: chữ NGẮN và nằm trong mã ⇒ đáng sửa.
  for (const c of fit.cut ?? []) {
    console.log(`… "${c.txt}" bị cắt — chỗ có ${c.have}px, chữ cần ${c.need}px (giấu mất ${c.hid}px`
      + `${c.chars <= 24 ? ', nhãn NGẮN → nhiều khả năng là lỗi bố cục' : ''})`);
  }
  if (!fit.bad.length) {
    console.log(`✓ ${fit.vw}px: soi ${n} nút, không nút nào có chữ tràn hoặc bị xén`);
  } else {
    for (const b of fit.bad) {
      console.log(`✗ "${b.txt}" · khung chữ ${b.avail}px · nội dung cần ${b.need}px`
        + (b.over > 0 ? ` → THỪA ${b.over}px` : '')
        + (b.lost > 0 ? ` · BỊ XÉN MẤT ${b.lost}px` : '')
        + (b.l < -0.5 || b.rr > fit.vw + 0.5 ? ` · lòi khỏi màn hình ${b.l}→${b.rr}` : '')
        + (b.why ? `\n    tổ tiên chặn: ${b.why}` : '\n    tổ tiên chặn: KHÔNG CÓ'));
    }
  }
  ws.close(); chrome.kill(); server.close();
  process.exit(fit.bad.length ? 1 : 0);
}

let clip;
if (FULL) {
  // ⚠️ Phải nới CHIỀU CAO KHUNG NHÌN tới `fullH` chứ không chỉ nới vùng cắt: khung cuộn bên trong
  // cao đúng bằng khung nhìn, nên khung nhìn không cao lên thì nội dung vẫn bị cắt y như cũ và
  // tấm ảnh chỉ dài ra bằng khoảng trắng.
  const h = Math.min(fullH, 20000);
  await cdp('Emulation.setDeviceMetricsOverride', {
    width: WIDTH, height: h, deviceScaleFactor: DPR, mobile: PHONE,
  });
  await sleep(900);
  // Đo LẠI sau khi nới — bố cục co giãn có thể đổi chiều dài (thẻ xếp lại, ảnh nạp thêm).
  const after = await evaluate('String(Math.max(document.documentElement.scrollHeight, '
    + 'document.body ? document.body.scrollHeight : 0))');
  clip = { x: 0, y: 0, width: iw, height: Math.min(Math.max(h, Number(after) || 0), 20000), scale: 1 };
}

// `--crop "x,y,w,h"` — cắt lấy đúng một vùng (toạ độ CSS px, gốc là đầu trang).
// ⚠️ Muốn cắt vùng nằm DƯỚI màn hình đầu thì phải kèm `--full`: không có `--full` thì khung nhìn
// vẫn chỉ cao bằng màn hình và vùng bên dưới đơn giản là chưa được vẽ ra để mà cắt.
// Dạng `@<chữ trong màn hình>` thì tự tìm phần tử mang đúng chữ đó rồi cắt quanh nó (đệm 40px) —
// khỏi phải đoán toạ độ rồi chụp đi chụp lại. Không tìm thấy thì HỎNG TO, không lặng lẽ chụp cả
// trang: một tấm ảnh sai vùng mà vẫn "thành công" chính là kiểu nói dối cả file này sinh ra để chặn.
const CROP = arg('--crop', null);
if (CROP) {
  let box;
  if (CROP.startsWith('@')) {
    const raw2 = await evaluate(`(function(){
      var want = ${JSON.stringify(CROP.slice(1))}, hit = null;
      document.querySelectorAll('*').forEach(function(el){
        if (hit) return;
        if ((el.textContent||'').replace(/\\s+/g,' ').trim() === want) hit = el;
      });
      if (!hit) return '';
      var r = hit.getBoundingClientRect(), pad = 40;
      return JSON.stringify({ x: Math.max(0, r.left - pad), y: Math.max(0, r.top - pad),
                              w: r.width + pad * 2, h: r.height + pad * 2 });
    })()`);
    if (!raw2) {
      console.error(`✗ --crop "${CROP}": không có phần tử nào mang đúng chữ đó trên màn hình này.`);
      ws.close(); chrome.kill(); server.close();
      process.exit(1);
    }
    const b = JSON.parse(raw2);
    box = [b.x, b.y, b.w, b.h];
  } else {
    box = CROP.split(',').map(Number);
    if (box.length !== 4 || box.some((v) => !Number.isFinite(v))) {
      console.error(`✗ --crop cần 4 số "x,y,w,h" hoặc dạng "@chữ", nhận được "${CROP}"`);
      ws.close(); chrome.kill(); server.close();
      process.exit(1);
    }
  }
  clip = { x: box[0], y: box[1], width: box[2], height: box[3], scale: 1 };
  console.log(`  cắt vùng x=${Math.round(box[0])} y=${Math.round(box[1])} w=${Math.round(box[2])} h=${Math.round(box[3])}`);
}

const shot = await cdp('Page.captureScreenshot', { format: 'png', ...(clip ? { clip } : {}) });
writeFileSync(OUT, Buffer.from(shot.data, 'base64'));

ws.close();
chrome.kill();
server.close();

console.log(`✓ ${OUT}`);
console.log(`  bề ngang THẬT innerWidth=${iw} (ảnh ${iw * DPR}px vì dpr=${DPR}) · innerHeight=${ih}`);
console.log(`  scrollWidth=${sw} ${sw > iw ? '⚠️ TRÀN NGANG' : '· không tràn'} · scrollHeight=${sh}`
  + (innerSh ? ` · khung cuộn TRONG <${innerTag}> cao ${innerSh} (đây mới là chiều dài trang thật)` : ''));
