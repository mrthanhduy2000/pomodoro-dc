/**
 * lintConfig.test.js — canh cấu hình ESLint không lặng lẽ mất răng (`TECH_DEBT #92`).
 *
 * ⚠️ CÂU CHUYỆN ĐẰNG SAU BÀI NÀY, ghi lại vì nó suýt làm hỏng app của Đàm.
 * `no-unused-vars` từng TẮT cho MỌI file `.jsx`, nên mã chết ở tầng giao diện là vô hình. Bật lên
 * lần đầu: **54 chỗ**. Tôi tin cả 54 và đi gỡ. Kết quả:
 *   **lint sạch · build sạch · 1.524 bài test XANH · và app ra thẳng "RENDER RECOVERY: motion is
 *   not defined"**.
 * Nguyên nhân: ESLint lõi KHÔNG coi `<motion.div>` trong JSX là một lần DÙNG biến `motion`, nên
 * 27 trong 54 báo cáo ấy là BÁO NHẦM — và chúng nhắm đúng vào những import đang sống.
 * `react/jsx-uses-vars` là mắt xích thiếu. Bật `no-unused-vars` cho `.jsx` mà KHÔNG có nó thì luật
 * ấy không phải một cái gác, nó là một cái bẫy.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const CFG = readFileSync(new URL('../eslint.config.js', import.meta.url), 'utf8');
const PKG = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));

// THỬ-CHO-ĐỎ: đổi `'react/jsx-uses-vars': 'error'` thành `'off'` ⇒ bài này đỏ.
test('`no-unused-vars` cho .jsx PHẢI đi kèm `react/jsx-uses-vars`', () => {
  const batUnused = /'no-unused-vars':\s*\[\s*'error'/.test(CFG);
  const batJsxVars = /'react\/jsx-uses-vars':\s*'error'/.test(CFG);

  if (batUnused) {
    assert.ok(
      batJsxVars,
      'no-unused-vars đang BẬT cho .jsx mà KHÔNG có react/jsx-uses-vars. Lúc ấy mọi import chỉ '
      + 'dùng trong JSX (`motion`, `AnimatePresence`, mọi component) đều bị tố là chết — và gỡ '
      + 'chúng làm app trắng màn hình trong khi lint/build/test đều xanh. Đã xảy ra thật.',
    );
    assert.ok(
      PKG.devDependencies?.['eslint-plugin-react'],
      'thiếu `eslint-plugin-react` trong devDependencies ⇒ react/jsx-uses-vars không tồn tại',
    );
  }
});

// THỬ-CHO-ĐỎ: xoá dòng `'no-unused-vars': ['error'…]` ở khối .jsx ⇒ bài này đỏ.
test('mã chết ở tầng giao diện phải còn bị bắt — đừng lặng lẽ tắt lại', () => {
  const khoiJsx = CFG.slice(CFG.indexOf("files: ['**/*.jsx']"));
  assert.ok(khoiJsx.length > 200, 'không tìm thấy khối .jsx — phép đo đang chạy rỗng');
  assert.doesNotMatch(
    khoiJsx.slice(0, khoiJsx.indexOf('\n  },')), /'no-unused-vars':\s*'off'/,
    'no-unused-vars vừa bị tắt lại cho .jsx. Lần bật đầu tiên bắt ra 27 chỗ mã chết THẬT '
    + '(import không ai dùng, biến tính rồi vứt, tàn dư của khối đã xoá). Tắt là mù lại.',
  );
});
