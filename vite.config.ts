import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Using a RELATIVE base ('./') means the built asset links resolve relative to
// index.html. This makes the site work no matter where it's served from —
// GitHub Pages at /Website/ or /website/, a custom domain at /, Netlify, etc. —
// and sidesteps any upper/lowercase repo-name issues. Works because the app
// uses HashRouter (only the part after # changes, never the file path).
export default defineConfig({
  base: './',
  plugins: [
    react(),
    tailwindcss(),
    // Service worker: precaches the whole app so it works offline in the gym,
    // auto-updates when a new version deploys, and gives us a registration to
    // fire rest-timer notifications through. We keep our own webmanifest.
    VitePWA({
      registerType: 'autoUpdate',
      manifest: false,
      includeAssets: ['icon.svg', 'manifest.webmanifest'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,webmanifest,woff2}'],
      },
    }),
  ],
})
