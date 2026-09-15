import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { placeOrder } from "../api/orders.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

export default function Checkout() {
  const { items, subtotal } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);

  if (items.length === 0) {
    return <Navigate to="/" replace />;
  }

  function validate() {
    const next = {};
    if (!form.name.trim()) next.name = "Enter your name.";
    if (!EMAIL_RE.test(form.email.trim())) next.email = "Enter a valid email address.";
    if (!PHONE_RE.test(form.phone.trim())) next.phone = "Enter a 10-digit phone number.";
    if (!form.address.trim()) next.address = "Enter a delivery address.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    const orderItems = items.map((item) => ({
      product: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      qty: item.qty,
    }));

    // PAYMENT GATEWAY INTEGRATION POINT:
    // A real payment gateway (Razorpay, Stripe, etc.) would be called here,
    // before the order is confirmed. For now this just saves the order to
    // the database as "placed" with no payment actually processed.
    try {
      const { orderId } = await placeOrder({ customer: form, items: orderItems, subtotal });
      // The cart is cleared by OrderSuccess itself once it has mounted on
      // the new route — not here. Clearing it in the same tick as
      // navigate() caused CartDrawer (mounted globally on every page) to
      // re-render mid-transition and occasionally land back on "/" instead
      // of the order-success page.
      navigate("/order-success", { state: { orderId } });
    } catch {
      setServerError("Couldn't place your order right now — please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 py-14">
      <h1 className="font-display text-4xl sm:text-5xl">Checkout</h1>

      <div className="mt-10 grid gap-10 md:grid-cols-[1.2fr_1fr]">
        <form onSubmit={handlePlaceOrder} noValidate className="space-y-5">
          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
            {errors.name && <p className="mt-1 text-xs text-white/70">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
            {errors.email && <p className="mt-1 text-xs text-white/70">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="phone">
              Phone (10 digits)
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              className="w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
            {errors.phone && <p className="mt-1 text-xs text-white/70">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/40" htmlFor="address">
              Delivery address
            </label>
            <textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="w-full resize-none border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]"
            />
            {errors.address && <p className="mt-1 text-xs text-white/70">{errors.address}</p>}
          </div>

          {serverError && <p className="text-xs text-white/70">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-sm font-medium"
          >
            {submitting ? "Placing order…" : "Place order"}
          </button>
        </form>

        <aside className="h-fit border border-[var(--xp-border)] p-6">
          <p className="mb-4 text-sm text-white/40">Order summary</p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between text-sm">
                <span className="text-white/70">
                  {item.name} × {item.qty}
                </span>
                <span>₹{item.qty * item.price}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-[var(--xp-border)] pt-4 text-base">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <Link to="/" className="mt-4 block text-center text-xs text-white/40 underline-offset-2 hover:text-white hover:underline">
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
