import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        secure: false,
      },
    },
  },
  build: {
    // ✅ Code splitting — vendor chunks for caching
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'redux-vendor': ['react-redux', '@reduxjs/toolkit', 'redux-persist'],
          'swiper': ['swiper'],
          'recharts': ['recharts'],
        },
      },
    },
    // ✅ Target modern browsers for smaller output
    target: 'es2020',
    // ✅ CSS code splitting — only load CSS when its chunk loads
    cssCodeSplit: true,
    // ✅ Reduce chunk size warning
    chunkSizeWarningLimit: 600,
  },
  plugins: [
    react(),
    // 👇 PWA CONFIGURATION (Manual Mode) 👇
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      devOptions: {
        enabled: true
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webp}'],
        // ✅ Runtime caching for API and external images
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/wsrv\.nl\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-proxy-cache',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
          {
            urlPattern: /^https:\/\/.*supabase.*\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      // ⚠️ IMPORTANT: Manifest false kiya kyunki humne khud file banayi hai
      manifest: false
    })
  ],
});