/**
 * previewStage.test.js — canh "bản giả không được trôi khỏi bản thật".
 *
 * `previewStage.js` dựng một `pendingReward` GIẢ để soi được màn sau phiên. Một bản giả thì theo
 * thời gian sẽ lệch khỏi bản thật, và khi lệch thì nó nói dối theo kiểu tệ nhất: màn hình dựng ra
 * THIẾU một dòng, người soi tưởng app vốn thế, rồi đi "sửa" một thứ không hỏng — hoặc tệ hơn, bỏ
 * qua một dòng đang hỏng thật.
 *
 * Nên bài này KHÔNG so bản giả với một danh sách chép tay. Nó đọc THẲNG hai file của chuỗi thẻ
 * thưởng (ADR-070: người đọc DUY NHẤT của `pendingReward` — hộp thoại chi tiết đã gỡ) để lấy đúng
 * những trường thật sự được đọc, và đọc THẲNG `gameStore.js` để lấy đúng những trường
 * `completeFocusSession` thật sự ghi ra.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { PREVIEW_SCENES, readPreviewScene, buildPreviewUi, PREVIEW_PARAM } from './previewStage.js';

const doc = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');

/**
 * Những trường mà chuỗi thẻ thưởng thật sự đọc — lấy từ chính mã nguồn của nó: bộ dựng thẻ
 * (`sessionRewardStory.js`) và component (`SessionRewardStory.jsx`, đọc thêm vài trường lúc dựng
 * đầu vào). Quên một người đọc là để bản giả thiếu đúng trường người ấy cần, trong im lặng.
 * ⚠️ Bắt cả `reward?.x` (optional chaining) — bản cũ chỉ bắt `reward.x` nên mù với component.
 */
function truongHopThoaiDoc() {
  const nguon = [
    doc('../components/sessionRewardStory.js'),
    doc('../components/SessionRewardStory.jsx'),
  ];
  const ra = new Set(nguon.flatMap((src) => [...src.matchAll(/\breward\??\.([a-zA-Z0-9_]+)/g)].map((m) => m[1])));
  assert.ok(ra.size >= 20, `mới thấy ${ra.size} trường — phép đo đang chạy rỗng`);
  return ra;
}

// THỬ-CHO-ĐỎ: xoá một trường bất kỳ khỏi PHIEN_THUONG ⇒ bài này đỏ.
test('mọi cảnh soi phải phủ ĐỦ những trường hộp thoại thật sự đọc', () => {
  const can = truongHopThoaiDoc();

  for (const [ten, patch] of Object.entries(PREVIEW_SCENES)) {
    if (!patch.pendingReward) continue;
    const thieu = [...can].filter((k) => !Object.hasOwn(patch.pendingReward, k)).sort();
    assert.deepEqual(
      thieu, [],
      `cảnh "${ten}" thiếu ${thieu.length} trường mà chuỗi thẻ thưởng đọc: ${thieu.join(', ')}.\n`
      + 'Màn soi ra sẽ THIẾU dòng, và người soi sẽ tưởng app vốn thế.',
    );
  }
});

// THỬ-CHO-ĐỎ: thêm một trường bịa vào PHIEN_THUONG ⇒ bài này đỏ.
test('bản giả không được BỊA trường mà bản thật không có', () => {
  const store = doc('../store/gameStore.js');
  const i = store.indexOf('pendingReward: {');
  assert.ok(i > 0, 'không tìm thấy pendingReward trong gameStore — phép đo đang chạy rỗng');

  // Bản thật ghép từ `...reward` (một object dựng trước đó) + các trường liệt kê tường minh.
  // Lấy CẢ HAI nguồn: khối `pendingReward: {…}` và mọi khoá của `reward`/`boostedReward`.
  const khoiReward = store.slice(i, store.indexOf('\n              },', i));
  const thatCo = new Set([...khoiReward.matchAll(/^\s{16}([a-zA-Z0-9_]+)[:,]/gm)].map((m) => m[1]));
  // Những trường đến qua `...reward` thì không nằm trong khối trên — lấy chúng từ chỗ hộp thoại
  // đọc, vì hộp thoại đọc được nghĩa là bản thật có.
  for (const k of truongHopThoaiDoc()) thatCo.add(k);
  assert.ok(thatCo.size >= 25, `mới thấy ${thatCo.size} trường thật — phép đo đang chạy rỗng`);

  for (const [ten, patch] of Object.entries(PREVIEW_SCENES)) {
    if (!patch.pendingReward) continue;
    const bia = Object.keys(patch.pendingReward).filter((k) => !thatCo.has(k)).sort();
    assert.deepEqual(
      bia, [],
      `cảnh "${ten}" bịa ${bia.length} trường bản thật KHÔNG có: ${bia.join(', ')}.\n`
      + 'Soi một trường không tồn tại là tự dựng ra một tính năng rồi đi nghiệm thu nó.',
    );
  }
});

// THỬ-CHO-ĐỎ: đổi `Object.hasOwn(...)` thành `raw` ⇒ bài này đỏ.
test('tên cảnh lạ thì trả null — KHÔNG đoán, không dựng một cảnh rỗng', () => {
  assert.equal(readPreviewScene(''), null);
  assert.equal(readPreviewScene(null), null);
  assert.equal(readPreviewScene('?x=1'), null);
  assert.equal(readPreviewScene(`?${PREVIEW_PARAM}=khong-co-that`), null);
  assert.equal(readPreviewScene(`?${PREVIEW_PARAM}=__proto__`), null, 'không được lọt qua prototype');
  assert.equal(readPreviewScene(`?${PREVIEW_PARAM}=loot`), 'loot');
  assert.equal(buildPreviewUi('khong-co-that'), null);
});

