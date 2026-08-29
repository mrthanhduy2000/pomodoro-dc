import { execSync } from 'node:child_process';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * 7 ký tự đầu của commit đang được build — hiện ở cuối màn Cài đặt.
 *
 * ⚠️ VÌ SAO CẦN: ngày 2026-08-28 Đàm sửa rất nhiều mà "không thấy gì đổi", và phải mất một phiên
 * mới truy ra rằng mã ĐÃ lên production, chỉ là bản lưu trên máy anh giữ skin cũ. Không có cách
 * nào phân biệt "chưa lên" với "lên rồi mà không thấy" nếu màn hình không tự khai nó đang chạy
 * bản nào. Một dòng 7 ký tự đóng vĩnh viễn cả một họ nghi vấn.
 *
 * Vercel không có `.git` lúc build nên `git` sẽ ném — đó là lý do có biến môi trường đứng trước,
 * và một `catch` trả 'dev' để việc build KHÔNG BAO GIỜ đổ vì một dòng trang trí.
 */
function resolveCommitSha() {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.APP_COMMIT_SHA;
  if (fromEnv) return String(fromEnv).slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

const PORT = Number(process.env.PORT ?? 31105);
const HOST = process.env.VITE_BIND_HOST ?? '0.0.0.0';
const SHOULD_OPEN = process.env.VITE_OPEN === 'true';

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_COMMIT__: JSON.stringify(resolveCommitSha()),
  },
  server: {
    host: HOST,
    port: PORT,
    strictPort: true,
    open: SHOULD_OPEN,
  },
  preview: {
    host: HOST,
    port: PORT,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (
            id.includes('/react/')
            || id.includes('/react-dom/')
            || id.includes('/scheduler/')
          ) {
            return 'vendor-react';
          }
          if (
            id.includes('/framer-motion/')
            || id.includes('/motion-dom/')
            || id.includes('/motion-utils/')
          ) {
            return 'vendor-motion';
          }
          if (id.includes('/zustand/')) {
            return 'vendor-state';
          }
          // three.js — bộ vẽ 3D của màn hình Thành Phố (src/components/city/render3d/).
          // ⚠️ Nhánh này không chỉ để chia nhỏ chunk: nó làm cho việc LỠ TAY import tĩnh `three`
          // ở một file ngoài render3d/ TRỞ NÊN NHÌN THẤY ĐƯỢC — chunk `vendor-three` sẽ biến mất
          // khỏi output và ~130 KB rơi thẳng vào chunk chính. Có test canh luật này ở
          // src/components/cityRenderers.test.js. Xem ADR-008.
          if (id.includes('/three/')) {
            return 'vendor-three';
          }
          return undefined;
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inject service worker registration into the built index.html
      injectRegister: 'auto',

      // Files to pre-cache on install
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json', 'push-worker.js'],

      // Web App Manifest (mirrored from public/manifest.json for the plugin)
      manifest: {
        id: '/',
        name: 'DC Pomodoro',
        short_name: 'DC Pomodoro',
        description: 'Pomodoro nhập vai qua các kỷ nguyên lịch sử',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f5f3ed',
        theme_color: '#8a6a3d',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },

      // Workbox strategy: cache everything with StaleWhileRevalidate
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        importScripts: ['/push-worker.js'],
        // Pre-cache all built assets
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        // ⚠️ three.js KHÔNG được precache: globPatterns ở trên gom MỌI file .js, nên nếu không
        // loại ra thì mỗi lần mở app đều tải sẵn ~130 KB cho một tab Đàm có thể không bấm vào —
        // đúng thứ mà việc nạp lười sinh ra để tránh. Đổi lại phải có luật runtimeCaching bên
        // dưới, nếu không tab 3D sẽ không mở được khi mất mạng.
        globIgnores: ['**/vendor-three-*.js'],
        skipWaiting: true,

        // Runtime caching rules
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'dc-pomodoro-google-fonts-styles',
              expiration: {
                maxEntries: 16,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // Google Fonts binaries
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dc-pomodoro-google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
          {
            // three.js — BÙ lại cho `globIgnores` ở trên. Không precache nữa, nhưng lần đầu Đàm mở
            // tab Thành Phố thì file được giữ lại, những lần sau (kể cả khi mất mạng) dùng bản đã
            // lưu. CacheFirst hợp ở đây vì tên file có băm nội dung — đổi phiên bản là đổi tên,
            // không bao giờ phải lo bản cũ bị giữ lại nhầm. maxEntries 2 để bản cũ tự rụng.
            urlPattern: /\/assets\/vendor-three-.*\.js$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'dc-pomodoro-three',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 2,
                maxAgeSeconds: 90 * 24 * 60 * 60, // 90 days
              },
            },
          },
        ],
      },

      // Dev options — enable SW in development for easier testing
      devOptions: {
        enabled: false,  // set to true to test SW locally
        type: 'module',
      },
    }),
  ],
});
