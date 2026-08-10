import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // Yangilanish so'rash (Update prompt)
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Turkcha Lug\'at',
        short_name: 'Turkcha',
        description: 'Offline Turk Tili Lug\'ati',
        theme_color: '#1a1f2b',
        background_color: '#12151e',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Barcha audiolarni asxinxron keshga oladi
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'], // asosiy fayllar precache
        runtimeCaching: [
          {
            urlPattern: /^\/audio\/.*\.mp3$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'turk-audio-cache',
              expiration: {
                maxEntries: 6000, // 5824 ta so'z
                maxAgeSeconds: 365 * 24 * 60 * 60 // 1 yil
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
})
