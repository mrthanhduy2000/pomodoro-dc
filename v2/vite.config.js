/**
 * Build config for the v2 rewrite (ADR-101). v2 lives at `/v2/` on the SAME deployment as v1, so
 * Đàm can try it on his real devices while v1 keeps running at `/`.
 *
 * - `base: '/v2/'` and `outDir: ../dist/v2`: the root build runs v1 first (it empties `dist/`),
 *   then this one writes into `dist/v2/` only.
 * - The v2 service worker is scoped to `/v2/` and imports the shared `/push-worker.js`. v1's
 *   service worker is told never to answer `/v2/` navigations (see `navigateFallbackDenylist`
 *   in the root `vite.config.js`), or it would serve v1's index.html there.
 * - Shares the root `node_modules` (one install on Vercel); no separate package.json.
 */
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

function commitSha() {
  const fromEnv = process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.APP_COMMIT_SHA;
  if (fromEnv) return String(fromEnv).slice(0, 7);
  try {
    return execSync('git rev-parse --short=7 HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'dev';
  }
}

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: here,
  base: '/v2/',
  publicDir: false,
  define: { __APP_COMMIT__: JSON.stringify(commitSha()) },
  server: { port: Number(process.env.PORT ?? 31120), strictPort: true, fs: { allow: ['..'] } },
  build: {
    outDir: fileURLToPath(new URL('../dist/v2', import.meta.url)),
    emptyOutDir: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      scope: '/v2/',
      manifest: {
        id: '/v2/',
        name: 'DC Pomodoro 2',
        short_name: 'Pomodoro 2',
        description: 'Mỗi phiên tập trung là một viên gạch.',
        start_url: '/v2/',
        scope: '/v2/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f5f3ed',
        theme_color: '#b5562b',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ['/push-worker.js'],
        globPatterns: ['**/*.{js,css,html,svg,png}'],
        navigateFallback: '/v2/index.html',
        navigateFallbackAllowlist: [/^\/v2\//],
      },
    }),
  ],
});
