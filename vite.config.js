import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

// Adds <link rel="preload"> tags at build time for what the first paint
// needs but the browser can't discover until JS/CSS has run: the two
// bundled font files and the first wall pictures of the homepage hero.
function preloadCritical() {
  return {
    name: 'preload-critical',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const tags = []
        for (const file of Object.keys(ctx.bundle || {})) {
          if (/(inter-latin-wght|anton-latin-400)-normal-.*\.woff2$/.test(file)) {
            tags.push({ tag: 'link', attrs: { rel: 'preload', as: 'font', type: 'font/woff2', href: '/' + file, crossorigin: '' }, injectTo: 'head-prepend' })
          }
        }
        try {
          // First wall pictures in the homepage hero's top row (the usual
          // largest-contentful-paint element). Mirrors the tiles' srcset/sizes.
          const walls = JSON.parse(readFileSync(new URL('./src/data/wallSetups.json', import.meta.url), 'utf8')).setups
          for (const w of walls.filter((_, i) => i % 2 === 0).slice(0, 2)) {
            const at = (n) => `/walls/${w.slug}-${n}.webp`
            tags.push({ tag: 'link', attrs: { rel: 'preload', as: 'image', href: at(300), imagesrcset: `${at(300)} 300w, ${at(480)} 480w`, imagesizes: '(min-width: 640px) 224px, 160px', fetchpriority: 'high' }, injectTo: 'head' })
          }
        } catch { /* no wall data - skip */ }
        // Inline the (small) stylesheet so the first paint isn't waiting on a
        // separate render-blocking request.
        const cssFile = Object.keys(ctx.bundle || {}).find((f) => f.endsWith('.css'))
        if (cssFile && ctx.bundle[cssFile].source) {
          const css = String(ctx.bundle[cssFile].source)
          html = html.replace(new RegExp('<link rel="stylesheet"[^>]*href="/' + cssFile.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>'), () => '<style>' + css + '</style>')
          ctx.__inlined = true
        }
        return { html, tags }
      },
    },
  }
}

// https://vite.dev/config/
// Local testing against the LIVE backend (test-locally.bat sets XP_LIVE_API):
// the dev server forwards /api to the live backend on Vercel, so any free port works and the
// backend's CORS list never comes into play. Dev-only - builds ignore it.
const liveApiProxy = process.env.XP_LIVE_API
  ? {
      '/api': {
        target: 'https://xposters-backend.vercel.app',
        changeOrigin: true,
        secure: true,
        configure: (proxy) => proxy.on('proxyReq', (req) => req.removeHeader('origin')),
      },
    }
  : undefined

export default defineConfig({
  plugins: [react(), tailwindcss(), preloadCritical()],
  server: liveApiProxy ? { proxy: liveApiProxy } : {},
})
