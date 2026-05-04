import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const PORT = Number(process.env.PORT ?? 31105);
const HOST = process.env.VITE_BIND_HOST ?? '0.0.0.0';
const SHOULD_OPEN = process.env.VITE_OPEN === 'true';

// https://vite.dev/config/
export default defineConfig({
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
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Inject service worker registration into the built index.html
      injectRegister: 'auto',

      // Files to pre-cache on install
      includeAssets: ['favicon.svg', 'icon.svg', 'icon-192.png', 'icon-512.png', 'manifest.json'],

      // Web App Manifest (mirrored from public/manifest.json for the plugin)
      manifest: {
        name: 'DC Pomodoro',
        short_name: 'DC Pomodoro',
        description: 'Pomodoro nhập vai qua các kỷ nguyên lịch sử',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#020617',
        theme_color: '#6366f1',
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
        // Pre-cache all built assets
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff,woff2}'],
        skipWaiting: true,

        // Runtime caching rules
        runtimeCaching: [
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'civjourney-google-fonts-styles',
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
              cacheName: 'civjourney-google-fonts-webfonts',
              cacheableResponse: {
                statuses: [0, 200],
              },
              expiration: {
                maxEntries: 32,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
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
