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
];

export function getCategoryName(slug) {
  return CATEGORIES.find((c) => c.slug === slug)?.name ?? slug;
}
