import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { readFileSync } from 'node:fs'

// Adds <link rel="preload"> tags at build time for what the first paint
// needs but the browser can't discover until JS/CSS has run: the two
// bundled font files and the first poster of the homepage wall (the usual
// largest-contentful-paint element). Poster URL matches optimizedImage()
// in src/utils/cloudinaryUrl.js (f_auto,q_28,w_320) so it's a cache hit.
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
          const snap = JSON.parse(readFileSync(new URL('./src/data/homeSnapshot.json', import.meta.url), 'utf8'))
          for (const p of (snap.featured || []).slice(0, 3)) {
            if (p.image && p.image.includes('/upload/')) {
              const at = (w) => p.image.replace('/upload/', `/upload/f_auto,q_28,w_${w}/`)
              // Mirrors the wall's srcset/sizes (PosterWallRow.jsx) so the browser
              // preloads the same file it will actually pick.
              tags.push({ tag: 'link', attrs: { rel: 'preload', as: 'image', href: at(320), imagesrcset: [160, 240, 320].map((w) => at(w) + ' ' + w + 'w').join(', '), imagesizes: '(min-width: 640px) 160px, 128px', fetchpriority: 'high' }, injectTo: 'head' })
            }
          }
        } catch { /* no snapshot - skip */ }
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
export default defineConfig({
  plugins: [react(), tailwindcss(), preloadCritical()],
})
