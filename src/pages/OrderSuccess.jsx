import { useEffect } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useCart } from "../context/CartContext.jsx";

// UPI payment details (set on Vercel: VITE_UPI_ID, optionally VITE_UPI_NAME).
// With no VITE_UPI_ID the pay-by-QR block simply stays hidden.
const UPI_ID = import.meta.env.VITE_UPI_ID || "";
const UPI_NAME = import.meta.env.VITE_UPI_NAME || "XPOSTERS";

export default function OrderSuccess() {
  const location = useLocation();
  const orderId = location.state?.orderId;
  const amount = Number(location.state?.amount) || 0;
  // Standard UPI payment link: GPay, PhonePe, Paytm etc. all read it, and
  // the amount + order id come pre-filled so the customer only has to confirm.
  const upiLink =
    UPI_ID && amount > 0
      ? `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}` +
        `&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(orderId || "XPOSTERS order")}`
      : "";
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
        Thanks — your order has been received.
        {upiLink ? " Pay with GPay (or any UPI app) below to confirm it." : ""}
      </p>
      <p className="mt-6 border border-[var(--xp-accent)]/40 px-5 py-3 font-display text-lg tracking-wide text-[var(--xp-accent)]">
        {orderId}
      </p>
      {upiLink && (
        <div className="mt-8 w-full max-w-xs border border-[var(--xp-border)] p-6">
          <p className="font-display text-2xl text-[var(--xp-accent)]">Pay ₹{amount}</p>
          <div className="mx-auto mt-4 w-fit rounded bg-white p-3">
            <QRCodeSVG value={upiLink} size={180} level="M" />
          </div>
          <p className="mt-3 text-xs text-white/50">Scan with GPay, PhonePe or Paytm</p>
          <a href={upiLink} className="btn-primary mt-5 block py-3 text-sm font-medium sm:hidden">
            Pay with GPay / UPI app
          </a>
          <p className="mt-4 text-xs text-white/40">
            UPI ID: {UPI_ID}
            <br />
            Keep the order ID {orderId} as the payment note. We confirm your order once the payment reaches us.
          </p>
        </div>
      )}
      <Link
        to="/"
        className="btn-primary mt-10 px-8 py-3 text-sm font-medium"
      >
        Continue shopping
      </Link>
    </div>
  );
}
