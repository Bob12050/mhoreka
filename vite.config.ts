import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/mhoreka/',
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      workbox: {
        // ネットワーク優先の精神を踏襲: 全リクエストをネットワーク優先で処理し、
        // オフライン時はプリキャッシュにフォールバック。
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.origin === self.location.origin,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'mhoreka-runtime',
              expiration: { maxEntries: 60 },
            },
          },
        ],
      },
      manifest: {
        name: 'モホレカ - Mhoreka',
        short_name: 'モホレカ',
        description:
          'スマホで手軽に遊べるモンハンNow風の位置ゲーム（GPS不要のゲーム内マップ版）',
        start_url: './index.html',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1b2330',
        theme_color: '#1b2330',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
