// Runs after `vite build` + the SSR build: renders the homepage to HTML and
// writes it into dist/index.html inside <div id="root">. If anything fails the
// build still succeeds with the normal (client-rendered) index.html.
import { readFileSync, writeFileSync, rmSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import path from "path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = path.join(root, "dist", "index.html");
const ssrDir = path.join(root, "dist-ssr");

try {
  const { render } = await import(pathToFileURL(path.join(ssrDir, "entry-server.js")).href);
  const markup = render();
  const html = readFileSync(indexPath, "utf8");
  if (!html.includes('<div id="root"></div>')) throw new Error("root placeholder not found");
  writeFileSync(indexPath, html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`));
  console.log(`prerendered homepage (${markup.length} bytes)`);
} catch (err) {
  console.warn("prerender skipped:", err.message);
} finally {
  rmSync(ssrDir, { recursive: true, force: true });
}
