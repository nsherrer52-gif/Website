import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// `base` must match how the site is served.
// For GitHub Pages project sites the URL is https://<user>.github.io/<repo>/
// so the base path is "/<repo>/". Change this if you deploy elsewhere
// (e.g. a custom domain or Netlify/Vercel -> use '/').
export default defineConfig({
  base: '/website/',
  plugins: [react(), tailwindcss()],
})
