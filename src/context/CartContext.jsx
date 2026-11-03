import { createContext, useContext, useEffect, useRef, useState, useMemo } from "react";
import { SIZES, computeCartTotals } from "../data/categories.js";

const CartContext = createContext(null);
const STORAGE_KEY = "xposters_cart";

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart);
  const [isDrawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // `size` is one of the entries from src/data/sizes.js ({slug, label, price}).
  // Falls back to the smallest size if none is given, so any call site that
  // doesn't pass one explicitly still works.
  // `product.split` (2 or 3) means one poster printed as that many side-by-side
  // panels: it's its own cart line, priced per panel, and `qty` counts panels.
  function addToCart(product, qty = 1, size) {
    const chosenSize = size || SIZES[0];
    const split = product.split || 0;
    setItems((prev) => {
      const key = `${product.id}-${chosenSize.slug}${split ? `-split${split}` : ""}`;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i));
      }
      return [
        ...prev,
        {
          key,
          id: product.id,
          name: product.name,
          image: product.image,
          category: product.category,
          size: chosenSize.slug,
          sizeLabel: chosenSize.label,
          price: chosenSize.price,
          qty,
          ...(product.custom ? { custom: product.custom } : {}),
          ...(split ? { split } : {}),
        },
      ];
    });
    setDrawerOpen(true);
  }

  // A whole wall in one go: every poster (split ones as their panels), then
  // the cart opens once.
  function addManyToCart(entries) {
    setItems((prev) => {
      let next = prev;
      for (const { product, size } of entries) {
        const split = product.split || 0;
        const qty = split || 1;
        const key = `${product.id}-${size.slug}${split ? `-split${split}` : ""}`;
        const existing = next.find((i) => i.key === key);
        next = existing
          ? next.map((i) => (i.key === key ? { ...i, qty: i.qty + qty } : i))
          : [
              ...next,
              {
                key,
                id: product.id,
                name: product.name,
                image: product.image,
                category: product.category,
                size: size.slug,
                sizeLabel: size.label,
                price: size.price,
                qty,
                ...(product.custom ? { custom: product.custom } : {}),
                ...(split ? { split } : {}),
              },
            ];
      }
      return next;
    });
    setDrawerOpen(true);
  }

  function updateQty(key, qty) {
    if (qty <= 0) {
      removeFromCart(key);
      return;
    }
    setItems((prev) => prev.map((i) => (i.key === key ? { ...i, qty } : i)));
  }

  function removeFromCart(key) {
    setItems((prev) => prev.filter((i) => i.key !== key));
  }

  function clearCart() {
    setItems([]);
  }

  // Also carries the deals (Buy 2 Get 1, or pack deals + the 3+ bundle
  // discount, whichever saves more) - see computeCartTotals in
  // data/categories.js. The backend recomputes this
  // itself when the order is actually placed (never trusts these numbers
  // from the frontend), so this is purely a live preview for the cart and
  // checkout UI.
  const totals = useMemo(() => computeCartTotals(items), [items]);

  // A deal just kicked in (or a bigger one) - DealCelebration plays the
  // supercar + confetti show for it. Compared against the previous cart, so
  // a cart restored from storage on page load never triggers it, and
  // removing posters never does either.
  const [celebration, setCelebration] = useState(null);
  const prevDeal = useRef({ saving: totals.saving, unlocks: dealUnlocks(totals), dealType: totals.dealType });
  useEffect(() => {
    const prev = prevDeal.current;
    const unlocks = dealUnlocks(totals);
    if (totals.saving > prev.saving && (unlocks > prev.unlocks || totals.dealType !== prev.dealType)) {
      setCelebration({ id: Date.now(), dealType: totals.dealType, saving: totals.saving, freeCount: totals.b2g1FreeCount });
    }
    prevDeal.current = { saving: totals.saving, unlocks, dealType: totals.dealType };
  }, [totals]);

  const value = {
    items,
    addToCart,
    addManyToCart,
    updateQty,
    removeFromCart,
    clearCart,
    itemCount: totals.totalQty,
    subtotal: totals.subtotal,
    discountEligible: totals.discountEligible,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    packDeals: totals.packDeals,
    packDealAmount: totals.packDealAmount,
    dealType: totals.dealType,
    saving: totals.saving,
    b2g1Amount: totals.b2g1Amount,
    b2g1FreeCount: totals.b2g1FreeCount,
    b2g1ToNext: totals.b2g1ToNext,
    freeByKey: totals.freeByKey,
    celebration,
    clearCelebration: () => setCelebration(null),
    otherQty: totals.otherQty,
    total: totals.total,
    itemsToNextDiscount: totals.itemsToNextDiscount,
    isDrawerOpen,
    setDrawerOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// How many separate deal "steps" the cart has reached - free posters for Buy
// 2 Get 1, otherwise full packs plus the bundle discount.
function dealUnlocks(t) {
  if (t.dealType === "b2g1") return t.b2g1FreeCount;
  return t.packDeals.reduce((sum, d) => sum + d.packs, 0) + (t.discountEligible ? 1 : 0);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
