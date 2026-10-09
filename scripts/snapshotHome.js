// Runs before every build: saves the homepage's catalog data (the poster wall
// + the per-category rows) into src/data/homeSnapshot.json so the homepage
// can paint real posters on the very first render instead of waiting on the
// API (which can be slow right after the backend wakes up). The page still
// refreshes from the live API right after loading, so this is only ever the
// first frame. If the API can't be reached, the previous snapshot stays.
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const API = process.env.VITE_API_BASE_URL || "https://xposters-backend.onrender.com/api";
const OUT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "src", "data", "homeSnapshot.json");

const slim = (p) => ({ id: p.id, name: p.name, category: p.category, image: p.image });

async function get(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(45000) });
  if (!res.ok) throw new Error(`${url} -> ${res.status}`);
  return res.json();
}

try {
  const [sections, featured] = await Promise.all([get(`${API}/products/sections?limit=10`), get(`${API}/products/featured`)]);
  const out = {
    sections: Object.fromEntries(Object.entries(sections).map(([k, v]) => [k, v.map(slim)])),
    featured: featured.map(slim),
  };
  if (!existsSync(path.dirname(OUT))) mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out));
  console.log("homeSnapshot.json updated");
} catch (err) {
  console.warn("homeSnapshot: keeping previous snapshot (" + err.message + ")");
}
