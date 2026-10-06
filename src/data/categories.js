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

// A4 pack deal: every full set of 5 A4 posters costs a flat price instead of
// 5 x the A4 price. A4 posters are NOT part of the 3+ bundle discount - the
// pack deal is their only discount; other sizes still earn the bundle
// discount (counted among themselves). The backend has its own copy and is
// what actually charges; this one just previews it in the cart.
export const A4_DEAL = { size: "a4", qty: 5, price: 375 };

// items - cart items, each with `qty`, `price` and `size` (slug). Returns the
// raw (pre-discount) subtotal plus everything the cart/checkout UI needs to
// show the discounts and nudge shoppers toward them. A known size's price
// always comes from SIZES, so a cart saved before a price change still adds up.
export function computeCartTotals(rawItems) {
  const items = rawItems.map((item) => {
    const size = getSizeBySlug(item.size);
    return size ? { ...item, price: size.price } : item;
  });
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  const a4Qty = items.filter((i) => i.size === A4_DEAL.size).reduce((sum, i) => sum + i.qty, 0);
  const a4Price = (getSizeBySlug(A4_DEAL.size) || {}).price || 0;
  const a4Packs = Math.floor(a4Qty / A4_DEAL.qty);
  const a4DealAmount = Math.max(0, a4Packs * (A4_DEAL.qty * a4Price - A4_DEAL.price));
  const a4ToNextDeal = a4Qty > 0 ? (A4_DEAL.qty - (a4Qty % A4_DEAL.qty)) % A4_DEAL.qty : 0;

  const others = items.filter((i) => i.size !== A4_DEAL.size);
  const otherQty = others.reduce((sum, i) => sum + i.qty, 0);
  const otherSubtotal = others.reduce((sum, i) => sum + i.qty * i.price, 0);
  const discountEligible = otherQty >= BULK_DISCOUNT.minQty;
  const discountAmount = discountEligible ? Math.round(otherSubtotal * (BULK_DISCOUNT.percent / 100)) : 0;

  return {
    totalQty,
    subtotal,
    discountEligible,
    discountPercent: discountEligible ? BULK_DISCOUNT.percent : 0,
    discountAmount,
    a4Qty,
    a4Packs,
    a4DealAmount,
    a4ToNextDeal,
    otherQty,
    total: subtotal - discountAmount - a4DealAmount,
    itemsToNextDiscount: Math.max(0, BULK_DISCOUNT.minQty - otherQty),
  };
}
