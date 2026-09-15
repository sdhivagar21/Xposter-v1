import { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

export default function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const { clearCart } = useCart();

  // Cleared here (once this page has actually mounted on its own route),
  // not from Checkout right before navigating away — doing it there raced
  // with the navigation itself. See Checkout.jsx for details.
  useEffect(() => {
    if (orderId) clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (!orderId) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-5 py-20 text-center">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-[var(--xp-accent)] text-2xl text-[var(--xp-accent)]">
        ✓
      </div>
      <h1 className="mt-6 font-display text-4xl sm:text-5xl">Order placed</h1>
      <p className="mt-4 text-white/60">
        Thanks — your order has been received. This is a mock confirmation; no payment was charged.
      </p>
      <p className="mt-6 border border-[var(--xp-accent)]/40 px-5 py-3 font-display text-lg tracking-wide text-[var(--xp-accent)]">
        {orderId}
      </p>
      <Link
        to="/"
        className="btn-primary mt-10 px-8 py-3 text-sm font-medium"
      >
        Continue shopping
      </Link>
    </div>
  );
}
