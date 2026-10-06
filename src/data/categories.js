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
  { slug: "a5", label: "A5", dimensions: '5.8" x 8.3"', price: 60 },
  { slug: "a4", label: "A4", dimensions: '8.3" x 11.7"', price: 95 },
  { slug: "a3", label: "A3", dimensions: '11.7" x 16.5"', price: 130 },
];

export function getSizeBySlug(slug) {
  return SIZES.find((s) => s.slug === slug) || null;
}

// Buy 3 or more posters in one order and this percentage comes off the raw
// subtotal automatically - a bundle deal to encourage bigger carts. The
// backend has its own copy of these same numbers (src/data/categories.js)
// and is what actually computes and charges the discount when an order is
// placed; this copy exists purely so the cart/checkout UI can preview it
// live, before the order is even submitted.
export const BULK_DISCOUNT = { minQty: 3, percent: 23.08 };

// items - cart items, each with `qty` and `price`. Returns the raw
// (pre-discount) subtotal plus everything the cart/checkout UI needs to
// show the bundle discount and nudge shoppers toward it.
export function computeCartTotals(items) {
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const discountEligible = totalQty >= BULK_DISCOUNT.minQty;
  const discountAmount = discountEligible ? Math.round(subtotal * (BULK_DISCOUNT.percent / 100)) : 0;

  return {
    totalQty,
    subtotal,
    discountEligible,
    discountPercent: discountEligible ? BULK_DISCOUNT.percent : 0,
    discountAmount,
    total: subtotal - discountAmount,
    itemsToNextDiscount: Math.max(0, BULK_DISCOUNT.minQty - totalQty),
  };
}
