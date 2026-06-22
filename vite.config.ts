import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Using a RELATIVE base ('./') means the built asset links resolve relative to
// index.html. This makes the site work no matter where it's served from —
// GitHub Pages at /Website/ or /website/, a custom domain at /, Netlify, etc. —
// and sidesteps any upper/lowercase repo-name issues. Works because the app
// uses HashRouter (only the part after # changes, never the file path).
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
