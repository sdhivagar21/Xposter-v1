// Scans public/images/<category>/ folders and writes a manifest JSON
// mapping category slug -> list of image filenames found there.
// Runs automatically before `dev` and `build` (see package.json "pre" scripts).
// Re-run manually with `npm run manifest` after dropping in new photos.

import { readdirSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_ROOT = path.join(__dirname, "..", "public", "images");
const OUTPUT_PATH = path.join(__dirname, "..", "src", "data", "imageManifest.json");

const CATEGORIES = [
  "tamil-movies",
  "english-movies",
  "cars-bikes",
  "marvel-dc",
  "anime",
  "cartoon",
  "motivational",
];

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

function scanCategory(slug) {
  const dir = path.join(IMAGES_ROOT, slug);
  if (!existsSync(dir)) return [];

  return readdirSync(dir)
    .filter((file) => IMAGE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort();
}

function main() {
  const manifest = {};
  for (const slug of CATEGORIES) {
    manifest[slug] = scanCategory(slug);
  }

  mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  writeFileSync(OUTPUT_PATH, JSON.stringify(manifest, null, 2) + "\n");

  const total = Object.values(manifest).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`[manifest] wrote ${OUTPUT_PATH} — ${total} image(s) across ${CATEGORIES.length} categories`);
}

main();
