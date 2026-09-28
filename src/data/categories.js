export const CATEGORIES = [
  { slug: "tamil-movies", name: "Tamil Movies" },
  { slug: "english-movies", name: "English Movies" },
  { slug: "cars-bikes", name: "Cars & Bikes" },
  { slug: "marvel-dc", name: "Marvel & DC" },
  { slug: "anime", name: "Anime" },
  { slug: "cartoon", name: "Cartoon" },
  { slug: "motivational", name: "Motivational" },
  { slug: "sports", name: "Sports" },
  { slug: "split-posters", name: "Split Posters" },
  { slug: "customizable-posters", name: "Customizable Posters" },
];

export function getCategoryName(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}

// Print sizes available for every poster, including customizable ones. Same
// fixed price per size across the whole catalog - a single source of truth
// here rather than per-product. Must stay in sync with the backend's
// src/data/categories.js.
export const SIZES = [
  { slug: "a5", label: "A5", dimensions: '5.8" x 8.3"', price: 199 },
  { slug: "a4", label: "A4", dimensions: '8.3" x 11.7"', price: 299 },
  { slug: "a3", label: "A3", dimensions: '11.7" x 16.5"', price: 449 },
  { slug: "13x19", label: '13" x 19"', dimensions: '13" x 19"', price: 599 },
];

export function getSizeBySlug(slug) {
  return SIZES.find((s) => s.slug === slug) || null;
}
