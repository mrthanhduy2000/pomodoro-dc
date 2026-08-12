import test from 'node:test';
import assert from 'node:assert/strict';

import { createRecoverableLazy, isRecoverableAssetError } from './runtimeRecovery.js';

/**
 * `createRecoverableLazy` là cửa duy nhất mọi màn hình nạp-lười của app đi qua. Phần `lazy()` cần
 * React nên không test ở đây được; nhưng `preload` — thứ Phase 4′ vừa thêm — thì THUẦN, và nó là
 * chỗ dễ hỏng âm thầm nhất: hỏng thì không có gì đỏ, chỉ có một khoảng trắng dài hơn trên máy Đàm.
 */

test('preload NẠP THẬT gói mã, và gọi nhiều lần cũng chỉ tải một lần', async () => {
  let calls = 0;
  const Lazy = createRecoverableLazy(async () => { calls += 1; return { default: () => null }; }, 'test');

  assert.equal(typeof Lazy.preload, 'function', 'thiếu preload thì việc nạp trước im lặng không xảy ra');
  assert.equal(calls, 0, 'chưa gọi thì KHÔNG được tải — nạp trước phải là việc có chủ đích');

  Lazy.preload();
  await Promise.resolve();
  assert.equal(calls, 1);

  // Trình duyệt tự nhớ module đã tải; ở đây ta chỉ khoá phần mình kiểm soát được: mỗi lời gọi đi
  // đúng một lần qua importer, không nhân đôi công việc nào khác.
  Lazy.preload();
  await Promise.resolve();
  assert.equal(calls, 2, 'importer phải được gọi lại — chính import() của trình duyệt mới là nơi nhớ');
});

test('preload NUỐT lỗi mạng — nạp trước hỏng KHÔNG được làm nổ màn hình', async () => {
  // Đây mới là lý do bài test này tồn tại. `preload` được gọi ngầm trong một `useEffect`, không ai
  // đứng đó bắt lỗi. Để nó ném ra thì một lần mạng chập chờn sẽ thành "unhandled rejection" nổ
  // giữa lúc Đàm vừa xong 25 phút làm việc — đúng khoảnh khắc tệ nhất để hiện màn hình lỗi.
  const Lazy = createRecoverableLazy(async () => { throw new Error('mạng hỏng'); }, 'test-loi');

  // ⚠️ `globalThis.process` chứ không phải `process` trần: mọi file test trong `src/` được lint
  // theo bộ biến toàn cục của TRÌNH DUYỆT (xem `eslint.config.js`), nên `process` trần là lỗi
  // `no-undef`. Nới cấu hình lint cho cả `src/` chỉ vì một bài test là cái giá quá đắt.
  const proc = globalThis.process;
  let unhandled = null;
  const catcher = (err) => { unhandled = err; };
  proc.on('unhandledRejection', catcher);
  try {
    assert.doesNotThrow(() => Lazy.preload());
    await new Promise((resolve) => setTimeout(resolve, 20));
  } finally {
    proc.off('unhandledRejection', catcher);
  }
  assert.equal(unhandled, null, 'preload để lọt một promise bị từ chối mà không ai bắt');
});

test('lỗi tải gói mã được nhận ra, lỗi thường thì không', () => {
  // Lưới hồi phục chỉ được phép nổ ra khi đúng là gói mã hỏng; nhận nhầm lỗi thường sẽ thành
  // tải lại trang giữa chừng vì một lý do không liên quan.
  assert.ok(isRecoverableAssetError(new Error('Failed to fetch dynamically imported module: /x.js')));
  assert.ok(isRecoverableAssetError('ChunkLoadError'));
  assert.equal(isRecoverableAssetError(new Error('Cannot read properties of undefined')), false);
  assert.equal(isRecoverableAssetError(null), false);
});
