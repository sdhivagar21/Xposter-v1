import { createContext, useContext, useEffect, useState, useMemo } from "react";
import { SIZES } from "../data/categories.js";

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

  // `size` is one of the entries from src/data/categories.js ({slug, label, price}).
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

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.qty, 0), [items]);
  const subtotal = useMemo(() => items.reduce((sum, i) => sum + i.qty * i.price, 0), [items]);

  const value = {
    items,
    addToCart,
    updateQty,
    removeFromCart,
    clearCart,
    itemCount,
    subtotal,
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
