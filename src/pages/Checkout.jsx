import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import { placeOrder } from "../api/orders.js";
import { DELIVERY_OPTIONS, INSTANT_FREE_ABOVE, deliveryFeeFor } from "../data/categories.js";
import DealMeter from "../components/DealMeter.jsx";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\d{10}$/;
const FIELD_ORDER = ["name", "email", "phone", "address"];
const INPUT_CLASS =
  "w-full border border-[var(--xp-border-strong)] bg-transparent px-3 py-2.5 text-sm outline-none focus:border-[var(--xp-accent)]";

export default function Checkout() {
  const {
    items,
    subtotal,
    discountEligible,
    discountPercent,
    discountAmount,
    packDeals,
    b2g1Amount,
    b2g1FreeCount,
    saving,
    total,
  } = useCart();
  const [delivery, setDelivery] = useState("standard");
  const deliveryFee = deliveryFeeFor(delivery, total);
  const grandTotal = total + deliveryFee;
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
    if (!form.email.trim()) next.email = "Enter your email address.";
    else if (!EMAIL_RE.test(form.email.trim())) next.email = "Invalid email — use a format like name@example.com.";
    if (!form.phone.trim()) next.phone = "Enter your phone number.";
    else if (!PHONE_RE.test(form.phone.trim())) next.phone = "Invalid phone number — it must be exactly 10 digits.";
    if (!form.address.trim()) next.address = "Enter a delivery address.";
    setErrors(next);
    // Jump to the first problem so it's never hidden below the fold on mobile.
    const firstInvalid = FIELD_ORDER.find((field) => next[field]);
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
    return !firstInvalid;
  }

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    // Clear a field's error as soon as the customer starts fixing it.
    if (errors[field]) setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handlePlaceOrder(e) {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setServerError(null);

    const orderItems = items.map((item) => ({
      // Custom posters have no product record - they carry their hosted
      // image id, pixel size and notes instead.
      ...(item.custom ? item.custom : { product: item.id }),
      name: item.name,
      price: item.price,
      image: item.image,
      size: item.size,
      qty: item.qty,
    }));

    // PAYMENT GATEWAY INTEGRATION POINT:
    // A real payment gateway (Razorpay, Stripe, etc.) would be called here,
    // before the order is confirmed. For now this just saves the order to
    // the database as "placed" with no payment actually processed.
    try {
      const { orderId, subtotal: amountDue } = await placeOrder({
        customer: form,
        items: orderItems,
        deliveryOption: delivery,
      });
      // The cart is cleared by OrderSuccess itself once it has mounted on
      // the new route — not here. Clearing it in the same tick as
      // navigate() caused CartDrawer (mounted globally on every page) to
      // re-render mid-transition and occasionally land back on "/" instead
      // of the order-success page.
      navigate("/order-success", { state: { orderId, amount: amountDue ?? grandTotal, delivery } });
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
            <label className="mb-1 block text-xs text-white/60" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.name && <p id="name-error" className="form-error">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/60" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.email && <p id="email-error" className="form-error">{errors.email}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/60" htmlFor="phone">
              Phone (10 digits)
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => handleChange("phone", e.target.value.replace(/[^\d]/g, "").slice(0, 10))}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              className={INPUT_CLASS}
            />
            {errors.phone && <p id="phone-error" className="form-error">{errors.phone}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs text-white/60" htmlFor="address">
              Delivery address
            </label>
            <textarea
              id="address"
              rows={3}
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
              aria-invalid={Boolean(errors.address)}
              aria-describedby={errors.address ? "address-error" : undefined}
              className={`${INPUT_CLASS} resize-none`}
            />
            {errors.address && <p id="address-error" className="form-error">{errors.address}</p>}
          </div>

          <fieldset>
            <legend className="mb-2 block text-xs text-white/60">Delivery</legend>
            <div className="grid gap-2.5">
              {DELIVERY_OPTIONS.map((opt) => {
                const fee = deliveryFeeFor(opt.slug, total);
                const selected = delivery === opt.slug;
                const instant = opt.slug === "instant";
                return (
                  <label
                    key={opt.slug}
                    className={`relative flex cursor-pointer items-center gap-3 border px-4 py-3.5 transition-all has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--xp-white)] ${
                      selected
                        ? "border-[var(--xp-accent-bright)] bg-[var(--xp-accent)]/10 shadow-[0_0_20px_rgba(201,162,76,0.18)]"
                        : "border-[var(--xp-border-strong)] hover:border-[var(--xp-accent)]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="delivery"
                      value={opt.slug}
                      checked={selected}
                      onChange={() => setDelivery(opt.slug)}
                      className="sr-only"
                    />
                    <span
                      className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${
                        selected ? "border-[var(--xp-accent-bright)]" : "border-[var(--xp-border-strong)]"
                      }`}
                      aria-hidden="true"
                    >
                      {selected && <span className="h-2.5 w-2.5 rounded-full bg-[var(--xp-accent-bright)]" />}
                    </span>
                    <span className="text-xl" aria-hidden="true">{instant ? "⚡" : "🚚"}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium">{opt.label}</span>
                      <span className="block text-xs text-white/60">{opt.eta}</span>
                    </span>
                    <span className={`text-sm font-semibold ${fee === 0 ? "text-[var(--xp-accent-bright)]" : ""}`}>
                      {fee === 0 ? "FREE" : `₹${fee}`}
                    </span>
                  </label>
                );
              })}
            </div>
            {delivery === "instant" && deliveryFee > 0 && (
              <p className="mt-2 text-xs text-[var(--xp-accent-bright)]">
                {total < 200
                  ? `Add ₹${200 - total} more of posters → instant delivery just ₹100. Above ₹${INSTANT_FREE_ABOVE} it's FREE.`
                  : `Add ₹${INSTANT_FREE_ABOVE + 1 - total} more of posters → instant delivery FREE.`}
              </p>
            )}
          </fieldset>

          {serverError && <p role="alert" className="alert-error">{serverError}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full py-3.5 text-sm font-medium"
          >
            {submitting ? "Placing order…" : `Place order · ₹${grandTotal}`}
          </button>
        </form>

        <aside className="h-fit border border-[var(--xp-border)] p-6">
          <p className="mb-4 text-sm text-white/60">Order summary</p>
          <ul className="space-y-3">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between text-sm">
                <span className="text-white/70">
                  {item.name} {item.sizeLabel ? `(${item.sizeLabel}) ` : ""}× {item.qty}
                </span>
                <span>₹{item.qty * item.price}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex justify-between border-t border-[var(--xp-border)] pt-4 text-sm text-white/60">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          {b2g1Amount > 0 && (
            <div className="mt-2 flex justify-between text-sm text-[var(--xp-accent-bright)]">
              <span>Buy 2 Get 1 ({b2g1FreeCount} poster{b2g1FreeCount === 1 ? "" : "s"} free)</span>
              <span>-₹{b2g1Amount}</span>
            </div>
          )}
          {discountEligible && (
            <div className="mt-2 flex justify-between text-sm text-[var(--xp-accent-bright)]">
              <span>Bundle discount ({discountPercent}% off, 3+ posters)</span>
              <span>-₹{discountAmount}</span>
            </div>
          )}
          {packDeals
            .filter((deal) => deal.amount > 0)
            .map((deal) => (
              <div key={deal.size} className="mt-2 flex justify-between text-sm text-[var(--xp-accent-bright)]">
                <span>
                  {deal.label} deal ({deal.qty} {deal.label} posters for ₹{deal.price})
                </span>
                <span>-₹{deal.amount}</span>
              </div>
            ))}
          <div className="mt-2 flex justify-between text-sm text-white/60">
            <span>{delivery === "instant" ? "⚡ Instant delivery (59 min)" : "Delivery (3–5 days)"}</span>
            <span className={deliveryFee === 0 ? "text-[var(--xp-accent-bright)]" : ""}>
              {deliveryFee === 0 ? "FREE" : `₹${deliveryFee}`}
            </span>
          </div>
          <div className="mt-3 flex justify-between border-t border-[var(--xp-border)] pt-3 text-base font-medium">
            <span>Total</span>
            <span>₹{grandTotal}</span>
          </div>
          {saving > 0 && (
            <p className="mt-1 text-right text-xs text-[var(--xp-accent-bright)]">You save ₹{saving} on this order</p>
          )}
          <DealMeter className="mt-4" />
          <Link to="/" className="mt-4 block text-center text-xs text-white/60 underline-offset-2 hover:text-white hover:underline">
            ← Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
