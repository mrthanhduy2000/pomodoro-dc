import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // ⚠️ `.city-preview` PHẢI có mặt ở đây, không chỉ ở `.gitignore` — ESLint KHÔNG tự đọc `.gitignore`.
  // Bẫy đã cắn thật (2026-08-13): `scripts/city-preview.mjs` gói tạm cả three.js vào
  // `.city-preview/.build/dist/preview.js` trong lúc dựng ảnh rồi mới xoá. Chạy `npm run lint` đúng
  // lúc đó thì ra **29 lỗi** (`no-undef`, `rules-of-hooks`…) — toàn bộ nằm trong RUỘT three.js, không
  // phải code của dự án. Ai không biết sẽ tưởng mình vừa làm hỏng gì đó và đi "sửa" nhầm chỗ.
  globalIgnores(['dist', '.runtime', 'backups', '.claude', '.city-preview', 'DC Pomodoro.app']),
  {
    files: ['**/*.js'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['**/*.jsx'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': 'off',
    },
  },
  {
    files: ['vite.config.js', 'electron/**/*.js', 'scripts/**/*.{js,mjs}', 'api/**/*.js', '*config.js'],
    languageOptions: {
      globals: globals.node,
    },
  },
])
