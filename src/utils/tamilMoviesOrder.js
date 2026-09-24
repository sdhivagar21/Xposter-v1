// Custom display order for the Tamil Movies collection: Vijay posters
// first, then Ajith, then everything else, with the Yuvan/"U1" posters
// pushed to the very end. Purely a display-order tweak on whatever the
// API already returned - doesn't touch the database, so it's easy to
// change or drop later.
const VIJAY = /\bvijay\b/i;
const AJITH = /\bajith\b/i;
const U1 = /\bu1\b/i;

function rank(product) {
  const name = product?.name || "";
  if (VIJAY.test(name)) return 0;
  if (AJITH.test(name)) return 1;
  if (U1.test(name)) return 3;
  return 2;
}

export function sortTamilMovies(products) {
  return [...products]
    .map((product, index) => ({ product, index, rank: rank(product) }))
    .sort((a, b) => a.rank - b.rank || a.index - b.index)
    .map((entry) => entry.product);
}
