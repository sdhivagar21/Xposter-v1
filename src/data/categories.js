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

// Catchy headings used on the homepage rows and in the menu.
export const CATEGORY_TITLES = {
  "tamil-movies": "Kollywood Mass",
  "english-movies": "Hollywood Hits",
  "cars-bikes": "Garage Goals",
  "marvel-dc": "Superhero HQ",
  anime: "Anime Alley",
  cartoon: "Toon Town",
  motivational: "Grind Mode",
  sports: "Game Day",
  "split-posters": "Split & Stack",
  "customizable-posters": "Your Photo, Our Print",
};

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

// Pack deals: every full set of `qty` posters of one size costs a flat price
// instead of qty x that size's price (5 A4 for Rs 375, 5 A5 for Rs 225).
// Posters in a deal size are NOT part of the 3+ bundle discount - the pack
// deal is their only discount; other sizes still earn the bundle discount
// (counted among themselves). The backend has its own copy and is what
// actually charges; this one just previews it in the cart.
export const PACK_DEALS = [
  { size: "a4", qty: 5, price: 375 },
  { size: "a5", qty: 5, price: 225 },
];

// Money saved per full pack of a deal, e.g. A4: 5 x 95 - 375 = 100.
export function packSaving(deal) {
  const unit = (getSizeBySlug(deal.size) || {}).price || 0;
  return Math.max(0, deal.qty * unit - deal.price);
}

// Buy 2 Get 1: in every group of 3 posters the most affordable one is free. The
// cart's posters are lined up from most to least expensive and every 3rd one
// is free. The backend has its own copy and is what actually charges.
export const BUY2GET1 = { groupSize: 3 };

// Returns the saving, how many posters are free, and which cart lines they
// are ({ [item.key]: freeUnits }) so the cart can tag them "FREE".
export function computeBuy2Get1(items) {
  const units = [];
  items.forEach((item, index) => {
    for (let n = 0; n < item.qty; n += 1) units.push({ key: item.key, price: item.price, index });
  });
  // Most expensive first; among equal prices the later-added poster is free.
  units.sort((a, b) => b.price - a.price || a.index - b.index);
  let amount = 0;
  let freeCount = 0;
  const freeByKey = {};
  for (let i = BUY2GET1.groupSize - 1; i < units.length; i += BUY2GET1.groupSize) {
    amount += units[i].price;
    freeCount += 1;
    freeByKey[units[i].key] = (freeByKey[units[i].key] || 0) + 1;
  }
  const rest = units.length % BUY2GET1.groupSize;
  return { amount, freeCount, freeByKey, toNext: rest === 0 ? BUY2GET1.groupSize : BUY2GET1.groupSize - rest };
}

// Delivery: free across Tamil Nadu in 3-5 days, or instant - within 59 minutes
// anywhere in Chennai - for a fee that depends on the posters' total after
// discounts. Must stay in sync with the backend's src/data/categories.js,
// which is what actually charges it.
export const DELIVERY_OPTIONS = [
  { slug: "standard", label: "Free delivery", eta: "3–5 days · all over Tamil Nadu" },
  { slug: "instant", label: "Instant delivery", eta: "59 min · anywhere in Chennai" },
];
export const INSTANT_FREE_ABOVE = 300;

export function instantDeliveryFee(itemsTotal) {
  if (itemsTotal > INSTANT_FREE_ABOVE) return 0;
  if (itemsTotal >= 200) return 100;
  return 150;
}

export function deliveryFeeFor(option, itemsTotal) {
  return option === "instant" ? instantDeliveryFee(itemsTotal) : 0;
}

// items - cart items, each with `qty`, `price` and `size` (slug). Works out
// both kinds of deal - Buy 2 Get 1, and the pack deals + bundle discount
// together - and applies whichever saves the customer more (never both),
// exactly like the backend does. Also returns everything the cart/checkout
// UI needs to nudge shoppers toward the next deal. A known size's price
// always comes from SIZES, so a cart saved before a price change still adds up.
export function computeCartTotals(rawItems) {
  const items = rawItems.map((item) => {
    const size = getSizeBySlug(item.size);
    return size ? { ...item, price: size.price } : item;
  });
  const totalQty = items.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);

  // One entry per pack deal that has at least one poster in the cart.
  const packDeals = [];
  let packDealAmount = 0;
  for (const deal of PACK_DEALS) {
    const qty = items.filter((i) => i.size === deal.size).reduce((sum, i) => sum + i.qty, 0);
    if (qty === 0) continue;
    const packs = Math.floor(qty / deal.qty);
    const amount = packs * packSaving(deal);
    packDealAmount += amount;
    packDeals.push({
      ...deal,
      label: (getSizeBySlug(deal.size) || {}).label || deal.size.toUpperCase(),
      packs,
      amount,
      toNext: (deal.qty - (qty % deal.qty)) % deal.qty,
    });
  }

  const dealSizes = PACK_DEALS.map((d) => d.size);
  const others = items.filter((i) => !dealSizes.includes(i.size));
  const otherQty = others.reduce((sum, i) => sum + i.qty, 0);
  const otherSubtotal = others.reduce((sum, i) => sum + i.qty * i.price, 0);
  const bulkEligible = otherQty >= BULK_DISCOUNT.minQty;
  const bulkAmount = bulkEligible ? Math.round(otherSubtotal * (BULK_DISCOUNT.percent / 100)) : 0;
  const comboAmount = bulkAmount + packDealAmount;

  const b2g1 = computeBuy2Get1(items);
  const useB2g1 = b2g1.amount > comboAmount;
  const dealType = useB2g1 ? "b2g1" : comboAmount > 0 ? "combo" : "";
  const saving = useB2g1 ? b2g1.amount : comboAmount;

  return {
    totalQty,
    subtotal,
    dealType,
    saving,
    // Only the deal that won is filled in; the other's amounts are 0.
    discountEligible: !useB2g1 && bulkEligible,
    discountPercent: !useB2g1 && bulkEligible ? BULK_DISCOUNT.percent : 0,
    discountAmount: useB2g1 ? 0 : bulkAmount,
    packDeals: packDeals.map((d) => (useB2g1 ? { ...d, amount: 0 } : d)),
    packDealAmount: useB2g1 ? 0 : packDealAmount,
    b2g1Amount: useB2g1 ? b2g1.amount : 0,
    b2g1FreeCount: useB2g1 ? b2g1.freeCount : 0,
    freeByKey: useB2g1 ? b2g1.freeByKey : {},
    b2g1ToNext: b2g1.toNext,
    otherQty,
    total: subtotal - saving,
    itemsToNextDiscount: Math.max(0, BULK_DISCOUNT.minQty - otherQty),
  };
}