// THỬ-CHO-ĐỎ: cho một cảnh ghi thẳng vào `history` ⇒ bài này đỏ.
test('cảnh soi CHỈ được chạm `ui` — không cảnh nào chạm dữ liệu thật của Đàm', () => {
  // Đây là lời hứa an toàn cốt lõi của cả cơ chế: `ui` không nằm trong `partialize` nên nó không
  // lên Supabase và không vào localStorage. Một cảnh lỡ mang theo khoá `history`/`progress`/
  // `player` là đủ để một lần soi ghi đè dữ liệu thật.
  const CAM = ['history', 'progress', 'player', 'resources', 'achievements', 'blueprints',
    'timerSession', 'breakSession', 'streak', 'missions', 'buildings', 'prestige'];
  for (const [ten, patch] of Object.entries(PREVIEW_SCENES)) {
    for (const k of CAM) {
      assert.ok(!Object.hasOwn(patch, k), `cảnh "${ten}" chạm "${k}" — đó là dữ liệu THẬT của Đàm`);
    }
  }

  // Và gác chạy-rỗng: bảng cảnh phải thật sự có cảnh, nếu không vòng lặp trên xanh vì không chạy.
  assert.ok(Object.keys(PREVIEW_SCENES).length >= 4, 'bảng cảnh gần như rỗng — phép đo chạy rỗng');
});

// THỬ-CHO-ĐỎ: bỏ `partialize` khỏi gameStore hoặc thêm `ui:` vào nó ⇒ bài này đỏ.
test('`ui` PHẢI nằm ngoài partialize — đó là thứ làm cơ chế này an toàn', () => {
  const store = doc('../store/gameStore.js');
  const i = store.indexOf('partialize: (state) => ({');
  assert.ok(i > 0, 'không tìm thấy partialize — phép đo đang chạy rỗng');
  const khoi = store.slice(i, store.indexOf('}),', i));
  assert.doesNotMatch(
    khoi, /^\s*ui:/m,
    '`ui` vừa được đưa vào partialize ⇒ cảnh soi sẽ ghi vào localStorage và lên Supabase. '
    + 'Cả lời hứa an toàn của previewStage.js dựa vào việc nó nằm NGOÀI.',
  );
});

// THỬ-CHO-ĐỎ: đổi `buildingPerkRewards: []` thành `{}` ⇒ bài này đỏ.
test('bản giả phải đúng KIỂU, suy từ chính cách hộp thoại DÙNG trường', () => {
  /*
    ⚠️ VÌ SAO CẦN BÀI NÀY, và nó ra đời từ một lỗi thật. Bài "phủ đủ trường" ở trên chỉ kiểm SỰ CÓ
    MẶT của khoá. Lần soi ĐẦU TIÊN sau khi gỡ điểm mù, màn hình hiện ra một hộp "RENDER RECOVERY:
    (e.buildingPerkRewards ?? []).map is not a function" — bản giả khai `{}` trong khi bản thật là
    một MẢNG. Khoá có đủ, kiểu sai, và không cổng nào thấy.
    Nên bài này KHÔNG chép tay một bảng kiểu (bảng chép tay thì trôi y như bản giả). Nó đọc THẲNG
    hai file chuỗi thẻ và suy kiểu từ CÁCH DÙNG: hỏi `Array.isArray()` ⇒ phải là mảng; đi qua
    `toNumber()` ⇒ phải là số.
  */
  const src = doc('../components/sessionRewardStory.js') + doc('../components/SessionRewardStory.jsx');

  // Mảng: chuỗi thẻ hỏi `Array.isArray(reward.x)` rồi mới `.map`/`.includes` — đó là dấu vân tay.
  const canMang = new Set(
    [...src.matchAll(/Array\.isArray\(reward\??\.([a-zA-Z0-9_]+)\)/g)].map((m) => m[1]),
  );
  // Số: mọi con số đi qua `toNumber(reward.x)` trước khi lên thẻ.
  const canSo = new Set(
    [...src.matchAll(/toNumber\(reward\.([a-zA-Z0-9_]+)\)/g)].map((m) => m[1]),
  );
  assert.ok(canMang.size >= 2 && canSo.size >= 8, `phép suy kiểu không thấy gì — đang chạy rỗng (mảng ${canMang.size}, số ${canSo.size})`);

  for (const [ten, patch] of Object.entries(PREVIEW_SCENES)) {
    const r = patch.pendingReward;
    if (!r) continue;
    for (const k of canMang) {
      assert.ok(
        Array.isArray(r[k]),
        `cảnh "${ten}": "${k}" phải là MẢNG (chuỗi thẻ gọi Array.isArray lên nó) — đang là `
        + `${Object.prototype.toString.call(r[k])}. Đây đúng là lỗi đã làm màn soi đầu tiên nổ.`,
      );
    }
    for (const k of canSo) {
      assert.equal(typeof r[k], 'number', `cảnh "${ten}": "${k}" phải là SỐ (đi qua toNumber)`);
    }
  }
});
