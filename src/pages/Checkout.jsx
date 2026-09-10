import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;

function generateOrderId() {
  return `XP-${Date.now().toString(36).toUpperCase()}`;
}

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});

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

  function handlePlaceOrder(e) {
    e.preventDefault();
    if (!validate()) return;

    const orderId = generateOrderId();
    const order = {
      orderId,
      customer: form,
      items,
      subtotal,
      placedAt: new Date().toISOString(),
    };

    // No backend yet — this is where a real payment gateway call
    // (Razorpay / Stripe / etc.) would run before confirming the order.
    console.log("XPOSTERS mock order placed:", order);

    clearCart();
    navigate("/order-success", { state: { orderId } });
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
              className="w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-white"
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
              className="w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-white"
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
              className="w-full border border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-white"
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
              className="w-full resize-none border border-white/20 bg-transparent px-3 py-2.5 text-sm outline-none focus:border-white"
            />
            {errors.address && <p className="mt-1 text-xs text-white/70">{errors.address}</p>}
          </div>

          {/* PAYMENT GATEWAY INTEGRATION POINT:
              Once a backend exists, this is where a real payment gateway
              (e.g. Razorpay, Stripe) call would be triggered before the
              order is confirmed, instead of just logging to the console. */}

          <button type="submit" className="w-full bg-white py-3.5 text-sm font-medium text-black transition-opacity hover:opacity-80">
            Place order
          </button>
        </form>

        <aside className="h-fit border border-white/10 p-6">
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
          <div className="mt-5 flex justify-between border-t border-white/10 pt-4 text-base">
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
