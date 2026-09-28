import { createContext, useContext, useEffect, useState, useMemo } from "react";
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
  function addToCart(product, qty = 1, size) {
    const chosenSize = size || SIZES[0];
    setItems((prev) => {
      const key = `${product.id}-${chosenSize.slug}`;
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
        },
      ];
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

  // Also carries the bulk-poster discount (buy 3+, save 23%) - see
  // computeCartTotals in data/categories.js. The backend recomputes this
  // itself when the order is actually placed (never trusts these numbers
  // from the frontend), so this is purely a live preview for the cart and
  // checkout UI.
  const totals = useMemo(() => computeCartTotals(items), [items]);

  const value = {
    items,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    itemCount: totals.totalQty,
    subtotal: totals.subtotal,
    discountEligible: totals.discountEligible,
    discountPercent: totals.discountPercent,
    discountAmount: totals.discountAmount,
    total: totals.total,
    itemsToNextDiscount: totals.itemsToNextDiscount,
    isDrawerOpen,
    setDrawerOpen,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
